"use client";

import { useState } from "react";
import { COMPOUNDS, FLOOR_MATS, GATES, HOUSES, PAINTS, ROOM_CHOICES, ROOF_MATS, STYLES, WALL_MATS, WINDOW_MATS, defaultPlan, designQuote, landOf } from "@/lib/game/estate";
import { cedis, type HousePlan } from "@/lib/game/world";

const STEPS = ["Type", "Bedrooms", "Rooms", "Style", "Materials", "Colours", "Compound", "Confirm"];

export function HouseSketch({ plan }: { plan: HousePlan }) {
  const style = STYLES.find((item) => item.id === plan.style);
  const flat = style?.roof === "flat";
  const floors = plan.house === "duplex" || plan.house === "mansion" ? 2 : 1;
  const beds = Math.max(1, plan.bedrooms);
  return (
    <svg viewBox="0 0 220 120" className="h-28 w-full rounded-2xl bg-[#d5dec6]" aria-hidden>
      <rect x="0" y="78" width="220" height="42" fill="#c4b48a" />
      {plan.compound !== "none" ? <rect x="18" y="70" width="184" height={plan.compound === "low" ? 10 : 18} fill={plan.accent} opacity="0.85" /> : null}
      <rect x="46" y={floors === 2 ? 28 : 46} width="128" height={floors === 2 ? 48 : 32} fill={plan.wallColor} stroke={plan.accent} strokeWidth="2" />
      {flat ? <rect x="42" y={floors === 2 ? 22 : 40} width="136" height="8" fill={plan.roofColor} /> : <polygon points={`42,${floors === 2 ? 34 : 48} 110,${floors === 2 ? 12 : 28} 178,${floors === 2 ? 34 : 48}`} fill={plan.roofColor} />}
      <rect x="96" y={floors === 2 ? 52 : 58} width="16" height={floors === 2 ? 24 : 20} fill={plan.accent} />
      {Array.from({ length: Math.min(4, beds) }, (_, index) => (
        <rect key={index} x={58 + index * 22} y={floors === 2 ? 40 : 54} width="12" height="8" fill="#9ad0e8" />
      ))}
      {plan.rooms.includes("pool") ? <ellipse cx="188" cy="96" rx="16" ry="8" fill="#7ec8ea" /> : null}
      {plan.rooms.includes("garden") ? <circle cx="28" cy="96" r="8" fill="#2f6b3a" /> : null}
      {plan.rooms.includes("garage") ? <rect x="150" y="62" width="22" height="16" fill="#d9d2c2" /> : null}
    </svg>
  );
}

