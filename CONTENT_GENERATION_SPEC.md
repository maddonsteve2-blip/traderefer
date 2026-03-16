# TradeRefer Content Generation Spec

## Purpose

Generate unique, factual SEO content for TradeRefer.au programmatic pages.
This content will be inserted into the TypeScript constants file at `apps/web/lib/constants.ts`.
All content must be **factually accurate for Australia**, not generic filler.

---
## TASK 1: SUBURB_CONTEXT Expansion

Generate suburb context objects for the suburbs listed below.
Each entry populates a callout on the trade page providing genuinely useful local context.

### Required TypeScript Format

```typescript
"suburb-slug": {
    housing: "description of typical housing stock and era",
    climate: "local climate conditions relevant to trade work",
    council: "local council name",
    region: "region/area name",
    tradeNotes: {
        "Trade Category": "1-2 sentence note specific to THIS trade in THIS suburb. Must reference real local conditions.",
    },
},
```

### Rules
- `housing`: Mention the **era** (e.g. 1960s–1980s) and **type** (brick veneer, weatherboard, terrace, etc)
- `climate`: Must be **locally accurate** — coastal salt air, western plains heat, tropical humidity, etc
- `council`: The **actual local council name** (e.g. 'City of Parramatta', 'Brisbane City Council')
- `region`: Geographic region (e.g. 'Inner West Sydney', 'Gold Coast Hinterland')
- `tradeNotes`: Only include trades where there's a **genuinely local factor** (soil type, heritage, climate, etc). 2-4 trades per suburb is ideal. Don't force notes for trades where there's nothing suburb-specific to say.

### Suburbs Needing Context (sorted by business count)

