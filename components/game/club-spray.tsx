"use client";

import { useEffect, useRef, useState } from "react";
import {
  SPRAYS,
  buildNotes,
  hypeLine,
  type SprayId,
} from "@/lib/game/club-spray";
import { cedis, type Life, type StepResult } from "@/lib/game/world";

type Note = {
  id: string;
  value: number;
  x: number;
  gold: boolean;
  mine: boolean;
  ms: number;
  born: number;
  tilt: number;
  drift: number;
};
type Pop = { id: string; text: string; x: number };
type Bit = { id: string; emoji: string; x: number; ms: number; born: number };

const FUN = ["✨", "🍾", "👑", "🎉", "🎶", "⭐", "💃", "🔥", "🥂", "💫"];

function CediNote({ gold }: { gold: boolean }) {
  return (
    <span className="relative block h-3.5 w-5" aria-hidden>
      <span className={`absolute left-0.5 top-0.5 h-2.5 w-4 -rotate-6 rounded-[2px] ${gold ? "bg-[#c9a227]" : "bg-[#147a3d]"}`} />
      <span className={`absolute left-0 top-0 grid h-3 w-[1.15rem] place-items-center rounded-[2px] text-[8px] font-black leading-none shadow-sm ${gold ? "bg-[#FCD116] text-[#3a2a08]" : "bg-[#3dce6e] text-[#083018]"}`}>
        ₵
      </span>
    </span>
  );
}

function pick<T>(list: T[]) {
  return list[Math.floor(Math.random() * list.length)];
}

function tone(freq: number, dur = 0.12, gain = 0.06) {
  const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return;
  const ctx = tone.ctx ?? new Ctx();
  tone.ctx = ctx;
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  osc.type = "triangle";
  osc.frequency.value = freq;
  osc.connect(amp);
  amp.connect(ctx.destination);
  const now = ctx.currentTime;
  amp.gain.setValueAtTime(gain, now);
  amp.gain.exponentialRampToValueAtTime(0.001, now + dur);
  osc.start(now);
  osc.stop(now + dur);
}
tone.ctx = null as AudioContext | null;

