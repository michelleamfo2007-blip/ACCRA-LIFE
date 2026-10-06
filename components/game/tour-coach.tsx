"use client";

import { TOUR, type TourId } from "@/lib/game/tour";

export function TourCoach({
  step,
  onNext,
  onSkip,
}: {
  step: TourId;
  onNext: () => void;
  onSkip: () => void;
}) {
  const card = TOUR.find((item) => item.id === step) ?? TOUR[0];
  const index = TOUR.findIndex((item) => item.id === card.id);
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-[max(5.2rem,calc(env(safe-area-inset-bottom)+4.4rem))] z-[45] flex justify-center px-3">
      <div className="pointer-events-auto w-full max-w-md rounded-[28px] bg-white p-4 shadow-[0_18px_50px_rgba(22,32,60,.28)] ring-2 ring-[#FCD116]/80">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#006B3F]">First day · {index + 1}/{TOUR.length}</p>
          <button type="button" onClick={onSkip} className="text-xs font-semibold text-[#8b97ab]">
            Skip
          </button>
        </div>
        <p className="font-display text-2xl leading-tight">{card.title}</p>
        <p className="mt-2 text-sm leading-6 text-[#5c6b82]">{card.body}</p>
        <div className="mt-3 flex gap-1.5">
          {TOUR.map((item) => (
            <span key={item.id} className={`h-1.5 flex-1 rounded-full ${item.id === card.id || TOUR.indexOf(item) < index ? "bg-[#006B3F]" : "bg-[#e7edf5]"}`} />
          ))}
        </div>
        <button type="button" onClick={onNext} className="mt-4 w-full rounded-full bg-[#121212] py-3 text-sm font-bold text-white">
          {card.cta}
        </button>
      </div>
    </div>
  );
}
