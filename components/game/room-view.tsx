"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { HomeDesk } from "@/components/game/home-desk";
import { ItemSheet } from "@/components/game/item-sheet";
import { fixtureCard, pieceCard, type FixtureId } from "@/lib/game/item-verbs";
import { activeGuests, doorGuests } from "@/lib/game/home-life";
import { cedis, hasCurrent, homeLook, hourOf, sellValue, SHOP, type Life, type Placed, type Verb } from "@/lib/game/world";

const Apartment = dynamic(() => import("@/components/game/apartment").then((mod) => mod.Apartment), { ssr: false });

const SPOTS = {
  door: { x: -4.7, z: 0.15, action: "map" },
  bed: { x: 1.15, z: -1.85, action: "sleep" },
  /** On the sofa seat (Sofa mesh is at -1.55, -0.15). */
  chair: { x: -1.55, z: 0.02, action: "gist" },
  radio: { x: 0.35, z: 0.7, action: "radio" },
  cooler: { x: 3.7, z: 1.7, action: "cooler" },
  stove: { x: 3.5, z: 2.6, action: "cook" },
  toilet: { x: -3.9, z: 2.7, action: "toilet" },
  shower: { x: -4.6, z: 1.85, action: "shower" },
  roamA: { x: -0.2, z: 1.2, action: null },
  roamB: { x: 0.8, z: 0.2, action: null },
  roamC: { x: -1.1, z: 1.6, action: null },
};

type Pose = "idle" | "walk" | "act" | "sleep" | "sit";

function sitVerb(verb: Verb) {
  if (verb.sleep) return false;
  return /sit|rest|doze|sofa|chair|street|arm-|throne|watch|gist|scroll|chill|tea|papers/i.test(`${verb.id} ${verb.label}`);
}