| Slug | Suburb | City | State | Businesses |
|------|--------|------|-------|-----------|
| geelong | Geelong | Geelong | VIC | 269 |
| adelaide-cbd | Adelaide CBD | Adelaide | SA | 151 |
| armadale | Armadale | Perth | WA | 142 |
| battery-point | Battery Point | Hobart | TAS | 142 |
| auburn | Auburn | Parramatta | NSW | 139 |
| bakewell | Bakewell | Darwin | NT | 135 |
| carrum-downs | Carrum Downs | Melbourne | VIC | 131 |
| annerley | Annerley | Brisbane | QLD | 125 |
| baldivis | Baldivis | Rockingham | WA | 124 |
| canning-vale | Canning Vale | Perth | WA | 123 |
| ashfield | Ashfield | Sydney | NSW | 121 |
| kings-meadows | Kings Meadows | Launceston | TAS | 120 |
| beaumaris | Beaumaris | Melbourne | VIC | 118 |
| baulkham-hills | Baulkham Hills | Parramatta | NSW | 117 |
| bendigo | Bendigo | Bendigo | VIC | 115 |
| capalaba | Capalaba | Brisbane | QLD | 115 |
| balga | Balga | Perth | WA | 114 |
| aspley | Aspley | Brisbane | QLD | 112 |
| balwyn | Balwyn | Melbourne | VIC | 111 |
| bankstown | Bankstown | Liverpool | NSW | 110 |
| devonport | Devonport | Burnie | TAS | 108 |
| blacktown | Blacktown | Parramatta | NSW | 106 |
| berwick | Berwick | Melbourne | VIC | 105 |
| altona-meadows | Altona Meadows | Melbourne | VIC | 104 |
| bowen-hills | Bowen Hills | Brisbane | QLD | 102 |
| ashgrove | Ashgrove | Brisbane | QLD | 101 |
| boronia | Boronia | Melbourne | VIC | 98 |
| clayton-south | Clayton South | Melbourne | VIC | 98 |
| perth | Perth | Perth | WA | 98 |
| bassendean | Bassendean | Perth | WA | 97 |
| dandenong-north | Dandenong North | Melbourne | VIC | 97 |
| sydney | Sydney | Sydney | NSW | 97 |
| bayswater | Bayswater | Perth | WA | 94 |
| melbourne | Melbourne | Melbourne | VIC | 93 |
| adelaide | Adelaide | Adelaide | SA | 89 |
| epping | Epping | Parramatta | NSW | 89 |
| alfredton | Alfredton | Ballarat | VIC | 87 |
| bacchus-marsh | Bacchus Marsh | Melbourne | VIC | 86 |
| aldinga-beach | Aldinga Beach | Adelaide | SA | 85 |
| kingston | Kingston | Hobart | TAS | 84 |
| castle-hill | Castle Hill | Parramatta | NSW | 81 |
| caroline-springs | Caroline Springs | Melbourne | VIC | 80 |
| belair | Belair | Adelaide | SA | 78 |
| bentleigh-east | Bentleigh East | Melbourne | VIC | 78 |
| campbelltown | Campbelltown | Adelaide | SA | 78 |
| broadmeadows | Broadmeadows | Melbourne | VIC | 77 |
| hornsby | Hornsby | Parramatta | NSW | 76 |
| avondale-heights | Avondale Heights | Melbourne | VIC | 74 |
| blackburn | Blackburn | Melbourne | VIC | 74 |
| brighton | Brighton | Adelaide | SA | 74 |
| botany | Botany | Sydney | NSW | 72 |
| clyde | Clyde | Melbourne | VIC | 72 |
| dee-why | Dee Why | Sydney | NSW | 71 |
| glenorchy | Glenorchy | Hobart | TAS | 70 |
| epping | Epping | Ballarat | VIC | 69 |
| bellerive | Bellerive | Hobart | TAS | 66 |
| coconut-grove | Coconut Grove | Darwin | NT | 66 |
| queanbeyan | Queanbeyan | Canberra | ACT | 66 |
| cleveland | Cleveland | Brisbane | QLD | 63 |
| caulfield-north | Caulfield North | Melbourne | VIC | 61 |
| brunswick-east | Brunswick East | Melbourne | VIC | 60 |
| diamond-creek | Diamond Creek | Melbourne | VIC | 60 |
| dingley-village | Dingley Village | Melbourne | VIC | 60 |
| canberra-cbd | Canberra CBD | Canberra | ACT | 56 |
| cranbourne-east | Cranbourne East | Melbourne | VIC | 56 |
| gungahlin | Gungahlin | Canberra | ACT | 53 |
| humpty-doo | Humpty Doo | Darwin | NT | 53 |
| launceston-cbd | Launceston CBD | Launceston | TAS | 53 |
| bruce | Bruce | Canberra | ACT | 50 |
| docklands | Docklands | Melbourne | VIC | 50 |
| altona-north | Altona North | Melbourne | VIC | 49 |
| claremont | Claremont | Hobart | TAS | 49 |
| deer-park | Deer Park | Melbourne | VIC | 49 |
| ocean-grove | Ocean Grove | Melbourne | VIC | 49 |
| carnegie | Carnegie | Melbourne | VIC | 48 |
| eight-mile-plains | Eight Mile Plains | Brisbane | QLD | 48 |
| cronulla | Cronulla | Sydney | NSW | 46 |
| albert-park | Albert Park | Melbourne | VIC | 45 |
| burleigh-heads | Burleigh Heads | Gold Coast | QLD | 45 |
| burwood | Burwood | Sydney | NSW | 45 |
| clarkson | Clarkson | Perth | WA | 45 |
| holden-hill | Holden Hill | Holden Hill | SA | 44 |
| blackwood | Blackwood | Adelaide | SA | 43 |
| coorparoo | Coorparoo | Brisbane | QLD | 43 |
| ascot-vale | Ascot Vale | Melbourne | VIC | 42 |
| bulleen | Bulleen | Melbourne | VIC | 42 |
| chifley | Chifley | Canberra | ACT | 42 |
| moonah | Moonah | Hobart | TAS | 42 |
| ashburton | Ashburton | Melbourne | VIC | 41 |
| darwin-cbd | Darwin CBD | Darwin | NT | 41 |
| edwardstown | Edwardstown | Edwardstown | SA | 41 |
| ballarat-central | Ballarat Central | Ballarat | VIC | 40 |
| brisbane-city | Brisbane City | Brisbane CBD | QLD | 40 |
| lara | Lara | Melbourne | VIC | 40 |
| christie-downs | Christie Downs | Adelaide | SA | 38 |
| ellenbrook | Ellenbrook | Perth | WA | 38 |
| sorell | Sorell | Hobart | TAS | 38 |
| casey | Casey | Canberra | ACT | 37 |
| clifton-springs | Clifton Springs | Geelong | VIC | 37 |
| marrickville | Marrickville | Sydney | NSW | 37 |
| fadden | Fadden | Canberra | ACT | 35 |
| nerang | Nerang | Gold Coast | QLD | 35 |
| nerrina | Nerrina | Ballarat | VIC | 35 |
| fairfield | Fairfield | Liverpool | NSW | 34 |
| helensvale | Helensvale | Gold Coast | QLD | 33 |
| balaclava | Balaclava | Melbourne | VIC | 31 |
| delacombe | Delacombe | Ballarat | VIC | 31 |
| leopold | Leopold | Melbourne | VIC | 31 |
| mudgeeraba | Mudgeeraba | Gold Coast | QLD | 31 |
| surry-hills | Surry Hills | Sydney | NSW | 31 |
| glebe | Glebe | Sydney | NSW | 30 |
| cockburn-central | Cockburn Central | Cockburn | WA | 29 |
| golden-grove | Golden Grove | Gawler | SA | 29 |
| golden-square | Golden Square | Bendigo | VIC | 29 |
| palm-beach | Palm Beach | Gold Coast | QLD | 29 |
| randwick | Randwick | Sydney | NSW | 29 |
| surfers-paradise | Surfers Paradise | Gold Coast | QLD | 29 |
| arundel | Arundel | Gold Coast | QLD | 28 |
| box-hill-north | Box Hill North | Melbourne | VIC | 28 |
| chermside | Chermside | Brisbane | QLD | 28 |
| dickson | Dickson | Canberra | ACT | 28 |
| rockingham | Rockingham | Perth | WA | 28 |
| upper-coomera | Upper Coomera | Gold Coast | QLD | 28 |
| brighton-east | Brighton East | Melbourne | VIC | 27 |
| armadale | Armadale | Melbourne | VIC | 26 |
| bondi-junction | Bondi Junction | Sydney | NSW | 26 |
| darra | Darra | Darra | QLD | 26 |
| weston-creek | Weston Creek | Canberra | ACT | 26 |
| caringbah | Caringbah | Sydney | NSW | 25 |
| coomera | Coomera | Gold Coast | QLD | 25 |
| miranda | Miranda | Liverpool | NSW | 25 |
| mount-barker | Mount Barker | Adelaide | SA | 25 |
| north-sydney | North Sydney | Sydney | NSW | 25 |
| robina | Robina | Gold Coast | QLD | 25 |
| ryde | Ryde | Parramatta | NSW | 25 |
| balwyn-north | Balwyn North | Melbourne | VIC | 24 |
| blackburn-south | Blackburn South | Melbourne | VIC | 24 |
| carindale | Carindale | Brisbane | QLD | 24 |
| carlisle | Carlisle | Carlisle | WA | 24 |
| millner | Millner | Darwin | NT | 24 |
| ashmore | Ashmore | Gold Coast | QLD | 23 |
| bentley | Bentley | Perth | WA | 23 |
| cranbourne-west | Cranbourne West | Melbourne | VIC | 23 |
| hurstville | Hurstville | Sydney | NSW | 23 |
| labrador | Labrador | Gold Coast | QLD | 23 |
| lane-cove | Lane Cove | Sydney | NSW | 23 |
| newstead | Newstead | Launceston | TAS | 23 |
| rocklea | Rocklea | Brisbane | QLD | 23 |
| waurn-ponds | Waurn Ponds | Geelong | VIC | 23 |
| brunswick-west | Brunswick West | Melbourne | VIC | 22 |

