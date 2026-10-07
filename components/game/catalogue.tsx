"use client";

import { useState } from "react";
import { Canvas } from "@react-three/fiber";
import { SHOP, SHOP_CATEGORIES, cedis, type ShopCategory, type ShopItem } from "@/lib/game/world";

const MARKS: Record<ShopCategory, string> = {
  design: "🎨",
  sleep: "🛏️",
  kitchen: "🍲",
  bath: "🚿",
  comfort: "🛋️",
  fun: "📺",
  skills: "🎸",
  light: "💡",
  decor: "🪴",
  pets: "🐕",
  luxury: "💎",
};

export function Catalogue({
  cash,
  owned,
  stored = [],
  floor,
  onBuy,
  onClose,
}: {
  cash: number;
  owned: string[];
  stored?: string[];
  floor?: string;
  onBuy: (id: string) => void;
  onClose: () => void;
}) {
  const [category, setCategory] = useState<(typeof SHOP_CATEGORIES)[number]["id"]>("design");
  const items = SHOP.filter((item) => item.category === category);

  return (
    <div className="absolute inset-x-0 bottom-0 z-40 flex max-h-[min(78vh,100dvh-4.5rem)] flex-col rounded-t-[28px] bg-[#f7f8fb] pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-[0_-16px_50px_rgba(22,32,60,.2)]">
      <div className="flex items-center justify-between px-5 pt-4">
        <h2 className="font-display text-2xl tracking-tight text-[#121212]">Catalogue</h2>
        <button type="button" onClick={onClose} className="rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-[#5c6b82] shadow-sm">
          Hide
        </button>
      </div>
      <div className="no-scrollbar relative z-10 mt-3 flex gap-2 overflow-x-auto px-4 pb-1 sm:px-5">
        {SHOP_CATEGORIES.map((chip) => (
          <button
            key={chip.id}
            type="button"
            onClick={() => setCategory(chip.id)}
            className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-semibold sm:px-3.5 ${category === chip.id ? "bg-[#121212] text-white" : "bg-[#fff1c9] text-[#121212]"}`}
          >
            {MARKS[chip.id]} {chip.label}
          </button>
        ))}
      </div>
      <p className="relative z-10 px-4 pb-2 pt-1 text-xs text-[#8b97ab] sm:px-5">Wallet {cedis(cash)}</p>
      <div className="grid min-h-0 flex-1 grid-cols-2 gap-3 overflow-auto px-4 pb-6 sm:grid-cols-3">
        {items.map((item) => {
          const have = !item.consume && owned.includes(item.id);
          const parked = stored.includes(item.id);
          const laid = item.kind === "floor" && floor === item.id;
          const pricey = item.price >= 20000;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                if (laid) return;
                if (have && !parked && item.kind !== "floor") return;
                onBuy(item.id);
              }}
              className="rounded-[22px] bg-white p-3 text-left shadow-sm"
            >
              <span className="flex items-center justify-between text-[11px] text-[#8b97ab]">
                <span>{item.size}</span>
                <span className="text-[#e0b44a]">{"★".repeat(item.stars)}</span>
              </span>
              <span className="mt-1 grid h-28 place-items-center">
                <ItemArt item={item} />
              </span>
              <span className="mt-1 block text-sm font-semibold text-[#121212]">{item.name}</span>
              <span className={`mt-1 block text-sm font-bold ${laid || (have && !parked && item.kind !== "floor") ? "text-[#8b97ab]" : pricey ? "text-[#9a3412]" : "text-[#006B3F]"}`}>
                {laid ? "On the floor" : item.kind === "floor" && have ? "Lay this floor" : parked ? "Put it out" : have ? "In the room" : cedis(item.price)}
              </span>
              {item.upkeep ? <span className="mt-0.5 block text-[11px] font-semibold text-[#9a3412]">+{cedis(item.upkeep)} a week</span> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ItemArt({ item }: { item: ShopItem }) {
  if (item.kind === "jet") return <JetPreview color={item.color} heavy={item.id === "heavy-jet"} />;
  return (
    <svg viewBox="0 0 120 90" className="h-24 w-28" aria-hidden>
      <ellipse cx="60" cy="80" rx="36" ry="5.5" fill="#121212" opacity="0.08" />
      <Piece item={item} />
    </svg>
  );
}

function JetPreview({ color, heavy }: { color: string; heavy: boolean }) {
  return (
    <Canvas
      className="h-24 w-28"
      camera={{ position: [2.1, 3.4, 2.1], fov: 26 }}
      dpr={1}
      frameloop="demand"
      gl={{ antialias: true, alpha: true }}
      onCreated={({ gl }) => gl.setClearColor("#ffffff", 0)}
      style={{ width: "7rem", height: "6rem", pointerEvents: "none" }}
    >
      <ambientLight intensity={0.72} />
      <directionalLight position={[4, 7, 3]} intensity={1.25} />
      <directionalLight position={[-3, 2, -2]} intensity={0.35} />
      <JetModel color={color} heavy={heavy} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[1.35, 32]} />
        <meshBasicMaterial color="#121212" transparent opacity={0.08} />
      </mesh>
    </Canvas>
  );
}

function JetModel({ color, heavy }: { color: string; heavy: boolean }) {
  const body = heavy ? 2.15 : 1.85;
  const span = heavy ? 2.7 : 2.25;
  return (
    <group position={[0, 0.15, 0]} rotation={[0, 0.85, 0]}>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <capsuleGeometry args={[0.16, body, 6, 16]} />
        <meshLambertMaterial color={color} />
      </mesh>
      <mesh position={[body / 2 + 0.16, 0.02, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <coneGeometry args={[0.16, 0.36, 16]} />
        <meshLambertMaterial color={color} />
      </mesh>
      <mesh position={[0.38, 0.14, 0]}>
        <sphereGeometry args={[0.11, 16, 12]} />
        <meshLambertMaterial color="#8fb4d4" />
      </mesh>
      <mesh position={[0.05, -0.02, 0]}>
        <boxGeometry args={[0.5, 0.035, span]} />
        <meshLambertMaterial color={color} />
      </mesh>
      <mesh position={[-body / 2 + 0.12, 0.22, 0]}>
        <boxGeometry args={[0.28, 0.34, 0.045]} />
        <meshLambertMaterial color={color} />
      </mesh>
      <mesh position={[-body / 2 + 0.16, 0.08, 0]}>
        <boxGeometry args={[0.22, 0.03, 0.62]} />
        <meshLambertMaterial color={color} />
      </mesh>
      <Engine at={[0.05, -0.08, span * 0.32]} />
      <Engine at={[0.05, -0.08, -span * 0.32]} />
      {heavy ? (
        <>
          <Engine at={[0.38, -0.08, span * 0.32]} />
          <Engine at={[0.38, -0.08, -span * 0.32]} />
        </>
      ) : null}
    </group>
  );
}

function Engine({ at }: { at: [number, number, number] }) {
  return (
    <mesh position={at} rotation={[0, 0, Math.PI / 2]}>
      <cylinderGeometry args={[0.07, 0.085, 0.34, 12]} />
      <meshLambertMaterial color="#3a3f46" />
    </mesh>
  );
}

function Piece({ item }: { item: ShopItem }) {
  const { id, kind, color, size } = item;
  if (kind === "floor") return <FloorCard a={color} b={item.accent ?? "#fff"} />;
  if (id === "armchair") return <Armchair color={color} />;
  if (kind === "chair" || kind === "throne") return <PlasticChair color={color} />;
  if (kind === "sofa") return <Sofa color={color} seats={size.startsWith("3") ? 3 : 2} />;
  if (kind === "bed") return <Bed color={color} />;
  if (kind === "wall") return <Crate color={color} />;
  if (kind === "table" || kind === "desk") return <Table color={color} />;
  if (kind === "fan") return <Fan />;
  if (kind === "ac") return <AirCon />;
  if (kind === "food") return <Bowl color={color} />;
  if (kind === "lamp") return <Bulb color={color} />;
  if (kind === "fridge") return <Crate color={color} />;
  if (kind === "stove") return <Pot color={item.accent ?? color} />;
  if (kind === "sink") return <Crate color={color} />;
  if (kind === "toilet") return <Crate color={color} />;
  if (kind === "shower") return <Crate color="#d5e7f2" />;
  if (kind === "tv") return <Screen color={color} wide={size.startsWith("2")} />;
  if (kind === "guitar") return <Guitar color={color} />;
  if (kind === "weights") return <Crate color={color} />;
  if (kind === "plant") return <Plant color={color} />;
  if (kind === "rug") return <FloorCard a={color} b={item.accent ?? "#1f8a70"} />;
  if (kind === "curtain" || kind === "painting") return <Cloth />;
  if (kind === "tank") return <Crate color={color} />;
  if (kind === "statue" || kind === "vault") return <Crate color={color} />;
  if (kind === "dog" || kind === "cat") return <Pet color={color} />;
  if (kind === "bird") return <Bird color={color} />;
  if (id === "pan" || id === "kerosene") return <Pot color={color} />;
  if (id === "pillow") return <Pillow color={color} />;
  if (id === "kente") return <Cloth />;
  if (id === "bucket" || id === "bowl-set") return <Bucket color={color} />;
  if (id === "speaker" || id === "transistor") return <Speaker color={color} />;
  if (id === "book") return <Books color={color} />;
  if (id === "generator" || id === "yellow-gen" || id === "solar") return <Generator color={color} />;
  return <Crate color={color} />;
}

function FloorCard({ a, b }: { a: string; b: string }) {
  const tiles: Block[] = [];
  for (let row = 0; row < 3; row += 1) {
    for (let col = 0; col < 3; col += 1) {
      tiles.push({ x: -18 + col * 12, y: 0, z: -12 + row * 10, w: 11, h: 1.2, d: 9, color: (col + row) % 2 === 0 ? a : b });
    }
  }
  return <Blocks items={tiles} />;
}

function Screen({ color, wide }: { color: string; wide: boolean }) {
  return (
    <Blocks
      items={[
        { x: wide ? -24 : -16, y: 0, z: -4, w: wide ? 48 : 32, h: 8, d: 10, color: "#cbbba6" },
        { x: wide ? -22 : -14, y: 8, z: -2, w: wide ? 44 : 28, h: 22, d: 3, color },
      ]}
    />
  );
}

function Guitar({ color }: { color: string }) {
  return (
    <g>
      <path d="M58 18 L66 18 L62 48 L58 48 Z" fill="#5c4030" />
      <ellipse cx="60" cy="58" rx="16" ry="18" fill={color} />
      <circle cx="60" cy="58" r="4" fill="#5c4030" />
    </g>
  );
}

function Plant({ color }: { color: string }) {
  return (
    <g>
      <path d="M48 70 h24 l-4 -16 h-16 Z" fill="#cbbba6" />
      <path d="M60 54 L48 28 L58 40 Z" fill={color} />
      <path d="M60 50 L74 24 L66 42 Z" fill={color} />
    </g>
  );
}

function Pet({ color }: { color: string }) {
  return (
    <g>
      <ellipse cx="58" cy="58" rx="22" ry="12" fill={color} />
      <circle cx="78" cy="50" r="10" fill={color} />
      <circle cx="82" cy="48" r="4" fill="#f4efe6" />
    </g>
  );
}

function Bird({ color }: { color: string }) {
  return (
    <g>
      <path d="M58 72 v-28" stroke="#5c4030" strokeWidth="4" />
      <circle cx="58" cy="38" r="10" fill={color} />
      <path d="M66 36 h10" stroke="#e7c85a" strokeWidth="2" />
    </g>
  );
}

type Block = { x: number; y: number; z: number; w: number; h: number; d: number; color: string };

function at(x: number, y: number, z: number): [number, number] {
  return [60 + (x - z) * 1.15, 64 + (x + z) * 0.56 - y * 1.12];
}

function Blocks({ items }: { items: Block[] }) {
  const sorted = [...items].sort((a, b) => a.x + a.z + a.y * 0.2 - (b.x + b.z + b.y * 0.2));
  return (
    <g>
      {sorted.map((block, index) => {
        const { x, y, z, w, h, d, color } = block;
        const p = (dx: number, dy: number, dz: number) => at(x + dx, y + dy, z + dz);
        const front = [p(0, 0, d), p(0, h, d), p(w, h, d), p(w, 0, d)];
        const side = [p(w, 0, 0), p(w, h, 0), p(w, h, d), p(w, 0, d)];
        const top = [p(0, h, 0), p(w, h, 0), p(w, h, d), p(0, h, d)];
        const points = (pts: [number, number][]) => pts.map(([px, py]) => `${px.toFixed(1)},${py.toFixed(1)}`).join(" ");
        return (
          <g key={index}>
            <polygon points={points(front)} fill={shade(color, 0.58)} />
            <polygon points={points(side)} fill={shade(color, 0.8)} />
            <polygon points={points(top)} fill={tint(color, 0.22)} />
          </g>
        );
      })}
    </g>
  );
}

function PlasticChair({ color }: { color: string }) {
  const leg = { w: 3.6, h: 16, d: 3.6, color };
  return (
    <Blocks
      items={[
        { x: -11, y: 0, z: -8, ...leg },
        { x: 8, y: 0, z: -8, ...leg },
        { x: -11, y: 0, z: 10, ...leg },
        { x: 8, y: 0, z: 10, ...leg },
        { x: -13, y: 16, z: -8, w: 26, h: 3.8, d: 22, color },
        { x: -12, y: 19.8, z: -8, w: 24, h: 18, d: 3.4, color },
      ]}
    />
  );
}

function Armchair({ color }: { color: string }) {
  const wood = "#8a623c";
  return (
    <Blocks
      items={[
        { x: -12, y: 0, z: -6, w: 3.2, h: 6, d: 3.2, color: wood },
        { x: 9, y: 0, z: -6, w: 3.2, h: 6, d: 3.2, color: wood },
        { x: -12, y: 0, z: 8, w: 3.2, h: 6, d: 3.2, color: wood },
        { x: 9, y: 0, z: 8, w: 3.2, h: 6, d: 3.2, color: wood },
        { x: -14, y: 6, z: -2, w: 4, h: 10, d: 14, color },
        { x: 10, y: 6, z: -2, w: 4, h: 10, d: 14, color },
        { x: -10, y: 6, z: -8, w: 20, h: 14, d: 4, color },
        { x: -10, y: 8, z: -3, w: 20, h: 4, d: 14, color },
      ]}
    />
  );
}

function Sofa({ color, seats }: { color: string; seats: number }) {
  const seat = seats === 3 ? 11 : 12;
  const total = seats * seat + (seats - 1) * 0.7;
  const x0 = -total / 2;
  const wood = "#6b4a30";
  const items: Block[] = [
    { x: x0 + 1, y: 0, z: -5, w: 3, h: 5, d: 3, color: wood },
    { x: x0 + total - 4, y: 0, z: -5, w: 3, h: 5, d: 3, color: wood },
    { x: x0 + 1, y: 0, z: 8, w: 3, h: 5, d: 3, color: wood },
    { x: x0 + total - 4, y: 0, z: 8, w: 3, h: 5, d: 3, color: wood },
    { x: x0 - 3, y: 5, z: -3, w: 3.2, h: 9, d: 14, color },
    { x: x0 + total, y: 5, z: -3, w: 3.2, h: 9, d: 14, color },
    { x: x0, y: 5, z: -6, w: total, h: 4, d: 16, color },
  ];
  for (let i = 0; i < seats; i += 1) {
    const x = x0 + i * (seat + 0.7);
    items.push({ x, y: 9, z: -6, w: seat, h: 11, d: 3.6, color });
    items.push({ x: x + 0.4, y: 9, z: -2, w: seat - 0.8, h: 3.2, d: 11, color });
  }
  return <Blocks items={items} />;
}

function Bed({ color }: { color: string }) {
  const wood = "#7a4e30";
  return (
    <Blocks
      items={[
        { x: -16, y: 0, z: -8, w: 3, h: 5, d: 3, color: wood },
        { x: 13, y: 0, z: -8, w: 3, h: 5, d: 3, color: wood },
        { x: -16, y: 0, z: 10, w: 3, h: 5, d: 3, color: wood },
        { x: 13, y: 0, z: 10, w: 3, h: 5, d: 3, color: wood },
        { x: -16, y: 5, z: -10, w: 32, h: 10, d: 3, color: wood },
        { x: -15, y: 5, z: -7, w: 30, h: 4, d: 20, color: "#f3efe8" },
        { x: -13, y: 9, z: -1, w: 26, h: 2.4, d: 13, color },
        { x: -10, y: 9.2, z: -6, w: 8, h: 2.2, d: 5, color: "#ffffff" },
        { x: 1, y: 9.2, z: -6, w: 8, h: 2.2, d: 5, color: "#f7f4ef" },
      ]}
    />
  );
}

function Table({ color }: { color: string }) {
  const leg = { w: 3, h: 14, d: 3, color };
  const [px, py] = at(0, 18.2, 2);
  return (
    <g>
      <Blocks
        items={[
          { x: -14, y: 0, z: -8, ...leg },
          { x: 11, y: 0, z: -8, ...leg },
          { x: -14, y: 0, z: 8, ...leg },
          { x: 11, y: 0, z: 8, ...leg },
          { x: -16, y: 14, z: -10, w: 32, h: 3, d: 20, color },
        ]}
      />
      <ellipse cx={px} cy={py} rx="7" ry="3" fill="#f7f4ef" />
      <ellipse cx={px} cy={py - 0.6} rx="3.5" ry="1.5" fill="#c4563a" />
    </g>
  );
}

function Fan() {
  const [hx, hy] = at(0, 32, 2);
  return (
    <g>
      <Blocks
        items={[
          { x: -12, y: 0, z: -6, w: 24, h: 4, d: 14, color: "#243044" },
          { x: -2, y: 4, z: -2, w: 4, h: 20, d: 4, color: "#9aafc2" },
        ]}
      />
      <ellipse cx={hx - 6} cy={hy - 4} rx="14" ry="14" fill="#b7c9da" />
      <ellipse cx={hx} cy={hy} rx="14" ry="14" fill="#f7fbfe" />
      <ellipse cx={hx} cy={hy} rx="9" ry="9" fill="#d5e6f2" />
      <circle cx={hx} cy={hy} r="3" fill="#7f97ab" />
    </g>
  );
}

function AirCon() {
  return (
    <Blocks
      items={[
        { x: -20, y: 10, z: -4, w: 40, h: 14, d: 12, color: "#f4f7fa" },
        { x: -12, y: 15, z: 8, w: 16, h: 2.2, d: 1.4, color: "#c5d0dc" },
        { x: 10, y: 15, z: 8, w: 4, h: 4, d: 1.2, color: "#7eb6e8" },
      ]}
    />
  );
}

function Bowl({ color }: { color: string }) {
  return (
    <g>
      <path d="M28 48 h64 l-8 16 a28 10 0 0 1 -48 0 Z" fill="#f4efe6" />
      <ellipse cx="60" cy="48" rx="32" ry="11" fill="#fff" />
      <ellipse cx="60" cy="48" rx="24" ry="8" fill={color} />
      <circle cx="50" cy="46" r="5" fill="#c4563a" />
      <circle cx="66" cy="50" r="3.5" fill="#3c8f4e" />
    </g>
  );
}

function Bulb({ color }: { color: string }) {
  return (
    <g>
      <circle cx="60" cy="36" r="22" fill={color} opacity="0.35" />
      <circle cx="60" cy="38" r="14" fill={color} />
      <path d="M52 50 h16 l-2 8 h-12 Z" fill="#d9d3c6" />
      <rect x="54" y="58" width="12" height="6" rx="1" fill="#b7b0a2" />
    </g>
  );
}

function Pot({ color }: { color: string }) {
  return (
    <g>
      <path d="M36 46 h-10 v10 h10" fill="none" stroke={shade(color, 0.7)} strokeWidth="3" strokeLinecap="round" />
      <path d="M84 46 h10 v10 h-10" fill="none" stroke={shade(color, 0.7)} strokeWidth="3" strokeLinecap="round" />
      <path d="M36 40 v16 a24 9 0 0 0 48 0 V40" fill={color} />
      <ellipse cx="60" cy="40" rx="24" ry="8" fill={tint(color, 0.28)} />
      <ellipse cx="60" cy="37" rx="12" ry="4" fill={shade(color, 0.75)} />
    </g>
  );
}

function Pillow({ color }: { color: string }) {
  return (
    <g>
      <path d="M28 58 C28 40 42 32 60 32 C78 32 92 40 92 58 C92 70 78 76 60 76 C42 76 28 70 28 58 Z" fill={color} />
      <path d="M40 48 C48 42 72 42 80 50" fill="none" stroke="#fff" strokeWidth="2" opacity="0.55" strokeLinecap="round" />
    </g>
  );
}

function Cloth() {
  return (
    <g>
      <path d="M26 36 L78 22 L98 36 L46 50 Z" fill="#c4563a" />
      <path d="M46 50 L98 36 L98 58 L46 72 Z" fill="#9a391d" />
      <path d="M34 40 L70 30" stroke="#e7c85a" strokeWidth="3" />
      <path d="M40 52 L86 40" stroke="#1f8a70" strokeWidth="3" />
      <path d="M48 62 L92 50" stroke="#e7c85a" strokeWidth="3" />
    </g>
  );
}

function Bucket({ color }: { color: string }) {
  return (
    <g>
      <path d="M40 36 h40 l-6 28 h-28 Z" fill={color} />
      <ellipse cx="60" cy="36" rx="20" ry="7" fill={tint(color, 0.3)} />
      <path d="M42 30 C42 18 78 18 78 30" fill="none" stroke="#8aa0b4" strokeWidth="2.5" />
    </g>
  );
}

function Speaker({ color }: { color: string }) {
  return (
    <g>
      <rect x="38" y="22" width="44" height="52" rx="12" fill={color} />
      <circle cx="60" cy="42" r="12" fill="#2a3344" />
      <circle cx="60" cy="42" r="5" fill="#4d5b70" />
      <circle cx="60" cy="64" r="3" fill="#006B3F" />
    </g>
  );
}

function Books({ color }: { color: string }) {
  return (
    <g>
      <path d="M30 58 L78 46 L86 52 L38 64 Z" fill="#c4563a" />
      <path d="M34 50 L82 38 L90 44 L42 56 Z" fill={color} />
      <path d="M38 42 L86 30 L94 36 L46 48 Z" fill="#1f8a70" />
    </g>
  );
}

function Generator({ color }: { color: string }) {
  return (
    <g>
      <path d="M28 40 L78 28 L96 38 L46 50 Z" fill={tint(color, 0.2)} />
      <path d="M46 50 L96 38 L96 58 L46 70 Z" fill={color} />
      <path d="M28 40 L46 50 L46 70 L28 60 Z" fill={shade(color, 0.75)} />
      <path d="M56 46 L84 38" stroke="#d7e7f4" strokeWidth="2" />
      <path d="M58 52 L80 46" stroke="#d7e7f4" strokeWidth="2" />
      <circle cx="70" cy="58" r="3" fill="#e7c85a" />
    </g>
  );
}

function Crate({ color }: { color: string }) {
  return (
    <g>
      <path d="M34 36 L74 24 L92 34 L52 46 Z" fill={tint(color, 0.15)} />
      <path d="M52 46 L92 34 L92 58 L52 70 Z" fill={shade(color)} />
      <path d="M34 36 L52 46 L52 70 L34 60 Z" fill={shade(color, 0.72)} />
    </g>
  );
}

function shade(hex: string, amount = 0.82) {
  const raw = hex.replace("#", "");
  if (raw.length !== 6) return hex;
  const channel = (start: number) => Math.max(0, Math.round(Number.parseInt(raw.slice(start, start + 2), 16) * amount));
  return `rgb(${channel(0)} ${channel(2)} ${channel(4)})`;
}

function tint(hex: string, amount: number) {
  const raw = hex.replace("#", "");
  if (raw.length !== 6) return hex;
  const channel = (start: number) => {
    const value = Number.parseInt(raw.slice(start, start + 2), 16);
    return Math.round(value + (255 - value) * amount);
  };
  return `rgb(${channel(0)} ${channel(2)} ${channel(4)})`;
}
