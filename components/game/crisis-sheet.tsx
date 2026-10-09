"use client";

import { useEffect, type ReactNode } from "react";
import { LowPolyHuman } from "@/components/game/low-poly-human";
import { askKin, callDoctor, callFriend, callRide, chooseCare, drinkNow, eatNow, getUp, keepWalking, payCare, shortenQueue, sitDown, waitCare } from "@/lib/game/crisis";
import { cedis, type Life, type StepResult } from "@/lib/game/world";

export function CrisisLayer({ life, onApply }: { life: Life; onApply: (result: StepResult) => void }) {
  const crisis = life.health?.crisis;
  const warn = life.health?.warn;
  useEffect(() => {
    if (!crisis && !warn) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const Ctx = window.AudioContext;
    const audio = new Ctx();
    let timer = 0;
    const beat = () => {
      const osc = audio.createOscillator();
      const amp = audio.createGain();
      osc.frequency.value = crisis ? 70 : 90;
      osc.type = "sine";
      amp.gain.value = 0.03;
      amp.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.18);
      osc.connect(amp);
      amp.connect(audio.destination);
      osc.start();
      osc.stop(audio.currentTime + 0.2);
    };
    beat();
    timer = window.setInterval(beat, crisis ? 700 : 1100);
    return () => {
      window.clearInterval(timer);
      void audio.close();
    };
  }, [crisis, warn]);

  if (!crisis && !warn) return null;
  const ready = crisis ? crisis.ward !== "ground" && crisis.until <= life.minutes : false;
  const waiting = crisis ? crisis.ward !== "ground" && crisis.until > life.minutes : false;
  return (
    <>
      <div
        className="pointer-events-none absolute inset-0 z-[55]"
        style={{
          boxShadow: crisis ? "inset 0 0 140px 50px rgba(0,0,0,.85)" : "inset 0 0 90px 28px rgba(0,0,0,.45)",
          backdropFilter: crisis ? "blur(2px)" : "blur(1px)",
        }}
      />
      <div className="absolute inset-x-0 bottom-0 z-[60] max-h-[min(78vh,100dvh-4.5rem)] overflow-y-auto rounded-t-[28px] bg-[#1a120f] p-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] text-white shadow-[0_-16px_50px_rgba(0,0,0,.45)]">
        <div className="mx-auto mb-3 h-40 w-28">
          <LowPolyHuman skin={life.look.skin} shirt={life.look.cloth} pants={life.look.body === "woman" ? "#1c2744" : life.look.accent} hair={life.look.hair} body={life.look.body} pose={crisis ? "faint" : "walk"} passive />
        </div>
        {warn && !crisis ? (
          <>
            <p className="font-display text-2xl">You feel weak</p>
            <p className="mt-1 text-sm text-white/75">Sit down, drink, or eat. Another long walk can put you on the ground.</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Act onClick={() => onApply(sitDown(life))}>Sit down</Act>
              <Act onClick={() => onApply(drinkNow(life))}>Drink water</Act>
              <Act onClick={() => onApply(eatNow(life))}>Eat something</Act>
              <Act onClick={() => onApply(callFriend(life))}>Call a friend</Act>
              <Act onClick={() => onApply(callRide(life))}>Taxi · ₵18</Act>
              <Act onClick={() => onApply(keepWalking(life))}>Keep walking</Act>
            </div>
          </>
        ) : null}
        {crisis ? (
          <>
            <p className="font-display text-2xl">{crisis.ward === "ground" ? "On the ground" : "In care"}</p>
            <p className="mt-1 text-sm leading-6 text-white/80">{crisis.note}</p>
            {crisis.help === "film" ? <p className="mt-1 text-xs text-white/60">A phone is recording. The clip can travel either way.</p> : null}
            {crisis.help === "none" ? <p className="mt-1 text-xs text-white/60">Most people walk around you.</p> : null}
            {crisis.help === "stranger" ? <p className="mt-1 text-xs text-white/60">One person stays. The rest keep moving.</p> : null}
            {waiting ? <p className="mt-2 text-sm font-semibold">Still waiting. {Math.max(1, crisis.until - life.minutes)} minutes on the bench.</p> : null}
            {ready ? <p className="mt-2 text-sm font-semibold">Bill {cedis(Math.max(0, crisis.bill - crisis.paid))}.</p> : null}
            <div className="mt-3 grid grid-cols-2 gap-2">
              {crisis.ward === "ground" ? (
                <>
                  <Act onClick={() => onApply(chooseCare(life, "public"))}>Public hospital</Act>
                  <Act onClick={() => onApply(chooseCare(life, "private"))}>Private clinic</Act>
                  <Act onClick={() => onApply(chooseCare(life, "healer"))}>Herbalist</Act>
                  <Act onClick={() => onApply(chooseCare(life, "chemist"))}>Pharmacy</Act>
                  <Act onClick={() => onApply(callDoctor(life))}>Your doctor · ₵200</Act>
                  <Act onClick={() => onApply(getUp(life))}>Get up</Act>
                </>
              ) : null}
              {waiting ? (
                <>
                  <Act onClick={() => onApply(waitCare(life))}>Wait to be seen</Act>
                  <Act onClick={() => onApply(shortenQueue(life))}>Move up · ₵40</Act>
                </>
              ) : null}
              {ready ? (
                <>
                  <Act onClick={() => onApply(payCare(life, false))}>Pay {cedis(Math.max(0, crisis.bill - crisis.paid))}</Act>
                  <Act onClick={() => onApply(payCare(life, true))}>Pay half</Act>
                  <Act onClick={() => onApply(askKin(life))}>Ask family</Act>
                  <Act onClick={() => onApply(getUp(life))}>Leave</Act>
                </>
              ) : null}
            </div>
          </>
        ) : null}
      </div>
    </>
  );
}

function Act({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="rounded-2xl bg-white/10 px-3 py-3 text-left text-sm font-bold">
      {children}
    </button>
  );
}
