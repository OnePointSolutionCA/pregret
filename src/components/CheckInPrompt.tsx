"use client";

import { useState, useTransition } from "react";
import { browserSupabase } from "@/lib/supabase-browser";

type Milestone = 30 | 60 | 90;

const REGRET_REASONS = [
  "Stopped working / broke",
  "Not worth the price",
  "Found something better",
  "Don't use it anymore",
  "Quality was disappointing",
];

export default function CheckInPrompt({
  userProductId,
  productName,
  milestone,
  onComplete,
}: {
  userProductId: string;
  productName: string;
  milestone: Milestone;
  onComplete?: () => void;
}) {
  const [pending, start] = useTransition();
  const [step, setStep] = useState<"rate" | "reason" | "done">("rate");
  const [reasons, setReasons] = useState<string[]>([]);
  const [otherText, setOtherText] = useState("");

  function record(rating: 1 | 3 | 5) {
    start(async () => {
      const supabase = browserSupabase();
      const col = `satisfaction_day${milestone}` as const;
      await supabase
        .from("user_products")
        .update({ [col]: rating, would_buy_again: rating >= 3 })
        .eq("id", userProductId);
      if (rating <= 2) setStep("reason");
      else {
        setStep("done");
        onComplete?.();
      }
    });
  }

  function submitReasons() {
    const reason = [...reasons, otherText].filter(Boolean).join("; ");
    start(async () => {
      const supabase = browserSupabase();
      await supabase.from("user_products").update({ regret_reason: reason }).eq("id", userProductId);
      setStep("done");
      onComplete?.();
    });
  }

  if (step === "done") {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
        <div className="text-lg font-semibold text-emerald-800">Thanks — logged.</div>
        <div className="mt-1 text-sm text-emerald-700">Your check-in helps every future shopper.</div>
      </div>
    );
  }

  if (step === "reason") {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="mb-4 font-semibold text-slate-900">What went wrong?</div>
        <div className="flex flex-col gap-2">
          {REGRET_REASONS.map((r) => (
            <label key={r} className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={reasons.includes(r)}
                onChange={(e) =>
                  setReasons((prev) => (e.target.checked ? [...prev, r] : prev.filter((x) => x !== r)))
                }
              />
              {r}
            </label>
          ))}
          <input
            type="text"
            value={otherText}
            onChange={(e) => setOtherText(e.target.value)}
            placeholder="Other (optional)"
            className="mt-2 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <button
          onClick={submitReasons}
          disabled={pending}
          className="mt-4 w-full rounded-lg bg-[var(--brand-navy)] px-4 py-2 font-semibold text-white hover:bg-[var(--brand-navy-2)] disabled:opacity-50"
        >
          {pending ? "Saving…" : "Submit"}
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <div className="mb-1 text-xs uppercase tracking-wider text-slate-500">Day {milestone} check-in</div>
      <div className="mb-4 text-lg font-semibold text-slate-900">Still love your {productName}?</div>
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => record(5)}
          disabled={pending}
          className="rounded-lg border border-emerald-300 bg-emerald-50 p-4 text-center hover:bg-emerald-100 disabled:opacity-50"
        >
          <div className="text-3xl">😍</div>
          <div className="mt-1 text-xs font-medium text-emerald-800">Still love it</div>
        </button>
        <button
          onClick={() => record(3)}
          disabled={pending}
          className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-center hover:bg-amber-100 disabled:opacity-50"
        >
          <div className="text-3xl">😐</div>
          <div className="mt-1 text-xs font-medium text-amber-800">It&apos;s okay</div>
        </button>
        <button
          onClick={() => record(1)}
          disabled={pending}
          className="rounded-lg border border-red-300 bg-red-50 p-4 text-center hover:bg-red-100 disabled:opacity-50"
        >
          <div className="text-3xl">😞</div>
          <div className="mt-1 text-xs font-medium text-red-800">I regret it</div>
        </button>
      </div>
    </div>
  );
}
