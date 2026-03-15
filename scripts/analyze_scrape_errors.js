/**
 * Analyze scrape_errors.log to identify patterns and suggest fixes
 */

const fs = require('fs');
const path = require('path');

const logFile = path.join(__dirname, 'scrape_errors.log');

if (!fs.existsSync(logFile)) {
    console.log('No error log found. Run the scraper first.');
    process.exit(0);
}

const content = fs.readFileSync(logFile, 'utf-8');
const lines = content.trim().split('\n').filter(l => l.length > 0);

const errorTypes = {
    'HTTP 403': [],
    'HTTP 404': [],
    'HTTP 400': [],
    'Timeout': [],
    'fetch failed': [],
    'Non-HTML content': [],
    'Other': []
};

lines.forEach(line => {
    const match = line.match(/\| ([^|]+) \| (.+)$/);
    if (!match) return;
    
    const website = match[1].trim();
    const error = match[2].trim();
    
    if (error.includes('HTTP 403')) errorTypes['HTTP 403'].push(website);
    else if (error.includes('HTTP 404')) errorTypes['HTTP 404'].push(website);
    else if (error.includes('HTTP 400')) errorTypes['HTTP 400'].push(website);
    else if (error.includes('Timeout')) errorTypes['Timeout'].push(website);
    else if (error.includes('fetch failed')) errorTypes['fetch failed'].push(website);
    else if (error.includes('Non-HTML')) errorTypes['Non-HTML content'].push(website);
    else errorTypes['Other'].push(error);
});

console.log('=== SCRAPE ERROR ANALYSIS ===\n');
console.log(`Total errors logged: ${lines.length}\n`);

Object.entries(errorTypes).forEach(([type, items]) => {
    if (items.length === 0) return;
    console.log(`${type}: ${items.length}`);
    if (items.length <= 5) {
        items.forEach(item => console.log(`  - ${item}`));
    }
});

console.log('\n=== RECOMMENDATIONS ===');
console.log('1. HTTP 403 - Sites blocking scrapers. Consider rotating User-Agent or using proxy.');
console.log('2. HTTP 404 - Invalid/dead URLs. Mark these websites as broken in DB.');
console.log('3. HTTP 400 - Facebook/social media pages. Extract from Facebook API instead.');
console.log('4. Timeout - Slow sites. Increase TIMEOUT_MS or skip these.');
console.log('5. fetch failed - DNS/connection errors. Likely invalid domains. Mark as broken.');
console.log('\n=== NEXT STEPS ===');
console.log('Run: node scripts/scrape_business_websites.js');
console.log('This will retry all failed businesses and fill in missing data.');
