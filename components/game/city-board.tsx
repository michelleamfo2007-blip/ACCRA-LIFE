"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore, memo, type PointerEvent as ReactPointerEvent } from "react";
import { happeningsAt, heatLabel, type Heat } from "@/lib/game/happenings";
import { npcsAt, phaseEmoji, type NpcLive } from "@/lib/game/npcs";
import { roadPath, ROADS_X, ROADS_Y } from "@/lib/game/roads";
import { weatherAt } from "@/lib/game/sky";
import { roadTone, spotMatches, spotOnMap, townOf, type TownId, type TownSkin } from "@/lib/game/towns";
import { SPOTS, type Spot } from "@/lib/game/world";

const WORLD = { w: 2000, h: 1400 };
const MIN_Z = 0.42;
const MAX_Z = 2.4;

type View = { x: number; y: number; z: number };

const TRAFFIC = makeTraffic(false);
const TRAFFIC_LITE = makeTraffic(true);

type Kind = "house" | "shop" | "chop" | "block" | "tower" | "church" | "stall" | "club" | "bare";
type Bld = { x: number; y: number; kind: Kind; hue: number; w: number };
type Flora = "palm" | "coconut" | "mango" | "neem" | "flame" | "cassia" | "baobab" | "shrub" | "hedge" | "grass";
type Plant = { x: number; y: number; kind: Flora; s: number; glow?: boolean };
type LeafMood = "day" | "morning" | "evening" | "night" | "dust" | "rain";
type DayPhase = "morning" | "midday" | "evening" | "night";
type FolkRole = "walk" | "hawker" | "load" | "kid";
type Folk = { x: number; y: number; role: FolkRole; shirt: string; skin: string };
type Parked = { x: number; y: number; axis: "h" | "v"; color: string; kind: TrafficCar["kind"] };
type Filler = { x: number; y: number; kind: "garden" | "kiosk" };

const KINDS: Kind[] = ["house", "house", "house", "shop", "shop", "chop", "block", "block", "tower", "church", "stall", "club", "bare", "house"];
const WALLS = ["#f7f1e6", "#f3d7c4", "#f6e27a", "#d7e4c8", "#c5d4ea", "#efe6d4"];
const ROOFS = ["#c4784a", "#8d4d3a", "#7a8490", "#6d8f4e", "#b08968", "#9aa3ad"];
const SIDES = ["#e4d8c4", "#e0c2ac", "#e6d48a", "#c5d4b4", "#b7c6dc", "#ddd4c0"];

function widthFor(kind: Kind, n: number) {
  const base = kind === "stall" ? 44 : kind === "shop" || kind === "chop" ? 68 : kind === "tower" || kind === "church" ? 54 : 60;
  return base + (roll(n + 8) % 3) * 6;
}

const CITY = makeCity();
const TREES = makeTrees();
const CITY_LITE = CITY.filter((_, index) => index % 2 === 0);
const TREES_LITE = TREES.filter((tree, index) => index % 3 === 0 || TREES.findIndex((other) => other.kind === tree.kind) === index);

export const BOARDS: { id: string; x: number; y: number; fill: string; road: string; text: string; price: number; mega?: boolean }[] = [
  { id: "oxford", x: 200, y: 250, fill: "#1f7a4d", road: "Oxford Street", text: "Waakye open", price: 80 },
  { id: "liberation", x: 520, y: 200, fill: "#121212", road: "Liberation Road", text: "Highlife tonight", price: 80 },
  { id: "osu", x: 760, y: 300, fill: "#8d3b2f", road: "Osu", text: "Osu after 8", price: 80 },
  { id: "independence", x: 1040, y: 420, fill: "#355f86", road: "Independence Avenue", text: "Live Accra.", price: 120, mega: true },
  { id: "labadi", x: 1280, y: 520, fill: "#1f7a4d", road: "Labadi beach road", text: "Labadi Sunday", price: 120, mega: true },
  { id: "spintex", x: 360, y: 640, fill: "#121212", road: "Spintex Road", text: "MoMo ready", price: 80 },
  { id: "cantonments", x: 980, y: 820, fill: "#8d3b2f", road: "Cantonments", text: "Jollof still hot", price: 80 },
  { id: "labone", x: 1500, y: 760, fill: "#355f86", road: "Labone", text: "Kente in stock", price: 80 },
  { id: "adabraka", x: 640, y: 980, fill: "#1f7a4d", road: "Adabraka", text: "Trotro this way", price: 80 },
  { id: "airport", x: 1700, y: 280, fill: "#121212", road: "Airport road", text: "ECG, hold on", price: 80 },
];

const FOLK = makeFolk();
const FOLK_LITE = FOLK.filter((_, index) => index % 2 === 0);
const PARKED = makeParked();
const PARKED_LITE = PARKED.filter((_, index) => index % 2 === 0);
const FILLERS = makeFillers();

function applyTransform(node: HTMLElement, view: View) {
  node.style.transform = `translate3d(${view.x}px, ${view.y}px, 0) scale(${view.z})`;
}

