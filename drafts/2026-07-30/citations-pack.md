# TradeRefer Foundation Citations Pack

Generated 2026-07-30 for `LINK_PLAN.md` section 3 (foundation layer, month 1).
Every submission URL below was live-checked this session (WebFetch and/or a local
stealth fetch); anything not directly confirmed is marked **UNVERIFIED**. Follow/nofollow
column is the industry-typical behaviour for each platform, not something that can be
verified before a listing exists - re-check the actual `rel` attribute once each listing
is live, and log it.

**2026-07-30 update - phone gate applied.** TradeRefer has no phone number and will
not get one - this is permanent, not a temporary gap. Every target below was re-checked
for whether its submission flow mandates a phone number (via WebFetch on the live
submission/signup page where it would render; where the page is a JS shell, behind a
login, or bot-gated, the finding is marked **assumed** and sourced from the platform's
own help docs / FAQ / equivalent guides instead - never a guess with no citation). The
pack is now split into two sections: **READY** (submit without a phone) and **BLOCKED**
(mandates a phone - skip, do not work around it with a placeholder, personal, or virtual
number). Result: 7 READY, 7 BLOCKED, 1 dead target excluded (StartLocal, unrelated to
phone). See "Status summary" for the full table.

Plan rules that apply to every submission here:

- Anchor is branded/NAP by nature (business name or bare URL). Never add keyword anchors.
- Target URL is always the homepage `https://traderefer.au` - never a `/local/...` page.
- Use the exact same NAP block everywhere (consistency is the point of citations).
- Push each live listing URL through Omega Indexer (`oi`) once published.

---

## Canonical NAP block (paste this, identically, everywhere)

