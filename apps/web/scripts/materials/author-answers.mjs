// Apply authored answers from answers.json to job_questions. Upserts the
// question row if the sweep didn't capture that exact phrasing. Only rows
// with answers render on pages, so this file is the publish gate for FAQ
// content. Run from apps/web:  node scripts/materials/author-answers.mjs
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { neon } from "@neondatabase/serverless";

const here = dirname(fileURLToPath(import.meta.url));
const envFile = readFileSync(join(here, "../../.env.local"), "utf8");
const sql = neon(envFile.match(/^DATABASE_URL="?([^"\n]+)"?/m)[1]);

const answers = JSON.parse(readFileSync(join(here, "answers.json"), "utf8"));
let n = 0;
for (const [job, qas] of Object.entries(answers)) {
    for (const [sort, { q, a }] of qas.entries()) {
        await sql`
            INSERT INTO job_questions (job_slug, question, answer, source, sort)
            VALUES (${job}, ${q}, ${a}, 'paa', ${sort})
            ON CONFLICT (job_slug, question) DO UPDATE SET answer = EXCLUDED.answer, sort = EXCLUDED.sort
        `;
        n++;
    }
}
const [c] = await sql`SELECT COUNT(*) AS answered FROM job_questions WHERE answer IS NOT NULL`;
console.log(`Applied ${n} answers (${c.answered} total answered in DB).`);