export function RoomView({
  life,
  onAct,
  onRun,
  onMap,
  onAsk,
  errand = null,
  onLay,
  onStore,
  onSell,
  onCook,
  onHang,
  onSleepover,
  onSendHome,
  onOpenDoor,
  onInvite,
  onVisit,
  cloud = false,
  friends = [],
  invites = [],
  onUpgrade,
  startArrange = false,
  onArrangeSeen,
}: {
  life: Life;
  onAct: (id: string) => void;
  onRun?: (verb: Verb) => void;
  onMap: () => void;
  onAsk: () => void;
  errand?: { spot: string; n: number } | null;
  onLay?: (id: string, x: number, z: number, rot: number) => void;
  onStore?: (id: string) => void;
  onSell?: (id: string) => void;
  onCook?: (recipeId: string, shareWith?: string) => void;
  onHang?: (name: string, kind: "chat" | "tv" | "game" | "drink") => void;
  onSleepover?: (name: string) => void;
  onSendHome?: (name: string) => void;
  onOpenDoor?: (name: string) => void;
  onInvite?: (username: string) => void;
  onVisit?: (username: string) => void;
  cloud?: boolean;
  friends?: { username: string; name: string }[];
  invites?: { from: string; at: string }[];
  onUpgrade?: () => void;
  startArrange?: boolean;
  onArrangeSeen?: () => void;
}) {
  const night = hourOf(life.minutes) >= 19 || hourOf(life.minutes) < 5;
  const dark = life.dumsor && !hasCurrent(life.inventory);
  const bedItem = SHOP.filter((item) => item.kind === "bed" && life.inventory.includes(item.id)).sort((a, b) => b.price - a.price)[0];
  const [pos, setPos] = useState({ x: 0.2, z: 1.1 });
  const [pose, setPose] = useState<Pose>("idle");
  const [heading, setHeading] = useState(0);
  const posRef = useRef(pos);
  const busy = useRef(false);
  const seated = useRef(false);
  const frame = useRef(0);
  const onActRef = useRef(onAct);
  const onRunRef = useRef(onRun);
  const onMapRef = useRef(onMap);
  const [picked, setPicked] = useState<string | null>(null);
  const [fixture, setFixture] = useState<FixtureId | null>(null);
  const [draft, setDraft] = useState<Placed | null>(null);
  const [arrange, setArrange] = useState(false);

  function canInterrupt() {
    return !busy.current || seated.current;
  }

  useEffect(() => {
    onActRef.current = onAct;
    onRunRef.current = onRun;
    onMapRef.current = onMap;
  }, [onAct, onRun, onMap]);

  useEffect(() => {
    if (!startArrange) return;
    setArrange(true);
    onArrangeSeen?.();
  }, [startArrange, onArrangeSeen]);

  function runAt(target: { x: number; z: number }, verb: Verb, inBed: boolean) {
    walkTo(target, null, () => {
      const sitting = !inBed && sitVerb(verb);
      if (sitting) {
        seated.current = true;
        setHeading(0);
        setPose("sit");
        onRunRef.current?.(verb);
        busy.current = false;
        return;
      }
      seated.current = false;
      setPose(inBed && (verb.sleep || verb.id === "sleep") ? "sleep" : "act");
      onRunRef.current?.(verb);
      window.setTimeout(
        () => {
          setPose("idle");
          busy.current = false;
        },
        inBed && (verb.sleep || verb.id === "sleep") ? 2800 : 1500,
      );
    });
  }

  function sitOnChair() {
    if (seated.current && pose === "sit") return;
    const card = fixtureCard("chair", life);
    const verb =
      card.verbs.find((item) => item.id === "home-lounge") ??
      card.verbs.find((item) => /lounge|sit|rest|gist/i.test(`${item.id} ${item.label}`)) ??
      card.verbs[0];
    if (!verb) return;
    runAt(SPOTS.chair, verb, false);
  }

  function pickVerb(verb: Verb) {
    if (fixture) {
      const spot = SPOTS[fixture];
      setFixture(null);
      runAt(spot, verb, fixture === "bed");
      return;
    }
    const piece = (life.furniture ?? []).find((item) => item.id === picked);
    setPicked(null);
    if (!piece) return;
    runAt({ x: clampRoom(piece.x + (piece.x > 0 ? -0.7 : 0.7), -4.6, 4.6), z: clampRoom(piece.z + 0.55, -3.4, 3.6) }, verb, false);
  }

  function walkTo(target: { x: number; z: number }, action: string | null, arrive?: () => void) {
    cancelAnimationFrame(frame.current);
    seated.current = false;
    busy.current = true;
    const start = { ...posRef.current };
    const dx = target.x - start.x;
    const dz = target.z - start.z;
    setHeading(Math.atan2(dx, dz));
    setPose("walk");
    const duration = Math.max(550, Math.hypot(dx, dz) * 300);
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
      if (arrive) {
        arrive();
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
      if (busy.current || seated.current) return;
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
    setPicked(null);
  }

  const owns = (id: string) => life.inventory.includes(id);
  const look = homeLook(life.homeId);
  const sofaColor = owns("gold") ? "#8b1e3f" : owns("leather") ? "#1c1c1c" : owns("family") ? "#c4844a" : look.sofa;
  const guests = [...doorGuests(life), ...activeGuests(life)];

  return (
    <div className="absolute inset-0 touch-none" style={{ background: dark ? "#10131a" : night ? "#1b2744" : "#c5d7ea" }}>
      <Apartment
        life={life}
        pos={pos}
        pose={pose}
        heading={heading}
        dark={dark}
        bedColor={bedItem?.color ?? look.bed}
        sofaColor={sofaColor}
        guests={guests.map((guest) => ({ name: guest.name, doing: guest.doing }))}
        onAsk={onAsk}
        onWalk={(x, z) => {
          if (draft || !canInterrupt()) return;
          walkTo({ x: clampRoom(x, -4.6, 4.6), z: clampRoom(z, -3.4, 3.6) }, null);
        }}
        onGo={(id) => {
          if (id === "door") {
            walkTo(SPOTS.door, "map");
            return;
          }
          if (draft || (!canInterrupt() && id !== "chair")) return;
          setPicked(null);
          if (id === "chair") {
            sitOnChair();
            return;
          }
          setFixture(id as FixtureId);
        }}
        pieces={shownPieces(life, draft)}
        picked={draft?.id ?? picked}
        placing={Boolean(draft)}
        onPick={(id) => {
          setDraft(null);
          setFixture(null);
          setPicked(id);
        }}
        onDrag={(x, z) => setDraft((current) => (current ? { ...current, x: clampRoom(x, -4.2, 4.2), z: clampRoom(z, -3.2, 3.4) } : current))}
      />
      {pose === "sleep" ? (
        <div className="pointer-events-none absolute left-1/2 top-[max(5rem,calc(env(safe-area-inset-top)+4.5rem))] z-30 -translate-x-1/2 rounded-full bg-white/95 px-4 py-2 text-sm font-semibold text-[#3b6cff] shadow-lg">
          💤 Sleeping…
        </div>
      ) : null}
      {pose === "sit" ? (
        <div className="pointer-events-none absolute left-1/2 top-[max(5rem,calc(env(safe-area-inset-top)+4.5rem))] z-30 -translate-x-1/2 rounded-full bg-white/95 px-4 py-2 text-sm font-semibold text-[#121212] shadow-lg">
          🪑 Sitting · tap floor to get up
        </div>
      ) : null}
      {guests.some((guest) => guest.sleepover) ? (
        <div className="pointer-events-none absolute left-1/2 top-[max(5rem,calc(env(safe-area-inset-top)+4.5rem))] z-30 -translate-x-1/2 rounded-full bg-[#121212] px-4 py-2 text-sm font-semibold text-[#FCD116] shadow-lg">
          😴 Sleepover · breakfast gist in the morning
        </div>
      ) : null}
      {!draft && !arrange && !fixture && !picked && onCook && onHang && onSleepover && onSendHome && onInvite && onVisit ? (
        <HomeDesk
          life={life}
          cloud={cloud}
          friends={friends}
          invites={invites}
          onCook={onCook}
          onHang={onHang}
          onSleepover={onSleepover}
          onSendHome={onSendHome}
          onOpenDoor={onOpenDoor}
          onInvite={onInvite}
          onVisit={onVisit}
          onBuyHint={onUpgrade}
          onArrange={() => setArrange(true)}
        />
      ) : null}
      {arrange && !draft ? (
        <ArrangeTray
          life={life}
          onClose={() => setArrange(false)}
          onBuy={() => onUpgrade?.()}
          onPick={(piece) => {
            setPicked(null);
            setFixture(null);
            setDraft(piece);
            setArrange(false);
          }}
        />
      ) : null}
      {!draft && !fixture && !picked ? (
        <>
          <p className="pointer-events-none absolute bottom-[max(5.6rem,calc(env(safe-area-inset-bottom)+4.8rem))] left-1/2 z-30 -translate-x-1/2 rounded-full bg-black/45 px-3 py-1 text-[11px] font-semibold text-white sm:hidden">
            Cook · friends · pinch zoom · Buy to place
          </p>
          <div className="absolute bottom-[max(7.4rem,calc(env(safe-area-inset-bottom)+6.6rem))] right-2 z-30 flex flex-col gap-1.5">
            <button
              type="button"
              aria-label="Zoom in"
              className="grid h-10 w-10 place-items-center rounded-full bg-white text-lg font-bold shadow-lg"
              onClick={() => window.dispatchEvent(new CustomEvent("accralife-home-zoom", { detail: 0.85 }))}
            >
              +
            </button>
            <button
              type="button"
              aria-label="Zoom out"
              className="grid h-10 w-10 place-items-center rounded-full bg-white text-lg font-bold shadow-lg"
              onClick={() => window.dispatchEvent(new CustomEvent("accralife-home-zoom", { detail: 1.18 }))}
            >
              −
            </button>
          </div>
          <div className="absolute bottom-[max(5.8rem,calc(env(safe-area-inset-bottom)+5rem))] right-2 z-30 grid grid-cols-3 gap-1 sm:hidden">
            <span />
            <WalkPadBtn
              label="Up"
              onClick={() => {
                if (!canInterrupt()) return;
                const next = { x: posRef.current.x, z: clampRoom(posRef.current.z - 0.85, -3.4, 3.6) };
                walkTo(next, null);
              }}
            >
              ↑
            </WalkPadBtn>
            <span />
            <WalkPadBtn
              label="Left"
              onClick={() => {
                if (!canInterrupt()) return;
                const next = { x: clampRoom(posRef.current.x - 0.85, -4.6, 4.6), z: posRef.current.z };
                walkTo(next, null);
              }}
            >
              ←
            </WalkPadBtn>
            <span />
            <WalkPadBtn
              label="Right"
              onClick={() => {
                if (!canInterrupt()) return;
                const next = { x: clampRoom(posRef.current.x + 0.85, -4.6, 4.6), z: posRef.current.z };
                walkTo(next, null);
              }}
            >
              →
            </WalkPadBtn>
            <span />
            <WalkPadBtn
              label="Down"
              onClick={() => {
                if (!canInterrupt()) return;
                const next = { x: posRef.current.x, z: clampRoom(posRef.current.z + 0.85, -3.4, 3.6) };
                walkTo(next, null);
              }}
            >
              ↓
            </WalkPadBtn>
            <span />
          </div>
        </>
      ) : null}
      {fixture && !draft ? <ItemSheet card={fixtureCard(fixture, life)} life={life} onPick={pickVerb} onClose={() => setFixture(null)} /> : null}
      {picked && !draft && pieceCard(picked) ? (
        <ItemSheet
          card={pieceCard(picked)!}
          life={life}
          onPick={pickVerb}
          onClose={() => setPicked(null)}
          footer={
            <PieceTools
              id={picked}
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
                onStore?.(picked);
                setPicked(null);
              }}
              onSell={() => {
                onSell?.(picked);
                setPicked(null);
              }}
            />
          }
        />
      ) : null}
      <PlaceCard
        id={draft?.id ?? null}
        onNudge={nudge}
        onRotate={() => setDraft((current) => (current ? { ...current, rot: (current.rot + 1) % 4 } : current))}
        onPlace={commitDraft}
        onCancel={() => setDraft(null)}
      />
    </div>
  );
}

