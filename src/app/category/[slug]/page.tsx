import { notFound } from "next/navigation";
import ProductCard from "@/components/ProductCard";
import { serverSupabase, supabaseConfigured } from "@/lib/supabase";
import type { Product } from "@/lib/types";

const CATEGORIES: Record<string, string> = {
  electronics: "Electronics",
  kitchen: "Kitchen",
  fitness: "Fitness",
  "personal-care": "Personal Care",
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const label = CATEGORIES[slug];
  return {
    title: label ? `Most regretted ${label.toLowerCase()} products` : "Category",
    description: label
      ? `See which ${label.toLowerCase()} products owners regret the most — long-term satisfaction data.`
      : undefined,
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const label = CATEGORIES[slug];
  if (!label) notFound();

  let items: Product[] = [];
  if (supabaseConfigured) {
    const supabase = await serverSupabase();
    const { data } = await supabase
      .from("products")
      .select("*")
      .eq("category", label)
      .order("regret_score", { ascending: false })
      .limit(60);
    items = (data as Product[]) ?? [];
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-6">
        <div className="text-sm uppercase tracking-wider text-slate-500">Category</div>
        <h1 className="text-3xl font-bold text-slate-900">Most regretted {label.toLowerCase()}</h1>
      </div>
      {items.length ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
          {supabaseConfigured ? "No products seeded in this category yet." : "Set up Supabase to browse this category."}
        </p>
      )}
    </div>
  );
}