export function ClubSpray({
  name,
  onPurse,
  lifted = false,
}: {
  life: Life;
  name: string;
  onPurse: (action: { kind: "spray"; id: SprayId } | { kind: "catch"; value: number }) => StepResult;
  lifted?: boolean;
}) {
  const [hype, setHype] = useState(18);
  const [notes, setNotes] = useState<Note[]>([]);
  const [bits, setBits] = useState<Bit[]>([]);
  const [pops, setPops] = useState<Pop[]>([]);
  const [line, setLine] = useState("Chale, who dey spray tonight?");
  const [banner, setBanner] = useState("");
  const [moment, setMoment] = useState(false);
  const [shake, setShake] = useState(false);
  const lastTap = useRef(0);
  const combo = useRef({ n: 0, at: 0 });
  const taken = useRef(new Set<string>());
  const momentRef = useRef(false);
  momentRef.current = moment;
  useEffect(() => {
    const id = window.setInterval(() => {
      setHype((value) => Math.max(0, value - (momentRef.current ? 0.4 : 1.4)));
    }, 500);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (hype >= 100 && !moment) {
      setMoment(true);
      setLine(pick(hypeLine("max")));
      tone(220, 0.2, 0.05);
      window.setTimeout(() => tone(440, 0.25, 0.06), 180);
      const timer = window.setTimeout(() => setMoment(false), 8000);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [hype, moment]);

  useEffect(() => {
    const id = window.setInterval(() => {
      if (document.hidden) return;
      const born = Date.now();
      const bit: Bit = {
        id: `fun-${born}`,
        emoji: pick(FUN),
        x: 8 + Math.random() * 84,
        ms: 6400 + Math.floor(Math.random() * 2800),
        born,
      };
      setBits((list) => [...list, bit].slice(-14));
    }, 700);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      const now = Date.now();
      setNotes((list) => list.filter((note) => now - note.born < note.ms));
      setBits((list) => list.filter((bit) => now - bit.born < bit.ms));
    }, 400);
    return () => window.clearInterval(id);
  }, []);

  function rain(who: string, cost: number, mine: boolean, gold: boolean) {
    const born = Date.now();
    const bag = buildNotes(cost, gold).slice(0, gold ? 10 : 7);
    const next = bag.map((value, index) => ({
      id: `${born}-${index}-${value}`,
      value: gold ? Math.round(value * 1.5) : value,
      x: 8 + ((index * 37) % 78),
      gold: gold || value >= 100,
      mine,
      ms: 6400 + (index % 5) * 480,
      born,
      tilt: (index % 2 === 0 ? -1 : 1) * (10 + (index % 4) * 6),
      drift: (index % 3 - 1) * 22,
    }));
    setNotes((list) => [...list, ...next].slice(-36));
    setLine(pick(hypeLine("spray", who, cost)));
    setBanner(`${who} sprayed ${cedis(cost)}!`);
    setHype((value) => Math.min(100, value + (mine ? 22 : 10)));
    setShake(cost >= 250);
    window.setTimeout(() => setShake(false), 500);
    window.setTimeout(() => setBanner(""), 2800);
    tone(mine ? 180 : 240, 0.18, 0.05);
  }

  function spray(id: SprayId) {
    const result = onPurse({ kind: "spray", id });
    if (result.error) {
      setLine(result.error);
      return;
    }
    const pack = SPRAYS.find((item) => item.id === id)!;
    rain(name, pack.cost, true, id === "rain" || moment);
  }

  function tap(note: Note) {
    const now = Date.now();
    if (taken.current.has(note.id) || now - lastTap.current < 90) return;
    lastTap.current = now;
    taken.current.add(note.id);
    setNotes((list) => list.filter((item) => item.id !== note.id));
    if (note.mine) {
      setLine("The crowd caught that one. Your spray is for them.");
      setHype((value) => Math.min(100, value + 2));
      tone(180, 0.08, 0.04);
      return;
    }
    const chain = now - combo.current.at < 1600;
    combo.current = { n: chain ? combo.current.n + 1 : 1, at: now };
    let value = note.value;
    let label = `+${cedis(value)}`;
    if (combo.current.n > 0 && combo.current.n % 5 === 0) {
      value += 5;
      label = `COMBO +${cedis(value)}`;
      setLine(pick(hypeLine("combo")));
      tone(990, 0.16, 0.07);
    } else {
      setLine(pick(hypeLine("tap")));
      tone(640 + Math.min(note.value, 400), 0.08, 0.05);
    }
    const result = onPurse({ kind: "catch", value });
    if (result.error) {
      setLine(pick(hypeLine("miss")));
      return;
    }
    setHype((valueNow) => Math.min(100, valueNow + 5));
    const pop = { id: note.id, text: label, x: note.x };
    setPops((list) => [...list, pop].slice(-8));
    window.setTimeout(() => setPops((list) => list.filter((item) => item.id !== pop.id)), 900);
  }

  return (
    <div className={`pointer-events-none absolute inset-0 z-[60] ${shake ? "club-shake" : ""}`}>
      <style>{`
        @keyframes club-note {
          0% { top: 28%; transform: translateX(0) rotate(var(--tilt)); opacity: 0; }
          12% { opacity: 1; }
          100% { top: 78%; transform: translateX(var(--drift)) rotate(calc(var(--tilt) * -0.4)); opacity: 0.15; }
        }
        @keyframes club-bit {
          0% { top: 22%; transform: translateX(0) scale(0.85); opacity: 0; }
          15% { opacity: 0.95; }
          100% { top: 70%; transform: translateX(18px) scale(1); opacity: 0; }
        }
        @keyframes club-pop {
          0% { transform: translateY(0); opacity: 1; }
          100% { transform: translateY(-28px); opacity: 0; }
        }
        .club-shake { animation: club-shake 0.45s linear; }
        @keyframes club-shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-3px); }
          75% { transform: translateX(3px); }
        }
        @media (prefers-reduced-motion: reduce) {
          .club-note-fall, .club-bit { animation: none !important; top: 42% !important; }
          .club-shake { animation: none !important; }
        }
      `}</style>
      <div className="absolute left-2 right-16 top-[max(4.35rem,calc(env(safe-area-inset-top)+3.7rem))]">
        <p className="truncate rounded-full bg-[#121212]/88 px-3 py-1.5 text-[11px] font-semibold text-white shadow">
          <span className="text-[#FCD116]">{moment ? "Hype moment · " : "Yoofi · "}</span>
          {banner || line}
        </p>
        <div className="mt-1 h-1 overflow-hidden rounded-full bg-white/20">
          <div className="h-full rounded-full bg-[#FCD116]" style={{ width: `${hype}%` }} />
        </div>
      </div>
      {notes.map((note) => (
        <button
          key={note.id}
          type="button"
          aria-label={`Catch ${cedis(note.value)} note`}
          className="club-note-fall pointer-events-auto absolute top-0 border-0 bg-transparent p-1"
          style={{
            left: `${note.x}%`,
            animation: `club-note ${note.ms}ms linear forwards`,
            ["--tilt" as string]: `${note.tilt}deg`,
            ["--drift" as string]: `${note.drift}px`,
          }}
          onClick={(event) => {
            event.stopPropagation();
            tap(note);
          }}
        >
          <CediNote gold={note.gold} />
        </button>
      ))}
      {bits.map((bit) => (
        <span
          key={bit.id}
          className="club-bit pointer-events-none absolute text-sm leading-none"
          style={{ left: `${bit.x}%`, animation: `club-bit ${bit.ms}ms linear forwards` }}
          aria-hidden
        >
          {bit.emoji}
        </span>
      ))}
      {pops.map((pop) => (
        <span
          key={pop.id}
          className="absolute text-sm font-black text-[#FCD116]"
          style={{ left: `${pop.x}%`, top: "46%", animation: "club-pop 0.9s ease-out forwards" }}
        >
          {pop.text}
        </span>
      ))}
      <div className={`pointer-events-auto absolute right-2 z-[70] flex flex-col items-end gap-1 ${lifted ? "bottom-[min(54vh,30rem)]" : "bottom-[max(11.5rem,calc(env(safe-area-inset-bottom)+10.6rem))]"}`}>
        {SPRAYS.map((pack) => (
          <button
            key={pack.id}
            type="button"
            onClick={() => spray(pack.id)}
            className="rounded-full bg-[#121212] px-2.5 py-1.5 text-[10px] font-bold text-white shadow"
          >
            {pack.label} · {cedis(pack.cost)}
          </button>
        ))}
      </div>
    </div>
  );
}
