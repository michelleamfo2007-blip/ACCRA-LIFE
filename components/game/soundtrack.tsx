"use client";

import { useEffect, useRef, useState } from "react";
import { CLUB_IDS, EATERY_IDS } from "@/lib/game/accra-spots";
import { isNightlife } from "@/lib/game/club-night";

export type TuneId = "city" | "club" | "eatery" | "beach" | "radio";

const BEACHES = new Set(["beach", "bojo", "kokrobite"]);

/** Real Amapiano beds (CC BY FreeVibeVault) — clubs hot, restaurants calm lively. */
const PLAYLISTS: Partial<Record<TuneId, { src: string; title: string }[]>> = {
  club: [
    { src: "/music/club-01.mp3", title: "Taxi Rank Circuit" },
    { src: "/music/club-02.mp3", title: "Pool Deck Transit" },
    { src: "/music/club-03.mp3", title: "Acacia Run" },
    { src: "/music/club-04.mp3", title: "Tide Circuit" },
    { src: "/music/club-05.mp3", title: "Balcony Circuit" },
    { src: "/music/club-06.mp3", title: "Pierline Rendezvous" },
  ],
  eatery: [
    { src: "/music/eatery-01.mp3", title: "Marina Sequence" },
    { src: "/music/eatery-02.mp3", title: "Harbor Streak" },
    { src: "/music/eatery-03.mp3", title: "Terrace Afterglow" },
    { src: "/music/eatery-04.mp3", title: "Lantern After Rain" },
    { src: "/music/eatery-05.mp3", title: "Courtyard Mosaic" },
    { src: "/music/eatery-06.mp3", title: "Veranda Ledger" },
  ],
};

const FILE_GAIN: Partial<Record<TuneId, number>> = {
  club: 0.72,
  eatery: 0.46,
};

export function tuneFor(where: string, station = false): TuneId {
  if (station || where === "joy") return "radio";
  if (isNightlife(where, CLUB_IDS) || where === "republic") return "club";
  if (EATERY_IDS.has(where)) return "eatery";
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
  openHat?: number[];
  clap?: number[];
  perc?: number[];
  bass: [number, number][];
  log?: [number, number][];
  lead: [number, number][];
  chord: [number, number[]][];
  heat?: boolean;
};

