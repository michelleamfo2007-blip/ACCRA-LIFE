"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import { IsoHuman } from "@/components/game/iso-human";
import type { FlightPhase } from "@/components/game/flight-outside";
import { carOf } from "@/lib/game/garage";
import type { Weather } from "@/lib/game/sky";
import { accraHour, cedis, shiftNote, shiftPerformance, type Life, type Ride } from "@/lib/game/world";

const FlightOutside = dynamic(() => import("@/components/game/flight-outside").then((mod) => mod.FlightOutside), { ssr: false });
const AccraRoad = dynamic(() => import("@/components/game/accra-road").then((mod) => mod.AccraRoad), { ssr: false });

const DRIVE_LINES = [
  "You pull out in your own car. A trotro tries to cut in and you hold the lane.",
  "Liberation Road is thick. You know this stretch.",
  "An okada filters past and the rider nods.",
  "The lights change. You ease through with the rest of the line.",
  "A taxi honks twice. You let them go.",
  "Your lane opens up past the next junction.",
  "Almost there. You indicate and ease toward the curb.",
];

const LINES = [
  "Liberation Road is thick. A trotro cuts in without asking.",
  "Oxford Street is already loud. Someone is selling pure water at the light.",
  "Independence Avenue opens up and the city breathes.",
  "A taxi with yellow fenders honks twice and keeps going.",
  "Cantonments is quieter once you leave the main road.",
  "An okada filters between the bumpers and vanishes ahead.",
  "Almost there — you can smell the place before you see the gate.",
];

const RAIN_LINES = [
  "Rain on the windscreen. The trotro ahead is crawling.",
  "Puddles in the lane. A hawker still walks the bumpers with an umbrella.",
  "The gutter is full. Everybody is late.",
  "Wipers on. Brake lights all the way to the next light.",
  "A taxi splashes the curb and keeps the fare high.",
  "Circle looks flooded from here. You stay in the slow lane.",
  "Almost there — the rain has not let up.",
];

const ROAD_SIGNS = ["LIBERATION ROAD", "OXFORD STREET", "INDEPENDENCE AVE", "AIRPORT ROAD", "RING ROAD EAST", "SPINTEX ROAD", "GRAPHIC ROAD"];

