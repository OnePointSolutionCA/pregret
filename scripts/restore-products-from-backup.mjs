// Restores public.products from a Supabase db_cluster backup (.backup.gz, plain-SQL pg_dumpall)
// into the project in .env.local via the REST API. Idempotent (upserts on id), so re-run to resume.
// Usage: node scripts/restore-products-from-backup.mjs data-cache/db_cluster-XX.backup.gz
import { createReadStream, readFileSync } from "node:fs";
import { createGunzip } from "node:zlib";
import { createInterface } from "node:readline";
import { createClient } from "@supabase/supabase-js";

const file = process.argv[2];
if (!file) throw new Error("pass the .backup.gz path");

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n")
    .filter((l) => /^[A-Z_]+=/.test(l))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1).trim()]),
);
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const BATCH = 1000;
const CONCURRENCY = 4;

// COPY text format: tab-separated, \N = null, backslash escapes.
function decode(field) {
  if (field === "\\N") return null;
  if (!field.includes("\\")) return field;
  return field.replace(/\\(x[0-9a-fA-F]{1,2}|[0-7]{1,3}|.)/g, (_, e) => {
    if (e[0] === "x") return String.fromCharCode(parseInt(e.slice(1), 16));
    if (/^[0-7]/.test(e)) return String.fromCharCode(parseInt(e, 8));
    return { b: "\b", f: "\f", n: "\n", r: "\r", t: "\t", v: "\v" }[e] ?? e;
  });
}

const INT = new Set(["regret_score", "would_buy_again_pct", "total_ratings"]);
const NUM = new Set(["avg_satisfaction_day30", "avg_satisfaction_day60", "avg_satisfaction_day90"]);
const JSONB = new Set(["top_regret_reasons", "external_ids"]);

function toRow(columns, line) {
  const parts = line.split("\t");
  if (parts.length !== columns.length) throw new Error(`expected ${columns.length} fields, got ${parts.length}`);
  const row = {};
  columns.forEach((c, i) => {
    const v = decode(parts[i]);
    if (v === null) row[c] = null;
    else if (INT.has(c)) row[c] = parseInt(v, 10);
    else if (NUM.has(c)) row[c] = Number(v);
    else if (JSONB.has(c)) row[c] = JSON.parse(v);
    else if (c === "is_ai_estimated") row[c] = v === "t";
    else row[c] = v;
  });
  return row;
}

async function send(rows, n) {
  for (let attempt = 1; ; attempt++) {
    const { error } = await db.from("products").upsert(rows, { onConflict: "id" });
    if (!error) return;
    if (attempt === 5) throw new Error(`batch ${n} failed: ${error.message}`);
    await new Promise((r) => setTimeout(r, attempt * 3000));
  }
}

const lines = createInterface({ input: createReadStream(file).pipe(createGunzip()), crlfDelay: Infinity });
let columns = null;
let batch = [];
let batchNo = 0;
let sent = 0;
const inflight = new Set();
const started = Date.now();

async function flush() {
  if (!batch.length) return;
  const rows = batch;
  const n = ++batchNo;
  batch = [];
  const p = send(rows, n).then(() => {
    sent += rows.length;
    inflight.delete(p);
    if (n % 10 === 0) console.log(`${sent.toLocaleString()} rows in ${Math.round((Date.now() - started) / 1000)}s`);
  });
  inflight.add(p);
  if (inflight.size >= CONCURRENCY) await Promise.race(inflight);
}

for await (const line of lines) {
  if (!columns) {
    const m = line.match(/^COPY public\.products \((.+)\) FROM stdin;$/);
    if (m) columns = m[1].split(", ");
    continue;
  }
  if (line === "\\.") break;
  batch.push(toRow(columns, line));
  if (batch.length === BATCH) await flush();
}
await flush();
await Promise.all(inflight);
lines.close();

if (!columns) throw new Error("no COPY public.products block found");
const { count } = await db.from("products").select("id", { count: "exact", head: true });
console.log(`done: sent ${sent.toLocaleString()} rows, table now has ${count?.toLocaleString() ?? "?"} rows`);
