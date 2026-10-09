"use client";

import { useState } from "react";
import { LowPolyHuman } from "@/components/game/low-poly-human";
import { askPrice, buyGarment, giftGarment, rackFor, savePreset, sellGarment, tierOf, TIERS, wearGarment, wearPreset, PRESET_SLOTS, type RackItem } from "@/lib/game/boutique";
import { cedis, type Life, type Look, type StepResult } from "@/lib/game/world";

export function BoutiqueFloor({ life, onApply }: { life: Life; onApply: (result: StepResult) => void }) {
  const tier = tierOf(life.where);
  const rack = rackFor(life.where, life.town ?? "accra");
  const [preview, setPreview] = useState<RackItem | null>(null);
  const [slot, setSlot] = useState<(typeof PRESET_SLOTS)[number]>("club");
  const look: Look = preview
    ? { ...life.look, outfit: preview.outfit, cloth: preview.cloth, pattern: preview.pattern ?? life.look.pattern }
    : life.look;
  const hint = tier === "print" ? "traditional" : tier === "high" ? "club" : "casual";

  return (
    <div className="mt-3 rounded-3xl bg-white p-3 text-[#121212] shadow-sm">
      <div className="flex items-center gap-3">
        <div className="h-24 w-16 shrink-0">
          <LowPolyHuman skin={look.skin} shirt={look.cloth} pants={look.body === "woman" ? "#1c2744" : look.accent} hair={look.hair} body={look.body} stature={look.height} build={look.build} passive />
        </div>
        <div>
          <p className="text-sm font-semibold">{tier ? TIERS[tier].label : "Boutique"}</p>
          <p className="text-xs text-[#5c6b82]">{preview ? `Fitting room · ${preview.label}` : `Wearing ${life.look.outfit}. This town likes a ${hint} look.`}</p>
        </div>
      </div>
      <div className="mt-3 space-y-2">
        {rack.map((item) => {
          const price = askPrice(life, item);
          const owned = (life.wardrobe ?? []).some((row) => row.id === item.id);
          return (
            <div key={item.id} className="rounded-2xl bg-[#f6f1ea] px-3 py-2">
              <p className="text-sm font-semibold">
                {item.label} · {cedis(price)}
              </p>
              <p className="text-xs text-[#5c6b82]">
                {item.brand} · {item.category} · status {item.status}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button type="button" onClick={() => setPreview(item)} className="rounded-full bg-white px-3 py-1 text-xs font-bold">
                  Try on
                </button>
                <button type="button" onClick={() => onApply(owned ? wearGarment(life, item.id) : buyGarment(life, item.id))} className="rounded-full bg-[#121212] px-3 py-1 text-xs font-bold text-white">
                  {owned ? "Wear" : "Buy"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
      {(life.wardrobe ?? []).length ? (
        <div className="mt-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#8b97ab]">Wardrobe</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {PRESET_SLOTS.map((name) => (
              <button key={name} type="button" onClick={() => setSlot(name)} className={`rounded-full px-2 py-1 text-[11px] font-bold capitalize ${slot === name ? "bg-[#006B3F] text-white" : "bg-[#f4f7fb]"}`}>
                {name}
              </button>
            ))}
          </div>
          {(life.wardrobe ?? []).map((item) => (
            <div key={item.id} className="mt-2 flex flex-wrap items-center gap-2 text-xs">
              <span className="font-semibold">{item.label}</span>
              <button type="button" onClick={() => onApply(wearGarment(life, item.id))} className="rounded-full bg-[#f4f7fb] px-2 py-1 font-bold">
                Wear
              </button>
              <button type="button" onClick={() => onApply(savePreset(life, slot, item.id))} className="rounded-full bg-[#fff1c9] px-2 py-1 font-bold">
                Save {slot}
              </button>
              <button type="button" onClick={() => onApply(sellGarment(life, item.id))} className="rounded-full bg-[#f4f7fb] px-2 py-1 font-bold">
                Sell
              </button>
              <button type="button" onClick={() => onApply(giftGarment(life, item.id, life.relations[0]?.name ?? "a friend"))} className="rounded-full bg-[#f4f7fb] px-2 py-1 font-bold">
                Gift
              </button>
            </div>
          ))}
          <button type="button" onClick={() => onApply(wearPreset(life, slot))} className="mt-2 rounded-full bg-[#006B3F] px-3 py-1.5 text-xs font-bold text-white">
            Wear {slot} look
          </button>
        </div>
      ) : null}
    </div>
  );
}
