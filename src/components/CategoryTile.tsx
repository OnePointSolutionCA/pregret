import Link from "next/link";

export default function CategoryTile({
  categorySlug,
  categoryLabel,
  heroImage,
}: {
  categorySlug: string;
  categoryLabel: string;
  heroImage: string | null;
}) {
  return (
    <Link
      href={`/category/${categorySlug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-[var(--rule)] bg-white transition duration-300 hover:-translate-y-0.5 hover:border-[var(--brand-coral)] hover:shadow-[0_20px_40px_-24px_rgba(12,58,94,0.35)]"
    >
      <div className="relative aspect-[4/3] bg-[var(--brand-cream-2)]">
        {heroImage ? (
          // Multiply drops the white backdrop baked into Amazon product photos.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={heroImage}
            alt=""
            loading="lazy"
            decoding="async"
            className="absolute inset-0 h-full w-full object-contain p-[14%] mix-blend-multiply transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center font-display text-5xl italic text-[var(--brand-navy)] opacity-20">
            {categoryLabel.slice(0, 1)}
          </div>
        )}
      </div>
      <div className="flex flex-1 items-center justify-between gap-2 px-4 py-3">
        <h3 className="font-display text-base leading-tight text-[var(--ink)] sm:text-lg">{categoryLabel}</h3>
        <span aria-hidden className="shrink-0 text-[var(--brand-coral)] transition group-hover:translate-x-0.5">
          →
        </span>
      </div>
    </Link>
  );
}
