import Link from "next/link";
import { redirect } from "next/navigation";
import { serverSupabase, supabaseConfigured } from "@/lib/supabase";
import type { Product, UserProduct } from "@/lib/types";

export const dynamic = "force-dynamic";

type Row = UserProduct & { product: Product };

export default async function Dashboard() {
  if (!supabaseConfigured) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard offline</h1>
        <p className="mt-2 text-slate-600">Set your Supabase env vars to enable accounts and tracking.</p>
      </div>
    );
  }

  const supabase = await serverSupabase();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/login?next=/dashboard");

  const { data } = await supabase
    .from("user_products")
    .select("*, product:product_id(*)")
    .order("added_at", { ascending: false });
  const rows = ((data as unknown as Row[]) ?? []).filter((r) => r.product);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-6 flex items-baseline justify-between">
        <h1 className="text-3xl font-bold text-slate-900">My products</h1>
        <Link href="/" className="text-sm font-semibold text-[var(--brand-navy)] hover:text-[var(--brand-navy-2)]">
          Add another →
        </Link>
      </div>
      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="text-slate-600">Nothing tracked yet.</p>
          <Link
            href="/"
            className="mt-4 inline-block rounded-lg bg-[var(--brand-navy)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--brand-navy-2)]"
          >
            Find your first product
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => {
            const next = pendingCheckIn(r);
            return (
              <li key={r.id} className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 bg-white p-4">
                <div className="min-w-0 flex-1">
                  <div className="text-xs uppercase tracking-wider text-slate-500">{r.product.brand}</div>
                  <Link href={`/product/${r.product.slug}`} className="block truncate font-semibold text-slate-900 hover:text-[var(--brand-navy)]">
                    {r.product.name}
                  </Link>
                  <div className="text-xs text-slate-500">Added {new Date(r.added_at).toLocaleDateString()}</div>
                </div>
                {next ? (
                  <Link
                    href={`/dashboard/check-in/${r.id}`}
                    className="rounded-lg bg-[var(--brand-navy)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--brand-navy-2)]"
                  >
                    Day {next} check-in
                  </Link>
                ) : (
                  <span className="text-xs font-medium text-slate-500">All check-ins done</span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function pendingCheckIn(r: UserProduct): 30 | 60 | 90 | null {
  const ms = Date.now() - new Date(r.added_at).getTime();
  const days = ms / 86_400_000;
  if (days >= 90 && r.satisfaction_day90 == null) return 90;
  if (days >= 60 && r.satisfaction_day60 == null) return 60;
  if (days >= 30 && r.satisfaction_day30 == null) return 30;
  return null;
}
