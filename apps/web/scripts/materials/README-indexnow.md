# IndexNow

Pushes URLs straight to Bing/Copilot (and other IndexNow-participating engines)
instead of waiting for a crawl. Free, no auth beyond the key file.

**What it does:** POSTs a batch of URLs to `https://api.indexnow.org/indexnow`
with the site's IndexNow key, telling participating engines "these pages
changed, come get them now." It's a nudge, not a guarantee of indexing —
Google isn't in the IndexNow network, so this doesn't touch Google/GSC.

**Key:** the key file already lives at
`apps/web/public/0068d2eb419248bca5f302a93103550a.txt` (verifiable at
`https://traderefer.au/0068d2eb419248bca5f302a93103550a.txt`) and is the same
key the FastAPI backend uses (`apps/api/services/indexnow.py`, which
auto-pings on new business creation). Don't mint a second key — reuse this
one so there's a single source of truth.

**When to run it:** after a content batch that adds or changes a meaningful
number of live URLs — e.g. after `seed.mjs` / `ingest-products.mjs` land new
material or job pages, after a bulk business import, or after any manual page
push you want indexed faster than the next crawl.

**Example:**

```bash
# from apps/web
node scripts/materials/indexnow-ping.mjs https://traderefer.au/b/some-slug https://traderefer.au/local/nsw/sydney

# from a file, one URL per line
node scripts/materials/indexnow-ping.mjs --file urls.txt

# preview the payload without sending
node scripts/materials/indexnow-ping.mjs --dry-run https://traderefer.au/b/some-slug
```

Batches at 500 URLs per request (IndexNow's own limit is 10,000; 500 keeps
each request small and the per-batch log readable). All URLs must be absolute
and on `traderefer.au`.
