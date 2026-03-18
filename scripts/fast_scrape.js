/**
 * FAST BUSINESS WEBSITE SCRAPER v2
 * 
 * Scrapes business websites at high concurrency to extract:
 *   1. Meta description → overwrites existing description (real SEO value)
 *   2. Logo URL → saves to logo_url (only if currently empty)
 *   3. Email → saves to business_email (only if currently empty)
 *   4. Phone → saves to business_phone (only if currently empty)
 * 
 * Tracking: Sets per-field boolean flags in DB so we always know what was
 * successfully scraped vs what failed. Columns:
 *   scraped_description, scraped_logo, scraped_email, scraped_phone, website_scraped_at
 * 
 * Features:
 *   - 50 concurrent connections (configurable)
 *   - 12s hard timeout per site (Promise.race)
 *   - SSL retry + HTTP fallback
 *   - Social media URLs auto-skipped
 *   - Per-business logging with timestamps
 *   - Progress every 50 businesses
 *   - Skips businesses already fully scraped (all 4 flags true)
 * 
 * Usage:
 *   node scripts/fast_scrape.js                    # full run
 *   node scripts/fast_scrape.js --limit 10         # test batch
 *   node scripts/fast_scrape.js --reset            # reset all flags and re-scrape everything
 *   node scripts/fast_scrape.js --force             # ignore scraped flags, re-scrape all
 */

const { Pool } = require('pg');
const https = require('https');
const http = require('http');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', 'apps', 'web', '.env.local') });

// ── Config ──
const CONCURRENCY = 50;
const HARD_TIMEOUT_MS = 12000;
const SOFT_TIMEOUT_MS = 8000;
const MIN_DESC_LENGTH = 20;
const MAX_DESC_LENGTH = 500;

const args = process.argv.slice(2);
const limitIdx = args.indexOf('--limit');
const LIMIT = limitIdx !== -1 ? parseInt(args[limitIdx + 1]) : null;
const FORCE = args.includes('--force');
const RESET = args.includes('--reset');

const SOCIAL_DOMAINS = /\/\/(www\.)?(facebook\.com|instagram\.com|twitter\.com|x\.com|linkedin\.com|youtube\.com|tiktok\.com|m\.facebook\.com)/i;

const db = new Pool({ connectionString: process.env.DATABASE_URL, max: 10 });

// ── Logging ──
const LOG_FILE = path.join(__dirname, 'fast_scrape.log');
const logStream = fs.createWriteStream(LOG_FILE, { flags: 'a' });
function log(msg) {
    const ts = new Date().toISOString().slice(11, 19);
    const line = `[${ts}] ${msg}`;
    console.log(line);
    logStream.write(line + '\n');
}

// ── Stats ──
const stats = { processed: 0, desc: 0, logos: 0, emails: 0, phones: 0, errors: 0, skipped: 0, startTime: Date.now() };

function printProgress() {
    const elapsed = ((Date.now() - stats.startTime) / 1000).toFixed(0);
    const rate = stats.processed > 0 ? (stats.processed / (elapsed / 60)).toFixed(0) : 0;
    log(`📊 ${stats.processed} done | Desc: ${stats.desc} | Logo: ${stats.logos} | Email: ${stats.emails} | Phone: ${stats.phones} | Err: ${stats.errors} | Skip: ${stats.skipped} | ${elapsed}s | ${rate}/min`);
}

// ── Fetch headers ──
const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-AU,en;q=0.9',
};

