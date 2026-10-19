import { notFound, permanentRedirect } from "next/navigation";
import BrowseList, { browseMetadata } from "@/components/BrowseList";
import { BROWSE_PAGES } from "@/lib/listed-products";

// Rendered on first request, then cached for a week. Only pages 2 to BROWSE_PAGES exist.
export const revalidate = 604800;
export const dynamicParams = true;

export function generateStaticParams() {
  return [];
}

function parsePage(raw: string): number | null {
  if (!/^\d{1,4}$/.test(raw)) return null;
  const n = Number(raw);
  return n >= 1 && n <= BROWSE_PAGES ? n : null;
}

export async function generateMetadata({ params }: { params: Promise<{ page: string }> }) {
  const n = parsePage((await params).page);
  if (!n || n === 1) return { title: "Browse" };
  return browseMetadata(n);
}

export default async function BrowseNumberedPage({ params }: { params: Promise<{ page: string }> }) {
  const n = parsePage((await params).page);
  if (!n) notFound();
  if (n === 1) permanentRedirect("/browse");
  return <BrowseList page={n} />;
}
