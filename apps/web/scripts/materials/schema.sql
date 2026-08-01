-- Materials data layer (additive — touches no existing tables).
-- materials: the catalog. material_prices: append-only range samples per
-- retailer (history = free trend data + freshness labels). job_materials:
-- job_slug (jobToSlug of JOB_TYPES entries) -> materials mapping that job
-- pages join against at render time.

CREATE TABLE IF NOT EXISTS materials (
    id SERIAL PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    unit TEXT NOT NULL,
    aliases TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS material_prices (
    id SERIAL PRIMARY KEY,
    material_id INT NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
    retailer TEXT NOT NULL,
    price_low NUMERIC(10,2) NOT NULL,
    price_typical NUMERIC(10,2) NOT NULL,
    price_high NUMERIC(10,2) NOT NULL,
    sample_size INT NOT NULL DEFAULT 0,
    sampled_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_material_prices_lookup
    ON material_prices (material_id, sampled_at DESC);

CREATE TABLE IF NOT EXISTS job_materials (
    id SERIAL PRIMARY KEY,
    job_slug TEXT NOT NULL,
    material_id INT NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
    qty_note TEXT,
    optional BOOLEAN NOT NULL DEFAULT false,
    sort INT NOT NULL DEFAULT 0,
    UNIQUE (job_slug, material_id)
);

CREATE INDEX IF NOT EXISTS idx_job_materials_job ON job_materials (job_slug);

-- Full scraped retail catalog (facts only: name/brand/price/category). Rows
-- link to a canonical material via material_id once matched, and material
-- price ranges are then computed from ALL linked products (percentiles),
-- giving far more robust ranges than search sampling.
CREATE TABLE IF NOT EXISTS retail_products (
    id SERIAL PRIMARY KEY,
    retailer TEXT NOT NULL,
    sku TEXT NOT NULL,
    name TEXT NOT NULL,
    brand TEXT,
    price NUMERIC(10,2) NOT NULL,
    category_path TEXT,
    material_id INT REFERENCES materials(id) ON DELETE SET NULL,
    scraped_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (retailer, sku)
);

CREATE INDEX IF NOT EXISTS idx_retail_products_material ON retail_products (material_id);

-- Support + contact form submissions (support page + contact page share this
-- table via /api/support). department is optional (contact page only).
CREATE TABLE IF NOT EXISTS support_requests (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    department TEXT,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);
