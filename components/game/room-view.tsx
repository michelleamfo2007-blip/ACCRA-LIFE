"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { cedis, hourOf, sellValue, SHOP, type Life, type Placed } from "@/lib/game/world";

const Apartment = dynamic(() => import("@/components/game/apartment").then((mod) => mod.Apartment), { ssr: false });

const SPOTS = {
  door: { x: -4.7, z: 0.15, action: "map" },
  bed: { x: 1.15, z: -1.85, action: "sleep" },
  chair: { x: -0.7, z: 0.45, action: "gist" },
  radio: { x: 0.35, z: 0.7, action: "radio" },
  cooler: { x: 3.7, z: 1.7, action: "cooler" },
  stove: { x: 3.5, z: 2.6, action: "cook" },
  toilet: { x: -3.9, z: 2.7, action: "toilet" },
  shower: { x: -4.6, z: 1.85, action: "shower" },
  roamA: { x: -0.2, z: 1.2, action: null },
  roamB: { x: 0.8, z: 0.2, action: null },
  roamC: { x: -1.1, z: 1.6, action: null },
};

export function RoomView({
  life,
  onAct,
  onMap,
  onAsk,
  errand = null,
  onLay,
  onStore,
  onSell,
}: {
  life: Life;
  onAct: (id: string) => void;
  onMap: () => void;
  onAsk: () => void;
  errand?: { spot: string; n: number } | null;
  onLay?: (id: string, x: number, z: number, rot: number) => void;
  onStore?: (id: string) => void;
  onSell?: (id: string) => void;
}) {
  const night = hourOf(life.minutes) >= 19 || hourOf(life.minutes) < 5;
  const dark = life.dumsor && !life.inventory.includes("generator");
  const mattress = life.inventory.includes("mattress");
  const [pos, setPos] = useState({ x: 0.2, z: 1.1 });
  const [pose, setPose] = useState<"idle" | "walk" | "act">("idle");
  const [heading, setHeading] = useState(0);
  const posRef = useRef(pos);
  const busy = useRef(false);
  const frame = useRef(0);
  const onActRef = useRef(onAct);
  const onMapRef = useRef(onMap);
  const [picked, setPicked] = useState<string | null>(null);
  const [draft, setDraft] = useState<Placed | null>(null);

  useEffect(() => {
    onActRef.current = onAct;
    onMapRef.current = onMap;
  }, [onAct, onMap]);

  function walkTo(target: { x: number; z: number }, action: string | null) {
    cancelAnimationFrame(frame.current);
    busy.current = true;
    const start = { ...posRef.current };
    const dx = target.x - start.x;
    const dz = target.z - start.z;
    setHeading(Math.atan2(dx, dz));
    setPose("walk");
    const duration = Math.max(900, Math.hypot(dx, dz) * 420);
    const started = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - started) / duration);
      const eased = 1 - (1 - t) ** 3;
      const next = { x: start.x + dx * eased, y: 0, z: start.z + dz * eased };
      const point = { x: next.x, z: next.z };
      posRef.current = point;
      setPos(point);
      if (t < 1) {
        frame.current = requestAnimationFrame(step);
        return;
      }
      if (action === "map") {
        setPose("idle");
        busy.current = false;
        onMapRef.current();
        return;
      }
      if (action) {
        setPose("act");
        onActRef.current(action);
        window.setTimeout(() => {
          setPose("idle");
          busy.current = false;
        }, 800);
        return;
      }
      setPose("idle");
      busy.current = false;
    };
    frame.current = requestAnimationFrame(step);
  }

  useEffect(() => {
    const id = window.setInterval(() => {
      if (busy.current) return;
      if (localStorage.getItem("accralife-freewill") === "0") return;
      const roam = ["roamA", "roamB", "roamC"][Math.floor(Math.random() * 3)] as keyof typeof SPOTS;
      walkTo(SPOTS[roam], null);
    }, 8000);
    return () => {
      window.clearInterval(id);
      cancelAnimationFrame(frame.current);
    };
  }, []);

  useEffect(() => {
    if (!errand) return;
    const spot = SPOTS[errand.spot as keyof typeof SPOTS];
    if (spot) walkTo(spot, spot.action);
  }, [errand?.n]);

  useEffect(() => {
    if (!draft) return;
    const onKey = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (key.startsWith("arrow")) event.preventDefault();
      if (key === "arrowup") nudge(0, -0.35);
      if (key === "arrowdown") nudge(0, 0.35);
      if (key === "arrowleft") nudge(-0.35, 0);
      if (key === "arrowright") nudge(0.35, 0);
      if (key === "r") setDraft((current) => (current ? { ...current, rot: (current.rot + 1) % 4 } : current));
      if (key === "enter") commitDraft();
      if (key === "escape") setDraft(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [draft]);

  function nudge(x: number, z: number) {
    setDraft((current) => (current ? { ...current, x: clampRoom(current.x + x, -4.2, 4.2), z: clampRoom(current.z + z, -3.2, 3.4) } : current));
  }

  function commitDraft() {
    if (!draft) return;
    onLay?.(draft.id, draft.x, draft.z, draft.rot);
    setDraft(null);
  }

  const owns = (id: string) => life.inventory.includes(id);
  const sofaColor = owns("gold") ? "#8b1e3f" : owns("leather") ? "#1c1c1c" : owns("family") ? "#c4844a" : "#2f8f6b";

  return (
    <div className="absolute inset-0 touch-none" style={{ background: dark ? "#10131a" : night ? "#1b2744" : "#c5d7ea" }}>
      <Apartment
        life={life}
        pos={pos}
        pose={pose}
        heading={heading}
        dark={dark}
        bedColor={mattress ? "#3f4f86" : "#243056"}
        sofaColor={sofaColor}
        onAsk={onAsk}
        onGo={(id) => walkTo(SPOTS[id as keyof typeof SPOTS], SPOTS[id as keyof typeof SPOTS].action)}
        pieces={shownPieces(life, draft)}
        picked={draft?.id ?? picked}
        placing={Boolean(draft)}
        onPick={(id) => {
          setDraft(null);
          setPicked(id);
        }}
        onDrag={(x, z) => setDraft((current) => (current ? { ...current, x: clampRoom(x, -4.2, 4.2), z: clampRoom(z, -3.2, 3.4) } : current))}
      />
      <PieceCard
        id={draft?.id ?? picked}
        placing={Boolean(draft)}
        onMove={() => {
          const piece = (life.furniture ?? []).find((item) => item.id === picked);
          if (piece) setDraft({ ...piece });
        }}
        onTurn={() => {
          const piece = (life.furniture ?? []).find((item) => item.id === picked);
          if (!piece) return;
          onLay?.(piece.id, piece.x, piece.z, (piece.rot + 1) % 4);
        }}
        onStore={() => {
          if (!picked) return;
          onStore?.(picked);
          setPicked(null);
          setDraft(null);
        }}
        onSell={() => {
          if (!picked) return;
          onSell?.(picked);
          setPicked(null);
          setDraft(null);
        }}
        onClose={() => {
          setPicked(null);
          setDraft(null);
        }}
        onNudge={nudge}
        onRotate={() => setDraft((current) => (current ? { ...current, rot: (current.rot + 1) % 4 } : current))}
        onPlace={commitDraft}
        onCancel={() => setDraft(null)}
      />
    </div>
  );
}

function shownPieces(life: Life, draft: Placed | null) {
  const pieces = (life.furniture ?? []).filter((piece) => piece.id !== draft?.id);
  return draft ? [...pieces, draft] : pieces;
}

function clampRoom(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function PieceCard({
  id,
  placing,
  onMove,
  onTurn,
  onStore,
  onClose,
  onSell,
  onNudge,
  onRotate,
  onPlace,
  onCancel,
}: {
  id: string | null;
  placing: boolean;
  onMove: () => void;
  onTurn: () => void;
  onStore: () => void;
  onClose: () => void;
  onSell: () => void;
  onNudge: (x: number, z: number) => void;
  onRotate: () => void;
  onPlace: () => void;
  onCancel: () => void;
}) {
  const item = SHOP.find((entry) => entry.id === id);
  if (!item) return null;
  return (
    <div className="absolute inset-x-2 bottom-[max(4.6rem,env(safe-area-inset-bottom))] z-40 mx-auto w-[min(100%,28rem)] rounded-[24px] bg-white p-4 shadow-[0_16px_50px_rgba(22,32,60,.22)] sm:inset-x-auto">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold">{item.name}</p>
          <p className="text-xs text-[#5c6b82]">{placing ? "Drag or arrow keys move · R rotates · Enter places · Esc cancels" : `Sells for ${cedis(sellValue(item.price))}`}</p>
        </div>
        <p className="shrink-0 font-bold">{cedis(item.price)}</p>
      </div>
      {placing ? (
        <div className="mt-3 flex items-center gap-3">
          <div className="grid grid-cols-3 gap-1">
            <span />
            <Pad onClick={() => onNudge(0, -0.35)}>↑</Pad>
            <span />
            <Pad onClick={() => onNudge(-0.35, 0)}>←</Pad>
            <button type="button" aria-label="Rotate" onClick={onRotate} className="grid h-10 w-10 place-items-center rounded-full bg-[#3b6cff] text-lg text-white">
              ↻
            </button>
            <Pad onClick={() => onNudge(0.35, 0)}>→</Pad>
            <span />
            <Pad onClick={() => onNudge(0, 0.35)}>↓</Pad>
            <span />
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <button type="button" onClick={onPlace} className="w-full rounded-full bg-[#006B3F] py-3 text-sm font-bold text-white">
              ✓ Place
            </button>
            <button type="button" onClick={onCancel} className="w-full rounded-full bg-[#f4f7fb] py-3 text-sm font-bold">
              × Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          <Choice onClick={onMove}>Move</Choice>
          <Choice onClick={onTurn}>Turn</Choice>
          <Choice onClick={onStore}>Store</Choice>
          <Choice onClick={onClose}>Close</Choice>
          <button type="button" onClick={onSell} className="min-w-[4.5rem] flex-1 rounded-full bg-[#fde8ea] px-3 py-2.5 text-sm font-semibold text-[#CE1126]">
            Sell
          </button>
        </div>
      )}
    </div>
  );
}

function Pad({ children, onClick }: { children: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="grid h-10 w-10 place-items-center rounded-full bg-[#f4f7fb] text-sm font-bold">
      {children}
    </button>
  );
}

function Choice({ children, onClick }: { children: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="min-w-[4.5rem] flex-1 rounded-full bg-[#f4f7fb] px-3 py-2.5 text-sm font-semibold">
      {children}
    </button>
  );
}
