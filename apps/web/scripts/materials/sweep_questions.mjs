// Sweep real Google questions (People Also Ask + related searches) for every
// job that has a materials mapping, via the dfs CLI (DataForSEO, AU locale).
// Stores raw questions in job_questions — answers are authored separately and
// only answered questions render. ~$0.002-0.01 per job in DataForSEO credits.
// Run from apps/web:  node scripts/materials/sweep_questions.mjs [--limit N]
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { neon } from "@neondatabase/serverless";

const here = dirname(fileURLToPath(import.meta.url));
const envFile = readFileSync(join(here, "../../.env.local"), "utf8");
const sql = neon(envFile.match(/^DATABASE_URL="?([^"\n]+)"?/m)[1]);

const limitArg = process.argv.indexOf("--limit");
const limit = limitArg > -1 ? Number(process.argv[limitArg + 1]) : null;

// Sweep every job that has no ANSWERED questions yet — including jobs whose
// earlier sweep banked only junk (the answered set is the quality bar, and
// ON CONFLICT dedupes re-swept questions).
const jobs = await sql`
    SELECT DISTINCT jm.job_slug FROM job_materials jm
    WHERE NOT EXISTS (
        SELECT 1 FROM job_questions q
        WHERE q.job_slug = jm.job_slug AND q.answer IS NOT NULL
    )
    ORDER BY jm.job_slug
`;
const todo = limit ? jobs.slice(0, limit) : jobs;
console.log(`${todo.length} jobs to sweep`);

const slugToWords = (s) => s.replace(/-/g, " ");

let saved = 0;
for (const [i, { job_slug }] of todo.entries()) {
    const keyword = `${slugToWords(job_slug)} cost australia`;
    let items;
    try {
        const raw = execFileSync("dfs", ["serp", keyword, "--location-code", "2036", "--language-code", "en", "--json"],
            { encoding: "utf8", timeout: 90_000, shell: true, maxBuffer: 32 * 1024 * 1024 });
        items = JSON.parse(raw).tasks?.[0]?.result?.[0]?.items ?? [];
    } catch (e) {
        console.warn(`  ! ${job_slug}: ${String(e.message).slice(0, 80)}`);
        continue;
    }
    // PAA sometimes answers the words, not the job ("what does artificial
    // mean?") — drop dictionary-style questions and ones with no job token.
    const GENERIC = /\b(meaning|synonym|definition|abbreviation|acronym)\b|what does .* mean|why is .* called/i;
    // Homonym junk seen in earlier sweeps: car parts (downpipe/exhaust), TV
    // and film titles (House/Power/Smoke/Split/Glass), language trivia.
    const OFFTOPIC = /\b(car|vehicle|exhaust|turbo|movie|film|netflix|season|episode|series|lyrics|song|album|actor|cast)\b|in french|in spanish|american english/i;
    const jobTokens = slugToWords(job_slug).split(" ").filter((w) => w.length > 3);
    const relevant = (q) => !GENERIC.test(q) && !OFFTOPIC.test(q)
        && (jobTokens.some((t) => q.toLowerCase().includes(t)) || /cost|price|how much/i.test(q));
    const questions = [];
    for (const it of items) {
        if (it.type === "people_also_ask") {
            for (const p of it.items ?? []) if (p.title && relevant(p.title)) questions.push({ q: p.title, source: "paa" });
        }
    }
    for (const it of items) {
        if (it.type === "related_searches") {
            for (const r of (it.items ?? []).slice(0, 6)) {
                // keep question-shaped or cost-intent related searches only
                if (typeof r === "string" && (/^(how|what|why|can|do|is|when|should)/i.test(r) || /cost|price/i.test(r))) {
                    questions.push({ q: r, source: "related" });
                }
            }
        }
    }
    let n = 0;
    for (const [sort, { q, source }] of questions.slice(0, 10).entries()) {
        await sql`
            INSERT INTO job_questions (job_slug, question, source, sort)
            VALUES (${job_slug}, ${q}, ${source}, ${sort})
            ON CONFLICT (job_slug, question) DO NOTHING
        `;
        n++;
    }
    saved += n;
    console.log(`[${i + 1}/${todo.length}] ${job_slug}: ${n} questions`);
}
console.log(`\nSaved ${saved} questions total.`);
