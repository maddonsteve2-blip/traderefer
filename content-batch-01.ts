// =============================================================================
// TRADEREFER CONTENT — BATCH 01
// Suburbs 1–10 | Trade Hiring Tips Trades 1–10
// Research-backed, AU-specific content
// =============================================================================

// =============================================================================
// SECTION 1: SUBURB_CONTEXT ADDITIONS (batch 01, suburbs 1–10)
// Paste these into the existing SUBURB_CONTEXT object in constants.ts
// =============================================================================

/*
Add to SUBURB_CONTEXT:
*/

"geelong": {
    housing: "Geelong's housing really depends on which part of town you're in. The inner ring — think Pakington Street side of things — has a solid chunk of late Victorian and Edwardian homes, plus some Federation-era workers' cottages that have been renovated to within an inch of their lives. Move north toward Corio or Norlane and it shifts to 1950s–1970s Housing Commission brick, a lot of it still on original wiring and old galvanised pipes. The CBD fringe has seen a wave of medium-density apartments since about 2005.",
    climate: "Corio Bay throws strong southerly winds at the city for much of the year — roofs and gutters here take a proper beating. Summers are warm and dry but not brutal like western Victoria; winters bring cold snaps and occasional frost in low-lying pockets. It rains enough to keep moss growing on older south-facing roofs.",
    council: "City of Greater Geelong",
    region: "Central Geelong",
    tradeNotes: {
        "Roofing": "A lot of the Federation and Edwardian homes have original Marseille terracotta tiles that are brittle after a century of those Bay southerlies — replacement sourcing can be tricky. Colorbond re-roofs are increasingly common but heritage overlays in some streets restrict material choice.",
        "Plumbing": "Older inner-Geelong properties frequently have galvanised iron supply pipes from the 1950s–1970s era which corrode internally and reduce water pressure noticeably. Cast iron drainage is also common in the pre-1960s stock — worth scoping before quoting on renos.",
        "Electrical": "The Housing Commission estates in Corio and Norlane have substantial amounts of original 1960s–1970s wiring still in service — ceramic fuses, no RCDs, and single-core TPS that's well past its expected life.",
    },
},

"adelaide-cbd": {
    housing: "The Adelaide CBD proper is mostly commercial with a growing apartment population — Heritage-listed bluestone and sandstone buildings from the 1850s–1880s sit alongside post-war brutalist office conversions and modern high-rise towers that have gone up since the 2010s rezoning. Original residential stock is thin on the ground inside the Pennington Terrace boundary, though the terrace houses on the southern grid near Hutt Street are genuinely old — some pre-date Federation.",
    climate: "Adelaide summers are no joke — the CBD bakes regularly above 40°C and the urban heat island makes it worse. Northerly winds from the interior carry heat and dust before the cool change arrives from the south-west. Very low humidity most of the year which is good for painting but brutal on unsealed timber. Winters are mild and Mediterranean — light frosts are possible but rare in the city itself.",
    council: "City of Adelaide",
    region: "Adelaide CBD & Inner City",
    tradeNotes: {
        "Electrical": "Many of the converted heritage buildings have had multiple electrical upgrades layered over original wiring — expect to find old and new systems cohabiting in strange ways inside walls that are often solid bluestone or sandstone, making cable runs genuinely difficult.",
        "Plumbing": "The CBD has ageing stormwater and sewer infrastructure running under its original 1870s street grid. Trade plumbers working in basements of heritage buildings frequently encounter pre-metric lead and cast iron drainage that needs careful handling under SA EPA requirements.",
        "Building": "Heritage overlay applies to large parts of the CBD grid — any structural or facade work on pre-1900 buildings requires City of Adelaide heritage officer sign-off and must comply with the SA Heritage Act 1993. Builders unfamiliar with sandstone construction technique shouldn't be quoting on this work.",
    },
},

"armadale": {
    housing: "Armadale in Perth's south-east is a suburb of several distinct eras jammed together. The older central areas around the rail line date from the 1960s–1970s — brick and tile homes on generous blocks with established trees. Push further out toward Haynes or Harrisdale and it's brand new double-brick estates from the 2010s onward. The fringe is still semi-rural in character with acreage properties on sandy loam soils that have serious drainage challenges after rain.",
    climate: "Perth's eastern suburbs run hotter in summer than coastal areas — Armadale sits in a heat corridor that regularly hits 43–44°C in January and February. There's no sea breeze relief here; the Fremantle Doctor doesn't reach this far east until late afternoon if it comes at all. Winters are mild and fairly wet by Perth standards, with the Darling Scarp catching more rainfall than the coast.",
    council: "City of Armadale",
    region: "South-East Perth",
    tradeNotes: {
        "Pest Control": "Armadale has active termite pressure year-round — the sandy soils and remnant bushland at the Scarp edge are ideal habitat for subterranean termite species including Coptotermes acinaciformis. Pre-purchase inspections and chemical barriers are especially important for any property backing onto the bush.",
        "Landscaping": "The soil across most of Armadale is deep, fine sand with very low water-holding capacity — anything planted without irrigation establishment and appropriate soil amelioration will struggle through summer. Retaining walls on sloped blocks near the Scarp require careful drainage design given the hydraulic pressures during winter rains.",
        "Roofing": "A fair proportion of the 1970s–1980s housing stock is still running on original concrete roof tiles that are now reaching end of life — colour bond re-roofs have been popular here for a decade, and there's demand for sarking upgrades given the extreme summer heat.",
    },
},

