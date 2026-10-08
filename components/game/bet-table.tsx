"use client";

import { useEffect, useRef, useState } from "react";
import { betCard, betColour, betDice, borrowTable, bragBet, clockLabel, stepAway, tableClock, tableTitle, VENUES, venueOf, type VenueId } from "@/lib/game/bet";
import { cedis, type Life, type StepResult } from "@/lib/game/world";

const CHIPS = [10, 50, 100, 500, 1000];
const CHIP_COLOR: Record<number, string> = { 10: "#e7c85a", 50: "#3d7ea6", 100: "#006B3F", 500: "#CE1126", 1000: "#1c1c1c" };
const FEED = ["Kwame just took ₵350 on red.", "Esi walked away from the dice.", "Abena is on a three-win run.", "The viewing centre is loud. Side bets everywhere.", "Kojo lost the last hand and went quiet."];

type Mode = "colour" | "card" | "dice";
type Phase = "idle" | "hold" | "flip" | "result";

export function BetTable({ life, onBack, onApply }: { life: Life; onBack: () => void; onApply: (result: StepResult) => void }) {
  const [venue, setVenue] = useState<VenueId>("bar");
  const [mode, setMode] = useState<Mode>("colour");
  const [stake, setStake] = useState(0);
  const [phase, setPhase] = useState<Phase>("idle");
  const [roll, setRoll] = useState<StepResult | null>(null);
  const [flash, setFlash] = useState<"win" | "lose" | "">("");
  const [feed, setFeed] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [faces, setFaces] = useState<[number, number]>([1, 1]);
  const timers = useRef<number[]>([]);
  const applied = useRef(false);
  const pending = useRef<StepResult | null>(null);
  const applyRef = useRef(onApply);
  applyRef.current = onApply;
  const room = venueOf(venue);
  const clock = tableClock(life, venue);
  const title = tableTitle(life);
  const bet = roll?.bet;
  const busy = phase === "hold" || phase === "flip";
  const showFace = phase === "flip" || phase === "result";

  useEffect(() => {
    const tick = window.setInterval(() => setNow(Date.now()), 30000);
    const line = window.setInterval(() => setFeed((n) => (n + 1) % FEED.length), 4000);
    return () => {
      window.clearInterval(tick);
      window.clearInterval(line);
    };
  }, []);

  useEffect(() => {
    return () => {
      timers.current.forEach((id) => window.clearTimeout(id));
      if (pending.current && !applied.current) applyRef.current(pending.current);
    };
  }, []);

  function clearTimers() {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
  }

  function addChip(value: number) {
    if (busy || clock.closed) return;
    setStake((current) => Math.min(room.max, life.cash, clock.cap - clock.lost, current + value));
    clink();
  }

  function holdChip(value: number) {
    addChip(value);
    const start = window.setTimeout(() => {
      const loop = window.setInterval(() => addChip(value), 160);
      timers.current.push(loop);
    }, 360);
    timers.current.push(start);
  }

  function release() {
    clearTimers();
  }

  function allIn() {
    if (busy || clock.closed) return;
    setStake(Math.max(0, Math.min(life.cash, room.max, clock.cap - clock.lost)));
    clink();
  }

  function begin(result: StepResult) {
    if (result.error || !result.bet) {
      onApply(result);
      return;
    }
    clearTimers();
    applied.current = false;
    pending.current = result;
    setRoll(result);
    setPhase("hold");
    setFlash("");
    tension(result.bet.stake);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const flipAt = reduced ? 200 : 1200;
    const endAt = reduced ? 500 : result.bet.kind === "dice" ? 2800 : 2100;
    if (result.bet.kind === "dice" && !reduced) {
      const tumble = window.setInterval(() => setFaces([1 + Math.floor(Math.random() * 6), 1 + Math.floor(Math.random() * 6)]), 90);
      timers.current.push(tumble);
    }
    timers.current.push(window.setTimeout(() => setPhase("flip"), flipAt));
    timers.current.push(
      window.setTimeout(() => {
        if (result.bet?.dice) setFaces(result.bet.dice);
        setPhase("result");
        setFlash(result.bet?.win ? "win" : result.bet?.tie ? "" : "lose");
        finishSound(Boolean(result.bet?.win));
        applied.current = true;
        pending.current = null;
        applyRef.current(result);
      }, endAt),
    );
  }

  function playColour(pick: "red" | "black") {
    if (busy) return;
    begin(betColour(life, stake, pick, venue));
  }
  function playCard(pick: "higher" | "lower") {
    if (busy) return;
    begin(betCard(life, stake, pick, venue));
  }
  function playDice(pick: "under" | "over" | "seven") {
    if (busy) return;
    begin(betDice(life, stake, pick, venue));
  }

  const felt = venue === "street" ? "#3e5c38" : venue === "casino" ? "#0c5a3c" : venue === "online" ? "#151b2b" : venue === "friend" ? "#5a3b28" : venue === "sports" ? "#146b40" : "#1b4636";
  const wood = venue === "online" ? "#0e1320" : "#6b4428";
  const left = Math.max(0, clock.until - now);
  const stacks = stackOf(stake);
  const crowd = phase === "result" ? (bet?.win ? "The room cheers." : bet?.tie ? "Push. Nobody moves." : "Somebody says chale, sorry.") : room.line;

  return (
    <div className="flex min-h-0 flex-1 flex-col text-white" style={{ background: wood }}>
      <style>{`
        .card-scene { perspective: 700px; }
        .card-inner { position: relative; height: 100%; width: 100%; transform-style: preserve-3d; transition: transform .8s ease; }
        .card-inner.flipped { transform: rotateY(180deg); }
        .card-face { position: absolute; inset: 0; backface-visibility: hidden; border-radius: 10px; }
        .card-back { background: repeating-linear-gradient(45deg, #7a1f2b, #7a1f2b 6px, #5c1520 6px, #5c1520 12px); }
        .card-front { background: #fffdf8; transform: rotateY(180deg); display: flex; flex-direction: column; align-items: center; justify-content: center; font-weight: 800; }
        .die-tumble { animation: tumble .35s linear infinite; }
        .chip-out { animation: chipOut .7s ease forwards; }
        .chip-in { animation: chipIn .7s ease forwards; }
        .fly-cash { animation: flyCash .8s ease forwards; }
        @keyframes tumble { 50% { transform: rotate(18deg) scale(1.08); } }
        @keyframes chipOut { to { transform: translateY(-46px); opacity: .2; } }
        @keyframes chipIn { to { transform: translateY(36px); } }
        @keyframes flyCash { from { transform: translateY(12px); opacity: 0; } to { transform: translateY(-28px); opacity: 1; } }
        @media (prefers-reduced-motion: reduce) {
          .card-inner, .die-tumble, .chip-out, .chip-in, .fly-cash { animation: none; transition: none; }
        }
      `}</style>
      <div className="flex items-center gap-2 px-3 py-2">
        <button type="button" onClick={onBack} className="grid h-9 w-9 place-items-center rounded-full bg-black/30 text-lg" aria-label="Back">
          ‹
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold">{room.name}</p>
          <p className="text-[11px] text-white/70">{title || "First time at the table"}</p>
        </div>
        <p className={`text-lg font-black ${flash === "win" ? "text-[#7dffb3]" : flash === "lose" ? "text-[#ffb4b4]" : "text-[#FCD116]"}`}>{cedis(life.cash)}</p>
      </div>
      <div className="min-h-0 flex-1 touch-pan-y space-y-3 overflow-y-auto overscroll-y-contain px-3 pb-8">
        <div className="flex gap-1 overflow-x-auto">
          {VENUES.map((item) => (
            <button key={item.id} type="button" onClick={() => !busy && setVenue(item.id)} className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-bold ${venue === item.id ? "bg-[#FCD116] text-[#121212]" : "bg-black/30"}`}>
              {item.name}
            </button>
          ))}
        </div>
        <p className={`rounded-2xl px-3 py-2 text-sm font-bold ${clock.closed ? "bg-[#7a1f1f]" : "bg-black/35"}`}>
          Lost today {cedis(clock.lost)} of {cedis(clock.cap)}
          {clock.closed ? ` · Time until you can bet again: ${clockLabel(left || clock.left)}` : ` · This table takes up to ${cedis(room.max)}`}
        </p>
        <div className="relative overflow-hidden rounded-[28px] px-3 py-4 shadow-inner" style={{ background: `radial-gradient(circle at 50% 0%, rgba(255,255,255,.18), transparent 46%), ${felt}` }}>
          {room.dealer ? <p className="text-center text-xs font-semibold text-white/80">{room.dealer} is dealing</p> : <p className="text-center text-xs text-white/60">No dealer on the phone</p>}
          <div className="mt-3 flex min-h-28 items-center justify-center gap-3">
            {mode !== "dice" ? (
              <>
                <PlayingCard rank={bet?.rank ?? "A"} red={bet?.colour !== "black"} face={showFace && mode === "colour"} />
                {mode === "card" ? <PlayingCard rank={bet?.nextRank ?? bet?.rank ?? "K"} red={bet?.colour === "red"} face={showFace} /> : null}
              </>
            ) : (
              <>
                <Die n={phase === "result" && bet?.dice ? bet.dice[0] : faces[0]} rolling={phase === "hold" || phase === "flip"} />
                <Die n={phase === "result" && bet?.dice ? bet.dice[1] : faces[1]} rolling={phase === "hold" || phase === "flip"} />
              </>
            )}
          </div>
          {phase === "result" && bet?.kind === "dice" && bet.dice ? <p className="text-center text-sm font-bold">Total {bet.dice[0] + bet.dice[1]}</p> : null}
          <div className={`mt-2 flex justify-center gap-1 ${phase === "result" ? (bet?.win ? "chip-in" : "chip-out") : ""}`}>
            {stacks.length ? stacks.map((chip, index) => <Chip key={`${chip}-${index}`} value={chip} />) : <span className="text-xs text-white/60">Put a chip down</span>}
          </div>
          {phase === "result" && bet ? (
            <p className={`fly-cash mt-2 text-center text-3xl font-black ${bet.win ? "text-[#7dffb3]" : "text-[#ffd0d0]"}`}>
              {bet.tie ? "PUSH" : bet.win ? `WIN ${cedis(bet.payout)}` : "LOSE"}
              {bet.streak >= 3 ? ` · x${bet.streak}` : ""}
            </p>
          ) : phase === "hold" ? (
            <p className="mt-2 text-center text-sm font-semibold text-white/80">The table holds its breath.</p>
          ) : null}
          <p className="mt-2 text-center text-[11px] text-white/75">{crowd}</p>
          {phase === "result" && bet?.win ? (
            <button type="button" onClick={() => onApply(bragBet(life, `Just won ${cedis(bet.payout)} at ${room.name}.`))} className="mx-auto mt-2 block rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold">
              Post the win
            </button>
          ) : null}
          {phase === "result" && bet && !bet.win && !bet.tie ? (
            <button type="button" onClick={() => { setStake(Math.min(room.max, life.cash, clock.cap - clock.lost, bet.stake * 2)); setPhase("idle"); }} className="mx-auto mt-2 block rounded-full bg-[#7a1f1f] px-3 py-1 text-[11px] font-bold">
              Double or nothing
            </button>
          ) : null}
        </div>
        <p className="text-[11px] text-white/70">{FEED[feed]}</p>
        <div className="grid grid-cols-3 gap-2">
          {(["colour", "card", "dice"] as Mode[]).map((item) => (
            <button key={item} type="button" onClick={() => !busy && setMode(item)} className={`rounded-2xl py-2 text-xs font-bold ${mode === item ? "bg-[#FCD116] text-[#121212]" : "bg-black/30"}`}>
              {item === "colour" ? "Red or black" : item === "card" ? "Higher" : "Dice"}
            </button>
          ))}
        </div>
        {clock.closed ? null : mode === "colour" ? (
          <div className="grid grid-cols-2 gap-2">
            <button type="button" disabled={busy || stake < 5} onClick={() => playColour("red")} className="rounded-2xl bg-[#CE1126] py-4 text-base font-black disabled:opacity-40">Red</button>
            <button type="button" disabled={busy || stake < 5} onClick={() => playColour("black")} className="rounded-2xl bg-[#111] py-4 text-base font-black ring-1 ring-white/30 disabled:opacity-40">Black</button>
          </div>
        ) : mode === "card" ? (
          <div className="grid grid-cols-2 gap-2">
            <button type="button" disabled={busy || stake < 5} onClick={() => playCard("higher")} className="rounded-2xl bg-white py-4 text-base font-black text-[#121212] disabled:opacity-40">Higher</button>
            <button type="button" disabled={busy || stake < 5} onClick={() => playCard("lower")} className="rounded-2xl bg-black/40 py-4 text-base font-black disabled:opacity-40">Lower</button>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            <button type="button" disabled={busy || stake < 5} onClick={() => playDice("under")} className="rounded-2xl bg-[#006B3F] py-4 text-sm font-black disabled:opacity-40">Under 7</button>
            <button type="button" disabled={busy || stake < 5} onClick={() => playDice("seven")} className="rounded-2xl bg-[#f5c542] py-4 text-sm font-black text-[#121212] disabled:opacity-40">Exact 7</button>
            <button type="button" disabled={busy || stake < 5} onClick={() => playDice("over")} className="rounded-2xl bg-[#006B3F] py-4 text-sm font-black disabled:opacity-40">Over 7</button>
          </div>
        )}
        <div className="sticky bottom-0 flex flex-wrap items-center gap-2 rounded-2xl bg-black/55 p-2 backdrop-blur">
          <p className="w-full text-xs font-bold">Stake {cedis(stake)}</p>
          {CHIPS.map((value) => (
            <button key={value} type="button" onPointerDown={() => holdChip(value)} onPointerUp={release} onPointerLeave={release} className="grid h-12 w-12 place-items-center rounded-full text-[11px] font-black text-white shadow" style={{ background: CHIP_COLOR[value] }}>
              {value >= 1000 ? "1k" : value}
            </button>
          ))}
          <button type="button" onClick={() => setStake(0)} className="rounded-full bg-white/15 px-3 py-2 text-xs font-bold">Clear</button>
          <button type="button" onClick={allIn} className="rounded-full bg-[#FCD116] px-3 py-2 text-xs font-black text-[#121212]">All in</button>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={busy} onClick={() => onApply(stepAway(life))} className="rounded-full bg-white/10 px-3 py-2 text-[11px] font-bold disabled:opacity-40">Step away</button>
          <button type="button" disabled={busy} onClick={() => onApply(borrowTable(life))} className="rounded-full bg-white/10 px-3 py-2 text-[11px] font-bold disabled:opacity-40">Borrow ₵80</button>
        </div>
        <p className="text-[11px] leading-5 text-white/60">
          Urge {life.stats?.betUrge ?? 0}. Wins {life.stats?.betWins ?? 0}. Best streak {life.stats?.betBest ?? 0}. Biggest take {cedis(life.stats?.betBiggest ?? 0)}.
          {(life.stats?.betDebt ?? 0) > 0 ? ` Kojo is owed ${cedis(life.stats?.betDebt ?? 0)} on Saturday.` : ""}
        </p>
      </div>
    </div>
  );
}

function PlayingCard({ rank, red, face }: { rank: string; red: boolean; face: boolean }) {
  return (
    <div className="card-scene h-28 w-[4.5rem]">
      <div className={`card-inner ${face ? "flipped" : ""}`}>
        <div className="card-face card-back" />
        <div className={`card-face card-front text-2xl ${red ? "text-[#CE1126]" : "text-[#121212]"}`}>
          <span>{rank}</span>
          <span>{red ? "♥" : "♠"}</span>
        </div>
      </div>
    </div>
  );
}

function Die({ n, rolling }: { n: number; rolling: boolean }) {
  return (
    <div className={`grid h-16 w-16 place-items-center rounded-2xl bg-[#fffdf8] text-3xl font-black text-[#121212] shadow ${rolling ? "die-tumble" : ""}`}>
      {n}
    </div>
  );
}

function Chip({ value }: { value: number }) {
  return (
    <span className="grid h-8 w-8 place-items-center rounded-full text-[9px] font-black text-white ring-2 ring-white/70" style={{ background: CHIP_COLOR[value] }}>
      {value >= 1000 ? "1k" : value}
    </span>
  );
}

function stackOf(stake: number) {
  const out: number[] = [];
  let left = stake;
  for (const chip of [1000, 500, 100, 50, 10]) {
    while (left >= chip && out.length < 8) {
      out.push(chip);
      left -= chip;
    }
  }
  return out;
}

let audio: AudioContext | null = null;

function tone(freq: number, dur: number, type: OscillatorType, gain: number) {
  const Ctx = window.AudioContext;
  audio = audio ?? new Ctx();
  void audio.resume();
  const osc = audio.createOscillator();
  const amp = audio.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  amp.gain.value = gain;
  amp.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + dur);
  osc.connect(amp);
  amp.connect(audio.destination);
  osc.start();
  osc.stop(audio.currentTime + dur);
}

function clink() {
  tone(880, 0.08, "triangle", 0.03);
}

function tension(stake: number) {
  tone(220, 0.4, "sine", 0.02);
  if (stake >= 200) tone(90, 0.5, "sine", 0.03);
}

function finishSound(win: boolean) {
  if (win) {
    tone(523, 0.12, "triangle", 0.04);
    window.setTimeout(() => tone(659, 0.12, "triangle", 0.04), 90);
    window.setTimeout(() => tone(784, 0.2, "triangle", 0.04), 180);
  } else tone(110, 0.25, "sine", 0.04);
}
