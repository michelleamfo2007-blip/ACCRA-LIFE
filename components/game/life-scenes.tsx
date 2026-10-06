"use client";

import { useEffect, useRef, useState } from "react";
import { IsoHuman } from "@/components/game/iso-human";
import { cedis, type Life, type Ride } from "@/lib/game/world";

const LINES = [
  "The beach road is bright. Palms on one side, the Gulf on the other.",
  "Oxford Street is already loud.",
  "Independence Square sits back from the traffic.",
  "Cantonments is quieter once you leave the main road.",
  "A trotro taps the horn and keeps moving.",
];

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
  const fare = ride.cost ? `${cedis(ride.cost)}.` : "Free ride: your own two legs.";
  const arriveRef = useRef(onArrive);
  const finished = useRef(false);
  arriveRef.current = onArrive;
  function finish() {
    if (finished.current) return;
    finished.current = true;
    arriveRef.current();
  }

  useEffect(() => {
    const started = Date.now();
    const span = 8000;
    const id = window.setInterval(() => {
      const gone = Math.min(1, (Date.now() - started) / span);
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

  return (
    <div className="absolute inset-0 z-40 overflow-hidden bg-[#c5e4f7]">
      <div className={`street-world street-${camera} ${walking ? "" : `street-on-${ride.id}`}`}>
        <div className="street-sky" />
        <div className="street-road">
          {ride.id === "train" ? <span className="street-rails" /> : null}
          {walking || ride.id === "train" ? null : (
            <>
              <span className="street-car street-car-a" />
              <span className="street-car street-car-b" />
              <span className="street-car street-car-c" />
            </>
          )}
        </div>
        <div className="street-walk" />
        {walking ? (
          <div className={`street-sim street-sim-${camera}`}>
            <IsoHuman skin={life.look.skin} shirt={life.look.cloth} hair={life.look.hair} cloth={life.look.cloth} pose="walk" face={facing} className="h-full" />
          </div>
        ) : (
          <div className={`street-vehicle street-vehicle-${ride.id}`}>
            <Vehicle ride={ride.id} life={life} face={facing} />
          </div>
        )}
      </div>
      <div className="absolute left-3 top-[max(5.5rem,calc(env(safe-area-inset-top)+4.6rem))] z-10 w-[min(280px,70vw)] rounded-3xl bg-[#1c2430]/92 p-3 text-white shadow-xl">
        <p className="text-sm font-semibold">
          {ride.label} · {place}
        </p>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/20">
          <div className="h-full rounded-full bg-[#FCD116]" style={{ width: `${((ride.minutes - left) / ride.minutes) * 100}%` }} />
        </div>
        <p className="mt-2 text-xs text-white/80">
          {left}:00 to the gate
        </p>
        <div className="mt-2 flex gap-2 text-[11px] font-semibold">
          <span className="rounded-full bg-[#006B3F] px-2 py-0.5">Moving</span>
          <span className="rounded-full bg-white/15 px-2 py-0.5">{life.dumsor ? "Dumsor" : "Sunny"}</span>
        </div>
        <p className="mt-2 text-xs leading-5 text-white/85">{line === LINES.length - 1 ? `Almost there. ${place} is just ahead.` : LINES[line]}</p>
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

function Vehicle({ ride, life, face }: { ride: Ride["id"]; life: Life; face: 1 | -1 }) {
  const rider = <IsoHuman skin={life.look.skin} shirt={life.look.cloth} hair={life.look.hair} cloth={life.look.cloth} pose="idle" face={face} className="h-full" />;
  if (ride === "trotro") {
    return (
      <div className="van">
        <span className="van-stripe" />
        <span className="van-cab" />
        <span className="van-glass">{rider}</span>
        <span className="van-glass" />
        <span className="van-glass" />
        <span className="van-board">TROTRO</span>
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
      <div className="cab" style={{ background: "#2f3a4a" }}>
        <span className="cab-glass">{rider}</span>
        <span className="wheel wheel-back" />
        <span className="wheel wheel-front" />
      </div>
    );
  }
  if (ride === "taxi") {
    return (
      <div className="cab">
        <span className="cab-lamp">TAXI</span>
        <span className="cab-glass">{rider}</span>
        <span className="wheel wheel-back" />
        <span className="wheel wheel-front" />
      </div>
    );
  }
  return (
    <div className="bike">
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
  arriveRef.current = onArrive;

  function finish() {
    if (finished.current) return;
    finished.current = true;
    arriveRef.current();
  }

  useEffect(() => {
    const started = Date.now();
    const span = 12000;
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
  const phase = beat.phase;
  const air = phase === "climb" || phase === "cruise" || phase === "descent";

  return (
    <div className="absolute inset-0 z-50 overflow-hidden bg-[#9ec8e8]">
      {cam === "outside" ? (
        <div className={`flight-sky ${air ? "flight-sky-air" : "flight-sky-ground"}`}>
          <div className="flight-horizon" />
          {air ? <div className="flight-fields" /> : <div className="flight-tarmac" />}
          <div className={`flight-plane flight-plane-${phase}`}>
            <Airliner />
          </div>
          {phase === "boarding" || phase === "taxi" ? <div className="flight-bridge" /> : null}
        </div>
      ) : null}
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
            ? `Boarding · gate 2 · ${Math.max(1, Math.ceil((0.12 - gone) * 12))}s`
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

function Airliner() {
  return (
    <svg viewBox="0 0 280 90" className="h-full w-full drop-shadow-xl">
      <ellipse cx="150" cy="48" rx="110" ry="18" fill="#f8fafc" />
      <path d="M40 48 L8 58 L8 42 Z" fill="#f8fafc" />
      <rect x="70" y="38" width="120" height="6" rx="2" fill="#006B3F" />
      <text x="90" y="36" fill="#006B3F" fontSize="10" fontWeight="700" fontFamily="ui-sans-serif">
        ACCRA LIFE AIR
      </text>
      {[78, 92, 106, 120, 134, 148, 162].map((x) => (
        <rect key={x} x={x} y="46" width="8" height="5" rx="1" fill="#7ec8ea" />
      ))}
      <path d="M95 48 L145 20 L165 20 L130 48 Z" fill="#e2e8f0" />
      <path d="M95 48 L145 76 L165 76 L130 48 Z" fill="#cbd5e1" />
      <path d="M220 30 L248 18 L255 22 L230 48 Z" fill="#006B3F" />
      <circle cx="238" cy="28" r="7" fill="#FCD116" />
      <text x="238" y="31" textAnchor="middle" fill="#121212" fontSize="7" fontWeight="800">
        AL
      </text>
      <rect x="210" y="54" width="10" height="14" rx="2" fill="#94a3b8" />
      <rect x="120" y="54" width="10" height="14" rx="2" fill="#94a3b8" />
    </svg>
  );
}

function CabinView({ seat }: { seat: boolean }) {
  return (
    <div className={`flight-cabin ${seat ? "flight-cabin-seat" : ""}`}>
      <div className="flight-cabin-ceiling" />
      <div className="flight-cabin-aisle">
        {Array.from({ length: 8 }, (_, row) => (
          <div key={row} className="flight-cabin-row">
            <span className="flight-seat" />
            <span className="flight-seat" />
            <span className="flight-aisle-gap" />
            <span className="flight-seat flight-seat-you" />
            <span className="flight-seat" />
          </div>
        ))}
        <div className="flight-cabin-trolley" aria-hidden>
          🧳
        </div>
        <p className="flight-cabin-wc">WC</p>
      </div>
    </div>
  );
}