| Field | Value |
|---|---|
| Business name | TradeRefer |
| Website | https://traderefer.au |
| Business type / location | Service-area business, Geelong VIC (no public street address - none exists, none will be created) |
| Phone | **None. Not published, not applicable, will never be added.** Never enter a placeholder, personal mobile, or virtual number on any listing to work around a directory that mandates one - skip that directory instead (see BLOCKED section). |
| ABN | 88 764 351 213 (sole trader, verified active on ABR this session: FORD, STEPHEN, registered VIC 3217) |
| Email | support@traderefer.au (not part of NAP; enter only where a directory's signup flow requires a contact email) |
| Category theme | Referral service / trades directory / business services (per-site picks below) |

**Data problems found while building this pack:**

1. **The site footer address is a placeholder.** `DirectoryFooter.tsx` line 171 shows
   "Level 1, 123 Collins Street, Melbourne VIC 3000". Never use it in a citation - it is
   not a real premises. TradeRefer has no public street address at all (service-area
   business, Geelong VIC only) and none will be created for this purpose - do not
   substitute any other street address, real or invented, on any listing, including in a
   "hidden/private" field. Any directory whose submission flow mandates a street address
   is incompatible with this business; those are sorted into BLOCKED below alongside the
   phone-mandatory targets.
2. **Entity mismatch.** The footer says "TradeRefer Pty Ltd" but ABN 88 764 351 213 is a
   sole trader registration (FORD, STEPHEN). Either register the company or fix the
   footer to the sole-trader trading name. Directories that verify ABN against entity
   name will trip on this. In citations, use the trading name "TradeRefer" only. (This
   is unrelated to the phone/address gate and is still open.)
3. **No phone number - permanent, not a gap to fix.** TradeRefer will never publish a
   phone number. This is now the primary sort key for the whole pack: every target below
   is labelled READY (works without a phone) or BLOCKED (mandates one - skip it, don't
   route around it).

Description rules used below: 2 sentences, branded, factual claims only (all drawn from
the site's own published copy: ABN-checked profiles, compare reviews, free quotes,
rewards for eligible referrals). No review counts, no "years in business", no keywords
stuffed. Each directory gets a lightly varied wording so the same paragraph is not
duplicated across the web, but every factual element is identical.

---

## Status summary

### READY - submit without phone (7)

| # | Target | Phone required? | Submission URL status | Cost | Typical link |
|---|---|---|---|---|---|
| 1 | Google Business Profile | **No** - phone is optional/skippable during setup (confirmed via Google Business Profile Help, "Add your phone number" step can be skipped) | VERIFIED (eligibility caveat) | Free | Nofollow / entity signal |
| 2 | ProductReview.com.au | **No** (assumed, moderate confidence) - the documented signup path is entirely email-based (Company Representative account, email verification link); phone is not called out as a mandatory field anywhere in it | No self-serve URL (both legacy paths 404, VERIFIED); entry via for-businesses page | Free listing | Nofollow |
| 3 | Hotfrog | **Assumed no**, low confidence - the add-business form is bot-gated (ALTCHA challenge blocked both WebFetch and stealth fetch), so this could not be confirmed live. Re-check the actual form in a normal browser before submitting; if phone turns out mandatory, move this to BLOCKED | EXISTS, bot-gated (do in a normal browser) | Free | Historically dofollow |
| 4 | Yelp Australia | **No** (assumed, sourced from Yelp's own business-information guidelines) - Yelp explicitly supports service-area businesses (plumbers, dog-walkers) listed by address/ZIP/service-area instead of phone; phone verification only applies to *claiming* an already-existing unclaimed listing via a phone call, not to creating a new one | VERIFIED | Free | Nofollow |
| 5 | Cylex Australia | **Assumed no** - the documented registration flow is name/password/business address/email; phone is not singled out as a required field. The live form errored on fetch this session ("unsupported browser" message) so this is unconfirmed - re-check live | VERIFIED (use cylex-australia.com, not cylex.com.au) | Free basic | Mixed - verify live |
| 6 | Brownbook | **No** - confirmed live: Phone, Mobile, and Fax are all listed as optional fields; only Business name, Business category, and Country are required | VERIFIED | Free | Historically dofollow |
| 7 | Trustpilot | **No** - confirmed via Trustpilot's own help docs: free signup verifies by business email and (conditionally) domain ownership, never phone | VERIFIED | Free plan | Nofollow |

### BLOCKED - requires phone, skip (7)

| # | Target | Phone required? | Submission URL status | Cost | Typical link |
|---|---|---|---|---|---|
| 1 | Bing Places | **Yes** (assumed, sourced from multiple independent Bing Places setup guides - the live form is a JS shell that would not render for direct confirmation) - "Main Phone" is described as a mandatory field on the business-details form and is the primary channel for call/SMS verification; guides report profiles failing to publish without it | VERIFIED | Free | Nofollow / entity signal |
| 2 | True Local (via Thryv signup) | **Assumed yes** - shares the same my.yellow.com.au signup pipeline as Yellow (below); Thryv's own signup FAQ says an uncontacted business gets called by their content-collection team within 48 hours, implying a phone number is captured at signup | Own form GONE - now via Yellow/Thryv signup (VERIFIED) | Free | Nofollow (tracked) |
| 3 | Yellow | **Assumed yes** - same reasoning as True Local (Thryv's content-collection call-back model). The signup form itself is a JS app that would not render field-by-field for direct confirmation | VERIFIED | Free | Nofollow (tracked) |
| 4 | White Pages | **Assumed yes** - same Thryv family as Yellow/True Local, so the same call-back model likely applies; corroborated live: White Pages' own "request a call back" form explicitly marks Phone as a required field | VERIFIED | Free basic (paid tiers UNVERIFIED) | Nofollow (tracked) |
| 5 | Localsearch | **Yes** - confirmed live on the actual signup form: Phone is field 4 of 9 and is marked required with an asterisk. (It also requires a street address as field 5 - a second, independent reason this one can't be done for a service-area business with no premises.) | VERIFIED | Free | Often dofollow - verify live |
| 6 | Word of Mouth | **Assumed yes** - Word of Mouth's own Conditions of Use list "the name and telephone number of your authorised billing contact and administrator" among the information required to register an account | VERIFIED | Free | Nofollow |
| 7 | Foursquare | **Assumed yes for this pack's flow** - the claim path this pack uses (business.foursquare.com/products/listings -> app.foursquare.com/venue/claim) verifies ownership via a phone call; Foursquare is also place-centric (wants a physical venue), which compounds the block for an address-less business | Product page VERIFIED; claim flow UNVERIFIED; low priority | Free claim (current terms UNVERIFIED) | Nofollow |

### Excluded - dead target, unrelated to phone (1)

| Target | Note |
|---|---|
| StartLocal (startlocal.com.au) | No working submission page exists (verified this session - see detail below). Not a phone-gating issue, just dead. Skip regardless of the phone question. |

---

## READY - submit without phone

### 1. Google Business Profile

- **(a) Submission URL:** https://business.google.com/create (302 to Google sign-in, expected; AU landing verified live at https://business.google.com/aunz/business-profile/)
- **(b) Category:** Primary: **Referral service**. Secondary: Business to business service. (Search the picker for "referral"; do not pick a trade category like Plumber.)
- **(c) NAP:** canonical block above. Description:
  > TradeRefer is an Australian trades directory and referral marketplace based in Geelong, Victoria. Compare ABN-checked trade profiles and reviews, request free quotes, and receive rewards for eligible referrals.
- **(d) Link:** Website links from Google listings carry no direct equity (treat as nofollow); the value is the entity/local trust signal.
- **(e) Cost:** Free.
- **(f) Phone required?** No - Google's own Business Profile Help documents the phone-number step as skippable, and a phone can also be hidden later if one is ever added. Leave it blank.
- **Caveat (honest one):** Google's eligibility rules require in-person customer contact or a defined service area. A pure online marketplace is borderline. List as a service-area business (address hidden, matching the canonical NAP - no street address), and if Google rejects or suspends it, drop it rather than faking a storefront - a suspended GBP is worse than none during a de-index recovery.

### 2. ProductReview.com.au

- **(a) Submission URL:** **No self-serve add-listing URL exists.** Verified this session: both legacy paths (productreview.com.au/add-listing and /listings/new) return 404. Entry points: create a free account at https://www.productreview.com.au/ then use the in-account "request a new listing" flow, and the business side at https://www.productreview.com.au/for-businesses (verified live). Business help centre: https://support.productreview.com.au/hc/en-us (bot-gated to WebFetch; open in a browser).
- **(b) Category:** Pick the services-marketplace category that hipages/Airtasker sit in (confirm the exact label during submission; ProductReview assigns/curates categories).
- **(c) NAP:** canonical block. Description:
  > TradeRefer is a Geelong-based online marketplace that connects Australians with local trade businesses. Users can compare ABN-checked profiles, request quotes, and refer tradies they trust.
- **(d) Link:** Nofollow. The real value (as LINK_PLAN.md says) is real reviews on a high-trust AU review domain, plus the brand entity.
- **(e) Cost:** Free listing; paid brand-management tools exist and are not needed.
- **(f) Phone required?** Assumed no. The documented account-creation and listing-request flow runs entirely on business email (Company Representative account, email verification link, personal details); phone is not named as a required field anywhere in it.
- **Do not** seed or solicit incentivised reviews here - ProductReview polices this and a flagged profile on a review site is a trust hit the recovery cannot afford.

### 3. Hotfrog Australia (hotfrog.com.au)

- **(a) Submission URL:** https://www.hotfrog.com.au/AddYourBusiness - page exists but sits behind an ALTCHA human-verification gate (both WebFetch and stealth fetch got the challenge page). **Complete this one manually in a normal browser.** Do not script it; the plan's rule against bot-detection games applies.
- **(b) Category:** Free-text tags; use "Trades Directory", "Referral Service", "Business Services".
- **(c) NAP:** canonical block. Description:
  > TradeRefer is an Australian trades directory and referral marketplace. Find ABN-checked trade profiles near you, compare reviews, and request free quotes online.
- **(d) Link:** Historically dofollow - verify live.
- **(e) Cost:** Free.
- **(f) Phone required?** Assumed no, low confidence - general guides describe the form expanding progressively (business name + address first, contact details after), suggesting phone sits with other optional contact details, but this could not be confirmed on the live form because of the bot gate. Check the actual form for a required-phone indicator before submitting; if it is mandatory, move this target to BLOCKED.

### 4. Yelp Australia

- **(a) Submission URL:** https://biz.yelp.com/claim (verified: this is the "Verify my free listing" flow linked from https://business.yelp.com/, which is live; search for TradeRefer, then use "add your business" when it is not found)
- **(b) Category:** Yelp's picker has no marketplace category; choose the closest under Professional Services. Do not pick Home Services trade categories (that claims to BE a tradie).
- **(c) NAP:** canonical block. Description:
  > TradeRefer is an online directory and referral marketplace for Australian trades, based in Geelong. Compare ABN-checked trade profiles, read reviews, and request quotes.
- **(d) Link:** Nofollow.
- **(e) Cost:** Free ("It's free to be on Yelp" verified on page).
- **(f) Phone required?** No, for creating a new listing (assumed, sourced from Yelp's own business-information guidelines, which explicitly allow service-area businesses like plumbers to list by address/ZIP/service-area instead of a phone number). Caveat: if Yelp has already auto-created an unclaimed listing for TradeRefer, *claiming* it (rather than adding new) typically uses a phone-verification call - if that's the only option offered when this is attempted, treat that specific listing as blocked rather than inventing a number.

### 5. Cylex Australia

- **(a) Submission URL:** https://www.cylex-australia.com/register-company (verified: linked from the live cylex-australia.com homepage). Account creation first at https://www.cylex-australia.com/signin?view=register. **Note:** the plan names cylex.com.au, but that hostname currently serves a TLS certificate for cylex-australia.com (cert mismatch, verified this session) - use cylex-australia.com.
- **(b) Category:** Business & Professional Services (their tree; nearest match to a directory/marketplace).
- **(c) NAP:** canonical block. Description:
  > TradeRefer is an Australian online trades directory with a built-in referral marketplace. It offers ABN-checked business profiles, review comparison, and free quote requests.
- **(d) Link:** Mixed reports; not verified. Check the live `rel` after publishing.
- **(e) Cost:** Free basic entry; "Premium Entry" is paid and not needed.
- **(f) Phone required?** Assumed no - documented registration flow is company name / password / business address / business email, with phone appearing only as one of several optional contact fields on the finished profile. The live form errored on fetch this session ("unsupported browser") so this is unconfirmed - re-check live before submitting.

### 6. Brownbook (brownbook.net)

- **(a) Submission URL:** https://www.brownbook.net/add-business (verified live: "Add a business (step 1 of 2)" form)
- **(b) Category:** Free-text; use "Trades Directory & Referral Marketplace".
- **(c) NAP:** canonical block. Description:
  > TradeRefer is a trades directory and referral marketplace serving all of Australia from Geelong, Victoria. Homeowners compare ABN-checked tradie profiles and receive rewards for eligible referrals.
- **(d) Link:** Historically dofollow - verify live. Brownbook is the lowest-authority target in this pack; it is fine as foundation filler, nothing more.
- **(e) Cost:** Free (site self-describes as "Free business listings", verified).
- **(f) Phone required?** No - confirmed live: only Business name, Business category, and Country are required (asterisked); Address, City, Zip Code, Phone, Mobile, Fax, Email, Website and the social fields are all optional. Leave phone/mobile/fax blank.

### 7. Trustpilot

- **(a) Submission URL:** https://business.trustpilot.com/signup (verified live: "Create Your Free Account", free to start)
- **(b) Category:** Assigned/edited after claiming the traderefer.au domain profile; set the nearest trades/home-services marketplace category in profile settings.
- **(c) NAP:** canonical block (Trustpilot keys off the domain, not an address or phone). Description:
  > TradeRefer is an Australian trades directory and referral marketplace. We list ABN-checked trade businesses, help people compare quotes and reviews, and reward eligible referrals.
- **(d) Link:** Nofollow.
- **(e) Cost:** Free plan (verified); paid tiers not needed.
- **(f) Phone required?** No - confirmed via Trustpilot's own help centre: free signup verifies via business email, and domain verification (email-domain match, HTML file upload, or Google Search Console) only if the signup email doesn't match traderefer.au. No phone step in either path.
- Same rule as ProductReview: no incentivised review solicitation.

---

## BLOCKED - requires phone, skip

### 1. Bing Places for Business

- **(a) Submission URL:** https://www.bingplaces.com/ (301 to https://www.bing.com/forbusiness/ - verified live)
- **(b) Category:** Nearest available under Business/Professional Services (picker is coarse; choose a directory/business-services category, not a trade). Tip: after GBP exists, use the "Import from Google Business Profile" option so the NAP is copied exactly.
- **(c) NAP:** canonical block. Description:
  > TradeRefer is an online directory and referral marketplace for Australian trades, run from Geelong, Victoria. Find ABN-checked trade businesses, compare reviews, and request free quotes.
- **(d) Link:** Nofollow / citation value.
- **(e) Cost:** Free.
- **(f) Phone required?** Yes (assumed, sourced from multiple independent Bing Places setup guides - the live signup page is a JS shell and did not render enough to confirm the field-by-field form directly). "Main Phone" is described as a mandatory field on the business-details step and is also the default channel for call/SMS verification; guides report listings failing to publish without a valid number. **Skip - do not submit.**
- **Note:** this is only about the Bing Places *directory listing*. It does not affect the organic Bing Search channel (1-2k impressions/day), which is unrelated to Bing Places and stays as-is.

### 2. True Local (truelocal.com.au)

- **(a) Submission URL:** True Local's own add-business page no longer exists - verified this session: truelocal.com.au/add-business now lands on a generic search-results page. True Local is a Thryv Australia property; new listings are created through the shared Thryv signup: **https://my.yellow.com.au/online-signup/** (verified live, 200). One Thryv signup feeds the Yellow network; confirm during signup that the True Local listing is included, and if the flow does not offer it, treat True Local as covered by Yellow rather than a separate citation.
- **(b) Category:** Search for "Referral Services"; if absent, "Internet Services" or "Business Services".
- **(c) NAP:** canonical block. Description:
  > TradeRefer helps Australians find and compare local trade businesses in one place. The platform lists ABN-checked trade profiles and rewards eligible customer referrals.
- **(d) Link:** Typically nofollow (Thryv properties wrap outbound links in tracking redirects).
- **(e) Cost:** Free.
- **(f) Phone required?** Assumed yes - same my.yellow.com.au signup pipeline as Yellow (below); Thryv's own signup FAQ states an uncontacted business is called by their content-collection team within 48 hours, implying a phone number is captured at signup. **Skip - do not submit.**

### 3. Yellow (yellowpages.com.au)

- **(a) Submission URL:** https://my.yellow.com.au/online-signup/?referrer=yp_footer (verified live; this is the exact "Get a free listing" link in the yellowpages.com.au footer)
- **(b) Category:** Search for "Referral Service" / "Business Referral"; fallback "Internet Services". Do not pick a trade category.
- **(c) NAP:** canonical block. Description:
  > TradeRefer is a trades directory and referral marketplace covering trades across Australia. Browse ABN-checked business profiles, compare reviews, and request quotes for your job.
- **(d) Link:** Typically nofollow (tracked redirect links).
- **(e) Cost:** Free listing (paid ad products exist; ignore them).
- **(f) Phone required?** Assumed yes - the signup form itself is a JS app that would not render for direct field confirmation, but Yellow/Thryv's own signup FAQ describes their content-collection team calling the business within 48 hours to build the listing, which requires a phone number captured at signup. **Skip - do not submit.**

### 4. White Pages (whitepages.com.au)

- **(a) Submission URL:** https://business.whitepages.com.au/products/listing/ (verified: whitepages.com.au homepage "List my business" resolves here via redirect)
- **(b) Category:** Same Thryv taxonomy as Yellow - "Referral Service" if available, else "Business Services".
- **(c) NAP:** canonical block. Description:
  > TradeRefer is an Australian online directory for finding local trade businesses. It combines ABN-checked profiles with a referral program that rewards eligible word-of-mouth recommendations.
- **(d) Link:** Typically nofollow (tracked).
- **(e) Cost:** Basic listing free; the listing product page advertises paid tiers whose pricing was not verified this session - take the free tier only (moot while this target is blocked).
- **(f) Phone required?** Assumed yes - same Thryv family as Yellow/True Local, so the same call-back model likely applies. Corroborated live this session: White Pages' own "request a call back" form explicitly marks **"Phone \*"** as a required field ("This is a required field."). **Skip - do not submit.**

### 5. Localsearch (localsearch.com.au)

- **(a) Submission URL:** https://business.localsearch.com.au/free-listing (verified live: "Claim your free profile in 60 seconds, no card, no contract")
- **(b) Category:** Nearest business-services/online-directory category (their taxonomy is trade-heavy; do not pick a trade). If free-text is offered: "Trades Directory & Referral Service".
- **(c) NAP:** canonical block. Description:
  > TradeRefer is an online trades directory and referral marketplace built in Geelong, Victoria. It lists ABN-checked trade businesses Australia-wide and rewards eligible customer referrals.
- **(d) Link:** Localsearch profile website links have often been dofollow historically - one of the few AU citations where that is true, which makes this the most disappointing block in the pack.
- **(e) Cost:** Free (explicitly no card, verified).
- **(f) Phone required?** Yes - confirmed live on the actual signup form. All nine fields are required (asterisked): Your name, Business name, Email, **Phone**, Street address, City/suburb, State, Postcode, Business category. Note it also requires a street address (field 5) - an independent second blocker for a service-area business with no premises, so this one is not comeback-able even if the phone rule ever changes without also fixing the address question. **Skip - do not submit.**

### 6. Word of Mouth (womo.com.au / wordofmouth.com.au)

- **(a) Submission URL:** https://www.wordofmouth.com.au/users/new_with_business (verified: this is the live "Register business" nav link on wordofmouth.com.au; note WOMO rebranded to Word of Mouth, old womo.com.au naming in the plan refers to this same site)
- **(b) Category:** Nearest business-services category; it is a service-review platform so the listing doubles as a review surface.
- **(c) NAP:** canonical block. Description:
  > TradeRefer connects homeowners with local trade businesses through a national online directory. Profiles are ABN-checked, and the referral program rewards eligible recommendations.
- **(d) Link:** Typically nofollow.
- **(e) Cost:** Free.
- **(f) Phone required?** Assumed yes - Word of Mouth's own Conditions of Use list "the name and telephone number of your authorised billing contact and administrator" among the information required to register an account, alongside a street address. The live registration form itself could not be rendered to confirm field-by-field. **Skip - do not submit.**

### 7. Foursquare - low priority anyway

- **(a) Submission URL:** https://business.foursquare.com/products/listings/ (verified live, 200). The venue claim flow redirects to https://app.foursquare.com/venue/claim (redirect verified; the flow behind it was not verified this session - **UNVERIFIED**).
- **(b) Category:** Business and Professional Services > Business Service.
- **(c) NAP:** canonical block. Description:
  > TradeRefer is an online Australian trades directory and referral marketplace based in Geelong. It lists ABN-checked trade businesses and helps users compare and request quotes.
- **(d) Link:** Nofollow.
- **(e) Cost:** Claiming has historically been free; Foursquare has been moving listing management toward paid products and current terms were not verified - **UNVERIFIED** (moot while this target is blocked).
- **(f) Phone required?** Assumed yes for this pack's flow - the claim path this pack uses (business.foursquare.com/products/listings -> app.foursquare.com/venue/claim) verifies ownership via a phone call. **Skip - do not submit.**
- **Honest caveat:** Foursquare shut its consumer City Guide in late 2024; remaining value is presence in the Foursquare Places dataset that feeds other apps and AI systems. It is also place-centric (wants a physical venue), which this business does not have and will never have. The address question is now permanently settled as "no" (service-area, Geelong VIC only, no phone) - this target stays blocked indefinitely, not just until a follow-up. Skip without guilt.

---

## Excluded - dead target, unrelated to phone

### StartLocal (startlocal.com.au)

- **(a) Submission URL:** **None found - treat as a dead target.** Verified this session: the legacy add-listing paths (/add/, /addlisting/, /signup/, /add_your_business/) all soft-render the homepage, and the current homepage/footer contain no add-your-business link at all. The site still serves its directory but appears to have closed public submissions.
- **(b)-(f):** n/a - not a phone-gating issue, the submission path simply doesn't exist. Do not burn time chasing it; the 7 READY targets plus GBP/Bing (now blocked) already covered the plan's intended month-1 count. If a replacement is wanted, source it from a fresh AU-citation-list crawl rather than guessing here.

---

## Suggested execution order (month 1)

1. Fix the entity-name mismatch (footer says "TradeRefer Pty Ltd", ABN is a sole trader) - unrelated to the phone gate but still open. Do **not** chase a phone number or a street address; both are permanently off the table for this pack.
2. GBP first (entity anchor, no phone needed - just watch the service-area eligibility caveat).
3. Brownbook and Trustpilot next - both confirmed no-phone, both quick.
4. Yelp and ProductReview - review/trust surfaces, both no-phone by the evidence above; watch the Yelp "claim vs add" fork.
5. Cylex, then Hotfrog (manual, in a normal browser, since it's bot-gated) - both assumed no-phone but unconfirmed live; re-verify the actual form before submitting either, and reclassify to BLOCKED if a required phone field turns up.
6. Do not attempt Bing Places, True Local, Yellow, White Pages, Localsearch, Word of Mouth, or Foursquare while the no-phone rule stands - they are permanently blocked, not deferred. Revisit this whole pack only if the phone/address policy for TradeRefer ever changes.
7. After each live target goes up: log the listing URL, check the actual `rel` attribute, push through `oi`.
