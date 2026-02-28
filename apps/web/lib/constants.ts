export const TRADE_CATEGORIES = [
    "Plumbing",
    "Electrical",
    "Carpentry",
    "Landscaping",
    "Roofing",
    "Painting",
    "Cleaning",
    "Building",
    "Concreting",
    "Tiling",
    "Plastering",
    "Fencing",
    "Demolition",
    "Excavation",
    "Air Conditioning & Heating",
    "Solar & Energy",
    "Pest Control",
    "Tree Lopping & Removal",
    "Gardening & Lawn Care",
    "Mowing",
    "Pool & Spa",
    "Bathroom Renovation",
    "Kitchen Renovation",
    "Flooring",
    "Glazing & Windows",
    "Guttering",
    "Handyman",
    "Insulation",
    "Locksmith",
    "Paving",
    "Rendering",
    "Scaffolding",
    "Security Systems",
    "Shopfitting",
    "Signwriting",
    "Stonemasonry",
    "Waterproofing",
    "Welding & Fabrication",
    "Garage Doors",
    "Blinds & Curtains",
    "Cabinet Making",
    "Decking",
    "Drainage",
    "Gas Fitting",
    "Irrigation",
    "Rubbish Removal",
    "Shed Building",
    "Splashbacks",
    "Stump Removal",
    "Surveying",
    "Other"
] as const;

export type LocationData = {
    [state: string]: {
        [city: string]: string[];
    };
};

