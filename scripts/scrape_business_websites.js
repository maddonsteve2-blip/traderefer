/**
 * BUSINESS WEBSITE SCRAPER
 * Fetches each business's website homepage and extracts:
 * 1. Meta description → saves to `description` column
 * 2. Logo image URL → saves to `logo_url` column (regex-based detection)
 * 
 * Skips businesses that already have descriptions/logos.
 * Resume-safe: only processes businesses missing data.
 * 
 * Usage:
 *   node scripts/scrape_business_websites.js [--dry-run] [--logos-only] [--desc-only] [--limit 100]
 */

const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', 'apps', 'web', '.env.local') });

// ── Config ──
const CONCURRENCY = 10;        // parallel fetches
const TIMEOUT_MS = 8000;       // 8s per request
const DELAY_BETWEEN_MS = 100;  // small delay to be polite
const MIN_DESC_LENGTH = 20;    // ignore very short meta descriptions
const MAX_DESC_LENGTH = 500;   // truncate overly long ones

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const logosOnly = args.includes('--logos-only');
const descOnly = args.includes('--desc-only');
const limitIdx = args.indexOf('--limit');
const LIMIT = limitIdx !== -1 ? parseInt(args[limitIdx + 1]) : null;

const db = new Pool({ connectionString: process.env.DATABASE_URL, max: 5 });