"battery-point": {
    housing: "Battery Point is essentially a living museum of early colonial architecture — there's nowhere else in Australia quite like it. Streets like Colville and Napoleon are lined with Georgian sandstone cottages, workers' terraces, and Victorian villas built mostly between the 1840s and 1890s. The suburb is heritage-listed at both state and national level. Arthur's Circus has cottages from as early as the 1840s still in residential use. You almost never see a post-1980 building here; the Heritage Area controls are tight.",
    climate: "Cool temperate Hobart climate — frosts are common in winter and Battery Point's hillside position catches the cold southerlies off the Derwent estuary. The humidity and salt air coming off Sullivan's Cove affect the maintenance cycle of timber, ironwork and masonry noticeably faster than inland suburbs. Annual rainfall is modest but persistent.",
    council: "City of Hobart",
    region: "Inner Hobart / Sullivan's Cove",
    tradeNotes: {
        "Building": "Any structural or renovation work in Battery Point triggers Heritage Tasmania review — you'll need a heritage assessment for anything beyond internal cosmetics, and the Heritage of Tasmania Act 1995 is enforced firmly here. Builders without experience in sandstone, hand-made brick, and lime mortar will come unstuck quickly.",
        "Plumbing": "A significant number of Battery Point properties still have lead service pipes from the late 19th century, and cast iron or earthenware drainage that predates the 1960s. Plumbers need to be cautious about disrupting heritage fabric during excavation — the streetscape archaeology here is legitimate.",
        "Painting": "Pre-1950 homes throughout Battery Point have lead paint as a near-certainty — often in multiple layers over original limewash. Painters must comply with AS 4361.2 (Guide to Lead Paint Management) and the Safe Work Australia lead paint removal guidelines. DIY stripping without testing is a recurring problem here.",
    },
},

"auburn": {
    housing: "Auburn in the Cumberland LGA is dense and varied. The older streets closest to the town centre have 1920s–1940s bungalows on standard 556 sqm blocks, but from the 1960s onward the suburb filled in fast with three-storey walk-up flats — the kind built after the 1961 Strata Title Act made unit development viable. More recent development has pushed toward higher density again, with several six-storey apartment blocks going up near the rail station in the last decade.",
    climate: "Auburn sits in the Western Sydney heat corridor — summer temperatures here routinely sit 4–6°C above the coastal beaches and 40°C days are normal in January. Duck Creek and the Haslams Creek floodplain create localised flooding risk in heavy rain events, and the area gets intense summer afternoon thunderstorms. Winter is mild and mostly dry.",
    council: "Cumberland City Council",
    region: "Western Sydney",
    tradeNotes: {
        "Plumbing": "The high proportion of 1960s–1970s walk-up flat blocks means a lot of aging copper and galvanised iron pipe in multi-tenancy situations — shared riser replacements are common and need co-ordination across multiple owners under the Strata Schemes Management Act 2015 (NSW). Duck Creek's flooding history means some lower-lying properties have chronic stormwater drainage problems.",
        "Electrical": "A large portion of the older flat stock still has outdated switchboards — ceramic fuses rather than circuit breakers, no RCD protection on power circuits, and wiring that pre-dates AS/NZS 3000:1991. IPART and Ausgrid have flagged Western Sydney as a priority area for electrical safety upgrades in older multi-unit stock.",
        "Pest Control": "Subterranean termites are active in Auburn — the combination of older timber-framed homes, established street trees and the moisture corridor along Duck Creek creates prime conditions. White ant inspections before any purchase or renovation are strongly recommended.",
    },
},

"bakewell": {
    housing: "Bakewell is a planned suburb of Palmerston, developed mostly through the 1990s and early 2000s. The housing is almost entirely 1990s–2000s era brick veneer with colourbond or concrete tile roofing — built to the post-Cyclone Tracy standards that became mandatory in the NT after 1975. You'll see wide eaves, elevated slab-on-ground construction to allow airflow, and light-coloured external cladding to manage the heat. Typical block size is around 600–700 sqm. Not a lot of character housing, but it's solid and purpose-built for the tropics.",
    climate: "Tropical wet-dry climate — the wet season runs November through April and dumps around 1,700mm of rain in those six months, with humidity pushing above 85% regularly. The dry season is spectacular but building work in the wet is challenging. Cyclone risk is real — Bakewell is within the NT cyclone planning zone and all new construction must meet Category 3 wind loads under AS 4055.",
    council: "City of Palmerston",
    region: "Palmerston / Greater Darwin",
    tradeNotes: {
        "Roofing": "Post-Tracy construction standards mean most roofs in Bakewell have cyclone-rated tie-down connections — any roofing work must maintain or upgrade these to current standards, particularly batten-to-rafter and rafter-to-top-plate connections. Inspections after wet season storms are worth recommending to any homeowner.",
        "Air Conditioning & Heating": "Air conditioning is non-negotiable in Bakewell rather than optional — every home has it, and systems work extremely hard from October through April against sustained 32–36°C days with near-100% humidity. Refrigerant charge and coil fouling are common issues given the continuous runtime; annual servicing is the norm here, not every few years.",
        "Pest Control": "The Darwin region has the most aggressive termite pressure in Australia — Mastotermes darwiniensis, the giant northern termite, is present in this area and can cause damage that makes the southern Coptotermes species look timid. Pre-construction barriers and ongoing monitoring are essential rather than optional.",
    },
},