**Total: 150 suburbs need context** (currently only 35 have it)

---
## TASK 2: TRADE_FAQ_BANK Expansion

Generate 6-8 FAQs per trade for the trades listed below.
These appear on every trade+suburb page with FAQ schema markup (rich snippets in Google).

### Required TypeScript Format

```typescript
"Trade Category": [
    { q: "Question text?", a: "Detailed answer 2-4 sentences. Must be factually accurate for Australia." },
],
```

### Rules
- Questions must be **what real Australians search for** (think Google autocomplete)
- Answers must reference **Australian standards, laws, and pricing** (not US/UK)
- Include specific numbers: costs in AUD, timeframes, legal thresholds
- Reference state-specific rules where applicable (e.g. 'In QLD...')
- Each FAQ should be **genuinely different** — avoid repetitive pricing questions

### Existing FAQ Trades (already done, skip these)
- ✅ Plumbing
- ✅ Electrical
- ✅ Plastering
- ✅ Painting
- ✅ Cleaning
- ✅ Roofing
- ✅ Landscaping
- ✅ Carpentry
- ✅ Air Conditioning & Heating
- ✅ Tiling
- ✅ Concreting
- ✅ Fencing
- ✅ Demolition
- ✅ Solar
- ✅ Pest Control
- ✅ Waterproofing
- ✅ Tree Lopping
- ✅ Bathroom Renovation
- ✅ Kitchen Renovation
- ✅ Flooring
- ✅ Building
- ✅ Excavation
- ✅ Handyman
- ✅ Locksmith
- ✅ Gas Fitting
- ✅ Guttering
- ✅ Rendering
- ✅ Solar & Energy
- ✅ Tree Lopping & Removal
- ✅ Gardening & Lawn Care
- ✅ Mowing
- ✅ Pool & Spa
- ✅ Glazing & Windows
- ✅ Insulation
- ✅ Paving
- ✅ Scaffolding
- ✅ Security Systems
- ✅ Garage Doors
- ✅ Blinds & Curtains
- ✅ Cabinet Making
- ✅ Decking
- ✅ Drainage
- ✅ Irrigation
- ✅ Rubbish Removal
- ✅ Shed Building
- ✅ Splashbacks
- ✅ Stump Removal
- ✅ Surveying
- ✅ Stonemasonry
- ✅ Welding & Fabrication
- ✅ Shopfitting
- ✅ Signwriting

