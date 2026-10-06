"use client";

import { useEffect, useRef, useState } from "react";
import { CLUB_IDS } from "@/lib/game/accra-spots";

export type TuneId = "city" | "club" | "beach" | "radio";

const BEACHES = new Set(["beach", "bojo", "kokrobite"]);

export function tuneFor(where: string, station = false): TuneId {
  if (station || where === "joy" || where === "republic") return "radio";
  if (CLUB_IDS.has(where)) return "club";
  if (BEACHES.has(where)) return "beach";
  return "city";
}

type Tune = {
  label: string;
  bpm: number;
  gain: number;
  kick: number[];
  snare: number[];
  hat: number[];
  bass: [number, number][];
  lead: [number, number][];
  chord: [number, number[]][];
};

const TUNES: Record<TuneId, Tune> = {
  city: {
    label: "Highlife",
    bpm: 98,
    gain: 0.42,
    kick: [0, 8],
    snare: [4, 12],
    hat: [0, 2, 4, 6, 8, 10, 12, 14],
    bass: [
      [0, 48],
      [3, 48],
      [6, 55],
      [8, 52],
      [11, 50],
      [14, 48],
    ],
    lead: [
      [0, 67],
      [2, 64],
      [3, 72],
      [5, 67],
      [6, 64],
      [8, 69],
      [10, 67],
      [11, 72],
      [13, 67],
      [14, 64],
    ],
    chord: [
      [0, [60, 64, 67]],
      [8, [57, 62, 66]],
    ],
  },
  club: {
    label: "The club",
    bpm: 118,
    gain: 0.56,
    kick: [0, 2, 4, 6, 8, 10, 12, 14],
    snare: [4, 12],
    hat: [1, 3, 5, 7, 9, 11, 13, 15],
    bass: [
      [0, 33],
      [2, 33],
      [4, 33],
      [7, 36],
      [8, 33],
      [10, 33],
      [12, 31],
      [14, 33],
    ],
    lead: [
      [0, 69],
      [3, 72],
      [6, 76],
      [8, 74],
      [11, 72],
      [14, 69],
    ],
    chord: [
      [0, [57, 60, 64]],
      [8, [53, 57, 60]],
    ],
  },
  beach: {
    label: "The shore",
    bpm: 86,
    gain: 0.4,
    kick: [0, 6, 8, 14],
    snare: [4, 12],
    hat: [0, 2, 4, 6, 8, 10, 12, 14],
    bass: [
      [0, 43],
      [6, 43],
      [8, 41],
      [14, 43],
    ],
    lead: [
      [0, 79],
      [5, 76],
      [8, 74],
      [13, 79],
    ],
    chord: [
      [0, [55, 59, 62]],
      [8, [53, 57, 60]],
    ],
  },
  radio: {
    label: "Joy FM",
    bpm: 104,
    gain: 0.5,
    kick: [0, 6, 8, 14],
    snare: [4, 12],
    hat: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
    bass: [
      [0, 43],
      [2, 43],
      [4, 50],
      [6, 48],
      [8, 46],
      [10, 48],
      [12, 43],
      [14, 41],
    ],
    lead: [
      [0, 67],
      [1, 71],
      [3, 74],
      [5, 72],
      [6, 67],
      [8, 69],
      [10, 72],
      [11, 74],
      [13, 71],
      [14, 67],
    ],
    chord: [
      [0, [55, 59, 62]],
      [8, [53, 58, 62]],
    ],
  },
};

type Engine = {
  ctx: AudioContext;
  master: GainNode;
  noise: AudioBuffer;
  next: number;
  step: number;
  timer: number;
  live: boolean;
};

let currentTune: TuneId = "city";

export function Soundtrack({ tune }: { tune: TuneId }) {
  const engine = useRef<Engine | null>(null);
  const wantRef = useRef(true);
  const [playing, setPlaying] = useState(false);
  currentTune = tune;

  function ensure() {
    if (engine.current) return engine.current;
    const ctx = new AudioContext();
    const master = ctx.createGain();
    master.gain.value = 0.0001;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16;
    comp.knee.value = 8;
    comp.ratio.value = 3;
    comp.attack.value = 0.01;
    comp.release.value = 0.2;
    master.connect(comp);
    comp.connect(ctx.destination);
    const noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
    const made: Engine = { ctx, master, noise, next: ctx.currentTime + 0.08, step: 0, timer: 0, live: true };
    made.timer = window.setInterval(() => pump(made), 50);
    engine.current = made;
    return made;
  }

  async function start() {
    const made = ensure();
    if (made.ctx.state === "suspended") await made.ctx.resume();
    wantRef.current = true;
    made.live = true;
    if (made.next < made.ctx.currentTime) made.next = made.ctx.currentTime + 0.05;
    setPlaying(true);
    try {
      localStorage.setItem("accralife-music", "1");
    } catch {
      /* ignore */
    }
  }

  function stop() {
    wantRef.current = false;
    setPlaying(false);
    const made = engine.current;
    if (made) made.live = false;
    if (made) {
      made.master.gain.cancelScheduledValues(made.ctx.currentTime);
      made.master.gain.setTargetAtTime(0.0001, made.ctx.currentTime, 0.05);
      void made.ctx.suspend();
    }
    try {
      localStorage.setItem("accralife-music", "0");
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    try {
      wantRef.current = localStorage.getItem("accralife-music") !== "0";
    } catch {
      wantRef.current = true;
    }
    const wake = () => {
      if (wantRef.current) void start();
    };
    window.addEventListener("pointerdown", wake);
    return () => {
      window.removeEventListener("pointerdown", wake);
      const made = engine.current;
      if (!made) return;
      window.clearInterval(made.timer);
      void made.ctx.close();
      engine.current = null;
    };
  }, []);

  const song = TUNES[tune];
  return (
    <button
      type="button"
      data-music={playing ? tune : "off"}
      aria-pressed={playing}
      aria-label={playing ? `Pause ${song.label}` : `Play ${song.label}`}
      onClick={() => (playing ? stop() : void start())}
      className={`absolute right-3 top-[max(7.25rem,calc(env(safe-area-inset-top)+6.4rem))] z-30 flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold shadow-lg ${playing ? "bg-[#16203c] text-white" : "bg-white text-[#16203c]"}`}
    >
      <span aria-hidden>{playing ? "♫" : "♪"}</span>
      <span>{playing ? song.label : "Play music"}</span>
    </button>
  );
}

