import { sql } from "@/lib/db";

export type JobMaterial = {
    name: string;
    unit: string;
    qty_note: string | null;
    optional: boolean;
    price_low: number | null;
    price_typical: number | null;
    price_high: number | null;
    sampled_at: string | null;
};

export type JobQuestion = {
    question: string;
    answer: string;
};

/**
 * Answered job-specific questions (sourced from real Google PAA/related
 * searches, answers authored in-house). Unanswered rows never render.
 */
export async function getJobQuestions(jobSlug: string): Promise<JobQuestion[]> {
    try {
        return await sql<JobQuestion[]>`
            SELECT question, answer
            FROM job_questions
            WHERE job_slug = ${jobSlug} AND answer IS NOT NULL AND answer != ''
            ORDER BY sort ASC
            LIMIT 8
        `;
    } catch {
        return [];
    }
}

/**
 * Materials mapped to a job slug, each with the latest sampled retail price
 * range (null until a sample lands — the card renders those rows without a
 * price). Data layer: scripts/materials/. Returns [] on any failure so pages
 * never break on this module.
 */
// A catalog token-match occasionally lands products of wildly different pack
// sizes on one material (per-roll vs per-pallet), producing self-discrediting
// ranges like $7.64-$761. A real per-unit retail spread stays well inside this
// ratio, so wider ranges are treated as bad samples and hidden.
const MAX_RANGE_RATIO = 8;

function sanitizePrices(row: JobMaterial): JobMaterial {
    const { price_low, price_high } = row;
    if (price_low != null && price_high != null && price_low > 0 && price_high / price_low > MAX_RANGE_RATIO) {
        return { ...row, price_low: null, price_typical: null, price_high: null, sampled_at: null };
    }
    return row;
}

export async function getJobMaterials(jobSlug: string): Promise<JobMaterial[]> {
    try {
        const rows = await sql<JobMaterial[]>`
            SELECT m.name,
                   m.unit,
                   jm.qty_note,
                   jm.optional,
                   p.price_low::float AS price_low,
                   p.price_typical::float AS price_typical,
                   p.price_high::float AS price_high,
                   p.sampled_at::text AS sampled_at
            FROM job_materials jm
            JOIN materials m ON m.id = jm.material_id
            LEFT JOIN LATERAL (
                SELECT price_low, price_typical, price_high, sampled_at
                FROM material_prices mp
                WHERE mp.material_id = m.id
                ORDER BY mp.sampled_at DESC
                LIMIT 1
            ) p ON true
            WHERE jm.job_slug = ${jobSlug}
            ORDER BY jm.optional ASC, jm.sort ASC
        `;
        return rows.map(sanitizePrices);
    } catch {
        return [];
    }
}
