"use client";

import { useEffect, useMemo, useRef, useSyncExternalStore, memo, type PointerEvent as ReactPointerEvent } from "react";
import { happeningsAt, heatLabel, type Heat } from "@/lib/game/happenings";
import { SPOTS, type Spot } from "@/lib/game/world";

const WORLD = { w: 2000, h: 1400 };
const MIN_Z = 0.42;
const MAX_Z = 2.4;

type View = { x: number; y: number; z: number };

const ROADS_X = [120, 440, 780, 1120, 1460, 1840];
const ROADS_Y = [140, 380, 620, 880, 1160];

type Kind = "house" | "shop" | "block" | "tower";
type Bld = { x: number; y: number; kind: Kind; hue: number; w: number };

const CITY = makeCity();
const TREES = makeTrees();
const CITY_LITE = CITY.filter((_, index) => index % 2 === 0);
const TREES_LITE = TREES.filter((_, index) => index % 3 === 0);

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

const AREAS = [
  [620, 250, "OSU"],
  [1320, 500, "LABONE"],
  [1620, 230, "EAST LEGON"],
  [250, 430, "AIRPORT"],
  [280, 760, "MAKOLA"],
  [900, 470, "CANTONMENTS"],
  [980, 1040, "LABADI"],
  [1580, 1158, "TESHIE"],
  [1800, 1158, "NUNGUA"],
  [1050, 112, "MADINA"],
  [590, 112, "ACHIMOTA"],
  [420, 636, "KANESHIE"],
  [240, 1132, "DANSOMAN"],
  [1600, 982, "SPINTEX"],
];

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
  onSelect,
  onBoard,
}: {
  filter: Spot["group"] | "all";
  boards?: boolean;
  night?: boolean;
  ads?: Record<string, string>;
  active?: string | null;
  at?: Date;
  onSelect: (id: string) => void;
  onBoard?: (id: string) => void;
}) {
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

  useEffect(() => {
    const node = boardRef.current;
    if (!node) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
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
        <CityArt night={night} boards={boards} ads={ads} onBoard={onBoard} lite={lite} />
        <SpotPins filter={filter} active={active} vibes={vibes} onSelect={onSelect} lite={lite} />
      </div>
      <div data-zoom className="absolute bottom-[max(7.5rem,calc(env(safe-area-inset-bottom)+6.5rem))] right-3 z-30 flex flex-col gap-2">
        <button type="button" aria-label="Zoom in" onClick={() => zoomBy(1.25)} className="grid h-11 w-11 place-items-center rounded-full bg-white text-xl font-bold shadow-lg">
          +
        </button>
        <button type="button" aria-label="Zoom out" onClick={() => zoomBy(0.8)} className="grid h-11 w-11 place-items-center rounded-full bg-white text-xl font-bold shadow-lg">
          −
        </button>
        <button type="button" aria-label="Show all of Accra" onClick={zoomOutAll} className="grid h-11 w-11 place-items-center rounded-full bg-white text-base font-bold shadow-lg">
          ⤢
        </button>
      </div>
    </div>
  );
});

