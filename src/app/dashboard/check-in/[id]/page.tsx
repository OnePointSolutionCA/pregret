import { notFound, redirect } from "next/navigation";
import CheckInPrompt from "@/components/CheckInPrompt";
import { serverSupabase, supabaseConfigured } from "@/lib/supabase";
import type { Product, UserProduct } from "@/lib/types";

export const dynamic = "force-dynamic";

type Row = UserProduct & { product: Product };

function pending(r: UserProduct): 30 | 60 | 90 | null {
  const days = (Date.now() - new Date(r.added_at).getTime()) / 86_400_000;
  if (days >= 90 && r.satisfaction_day90 == null) return 90;
  if (days >= 60 && r.satisfaction_day60 == null) return 60;
  if (days >= 30 && r.satisfaction_day30 == null) return 30;
  return null;
}

export default async function CheckInPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!supabaseConfigured) notFound();
  const supabase = await serverSupabase();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect(`/login?next=/dashboard/check-in/${id}`);

  const { data } = await supabase
    .from("user_products")
    .select("*, product:product_id(*)")
    .eq("id", id)
    .maybeSingle();
  const row = data as unknown as Row | null;
  if (!row || !row.product) notFound();

  const milestone = pending(row);

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      {milestone ? (
        <CheckInPrompt userProductId={row.id} productName={row.product.name} milestone={milestone} />
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
          <h1 className="text-lg font-semibold text-slate-900">All caught up</h1>
          <p className="mt-2 text-sm text-slate-600">Nothing to rate for {row.product.name} yet. Come back later.</p>
        </div>
      )}
    </div>
  );
}
