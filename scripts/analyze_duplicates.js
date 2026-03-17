const fs = require('fs');

const csvContent = fs.readFileSync('Table.csv', 'utf-8');
const lines = csvContent.split('\n').filter(l => l.trim() && !l.startsWith('URL'));

const failed = lines.filter(l => l.includes('Failed'));
const urls = failed.map(l => l.split(',')[0]);

console.log(`Total failed URLs: ${urls.length}\n`);

// Find postcode duplicates
const postcodePattern = /-\d{4}\//;
const withPostcode = urls.filter(u => postcodePattern.test(u));
const postcodeDuplicates = [];

withPostcode.forEach(url => {
    const withoutPostcode = url.replace(postcodePattern, '/');
    if (urls.includes(withoutPostcode)) {
        postcodeDuplicates.push({ with: url, without: withoutPostcode });
    }
});

console.log(`Postcode duplicates: ${postcodeDuplicates.length}`);
if (postcodeDuplicates.length > 0) {
    console.log('Examples:');
    postcodeDuplicates.slice(0, 5).forEach(d => {
        console.log(`  ${d.with}`);
        console.log(`  ${d.without}\n`);
    });
}

// Find state/city mismatches
const stateMismatches = [];
const localUrls = urls.filter(u => u.includes('/local/'));
const urlMap = new Map();

localUrls.forEach(url => {
    const parts = url.split('/').filter(Boolean);
    if (parts.length < 5) return;
    
    const [_, state, city, suburb, ...rest] = parts;
    const key = `${suburb}/${rest.join('/')}`;
    
    if (!urlMap.has(key)) {
        urlMap.set(key, []);
    }
    urlMap.get(key).push({ url, state, city });
});

urlMap.forEach((variants, key) => {
    if (variants.length > 1) {
        stateMismatches.push({ key, variants });
    }
});

console.log(`\nState/city mismatches: ${stateMismatches.length}`);
if (stateMismatches.length > 0) {
    console.log('Examples:');
    stateMismatches.slice(0, 3).forEach(m => {
        console.log(`  ${m.key}:`);
        m.variants.forEach(v => console.log(`    ${v.state}/${v.city} - ${v.url}`));
        console.log();
    });
}

// Business pages
const businessUrls = urls.filter(u => u.includes('/b/'));
console.log(`\nBusiness pages: ${businessUrls.length}`);

// Trade pages
const tradeUrls = urls.filter(u => u.includes('/trades/'));
console.log(`Trade pages: ${tradeUrls.length}`);
if (tradeUrls.length > 0) {
    console.log('Examples:');
    tradeUrls.slice(0, 5).forEach(u => console.log(`  ${u}`));
}

// Other patterns
const otherUrls = urls.filter(u => !u.includes('/b/') && !u.includes('/local/') && !u.includes('/trades/'));
console.log(`\nOther URLs: ${otherUrls.length}`);
if (otherUrls.length > 0) {
    console.log('Examples:');
    otherUrls.forEach(u => console.log(`  ${u}`));
}