function pump(engine: Engine) {
  if (!engine.live) return;
  if (engine.next < engine.ctx.currentTime) engine.next = engine.ctx.currentTime + 0.05;
  const tune = TUNES[currentTune];
  const horizon = engine.ctx.currentTime + 0.18;
  const eighth = 60 / tune.bpm / 2;
  engine.master.gain.setTargetAtTime(tune.gain, engine.ctx.currentTime, 0.08);
  while (engine.next < horizon) {
    const step = engine.step % 16;
    const time = engine.next;
    if (tune.kick.includes(step)) kick(engine, time, currentTune === "beach" ? 0.45 : 0.7);
    if (tune.snare.includes(step)) snare(engine, time, currentTune === "club" ? 0.28 : 0.16);
    if (tune.hat.includes(step)) hat(engine, time, currentTune === "club" ? 0.07 : 0.035);
    for (const [at, note] of tune.bass) if (at === step) blip(engine, time, midi(note), 0.32, currentTune === "club" ? "sawtooth" : "triangle", currentTune === "club" ? 0.1 : 0.08, currentTune === "club" ? 240 : 420);
    for (const [at, note] of tune.lead) if (at === step) blip(engine, time, midi(note), 0.2, "triangle", 0.07, 2200);
    for (const [at, notes] of tune.chord) if (at === step) notes.forEach((note) => blip(engine, time, midi(note), 0.7, "triangle", 0.035, 900));
    engine.next += eighth;
    engine.step += 1;
  }
}

function midi(note: number) {
  return 440 * 2 ** ((note - 69) / 12);
}

function blip(engine: Engine, time: number, freq: number, dur: number, type: OscillatorType, gain: number, cutoff: number) {
  const osc = engine.ctx.createOscillator();
  const filter = engine.ctx.createBiquadFilter();
  const amp = engine.ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, time);
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(cutoff, time);
  amp.gain.setValueAtTime(0.0001, time);
  amp.gain.exponentialRampToValueAtTime(gain, time + 0.02);
  amp.gain.exponentialRampToValueAtTime(0.0001, time + dur);
  osc.connect(filter);
  filter.connect(amp);
  amp.connect(engine.master);
  osc.start(time);
  osc.stop(time + dur + 0.05);
}

function kick(engine: Engine, time: number, gain: number) {
  const osc = engine.ctx.createOscillator();
  const amp = engine.ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(140, time);
  osc.frequency.exponentialRampToValueAtTime(46, time + 0.12);
  amp.gain.setValueAtTime(gain, time);
  amp.gain.exponentialRampToValueAtTime(0.0001, time + 0.22);
  osc.connect(amp);
  amp.connect(engine.master);
  osc.start(time);
  osc.stop(time + 0.24);
}

function snare(engine: Engine, time: number, gain: number) {
  const src = engine.ctx.createBufferSource();
  const filter = engine.ctx.createBiquadFilter();
  const amp = engine.ctx.createGain();
  src.buffer = engine.noise;
  filter.type = "highpass";
  filter.frequency.value = 1400;
  amp.gain.setValueAtTime(gain, time);
  amp.gain.exponentialRampToValueAtTime(0.0001, time + 0.16);
  src.connect(filter);
  filter.connect(amp);
  amp.connect(engine.master);
  src.start(time);
  src.stop(time + 0.18);
}

function hat(engine: Engine, time: number, gain: number) {
  const src = engine.ctx.createBufferSource();
  const filter = engine.ctx.createBiquadFilter();
  const amp = engine.ctx.createGain();
  src.buffer = engine.noise;
  filter.type = "highpass";
  filter.frequency.value = 7000;
  amp.gain.setValueAtTime(gain, time);
  amp.gain.exponentialRampToValueAtTime(0.0001, time + 0.05);
  src.connect(filter);
  filter.connect(amp);
  amp.connect(engine.master);
  src.start(time);
  src.stop(time + 0.06);
}
