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
