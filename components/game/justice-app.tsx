"use client";

import { useState } from "react";
import { APPROACHES, MARKS, SECURITY, appealCase, assess, buySecurity, callPolice, checkProbation, doService, hireLawyer, jailWork, offerCut, openCase, payFine, plead, postBail, rob, secureShop, skipBail, toCourt, visitCell } from "@/lib/game/justice";
import { cedis, type Life, type StepResult } from "@/lib/game/world";

export function JusticeApp({ life, onBack, onApply }: { life: Life; onBack: () => void; onApply: (result: StepResult) => void }) {
  const docket = openCase(life);
  const [target, setTarget] = useState<string>(MARKS[0].id);
  const [approach, setApproach] = useState<string>(APPROACHES[2].id);
  const card = assess(life, target, approach);
  return (
    <div className="space-y-3 text-[#121212]">
      <button type="button" onClick={onBack} className="text-xs font-bold text-[#5c6b82]">
        ← Phone
      </button>
      <h2 className="text-xl font-semibold">The law</h2>
      {docket ? (
        <div className="space-y-2 rounded-2xl bg-white p-3 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-[#CE1126]">{docket.status}</p>
          <p className="text-sm">{docket.note}</p>
          <p className="text-xs text-[#5c6b82]">
            {docket.crime} · {docket.approach} · caught by {docket.caughtBy}
            {docket.bail ? ` · bail ${cedis(docket.bail)}` : ""}
            {docket.fine ? ` · owed ${cedis(docket.fine)}` : ""}
            {docket.serviceLeft ? ` · ${docket.serviceLeft}h service` : ""}
          </p>
          {docket.status === "held" ? (
            <div className="grid grid-cols-2 gap-2">
              <button type="button" className="rounded-full bg-[#121212] py-2 text-xs font-bold text-white" onClick={() => onApply(callPolice(life))}>
                Wait for police
              </button>
              <button type="button" className="rounded-full bg-white py-2 text-xs font-bold shadow" onClick={() => onApply(offerCut(life))}>
                Offer money
              </button>
            </div>
          ) : null}
          {docket.status === "booked" ? (
            <div className="grid grid-cols-2 gap-2">
              <button type="button" className="rounded-full bg-[#006B3F] py-2 text-xs font-bold text-white" onClick={() => onApply(postBail(life, "self"))}>
                Pay bail
              </button>
              <button type="button" className="rounded-full bg-white py-2 text-xs font-bold shadow" onClick={() => onApply(postBail(life, "family"))}>
                Family posts bail
              </button>
              <button type="button" className="rounded-full bg-[#121212] py-2 text-xs font-bold text-white" onClick={() => onApply(toCourt(life))}>
                Go to court
              </button>
              <button type="button" className="rounded-full bg-white py-2 text-xs font-bold shadow" onClick={() => onApply(offerCut(life))}>
                Offer money
              </button>
            </div>
          ) : null}
          {docket.status === "bail" ? (
            <div className="grid grid-cols-2 gap-2">
              <button type="button" className="rounded-full bg-[#121212] py-2 text-xs font-bold text-white" onClick={() => onApply(toCourt(life))}>
                Appear in court
              </button>
              <button type="button" className="rounded-full bg-white py-2 text-xs font-bold text-[#CE1126] shadow" onClick={() => onApply(skipBail(life))}>
                Skip bail
              </button>
            </div>
          ) : null}
          {docket.status === "court" ? (
            <div className="grid grid-cols-2 gap-2">
              <button type="button" className="rounded-full bg-[#121212] py-2 text-xs font-bold text-white" onClick={() => onApply(plead(life, "guilty"))}>
                Plead guilty
              </button>
              <button type="button" className="rounded-full bg-white py-2 text-xs font-bold shadow" onClick={() => onApply(plead(life, "trial"))}>
                Plead not guilty
              </button>
              <button type="button" className="rounded-full bg-white py-2 text-xs font-bold shadow" onClick={() => onApply(hireLawyer(life))}>
                {docket.lawyer ? "Lawyer is here" : "Hire a lawyer"}
              </button>
              <button type="button" className="rounded-full bg-white py-2 text-xs font-bold shadow" onClick={() => onApply(plead(life, "self"))}>
                Speak for yourself
              </button>
              <button type="button" className="col-span-2 rounded-full bg-white py-2 text-xs font-bold text-[#CE1126] shadow" onClick={() => onApply(plead(life, "bribe"))}>
                Try to buy the verdict
              </button>
            </div>
          ) : null}
          {docket.status === "jail" ? (
            <div className="grid grid-cols-2 gap-2">
              <button type="button" className="rounded-full bg-[#121212] py-2 text-xs font-bold text-white" onClick={() => onApply(jailWork(life))}>
                Work inside
              </button>
              <button type="button" className="rounded-full bg-white py-2 text-xs font-bold shadow" onClick={() => onApply(appealCase(life))}>
                Appeal · ₵150
              </button>
              <button type="button" className="col-span-2 rounded-full bg-white py-2 text-xs font-bold shadow" onClick={() => onApply(visitCell(life))}>
                Ask family to visit
              </button>
            </div>
          ) : null}
          {docket.status === "service" ? (
            <button type="button" className="w-full rounded-full bg-[#006B3F] py-2 text-xs font-bold text-white" onClick={() => onApply(doService(life))}>
              Work the hours
            </button>
          ) : null}
          {docket.status === "probation" ? (
            <button type="button" className="w-full rounded-full bg-[#121212] py-2 text-xs font-bold text-white" onClick={() => onApply(checkProbation(life))}>
              Report to the officer
            </button>
          ) : null}
          {docket.status === "fine" ? (
            <button type="button" className="w-full rounded-full bg-[#006B3F] py-2 text-xs font-bold text-white" onClick={() => onApply(payFine(life))}>
              Pay {cedis(docket.fine)}
            </button>
          ) : null}
        </div>
      ) : (
        <div className="space-y-2 rounded-2xl bg-white p-3 shadow-sm">
          <p className="text-sm">Anyone without security can be tried. Anyone with security ends the attempt, and you are held.</p>
          <div className="flex flex-wrap gap-1">
            {MARKS.map((mark) => (
              <button key={mark.id} type="button" onClick={() => setTarget(mark.id)} className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${target === mark.id ? "bg-[#121212] text-white" : "bg-[#f6f1ea]"}`}>
                {mark.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1">
            {APPROACHES.map((item) => (
              <button key={item.id} type="button" onClick={() => setApproach(item.id)} className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${approach === item.id ? "bg-[#7a1f1f] text-white" : "bg-[#f6f1ea]"}`}>
                {item.label}
              </button>
            ))}
          </div>
          {card ? (
            <div className="rounded-xl bg-[#f6f1ea] p-2 text-xs leading-5 text-[#5c6b82]">
              <p className="font-semibold text-[#121212]">Risk</p>
              <p>Security {card.security} · {card.level}. {card.detail}</p>
              <p>{card.night ? "Night." : "Day."} Street heat {Math.round(card.crime * 100)}%. Known money about {cedis(card.wealth)}.</p>
              <p>Your nerve is fitness {life.skills.fitness} and hustle {life.skills.hustle}. {card.line}</p>
              <p>{card.approach.line}</p>
            </div>
          ) : null}
          <button type="button" className="w-full rounded-full bg-[#7a1f1f] py-2 text-sm font-bold text-white" onClick={() => onApply(rob(life, target, approach))}>
            Proceed
          </button>
          <p className="text-[11px] text-[#8b97ab]">Back out by leaving this screen. A caught attempt goes to security, then the station, then bail or court.</p>
        </div>
      )}
      <div className="rounded-2xl bg-white p-3 shadow-sm">
        <p className="text-sm font-semibold">Your house · {SECURITY[life.security ?? 0].label}</p>
        <div className="mt-2 flex flex-wrap gap-1">
          {SECURITY.slice(1, 6).map((level) => (
            <button key={level.level} type="button" onClick={() => onApply(buySecurity(life, level.level))} className="rounded-full bg-[#f6f1ea] px-2.5 py-1 text-[11px] font-bold">
              {level.level}. {level.label}
            </button>
          ))}
        </div>
        {(life.businesses ?? []).map((shop) => (
          <button key={shop.id} type="button" onClick={() => onApply(secureShop(life, shop.id, Math.min(5, (shop.security ?? 0) + 1)))} className="mt-2 block text-left text-xs font-semibold text-[#5c6b82]">
            {shop.name ?? "Shop"} · level {shop.security ?? 0}. Raise it one step.
          </button>
        ))}
      </div>
    </div>
  );
}
