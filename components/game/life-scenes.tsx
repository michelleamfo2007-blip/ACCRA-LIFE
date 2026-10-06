"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import { IsoHuman } from "@/components/game/iso-human";
import type { FlightPhase } from "@/components/game/flight-outside";
import { accraHour, cedis, type Life, type Ride } from "@/lib/game/world";

const FlightOutside = dynamic(() => import("@/components/game/flight-outside").then((mod) => mod.FlightOutside), { ssr: false });

const LINES = [
  "Liberation Road is thick. A trotro cuts in without asking.",
  "Oxford Street is already loud. Someone is selling pure water at the light.",
  "Independence Avenue opens up and the city breathes.",
  "A taxi with yellow fenders honks twice and keeps going.",
  "Cantonments is quieter once you leave the main road.",
  "An okada filters between the bumpers and vanishes ahead.",
  "Almost there — you can smell the place before you see the gate.",
];

type TrafficKind = "taxi" | "trotro" | "private" | "okada" | "suv" | "truck";

type TrafficBit = {
  id: string;
  kind: TrafficKind;
  lane: "near" | "far" | "opposite";
  color: string;
  dur: number;
  delay: number;
  slogan?: string;
};

const TRAFFIC_POOL: Omit<TrafficBit, "id" | "dur" | "delay">[] = [
  { kind: "taxi", lane: "near", color: "#FCD116" },
  { kind: "trotro", lane: "near", color: "#f4efe6", slogan: "GOD IS ABLE" },
  { kind: "private", lane: "near", color: "#CE1126" },
  { kind: "okada", lane: "near", color: "#1c1917" },
  { kind: "suv", lane: "far", color: "#1e3a5f" },
  { kind: "taxi", lane: "far", color: "#f5c542" },
  { kind: "truck", lane: "far", color: "#5c5348" },
  { kind: "private", lane: "opposite", color: "#006B3F" },
  { kind: "trotro", lane: "opposite", color: "#fff6df", slogan: "NO RUSH" },
  { kind: "okada", lane: "opposite", color: "#334155" },
  { kind: "taxi", lane: "opposite", color: "#eab308" },
  { kind: "suv", lane: "near", color: "#0f172a" },
];

function makeRideTraffic(seed: string): TrafficBit[] {
  let hash = 0;
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) % 9973;
  return TRAFFIC_POOL.map((bit, index) => {
    hash = (hash * 17 + index * 43) % 997;
    return {
      ...bit,
      id: `${bit.kind}-${index}`,
      dur: 4.2 + (hash % 40) / 10,
      delay: -((hash % 80) / 10),
    };
  });
}