"carrum-downs": {
    housing: "Carrum Downs didn't really become a suburb until the 1980s — before that it was market gardens and the occasional dairy. The bulk of the housing stock is 1980s–1990s brick veneer on 500–700 sqm blocks, pretty typical of south-east Melbourne fringe development from that era. Newer estates have appeared on the old farming edges since 2010, but the dominant character is that 30–40 year old established suburban housing. Some of the original homes are starting to show their age.",
    climate: "Frankston and Carrum Downs sit near the bottom of Port Phillip Bay, which brings a moderating coastal influence — summers are milder than the northern Melbourne suburbs by several degrees, but the south-westerly winds off Bass Strait in winter are persistent and cold. Rainfall is spread through the year with a winter peak. Salt-laden air from the Bay affects metal roofing and fascia more than inland equivalents.",
    council: "City of Frankston",
    region: "Frankston / South-East Melbourne",
    tradeNotes: {
        "Roofing": "The late 1980s–1990s concrete tile roofs across most of Carrum Downs are now 30–40 years old and many have lost their colour coat — they're absorbing water and adding weight to roof structures not designed for that. Recoating or replacement is a growing demand in this suburb.",
        "Fencing": "The combination of sandy coastal soil and moisture from the Bay means timber fence posts rot at the base faster than in drier areas — hardwood or treated pine specified to H4 or H5 is really the only sensible choice for any fencing job here. A lot of the original 1990s colorbond has also oxidised and is due for replacement.",
        "Concreting": "Carrum Downs sits on reactive clay in places and softer sandy loam in others — ground conditions vary considerably even street to street. Footings and slabs need proper soil investigation; subsidence cracks in 1990s driveways and paths are a common complaint.",
    },
},

"annerley": {
    housing: "Annerley is classic inner-south Brisbane — a suburb of Queenslanders on big blocks, many built between 1910 and 1940, interspersed with post-war fibro and brick housing from the 1950s–1960s and a growing number of townhouse infill developments from the last 20 years. The original Queenslanders vary enormously in condition — some have been meticulously restored, others are still in original rough-as-guts condition waiting for buyers with patience and cash. Block sizes run around 400–600 sqm on the older streets.",
    climate: "Subtropical Brisbane — hot and humid summers (December–March) with thunderstorm activity that can be intense, mild dry winters. Annerley's 6km proximity to the CBD means it doesn't get as much relief from sea breezes as the bayside suburbs. Timber in this climate weathers fast if not maintained — Queenslanders with unpainted or poorly sealed hardwood are a recurring problem.",
    council: "Brisbane City Council",
    region: "Inner South Brisbane",
    tradeNotes: {
        "Carpentry": "Annerley has a high density of raised Queenslanders with original hardwood framing, VJ lining boards and timber floors — skilled in-demand work involves restoring or replicating these elements rather than replacing with modern materials. Sub-floor timber in the older homes is frequently damaged by moisture and the occasional termite that gets past the barriers.",
        "Pest Control": "Subterranean termites are a genuine risk in Annerley's older timber housing stock — particularly in homes where sub-floor ventilation has been blocked up or downpipes direct water under the house. Pre-purchase inspections are almost mandatory before buying any pre-1970 home here.",
        "Painting": "The subtropical humidity means exterior paint on Annerley's Queenslanders degrades faster than on equivalent homes in drier climates — mould on north-facing eaves and under-house joinery is common. Lead paint is essentially guaranteed on pre-1970 homes and painters must manage it under the Safe Work Australia guidelines.",
    },
},

