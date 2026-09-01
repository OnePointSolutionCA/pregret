export const dynamic = "force-static";

export const metadata = { title: "About Pregret" };

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold text-slate-900">About Pregret</h1>
      <div className="prose prose-slate mt-6 max-w-none">
        <p className="text-lg text-slate-700">
          Every product review site has the same blind spot: reviews are written on day one, when people are still in
          the honeymoon phase. Nobody tracks how buyers feel three months in — after the returns window closes.
        </p>
        <p className="text-slate-700">
          Pregret is different. We ask owners a one-tap question at 30, 60, and 90 days: <em>do you still love it?</em>
          Then we turn those answers into a Regret Score you can check before you buy.
        </p>
        <h2 className="mt-8 text-xl font-bold text-slate-900">How the score works</h2>
        <p className="text-slate-700">
          Day 90 responses carry the most weight — they&apos;re the truest signal that a product earned its price. AI
          seed data fills the gaps until enough real owners have chimed in.
        </p>
        <h2 className="mt-8 text-xl font-bold text-slate-900">How we make money</h2>
        <p className="text-slate-700">
          When a product has a high Regret Score, we recommend better alternatives. If you buy one through our link, we
          get a small commission. That&apos;s it. The scores are never for sale.
        </p>
      </div>
    </div>
  );
}
