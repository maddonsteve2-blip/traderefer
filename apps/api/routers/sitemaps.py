import re
from fastapi import APIRouter, Depends
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from services.database import get_db

router = APIRouter()

BASE_URL = "https://traderefer.au"
CHUNK_SIZE = 5000

# ── Helpers ──────────────────────────────────────────────────────────────

def _slug(text_: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", text_.lower()).strip("-")

def _xml_response(body: str) -> Response:
    return Response(
        content=body,
        media_type="application/xml",
        headers={"Cache-Control": "public, max-age=86400, stale-while-revalidate=3600"},
    )

def _urlset(urls: list[str]) -> str:
    inner = "\n".join(urls)
    return f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n{inner}\n</urlset>'

def _url(loc: str, lastmod: str, freq: str, priority: str) -> str:
    return f"  <url><loc>{loc}</loc><lastmod>{lastmod}</lastmod><changefreq>{freq}</changefreq><priority>{priority}</priority></url>"

def _extract_postcode(address: str | None) -> str | None:
    if not address:
        return None
    m = re.search(r"\b(\d{4})\b", address)
    return m.group(1) if m else None

# ── Near-me slugs (mirrors constants.ts) ─────────────────────────────────

NEAR_ME_SLUGS = [
    "plumbers-near-me", "electricians-near-me", "carpenters-near-me",
    "landscapers-near-me", "roofers-near-me", "painters-near-me",
    "cleaners-near-me", "builders-near-me", "concreters-near-me",
    "tilers-near-me", "plasterers-near-me", "fencers-near-me",
    "demolition-contractors-near-me", "excavators-near-me",
    "air-conditioning-specialists-near-me", "solar-installers-near-me",
    "pest-controllers-near-me", "tree-loppers-near-me", "gardeners-near-me",
    "lawn-mowing-near-me", "pool-technicians-near-me",
    "bathroom-renovators-near-me", "kitchen-renovators-near-me",
    "flooring-specialists-near-me", "glaziers-near-me",
    "gutter-installers-near-me", "handymen-near-me",
    "insulation-installers-near-me", "locksmiths-near-me", "pavers-near-me",
    "renderers-near-me", "scaffolders-near-me",
    "security-system-installers-near-me", "shopfitters-near-me",
    "signwriters-near-me", "stonemasons-near-me", "waterproofers-near-me",
    "welders-near-me", "garage-door-installers-near-me",
    "blind-installers-near-me", "cabinet-makers-near-me",
    "decking-specialists-near-me", "drainage-contractors-near-me",
    "gas-fitters-near-me", "irrigation-specialists-near-me",
    "rubbish-removal-near-me", "shed-builders-near-me",
    "splashback-installers-near-me", "stump-removal-near-me",
]

FIND_TRADE_PAGES = ["find-a-plumber-near-me", "find-an-electrician-near-me"]

LOCAL_TRADE_PAGES = ["local/gutter-cleaning-geelong", "local/asbestos-removal-bendigo",
                     "local/bathroom-renovations-perth"]

JOB_TYPES: dict[str, list[str]] = {
    "Plumbing": ["blocked drain repair","hot water system installation","hot water system replacement","leaking tap repair","burst pipe repair","toilet repair and replacement","pipe relining","CCTV drain inspection","backflow prevention testing","sewer line replacement","bathroom renovation plumbing","gas hot water system repair","water leak detection","rainwater tank installation","thermostatic mixing valve installation"],
    "Electrical": ["switchboard upgrade","safety switch installation","power point installation","lighting installation","ceiling fan installation","smoke alarm installation","electrical fault finding","home rewiring","NBN point installation","TV antenna installation","test and tag","EV charger installation","split system air conditioner electrical","home automation and smart wiring","security camera and CCTV wiring"],
    "Carpentry": ["timber deck construction","pergola building","door frame repair and replacement","built-in wardrobe installation","timber staircase construction","skirting board installation","timber fence and gate construction","window and door installation","timber retaining wall construction","wall framing and structural carpentry","timber cladding installation","floating floor installation","balustrade and handrail installation","outdoor privacy screen installation","formwork carpentry"],
    "Landscaping": ["landscape design","retaining wall construction","backyard landscaping","front yard landscaping","artificial turf installation","outdoor living area design","native garden design","paving and pathways","garden bed construction","garden bed edging","decking installation","turf laying","garden lighting installation","landscape construction"],
    "Roofing": ["roof leak repair","roof tile replacement","Colorbond roof installation","roof restoration","roof painting","ridge capping repair","metal roof replacement","roof flashing repair","gutter guard installation","skylight installation","whirlybird installation","roof inspection","emergency roof repair","asbestos roof removal","roof rebedding and repointing"],
    "Painting": ["interior painting","exterior painting","house painting","roof painting","spray painting","fence painting","kitchen cupboard painting","deck staining and painting","colour consultation","strata painting","wallpaper removal","feature wall painting","ceiling painting","commercial painting","weatherboard painting"],
    "Cleaning": ["end of lease cleaning","bond cleaning","office cleaning","carpet steam cleaning","window cleaning","pressure washing","deep cleaning","hoarder clean-up","oven cleaning","strata cleaning","commercial kitchen cleaning","mould cleaning and removal","after-builders cleaning","NDIS cleaning","upholstery cleaning"],
    "Building": ["home extension and addition","granny flat construction","bathroom renovation","kitchen renovation and remodel","new home build and construction","structural wall removal","second storey addition","property renovation and refurbishment","carport and garage construction","Colorbond shed and outbuilding construction","retaining wall construction","concrete slab and foundation work","duplex and dual occupancy construction","knockdown rebuild","house raising and restumping"],
    "Concreting": ["concrete driveway installation","exposed aggregate driveway","concrete slab for shed","coloured concrete","concrete path installation","honed concrete","stamped concrete patio","concrete pool surrounds","concrete cutting","concrete grinding and polishing","concrete resurfacing","stencilled concrete","house slab pouring","concrete retaining wall","concrete repair and crack filling"],
    "Tiling": ["bathroom tiling","kitchen splashback tiling","floor tiling","wall tiling","outdoor tiling","pool tiling","waterproofing and tiling","tile removal","laundry tiling","balcony tiling","tile regrouting","mosaic tiling","large format tiling","herringbone tiling","bathroom renovation tiling"],
    "Plastering": ["gyprock installation","gyprock repair","cornice installation","ceiling plastering","wall patching","plaster crack repair","ornamental plastering","plasterboard installation","ceiling rose installation","square set plastering","suspended ceiling installation","water damage plaster repair","Villaboard installation","plaster sanding and finishing","steel stud framing"],
    "Fencing": ["Colorbond fencing installation","timber paling fence installation","pool fencing installation","glass pool fencing","aluminium pool fencing","pool fence compliance inspection","boundary fence replacement","retaining wall construction","front fence installation","Colorbond fence with lattice top","security fencing","picket fence installation","aluminium slat fencing","farm fencing","fence gate installation"],
    "Demolition": ["house demolition","asbestos removal","partial demolition","strip-out demolition","commercial demolition","concrete removal","garage demolition","demolition and site clearing","pool demolition","shed demolition and removal","brick wall demolition","knockdown rebuild","demolition permit application","asbestos testing and inspection"],
    "Excavation": ["site cut and fill","pool excavation","bobcat hire","excavator hire","trench digging","land clearing","rock hammering","foundation excavation","basement excavation","mini excavator hire","driveway excavation","retaining wall excavation","stump and tree removal","levelling and grading"],
    "Air Conditioning & Heating": ["split system air conditioner installation","ducted air conditioning installation","air conditioner repair and service","multi-split air conditioning installation","ducted gas heating installation","evaporative cooling installation","air conditioning cleaning and maintenance","ducted heating repair","air conditioner replacement","zone control system installation","ceiling cassette air conditioner installation","hydronic heating installation","gas ducted heating to reverse cycle conversion"],
    "Solar & Energy": ["solar panel installation","solar battery installation","solar system repair and maintenance","solar inverter replacement","EV charger installation","hot water heat pump installation","solar hot water system installation","solar system upgrade","off-grid solar system installation","commercial solar installation","solar panel cleaning","home energy audit","solar feed-in tariff optimisation"],
    "Pest Control": ["termite inspection","termite treatment","termite barrier installation","pre-purchase pest inspection","cockroach treatment","possum removal","rodent control","bed bug treatment","spider spray","ant treatment","white ant treatment","flea treatment","wasp removal","bee removal","end of lease pest control"],
    "Tree Lopping & Removal": ["tree removal","tree lopping","stump grinding","tree pruning","palm tree removal","dead tree removal","emergency tree removal","tree trimming","land clearing","arborist report","tree root removal","branch removal","powerline clearance","council tree removal permit","mulch supply and wood chipping"],
    "Gardening & Lawn Care": ["garden maintenance","hedge trimming","garden clean-up","weed removal and spraying","mulching","pruning","garden bed maintenance","native plant installation","green waste removal","pre-sale garden makeover","fertilising and lawn feeding","garden design","planting services","pest and disease treatment","leaf removal and autumn clean-up"],
    "Mowing": ["lawn mowing","ride-on mowing","acreage mowing","lawn edging","grass slashing","buffalo grass care","Sir Walter turf maintenance","kikuyu lawn care","lawn aeration","lawn fertilising","nature strip mowing","regular lawn mowing service","commercial lawn mowing","top dressing","lawn weed control"],
    "Pool & Spa": ["pool fence inspection","pool resurfacing","green pool clean-up","pool pump repair","pool equipment installation","salt chlorinator installation","pool compliance certificate","pool heating installation","pool leak detection","pool maintenance service","spa repair","pool filter cleaning","pool tile repair","pool safety inspection"],
    "Bathroom Renovation": ["bathroom demolition and rebuild","bathroom tiling","bathroom waterproofing","bathroom waterproofing certificate","frameless shower screen installation","bath to shower conversion","vanity installation","wall-hung vanity installation","floor-to-ceiling tiles bathroom","bathroom stripout","ensuite renovation","small bathroom renovation","shower screen replacement","bathroom tap installation","bath resurfacing"],
    "Kitchen Renovation": ["stone benchtop installation","Caesarstone benchtop installation","flat-pack kitchen installation","kitchen island bench installation","rangehood installation","kitchen splashback installation","kitchen cabinet replacement","kitchen demolition and rebuild","kitchen benchtop replacement","kitchen plumbing relocation","kitchen sink installation","budget kitchen renovation","kitchen electrical upgrade","custom kitchen cabinetry","kitchen renovation project management"],
    "Flooring": ["timber floor sanding and polishing","vinyl plank installation","hybrid flooring installation","carpet laying","engineered timber flooring installation","laminate flooring installation","floating floor installation","timber floor repair","polished concrete flooring","carpet removal","floor levelling","bamboo flooring installation","staircase sanding and polishing","epoxy flooring","timber floor staining"],
    "Glazing & Windows": ["broken window repair","double glazing retrofit","window replacement","shower screen installation","glass balustrade installation","emergency glass replacement","pet door installation glass","fly screen repair","security screen door installation","glass splashback installation","window reglazing","pool fencing glass","sliding door glass replacement","commercial shopfront glazing","mirror installation"],
    "Guttering": ["gutter replacement","gutter cleaning","gutter guard installation","downpipe repair","fascia and soffit repair","Colorbond gutter installation","gutter leak repair","leaf guard installation","Zincalume gutter installation","box gutter repair","downpipe installation","rainwater tank connection to gutters","gutter resealing","stormwater drainage repair","roof plumbing services"],
    "Handyman": ["furniture assembly and flat-pack installation","door repair and replacement","picture and mirror hanging","TV wall mounting","gutter cleaning and repair","flyscreen repair and replacement","curtain rod and blind installation","plaster and drywall repair","fence and gate repair","shelving installation","deck maintenance and oiling","clothesline installation","smoke alarm installation and replacement","general property maintenance","minor plumbing repairs"],
    "Insulation": ["ceiling insulation installation","wall insulation installation","underfloor insulation","insulation batts installation","spray foam insulation","insulation removal and replacement","acoustic insulation","roof insulation top-up","cavity wall insulation","garage door insulation","thermal imaging assessment","commercial insulation","reflective foil insulation","blown-in insulation"],
    "Locksmith": ["emergency lockout service","lock change and replacement","deadbolt installation","key cutting","car lockout service","master key system installation","restricted key system","digital lock installation","lock rekeying","window lock installation","screen door lock replacement","after-hours locksmith","safe opening and repair","transponder key programming","commercial locksmith services"],
    "Paving": ["brick paving installation","driveway paving","concrete paver installation","sandstone paving","pool paving","travertine paving","paver repair and relaying","patio paving","garden path paving","limestone paving","bluestone paving","crazy paving","permeable paving","paver sealing and cleaning"],
    "Rendering": ["cement rendering","acrylic rendering","texture coating","render repair","house rendering","coloured render","polystyrene rendering","blueboard rendering","Hebel rendering","fence rendering","retaining wall rendering","concrete resurfacing","render crack repair","bagging"],
    "Scaffolding": ["scaffolding hire residential","scaffolding hire commercial","mobile scaffold tower hire","Kwikstage scaffolding hire","scaffolding erection and dismantle","scaffold for painting","scaffold for roof access","aluminium scaffolding hire","scaffolding for renovations","edge protection scaffolding","scaffolding for rendering","shrink wrap scaffolding","scaffolding safety inspection"],
    "Security Systems": ["CCTV installation","home alarm system installation","security camera installation","intercom system installation","back-to-base monitoring","access control system installation","smart home security system","alarm system upgrade","video doorbell installation","motion sensor installation","security system servicing","commercial CCTV installation","security lighting installation","alarm monitoring service"],
    "Shopfitting": ["retail shop fit-out","restaurant and cafe fit-out","office fit-out and refurbishment","commercial joinery and custom fixtures","retail display unit design","bar and pub fit-out","medical and dental practice fit-out","pharmacy fit-out","gym and fitness studio fit-out","beauty salon fit-out","shopping centre tenancy fit-out","commercial signage and branding installation","franchise and retail rollout fit-out","shop strip-out and make-good","kiosk and pop-up shop fit-out"],
    "Signwriting": ["shop front signage","vehicle signwriting","vehicle wrapping","building signage","LED sign installation","window frosting","A-frame signs","banner printing","vinyl lettering","3D lettering signage","lightbox signage","construction site signage","fleet vehicle graphics","wall graphics and murals","real estate signage"],
    "Stonemasonry": ["sandstone restoration","stone cladding installation","sandstone wall repair","stone retaining wall construction","stone fireplace installation","heritage stonework restoration","natural stone paving","granite benchtop installation","sandstone steps installation","stone feature wall","stone letterbox construction","sandstone pool surrounds","stone column installation","bluestone paving"],
    "Waterproofing": ["bathroom waterproofing","shower waterproofing","balcony waterproofing","basement waterproofing","waterproofing membrane installation","leaking shower repair","leaking balcony repair","roof waterproofing","retaining wall waterproofing","waterproofing over tiles","planter box waterproofing","laundry waterproofing","crack injection waterproofing","wet area waterproofing certificate","remedial waterproofing"],
    "Welding & Fabrication": ["steel fabrication","aluminium welding","handrail fabrication","gate fabrication","mobile welding","structural steel installation","metal fence fabrication","stainless steel fabrication","welding repairs","custom metalwork","steel staircase fabrication","trailer repairs","balustrade installation","emergency welding repair"],
    "Garage Doors": ["garage door repair","roller door repair","automatic garage door opener installation","garage door spring replacement","panel lift door installation","Colorbond garage door installation","garage door motor replacement","tilt door repair and conversion","garage door remote programming","new garage door installation","garage door servicing and maintenance","roller door motor installation","emergency garage door repair","commercial roller shutter repair","garage door track replacement"],
    "Blinds & Curtains": ["roller blinds installation","plantation shutters installation","venetian blinds installation","curtain installation","outdoor blinds installation","motorised blinds installation","blockout blinds installation","curtain track installation","roman blinds installation","vertical blinds installation","sheer curtains installation","blind repair","security roller shutters","honeycomb blinds installation","awning installation"],
    "Cabinet Making": ["custom kitchen cabinetry","bathroom vanity custom build","built-in wardrobe and robe fitout","entertainment unit and TV cabinet","laundry cabinetry and storage","kitchen cabinet resurfacing","custom home office and study desk","butlers pantry cabinetry","custom bookshelf and shelving","garage storage and workshop cabinetry","window seat and bench seat with storage","antique furniture restoration","commercial reception desk","kitchen benchtop replacement"],
    "Decking": ["Merbau decking installation","composite decking installation","hardwood decking installation","timber deck restoration","deck oiling and staining","deck sanding and sealing","treated pine decking installation","elevated deck construction","pool decking installation","deck repair and replacement","timber deck board replacement","Spotted Gum decking installation","deck balustrade installation","outdoor entertaining area construction"],
    "Drainage": ["stormwater drainage installation","French drain installation","ag pipe installation","blocked drain clearing","soak well installation","stormwater pit installation","drain camera inspection","sewer drainage repair","surface drainage systems","yard drainage solutions","downpipe and gutter drainage","retaining wall drainage","subsurface drainage","hydro jetting drain cleaning"],
    "Gas Fitting": ["gas leak detection and repair","gas cooktop installation","gas heater installation","gas hot water system installation","gas bayonet point installation","gas appliance servicing","gas line installation","gas BBQ connection","gas to electric conversion","gas heater removal and disconnection","gas compliance certificate","carbon monoxide testing","gas pool heater installation"],
    "Irrigation": ["irrigation system installation","sprinkler system installation","drip irrigation installation","reticulation installation","reticulation repairs","irrigation system repair","bore water system installation","garden irrigation design","pop-up sprinkler installation","smart irrigation controller installation","irrigation system maintenance","automatic watering system","lawn irrigation","irrigation solenoid replacement","waterwise irrigation"],
    "Rubbish Removal": ["skip bin hire","green waste removal","hard rubbish collection","deceased estate clean-up","construction waste removal","e-waste disposal","furniture removal and disposal","same-day rubbish removal","commercial rubbish removal","mattress removal","garage clean-out","demolition waste removal","appliance removal","hoarder house clean-up","property pre-sale clean-out"],
    "Shed Building": ["Colorbond shed installation","garage construction","barn shed construction","farm shed construction","garden shed installation","workshop shed construction","shed concrete slab preparation","shed council approval","custom steel shed construction","Colorbond garage installation","shed kit assembly and erection","liveable shed construction","carport construction","machinery shed construction","cyclone-rated shed installation"],
    "Splashbacks": ["glass splashback installation","tiled splashback installation","mirror splashback installation","acrylic splashback installation","kitchen splashback replacement","bathroom splashback installation","laundry splashback installation","coloured glass splashback","printed splashback","splashback behind cooktop","subway tile splashback","pressed metal splashback","stainless steel splashback installation"],
    "Stump Removal": ["stump grinding","tree stump removal","root grinding","palm stump removal","land clearing stump removal","house restumping","house reblocking","pier replacement","house relevelling","concrete stump replacement","steel stump installation","partial restumping","foundation underpinning"],
    "Surveying": ["boundary survey","title re-establishment survey","contour and detail survey","subdivision survey","building setout survey","identification survey","strata plan survey","feature and level survey","topographic survey","fence line survey","easement survey","property boundary marking","drone survey"],
}


# ── Endpoints ─────────────────────────────────────────────────────────────

@router.get("/sitemaps/general")
async def sitemap_general(db: AsyncSession = Depends(get_db)):
    """Static pages, states, cities, near-me, trades/job hub pages."""
    from datetime import date
    today = date.today().isoformat()

    urls: list[str] = []

    # Static pages
    statics = [
        (BASE_URL, "1.0", "daily"),
        (f"{BASE_URL}/businesses", "0.9", "daily"),
        (f"{BASE_URL}/categories", "0.95", "weekly"),
        (f"{BASE_URL}/locations", "0.95", "weekly"),
        (f"{BASE_URL}/local", "0.9", "weekly"),
        (f"{BASE_URL}/contact", "0.5", "monthly"),
        (f"{BASE_URL}/terms", "0.3", "monthly"),
        (f"{BASE_URL}/privacy", "0.3", "monthly"),
        (f"{BASE_URL}/cookies", "0.2", "monthly"),
    ]
    for loc, pri, freq in statics:
        urls.append(_url(loc, today, freq, pri))

    # State hubs
    state_rows = await db.execute(text("""
        SELECT DISTINCT LOWER(state) as s FROM businesses
        WHERE status='active' AND state IS NOT NULL AND state != ''
    """))
    for r in state_rows.mappings():
        urls.append(_url(f"{BASE_URL}/local/{r['s']}", today, "weekly", "0.9"))

    # City hubs
    city_rows = await db.execute(text("""
        SELECT DISTINCT LOWER(state) as s, LOWER(REPLACE(city,' ','-')) as c
        FROM businesses WHERE status='active'
          AND state IS NOT NULL AND state != ''
          AND city IS NOT NULL AND city != ''
    """))
    for r in city_rows.mappings():
        urls.append(_url(f"{BASE_URL}/local/{r['s']}/{r['c']}", today, "weekly", "0.85"))

    # Near-me pages
    for slug in NEAR_ME_SLUGS:
        urls.append(_url(f"{BASE_URL}/{slug}", today, "weekly", "0.95"))

    # Find-a-trade pages
    for slug in FIND_TRADE_PAGES:
        urls.append(_url(f"{BASE_URL}/{slug}", today, "weekly", "0.95"))

    # Local trade editorial pages
    for slug in LOCAL_TRADE_PAGES:
        urls.append(_url(f"{BASE_URL}/{slug}", today, "weekly", "0.9"))

    # Trade hub pages (/trades/[job-slug])
    for jobs in JOB_TYPES.values():
        for job in jobs:
            urls.append(_url(f"{BASE_URL}/trades/{_slug(job)}", today, "monthly", "0.8"))

    return _xml_response(_urlset(urls))


@router.get("/sitemaps/profiles")
async def sitemap_profiles(db: AsyncSession = Depends(get_db)):
    """All active business profile pages /b/[slug]."""
    result = await db.execute(text("""
        SELECT slug,
               COALESCE(updated_at, created_at)::date AS lastmod
        FROM businesses
        WHERE status='active' AND slug IS NOT NULL AND slug != ''
        ORDER BY created_at ASC
    """))
    rows = result.mappings().all()
    urls = [
        _url(f"{BASE_URL}/b/{r['slug']}", str(r['lastmod']), "weekly", "0.5")
        for r in rows
    ]
    return _xml_response(_urlset(urls))


@router.get("/sitemaps/suburbs")
async def sitemap_suburbs(db: AsyncSession = Depends(get_db)):
    """All suburb-level hub pages /local/[state]/[city]/[suburb-postcode]."""
    from datetime import date
    today = date.today().isoformat()
    result = await db.execute(text("""
        SELECT DISTINCT
               LOWER(state) as s,
               LOWER(REPLACE(city,' ','-')) as c,
               LOWER(REPLACE(suburb,' ','-')) as sub,
               MAX(address) as addr
        FROM businesses
        WHERE status='active'
          AND state IS NOT NULL AND state != ''
          AND city IS NOT NULL AND city != ''
          AND suburb IS NOT NULL AND suburb != ''
        GROUP BY LOWER(state), LOWER(REPLACE(city,' ','-')), LOWER(REPLACE(suburb,' ','-'))
    """))
    rows = result.mappings().all()
    urls = []
    for r in rows:
        pc = _extract_postcode(r['addr'])
        sub = f"{r['sub']}-{pc}" if pc else r['sub']
        urls.append(_url(f"{BASE_URL}/local/{r['s']}/{r['c']}/{sub}", today, "weekly", "0.75"))
    return _xml_response(_urlset(urls))


@router.get("/sitemaps/trades")
async def sitemap_trades(db: AsyncSession = Depends(get_db)):
    """All suburb+trade landing pages /local/[state]/[city]/[suburb]/[trade]."""
    from datetime import date
    today = date.today().isoformat()
    result = await db.execute(text("""
        SELECT LOWER(state) as s,
               LOWER(REPLACE(city,' ','-')) as c,
               LOWER(REPLACE(suburb,' ','-')) as sub,
               trade_category,
               MAX(COALESCE(updated_at, created_at))::date AS lastmod,
               MAX(address) as addr
        FROM businesses
        WHERE status='active'
          AND state IS NOT NULL AND state != ''
          AND city IS NOT NULL AND city != ''
          AND suburb IS NOT NULL AND suburb != ''
          AND trade_category IS NOT NULL AND trade_category != ''
        GROUP BY LOWER(state), LOWER(REPLACE(city,' ','-')), LOWER(REPLACE(suburb,' ','-')), trade_category
    """))
    rows = result.mappings().all()
    urls = []
    for r in rows:
        pc = _extract_postcode(r['addr'])
        sub = f"{r['sub']}-{pc}" if pc else r['sub']
        trade = _slug(r['trade_category'])
        lm = str(r['lastmod']) if r['lastmod'] else today
        urls.append(_url(f"{BASE_URL}/local/{r['s']}/{r['c']}/{sub}/{trade}", lm, "weekly", "0.7"))
    return _xml_response(_urlset(urls))


@router.get("/sitemaps/top")
async def sitemap_top(db: AsyncSession = Depends(get_db)):
    """All /top/[trade]/[state]/[city] pages."""
    from datetime import date
    today = date.today().isoformat()
    result = await db.execute(text("""
        SELECT DISTINCT
               trade_category,
               LOWER(state) as s,
               LOWER(REPLACE(city,' ','-')) as c
        FROM businesses
        WHERE status='active'
          AND trade_category IS NOT NULL
          AND state IS NOT NULL
          AND city IS NOT NULL
          AND avg_rating > 0
          AND total_reviews > 0
        ORDER BY trade_category, s, c
    """))
    rows = result.mappings().all()
    urls = []
    for r in rows:
        trade = _slug(r['trade_category'])
        urls.append(_url(f"{BASE_URL}/top/{trade}/{r['s']}/{r['c']}", today, "weekly", "0.8"))
    return _xml_response(_urlset(urls))


@router.get("/sitemaps/jobs/{chunk}")
async def sitemap_jobs_chunk(chunk: int, db: AsyncSession = Depends(get_db)):
    """Chunked job-type URL sitemaps (reserved for future crawl-budget expansion)."""
    from datetime import date
    today = date.today().isoformat()
    if chunk < 0:
        return Response("Not Found", status_code=404)

    result = await db.execute(text("""
        SELECT DISTINCT
               LOWER(state) as s,
               LOWER(REPLACE(city,' ','-')) as c,
               LOWER(REPLACE(suburb,' ','-')) as sub,
               trade_category
        FROM businesses
        WHERE status='active'
          AND state IS NOT NULL AND state != ''
          AND city IS NOT NULL AND city != ''
          AND suburb IS NOT NULL AND suburb != ''
          AND trade_category IS NOT NULL AND trade_category != ''
    """))
    rows = result.mappings().all()

    all_urls: list[str] = []
    for r in rows:
        trade_slug = _slug(r['trade_category'])
        for job in JOB_TYPES.get(r['trade_category'], []):
            all_urls.append(
                _url(f"{BASE_URL}/local/{r['s']}/{r['c']}/{r['sub']}/{trade_slug}/{_slug(job)}",
                     today, "monthly", "0.65")
            )

    chunk_urls = all_urls[chunk * CHUNK_SIZE: (chunk + 1) * CHUNK_SIZE]
    return _xml_response(_urlset(chunk_urls))