export const AUSTRALIA_LOCATIONS: LocationData = {
    "VIC": {
        "Geelong": [
            "Anakie", "Armstrong Creek", "Barwon Heads", "Belmont", "Clifton Springs",
            "Corio", "Drysdale", "East Geelong", "Geelong", "Geelong West",
            "Grovedale", "Hamlyn Heights", "Highton", "Lara", "Leopold",
            "Moolap", "Newcomb", "Newtown", "Norlane", "North Geelong",
            "Ocean Grove", "Portarlington", "South Geelong", "Thomson", "Torquay",
            "Waurn Ponds", "Whittington"
        ],
        "Melbourne": [
            "Albert Park", "Armadale", "Ascot Vale", "Ashburton", "Bentleigh",
            "Box Hill", "Brighton", "Brunswick", "Bundoora", "Carlton",
            "Camberwell", "Cheltenham", "Clayton", "Coburg", "Collingwood",
            "Craigieburn", "Cranbourne", "Dandenong", "Doncaster", "Doncaster East",
            "Epping", "Essendon", "Fitzroy", "Footscray", "Frankston",
            "Glen Waverley", "Hawthorn", "Heidelberg", "Hoppers Crossing", "Keilor",
            "Knox", "Lalor", "Lilydale", "Melbourne CBD", "Mentone",
            "Moonee Ponds", "Moorabbin", "Mordialloc", "Mount Waverley", "Mulgrave",
            "Narre Warren", "Noble Park", "Northcote", "Nunawading", "Oakleigh",
            "Pakenham", "Point Cook", "Preston", "Richmond", "Ringwood",
            "Rowville", "South Yarra", "Springvale", "St Kilda", "Sunbury",
            "Sunshine", "Surrey Hills", "Tarneit", "Thomastown", "Tullamarine",
            "Wantirna", "Werribee", "Williamstown", "Windsor", "Yarraville"
        ],
        "Ballarat": [
            "Alfredton", "Ballarat Central", "Ballarat East", "Ballarat North",
            "Brown Hill", "Delacombe", "Epping", "Invermay Park", "Miners Rest",
            "Mount Clear", "Mount Helen", "Nerrina", "Sebastopol", "Wendouree"
        ],
        "Bendigo": [
            "Bendigo", "Epsom", "Flora Hill", "Golden Square", "Kangaroo Flat",
            "Kennington", "Maiden Gully", "Strathdale", "Strathfieldsaye"
        ],
    },
    "NSW": {
        "Sydney": [
            "Ashfield", "Auburn", "Bankstown", "Baulkham Hills", "Blacktown",
            "Bondi", "Bondi Junction", "Botany", "Burwood", "Campbelltown",
            "Castle Hill", "Chatswood", "Cronulla", "Dee Why", "Epping",
            "Fairfield", "Glebe", "Gordon", "Hornsby", "Hurstville",
            "Kogarah", "Lane Cove", "Liverpool", "Manly", "Marrickville",
            "Miranda", "Mosman", "Newtown", "North Sydney", "Parramatta",
            "Penrith", "Randwick", "Redfern", "Ryde", "St Ives",
            "St Leonards", "Strathfield", "Surry Hills", "Sydney CBD", "Ultimo",
            "Wahroonga", "Wentworthville", "Westmead", "Windsor", "Woollahra"
        ],
        "Newcastle": [
            "Adamstown", "Broadmeadow", "Charlestown", "Glendale", "Hamilton",
            "Jesmond", "Kotara", "Lambton", "Mayfield", "Merewether",
            "New Lambton", "Newcastle CBD", "Shortland", "Wallsend", "Waratah"
        ],
        "Wollongong": [
            "Albion Park", "Corrimal", "Dapto", "Figtree", "Fairy Meadow",
            "Helensburgh", "Kiama", "Nowra", "Port Kembla", "Shellharbour",
            "Thirroul", "Unanderra", "Wollongong CBD"
        ],
        "Central Coast": [
            "Avoca Beach", "Bateau Bay", "Gosford", "Kariong", "Killarney Vale",
            "Niagara Park", "Terrigal", "Tuggerah", "Umina Beach", "Wamberal",
            "Warnervale", "Wyong"
        ],
    },
    "QLD": {
        "Brisbane": [
            "Annerley", "Ashgrove", "Aspley", "Bowen Hills", "Brisbane CBD",
            "Brookside", "Bulimba", "Capalaba", "Carindale", "Chermside",
            "Cleveland", "Coorparoo", "Darra", "Eight Mile Plains", "Everton Park",
            "Fortitude Valley", "Greenslopes", "Hamilton", "Holland Park", "Indooroopilly",
            "Inala", "Ipswich", "Kedron", "Keperra", "Logan",
            "Lutwyche", "Moorooka", "Mount Gravatt", "Nundah", "Paddington",
            "Redcliffe", "Redlands", "Rochedale", "Rocklea", "Sandgate",
            "Springwood", "Stafford", "Sunnybank", "Taringa", "Toowong",
            "Upper Mount Gravatt", "Virginia", "Wavell Heights", "Willowbank", "Woolloongabba"
        ],
        "Gold Coast": [
            "Arundel", "Ashmore", "Benowa", "Biggera Waters", "Broadbeach",
            "Bundall", "Burleigh Heads", "Coomera", "Coolangatta", "Currumbin",
            "Helensvale", "Hope Island", "Labrador", "Main Beach", "Miami",
            "Mudgeeraba", "Nerang", "Oxenford", "Palm Beach", "Parkwood",
            "Robina", "Runaway Bay", "Southport", "Surfers Paradise", "Tugun",
            "Upper Coomera", "Varsity Lakes"
        ],
        "Sunshine Coast": [
            "Buderim", "Caloundra", "Coolum Beach", "Forest Glen", "Kawana Waters",
            "Maleny", "Maroochydore", "Mooloolaba", "Nambour", "Noosa Heads",
            "Noosaville", "Sippy Downs", "Tewantin", "Woombye"
        ],
        "Townsville": [
            "Aitkenvale", "Belgian Gardens", "Condon", "Cranbrook", "Douglas",
            "Garbutt", "Idalia", "Kirwan", "Mount Louisa", "Mundingburra",
            "North Ward", "Pimlico", "Rasmussen", "Rowes Bay", "Townsville CBD"
        ],
    },
    "WA": {
        "Perth": [
            "Armadale", "Baldivis", "Balga", "Bassendean", "Bayswater",
            "Belmont", "Bentley", "Burns Beach", "Butler", "Canning Vale",
            "Cannington", "Carlisle", "Clarkson", "Cloverdale", "Cockburn",
            "Como", "Cottesloe", "Ellenbrook", "Fremantle", "Girrawheen",
            "Gosnells", "Greenwood", "Hamilton Hill", "Innaloo", "Joondalup",
            "Joondanna", "Karrinyup", "Kelmscott", "Kenwick", "Kingsley",
            "Leederville", "Leeming", "Mandurah", "Marangaroo", "Melville",
            "Midland", "Mirrabooka", "Morley", "Mount Lawley", "Mount Pleasant",
            "Mundaring", "Nollamara", "North Perth", "Northbridge", "O'Connor",
            "Osborne Park", "Perth CBD", "Rockingham", "Scarborough", "South Perth",
            "Spearwood", "Stirling", "Subiaco", "Swan View", "Victoria Park",
            "Wanneroo", "Wembley", "Whitford", "Willeton", "Yokine"
        ],
    },
    "SA": {
        "Adelaide": [
            "Adelaide CBD", "Aldinga Beach", "Belair", "Blackwood", "Brighton",
            "Campbelltown", "Christie Downs", "Christies Beach", "Edwardstown", "Elizabeth",
            "Enfield", "Glenelg", "Glenside", "Golden Grove", "Hallett Cove",
            "Henley Beach", "Hillcrest", "Holden Hill", "Kensington", "Kilburn",
            "Lonsdale", "Magill", "Marion", "Mawson Lakes", "Mitcham",
            "Modbury", "Morphett Vale", "Mount Barker", "Mount Gambier", "Munno Para",
            "Noarlunga", "Norwood", "O'Halloran Hill", "Para Hills", "Parafield Gardens",
            "Port Adelaide", "Prospect", "Salisbury", "Semaphore", "St Marys",
            "Tea Tree Gully", "Torrensville", "Unley", "Victor Harbor", "Walkerville",
            "Woodville"
        ],
    },
    "ACT": {
        "Canberra": [
            "Belconnen", "Bruce", "Canberra CBD", "Casey", "Chifley",
            "Dickson", "Fadden", "Florey", "Gungahlin", "Kaleen",
            "Kingston", "Lyneham", "Macquarie", "Manuka", "Molonglo Valley",
            "Narrabundah", "Ngunnawal", "Palmerston", "Queanbeyan", "Reid",
            "Scullin", "Tuggeranong", "Weston Creek", "Woden", "Wright"
        ],
    },
    "TAS": {
        "Hobart": [
            "Battery Point", "Bellerive", "Claremont", "Glenorchy", "Hobart CBD",
            "Howrah", "Kingston", "Lindisfarne", "Moonah", "New Town",
            "Rosny", "Sandy Bay", "Sorell", "West Hobart"
        ],
        "Launceston": [
            "Devonport", "Kings Meadows", "Launceston CBD", "Newstead", "Newnham",
            "Prospect Vale", "Riverside", "Rocherlea", "South Launceston", "Youngtown"
        ],
    },
    "NT": {
        "Darwin": [
            "Bakewell", "Coconut Grove", "Darwin CBD", "Fannie Bay", "Humpty Doo",
            "Karama", "Leanyer", "Malak", "Millner", "Moil",
            "Nightcliff", "Palmerston", "Rapid Creek", "Stuart Park", "Tiwi",
            "Wanguri", "Woodroffe"
        ],
    },
};
