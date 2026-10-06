"use client";

import { useState } from "react";
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
};

export function Catalogue({
  cash,
  owned,
  onBuy,
  onClose,
}: {
  cash: number;
  owned: string[];
  onBuy: (id: string) => void;
  onClose: () => void;
}) {
  const [category, setCategory] = useState<(typeof SHOP_CATEGORIES)[number]["id"]>("comfort");
  const items = SHOP.filter((item) => item.category === category);

  return (
    <div className="absolute inset-x-0 bottom-0 z-40 flex max-h-[78vh] flex-col rounded-t-[28px] bg-[#f7f8fb] shadow-[0_-16px_50px_rgba(22,32,60,.2)]">
      <div className="flex items-center justify-between px-5 pt-4">
        <h2 className="font-display text-2xl tracking-tight text-[#16203c]">Catalogue</h2>
        <button type="button" onClick={onClose} className="rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-[#5c6b82] shadow-sm">
          Hide
        </button>
      </div>
      <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto px-5 pb-1">
        {SHOP_CATEGORIES.map((chip) => (
          <button
            key={chip.id}
            type="button"
            onClick={() => setCategory(chip.id)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-semibold ${category === chip.id ? "bg-[#16203c] text-white" : "bg-[#e7eef6] text-[#3d4d66]"}`}
          >
            {MARKS[chip.id]} {chip.label}
          </button>
        ))}
      </div>
      <p className="px-5 pb-2 text-xs text-[#8b97ab]">Wallet {cedis(cash)}</p>
      <div className="grid min-h-0 flex-1 grid-cols-2 gap-3 overflow-auto px-4 pb-6 sm:grid-cols-3">
        {items.map((item) => {
          const have = !item.consume && owned.includes(item.id);
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onBuy(item.id)}
              className="rounded-[22px] bg-white p-3 text-left shadow-sm"
            >
              <span className="flex items-center justify-between text-[11px] text-[#8b97ab]">
                <span>{item.size}</span>
                <span className="text-[#e0b44a]">{"★".repeat(item.stars)}</span>
              </span>
              <span className="mt-1 grid h-28 place-items-center">
                <ItemArt item={item} />
              </span>
              <span className="mt-1 block text-sm font-semibold text-[#16203c]">{item.name}</span>
              <span className={`mt-1 block text-sm font-bold ${have ? "text-[#8b97ab]" : "text-[#2f9d62]"}`}>{have ? "In the room" : cedis(item.price)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ItemArt({ item }: { item: ShopItem }) {
  return (
    <svg viewBox="0 0 120 90" className="h-24 w-28" aria-hidden>
      <ellipse cx="60" cy="80" rx="36" ry="5.5" fill="#16203c" opacity="0.08" />
      <Piece item={item} />
    </svg>
  );
}

function Piece({ item }: { item: ShopItem }) {
  const { id, kind, color, size } = item;
  if (id === "armchair") return <Armchair color={color} />;
  if (kind === "chair") return <PlasticChair color={color} />;
  if (kind === "sofa") return <Sofa color={color} seats={size.startsWith("3") ? 3 : 2} />;
  if (kind === "bed") return <Bed color={color} />;
  if (kind === "table") return <Table color={color} />;
  if (kind === "fan") return <Fan />;
  if (kind === "ac") return <AirCon />;
  if (kind === "food") return <Bowl color={color} />;
  if (kind === "lamp") return <Bulb color={color} />;
  if (id === "pan") return <Pot color={color} />;
  if (id === "pillow") return <Pillow color={color} />;
  if (id === "kente") return <Cloth />;
  if (id === "bucket") return <Bucket color={color} />;
  if (id === "speaker") return <Speaker color={color} />;
  if (id === "book") return <Books color={color} />;
  if (id === "generator") return <Generator color={color} />;
  return <Crate color={color} />;
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
      <circle cx="60" cy="64" r="3" fill="#3cba78" />
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
