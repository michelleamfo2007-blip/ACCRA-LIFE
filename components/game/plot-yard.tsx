"use client";

import { LAND, landOf } from "@/lib/game/estate";
import { cedis, type Plot } from "@/lib/game/world";

const LOTS = 16;

function slotFor(id: string, taken: Set<number>) {
  let n = 0;
  for (const char of id) n = (n * 33 + char.charCodeAt(0)) >>> 0;
  for (let step = 0; step < LOTS; step += 1) {
    const slot = (n + step) % LOTS;
    if (!taken.has(slot)) return slot;
  }
  return 0;
}

function House({ stage }: { stage: number }) {
  if (stage <= 0) {
    return <span className="block h-7 w-9 rounded-sm bg-[#e6d3a4]" />;
  }
  const wall = stage >= 4 ? "#f3efe6" : "#8d9492";
  const roof = stage >= 5 ? "#6fbf86" : stage === 4 ? "#d9d2c2" : "#8d5a32";
  const height = stage === 1 ? "h-2" : stage === 2 ? "h-5" : "h-7";
  return (
    <span className="relative block h-11 w-10">
      <span className={`absolute bottom-0 left-1 right-1 rounded-[3px] shadow-sm ${height}`} style={{ background: wall }} />
      {stage >= 3 ? <span className="absolute bottom-[1.35rem] left-0 right-0 h-3.5 rounded-t-[3px]" style={{ background: roof }} /> : null}
      {stage >= 5 ? (
        <span
          className="absolute bottom-2 left-1.5 right-1.5 h-1.5"
          style={{ background: "repeating-linear-gradient(90deg,#1a1a1a 0 3px,#f7f7f7 3px 6px)" }}
        />
      ) : null}
      {stage >= 2 && stage < 5 ? <span className="absolute bottom-1 left-2 h-2 w-1.5 rounded-[1px] bg-[#5c6563]" /> : null}
    </span>
  );
}

export function PlotYard({
  area,
  plots,
  full,
  now,
  picked,
  onArea,
  onPick,
  onBuy,
}: {
  area: string;
  plots: Plot[];
  full: boolean;
  now: number;
  picked: string | null;
  onArea: (id: string) => void;
  onPick: (id: string) => void;
  onBuy: (area: string) => void;
}) {
  const land = landOf(area);
  const mine = plots.filter((plot) => plot.area === area);
  const taken = new Set<number>();
  const placed = mine.map((plot) => {
    const slot = slotFor(plot.id, taken);
    taken.add(slot);
    return { plot, slot };
  });
  const sales = [1, 6, 14].filter((slot) => !taken.has(slot));

  return (
    <div className="-mx-4 bg-[#d5dec6] px-3 pb-3 pt-2">
      <p className="text-center text-[11px] font-bold tracking-[0.14em] text-[#3d4a38]">
        {land.label.toUpperCase()} PLOTS · {cedis(land.price)} A PLOT
      </p>
      <div className="mt-2 flex gap-1 overflow-x-auto">
        {LAND.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onArea(item.id)}
            className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${item.id === area ? "bg-[#121212] text-white" : "bg-white/70 text-[#3d4a38]"}`}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-4 gap-1.5">
        {Array.from({ length: LOTS }, (_, slot) => {
          const own = placed.find((item) => item.slot === slot)?.plot;
          const sale = sales.includes(slot);
          const stage = own ? own.stage : sale ? 0 : 5;
          const left = own && own.readyAt ? Math.max(0, Math.ceil((own.readyAt - now) / 1000)) : 0;
          const label = own ? `${land.label}, ${own.stage >= 5 ? "your house" : "your plot"}` : sale ? `Buy a plot in ${land.label}` : "A neighbour's house";
          return (
            <button
              key={slot}
              type="button"
              aria-label={label}
              disabled={!own && !sale}
              onClick={() => {
                if (own) onPick(own.id);
                else if (sale) onBuy(area);
              }}
              className={`relative grid h-[4.6rem] place-items-center rounded-md bg-[#e7eee2] disabled:opacity-100 ${own && picked === own.id ? "ring-2 ring-[#121212]" : ""} ${sale ? "ring-1 ring-[#c4b48a]" : ""}`}
            >
              <House stage={stage} />
              {own ? <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-[#3DDC6A] shadow" /> : null}
              {own && left > 0 ? <span className="absolute bottom-0.5 text-[10px] font-bold text-[#121212]">{left}s</span> : null}
              {sale ? <span className="absolute bottom-0.5 text-[9px] font-bold text-[#6b5420]">{full ? "Full" : cedis(land.price)}</span> : null}
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-center text-[10px] font-semibold text-[#3d4a38]">The green dot is yours. Tap an empty pad to buy it, then watch the house come up.</p>
    </div>
  );
}
