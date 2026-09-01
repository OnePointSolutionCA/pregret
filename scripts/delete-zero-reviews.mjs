#!/usr/bin/env node
import { createClient } from "@supabase/supabase-js";

const supa = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// Collect all IDs with 0 or null amazon_reviews
const ids = [];
for (let page = 0; ; page++) {
  const { data } = await supa.from("products").select("id, external_ids").range(page * 1000, (page + 1) * 1000 - 1);
  if (!data || data.length === 0) break;
  for (const r of data) {
    const rev = parseInt(r.external_ids?.amazon_reviews, 10);
    if (!rev || rev === 0) ids.push(r.id);
  }
  if (data.length < 1000) break;
}
console.log(`Found ${ids.length} zero-review products to delete`);

let deleted = 0, errors = 0;
for (const id of ids) {
  const { error } = await supa.from("products").delete().eq("id", id);
  if (error) { errors++; continue; }
  deleted++;
  if (deleted % 200 === 0) process.stdout.write(`Deleted: ${deleted}/${ids.length} (${errors} err)\n`);
}
console.log(`\nDone: ${deleted} deleted, ${errors} errors`);
const { count } = await supa.from("products").select("id", { count: "exact", head: true });
console.log(`Remaining: ${count}`);