function ArrangeTray({
  life,
  onClose,
  onBuy,
  onPick,
}: {
  life: Life;
  onClose: () => void;
  onBuy: () => void;
  onPick: (piece: Placed) => void;
}) {
  const pieces = SHOP.filter((item) => life.inventory.includes(item.id) && !item.consume && item.kind !== "floor" && item.kind !== "bed");
  return (
    <div className="absolute inset-x-3 bottom-[max(4.8rem,env(safe-area-inset-bottom))] z-40 max-h-[42vh] overflow-auto rounded-[24px] bg-white p-3 shadow-[0_16px_50px_rgba(22,32,60,.22)]">
      <div className="flex items-center justify-between gap-2">
        <p className="font-semibold">Arrange the inside</p>
        <button type="button" onClick={onClose} className="text-xs font-semibold text-[#5c6b82]">
          Done
        </button>
      </div>
      <p className="mt-1 text-xs text-[#5c6b82]">Tap a piece, drag it on the floor, then Place. Turn it with the blue button.</p>
      {pieces.length === 0 ? (
        <button type="button" onClick={onBuy} className="mt-3 w-full rounded-full bg-[#121212] py-3 text-sm font-bold text-white">
          Buy furniture
        </button>
      ) : (
        <div className="mt-3 space-y-2">
          {pieces.map((item) => {
            const down = (life.furniture ?? []).find((piece) => piece.id === item.id);
            const parked = (life.stored ?? []).includes(item.id);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onPick(down ?? { id: item.id, x: 0.2, z: 0.6, rot: 0 })}
                className="flex w-full items-center gap-3 rounded-2xl bg-[#f4f7fb] px-3 py-2 text-left"
              >
                <span className="h-8 w-8 rounded-lg" style={{ background: item.color }} />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">{item.name}</span>
                  <span className="block text-[11px] text-[#5c6b82]">{down ? "In the room · move it" : parked ? "Stored · put it down" : "Put it down"}</span>
                </span>
              </button>
            );
          })}
          <button type="button" onClick={onBuy} className="w-full rounded-full bg-[#fff4c2] py-2.5 text-xs font-bold text-[#7a3b0c]">
            Buy more
          </button>
        </div>
      )}
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

