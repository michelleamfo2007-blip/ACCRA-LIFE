"use client";

import { STAGES } from "@/lib/game/estate";
import type { Life } from "@/lib/game/world";

const NEIGHBOURS = [
  { name: "The Owusus", note: "Pool lit. A G-Wagon in the drive.", stage: "Finished house" },
  { name: "Ama Boateng", note: "The lawn is a garden party waiting to happen.", stage: "Finished house" },
  { name: "Uncle Mensah", note: "Guards at his gate. The street knows his car.", stage: "Finished house" },
  { name: "The Asantes", note: "Scaffolding came down last month. The paint is still new.", stage: "Finished house" },
];

export function EstateStreet({ life }: { life: Life }) {
  const mine = (life.plots ?? []).filter((plot) => plot.area === "trasacco");
  const known = mine.length > 0;
  return (
    <div className="mt-3 rounded-3xl bg-[#102033] p-3 text-white">
      <p className="text-sm font-semibold">Trasacco Valley</p>
      <p className="mt-1 text-xs leading-5 text-white/70">
        {known
          ? "The gate knows your name. Guards, a gardener, and a street that only lets luxury cars through."
          : "Gated. A plot is ₵420,000 in the Land app. Until then the guard asks who you came to see."}
      </p>
      <svg viewBox="0 0 320 120" className="mt-3 h-28 w-full" role="img" aria-label="Trasacco street">
        <rect width="320" height="120" fill="#163024" />
        <rect x="0" y="48" width="320" height="28" fill="#2a3a32" />
        <rect x="8" y="58" width="304" height="2" fill="#FCD116" opacity="0.7" />
        {NEIGHBOURS.map((house, index) => (
          <g key={house.name} transform={`translate(${12 + index * 78}, 8)`}>
            <rect width="62" height="36" rx="2" fill="#e7e1d6" />
            <rect x="8" y="14" width="10" height="10" fill="#8fb8d6" />
            <rect x="24" y="14" width="10" height="10" fill="#8fb8d6" />
            <rect x="40" y="20" width="12" height="16" fill="#1d2433" />
            <rect x="4" y="36" width="54" height="6" fill="#1f6b45" />
          </g>
        ))}
        {mine.map((plot, index) => (
          <g key={plot.id} transform={`translate(${12 + index * 78}, 78)`}>
            <rect width="62" height="34" rx="2" fill={plot.stage >= 5 ? "#f4efe6" : "#8d8d86"} />
            <rect x="22" y="16" width="16" height="18" fill="#006B3F" />
          </g>
        ))}
      </svg>
      <ul className="mt-2 space-y-1.5">
        {mine.map((plot) => (
          <li key={plot.id} className="rounded-2xl bg-white/10 px-3 py-2 text-xs">
            <span className="font-semibold">Your plot</span> · {STAGES[plot.stage] ?? "Plot"}
            {plot.stage >= 5 ? " · The street can see the house." : " · Build it from Land, then it shows here."}
          </li>
        ))}
        {NEIGHBOURS.map((house) => (
          <li key={house.name} className="rounded-2xl bg-white/10 px-3 py-2 text-xs">
            <span className="font-semibold">{house.name}</span> · {house.stage}. {house.note}
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[11px] text-white/60">
        Clout on this street: {life.stats?.clout ?? 0}. Residents get the nod. Everyone else states their business.
      </p>
    </div>
  );
}