export function StreetRide({
  life,
  place,
  ride,
  onArrive,
  onBack,
}: {
  life: Life;
  place: string;
  ride: Ride;
  onArrive: () => void;
  onBack: () => void;
}) {
  const [camera, setCamera] = useState<"chase" | "side" | "selfie">("chase");
  const [left, setLeft] = useState<number>(ride.minutes);
  const [line, setLine] = useState(0);
  const [progress, setProgress] = useState(0);
  const fare = ride.cost ? `${cedis(ride.cost)}.` : "Free ride: your own two legs.";
  const arriveRef = useRef(onArrive);
  const finished = useRef(false);
  const night = accraHour() >= 19 || accraHour() < 5;
  const traffic = useMemo(() => makeRideTraffic(`${ride.id}:${place}`), [ride.id, place]);
  arriveRef.current = onArrive;
  function finish() {
    if (finished.current) return;
    finished.current = true;
    arriveRef.current();
  }

  useEffect(() => {
    const started = Date.now();
    const span = 9000;
    const id = window.setInterval(() => {
      const gone = Math.min(1, (Date.now() - started) / span);
      setProgress(gone);
      setLeft(Math.max(0, Math.ceil(ride.minutes * (1 - gone))));
      setLine(Math.min(LINES.length - 1, Math.floor(gone * LINES.length)));
      if (gone >= 1) {
        window.clearInterval(id);
        if (!finished.current) {
          finished.current = true;
          arriveRef.current();
        }
      }
    }, 200);
    return () => window.clearInterval(id);
  }, [ride.minutes]);

  const facing = camera === "selfie" ? -1 : 1;
  const walking = ride.id === "trek";
  const onRails = ride.id === "train";

  return (
    <div className={`absolute inset-0 z-40 overflow-hidden ${night ? "bg-[#0c1220]" : "bg-[#c5e4f7]"}`}>
      <div className={`street-world street-${camera} ${walking ? "street-on-foot" : `street-on-${ride.id}`} ${night ? "street-night" : ""}`}>
        <div className="street-sky" />
        <div className="street-skyline" aria-hidden />
        <div className="street-road">
          <span className="street-gutter street-gutter-l" />
          <span className="street-gutter street-gutter-r" />
          <span className="street-lane" />
          <span className="street-pothole street-pothole-a" />
          <span className="street-pothole street-pothole-b" />
          <span className="street-bump" />
          <span className="street-stain" />
          {onRails ? <span className="street-rails" /> : null}
        </div>
        {!onRails ? (
          <div className="street-traffic" aria-hidden>
            {traffic.map((bit) => (
              <RoadCar key={bit.id} bit={bit} night={night} />
            ))}
            <span className="street-hawker street-hawker-a" />
            <span className="street-hawker street-hawker-b" />
          </div>
        ) : null}
        <div className="street-walk">
          <span className="street-kiosk" />
          <span className="street-stall" />
          <span className="street-pole" />
        </div>
        {night ? <div className="street-glow" aria-hidden /> : null}
        {walking ? (
          <div className={`street-sim street-sim-${camera}`}>
            <IsoHuman skin={life.look.skin} shirt={life.look.cloth} hair={life.look.hair} cloth={life.look.cloth} pose="walk" face={facing} className="h-full" />
          </div>
        ) : (
          <div className={`street-vehicle street-vehicle-${ride.id} ${progress > 0.82 ? "street-vehicle-brake" : ""}`}>
            <Vehicle ride={ride.id} life={life} face={facing} night={night} />
          </div>
        )}
      </div>
      <div className="absolute left-3 top-[max(5.5rem,calc(env(safe-area-inset-top)+4.6rem))] z-10 w-[min(300px,74vw)] rounded-3xl bg-[#1c2430]/92 p-3 text-white shadow-xl">
        <p className="text-sm font-semibold">
          {ride.label} · {place}
        </p>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/20">
          <div className="h-full rounded-full bg-[#FCD116]" style={{ width: `${progress * 100}%` }} />
        </div>
        <p className="mt-2 text-xs text-white/80">{left}:00 on the road</p>
        <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-semibold">
          <span className="rounded-full bg-[#006B3F] px-2 py-0.5">{walking ? "On foot" : "In traffic"}</span>
          <span className="rounded-full bg-white/15 px-2 py-0.5">{night ? "Night road" : life.dumsor ? "Dumsor" : "Day traffic"}</span>
        </div>
        <p className="mt-2 text-xs leading-5 text-white/85">{progress > 0.9 ? `${place} is just ahead.` : walking ? (progress > 0.5 ? "Cars keep rolling past. Keep walking." : LINES[line]) : LINES[line]}</p>
        <p className="mt-1 text-xs text-white/70">{fare}</p>
        <div className="mt-3 flex gap-2">
          <button type="button" onClick={finish} className="rounded-full bg-white px-3 py-2 text-xs font-bold text-[#121212]">
            Skip ride ›
          </button>
          <button type="button" onClick={onBack} className="rounded-full bg-white/15 px-3 py-2 text-xs font-semibold">
            Turn back
          </button>
        </div>
      </div>
      <div className="absolute right-3 top-[max(8rem,calc(env(safe-area-inset-top)+6rem))] z-10 flex flex-col gap-2">
        {(
          [
            ["chase", "Chase"],
            ["side", "Side"],
            ["selfie", "Selfie"],
          ] as const
        ).map(([id, label]) => (
          <button key={id} type="button" onClick={() => setCamera(id)} className={`rounded-2xl px-3 py-2 text-xs font-bold shadow ${camera === id ? "bg-white text-[#121212]" : "bg-[#121212]/80 text-white"}`}>
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

function RoadCar({ bit, night }: { bit: TrafficBit; night: boolean }) {
  return (
    <div
      className={`road-car road-car-${bit.kind} road-lane-${bit.lane} ${night ? "road-car-night" : ""}`}
      style={{
        ["--car-color" as string]: bit.color,
        animationDuration: `${bit.dur}s`,
        animationDelay: `${bit.delay}s`,
      }}
    >
      <span className="road-car-shadow" />
      <span className="road-car-body">
        <span className="road-car-cabin" />
        <span className="road-car-glass" />
        {bit.kind === "taxi" ? <span className="road-car-lamp">TAXI</span> : null}
        {bit.kind === "trotro" ? <span className="road-car-slogan">{bit.slogan ?? "TROTRO"}</span> : null}
        <span className="road-car-light road-car-head" />
        <span className="road-car-light road-car-tail" />
      </span>
      <span className="road-car-wheel road-car-wheel-b" />
      <span className="road-car-wheel road-car-wheel-f" />
    </div>
  );
}

function Vehicle({ ride, life, face, night }: { ride: Ride["id"]; life: Life; face: 1 | -1; night?: boolean }) {
  const rider = <IsoHuman skin={life.look.skin} shirt={life.look.cloth} hair={life.look.hair} cloth={life.look.cloth} pose="idle" face={face} className="h-full" />;
  if (ride === "trotro") {
    return (
      <div className={`van ${night ? "ride-lit" : ""}`}>
        <span className="van-stripe" />
        <span className="van-cab" />
        <span className="van-glass">{rider}</span>
        <span className="van-glass" />
        <span className="van-glass" />
        <span className="van-board">NO CONDITION IS PERMANENT</span>
        <span className="ride-brake" />
        <span className="wheel wheel-back" />
        <span className="wheel wheel-front" />
      </div>
    );
  }
  if (ride === "train") {
    return (
      <div className="coach">
        <span className="coach-roof" />
        <span className="coach-glass">{rider}</span>
        <span className="coach-glass" />
        <span className="coach-glass" />
        <span className="coach-glass" />
        <span className="wheel wheel-back" />
        <span className="wheel wheel-mid" />
        <span className="wheel wheel-front" />
      </div>
    );
  }
  if (ride === "car") {
    return (
      <div className={`cab ${night ? "ride-lit" : ""}`} style={{ background: "#2f3a4a" }}>
        <span className="cab-glass">{rider}</span>
        <span className="ride-brake" />
        <span className="wheel wheel-back" />
        <span className="wheel wheel-front" />
      </div>
    );
  }
  if (ride === "taxi") {
    return (
      <div className={`cab ${night ? "ride-lit" : ""}`}>
        <span className="cab-lamp">TAXI</span>
        <span className="cab-glass">{rider}</span>
        <span className="ride-brake" />
        <span className="wheel wheel-back" />
        <span className="wheel wheel-front" />
      </div>
    );
  }
  return (
    <div className={`bike ${night ? "ride-lit" : ""}`}>
      <span className="bike-rider">{rider}</span>
      <span className="bike-body" />
      <span className="wheel wheel-back" />
      <span className="wheel wheel-front" />
    </div>
  );
}

const TASKS = ["Signing the attendance register", "The ride over", "A short brief", "Do the work"];

export function ShiftFloor({
  life,
  title,
  place,
  minutes,
  onLeave,
  onDone,
}: {
  life: Life;
  title: string;
  place: string;
  minutes: number;
  onLeave: () => void;
  onDone: () => void;
}) {
  const [left, setLeft] = useState(8);
  const [view, setView] = useState<"desk" | "floor">("floor");
  const performance = Math.min(96, 40 + Math.round(life.skills.career * 4));
  const done = 8 - left;
  const doneRef = useRef(onDone);
  const finished = useRef(false);
  doneRef.current = onDone;

  useEffect(() => {
    if (left > 0 || finished.current) return;
    finished.current = true;
    doneRef.current();
  }, [left]);

  useEffect(() => {
    const id = window.setInterval(() => {
      setLeft((current) => (current <= 1 ? 0 : current - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="absolute inset-0 z-40 overflow-hidden bg-[#d5dbe3]">
      <div className="absolute inset-x-0 bottom-0 h-[46%] bg-[#cfd6df]" />
      <div className="absolute bottom-[18%] left-1/2 flex -translate-x-1/2 gap-4">
        {["#006B3F", "#FCD116", "#CE1126", "#121212"].map((color) => (
          <span key={color} className="h-16 w-16 rounded-full shadow-md" style={{ background: color }} />
        ))}
      </div>
      <IsoHuman skin={life.look.skin} shirt={life.look.cloth} hair={life.look.hair} cloth={life.look.cloth} pose={view === "desk" ? "act" : "idle"} className="absolute bottom-[28%] left-1/2 h-64 -translate-x-1/2" />
      <div className="absolute left-3 top-[max(5.5rem,calc(env(safe-area-inset-top)+4.6rem))] w-[min(280px,72vw)] rounded-3xl bg-[#1c2430]/92 p-3 text-white shadow-xl">
        <p className="font-semibold">{title}</p>
        <p className="text-xs text-white/70">{place}</p>
        <p className="mt-2 text-sm">No pay yet · stay {left}s</p>
        <p className="mt-1 text-xs text-white/75">Shift is {Math.round(minutes / 60) || 1} hrs on the clock · {performance}%</p>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/20">
          <div className="h-full rounded-full bg-[#006B3F]" style={{ width: `${performance}%` }} />
        </div>
        <ul className="mt-2 space-y-1 text-xs">
          {TASKS.map((task, index) => (
            <li key={task} className={index < Math.floor(done / 2) ? "text-white" : "text-white/45"}>
              {index < Math.floor(done / 2) ? "✓" : "○"} {task}
            </li>
          ))}
        </ul>
        <button type="button" onClick={onLeave} className="mt-3 w-full rounded-full bg-white/15 py-2 text-xs font-semibold">
          Leave now — no pay
        </button>
      </div>
      <div className="absolute right-3 top-[max(8rem,calc(env(safe-area-inset-top)+6rem))] flex flex-col gap-2">
        <button type="button" onClick={() => setView("desk")} className={`rounded-2xl px-3 py-2 text-xs font-bold shadow ${view === "desk" ? "bg-white text-[#121212]" : "bg-[#121212]/80 text-white"}`}>
          My desk
        </button>
        <button type="button" onClick={() => setView("floor")} className={`rounded-2xl px-3 py-2 text-xs font-bold shadow ${view === "floor" ? "bg-white text-[#121212]" : "bg-[#121212]/80 text-white"}`}>
          Floor
        </button>
      </div>
    </div>
  );
}

export function Payday({ earned, performance, onClose }: { earned: number; performance: number; onClose: () => void }) {
  return (
    <div className="absolute inset-0 z-50 grid place-items-center bg-[#121212]/35 px-6">
      <div className="w-full max-w-sm rounded-[28px] bg-white p-6 text-center shadow-2xl">
        <p className="text-3xl" aria-hidden>
          💼
        </p>
        <h2 className="mt-2 font-display text-2xl">Back from work</h2>
        <p className="mt-2 text-sm text-[#5c6b82]">
          You earned {cedis(earned)}. Performance is {performance}%.
        </p>
        <button type="button" onClick={onClose} className="mt-5 w-full rounded-full bg-[#006B3F] py-3 font-bold text-white">
          Nice one
        </button>
      </div>
    </div>
  );
}

type FlightCam = "outside" | "cabin" | "seat";

const FLIGHT_BEATS = [
  { at: 0, phase: "boarding", line: "Boarding at the gate: find your seat, bags in the overhead bins." },
  { at: 0.12, phase: "taxi", line: "Pushback. Cabins secure. Taxiing to runway 03." },
  { at: 0.22, phase: "climb", line: "Climbing out over Accra…" },
  { at: 0.4, phase: "cruise", line: "Cruising at 35,000 ft. Soft drink or malt?" },
  { at: 0.55, phase: "cruise", line: "The man beside you is humming highlife under his breath." },
  { at: 0.7, phase: "cruise", line: "Clouds over the Ashanti hills. Almost there." },
  { at: 0.85, phase: "descent", line: "Seatbelts on. Descending into the Garden City." },
  { at: 0.94, phase: "land", line: "Touchdown. Welcome." },
] as const;

export function FlightRide({
  from,
  to,
  cabin,
  minutes,
  fare,
  onArrive,
  onBack,
}: {
  from: string;
  to: string;
  cabin: string;
  minutes: number;
  fare: number;
  onArrive: () => void;
  onBack: () => void;
}) {
  const [cam, setCam] = useState<FlightCam>("outside");
  const [gone, setGone] = useState(0);
  const arriveRef = useRef(onArrive);
  const finished = useRef(false);
  const lockedAir = useRef(false);
  arriveRef.current = onArrive;

  function finish() {
    if (finished.current) return;
    finished.current = true;
    arriveRef.current();
  }

  useEffect(() => {
    const started = Date.now();
    const span = 14000;
    const id = window.setInterval(() => {
      const next = Math.min(1, (Date.now() - started) / span);
      setGone(next);
      if (next >= 1) {
        window.clearInterval(id);
        if (!finished.current) {
          finished.current = true;
          arriveRef.current();
        }
      }
    }, 80);
    return () => window.clearInterval(id);
  }, []);

  const beat = [...FLIGHT_BEATS].reverse().find((item) => gone >= item.at) ?? FLIGHT_BEATS[0];
  const left = Math.max(0, Math.ceil(minutes * (1 - gone)));
  const code = from.slice(0, 3).toUpperCase();
  const dest = to.slice(0, 3).toUpperCase();
  const phase = beat.phase as FlightPhase;
  const air = phase === "climb" || phase === "cruise" || phase === "descent";

  useEffect(() => {
    if (air && !lockedAir.current) {
      lockedAir.current = true;
      setCam("outside");
    }
  }, [air]);

  return (
    <div className="absolute inset-0 z-50 overflow-hidden bg-[#9ec8e8]">
      {cam === "outside" ? <FlightOutside phase={phase} progress={gone} /> : null}
      {cam === "cabin" ? <CabinView seat={false} /> : null}
      {cam === "seat" ? <CabinView seat /> : null}

      <div className="absolute left-3 top-[max(5.5rem,calc(env(safe-area-inset-top)+4.6rem))] z-10 w-[min(300px,78vw)] rounded-3xl bg-[#1c2430]/92 p-3 text-white shadow-xl">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-semibold">
              AL {200 + Math.round(minutes)} · {cabin}
            </p>
            <p className="text-[11px] text-white/70">9G-ALA · Accra Life Air</p>
          </div>
          <p className="text-xs font-bold text-[#FCD116]">
            {code} → {dest}
          </p>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/20">
          <div className="relative h-full rounded-full bg-[#FCD116]" style={{ width: `${Math.max(4, gone * 100)}%` }}>
            <span className="absolute -right-2 -top-2 text-[10px]">✈️</span>
          </div>
        </div>
        <p className="mt-2 text-xs font-semibold text-white/90">
          {phase === "boarding"
            ? `Boarding · gate 2 · ${Math.max(1, Math.ceil((0.12 - gone) * 14))}s`
            : phase === "land"
              ? "Arrived"
              : `${left} min to landing`}
        </p>
        <p className="mt-1 text-xs leading-5 text-white/85">{beat.line}</p>
        <p className="mt-1 text-xs text-white/65">Fare {cedis(fare)}</p>
        <div className="mt-3 flex gap-2">
          <button type="button" onClick={finish} className="rounded-full bg-white px-3 py-2 text-xs font-bold text-[#121212]">
            Skip ›
          </button>
          <button type="button" onClick={onBack} className="rounded-full bg-white/15 px-3 py-2 text-xs font-semibold">
            Leave gate
          </button>
        </div>
      </div>

      <div className="absolute bottom-[max(5.5rem,calc(env(safe-area-inset-bottom)+4.8rem))] left-1/2 z-10 flex -translate-x-1/2 gap-1 rounded-full bg-[#121212]/80 p-1 text-white shadow-lg">
        {(
          [
            ["outside", "Outside"],
            ["cabin", "Cabin"],
            ["seat", "My seat"],
          ] as const
        ).map(([id, label]) => (
          <button key={id} type="button" onClick={() => setCam(id)} className={`rounded-full px-3 py-1.5 text-xs font-bold ${cam === id ? "bg-white text-[#121212]" : ""}`}>
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

const CABIN_PAX = [
  { skin: "#5c3a24", shirt: "#CE1126", hair: "#1a1a1a" },
  { skin: "#8d5a3b", shirt: "#FCD116", hair: "#2b2118" },
  { skin: "#3f2a1d", shirt: "#006B3F", hair: "#111" },
  { skin: "#6b4423", shirt: "#1d4ed8", hair: "#1a1a1a" },
  { skin: "#a0673a", shirt: "#ec4899", hair: "#3b2a1a" },
  { skin: "#4a2f1c", shirt: "#f97316", hair: "#111" },
];

function CabinView({ seat }: { seat: boolean }) {
  return (
    <div className={`flight-cabin-3d ${seat ? "flight-cabin-3d-seat" : ""}`}>
      <div className="flight-cabin-3d-tunnel">
        <div className="flight-cabin-3d-ceiling" />
        <div className="flight-cabin-3d-floor" />
        {Array.from({ length: 6 }, (_, row) => {
          const pax = CABIN_PAX[row % CABIN_PAX.length];
          const depth = 8 + row * 12;
          return (
            <div key={row} className="flight-cabin-3d-row" style={{ bottom: `${depth}%`, transform: `translateX(-50%) scale(${1 - row * 0.08})` }}>
              <span className="flight-cabin-3d-bench">
                <span className="flight-cabin-3d-pax">
                  <IsoHuman skin={pax.skin} shirt={pax.shirt} hair={pax.hair} cloth={pax.shirt} pose="idle" face={1} className="h-full" />
                </span>
              </span>
              <span className="flight-cabin-3d-gap" />
              <span className={`flight-cabin-3d-bench ${row === 1 ? "flight-cabin-3d-you" : ""}`}>
                {row === 1 ? (
                  <span className="flight-cabin-3d-pax">
                    <IsoHuman skin="#8d5a3b" shirt="#e7c85a" hair="#2b2118" cloth="#e7c85a" pose="idle" face={-1} className="h-full" />
                  </span>
                ) : (
                  <span className="flight-cabin-3d-pax">
                    <IsoHuman skin={CABIN_PAX[(row + 2) % CABIN_PAX.length].skin} shirt={CABIN_PAX[(row + 2) % CABIN_PAX.length].shirt} hair={CABIN_PAX[(row + 2) % CABIN_PAX.length].hair} cloth={CABIN_PAX[(row + 2) % CABIN_PAX.length].shirt} pose="idle" face={-1} className="h-full" />
                  </span>
                )}
              </span>
            </div>
          );
        })}
        <div className="flight-cabin-3d-crew" aria-hidden>
          <IsoHuman skin="#5c3a24" shirt="#006B3F" hair="#1a1a1a" cloth="#006B3F" pose="walk" face={1} className="h-full" />
        </div>
        <div className="flight-cabin-3d-cart" aria-hidden>
          🧳
        </div>
        <p className="flight-cabin-3d-wc">WC</p>
      </div>
    </div>
  );
}
