// TradeRefer badge-pilot drip sender (Resend, outreach.traderefer.au).
// Usage:  node send.mjs --batch 45          # send the next N unsent recipients
//         node send.mjs --test you@x.com    # send ONE test email to an address
//         node send.mjs --status            # sent/remaining counts
// State: sent-log.jsonl (append-only). Suppression: put emails (one per line)
// in suppress.txt (unsubscribes, bounces, wrong-person replies) before each run.
import { readFileSync, writeFileSync, appendFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const FROM = "Steve Ford (TradeRefer) <steve@outreach.traderefer.au>";
const REPLY_TO = "stevejford1@gmail.com";

const recipients = JSON.parse(readFileSync(join(here, "recipients.json"), "utf8"));
const logPath = join(here, "sent-log.jsonl");
const sent = new Set(
    existsSync(logPath)
        ? readFileSync(logPath, "utf8").trim().split("\n").filter(Boolean).map((l) => JSON.parse(l).email)
        : []
);
const suppressPath = join(here, "suppress.txt");
const suppressed = new Set(
    existsSync(suppressPath)
        ? readFileSync(suppressPath, "utf8").trim().split("\n").map((s) => s.trim().toLowerCase()).filter(Boolean)
        : []
);

function html(r) {
    return `<p>Hi ${r.company} team,</p>
<p>Your business is listed on TradeRefer, an Australian trades directory, with a ${r.rating} star rating from ${r.reviews} public reviews: <a href="${r.profile_url}">${r.profile_url}</a></p>
<p>The profile is currently unclaimed. Claiming it is free and takes about two minutes: <a href="${r.claim_url}">${r.claim_url}</a></p>
<p>Once claimed you can update your details, receive quote requests from homeowners around ${r.suburb}, and add a free rating badge to your own website showing your ${r.rating} star score.</p>
<p>Nothing to pay and no catch. We are building the directory and want the businesses on it to own their profiles.</p>
<p>Steve Ford<br>TradeRefer | traderefer.au<br>ABN 88 764 351 213, Geelong VIC</p>
<p style="font-size:12px;color:#888">Not interested? Just reply with "unsubscribe" and you will never hear from us again.</p>`;
}

function sendOne(r) {
    const payload = {
        from: FROM,
        to: [r.email],
        reply_to: REPLY_TO,
        subject: `Your ${r.trade} profile on TradeRefer`,
        html: html(r),
        headers: { "List-Unsubscribe": `<mailto:${REPLY_TO}?subject=unsubscribe>` },
    };
    const tmp = join(here, "tmp-payload.json");
    writeFileSync(tmp, JSON.stringify(payload));
    const out = execFileSync("re", ["--yes", "email", "send", "--data", `@${tmp}`, "--json"], { encoding: "utf8", shell: true });
    const id = JSON.parse(out).id;
    appendFileSync(logPath, JSON.stringify({ email: r.email, id, at: new Date().toISOString() }) + "\n");
    return id;
}

const args = process.argv.slice(2);
if (args.includes("--status")) {
    const remaining = recipients.filter((r) => !sent.has(r.email) && !suppressed.has(r.email));
    console.log(`sent: ${sent.size} | suppressed: ${suppressed.size} | remaining: ${remaining.length} of ${recipients.length}`);
    process.exit(0);
}
const testIdx = args.indexOf("--test");
if (testIdx > -1) {
    const to = args[testIdx + 1];
    const sample = { ...recipients[0], email: to };
    const id = sendOne(sample);
    console.log(`test sent to ${to} (personalised as "${sample.company}"): ${id}`);
    process.exit(0);
}
const batchIdx = args.indexOf("--batch");
const n = batchIdx > -1 ? Number(args[batchIdx + 1]) : 45;
const todo = recipients.filter((r) => !sent.has(r.email) && !suppressed.has(r.email)).slice(0, n);
console.log(`sending ${todo.length} (sent so far: ${sent.size}, suppressed: ${suppressed.size})`);
for (const [i, r] of todo.entries()) {
    try {
        const id = sendOne(r);
        console.log(`[${i + 1}/${todo.length}] ${r.email} -> ${id}`);
    } catch (e) {
        console.warn(`[${i + 1}/${todo.length}] ${r.email} FAILED: ${String(e.message).slice(0, 100)}`);
    }
    await new Promise((res) => setTimeout(res, 4000 + Math.random() * 4000));
}
console.log("batch done");