const RIDE_SLOGANS: Record<string, string> = {
  taxi: "GOD'S TIME IS THE BEST",
  trotro: "NO CONDITION IS PERMANENT",
  car: "SAFE JOURNEY",
  okada: "NO RUSH",
  train: "ACCRA · TEMA",
  trek: "",
};

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
  sky,
  onArrive,
  onBack,
  onMap,
}: {
  life: Life;
  place: string;
  ride: Ride;
  sky?: Weather;
  onArrive: () => void;
  onBack: () => void;
  onMap?: () => void;
}) {
  const [camera, setCamera] = useState<"chase" | "cabin" | "selfie">("chase");
  const [left, setLeft] = useState<number>(ride.minutes);
  const [line, setLine] = useState(0);
  const [progress, setProgress] = useState(0);
  const fare = ride.cost ? cedis(ride.cost) : "Free";
  const arriveRef = useRef(onArrive);
  const finished = useRef(false);
  const owned = ride.id === "car" ? carOf(life.car?.id) : null;
  const night = accraHour() >= 19 || accraHour() < 5;
  const traffic = useMemo(() => makeRideTraffic(`${ride.id}:${place}`), [ride.id, place]);
  const slogan = RIDE_SLOGANS[ride.id] || "SAFE JOURNEY";
  const sign = ROAD_SIGNS[Math.min(ROAD_SIGNS.length - 1, Math.floor(progress * ROAD_SIGNS.length))];
  const boarding = progress < 0.12 && ride.id !== "trek";
  arriveRef.current = onArrive;
  function finish() {
    if (finished.current) return;
    finished.current = true;
    arriveRef.current();
  }

  useEffect(() => {
    const started = Date.now();
    const span = 11000;
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
  const chase = camera === "chase" && !walking;

  return (
    <div className={`absolute inset-0 z-40 overflow-hidden ${night ? "bg-[#0a1020]" : "bg-[#7eb8e0]"}`}>
      {camera === "chase" ? (
        <AccraRoad ride={ride.id} night={night} boarding={boarding && ride.id !== "trek"} slowing={progress > 0.82} slogan={slogan} look={life.look} sky={sky} carId={life.car?.id} paint={life.car?.color} />
      ) : null}
      {sky?.rain ? <div className={`rain-layer pointer-events-none absolute inset-0 z-[5] ${sky.flood ? "rain-heavy" : ""}`} aria-hidden /> : null}
      {sky?.harmattan && !sky.rain ? <div className="harmattan-layer pointer-events-none absolute inset-0 z-[5]" aria-hidden /> : null}
      {camera === "chase" ? null : (
      <div className={`street-world street-${camera} ${walking ? "street-on-foot" : `street-on-${ride.id}`} ${night ? "street-night" : ""} ${boarding ? "street-boarding" : ""}`}>
        <div className="street-sky" />
        {chase ? (
          <>
            <div className="street-clouds" aria-hidden>
              <span className="street-cloud street-cloud-a" />
              <span className="street-cloud street-cloud-b" />
              <span className="street-cloud street-cloud-c" />
              <span className="street-cloud street-cloud-d" />
            </div>
            {night ? <div className="street-stars" aria-hidden /> : null}
            <div className="street-haze" aria-hidden />
            <div className="street-city street-city-l" aria-hidden>
              {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                <span key={`cl${i}`} className={`street-tower street-tower-${(i % 6) + 1}`} style={{ ["--i" as string]: i }} />
              ))}
              <span className="street-palm street-palm-a" />
              <span className="street-lamp street-lamp-a" />
              <span className="street-lamp street-lamp-b" />
            </div>
            <div className="street-city street-city-r" aria-hidden>
              {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                <span key={`cr${i}`} className={`street-tower street-tower-${((i + 3) % 6) + 1}`} style={{ ["--i" as string]: i }} />
              ))}
              <span className="street-billboard">ACCRA NIGHTS</span>
              <span className="street-palm street-palm-b" />
              <span className="street-lamp street-lamp-c" />
              <span className="street-lamp street-lamp-d" />
            </div>
            <div className="street-verge street-verge-l" aria-hidden />
            <div className="street-verge street-verge-r" aria-hidden />
          </>
        ) : (
          <div className="street-skyline" aria-hidden />
        )}
        <div className="street-road">
          <span className="street-gutter street-gutter-l" />
          <span className="street-gutter street-gutter-r" />
          <span className="street-lane street-lane-a" />
          <span className="street-lane street-lane-b" />
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
            {!chase ? (
              <>
                <span className="street-hawker street-hawker-a" />
                <span className="street-hawker street-hawker-b" />
              </>
            ) : null}
          </div>
        ) : null}
        {!chase ? (
          <div className="street-walk">
            <span className="street-kiosk" />
            <span className="street-stall" />
            <span className="street-pole" />
          </div>
        ) : (
          <div className="street-sign" aria-hidden>
            <span className="street-sign-post" />
            <span className="street-sign-board">{sign}</span>
          </div>
        )}
        {night ? <div className="street-glow" aria-hidden /> : null}
        {walking ? (
          <div className={`street-sim street-sim-${camera}`}>
            <IsoHuman skin={life.look.skin} shirt={life.look.cloth} hair={life.look.hair} cloth={life.look.cloth} pose="walk" face={facing} className="h-full" />
          </div>
        ) : boarding && chase ? (
          <div className="street-board-beat">
            <IsoHuman skin={life.look.skin} shirt={life.look.cloth} hair={life.look.hair} cloth={life.look.cloth} pose="walk" face={1} className="h-full" />
            <div className={`street-vehicle street-vehicle-await street-vehicle-${ride.id}`}>
              <Vehicle ride={ride.id} life={life} face={1} night={night} chase slogan={slogan} />
            </div>
          </div>
        ) : (
          <div className={`street-vehicle street-vehicle-${ride.id} ${chase ? "street-vehicle-chase" : ""} ${progress > 0.82 ? "street-vehicle-brake" : ""}`}>
            <Vehicle ride={ride.id} life={life} face={facing} night={night} chase={chase} slogan={slogan} />
          </div>
        )}
      </div>
      )}

      <div className="absolute right-3 top-[max(5.2rem,calc(env(safe-area-inset-top)+4.4rem))] z-10 w-[min(240px,68vw)] rounded-3xl bg-white/95 p-3 text-[#121212] shadow-xl">
        <p className="text-sm font-bold leading-snug">
          {boarding ? (ride.id === "car" ? "Getting into your car…" : `Boarding the ${ride.label.toLowerCase()}…`) : ride.id === "car" ? `Driving to ${place}…` : `On the way to ${place}…`}
        </p>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#e8edf5]">
          <div className="h-full rounded-full bg-[#006B3F]" style={{ width: `${progress * 100}%` }} />
        </div>
        <p className="mt-1.5 text-[11px] font-semibold text-[#5c6b82]">
          {owned ? `Your ${owned.short}` : ride.label} · {owned ? "fuel" : fare} · {left}m left
        </p>
        <p className="mt-1 text-[11px] leading-4 text-[#5c6b82]">
          {boarding ? (ride.id === "car" ? "Keys in. You're getting behind the wheel." : "Door open. Find your seat.") : progress > 0.9 ? `${place} is just ahead.` : sky?.flood ? "The road is under water. Everyone is crawling." : sky?.rain ? RAIN_LINES[line] : sky?.harmattan ? "Harmattan haze. The city is a pale gold and the morning is cool." : (ride.id === "car" ? DRIVE_LINES : LINES)[line]}
        </p>
        <div className="mt-2.5 flex gap-2">
          {onMap ? (
            <button type="button" onClick={onMap} className="flex-1 rounded-full bg-[#f4f7fb] px-3 py-2 text-xs font-bold text-[#243044]">
              Map
            </button>
          ) : (
            <button type="button" onClick={onBack} className="flex-1 rounded-full bg-[#f4f7fb] px-3 py-2 text-xs font-bold text-[#243044]">
              Back
            </button>
          )}
          <button type="button" onClick={finish} className="flex flex-1 items-center justify-center gap-1 rounded-full bg-[#121212] px-3 py-2 text-xs font-bold text-white">
            Skip <span aria-hidden>››</span>
          </button>
        </div>
      </div>

      <div className="absolute bottom-[max(5.5rem,calc(env(safe-area-inset-bottom)+4.8rem))] left-1/2 z-10 flex -translate-x-1/2 gap-1.5 rounded-full bg-[#121212]/75 p-1 shadow-lg backdrop-blur">
        {(
          [
            ["chase", "Outside"],
            ["cabin", "Cabin"],
            ["selfie", "Seat"],
          ] as const
        ).map(([id, label]) => (
          <button key={id} type="button" onClick={() => setCamera(id)} className={`rounded-full px-3 py-1.5 text-[11px] font-bold ${camera === id ? "bg-white text-[#121212]" : "text-white/85"}`}>
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

function Vehicle({
  ride,
  life,
  face,
  night,
  chase,
  slogan,
}: {
  ride: Ride["id"];
  life: Life;
  face: 1 | -1;
  night?: boolean;
  chase?: boolean;
  slogan?: string;
}) {
  const rider = <IsoHuman skin={life.look.skin} shirt={life.look.cloth} hair={life.look.hair} cloth={life.look.cloth} pose="idle" face={face} className="h-full" />;
  if (chase && ride !== "okada" && ride !== "trek") {
    const body =
      ride === "trotro" ? "chase-van" : ride === "train" ? "chase-coach" : ride === "car" ? "chase-private" : "chase-taxi";
    return (
      <div className={`chase-car ${body} ${night ? "ride-lit" : ""}`}>
        <span className="chase-roof" />
        <span className="chase-window" />
        <span className="chase-bumper" />
        <span className="chase-light chase-light-l" />
        <span className="chase-light chase-light-r" />
        {slogan ? <span className="chase-slogan">{slogan}</span> : null}
        <span className="chase-wheel chase-wheel-l" />
        <span className="chase-wheel chase-wheel-r" />
        <span className="chase-rider">{rider}</span>
      </div>
    );
  }
  if (ride === "trotro") {
    return (
      <div className={`van ${night ? "ride-lit" : ""}`}>
        <span className="van-stripe" />
        <span className="van-cab" />
        <span className="van-glass">{rider}</span>
        <span className="van-glass" />
        <span className="van-glass" />
        <span className="van-board">{slogan || "NO CONDITION IS PERMANENT"}</span>
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
    const paint = life.car?.color || carOf(life.car?.id)?.paint || "#2f3a4a";
    return (
      <div className={`cab ${night ? "ride-lit" : ""}`} style={{ background: paint }}>
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
        {slogan ? <span className="cab-slogan">{slogan}</span> : null}
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
  const performance = shiftPerformance(life);
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
        <p className="mt-1 text-[11px] leading-4 text-white/70">{shiftNote(life)}</p>
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
  { at: 0, phase: "boarding", line: "Boarding. Find your seat and stow the bag." },
  { at: 0.12, phase: "taxi", line: "Doors closed. Taxiing to the runway." },
  { at: 0.22, phase: "climb", line: "Climbing out over the city." },
  { at: 0.4, phase: "cruise", line: "Cruising. Come — have your meal." },
  { at: 0.55, phase: "cruise", line: "The man beside you is reading the wrong newspaper out loud." },
  { at: 0.7, phase: "cruise", line: "Soft drink or malt. Clouds under the wing." },
  { at: 0.85, phase: "descent", line: "Seatbelts on. We're starting our descent." },
  { at: 0.94, phase: "land", line: "Touchdown." },
] as const;

function iata(name: string) {
  if (/kumasi/i.test(name)) return "KMS";
  if (/kotoka|accra/i.test(name)) return "ACC";
  return name.slice(0, 3).toUpperCase();
}

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
  const code = iata(from);
  const dest = iata(to);
  const phase = beat.phase as FlightPhase;
  const air = phase === "climb" || phase === "cruise" || phase === "descent";
  const night = accraHour() >= 18 || accraHour() < 6;
  const spoken = phase === "land" ? `Touchdown. Welcome to ${to.split(" ")[0]}.` : beat.line;

  useEffect(() => {
    if (air && !lockedAir.current) {
      lockedAir.current = true;
      setCam("outside");
    }
  }, [air]);

  return (
    <div className="absolute inset-0 z-50 overflow-hidden bg-[#9ec8e8]">
      {cam === "outside" ? <FlightOutside phase={phase} progress={gone} night={night} /> : null}
      {cam === "cabin" ? <CabinView /> : null}
      {cam === "seat" ? <Seatback from={code} to={dest} line={spoken} minutes={minutes} gone={gone} /> : null}

      <div className="absolute right-3 top-[max(4.8rem,calc(env(safe-area-inset-top)+4rem))] z-10 w-[min(230px,58vw)] rounded-2xl bg-[#12141c]/90 p-3 text-white shadow-xl">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#f5c518]">Passion Airways</p>
        <div className="mt-1 flex items-start justify-between gap-2">
          <p className="text-sm font-semibold">OP 204 · {cabin}</p>
          <p className="text-xs font-bold text-white">
            {code} → {dest}
          </p>
        </div>
        <p className="text-[11px] text-white/65">9G-PAD</p>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/15">
          <div className="h-full rounded-full bg-[#f5c518]" style={{ width: `${Math.max(6, gone * 100)}%` }} />
        </div>
        <p className="mt-2 text-xs font-semibold text-white/90">
          {phase === "boarding" ? "Boarding" : phase === "land" ? "Arrived" : `${left} min to landing`}
        </p>
        <p className="mt-2 text-xs leading-5 text-white/85">{spoken}</p>
        <p className="mt-1 text-[11px] text-white/55">Fare {cedis(fare)}</p>
        <div className="mt-2 flex gap-2">
          <button type="button" onClick={finish} className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-[#121212]">
            Skip ›
          </button>
          <button type="button" onClick={onBack} className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold">
            Leave gate
          </button>
        </div>
      </div>

      <div className="absolute bottom-[max(5.4rem,calc(env(safe-area-inset-bottom)+4.6rem))] left-1/2 z-10 flex -translate-x-1/2 gap-1 rounded-full bg-[#12141c]/80 p-1 shadow-lg">
        {(
          [
            ["outside", "Outside"],
            ["cabin", "Cabin"],
            ["seat", "My seat"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setCam(id)}
            className={`rounded-full px-3 py-1.5 text-xs font-bold ${cam === id ? "bg-white text-[#121212]" : "text-white"}`}
          >
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

function CabinView() {
  return (
    <div className="flight-cabin-3d">
      <div className="flight-cabin-3d-tunnel">
        <div className="flight-windows" />
        <div className="flight-cabin-3d-ceiling" />
        <div className="flight-bins" />
        <div className="flight-cabin-3d-floor" />
        <p className="flight-exit">EXIT</p>
        {Array.from({ length: 7 }, (_, row) => {
          const pax = CABIN_PAX[row % CABIN_PAX.length];
          const other = CABIN_PAX[(row + 2) % CABIN_PAX.length];
          const depth = 6 + row * 11;
          return (
            <div key={row} className="flight-cabin-3d-row" style={{ bottom: `${depth}%`, transform: `translateX(-50%) scale(${1.15 - row * 0.12})` }}>
              <span className="flight-cabin-3d-bench">
                <Head skin={pax.skin} hair={pax.hair} shirt={pax.shirt} cloth={row === 0} />
              </span>
              <span className="flight-cabin-3d-gap" />
              <span className={`flight-cabin-3d-bench ${row === 2 ? "flight-cabin-3d-you" : ""}`}>
                <Head skin={row === 2 ? "#8d5a3b" : other.skin} hair={row === 2 ? "#2b2118" : other.hair} shirt={row === 2 ? "#e7c85a" : other.shirt} />
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Head({ skin, hair, shirt, cloth }: { skin: string; hair: string; shirt: string; cloth?: boolean }) {
  return (
    <span className="flight-head">
      <span className="flight-shoulders" style={{ background: cloth ? "repeating-linear-gradient(90deg, #1d4ed8 0 6px, #fff 6px 10px)" : shirt }} />
      <span className="flight-face" style={{ background: skin }} />
      <span className="flight-hair" style={{ background: hair }} />
    </span>
  );
}

function Seatback({ from, to, line, minutes, gone }: { from: string; to: string; line: string; minutes: number; gone: number }) {
  const left = Math.max(1, Math.ceil(minutes * (1 - gone)));
  const caption = gone < 0.12 ? `Boarding · ${minutes} min flight` : line;
  return (
    <div className="flight-seat">
      <div className="flight-seat-shell">
        <div className="flight-ife">
          <svg viewBox="0 0 220 150" className="h-full w-full" aria-hidden>
            <rect width="220" height="150" rx="14" fill="#0c3d32" />
            <circle cx="108" cy="96" r="70" fill="none" stroke="#1c6b4e" strokeWidth="14" />
            <path d="M46 108 Q108 24 178 88" fill="none" stroke="#e7f8d8" strokeWidth="3" strokeDasharray="5 4" />
            <circle cx="46" cy="108" r="5" fill="#f5c518" />
            <circle cx="178" cy="88" r="5" fill="#ffffff" />
            <text x="28" y="132" fill="#ffffff" fontSize="13" fontFamily="sans-serif">
              {from}
            </text>
            <text x="156" y="112" fill="#ffffff" fontSize="16" fontWeight="700" fontFamily="sans-serif">
              {to}
            </text>
          </svg>
          <p className="flight-ife-caption">{caption}</p>
          <p className="flight-ife-sub">{to} · {left} min</p>
        </div>
        <div className="flight-seat-pocket" />
      </div>
      <div className="flight-seat-window" />
    </div>
  );
}
