"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type Props = {
  day1?: number;
  day30?: number | null;
  day60?: number | null;
  day90?: number | null;
};

export default function DecayCurve({ day1 = 5, day30, day60, day90 }: Props) {
  const data = [
    { day: "Day 1", satisfaction: day1 },
    day30 != null && { day: "Day 30", satisfaction: Number(day30.toFixed(2)) },
    day60 != null && { day: "Day 60", satisfaction: Number(day60.toFixed(2)) },
    day90 != null && { day: "Day 90", satisfaction: Number(day90.toFixed(2)) },
  ].filter(Boolean) as { day: string; satisfaction: number }[];

  if (data.length < 2) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
        Not enough long-term ratings yet. Own this product? Log it and help build the curve.
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 12, right: 16, bottom: 8, left: 0 }}>
          <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} />
          <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} stroke="#94a3b8" fontSize={12} />
          <Tooltip
            contentStyle={{ border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12 }}
            formatter={(v) => [`${Number(v).toFixed(2)} / 5`, "Satisfaction"]}
          />
          <Line
            type="monotone"
            dataKey="satisfaction"
            stroke="#0d9488"
            strokeWidth={3}
            dot={{ r: 5, fill: "#0d9488" }}
            activeDot={{ r: 7 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
