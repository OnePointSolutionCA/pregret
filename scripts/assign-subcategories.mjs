#!/usr/bin/env node
/**
 * Assigns every product a subcategory (stored in external_ids.sub) via
 * keyword matching on name + brand within its parent category. Curated
 * products already in lib/subcategories.ts win over auto-assignment.
 * If nothing matches, product gets the category's default fallback so
 * NO product ends up without a subcategory.
 *
 * Run:  node --env-file=.env.local scripts/assign-subcategories.mjs
 */
import { createClient } from "@supabase/supabase-js";

const supa = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// Order matters: first rule that matches wins. Put more specific rules first.
const RULES = {
  Electronics: [
    ["headphones",         /\b(headphone|earbud|earphone|airpod|airpods|beats|earpiece|earpods|over[- ]?ear|in[- ]?ear|noise[- ]?cancel)\b/i],
    ["speakers",           /\b(soundbar|speaker|sonos|bluetooth\s*speaker|smart\s*speaker|echo\s*dot|echo\s*show|homepod)\b/i],
    ["tvs",                /\b(tv|television|oled|qled|4k|8k|smart\s*display|projector|firetv|fire\s*tv|roku\s*tv|streaming\s*stick)\b/i],
    ["vacuums",            /\b(vacuum|roomba|robovac|shark\s*(nav|rocket|iq|vertex)|dyson\s*(v[0-9]|ball|cyclone)|cordless\s*vac|stick\s*vac|handheld\s*vac)\b/i],
    ["cameras",            /\b(camera|gopro|dslr|mirrorless|drone|dji|osmo|action\s*cam|webcam|camcorder|lens|tripod)\b/i],
    ["vr",                 /\b(vr|oculus|quest|virtual\s*reality|mixed\s*reality|headset|meta\s*quest)\b/i],
    ["readers",            /\b(kindle|e[- ]?reader|ereader|kobo|paperwhite|ipad|tablet|galaxy\s*tab|fire\s*hd|surface\s*pro)\b/i],
    ["phones",             /\b(iphone|galaxy\s*(s|z|note)|pixel\s*[0-9]|smartphone|cell\s*phone|flip\s*phone|fold[a-z]*\s*phone)\b/i],
    ["wearables",          /\b(watch|smartwatch|fitbit|garmin|whoop|apple\s*watch|galaxy\s*watch|oura|smart\s*ring|activity\s*tracker|fitness\s*band)\b/i],
    ["consoles",           /\b(playstation|ps5|ps4|xbox|nintendo\s*switch|steam\s*deck|gaming\s*console|game\s*console)\b/i],
    ["gaming-accessories", /\b(controller|gaming\s*(mouse|keyboard|headset|chair)|joystick|dualsense|dualshock|elite\s*controller|gaming\s*monitor|razer|logitech\s*g)\b/i],
    ["smart-home",         /\b(smart\s*(home|plug|bulb|light|switch|lock|thermostat|doorbell|camera|hub)|ring\s*(video|doorbell|cam)|nest|philips\s*hue|alexa|google\s*home)\b/i],
    ["cardio",             /\b(treadmill|exercise\s*bike|stationary\s*bike|peloton|elliptical|rowing\s*machine|nordictrack)\b/i],
    ["power",              /\b(power\s*bank|portable\s*charger|charging\s*(cable|dock|station|pad)|wireless\s*charger|usb[- ]?c|adapter|hdmi|surge\s*protector|battery\s*pack)\b/i],
    ["other-electronics",  /.*/],
  ],
  Kitchen: [
    ["coffee",             /\b(coffee|espresso|cappuccino|latte|keurig|nespresso|breville|barista|french\s*press|percolator|moka|milk\s*frother|coffee\s*grinder)\b/i],
    ["blenders",           /\b(blender|smoothie|vitamix|nutribullet|magic\s*bullet|immersion\s*blender|hand\s*blender)\b/i],
    ["premium",            /\b(multi[- ]?cooker|instant\s*pot|thermomix|sous\s*vide|pressure\s*cooker|slow\s*cooker|crock\s*pot|dutch\s*oven)\b/i],
    ["small-appliances",   /\b(air\s*fryer|toaster|microwave|kettle|rice\s*cooker|waffle|griddle|mixer|food\s*processor|juicer|dehydrator|electric\s*kettle|hand\s*mixer|stand\s*mixer|ice\s*cream\s*maker|ninja|kitchenaid|cuisinart)\b/i],
    ["drinkware",          /\b(mug|tumbler|water\s*bottle|yeti|hydro\s*flask|thermos|drink\s*ware|glass|goblet|wine\s*glass|cocktail|shaker|soda\s*stream)\b/i],
    ["cookware",           /\b(pan|pot|skillet|cast\s*iron|nonstick|non[- ]?stick|dutch\s*oven|wok|griddle|bakeware|baking\s*sheet|cookie\s*sheet|sauce\s*pan|frying\s*pan|le\s*creuset|all[- ]?clad|our\s*place)\b/i],
    ["small-appliances",   /.*/],
  ],
  Fitness: [
    ["supplements",        /\b(protein|whey|creatine|bcaa|preworkout|pre[- ]?workout|amino\s*acid|multivitamin|vitamin|omega|fish\s*oil|electrolyte|hydration|greens|meal\s*replacement|weight\s*gainer|collagen|magnesium|zinc|glutamine|caffeine\s*pill|energy\s*bar|protein\s*bar|meal\s*bar|nutrition\s*bar|met[- ]?rx|nature\s*made|pedialyte|liquid\s*iv|gatorade|powerade|shaklee)\b/i],
    ["cardio",             /\b(treadmill|bike|elliptical|rowing|rower|stair|climber|jump\s*rope|cardio|spin\s*bike|air\s*bike)\b/i],
    ["recovery",           /\b(massage\s*gun|theragun|foam\s*roller|compression|massager|percussion|recovery|hyperice|normatec|infrared|red\s*light|ice\s*bath|heating\s*pad)\b/i],
    ["wearables",          /\b(fitbit|garmin|whoop|apple\s*watch|smartwatch|fitness\s*tracker|heart\s*rate\s*monitor|smart\s*ring|activity\s*band|hrm)\b/i],
    ["smart",              /\b(smart\s*mirror|studio\s*mirror|tempo\s*studio|tonal|forme|smart\s*trainer|zwift|peloton\s*guide)\b/i],
    ["strength",           /\b(dumbbell|barbell|kettlebell|weight\s*plate|squat\s*rack|bench\s*press|weight\s*bench|power\s*rack|home\s*gym|pull[- ]?up\s*bar|adjustable\s*dumbbell|olympic\s*bar)\b/i],
    ["suspension",         /\b(trx|suspension\s*trainer|resistance\s*band|yoga\s*mat|yoga\s*block|pilates|ab\s*wheel|ab\s*roller|jump\s*rope|bodyweight)\b/i],
    ["apparel",            /\b(shirt|shorts|pants|leggings|sports\s*bra|running\s*shoe|training\s*shoe|gym\s*bag|water\s*bottle|towel|glove|wrap|belt)\b/i],
    ["strength",           /.*/],
  ],
  "Personal Care": [
    ["haircare",           /\b(hair\s*dryer|blow\s*dryer|airwrap|straightener|flat\s*iron|curling\s*iron|hot\s*brush|volumizer|hair\s*styler|dyson\s*supersonic|ghd|shark\s*flex)\b/i],
    ["shavers",            /\b(shaver|razor|trimmer|beard|electric\s*shaver|foil\s*shaver|manscaped|braun\s*series|philips\s*norelco|panasonic\s*arc)\b/i],
    ["oral-care",          /\b(toothbrush|oral[- ]?b|sonicare|water\s*flosser|waterpik|dental|floss|whitening|tongue\s*scraper|mouthwash)\b/i],
    ["hair-removal",       /\b(ipl|laser\s*hair|hair\s*removal|epilator|wax\s*kit|silk[- ]?expert|braun\s*silk|ulike|nood)\b/i],
    ["skincare-devices",   /\b(foreo|nuface|solawave|theraface|led\s*mask|microcurrent|dermaplaning|face\s*roller|jade\s*roller|gua\s*sha|cleansing\s*brush|clarisonic)\b/i],
    ["haircare",           /.*/],
  ],
  "Home & Garden": [
    ["smart-home",         /\b(thermostat|smart\s*bulb|smart\s*lock|smart\s*plug|smart\s*switch|nest|ecobee|philips\s*hue|lutron|smart\s*sensor|alexa|google\s*home|smart\s*home)\b/i],
    ["lighting",           /\b(bulb|led\s*light|led\s*strip|lamp|light\s*fixture|chandelier|ceiling\s*light|floor\s*lamp|table\s*lamp|night\s*light|sconce|pendant\s*light)\b/i],
    ["cleaning",           /\b(vacuum|steam\s*mop|mop|carpet\s*cleaner|bissell|hoover|shark|rug\s*doctor|cleaner|scrubber|spot\s*cleaner|carpet\s*wash|air\s*purifier|dehumidifier|humidifier)\b/i],
    ["tools",              /\b(drill|driver|saw|hammer|wrench|screwdriver|dewalt|milwaukee|makita|ryobi|craftsman|impact\s*driver|nail\s*gun|tool\s*kit|tool\s*set|multitool)\b/i],
    ["outdoor",            /\b(mower|lawn|trimmer|leaf\s*blower|hedge|snow\s*blower|automower|garden\s*hose|sprinkler|weed\s*eater|edger|patio|deck|pool|outdoor\s*furniture)\b/i],
    ["grill",              /\b(grill|smoker|traeger|weber|ooni|pizza\s*oven|barbecue|bbq|charcoal|propane\s*grill)\b/i],
    ["bedding",            /\b(sheet|pillow|duvet|comforter|mattress|blanket|bed\s*skirt|bath\s*towel|hand\s*towel|shower\s*curtain|bath\s*mat|robe)\b/i],
    ["decor",              /\b(picture\s*frame|wall\s*art|poster|painting|canvas|mirror|vase|rug|throw\s*pillow|candle|wreath|clock|figurine|sculpture|sign\b)\b/i],
    ["storage",            /\b(shelf|shelving|storage|organizer|bin|closet|drawer|rack|hanger|elfa|container|basket|hook)\b/i],
    ["other-home",         /.*/],
  ],
  Baby: [
    ["strollers",          /\b(stroller|jogger|uppababy|bugaboo|nuna|city\s*mini)\b/i],
    ["car-seats",          /\b(car\s*seat|booster|infant\s*seat|doona|convertible\s*seat|graco|britax|chicco)\b/i],
    ["monitors",           /\b(baby\s*monitor|owlet|nanit|vtech|infant\s*optics|smart\s*sock|dream\s*sock|nursery\s*camera)\b/i],
    ["feeding",            /\b(bottle|nipple|breast\s*pump|formula|haakaa|medela|elvie|bib|highchair|high\s*chair|sippy|feeding|bottle\s*warmer|steriliz)\b/i],
    ["nursery",            /\b(bassinet|crib|swing|snoo|mamaroo|diaper\s*pail|swaddle|sleep\s*sack|white\s*noise|nightlight|sanitizer|humidifier)\b/i],
    ["gear",               /\b(carrier|babybjorn|ergobaby|diaper\s*bag|backpack|wrap|sling)\b/i],
    ["gear",               /.*/],
  ],
  Beauty: [
    ["skincare",           /\b(cream|serum|moisturizer|cleanser|toner|sunscreen|spf|retinol|hyaluronic|vitamin\s*c|niacinamide|la\s*mer|drunk\s*elephant|charlotte\s*tilbury|skinceuticals|sunday\s*riley)\b/i],
    ["makeup",             /\b(lipstick|lip\s*gloss|mascara|foundation|concealer|blush|bronzer|palette|eyeshadow|highlighter|eyeliner|brow|liner|makeup)\b/i],
    ["fragrance",          /\b(perfume|eau\s*de|cologne|fragrance|parfum|toilette|chanel|byredo|le\s*labo|maison\s*margiela|jo\s*malone)\b/i],
    ["nail",               /\b(nail|polish|gel|manicure|pedicure|opi|essie|dip\s*powder|nail\s*file|cuticle)\b/i],
    ["tools",              /\b(brush|sponge|beautyblender|sigma|makeup\s*brush|blender|applicator|puff|mirror)\b/i],
    ["skincare",           /.*/],
  ],
  "School Supplies": [
    ["backpacks",          /\b(backpack|book\s*bag|lunch\s*bag|school\s*bag|rolling\s*bag|messenger\s*bag|tote|duffel)\b/i],
    ["notebooks",          /\b(notebook|journal|composition|spiral|binder|folder|loose\s*leaf|paper|filler\s*paper|graph\s*paper|index\s*card|sticky\s*note|post[- ]?it)\b/i],
    ["writing",            /\b(pen|pencil|marker|highlighter|crayon|colored\s*pencil|sharpie|expo|dry[- ]?erase|art\s*supplies|paint|watercolor|acrylic|brush|canvas|sketchbook|drawing|charcoal|pastel)\b/i],
    ["calculators",        /\b(calculator|graphing|scientific\s*calculator|ti[- ]?[0-9]+|casio|hp\s*prime)\b/i],
    ["desk",               /\b(desk\s*organizer|pencil\s*case|pencil\s*box|stapler|tape\s*dispenser|scissors|hole\s*punch|paper\s*clip|binder\s*clip|rubber\s*band|thumb\s*tack|push\s*pin|desk\s*mat|desk\s*pad)\b/i],
    ["lunch",              /\b(lunch\s*box|bento|water\s*bottle|thermos|lunch\s*bag|snack)\b/i],
    ["planners",           /\b(planner|agenda|calendar|day\s*planner|weekly|monthly)\b/i],
    ["writing",            /.*/],
  ],
};

