"use client";

import { useState } from "react";
import { deskMemory, deskOf } from "@/lib/game/place-desk";
import type { Life, Spot, StepResult } from "@/lib/game/world";

export function PlaceDesk({ life, spot, onApply }: { life: Life; spot: Spot; onApply: (result: StepResult) => void }) {
  const desk = deskOf(spot);
  const [open, setOpen] = useState(false);
  if (!desk) return null;
  const rows = desk.board(life, spot);
  const remembered = deskMemory(life, spot);
  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="absolute left-2 top-[max(4.6rem,calc(env(safe-area-inset-top)+4rem))] z-30 max-w-[11rem] truncate rounded-full bg-[#1c2430]/90 px-3 py-1.5 text-left text-xs font-bold text-white shadow"
      >
        {desk.npc.name}
      </button>
    );
  }
  return (
    <section className="absolute left-2 right-2 top-[max(4.6rem,calc(env(safe-area-inset-top)+4rem))] z-40 max-h-[34vh] overflow-auto rounded-2xl bg-[#1c2430] p-3 text-white shadow-xl">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-bold tracking-wide">{desk.title}</p>
        <button type="button" onClick={() => setOpen(false)} aria-label="Close board" className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white/15 text-xs">
          ×
        </button>
      </div>
      <p className="text-xs text-white/70">{spot.name}</p>
      <p className="mt-1 text-xs font-semibold">
        {desk.npc.role} · {desk.npc.name}
      </p>
      <p className="text-xs text-white/80">{remembered ?? desk.npc.line}</p>
      <ul className="mt-2 space-y-1">
        {rows.map((row) => (
          <li key={row.label} className="flex items-start justify-between gap-3 rounded-xl bg-white/10 px-2 py-1.5 text-xs">
            <span className="shrink-0 font-semibold">{row.label}</span>
            <span className="min-w-0 text-right text-white/80">{row.detail}</span>
          </li>
        ))}
      </ul>
      <button type="button" onClick={() => onApply(desk.act(life, spot))} className="mt-2 w-full rounded-full bg-white py-2 text-xs font-bold text-[#121212]">
        {desk.button}
      </button>
    </section>
  );
}