"baldivis": {
    housing: "Baldivis is one of Perth's fastest-growing southern corridors — most of the suburb has been built since 2000, and development is still happening at the northern and eastern edges. The typical house is a 2005–2020 double brick and colourbond or concrete tile home on a 400–500 sqm block, in one of several named estates. The soil under virtually everything here is deep sand — great drainage, minimal reactive clay, but very poor bearing capacity for footings and almost no fertility for gardens without serious soil work.",
    climate: "Mediterranean Perth climate — hot dry summers with north-easterlies bringing fierce heat from the interior, and mild wet winters. Being 46km south of Perth and inland from the coast, Baldivis misses a lot of the Fremantle Doctor sea breeze and summer temperatures here track higher than Rockingham town centre by a few degrees. The southern suburbs don't get the moderation of the northern sea breezes.",
    council: "City of Rockingham",
    region: "Southern Perth / Rockingham",
    tradeNotes: {
        "Landscaping": "The deep coastal sand across all of Baldivis is nutrient-poor and has near-zero water retention — every new lawn and garden here needs significant soil amendment (organics, water-saving polymer gels) and an efficient drip or pop-up reticulation system to survive summer. Perth's Level 2 sprinkler restrictions mean irrigation design has to be efficient by default.",
        "Solar & Energy": "Baldivis has exceptional solar irradiance typical of Perth — 5.5+ peak sun hours per day annually — and the newer housing stock here is well-suited to rooftop solar. Many homes in the 2010s estates are now looking at battery storage add-ons as Synergy feed-in tariffs have dropped.",
        "Pest Control": "Sandy coastal soils throughout Baldivis provide ideal tunnelling conditions for subterranean termites, and the proximity to remnant banksia and paperbark vegetation in the local bushland reserves keeps the pressure high. Pre-construction soil treatments and reticulated chemical barriers are standard practice for new builds here.",
    },
},

"canning-vale": {
    housing: "Canning Vale was swampy market-garden country until the late 1970s, then residential estates started going up from the mid-1980s onward. The western portion (City of Canning side) has a lot of 1990s double brick homes on around 500–700 sqm, while the eastern sections toward Gosnells are a mix of older 1980s brick and some newer infill. The suburb is quite large and the character varies noticeably between the older established streets and the newer cul-de-sac estates near the industrial park.",
    climate: "Inland southern Perth — Canning Vale misses the coastal moderation of Fremantle and Cockburn, so summers are genuinely hot with temperatures regularly hitting 40°C. The old wetland character of the area means it retains groundwater longer than surrounding suburbs after winter rain, which has implications for footings and landscaping. Winters are mild but wetter than the Perth average, reflecting the area's lower elevation.",
    council: "City of Canning (west of Nicholson Road) / City of Gosnells (east of Nicholson Road)",
    region: "Southern Perth",
    tradeNotes: {
        "Electrical": "Canning Vale has the highest concentration of electrical businesses per suburb in the TradeRefer platform — the large industrial estate along Bannister Road drives significant commercial and industrial electrical demand alongside the residential base. Tradespeople here work across domestic and light industrial in the same week routinely.",
        "Concreting": "The former wetland sections of Canning Vale have variable soil — some areas sit on soft peat-influenced ground that has poor bearing capacity. Driveways and paths in these sections can settle and crack if not properly founded. A soil test before any slab work is worthwhile in the low-lying eastern sections.",
        "Pest Control": "The original swampy character of Canning Vale created timber decay and moisture conditions that subterranean termites love — even in newer homes, the residual soil moisture in some pockets is higher than neighbouring suburbs. Post-construction inspections every 12 months are recommended by Archicentre for properties built before 2000 here.",
    },
},


// =============================================================================
// SECTION 2: TRADE_HIRING_TIPS (trades 1–10 of 30)
// This is a partial build of the TRADE_HIRING_TIPS constant.
// Paste these entries into the full constant once all batches are done.
// =============================================================================

/*
Add to TRADE_HIRING_TIPS:
*/

"Plumbing": [
    {
        title: "Verify Their Plumbing Licence",
        body: "Every plumber doing licensed work in Australia must hold a current state or territory licence — check it on your state regulator's public register (e.g. Fair Trading NSW, VBA in Victoria, QBCC in Queensland, Building and Energy in WA). A licence number should be on their quote or website; if they can't produce one, walk away.",
    },
    {
        title: "Ask for a Certificate of Compliance",
        body: "In most states, licensed plumbing work must be inspected and a Certificate of Compliance (or equivalent) issued to you as the owner — in Victoria it's called a Certificate of Plumbing Compliance, in QLD it's a Form 4. Get this in writing before final payment; you'll need it for insurance claims and property resale.",
    },
    {
        title: "Check Their Public Liability Cover",
        body: "Reputable plumbers carry public liability insurance of at least $5 million — ask to see the current certificate of currency before work starts. If a plumber floods your bathroom or damages a wall and they're uninsured, you're the one dealing with it.",
    },
    {
        title: "Get At Least Two Itemised Quotes",
        body: "Plumbing pricing varies significantly — labour rates, call-out fees, and parts markups differ widely between operators. Ask each trade to itemise materials separately from labour so you can compare apples with apples. Be wary of very cheap quotes that lump everything together; hidden materials costs are a common surprise.",
    },
    {
        title: "Ask Whether They Use Licensed Drainers",
        body: "In some states, drainage work requires a separate drainer's licence on top of a plumber's licence — not all plumbers hold both. If your job involves drainage connections to the sewer or stormwater, confirm they're licensed for drainage work specifically, not just internal plumbing.",
    },
    {
        title: "Clarify After-Hours and Emergency Rates Upfront",
        body: "Emergency call-outs on weekends and public holidays can hit $250–$400 per hour in major cities — make sure you know the rate structure before you're in a crisis. Good plumbers publish their after-hours rates clearly; ones who won't quote this upfront tend to surprise you on the invoice.",
    },
],

