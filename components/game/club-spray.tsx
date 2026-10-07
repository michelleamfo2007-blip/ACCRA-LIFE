"use client";

import { useEffect, useRef, useState } from "react";
import {
  SPRAYS,
  buildNotes,
  hypeLine,
  spraysLeft,
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

/** Face colours people recognise on Ghana notes. Original drawing, not a copied bank design. */
const FACES: { min: number; paper: string; ink: string }[] = [
  { min: 100, paper: "#0e6a66", ink: "#f6f1e4" },
  { min: 50, paper: "#8a4518", ink: "#f8f1e6" },
  { min: 20, paper: "#1a4c8c", ink: "#f4f7fb" },
  { min: 10, paper: "#5a3488", ink: "#f7f3fb" },
  { min: 5, paper: "#146b45", ink: "#f3faf6" },
  { min: 0, paper: "#a61f2b", ink: "#fff6f4" },
];

function faceOf(value: number, gold: boolean) {
  if (gold) return { paper: "#d7b15a", ink: "#2c220c" };
  return FACES.find((face) => value >= face.min) ?? FACES[FACES.length - 1];
}

function serialOf(id: string) {
  let n = 0;
  for (let i = 0; i < id.length; i += 1) n = (n * 33 + id.charCodeAt(i)) >>> 0;
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  return `${letters[n % 24]}${letters[(n >> 5) % 24]} ${100000 + (n % 900000)}`;
}

function CediNote({ value, gold, serial }: { value: number; gold: boolean; serial: string }) {
  const face = faceOf(value, gold);
  const label = String(value);
  const gid = serial.replace(/\s/g, "");
  return (
    <svg
      viewBox="0 0 168 74"
      className="block h-[1.35rem] w-[3.05rem] drop-shadow-[0_2px_3px_rgba(0,0,0,0.45)]"
      aria-hidden="true"
    >
      <defs>
        <pattern id={`grain-${gid}`} width="4" height="4" patternUnits="userSpaceOnUse">
          <path d="M0 4 L4 0" stroke={face.ink} strokeOpacity="0.13" strokeWidth="0.4" />
        </pattern>
      </defs>
      <rect width="168" height="74" rx="4" fill={face.paper} />
      <rect width="168" height="74" rx="4" fill={`url(#grain-${gid})`} />
      <rect x="3" y="3" width="162" height="68" rx="2" fill="none" stroke={face.ink} strokeOpacity="0.55" strokeWidth="1.2" />
      <rect x="6" y="6" width="156" height="62" rx="1.5" fill="none" stroke={face.ink} strokeOpacity="0.28" strokeWidth="0.6" />
      <rect x="0" y="0" width="5" height="74" fill="#CE1126" />
      <rect x="0" y="24" width="5" height="26" fill="#FCD116" />
      <rect x="0" y="50" width="5" height="24" fill="#006B3F" />
      <text x="14" y="16" fill={face.ink} fontSize="7" fontFamily="ui-sans-serif, system-ui" fontWeight="700" letterSpacing="1.6">
        GHANA
      </text>
      <text x="14" y="46" fill={face.ink} fontSize={label.length > 2 ? 22 : 28} fontFamily="ui-serif, Georgia, serif" fontWeight="700">
        {label}
      </text>
      <text x="14" y="58" fill={face.ink} fontSize="6" fontFamily="ui-sans-serif, system-ui" letterSpacing="1.4" opacity="0.85">
        CEDIS
      </text>
      <text x="14" y="67" fill={face.ink} fontSize="5.5" fontFamily="ui-monospace, monospace" opacity="0.7">
        {serial}
      </text>
      <circle cx="128" cy="37" r="18" fill="none" stroke={face.ink} strokeOpacity="0.45" />
      <circle cx="128" cy="37" r="14" fill={face.ink} fillOpacity="0.12" stroke={face.ink} strokeOpacity="0.7" />
      <text x="128" y="42" textAnchor="middle" fill={face.ink} fontSize="16">
        ★
      </text>
      <text x="154" y="18" textAnchor="end" fill={face.ink} fontSize="11" fontFamily="ui-serif, Georgia, serif" fontWeight="700">
        {label}
      </text>
      <text x="154" y="64" textAnchor="end" fill={face.ink} fontSize="8" fontFamily="ui-serif, Georgia, serif" opacity="0.8">
        {label}
      </text>
    </svg>
  );
}

const RICHER = ["Kwame", "Akosua", "Kojo", "Esi", "Nana"];

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
  life,
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
  const [pops, setPops] = useState<Pop[]>([]);
  const [line, setLine] = useState("Chale, who dey spray tonight?");
  const [banner, setBanner] = useState("");
  const [moment, setMoment] = useState(false);
  const [shake, setShake] = useState(false);
  const lastTap = useRef(0);
  const combo = useRef({ n: 0, at: 0 });
  const taken = useRef(new Set<string>());
  const hypeRef = useRef(hype);
  const momentRef = useRef(false);
  hypeRef.current = hype;
  momentRef.current = moment;
  const left = spraysLeft(life);

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
    const kick = window.setTimeout(() => {
      rain(pick(RICHER), 80, false, false);
    }, 2200);
    const id = window.setInterval(() => {
      if (document.hidden) return;
      if (Math.random() > 0.7) return;
      const who = pick(RICHER);
      const cost = hypeRef.current > 70 ? 200 : 80;
      rain(who, cost, false, momentRef.current);
    }, 14000);
    return () => {
      window.clearTimeout(kick);
      window.clearInterval(id);
    };
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      setNotes((list) => list.filter((note) => Date.now() - note.born < note.ms));
    }, 400);
    return () => window.clearInterval(id);
  }, []);

  function rain(who: string, cost: number, mine: boolean, gold: boolean) {
    const born = Date.now();
    const bag = buildNotes(cost, gold);
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
          0% { top: 24%; transform: rotate(var(--tilt)); opacity: 1; }
          40% { top: 32%; transform: rotate(calc(var(--tilt) * -0.55)); opacity: 1; }
          75% { top: 46%; transform: rotate(calc(var(--tilt) * 0.35)); opacity: 1; }
          100% { top: 72%; transform: rotate(calc(var(--tilt) * -0.2)); opacity: 0.05; }
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
          .club-note-fall { animation: none !important; top: 42% !important; }
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
          <CediNote value={note.value} gold={note.gold} serial={serialOf(note.id)} />
        </button>
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
            disabled={left <= 0 || life.cash < pack.cost}
            onClick={() => spray(pack.id)}
            className="rounded-full bg-[#121212] px-2.5 py-1.5 text-[10px] font-bold text-white shadow disabled:opacity-40"
          >
            {pack.label} · {cedis(pack.cost)}
          </button>
        ))}
      </div>
    </div>
  );
}
