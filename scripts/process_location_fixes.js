/**
 * Process traderefer_location_fixes.json and generate:
 * 1. Redirect map (lib/location-redirects.ts)
 * 2. Updated AUSTRALIA_LOCATIONS entries
 * 3. DB migration SQL
 * 4. Gold Coast review report
 */
const fs = require('fs');
const path = require('path');

const jsonPath = path.resolve('C:/Users/61479/Downloads/serviceseeking2/traderefer_location_fixes.json');
const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

const redirects = [];
const goldCoastReview = [];
const dbMigrations = [];

// Track new suburbs to add to AUSTRALIA_LOCATIONS
// Structure: { STATE: { City: Set<suburb> } }
const locationsToAdd = {};
const locationsToRemove = {}; // suburbs to remove from wrong cities

function addToLocations(state, city, suburb) {
    if (!locationsToAdd[state]) locationsToAdd[state] = {};
    if (!locationsToAdd[state][city]) locationsToAdd[state][city] = new Set();
    locationsToAdd[state][city].add(suburb);
}

function removeFromLocations(state, city, suburb) {
    if (!locationsToRemove[state]) locationsToRemove[state] = {};
    if (!locationsToRemove[state][city]) locationsToRemove[state][city] = new Set();
    locationsToRemove[state][city].add(suburb);
}

function extractPath(url) {
    return url.replace('https://traderefer.au', '');
}

