"use client";

import { useState } from "react";
import { PHASES, argueBrief, canPractice, causeList, courtTitle, watchedHearing, type Hearing } from "@/lib/game/cause-list";
import { plead } from "@/lib/game/justice";
import type { Life, StepResult } from "@/lib/game/world";

export function CauseList({ life, you, court, onApply }: { life: Life; you: string; court: string; onApply: (result: StepResult) => void }) {
  const rows = causeList(life, you);
  const yours = rows.find((row) => row.yours) ?? null;
  const [watch, setWatch] = useState<Hearing | null>(null);
  const [phase, setPhase] = useState(0);
  const [openList, setOpenList] = useState(false);
  const title = courtTitle(court);

  function open(row: Hearing) {
    setWatch(row);
    setPhase(0);
  }

  function advance() {
    if (!watch) return;
    if (phase < PHASES.length - 1) {
      setPhase((value) => value + 1);
      return;
    }
    if (!watch.yours) onApply(watchedHearing(life, watch.title));
    setWatch(null);
  }

  if (!openList) {
    return (
      <button
        type="button"
        onClick={() => setOpenList(true)}
        className="absolute left-2 top-[max(4.6rem,calc(env(safe-area-inset-top)+4rem))] z-30 max-w-[12rem] truncate rounded-full bg-[#4a3428]/90 px-3 py-1.5 text-left text-xs font-bold text-[#f6efe4] shadow"
      >
        Cause list · {rows.length}
      </button>
    );
  }

  return (
    <>
      <section className="absolute left-2 right-2 top-[max(4.6rem,calc(env(safe-area-inset-top)+4rem))] z-40 max-h-[38vh] overflow-auto rounded-2xl bg-[#4a3428] p-3 text-[#f6efe4] shadow-xl">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-bold tracking-wide">⚖ CAUSE LIST</p>
          <button type="button" onClick={() => setOpenList(false)} aria-label="Close cause list" className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white/15 text-xs">
            ×
          </button>
        </div>
        <p className="text-xs text-[#e7d3b0]">{title}</p>
        <p className="mt-1 text-xs">{yours ? `Your case: ${yours.title} · ${yours.time}` : "No case of yours today. Watch a trial from the gallery."}</p>
        <p className="mt-2 text-[11px] font-semibold uppercase tracking-wide text-[#e7d3b0]">{rows.length} hearings coming up</p>
        <ul className="mt-1 space-y-1">
          {rows.map((row) => (
            <li key={row.id} className="flex items-center gap-2 rounded-xl bg-[#3b291f] px-2 py-1.5 text-xs">
              <span className="min-w-0 flex-1 truncate">{row.title}</span>
              <span className="shrink-0 text-[#e7d3b0]">{row.time}</span>
              <button type="button" onClick={() => open(row)} className="shrink-0 rounded-full bg-[#f6efe4] px-2 py-1 text-[11px] font-bold text-[#3b291f]">
                Watch
              </button>
            </li>
          ))}
        </ul>
      </section>
      {watch ? (
        <div className="absolute inset-x-3 bottom-[max(5.2rem,env(safe-area-inset-bottom))] z-50 rounded-[28px] bg-[#f6efe4] p-4 text-[#2a1c14] shadow-2xl">
          <p className="text-xs font-bold uppercase tracking-wide text-[#7a4a28]">In the High Court of Justice</p>
          <p className="mt-1 font-semibold">{watch.title}</p>
          <p className="text-xs text-[#6b5344]">
            {watch.judge} · {watch.crime} · gallery seat
          </p>
          <p className="mt-3 text-sm">{PHASES[phase]}</p>
          <p className="mt-1 text-xs text-[#6b5344]">
            Phase {phase + 1} of {PHASES.length}
            {watch.yours ? " · you are in the dock" : ""}
          </p>
          {phase < PHASES.length - 1 ? (
            <button type="button" onClick={advance} className="mt-3 w-full rounded-full bg-[#3b291f] py-2.5 text-sm font-bold text-[#f6efe4]">
              Continue
            </button>
          ) : watch.yours && life.docket?.status === "court" ? (
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button type="button" onClick={() => onApply(plead(life, "guilty"))} className="rounded-full bg-[#3b291f] py-2 text-xs font-bold text-white">
                Plead guilty
              </button>
              <button type="button" onClick={() => onApply(plead(life, "trial"))} className="rounded-full bg-white py-2 text-xs font-bold">
                Not guilty
              </button>
              <button type="button" onClick={() => onApply(plead(life, "self"))} className="rounded-full bg-white py-2 text-xs font-bold">
                Speak for yourself
              </button>
              <button type="button" onClick={() => onApply(plead(life, "bribe"))} className="rounded-full bg-white py-2 text-xs font-bold text-[#7a1f1f]">
                Try the clerk
              </button>
            </div>
          ) : (
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button type="button" onClick={advance} className="rounded-full bg-[#3b291f] py-2 text-xs font-bold text-white">
                Leave the gallery
              </button>
              {canPractice(life) && !watch.yours ? (
                <button type="button" onClick={() => onApply(argueBrief(life, watch))} className="rounded-full bg-[#006B3F] py-2 text-xs font-bold text-white">
                  Take the brief
                </button>
              ) : (
                <button type="button" onClick={() => setWatch(null)} className="rounded-full bg-white py-2 text-xs font-bold">
                  Sit back down
                </button>
              )}
            </div>
          )}
        </div>
      ) : null}
    </>
  );
}
