"use client";

import { BUSINESSES, MAX_BIZ_LEVEL, TILL_HOURS, bizKind, bizRate, bizWages } from "@/lib/game/biz-table";
import { GOODS, bagCount, buyBusiness, collectTill, sellBusiness, tillOf, upgradeBusiness, upgradeCost } from "@/lib/game/trade";
import { cedis, type Life, type StepResult } from "@/lib/game/world";

export function BizApp({ life, onBack, onApply }: { life: Life; onBack: () => void; onApply: (result: StepResult) => void }) {
  const owned = life.businesses ?? [];
  const bag = Object.entries(life.bag ?? {});
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[#f6f1ea] text-[#121212]">
      <div className="flex items-center gap-2 bg-[#121212] px-2 py-2 text-white">
        <button type="button" onClick={onBack} className="grid h-9 w-9 place-items-center rounded-full text-lg" aria-label="Back">
          ‹
        </button>
        <p className="font-semibold">Business</p>
        <span className="ml-auto pr-2 text-sm font-semibold text-[#FCD116]">{cedis(life.cash)}</span>
      </div>
      <div className="min-h-0 flex-1 space-y-3 overflow-auto px-4 py-4">
        {owned.length ? <p className="text-[11px] font-bold tracking-wide text-[#8b97ab]">YOUR SHOPS</p> : null}
        {owned.map((shop) => {
          const kind = bizKind(shop.kind);
          const till = tillOf(life, shop.id);
          const full = (life.minutes - shop.lastCollect) / 60 >= TILL_HOURS;
          return (
            <div key={shop.id} className="rounded-2xl bg-white p-3 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-full bg-[#fff4c2] text-xl">{kind.emoji}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">
                    {kind.label} · {"★".repeat(shop.level)}
                  </span>
                  <span className="block text-xs text-[#5c6b82]">
                    {kind.area} · {cedis(bizRate(shop.kind, shop.level) * 24)} a day · wages {cedis(bizWages(shop.kind, shop.level))} on Saturday
                  </span>
                </span>
              </div>
              <p className={`mt-2 text-sm font-semibold ${full ? "text-[#CE1126]" : "text-[#006B3F]"}`}>{full ? `Till is full at ${cedis(till)}. Collect it.` : `In the till: ${cedis(till)}`}</p>
              <div className="mt-2 grid grid-cols-3 gap-2">
                <button type="button" onClick={() => onApply(collectTill(life, shop.id))} disabled={till < 1} className="rounded-full bg-[#006B3F] py-2 text-xs font-bold text-white disabled:opacity-40">
                  Collect
                </button>
                <button type="button" onClick={() => onApply(upgradeBusiness(life, shop.id))} disabled={shop.level >= MAX_BIZ_LEVEL} className="rounded-full bg-[#f4f7fb] py-2 text-xs font-bold disabled:opacity-40">
                  {shop.level >= MAX_BIZ_LEVEL ? "Top level" : `Grow ${cedis(upgradeCost(shop.kind, shop.level))}`}
                </button>
                <button type="button" onClick={() => onApply(sellBusiness(life, shop.id))} className="rounded-full bg-[#f4f7fb] py-2 text-xs font-bold text-[#CE1126]">
                  Sell {cedis(Math.round(kind.price * 0.6))}
                </button>
              </div>
            </div>
          );
        })}
        <p className="text-[11px] font-bold tracking-wide text-[#8b97ab]">FOR SALE IN ACCRA</p>
        <p className="-mt-1 text-xs text-[#5c6b82]">Shops earn while you are away. The till holds {TILL_HOURS} hours, so come back to collect. Staff are paid every Saturday.</p>
        {BUSINESSES.filter((plan) => !owned.some((shop) => shop.kind === plan.id)).map((plan) => (
          <div key={plan.id} className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#f4f7fb] text-xl">{plan.emoji}</span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-semibold">
                {plan.label} · {plan.area}
              </span>
              <span className="block text-xs text-[#5c6b82]">{plan.detail}</span>
              <span className="block text-xs font-semibold text-[#006B3F]">
                ~{cedis(plan.perHour * 24)} a day · wages {cedis(plan.wages)} a week
              </span>
            </span>
            <button type="button" onClick={() => onApply(buyBusiness(life, plan.id))} disabled={life.cash < plan.price} className="shrink-0 rounded-full bg-[#121212] px-3 py-2 text-xs font-bold text-white disabled:opacity-40">
              {cedis(plan.price)}
            </button>
          </div>
        ))}
        <p className="pt-2 text-[11px] font-bold tracking-wide text-[#8b97ab]">TRADER&apos;S BAG · {bagCount(life)}</p>
        {bag.length ? (
          bag.map(([id, lot]) => {
            const good = GOODS.find((item) => item.id === id);
            return (
              <p key={id} className="rounded-2xl bg-white px-3 py-2 text-sm shadow-sm">
                {good?.emoji} {good?.label ?? id} × {lot.qty} · paid {cedis(lot.paid)}
              </p>
            );
          })
        ) : (
          <p className="text-sm text-[#5c6b82]">Empty. Buy goods cheap at a market (Makola, Kaneshie, Madina, Kantamanto, Tema Port, Elmina) and sell them at other spots across town.</p>
        )}
      </div>
    </div>
  );
}