const TUNES: Record<TuneId, Tune> = {
  city: {
    label: "Highlife",
    bpm: 102,
    gain: 0.48,
    kick: [0, 7, 8, 14],
    snare: [4, 12],
    hat: [0, 2, 3, 4, 6, 8, 10, 11, 12, 14],
    openHat: [6, 14],
    clap: [4, 12],
    bass: [
      [0, 45],
      [3, 45],
      [6, 52],
      [8, 50],
      [11, 48],
      [13, 45],
    ],
    lead: [
      [0, 69],
      [2, 72],
      [3, 76],
      [5, 74],
      [6, 69],
      [8, 71],
      [10, 74],
      [11, 76],
      [13, 72],
      [14, 69],
    ],
    chord: [
      [0, [57, 61, 64]],
      [8, [55, 59, 62]],
    ],
  },
  club: {
    label: "Amapiano heat",
    bpm: 114,
    gain: 0.68,
    heat: true,
    // Four-on-floor + Accra bounce
    kick: [0, 4, 8, 12, 2, 10],
    snare: [4, 12],
    clap: [4, 12, 13],
    hat: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
    openHat: [6, 14, 15],
    perc: [3, 7, 11, 15],
    // Sub + mid bass groove
    bass: [
      [0, 33],
      [1, 33],
      [4, 33],
      [5, 36],
      [8, 31],
      [9, 33],
      [12, 29],
      [13, 33],
    ],
    // Log-drum / piano bounce
    log: [
      [0, 57],
      [2, 60],
      [3, 64],
      [6, 60],
      [8, 55],
      [10, 57],
      [11, 62],
      [14, 60],
    ],
    lead: [
      [0, 72],
      [4, 76],
      [7, 79],
      [8, 76],
      [12, 74],
      [15, 72],
    ],
    chord: [
      [0, [45, 52, 57, 60]],
      [4, [45, 52, 57, 60]],
      [8, [43, 50, 55, 58]],
      [12, [41, 48, 53, 57]],
    ],
  },
  eatery: {
    label: "Table groove",
    bpm: 104,
    gain: 0.42,
    kick: [0, 7, 8, 14],
    snare: [4, 12],
    hat: [0, 2, 4, 6, 8, 10, 12, 14],
    openHat: [6, 14],
    clap: [4, 12],
    bass: [
      [0, 45],
      [4, 45],
      [8, 43],
      [12, 41],
    ],
    log: [
      [0, 57],
      [3, 60],
      [8, 55],
      [11, 57],
    ],
    lead: [
      [0, 69],
      [4, 72],
      [8, 71],
      [12, 69],
    ],
    chord: [
      [0, [57, 60, 64]],
      [8, [55, 59, 62]],
    ],
  },
  beach: {
    label: "Shore breeze",
    bpm: 90,
    gain: 0.44,
    kick: [0, 6, 8, 14],
    snare: [4, 12],
    hat: [0, 2, 4, 6, 8, 10, 12, 14],
    openHat: [6, 14],
    clap: [4, 12],
    bass: [
      [0, 43],
      [6, 43],
      [8, 41],
      [14, 43],
    ],
    lead: [
      [0, 79],
      [4, 76],
      [8, 74],
      [12, 79],
      [14, 81],
    ],
    chord: [
      [0, [55, 59, 62]],
      [8, [53, 57, 60]],
    ],
  },
  radio: {
    label: "Joy FM",
    bpm: 106,
    gain: 0.52,
    kick: [0, 6, 8, 14],
    snare: [4, 12],
    hat: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
    openHat: [7, 15],
    clap: [4, 12],
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
  bus: GainNode;
  noise: AudioBuffer;
  next: number;
  step: number;
  timer: number;
  live: boolean;
  bar: number;
};

let currentTune: TuneId = "city";

export function Soundtrack({ tune }: { tune: TuneId }) {
  const engine = useRef<Engine | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const trackRef = useRef(0);
  const wantRef = useRef(true);
  const tuneRef = useRef(tune);
  const [playing, setPlaying] = useState(false);
  const [trackTitle, setTrackTitle] = useState<string | null>(null);
  currentTune = tune;
  tuneRef.current = tune;

  function ensureSynth() {
    if (engine.current) return engine.current;
    const ctx = new AudioContext();
    const bus = ctx.createGain();
    bus.gain.value = 1;
    const master = ctx.createGain();
    master.gain.value = 0.0001;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18;
    comp.knee.value = 12;
    comp.ratio.value = 4.5;
    comp.attack.value = 0.005;
    comp.release.value = 0.18;
    const shelf = ctx.createBiquadFilter();
    shelf.type = "lowshelf";
    shelf.frequency.value = 120;
    shelf.gain.value = 3.5;
    const air = ctx.createBiquadFilter();
    air.type = "highshelf";
    air.frequency.value = 6000;
    air.gain.value = 2.2;
    bus.connect(shelf);
    shelf.connect(air);
    air.connect(comp);
    comp.connect(master);
    master.connect(ctx.destination);
    const noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
    const made: Engine = { ctx, master, bus, noise, next: ctx.currentTime + 0.08, step: 0, timer: 0, live: true, bar: 0 };
    made.timer = window.setInterval(() => pump(made), 40);
    engine.current = made;
    return made;
  }

  function hushSynth() {
    const made = engine.current;
    if (!made) return;
    made.live = false;
    made.master.gain.cancelScheduledValues(made.ctx.currentTime);
    made.master.gain.setTargetAtTime(0.0001, made.ctx.currentTime, 0.04);
    void made.ctx.suspend();
  }

  function ensureAudio() {
    if (audioRef.current) return audioRef.current;
    const el = new Audio();
    el.preload = "auto";
    el.loop = false;
    el.addEventListener("ended", () => {
      if (!wantRef.current) return;
      trackRef.current += 1;
      void playFile(tuneRef.current);
    });
    audioRef.current = el;
    return el;
  }

  async function playFile(id: TuneId) {
    const list = PLAYLISTS[id];
    if (!list?.length) return false;
    hushSynth();
    const el = ensureAudio();
    const track = list[trackRef.current % list.length];
    el.volume = FILE_GAIN[id] ?? 0.55;
    if (el.src !== new URL(track.src, window.location.origin).href) {
      el.src = track.src;
    }
    setTrackTitle(track.title);
    try {
      await el.play();
      return true;
    } catch {
      return false;
    }
  }

  async function startSynth() {
    const made = ensureSynth();
    if (made.ctx.state === "suspended") await made.ctx.resume();
    made.live = true;
    if (made.next < made.ctx.currentTime) made.next = made.ctx.currentTime + 0.05;
    const el = audioRef.current;
    if (el) {
      el.pause();
      el.removeAttribute("src");
    }
    setTrackTitle(null);
  }

  async function start() {
    wantRef.current = true;
    setPlaying(true);
    try {
      localStorage.setItem("accralife-music", "1");
    } catch {
      /* ignore */
    }
    const list = PLAYLISTS[tuneRef.current];
    if (list?.length) {
      const ok = await playFile(tuneRef.current);
      if (!ok) await startSynth();
      return;
    }
    await startSynth();
  }

  function stop() {
    wantRef.current = false;
    setPlaying(false);
    setTrackTitle(null);
    hushSynth();
    const el = audioRef.current;
    if (el) {
      el.pause();
      el.currentTime = 0;
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
      if (made) {
        window.clearInterval(made.timer);
        void made.ctx.close();
        engine.current = null;
      }
      const el = audioRef.current;
      if (el) {
        el.pause();
        el.removeAttribute("src");
        audioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!playing || !wantRef.current) return;
    trackRef.current = 0;
    void start();
  }, [tune]);

  const song = TUNES[tune];
  const hot = playing && tune === "club";
  const soft = playing && tune === "eatery";
  const label = playing ? trackTitle ?? song.label : "Play music";
  return (
    <button
      type="button"
      data-music={playing ? tune : "off"}
      aria-pressed={playing}
      aria-label={playing ? `Pause ${label}` : `Play ${song.label}`}
      onClick={() => (playing ? stop() : void start())}
      className={`absolute right-2 top-[max(7.5rem,calc(env(safe-area-inset-top)+6.6rem))] z-30 flex max-w-[12rem] items-center gap-1.5 truncate rounded-full px-2.5 py-1.5 text-xs font-semibold shadow-lg sm:right-3 sm:max-w-[16rem] sm:px-3 sm:py-2 sm:text-sm ${
        hot
          ? "bg-[#CE1126] text-white shadow-[0_0_18px_rgba(206,17,38,.45)]"
          : soft
            ? "bg-[#1a3a2a] text-[#d8f0e2]"
            : playing
              ? "bg-[#121212] text-white"
              : "bg-white text-[#121212]"
      }`}
    >
      <span aria-hidden>{playing ? (hot ? "🔥" : "♫") : "♪"}</span>
      <span className="truncate">{label}</span>
    </button>
  );
}

function pump(engine: Engine) {
  if (!engine.live) return;
  if (engine.next < engine.ctx.currentTime) engine.next = engine.ctx.currentTime + 0.05;
  const tune = TUNES[currentTune];
  const horizon = engine.ctx.currentTime + 0.22;
  const eighth = 60 / tune.bpm / 2;
  const heatBump = tune.heat && engine.bar % 4 === 3 ? 1.12 : 1;
  engine.master.gain.setTargetAtTime(tune.gain * heatBump, engine.ctx.currentTime, 0.06);
  while (engine.next < horizon) {
    const step = engine.step % 16;
    if (step === 0) engine.bar += 1;
    const time = engine.next;
    const drop = tune.heat && engine.bar % 8 === 0;
    const kickGain = tune.heat ? (drop ? 0.95 : 0.78) : currentTune === "beach" ? 0.48 : 0.62;
    if (tune.kick.includes(step)) kick(engine, time, kickGain, tune.heat);
    if (tune.snare.includes(step)) snare(engine, time, tune.heat ? 0.32 : 0.18);
    if (tune.clap?.includes(step)) clap(engine, time, tune.heat ? 0.22 : 0.12);
    if (tune.hat.includes(step)) hat(engine, time, tune.heat ? (step % 2 === 0 ? 0.055 : 0.035) : 0.032);
    if (tune.openHat?.includes(step)) openHat(engine, time, tune.heat ? 0.1 : 0.06);
    if (tune.perc?.includes(step)) perc(engine, time, 0.09);
    for (const [at, note] of tune.bass) {
      if (at === step) {
        if (tune.heat) subBass(engine, time, midi(note), 0.28);
        blip(engine, time, midi(note), tune.heat ? 0.26 : 0.32, tune.heat ? "sawtooth" : "triangle", tune.heat ? 0.12 : 0.08, tune.heat ? 280 : 420);
      }
    }
    for (const [at, note] of tune.log ?? []) {
      if (at === step) logDrum(engine, time, midi(note), 0.14);
    }
    for (const [at, note] of tune.lead) {
      if (at === step) blip(engine, time, midi(note), tune.heat ? 0.16 : 0.2, tune.heat ? "square" : "triangle", tune.heat ? 0.05 : 0.07, tune.heat ? 3200 : 2200);
    }
    for (const [at, notes] of tune.chord) {
      if (at === step) notes.forEach((note, i) => pad(engine, time, midi(note), 0.85, tune.heat ? 0.028 + i * 0.004 : 0.032));
    }
    // Club riser / air every 4 bars
    if (tune.heat && step === 14 && engine.bar % 4 === 3) riser(engine, time, eighth * 2);
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
  filter.Q.value = 1.2;
  amp.gain.setValueAtTime(0.0001, time);
  amp.gain.exponentialRampToValueAtTime(gain, time + 0.015);
  amp.gain.exponentialRampToValueAtTime(0.0001, time + dur);
  osc.connect(filter);
  filter.connect(amp);
  amp.connect(engine.bus);
  osc.start(time);
  osc.stop(time + dur + 0.05);
}

function subBass(engine: Engine, time: number, freq: number, dur: number) {
  const osc = engine.ctx.createOscillator();
  const amp = engine.ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(Math.max(38, freq * 0.5), time);
  amp.gain.setValueAtTime(0.0001, time);
  amp.gain.exponentialRampToValueAtTime(0.2, time + 0.02);
  amp.gain.exponentialRampToValueAtTime(0.0001, time + dur);
  osc.connect(amp);
  amp.connect(engine.bus);
  osc.start(time);
  osc.stop(time + dur + 0.04);
}

function logDrum(engine: Engine, time: number, freq: number, gain: number) {
  const osc = engine.ctx.createOscillator();
  const filter = engine.ctx.createBiquadFilter();
  const amp = engine.ctx.createGain();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(freq * 1.02, time);
  osc.frequency.exponentialRampToValueAtTime(freq * 0.92, time + 0.18);
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(freq * 2.2, time);
  filter.Q.value = 2.4;
  amp.gain.setValueAtTime(0.0001, time);
  amp.gain.exponentialRampToValueAtTime(gain, time + 0.01);
  amp.gain.exponentialRampToValueAtTime(0.0001, time + 0.22);
  osc.connect(filter);
  filter.connect(amp);
  amp.connect(engine.bus);
  osc.start(time);
  osc.stop(time + 0.26);
}

function pad(engine: Engine, time: number, freq: number, dur: number, gain: number) {
  const osc = engine.ctx.createOscillator();
  const osc2 = engine.ctx.createOscillator();
  const filter = engine.ctx.createBiquadFilter();
  const amp = engine.ctx.createGain();
  osc.type = "sawtooth";
  osc2.type = "triangle";
  osc.frequency.setValueAtTime(freq, time);
  osc2.frequency.setValueAtTime(freq * 1.005, time);
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(900, time);
  filter.frequency.linearRampToValueAtTime(1400, time + dur * 0.4);
  filter.frequency.linearRampToValueAtTime(700, time + dur);
  amp.gain.setValueAtTime(0.0001, time);
  amp.gain.exponentialRampToValueAtTime(gain, time + 0.08);
  amp.gain.exponentialRampToValueAtTime(0.0001, time + dur);
  osc.connect(filter);
  osc2.connect(filter);
  filter.connect(amp);
  amp.connect(engine.bus);
  osc.start(time);
  osc2.start(time);
  osc.stop(time + dur + 0.05);
  osc2.stop(time + dur + 0.05);
}

function kick(engine: Engine, time: number, gain: number, heat = false) {
  const osc = engine.ctx.createOscillator();
  const amp = engine.ctx.createGain();
  const click = engine.ctx.createOscillator();
  const clickAmp = engine.ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(heat ? 170 : 140, time);
  osc.frequency.exponentialRampToValueAtTime(heat ? 42 : 46, time + (heat ? 0.16 : 0.12));
  amp.gain.setValueAtTime(gain, time);
  amp.gain.exponentialRampToValueAtTime(0.0001, time + (heat ? 0.32 : 0.22));
  click.type = "square";
  click.frequency.setValueAtTime(1800, time);
  clickAmp.gain.setValueAtTime(heat ? 0.08 : 0.04, time);
  clickAmp.gain.exponentialRampToValueAtTime(0.0001, time + 0.03);
  osc.connect(amp);
  amp.connect(engine.bus);
  click.connect(clickAmp);
  clickAmp.connect(engine.bus);
  osc.start(time);
  osc.stop(time + 0.36);
  click.start(time);
  click.stop(time + 0.04);
}

function snare(engine: Engine, time: number, gain: number) {
  const src = engine.ctx.createBufferSource();
  const filter = engine.ctx.createBiquadFilter();
  const amp = engine.ctx.createGain();
  const body = engine.ctx.createOscillator();
  const bodyAmp = engine.ctx.createGain();
  src.buffer = engine.noise;
  filter.type = "bandpass";
  filter.frequency.value = 1800;
  filter.Q.value = 0.8;
  amp.gain.setValueAtTime(gain, time);
  amp.gain.exponentialRampToValueAtTime(0.0001, time + 0.18);
  body.type = "triangle";
  body.frequency.setValueAtTime(190, time);
  body.frequency.exponentialRampToValueAtTime(120, time + 0.08);
  bodyAmp.gain.setValueAtTime(gain * 0.45, time);
  bodyAmp.gain.exponentialRampToValueAtTime(0.0001, time + 0.1);
  src.connect(filter);
  filter.connect(amp);
  amp.connect(engine.bus);
  body.connect(bodyAmp);
  bodyAmp.connect(engine.bus);
  src.start(time);
  src.stop(time + 0.2);
  body.start(time);
  body.stop(time + 0.12);
}

function clap(engine: Engine, time: number, gain: number) {
  for (let i = 0; i < 3; i += 1) {
    const src = engine.ctx.createBufferSource();
    const filter = engine.ctx.createBiquadFilter();
    const amp = engine.ctx.createGain();
    const t = time + i * 0.012;
    src.buffer = engine.noise;
    filter.type = "bandpass";
    filter.frequency.value = 2200 + i * 400;
    filter.Q.value = 1.4;
    amp.gain.setValueAtTime(gain * (1 - i * 0.25), t);
    amp.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
    src.connect(filter);
    filter.connect(amp);
    amp.connect(engine.bus);
    src.start(t);
    src.stop(t + 0.1);
  }
}

function hat(engine: Engine, time: number, gain: number) {
  const src = engine.ctx.createBufferSource();
  const filter = engine.ctx.createBiquadFilter();
  const amp = engine.ctx.createGain();
  src.buffer = engine.noise;
  filter.type = "highpass";
  filter.frequency.value = 7800;
  amp.gain.setValueAtTime(gain, time);
  amp.gain.exponentialRampToValueAtTime(0.0001, time + 0.04);
  src.connect(filter);
  filter.connect(amp);
  amp.connect(engine.bus);
  src.start(time);
  src.stop(time + 0.05);
}

function openHat(engine: Engine, time: number, gain: number) {
  const src = engine.ctx.createBufferSource();
  const filter = engine.ctx.createBiquadFilter();
  const amp = engine.ctx.createGain();
  src.buffer = engine.noise;
  filter.type = "highpass";
  filter.frequency.value = 6200;
  amp.gain.setValueAtTime(gain, time);
  amp.gain.exponentialRampToValueAtTime(0.0001, time + 0.22);
  src.connect(filter);
  filter.connect(amp);
  amp.connect(engine.bus);
  src.start(time);
  src.stop(time + 0.24);
}

function perc(engine: Engine, time: number, gain: number) {
  const osc = engine.ctx.createOscillator();
  const amp = engine.ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(780, time);
  osc.frequency.exponentialRampToValueAtTime(220, time + 0.08);
  amp.gain.setValueAtTime(gain, time);
  amp.gain.exponentialRampToValueAtTime(0.0001, time + 0.1);
  osc.connect(amp);
  amp.connect(engine.bus);
  osc.start(time);
  osc.stop(time + 0.12);
}

function riser(engine: Engine, time: number, dur: number) {
  const src = engine.ctx.createBufferSource();
  const filter = engine.ctx.createBiquadFilter();
  const amp = engine.ctx.createGain();
  src.buffer = engine.noise;
  filter.type = "bandpass";
  filter.Q.value = 4;
  filter.frequency.setValueAtTime(400, time);
  filter.frequency.exponentialRampToValueAtTime(5000, time + dur);
  amp.gain.setValueAtTime(0.02, time);
  amp.gain.linearRampToValueAtTime(0.12, time + dur * 0.85);
  amp.gain.exponentialRampToValueAtTime(0.0001, time + dur);
  src.connect(filter);
  filter.connect(amp);
  amp.connect(engine.bus);
  src.start(time);
  src.stop(time + dur + 0.02);
}
