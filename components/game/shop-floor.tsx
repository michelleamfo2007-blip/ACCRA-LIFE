"use client";

import { bizKind } from "@/lib/game/biz-table";
import { shelfLine } from "@/lib/game/shops";
import { booksOf, clearNotice, postShop, restock, setMarkup, shopTitle, shopsHere, workShift } from "@/lib/game/shop-run";
import { cedis, type Life, type StepResult } from "@/lib/game/world";

export function ShopFloor({ life, onApply }: { life: Life; onApply: (result: StepResult) => void }) {
  const shops = shopsHere(life);
  if (!shops.length) return null;
  return (
    <div className="mt-3 space-y-2">
      {shops.map((shop) => {
        const plan = bizKind(shop.kind);
        const books = booksOf(life, shop);
        return (
          <div key={shop.id} className="rounded-3xl p-3 text-white" style={{ background: shop.color || "#121212" }}>
            <p className="text-sm font-semibold">
              {plan.emoji} {shopTitle(shop)}
            </p>
            <p className="mt-1 text-xs leading-5 text-white/80">
              Boss, welcome. {books.customers} people fit through on a fair day. The crew {shop.staff?.length ? `is ${shop.staff.map((person) => person.name).join(", ")}` : "is you, until you hire"}.
            </p>
            {shop.tagline ? <p className="mt-1 text-xs text-white/70">{shop.tagline}</p> : null}
            <p className="mt-1 text-xs text-white/80">On the shelf: {shelfLine(shop.kind, shop.town)}. The board says {books.stars.toFixed(1)} stars.</p>
            <p className="mt-2 text-xs">
              {books.stars.toFixed(1)} stars · stock {books.stock} · about {cedis(books.profit)} before the till is counted
            </p>
            {shop.notice ? <p className="mt-2 rounded-2xl bg-black/30 px-3 py-2 text-xs">{shop.notice}</p> : null}
            <div className="mt-2 flex flex-wrap gap-2">
              <button type="button" onClick={() => onApply(workShift(life, shop.id))} className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-[#121212]">
                Work a shift
              </button>
              <button type="button" onClick={() => onApply(restock(life, shop.id))} className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold">
                Restock
              </button>
              <button type="button" onClick={() => onApply(setMarkup(life, shop.id, 0.85))} className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold">
                Cheaper
              </button>
              <button type="button" onClick={() => onApply(setMarkup(life, shop.id, 1.25))} className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold">
                Dearer
              </button>
              <button type="button" onClick={() => onApply(postShop(life, shop.id))} className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold">
                Post it
              </button>
              {shop.notice ? (
                <button type="button" onClick={() => onApply(clearNotice(life, shop.id))} className="rounded-full bg-[#FCD116] px-3 py-1.5 text-xs font-bold text-[#121212]">
                  Handle it
                </button>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
