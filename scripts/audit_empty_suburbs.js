/**
 * Audit: Find suburbs in AUSTRALIA_LOCATIONS that have 0 or very few businesses in the DB.
 * Uses the Neon connection string to query directly.
 */
const { Client } = require('pg');

const CONN_STRING = "postgresql://neondb_owner:npg_qsxKWSvGyk65@ep-steep-violet-aikad8l7-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require";

// Import AUSTRALIA_LOCATIONS inline (copy from generated)
const LOCATIONS = {
    "VIC": {
        "Ballarat": ["Alfredton", "Ballarat Central", "Ballarat East", "Ballarat North", "Brown Hill", "Delacombe", "Epping", "Invermay Park", "Miners Rest", "Mount Clear", "Mount Helen", "Nerrina", "Sebastopol", "Wendouree"],
        "Bendigo": ["Bendigo", "Epsom", "Flora Hill", "Golden Square", "Kangaroo Flat", "Kennington", "Maiden Gully", "Strathdale", "Strathfieldsaye"],
        "Geelong": ["Anakie", "Armstrong Creek", "Barwon Heads", "Belmont", "Clifton Springs", "Drysdale", "East Geelong", "Geelong", "Geelong West", "Hamlyn Heights", "Moolap", "Newcomb", "Newtown", "Norlane", "North Geelong", "Portarlington", "South Geelong", "Thomson", "Torquay", "Waurn Ponds", "Whittington"],
        "Melbourne": ["Albert Park", "Altona", "Altona Meadows", "Altona North", "Armadale", "Ascot Vale", "Ashburton", "Avondale Heights", "Bacchus Marsh", "Balaclava", "Balwyn", "Balwyn North", "Bannockburn", "Beaumaris", "Belmont", "Bentleigh", "Bentleigh East", "Berwick", "Blackburn", "Blackburn South", "Boronia", "Box Hill", "Box Hill North", "Brighton", "Brighton East", "Broadmeadows", "Brunswick", "Brunswick East", "Brunswick West", "Bulleen", "Bundoora", "Camberwell", "Campbellfield", "Carlton", "Carnegie", "Caroline Springs", "Carrum Downs", "Caulfield North", "Caulfield South", "Cheltenham", "Clayton", "Clayton South", "Clyde", "Coburg", "Collingwood", "Corio", "Craigieburn", "Cranbourne", "Cranbourne East", "Cranbourne North", "Cranbourne West", "Dandenong", "Dandenong North", "Deer Park", "Derrimut", "Diamond Creek", "Dingley Village", "Docklands", "Doncaster", "Doncaster East", "Donvale", "Elsternwick", "Eltham", "Elwood", "Endeavour Hills", "Epping", "Essendon", "Fawkner", "Ferntree Gully", "Fitzroy", "Fitzroy North", "Footscray", "Forest Hill", "Frankston", "Frankston East", "Frankston South", "Fyansford", "Geelong", "Glen Iris", "Glen Waverley", "Glenferrie", "Glenroy", "Greensborough", "Greenvale", "Grovedale", "Hallam", "Hampton", "Hampton Park", "Hawthorn", "Hawthorn South", "Heidelberg", "Highett", "Highton", "Hillside", "Hoppers Crossing", "Ivanhoe", "Keilor", "Keilor East", "Kew", "Keysborough", "Kilsyth", "Knox", "Kurunjang", "Lalor", "Langwarrin", "Lara", "Laverton North", "Leopold", "Lilydale", "Malvern East", "Manor Lakes", "Maribyrnong", "Marshall", "Meadow Heights", "Melbourne CBD", "Melbourne City Centre", "Melton South", "Mentone", "Mernda", "Mitcham", "Moolap", "Moonee Ponds", "Moorabbin", "Mooroolbark", "Mordialloc", "Mornington", "Mount Eliza", "Mount Martha", "Mount Waverley", "Mulgrave", "Narre Warren", "Narre Warren South", "Newcomb", "Newtown", "Noble Park", "Norlane", "North Geelong", "North Melbourne", "North Shore", "Northcote", "Nunawading", "Oak Park", "Oakleigh", "Ocean Grove", "Officer", "Pakenham", "Parkdale", "Pascoe Vale", "Point Cook", "Port Melbourne", "Prahran", "Preston", "Reservoir", "Richmond", "Ringwood", "Ringwood East", "Rosebud", "Rowville", "Roxburgh Park", "Saint Kilda", "Sandringham", "South Geelong", "South Melbourne", "South Morang", "South Yarra", "Southbank", "Springvale", "Springvale South", "St Albans", "St Kilda", "St Kilda East", "Sunbury", "Sunshine", "Sunshine North", "Sunshine West", "Surrey Hills", "Sydenham", "Tarneit", "Taylors Hill", "Taylors Lakes", "Templestowe", "Templestowe Lower", "Thomastown", "Thornbury", "Toorak", "Torquay", "Travancore", "Truganina", "Tullamarine", "Vermont South", "Wallan", "Wantirna", "Wantirna South", "Werribee", "West Footscray", "Wheelers Hill", "Williamstown", "Windsor", "Wonga Park", "Wyndham Vale", "Yarraville"],
    },
    "NSW": {
        "Bathurst": ["Orange"],
        "Central Coast": ["Avoca Beach", "Gosford", "Kariong", "Killarney Vale", "Niagara Park", "Tuggerah", "Wamberal", "Warnervale", "Wyong"],
        "Liverpool": ["Austral", "Bankstown", "Bargo", "Beverly Hills", "Blair Athol", "Bossley Park", "Bradbury", "Cabramatta", "Cabramatta West", "Camden", "Campbelltown", "Canley Heights", "Canley Vale", "Casula", "Condell Park", "Engadine", "Eschol Park", "Fairfield", "Fairfield East", "Fairfield Heights", "Fairfield West", "Glenmore Park", "Green Valley", "Gregory Hills", "Guildford West", "Harrington Park", "Hinchinbrook", "Ingleburn", "Kingswood Park", "Leumeah", "Macquarie Fields", "Menai", "Minto", "Miranda", "Mortdale", "Mount Annan", "Narellan", "Oatley", "Padstow", "Panania", "Peakhurst", "Penrith", "Picton", "Prestons", "Revesby", "Roselands", "Saint Helens Park", "Seven Hills", "Smeaton Grange", "Smithfield", "South Penrith", "Spring Farm", "St Clair", "Wetherill Park", "Wiley Park", "Yagoona"],
        "Maitland": ["Cessnock", "East Maitland", "Raymond Terrace", "Rutherford"],
        "Newcastle": ["Adamstown", "Bateau Bay", "Broadmeadow", "Charlestown", "Glendale", "Hamilton", "Jesmond", "Kotara", "Lambton", "Mayfield", "Merewether", "New Lambton", "Newcastle CBD", "Shortland", "Wallsend", "Waratah"],
        "Parramatta": ["Arndell Park", "Asquith", "Auburn", "Avalon Beach", "Baulkham Hills", "Beecroft", "Bella Vista", "Blacktown", "Bondi Beach", "Campbellfield", "Carlingford", "Castle Hill", "Cherrybrook", "Craigieburn", "Cranebrook", "Doonside", "Doreen", "Dural", "Eastwood", "Epping", "Ermington", "Galston", "Glendenning", "Glenwood", "Granville", "Greenacre", "Greystanes", "Hawthorn", "Hornsby", "Hornsby Heights", "Kellyville", "Kellyville Ridge", "Lakemba", "Lalor", "Lidcombe", "Marsfield", "Merrylands", "Mill Park", "Minchinbury", "Mount Colah", "Mount Druitt", "Mount Kuring Gai", "Normanhurst", "North Epping", "North Parramatta", "Northmead", "Pennant Hills", "Quakers Hill", "Rhodes", "Riverstone", "Ryde", "Seven Hills", "Strathfield", "Sydney", "The Entrance", "The Ponds", "Thomastown", "Thornleigh", "Toongabbie", "Toongabbie West", "Turrella", "Wahroonga", "Waitara", "Wentworthville", "West Gosford", "West Pennant Hills", "West Ryde", "Westmead", "Winston Hills", "Wollert"],
        "Sydney": ["Alexandria", "Annandale", "Arncliffe", "Artarmon", "Ashbury", "Ashfield", "Auburn", "Balmain", "Bangor", "Banksmeadow", "Barangaroo", "Beacon Hill", "Belmore", "Belrose", "Berowra", "Bexley", "Birchgrove", "Bondi", "Bondi Junction", "Botany", "Botany Bay", "Box Hill", "Breakwater", "Brighton Le Sands", "Brompton", "Brookvale", "Burwood", "Burwood East", "Camberwell", "Campbelltown", "Camperdown", "Campsie", "Caringbah", "Caringbah South", "Carlton", "Castlecrag", "Chatswood", "Chatswood West", "Chester Hill", "Collaroy", "Concord", "Coogee", "Corrimal", "Cremorne", "Cromer", "Cronulla", "Crows Nest", "Croydon", "Darlinghurst", "Dee Why", "Dolans Bay", "Drummoyne", "Dulwich Hill", "Earlwood", "Enmore", "Epping", "Erina", "Fairfield", "Five Dock", "Forest Lodge", "Fountaindale", "Frenchs Forest", "Freshwater", "Geelong West", "Gladesville", "Glebe", "Gordon", "Greenhills Beach", "Hawthorn", "Hawthorn East", "Haymarket", "Heathcote", "Heatherbrae", "Helensburgh", "Hornsby", "Hunters Hill", "Hurstville", "Illawong", "Ingleburn", "Kareela", "Kensington", "Kensington Gardens", "Kensington Park", "Kingsford", "Kingsgrove", "Kirrawee", "Knoxfield", "Kogarah", "Kurnell", "Lane Cove", "Lane Cove North", "Lane Cove West", "Leichhardt", "Lilyfield", "Lindfield", "Liverpool", "Manly", "Manly Vale", "Marrickville", "Mascot", "Melbourne", "Miranda", "Mona Vale", "Mortlake", "Mosman", "Mount Colah", "Mount Moriac", "Mount Waverley", "Narrabeen", "Narraweena", "Neutral Bay", "Newport", "Newtown", "North Manly", "North Narrabeen", "North Ryde", "North Sydney", "North Willoughby", "Norwood", "Oxford Falls", "Oyster Bay", "Pagewood", "Parramatta", "Penrith", "Penshurst", "Pitt Town", "Potts Point", "Pyrmont", "Queenscliff", "Randwick", "Redfern", "Ringwood", "Rockdale", "Rooty Hill", "Rosebery", "Roseville", "Rosslyn Park", "Royal Park", "Rozelle", "Ryde", "Saint Ives", "Saint Peters", "Sans Souci", "Smithfield", "Somerville", "South Hurstville", "St Ives", "St Leonards", "Stanmore", "Strathfield", "Strathfield South", "Surry Hills", "Sutherland", "Sydney", "Sydney CBD", "Sydney Central Business District", "Sylvania", "Taren Point", "Tempe", "Terrigal", "The Rocks", "Thomastown", "Trinity Gardens", "Ultimo", "Umina Beach", "Vermont", "Wahroonga", "Waterloo", "West Gosford", "West Pymble", "Wetherill Park", "Willoughby", "Windsor", "Woollahra", "Woolooware", "Woy Woy", "Zetland"],
        "Wollongong": ["Albion Park", "Bowral", "Corrimal", "Dapto", "Fairy Meadow", "Figtree", "Helensburgh", "Kiama", "Nowra", "Port Kembla", "Shellharbour", "Thirroul", "Unanderra", "Wollongong CBD", "Wollongong city centre", "Woonona"],
    },
    "QLD": {
        "Brisbane": ["Albany Creek", "Alexandra Hills", "Algester", "Annerley", "Archerfield", "Ashgrove", "Aspley", "Birkdale", "Bowen Hills", "Bracken Ridge", "Brassall", "Bray Park", "Brisbane", "Brisbane CBD", "Brookside", "Browns Plains", "Bulimba", "Burpengary", "Camp Hill", "Cannon Hill", "Capalaba", "Carina", "Carina Heights", "Carindale", "Carrara", "Chambers Flat", "Chandler", "Chermside", "Clayfield", "Cleveland", "Coombabah", "Coopers Plains", "Coorparoo", "Crestmead", "Darra", "Deception Bay", "Dutton Park", "Eagleby", "East Brisbane", "Eight Mile Plains", "Everton Park", "Fortitude Valley", "Gatton", "Geebung", "Greenslopes", "Hamilton", "Hemmant", "Hillcrest", "Holland Park", "Holland Park West", "Holmview", "Inala", "Indooroopilly", "Ipswich", "Jimboomba", "Kedron", "Keperra", "Laidley", "Lawnton", "Logan", "Logan Central", "Loganholme", "Loganlea", "Lota", "Lutwyche", "Macgregor", "Mansfield", "Marsden", "Meadowbrook", "Mermaid Waters", "Molendinar", "Moorooka", "Morayfield", "Morningside", "Mount Cotton", "Mount Gravatt", "Mount Gravatt East", "Murarrie", "Murrumba Downs", "Narangba", "Nundah", "Ormeau", "Ormiston", "Paddington", "Park Ridge South", "Parkinson", "Redbank Plains", "Redcliffe", "Redland Bay", "Redlands", "Regents Park", "Robertson", "Rochedale", "Rochedale South", "Rocklea", "Runcorn", "Russell Island", "Sandgate", "Seventeen Mile Rocks", "Slacks Creek", "South Brisbane", "Springfield Lakes", "Springwood", "Stafford", "Stones Corner", "Sunnybank", "Sunnybank Hills", "Taigum", "Taringa", "Tarragindi", "Thorneside", "Thornlands", "Tingalpa", "Toowong", "Underwood", "Upper Mount Gravatt", "Victoria Point", "Virginia", "Wakerley", "Warner", "Wavell Heights", "Wellington Point", "Willowbank", "Windsor", "Wishart", "Woodridge", "Woolloongabba", "Wynnum West", "Yatala"],
        "Gold Coast": ["Arundel", "Ashmore", "Benowa", "Biggera Waters", "Broadbeach", "Bundall", "Burleigh Heads", "Coomera", "Coolangatta", "Currumbin", "Helensvale", "Hope Island", "Labrador", "Main Beach", "Miami", "Mudgeeraba", "Nerang", "Oxenford", "Palm Beach", "Parkwood", "Robina", "Runaway Bay", "Southport", "Surfers Paradise", "Tugun", "Upper Coomera", "Varsity Lakes"],
        "Sunshine Coast": ["Buderim", "Caloundra", "Coolum Beach", "Forest Glen", "Gympie", "Kawana Waters", "Maleny", "Maroochydore", "Mooloolaba", "Nambour", "Noosa Heads", "Noosaville", "Sippy Downs", "Tewantin", "Woombye"],
        "Townsville": ["Aitkenvale", "Belgian Gardens", "Condon", "Cranbrook", "Douglas", "Garbutt", "Idalia", "Kirwan", "Mount Louisa", "Mundingburra", "North Ward", "Pimlico", "Rasmussen", "Rowes Bay", "Townsville CBD"],
    },
    "WA": {
        "Bunbury": ["Australind"],
        "Mandurah": ["Halls Head", "Secret Harbour"],
        "Perth": ["Alkimos", "Applecross", "Armadale", "Attadale", "Aveley", "Bakery Hill", "Balcatta", "Balga", "Ballajura", "Bassendean", "Bayswater", "Beckenham", "Beechboro", "Beldon", "Belmont", "Bentley", "Bibra Lake", "Booragoon", "Brabham", "Bullsbrook", "Burns Beach", "Butler", "Canning Vale", "Cannington", "Carlisle", "Clarkson", "Cloverdale", "Cockburn", "Como", "Cottesloe", "Darch", "Dianella", "Doubleview", "Duncraig", "East Perth", "Ellenbrook", "Fremantle", "Girrawheen", "Gnangara", "Gosnells", "Greenwood", "Hamilton Hill", "Henderson", "Henley Brook", "Hillarys", "Innaloo", "Jandakot", "Jindalee", "Joondalup", "Joondanna", "Karrinyup", "Kelmscott", "Kenwick", "Kingsley", "Landsdale", "Leederville", "Leeming", "Maddington", "Mandurah", "Marangaroo", "Mariginiup", "Martin", "Maylands", "Melville", "Merriwa", "Midland", "Mindarie", "Mirrabooka", "Morley", "Mount Lawley", "Mount Pleasant", "Mundaring", "Neerabup", "Nollamara", "North Perth", "Northbridge", "Nowergup", "O'Connor", "O'connor", "Osborne Park", "Perth CBD", "Perth city centre", "Pickering Brook", "Quinns Rocks", "Rivervale", "Rockingham", "Saint Albans", "Scarborough", "Seville Grove", "South Perth", "Southern River", "Spearwood", "St Kilda", "Stirling", "Subiaco", "Swan View", "The Vines", "Thornlie", "Trigg", "Upper Swan", "Vasse", "Victoria Park", "Wangara", "Wanneroo", "Welshpool", "Wembley", "West Perth", "White Gum Valley", "Whitford", "Willeton", "Willetton", "Wilsonton", "Yanchep", "Yangebup", "Yokine"],
        "Rockingham": ["Baldivis", "Byford", "Kwinana", "Port Kennedy", "Rockingham city centre", "Waikiki", "Warnbro"],
    },
    "SA": {
        "Adelaide": ["Aberfoyle Park", "Adelaide CBD", "Adelaide Hills", "Adelaide city centre", "Aldinga Beach", "Belair", "Blackwood", "Brighton", "Campbelltown", "Christie Downs", "Christies Beach", "Edwardstown", "Elizabeth", "Enfield", "Glenelg", "Glenside", "Golden Grove", "Hallett Cove", "Hampstead Gardens", "Happy Valley", "Henley Beach", "Hillcrest", "Holden Hill", "Kensington", "Kilburn", "Lonsdale", "Magill", "Marion", "Mawson Lakes", "Mitcham", "Modbury", "Morphett Vale", "Mount Barker", "Mount Gambier", "Munno Para", "Murray Bridge", "Noarlunga", "Norwood", "O'Halloran Hill", "O'halloran Hill", "Old Reynella", "Para Hills", "Parafield Gardens", "Pooraka", "Port Adelaide", "Prospect", "Salisbury", "Seacliff Park", "Seaton", "Seaview Downs", "Semaphore", "Sheidow Park", "St Marys", "Sturt", "Tea Tree Gully", "Torrensville", "Trott Park", "Unley", "Victor Harbor", "Walkerville", "Woodville"],
        "Gawler": ["Banksia Park", "Burton", "Fairview Park", "Flinders Park", "Gepps Cross", "Golden Grove", "Greenwith", "Modbury", "Modbury North", "Para Vista", "Pooraka", "Redwood Park", "Ridgehaven", "Saint Agnes", "Salisbury North", "Salisbury Park", "Salisbury Plain", "Surrey Downs", "Valley View"],
    },
    "ACT": {
        "Canberra": ["Belconnen", "Bruce", "Canberra CBD", "Casey", "Chifley", "Dickson", "Fadden", "Florey", "Gungahlin", "Kaleen", "Kambah", "Kingston", "Lyneham", "Macquarie", "Manuka", "Molonglo Valley", "Narrabundah", "Ngunnawal", "Palmerston", "Queanbeyan", "Reid", "Scullin", "Tuggeranong", "Weston Creek", "Woden", "Wright"],
    },
    "TAS": {
        "Burnie": ["Devonport"],
        "Hobart": ["Battery Point", "Bellerive", "Claremont", "Glenorchy", "Hobart CBD", "Howrah", "Kingston", "Lindisfarne", "Moonah", "New Town", "Rosny", "Sandy Bay", "Sorell", "West Hobart"],
        "Launceston": ["Kings Meadows", "Launceston CBD", "Newstead", "Newnham", "Prospect Vale", "Riverside", "Rocherlea", "South Launceston", "Youngtown"],
    },
    "NT": {
        "Darwin": ["Bakewell", "Coconut Grove", "Darwin CBD", "Fannie Bay", "Humpty Doo", "Karama", "Leanyer", "Malak", "Millner", "Moil", "Nightcliff", "Palmerston", "Rapid Creek", "Stuart Park", "Tiwi", "Wanguri", "Woodroffe"],
    },
};

