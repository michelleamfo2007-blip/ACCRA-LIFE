"use client";

import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { IsoHuman } from "@/components/game/iso-human";
import { CLUB_IDS } from "@/lib/game/accra-spots";
import { ActionDeck } from "@/components/game/action-deck";
import {
  bottleOf,
  clubCrowdAt,
  clubStateLabel,
  clubVerbs,
  isBottleVerb,
  isNightlife,
  type Bottle,
  type ClubNpc,
} from "@/lib/game/club-night";
import { accraHour, cedis, spotById, type Life, type Look, type Offer, type Spot, type Verb } from "@/lib/game/world";
import type { SpotPos } from "@/lib/game/net";
import { bagCount, isSupply } from "@/lib/game/trade";

const SKINS = ["#c68a62", "#a86f4c", "#8d5a3b", "#7a4a2c", "#653c24", "#51301d"];
const SHIRTS = ["#CE1126", "#f5c542", "#ec4899", "#006B3F", "#f4efe6", "#e5484d"];
const PANTS = ["#1c1917", "#243056", "#6b3a4a", "#1f4d3a"];
const HAIR = ["Afro", "Bob", "Bun", "Cut"];
const HOTELS = new Set(["hotel", "kempinski", "movenpick"]);
const BEACHES = new Set(["beach", "bojo", "kokrobite"]);
const GARDENS = new Set(["aburi", "botanical", "golf", "sakumono"]);

export type Peer = { username: string; name: string; look?: Look; spot?: SpotPos | null };

function startSpot(seed: string) {
  let hash = 0;
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) % 9973;
  return { left: 24 + (hash % 40), top: 56 + (Math.floor(hash / 40) % 20) };
}

type Kind = "hotel" | "club" | "shore" | "garden" | "gym" | "hall" | "tables" | "airport";
type TalkKind = "hello" | "gist" | "joke" | "shade" | "place";
type Seat = { id: string; label: string; left: number; top: number; face?: 1 | -1 };

