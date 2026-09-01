/**
 * Subcategory taxonomy — maps every seeded product to a subcategory within
 * its parent category. Kept in code (not the DB) so we can iterate on the
 * taxonomy without another migration. Read by src/app/category/[slug]/page.tsx
 * to render filter pills and narrow the product list.
 */

export type Category =
  | "Electronics"
  | "Kitchen"
  | "Fitness"
  | "Personal Care"
  | "Home & Garden"
  | "Baby"
  | "Beauty"
  | "School Supplies"
  | "Fashion"
  | "Automotive"
  | "Toys & Games"
  | "Pet Supplies"
  | "Tools & Home Improvement"
  | "Arts & Crafts"
  | "Gaming";

export type SubcategoryDef = {
  slug: string;
  label: string;
};

export const CATEGORY_ORDER: { slug: string; label: Category }[] = [
  { slug: "electronics",   label: "Electronics" },
  { slug: "kitchen",       label: "Kitchen" },
  { slug: "fitness",       label: "Fitness" },
  { slug: "personal-care", label: "Personal Care" },
  { slug: "home-garden",   label: "Home & Garden" },
  { slug: "baby",          label: "Baby" },
  { slug: "beauty",        label: "Beauty" },
  { slug: "school-supplies", label: "School Supplies" },
  { slug: "fashion",         label: "Fashion" },
  { slug: "automotive",      label: "Automotive" },
  { slug: "toys-games",      label: "Toys & Games" },
  { slug: "pet-supplies",    label: "Pet Supplies" },
  { slug: "tools-home-improvement", label: "Tools & Home Improvement" },
  { slug: "arts-crafts",     label: "Arts & Crafts" },
  { slug: "gaming",          label: "Gaming" },
];

