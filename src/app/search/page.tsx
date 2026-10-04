import SearchBar from "@/components/SearchBar";
import ProductCard from "@/components/ProductCard";
import { unstable_cache } from "next/cache";
import { publicSupabase, supabaseConfigured } from "@/lib/supabase";
import { CARD_COLUMNS, unwrap } from "@/lib/db";
import type { Product } from "@/lib/types";

export const revalidate = 60;

const searchProducts = unstable_cache(
  async (query: string): Promise<Product[]> => {
    // Strip LIKE wildcards and PostgREST filter syntax so input can't alter the .or() filter.
    const safe = query.replace(/[%_\\(),"]/g, " ").trim();
    if (!safe) return [];
    const data = unwrap(
      await publicSupabase()
        .from("products")
        .select(CARD_COLUMNS)
        .or(`name.ilike.%${safe}%,brand.ilike.%${safe}%`)
        .order("regret_score", { ascending: false })
        .limit(50),
      "search",
    );
    return (data as unknown as Product[]) ?? [];
  },
  ["search-v2"],
  { revalidate: 86400 },
);

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const query = q.trim();

  let results: Product[] = [];
  if (query && supabaseConfigured) {
    results = await searchProducts(query.toLowerCase());
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-8">
        <SearchBar initial={query} />
      </div>
      {!query ? (
        <p className="text-center text-slate-500">Type a product to see its Regret Score.</p>
      ) : results.length ? (
        <>
          <h1 className="mb-4 text-lg font-semibold text-slate-900">
            {results.length} result{results.length === 1 ? "" : "s"} for &ldquo;{query}&rdquo;
          </h1>
          <div className="grid gap-4 md:grid-cols-2">
            {results.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <h1 className="text-lg font-semibold text-slate-900">No matches for &ldquo;{query}&rdquo;</h1>
          <p className="mt-2 text-sm text-slate-600">
            {supabaseConfigured
              ? "We'll estimate a Regret Score for it. Add it to the database from your dashboard."
              : "Set up Supabase to enable search over your seeded catalog."}
          </p>
        </div>
      )}
    </div>
  );
}