export function VenueFloor({
  life,
  people,
  onHome,
  onAct,
  onOpenChat,
  onPay,
  focus = null,
  extra = [],
  homeFare = 5,
  me = "",
  onMove,
  onTrade,
  lively = false,
  children,
}: {
  life: Life;
  people: Peer[];
  me?: string;
  children?: ReactNode;
  onMove?: (x: number, y: number) => void;
  onTrade?: () => void;
  onHome: () => void;
  onAct: (verb: Verb, person?: string) => void;
  onOpenChat: (person: string) => void;
  onPay: (person: string, amount: number, username?: string) => string | null | Promise<string | null>;
  focus?: string | null;
  extra?: Verb[];
  homeFare?: number;
  lively?: boolean;
}) {
  const spot = spotById(life.where);
  const night = accraHour() >= 19 || accraHour() < 5;
  const kind = sceneKind(spot);
  const darkStage = true;
  const [who, setWho] = useState<string | null>(null);
  const [lines, setLines] = useState<{ from: "you" | "them"; text: string }[]>([]);
  const [shout, setShout] = useState("");
  const [youAt, setYouAt] = useState(() => {
    const first = startSpot(`${me}:${life.where}`);
    return { left: `${first.left}%`, top: `${first.top}%` };
  });
  const moveRef = useRef(onMove);
  const [stride, setStride] = useState<{ ms: number; face: 1 | -1; moving: boolean }>({ ms: 700, face: 1, moving: false });
  const [panel, setPanel] = useState(true);
  const [doing, setDoing] = useState<{ label: string; dance: boolean; sit?: boolean } | null>(null);
  const [seatedAt, setSeatedAt] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [bottleShow, setBottleShow] = useState<null | { bottle: Bottle; step: "walk" | "spark" | "pop" | "cheer"; left: number; top: number }>(null);
  const [empties, setEmpties] = useState<{ id: string; left: number; top: number; emoji: string }[]>([]);
  const [drift, setDrift] = useState<[number, number][]>([
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0],
  ]);
  const scroller = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const stopTimer = useRef<number | null>(null);
  const actTimer = useRef<number | null>(null);
  const busy = useRef(false);
  const nightLife = isNightlife(spot.id, CLUB_IDS);
  const dining = isDiningSpot(spot);
  const seats = dining ? seatsFor(spot.id) : [];
  const party = lively || BEACHES.has(spot.id) || nightLife;
  const staff = staffFor(spot);
  const stands = [
    { left: "50%", top: "46%" },
    { left: "62%", top: "70%" },
    { left: "40%", top: "38%" },
    { left: "30%", top: "55%" },
  ].map((style, index) => ({
    left: `${Number.parseFloat(style.left) + (drift[index]?.[0] ?? 0)}%`,
    top: `${Number.parseFloat(style.top) + (drift[index]?.[1] ?? 0)}%`,
  }));
  const open = people.find((person) => person.username === who) ?? null;

  useEffect(() => {
    const id = window.setInterval(() => {
      setDrift((current) => current.map(() => [Math.round((Math.random() - 0.5) * 10), Math.round((Math.random() - 0.5) * 8)] as [number, number]));
    }, 3800);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    moveRef.current = onMove;
  });

  useEffect(() => {
    const first = startSpot(`${me}:${life.where}`);
    follow(first.left, "auto");
    moveRef.current?.(first.left, first.top);
    setEmpties([]);
    setBottleShow(null);
    busy.current = false;
    setDoing(null);
    setSeatedAt(null);
    return () => {
      if (stopTimer.current) window.clearTimeout(stopTimer.current);
      if (actTimer.current) window.clearTimeout(actTimer.current);
    };
  }, [me, life.where]);

  function follow(left: number, behavior: ScrollBehavior = "smooth") {
    const box = scroller.current;
    const floor = stage.current;
    if (!box || !floor || floor.clientWidth <= box.clientWidth) return;
    box.scrollTo({ left: (floor.clientWidth * left) / 100 - box.clientWidth / 2, behavior });
  }

  function walkTo(left: number, top: number) {
    const fromLeft = Number.parseFloat(youAt.left);
    const fromTop = Number.parseFloat(youAt.top);
    const nextLeft = Math.max(10, Math.min(90, left));
    const nextTop = Math.max(30, Math.min(84, top));
    const ms = Math.round(Math.max(450, Math.min(1800, Math.hypot(nextLeft - fromLeft, nextTop - fromTop) * 30)));
    setStride({ ms, face: nextLeft < fromLeft ? -1 : 1, moving: true });
    setYouAt({ left: `${nextLeft}%`, top: `${nextTop}%` });
    follow(nextLeft);
    onMove?.(nextLeft, nextTop);
    if (stopTimer.current) window.clearTimeout(stopTimer.current);
    stopTimer.current = window.setTimeout(() => setStride((current) => ({ ...current, moving: false })), ms);
    return ms;
  }

  function approach(style: { left: string; top: string }, then: () => void) {
    const left = Number.parseFloat(style.left);
    const top = Number.parseFloat(style.top);
    const ms = walkTo(left + 9, top + 12);
    window.setTimeout(then, ms);
  }

  function tapFloor(event: MouseEvent<HTMLDivElement>) {
    if ((event.target as HTMLElement).closest("button")) return;
    if (seatedAt) {
      setSeatedAt(null);
      setDoing(null);
    }
    const box = event.currentTarget.getBoundingClientRect();
    walkTo(((event.clientX - box.left) / box.width) * 100, ((event.clientY - box.top) / box.height) * 100);
    if (window.innerWidth < 640) setPanel(false);
  }

  function sitAt(seat: Seat, then?: () => void) {
    if (busy.current || bottleShow) return;
    busy.current = true;
    setPanel(true);
    setWho(null);
    setDoing({ label: seat.label, dance: false, sit: true });
    const left = seat.left + (Math.random() * 3 - 1.5);
    const top = seat.top + (Math.random() * 2 - 1);
    if (seat.face) setStride((current) => ({ ...current, face: seat.face! }));
    const ms = walkTo(left, top);
    if (actTimer.current) window.clearTimeout(actTimer.current);
    actTimer.current = window.setTimeout(() => {
      setSeatedAt(seat.id);
      setDoing({ label: seat.label, dance: false, sit: true });
      busy.current = false;
      then?.();
    }, ms);
  }

  function nearestSeat() {
    if (!seats.length) return null;
    const fromLeft = Number.parseFloat(youAt.left);
    const fromTop = Number.parseFloat(youAt.top);
    return [...seats].sort((a, b) => Math.hypot(a.left - fromLeft, a.top - fromTop) - Math.hypot(b.left - fromLeft, b.top - fromTop))[0] ?? null;
  }

  function speak(person: string, talk: TalkKind) {
    const verb = talkVerb(person, talk, spot);
    setLines((prev) => [...prev, { from: "you", text: youSay(talk, spot.name) }]);
    onAct(verb, person);
  }

  const zones = zonesFor(spot.id);
  const crowd = people.length;
  const flavor = spotFlavor(spot);

  function runPaidAction(paid: Verb, bottle: ReturnType<typeof bottleOf>, left: number, top: number, keepSeat: boolean, seatLabel?: string) {
    onAct(paid);
    if (isBottleVerb(paid)) {
      runBottlePop(bottle ?? { id: paid.id, label: paid.label, detail: paid.detail, cost: paid.cost, emoji: paid.emoji ?? "🍾", vibe: "mid" }, left, top);
      return;
    }
    const hold = Math.round(Math.max(1800, Math.min(5200, (paid.minutes || 20) * 70)));
    actTimer.current = window.setTimeout(() => {
      if (keepSeat) {
        setDoing({ label: seatLabel ?? "At the table", dance: false, sit: true });
        busy.current = false;
        return;
      }
      setDoing(null);
      setSeatedAt(null);
      busy.current = false;
    }, hold);
  }

  function performAction(verb: Verb, offer: Offer) {
    if (busy.current || bottleShow) return;
    if (doing && !seatedAt) return;
    const paid = payVerb(verb, offer);
    const bottle = bottleOf(paid);
    const dance = paid.tag === "party" || /dance|drum|party|highlife|floor/i.test(`${paid.id} ${paid.label}`);
    const text = `${paid.id} ${paid.label}`;
    const food = paid.tag === "food" || /eat|order|chop|plate|waakye|banku|brunch|bowl|kitchen|grill|lunch|breakfast|red-red|noodle|taco|wing|tilapia|fufu|coffee|pan/i.test(text);
    const sittingVerb = /sit|rest|chill|shade|chair|sofa|booth|lounge|take it in|table|vip/i.test(text) && !dance && !/stroll|step outside|walk the|bottle|hennessy|moët|moet|cîroc|ciroc|bucket|bitters/i.test(text);

    // Restaurants: sit at a table/chair before the plate arrives.
    if (dining && food && seats.length) {
      const seat = (seatedAt && seats.find((item) => item.id === seatedAt)) || nearestSeat();
      if (!seat) return;
      const finish = () => {
        busy.current = true;
        setDoing({ label: paid.label, dance: false, sit: true });
        if (actTimer.current) window.clearTimeout(actTimer.current);
        actTimer.current = window.setTimeout(() => runPaidAction(paid, bottle, seat.left, seat.top, true, seat.label), 280);
      };
      if (seatedAt === seat.id) {
        finish();
        return;
      }
      sitAt(seat, finish);
      return;
    }

    if (dining && sittingVerb) {
      const seat = nearestSeat() ?? { id: "tables", label: "A table", left: 36, top: 58 };
      sitAt(seat);
      return;
    }

    busy.current = true;
    setPanel(false);
    setWho(null);
    setSeatedAt(null);
    const target = isBottleVerb(paid)
      ? zones.find((zone) => zone.id === "booth" || zone.id === "tables" || zone.id === "cafe") ?? zoneForVerb(paid, zones)
      : zoneForVerb(paid, zones);
    setDoing({ label: paid.label, dance: dance && !isBottleVerb(paid), sit: sittingVerb || Boolean(isBottleVerb(paid)) });
    const left = target.left + (Math.random() * 6 - 3);
    const top = target.top + (Math.random() * 4 - 2);
    const ms = walkTo(left, top);
    if (actTimer.current) window.clearTimeout(actTimer.current);
    actTimer.current = window.setTimeout(() => runPaidAction(paid, bottle, left, top, false), ms);
  }

  function runBottlePop(bottle: Bottle, left: number, top: number) {
    setBottleShow({ bottle, step: "walk", left, top });
    const t = (step: "spark" | "pop" | "cheer", ms: number) =>
      window.setTimeout(() => setBottleShow((current) => (current ? { ...current, step } : current)), ms);
    t("spark", 900);
    t("pop", 1600);
    t("cheer", 2300);
    actTimer.current = window.setTimeout(() => {
      setEmpties((list) => [...list.slice(-5), { id: `${bottle.id}-${Date.now()}`, left: left + 2, top: top - 4, emoji: bottle.emoji }]);
      setBottleShow(null);
      setDoing({ label: `${bottle.label} on the table`, dance: false, sit: true });
      actTimer.current = window.setTimeout(() => {
        setDoing(null);
        busy.current = false;
      }, 3200);
    }, 3800);
  }

  function sendShout() {
    const text = shout.trim();
    if (!text) return;
    setShout("");
    if (open) {
      setLines((prev) => [...prev, { from: "you", text }]);
      onAct({ id: `say-${open.username}`, label: text, detail: text, minutes: 2, cost: 0, earn: 0, effects: { social: 4 }, social: true }, open.name);
      return;
    }
    const first = people[0];
    if (first) {
      setWho(first.username);
      setLines([{ from: "you", text }]);
      onAct({ id: `say-${first.username}`, label: text, detail: text, minutes: 2, cost: 0, earn: 0, effects: { social: 4 }, social: true }, first.name);
      return;
    }
    onAct({ id: `wave-${spot.id}`, label: text, detail: text, minutes: 2, cost: 0, earn: 0, effects: { social: 6, fun: 4 }, social: true });
  }

  return (
    <div
      className="relative h-full overflow-hidden"
      style={{
        background: darkStage
          ? night
            ? "radial-gradient(ellipse at 42% 18%, #4a3428 0%, #2a2038 28%, #12101c 58%, #07060c 100%)"
            : "radial-gradient(ellipse at 58% 12%, #f0c070 0%, #c9945a 22%, #5a6a78 52%, #1a2230 100%)"
          : night
            ? "radial-gradient(circle at 50% 30%, #243044 0%, #12151c 70%)"
            : "radial-gradient(circle at 50% 30%, #d7e7c4 0%, #b7c99a 68%)",
      }}
    >
      <div ref={scroller} className="venue-scroll absolute inset-x-0 top-[4.25rem] bottom-36 z-0 isolate overflow-x-auto overflow-y-hidden overscroll-x-contain">
        <div
          ref={stage}
          onClick={tapFloor}
          className="relative mx-auto h-full w-[max(100%,44rem)] max-w-3xl cursor-pointer origin-center transition-transform duration-200"
          style={{ transform: `scale(${zoom})` }}
        >
          <VenueScene spot={spot} night={night} kind={kind} party={party} />
          {seats.map((seat) => (
            <button
              key={seat.id}
              type="button"
              aria-label={`Sit at ${seat.label}`}
              onClick={(event) => {
                event.stopPropagation();
                if (seatedAt === seat.id) return;
                sitAt(seat);
              }}
              className={`absolute z-20 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-0.5 rounded-2xl px-2 py-1.5 text-[10px] font-bold shadow-md transition ${
                seatedAt === seat.id ? "bg-[#006B3F] text-white ring-2 ring-white/80" : "bg-white/95 text-[#243044] hover:bg-[#fff4c2]"
              }`}
              style={{ left: `${seat.left}%`, top: `${seat.top}%` }}
            >
              <span className="text-base leading-none">🪑</span>
              <span className="max-w-[4.5rem] truncate">{seatedAt === seat.id ? "Seated" : seat.label}</span>
            </button>
          ))}
          {staff.map((person) => (
            <PersonTag
              key={person.role}
              name={person.role}
              tone="blue"
              style={person.style}
              skin={person.skin}
              shirt={person.shirt}
              hair={person.hair}
              pants="#1c1917"
              onClick={() =>
                approach(person.style, () => {
                  setWho(`staff:${person.role}`);
                  setLines([{ from: "them", text: person.line }]);
                })
              }
            />
          ))}
          {nightLife ? <ClubCrowd spotId={spot.id} cheer={bottleShow?.step === "cheer" || bottleShow?.step === "pop"} /> : null}
          {empties.map((item) => (
            <span
              key={item.id}
              className="pointer-events-none absolute z-[8] -translate-x-1/2 -translate-y-1/2 text-lg opacity-90"
              style={{ left: `${item.left}%`, top: `${item.top}%` }}
              aria-hidden
            >
              {item.emoji}
            </span>
          ))}
          {bottleShow ? <BottlePop show={bottleShow} /> : null}
          {party && !nightLife
            ? [
                { left: "52%", top: "40%" },
                { left: "40%", top: "52%" },
              ].map((style, index) => (
                <PersonTag
                  key={`party-${index}`}
                  name="Party"
                  tone="blue"
                  style={style}
                  skin={SKINS[index + 2]}
                  shirt={index ? "#FCD116" : "#CE1126"}
                  hair="Afro"
                  pants="#1c1917"
                  dance
                  onClick={() =>
                    approach(style, () => {
                      setWho(`party:${index}`);
                      setLines([{ from: "them", text: "We came for the party. The floor is already moving." }]);
                    })
                  }
                />
              ))
            : null}
          {people.slice(0, 10).map((person, index) => {
            const style = person.spot ? { left: `${person.spot.x}%`, top: `${person.spot.y}%` } : stands[index % stands.length];
            return (
              <LivePeer
                key={person.username}
                name={`@${person.username}`}
                style={style}
                live={Boolean(person.spot)}
                skin={person.look?.skin ?? SKINS[index % SKINS.length]}
                shirt={person.look?.cloth ?? SHIRTS[(index + 1) % SHIRTS.length]}
                hair={person.look?.hair ?? HAIR[index % HAIR.length]}
                pants={person.look ? (person.look.body === "woman" ? "#1c1917" : person.look.accent) : PANTS[index % PANTS.length]}
                onClick={() =>
                  approach(style, () => {
                    setWho(person.username);
                    setLines([]);
                  })
                }
              />
            );
          })}
          <PersonTag
            name="You"
            tone="pink"
            style={youAt}
            walk={stride.ms}
            pose={stride.moving ? "walk" : doing?.sit || seatedAt ? "sit" : doing ? "act" : "idle"}
            dance={Boolean(doing?.dance)}
            face={stride.face}
            skin={life.look.skin}
            shirt={life.look.cloth}
            hair={life.look.hair}
            pants={life.look.body === "woman" ? "#1c1917" : life.look.accent}
            bubble={doing && !stride.moving ? doing.label : null}
          />
        </div>
      </div>
      <div className="absolute bottom-[max(9.2rem,calc(env(safe-area-inset-bottom)+8.4rem))] right-2 z-30 flex flex-col gap-1.5">
        <button
          type="button"
          aria-label="Zoom in"
          className="grid h-10 w-10 place-items-center rounded-full bg-white text-lg font-bold shadow-lg"
          onClick={() => setZoom((value) => Math.min(1.55, Math.round((value + 0.12) * 100) / 100))}
        >
          +
        </button>
        <button
          type="button"
          aria-label="Zoom out"
          className="grid h-10 w-10 place-items-center rounded-full bg-white text-lg font-bold shadow-lg"
          onClick={() => setZoom((value) => Math.max(0.72, Math.round((value - 0.12) * 100) / 100))}
        >
          −
        </button>
      </div>
      {bottleShow ? (
        <p className="pointer-events-none absolute left-1/2 top-[max(5.2rem,calc(env(safe-area-inset-top)+4.6rem))] z-40 -translate-x-1/2 rounded-full bg-[#121212] px-4 py-1.5 text-xs font-bold text-[#FCD116] shadow-lg">
          {bottleShow.step === "walk"
            ? `Waiter bringing ${bottleShow.bottle.label}…`
            : bottleShow.step === "spark"
              ? "Sparklers up"
              : bottleShow.step === "pop"
                ? "🍾 Pop — Accra noticed"
                : "The table cheers"}
        </p>
      ) : doing || seatedAt ? (
        <p className="pointer-events-none absolute left-1/2 top-[max(5.2rem,calc(env(safe-area-inset-top)+4.6rem))] z-20 -translate-x-1/2 rounded-full bg-[#006B3F] px-4 py-1.5 text-xs font-bold text-white shadow-lg">
          {stride.moving
            ? `Heading over · ${doing?.label ?? "a seat"}`
            : seatedAt || doing?.sit
              ? `Sitting · ${doing?.label ?? "table"} · order when ready`
              : `${doing?.label}…`}
        </p>
      ) : (
        <p className="pointer-events-none absolute bottom-[max(8.5rem,calc(env(safe-area-inset-bottom)+8rem))] left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/45 px-3 py-1 text-[11px] font-semibold text-white sm:hidden">
          {dining ? "Tap a chair · sit · then order" : nightLife ? "Dance · bar · bottle service" : "Tap to walk · swipe to look around"}
        </p>
      )}
      {who?.startsWith("staff:") || who?.startsWith("party:") ? (
        <div className="absolute inset-x-3 bottom-[max(5.5rem,env(safe-area-inset-bottom))] z-50 rounded-[28px] bg-white p-4 shadow-[0_-12px_40px_rgba(15,20,40,.28)]">
          <p className="font-semibold">{who.startsWith("party:") ? "Party" : who.slice(6)}</p>
          <p className="text-sm text-[#5c6b82]">{who.startsWith("party:") ? `Out at ${spot.name}. Not a player account.` : `Works at ${spot.name}. Not a player account.`}</p>
          <p className="mt-2 rounded-2xl bg-[#f4f7fb] px-3 py-2 text-sm">{lines[0]?.text}</p>
          <button type="button" onClick={() => setWho(null)} className="mt-3 w-full rounded-full bg-[#121212] py-2.5 text-sm font-bold text-white">
            Close
          </button>
        </div>
      ) : open ? (
        <TalkSheet
          person={`${open.name} · @${open.username}`}
          place={spot.name}
          cash={life.cash}
          lines={lines}
          onClose={() => setWho(null)}
          onChat={() => onOpenChat(open.username)}
          onPick={(talk) => speak(open.name, talk)}
          onPay={(amount) => onPay(open.name, amount, open.username)}
        />
      ) : !panel ? (
        <button
          type="button"
          onClick={() => setPanel(true)}
          className="absolute inset-x-2 bottom-[max(4.75rem,env(safe-area-inset-bottom))] z-30 flex items-center justify-between rounded-[28px] bg-white px-4 py-3 text-left text-sm font-semibold shadow-[0_-10px_30px_rgba(15,20,40,.22)] sm:inset-x-3"
        >
          <span className="truncate">
            {spot.emoji} {spot.name}
            {crowd ? <span className="ml-2 font-normal text-[#5c6b82]">· {crowd} here</span> : null}
          </span>
          <span className="shrink-0 text-[#006B3F]">▲</span>
        </button>
      ) : (
        <div className="absolute inset-x-2 bottom-[max(4.75rem,env(safe-area-inset-bottom))] z-30 max-h-[min(46vh,26rem)] overflow-auto rounded-[28px] bg-white p-3.5 shadow-[0_-14px_44px_rgba(15,20,40,.28)] sm:inset-x-3 sm:p-4">
          <div className="flex items-start gap-2">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#f4f7fb] text-xl">{spot.emoji}</span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[15px] font-bold leading-tight text-[#121212]">{spot.name}</span>
              <span className="mt-0.5 block text-[12px] leading-snug text-[#5c6b82]">{flavor}</span>
            </span>
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                aria-label="Share place"
                className="grid h-8 w-8 place-items-center rounded-full bg-[#f4f7fb] text-[#5c6b82]"
                onClick={() => {
                  const url = `${window.location.origin}/?spot=${spot.id}`;
                  void navigator.clipboard?.writeText(url);
                }}
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path d="M10 13a5 5 0 0 0 7.07 0l1.41-1.41a5 5 0 0 0-7.07-7.07L10 5" strokeLinecap="round" />
                  <path d="M14 11a5 5 0 0 0-7.07 0L5.5 12.41a5 5 0 0 0 7.07 7.07L14 19" strokeLinecap="round" />
                </svg>
              </button>
              <button type="button" aria-label="Head home" onClick={onHome} className="grid h-8 w-8 place-items-center rounded-full bg-[#f4f7fb] text-[#5c6b82]">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z" strokeLinejoin="round" />
                </svg>
              </button>
              <button type="button" onClick={() => setPanel(false)} className="grid h-8 w-8 place-items-center rounded-full bg-[#f4f7fb] text-[#5c6b82]" aria-label="Hide panel">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
                  <path d="M6 14l6-6 6 6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>

          <form
            className="mt-3 flex items-center gap-2 rounded-full bg-[#f4f7fb] px-3 py-2"
            onSubmit={(event) => {
              event.preventDefault();
              sendShout();
            }}
          >
            <input
              value={shout}
              onChange={(event) => setShout(event.target.value)}
              maxLength={120}
              placeholder={crowd ? `Say something to the ${crowd} player${crowd === 1 ? "" : "s"} here...` : "Say something to the room..."}
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#8b97ab]"
            />
            <button type="submit" aria-label="Send" className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#006B3F] text-white">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
                <path d="M3.4 20.6 21 12 3.4 3.4 3 10l11 2-11 2z" />
              </svg>
            </button>
          </form>

          {dining && !seatedAt ? (
            <p className="mt-3 rounded-2xl bg-[#fff4c2] px-3 py-2 text-xs font-semibold text-[#7a3b0c]">Sit at a table or chair first — then order from the menu.</p>
          ) : null}
          {seatedAt ? (
            <button
              type="button"
              onClick={() => {
                setSeatedAt(null);
                setDoing(null);
              }}
              className="mt-3 w-full rounded-full bg-[#f4f7fb] px-3 py-2 text-xs font-bold text-[#243044]"
            >
              Stand up from the seat
            </button>
          ) : null}
          {zones.length ? (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {zones.map((zone) => {
                const seatZone = zone.id === "chairs" || zone.id === "tables" || zone.id === "cafe" || zone.id.startsWith("seat-");
                return (
                  <button
                    key={zone.id}
                    type="button"
                    onClick={() => {
                      if (dining && seatZone) sitAt({ id: zone.id, label: zone.label, left: zone.left, top: zone.top });
                      else walkTo(zone.left, zone.top);
                    }}
                    className={`flex shrink-0 items-center gap-1.5 rounded-2xl px-3 py-2 text-left text-xs font-semibold ${
                      seatedAt === zone.id ? "bg-[#006B3F] text-white" : "bg-[#f4f7fb] text-[#243044]"
                    }`}
                  >
                    <span className="text-base leading-none">{zone.emoji}</span>
                    <span>{dining && seatZone ? `Sit · ${zone.label}` : zone.label}</span>
                  </button>
                );
              })}
            </div>
          ) : null}

          {party ? (
            <p className="mt-3 rounded-full bg-[#121212] px-3 py-1.5 text-center text-xs font-semibold text-[#FCD116]">
              {nightLife
                ? "Night open · floor, bar, bottle service. Sparklers when you spend."
                : lively
                  ? "Packed right now. Accra showed up."
                  : "Party on. Highlife, and the floor is already full."}
            </p>
          ) : null}
          {onTrade && (isSupply(spot.id) || bagCount(life) > 0) ? (
            <button type="button" onClick={onTrade} className="mt-2 flex w-full items-center justify-between rounded-2xl bg-[#fff4c2] px-3 py-2.5 text-left text-sm font-semibold">
              <span>🧺 {isSupply(spot.id) ? "Buy goods to trade" : `Sell from your bag (${bagCount(life)})`}</span>
              <span className="text-[#006B3F]">Open</span>
            </button>
          ) : null}
          {children}
          <ActionDeck
            verbs={[
              ...(dining && !seatedAt
                ? [
                    {
                      id: `sit-${spot.id}`,
                      label: "Sit at a table",
                      detail: "Pull up a chair. Then order something to eat.",
                      minutes: 2,
                      cost: 0,
                      earn: 0,
                      effects: { fun: 2 },
                      emoji: "🪑",
                    } satisfies Verb,
                  ]
                : []),
              ...(nightLife ? clubVerbs(spot.id) : []),
              ...extra,
              ...spot.actions,
            ]}
            here
            focus={focus}
            busy={(Boolean(doing) && !seatedAt) || Boolean(bottleShow)}
            onPay={performAction}
          />
          <button type="button" onClick={onHome} className="mt-2 w-full rounded-full bg-[#121212] px-3 py-2.5 text-sm font-semibold text-white">
            Head home · {cedis(homeFare)}
          </button>
        </div>
      )}
    </div>
  );
}

