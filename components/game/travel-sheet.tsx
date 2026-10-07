"use client";

import { useState } from "react";
import { quoteTravel, travelModes, type TravelMode } from "@/lib/game/travel";
import { TOWNS, townOf, type TownId } from "@/lib/game/towns";
import { cedis, type Life } from "@/lib/game/world";

const MODE_LABEL: Record<TravelMode, string> = {
  trotro: "Trotro / bus",
  taxi: "Taxi",
  car: "Your car",
  flight: "Passion Airways",
};

export function TravelSheet({
  life,
  onClose,
  onConfirm,
}: {
  life: Life;
  onClose: () => void;
  onConfirm: (townId: TownId, mode: TravelMode) => void;
}) {
  const here = townOf(life.town);
  const choices = TOWNS.filter((town) => town.id !== here.id);
  const [townId, setTownId] = useState<TownId>(choices.find((town) => town.open)?.id ?? "kumasi");
  const [mode, setMode] = useState<TravelMode>("trotro");
  const picked = townOf(townId);
  const modes = travelModes(here.id, picked.id, Boolean(life.car));
  const active = modes.includes(mode) ? mode : modes[0] ?? "trotro";
  const quote = quoteTravel(life, picked.id, active);

  return (
    <div className="absolute inset-x-0 bottom-0 z-40 max-h-[min(78vh,100dvh-4.5rem)] overflow-auto rounded-t-[28px] bg-white p-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-[0_-16px_50px_rgba(22,32,60,.2)]">
      <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-[#d5dbe6]" />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-display text-2xl">Leave {here.name}</p>
          <p className="text-sm text-[#5c6b82]">{here.vibe}</p>
        </div>
        <button type="button" onClick={onClose} className="rounded-full bg-[#f4f7fb] px-3 py-1 text-sm font-semibold">
          Hide
        </button>
      </div>
      <div className="mt-3 flex gap-2 overflow-x-auto">
        {choices.map((town) => (
          <button
            key={town.id}
            type="button"
            onClick={() => setTownId(town.id)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-semibold ${townId === town.id ? "bg-[#121212] text-white" : "bg-[#fff1c9] text-[#121212]"}`}
          >
            {town.name}
            {town.open ? "" : " · later"}
          </button>
        ))}
      </div>
      <p className="mt-3 text-sm leading-6 text-[#5c6b82]">{picked.vibe}</p>
      <p className="mt-1 text-xs text-[#5c6b82]">
        {picked.weather} Prices sit at {Math.round(picked.priceIndex * 100)}% of Accra.
      </p>
      {picked.open ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {modes.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setMode(item)}
              className={`rounded-full px-3 py-1.5 text-sm font-semibold ${active === item ? "bg-[#006B3F] text-white" : "bg-[#f4f7fb]"}`}
            >
              {MODE_LABEL[item]}
            </button>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm font-semibold">That city opens later. Kumasi is the road that is open.</p>
      )}
      {picked.open ? (
        <p className="mt-3 text-sm font-semibold">
          {quote.error ? quote.error : `${quote.label} · ${quote.ride.id === "car" ? "Fuel" : quote.ride.cost ? cedis(quote.ride.cost) : "Free"}${quote.ride.minutes ? ` · ${quote.ride.minutes} min` : ""}`}
        </p>
      ) : null}
      <button
        type="button"
        disabled={!picked.open || Boolean(quote.error)}
        onClick={() => onConfirm(picked.id, active)}
        className="mt-4 w-full rounded-full bg-[#121212] py-3 font-bold text-white disabled:opacity-40"
      >
        {picked.id === "accra" ? "Go back to Accra" : `Travel to ${picked.name}`}
      </button>
      <p className="mt-3 text-xs leading-5 text-[#5c6b82]">Your Accra room stays. Rent still falls due. Shops you left keep selling. Money rides in MoMo. The car comes only if you drive.</p>
    </div>
  );
}
