#!/usr/bin/env node
/**
 * Google Search Console Data Pull
 * Pulls performance data (queries, pages, indexing) for traderefer.au
 * 
 * Usage: node scripts/gsc_pull.js
 * First run will open a browser for OAuth consent.
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const { google } = require('googleapis');
const { exec } = require('child_process');

const SITE_URL = 'sc-domain:traderefer.au'; // Domain property
const SITE_URL_ALT = 'https://traderefer.au/'; // URL prefix property
const CREDENTIALS_PATH = path.join(__dirname, '..', 'client_secret_643902729199-qn7nntblms4brtb7ddtji1jfpuri1pgh.apps.googleusercontent.com.json');
const TOKEN_PATH = path.join(__dirname, '..', 'gsc_token.json');
const OUTPUT_DIR = path.join(__dirname, '..', 'gsc-data');

const SCOPES = ['https://www.googleapis.com/auth/webmasters.readonly'];

async function authorize() {
    const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
    const { client_id, client_secret } = credentials.web || credentials.installed || {};
    
    if (!client_id || !client_secret) {
        throw new Error('Could not find client_id/client_secret in credentials file');
    }

    const oauth2Client = new google.auth.OAuth2(
        client_id,
        client_secret,
        'http://localhost:3000/oauth2callback'
    );

    // Check for existing token
    if (fs.existsSync(TOKEN_PATH)) {
        const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
        oauth2Client.setCredentials(token);
        
        // Refresh if expired
        if (token.expiry_date && token.expiry_date < Date.now()) {
            console.log('Token expired, refreshing...');
            const { credentials: newCreds } = await oauth2Client.refreshAccessToken();
            oauth2Client.setCredentials(newCreds);
            fs.writeFileSync(TOKEN_PATH, JSON.stringify(newCreds, null, 2));
        }
        
        return oauth2Client;
    }

    // No token — do OAuth flow
    const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
        prompt: 'consent',
    });

    console.log('\n🔐 Opening browser for Google OAuth consent...\n');
    
    const code = await new Promise((resolve, reject) => {
        const server = http.createServer((req, res) => {
            const url = new URL(req.url, 'http://localhost:3000');
            const code = url.searchParams.get('code');
            if (code) {
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end('<h1>✅ Authorized! You can close this tab.</h1><script>window.close()</script>');
                server.close();
                resolve(code);
            } else {
                res.writeHead(400);
                res.end('No code received');
            }
        });
        server.listen(3000, () => {
            console.log('Waiting for OAuth callback on http://localhost:3000 ...');
            exec(`start "" "${authUrl}"`, (err) => {
                if (err) {
                    console.log('\n⚠️  Could not open browser. Please visit this URL manually:\n');
                    console.log(authUrl + '\n');
                }
            });
        });
        setTimeout(() => { server.close(); reject(new Error('OAuth timeout after 120s')); }, 120000);
    });

    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));
    console.log('✅ Token saved to', TOKEN_PATH);
    return oauth2Client;
}

async function detectSiteUrl(searchconsole) {
    // Try domain property first, then URL prefix
    try {
        const sites = await searchconsole.sites.list();
        const siteList = sites.data.siteEntry || [];
        console.log('\n📋 Available sites:', siteList.map(s => s.siteUrl).join(', '));
        
        const domain = siteList.find(s => s.siteUrl === SITE_URL);
        if (domain) return SITE_URL;
        
        const prefix = siteList.find(s => s.siteUrl === SITE_URL_ALT);
        if (prefix) return SITE_URL_ALT;
        
        // Try any traderefer match
        const any = siteList.find(s => s.siteUrl.includes('traderefer'));
        if (any) return any.siteUrl;
        
        throw new Error(`traderefer.au not found in GSC. Available: ${siteList.map(s => s.siteUrl).join(', ')}`);
    } catch (err) {
        console.error('Error listing sites:', err.message);
        throw err;
    }
}

async function pullPerformanceData(searchconsole, siteUrl, startDate, endDate) {
    console.log(`\n📊 Pulling performance data (${startDate} → ${endDate})...`);
    
    // 1. Top queries
    console.log('  → Queries...');
    const queries = await searchconsole.searchanalytics.query({
        siteUrl,
        requestBody: {
            startDate,
            endDate,
            dimensions: ['query'],
            rowLimit: 1000,
            dataState: 'all',
        },
    });

    // 2. Top pages
    console.log('  → Pages...');
    const pages = await searchconsole.searchanalytics.query({
        siteUrl,
        requestBody: {
            startDate,
            endDate,
            dimensions: ['page'],
            rowLimit: 1000,
            dataState: 'all',
        },
    });

    // 3. Queries by page (top 25 pages, top queries per page)
    console.log('  → Queries by page (top 25 pages)...');
    const topPages = (pages.data.rows || []).slice(0, 25);
    const queriesByPage = [];
    for (const pageRow of topPages) {
        try {
            const result = await searchconsole.searchanalytics.query({
                siteUrl,
                requestBody: {
                    startDate,
                    endDate,
                    dimensions: ['query'],
                    dimensionFilterGroups: [{
                        filters: [{ dimension: 'page', expression: pageRow.keys[0] }]
                    }],
                    rowLimit: 50,
                    dataState: 'all',
                },
            });
            queriesByPage.push({
                page: pageRow.keys[0],
                clicks: pageRow.clicks,
                impressions: pageRow.impressions,
                ctr: pageRow.ctr,
                position: pageRow.position,
                queries: (result.data.rows || []).map(r => ({
                    query: r.keys[0],
                    clicks: r.clicks,
                    impressions: r.impressions,
                    ctr: r.ctr,
                    position: r.position,
                })),
            });
        } catch (err) {
            console.warn(`  ⚠ Skipped page: ${pageRow.keys[0]} — ${err.message}`);
        }
    }

    // 4. Device breakdown
    console.log('  → Device breakdown...');
    const devices = await searchconsole.searchanalytics.query({
        siteUrl,
        requestBody: {
            startDate,
            endDate,
            dimensions: ['device'],
            dataState: 'all',
        },
    });

    // 5. Country breakdown
    console.log('  → Country breakdown...');
    const countries = await searchconsole.searchanalytics.query({
        siteUrl,
        requestBody: {
            startDate,
            endDate,
            dimensions: ['country'],
            rowLimit: 25,
            dataState: 'all',
        },
    });

    // 6. Date trend (daily)
    console.log('  → Daily trend...');
    const dateTrend = await searchconsole.searchanalytics.query({
        siteUrl,
        requestBody: {
            startDate,
            endDate,
            dimensions: ['date'],
            dataState: 'all',
        },
    });

    return {
        queries: (queries.data.rows || []).map(r => ({
            query: r.keys[0], clicks: r.clicks, impressions: r.impressions, ctr: r.ctr, position: r.position
        })),
        pages: (pages.data.rows || []).map(r => ({
            page: r.keys[0], clicks: r.clicks, impressions: r.impressions, ctr: r.ctr, position: r.position
        })),
        queriesByPage,
        devices: (devices.data.rows || []).map(r => ({
            device: r.keys[0], clicks: r.clicks, impressions: r.impressions, ctr: r.ctr, position: r.position
        })),
        countries: (countries.data.rows || []).map(r => ({
            country: r.keys[0], clicks: r.clicks, impressions: r.impressions, ctr: r.ctr, position: r.position
        })),
        dateTrend: (dateTrend.data.rows || []).map(r => ({
            date: r.keys[0], clicks: r.clicks, impressions: r.impressions, ctr: r.ctr, position: r.position
        })),
    };
}

async function pullIndexingData(searchconsole, siteUrl) {
    console.log('\n📑 Pulling sitemap data...');
    try {
        const sitemaps = await searchconsole.sitemaps.list({ siteUrl });
        return (sitemaps.data.sitemap || []).map(s => ({
            path: s.path,
            lastSubmitted: s.lastSubmitted,
            lastDownloaded: s.lastDownloaded,
            isPending: s.isPending,
            warnings: s.warnings,
            errors: s.errors,
            contents: s.contents,
        }));
    } catch (err) {
        console.warn('  ⚠ Could not fetch sitemaps:', err.message);
        return [];
    }
}

async function main() {
    const auth = await authorize();
    const searchconsole = google.searchconsole({ version: 'v1', auth });
    
    const siteUrl = await detectSiteUrl(searchconsole);
    console.log(`\n🌐 Using site: ${siteUrl}`);

    // Date ranges
    const today = new Date();
    const d = (date) => date.toISOString().split('T')[0];
    const daysAgo = (n) => { const dt = new Date(today); dt.setDate(dt.getDate() - n); return dt; };
    
    const endDate = d(daysAgo(2)); // GSC data has ~2 day lag
    const startDate28 = d(daysAgo(30));
    const startDate90 = d(daysAgo(92));

    // Pull data
    const perf28 = await pullPerformanceData(searchconsole, siteUrl, startDate28, endDate);
    const perf90 = await pullPerformanceData(searchconsole, siteUrl, startDate90, endDate);
    const sitemaps = await pullIndexingData(searchconsole, siteUrl);

    // Save
    if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    
    const output = {
        pulledAt: new Date().toISOString(),
        siteUrl,
        dateRanges: {
            last28: { start: startDate28, end: endDate },
            last90: { start: startDate90, end: endDate },
        },
        last28Days: perf28,
        last90Days: perf90,
        sitemaps,
        summary: {
            last28: {
                totalClicks: perf28.dateTrend.reduce((s, r) => s + r.clicks, 0),
                totalImpressions: perf28.dateTrend.reduce((s, r) => s + r.impressions, 0),
                avgPosition: perf28.dateTrend.length > 0 ? (perf28.dateTrend.reduce((s, r) => s + r.position, 0) / perf28.dateTrend.length).toFixed(1) : null,
                uniqueQueries: perf28.queries.length,
                uniquePages: perf28.pages.length,
            },
            last90: {
                totalClicks: perf90.dateTrend.reduce((s, r) => s + r.clicks, 0),
                totalImpressions: perf90.dateTrend.reduce((s, r) => s + r.impressions, 0),
                avgPosition: perf90.dateTrend.length > 0 ? (perf90.dateTrend.reduce((s, r) => s + r.position, 0) / perf90.dateTrend.length).toFixed(1) : null,
                uniqueQueries: perf90.queries.length,
                uniquePages: perf90.pages.length,
            },
        },
    };

    const outputPath = path.join(OUTPUT_DIR, `gsc_report_${d(today)}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
    
    console.log(`\n✅ Data saved to ${outputPath}`);
    console.log('\n📈 Summary (last 28 days):');
    console.log(`   Clicks: ${output.summary.last28.totalClicks}`);
    console.log(`   Impressions: ${output.summary.last28.totalImpressions}`);
    console.log(`   Avg Position: ${output.summary.last28.avgPosition}`);
    console.log(`   Unique Queries: ${output.summary.last28.uniqueQueries}`);
    console.log(`   Unique Pages: ${output.summary.last28.uniquePages}`);
    console.log(`   Sitemaps: ${sitemaps.length}`);
    
    console.log('\n📈 Summary (last 90 days):');
    console.log(`   Clicks: ${output.summary.last90.totalClicks}`);
    console.log(`   Impressions: ${output.summary.last90.totalImpressions}`);
    console.log(`   Avg Position: ${output.summary.last90.avgPosition}`);
    console.log(`   Unique Queries: ${output.summary.last90.uniqueQueries}`);
    console.log(`   Unique Pages: ${output.summary.last90.uniquePages}`);
}

main().catch(err => {
    console.error('\n❌ Error:', err.message);
    process.exit(1);
});