### Trades Needing FAQs (0 trades)


---
## TASK 3: TRADE_HIRING_TIPS (New Constant)

Generate 6 hiring tips per trade. Currently the 'How to Choose' section is **identical on every page**.
We need trade-specific hiring advice.

### Required TypeScript Format

```typescript
export const TRADE_HIRING_TIPS: Record<string, Array<{ title: string; body: string }>> = {
    "Plumbing": [
        { title: "Check Their Licence Class", body: "In Australia, plumbers must hold a licence appropriate to the work type..." },
        { title: "Ask About Warranty on Parts", body: "..." },
    ],
};
```

### Rules
- 6 tips per trade
- `title`: Short imperative (5-8 words)
- `body`: 1-2 sentences, Australian-specific, practical
- Must be **different for each trade** — a roofer tip is not a painter tip
- Reference real Australian licensing bodies, standards (AS/NZS), or consumer protection where relevant

### Generate for these trades:

- Plumbing
- Electrical
- Carpentry
- Landscaping
- Roofing
- Painting
- Cleaning
- Building
- Concreting
- Tiling
- Plastering
- Fencing
- Demolition
- Excavation
- Air Conditioning & Heating
- Solar & Energy
- Pest Control
- Tree Lopping & Removal
- Gardening & Lawn Care
- Mowing
- Pool & Spa
- Bathroom Renovation
- Kitchen Renovation
- Flooring
- Glazing & Windows
- Guttering
- Handyman
- Insulation
- Locksmith
- Paving

---
## Reference: Existing SUBURB_CONTEXT (don't regenerate these)

- belmont
- highton
- newtown
- geelong-west
- grovedale
- torquay
- bondi
- parramatta
- fitzroy
- southport
- richmond
- st-kilda
- brunswick
- frankston
- dandenong
- werribee
- manly
- chatswood
- liverpool
- penrith
- the-gap
- ipswich
- cairns
- toowoomba
- fremantle
- mandurah
- joondalup
- norwood
- glenelg
- sandy-bay
- launceston
- belconnen
- tuggeranong
- darwin
- palmerston

## Reference: All Trade Categories in TRADE_COST_GUIDE

1. Plumbing
2. Electrical
3. Carpentry
4. Landscaping
5. Roofing
6. Painting
7. Cleaning
8. Building
9. Concreting
10. Tiling
11. Plastering
12. Fencing
13. Demolition
14. Excavation
15. Air Conditioning & Heating
16. Solar & Energy
17. Pest Control
18. Tree Lopping & Removal
19. Gardening & Lawn Care
20. Mowing
21. Pool & Spa
22. Bathroom Renovation
23. Kitchen Renovation
24. Flooring
25. Glazing & Windows
26. Guttering
27. Handyman
28. Insulation
29. Locksmith
30. Paving
31. Rendering
32. Scaffolding
33. Security Systems
34. Shopfitting
35. Signwriting
36. Stonemasonry
37. Waterproofing
38. Welding & Fabrication
39. Garage Doors
40. Blinds & Curtains
41. Cabinet Making
42. Decking
43. Drainage
44. Gas Fitting
45. Irrigation
46. Rubbish Removal
47. Shed Building
48. Splashbacks
49. Stump Removal
50. Surveying