export function HouseWizard({ area, initial, onCancel, onSave }: { area: string; initial?: HousePlan; onCancel: () => void; onSave: (plan: HousePlan) => void }) {
  const land = landOf(area);
  const [step, setStep] = useState(0);
  const [plan, setPlan] = useState<HousePlan>(initial ?? defaultPlan("two"));
  const quote = designQuote(area, plan);
  const set = (patch: Partial<HousePlan>) => setPlan((current) => ({ ...current, ...patch }));

  function toggleRoom(id: string) {
    setPlan((current) => {
      const has = current.rooms.includes(id);
      const rooms = has ? current.rooms.filter((room) => room !== id) : [...current.rooms, id];
      return { ...current, rooms };
    });
  }

  return (
    <div className="space-y-3 rounded-2xl bg-white p-3 shadow-sm">
      <p className="text-[11px] font-bold tracking-wide text-[#8b97ab]">
        {STEPS[step]} · {step + 1} / {STEPS.length}
      </p>
      <HouseSketch plan={plan} />
      <p className="text-xs text-[#5c6b82]">
        {land.label} · {land.size} · {land.rule} · {cedis(quote.build)} to build · about {quote.days} days · upkeep {cedis(quote.upkeep)} on Saturdays once you live there
      </p>
      {step === 0 ? (
        <div className="grid grid-cols-2 gap-2">
          {HOUSES.map((house) => (
            <button key={house.id} type="button" onClick={() => set(defaultPlan(house.id))} className={`rounded-xl px-2 py-2 text-left text-xs font-bold ${plan.house === house.id ? "bg-[#121212] text-white" : "bg-[#f6f1ea]"}`}>
              {house.label}
              <span className="mt-0.5 block font-medium opacity-70">{house.line}</span>
            </button>
          ))}
        </div>
      ) : null}
      {step === 1 ? (
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5, 6].map((count) => (
            <button key={count} type="button" onClick={() => set({ bedrooms: count })} className={`rounded-full px-3 py-2 text-xs font-bold ${plan.bedrooms === count ? "bg-[#121212] text-white" : "bg-[#f6f1ea]"}`}>
              {count === 6 ? "6+" : count}
            </button>
          ))}
        </div>
      ) : null}
      {step === 2 ? (
        <div className="flex flex-wrap gap-2">
          {ROOM_CHOICES.map((room) => {
            const on = plan.rooms.includes(room.id);
            return (
              <button key={room.id} type="button" disabled={"locked" in room && room.locked} onClick={() => toggleRoom(room.id)} className={`rounded-full px-3 py-1.5 text-xs font-bold disabled:opacity-70 ${on ? "bg-[#006B3F] text-white" : "bg-[#f6f1ea]"}`}>
                {room.label}
              </button>
            );
          })}
        </div>
      ) : null}
      {step === 3 ? (
        <div className="flex flex-wrap gap-2">
          {STYLES.map((style) => (
            <button key={style.id} type="button" onClick={() => set({ style: style.id })} className={`rounded-full px-3 py-2 text-xs font-bold ${plan.style === style.id ? "bg-[#121212] text-white" : "bg-[#f6f1ea]"}`}>
              {style.label}
            </button>
          ))}
        </div>
      ) : null}
      {step === 4 ? (
        <div className="space-y-2 text-xs">
          <Pick label="Walls" value={plan.wall} options={WALL_MATS} onPick={(wall) => set({ wall })} />
          <Pick label="Roof" value={plan.roofMat} options={ROOF_MATS} onPick={(roofMat) => set({ roofMat })} />
          <Pick label="Windows" value={plan.windows} options={WINDOW_MATS} onPick={(windows) => set({ windows })} />
          <Pick label="Floor" value={plan.floor} options={FLOOR_MATS} onPick={(floor) => set({ floor })} />
        </div>
      ) : null}
      {step === 5 ? (
        <div className="space-y-2">
          <Swatches label="Walls" value={plan.wallColor} onPick={(wallColor) => set({ wallColor })} />
          <Swatches label="Roof" value={plan.roofColor} onPick={(roofColor) => set({ roofColor })} />
          <Swatches label="Gate and trim" value={plan.accent} onPick={(accent) => set({ accent })} />
        </div>
      ) : null}
      {step === 6 ? (
        <div className="space-y-2 text-xs">
          <Pick label="Compound" value={plan.compound} options={COMPOUNDS} onPick={(compound) => set({ compound })} />
          <Pick label="Gate" value={plan.gate} options={GATES} onPick={(gate) => set({ gate })} />
        </div>
      ) : null}
      {step === 7 ? (
        <ul className="space-y-1 text-sm">
          <li>{HOUSES.find((item) => item.id === plan.house)?.label} · {plan.bedrooms} bedroom{plan.bedrooms === 1 ? "" : "s"}</li>
          <li>{plan.rooms.length} spaces, including the hall and kitchen</li>
          <li>Build {cedis(quote.build)}. Permit {cedis(quote.permit)} is inside the first crew payment.</li>
          <li>About {quote.days} in-game days if you fund every stage.</li>
          <li>Once you move in, Saturday rent stops. Upkeep is about {cedis(quote.upkeep)}.</li>
        </ul>
      ) : null}
      <div className="flex gap-2">
        <button type="button" onClick={() => (step === 0 ? onCancel() : setStep((value) => value - 1))} className="rounded-full bg-[#f4f7fb] px-3 py-2 text-xs font-bold">
          {step === 0 ? "Save for later" : "Back"}
        </button>
        {step < STEPS.length - 1 ? (
          <button type="button" onClick={() => setStep((value) => value + 1)} className="rounded-full bg-[#121212] px-3 py-2 text-xs font-bold text-white">
            Next
          </button>
        ) : (
          <button type="button" onClick={() => onSave(plan)} className="rounded-full bg-[#006B3F] px-3 py-2 text-xs font-bold text-white">
            File this plan
          </button>
        )}
      </div>
    </div>
  );
}

function Pick({ label, value, options, onPick }: { label: string; value: string; options: readonly { id: string; label: string }[]; onPick: (id: string) => void }) {
  return (
    <div>
      <p className="mb-1 font-bold text-[#5c6b82]">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((option) => (
          <button key={option.id} type="button" onClick={() => onPick(option.id)} className={`rounded-full px-2.5 py-1 font-bold ${value === option.id ? "bg-[#121212] text-white" : "bg-[#f6f1ea]"}`}>
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function Swatches({ label, value, onPick }: { label: string; value: string; onPick: (color: string) => void }) {
  return (
    <div>
      <p className="mb-1 text-xs font-bold text-[#5c6b82]">{label}</p>
      <div className="flex gap-1.5">
        {PAINTS.map((color) => (
          <button key={color} type="button" aria-label={color} onClick={() => onPick(color)} className={`h-7 w-7 rounded-full border-2 ${value === color ? "border-[#121212]" : "border-white"}`} style={{ background: color }} />
        ))}
      </div>
    </div>
  );
}