function ClubCrowd({ spotId, cheer }: { spotId: string; cheer: boolean }) {
  const [crowd, setCrowd] = useState<ClubNpc[]>(() => clubCrowdAt(spotId));
  useEffect(() => {
    const pulse = () => setCrowd(clubCrowdAt(spotId));
    pulse();
    const id = window.setInterval(pulse, 4000);
    return () => window.clearInterval(id);
  }, [spotId]);
  return (
    <>
      {crowd.map((npc) => {
        const dancing = npc.state === "dance" || cheer;
        return (
          <PersonTag
            key={npc.id}
            name={npc.name}
            tone="blue"
            style={{ left: `${npc.left}%`, top: `${npc.top}%` }}
            skin={npc.skin}
            shirt={npc.shirt}
            hair={npc.hair}
            pants="#1c1917"
            pose={dancing ? "act" : npc.state === "enter" || npc.state === "leave" ? "walk" : "idle"}
            dance={dancing}
            face={npc.face}
            glide
            bubble={cheer ? "🍾!!" : clubStateLabel(npc.state)}
          />
        );
      })}
    </>
  );
}

function BottlePop({ show }: { show: { bottle: Bottle; step: "walk" | "spark" | "pop" | "cheer"; left: number; top: number } }) {
  const waiterLeft = show.step === "walk" ? show.left - 12 : show.left - 4;
  const waiterTop = show.step === "walk" ? show.top + 8 : show.top;
  return (
    <div className="pointer-events-none absolute inset-0 z-[25]" aria-hidden>
      <div
        className="absolute flex -translate-x-1/2 -translate-y-full flex-col items-center transition-[left,top] duration-700 ease-out"
        style={{ left: `${waiterLeft}%`, top: `${waiterTop}%` }}
      >
        <span className="mb-1 rounded-full bg-[#121212] px-2 py-0.5 text-[10px] font-bold text-white">Waiter</span>
        <IsoHuman skin="#8d5a3b" shirt="#1c1917" pants="#0f0f0f" hair="Low cut" pose="act" className="h-16 w-fit" />
        <span className="mt-[-0.4rem] text-xl">{show.bottle.emoji}</span>
      </div>
      {show.step === "spark" || show.step === "pop" || show.step === "cheer" ? (
        <div className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${show.left}%`, top: `${show.top - 8}%` }}>
          <div className={`club-sparkler ${show.step === "pop" || show.step === "cheer" ? "club-sparkler-pop" : ""}`}>
            {Array.from({ length: 10 }, (_, i) => (
              <span key={i} className="club-spark" style={{ ["--i" as string]: i }} />
            ))}
          </div>
          {(show.step === "pop" || show.step === "cheer") && <div className="club-pop-flash" />}
        </div>
      ) : null}
      {show.step === "cheer" ? <div className="club-cheer-burst absolute inset-0" /> : null}
    </div>
  );
}

function LivePeer({ style, live, onClick, ...look }: { name: string; style: { left: string; top: string }; live: boolean; skin: string; shirt: string; hair: string; pants: string; onClick: () => void }) {
  const [walking, setWalking] = useState(false);
  const [face, setFace] = useState<1 | -1>(1);
  const { left, top } = style;
  const last = useRef({ left, top });
  useEffect(() => {
    const before = last.current;
    last.current = { left, top };
    if (before.left === left && before.top === top) return;
    const dx = Number.parseFloat(left) - Number.parseFloat(before.left);
    const start = window.setTimeout(() => {
      setFace(dx < 0 ? -1 : 1);
      setWalking(true);
    }, 0);
    const stop = window.setTimeout(() => setWalking(false), live ? 1500 : 3000);
    return () => {
      window.clearTimeout(start);
      window.clearTimeout(stop);
    };
  }, [left, top, live]);
  return <PersonTag {...look} tone="blue" online style={style} pose={walking ? "walk" : "idle"} face={face} glide={live ? "live" : true} onClick={onClick} />;
}

function PersonTag({
  name,
  tone,
  style,
  skin,
  shirt,
  hair = "Bob",
  pants = "#1c1917",
  walk,
  pose = "idle",
  face = 1,
  dance = false,
  glide = false,
  online = false,
  bubble = null,
  onClick,
}: {
  name: string;
  tone: "blue" | "pink";
  style: { left: string; top: string };
  skin: string;
  shirt: string;
  hair?: string;
  pants?: string;
  walk?: number;
  pose?: "idle" | "walk" | "act" | "sit";
  face?: 1 | -1;
  dance?: boolean;
  glide?: boolean | "live";
  online?: boolean;
  bubble?: string | null;
  onClick?: () => void;
}) {
  const body = (
    <>
      <span className="relative mb-1 flex flex-col items-center">
        {bubble ? <span className="mb-1 max-w-[9rem] truncate rounded-full bg-[#121212] px-2.5 py-0.5 text-[10px] font-semibold text-white shadow">{bubble}</span> : null}
        {online || tone === "blue" ? <span className="mb-0.5 h-2 w-2 rounded-full bg-[#22c55e] shadow-[0_0_8px_rgba(34,197,94,.85)]" aria-hidden /> : null}
        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold text-white shadow-sm ${tone === "pink" ? "bg-[#ec4899]" : "bg-[#3b82f6]"}`}>{name}</span>
      </span>
      <IsoHuman skin={skin} shirt={shirt} pants={pants} hair={hair} pose={dance ? "act" : pose} face={face} className={`h-20 w-fit ${dance ? "venue-dance" : ""}`} />
    </>
  );
  const layer = { ...style, zIndex: 10 + Math.round(Number.parseFloat(style.top)) };
  if (!onClick) {
    return (
      <div
        className={`pointer-events-none absolute flex -translate-x-1/2 -translate-y-full flex-col items-center ${glide ? "transition-[left,top] duration-[2800ms] ease-in-out" : "ease-linear"}`}
        style={{ ...layer, transitionProperty: walk ? "left, top" : undefined, transitionDuration: walk ? `${walk}ms` : undefined }}
      >
        {body}
      </div>
    );
  }
  return (
    <button
      type="button"
      aria-label={`Talk to ${name}`}
      onClick={onClick}
      className={`absolute flex -translate-x-1/2 -translate-y-full flex-col items-center ${glide === "live" ? "transition-[left,top] duration-[1500ms] ease-linear" : glide ? "transition-[left,top] duration-[3000ms] ease-in-out" : ""}`}
      style={layer}
    >
      {body}
    </button>
  );
}

function TalkSheet({
  person,
  place,
  cash,
  lines,
  onClose,
  onChat,
  onPick,
  onPay,
}: {
  person: string;
  place: string;
  cash: number;
  lines: { from: "you" | "them"; text: string }[];
  onClose: () => void;
  onChat: () => void;
  onPick: (talk: TalkKind) => void;
  onPay: (amount: number) => string | null | Promise<string | null>;
}) {
  const [paying, setPaying] = useState(false);
  const [amount, setAmount] = useState("20");
  const [receipt, setReceipt] = useState<string | null>(null);
  return (
    <div className="absolute inset-x-0 bottom-0 z-50 max-h-[62vh] overflow-auto rounded-t-[28px] bg-white p-4 shadow-[0_-16px_50px_rgba(22,32,60,.22)]">
      <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-[#d5dbe6]" />
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-full bg-[#f3d7e4] text-lg font-bold">{person.slice(0, 1)}</span>
        <span className="min-w-0 flex-1">
          <span className="block font-display text-xl">{person}</span>
          <span className="block text-sm text-[#5c6b82]">Hanging out at {place}</span>
        </span>
        <button type="button" onClick={onClose} className="rounded-full bg-[#f4f7fb] px-3 py-1 text-sm font-semibold">
          Hide
        </button>
      </div>
      <div className="mt-3 max-h-28 space-y-1.5 overflow-auto">
        {lines.map((line, index) => (
          <p key={`${line.from}-${index}`} className={`max-w-[90%] rounded-2xl px-3 py-2 text-sm ${line.from === "you" ? "ml-auto bg-[#e7f8ee] text-[#121212]" : "bg-[#f4f7fb] text-[#121212]"}`}>
            {line.text}
          </p>
        ))}
      </div>
      <button type="button" onClick={onChat} className="mt-3 w-full rounded-full bg-[#006B3F] py-3 font-bold text-white">
        Chat
      </button>
      <button type="button" onClick={() => setPaying((value) => !value)} className="mt-2 w-full rounded-full bg-[#fff4c2] py-3 text-sm font-bold text-[#8a6a12]">
        💸 Send money
      </button>
      {paying ? (
        <form
          className="mt-2 flex items-center gap-2 rounded-2xl bg-[#fff8e8] px-3 py-2"
          onSubmit={(event) => {
            event.preventDefault();
            const value = Number(String(amount).replace(/[^\d.]/g, ""));
            void Promise.resolve(onPay(value)).then((error) => {
              setReceipt(error ?? `You sent ${person} ${cedis(value)}.`);
              if (!error) setPaying(false);
            });
          }}
        >
          <span className="text-sm text-[#8a6a12]">Wallet {cedis(cash)}</span>
          <input value={amount} onChange={(event) => setAmount(event.target.value)} inputMode="numeric" aria-label="Amount in cedis" className="h-9 w-20 rounded-full bg-white px-3 text-sm outline-none" />
          <button type="submit" className="rounded-full bg-[#121212] px-3 py-1.5 text-sm font-semibold text-white">
            Send
          </button>
        </form>
      ) : null}
      {receipt ? <p className="mt-2 rounded-2xl bg-[#f4f7fb] px-3 py-2 text-center text-sm">{receipt}</p> : null}
      <div className="mt-3 grid grid-cols-2 gap-2 pb-2">
        <TalkCard icon="👋" title="Say hello" meta="+Social" onClick={() => onPick("hello")} />
        <TalkCard icon="💬" title="Gist" meta="+Fun +Social" onClick={() => onPick("gist")} />
        <TalkCard icon="😄" title="Crack a joke" meta="+Fun +Social" onClick={() => onPick("joke")} />
        <TalkCard icon="😏" title="Throw shade" meta="+Fun" onClick={() => onPick("shade")} />
      </div>
    </div>
  );
}

function TalkCard({ icon, title, meta, onClick }: { icon: string; title: string; meta: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="rounded-2xl bg-[#f7f8fb] p-3 text-left">
      <span className="grid h-9 w-9 place-items-center rounded-full bg-white text-lg">{icon}</span>
      <span className="mt-2 block font-semibold">{title}</span>
      <span className="mt-1 block text-xs font-semibold text-[#6d5bd0]">{meta}</span>
    </button>
  );
}

function payVerb(verb: Verb, offer: Offer): Verb {
  return { ...verb, id: offer.id, label: offer.label, detail: offer.detail, minutes: offer.minutes, cost: offer.cost, effects: offer.effects, outfit: offer.outfit, cloth: offer.cloth } as Verb & { outfit?: string; cloth?: string };
}

function staffFor(spot: Spot) {
  const shore = BEACHES.has(spot.id);
  const club = isNightlife(spot.id, CLUB_IDS);
  const air = spot.id === "kotoka";
  return [
    {
      role: air ? "Check-in" : shore ? "Beach usher" : club ? "Bouncer" : "Manager",
      line: air
        ? "Accra to Kumasi boards at gate B. Boarding pass ready?"
        : shore
          ? "The chairs are this way. The grill is already hot."
          : club
            ? "List is at the door. Dress right. The night is inside."
            : `I run ${spot.name}. Tell me what you came for.`,
      style: air ? { left: "26%", top: "46%" } : club ? { left: "40%", top: "74%" } : { left: "18%", top: "42%" },
      skin: "#8d5a3b",
      shirt: air ? "#1d4ed8" : club ? "#121212" : "#006B3F",
      hair: "Bun",
    },
    {
      role: air ? "Security" : shore ? "Floor" : club ? "Bartender" : "Cashier",
      line: air
        ? "Laptops out. Liquids in the tray. The queue moves if you listen."
        : shore
          ? "Feet in the water is free. Kelewele is not."
          : club
            ? "Bar is open. Bottles come with sparklers if you pay for them."
            : "I take the money. The price is on the menu.",
      style: air ? { left: "68%", top: "40%" } : club ? { left: "24%", top: "46%" } : { left: "72%", top: "36%" },
      skin: "#c68a62",
      shirt: air ? "#FCD116" : club ? "#CE1126" : "#FCD116",
      hair: "Afro",
    },
  ];
}

function zoneForVerb(verb: Verb, zones: { id: string; label: string; emoji: string; left: number; top: number }[]) {
  const text = `${verb.id} ${verb.label} ${verb.detail} ${verb.tag ?? ""}`.toLowerCase();
  const pick = (...ids: string[]) => zones.find((zone) => ids.some((id) => zone.id === id || zone.label.toLowerCase().includes(id)));
  if (/water|shore|swim|sea|feet|tide|canoe/.test(text)) return pick("shore", "water", "arrivals") ?? zones[0];
  if (/hennessy|moët|moet|cîroc|ciroc|bottle|sparkler|bucket|bitters/.test(text)) return pick("booth", "tables", "bar") ?? zones[0];
  if (/sit|rest|chill|shade|chair|sofa|booth|lounge|take it in|table|vip/.test(text) && !/stroll|step outside/.test(text))
    return pick("booth", "chairs", "tables", "cafe", "sofa", "lounge", "departures") ?? zones[0];
  if (/food|eat|kelewele|grill|chop|plate|waakye|buy|coconut|drink|sip|bar|order at the bar/.test(text) || verb.tag === "food")
    return pick("grill", "bar", "counter", "tables", "chairs") ?? zones[0];
  if (/dance|drum|floor|band|highlife|hit the floor/.test(text)) return pick("floor", "drums", "mats") ?? zones[0];
  if (verb.tag === "party") return pick("floor", "booth", "bar", "tables") ?? zones[0];
  if (/pool/.test(text)) return pick("pool", "booth", "sofa", "lounge") ?? zones[0];
  if (/desk|check|lobby|work|office/.test(text)) return pick("desk", "checkin", "lobby", "counter") ?? zones[0];
  if (/walk|stroll|watch|morning|haze/.test(text)) return pick("shade", "mid", "green", "shore", "street") ?? zones[0];
  return pick("mid", "hang") ?? zones[Math.floor(zones.length / 2)] ?? zones[0];
}

function isDiningSpot(spot: Spot) {
  if (isNightlife(spot.id, CLUB_IDS)) return false;
  if (spot.actions.some((verb) => verb.tag === "food")) return true;
  return ["asanka", "buka", "viewing", "muni", "jamestown-coffee", "kishitei", "dez-amis", "vine-brasa"].includes(spot.id);
}

function seatsFor(spotId: string): Seat[] {
  if (spotId === "buka" || spotId === "viewing" || spotId === "asanka" || spotId === "muni") {
    return [
      { id: "seat-window", label: "Window stool", left: 28, top: 56, face: 1 },
      { id: "seat-mid", label: "Middle table", left: 44, top: 60, face: -1 },
      { id: "seat-back", label: "Back bench", left: 58, top: 54, face: 1 },
      { id: "seat-corner", label: "Corner chair", left: 70, top: 62, face: -1 },
      { id: "seat-street", label: "Street table", left: 34, top: 70, face: 1 },
    ];
  }
  if (spotId === "jamestown-coffee" || spotId === "dez-amis" || spotId === "kishitei" || spotId === "vine-brasa") {
    return [
      { id: "seat-cafe-a", label: "Cafe chair", left: 30, top: 54, face: 1 },
      { id: "seat-cafe-b", label: "Two-top", left: 48, top: 58, face: -1 },
      { id: "seat-cafe-c", label: "Window seat", left: 64, top: 50, face: 1 },
      { id: "seat-cafe-d", label: "Booth", left: 72, top: 64, face: -1 },
    ];
  }
  return [
    { id: "seat-a", label: "Chair", left: 26, top: 52, face: 1 },
    { id: "seat-b", label: "Table for two", left: 40, top: 58, face: -1 },
    { id: "seat-c", label: "Long table", left: 54, top: 54, face: 1 },
    { id: "seat-d", label: "Cafe seat", left: 66, top: 62, face: -1 },
    { id: "seat-e", label: "Bar stool", left: 48, top: 42, face: 1 },
  ];
}

function zonesFor(spotId: string): { id: string; label: string; emoji: string; left: number; top: number }[] {
  if (spotId === "kotoka") {
    return [
      { id: "checkin", label: "Check-in desk", emoji: "🎫", left: 28, top: 48 },
      { id: "departures", label: "Departure lounge", emoji: "🛋️", left: 58, top: 42 },
      { id: "lounge", label: "VIP lounge", emoji: "🥂", left: 74, top: 56 },
      { id: "arrivals", label: "Arrivals window", emoji: "🪟", left: 44, top: 68 },
    ];
  }
  if (spotId === "golf") {
    return [
      { id: "bar", label: "Clubhouse bar", emoji: "🍸", left: 24, top: 48 },
      { id: "green", label: "Putting green", emoji: "⛳", left: 58, top: 40 },
      { id: "cart", label: "Golf carts", emoji: "🛺", left: 48, top: 58 },
      { id: "sofa", label: "Lounge sofa", emoji: "🛋️", left: 76, top: 52 },
    ];
  }
  if (isNightlife(spotId, CLUB_IDS)) {
    return [
      { id: "door", label: "Door", emoji: "🚪", left: 42, top: 72 },
      { id: "bar", label: "The bar", emoji: "🍹", left: 24, top: 48 },
      { id: "floor", label: "Dance floor", emoji: "🪩", left: 50, top: 50 },
      { id: "booth", label: "VIP / bottles", emoji: "🍾", left: 74, top: 54 },
      { id: "tables", label: "Tables", emoji: "🪑", left: 36, top: 58 },
    ];
  }
  if (spotId === "beach" || spotId === "bojo" || spotId === "kokrobite") {
    return [
      { id: "shore", label: "Waterline", emoji: "🌊", left: 50, top: 38 },
      { id: "grill", label: "Grill", emoji: "🔥", left: 30, top: 55 },
      { id: "chairs", label: "Shade chairs", emoji: "🪑", left: 68, top: 52 },
      { id: "drums", label: "Drum circle", emoji: "🥁", left: 48, top: 64 },
    ];
  }
  if (spotId === "hotel" || spotId === "kempinski" || spotId === "movenpick") {
    return [
      { id: "lobby", label: "Lobby", emoji: "🛎️", left: 40, top: 48 },
      { id: "pool", label: "Poolside", emoji: "🏊", left: 68, top: 52 },
      { id: "bar", label: "Hotel bar", emoji: "🥂", left: 24, top: 44 },
      { id: "desk", label: "Front desk", emoji: "🪪", left: 52, top: 36 },
    ];
  }
  if (spotId === "buka" || spotId === "viewing" || spotId === "asanka" || spotId === "muni") {
    return [
      { id: "counter", label: "Counter", emoji: "🍲", left: 48, top: 40 },
      { id: "chairs", label: "Window stool", emoji: "🪑", left: 28, top: 56 },
      { id: "tables", label: "Middle table", emoji: "🍽️", left: 44, top: 60 },
      { id: "cafe", label: "Back bench", emoji: "🪑", left: 58, top: 54 },
      { id: "tv", label: "Screen", emoji: "📺", left: 70, top: 46 },
      { id: "street", label: "Street edge", emoji: "🛣️", left: 22, top: 68 },
    ];
  }
  if (spotId === "jamestown-coffee" || spotId === "dez-amis" || spotId === "kishitei" || spotId === "vine-brasa") {
    return [
      { id: "counter", label: "Counter", emoji: "☕", left: 46, top: 38 },
      { id: "chairs", label: "Cafe chair", emoji: "🪑", left: 30, top: 54 },
      { id: "tables", label: "Two-top", emoji: "🍽️", left: 48, top: 58 },
      { id: "cafe", label: "Window seat", emoji: "🪟", left: 64, top: 50 },
      { id: "street", label: "Street edge", emoji: "🛣️", left: 74, top: 68 },
    ];
  }
  if (spotId === "gym" || spotId === "stadium") {
    return [
      { id: "mats", label: "Mat floor", emoji: "🧘", left: 42, top: 50 },
      { id: "weights", label: "Weights", emoji: "🏋️", left: 64, top: 46 },
      { id: "mirror", label: "Mirror wall", emoji: "🪞", left: 28, top: 40 },
      { id: "locker", label: "Lockers", emoji: "🔐", left: 74, top: 60 },
    ];
  }
  return [
    { id: "chairs", label: "A chair", emoji: "🪑", left: 25, top: 48 },
    { id: "tables", label: "Long table", emoji: "🍽️", left: 34, top: 50 },
    { id: "cafe", label: "Cafe seat", emoji: "☕", left: 56, top: 64 },
    { id: "bar", label: "The bar", emoji: "🍹", left: 48, top: 38 },
    { id: "mid", label: "Hang here", emoji: "✨", left: 50, top: 50 },
    { id: "street", label: "Street edge", emoji: "🛣️", left: 72, top: 58 },
  ];
}

function spotFlavor(spot: Spot) {
  if (spot.id === "kotoka") return "Taxi men calling out 'Osu! Madina! East Legon!'";
  if (spot.blurb.includes(".")) {
    const bit = spot.blurb.split(".")[1]?.trim();
    if (bit) return bit;
  }
  return spot.blurb;
}

function sceneKind(spot: Spot): Kind {
  if (spot.id === "kotoka") return "airport";
  if (HOTELS.has(spot.id)) return "hotel";
  if (isNightlife(spot.id, CLUB_IDS)) return "club";
  if (BEACHES.has(spot.id)) return "shore";
  if (GARDENS.has(spot.id)) return "garden";
  if (spot.id === "gym" || spot.id === "stadium") return "gym";
  if (spot.group === "work" || spot.group === "civic") return "hall";
  if (spot.group === "sea") return "garden";
  return "tables";
}

function talkVerb(person: string, talk: TalkKind, spot: Spot): Verb {
  const line = youSay(talk, spot.name);
  if (talk === "gist") return { id: `gist-${person}`, label: line, detail: line, minutes: 15, cost: 0, earn: 0, effects: { social: 16, fun: 8 }, social: true };
  if (talk === "joke") return { id: `joke-${person}`, label: line, detail: line, minutes: 8, cost: 0, earn: 0, effects: { social: 10, fun: 12 }, social: true };
  if (talk === "shade") return { id: `shade-${person}`, label: line, detail: line, minutes: 6, cost: 0, earn: 0, effects: { fun: 8, social: 4 }, social: true };
  if (talk === "place") return { id: `place-${person}`, label: line, detail: line, minutes: 6, cost: 0, earn: 0, effects: { social: 6 }, social: true };
  return { id: `hello-${person}`, label: line, detail: line, minutes: 8, cost: 0, earn: 0, effects: { social: 12, fun: 4 }, social: true };
}

function youSay(talk: TalkKind, place: string) {
  if (talk === "gist") return "So what is the gist?";
  if (talk === "joke") return "You hear the one about the trotro?";
  if (talk === "shade") return "You are dressed like the night has plans.";
  if (talk === "place") return `What is ${place} actually like?`;
  return "Ei. I just got here.";
}

function VenueScene({ spot, night, kind, party }: { spot: Spot; night: boolean; kind: Kind; party?: boolean }) {
  const boxed = kind === "hotel" || kind === "hall" || kind === "airport" || kind === "tables";
  const floor =
    spot.id === "golf" || kind === "garden"
      ? "#3a5224"
      : kind === "club"
        ? "#1a1218"
        : kind === "gym"
          ? "#2a3038"
          : kind === "airport"
            ? "#a8bc72"
            : kind === "shore"
              ? "#c4a574"
              : night
                ? "#2a2e36"
                : "#cfc6b4";
  const wall = night || kind === "airport" || kind === "club" ? "#2a2634" : "#f2ebe0";
  const wallSide = night || kind === "airport" || kind === "club" ? "#1a1824" : "#ddd4c6";
  const items = [...furniture(kind, night, spot.id), ...setDress(kind, night, spot.id)];
  const title = spot.name.toUpperCase();
  const lights = lightPools(kind, spot.id, night);
  const pid = `v-${spot.id}`;
  return (
    <div className="absolute inset-0">
      <svg viewBox="0 0 760 480" className="h-full w-full" preserveAspectRatio="xMidYMid slice">
        <defs>
          <pattern id={`${pid}-grime`} width="28" height="28" patternUnits="userSpaceOnUse">
            <rect width="28" height="28" fill="transparent" />
            <circle cx="4" cy="9" r="1.2" fill="#000" opacity="0.07" />
            <circle cx="18" cy="22" r="1.6" fill="#000" opacity="0.05" />
            <circle cx="22" cy="6" r="0.9" fill="#fff" opacity="0.04" />
            <path d="M2 20h8M14 4h6" stroke="#000" strokeWidth="0.6" opacity="0.05" />
          </pattern>
          <radialGradient id={`${pid}-sun`} cx={night ? "28%" : "62%"} cy={night ? "8%" : "6%"} r="70%">
            <stop offset="0%" stopColor={night ? "#ff7a4a" : "#ffe2a8"} stopOpacity={night ? 0.22 : 0.38} />
            <stop offset="45%" stopColor={night ? "#6b3a8a" : "#f0b060"} stopOpacity={night ? 0.1 : 0.12} />
            <stop offset="100%" stopColor="#000" stopOpacity="0" />
          </radialGradient>
          <linearGradient id={`${pid}-grade`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={night ? "#1a1028" : "#f6d9a0"} stopOpacity={night ? 0.18 : 0.12} />
            <stop offset="100%" stopColor="#0a0806" stopOpacity={night ? 0.35 : 0.16} />
          </linearGradient>
        </defs>
        <Blocks
          items={[
            { x: -118, y: -4, z: -62, w: 236, h: 4, d: 168, color: floor },
            ...(boxed
              ? [
                  { x: -118, y: 0, z: -62, w: 10, h: 86, d: 168, color: wallSide },
                  { x: -118, y: 0, z: -62, w: 236, h: 86, d: 10, color: wall },
                ]
              : []),
            ...items,
          ]}
        />
        <FloorWear kind={kind} night={night} />
        <rect x="0" y="0" width="760" height="480" fill={`url(#${pid}-grime)`} pointerEvents="none" />
        <SpotLights pools={lights} warm={!night || kind === "club"} />
        <PracticalLights kind={kind} night={night} party={party} />
        <rect x="0" y="0" width="760" height="480" fill={`url(#${pid}-sun)`} pointerEvents="none" />
        {party || kind === "club" ? <ClubGlow party={Boolean(party)} /> : null}
        {kind === "shore" ? <ShoreDress /> : null}
        {kind === "garden" || spot.id === "golf" ? <GardenDress golf={spot.id === "golf"} /> : null}
        {kind === "hotel" ? <Pool /> : null}
        {kind === "airport" ? <AirportDress night={night} /> : null}
        {kind === "airport" ? (
          <>
            <FaceSign axis="x" x={-102} y={48} z={-51} length={88} tall={14} text="CHECK-IN · ACCRA LIFE AIR" fill="#1d4ed8" ink="white" />
            <FaceSign axis="z" x={-107} y={46} z={20} length={52} tall={13} text="DEPARTURES" fill="#006B3F" ink="white" />
          </>
        ) : spot.id === "golf" ? (
          <StandingBoard x={-20} z={-40} text="ACCRA GOLF CLUB" />
        ) : boxed ? (
          <>
            <FaceSign axis="x" x={-6} y={52} z={-51} length={112} tall={15} text={title} fill="#121212" ink="white" />
            <FaceSign axis="z" x={-107} y={50} z={28} length={58} tall={14} text={bannerLine(kind)} fill="#1f4d3a" ink="white" />
          </>
        ) : kind === "club" ? (
          <StandingBoard x={-70} z={-36} text={spot.name.toUpperCase().slice(0, 14)} />
        ) : (
          <StandingBoard x={-72} z={6} text={title} />
        )}
        <ellipse cx="380" cy="420" rx="340" ry="80" fill="#000" opacity={night ? 0.28 : 0.12} pointerEvents="none" />
        <rect x="0" y="0" width="760" height="480" fill={`url(#${pid}-grade)`} pointerEvents="none" />
      </svg>
      <div className={`venue-haze pointer-events-none absolute inset-0 ${night ? "venue-haze-night" : "venue-haze-day"} ${kind === "club" ? "venue-haze-club" : ""}`} aria-hidden />
      <div className="venue-dust pointer-events-none absolute inset-0" aria-hidden>
        {Array.from({ length: 12 }, (_, i) => (
          <span key={i} className="venue-mote" style={{ left: `${8 + ((i * 17) % 84)}%`, animationDelay: `${(i % 6) * 0.7}s`, animationDuration: `${5 + (i % 4)}s` }} />
        ))}
      </div>
      {kind === "club" || party ? <div className="venue-beam pointer-events-none absolute inset-0" aria-hidden /> : null}
      <div className="venue-vignette pointer-events-none absolute inset-0" aria-hidden />
    </div>
  );
}

function lightPools(kind: Kind, spotId: string, night: boolean): { x: number; z: number; r: number; color?: string; opacity?: number }[] {
  if (spotId === "golf") return [{ x: -60, z: 20, r: 54 }, { x: 20, z: -10, r: 48 }, { x: 70, z: 30, r: 50 }, { x: 10, z: 40, r: 40 }];
  if (kind === "club")
    return [
      { x: -50, z: 20, r: 50, color: "#ff4d9a", opacity: 0.22 },
      { x: 10, z: -10, r: 62, color: "#7c5cff", opacity: 0.2 },
      { x: 60, z: 30, r: 46, color: "#22d3ee", opacity: 0.18 },
      { x: -10, z: 40, r: 40, color: "#FCD116", opacity: 0.14 },
    ];
  if (kind === "airport") return [{ x: -60, z: -10, r: 48, color: "#dbeafe", opacity: night ? 0.2 : 0.14 }, { x: 10, z: 20, r: 44 }, { x: 70, z: 20, r: 42 }];
  if (kind === "shore") return [{ x: -20, z: 10, r: 56, color: "#fff6d8", opacity: 0.22 }, { x: 40, z: 30, r: 48 }, { x: -70, z: 40, r: 40 }];
  if (kind === "hotel") return [{ x: -50, z: 20, r: 46 }, { x: 40, z: 20, r: 52 }, { x: 10, z: -20, r: 40, color: "#c4b5fd", opacity: 0.14 }];
  if (kind === "gym") return [{ x: -20, z: 10, r: 50, color: "#fecaca", opacity: 0.12 }, { x: 40, z: 10, r: 46 }];
  if (kind === "tables" || kind === "hall")
    return [
      { x: -40, z: 10, r: 48, color: "#ffd89a", opacity: night ? 0.2 : 0.16 },
      { x: 30, z: 20, r: 50 },
      { x: 70, z: 0, r: 40, color: "#fff1c9", opacity: 0.12 },
    ];
  return [{ x: -40, z: 10, r: 48 }, { x: 30, z: 20, r: 50 }, { x: 70, z: 0, r: 40 }];
}

function SpotLights({ pools, warm }: { pools: { x: number; z: number; r: number; color?: string; opacity?: number }[]; warm?: boolean }) {
  return (
    <g pointerEvents="none">
      {pools.map((pool, index) => {
        const [cx, cy] = pt(pool.x, 1.5, pool.z);
        return <ellipse key={index} cx={cx} cy={cy} rx={pool.r} ry={pool.r * 0.42} fill={pool.color ?? (warm ? "#ffe8b8" : "#fff6d8")} opacity={pool.opacity ?? 0.16} />;
      })}
    </g>
  );
}

function PracticalLights({ kind, night, party }: { kind: Kind; night: boolean; party?: boolean }) {
  if (kind === "club" || party) {
    const a = pt(-70, 36, 10);
    const b = pt(8, 40, -20);
    const c = pt(70, 30, 20);
    return (
      <g pointerEvents="none" className="venue-neon">
        <ellipse cx={a[0]} cy={a[1]} rx="36" ry="10" fill="#ff2d95" opacity="0.45" />
        <ellipse cx={b[0]} cy={b[1]} rx="44" ry="12" fill="#7c5cff" opacity="0.4" />
        <ellipse cx={c[0]} cy={c[1]} rx="30" ry="9" fill="#22d3ee" opacity="0.42" />
        <ellipse cx={b[0]} cy={b[1] + 70} rx="90" ry="28" fill="#ff2d95" opacity="0.08" />
      </g>
    );
  }
  if (kind === "tables" || kind === "hall") {
    const bulb = pt(-10, 48, -40);
    return (
      <g pointerEvents="none">
        <ellipse cx={bulb[0]} cy={bulb[1]} rx="50" ry="16" fill="#ffe08a" opacity={night ? 0.28 : 0.14} />
        <circle cx={bulb[0]} cy={bulb[1] - 8} r="4" fill="#fff6c8" opacity="0.7" />
      </g>
    );
  }
  if (kind === "hotel" && night) {
    const tv = pt(-8, 28, -28);
    return <ellipse cx={tv[0]} cy={tv[1]} rx="28" ry="14" fill="#7eb6e8" opacity="0.25" />;
  }
  return null;
}

function FloorWear({ kind, night }: { kind: Kind; night: boolean }) {
  const marks =
    kind === "club"
      ? [
          { x: -40, z: 36, rx: 22, ry: 9, fill: "#0a0608", o: 0.35 },
          { x: 10, z: 44, rx: 18, ry: 7, fill: "#1a0a12", o: 0.28 },
          { x: 40, z: 20, rx: 14, ry: 6, fill: "#12080e", o: 0.3 },
          { x: -70, z: 50, rx: 10, ry: 4, fill: "#2a1810", o: 0.25 },
        ]
      : kind === "shore"
        ? [
            { x: -30, z: 30, rx: 16, ry: 6, fill: "#8a6a40", o: 0.22 },
            { x: 50, z: 40, rx: 12, ry: 5, fill: "#7a5a34", o: 0.18 },
            { x: 0, z: 50, rx: 20, ry: 5, fill: "#9a7a50", o: 0.15 },
          ]
        : kind === "tables" || kind === "hall"
          ? [
              { x: -20, z: 20, rx: 14, ry: 5, fill: "#8a7a60", o: night ? 0.2 : 0.14 },
              { x: 40, z: 36, rx: 10, ry: 4, fill: "#6a5a40", o: 0.16 },
              { x: -60, z: 40, rx: 8, ry: 3, fill: "#5a4a30", o: 0.18 },
            ]
          : [
              { x: -50, z: 20, rx: 12, ry: 5, fill: "#000", o: 0.08 },
              { x: 30, z: 40, rx: 16, ry: 6, fill: "#000", o: 0.07 },
            ];
  return (
    <g pointerEvents="none">
      {marks.map((mark, index) => {
        const [cx, cy] = pt(mark.x, 1.2, mark.z);
        return <ellipse key={index} cx={cx} cy={cy} rx={mark.rx} ry={mark.ry} fill={mark.fill} opacity={mark.o} />;
      })}
    </g>
  );
}

function ClubGlow({ party }: { party?: boolean }) {
  const neon = pt(-62, 28, 18);
  const strip = pt(-20, 34, -30);
  const strip2 = pt(50, 32, 8);
  return (
    <g className={party ? "venue-neon" : undefined}>
      <ellipse cx={neon[0]} cy={neon[1]} rx="34" ry="10" fill="#FCD116" opacity="0.4" />
      <text x={neon[0]} y={neon[1] + 4} textAnchor="middle" fill="#FCD116" fontSize="11" fontWeight="800" letterSpacing="1.5">
        LIVE · ACCRA
      </text>
      <rect x={strip[0] - 40} y={strip[1]} width="80" height="3" fill="#ff2d95" opacity="0.75" rx="1.5" />
      <rect x={strip2[0] - 28} y={strip2[1]} width="56" height="3" fill="#22d3ee" opacity="0.7" rx="1.5" />
      <ellipse cx={strip[0]} cy={strip[1] + 55} rx="70" ry="22" fill="#7c5cff" opacity="0.12" />
    </g>
  );
}

function setDress(kind: Kind, night: boolean, spotId: string): Block[] {
  if (spotId === "golf") {
    return [
      { x: -50, y: 0, z: 44, w: 6, h: 2, d: 8, color: "#5b4636" },
      { x: 40, y: 0, z: 48, w: 4, h: 1.5, d: 10, color: "#1c1917" },
      { x: 12, y: 0, z: 20, w: 3, h: 1, d: 12, color: "#334155" },
    ];
  }
  if (kind === "club") {
    return [
      // Bottle clutter on floor + bar ledge extras
      { x: -80, y: 19, z: 22, w: 3, h: 7, d: 3, color: "#a3e635" },
      { x: -62, y: 19, z: 24, w: 3, h: 6, d: 3, color: "#f97316" },
      { x: -40, y: 0, z: 40, w: 4, h: 5, d: 4, color: "#22d3ee" },
      { x: -20, y: 0, z: 56, w: 3, h: 6, d: 3, color: "#FCD116" },
      { x: 8, y: 0, z: 50, w: 3, h: 5, d: 3, color: "#ec4899" },
      { x: 24, y: 0, z: 44, w: 5, h: 2, d: 5, color: "#1c1917" },
      // Cable runs
      { x: -10, y: 0.2, z: -10, w: 40, h: 1, d: 2, color: "#0f0a10" },
      { x: 40, y: 0.2, z: 8, w: 2, h: 1, d: 28, color: "#0f0a10" },
      // Extra speaker stacks
      { x: -30, y: 0, z: -40, w: 12, h: 20, d: 10, color: "#0c0a0e" },
      { x: 48, y: 0, z: -36, w: 12, h: 22, d: 10, color: "#0c0a0e" },
      { x: 50, y: 22, z: -34, w: 8, h: 4, d: 6, color: "#3b82f6" },
      // Crate of empties
      { x: 80, y: 0, z: 44, w: 14, h: 8, d: 12, color: "#3f2a1c" },
      { x: 82, y: 8, z: 46, w: 4, h: 5, d: 4, color: "#22d3ee" },
      { x: 88, y: 8, z: 48, w: 4, h: 6, d: 4, color: "#CE1126" },
      // LED floor strip
      { x: -96, y: 0.5, z: 42, w: 120, h: 1.2, d: 2, color: night ? "#ff2d95" : "#7c5cff" },
      // Sticky mat near door
      { x: 70, y: 0, z: 52, w: 18, h: 1.5, d: 14, color: "#1a1014" },
    ];
  }
  if (kind === "tables" || kind === "hall") {
    return [
      { x: -70, y: 0, z: 48, w: 8, h: 6, d: 8, color: "#d64545" },
      { x: -10, y: 12, z: -28, w: 6, h: 5, d: 6, color: "#8a5a32" },
      { x: 0, y: 12, z: -26, w: 5, h: 4, d: 5, color: "#f4efe6" },
      { x: 50, y: 0, z: 48, w: 10, h: 2, d: 8, color: "#1c1917" },
      { x: 60, y: 0, z: 44, w: 4, h: 7, d: 4, color: "#22c55e" },
      { x: -90, y: 0, z: 20, w: 6, h: 14, d: 4, color: "#334155" },
      { x: 20, y: 0.3, z: 30, w: 24, h: 1, d: 2, color: "#1c1917" },
      { x: -40, y: 0, z: 52, w: 12, h: 1.5, d: 10, color: "#a86f4c" },
    ];
  }
  if (kind === "shore") {
    return [
      { x: -60, y: 0, z: 28, w: 16, h: 3, d: 8, color: "#1e3a5f" },
      { x: 30, y: 0, z: 20, w: 20, h: 2, d: 6, color: "#334155" },
      { x: 70, y: 0, z: 30, w: 8, h: 2, d: 14, color: "#f8fafc" },
      { x: -20, y: 0, z: 44, w: 5, h: 1.5, d: 5, color: "#22d3ee" },
      { x: 10, y: 0, z: 36, w: 4, h: 1, d: 8, color: "#CE1126" },
      { x: 80, y: 0, z: -40, w: 18, h: 8, d: 8, color: "#8a5a32" },
    ];
  }
  if (kind === "hotel") {
    return [
      { x: -60, y: 0, z: 48, w: 10, h: 1.5, d: 8, color: "#e7d3b0" },
      { x: 30, y: 0, z: 50, w: 4, h: 2, d: 4, color: "#1c1917" },
      { x: 60, y: 0, z: -30, w: 8, h: 12, d: 6, color: "#94a3b8" },
      { x: -96, y: 20, z: 12, w: 6, h: 8, d: 4, color: "#7eb6e8" },
    ];
  }
  if (kind === "airport") {
    return [
      { x: -50, y: 0, z: 30, w: 14, h: 10, d: 10, color: "#1c1917" },
      { x: 10, y: 0, z: 36, w: 12, h: 8, d: 10, color: "#334155" },
      { x: 80, y: 0, z: 20, w: 6, h: 2, d: 20, color: "#FCD116" },
      { x: -100, y: 0, z: 50, w: 8, h: 4, d: 8, color: "#CE1126" },
    ];
  }
  if (kind === "gym") {
    return [
      { x: -60, y: 0, z: 30, w: 10, h: 4, d: 10, color: "#1c1917" },
      { x: 0, y: 0, z: 40, w: 16, h: 2, d: 16, color: "#334155" },
      { x: 60, y: 0, z: 30, w: 6, h: 8, d: 6, color: "#9aa4b2" },
    ];
  }
  if (kind === "garden") {
    return [
      { x: -70, y: 0, z: 40, w: 8, h: 2, d: 8, color: "#5b4636" },
      { x: 30, y: 0, z: 50, w: 12, h: 1.5, d: 6, color: "#8a5a32" },
      { x: 70, y: 0, z: 20, w: 4, h: 10, d: 4, color: "#f8fafc" },
    ];
  }
  return [
    { x: -50, y: 0, z: 40, w: 6, h: 2, d: 6, color: "#5b4636" },
    { x: 40, y: 0, z: 48, w: 4, h: 1.5, d: 8, color: "#1c1917" },
  ];
}

function furniture(kind: Kind, night: boolean, spotId: string): Block[] {
  if (spotId === "golf") {
    return [
      // Clubhouse bar
      { x: -92, y: 0, z: 8, w: 44, h: 14, d: 18, color: "#1c1917" },
      { x: -88, y: 14, z: 12, w: 36, h: 3, d: 12, color: "#c9a227" },
      { x: -84, y: 17, z: 10, w: 5, h: 10, d: 5, color: "#22d3ee" },
      { x: -76, y: 17, z: 12, w: 5, h: 12, d: 5, color: "#FCD116" },
      { x: -68, y: 17, z: 10, w: 5, h: 9, d: 5, color: "#CE1126" },
      { x: -60, y: 17, z: 12, w: 5, h: 11, d: 5, color: "#3b82f6" },
      // Palm pot
      { x: -100, y: 0, z: 36, w: 8, h: 5, d: 8, color: "#6b4428" },
      // Putting green
      { x: 8, y: 0, z: -28, w: 42, h: 1.5, d: 42, color: "#4ade80" },
      { x: 24, y: 1.5, z: -12, w: 2, h: 18, d: 2, color: "#f8fafc" },
      { x: 22, y: 18, z: -14, w: 8, h: 1.5, d: 6, color: "#CE1126" },
      // Golf carts
      { x: -8, y: 0, z: 28, w: 22, h: 10, d: 12, color: "#f8fafc" },
      { x: -4, y: 10, z: 30, w: 14, h: 6, d: 8, color: "#e2e8f0" },
      { x: 20, y: 0, z: 36, w: 22, h: 10, d: 12, color: "#f8fafc" },
      { x: 24, y: 10, z: 38, w: 14, h: 6, d: 8, color: "#e2e8f0" },
      // Purple lounge sofa
      { x: 58, y: 0, z: 16, w: 40, h: 10, d: 16, color: "#7c3aed" },
      { x: 58, y: 10, z: 16, w: 40, h: 12, d: 4, color: "#6d28d9" },
      // Conical tree
      { x: 88, y: 0, z: 28, w: 8, h: 6, d: 8, color: "#5b4636" },
      { x: 84, y: 6, z: 24, w: 16, h: 10, d: 16, color: "#166534" },
      { x: 86, y: 16, z: 26, w: 12, h: 10, d: 12, color: "#15803d" },
      { x: 88, y: 26, z: 28, w: 8, h: 10, d: 8, color: "#22c55e" },
      // Sign post base
      { x: -6, y: 0, z: -48, w: 6, h: 28, d: 6, color: "#1c1917" },
      { x: -22, y: 20, z: -52, w: 40, h: 14, d: 4, color: "#121212" },
    ];
  }
  if (kind === "hotel") {
    return [
      { x: -88, y: 0, z: 8, w: 40, h: 16, d: 22, color: "#6d4aff" },
      { x: -84, y: 16, z: 12, w: 32, h: 4, d: 14, color: "#efe8ff" },
      { x: -76, y: 20, z: 10, w: 10, h: 4, d: 6, color: "#ffffff" },
      { x: -20, y: 0, z: -32, w: 52, h: 20, d: 18, color: "#f7f4ef" },
      { x: -8, y: 20, z: -28, w: 14, h: 8, d: 6, color: "#7eb6e8" },
      { x: 24, y: 0, z: 28, w: 18, h: 4, d: 34, color: "#f4efe6" },
      { x: 48, y: 0, z: 32, w: 18, h: 4, d: 34, color: "#d7e7f4" },
      { x: 72, y: 0, z: 36, w: 18, h: 4, d: 28, color: "#f4efe6" },
      { x: 78, y: 0, z: -20, w: 10, h: 16, d: 10, color: "#c47a4a" },
      { x: -100, y: 0, z: 40, w: 8, h: 18, d: 8, color: "#166534" },
      { x: 90, y: 0, z: 10, w: 8, h: 18, d: 8, color: "#166534" },
      ...chair(-50, 40, "#c9a227"),
      ...chair(-30, 48, "#c9a227"),
    ];
  }
  if (kind === "club") {
    return [
      // DJ / stage — scuffed riser
      { x: -20, y: 0, z: -32, w: 64, h: 12, d: 34, color: "#120e14" },
      { x: -16, y: 12, z: -28, w: 56, h: 2, d: 26, color: "#1a141c" },
      { x: 4, y: 14, z: -24, w: 10, h: 22, d: 10, color: "#0c0a0e" },
      { x: 6, y: 36, z: -22, w: 6, h: 4, d: 6, color: "#7c5cff" },
      // Bar with sticky top + bottle row
      { x: -92, y: 0, z: 16, w: 42, h: 16, d: 18, color: night ? "#14100e" : "#2e2218" },
      { x: -88, y: 16, z: 20, w: 34, h: 3, d: 12, color: "#a88420" },
      { x: -84, y: 19, z: 18, w: 5, h: 10, d: 5, color: "#22d3ee" },
      { x: -76, y: 19, z: 20, w: 5, h: 12, d: 5, color: "#FCD116" },
      { x: -68, y: 19, z: 18, w: 5, h: 9, d: 5, color: "#ec4899" },
      { x: -90, y: 19, z: 22, w: 4, h: 8, d: 4, color: "#a3e635" },
      // Speakers / VIP booth
      { x: 62, y: 0, z: 0, w: 16, h: 28, d: 14, color: "#0e0c12" },
      { x: 64, y: 20, z: 2, w: 12, h: 4, d: 10, color: "#3b82f6" },
      { x: 70, y: 0, z: 28, w: 28, h: 10, d: 20, color: "#100e14" },
      { x: 74, y: 10, z: 32, w: 20, h: 3, d: 12, color: "#a88420" },
      // VIP couches
      { x: 54, y: 0, z: 36, w: 22, h: 8, d: 14, color: "#4a1528" },
      { x: 54, y: 8, z: 36, w: 22, h: 10, d: 4, color: "#6b1f3a" },
      { x: 86, y: 0, z: 40, w: 18, h: 8, d: 14, color: "#3b2048" },
      { x: 86, y: 8, z: 40, w: 18, h: 10, d: 4, color: "#5b2d6e" },
      // Bottle service table + empties clutter
      { x: 68, y: 0, z: 48, w: 16, h: 9, d: 12, color: "#2a1810" },
      { x: 70, y: 9, z: 50, w: 4, h: 8, d: 4, color: "#c9a227" },
      { x: 76, y: 9, z: 52, w: 3, h: 6, d: 3, color: "#e8e8e8" },
      { x: 72, y: 9, z: 54, w: 3, h: 5, d: 3, color: "#CE1126" },
      // Regular floor tables
      { x: -40, y: 0, z: 28, w: 18, h: 8, d: 12, color: "#1c1410" },
      { x: -38, y: 8, z: 30, w: 14, h: 2, d: 8, color: "#3a2a20" },
      { x: 8, y: 0, z: 30, w: 18, h: 8, d: 12, color: "#1c1410" },
      { x: 10, y: 8, z: 32, w: 14, h: 2, d: 8, color: "#3a2a20" },
      // Worn dance pads
      { x: -90, y: 0, z: 48, w: 22, h: 2, d: 22, color: "#b8326e" },
      { x: -50, y: 0, z: 52, w: 22, h: 2, d: 22, color: "#c9a020" },
      { x: -10, y: 0, z: 48, w: 22, h: 2, d: 22, color: "#0a5a38" },
      { x: 30, y: 0, z: 52, w: 22, h: 2, d: 22, color: "#2a5a9a" },
    ];
  }
  if (kind === "shore") {
    return [
      { x: -118, y: 0, z: -62, w: 236, h: 3, d: 40, color: "#5ec4e8" },
      { x: -118, y: 0, z: -22, w: 236, h: 2, d: 16, color: "#8fd0ea" },
      ...benchTable(-28, 22),
      ...benchTable(24, 40),
      ...cafeSet(56, 20, "#d64545"),
      { x: 78, y: 0, z: 52, w: 24, h: 4, d: 12, color: "#f7fbfe" },
      { x: -86, y: 0, z: 36, w: 18, h: 10, d: 12, color: "#1c1917" },
      { x: -82, y: 10, z: 40, w: 10, h: 8, d: 6, color: "#FCD116" },
      { x: -50, y: 0, z: 48, w: 14, h: 8, d: 10, color: "#CE1126" },
      { x: 10, y: 0, z: 56, w: 16, h: 2, d: 16, color: "#f5c542" },
    ];
  }
  if (kind === "garden") {
    return [
      ...benchTable(-40, 8, "#8d5a32"),
      ...benchTable(8, 36, "#8d5a32"),
      ...benchTable(48, 12, "#8d5a32"),
      { x: 78, y: 0, z: -12, w: 10, h: 18, d: 10, color: "#8a5a32" },
      { x: -92, y: 0, z: 28, w: 10, h: 18, d: 10, color: "#6b4428" },
      { x: -20, y: 0, z: -30, w: 36, h: 2, d: 36, color: "#5a8f3a" },
      { x: 60, y: 0, z: 40, w: 8, h: 5, d: 8, color: "#5b4636" },
      { x: 56, y: 5, z: 36, w: 16, h: 12, d: 16, color: "#166534" },
      { x: 58, y: 17, z: 38, w: 12, h: 10, d: 12, color: "#22c55e" },
    ];
  }
  if (kind === "gym") {
    return [
      { x: -48, y: 0, z: 8, w: 56, h: 2, d: 36, color: "#CE1126" },
      { x: 24, y: 0, z: 4, w: 40, h: 10, d: 14, color: "#1c1917" },
      { x: 32, y: 10, z: 8, w: 22, h: 4, d: 4, color: "#9aa4b2" },
      { x: 72, y: 0, z: -20, w: 14, h: 32, d: 12, color: "#3a4454" },
      { x: -90, y: 0, z: -20, w: 28, h: 36, d: 6, color: "#94a3b8" },
      { x: -80, y: 0, z: 40, w: 18, h: 16, d: 14, color: "#1e293b" },
      { x: 50, y: 0, z: 40, w: 18, h: 16, d: 14, color: "#1e293b" },
      ...chair(-20, 48, "#121212"),
    ];
  }
  if (kind === "hall") {
    return [
      { x: -36, y: 0, z: -32, w: 110, h: 18, d: 18, color: "#f7f4ef" },
      { x: 4, y: 18, z: -28, w: 28, h: 3, d: 10, color: "#fff6df" },
      ...chair(-70, 24, "#CE1126"),
      ...chair(-48, 36, "#CE1126"),
      ...chair(-26, 28, "#CE1126"),
      ...cafeSet(40, 32, "#8d5a32"),
      { x: 78, y: 0, z: -10, w: 12, h: 28, d: 10, color: "#334155" },
      { x: -96, y: 0, z: 40, w: 10, h: 16, d: 10, color: "#166534" },
    ];
  }
  if (kind === "airport") {
    return [
      { x: -70, y: 0, z: 8, w: 140, h: 1, d: 90, color: "#a8bc78" },
      { x: -88, y: 0, z: -28, w: 52, h: 16, d: 18, color: "#1d4ed8" },
      { x: -84, y: 16, z: -24, w: 44, h: 3, d: 12, color: "#93c5fd" },
      { x: -72, y: 19, z: -22, w: 10, h: 8, d: 4, color: "#121212" },
      { x: -96, y: 0, z: -8, w: 6, h: 14, d: 6, color: "#166534" },
      { x: -34, y: 0, z: -10, w: 6, h: 14, d: 6, color: "#166534" },
      { x: -18, y: 0, z: -24, w: 48, h: 8, d: 12, color: "#dbe3ef" },
      { x: -14, y: 8, z: -22, w: 40, h: 10, d: 3, color: "#94a3b8" },
      { x: -18, y: 0, z: -4, w: 48, h: 8, d: 12, color: "#dbe3ef" },
      { x: -14, y: 8, z: -2, w: 40, h: 10, d: 3, color: "#94a3b8" },
      { x: 36, y: 0, z: -40, w: 28, h: 36, d: 6, color: "#1e293b" },
      { x: 40, y: 8, z: -38, w: 20, h: 4, d: 2, color: "#22c55e" },
      { x: 40, y: 16, z: -38, w: 20, h: 4, d: 2, color: "#FCD116" },
      { x: 40, y: 24, z: -38, w: 20, h: 4, d: 2, color: "#f8fafc" },
      { x: 58, y: 0, z: 8, w: 42, h: 14, d: 28, color: "#121212" },
      { x: 62, y: 14, z: 12, w: 34, h: 3, d: 20, color: "#c9a227" },
      { x: 70, y: 0, z: 40, w: 14, h: 18, d: 10, color: "#1c1917" },
      { x: -40, y: 0, z: 48, w: 70, h: 28, d: 4, color: "#7ec8ea" },
      { x: -36, y: 6, z: 50, w: 18, h: 14, d: 2, color: "#bfdbfe" },
      { x: -8, y: 6, z: 50, w: 18, h: 14, d: 2, color: "#bfdbfe" },
      { x: 20, y: 6, z: 50, w: 18, h: 14, d: 2, color: "#bfdbfe" },
      { x: -8, y: 0.5, z: 22, w: 16, h: 1, d: 16, color: "#FCD116" },
      { x: -4, y: 1, z: 26, w: 8, h: 1, d: 8, color: "#006B3F" },
      { x: -100, y: 0, z: 36, w: 8, h: 6, d: 8, color: "#8a5a32" },
      { x: 88, y: 0, z: 52, w: 8, h: 6, d: 8, color: "#8a5a32" },
    ];
  }
  // tables / default hang spots — chop-bar / restaurant lived-in
  return [
    { x: -28, y: 0, z: -30, w: 80, h: 16, d: 16, color: "#b87824" },
    { x: -20, y: 16, z: -26, w: 64, h: 3, d: 10, color: "#e8d4b0" },
    { x: -16, y: 19, z: -24, w: 8, h: 6, d: 8, color: "#5b4636" },
    { x: 0, y: 19, z: -24, w: 10, h: 5, d: 8, color: "#8a5a32" },
    { x: 16, y: 19, z: -22, w: 6, h: 4, d: 6, color: "#f4efe6" },
    ...benchTable(-48, 24),
    ...benchTable(8, 40),
    ...benchTable(-20, 56, "#b86a1c"),
    ...cafeSet(56, 18, "#c43a3a"),
    ...cafeSet(-72, 8, "#e8e8e8"),
    ...cafeSet(30, 48, "#006B3F"),
    ...chair(-70, 40, "#d64545"),
    ...chair(-88, 48, "#e8e8e8"),
    ...chair(78, 36, "#243044"),
    ...chair(92, 44, "#CE1126"),
    ...chair(-4, 68, "#f5c542"),
    { x: 78, y: 0, z: -20, w: 12, h: 28, d: 8, color: "#1e293b" },
    { x: 82, y: 10, z: -18, w: 6, h: 10, d: 2, color: "#22c55e" },
    { x: -96, y: 0, z: 36, w: 14, h: 12, d: 12, color: "#b01020" },
    { x: -90, y: 12, z: 40, w: 6, h: 8, d: 6, color: "#d4b020" },
    { x: 40, y: 0, z: 50, w: 10, h: 1.5, d: 8, color: "#1c1917" },
  ];
}

function benchTable(x: number, z: number, wood = "#c9842a"): Block[] {
  return [
    { x, y: 0, z: z - 8, w: 34, h: 6, d: 7, color: "#e7d3b0" },
    { x, y: 0, z: z + 16, w: 34, h: 6, d: 7, color: "#e7d3b0" },
    { x: x - 2, y: 0, z: z + 1, w: 38, h: 12, d: 12, color: wood },
  ];
}

function chair(x: number, z: number, color: string): Block[] {
  return [
    { x, y: 0, z, w: 9, h: 7, d: 9, color },
    { x, y: 7, z, w: 9, h: 11, d: 2.6, color },
  ];
}

function cafeSet(x: number, z: number, color: string): Block[] {
  return [
    ...chair(x - 14, z + 6, color),
    ...chair(x + 16, z - 2, color),
    { x, y: 0, z, w: 3, h: 11, d: 3, color: "#8d5a32" },
    { x: x + 14, y: 0, z, w: 3, h: 11, d: 3, color: "#8d5a32" },
    { x, y: 0, z: z + 12, w: 3, h: 11, d: 3, color: "#8d5a32" },
    { x: x + 14, y: 0, z: z + 12, w: 3, h: 11, d: 3, color: "#8d5a32" },
    { x: x - 2, y: 11, z: z - 1, w: 20, h: 2.6, d: 16, color: "#f3e6cf" },
  ];
}

function bannerLine(kind: Kind) {
  if (kind === "hotel") return "WELCOME";
  if (kind === "club") return "HIGHLIFE LIVE";
  if (kind === "gym") return "THE FLOOR";
  if (kind === "hall") return "THE COUNTER";
  if (kind === "airport") return "DEPARTURES";
  return "TABLES OPEN";
}

function AirportDress({ night }: { night: boolean }) {
  const center = pt(0, 2, 30);
  return (
    <g>
      <ellipse cx={center[0]} cy={center[1]} rx="34" ry="16" fill="#FCD116" opacity="0.95" />
      <ellipse cx={center[0]} cy={center[1]} rx="18" ry="8" fill="#006B3F" />
      <ellipse cx={center[0]} cy={center[1]} rx="7" ry="3.2" fill="#CE1126" />
      <Palm x={-100} z={40} />
      <Palm x={-86} z={52} />
      <Palm x={92} z={48} />
      <Palm x={104} z={28} />
      {night ? (
        <g>
          <circle cx={pt(-60, 34, -20)[0]} cy={pt(-60, 34, -20)[1]} r="3.5" fill="#fff4c2" opacity="0.85" />
          <circle cx={pt(48, 40, -34)[0]} cy={pt(48, 40, -34)[1]} r="3.5" fill="#22c55e" opacity="0.9" />
          <circle cx={pt(72, 22, 20)[0]} cy={pt(72, 22, 20)[1]} r="3" fill="#FCD116" opacity="0.85" />
        </g>
      ) : null}
    </g>
  );
}

function ShoreDress() {
  return (
    <g>
      <Umbrella x={-8} z={8} color="#e5484d" />
      <Umbrella x={48} z={22} color="#f5c542" />
      <Palm x={-90} z={8} />
      <Palm x={96} z={24} />
      <ellipse cx={pt(0, 1, -48)[0]} cy={pt(0, 1, -48)[1]} rx="160" ry="16" fill="#fff" opacity="0.16" />
      <ellipse cx={pt(-50, 1, -36)[0]} cy={pt(-50, 1, -36)[1]} rx="36" ry="5" fill="#fff" opacity="0.1" />
    </g>
  );
}

function GardenDress({ golf = false }: { golf?: boolean }) {
  return (
    <g>
      <Palm x={-96} z={4} />
      <Palm x={100} z={18} />
      {golf ? null : <Palm x={70} z={-16} />}
    </g>
  );
}

function Pool() {
  const water = [
    pt(24, 2, 4),
    pt(78, 2, 4),
    pt(78, 2, 40),
    pt(24, 2, 40),
  ];
  return (
    <g>
      <polygon points={water.map(([x, y]) => `${x},${y}`).join(" ")} fill="#7ec8ea" />
      <polygon points={[pt(30, 3, 10), pt(70, 3, 10), pt(70, 3, 34), pt(30, 3, 34)].map(([x, y]) => `${x},${y}`).join(" ")} fill="#c5eef8" opacity="0.85" />
    </g>
  );
}

function Umbrella({ x, z, color }: { x: number; z: number; color: string }) {
  const [px, py] = pt(x, 30, z);
  const [bx, by] = pt(x, 0, z);
  return (
    <g>
      <line x1={bx} y1={by} x2={px} y2={py} stroke="#f7f4ef" strokeWidth="3" />
      <ellipse cx={px - 8} cy={py + 2} rx="28" ry="11" fill={shade(color, 0.72)} />
      <ellipse cx={px} cy={py - 2} rx="28" ry="11" fill={color} />
    </g>
  );
}

function Palm({ x, z }: { x: number; z: number }) {
  const [tx, ty] = pt(x, 26, z);
  const [bx, by] = pt(x, 0, z);
  return (
    <g>
      <line x1={bx} y1={by} x2={tx} y2={ty} stroke="#8a5a32" strokeWidth="4" />
      <ellipse cx={tx - 16} cy={ty + 2} rx="16" ry="6" fill="#2f8f4e" transform={`rotate(-28 ${tx} ${ty})`} />
      <ellipse cx={tx + 16} cy={ty + 2} rx="16" ry="6" fill="#006B3F" transform={`rotate(26 ${tx} ${ty})`} />
      <ellipse cx={tx} cy={ty - 6} rx="12" ry="7" fill="#67a83e" />
    </g>
  );
}

const WALL_SKEW = (Math.atan2(0.92, 1.85) * 180) / Math.PI;

function FaceSign({
  axis,
  x,
  y,
  z,
  length,
  tall,
  text,
  fill,
  ink,
}: {
  axis: "x" | "z";
  x: number;
  y: number;
  z: number;
  length: number;
  tall: number;
  text: string;
  fill: string;
  ink: string;
}) {
  const label = text.length > 24 ? `${text.slice(0, 23)}…` : text;
  const start = pt(x, y, z);
  const top = pt(x, y + tall, z);
  const end = axis === "x" ? pt(x + length, y, z) : pt(x, y, z - length);
  const endTop = axis === "x" ? pt(x + length, y + tall, z) : pt(x, y + tall, z - length);
  const span = Math.hypot(end[0] - start[0], end[1] - start[1]);
  const size = Math.min(13, Math.max(8, (span - 16) / (label.length * 0.62)));
  const skew = axis === "x" ? WALL_SKEW : -WALL_SKEW;
  return (
    <g>
      <polygon points={`${start[0]},${start[1]} ${top[0]},${top[1]} ${endTop[0]},${endTop[1]} ${end[0]},${end[1]}`} fill={fill} />
      <g transform={`translate(${start[0] + 8},${start[1] - 4}) skewY(${skew})`}>
        <text fill={ink} fontSize={size} fontFamily="ui-sans-serif" fontWeight="700">
          {label}
        </text>
      </g>
    </g>
  );
}

function StandingBoard({ x, z, text }: { x: number; z: number; text: string }) {
  const length = Math.max(64, Math.min(120, text.length * 5.2));
  return (
    <g>
      <Blocks
        items={[
          { x, y: 0, z, w: 3, h: 34, d: 3, color: "#6b6256" },
          { x: x + length - 6, y: 0, z, w: 3, h: 34, d: 3, color: "#6b6256" },
        ]}
      />
      <FaceSign axis="x" x={x - 2} y={18} z={z + 3.2} length={length} tall={13} text={text} fill="#121212" ink="white" />
    </g>
  );
}

type Block = { x: number; y: number; z: number; w: number; h: number; d: number; color: string };

function pt(x: number, y: number, z: number): [number, number] {
  return [390 + (x - z) * 1.85, 268 + (x + z) * 0.92 - y * 1.85];
}

function Blocks({ items }: { items: Block[] }) {
  const sorted = [...items].sort((a, b) => a.x + a.z + a.y * 0.2 - (b.x + b.z + b.y * 0.2));
  return (
    <g>
      {sorted.map((block, index) => {
        const { x, y, z, w, h, d, color } = block;
        const wear = ((index * 17) % 9) / 100;
        const frontColor = shade(color, 0.62 - wear * 0.4);
        const sideColor = shade(color, 0.84 - wear * 0.25);
        const topColor = tint(color, 0.1 + wear);
        const p = (dx: number, dy: number, dz: number) => pt(x + dx, y + dy, z + dz);
        const front = [p(0, 0, d), p(0, h, d), p(w, h, d), p(w, 0, d)];
        const side = [p(w, 0, 0), p(w, h, 0), p(w, h, d), p(w, 0, d)];
        const top = [p(0, h, 0), p(w, h, 0), p(w, h, d), p(0, h, d)];
        const points = (pts: [number, number][]) => pts.map(([px, py]) => `${px.toFixed(1)},${py.toFixed(1)}`).join(" ");
        return (
          <g key={`${x}-${y}-${z}-${index}`}>
            <polygon points={points(front)} fill={frontColor} />
            <polygon points={points(side)} fill={sideColor} />
            <polygon points={points(top)} fill={topColor} />
          </g>
        );
      })}
    </g>
  );
}

function shade(hex: string, amount = 0.82) {
  const raw = hex.replace("#", "");
  if (raw.length !== 6) return hex;
  const channel = (start: number) => Math.max(0, Math.round(Number.parseInt(raw.slice(start, start + 2), 16) * amount));
  return `rgb(${channel(0)} ${channel(2)} ${channel(4)})`;
}

function tint(hex: string, amount = 0.18) {
  const raw = hex.replace("#", "");
  if (raw.length !== 6) return hex;
  const channel = (start: number) => Math.min(255, Math.round(Number.parseInt(raw.slice(start, start + 2), 16) + (255 - Number.parseInt(raw.slice(start, start + 2), 16)) * amount));
  return `rgb(${channel(0)} ${channel(2)} ${channel(4)})`;
}
