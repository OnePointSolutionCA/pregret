import type { MetadataRoute } from "next";
import { CATEGORY_ORDER } from "@/lib/subcategories";
import { publicSupabase, supabaseConfigured } from "@/lib/supabase";
import { unwrap } from "@/lib/db";
import { POSTS } from "@/data/blog";
import { BROWSE_PAGES, LISTED_PRODUCT_CAP, browsePath, listedProducts } from "@/lib/listed-products";

export const revalidate = 86400;

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://pregret.ca";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticPages = [
    "", "/about", "/how-it-works", "/privacy", "/terms", "/blog", "/categories", "/deals",
  ].map((p) => ({
    url: `${SITE}${p}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: p === "" ? 1 : 0.7,
  }));

  const categoryPages = CATEGORY_ORDER.map((c) => ({
    url: `${SITE}/category/${c.slug}`,
    lastModified: now,
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));

  // /browse pages link every product listed below, so none of them is an orphan.
  const browsePages = Array.from({ length: BROWSE_PAGES }, (_, i) => ({
    url: `${SITE}${browsePath(i + 1)}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.4,
  }));

  const blogPages = POSTS.map((post) => ({
    url: `${SITE}/blog/${post.slug}`,
    lastModified: new Date(post.modifiedDate ?? post.publishedDate),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  let productPages: MetadataRoute.Sitemap = [];
  if (supabaseConfigured) {
    const supabase = publicSupabase();
    const rows: { slug: string; updated_at?: string }[] = [];
    for (let page = 0; page * 1000 < LISTED_PRODUCT_CAP; page++) {
      const data = unwrap(
        await listedProducts(supabase, "slug, updated_at", page * 1000, (page + 1) * 1000 - 1),
        "sitemap products",
      ) as unknown as { slug: string; updated_at?: string }[] | null;
      if (!data || data.length === 0) break;
      rows.push(...data);
      if (data.length < 1000) break;
    }
    productPages = rows.slice(0, LISTED_PRODUCT_CAP).map((p) => ({
      url: `${SITE}/product/${p.slug}`,
      lastModified: p.updated_at ? new Date(p.updated_at) : now,
      changeFrequency: "weekly" as const,
      priority: 0.5,
    }));
  }

  return [...staticPages, ...categoryPages, ...browsePages, ...blogPages, ...productPages];
}