"Electrical": [
    {
        title: "Check Their Electrical Contractor Licence",
        body: "All electrical work in Australia must be carried out by a licensed electrical contractor or a licensed electrician working under one. Check the licence on your state regulator's register — Energy Safe Victoria (ESV), NSW Fair Trading, QBCC, Building and Energy WA, or Consumer and Business Services SA. Unlicensed electrical work is illegal and voids your home insurance.",
    },
    {
        title: "Ensure They Issue a Compliance Certificate",
        body: "In every Australian state and territory, new electrical installation work requires a Certificate of Electrical Safety (or equivalent) issued to the homeowner — in NSW it's a Certificate of Compliance Electrical Work, in Victoria an Electrical Safety Certificate. This document proves the work was tested and complies with AS/NZS 3000. Keep it with your house records.",
    },
    {
        title: "Confirm RCD Protection on All Circuits",
        body: "Australian Standard AS/NZS 3000 requires RCD (residual current device) protection on all power and lighting circuits in new work. If an electrician isn't mentioning RCDs as part of a switchboard upgrade or new installation, that's a red flag. RCDs save lives — older homes without them on all circuits are a genuine safety risk.",
    },
    {
        title: "Ask About Their Experience With Your Wiring Era",
        body: "Pre-1980s homes in Australia may have aluminium wiring, rubber-insulated cables (TRS), or old ceramic fuse boards — all require specific expertise. Ask the electrician directly whether they've worked on homes from your era. Getting this wrong doesn't just mean a failed inspection; it means a fire risk.",
    },
    {
        title: "Get Quotes That Separate Labour and Materials",
        body: "Electrical quotes that bundle everything into one price make it impossible to check whether you're being charged reasonable rates for materials. Switchboard components, cable, conduit and fittings are standard items with known costs — a transparent electrician will show you both.",
    },
    {
        title: "Check Their Solar or EV Charger Accreditation Separately",
        body: "A licensed electrician can wire an EV charger or connect a solar inverter, but installing a solar PV system requires Clean Energy Council (CEC) accreditation on top of the electrical licence. If you're getting solar, confirm the installer is on the CEC's approved installer list — it's also a condition of the federal STC rebate.",
    },
],

"Carpentry": [
    {
        title: "Check Licensing Thresholds in Your State",
        body: "Carpentry doesn't have a single national licence, but building work above certain dollar thresholds requires a builder's or contractor's licence in most states — $5,000 in NSW (Fair Trading), $3,300 in QLD (QBCC), and similar in other states. A carpenter quoting above those thresholds without a licence is working illegally.",
    },
    {
        title: "Ask About Timber Framing Standards",
        body: "Structural carpentry in Australia must comply with AS 1684 Residential Timber Framing Code — this covers span tables, connection requirements, and bracing. If a carpenter can't name the standard their framing work is built to, or doesn't reference an engineer's specification for anything non-standard, push for more detail.",
    },
    {
        title: "Confirm They Have Public Liability Insurance",
        body: "Even for smaller jobs, a working carpenter should carry public liability insurance — $10 million is the industry standard for tradespeople doing structural work. Ask for the current certificate of currency before they start. This covers you if they damage your home or cause injury on site.",
    },
    {
        title: "Ask Whether They're Doing the Work Themselves",
        body: "It's common for carpentry quotes to come from a company that then subcontracts the actual work to whoever is available that week. Ask directly who will be on your tools — this matters for skill consistency on things like staircase construction, heritage joinery, or custom cabinetry where experience shows.",
    },
    {
        title: "Understand the Difference Between a Chippy and a Joiner",
        body: "In Australia, a carpenter typically does structural and site work — framing, roofing, formwork, door-hanging — while a joiner does factory-made fitted work like cabinets, staircases, and window frames. For kitchen or bathroom joinery, you want someone who specialises in that; a site carpenter may not have the same fine tolerance skills.",
    },
    {
        title: "Get a Written Scope Before Any Timber Starts",
        body: "Timber pricing is volatile — hardwood, LVL, and treated pine have all seen significant price movement since 2021. Make sure your quote locks in materials pricing and specifies the timber grades being used. Vague quotes that say 'supply and fix framing' without specifying species and grade leave you open to substitution with cheaper stock.",
    },
],

