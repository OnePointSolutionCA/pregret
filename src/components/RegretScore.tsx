import { tierCopy, tierFor, tierAdvice } from "@/lib/regretScore";

type Props = {
  score: number;
  totalRatings?: number;
  size?: "sm" | "md" | "lg";
  showAdvice?: boolean;
};

const sizes = {
  sm: { box: "h-20 w-20", num: "text-2xl", label: "text-[10px]" },
  md: { box: "h-32 w-32", num: "text-4xl", label: "text-xs" },
  lg: { box: "h-48 w-48", num: "text-7xl", label: "text-sm" },
};

export default function RegretScore({ score, totalRatings, size = "md", showAdvice = false }: Props) {
  const tier = tierFor(score);
  const copy = tierCopy[tier];
  const s = sizes[size];

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className={`${s.box} rounded-full ${copy.bg} flex flex-col items-center justify-center text-white shadow-lg`}
        aria-label={`Regret score ${score} out of 100`}
      >
        <div className={`${s.num} font-bold leading-none`}>{score}</div>
        <div className={`${s.label} uppercase tracking-wider mt-1 opacity-90`}>Regret</div>
      </div>
      <div className="text-center">
        {/* Pill keeps the tier label readable when the score sits on top of a product photo. */}
        <div className={`inline-block rounded-full bg-white/95 px-2.5 py-0.5 text-sm font-semibold shadow-sm ${copy.text}`}>{copy.label}</div>
        {typeof totalRatings === "number" && totalRatings > 0 && (
          <div className="text-xs text-slate-500">based on {totalRatings.toLocaleString()} ratings</div>
        )}
        {showAdvice && <p className="mt-2 max-w-xs text-sm text-slate-600">{tierAdvice(tier)}</p>}
      </div>
    </div>
  );
}