## Reference: Top Trade+Suburb Combos by Business Count

| Trade | Suburb | City | State | Count |
|-------|--------|------|-------|-------|
| Electrician | Canning Vale | Perth | WA | 30 |
| Plumber | Sydney | Sydney | NSW | 24 |
| Electrician | Perth | Perth | WA | 23 |
| Electrician | Sydney | Sydney | NSW | 23 |
| Tree Surgeon | Adelaide | Adelaide | SA | 21 |
| Painter | Melbourne | Melbourne | VIC | 19 |
| Electrician | Torquay | Geelong | VIC | 17 |
| Electrician | Adelaide | Adelaide | SA | 17 |
| Electrician | Melbourne | Melbourne | VIC | 17 |
| Flooring Contractor | Perth | Perth | WA | 16 |
| Plumber | Mandurah | Perth | WA | 16 |
| Plumber | Melbourne | Melbourne | VIC | 14 |
| Electrician | Joondalup | Perth | WA | 14 |
| Plumber | Ocean Grove | Melbourne | VIC | 14 |
| Tree Surgeon | Sydney | Sydney | NSW | 13 |
| Painter | Perth | Perth | WA | 13 |
| Electrician | Rockingham | Perth | WA | 12 |
| Cabinet Making | Geelong | Geelong | VIC | 12 |
| Landscaper | Perth | Perth | WA | 11 |
| Electrician | Darra | Brisbane | QLD | 11 |
| Painter | Adelaide | Adelaide | SA | 11 |
| Plumber | Grovedale | Melbourne | VIC | 11 |
| Builder | Melbourne | Melbourne | VIC | 11 |
| Plumber | Wahroonga | Parramatta | NSW | 10 |
| Electrician | Tullamarine | Melbourne | VIC | 10 |
| Building | Geelong | Geelong | VIC | 10 |
| Tree Surgeon | Geelong | Geelong | VIC | 10 |
| Tree Surgeon | Joondalup | Perth | WA | 10 |
| Demolition Contractor | Canning Vale | Perth | WA | 10 |
| Kitchen Renovation | Geelong | Geelong | VIC | 10 |
| Electrician | Capalaba | Brisbane | QLD | 10 |
| Building | Belmont | Perth | WA | 10 |
| Electrician | Mount Barker | Adelaide | SA | 10 |
| Electrician | Ocean Grove | Melbourne | VIC | 9 |
| Guttering | Geelong | Geelong | VIC | 9 |
| Flooring | Geelong | Geelong | VIC | 9 |
| Demolition | Geelong | Geelong | VIC | 9 |
| Electrician | Waurn Ponds | Geelong | VIC | 9 |
| Electrician | Richmond | Melbourne | VIC | 9 |
| Electrician | Cheltenham | Melbourne | VIC | 9 |
| Insulation Contractor | Adelaide | Adelaide | SA | 9 |
| Landscaper | Adelaide | Adelaide | SA | 9 |
| Carpenter | Melbourne | Melbourne | VIC | 9 |
| Blinds & Curtains | Geelong | Geelong | VIC | 8 |
| Welding & Fabrication | Geelong | Geelong | VIC | 8 |
| Plumber | Newtown | Sydney | NSW | 8 |
| Tree Surgeon | Melbourne | Melbourne | VIC | 8 |
| Builder | Perth | Perth | WA | 8 |
| Electrician | Grovedale | Melbourne | VIC | 8 |
| Electrician | Springwood | Brisbane | QLD | 8 |

---
## Output Format

Please output **valid TypeScript** that can be directly pasted into `constants.ts`.
Split into 3 clearly labelled sections:

1. **SUBURB_CONTEXT additions** — new entries to add to the existing object
2. **TRADE_FAQ_BANK additions** — new entries to add to the existing object
3. **TRADE_HIRING_TIPS** — complete new exported constant

Do NOT regenerate existing entries. Only output NEW content to add.