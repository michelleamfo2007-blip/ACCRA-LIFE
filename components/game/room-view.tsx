"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { HomeDesk } from "@/components/game/home-desk";
import { ItemSheet } from "@/components/game/item-sheet";
import { fixtureCard, pieceCard, type FixtureId } from "@/lib/game/item-verbs";
import { activeGuests, doorGuests } from "@/lib/game/home-life";
import { bayCount, carDust, carOf, footHere, garageBox, motorsOf, setPrimary, washCar, yardTalk } from "@/lib/game/garage";
import { BODY, homeBounds, homeSolids } from "@/lib/game/home-solids";
import { blocked, indexSolids, nearestFree, route, slide, type SolidIndex } from "@/lib/game/nav";
import { askPrice, condOf, goodsOf, materialOf, wearLine } from "@/lib/game/wear";
import { cedis, FIXTURES, fixtureAt, hasCurrent, homeLook, hourOf, roomReach, sellValue, SHOP, WIDEN_COST, type Life, type Placed, type StepResult, type Verb } from "@/lib/game/world";

const Apartment = dynamic(() => import("@/components/game/apartment").then((mod) => mod.Apartment), { ssr: false });

function spotsFor(life: Life) {
  const bed = fixtureAt(life, "fix-bed");
  const sofa = fixtureAt(life, "fix-sofa");
  const radio = fixtureAt(life, "fix-radio");
  const fridge = fixtureAt(life, "fix-fridge");
  const stove = fixtureAt(life, "fix-stove");
  const toilet = fixtureAt(life, "fix-toilet");
  const shower = fixtureAt(life, "fix-shower");
  const box = roomReach(life.span ?? 0);
  return {
    door: { x: -box.halfW + 0.3, z: 0.15, action: "map" },
    bed: { x: bed.x, z: bed.z + 0.45, action: "sleep" },
    chair: { x: sofa.x, z: sofa.z + 0.17, action: "gist" },
    radio: { x: radio.x, z: radio.z - 0.65, action: "radio" },
    cooler: { x: fridge.x - 0.85, z: fridge.z, action: "cooler" },
    stove: { x: stove.x - 0.9, z: stove.z - 0.45, action: "cook" },
    toilet: { x: toilet.x + 0.8, z: toilet.z - 0.6, action: "toilet" },
    shower: { x: shower.x, z: shower.z, action: "shower", skip: ["fix-shower"] },
    roamA: { x: -0.2, z: 1.2, action: null },
    roamB: { x: 0.8, z: 0.2, action: null },
    roamC: { x: -1.1, z: 1.6, action: null },
  };
}

type Pose = "idle" | "walk" | "act" | "sleep" | "sit";

function sitVerb(verb: Verb) {
  if (verb.sleep) return false;
  return /sit|rest|doze|sofa|chair|street|arm-|throne|watch|gist|scroll|chill|tea|papers/i.test(`${verb.id} ${verb.label}`);
}

function isSleep(verb: Verb) {
  return Boolean(verb.sleep) || verb.id === "sleep";
}

/** One in-game minute is one real second, and a rest is never shorter than a minute. */
function sleepMs(verb: Verb) {
  return Math.max(60, verb.minutes) * 1000;
}

