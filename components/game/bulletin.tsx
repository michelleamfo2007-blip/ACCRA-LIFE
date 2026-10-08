"use client";

import { BULLETIN } from "@/lib/game/bulletin";

export function FeatureBulletin({ onClose, onShop, onRival }: { onClose: () => void; onShop: () => void; onRival: () => void }) {
  return (
    <div className="absolute inset-0 z-[80] grid place-items-end bg-[#121212]/55 p-3 sm:place-items-center" role="dialog" aria-label="New features">
      <div className="max-h-[min(88vh,40rem)] w-full max-w-md overflow-auto rounded-[28px] bg-[#f6f1ea] p-4 text-[#121212] shadow-2xl">
        <p className="text-xs font-bold uppercase tracking-wide text-[#006B3F]">New in Accra Life</p>
        <h2 className="mt-1 text-2xl font-semibold leading-tight">Try the new features.</h2>
        <p className="mt-1 text-sm text-[#5c6b82]">They are live. Open one and play it.</p>
        <ul className="mt-3 space-y-2">
          {BULLETIN.map((item) => (
            <li key={item.title} className="rounded-2xl bg-white px-3 py-3 shadow-sm">
              <p className="font-semibold">
                {item.emoji} {item.title}
              </p>
              <p className="mt-0.5 text-sm leading-5 text-[#5c6b82]">{item.detail}</p>
            </li>
          ))}
        </ul>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button type="button" onClick={onShop} className="rounded-full bg-white py-3 text-sm font-bold shadow-sm">
            Open a shop
          </button>
          <button type="button" onClick={onRival} className="rounded-full bg-white py-3 text-sm font-bold shadow-sm">
            Meet your rival
          </button>
        </div>
        <button type="button" onClick={onClose} className="mt-2 w-full rounded-full bg-[#006B3F] py-3 text-sm font-bold text-white">
          Try it out
        </button>
      </div>
    </div>
  );
}