function formatSuburbName(slug) {
    return slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

// ── SECTION 1: fix_wrong_state (10 records) ──
console.log(`\n=== SECTION 1: fix_wrong_state (${data.fix_wrong_state.length} records) ===`);
for (const rec of data.fix_wrong_state) {
    const oldPath = extractPath(rec.current_url);
    const newPath = extractPath(rec.correct_url);
    redirects.push({ source: oldPath, destination: newPath, section: 1 });
    
    // Remove suburb from wrong state's city, add to correct state's city
    const suburbName = formatSuburbName(rec.suburb);
    const cityName = formatSuburbName(rec.city);
    removeFromLocations(rec.current_state, cityName, suburbName);
    addToLocations(rec.correct_state, cityName, suburbName);
    
    // DB: update state for businesses in this city+suburb
    dbMigrations.push(
        `UPDATE businesses SET state = '${rec.correct_state}' WHERE state ILIKE '${rec.current_state}' AND city ILIKE '%${cityName}%' AND suburb ILIKE '%${suburbName}%';`
    );
    
    console.log(`  ${oldPath} → ${newPath}`);
}

// ── SECTION 2: fix_suburb_used_as_city (467 records) ──
console.log(`\n=== SECTION 2: fix_suburb_used_as_city (${data.fix_suburb_used_as_city.length} records) ===`);
for (const rec of data.fix_suburb_used_as_city) {
    const oldPath = extractPath(rec.current_url);
    const newPath = extractPath(rec.correct_url);
    redirects.push({ source: oldPath, destination: newPath, section: 2 });
    
    const suburbName = formatSuburbName(rec.suburb_slug);
    const wrongCityName = formatSuburbName(rec.wrong_city_slug);
    const correctCityName = formatSuburbName(rec.correct_city);
    
    // Remove wrong city entirely from AUSTRALIA_LOCATIONS (it's a suburb, not a city)
    removeFromLocations(rec.state || rec.correct_state, wrongCityName, suburbName);
    // Add suburb under correct city
    addToLocations(rec.correct_state, correctCityName, suburbName);
    
    // DB: update city for businesses in this suburb
    dbMigrations.push(
        `UPDATE businesses SET city = '${correctCityName}' WHERE state ILIKE '${rec.state || rec.correct_state}' AND city ILIKE '%${wrongCityName}%' AND suburb ILIKE '%${suburbName}%';`
    );
}
console.log(`  Generated ${data.fix_suburb_used_as_city.length} redirects`);

// ── SECTION 3: fix_wrong_city (40 records) ──
console.log(`\n=== SECTION 3: fix_wrong_city (${data.fix_wrong_city.length} records) ===`);
let skippedGoldCoast = 0;
let appliedSection3 = 0;
for (const rec of data.fix_wrong_city) {
    if (rec.note && rec.note.includes('review_before_changing')) {
        goldCoastReview.push(rec);
        skippedGoldCoast++;
        continue;
    }
    
    const oldPath = extractPath(rec.current_url);
    const newPath = extractPath(rec.correct_url);
    redirects.push({ source: oldPath, destination: newPath, section: 3 });
    
    const suburbName = formatSuburbName(rec.suburb);
    const wrongCityName = formatSuburbName(rec.wrong_city);
    const correctCityName = formatSuburbName(rec.correct_city);
    
    removeFromLocations(rec.state, wrongCityName, suburbName);
    addToLocations(rec.state, correctCityName, suburbName);
    
    dbMigrations.push(
        `UPDATE businesses SET city = '${correctCityName}' WHERE state ILIKE '${rec.state}' AND city ILIKE '%${wrongCityName}%' AND suburb ILIKE '%${suburbName}%';`
    );
    
    appliedSection3++;
    console.log(`  ${oldPath} → ${newPath}`);
}
console.log(`  Applied: ${appliedSection3}, Skipped (Gold Coast review): ${skippedGoldCoast}`);

// ── SECTION 4: add_missing_suburbs (230 records) ──
console.log(`\n=== SECTION 4: add_missing_suburbs (${data.add_missing_suburbs.length} records) ===`);
for (const rec of data.add_missing_suburbs) {
    addToLocations(rec.state, rec.city, rec.suburb);
}
console.log(`  Added ${data.add_missing_suburbs.length} new suburb entries`);

// ── GENERATE OUTPUT FILES ──

// 1. Redirect map file
const redirectMapLines = redirects.map(r => `  "${r.source}": "${r.destination}",`);
const redirectMapContent = `// Auto-generated location redirect map from traderefer_location_fixes.json
// Generated: ${new Date().toISOString().split('T')[0]}
// Total redirects: ${redirects.length}
// Section 1 (wrong state): ${redirects.filter(r => r.section === 1).length}
// Section 2 (suburb as city): ${redirects.filter(r => r.section === 2).length}
// Section 3 (wrong city): ${redirects.filter(r => r.section === 3).length}

export const LOCATION_REDIRECTS: Record<string, string> = {
${redirectMapLines.join('\n')}
};
`;

const redirectOutPath = path.resolve('C:/Users/61479/Documents/trade-refer-stitch/apps/web/lib/location-redirects.ts');
fs.writeFileSync(redirectOutPath, redirectMapContent);
console.log(`\n✅ Redirect map written to ${redirectOutPath} (${redirects.length} entries)`);

// 2. Generate additions to AUSTRALIA_LOCATIONS
// Merge new suburbs into existing structure
const existingLocations = {
    "VIC": {
        "Geelong": ["Anakie", "Armstrong Creek", "Barwon Heads", "Belmont", "Clifton Springs", "Corio", "Drysdale", "East Geelong", "Geelong", "Geelong West", "Grovedale", "Hamlyn Heights", "Highton", "Lara", "Leopold", "Moolap", "Newcomb", "Newtown", "Norlane", "North Geelong", "Ocean Grove", "Portarlington", "South Geelong", "Thomson", "Torquay", "Waurn Ponds", "Whittington"],
        "Melbourne": ["Albert Park", "Armadale", "Ascot Vale", "Ashburton", "Bentleigh", "Box Hill", "Brighton", "Brunswick", "Bundoora", "Carlton", "Camberwell", "Cheltenham", "Clayton", "Coburg", "Collingwood", "Craigieburn", "Cranbourne", "Dandenong", "Doncaster", "Doncaster East", "Epping", "Essendon", "Fitzroy", "Footscray", "Frankston", "Glen Waverley", "Hawthorn", "Heidelberg", "Hoppers Crossing", "Keilor", "Knox", "Lalor", "Lilydale", "Melbourne CBD", "Mentone", "Moonee Ponds", "Moorabbin", "Mordialloc", "Mount Waverley", "Mulgrave", "Narre Warren", "Noble Park", "Northcote", "Nunawading", "Oakleigh", "Pakenham", "Point Cook", "Preston", "Richmond", "Ringwood", "Rowville", "South Yarra", "Springvale", "St Kilda", "Sunbury", "Sunshine", "Surrey Hills", "Tarneit", "Thomastown", "Tullamarine", "Wantirna", "Werribee", "Williamstown", "Windsor", "Yarraville"],
        "Ballarat": ["Alfredton", "Ballarat Central", "Ballarat East", "Ballarat North", "Brown Hill", "Delacombe", "Epping", "Invermay Park", "Miners Rest", "Mount Clear", "Mount Helen", "Nerrina", "Sebastopol", "Wendouree"],
        "Bendigo": ["Bendigo", "Epsom", "Flora Hill", "Golden Square", "Kangaroo Flat", "Kennington", "Maiden Gully", "Strathdale", "Strathfieldsaye"],
    },
    "NSW": {
        "Sydney": ["Ashfield", "Auburn", "Bankstown", "Baulkham Hills", "Blacktown", "Bondi", "Bondi Junction", "Botany", "Burwood", "Campbelltown", "Castle Hill", "Chatswood", "Cronulla", "Dee Why", "Epping", "Fairfield", "Glebe", "Gordon", "Hornsby", "Hurstville", "Kogarah", "Lane Cove", "Liverpool", "Manly", "Marrickville", "Miranda", "Mosman", "Newtown", "North Sydney", "Parramatta", "Penrith", "Randwick", "Redfern", "Ryde", "St Ives", "St Leonards", "Strathfield", "Surry Hills", "Sydney CBD", "Ultimo", "Wahroonga", "Wentworthville", "Westmead", "Windsor", "Woollahra"],
        "Newcastle": ["Adamstown", "Broadmeadow", "Charlestown", "Glendale", "Hamilton", "Jesmond", "Kotara", "Lambton", "Mayfield", "Merewether", "New Lambton", "Newcastle CBD", "Shortland", "Wallsend", "Waratah"],
        "Wollongong": ["Albion Park", "Corrimal", "Dapto", "Figtree", "Fairy Meadow", "Helensburgh", "Kiama", "Nowra", "Port Kembla", "Shellharbour", "Thirroul", "Unanderra", "Wollongong CBD"],
        "Central Coast": ["Avoca Beach", "Bateau Bay", "Gosford", "Kariong", "Killarney Vale", "Niagara Park", "Terrigal", "Tuggerah", "Umina Beach", "Wamberal", "Warnervale", "Wyong"],
    },
    "QLD": {
        "Brisbane": ["Annerley", "Ashgrove", "Aspley", "Bowen Hills", "Brisbane CBD", "Brookside", "Bulimba", "Capalaba", "Carindale", "Chermside", "Cleveland", "Coorparoo", "Darra", "Eight Mile Plains", "Everton Park", "Fortitude Valley", "Greenslopes", "Hamilton", "Holland Park", "Indooroopilly", "Inala", "Ipswich", "Kedron", "Keperra", "Logan", "Lutwyche", "Moorooka", "Mount Gravatt", "Nundah", "Paddington", "Redcliffe", "Redlands", "Rochedale", "Rocklea", "Sandgate", "Springwood", "Stafford", "Sunnybank", "Taringa", "Toowong", "Upper Mount Gravatt", "Virginia", "Wavell Heights", "Willowbank", "Woolloongabba"],
        "Gold Coast": ["Arundel", "Ashmore", "Benowa", "Biggera Waters", "Broadbeach", "Bundall", "Burleigh Heads", "Coomera", "Coolangatta", "Currumbin", "Helensvale", "Hope Island", "Labrador", "Main Beach", "Miami", "Mudgeeraba", "Nerang", "Oxenford", "Palm Beach", "Parkwood", "Robina", "Runaway Bay", "Southport", "Surfers Paradise", "Tugun", "Upper Coomera", "Varsity Lakes"],
        "Sunshine Coast": ["Buderim", "Caloundra", "Coolum Beach", "Forest Glen", "Kawana Waters", "Maleny", "Maroochydore", "Mooloolaba", "Nambour", "Noosa Heads", "Noosaville", "Sippy Downs", "Tewantin", "Woombye"],
        "Townsville": ["Aitkenvale", "Belgian Gardens", "Condon", "Cranbrook", "Douglas", "Garbutt", "Idalia", "Kirwan", "Mount Louisa", "Mundingburra", "North Ward", "Pimlico", "Rasmussen", "Rowes Bay", "Townsville CBD"],
    },
    "WA": {
        "Perth": ["Armadale", "Baldivis", "Balga", "Bassendean", "Bayswater", "Belmont", "Bentley", "Burns Beach", "Butler", "Canning Vale", "Cannington", "Carlisle", "Clarkson", "Cloverdale", "Cockburn", "Como", "Cottesloe", "Ellenbrook", "Fremantle", "Girrawheen", "Gosnells", "Greenwood", "Hamilton Hill", "Innaloo", "Joondalup", "Joondanna", "Karrinyup", "Kelmscott", "Kenwick", "Kingsley", "Leederville", "Leeming", "Mandurah", "Marangaroo", "Melville", "Midland", "Mirrabooka", "Morley", "Mount Lawley", "Mount Pleasant", "Mundaring", "Nollamara", "North Perth", "Northbridge", "O'Connor", "Osborne Park", "Perth CBD", "Rockingham", "Scarborough", "South Perth", "Spearwood", "Stirling", "Subiaco", "Swan View", "Victoria Park", "Wanneroo", "Wembley", "Whitford", "Willeton", "Yokine"],
    },
    "SA": {
        "Adelaide": ["Adelaide CBD", "Aldinga Beach", "Belair", "Blackwood", "Brighton", "Campbelltown", "Christie Downs", "Christies Beach", "Edwardstown", "Elizabeth", "Enfield", "Glenelg", "Glenside", "Golden Grove", "Hallett Cove", "Henley Beach", "Hillcrest", "Holden Hill", "Kensington", "Kilburn", "Lonsdale", "Magill", "Marion", "Mawson Lakes", "Mitcham", "Modbury", "Morphett Vale", "Mount Barker", "Mount Gambier", "Munno Para", "Noarlunga", "Norwood", "O'Halloran Hill", "Para Hills", "Parafield Gardens", "Port Adelaide", "Prospect", "Salisbury", "Semaphore", "St Marys", "Tea Tree Gully", "Torrensville", "Unley", "Victor Harbor", "Walkerville", "Woodville"],
    },
    "ACT": {
        "Canberra": ["Belconnen", "Bruce", "Canberra CBD", "Casey", "Chifley", "Dickson", "Fadden", "Florey", "Gungahlin", "Kaleen", "Kingston", "Lyneham", "Macquarie", "Manuka", "Molonglo Valley", "Narrabundah", "Ngunnawal", "Palmerston", "Queanbeyan", "Reid", "Scullin", "Tuggeranong", "Weston Creek", "Woden", "Wright"],
    },
    "TAS": {
        "Hobart": ["Battery Point", "Bellerive", "Claremont", "Glenorchy", "Hobart CBD", "Howrah", "Kingston", "Lindisfarne", "Moonah", "New Town", "Rosny", "Sandy Bay", "Sorell", "West Hobart"],
        "Launceston": ["Devonport", "Kings Meadows", "Launceston CBD", "Newstead", "Newnham", "Prospect Vale", "Riverside", "Rocherlea", "South Launceston", "Youngtown"],
    },
    "NT": {
        "Darwin": ["Bakewell", "Coconut Grove", "Darwin CBD", "Fannie Bay", "Humpty Doo", "Karama", "Leanyer", "Malak", "Millner", "Moil", "Nightcliff", "Palmerston", "Rapid Creek", "Stuart Park", "Tiwi", "Wanguri", "Woodroffe"],
    },
};

// Apply removals from section 3 (wrong city) - remove suburbs that are moving
for (const [state, cities] of Object.entries(locationsToRemove)) {
    for (const [city, suburbs] of Object.entries(cities)) {
        if (existingLocations[state] && existingLocations[state][city]) {
            for (const sub of suburbs) {
                const idx = existingLocations[state][city].indexOf(sub);
                if (idx !== -1) {
                    existingLocations[state][city].splice(idx, 1);
                }
            }
        }
    }
}

// Apply additions
for (const [state, cities] of Object.entries(locationsToAdd)) {
    if (!existingLocations[state]) existingLocations[state] = {};
    for (const [city, suburbs] of Object.entries(cities)) {
        if (!existingLocations[state][city]) existingLocations[state][city] = [];
        for (const sub of suburbs) {
            if (!existingLocations[state][city].includes(sub)) {
                existingLocations[state][city].push(sub);
            }
        }
        existingLocations[state][city].sort();
    }
}

// Remove "wrong city" keys that were actually suburbs (section 2)
// Collect all wrong city slugs from section 2
const wrongCityKeys = new Set();
for (const rec of data.fix_suburb_used_as_city) {
    const state = rec.state || rec.correct_state;
    const wrongCityName = formatSuburbName(rec.wrong_city_slug);
    wrongCityKeys.add(`${state}|${wrongCityName}`);
}

for (const key of wrongCityKeys) {
    const [state, cityName] = key.split('|');
    if (existingLocations[state] && existingLocations[state][cityName]) {
        // Check if this city key should be removed entirely 
        // (all its suburbs have been reassigned)
        if (existingLocations[state][cityName].length === 0) {
            delete existingLocations[state][cityName];
            console.log(`  Removed empty city key: ${state} > ${cityName}`);
        }
    }
}

// Generate AUSTRALIA_LOCATIONS TypeScript
function generateLocationsTS(locs) {
    const lines = [];
    const stateOrder = ["VIC", "NSW", "QLD", "WA", "SA", "ACT", "TAS", "NT"];
    for (const state of stateOrder) {
        if (!locs[state]) continue;
        lines.push(`    "${state}": {`);
        const cityNames = Object.keys(locs[state]).sort();
        for (let ci = 0; ci < cityNames.length; ci++) {
            const city = cityNames[ci];
            const suburbs = locs[state][city];
            // Format suburbs in rows of 5
            const rows = [];
            for (let i = 0; i < suburbs.length; i += 5) {
                const chunk = suburbs.slice(i, i + 5).map(s => `"${s}"`).join(', ');
                rows.push(`            ${chunk}`);
            }
            const comma = ci < cityNames.length - 1 ? ',' : '';
            lines.push(`        "${city}": [`);
            lines.push(rows.join(',\n'));
            lines.push(`        ]${comma}`);
        }
        lines.push(`    },`);
    }
    return lines.join('\n');
}

const locationsTS = generateLocationsTS(existingLocations);
const locationsOutPath = path.resolve('C:/Users/61479/Documents/trade-refer-stitch/scripts/generated_locations.ts');
fs.writeFileSync(locationsOutPath, `// Auto-generated AUSTRALIA_LOCATIONS\n// Replace the existing AUSTRALIA_LOCATIONS in lib/constants.ts\n\nexport const AUSTRALIA_LOCATIONS: LocationData = {\n${locationsTS}\n};\n`);
console.log(`\n✅ Updated AUSTRALIA_LOCATIONS written to ${locationsOutPath}`);

// Count stats
let totalSuburbs = 0;
let totalCities = 0;
for (const [state, cities] of Object.entries(existingLocations)) {
    for (const [city, suburbs] of Object.entries(cities)) {
        totalCities++;
        totalSuburbs += suburbs.length;
    }
}
console.log(`   Total cities: ${totalCities}, Total suburbs: ${totalSuburbs}`);

// 3. Write DB migration SQL
const sqlOutPath = path.resolve('C:/Users/61479/Documents/trade-refer-stitch/neon/migrations/015_fix_location_data.sql');
const sqlContent = `-- Auto-generated location fix migration
-- Generated: ${new Date().toISOString().split('T')[0]}
-- Sections 1-3 from traderefer_location_fixes.json
-- Total updates: ${dbMigrations.length}

BEGIN;

${dbMigrations.join('\n')}

COMMIT;
`;
fs.writeFileSync(sqlOutPath, sqlContent);
console.log(`\n✅ DB migration written to ${sqlOutPath} (${dbMigrations.length} statements)`);

// 4. Gold Coast review report
if (goldCoastReview.length > 0) {
    const gcReport = goldCoastReview.map(r => 
        `- ${r.current_url}\n  Suggested: ${r.correct_url}\n  Note: ${r.note}`
    ).join('\n');
    const gcOutPath = path.resolve('C:/Users/61479/Documents/trade-refer-stitch/scripts/gold_coast_review.md');
    fs.writeFileSync(gcOutPath, `# Gold Coast Suburbs — Manual Review Required\n\nThese ${goldCoastReview.length} records suggest moving Gold Coast suburbs to Brisbane.\nGold Coast is a major city in its own right — DO NOT change these automatically.\n\n${gcReport}\n`);
    console.log(`\n⚠️  Gold Coast review: ${goldCoastReview.length} records written to ${gcOutPath}`);
}

console.log(`\n=== SUMMARY ===`);
console.log(`Redirects generated: ${redirects.length}`);
console.log(`Gold Coast flagged for review: ${goldCoastReview.length}`);
console.log(`DB migration statements: ${dbMigrations.length}`);
console.log(`New/updated AUSTRALIA_LOCATIONS cities: ${totalCities}`);
console.log(`Total suburbs in AUSTRALIA_LOCATIONS: ${totalSuburbs}`);
