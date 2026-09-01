/**
 * Thin coral strip above the sticky nav. Server-rendered — no JS.
 * Uses the same CSS marquee as PromoBar (in globals.css) for a subtle drift.
 */
const MESSAGES = [
  "Owner-verified regret scores",
  "Serving the US and Canada",
  "Day 30, 60, 90 satisfaction data",
  "Compare across Amazon, Best Buy, Walmart and more",
];

export default function AnnouncementBar() {
  return (
    <div className="rd-announce" aria-label="Site announcements">
      <div className="rd-announce__inner">
        {[0, 1].map((k) => (
          <div key={k} className="flex gap-8">
            {MESSAGES.map((m, i) => (
              <span key={i} className="flex items-center gap-2 whitespace-nowrap">
                <span className="rd-announce__dot">◆</span>
                {m}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
