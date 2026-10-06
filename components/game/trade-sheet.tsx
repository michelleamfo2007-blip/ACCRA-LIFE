"use client";

import { BAG_LIMIT, GOODS, bagCount, buyPrice, isSupply, sellPrice } from "@/lib/game/trade";
import { cedis, spotById, type Life } from "@/lib/game/world";

export function TradeSheet({ life, onBuy, onSell, onClose }: { life: Life; onBuy: (id: string) => void; onSell: (id: string) => void; onClose: () => void }) {
  const spot = spotById(life.where);
  const supply = isSupply(life.where);
  const day = Math.floor(life.minutes / 1440);
  const count = bagCount(life);
  const bag = life.bag ?? {};
  return (
    <div className="absolute inset-x-0 bottom-0 z-40 max-h-[min(78vh,100dvh-4.5rem)] overflow-auto rounded-t-[28px] bg-white p-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-[0_-16px_50px_rgba(22,32,60,.2)]">
      <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-[#d5dbe6]" />
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl">{supply ? `Buy at ${spot.name}` : `Sell at ${spot.name}`}</h2>
          <p className="text-sm text-[#5c6b82]">{supply ? "Buy low here, then sell across town. Prices change every day." : "Every spot pays a different price. The more you sell in one place, the lower it goes."}</p>
        </div>
        <button type="button" onClick={onClose} className="rounded-full bg-[#f4f7fb] px-3 py-1 text-sm font-semibold">
          Hide
        </button>
      </div>
      <p className="mt-3 rounded-full bg-[#fff4c2] px-3 py-1.5 text-xs font-semibold text-[#121212]">
        🧺 Bag {count}/{BAG_LIMIT} · Wallet {cedis(life.cash)}
      </p>
      <div className="mt-3 space-y-2">
        {GOODS.map((good) => {
          const lot = bag[good.id];
          const buy = buyPrice(good, life.where, day);
          const sell = sellPrice(life, good, life.where);
          if (supply && buy == null && !lot) return null;
          if (!supply && !lot) return null;
          const average = lot ? Math.round(lot.paid / lot.qty) : 0;
          return (
            <div key={good.id} className="flex items-center gap-3 rounded-2xl bg-[#f4f7fb] px-3 py-2.5">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-xl">{good.emoji}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">{good.label}</span>
                <span className="block text-xs text-[#5c6b82]">
                  {lot ? `You have ${lot.qty} · paid about ${cedis(average)} each` : `Street price about ${cedis(good.base)}`}
                </span>
              </span>
              {supply && buy != null ? (
                <button type="button" onClick={() => onBuy(good.id)} disabled={count >= BAG_LIMIT || life.cash < buy} className="shrink-0 rounded-full bg-[#006B3F] px-3 py-2 text-sm font-bold text-white disabled:opacity-40">
                  Buy {cedis(buy)}
                </button>
              ) : null}
              {!supply && lot && sell != null ? (
                <button type="button" onClick={() => onSell(good.id)} className={`shrink-0 rounded-full px-3 py-2 text-sm font-bold text-white ${sell >= average ? "bg-[#006B3F]" : "bg-[#CE1126]"}`}>
                  Sell {cedis(sell)}
                </button>
              ) : null}
            </div>
          );
        })}
        {!supply && count === 0 ? <p className="text-sm text-[#5c6b82]">Your bag is empty. Buy goods at Makola Market first.</p> : null}
      </div>
    </div>
  );
}