"Landscaping": [
    {
        title: "Check If a Licence Is Needed for Your Project",
        body: "General landscaping doesn't require a licence in most Australian states, but specific components often do — retaining walls over 1m in height typically need a building permit and may require an engineer, irrigation plumbing needs a licensed plumber in most states, and excavation near services needs notification under Dial Before You Dig (1100). A landscaper who handles all this without flagging it is cutting corners.",
    },
    {
        title: "Ask About Irrigation Design and Water Efficiency",
        body: "Every Australian state has water-use restrictions that apply to residential irrigation — in WA the Waterwise program, in SA the Water Sensitive Urban Design framework, and various council by-laws elsewhere. A good landscaper designs irrigation to comply with these restrictions from the start rather than retrofitting a compliant system after council complains.",
    },
    {
        title: "Understand the Soil Conditions Before Quoting Plants",
        body: "Australia has wildly variable soils — Perth's coastal sand, Adelaide's reactive clay, Sydney's clay-over-shale, Darwin's seasonally saturated tropical soil. A landscaper who plants the same palette across different soil conditions is guessing, not designing. Ask them what amendments they're including in the quote and why.",
    },
    {
        title: "Get a Detailed Plant Schedule With Sizes",
        body: "Landscaping quotes can look similar on paper but vary enormously in plant size — a 200mm pot versus a 45L specimen of the same species is years of growth and double the price. Ask for the plant schedule to specify pot sizes (in litres) or heights for every line item. Vague quotes are a source of post-project disputes.",
    },
    {
        title: "Confirm Retaining Wall Design Complies With Council",
        body: "Retaining walls are one of the most commonly under-permitted landscaping elements in Australia. Most councils require a building permit for walls over 1m in height and engineering certification for walls over 1.5m. A landscaper who says 'you don't need a permit for that' without checking your specific council's requirements is exposing you to a stop-work order.",
    },
    {
        title: "Ask About Their Supplier Relationships",
        body: "Quality landscapers source from local wholesale nurseries and established turf farms rather than retail garden centres — it's cheaper and the stock tends to be more acclimatised to your local climate. Ask who their nursery suppliers are; it's a quick indicator of how serious they are about the trade versus dabbling.",
    },
],

"Roofing": [
    {
        title: "Verify Their Roofing Licence or Builder Registration",
        body: "In Victoria, roofing work requires registration with the Victorian Building Authority (VBA). In NSW, roofing contractors need a licence from NSW Fair Trading. QLD requires a QBCC roofing licence. A roofer who can't produce their licence number or registration details should not be on your roof — the work won't be insurable and they can't legally issue the compliance documents you'll need.",
    },
    {
        title: "Confirm Cyclone or High-Wind Rating Where Applicable",
        body: "Properties in Queensland, Northern Territory, and coastal Western Australia must have roofing installed to meet specific wind categories under AS 4055 — the cyclone-rated fixings, batten spans, and tie-down connections are not optional. If your suburb is in a designated wind region, ask the roofer what wind category they're designing to before they quote.",
    },
    {
        title: "Ask About Sarking and Insulation in the Quote",
        body: "Many older Australian homes have no sarking (foil or membrane underlay) beneath their tiles or metal roofing — it's required on new roofs under the NCC and recommended on re-roofs for energy efficiency and moisture control. A roofer who doesn't mention sarking in a re-roof quote is either planning to skip it or hasn't thought about it.",
    },
    {
        title: "Check What Warranty They Offer on Labour",
        body: "Materials have manufacturer warranties (Colorbond is typically 10–15 years on coating, Monier tiles have similar), but the installation workmanship warranty is separate and comes from the roofer. Ask what labour warranty they provide in writing — reputable operators offer at least 5 years on their own workmanship, some offer 10.",
    },
    {
        title: "Get Clarity on What the Quote Includes for Guttering",
        body: "Re-roofing quotes sometimes include gutters and downpipes and sometimes don't — this can be a $3,000–$8,000 variation on a typical house. Ask specifically whether fascia boards, gutters, downpipes, and valley flashing are included or excluded from the scope. Surprises at the end of a roof job are expensive.",
    },
    {
        title: "Ask Whether Domestic Building Insurance Is Included",
        body: "In Victoria, domestic building work over $16,000 requires the builder to take out Domestic Building Insurance (DBI) before starting — this protects you if the roofer goes broke, dies, or disappears before completing the job. In NSW it's called Home Building Compensation Fund cover. Ask for the certificate before work commences.",
    },
],

"Painting": [
    {
        title: "Check Whether They Need a Contractor Licence",
        body: "In NSW, painting work over $5,000 requires a contractor licence from NSW Fair Trading — check the public register before engaging anyone for a larger job. In QLD, the QBCC licence is required for painting contracts over $3,300. Some states treat painting as a subcomponent of general building, so ask your state's consumer protection authority if you're unsure.",
    },
    {
        title: "Ask How They Handle Lead Paint",
        body: "Homes built before 1970 in Australia are very likely to have lead paint somewhere — older ones almost certainly have it everywhere. Painters must follow AS 4361.2 (Guide to Lead Paint Management Residential) and Safe Work Australia guidelines for lead removal. Ask any painter quoting on a pre-1970 home whether they'll test first and how they manage dust containment and disposal.",
    },
    {
        title: "Understand the Difference Between a Quote and an Estimate",
        body: "A quote is a fixed price — the painter must honour it regardless of how long the job takes. An estimate is a guide only, and you can end up paying more. Get everything in writing as a formal quote, specifying the paint brand and sheen level, number of coats, surface preparation method, and any exclusions.",
    },
    {
        title: "Ask What Preparation They're Including",
        body: "Preparation — filling, sanding, priming bare timber, cleaning mould — is where cheap quotes save money and where the difference between a paint job that lasts 5 years versus one that peels in 18 months is decided. Ask specifically what surface prep is included in the quote, especially on exterior timber in a coastal or humid climate.",
    },
    {
        title: "Confirm the Paint Brand and Product Line",
        body: "There's a significant quality difference between budget and premium paint lines — Dulux Weathershield or Taubmans Endure for exterior work versus a builder-grade product is measurable in a wet Australian climate. Ask what brand and specific product they're using, and check that it's appropriate for your surface type (rendered masonry, weatherboard, fibre cement) and climate zone.",
    },
    {
        title: "Get References on Similar Jobs in Your Climate",
        body: "A painter with a strong track record in Queensland's subtropical humidity knows things about mould prevention and paint adhesion that a painter who has only worked in dry inland areas doesn't. Ask for references from jobs within the last 2–3 years in your suburb or similar climate — and actually call them.",
    },
],

