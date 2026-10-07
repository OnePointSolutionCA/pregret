export const dynamic = "force-static";

export const metadata = {
  title: "Terms",
  description: "Terms of service for Pregret, the free community rating service that tracks how buyers feel about products 30, 60 and 90 days after purchase.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold text-slate-900">Terms of service</h1>
      <div className="prose prose-slate mt-6 max-w-none text-slate-700">
        <p>
          Pregret is a free, community-powered rating service. Regret Scores are estimates — not warranties or purchase
          advice. Do your own research before buying. Product links may be affiliate links; commissions never influence
          the scores.
        </p>
        <p>By using Pregret you agree not to submit fake ratings, scrape the site, or otherwise game the data.</p>
      </div>
    </div>
  );
}
