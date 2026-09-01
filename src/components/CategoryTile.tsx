import Link from "next/link";

export default function CategoryTile({
  categorySlug,
  categoryLabel,
  heroImage,
  badge,
}: {
  categorySlug: string;
  categoryLabel: string;
  count?: number;
  heroImage: string | null;
  badge?: string;
}) {
  return (
    <Link
      href={`/category/${categorySlug}`}
      className="rd-cat group border border-[var(--rule)] transition hover:border-[var(--brand-coral)]"
      aria-label={`Browse ${categoryLabel}`}
    >
      {badge && <span className="rd-cat__badge">{badge}</span>}
      {heroImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={heroImage} alt="" loading="lazy" />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center font-display text-6xl italic text-[var(--brand-navy)] opacity-25">
          {categoryLabel.slice(0, 1)}
        </div>
      )}
      <div className="rd-cat__label">
        <h3>{categoryLabel}</h3>
      </div>
    </Link>
  );
}