export const SUBCATEGORIES: Record<Category, SubcategoryDef[]> = {
  Electronics: [
    { slug: "headphones", label: "Headphones & Earbuds" },
    { slug: "speakers", label: "Speakers" },
    { slug: "tvs", label: "TVs & Displays" },
    { slug: "vacuums", label: "Vacuums" },
    { slug: "cameras", label: "Cameras & Drones" },
    { slug: "vr", label: "VR & AR" },
    { slug: "readers", label: "E-readers & Tablets" },
    { slug: "phones", label: "Phones" },
    { slug: "wearables", label: "Wearables" },
    { slug: "smart-home", label: "Smart Home" },
    { slug: "cardio", label: "Cardio Equipment" },
    { slug: "power", label: "Power & Accessories" },
    { slug: "consoles", label: "Gaming Consoles" },
    { slug: "gaming-accessories", label: "Gaming Accessories" },
    { slug: "other-electronics", label: "Other Electronics" },
  ],
  Kitchen: [
    { slug: "coffee", label: "Coffee & Espresso" },
    { slug: "blenders", label: "Blenders" },
    { slug: "small-appliances", label: "Small Appliances" },
    { slug: "cookware", label: "Cookware" },
    { slug: "drinkware", label: "Drinkware & Beverage" },
    { slug: "premium", label: "Premium / Multi-cookers" },
  ],
  Fitness: [
    { slug: "cardio", label: "Cardio Machines" },
    { slug: "strength", label: "Strength & Racks" },
    { slug: "recovery", label: "Recovery" },
    { slug: "wearables", label: "Wearables" },
    { slug: "smart", label: "Smart Studio" },
    { slug: "suspension", label: "Suspension & Bodyweight" },
    { slug: "supplements", label: "Supplements & Nutrition" },
    { slug: "apparel", label: "Apparel & Gear" },
    { slug: "yoga", label: "Yoga & Pilates" },
    { slug: "padel", label: "Padel" },
    { slug: "racquet-sports", label: "Tennis & Racquet Sports" },
    { slug: "basketball", label: "Basketball" },
    { slug: "soccer", label: "Soccer & Football" },
    { slug: "baseball", label: "Baseball & Softball" },
    { slug: "golf", label: "Golf" },
    { slug: "cycling", label: "Cycling" },
    { slug: "running", label: "Running" },
    { slug: "skate", label: "Skate & Scooter" },
    { slug: "winter", label: "Ski & Snow" },
    { slug: "water", label: "Water Sports" },
    { slug: "fishing", label: "Fishing" },
    { slug: "hunting", label: "Hunting & Archery" },
    { slug: "outdoor", label: "Camping & Hiking" },
    { slug: "outdoor-gear", label: "Outdoor Gear" },
  ],
  "Personal Care": [
    { slug: "haircare", label: "Haircare Tools" },
    { slug: "shavers", label: "Shavers & Trimmers" },
    { slug: "oral-care", label: "Oral Care" },
    { slug: "skincare-devices", label: "Skincare Devices" },
    { slug: "hair-removal", label: "Hair Removal" },
  ],
  "Home & Garden": [
    { slug: "cleaning", label: "Cleaning" },
    { slug: "tools", label: "Tools & DIY" },
    { slug: "outdoor", label: "Outdoor & Lawn" },
    { slug: "grill", label: "Grills & Outdoor Cooking" },
    { slug: "smart-home", label: "Smart Home" },
    { slug: "lighting", label: "Lighting" },
    { slug: "decor", label: "Home Décor" },
    { slug: "bedding", label: "Bedding & Bath" },
    { slug: "storage", label: "Storage & Organization" },
    { slug: "other-home", label: "Other Home" },
  ],
  Baby: [
    { slug: "strollers", label: "Strollers" },
    { slug: "car-seats", label: "Car Seats" },
    { slug: "monitors", label: "Monitors" },
    { slug: "feeding", label: "Feeding" },
    { slug: "nursery", label: "Nursery & Sleep" },
    { slug: "gear", label: "Gear & Carriers" },
  ],
  Beauty: [
    { slug: "skincare", label: "Skincare" },
    { slug: "makeup", label: "Makeup" },
    { slug: "fragrance", label: "Fragrance" },
    { slug: "nail", label: "Nail" },
    { slug: "tools", label: "Beauty Tools" },
  ],
  "School Supplies": [
    { slug: "backpacks", label: "Backpacks & Bags" },
    { slug: "notebooks", label: "Notebooks & Paper" },
    { slug: "writing", label: "Writing & Art" },
    { slug: "calculators", label: "Calculators & Tech" },
    { slug: "desk", label: "Desk & Storage" },
    { slug: "lunch", label: "Lunch & Water Bottles" },
    { slug: "planners", label: "Planners & Agendas" },
  ],
  Fashion: [
    { slug: "clothing", label: "Clothing" },
    { slug: "shoes", label: "Shoes & Sneakers" },
    { slug: "jewelry", label: "Jewelry & Watches" },
    { slug: "handbags", label: "Handbags & Wallets" },
    { slug: "sunglasses", label: "Sunglasses & Eyewear" },
    { slug: "luggage", label: "Luggage & Travel" },
    { slug: "activewear", label: "Activewear" },
  ],
  Automotive: [
    { slug: "electronics", label: "Car Electronics" },
    { slug: "accessories", label: "Interior Accessories" },
    { slug: "exterior", label: "Exterior & Detailing" },
    { slug: "maintenance", label: "Maintenance & Tools" },
    { slug: "safety", label: "Safety & Emergency" },
    { slug: "lighting", label: "Lighting & Bulbs" },
  ],
  "Toys & Games": [
    { slug: "building", label: "Building & LEGO" },
    { slug: "board-games", label: "Board Games & Puzzles" },
    { slug: "stem", label: "STEM & Educational" },
    { slug: "outdoor", label: "Outdoor Play" },
    { slug: "dolls", label: "Dolls & Action Figures" },
    { slug: "rc", label: "RC & Vehicles" },
    { slug: "collectibles", label: "Collectibles" },
    { slug: "party", label: "Party & Decorations" },
  ],
  "Pet Supplies": [
    { slug: "dog", label: "Dog Supplies" },
    { slug: "cat", label: "Cat Supplies" },
    { slug: "fish", label: "Fish & Aquarium" },
    { slug: "beds", label: "Beds & Furniture" },
    { slug: "feeding", label: "Feeders & Bowls" },
    { slug: "grooming", label: "Grooming" },
    { slug: "toys", label: "Pet Toys" },
    { slug: "tech", label: "Pet Tech & Cameras" },
  ],
  "Tools & Home Improvement": [
    { slug: "power-tools", label: "Power Tools" },
    { slug: "hand-tools", label: "Hand Tools" },
    { slug: "smart-home", label: "Smart Home & Locks" },
    { slug: "plumbing", label: "Plumbing & Electrical" },
    { slug: "hardware", label: "Hardware" },
    { slug: "painting", label: "Painting & Finishing" },
    { slug: "storage", label: "Garage & Storage" },
  ],
  "Arts & Crafts": [
    { slug: "sewing", label: "Sewing & Knitting" },
    { slug: "painting", label: "Painting & Drawing" },
    { slug: "crafting", label: "Crafting Machines" },
    { slug: "beading", label: "Beading & Jewelry Making" },
    { slug: "scrapbooking", label: "Scrapbooking" },
    { slug: "3d-printing", label: "3D Printing" },
  ],
  Gaming: [
    { slug: "consoles", label: "Consoles" },
    { slug: "controllers", label: "Controllers & Accessories" },
    { slug: "headsets", label: "Gaming Headsets" },
    { slug: "pc-gaming", label: "PC Gaming" },
    { slug: "chairs", label: "Gaming Chairs & Desks" },
    { slug: "vr", label: "VR Gaming" },
  ],
};

