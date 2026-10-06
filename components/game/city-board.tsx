"use client";

import { useEffect, useRef, useState } from "react";
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
];

export function CityBoard({
  filter,
  boards = true,
  night = false,
  ads = {},
  onSelect,
  onBoard,
}: {
  filter: Spot["group"] | "all";
  boards?: boolean;
  night?: boolean;
  ads?: Record<string, string>;
  onSelect: (id: string) => void;
  onBoard?: (id: string) => void;
}) {
  const boardRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<View>({ x: -160, y: -40, z: 0.55 });
  const viewRef = useRef(view);
  const drag = useRef<{ x: number; y: number; px: number; py: number } | null>(null);
  const pinch = useRef<{ dist: number; z: number; view: View } | null>(null);
  const points = useRef(new Map<number, { x: number; y: number }>());

  useEffect(() => {
    const node = boardRef.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    const next = {
      z: 0.55,
      x: rect.width / 2 - 1000 * 0.55,
      y: rect.height / 2 - 680 * 0.55,
    };
    viewRef.current = next;
    setView(next);
  }, []);

  useEffect(() => {
    const node = boardRef.current;
    if (!node) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const rect = node.getBoundingClientRect();
      const next = zoomToward(viewRef.current, event.clientX - rect.left, event.clientY - rect.top, viewRef.current.z * (event.deltaY < 0 ? 1.12 : 0.89));
      viewRef.current = next;
      setView(next);
    };
    node.addEventListener("wheel", onWheel, { passive: false });
    return () => node.removeEventListener("wheel", onWheel);
  }, []);

  function zoomBy(factor: number) {
    const node = boardRef.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    const next = zoomToward(viewRef.current, rect.width / 2, rect.height / 2, viewRef.current.z * factor);
    viewRef.current = next;
    setView(next);
  }

  return (
    <div
      ref={boardRef}
      className="absolute inset-0 cursor-grab touch-none overflow-hidden bg-[#b7d48c] active:cursor-grabbing"
      onPointerDown={(event) => {
        if ((event.target as Element).closest("button, [data-board]")) return;
        event.currentTarget.setPointerCapture(event.pointerId);
        points.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
        if (points.current.size === 1) {
          drag.current = { x: event.clientX, y: event.clientY, px: viewRef.current.x, py: viewRef.current.y };
          pinch.current = null;
        } else {
          drag.current = null;
          const pair = [...points.current.values()];
          pinch.current = { dist: Math.hypot(pair[0].x - pair[1].x, pair[0].y - pair[1].y) || 1, z: viewRef.current.z, view: viewRef.current };
        }
      }}
      onPointerMove={(event) => {
        if (!points.current.has(event.pointerId)) return;
        points.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
        const rect = event.currentTarget.getBoundingClientRect();
        if (points.current.size >= 2 && pinch.current) {
          const pair = [...points.current.values()];
          const dist = Math.hypot(pair[0].x - pair[1].x, pair[0].y - pair[1].y) || 1;
          const midX = (pair[0].x + pair[1].x) / 2 - rect.left;
          const midY = (pair[0].y + pair[1].y) / 2 - rect.top;
          const next = zoomToward(pinch.current.view, midX, midY, pinch.current.z * (dist / pinch.current.dist));
          viewRef.current = next;
          setView(next);
          return;
        }
        if (!drag.current) return;
        const next = {
          z: viewRef.current.z,
          x: drag.current.px + event.clientX - drag.current.x,
          y: drag.current.py + event.clientY - drag.current.y,
        };
        viewRef.current = next;
        setView(next);
      }}
      onPointerUp={(event) => {
        points.current.delete(event.pointerId);
        if (points.current.size < 2) pinch.current = null;
        if (points.current.size === 0) drag.current = null;
        else if (points.current.size === 1) {
          const left = [...points.current.values()][0];
          drag.current = { x: left.x, y: left.y, px: viewRef.current.x, py: viewRef.current.y };
        }
      }}
      onDoubleClick={(event) => {
        if ((event.target as Element).closest("button, [data-board]")) return;
        const rect = event.currentTarget.getBoundingClientRect();
        const next = zoomToward(viewRef.current, event.clientX - rect.left, event.clientY - rect.top, viewRef.current.z * 1.35);
        viewRef.current = next;
        setView(next);
      }}
    >
      <div className="absolute left-0 top-0 origin-top-left" style={{ width: WORLD.w, height: WORLD.h, transform: `translate(${view.x}px, ${view.y}px) scale(${view.z})` }}>
        <svg viewBox={`0 0 ${WORLD.w} ${WORLD.h}`} className="h-full w-full">
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
          <circle cx="780" cy="620" r="36" fill="#e7ebf2" />
          <circle cx="780" cy="620" r="16" fill="#b7d48c" />
          <rect x="40" y="458" width="230" height="14" rx="2" fill="#d5dae3" />
          <line x1="52" y1="465" x2="258" y2="465" stroke="white" strokeDasharray="12 8" />
          {CITY.map((building) => (
            <Building key={`${building.x}-${building.y}`} building={building} night={night} />
          ))}
          {TREES.map((tree) => (
            <Tree key={`${tree.x}-${tree.y}`} x={tree.x} y={tree.y} r={tree.r} />
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
        {SPOTS.map((spot) => {
          const faded = filter !== "all" && spot.group !== filter && spot.group !== "soon";
          const showName = view.z >= 0.92 || spot.soon;
          return (
            <button
              key={spot.id}
              type="button"
              onClick={() => onSelect(spot.id)}
              title={spot.name}
              className={`absolute z-10 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center ${faded ? "opacity-30" : ""}`}
              style={{ left: spot.x, top: spot.y }}
            >
              <span className="grid h-8 w-8 place-items-center rounded-full bg-white text-base shadow-[0_6px_14px_rgba(22,32,60,.18)]">{spot.emoji}</span>
              {showName ? <span className={`mt-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold shadow ${spot.soon ? "bg-[#f5c542] text-[#121212]" : "bg-white text-[#121212]"}`}>{spot.soon ? `${spot.name} · Coming soon` : spot.name}</span> : null}
            </button>
          );
        })}
      </div>
      <div className="absolute bottom-[max(7.5rem,calc(env(safe-area-inset-bottom)+6.5rem))] right-3 z-30 flex flex-col gap-2">
        <button type="button" aria-label="Zoom in" onClick={() => zoomBy(1.2)} className="grid h-11 w-11 place-items-center rounded-full bg-white text-xl font-bold shadow-lg">
          +
        </button>
        <button type="button" aria-label="Zoom out" onClick={() => zoomBy(0.84)} className="grid h-11 w-11 place-items-center rounded-full bg-white text-xl font-bold shadow-lg">
          −
        </button>
      </div>
    </div>
  );
}

function zoomToward(view: View, originX: number, originY: number, nextZ: number): View {
  const z = Math.min(MAX_Z, Math.max(MIN_Z, nextZ));
  const wx = (originX - view.x) / view.z;
  const wy = (originY - view.y) / view.z;
  return { z, x: originX - wx * z, y: originY - wy * z };
}

function roll(n: number) {
  return Math.abs((n * 1103515245 + 12345) % 997);
}

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
    for (let x = 70; x < 1960; x += 78) {
      n += 1;
      if (roll(n) % 3 === 0) trees.push({ x: x + (roll(n) % 10), y: y + 24, r: 8 + (roll(n + 1) % 5) });
    }
  }
  for (let i = 0; i < 18; i += 1) {
    trees.push({ x: 900 + (i % 6) * 28, y: 720 + Math.floor(i / 6) * 26, r: 9 + (i % 3) });
  }
  for (let i = 0; i < ROADS_X.length - 1; i += 1) {
    for (let j = 0; j < ROADS_Y.length - 1; j += 1) {
      const x = ROADS_X[i] + 70;
      const y = ROADS_Y[j] + 70;
      trees.push({ x, y, r: 7 }, { x: x + 90, y: y + 36, r: 8 });
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

function Tree({ x, y, r }: { x: number; y: number; r: number }) {
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