export const CityBoard = memo(function CityBoard({
  filter,
  boards = true,
  night = false,
  ads = {},
  active = null,
  at,
  town = "accra",
  query = "",
  stars = [],
  player = null,
  aim = null,
  transport = false,
  onSelect,
  onBoard,
  onPan,
}: {
  filter: string;
  boards?: boolean;
  night?: boolean;
  ads?: Record<string, string>;
  active?: string | null;
  at?: Date;
  town?: string;
  query?: string;
  stars?: string[];
  player?: { x: number; y: number; name: string } | null;
  aim?: { x: number; y: number } | null;
  transport?: boolean;
  onSelect: (id: string) => void;
  onBoard?: (id: string) => void;
  onPan?: () => void;
}) {
  const onPanRef = useRef(onPan);
  onPanRef.current = onPan;
  const boardRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  const floorZ = useRef(MIN_Z);
  const size = useRef({ w: 0, h: 0 });
  const viewRef = useRef<View>({ x: -160, y: -40, z: 0.72 });
  const drag = useRef<{ x: number; y: number; px: number; py: number } | null>(null);
  const pinch = useRef<{ dist: number; z: number; view: View } | null>(null);
  const points = useRef(new Map<number, { x: number; y: number }>());
  const moved = useRef(false);
  const frame = useRef(0);
  const pending = useRef<View | null>(null);
  const [picked, setPicked] = useState<Bld | null>(null);
  const rectCache = useRef({ left: 0, top: 0, w: 0, h: 0, at: 0 });
  const lite = useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia("(max-width: 760px), (pointer: coarse)");
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => window.matchMedia("(max-width: 760px), (pointer: coarse)").matches,
    () => false,
  );

  const vibes = useMemo(() => {
    const when = at ?? new Date();
    const map = new Map<string, { emoji: string; line: string; heat: Heat }>();
    for (const spot of SPOTS) {
      if (spot.soon || spot.id === "home") continue;
      const top = happeningsAt(spot.id, when)[0];
      if (top) map.set(spot.id, { emoji: top.emoji, line: top.line, heat: top.heat });
    }
    return map;
  }, [at]);

  function boardRect() {
    const now = performance.now();
    if (now - rectCache.current.at < 120 && rectCache.current.w) return rectCache.current;
    const node = boardRef.current;
    if (!node) return rectCache.current;
    const rect = node.getBoundingClientRect();
    rectCache.current = { left: rect.left, top: rect.top, w: rect.width, h: rect.height, at: now };
    return rectCache.current;
  }

  function paint(next: View) {
    const clamped = clampView(next, size.current.w, size.current.h);
    viewRef.current = clamped;
    const node = worldRef.current;
    if (node) applyTransform(node, clamped);
  }

  function show(next: View) {
    pending.current = next;
    if (frame.current) return;
    frame.current = requestAnimationFrame(() => {
      frame.current = 0;
      const queued = pending.current;
      pending.current = null;
      if (queued) paint(queued);
    });
  }

  useEffect(() => {
    const node = boardRef.current;
    if (!node) return;
    let first = true;
    const measure = () => {
      const rect = node.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      size.current = { w: rect.width, h: rect.height };
      rectCache.current = { left: rect.left, top: rect.top, w: rect.width, h: rect.height, at: performance.now() };
      floorZ.current = fitZoom(rect.width, rect.height);
      if (first) {
        first = false;
        const close = rect.width < 760;
        const z = close ? 0.95 : 0.72;
        const focusX = close ? 860 : 1000;
        const focusY = close ? 560 : 680;
        paint({ z, x: rect.width / 2 - focusX * z, y: rect.height / 2 - focusY * z });
        return;
      }
      paint({ ...viewRef.current, z: Math.max(floorZ.current, viewRef.current.z) });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => {
      observer.disconnect();
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, []);

  const townId = (town === "kumasi" ? "kumasi" : "accra") as TownId;
  const skin = townOf(townId).skin;

  useEffect(() => {
    const node = boardRef.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const z = Math.max(floorZ.current, rect.width < 760 ? 0.95 : 0.72);
    paint({ z, x: rect.width / 2 - skin.focus.x * z, y: rect.height / 2 - skin.focus.y * z });
  }, [townId]);

  useEffect(() => {
    const node = boardRef.current;
    if (!node) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      onPanRef.current?.();
      const box = boardRect();
      show(zoomToward(viewRef.current, event.clientX - box.left, event.clientY - box.top, viewRef.current.z * (event.deltaY < 0 ? 1.12 : 0.89), floorZ.current));
    };
    const stopGesture = (event: Event) => event.preventDefault();
    node.addEventListener("wheel", onWheel, { passive: false });
    node.addEventListener("gesturestart", stopGesture);
    node.addEventListener("gesturechange", stopGesture);
    return () => {
      node.removeEventListener("wheel", onWheel);
      node.removeEventListener("gesturestart", stopGesture);
      node.removeEventListener("gesturechange", stopGesture);
    };
  }, []);

  function zoomBy(factor: number) {
    const { w, h } = size.current;
    paint(zoomToward(viewRef.current, w / 2, h / 2, viewRef.current.z * factor, floorZ.current));
  }

  function zoomOutAll() {
    const { w, h } = size.current;
    const z = floorZ.current;
    paint({ z, x: (w - WORLD.w * z) / 2, y: (h - WORLD.h * z) / 2 });
  }

  function setDragging(on: boolean) {
    const node = worldRef.current;
    if (!node) return;
    node.style.pointerEvents = on ? "none" : "";
  }

  function release(event: ReactPointerEvent<HTMLDivElement>) {
    points.current.delete(event.pointerId);
    if (points.current.size < 2) pinch.current = null;
    if (points.current.size === 0) {
      drag.current = null;
      setDragging(false);
    } else if (points.current.size === 1) {
      const left = [...points.current.values()][0];
      drag.current = { x: left.x, y: left.y, px: viewRef.current.x, py: viewRef.current.y };
    }
  }

  const start = viewRef.current;

  return (
    <div
      ref={boardRef}
      className="absolute inset-0 cursor-grab touch-none select-none overflow-clip bg-[#b7d48c] active:cursor-grabbing"
      style={{ WebkitUserSelect: "none", WebkitTouchCallout: "none", touchAction: "none" }}
      onPointerDown={(event) => {
        if ((event.target as Element).closest("[data-zoom]")) return;
        points.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
        if (points.current.size === 1) {
          moved.current = false;
          drag.current = { x: event.clientX, y: event.clientY, px: viewRef.current.x, py: viewRef.current.y };
          pinch.current = null;
        } else {
          moved.current = true;
          drag.current = null;
          setDragging(true);
          const pair = [...points.current.values()];
          pinch.current = { dist: Math.hypot(pair[0].x - pair[1].x, pair[0].y - pair[1].y) || 1, z: viewRef.current.z, view: viewRef.current };
          for (const id of points.current.keys()) {
            try {
              event.currentTarget.setPointerCapture(id);
            } catch {}
          }
        }
      }}
      onPointerMove={(event) => {
        if (!points.current.has(event.pointerId)) return;
        points.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
        if (points.current.size >= 2 && pinch.current) {
          const box = boardRect();
          const pair = [...points.current.values()];
          const dist = Math.hypot(pair[0].x - pair[1].x, pair[0].y - pair[1].y) || 1;
          const midX = (pair[0].x + pair[1].x) / 2 - box.left;
          const midY = (pair[0].y + pair[1].y) / 2 - box.top;
          show(zoomToward(pinch.current.view, midX, midY, pinch.current.z * (dist / pinch.current.dist), floorZ.current));
          return;
        }
        if (!drag.current) return;
        const dx = event.clientX - drag.current.x;
        const dy = event.clientY - drag.current.y;
        if (!moved.current && Math.hypot(dx, dy) < 6) return;
        if (!moved.current) {
          moved.current = true;
          setDragging(true);
          try {
            event.currentTarget.setPointerCapture(event.pointerId);
          } catch {}
        }
        onPanRef.current?.();
        show({ z: viewRef.current.z, x: drag.current.px + dx, y: drag.current.py + dy });
      }}
      onPointerUp={release}
      onPointerCancel={release}
      onLostPointerCapture={(event) => {
        if (points.current.has(event.pointerId) && event.buttons === 0) release(event);
      }}
      onClickCapture={(event) => {
        if (!moved.current) return;
        moved.current = false;
        event.stopPropagation();
        event.preventDefault();
      }}
      onDoubleClick={(event) => {
        if ((event.target as Element).closest("button, [data-board]")) return;
        const box = boardRect();
        paint(zoomToward(viewRef.current, event.clientX - box.left, event.clientY - box.top, viewRef.current.z * 1.35, floorZ.current));
      }}
    >
      <div
        ref={worldRef}
        className="absolute left-0 top-0 origin-top-left will-change-transform [contain:strict] [backface-visibility:hidden]"
        style={{
          width: WORLD.w,
          height: WORLD.h,
          transform: `translate3d(${start.x}px, ${start.y}px, 0) scale(${start.z})`,
        }}
      >
        <CityArt night={night} boards={boards && townId === "accra"} ads={ads} onBoard={onBoard} lite={lite} town={townId} at={at ?? new Date()} onPick={setPicked} />
        {transport ? <TransitLayer town={townId} /> : null}
        {player && aim ? <DirectionLine from={player} to={aim} /> : null}
        <SpotPins filter={filter} active={active} vibes={vibes} onSelect={onSelect} lite={lite} town={townId} query={query} stars={stars} />
        <HustleLayer lite={lite} town={townId} />
        {player ? <PlayerPin name={player.name} x={player.x} y={player.y} /> : null}
      </div>
      {picked ? <BuildingCard building={picked} onClose={() => setPicked(null)} /> : null}
      <div data-zoom className="absolute bottom-[max(7.5rem,calc(env(safe-area-inset-bottom)+6.5rem))] right-3 z-30 flex flex-col gap-2">
        <button type="button" aria-label="Zoom in" onClick={() => zoomBy(1.25)} className="grid h-11 w-11 place-items-center rounded-full bg-white text-xl font-bold shadow-lg">
          +
        </button>
        <button type="button" aria-label="Zoom out" onClick={() => zoomBy(0.8)} className="grid h-11 w-11 place-items-center rounded-full bg-white text-xl font-bold shadow-lg">
          −
        </button>
        <button type="button" aria-label="Show the whole city" onClick={zoomOutAll} className="grid h-11 w-11 place-items-center rounded-full bg-white text-base font-bold shadow-lg">
          ⤢
        </button>
      </div>
    </div>
  );
});

function HustleLayer({ lite, town }: { at?: Date; lite: boolean; town: TownId }) {
  const locals = town === "accra" ? null : townOf(town).people;
  const [live, setLive] = useState<NpcLive[]>(() => npcsAt());
  useEffect(() => {
    if (town !== "accra") return;
    const pulse = () => setLive(npcsAt());
    pulse();
    const id = window.setInterval(pulse, lite ? 2000 : 1000);
    return () => window.clearInterval(id);
  }, [lite, town]);
  if (locals) {
    return (
      <>
        {locals.map((npc) => (
          <div key={npc.id} className="pointer-events-none absolute z-[12] flex -translate-x-1/2 -translate-y-full flex-col items-center" style={{ left: npc.x, top: npc.y }} title={npc.line}>
            <span className="mb-0.5 max-w-[8rem] truncate rounded-full bg-[#FCD116] px-2 py-0.5 text-[9px] font-bold text-[#121212] shadow-sm">{npc.line}</span>
            <span className="grid h-7 w-7 place-items-center rounded-full text-[11px] font-bold text-white shadow ring-2 ring-white/80" style={{ background: npc.shirt }}>
              {npc.name.slice(0, 1)}
            </span>
          </div>
        ))}
      </>
    );
  }
  return (
    <>
      {live.map((npc) => (
        <NpcPin key={npc.id} npc={npc} lite={lite} />
      ))}
    </>
  );
}

function PlayerPin({ name, x, y }: { name: string; x: number; y: number }) {
  return (
    <div className="pointer-events-none absolute z-[18] flex -translate-x-1/2 -translate-y-full flex-col items-center" style={{ left: x, top: y }}>
      <span className="mb-0.5 rounded-full bg-[#006B3F] px-2 py-0.5 text-[9px] font-bold text-white shadow">You</span>
      <span className="grid h-8 w-8 place-items-center rounded-full border-2 border-[#FCD116] bg-[#121212] text-[11px] font-bold text-white">{name.slice(0, 1)}</span>
    </div>
  );
}

function DirectionLine({ from, to }: { from: { x: number; y: number }; to: { x: number; y: number } }) {
  const points = roadPath(from, to);
  const d = points.map((point, index) => `${index === 0 ? "M" : "L"}${point.x} ${point.y}`).join(" ");
  return (
    <svg viewBox={`0 0 ${WORLD.w} ${WORLD.h}`} className="pointer-events-none absolute inset-0 h-full w-full">
      <path d={d} fill="none" stroke="#006B3F" strokeWidth="6" strokeLinecap="round" strokeDasharray="14 10" />
    </svg>
  );
}

function TransitLayer({ town }: { town: TownId }) {
  const city = townOf(town);
  return (
    <svg viewBox={`0 0 ${WORLD.w} ${WORLD.h}`} className="pointer-events-none absolute inset-0 h-full w-full">
      {city.lines.map((line) => (
        <g key={line.id}>
          <polyline points={line.points.map((point) => `${point.x},${point.y}`).join(" ")} fill="none" stroke={line.color} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.9" />
          <text x={line.points[0].x + 8} y={line.points[0].y - 10} fill="#121212" fontSize="12" fontWeight="700" fontFamily="ui-sans-serif">
            {line.name}
          </text>
        </g>
      ))}
      {city.taxis.map((stop) => (
        <g key={stop.name}>
          <circle cx={stop.x} cy={stop.y} r="8" fill="#FCD116" stroke="#121212" />
          <text x={stop.x + 12} y={stop.y + 4} fill="#121212" fontSize="11" fontWeight="700" fontFamily="ui-sans-serif">
            Taxi · {stop.name}
          </text>
        </g>
      ))}
      {city.okada.map((zone) => (
        <g key={zone.name}>
          <rect x={zone.x - 18} y={zone.y - 12} width="36" height="24" rx="6" fill="none" stroke="#CE1126" strokeDasharray="4 3" />
          <text x={zone.x + 22} y={zone.y + 4} fill="#CE1126" fontSize="11" fontWeight="700" fontFamily="ui-sans-serif">
            Okada · {zone.name}
          </text>
        </g>
      ))}
      {city.stops.map((stop) => (
        <g key={stop.name}>
          <rect x={stop.x - 5} y={stop.y - 5} width="10" height="10" fill="#006B3F" />
          <text x={stop.x + 10} y={stop.y + 4} fill="#006B3F" fontSize="11" fontWeight="700" fontFamily="ui-sans-serif">
            {stop.name}
          </text>
        </g>
      ))}
    </svg>
  );
}

const NpcPin = memo(function NpcPin({ npc, lite }: { npc: NpcLive; lite: boolean }) {
  const sleeping = npc.phase === "sleep";
  return (
    <div
      className={`pointer-events-none absolute z-[12] flex -translate-x-1/2 -translate-y-full flex-col items-center transition-[left,top] duration-1000 ease-linear ${sleeping ? "opacity-55" : ""}`}
      style={{ left: npc.x, top: npc.y }}
      title={`${npc.name} · ${npc.label}`}
    >
      <span
        className={`mb-0.5 max-w-[7.5rem] truncate rounded-full px-2 py-0.5 text-[9px] font-bold shadow-sm ${
          npc.moving ? "bg-[#FCD116] text-[#121212]" : npc.phase === "night_out" ? "bg-[#7c3aed] text-white" : npc.phase === "work" ? "bg-[#006B3F] text-white" : "bg-[#121212]/85 text-white"
        }`}
      >
        {phaseEmoji(npc.phase)} {lite ? npc.name : `${npc.name} · ${npc.label}`}
      </span>
      <span
        className={`grid h-7 w-7 place-items-center rounded-full text-[11px] font-bold text-white shadow ring-2 ring-white/80 ${npc.moving ? "npc-hustle-walk" : ""}`}
        style={{ background: npc.shirt, boxShadow: `0 0 0 2px ${npc.skin}` }}
      >
        {npc.name.slice(0, 1)}
      </span>
    </div>
  );
});

const GROUPS = new Set(["all", "home", "hang", "sea", "civic", "work", "trip", "soon"]);

const SpotPins = memo(function SpotPins({
  filter,
  active,
  vibes,
  onSelect,
  lite,
  town,
  query,
  stars,
}: {
  filter: string;
  active: string | null;
  vibes: Map<string, { emoji: string; line: string; heat: Heat }>;
  onSelect: (id: string) => void;
  lite: boolean;
  town: TownId;
  query: string;
  stars: string[];
}) {
  return (
    <>
      {SPOTS.map((spot) => {
        if (!spotOnMap(spot, town)) return null;
        if (filter === "stars" && !stars.includes(spot.id)) return null;
        const matched = spotMatches(spot, filter, query);
        if (!matched && (query.trim() || !GROUPS.has(filter))) return null;
        const faded = !matched && filter !== "all";
        const open = active === spot.id;
        const vibe = vibes.get(spot.id) ?? null;
        const tag = spot.soon
          ? `${spot.name} · Coming soon`
          : spot.far
            ? `${spot.name} · ${Math.round(spot.far / 60)}h`
            : vibe && vibe.heat !== "quiet"
              ? `${spot.name} · ${heatLabel(vibe.heat)}`
              : spot.name;
        return (
          <button
            key={spot.id}
            type="button"
            onClick={() => onSelect(spot.id)}
            title={vibe ? `${spot.name} — ${vibe.line}` : spot.name}
            aria-label={spot.name}
            aria-pressed={open}
            className={`absolute z-10 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center ${faded ? "opacity-30" : ""} ${open ? "z-20" : ""}`}
            style={{ left: spot.x, top: spot.y }}
          >
            {open ? (
              <span
                className={`flex max-w-[14rem] items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[12px] font-semibold ${
                  spot.soon ? "bg-[#f5c542] text-[#121212]" : spot.far ? "bg-[#7a3b0c] text-white" : vibe?.heat === "packed" ? "bg-[#121212] text-[#FCD116]" : "bg-white text-[#121212]"
                }`}
              >
                <span className="text-base leading-none">{vibe?.emoji ?? spot.emoji}</span>
                <span className="truncate">{tag}</span>
              </span>
            ) : (
              <>
                <span
                  className={`grid h-8 w-8 place-items-center rounded-full text-base ring-2 ${
                    vibe?.heat === "packed" ? "bg-[#121212] text-lg ring-[#FCD116]" : vibe?.heat === "busy" ? "bg-[#fff4c2] ring-[#f5c542]" : "bg-white ring-black/10"
                  }`}
                >
                  {spot.emoji}
                </span>
                <span className="mt-1 max-w-[6.5rem] truncate rounded-full bg-[#121212]/78 px-2 py-0.5 text-center text-[10px] font-bold leading-tight text-white">
                  {spot.name}
                </span>
                {!lite && vibe && vibe.heat !== "quiet" ? (
                  <span className={`mt-0.5 rounded-full px-1.5 py-px text-[9px] font-bold uppercase tracking-wide ${vibe.heat === "packed" ? "bg-[#FCD116] text-[#121212]" : "bg-white/90 text-[#7a3b0c]"}`}>
                    {heatLabel(vibe.heat)}
                  </span>
                ) : null}
              </>
            )}
          </button>
        );
      })}
    </>
  );
});

function fitZoom(width: number, height: number) {
  return Math.min(MIN_Z, Math.max(0.18, Math.min(width / WORLD.w, height / WORLD.h)));
}

function clampView(view: View, width: number, height: number): View {
  if (!width || !height) return view;
  const w = WORLD.w * view.z;
  const h = WORLD.h * view.z;
  const pad = 80;
  const x = w + pad * 2 <= width ? (width - w) / 2 : Math.min(pad, Math.max(width - w - pad, view.x));
  const y = h + pad * 2 <= height ? (height - h) / 2 : Math.min(pad, Math.max(height - h - pad, view.y));
  return { z: view.z, x, y };
}

function zoomToward(view: View, originX: number, originY: number, nextZ: number, floor = MIN_Z): View {
  const z = Math.min(MAX_Z, Math.max(floor, nextZ));
  const wx = (originX - view.x) / view.z;
  const wy = (originY - view.y) / view.z;
  return { z, x: originX - wx * z, y: originY - wy * z };
}

function roll(n: number) {
  return Math.abs((n * 1103515245 + 12345) % 997);
}

const CityArt = memo(function CityArt({
  night,
  boards,
  ads,
  onBoard,
  lite = false,
  town,
  at,
  onPick,
}: {
  night: boolean;
  boards: boolean;
  ads: Record<string, string>;
  onBoard?: (id: string) => void;
  lite?: boolean;
  town: TownId;
  at: Date;
  onPick?: (building: Bld) => void;
}) {
  const buildings = lite ? CITY_LITE : CITY;
  const trees = lite ? TREES_LITE : TREES;
  const skin = townOf(town).skin;
  const sky = weatherAt(at, town);
  const hour = at.getUTCHours();
  const phase = dayPhase(hour, night);
  const mood: LeafMood = phase === "night" ? "night" : sky.harmattan ? "dust" : sky.rain ? "rain" : phase === "morning" ? "morning" : phase === "evening" ? "evening" : "day";
  const people = lite ? FOLK_LITE : FOLK;
  const parked = lite ? PARKED_LITE : PARKED;
  return (
    <svg viewBox={`0 0 ${WORLD.w} ${WORLD.h}`} className="h-full w-full" style={{ pointerEvents: boards ? "auto" : "none" }}>
      <rect width={WORLD.w} height={WORLD.h} fill={skin.coast ? (phase === "night" ? skin.groundNight : skin.ground) : inlandFill(phase)} />
      <Hills />
      {skin.coast ? (
        <>
          <path d="M0 1196 C 500 1172, 1000 1212, 1500 1180 C 1800 1164, 2000 1192, 2000 1192 V 1400 H 0 Z" fill={skin.beach} />
          <path d="M0 1296 C 500 1272, 1000 1312, 1500 1280 C 1800 1264, 2000 1292, 2000 1292 V 1400 H 0 Z" fill={skin.sea} />
          <path d="M0 1336 C 500 1316, 1000 1352, 1500 1320 C 1800 1306, 2000 1332, 2000 1332 V 1400 H 0 Z" fill={skin.deep} />
        </>
      ) : (
        <InlandPatches phase={phase} />
      )}
      {skin.lake && skin.coast ? (
        <>
          <ellipse cx={skin.lake.x} cy={skin.lake.y} rx="168" ry="70" fill="#7ec4e4" />
          <ellipse cx={skin.lake.x} cy={skin.lake.y} rx="118" ry="44" fill="#c5e9f6" />
        </>
      ) : null}
      {skin.lake && !skin.coast ? <Bosomtwe phase={phase} /> : null}
      <CityPark phase={phase} />
      <StreetGrid at={at} skin={skin} />
      <ExtraRoads at={at} />
      <RoadWear />
      <Highway x={0} label={skin.west} />
      <Highway x={1904} label={skin.east} />
      <rect x="40" y="458" width="230" height="14" rx="2" fill="#3a414c" />
      <line x1="52" y1="465" x2="258" y2="465" stroke="#FCD116" strokeDasharray="12 8" />
      {FILLERS.map((bit) => (
        <FillerMark key={`${bit.kind}-${bit.x}-${bit.y}`} bit={bit} phase={phase} />
      ))}
      {buildings.map((building) => (
        <Building key={`${building.x}-${building.y}`} building={building} night={night} lite={lite} mood={mood} onPick={onPick} />
      ))}
      {trees.map((tree, index) => (
        <Tree key={`${index}-${tree.kind}`} x={tree.x} y={tree.y} kind={tree.kind} s={tree.s} glow={tree.glow} lite={lite} mood={mood} />
      ))}
      {parked.map((car) => (
        <MapCar key={`park-${car.x}-${car.y}`} x={car.x} y={car.y} axis={car.axis} dir={1} kind={car.kind} color={car.color} />
      ))}
      {people.map((person) => (
        <Person key={`${person.role}-${person.x}-${person.y}`} person={person} phase={phase} />
      ))}
      <Traffic lite={lite} />
      {boards
        ? BOARDS.map((board) => (
            <Board
              key={board.id}
              x={board.x}
              y={board.y}
              fill={board.fill}
              text={ads[board.id] || board.text}
              mega={board.mega}
              onOpen={onBoard ? () => onBoard(board.id) : undefined}
            />
          ))
        : null}
      {phase === "morning" ? <rect width={WORLD.w} height={WORLD.h} fill="#ffb35c" opacity="0.1" pointerEvents="none" /> : null}
      {phase === "evening" ? <rect width={WORLD.w} height={WORLD.h} fill="#ff8a3d" opacity="0.13" pointerEvents="none" /> : null}
      {phase === "night" ? <rect width={WORLD.w} height={WORLD.h} fill="#24365c" opacity="0.12" pointerEvents="none" /> : null}
      {skin.areas.map((area) => (
        <text key={area.label} x={area.x} y={area.y} textAnchor="middle" fill={phase === "night" ? "#f4efe6" : "#3a3328"} fillOpacity="0.92" fontSize="20" fontWeight="700" letterSpacing="3" fontFamily="ui-sans-serif">
          {area.label}
        </text>
      ))}
      {skin.lake && skin.coast ? (
        <text x={skin.lake.x} y={skin.lake.y + 6} textAnchor="middle" fill="white" fontSize="16" letterSpacing="3" fontFamily="ui-sans-serif">
          {skin.lake.name}
        </text>
      ) : null}
      {skin.lake && !skin.coast ? (
        <text x="560" y="1310" textAnchor="middle" fill="white" fontSize="18" letterSpacing="4" fontFamily="ui-sans-serif">
          BOSOMTWE
        </text>
      ) : null}
      {skin.coast ? (
        <text x="1000" y="1364" textAnchor="middle" fill="white" fontSize="22" letterSpacing="6" fontFamily="ui-sans-serif">
          {skin.seaLabel}
        </text>
      ) : null}
    </svg>
  );
});

function makeCity() {
  const buildings: Bld[] = [];
  let n = 4;
  for (let i = 0; i < ROADS_X.length - 1; i += 1) {
    for (let j = 0; j < ROADS_Y.length - 1; j += 1) {
      if (i === 2 && j === 2) continue;
      if (i === 1 && j === 3) {
        for (let k = 0; k < 3; k += 1) {
          n += 1;
          buildings.push({ x: 540 + k * 72, y: 980, kind: "stall", hue: k % WALLS.length, w: widthFor("stall", n) });
        }
        continue;
      }
      const edge = i === 0 || i === ROADS_X.length - 2 || j === 0 || j === ROADS_Y.length - 2;
      const left = ROADS_X[i] + 36;
      const right = ROADS_X[i + 1] - 36;
      const top = ROADS_Y[j] + 32;
      const bottom = ROADS_Y[j + 1] - 32;
      const cols = edge ? 1 : 2;
      const rows = edge ? 1 : 2;
      for (let row = 0; row < rows; row += 1) {
        for (let col = 0; col < cols; col += 1) {
          n += 1;
          const kind = KINDS[roll(n) % KINDS.length];
          const cw = (right - left) / cols;
          const rh = (bottom - top) / rows;
          const x = left + col * cw + cw * 0.5;
          const y = top + row * rh + rh * 0.7;
          if (Math.hypot(x - 780, y - 620) < 78) continue;
          if (Math.hypot(x - 1120, y - 880) < 72) continue;
          buildings.push({
            x,
            y,
            kind,
            hue: roll(n + 3) % WALLS.length,
            w: widthFor(kind, n),
          });
        }
      }
    }
  }
  return buildings;
}

function makeFolk() {
  const folk: Folk[] = [];
  const skins = ["#8d5524", "#c68642", "#e0ac69", "#6b3e26", "#a67c52", "#5c3317"];
  const shirts = ["#121212", "#FCD116", "#CE1126", "#006B3F", "#f7f4ef", "#3b6ea5"];
  const roles: FolkRole[] = ["walk", "hawker", "load", "walk"];
  let n = 3;
  for (const y of ROADS_Y) {
    for (let x = 160; x < 1860; x += 220) {
      n += 1;
      if (roll(n) % 2 === 0) continue;
      if (ROADS_X.some((cross) => Math.abs(cross - x) < 46)) continue;
      folk.push({
        x: x + (roll(n) % 12),
        y: y + 36,
        role: roles[roll(n) % roles.length],
        shirt: shirts[n % shirts.length],
        skin: skins[n % skins.length],
      });
    }
  }
  for (const building of CITY) {
    n += 1;
    if (building.kind === "house" && roll(n) % 2 === 0) {
      folk.push({ x: building.x + 24, y: building.y + 18, role: "kid", shirt: shirts[n % shirts.length], skin: skins[n % skins.length] });
    } else if (building.kind === "stall") {
      folk.push({ x: building.x + 18, y: building.y + 14, role: "hawker", shirt: "#FCD116", skin: skins[n % skins.length] });
    }
  }
  return folk;
}

function makeParked() {
  const cars: Parked[] = [];
  const colors = ["#f7f4ef", "#1c1917", "#3b82f6", "#CE1126", "#FCD116", "#006B3F"];
  const kinds: Parked["kind"][] = ["private", "private", "taxi", "private"];
  let n = 20;
  ROADS_Y.forEach((y, index) => {
    const band = roadBand(index, "h");
    if (band < 40) return;
    const side = index % 2 === 0 ? 1 : -1;
    for (let x = 200; x < 1780; x += 260) {
      n += 1;
      if (roll(n) % 3 === 0) continue;
      if (ROADS_X.some((cross) => Math.abs(cross - x) < 72)) continue;
      cars.push({ x, y: y + side * (band / 2 - 9), axis: "h", color: colors[n % colors.length], kind: kinds[n % kinds.length] });
    }
  });
  return cars;
}

function makeFillers() {
  const bits: Filler[] = [];
  for (let i = 0; i < ROADS_X.length - 1; i += 1) {
    for (let j = 0; j < ROADS_Y.length - 1; j += 1) {
      if ((i === 2 && j === 2) || (i === 1 && j === 3)) continue;
      const x = (ROADS_X[i] + ROADS_X[i + 1]) / 2;
      const y = (ROADS_Y[j] + ROADS_Y[j + 1]) / 2;
      if (Math.hypot(x - 780, y - 620) < 90 || Math.hypot(x - 1120, y - 880) < 80) continue;
      const edge = i === 0 || i === ROADS_X.length - 2 || j === 0 || j === ROADS_Y.length - 2;
      bits.push(edge ? { x: x - 48, y: y + 18, kind: "garden" } : { x, y, kind: "kiosk" });
    }
  }
  return bits;
}

function makeTrees() {
  const trees: Plant[] = [];
  let n = 11;
  ROADS_Y.forEach((road, index) => {
    const side = index % 2 === 0 ? 48 : -48;
    for (let x = 170; x < 1860; x += 160) {
      n += 1;
      if (ROADS_X.some((cross) => Math.abs(cross - x) < 58)) continue;
      const kind: Flora = road > 1000 ? (n % 2 ? "palm" : "coconut") : n % 3 === 0 ? "mango" : "neem";
      plant(trees, x, road + side, kind, 1.28 + (roll(n) % 3) * 0.1, n);
    }
  });
  ROADS_X.forEach((road, index) => {
    const side = index % 2 === 0 ? 50 : -50;
    for (let y = 210; y < 1100; y += 180) {
      n += 1;
      if (ROADS_Y.some((cross) => Math.abs(cross - y) < 58)) continue;
      plant(trees, road + side, y, n % 2 ? "neem" : "mango", 1.18, n);
    }
  });
  const groves: { x: number; y: number; mix: Flora[] }[] = [
    { x: 500, y: 1100, mix: ["palm", "coconut", "mango", "shrub"] },
    { x: 900, y: 88, mix: ["baobab", "neem", "shrub"] },
    { x: 1280, y: 88, mix: ["baobab", "grass", "shrub"] },
  ];
  for (const grove of groves) {
    for (let k = 0; k < 5; k += 1) {
      n += 1;
      const kind = grove.mix[k % grove.mix.length];
      plant(trees, grove.x + ((k % 3) - 1) * 26, grove.y + Math.floor(k / 3) * 18, kind, kind === "grass" ? 1 : 1.05 + (k % 2) * 0.14, n);
    }
  }
  plant(trees, 930, 760, "grass", 1, n + 3);
  plant(trees, 990, 748, "grass", 0.85, n + 4);
  plant(trees, 610, 1088, "grass", 1, n + 5);
  for (let i = 0; i < 10; i += 1) {
    const angle = (i / 10) * Math.PI * 2;
    plant(trees, 960 + Math.cos(angle) * 92, 760 + Math.sin(angle) * 52, i % 3 === 0 ? "flame" : "mango", 1.05, 80 + i);
  }
  for (const building of CITY) {
    n += 1;
    if (building.kind === "church") {
      plant(trees, building.x - 34, building.y + 10, "flame", 1.05, n);
      plant(trees, building.x + 36, building.y + 12, "cassia", 1, n + 1);
    } else if (building.kind === "stall") {
      plant(trees, building.x + 36, building.y + 8, "mango", 0.95, n);
    }
  }
  for (let i = 0; i < 8; i += 1) plant(trees, 260 + i * 78, 1224, i % 2 ? "palm" : "coconut", 1.05, 210 + i);
  return trees;
}

function onAsphalt(x: number, y: number) {
  if (Math.hypot(x - 780, y - 620) < 54 || Math.hypot(x - 1120, y - 880) < 42) return true;
  for (const road of ROADS_Y) if (Math.abs(y - road) < 30 && x > 16 && x < 1984) return true;
  for (const road of ROADS_X) if (Math.abs(x - road) < 30 && y > 8 && y < 1188) return true;
  return false;
}

function plant(trees: Plant[], x: number, y: number, kind: Flora, s: number, n: number) {
  if (onAsphalt(x, y) || x < 28 || x > 1968 || y < 28 || y > 1340) return;
  trees.push({ x, y, kind, s, glow: roll(n) % 9 === 0 });
}

function dayPhase(hour: number, night: boolean): DayPhase {
  if (night || hour >= 19 || hour < 5) return "night";
  if (hour < 10) return "morning";
  if (hour >= 16) return "evening";
  return "midday";
}

function inlandFill(phase: DayPhase) {
  if (phase === "night") return "#46546e";
  if (phase === "morning") return "#f6e7c8";
  if (phase === "evening") return "#f3d2a4";
  return "#efe6cf";
}

function InlandPatches({ phase }: { phase: DayPhase }) {
  const sand = phase === "night" ? "#8d7b62" : phase === "evening" ? "#e7c49a" : "#f6e6c4";
  const grass = phase === "night" ? "#7ea06a" : phase === "evening" ? "#d7c07a" : "#d7eeb4";
  return (
    <g>
      <ellipse cx="260" cy="500" rx="150" ry="80" fill={sand} />
      <ellipse cx="1480" cy="360" rx="190" ry="70" fill={sand} />
      <ellipse cx="1680" cy="980" rx="160" ry="64" fill={sand} />
      <ellipse cx="640" cy="860" rx="120" ry="56" fill={grass} />
      <ellipse cx="1240" cy="640" rx="100" ry="48" fill={grass} />
      <ellipse cx="360" cy="240" rx="80" ry="36" fill={sand} />
    </g>
  );
}

function Bosomtwe({ phase }: { phase: DayPhase }) {
  const shore = phase === "night" ? "#c4b48a" : "#f3e2c0";
  const water = phase === "night" ? "#2f7594" : "#7ec8e4";
  const deep = phase === "night" ? "#1d5878" : "#b7e6f6";
  return (
    <g>
      <ellipse cx="560" cy="1292" rx="430" ry="96" fill={shore} />
      <ellipse cx="560" cy="1300" rx="370" ry="74" fill={water} />
      <ellipse cx="600" cy="1310" rx="240" ry="42" fill={deep} />
      <path d="M280 1248 C 420 1228, 700 1236, 860 1256 C 760 1272, 420 1276, 280 1248 Z" fill={shore} />
      <g fill={phase === "night" ? "#d7c4a2" : "#f7f1e4"}>
        <polygon points="390,1284 430,1282 424,1292" />
        <polygon points="640,1306 686,1302 676,1314" />
        <polygon points="510,1268 548,1264 540,1276" />
      </g>
    </g>
  );
}

function CityPark({ phase }: { phase: DayPhase }) {
  const lawn = phase === "night" ? "#5d7a52" : "#d7eeb4";
  return (
    <g>
      <ellipse cx="960" cy="760" rx="78" ry="44" fill={lawn} />
      <path d="M900 760 H1020" stroke="#f0e2c4" strokeWidth="4" />
      <path d="M960 728 V794" stroke="#f0e2c4" strokeWidth="3" />
      <rect x="918" y="742" width="16" height="5" rx="1" fill="#c4a574" />
      <rect x="990" y="772" width="16" height="5" rx="1" fill="#c4a574" />
      <Kiosk x={1004} y={734} phase={phase} />
    </g>
  );
}

function roadBand(index: number, axis: "h" | "v") {
  if (axis === "h" && (index === 1 || index === 2)) return 56;
  if (axis === "v" && index === 2) return 58;
  if (axis === "h" && index === 4) return 30;
  if (axis === "v" && (index === 0 || index === 5)) return 32;
  return 44;
}

function StreetGrid({ at, skin }: { at: Date; skin: TownSkin }) {
  return (
    <g>
      {ROADS_Y.map((y, index) => {
        const band = roadBand(index, "h");
        const half = band / 2;
        return (
          <g key={`hy-${y}`}>
            <rect x="28" y={y - half} width="1944" height={band} rx="4" fill="#cfc6b6" />
            <rect x="36" y={y - half + 5} width="1928" height={Math.max(8, band - 10)} rx="3" fill={roadTone(index, at)} />
            <line x1="52" y1={y} x2="1948" y2={y} stroke="#FCD116" strokeWidth="2.2" strokeDasharray="18 16" strokeOpacity="0.85" />
            {band > 36 ? (
              <>
                <line x1="52" y1={y - half + 6} x2="1948" y2={y - half + 6} stroke="white" strokeWidth="1.1" strokeOpacity="0.4" />
                <line x1="52" y1={y + half - 6} x2="1948" y2={y + half - 6} stroke="white" strokeWidth="1.1" strokeOpacity="0.4" />
              </>
            ) : null}
            {skin.roadsH[index] ? (
              <text x="120" y={y - half - 4} fill="white" fillOpacity="0.7" fontSize="11" fontWeight="700" letterSpacing="1.5" fontFamily="ui-sans-serif">
                {skin.roadsH[index]}
              </text>
            ) : null}
          </g>
        );
      })}
      {ROADS_X.map((x, index) => {
        const band = roadBand(index, "v");
        const half = band / 2;
        return (
          <g key={`vx-${x}`}>
            <rect x={x - half} y="20" width={band} height="1160" rx="4" fill="#cfc6b6" />
            <rect x={x - half + 5} y="28" width={Math.max(8, band - 10)} height="1145" rx="3" fill={roadTone(index + 1, at)} />
            <line x1={x} y1="44" x2={x} y2="1168" stroke="#FCD116" strokeWidth="2.2" strokeDasharray="18 16" strokeOpacity="0.85" />
            {band > 36 ? (
              <>
                <line x1={x - half + 6} y1="44" x2={x - half + 6} y2="1168" stroke="white" strokeWidth="1.1" strokeOpacity="0.35" />
                <line x1={x + half - 6} y1="44" x2={x + half - 6} y2="1168" stroke="white" strokeWidth="1.1" strokeOpacity="0.35" />
              </>
            ) : null}
            {skin.roadsV[index] ? (
              <text x={x + half + 8} y="80" transform={`rotate(90 ${x + half + 8} 80)`} fill="white" fillOpacity="0.7" fontSize="11" fontWeight="700" letterSpacing="1.5" fontFamily="ui-sans-serif">
                {skin.roadsV[index]}
              </text>
            ) : null}
          </g>
        );
      })}
      <circle cx="780" cy="620" r="46" fill="#cfc6b6" />
      <circle cx="780" cy="620" r="36" fill={roadTone(2, at)} />
      <circle cx="780" cy="620" r="14" fill="#d7eeb4" />
      <circle cx="1120" cy="880" r="36" fill="#cfc6b6" />
      <circle cx="1120" cy="880" r="28" fill={roadTone(3, at)} />
      <circle cx="1120" cy="880" r="10" fill="#d7eeb4" />
    </g>
  );
}

function ExtraRoads({ at }: { at: Date }) {
  const asphalt = roadTone(2, at);
  return (
    <g fill="none" strokeLinecap="round">
      <path d="M200 1212 C 420 1186, 760 1244, 1040 1208" stroke="#cfc6b6" strokeWidth="22" />
      <path d="M200 1212 C 420 1186, 760 1244, 1040 1208" stroke={asphalt} strokeWidth="12" />
      <path d="M830 690 C 910 668, 1020 830, 1090 800" stroke="#cfc6b6" strokeWidth="16" />
      <path d="M830 690 C 910 668, 1020 830, 1090 800" stroke={asphalt} strokeWidth="8" />
      <path d="M1688 1160 C 1736 1224, 1804 1264, 1868 1276" stroke="#cfc6b6" strokeWidth="16" />
      <path d="M1688 1160 C 1736 1224, 1804 1264, 1868 1276" stroke={asphalt} strokeWidth="8" />
      <circle cx="1868" cy="1276" r="6" fill={asphalt} stroke="none" />
    </g>
  );
}

function RoadWear() {
  const bumps: { x: number; y: number; axis: "h" | "v" }[] = [];
  for (const y of [380, 620]) {
    for (let x = 280; x < 1700; x += 340) {
      if (ROADS_X.some((cross) => Math.abs(cross - x) < 60)) continue;
      bumps.push({ x, y, axis: "h" });
    }
  }
  const holes = [
    { x: 540, y: 620 },
    { x: 980, y: 380 },
    { x: 1460, y: 760 },
    { x: 300, y: 880 },
  ];
  return (
    <g pointerEvents="none">
      {bumps.map((bump) => (
        <rect key={`${bump.x}-${bump.y}`} x={bump.x - 10} y={bump.y - 2} width="20" height="4" rx="1" fill="#f0e2c4" />
      ))}
      {holes.map((hole) => (
        <ellipse key={`${hole.x}-${hole.y}`} cx={hole.x} cy={hole.y} rx="7" ry="3.2" fill="#2a3038" opacity="0.45" />
      ))}
    </g>
  );
}

function Yard({ x, y, w, lite, night }: { x: number; y: number; w: number; lite?: boolean; night: boolean }) {
  const hw = Math.min(54, w * 0.9);
  const top = y - 8;
  const h = 38;
  const wall = "#f7f1e6";
  const dirt = night ? "#a48458" : "#e8d2a4";
  const gate = 12;
  const left = x - hw;
  const right = x + hw;
  const gap = x - gate / 2;
  return (
    <g pointerEvents="none">
      <rect x={left} y={top} width={hw * 2} height={h} fill={dirt} />
      <rect x={left} y={top} width={hw * 2} height="3.6" fill={wall} />
      <rect x={left} y={top} width="3.6" height={h} fill={wall} />
      <rect x={right - 3.6} y={top} width="3.6" height={h} fill={wall} />
      <rect x={left} y={top + h - 3.6} width={gap - left} height="3.6" fill={wall} />
      <rect x={gap + gate} y={top + h - 3.6} width={right - (gap + gate)} height="3.6" fill={wall} />
      <rect x={gap} y={top + h - 4} width={gate} height="4.4" fill={night ? "#f0c43a" : "#c4924a"} />
      <ellipse cx={right - 8} cy={top + 8} rx="4.2" ry="2.4" fill="#9aa3ad" />
      <line x1={left + 6} y1={top + 8} x2={x - 6} y2={top + 8} stroke="#f7f4ef" strokeWidth="0.7" />
      <rect x={left + 8} y={top + 6.2} width="3.2" height="2.2" fill="#f7f4ef" />
      <rect x={left + 14} y={top + 6.4} width="3" height="2" fill="#CE1126" />
      {!lite ? (
        <>
          <rect x={left + 5} y={top + 14} width="8" height="6" fill="#c4b49a" />
          <rect x={left + 16} y={top + 16} width="4" height="3" fill="#8d949c" />
        </>
      ) : null}
    </g>
  );
}

function Kiosk({ x, y, phase }: { x: number; y: number; phase: DayPhase }) {
  return (
    <g pointerEvents="none">
      <rect x={x - 7} y={y - 3} width="14" height="8" fill={phase === "night" ? "#6a5038" : "#c4784a"} />
      <polygon points={`${x - 8},${y - 3} ${x},${y - 9} ${x + 8},${y - 3}`} fill="#CE1126" />
    </g>
  );
}

function FillerMark({ bit, phase }: { bit: Filler; phase: DayPhase }) {
  if (bit.kind === "kiosk") return <Kiosk x={bit.x} y={bit.y} phase={phase} />;
  const soil = phase === "night" ? "#5d7a52" : "#cfe6a4";
  return (
    <g pointerEvents="none">
      <path d={`M${bit.x + 28} ${bit.y - 6} H${bit.x + 70}`} stroke="#e6d3a8" strokeWidth="3" />
      <rect x={bit.x - 12} y={bit.y - 8} width="24" height="14" rx="2" fill={soil} />
      <line x1={bit.x - 8} y1={bit.y - 4} x2={bit.x + 8} y2={bit.y - 4} stroke="#6d8f4e" strokeWidth="0.8" />
      <line x1={bit.x - 8} y1={bit.y} x2={bit.x + 8} y2={bit.y} stroke="#6d8f4e" strokeWidth="0.8" />
      <line x1={bit.x - 8} y1={bit.y + 4} x2={bit.x + 8} y2={bit.y + 4} stroke="#6d8f4e" strokeWidth="0.8" />
    </g>
  );
}

function Person({ person, phase }: { person: Folk; phase: DayPhase }) {
  const s = person.role === "kid" ? 0.9 : 1.35;
  const y = person.y;
  return (
    <g pointerEvents="none" opacity={phase === "night" ? 0.7 : 1}>
      {person.role === "load" ? <ellipse cx={person.x} cy={y - 12 * s} rx={3.2 * s} ry={2 * s} fill="#c4784a" /> : null}
      <circle cx={person.x} cy={y - 8 * s} r={2.6 * s} fill={person.skin} />
      <rect x={person.x - 3 * s} y={y - 5 * s} width={6 * s} height={8 * s} rx="1.4" fill={person.shirt} />
      {person.role === "hawker" ? <rect x={person.x - 5 * s} y={y - 2 * s} width={10 * s} height={2 * s} fill="#f5c542" /> : null}
    </g>
  );
}

function Hills() {
  return (
    <g>
      <path d="M0 0 H340 C250 70 190 30 70 150 C20 200 0 170 0 230 Z" fill="#b7cf86" />
      <path d="M1660 0 H2000 V240 C1880 150 1760 190 1660 70 Z" fill="#a9c47c" />
      <path d="M0 960 C90 880 170 980 80 1120 C30 1180 0 1140 0 1200 Z" fill="#9bb872" />
      <path d="M1840 1000 C1940 920 2000 980 2000 1140 V980 Z" fill="#8eaf6a" />
    </g>
  );
}

function Building({ building, night, lite, mood, onPick }: { building: Bld; night: boolean; lite: boolean; mood: LeafMood; onPick?: (building: Bld) => void }) {
  const { x, y, kind, hue, w } = building;
  const hw = w * 0.48;
  const wallH = kind === "tower" ? 58 : kind === "block" ? 44 : kind === "church" ? 36 : kind === "shop" || kind === "stall" ? 24 : kind === "chop" ? 22 : 34;
  const dark = kind === "club";
  const bare = kind === "bare";
  const roof = dark ? "#1a1218" : bare ? "#b7b1a6" : kind === "tower" ? "#8eabc4" : kind === "block" || kind === "stall" ? "#8d949c" : ROOFS[hue];
  const wall = dark ? "#241820" : bare ? "#d5d0c6" : WALLS[hue];
  const side = dark ? "#140e16" : bare ? "#c4bfb4" : SIDES[hue];
  const top = y - wallH;
  const drop = hw * 0.42;
  const peak = kind === "house" || kind === "chop" || kind === "church" || kind === "shop" ? 16 : 0;
  const glass = mood === "night" ? "#ffe7a3" : mood === "evening" ? "#ffd2a8" : mood === "morning" ? "#fff1d6" : "#f7fbff";
  const face = (u: number, v: number, right = false) => {
    const sign = right ? 1 : -1;
    return [x + sign * hw * (1 - u), top + drop + drop * u + wallH * v];
  };
  const win = (u: number, v: number, right = false) => {
    const a = face(u, v, right);
    const b = face(u + 0.3, v, right);
    const c = face(u + 0.3, v + 0.24, right);
    const d = face(u, v + 0.24, right);
    return `${a[0]},${a[1]} ${b[0]},${b[1]} ${c[0]},${c[1]} ${d[0]},${d[1]}`;
  };
  const door = () => {
    const a = face(0.38, 0.62);
    const b = face(0.62, 0.62);
    const c = face(0.62, 1);
    const d = face(0.38, 1);
    return `${a[0]},${a[1]} ${b[0]},${b[1]} ${c[0]},${c[1]} ${d[0]},${d[1]}`;
  };
  return (
    <g className="cursor-pointer hover:brightness-110" pointerEvents="auto" onClick={(event) => { event.stopPropagation(); onPick?.(building); }}>
      <ellipse cx={x + 8} cy={y + drop * 1.15} rx={hw} ry={drop * 0.55} fill="#000" opacity={night ? 0.32 : 0.16} />
      <polygon points={`${x - hw},${top + drop} ${x},${top - peak} ${x + hw},${top + drop} ${x},${top + drop * 2}`} fill={roof} />
      {!lite && !bare && (kind === "house" || kind === "shop" || kind === "chop") ? (
        <g stroke="#6a5344" strokeWidth="1" opacity="0.45">
          <line x1={x - hw * 0.55} y1={top + drop * 0.7} x2={x - hw * 0.15} y2={top + drop * 1.15} />
          <line x1={x + hw * 0.15} y1={top + drop * 1.15} x2={x + hw * 0.55} y2={top + drop * 0.7} />
        </g>
      ) : null}
      <polygon points={`${x - hw},${top + drop} ${x},${top + drop * 2} ${x},${top + drop * 2 + wallH} ${x - hw},${top + drop + wallH}`} fill={wall} />
      <polygon points={`${x + hw},${top + drop} ${x},${top + drop * 2} ${x},${top + drop * 2 + wallH} ${x + hw},${top + drop + wallH}`} fill={side} />
      <polygon points={door()} fill={dark ? "#ff4d9a" : "#5c3a28"} />
      {kind !== "stall" ? <polygon points={win(0.08, 0.14)} fill={glass} stroke="#243044" strokeWidth="0.6" /> : null}
      {wallH > 30 ? <polygon points={win(0.08, 0.5)} fill={glass} stroke="#243044" strokeWidth="0.6" /> : null}
      {!lite && kind !== "stall" ? <polygon points={win(0.55, 0.2, true)} fill={glass} stroke="#243044" strokeWidth="0.6" /> : null}
      {kind === "shop" || kind === "chop" || kind === "stall" ? (
        <polygon points={`${x - hw},${top + drop + 6} ${x},${top + drop * 2 + 6} ${x},${top + drop * 2 + 12} ${x - hw},${top + drop + 12}`} fill={kind === "stall" ? "#CE1126" : hue % 2 ? "#e5484d" : "#f5c542"} />
      ) : null}
      {kind === "church" ? <polygon points={`${x},${top - peak - 22} ${x - 5},${top - peak} ${x + 5},${top - peak}`} fill="#f4efe6" /> : null}
      {!lite && (kind === "block" || kind === "tower") ? <rect x={x + hw * 0.25} y={top - 5} width="7" height="5" fill="#9aa3ad" /> : null}
      {kind === "house" || kind === "block" ? <Yard x={x} y={y + drop + 6} w={w} lite={lite} night={night} /> : null}
      {kind === "club" ? <polygon points={`${x - hw * 0.4},${top + drop + 8} ${x + hw * 0.2},${top + drop * 1.4 + 8} ${x + hw * 0.2},${top + drop * 1.4 + 12} ${x - hw * 0.4},${top + drop + 12}`} fill="#ff4d9a" /> : null}
      {kind !== "bare" && kind !== "club" ? <Tree x={x + hw + 8} y={y + drop * 0.85} kind={yardFlora(building.kind, hue)} s={yardFlora(building.kind, hue) === "shrub" ? 0.8 : 1.1} lite={lite} mood={mood} /> : null}
    </g>
  );
}

function BuildingCard({ building, onClose }: { building: Bld; onClose: () => void }) {
  const card = BUILDING_COPY[building.kind];
  return (
    <div className="absolute left-3 top-[max(5.6rem,calc(env(safe-area-inset-top)+4.8rem))] z-40 w-[min(16rem,calc(100%-5.5rem))] rounded-2xl bg-[#fff8e6] px-3 py-2.5 text-[#243044] shadow-lg">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold">{card.name}</p>
        <button type="button" onClick={onClose} aria-label="Close building" className="text-xs font-semibold text-[#5c6b82]">
          Close
        </button>
      </div>
      <p className="text-[11px] font-semibold text-[#8a5a32]">{card.hours}</p>
      <p className="mt-1 text-xs leading-snug text-[#5c4a3a]">{card.line}</p>
    </div>
  );
}

const BUILDING_COPY: Record<Kind, { name: string; hours: string; line: string }> = {
  house: { name: "Compound house", hours: "Someone is home", line: "Cream walls, a metal roof, and a low wall around the yard." },
  shop: { name: "Corner shop", hours: "7:00 – 20:00", line: "A wide front and a painted sign. Cold drinks and phone credit." },
  chop: { name: "Chop bar", hours: "11:00 – 21:00", line: "Open front. The tables are outside and the stew is already on." },
  block: { name: "Apartment block", hours: "Residents", line: "Two floors, a row of windows, and a tank on the roof." },
  tower: { name: "Office", hours: "8:00 – 17:00", line: "Taller than the houses, with a glass front and a proper entrance." },
  church: { name: "Church", hours: "Sunday, and evenings", line: "A pale steeple over a long hall. You can hear it before you see it." },
  stall: { name: "Market stall", hours: "6:00 – 18:00", line: "A small canopy and a table of whatever came in this morning." },
  club: { name: "Night spot", hours: "19:00 – late", line: "Dark walls and a neon strip over the door." },
  bare: { name: "Unfinished block", hours: "Work in progress", line: "Exposed blocks and no roof yet. Very Accra." },
};

function Highway({ x, label }: { x: number; label: string }) {
  const mid = x + 48;
  return (
    <g>
      <rect x={x} y="0" width="96" height="1190" fill="#c9d9a6" />
      <rect x={mid - 18} y="0" width="36" height="1190" fill="#3a414c" />
      <line x1={mid} y1="0" x2={mid} y2="1190" stroke="#FCD116" strokeWidth="2.4" strokeDasharray="22 16" />
      <line x1={mid - 12} y1="0" x2={mid - 12} y2="1190" stroke="white" strokeWidth="1" strokeOpacity="0.35" />
      <line x1={mid + 12} y1="0" x2={mid + 12} y2="1190" stroke="white" strokeWidth="1" strokeOpacity="0.35" />
      <text x={mid} y="595" transform={`rotate(-90 ${mid} 595)`} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="13" fontWeight="700" letterSpacing="3" fontFamily="ui-sans-serif">
        {label}
      </text>
    </g>
  );
}

type TrafficCar = {
  id: string;
  axis: "h" | "v";
  road: number;
  lane: number;
  dir: 1 | -1;
  kind: "taxi" | "trotro" | "private" | "okada";
  color: string;
  dur: number;
  delay: number;
};

function makeTraffic(lite: boolean): TrafficCar[] {
  const cars: TrafficCar[] = [];
  const kinds: TrafficCar["kind"][] = ["taxi", "trotro", "private", "okada", "private", "taxi"];
  const colors = ["#FCD116", "#f7f4ef", "#CE1126", "#1c1917", "#006B3F", "#3b82f6", "#e5484d", "#f5c542"];
  let n = 1;
  for (let i = 0; i < ROADS_Y.length; i += 1) {
    const count = lite ? 2 : 4;
    for (let c = 0; c < count; c += 1) {
      n += 1;
      cars.push({
        id: `h-${i}-${c}`,
        axis: "h",
        road: i,
        lane: c % 2 === 0 ? -1 : 1,
        dir: c % 2 === 0 ? 1 : -1,
        kind: kinds[n % kinds.length],
        color: colors[n % colors.length],
        dur: 11 + (n % 7) * 1.4,
        delay: -((n * 2.3) % 12),
      });
    }
  }
  for (let i = 0; i < ROADS_X.length; i += 1) {
    const count = lite ? 2 : 3;
    for (let c = 0; c < count; c += 1) {
      n += 1;
      cars.push({
        id: `v-${i}-${c}`,
        axis: "v",
        road: i,
        lane: c % 2 === 0 ? -1 : 1,
        dir: c % 2 === 0 ? 1 : -1,
        kind: kinds[(n + 2) % kinds.length],
        color: colors[(n + 3) % colors.length],
        dur: 13 + (n % 6) * 1.6,
        delay: -((n * 1.7) % 14),
      });
    }
  }
  // N1 motorways
  for (let c = 0; c < (lite ? 2 : 4); c += 1) {
    n += 1;
    cars.push({
      id: `n1w-${c}`,
      axis: "v",
      road: -1,
      lane: c % 2 === 0 ? -1 : 1,
      dir: c % 2 === 0 ? 1 : -1,
      kind: kinds[n % kinds.length],
      color: colors[n % colors.length],
      dur: 16 + c * 2,
      delay: -(c * 3.5),
    });
    cars.push({
      id: `n1e-${c}`,
      axis: "v",
      road: -2,
      lane: c % 2 === 0 ? -1 : 1,
      dir: c % 2 === 0 ? -1 : 1,
      kind: kinds[(n + 1) % kinds.length],
      color: colors[(n + 2) % colors.length],
      dur: 15 + c * 2.2,
      delay: -(c * 2.8 + 1),
    });
  }
  return cars;
}

function Traffic({ lite }: { lite: boolean }) {
  const cars = lite ? TRAFFIC_LITE : TRAFFIC;
  return (
    <g className="city-traffic" pointerEvents="none">
      {cars.map((car) => {
        const roadY = car.axis === "h" ? ROADS_Y[car.road] + car.lane * 7 : 0;
        const roadX =
          car.road === -1 ? 48 + car.lane * 8 : car.road === -2 ? 1952 + car.lane * 8 : car.axis === "v" ? ROADS_X[car.road] + car.lane * 7 : 0;
        const cls =
          car.axis === "h" ? (car.dir > 0 ? "city-drive-east" : "city-drive-west") : car.dir > 0 ? "city-drive-south" : "city-drive-north";
        return (
          <g
            key={car.id}
            className={cls}
            style={{
              animationDuration: `${car.dur}s`,
              animationDelay: `${car.delay}s`,
            }}
          >
            <MapCar x={car.axis === "h" ? 0 : roadX} y={car.axis === "h" ? roadY : 0} axis={car.axis} dir={car.dir} kind={car.kind} color={car.color} />
          </g>
        );
      })}
    </g>
  );
}

function MapCar({
  x,
  y,
  axis,
  dir,
  kind,
  color,
}: {
  x: number;
  y: number;
  axis: "h" | "v";
  dir: 1 | -1;
  kind: TrafficCar["kind"];
  color: string;
}) {
  const long = kind === "trotro" ? 28 : kind === "okada" ? 14 : 20;
  const wide = kind === "trotro" ? 11 : kind === "okada" ? 7 : 9;
  const w = axis === "h" ? long : wide;
  const h = axis === "h" ? wide : long;
  const cx = x - w / 2;
  const cy = y - h / 2;
  const glass = axis === "h" ? (dir > 0 ? cx + w * 0.55 : cx + 2) : dir > 0 ? cy + h * 0.55 : cy + 2;
  return (
    <g>
      <rect x={cx} y={cy} width={w} height={h} rx="2.5" fill={color} stroke="#121212" strokeOpacity="0.25" strokeWidth="0.8" />
      {axis === "h" ? (
        <rect x={glass} y={cy + 1.5} width={w * 0.28} height={h - 3} rx="1" fill="#9fd4f2" fillOpacity="0.85" />
      ) : (
        <rect x={cx + 1.5} y={glass} width={w - 3} height={h * 0.28} rx="1" fill="#9fd4f2" fillOpacity="0.85" />
      )}
      {kind === "taxi" ? <rect x={cx + w * 0.35} y={cy - 2} width={w * 0.3} height="2.5" rx="0.5" fill="#121212" /> : null}
      {kind === "trotro" ? (
        <text x={x} y={y + 1.5} textAnchor="middle" fill="#121212" fontSize="5" fontWeight="800" fontFamily="ui-sans-serif">
          TRO
        </text>
      ) : null}
    </g>
  );
}

function Tree({ x, y, kind, s = 1, lite, mood, glow }: { x: number; y: number; kind: Flora; s?: number; lite?: boolean; mood: LeafMood; glow?: boolean }) {
  const trunk = mood === "night" ? "#3d2a1c" : "#6b4428";
  const bark = mood === "night" ? "#2a1c14" : "#8a5a32";
  const leaf = (color: string) => tintLeaf(color, mood);
  const sway = !lite && (kind === "palm" || kind === "coconut");
  return (
    <g pointerEvents="none">
      <ellipse cx={x + 6 * s} cy={y + 2} rx={(kind === "hedge" ? 12 : kind === "baobab" ? 10 : 7) * s} ry={2.2 * s} fill="#000" opacity={mood === "night" ? 0.28 : 0.14} />
      {glow && mood === "night" ? <ellipse cx={x} cy={y - 16 * s} rx={10 * s} ry={6 * s} fill="#ffe7a3" opacity="0.28" /> : null}
      {kind === "palm" || kind === "coconut" ? <Palm x={x} y={y} s={s} lite={lite} trunk={trunk} leaf={leaf} nuts={kind === "coconut"} sway={sway} glossy={mood === "rain"} /> : null}
      {kind === "mango" || kind === "neem" || kind === "flame" || kind === "cassia" ? (
        <Broad x={x} y={y} s={s * (kind === "neem" ? 0.86 : 1)} lite={lite} trunk={trunk} bark={bark} leaf={leaf} deep={kind === "neem"} bloom={kind === "flame" ? "#e24b3a" : kind === "cassia" ? "#f0c43a" : ""} fruit={kind === "mango"} glossy={mood === "rain"} />
      ) : null}
      {kind === "baobab" ? <Baobab x={x} y={y} s={s} lite={lite} trunk={trunk} leaf={leaf} /> : null}
      {kind === "shrub" ? <Shrub x={x} y={y} s={s} leaf={leaf} /> : null}
      {kind === "hedge" ? (
        <g>
          <rect x={x - 12 * s} y={y - 5 * s} width={24 * s} height={5 * s} rx={2} fill={leaf("#2f5e28")} />
          <rect x={x - 11 * s} y={y - 7 * s} width={22 * s} height={4 * s} rx={2} fill={leaf("#4e9a48")} />
        </g>
      ) : null}
      {kind === "grass" ? <Grass x={x} y={y} s={s} leaf={leaf} /> : null}
    </g>
  );
}

function Palm({ x, y, s, lite, trunk, leaf, nuts, sway, glossy }: { x: number; y: number; s: number; lite?: boolean; trunk: string; leaf: (c: string) => string; nuts: boolean; sway: boolean; glossy: boolean }) {
  const crown = y - 24 * s;
  const angles = lite ? [-40, 0, 40] : [-62, -32, 0, 32, 62];
  return (
    <g>
      <polygon points={`${x - 2.4 * s},${y} ${x + 2.4 * s},${y} ${x + 1.5 * s},${crown + 4} ${x - 1.5 * s},${crown + 4}`} fill={trunk} />
      <g className={sway ? "tree-sway" : undefined}>
        {angles.map((angle, index) => (
          <ellipse key={angle} cx={x} cy={crown} rx={15 * s} ry={3.4 * s} fill={leaf(index % 2 ? "#2f7a3a" : "#5aaa52")} transform={`rotate(${angle} ${x} ${crown})`} />
        ))}
        {glossy ? <ellipse cx={x} cy={crown - 1 * s} rx={4 * s} ry={1.2 * s} fill="#fff" opacity="0.2" /> : null}
        {nuts ? (
          <>
            <circle cx={x - 2 * s} cy={crown + 3 * s} r={1.5 * s} fill="#6b4428" />
            <circle cx={x + 2.2 * s} cy={crown + 2.4 * s} r={1.4 * s} fill="#8a5a32" />
          </>
        ) : null}
      </g>
    </g>
  );
}

function Broad({
  x,
  y,
  s,
  lite,
  trunk,
  bark,
  leaf,
  deep,
  bloom,
  fruit,
  glossy,
}: {
  x: number;
  y: number;
  s: number;
  lite?: boolean;
  trunk: string;
  bark: string;
  leaf: (c: string) => string;
  deep: boolean;
  bloom: string;
  fruit: boolean;
  glossy: boolean;
}) {
  const top = y - 16 * s;
  return (
    <g>
      <polygon points={`${x - 3.4 * s},${y} ${x + 3.4 * s},${y} ${x + 1.8 * s},${top + 6 * s} ${x - 1.8 * s},${top + 6 * s}`} fill={trunk} />
      <line x1={x + 0.6 * s} y1={y - 1} x2={x + 0.2 * s} y2={top + 6 * s} stroke={bark} strokeWidth={1.2} />
      <ellipse cx={x + 1 * s} cy={top + 3 * s} rx={(deep ? 10 : 15) * s} ry={(deep ? 8 : 8) * s} fill={leaf(deep ? "#1f5c32" : "#3d8a40")} />
      <ellipse cx={x - 6 * s} cy={top - 2 * s} rx={(deep ? 7 : 9) * s} ry={6 * s} fill={leaf(deep ? "#174a28" : "#7cbc58")} />
      {!lite ? <ellipse cx={x + 7 * s} cy={top + 1 * s} rx={7 * s} ry={5 * s} fill={leaf("#2f6b34")} /> : null}
      {bloom ? <circle cx={x - 3 * s} cy={top - 3 * s} r={1.8 * s} fill={bloom} /> : null}
      {!lite && bloom ? (
        <>
          <circle cx={x + 2 * s} cy={top - 1 * s} r={1.3 * s} fill={bloom} />
          <circle cx={x + 5 * s} cy={top - 3 * s} r={1.2 * s} fill={bloom} />
        </>
      ) : null}
      {fruit ? <ellipse cx={x + 3 * s} cy={y - 2} rx={1.6 * s} ry={1 * s} fill="#c4784a" /> : null}
      {!lite ? <ellipse cx={x + 7 * s} cy={y + 1} rx={1.5 * s} ry={0.7 * s} fill={leaf("#5a8f3a")} transform={`rotate(28 ${x + 7 * s} ${y})`} /> : null}
      {glossy ? <ellipse cx={x - 2 * s} cy={top - 2 * s} rx={3.2 * s} ry={1.3 * s} fill="#fff" opacity="0.18" /> : null}
    </g>
  );
}

function Baobab({ x, y, s, lite, trunk, leaf }: { x: number; y: number; s: number; lite?: boolean; trunk: string; leaf: (c: string) => string }) {
  return (
    <g>
      <polygon points={`${x - 9 * s},${y} ${x + 9 * s},${y} ${x + 5 * s},${y - 20 * s} ${x - 5 * s},${y - 20 * s}`} fill={trunk} />
      <line x1={x + 1.5 * s} y1={y - 2} x2={x + 0.4 * s} y2={y - 16 * s} stroke="#8a5a32" strokeWidth={1.3} />
      <ellipse cx={x} cy={y - 18 * s} rx={7 * s} ry={3.5 * s} fill={leaf("#6a8f45")} />
      {!lite ? <ellipse cx={x - 3 * s} cy={y - 20 * s} rx={4 * s} ry={2.4 * s} fill={leaf("#8aaa58")} /> : null}
    </g>
  );
}

function Shrub({ x, y, s, leaf }: { x: number; y: number; s: number; leaf: (c: string) => string }) {
  return (
    <g>
      <ellipse cx={x} cy={y - 3 * s} rx={6 * s} ry={3.4 * s} fill={leaf("#3f7a32")} />
      <ellipse cx={x - 2 * s} cy={y - 4.5 * s} rx={3.5 * s} ry={2.4 * s} fill={leaf("#67a84a")} />
    </g>
  );
}

function Grass({ x, y, s, leaf }: { x: number; y: number; s: number; leaf: (c: string) => string }) {
  const color = leaf("#5a8f3a");
  return (
    <g stroke={color} strokeWidth={1.1} strokeLinecap="round">
      <line x1={x - 3 * s} y1={y} x2={x - 4 * s} y2={y - 6 * s} />
      <line x1={x} y1={y} x2={x + 0.5 * s} y2={y - 8 * s} />
      <line x1={x + 3 * s} y1={y} x2={x + 4 * s} y2={y - 5 * s} />
    </g>
  );
}

function yardFlora(kind: Kind, hue: number): Flora {
  if (kind === "church") return hue % 2 ? "flame" : "cassia";
  if (kind === "shop" || kind === "chop" || kind === "stall") return "shrub";
  if (kind === "tower" || kind === "block") return "neem";
  if (hue % 5 === 0) return "palm";
  return hue % 2 ? "mango" : "neem";
}

function tintLeaf(hex: string, mood: LeafMood) {
  const clean = hex.replace("#", "");
  const channel = (index: number) => parseInt(clean.slice(index, index + 2), 16);
  let r = channel(0);
  let g = channel(2);
  let b = channel(4);
  if (mood === "night") {
    r = Math.round(r * 0.64);
    g = Math.round(g * 0.74);
    b = Math.round(b * 0.72);
  } else if (mood === "morning") {
    r = Math.min(255, Math.round(r * 0.88 + 48));
    g = Math.min(255, Math.round(g * 0.94 + 18));
    b = Math.round(b * 0.78);
  } else if (mood === "evening") {
    r = Math.min(255, Math.round(r * 0.82 + 72));
    g = Math.min(255, Math.round(g * 0.72 + 28));
    b = Math.round(b * 0.55);
  } else if (mood === "dust") {
    r = Math.round(r * 0.72 + 196 * 0.28);
    g = Math.round(g * 0.72 + 164 * 0.28);
    b = Math.round(b * 0.72 + 96 * 0.28);
  } else if (mood === "rain") {
    r = Math.round(r * 0.78);
    g = Math.round(g * 0.92);
    b = Math.round(b * 0.86);
  }
  return `rgb(${r},${g},${b})`;
}

function Board({ x, y, fill, text, onOpen, mega }: { x: number; y: number; fill: string; text: string; onOpen?: () => void; mega?: boolean }) {
  const w = mega ? 280 : 230;
  const h = mega ? 96 : 78;
  return (
    <g data-board="true" onClick={onOpen} className={onOpen ? "cursor-pointer" : undefined}>
      <rect x={x + w * 0.46} y={y + h - 4} width="10" height="70" fill="#6b6256" />
      <rect x={x} y={y} width={w} height={h} rx="8" fill={fill} />
      <rect x={x + 8} y={y + 8} width={w - 16} height={h - 16} rx="4" fill="none" stroke="white" strokeOpacity="0.35" />
      <text x={x + w / 2} y={y + h / 2 + 7} textAnchor="middle" fill="white" fontSize={mega ? 22 : 18} fontWeight="700" fontFamily="ui-sans-serif">
        {text.slice(0, 22)}
      </text>
    </g>
  );
}