// ── HTTP fetch with redirect following ──
function fetchUrl(url, insecure = false, redirects = 0) {
    if (redirects > 5) return Promise.resolve({ error: 'Too many redirects' });
    return new Promise((resolve) => {
        let parsed;
        try { parsed = new URL(url); } catch { return resolve({ error: 'Bad URL' }); }
        const isHttps = parsed.protocol === 'https:';
        const lib = isHttps ? https : http;
        const opts = {
            hostname: parsed.hostname,
            port: parsed.port || (isHttps ? 443 : 80),
            path: parsed.pathname + parsed.search,
            method: 'GET',
            headers: HEADERS,
            timeout: SOFT_TIMEOUT_MS,
            maxHeaderSize: 32768,
        };
        if (isHttps && insecure) opts.rejectUnauthorized = false;
        let done = false;
        const finish = (r) => { if (!done) { done = true; resolve(r); } };

        const req = lib.request(opts, (res) => {
            if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
                res.destroy();
                try {
                    fetchUrl(new URL(res.headers.location, url).href, insecure, redirects + 1).then(finish);
                } catch { finish({ error: 'Bad redirect' }); }
                return;
            }
            if (res.statusCode >= 400) { res.destroy(); return finish({ error: `HTTP ${res.statusCode}` }); }
            const ct = res.headers['content-type'] || '';
            if (!ct.includes('text/html') && !ct.includes('application/xhtml')) {
                res.destroy(); return finish({ error: `Non-HTML: ${ct.slice(0, 40)}` });
            }
            const chunks = [];
            let size = 0;
            res.on('data', (c) => {
                size += c.length;
                chunks.push(c);
                if (size > 200000) { finish({ html: Buffer.concat(chunks).toString('utf-8', 0, 150000) }); res.destroy(); }
            });
            res.on('end', () => finish({ html: Buffer.concat(chunks).toString('utf-8', 0, 150000) }));
            res.on('error', () => finish({ error: 'Read error' }));
            res.on('close', () => finish(chunks.length ? { html: Buffer.concat(chunks).toString('utf-8', 0, 150000) } : { error: 'Connection closed' }));
        });
        req.on('timeout', () => { req.destroy(); finish({ error: 'Timeout' }); });
        req.on('error', (e) => {
            const ssl = /certificate|ssl|tls|CERT|HANDSHAKE|self.signed/i.test(e.message);
            finish({ error: e.message, sslError: ssl });
        });
        req.end();
    });
}

async function fetchPage(url) {
    if (!url.startsWith('http')) url = 'https://' + url;

    const hardTimeout = new Promise(r => setTimeout(() => r({ error: 'Hard timeout (12s)' }), HARD_TIMEOUT_MS));

    const inner = async () => {
        let result = await fetchUrl(url, false);
        if (result.sslError) {
            result = await fetchUrl(url, true);
            if (result.error) result = await fetchUrl(url.replace(/^https:/, 'http:'), false);
        }
        return result;
    };

    return Promise.race([inner(), hardTimeout]);
}

// ── Extractors ──
function extractDesc(html) {
    const patterns = [
        /<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i,
        /<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i,
        /<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i,
        /<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:description["']/i,
    ];
    for (const p of patterns) {
        const m = html.match(p);
        if (m && m[1]) {
            let d = m[1].trim().replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, ' ');
            if (d.length >= MIN_DESC_LENGTH) return d.length > MAX_DESC_LENGTH ? d.slice(0, MAX_DESC_LENGTH) + '...' : d;
        }
    }
    return null;
}