"Cleaning": [
    {
        title: "Check Whether They Hold a Police Check for Domestic Work",
        body: "For residential cleaning where the operator has unsupervised access to your home, reputable companies in Australia conduct police checks on all staff. Ask whether this is part of their hiring process — it's a reasonable question and a good indication of how seriously they approach the domestic trust relationship. Some states (e.g. QLD) have specific requirements for in-home service workers.",
    },
    {
        title: "Confirm They Hold Public Liability Insurance",
        body: "Cleaners working in your home should carry public liability insurance — minimum $5 million is standard for the industry. If they break something, spill chemicals on your engineered timber floors, or cause damage to an appliance, you need to know they're insured. Ask for the certificate of currency, not just a verbal confirmation.",
    },
    {
        title: "Ask Whether They're a Sole Trader or a Company With Employees",
        body: "Sole traders and small cleaning companies operate very differently — a sole trader is usually the person doing the cleaning, while larger companies send different staff each visit. If consistency and getting to know the cleaner matters to you, ask who will actually be in your home and whether that changes week to week.",
    },
    {
        title: "Understand What Products They Use and Whether You Can Request Alternatives",
        body: "Some Australian households have specific requirements — no synthetic fragrances for people with chemical sensitivities, no ammonia-based products around stone benchtops, or a preference for plant-based cleaners. Ask upfront what brand of products they use; most professional cleaners are happy to accommodate requests if you ask before booking.",
    },
    {
        title: "Clarify What's Included in an End-of-Lease Clean",
        body: "End-of-lease cleaning in Australia is governed by your tenancy agreement and the Residential Tenancies Act in your state. The bond return depends on the premises being returned in a comparable condition to the ingoing inspection report — not necessarily perfect. Get a quote that specifies exactly what's included: oven interior, window tracks, carpet steam, walls, etc.",
    },
    {
        title: "Ask About Their Cancellation and Re-Clean Policy",
        body: "If you're not happy with the result, a professional cleaning company should offer a free re-clean within 24–48 hours — most reputable operators have this written into their terms. Check before booking whether this applies to their services, and read the cancellation policy carefully as many companies charge for short-notice cancellations.",
    },
],

"Building": [
    {
        title: "Verify Their Builder's Licence Before Signing Anything",
        body: "In every Australian state and territory, residential building work above a set threshold requires a licensed builder — check the register in your state (VBA in Victoria, NSW Fair Trading, QBCC in Queensland, Building and Energy WA, CBS in SA, CBOS in Tasmania, NTG in the NT, or Access Canberra in the ACT). Never sign a contract or pay a deposit to a builder who won't show you their current licence number.",
    },
    {
        title: "Confirm Mandatory Home Warranty Insurance Is in Place",
        body: "In most Australian states, domestic building work over a certain value requires the builder to hold Domestic Building Insurance (Victoria), Home Building Compensation Fund cover (NSW), or equivalent in your state. This protects you if the builder becomes insolvent, dies, or disappears before or during the project. Ask to see the certificate before works commence — it's a legal requirement and your protection.",
    },
    {
        title: "Use a Written Contract — Not Just a Quote",
        body: "Under the Domestic Building Contracts Act (VIC), Home Building Act (NSW), and equivalent legislation in other states, builders must provide a written contract for work over set thresholds. The contract must include the fixed price or method of calculating price, start and completion dates, and deposit limits. In Victoria the deposit is capped at 5% of the contract price — if a builder asks for more upfront, that's illegal.",
    },
    {
        title: "Check Their Track Record With Your Project Type",
        body: "Building a custom home, renovating a heritage terrace, and constructing a granny flat are fundamentally different projects. Ask specifically what similar projects they've completed in the last 3 years and ask to see them or speak to those clients. A volume builder is not the right choice for a heritage restoration, no matter how cheap their quote is.",
    },
    {
        title: "Understand the Progress Payment Schedule",
        body: "Building contracts in Australia have legislated progress payment stages — base, frame, lock-up, fixing, and completion. You should only pay for a stage after it passes inspection. Ask your builder how inspections are handled and whether they use an independent building inspector or rely solely on the certifier. An independent inspector at each stage is money well spent.",
    },
    {
        title: "Ask Who Is Actually Running Your Project Day-to-Day",
        body: "Some builders are excellent salespeople and poor site managers — the person who sold you the job may never appear on your site again. Ask directly who will be the site supervisor for your project, how many projects they're supervising at once, and how often they'll be on your site. The answer tells you a lot about how the job will actually run.",
    },
],