function formatLeft(ms: number) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
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
  onMend,
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
  onWiden,
  startArrange = false,
  onArrangeSeen,
  onMotor,
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
  onMend?: (id: string, how: "clean" | "polish" | "cloth" | "repair" | "collect" | "friend") => void;
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
  onWiden?: () => void;
  startArrange?: boolean;
  onArrangeSeen?: () => void;
  onMotor?: (result: StepResult) => void;
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
  const [beside, setBeside] = useState<string | null>(null);
  const [doorOpen, setDoorOpen] = useState(false);
  const [garageShut, setGarageShut] = useState(false);
  const [recoil, setRecoil] = useState<{ x: number; z: number } | null>(null);
  const [asleepFor, setAsleepFor] = useState<number | null>(null);
  const doorRef = useRef(false);
  const shutRef = useRef(false);
  const lifeRef = useRef(life);
  const sleepTick = useRef(0);
  const sleepEnded = useRef(false);
  lifeRef.current = life;
  doorRef.current = doorOpen;
  shutRef.current = garageShut;

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

  useEffect(() => () => window.clearInterval(sleepTick.current), []);

  function finishSleep(verb: Verb | null) {
    if (sleepEnded.current) return;
    sleepEnded.current = true;
    window.clearInterval(sleepTick.current);
    setAsleepFor(null);
    setPose("idle");
    busy.current = false;
    if (verb) onRunRef.current?.(verb);
  }

  function lieDown(verb: Verb, inBed: boolean) {
    window.clearInterval(sleepTick.current);
    sleepEnded.current = false;
    const ends = Date.now() + sleepMs(verb);
    setPose(inBed ? "sleep" : "sit");
    setAsleepFor(ends - Date.now());
    sleepTick.current = window.setInterval(() => {
      const left = ends - Date.now();
      if (left <= 0) {
        finishSleep(verb);
        return;
      }
      setAsleepFor(left);
    }, 1000);
  }

  function runAt(target: { x: number; z: number }, verb: Verb, inBed: boolean, skip: string[] = []) {
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
      if (isSleep(verb)) {
        lieDown(verb, inBed);
        return;
      }
      setPose("act");
      onRunRef.current?.(verb);
      window.setTimeout(() => {
        setPose("idle");
        busy.current = false;
      }, 1500);
    }, inBed ? ["fix-bed"] : skip);
  }

  function sitOnChair() {
    if (seated.current && pose === "sit") {
      walkTo({ x: spots.chair.x, z: spots.chair.z + 0.95 }, null);
      return;
    }
    const card = fixtureCard("chair", life);
    const verb =
      card.verbs.find((item) => item.id === "home-lounge") ??
      card.verbs.find((item) => /lounge|sit|rest|gist/i.test(`${item.id} ${item.label}`)) ??
      card.verbs[0];
    if (!verb) return;
    runAt(spots.chair, verb, false, ["fix-sofa"]);
  }

  function pickVerb(verb: Verb) {
    if (fixture) {
      const spot = spots[fixture];
      setFixture(null);
      const occupy = fixture === "chair" ? ["fix-sofa"] : fixture === "shower" ? ["fix-shower"] : fixture === "toilet" ? ["fix-toilet"] : [];
      runAt(spot, verb, fixture === "bed", occupy);
      return;
    }
    const piece = (life.furniture ?? []).find((item) => item.id === picked);
    setPicked(null);
    if (!piece) return;
    runAt({ x: clampRoom(piece.x + (piece.x > 0 ? -0.7 : 0.7), box.minX, box.maxX), z: clampRoom(piece.z + 0.55, box.minZ, box.maxZ) }, verb, false, sitVerb(verb) ? [piece.id] : []);
  }

  function bump(from: { x: number; z: number }, toward: { x: number; z: number }) {
    const dx = from.x - toward.x;
    const dz = from.z - toward.z;
    const len = Math.hypot(dx, dz) || 1;
    setRecoil({ x: (dx / len) * 0.1, z: (dz / len) * 0.1 });
    window.setTimeout(() => setRecoil(null), 160);
  }

  function walkTo(target: { x: number; z: number }, action: string | null, arrive?: () => void, skip: string[] = []) {
    cancelAnimationFrame(frame.current);
    seated.current = false;
    busy.current = true;
    const here = lifeRef.current;
    const bounds = homeBounds(here);
    const index: SolidIndex = indexSolids(homeSolids(here, { doorOpen: doorRef.current, garageShut: shutRef.current, skip }), 0.36);
    let start = { ...posRef.current };
    if (blocked(start.x, start.z, index, BODY)) {
      const free = nearestFree(start.x, start.z, index, BODY, bounds);
      if (free) {
        start = free;
        posRef.current = free;
        setPos(free);
      }
    }
    let path = route(start, target, index, BODY, bounds);
    if (!path.length) {
      const nudged = slide(start, target, index, BODY, bounds);
      if (Math.hypot(nudged.x - start.x, nudged.z - start.z) < 0.05) {
        bump(start, target);
        setPose("idle");
        busy.current = false;
        return;
      }
      path = [{ x: nudged.x, z: nudged.z }];
    }
    let cursor = 0;
    let segFrom = start;
    let segTo = path[0];
    let segAt = performance.now();
    setHeading(Math.atan2(segTo.x - start.x, segTo.z - start.z));
    setPose("walk");
    const finish = () => {
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
    const step = (now: number) => {
      const dist = Math.hypot(segTo.x - segFrom.x, segTo.z - segFrom.z) || 0.001;
      const t = Math.min(1, ((now - segAt) / 1000) * 2.8 / dist);
      const raw = { x: segFrom.x + (segTo.x - segFrom.x) * t, z: segFrom.z + (segTo.z - segFrom.z) * t };
      const next = slide(posRef.current, raw, index, BODY, bounds);
      const moved = Math.hypot(next.x - posRef.current.x, next.z - posRef.current.z);
      if (next.bumped && moved < 0.004 && t > 0.08) {
        bump(posRef.current, segTo);
        setPose("idle");
        busy.current = false;
        return;
      }
      posRef.current = { x: next.x, z: next.z };
      setPos(posRef.current);
      if (t < 1) {
        frame.current = requestAnimationFrame(step);
        return;
      }
      cursor += 1;
      if (cursor < path.length) {
        segFrom = { ...posRef.current };
        segTo = path[cursor];
        segAt = now;
        setHeading(Math.atan2(segTo.x - segFrom.x, segTo.z - segFrom.z));
        frame.current = requestAnimationFrame(step);
        return;
      }
      finish();
    };
    frame.current = requestAnimationFrame(step);
  }

  useEffect(() => {
    const id = window.setInterval(() => {
      if (busy.current || seated.current) return;
      if (localStorage.getItem("accralife-freewill") === "0") return;
      const roam = ["roamA", "roamB", "roamC"][Math.floor(Math.random() * 3)] as keyof ReturnType<typeof spotsFor>;
      walkTo(spots[roam], null);
    }, 8000);
    return () => {
      window.clearInterval(id);
      cancelAnimationFrame(frame.current);
    };
  }, []);

  useEffect(() => {
    if (!errand) return;
    const spot = spots[errand.spot as keyof ReturnType<typeof spotsFor>];
    if (spot) walkTo(spot, spot.action, undefined, "skip" in spot ? spot.skip : []);
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
    setDraft((current) => (current ? { ...current, x: clampRoom(current.x + x, box.placeMinX, box.placeMaxX), z: clampRoom(current.z + z, box.placeMinZ, box.placeMaxZ) } : current));
  }

  function commitDraft() {
    if (!draft) return;
    onLay?.(draft.id, draft.x, draft.z, draft.rot);
    setDraft(null);
    setPicked(null);
  }

  const owns = (id: string) => life.inventory.includes(id);
  const look = homeLook(life.homeId);
  const spots = spotsFor(life);
  const box = roomReach(life.span ?? 0);
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
        night={night}
        bedColor={bedItem?.color ?? look.bed}
        sofaColor={sofaColor}
        guests={guests.map((guest) => ({ name: guest.name, doing: guest.doing }))}
        onAsk={onAsk}
        bays={bayCount(life)}
        doorOpen={doorOpen}
        recoil={recoil}
        garageShut={garageShut}
        onGarage={(shut) => {
          shutRef.current = shut;
          setGarageShut(shut);
        }}
        onCar={(key, x, z) => {
          if (draft || !canInterrupt()) return;
          setBeside(null);
          walkTo({ x, z }, null, () => {
            setPose("idle");
            busy.current = false;
            setBeside(key);
          });
        }}
        onWalk={(x, z) => {
          if (draft || !canInterrupt()) return;
          setBeside(null);
          const yard = footHere(x, z, life.span ?? 0, bayCount(life));
          walkTo(yard ?? { x: clampRoom(x, box.minX, box.maxX), z: clampRoom(z, box.minZ, box.maxZ) }, null);
        }}
        onGo={(id) => {
          if (id === "door") {
            doorRef.current = true;
            setDoorOpen(true);
            walkTo(spots.door, "map");
            window.setTimeout(() => {
              doorRef.current = false;
              setDoorOpen(false);
            }, 3200);
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
        fixtures={shownFixtures(life, draft)}
        span={life.span ?? 0}
        picked={draft?.id ?? picked}
        placing={Boolean(draft)}
        focus={draft ? { x: draft.x, z: draft.z } : null}
        onPick={(id) => {
          if (id.startsWith("fix-wall")) {
            if (draft?.id === id) return;
            setArrange(false);
            setPicked(null);
            setFixture(null);
            setDraft(fixtureAt(life, id));
            return;
          }
          setDraft(null);
          setFixture(null);
          setPicked(id);
        }}
        onDrag={(x, z) => setDraft((current) => (current ? { ...current, x: clampRoom(x, box.placeMinX, box.placeMaxX), z: clampRoom(z, box.placeMinZ, box.placeMaxZ) } : current))}
      />
      {asleepFor != null ? (
        <div className="absolute left-1/2 top-[max(5rem,calc(env(safe-area-inset-top)+4.5rem))] z-30 flex -translate-x-1/2 items-center gap-2 rounded-full bg-white/95 px-4 py-2 text-sm font-semibold text-[#3b6cff] shadow-lg">
          <span>💤 Sleeping · {formatLeft(asleepFor)}</span>
          <button type="button" onClick={() => finishSleep(null)} className="rounded-full bg-[#f4f7fb] px-3 py-1 text-xs font-bold text-[#121212]">
            Wake
          </button>
        </div>
      ) : null}
      {pose === "sit" && asleepFor == null ? (
        <div className="pointer-events-none absolute left-1/2 top-[max(5rem,calc(env(safe-area-inset-top)+4.5rem))] z-30 -translate-x-1/2 rounded-full bg-white/95 px-4 py-2 text-sm font-semibold text-[#121212] shadow-lg">
          🪑 Sitting · tap floor to get up
        </div>
      ) : null}
      {beside ? (
        <CarBay
          life={life}
          carKey={beside}
          onClose={() => setBeside(null)}
          onGetIn={() => {
            const result = setPrimary(life, beside);
            onMotor?.(result);
          }}
          onWash={() => {
            const result = washCar(life, beside);
            onMotor?.(result);
          }}
          onDrive={() => {
            const gate = garageBox(life.span ?? 0, bayCount(life)).gate;
            setBeside(null);
            walkTo(gate, null, () => {
              setPose("idle");
              busy.current = false;
              onMapRef.current();
            });
          }}
        />
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
          onWiden={() => onWiden?.()}
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
                const next = { x: posRef.current.x, z: clampRoom(posRef.current.z - 0.85, box.minZ, box.maxZ) };
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
                const next = { x: clampRoom(posRef.current.x - 0.85, box.minX, box.maxX), z: posRef.current.z };
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
                const next = { x: clampRoom(posRef.current.x + 0.85, box.minX, box.maxX), z: posRef.current.z };
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
                const next = { x: posRef.current.x, z: clampRoom(posRef.current.z + 0.85, box.minZ, box.maxZ) };
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
              life={life}
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
              onMend={(how) => onMend?.(picked, how)}
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

function shownFixtures(life: Life, draft: Placed | null) {
  return FIXTURES.map((item) => (draft?.id === item.id ? draft : fixtureAt(life, item.id)));
}

function ArrangeTray({
  life,
  onClose,
  onBuy,
  onWiden,
  onPick,
}: {
  life: Life;
  onClose: () => void;
  onBuy: () => void;
  onWiden: () => void;
  onPick: (piece: Placed) => void;
}) {
  const pieces = SHOP.filter((item) => life.inventory.includes(item.id) && !item.consume && item.kind !== "floor");
  const span = life.span ?? 0;
  const widen = span < WIDEN_COST.length ? WIDEN_COST[span] : null;
  return (
    <div className="absolute inset-x-3 bottom-[max(5.4rem,calc(env(safe-area-inset-bottom)+4.6rem))] z-40 max-h-[38vh] overflow-auto rounded-[24px] bg-white p-3 shadow-[0_16px_50px_rgba(22,32,60,.22)]">
      <div className="flex items-center justify-between gap-2">
        <p className="font-semibold">Arrange the inside</p>
        <button type="button" onClick={onClose} className="text-xs font-semibold text-[#5c6b82]">
          Done
        </button>
      </div>
      <p className="mt-1 text-xs text-[#5c6b82]">Walls move too. Drag one to split off a bedroom, then rotate it. Buy another wall or a second bed in the shop.</p>
      {widen != null ? (
        <button type="button" onClick={onWiden} className="mt-3 w-full rounded-full bg-[#006B3F] py-2.5 text-sm font-bold text-white">
          Push the walls out · {cedis(widen)}
        </button>
      ) : (
        <p className="mt-3 text-xs font-semibold text-[#006B3F]">The room is as wide as it gets.</p>
      )}
      <div className="mt-3 space-y-2">
        {FIXTURES.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onPick(fixtureAt(life, item.id))}
            className="flex w-full items-center gap-3 rounded-2xl bg-[#f4f7fb] px-3 py-2 text-left"
          >
            <span className="h-8 w-8 rounded-lg border border-black/5" style={{ background: item.color }} />
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold">{item.name}</span>
              <span className="block text-[11px] text-[#5c6b82]">Already here · move it</span>
            </span>
          </button>
        ))}
      </div>
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
                  <span className="block text-[11px] text-[#5c6b82]">{condOf(goodsOf(life, item.id).cond).label} · {down ? "In the room · move it" : parked ? "Stored · put it down" : "Put it down"}</span>
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

function PieceTools({ id, life, onMove, onTurn, onStore, onSell, onMend }: { id: string; life: Life; onMove: () => void; onTurn: () => void; onStore: () => void; onSell: () => void; onMend?: (how: "clean" | "polish" | "cloth" | "repair" | "collect" | "friend") => void }) {
  const item = SHOP.find((entry) => entry.id === id);
  if (!item) return null;
  const row = goodsOf(life, id);
  const guest = (life.guests ?? []).some((person) => person.doing !== "leave" && person.doing !== "coming");
  return (
    <div className="rounded-2xl bg-[#f7f8fb] p-3">
      <p className="text-xs text-[#5c6b82]">
        {condOf(row.cond).label} condition{row.dust >= 2 ? " · dusty" : ""} · sells for {cedis(sellValue(askPrice(item, row.cond)))}
      </p>
      {wearLine(item.kind, item.id, row.cond) ? <p className="mt-1 text-xs text-[#9a3412]">{wearLine(item.kind, item.id, row.cond)}</p> : null}
      {row.back && life.minutes < row.back ? <p className="mt-1 text-xs font-semibold text-[#006B3F]">At the repair shop.</p> : null}
      <div className="mt-2 flex flex-wrap gap-2">
        <Choice onClick={onMove}>Move</Choice>
        <Choice onClick={onTurn}>Turn</Choice>
        <Choice onClick={onStore}>Store</Choice>
        {row.dust >= 1 ? <Choice onClick={() => onMend?.("clean")}>Clean</Choice> : null}
        {row.cond !== "new" && row.cond !== "like" && row.cond !== "broken" ? <Choice onClick={() => onMend?.(materialOf(item.kind, item.id) === "fabric" || materialOf(item.kind, item.id) === "textile" ? "cloth" : "polish")}>{materialOf(item.kind, item.id) === "fabric" || materialOf(item.kind, item.id) === "textile" ? "Reupholster" : "Refinish"}</Choice> : null}
        {row.back && life.minutes >= row.back ? <Choice onClick={() => onMend?.("collect")}>Collect</Choice> : null}
        {!row.back && row.cond !== "new" && row.cond !== "like" ? <Choice onClick={() => onMend?.("repair")}>Repair shop</Choice> : null}
        {guest && (row.cond === "fair" || row.cond === "poor" || row.cond === "broken") ? <Choice onClick={() => onMend?.("friend")}>Ask a guest</Choice> : null}
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
  const fixture = FIXTURES.find((entry) => entry.id === id);
  const name = item?.name ?? fixture?.name;
  if (!name) return null;
  return (
    <div className="absolute inset-x-2 bottom-[max(5.4rem,calc(env(safe-area-inset-bottom)+4.6rem))] z-40 mx-auto w-[min(100%,24rem)] rounded-2xl bg-white/95 p-2 shadow-[0_12px_40px_rgba(22,32,60,.22)] backdrop-blur sm:inset-x-auto sm:bottom-24">
      <div className="flex items-center gap-2">
        <div className="grid shrink-0 grid-cols-3 gap-0.5">
          <span />
          <Pad onClick={() => onNudge(0, -0.35)}>↑</Pad>
          <span />
          <Pad onClick={() => onNudge(-0.35, 0)}>←</Pad>
          <button type="button" aria-label="Rotate" onClick={onRotate} className="grid h-8 w-8 place-items-center rounded-full bg-[#3b6cff] text-sm text-white">
            ↻
          </button>
          <Pad onClick={() => onNudge(0.35, 0)}>→</Pad>
          <span />
          <Pad onClick={() => onNudge(0, 0.35)}>↓</Pad>
          <span />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{name}</p>
          <p className="truncate text-[11px] text-[#5c6b82]">Arrows or drag the floor. The green ring is the piece.</p>
          <div className="mt-1.5 flex gap-1.5">
            <button type="button" onClick={onPlace} className="flex-1 rounded-full bg-[#006B3F] py-2 text-sm font-bold text-white">
              Place
            </button>
            <button type="button" onClick={onCancel} className="flex-1 rounded-full bg-[#f4f7fb] py-2 text-sm font-bold">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CarBay({
  life,
  carKey,
  onClose,
  onGetIn,
  onWash,
  onDrive,
}: {
  life: Life;
  carKey: string;
  onClose: () => void;
  onGetIn: () => void;
  onWash: () => void;
  onDrive: () => void;
}) {
  const motor = motorsOf(life).find((item) => item.key === carKey);
  if (!motor) return null;
  const plan = carOf(motor.id);
  const indoors = motorsOf(life).findIndex((item) => item.key === carKey) < bayCount(life);
  const dust = carDust(motor, life.minutes, indoors);
  const talk = yardTalk(life);
  const clean = dust < 0.15 ? "clean" : dust < 0.4 ? "dusty" : "caked in dust";
  const driving = life.car?.key === motor.key;
  return (
    <div className="absolute bottom-[max(5.6rem,calc(env(safe-area-inset-bottom)+4.8rem))] left-3 z-30 w-[min(22rem,calc(100%-1.5rem))] rounded-2xl bg-[#f6f1ea] p-3 text-[#121212] shadow-xl">
      <p className="text-sm font-bold">{motor.name || plan?.label || "Car"}</p>
      <p className="mt-1 text-xs text-[#5c6b82]">
        {Math.round(motor.fuel)}% fuel · {Math.round(motor.condition ?? 100)}% sound · {clean}
        {motor.plate ? ` · ${motor.plate}` : ""}
        {motor.driver ? ` · ${motor.driver} has the keys` : ""}
        {motor.broken ? " · spoilt" : ""}
      </p>
      {talk ? <p className="mt-1 text-xs font-semibold text-[#243044]">{talk}</p> : null}
      <div className="mt-2 flex flex-wrap gap-1.5">
        <button type="button" className="rounded-full bg-[#121212] px-3 py-1.5 text-xs font-bold text-white" onClick={onGetIn}>
          {driving ? "You are in this one" : "Get in"}
        </button>
        <button type="button" className="rounded-full bg-white px-3 py-1.5 text-xs font-bold" onClick={onWash}>
          Wash
        </button>
        <button type="button" className="rounded-full bg-white px-3 py-1.5 text-xs font-bold" onClick={onDrive}>
          Drive out
        </button>
        <button type="button" className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-[#5c6b82]" onClick={onClose}>
          Step back
        </button>
      </div>
    </div>
  );
}

function Pad({ children, onClick }: { children: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="grid h-8 w-8 place-items-center rounded-full bg-[#f4f7fb] text-sm font-bold">
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