function PieceTools({ id, onMove, onTurn, onStore, onSell }: { id: string; onMove: () => void; onTurn: () => void; onStore: () => void; onSell: () => void }) {
  const item = SHOP.find((entry) => entry.id === id);
  if (!item) return null;
  return (
    <div className="rounded-2xl bg-[#f7f8fb] p-3">
      <p className="text-xs text-[#5c6b82]">
        Bought for {cedis(item.price)} · sells for {cedis(sellValue(item.price))}
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        <Choice onClick={onMove}>Move</Choice>
        <Choice onClick={onTurn}>Turn</Choice>
        <Choice onClick={onStore}>Store</Choice>
        <button type="button" onClick={onSell} className="min-w-[4.5rem] flex-1 rounded-full bg-[#fde8ea] px-3 py-2.5 text-sm font-semibold text-[#CE1126]">
          Sell
        </button>
      </div>
    </div>
  );
}

function PlaceCard({
  id,
  onNudge,
  onRotate,
  onPlace,
  onCancel,
}: {
  id: string | null;
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
          <p className="text-xs text-[#5c6b82]">Drag or arrow keys move · R rotates · Enter places · Esc cancels</p>
        </div>
        <p className="shrink-0 font-bold">{cedis(item.price)}</p>
      </div>
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

function WalkPadBtn({ children, label, onClick }: { children: string; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="grid h-12 w-12 place-items-center rounded-2xl bg-white/95 text-lg font-bold text-[#121212] shadow-lg active:scale-95"
    >
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
