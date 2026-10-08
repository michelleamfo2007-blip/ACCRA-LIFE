"use client";

import { useState } from "react";
import { BIZ_GROUPS, BUSINESSES, MAX_BIZ_LEVEL, TILL_HOURS, bizKind, bizRate, bizWages } from "@/lib/game/biz-table";
import { GOODS, bagCount, collectTill, sellBusiness, tillOf, upgradeBusiness, upgradeCost } from "@/lib/game/trade";
import {
  BRANDS,
  SITES,
  STAFF_POOL,
  booksOf,
  clearNotice,
  franchiseShop,
  hireStaff,
  openShop,
  passShop,
  quoteShop,
  rollPermit,
  restock,
  shopSpot,
  shopTitle,
  type ShopSetup,
  type SiteId,
} from "@/lib/game/shop-run";
import { cedis, type Life, type StepResult } from "@/lib/game/world";

const EMPTY: ShopSetup = { kind: "kiosk", name: "", color: BRANDS[0], tagline: "", site: "street", staffIds: [], markup: 1, opening: false };

export function BizApp({ life, onBack, onApply, onVisit }: { life: Life; onBack: () => void; onApply: (result: StepResult) => void; onVisit?: (spot: string) => void }) {
  const owned = life.businesses ?? [];
  const bag = Object.entries(life.bag ?? {});
  const [draft, setDraft] = useState<ShopSetup | null>(null);
  const [step, setStep] = useState<"type" | "site" | "brand" | "crew" | "price">("type");
  const quoted = draft ? quoteShop(draft) : null;
  const plan = draft ? BUSINESSES.find((item) => item.id === draft.kind) : null;

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[#f6f1ea] text-[#121212]">
      <div className="flex items-center gap-2 bg-[#121212] px-2 py-2 text-white">
        <button type="button" onClick={draft ? () => setDraft(null) : onBack} className="grid h-9 w-9 place-items-center rounded-full text-lg" aria-label="Back">
          ‹
        </button>
        <p className="font-semibold">{draft ? "Open a business" : "Business"}</p>
        <span className="ml-auto pr-2 text-sm font-semibold text-[#FCD116]">{cedis(life.cash)}</span>
      </div>
      <div className="min-h-0 flex-1 space-y-3 overflow-auto px-4 py-4">
        {draft && plan && quoted ? (
          <Setup
            life={life}
            draft={draft}
            setDraft={setDraft}
            step={step}
            setStep={setStep}
            onApply={onApply}
          />
        ) : (
          <>
            {owned.length ? <p className="text-[11px] font-bold tracking-wide text-[#8b97ab]">YOURS</p> : null}
            {owned.map((shop) => {
              const kind = bizKind(shop.kind);
              const till = tillOf(life, shop.id);
              const books = booksOf(life, shop);
              const full = (life.minutes - shop.lastCollect) / 60 >= TILL_HOURS;
              return (
                <div key={shop.id} className="rounded-2xl bg-white p-3 shadow-sm">
                  <div className="flex items-center gap-3">
                    <span className="grid h-11 w-11 place-items-center rounded-full text-xl text-white" style={{ background: shop.color || "#121212" }}>
                      {kind.emoji}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">
                        {shopTitle(shop)} · {"★".repeat(shop.level)}
                      </span>
                      <span className="block text-xs text-[#5c6b82]">
                        {kind.area}
                        {shop.town === "kumasi" ? " · Kumasi" : ""} · {books.stars.toFixed(1)} stars · {books.customers} customers a day
                      </span>
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-[#5c6b82]">
                    Till {cedis(bizRate(shop.kind, shop.level) * 24)} before wages. Profit on the books about {cedis(books.profit)}. Wages {cedis(bizWages(shop.kind, shop.level, shop))} on Saturday.
                    {shop.branches ? ` ${shop.branches} branch${shop.branches > 1 ? "es" : ""}.` : ""}
                    {shop.heir ? ` Papers name ${shop.heir}.` : ""}
                  </p>
                  {shop.notice ? <p className="mt-2 rounded-2xl bg-[#fff4c2] px-3 py-2 text-xs">{shop.notice}</p> : null}
                  <p className={`mt-2 text-sm font-semibold ${full ? "text-[#CE1126]" : "text-[#006B3F]"}`}>{full ? `Till is full at ${cedis(till)}. Collect it.` : `In the till: ${cedis(till)}`}</p>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => onApply(collectTill(life, shop.id))} disabled={till < 1} className="rounded-full bg-[#006B3F] py-2 text-xs font-bold text-white disabled:opacity-40">
                      Withdraw
                    </button>
                    <button type="button" onClick={() => onVisit?.(shopSpot(shop))} className="rounded-full bg-[#121212] py-2 text-xs font-bold text-white">
                      Visit
                    </button>
                    <button type="button" onClick={() => onApply(restock(life, shop.id))} className="rounded-full bg-[#f4f7fb] py-2 text-xs font-bold">
                      Restock · {shop.stock ?? 100}
                    </button>
                    <button type="button" onClick={() => onApply(upgradeBusiness(life, shop.id))} disabled={shop.level >= MAX_BIZ_LEVEL} className="rounded-full bg-[#f4f7fb] py-2 text-xs font-bold disabled:opacity-40">
                      {shop.level >= MAX_BIZ_LEVEL ? "Top level" : `Grow ${cedis(upgradeCost(shop.kind, shop.level))}`}
                    </button>
                    {shop.notice ? (
                      <button type="button" onClick={() => onApply(clearNotice(life, shop.id))} className="rounded-full bg-[#FCD116] py-2 text-xs font-bold">
                        Handle it
                      </button>
                    ) : null}
                    <button type="button" onClick={() => onApply(franchiseShop(life, shop.id))} className="rounded-full bg-[#f4f7fb] py-2 text-xs font-bold">
                      Franchise
                    </button>
                    <button type="button" onClick={() => onApply(passShop(life, shop.id))} className="rounded-full bg-[#f4f7fb] py-2 text-xs font-bold">
                      Pass it on
                    </button>
                    <button type="button" onClick={() => onApply(sellBusiness(life, shop.id))} className="rounded-full bg-[#f4f7fb] py-2 text-xs font-bold text-[#CE1126]">
                      Sell {cedis(Math.round(kind.price * 0.6))}
                    </button>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {STAFF_POOL.filter((person) => !(shop.staff ?? []).some((row) => row.id === person.id))
                      .slice(0, 3)
                      .map((person) => (
                        <button key={person.id} type="button" onClick={() => onApply(hireStaff(life, shop.id, person.id))} className="rounded-full bg-[#f4f7fb] px-2 py-1 text-[11px] font-semibold">
                          Hire {person.name} · {person.role}
                        </button>
                      ))}
                  </div>
                </div>
              );
            })}
            <button
              type="button"
              onClick={() => {
                setDraft({ ...EMPTY });
                setStep("type");
              }}
              className="w-full rounded-full bg-[#121212] py-3 text-sm font-bold text-white"
            >
              Open a business
            </button>
            <p className="text-xs leading-5 text-[#5c6b82]">The shop runs while you are away. The phone tells you when the till, the stock, or the staff need you. Walk in and they call you boss.</p>
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
              <p className="text-sm text-[#5c6b82]">Empty. Markets still sell goods you can carry across town.</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Setup({
  life,
  draft,
  setDraft,
  step,
  setStep,
  onApply,
}: {
  life: Life;
  draft: ShopSetup;
  setDraft: (next: ShopSetup) => void;
  step: "type" | "site" | "brand" | "crew" | "price";
  setStep: (step: "type" | "site" | "brand" | "crew" | "price") => void;
  onApply: (result: StepResult) => void;
}) {
  const [group, setGroup] = useState<(typeof BIZ_GROUPS)[number]>("Food");
  const plan = BUSINESSES.find((item) => item.id === draft.kind) ?? BUSINESSES[0];
  const quoted = quoteShop(draft);
  if (step === "type") {
    return (
      <>
        <div className="flex gap-2 overflow-auto">
          {BIZ_GROUPS.map((item) => (
            <button key={item} type="button" onClick={() => setGroup(item)} className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${group === item ? "bg-[#121212] text-white" : "bg-white"}`}>
              {item}
            </button>
          ))}
        </div>
        {BUSINESSES.filter((item) => item.group === group && !(life.businesses ?? []).some((shop) => shop.kind === item.id)).map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setDraft({ ...draft, kind: item.id, permit: undefined, site: item.homeOk ? draft.site : draft.site === "home" ? "street" : draft.site });
              setStep("site");
            }}
            className="flex w-full items-center gap-3 rounded-2xl bg-white p-3 text-left shadow-sm"
          >
            <span className="text-xl">{item.emoji}</span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold">
                {item.label} · {item.area}
                {item.town === "kumasi" ? " · Kumasi" : ""}
              </span>
              <span className="block text-xs text-[#5c6b82]">{item.detail}</span>
              <span className="block text-xs font-semibold text-[#006B3F]">
                From {cedis(item.price)} · ~{cedis(item.perHour * 24)} a day · {item.difficulty} · {item.skill}
              </span>
            </span>
          </button>
        ))}
      </>
    );
  }
  if (step === "site") {
    return (
      <>
        <p className="text-sm font-semibold">{plan.label}</p>
        {SITES.filter((site) => site.id !== "home" || plan.homeOk).map((site) => (
          <button
            key={site.id}
            type="button"
            onClick={() => {
              setDraft({ ...draft, site: site.id as SiteId });
              setStep("brand");
            }}
            className="w-full rounded-2xl bg-white p-3 text-left shadow-sm"
          >
            <span className="block font-semibold">
              {site.label} · {cedis(Math.round(plan.price * site.cost))}
            </span>
            <span className="block text-xs text-[#5c6b82]">{site.blurb}</span>
          </button>
        ))}
      </>
    );
  }
  if (step === "brand") {
    return (
      <>
        <label className="block text-xs font-bold text-[#8b97ab]">
          NAME
          <input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} maxLength={28} placeholder="Auntie Ama's" className="mt-1 h-10 w-full rounded-full bg-white px-4 text-sm font-normal text-[#121212] outline-none" />
        </label>
        <label className="block text-xs font-bold text-[#8b97ab]">
          TAGLINE
          <input value={draft.tagline} onChange={(event) => setDraft({ ...draft, tagline: event.target.value })} maxLength={60} placeholder="Optional" className="mt-1 h-10 w-full rounded-full bg-white px-4 text-sm font-normal text-[#121212] outline-none" />
        </label>
        <div className="flex gap-2">
          {BRANDS.map((color) => (
            <button key={color} type="button" onClick={() => setDraft({ ...draft, color })} className="h-8 w-8 rounded-full" style={{ background: color, outline: draft.color === color ? "2px solid #121212" : "none" }} aria-label={color} />
          ))}
        </div>
        <button type="button" onClick={() => setStep("crew")} className="rounded-full bg-[#121212] py-3 text-sm font-bold text-white">
          Crew
        </button>
      </>
    );
  }
  if (step === "crew") {
    return (
      <>
        <p className="text-xs text-[#5c6b82]">Hire up to two now, or work the shift yourself. Wages leave the wallet every Saturday.</p>
        {STAFF_POOL.map((person) => {
          const on = draft.staffIds.includes(person.id);
          return (
            <button
              key={person.id}
              type="button"
              onClick={() => {
                const staffIds = on ? draft.staffIds.filter((id) => id !== person.id) : draft.staffIds.length >= 2 ? draft.staffIds : [...draft.staffIds, person.id];
                setDraft({ ...draft, staffIds });
              }}
              className={`w-full rounded-2xl p-3 text-left shadow-sm ${on ? "bg-[#121212] text-white" : "bg-white"}`}
            >
              <span className="block font-semibold">
                {person.name} · {person.role} · {cedis(person.pay)}
              </span>
              <span className={`block text-xs ${on ? "text-white/70" : "text-[#5c6b82]"}`}>
                Skill {person.skill} · {person.trait}
              </span>
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => {
            setDraft({ ...draft, permit: rollPermit(draft.kind) });
            setStep("price");
          }}
          className="rounded-full bg-[#006B3F] py-3 text-sm font-bold text-white"
        >
          Prices
        </button>
      </>
    );
  }
  return (
    <>
      <p className="text-sm font-semibold">{draft.name || plan.label}</p>
      <p className="text-xs leading-5 text-[#5c6b82]">
        {quoted.site.label}. Startup {cedis(quoted.base)}
        {quoted.wages ? ` plus ${cedis(quoted.wages)} to start the crew` : ""}. {draft.opening ? "Grand opening is in the bill." : "Skip the party and open quiet."}
        {quoted.permit ? ` The clerk wants a drink. Permit ${cedis(quoted.permit)}.` : " The permit is in your name."}
      </p>
      <div className="grid grid-cols-3 gap-2">
        {[
          [0.85, "Cheap"],
          [1, "Fair"],
          [1.25, "Steep"],
        ].map(([markup, label]) => (
          <button key={label} type="button" onClick={() => setDraft({ ...draft, markup: Number(markup) })} className={`rounded-full py-2 text-xs font-bold ${draft.markup === markup ? "bg-[#121212] text-white" : "bg-white"}`}>
            {label}
          </button>
        ))}
      </div>
      <button type="button" onClick={() => setDraft({ ...draft, opening: !draft.opening })} className="rounded-2xl bg-white px-3 py-3 text-left text-sm font-semibold shadow-sm">
        {draft.opening ? "Grand opening is on" : "Grand opening is off"} · {cedis(Math.round(plan.price * 0.12))}
      </button>
      <button
        type="button"
        onClick={() => {
          const result = openShop(life, draft);
          onApply(result);
          if (!result.error) setDraft({ ...EMPTY });
        }}
        className="rounded-full bg-[#006B3F] py-3 text-sm font-bold text-white"
      >
        Open · {cedis(quoted.total)}
      </button>
    </>
  );
}
