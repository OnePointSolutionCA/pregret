/**
 * Marquee-style promo strip. Content is duplicated so the CSS translate loop
 * seamlessly repeats without a gap. Server-rendered — no JS needed.
 */
const MESSAGES = [
  "Owner-verified regret scores",
  "Serving the US and Canada",
  "Day 30, 60, 90 satisfaction data",
  "Every score is transparent",
  "Real owners. Real time.",
  "The truth beyond launch-week reviews",
];

export default function PromoBar() {
  return (
    <div className="rd-promo" role="marquee" aria-label="Site highlights">
      <div className="rd-promo__inner">
        {[0, 1].map((k) => (
          <div key={k} className="flex gap-12">
            {MESSAGES.map((m, i) => (
              <span key={i} className="flex items-center gap-3">
                <span className="rd-promo__dot">✦</span>
                {m}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