function classify(category, name, brand) {
  const rules = RULES[category];
  if (!rules) return null;
  const text = `${brand ?? ""} ${name ?? ""}`.toLowerCase();
  for (const [sub, rx] of rules) {
    if (rx.test(text)) return sub;
  }
  return null;
}

console.log("Loading all products...");
const all = [];
for (let p = 0; p < 200; p++) {
  const { data } = await supa
    .from("products")
    .select("id, slug, name, brand, category, external_ids")
    .range(p * 1000, (p + 1) * 1000 - 1);
  if (!data || data.length === 0) break;
  all.push(...data);
  if (data.length < 1000) break;
}
console.log(`  ${all.length} products loaded`);

const perCat = {};
const updates = [];
for (const p of all) {
  if (!p.category) continue;
  const existing = p.external_ids?.sub;
  const sub = classify(p.category, p.name, p.brand);
  if (!sub) continue;
  if (existing === sub) continue;
  updates.push({ id: p.id, external_ids: { ...(p.external_ids ?? {}), sub } });
  perCat[p.category] = perCat[p.category] ?? {};
  perCat[p.category][sub] = (perCat[p.category][sub] ?? 0) + 1;
}

console.log(`\n${updates.length} products need subcategory updates`);
console.log("\nBreakdown by category:");
for (const [cat, subs] of Object.entries(perCat)) {
  console.log(`  ${cat}:`);
  for (const [sub, n] of Object.entries(subs).sort((a,b)=>b[1]-a[1])) {
    console.log(`    ${sub.padEnd(24)} ${n}`);
  }
}

let done = 0;
for (let i = 0; i < updates.length; i += 200) {
  const chunk = updates.slice(i, i + 200);
  // Supabase JS doesn't support bulk-update by id; do it per row (fast enough)
  await Promise.all(
    chunk.map((u) =>
      supa.from("products").update({ external_ids: u.external_ids }).eq("id", u.id)
    )
  );
  done += chunk.length;
  process.stdout.write(`  ${done}/${updates.length}\r`);
}
console.log(`\n✓ ${done} updated\n`);