"Concreting": [
    {
        title: "Check Licensing Requirements for Your State",
        body: "Standalone concreting work doesn't have a universal national licence in Australia, but work above value thresholds typically falls under general building or specialist trade contractor licensing — in NSW, a specialist contractor licence from Fair Trading is required for concreting work over $5,000. In other states, check with your local consumer protection authority before engaging anyone for a structural concrete pour.",
    },
    {
        title: "Specify the Concrete Strength Grade in the Quote",
        body: "Concrete is specified by strength — 20 MPa for footings, 25 MPa for standard driveways and paths, 32 MPa for structural slabs under buildings. Ask your concreter what strength they're ordering and confirm it's appropriate for your application. Vague quotes that just say 'concrete driveway' without specifying the grade leave you with no recourse if the concrete dusts or cracks early.",
    },
    {
        title: "Understand the Role of Reinforcement",
        body: "Steel reinforcement (mesh or bars) is not optional in most structural concrete work — slabs-on-ground for habitable rooms, driveways subject to vehicle loads, and all footings require steel as specified under AS 3600 and your structural engineer's drawings. A concreter who skips reo to save cost is compromising structural integrity, full stop.",
    },
    {
        title: "Ask About Curing Practice",
        body: "Concrete needs to cure slowly and evenly to develop its full strength — in hot Australian summers, a fresh slab exposed to full sun and drying wind can lose moisture too quickly and crack. Ask how the concreter manages curing: shade cloth, wet hessian, curing compound, or misting. This is especially important for decorative and exposed aggregate finishes.",
    },
    {
        title: "Get Clarity on Expansion Joints",
        body: "Large concrete slabs without control joints will crack — not might crack, will crack. Ask where the contractor is planning to cut control joints (typically every 3m in plain concrete), and whether any movement joints are included at the junction with your house footings. Missing control joints are the number one cause of concrete driveway complaints in Australia.",
    },
    {
        title: "Check How They'll Handle Existing Drainage",
        body: "Concrete work — especially large driveways and paved areas — significantly affects how water flows across your property. Any concreting that directs stormwater toward your house, your neighbour's property, or a public footpath is a potential dispute and possibly a DA condition breach. Ask the concreter how drainage is accounted for in their design and whether any stormwater connections are needed.",
    },
],

"Tiling": [
    {
        title: "Check Licensing for Your State",
        body: "Tiling licensing requirements vary — in Queensland, wall and floor tiling requires a QBCC trade contractor licence. In NSW, tiling generally falls under the building contractor framework for work over $5,000. In Victoria, tiling is an unlicensed trade but work connected to waterproofing — showers, wet areas — must have the waterproofing membrane installed by a licensed waterproofer. Understand which rules apply to your project before hiring.",
    },
    {
        title: "Ask About Waterproofing — Separately From Tiling",
        body: "In wet areas (showers, bathrooms, laundries), the waterproofing membrane under the tiles is a separate critical element to the tiling itself. Under AS 3740 (Waterproofing of Domestic Wet Areas), it must be applied by a qualified person and inspected before tiling commences. A tiler who quotes to do both without mentioning an inspection step is skipping a compliance requirement.",
    },
    {
        title: "Understand Slip Resistance Ratings for Floors",
        body: "Australian Standard AS 4586 sets slip resistance ratings for floor tiles — different ratings apply to wet barefoot areas (like pool surrounds and showers), commercial entries, and dry indoor floors. If a tiler can't tell you the wet slip resistance rating (R or P rating) of the floor tile they're recommending for your bathroom, that's a gap in their knowledge that becomes your problem when someone slips.",
    },
    {
        title: "Get the Layout and Grout Colour Agreed in Writing",
        body: "Tile layout — brick bond, herringbone, straight set, starting point — and grout colour are decisions that seem minor until you see them installed and hate the result. Get these confirmed in writing before any adhesive goes down. Rectifying a tiled floor because the layout wasn't agreed on paper is expensive and avoidable.",
    },
    {
        title: "Ask How They Handle Large Format Tiles",
        body: "Large format porcelain tiles (600x600 or bigger) require a flatter substrate, a different adhesive (typically a non-slump, large format adhesive), and more skill in handling than standard 300x300 ceramic. Ask your tiler directly about their experience with large format and what flatness tolerance they work to — AS 3958.1 specifies a 3mm tolerance over 3m for adhesive-fixed tiles.",
    },
    {
        title: "Confirm Tile Quantities and Over-Order Policy",
        body: "The standard Australian industry practice is to order 10% extra tiles for cuts, breakage, and future repairs. Ask your tiler whether the quote includes this over-order and whether surplus tiles will be left with you for future patching. Running out of a discontinued tile batch mid-project — or two years later when one cracks — is a recurring problem that's easily avoided.",
    },
],