const SpotPins = memo(function SpotPins({
  filter,
  active,
  vibes,
  onSelect,
  lite,
}: {
  filter: Spot["group"] | "all";
  active: string | null;
  vibes: Map<string, { emoji: string; line: string; heat: Heat }>;
  onSelect: (id: string) => void;
  lite: boolean;
}) {
  return (
    <>
      {SPOTS.map((spot) => {
        const faded = filter !== "all" && spot.group !== filter && spot.group !== "soon";
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
}: {
  night: boolean;
  boards: boolean;
  ads: Record<string, string>;
  onBoard?: (id: string) => void;
  lite?: boolean;
}) {
  const buildings = lite ? CITY_LITE : CITY;
  const trees = lite ? TREES_LITE : TREES;
  return (
    <svg viewBox={`0 0 ${WORLD.w} ${WORLD.h}`} className="h-full w-full" style={{ pointerEvents: boards ? "auto" : "none" }}>
      <rect width={WORLD.w} height={WORLD.h} fill="#d7ebbc" />
      <Hills />
      <path d="M0 1196 C 500 1172, 1000 1212, 1500 1180 C 1800 1164, 2000 1192, 2000 1192 V 1400 H 0 Z" fill="#f4e3c4" />
      <path d="M0 1296 C 500 1272, 1000 1312, 1500 1280 C 1800 1264, 2000 1292, 2000 1292 V 1400 H 0 Z" fill="#b9e4f5" />
      <path d="M0 1336 C 500 1316, 1000 1352, 1500 1320 C 1800 1306, 2000 1332, 2000 1332 V 1400 H 0 Z" fill="#8fd0ea" />
      <ellipse cx="500" cy="1048" rx="168" ry="70" fill="#7ec4e4" />
      <ellipse cx="500" cy="1048" rx="118" ry="44" fill="#c5e9f6" />
      <ellipse cx="960" cy="760" rx="130" ry="78" fill="#c5e2a4" />
      {ROADS_Y.map((y) => (
        <g key={`hy-${y}`}>
          <rect x="36" y={y - 13} width="1928" height="26" rx="8" fill="#e7ebf2" />
          <line x1="52" y1={y} x2="1948" y2={y} stroke="white" strokeWidth="2" strokeDasharray="16 14" />
        </g>
      ))}
      {ROADS_X.map((x) => (
        <g key={`vx-${x}`}>
          <rect x={x - 13} y="28" width="26" height="1145" rx="8" fill="#e7ebf2" />
          <line x1={x} y1="44" x2={x} y2="1168" stroke="white" strokeWidth="2" strokeDasharray="16 14" />
        </g>
      ))}
      <Highway x={0} label="N1 WEST · CAPE COAST · ELMINA · KAKUM" />
      <Highway x={1904} label="MOTORWAY EAST · SHAI HILLS · AKOSOMBO · ADA" />
      <circle cx="780" cy="620" r="36" fill="#e7ebf2" />
      <circle cx="780" cy="620" r="16" fill="#b7d48c" />
      <rect x="40" y="458" width="230" height="14" rx="2" fill="#d5dae3" />
      <line x1="52" y1="465" x2="258" y2="465" stroke="white" strokeDasharray="12 8" />
      {buildings.map((building) => (
        <Building key={`${building.x}-${building.y}`} building={building} night={night} />
      ))}
      {trees.map((tree) => (
        <Tree key={`${tree.x}-${tree.y}`} x={tree.x} y={tree.y} r={tree.r} lite={lite} />
      ))}
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
      {AREAS.map(([x, y, label]) => (
        <text key={String(label)} x={Number(x)} y={Number(y)} textAnchor="middle" fill="white" fillOpacity="0.92" fontSize="20" fontWeight="700" letterSpacing="3" fontFamily="ui-sans-serif">
          {label}
        </text>
      ))}
      <text x="500" y="1054" textAnchor="middle" fill="white" fontSize="16" letterSpacing="3" fontFamily="ui-sans-serif">
        KORLE
      </text>
      <text x="1000" y="1364" textAnchor="middle" fill="white" fontSize="22" letterSpacing="6" fontFamily="ui-sans-serif">
        GULF OF GUINEA
      </text>
      {night ? <rect width={WORLD.w} height={WORLD.h} fill="rgba(10,16,40,.16)" /> : null}
    </svg>
  );
});

function makeCity() {
  const buildings: Bld[] = [];
  let n = 4;
  for (let i = 0; i < ROADS_X.length - 1; i += 1) {
    for (let j = 0; j < ROADS_Y.length - 1; j += 1) {
      if (i === 1 && j === 3) continue;
      if (i === 2 && j === 2) continue;
      const left = ROADS_X[i] + 36;
      const right = ROADS_X[i + 1] - 36;
      const top = ROADS_Y[j] + 32;
      const bottom = ROADS_Y[j + 1] - 32;
      const cols = 3;
      const rows = bottom - top > 170 ? 3 : 2;
      for (let row = 0; row < rows; row += 1) {
        for (let col = 0; col < cols; col += 1) {
          n += 1;
          const pick = roll(n) % 10;
          const kind: Kind = pick > 8 ? "tower" : pick > 6 ? "block" : pick > 4 ? "shop" : "house";
          const cw = (right - left) / cols;
          const rh = (bottom - top) / rows;
          buildings.push({
            x: left + col * cw + cw * 0.5,
            y: top + row * rh + rh * 0.62,
            kind,
            hue: roll(n + 3) % 6,
            w: 26 + (roll(n + 8) % 3) * 4,
          });
        }
      }
    }
  }
  return buildings;
}

function makeTrees() {
  const trees: { x: number; y: number; r: number }[] = [];
  let n = 9;
  for (const y of ROADS_Y) {
    for (let x = 70; x < 1960; x += 110) {
      n += 1;
      if (roll(n) % 4 === 0) trees.push({ x: x + (roll(n) % 10), y: y + 24, r: 8 + (roll(n + 1) % 5) });
    }
  }
  for (let i = 0; i < 12; i += 1) {
    trees.push({ x: 900 + (i % 6) * 28, y: 720 + Math.floor(i / 6) * 26, r: 9 + (i % 3) });
  }
  for (let i = 0; i < ROADS_X.length - 1; i += 1) {
    for (let j = 0; j < ROADS_Y.length - 1; j += 1) {
      if ((i + j) % 2 === 0) continue;
      const x = ROADS_X[i] + 70;
      const y = ROADS_Y[j] + 70;
      trees.push({ x, y, r: 7 });
    }
  }
  return trees;
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

const WALLS = ["#f7f1e6", "#f3d7c4", "#efe6d4", "#f8f5ef", "#fff6df", "#f6ead8"];
const ROOFS = ["#c4784a", "#8d4d3a", "#6d8f4e", "#8eabc4", "#d5dee8", "#b08968"];
const SIDES = ["#e4d8c4", "#e0c2ac", "#ddd4c0", "#e7e2d8", "#d5dee8", "#e6d4bc"];

function Building({ building, night }: { building: Bld; night: boolean }) {
  const { x, y, kind, hue, w } = building;
  const hw = w * 0.62;
  const wallH = kind === "tower" ? 50 : kind === "block" ? 28 : kind === "shop" ? 15 : 18;
  const roof = kind === "tower" ? "#8eabc4" : kind === "block" ? "#d9e2ea" : ROOFS[hue];
  const wall = WALLS[hue];
  const side = SIDES[hue];
  const top = y - wallH;
  const roofDrop = hw * 0.42;
  return (
    <g>
      <polygon points={`${x - hw},${top + roofDrop} ${x},${top - (kind === "house" ? 8 : 0)} ${x + hw},${top + roofDrop} ${x},${top + roofDrop * 2}`} fill={roof} />
      <polygon points={`${x - hw},${top + roofDrop} ${x},${top + roofDrop * 2} ${x},${top + roofDrop * 2 + wallH} ${x - hw},${top + roofDrop + wallH}`} fill={wall} />
      <polygon points={`${x + hw},${top + roofDrop} ${x},${top + roofDrop * 2} ${x},${top + roofDrop * 2 + wallH} ${x + hw},${top + roofDrop + wallH}`} fill={side} />
      {kind === "tower" || kind === "block" ? (
        <line x1={x - hw * 0.72} y1={top + roofDrop + 10} x2={x - hw * 0.12} y2={top + roofDrop * 1.55 + 10} stroke={night ? "#ffe7a3" : "white"} strokeOpacity="0.7" strokeWidth="1.6" />
      ) : null}
      {kind === "shop" ? <polygon points={`${x - hw},${top + roofDrop + 4} ${x},${top + roofDrop * 2 + 4} ${x},${top + roofDrop * 2 + 8} ${x - hw},${top + roofDrop + 8}`} fill={hue % 2 ? "#e5484d" : "#f5c542"} /> : null}
    </g>
  );
}

function Highway({ x, label }: { x: number; label: string }) {
  const mid = x + 48;
  return (
    <g>
      <rect x={x} y="0" width="96" height="1190" fill="#c9d9a6" />
      <rect x={mid - 15} y="0" width="30" height="1190" fill="#9aa3ad" />
      <line x1={mid} y1="0" x2={mid} y2="1190" stroke="#FCD116" strokeWidth="2" strokeDasharray="22 16" />
      <text x={mid} y="595" transform={`rotate(-90 ${mid} 595)`} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="13" fontWeight="700" letterSpacing="3" fontFamily="ui-sans-serif">
        {label}
      </text>
    </g>
  );
}

function Tree({ x, y, r, lite }: { x: number; y: number; r: number; lite?: boolean }) {
  if (lite) {
    return <circle cx={x} cy={y} r={r} fill="#67a83e" />;
  }
  return (
    <g>
      <ellipse cx={x} cy={y + r * 0.45} rx={r * 0.75} ry={r * 0.28} fill="rgba(40,70,30,.14)" />
      <circle cx={x} cy={y} r={r} fill="#67a83e" />
      <circle cx={x - r * 0.38} cy={y - r * 0.28} r={r * 0.7} fill="#8bc85a" />
      <circle cx={x + r * 0.32} cy={y - r * 0.08} r={r * 0.52} fill="#4f8f32" />
    </g>
  );
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
