// Push URLs to IndexNow (instant Bing/Copilot/Yandex crawl notification).
// Reuses the key already verified in production at
// https://traderefer.au/0068d2eb419248bca5f302a93103550a.txt (see
// apps/api/services/indexnow.py — the FastAPI backend already auto-pings
// this on new business creation; this script is for ad-hoc/manual batches,
// e.g. after a materials/job-page content run from this directory).
//
// Usage (run from apps/web):
//   node scripts/materials/indexnow-ping.mjs https://traderefer.au/b/some-slug https://traderefer.au/local/nsw/sydney
//   node scripts/materials/indexnow-ping.mjs --file urls.txt   (one URL per line)
//
// Docs: https://www.indexnow.org/documentation
import { readFileSync } from "node:fs";

const HOST = "traderefer.au";
const KEY = "0068d2eb419248bca5f302a93103550a"; // not a secret — must be publicly fetchable per spec
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;
const API_URL = "https://api.indexnow.org/indexnow";
const BATCH_SIZE = 500;

function readUrlsFromFile(path) {
    return readFileSync(path, "utf8")
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);
}

function parseArgs(argv) {
    const fileIdx = argv.indexOf("--file");
    if (fileIdx !== -1) {
        const path = argv[fileIdx + 1];
        if (!path) throw new Error("--file requires a path argument");
        return readUrlsFromFile(path);
    }
    return argv.filter((a) => a !== "--dry-run");
}

function validateUrls(urls) {
    const bad = urls.filter((u) => {
        try {
            const parsed = new URL(u);
            return parsed.hostname !== HOST;
        } catch {
            return true;
        }
    });
    if (bad.length > 0) {
        throw new Error(`URLs must be absolute and on host ${HOST}. Bad entries:\n${bad.join("\n")}`);
    }
}

async function postBatch(urls, dryRun) {
    const payload = {
        host: HOST,
        key: KEY,
        keyLocation: KEY_LOCATION,
        urlList: urls,
    };

    if (dryRun) {
        console.log(`[dry-run] would POST ${urls.length} URLs to ${API_URL}`);
        console.log(JSON.stringify(payload, null, 2));
        return true;
    }

    try {
        const res = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json; charset=utf-8" },
            body: JSON.stringify(payload),
        });
        const ok = res.status === 200 || res.status === 202;
        console.log(`${ok ? "OK" : "FAIL"} — batch of ${urls.length}: HTTP ${res.status}`);
        if (!ok) {
            const text = await res.text().catch(() => "");
            if (text) console.log(`  ${text.slice(0, 300)}`);
        }
        return ok;
    } catch (err) {
        console.log(`FAIL — batch of ${urls.length}: ${err.message}`);
        return false;
    }
}

async function main() {
    const argv = process.argv.slice(2);
    const dryRun = argv.includes("--dry-run");
    const urls = parseArgs(argv);

    if (urls.length === 0) {
        console.error("No URLs given. Pass them as args, or --file <path> (one URL per line). Add --dry-run to preview without sending.");
        process.exit(1);
    }

    validateUrls(urls);

    console.log(`Submitting ${urls.length} URL(s) to IndexNow in batches of ${BATCH_SIZE}${dryRun ? " (dry run)" : ""}...`);

    let allOk = true;
    for (let i = 0; i < urls.length; i += BATCH_SIZE) {
        const batch = urls.slice(i, i + BATCH_SIZE);
        const ok = await postBatch(batch, dryRun);
        if (!ok) allOk = false;
    }

    if (!allOk) {
        console.error("One or more batches failed — see log above.");
        process.exit(1);
    }
    console.log("Done.");
}

main().catch((err) => {
    console.error(err.message);
    process.exit(1);
});