async function main() {
    const client = new Client({ connectionString: CONN_STRING });
    await client.connect();

    // Get all suburb counts from DB (case-insensitive matching)
    const { rows } = await client.query(`
        SELECT LOWER(REPLACE(suburb, ' ', '-')) as suburb_slug, 
               LOWER(REPLACE(city, ' ', '-')) as city_slug,
               LOWER(state) as state_slug,
               suburb, city, state,
               COUNT(*) as biz_count 
        FROM businesses 
        GROUP BY suburb, city, state
    `);

    // Build lookup: suburb_name (lowercase) -> total biz count across all city assignments
    const suburbCounts = {};
    for (const row of rows) {
        const key = row.suburb.toLowerCase();
        suburbCounts[key] = (suburbCounts[key] || 0) + parseInt(row.biz_count);
    }

    const empty = [];      // 0 businesses
    const thin = [];       // 1-5 businesses
    const ok = [];         // 6+ businesses
    let totalInLocations = 0;

    for (const [state, cities] of Object.entries(LOCATIONS)) {
        for (const [city, suburbs] of Object.entries(cities)) {
            for (const suburb of suburbs) {
                totalInLocations++;
                const count = suburbCounts[suburb.toLowerCase()] || 0;
                const entry = { state, city, suburb, count, url: `/local/${state.toLowerCase()}/${city.toLowerCase().replace(/ /g, '-')}/${suburb.toLowerCase().replace(/ /g, '-')}` };
                if (count === 0) empty.push(entry);
                else if (count <= 5) thin.push(entry);
                else ok.push(entry);
            }
        }
    }

    // Sort empty and thin by state/city
    empty.sort((a, b) => `${a.state}${a.city}${a.suburb}`.localeCompare(`${b.state}${b.city}${b.suburb}`));
    thin.sort((a, b) => a.count - b.count);

    console.log(`\n=== SUBURB AUDIT RESULTS ===`);
    console.log(`Total suburbs in AUSTRALIA_LOCATIONS: ${totalInLocations}`);
    console.log(`Empty (0 businesses): ${empty.length}`);
    console.log(`Thin (1-5 businesses): ${thin.length}`);
    console.log(`OK (6+ businesses): ${ok.length}`);

    // Summary by state
    console.log(`\n--- Empty suburbs by state ---`);
    const byState = {};
    for (const e of empty) {
        byState[e.state] = (byState[e.state] || 0) + 1;
    }
    for (const [s, c] of Object.entries(byState).sort((a, b) => b[1] - a[1])) {
        console.log(`  ${s}: ${c} empty`);
    }

    // Write full report
    const fs = require('fs');
    const lines = ['# Suburb Audit Report', `Generated: ${new Date().toISOString().split('T')[0]}`, '',
        `Total suburbs in AUSTRALIA_LOCATIONS: ${totalInLocations}`,
        `Empty (0 businesses): ${empty.length}`,
        `Thin (1-5 businesses): ${thin.length}`,
        `OK (6+ businesses): ${ok.length}`, '',
        '## Empty Suburbs (0 businesses) — NEED FILLING', ''];
    
    let currentState = '';
    for (const e of empty) {
        if (e.state !== currentState) {
            currentState = e.state;
            lines.push(`### ${e.state}`);
        }
        lines.push(`- ${e.suburb} (${e.city}) — ${e.url}`);
    }

    lines.push('', '## Thin Suburbs (1-5 businesses) — SHOULD TOP UP', '');
    for (const e of thin) {
        lines.push(`- ${e.suburb} (${e.state}/${e.city}) — ${e.count} businesses — ${e.url}`);
    }

    const reportPath = require('path').resolve('C:/Users/61479/Documents/trade-refer-stitch/scripts/suburb_audit_report.md');
    fs.writeFileSync(reportPath, lines.join('\n'));
    console.log(`\nFull report: ${reportPath}`);

    // Also output a JSON list for the fill script
    const fillList = [...empty, ...thin].map(e => ({
        state: e.state,
        city: e.city,
        suburb: e.suburb,
        current_count: e.count,
        url: e.url,
        priority: e.count === 0 ? 'high' : 'medium'
    }));
    const fillPath = require('path').resolve('C:/Users/61479/Documents/trade-refer-stitch/scripts/suburbs_to_fill.json');
    fs.writeFileSync(fillPath, JSON.stringify(fillList, null, 2));
    console.log(`Fill list JSON: ${fillPath} (${fillList.length} suburbs)`);

    await client.end();
}

main().catch(e => { console.error(e); process.exit(1); });