/**
 * Slug → subcategory-slug mapping for the seeded catalog.
 * Any product not in this map falls into "Other".
 */
const PRODUCT_SUBCATEGORY: Record<string, string> = {
  // ----- Electronics -----
  "sony-wh-1000xm5": "headphones",
  "apple-airpods-max": "headphones",
  "bose-quietcomfort-ultra": "headphones",
  "sonos-era-300": "speakers",
  "lg-c3-65-oled-tv": "tvs",
  "kindle-scribe": "readers",
  "dyson-v15-detect": "vacuums",
  "irobot-roomba-j7": "vacuums",
  "gopro-hero-12-black": "cameras",
  "dji-mini-3-pro": "cameras",
  "meta-quest-3": "vr",
  "samsung-galaxy-z-fold-5": "phones",
  "oura-ring-gen-3": "wearables",
  "ring-video-doorbell-pro-2": "smart-home",
  "peloton-bike": "cardio",
  "anker-737-power-bank": "power",

  // ----- Kitchen -----
  "breville-barista-express": "coffee",
  "keurig-k-supreme-plus": "coffee",
  "nespresso-vertuo-next": "coffee",
  "vitamix-a3500": "blenders",
  "instant-pot-duo-7-in-1": "small-appliances",
  "ninja-foodi-air-fryer": "small-appliances",
  "ninja-creami": "small-appliances",
  "kitchenaid-artisan-stand-mixer": "small-appliances",
  "cuisinart-food-processor-14-cup": "small-appliances",
  "lodge-cast-iron-skillet-12": "cookware",
  "our-place-always-pan": "cookware",
  "sodastream-art": "drinkware",
  "yeti-rambler-30oz-tumbler": "drinkware",
  "ember-mug-2": "drinkware",
  "thermomix-tm6": "premium",

  // ----- Fitness -----
  "peloton-tread": "cardio",
  "nordictrack-commercial-1750-treadmill": "cardio",
  "hydrow-rower": "cardio",
  "concept2-rowerg": "cardio",
  "bowflex-selecttech-552-dumbbells": "strength",
  "rep-fitness-pr-4000-rack": "strength",
  "theragun-elite": "recovery",
  "hyperice-normatec-3-legs": "recovery",
  "whoop-4-0": "wearables",
  "garmin-forerunner-265": "wearables",
  "apple-watch-ultra-2": "wearables",
  "lululemon-studio-mirror": "smart",
  "tempo-studio": "smart",
  "trx-pro4-system": "suspension",

  // ----- Personal Care -----
  "dyson-airwrap-complete": "haircare",
  "dyson-supersonic": "haircare",
  "ghd-original-styler": "haircare",
  "shark-flexstyle": "haircare",
  "revlon-one-step-volumizer-plus": "haircare",
  "t3-aireluxe": "haircare",
  "braun-series-9-pro": "shavers",
  "philips-norelco-9500": "shavers",
  "panasonic-arc5-es-lv97": "shavers",
  "manscaped-lawn-mower-5-ultra": "shavers",
  "wahl-beard-trimmer-9918": "shavers",
  "oral-b-io-series-9": "oral-care",
  "philips-sonicare-diamondclean-smart-9500": "oral-care",
  "waterpik-aquarius-water-flosser": "oral-care",
  "foreo-luna-3": "skincare-devices",
  "nuface-trinity-plus": "skincare-devices",
  "solawave-4-in-1-wand": "skincare-devices",
  "theraface-pro": "skincare-devices",
  "braun-silk-expert-pro-5-ipl": "hair-removal",
  "ulike-air-10-ipl": "hair-removal",

  // ----- Home & Garden -----
  "shark-navigator-lift-away-deluxe": "cleaning",
  "bissell-crosswave-pet-pro": "cleaning",
  "bissell-little-green-portable": "cleaning",
  "shark-steam-pocket-mop": "cleaning",
  "dewalt-dcf887b-impact-driver": "tools",
  "milwaukee-m18-fuel-combo": "tools",
  "makita-xph14z-hammer-drill": "tools",
  "ryobi-p1817-one-plus-drill": "tools",
  "ego-power-plus-21-inch-mower": "outdoor",
  "greenworks-40v-20-inch-mower": "outdoor",
  "husqvarna-automower-315x": "outdoor",
  "weber-genesis-ii-grill": "grill",
  "traeger-ironwood-885": "grill",
  "ooni-koda-16": "grill",
  "nest-learning-thermostat-3rd-gen": "smart-home",
  "ecobee-smart-thermostat-premium": "smart-home",
  "philips-hue-starter-kit": "smart-home",
  "lutron-caseta-smart-dimmer-kit": "smart-home",
  "simplehuman-trash-can-55l": "storage",
  "container-store-elfa-shelving": "storage",

  // ----- Baby -----
  "uppababy-vista-v2": "strollers",
  "bugaboo-fox-5": "strollers",
  "nuna-mixx-next": "strollers",
  "baby-jogger-city-mini-gt2": "strollers",
  "doona-car-seat": "car-seats",
  "uppababy-mesa-v2": "car-seats",
  "nuna-pipa-rx": "car-seats",
  "britax-grow-with-you": "car-seats",
  "chicco-fit4-4-in-1": "car-seats",
  "owlet-dream-sock": "monitors",
  "nanit-pro-smart-monitor": "monitors",
  "vtech-vm819-baby-monitor": "monitors",
  "baby-brezza-formula-pro-advanced": "feeding",
  "haakaa-silicone-breast-pump": "feeding",
  "snoo-smart-sleeper-bassinet": "nursery",
  "4moms-mamaroo-5": "nursery",
  "munchkin-59s-uv-sanitizer": "nursery",
  "ubbi-diaper-pail": "nursery",
  "babybjorn-baby-carrier-free": "gear",
  "petunia-pickle-bottom-diaper-bag": "gear",

  // ----- Beauty -----
  "charlotte-tilbury-magic-cream": "skincare",
  "la-mer-creme-de-la-mer": "skincare",
  "drunk-elephant-protini": "skincare",
  "skinceuticals-ce-ferulic": "skincare",
  "sunday-riley-good-genes": "skincare",
  "rare-beauty-soft-pinch-blush": "makeup",
  "fenty-beauty-pro-filtr-foundation": "makeup",
  "charlotte-tilbury-pillow-talk-lipstick": "makeup",
  "pat-mcgrath-mothership-palette": "makeup",
  "urban-decay-naked-palette": "makeup",
  "anastasia-brow-wiz": "makeup",
  "chanel-no-5-eau-de-parfum": "fragrance",
  "le-labo-santal-33": "fragrance",
  "byredo-gypsy-water": "fragrance",
  "maison-margiela-replica-jazz-club": "fragrance",
  "opi-nail-lacquer": "nail",
  "essie-nail-polish": "nail",
  "nailtiques-formula-2": "nail",
  "beautyblender-original-sponge": "tools",
  "sigma-beauty-f80-brush": "tools",
};

export function subcategoryOf(slug: string): string | null {
  return PRODUCT_SUBCATEGORY[slug] ?? null;
}

export function categoryFromSlug(slug: string): Category | null {
  const entry = CATEGORY_ORDER.find((c) => c.slug === slug);
  return entry?.label ?? null;
}

export function categorySlugFromLabel(label: Category): string | null {
  return CATEGORY_ORDER.find((c) => c.label === label)?.slug ?? null;
}

export function subcategoryLabel(category: Category, slug: string): string | null {
  return SUBCATEGORIES[category]?.find((s) => s.slug === slug)?.label ?? null;
}
