"use client";

import type { ReactNode } from "react";
import type { ItemCard } from "@/lib/game/item-verbs";
import { cedis, lockReason, type Life, type NeedKey, type Verb } from "@/lib/game/world";

const NEED_LABEL: Record<NeedKey, string> = {
  hunger: "Food",
  energy: "Energy",
  fun: "Fun",
  social: "Social",
  hygiene: "Hygiene",
  bladder: "Bladder",
};

const SKILL_LABEL: Record<string, string> = {
  hustle: "Hustle",
  cooking: "Cooking",
  music: "Music",
  fitness: "Fitness",
  charm: "Charm",
  coding: "Coding",
  career: "Career",
};

function chips(verb: Verb) {
  const list: { text: string; good: boolean }[] = [];
  (Object.keys(verb.effects) as NeedKey[]).forEach((key) => {
    const value = verb.effects[key] ?? 0;
    if (value > 0) list.push({ text: `+${NEED_LABEL[key]}`, good: true });
    if (value < 0 && key !== "bladder" && key !== "hunger") list.push({ text: `−${NEED_LABEL[key]}`, good: false });
  });
  if (verb.skill) list.unshift({ text: `+${SKILL_LABEL[verb.skill]}`, good: true });
  if (verb.stock) list.push({ text: `+${verb.stock} groceries`, good: true });
  if (verb.pantry) list.push({ text: `Uses ${verb.pantry} grocer${verb.pantry > 1 ? "ies" : "y"}`, good: false });
  return list;
}

function price(verb: Verb, life: Life) {
  if (verb.earn) {
    const pay = verb.earn + (verb.perSkill && verb.skill ? verb.perSkill * life.skills[verb.skill] : 0);
    return { text: `Earns ${cedis(pay)}`, tone: "bg-[#e6f4ec] text-[#006B3F]" };
  }
  if (verb.cost) return { text: cedis(verb.cost), tone: "text-[#121212]" };
  return { text: "Free", tone: "text-[#006B3F]" };
}

export function ItemSheet({ card, life, onPick, onClose, footer }: { card: ItemCard; life: Life; onPick: (verb: Verb) => void; onClose: () => void; footer?: ReactNode }) {
  return (
    <div className="absolute inset-x-0 bottom-0 z-40 mx-auto max-h-[72dvh] w-full max-w-xl overflow-auto overscroll-contain rounded-t-[28px] bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_-16px_50px_rgba(22,32,60,.2)] touch-pan-y">
      <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-[#e3e8f0]" />
      <div className="flex items-center gap-3">
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-[#f4f7fb] text-2xl">{card.emoji}</span>
        <span className="min-w-0">
          <span className="block font-display text-xl leading-tight">{card.name}</span>
          <span className="block text-sm text-[#5c6b82]">{card.detail}</span>
        </span>
        <button type="button" onClick={onClose} className="ml-auto shrink-0 rounded-full bg-[#f4f7fb] px-3 py-1 text-sm font-semibold text-[#5c6b82]">
          Close
        </button>
      </div>
      {card.verbs.length ? (
        <div className="mt-4 grid grid-cols-2 gap-3">
          {card.verbs.map((verb) => {
            const locked = lockReason(life, verb);
            const tag = price(verb, life);
            return (
              <button
                key={verb.id}
                type="button"
                disabled={Boolean(locked)}
                onClick={() => onPick(verb)}
                className={`flex min-h-[8.5rem] flex-col rounded-2xl border border-[#edf0f5] p-3 text-left shadow-sm transition active:scale-[.98] ${locked ? "bg-[#f7f8fb] text-[#8a96a8]" : "bg-white"}`}
              >
                <span className="flex w-full items-start justify-between gap-2">
                  <span className={`grid h-11 w-11 place-items-center rounded-full text-xl ${locked ? "bg-[#eef1f5] grayscale" : "bg-[#f4f7fb]"}`}>{card.emoji}</span>
                  <span className="text-right">
                    <span className="block rounded-full bg-[#f4f7fb] px-2 py-0.5 text-[11px] text-[#5c6b82]">⏱ {verb.minutes >= 60 ? `${Math.round((verb.minutes / 60) * 10) / 10}h` : `${verb.minutes}m`}</span>
                    {locked ? null : <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${tag.tone}`}>{tag.text}</span>}
                  </span>
                </span>
                <span className="mt-2 block font-semibold leading-snug">{verb.label}</span>
                {locked ? (
                  <span className="mt-auto pt-2 text-xs font-semibold text-[#CE1126]">🔒 {locked}</span>
                ) : (
                  <span className="mt-auto flex flex-wrap gap-1 pt-2">
                    {chips(verb).map((chip) => (
                      <span key={chip.text} className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${chip.good ? "bg-[#eef3ff] text-[#3b6cff]" : "bg-[#fdecee] text-[#CE1126]"}`}>
                        {chip.text}
                      </span>
                    ))}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      ) : (
        <p className="mt-4 rounded-2xl bg-[#f4f7fb] px-3 py-3 text-sm text-[#5c6b82]">Nothing to do with this one yet.</p>
      )}
      {footer ? <div className="mt-4">{footer}</div> : null}
    </div>
  );
}