const LOGO_PATTERNS = [
    /<img[^>]*(?:class|id)=["'][^"']*logo[^"']*["'][^>]*src=["']([^"']+)["']/gi,
    /<img[^>]*src=["']([^"']+)["'][^>]*(?:class|id)=["'][^"']*logo[^"']*["']/gi,
    /<img[^>]*alt=["'][^"']*logo[^"']*["'][^>]*src=["']([^"']+)["']/gi,
    /<img[^>]*src=["']([^"']+)["'][^>]*alt=["'][^"']*logo[^"']*["']/gi,
    /<img[^>]*src=["']([^"']*logo[^"']*\.(?:png|jpg|jpeg|svg|webp))["']/gi,
    /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/gi,
    /<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/gi,
    /<link[^>]*rel=["'](?:icon|apple-touch-icon|shortcut icon)["'][^>]*href=["']([^"']+)["']/gi,
    /<header[^>]*>[\s\S]*?<img[^>]*src=["']([^"']+)["']/gi,
];
const LOGO_BL = [/google/i,/facebook/i,/twitter/i,/instagram/i,/youtube/i,/pixel/i,/tracking/i,/analytics/i,/1x1/i,/spacer/i,/wp-emoji/i,/gravatar/i,/placeholder/i,/data:image/i,/badge/i,/icon-/i,/star/i,/rating/i,/review/i];

function resolveUrl(base, rel) {
    if (!rel) return null;
    if (rel.startsWith('//')) return 'https:' + rel;
    if (rel.startsWith('http')) return rel;
    try { return new URL(rel, base).href; } catch { return null; }
}

function extractLogo(html, base) {
    for (const p of LOGO_PATTERNS) {
        p.lastIndex = 0;
        let m;
        while ((m = p.exec(html)) !== null) {
            const url = resolveUrl(base, m[1]);
            if (url && url.length > 10 && url.length < 500 && !LOGO_BL.some(bl => bl.test(url))) return url;
        }
    }
    return null;
}

const EMAIL_RE = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
const EMAIL_BL = [/example\.com/i,/test\.com/i,/sentry\.io/i,/wixpress/i,/wordpress/i,/squarespace/i,/googleapis/i,/cloudflare/i,/webpack/i,/schema\.org/i,/noreply/i,/no-reply/i,/mailer-daemon/i,/yourdomain/i,/company\.com/i,/domain\.com/i];

function extractEmail(html) {
    const matches = html.match(EMAIL_RE) || [];
    for (const e of [...new Set(matches.map(x => x.toLowerCase()))]) {
        if (e.length > 80) continue;
        if (/\.(png|jpg|jpeg|gif|svg|webp|ico|css|js|php|html|pdf|zip|map)$/i.test(e)) continue;
        if (/@\d/.test(e)) continue;
        if (EMAIL_BL.some(bl => bl.test(e))) continue;
        return e;
    }
    return null;
}

const AU_PHONE = [
    /(?:(?:\+?61\s?|0)4\d{2}[\s\-.]?\d{3}[\s\-.]?\d{3})/g,
    /(?:\(?0[2-9]\)?[\s\-.]?\d{4}[\s\-.]?\d{4})/g,
    /(?:1[38]00[\s\-.]?\d{3}[\s\-.]?\d{3})/g,
];
const PHONE_BL = [/000\s?000/,/1234/,/0000/];

function extractPhone(html) {
    // tel: hrefs first
    const telRe = /href=["']tel:([^"']+)["']/gi;
    let tm;
    while ((tm = telRe.exec(html)) !== null) {
        let n = tm[1].replace(/[\s\-.()+]/g, '');
        if (n.startsWith('61')) n = '0' + n.slice(2);
        if (n.length >= 10 && n.length <= 12 && /^0[2-9]/.test(n) && !PHONE_BL.some(b => b.test(n))) return n;
    }
    // Fallback: visible text
    const text = html.replace(/<[^>]+>/g, ' ');
    for (const p of AU_PHONE) {
        p.lastIndex = 0;
        let m;
        while ((m = p.exec(text)) !== null) {
            let n = m[0].replace(/[\s\-.()]/g, '');
            if (n.startsWith('+61')) n = '0' + n.slice(3);
            if (n.startsWith('61')) n = '0' + n.slice(2);
            if (n.length >= 10 && n.length <= 12 && !PHONE_BL.some(b => b.test(n))) return n;
        }
    }
    return null;
}

// ── Process one business ──
async function processBiz(biz) {
    if (SOCIAL_DOMAINS.test(biz.website)) {
        await db.query(`UPDATE businesses SET website_scraped = true, website_scraped_at = now() WHERE id = $1`, [biz.id]);
        stats.skipped++;
        return;
    }

    const res = await fetchPage(biz.website);
    if (res.error) {
        log(`  ❌ ${biz.business_name} | ${biz.website} | ${res.error}`);
        await db.query(`UPDATE businesses SET website_scraped = true, website_scraped_at = now() WHERE id = $1`, [biz.id]);
        stats.errors++;
        return;
    }

    const html = res.html;
    const desc = extractDesc(html);
    const logo = biz.has_logo ? null : extractLogo(html, biz.website);
    const email = biz.has_email ? null : extractEmail(html);
    const phone = biz.has_phone ? null : extractPhone(html);

    const sets = ['website_scraped = true', 'website_scraped_at = now()'];
    const params = [];
    let idx = 1;

    if (desc) {
        sets.push(`description = $${idx++}`);
        params.push(desc);
        sets.push('scraped_description = true');
        stats.desc++;
    }
    if (logo) {
        sets.push(`logo_url = $${idx++}`);
        params.push(logo);
        sets.push('scraped_logo = true');
        stats.logos++;
    }
    if (email) {
        sets.push(`business_email = $${idx++}`);
        params.push(email);
        sets.push('scraped_email = true');
        stats.emails++;
    }
    if (phone) {
        sets.push(`business_phone = COALESCE(business_phone, $${idx++})`);
        params.push(phone);
        sets.push('scraped_phone = true');
        stats.phones++;
    }

    params.push(biz.id);
    await db.query(`UPDATE businesses SET ${sets.join(', ')} WHERE id = $${idx}`, params);

    const found = [desc && 'DESC', logo && 'LOGO', email && 'EMAIL', phone && 'PHONE'].filter(Boolean);
    if (found.length) log(`  ✅ ${biz.business_name} → ${found.join(', ')}`);

    stats.processed++;
}

// ── Main ──
async function main() {
    log('=== FAST SCRAPE v2 ===');
    log(`Concurrency: ${CONCURRENCY} | Hard timeout: ${HARD_TIMEOUT_MS}ms | Limit: ${LIMIT || 'ALL'} | Force: ${FORCE}`);

    if (RESET) {
        log('Resetting all scrape flags...');
        await db.query(`UPDATE businesses SET website_scraped = false, scraped_description = false, scraped_logo = false, scraped_email = false, scraped_phone = false, website_scraped_at = NULL WHERE status = 'active'`);
        log('Done resetting.');
    }

    // Build query — skip fully scraped unless --force
    let where = `status = 'active' AND website IS NOT NULL AND website != ''`;
    if (!FORCE) {
        where += ` AND (website_scraped IS NOT TRUE)`;
    }
    const limitClause = LIMIT ? `LIMIT ${LIMIT}` : '';

    const { rows: businesses } = await db.query(`
        SELECT id, business_name, website,
               (logo_url IS NOT NULL AND logo_url != '') as has_logo,
               (business_email IS NOT NULL AND business_email != '') as has_email,
               (business_phone IS NOT NULL AND business_phone != '') as has_phone
        FROM businesses
        WHERE ${where}
        ORDER BY total_reviews DESC NULLS LAST
        ${limitClause}
    `);

    log(`Found ${businesses.length} businesses to scrape`);
    if (!businesses.length) { await db.end(); return; }

    stats.startTime = Date.now();

    // Process in batches of CONCURRENCY
    for (let i = 0; i < businesses.length; i += CONCURRENCY) {
        const batch = businesses.slice(i, i + CONCURRENCY);
        await Promise.all(batch.map(b => processBiz(b).catch(e => {
            log(`  💥 ${b.business_name} | CRASH: ${e.message}`);
            stats.errors++;
        })));

        if ((i + CONCURRENCY) % 50 === 0 || i + CONCURRENCY >= businesses.length) {
            printProgress();
        }
    }

    log('=== COMPLETE ===');
    printProgress();

    // Final gaps
    const { rows: [gaps] } = await db.query(`
        SELECT
            COUNT(*) FILTER (WHERE scraped_description) as got_desc,
            COUNT(*) FILTER (WHERE scraped_logo) as got_logo,
            COUNT(*) FILTER (WHERE scraped_email) as got_email,
            COUNT(*) FILTER (WHERE scraped_phone) as got_phone,
            COUNT(*) FILTER (WHERE website_scraped AND NOT scraped_description) as missed_desc,
            COUNT(*) FILTER (WHERE website_scraped AND NOT scraped_logo AND (logo_url IS NULL OR logo_url = '')) as missed_logo,
            COUNT(*) FILTER (WHERE website_scraped AND NOT scraped_email AND (business_email IS NULL OR business_email = '')) as missed_email,
            COUNT(*) FILTER (WHERE website_scraped AND NOT scraped_phone AND (business_phone IS NULL OR business_phone = '')) as missed_phone
        FROM businesses WHERE status = 'active' AND website IS NOT NULL AND website != ''
    `);
    log(`\n=== DB TOTALS ===`);
    log(`Got real description: ${gaps.got_desc} | Missed: ${gaps.missed_desc}`);
    log(`Got logo from site:   ${gaps.got_logo} | Missed: ${gaps.missed_logo}`);
    log(`Got email from site:  ${gaps.got_email} | Missed: ${gaps.missed_email}`);
    log(`Got phone from site:  ${gaps.got_phone} | Missed: ${gaps.missed_phone}`);

    logStream.end();
    await db.end();
}

main().catch(e => { console.error('FATAL:', e); process.exit(1); });