// ── Logo detection patterns ──
// Regex patterns to find logo URLs in HTML
const LOGO_PATTERNS = [
    // <img> tags with logo in class, id, alt, or src
    /<img[^>]*(?:class|id)=["'][^"']*logo[^"']*["'][^>]*src=["']([^"']+)["']/gi,
    /<img[^>]*src=["']([^"']+)["'][^>]*(?:class|id)=["'][^"']*logo[^"']*["']/gi,
    /<img[^>]*alt=["'][^"']*logo[^"']*["'][^>]*src=["']([^"']+)["']/gi,
    /<img[^>]*src=["']([^"']+)["'][^>]*alt=["'][^"']*logo[^"']*["']/gi,
    // src containing "logo" in the filename/path
    /<img[^>]*src=["']([^"']*logo[^"']*\.(?:png|jpg|jpeg|svg|webp))["']/gi,
    // Open Graph image (often the logo for small businesses)
    /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/gi,
    /<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/gi,
    // Link rel="icon" or rel="apple-touch-icon" (favicon as fallback)
    /<link[^>]*rel=["'](?:icon|apple-touch-icon|shortcut icon)["'][^>]*href=["']([^"']+)["']/gi,
    // CSS background-image on logo elements
    /class=["'][^"']*logo[^"']*["'][^>]*style=["'][^"']*background-image:\s*url\(["']?([^"')]+)["']?\)/gi,
    // Header images (often the logo)
    /<header[^>]*>[\s\S]*?<img[^>]*src=["']([^"']+)["']/gi,
];

// Patterns that indicate it's NOT a real logo
const LOGO_BLACKLIST = [
    /google/i, /facebook/i, /twitter/i, /instagram/i, /youtube/i,
    /pixel/i, /tracking/i, /analytics/i, /1x1/i, /spacer/i,
    /wp-emoji/i, /gravatar/i, /placeholder/i, /data:image/i,
    /badge/i, /icon-/i, /star/i, /rating/i, /review/i,
];

// Image extensions we accept
const VALID_IMG_EXT = /\.(png|jpg|jpeg|svg|webp|gif|ico)(\?|$)/i;

// ── Email extraction patterns ──
// Match emails in mailto: links, visible text, or href attributes
const EMAIL_REGEX = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
const EMAIL_BLACKLIST = [
    /example\.com/i, /test\.com/i, /email\.com/i, /domain\.com/i,
    /sentry\.io/i, /wixpress/i, /wordpress/i, /squarespace/i,
    /googleapis/i, /cloudflare/i, /webpack/i, /schema\.org/i,
    /placeholder/i, /yourdomain/i, /company\.com/i,
    /noreply/i, /no-reply/i, /mailer-daemon/i,
];

function extractEmails(html) {
    const matches = html.match(EMAIL_REGEX) || [];
    const unique = [...new Set(matches.map(e => e.toLowerCase()))];
    return unique.filter(email => {
        if (email.length > 80) return false;
        for (const bl of EMAIL_BLACKLIST) {
            if (bl.test(email)) return false;
        }
        // Prefer business emails, not generic info@ as last resort
        return true;
    });
}

// ── Phone extraction patterns ──
// Australian mobile: 04xx xxx xxx, +614xx xxx xxx
// Australian landline: (0x) xxxx xxxx
const AU_PHONE_PATTERNS = [
    // Mobile: 04xx
    /(?:(?:\+?61\s?|0)4\d{2}[\s\-.]?\d{3}[\s\-.]?\d{3})/g,
    // Landline: (0x) xxxx xxxx
    /(?:\(?0[2-9]\)?[\s\-.]?\d{4}[\s\-.]?\d{4})/g,
    // 1300/1800 numbers
    /(?:1[38]00[\s\-.]?\d{3}[\s\-.]?\d{3})/g,
];

const PHONE_BLACKLIST = [
    /000\s?000/,  // placeholder
    /1234/,       // test number
    /0000/,       // placeholder
];

function extractPhones(html) {
    // First check tel: hrefs (most reliable source)
    const telPattern = /href=["']tel:([^"']+)["']/gi;
    let telMatch;
    while ((telMatch = telPattern.exec(html)) !== null) {
        const raw = telMatch[1].replace(/[\s\-.()+]/g, '');
        let normalized = raw;
        if (normalized.startsWith('61')) normalized = '0' + normalized.slice(2);
        if (normalized.length >= 10 && normalized.length <= 12 && /^0[2-9]/.test(normalized)) {
            let isBlacklisted = false;
            for (const bl of PHONE_BLACKLIST) {
                if (bl.test(normalized)) { isBlacklisted = true; break; }
            }
            if (!isBlacklisted) return [normalized]; // tel: href is most reliable, return immediately
        }
    }

    // Fallback: strip HTML tags and search visible text
    const text = html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ');
    const phones = [];
    for (const pattern of AU_PHONE_PATTERNS) {
        pattern.lastIndex = 0;
        let match;
        while ((match = pattern.exec(text)) !== null) {
            const cleaned = match[0].replace(/[\s\-.()]/g, '');
            // Normalize to standard format
            let normalized = cleaned;
            if (normalized.startsWith('+61')) normalized = '0' + normalized.slice(3);
            if (normalized.startsWith('61')) normalized = '0' + normalized.slice(2);
            if (normalized.length >= 10 && normalized.length <= 12) {
                let isBlacklisted = false;
                for (const bl of PHONE_BLACKLIST) {
                    if (bl.test(normalized)) { isBlacklisted = true; break; }
                }
                if (!isBlacklisted) phones.push(normalized);
            }
        }
    }
    // Return unique, prefer mobile (04xx) first
    const unique = [...new Set(phones)];
    unique.sort((a, b) => {
        const aIsMobile = a.startsWith('04') ? 0 : 1;
        const bIsMobile = b.startsWith('04') ? 0 : 1;
        return aIsMobile - bIsMobile;
    });
    return unique;
}

function isValidLogoUrl(url) {
    if (!url || url.length < 10 || url.length > 500) return false;
    if (!VALID_IMG_EXT.test(url) && !url.includes('logo')) return false;
    for (const bl of LOGO_BLACKLIST) {
        if (bl.test(url)) return false;
    }
    return true;
}

function resolveUrl(base, relative) {
    if (!relative) return null;
    if (relative.startsWith('//')) return 'https:' + relative;
    if (relative.startsWith('http')) return relative;
    if (relative.startsWith('/')) {
        try {
            const u = new URL(base);
            return u.origin + relative;
        } catch { return null; }
    }
    try {
        return new URL(relative, base).href;
    } catch { return null; }
}

function extractLogo(html, baseUrl) {
    // Priority: explicit logo class/id > logo in filename > og:image > header img
    for (const pattern of LOGO_PATTERNS) {
        pattern.lastIndex = 0;
        let match;
        while ((match = pattern.exec(html)) !== null) {
            const url = resolveUrl(baseUrl, match[1]);
            if (url && isValidLogoUrl(url)) {
                return url;
            }
        }
    }
    return null;
}

function extractMetaDescription(html) {
    // Standard meta description
    const patterns = [
        /<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i,
        /<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i,
        // OG description as fallback
        /<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i,
        /<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:description["']/i,
    ];
    for (const p of patterns) {
        const m = html.match(p);
        if (m && m[1]) {
            let desc = m[1].trim()
                .replace(/&amp;/g, '&')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&#39;/g, "'")
                .replace(/&quot;/g, '"')
                .replace(/\s+/g, ' ');
            if (desc.length >= MIN_DESC_LENGTH) {
                return desc.length > MAX_DESC_LENGTH ? desc.substring(0, MAX_DESC_LENGTH) + '...' : desc;
            }
        }
    }
    return null;
}

async function fetchPage(url) {
    try {
        // Normalize URL
        if (!url.startsWith('http')) url = 'https://' + url;

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

        const res = await fetch(url, {
            signal: controller.signal,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml',
                'Accept-Language': 'en-AU,en;q=0.9',
            },
            redirect: 'follow',
        });
        clearTimeout(timeout);

        if (!res.ok) return null;
        const ct = res.headers.get('content-type') || '';
        if (!ct.includes('text/html') && !ct.includes('application/xhtml')) return null;

        const text = await res.text();
        // Only read first 200KB to avoid huge pages
        return text.substring(0, 200_000);
    } catch {
        return null;
    }
}

function delay(ms) {
    return new Promise(r => setTimeout(r, ms));
}

async function processBatch(businesses) {
    const results = { descriptions: 0, logos: 0, emails: 0, phones: 0, errors: 0 };

    const promises = businesses.map(async (biz) => {
        await delay(Math.random() * DELAY_BETWEEN_MS);

        // Skip fields that already exist — only scrape what's missing
        const needDesc = !biz.has_description && !logosOnly;
        const needLogo = !biz.has_logo && !descOnly;
        const needEmail = !biz.has_email;
        const needPhone = !biz.has_phone;

        if (!needDesc && !needLogo && !needEmail && !needPhone) return;

        const html = await fetchPage(biz.website);
        if (!html) {
            results.errors++;
            return;
        }

        const desc = needDesc ? extractMetaDescription(html) : null;
        const logoUrl = needLogo ? extractLogo(html, biz.website) : null;
        const emails = needEmail ? extractEmails(html) : [];
        const phones = needPhone ? extractPhones(html) : [];
        const bestEmail = emails[0] || null;
        const bestPhone = phones[0] || null;

        if (dryRun) {
            if (desc) {
                console.log(`  DESC  [${biz.business_name}]: ${desc.substring(0, 80)}...`);
                results.descriptions++;
            }
            if (logoUrl) {
                console.log(`  LOGO  [${biz.business_name}]: ${logoUrl}`);
                results.logos++;
            }
            if (bestEmail) {
                console.log(`  EMAIL [${biz.business_name}]: ${bestEmail}`);
                results.emails++;
            }
            if (bestPhone) {
                console.log(`  PHONE [${biz.business_name}]: ${bestPhone}`);
                results.phones++;
            }
            return;
        }

        // Update DB — only set fields we actually found AND that are still missing
        const updates = [];
        const params = [];
        let paramIdx = 1;

        if (desc) {
            updates.push(`description = $${paramIdx++}`);
            params.push(desc);
            results.descriptions++;
        }
        if (logoUrl) {
            updates.push(`logo_url = $${paramIdx++}`);
            params.push(logoUrl);
            results.logos++;
        }
        if (bestEmail) {
            updates.push(`business_email = $${paramIdx++}`);
            params.push(bestEmail);
            results.emails++;
        }
        if (bestPhone) {
            updates.push(`business_phone = COALESCE(business_phone, $${paramIdx++})`);
            params.push(bestPhone);
            results.phones++;
        }

        // Always mark as scraped so we don't re-fetch on next run
        updates.push(`website_scraped = true`);

        params.push(biz.id);
        await db.query(
            `UPDATE businesses SET ${updates.join(', ')} WHERE id = $${paramIdx}`,
            params
        );
    });

    await Promise.all(promises);
    return results;
}

async function main() {
    console.log('=== Business Website Scraper ===');
    console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}${logosOnly ? ' (logos only)' : ''}${descOnly ? ' (descriptions only)' : ''}`);
    if (LIMIT) console.log(`Limit: ${LIMIT}`);

    // Find businesses with websites but missing description or logo
    let whereConditions = [`status = 'active'`, `website IS NOT NULL`, `website != ''`, `(website_scraped IS NULL OR website_scraped = false)`];

    if (logosOnly) {
        whereConditions.push(`(logo_url IS NULL OR logo_url = '')`);
    } else if (descOnly) {
        whereConditions.push(`(description IS NULL OR description = '')`);
    } else {
        whereConditions.push(`((description IS NULL OR description = '') OR (logo_url IS NULL OR logo_url = ''))`);
    }

    const limitClause = LIMIT ? `LIMIT ${LIMIT}` : '';
    const query = `
        SELECT id, business_name, website, 
               (description IS NOT NULL AND description != '') as has_description,
               (logo_url IS NOT NULL AND logo_url != '') as has_logo,
               (business_email IS NOT NULL AND business_email != '') as has_email,
               (business_phone IS NOT NULL AND business_phone != '') as has_phone
        FROM businesses 
        WHERE ${whereConditions.join(' AND ')}
        ORDER BY created_at DESC
        ${limitClause}
    `;

    const res = await db.query(query);
    const businesses = res.rows;
    console.log(`Found ${businesses.length} businesses to process\n`);

    if (businesses.length === 0) {
        console.log('Nothing to do!');
        await db.end();
        return;
    }

    let totalDesc = 0, totalLogos = 0, totalEmails = 0, totalPhones = 0, totalErrors = 0, processed = 0;

    // Process in batches
    for (let i = 0; i < businesses.length; i += CONCURRENCY) {
        const batch = businesses.slice(i, i + CONCURRENCY);
        const results = await processBatch(batch);
        totalDesc += results.descriptions;
        totalLogos += results.logos;
        totalEmails += results.emails;
        totalPhones += results.phones;
        totalErrors += results.errors;
        processed += batch.length;

        if (processed % 100 === 0 || i + CONCURRENCY >= businesses.length) {
            console.log(`--- Progress: ${processed}/${businesses.length} | Desc: ${totalDesc} | Logos: ${totalLogos} | Emails: ${totalEmails} | Phones: ${totalPhones} | Errors: ${totalErrors} ---`);
        }
    }

    console.log('\n=== COMPLETE ===');
    console.log(`Processed: ${processed}`);
    console.log(`Descriptions saved: ${totalDesc}`);
    console.log(`Logos saved: ${totalLogos}`);
    console.log(`Emails saved: ${totalEmails}`);
    console.log(`Phones saved: ${totalPhones}`);
    console.log(`Fetch errors: ${totalErrors}`);

    await db.end();
}

main().catch(e => { console.error(e); process.exit(1); });
