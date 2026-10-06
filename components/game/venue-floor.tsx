"use client";

import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { IsoHuman } from "@/components/game/iso-human";
import { CLUB_IDS } from "@/lib/game/accra-spots";
import { ActionDeck } from "@/components/game/action-deck";
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
  const [drift, setDrift] = useState<[number, number][]>([
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0],
  ]);
  const scroller = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const stopTimer = useRef<number | null>(null);
  const party = lively || BEACHES.has(spot.id) || CLUB_IDS.has(spot.id);
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
    return () => {
      if (stopTimer.current) window.clearTimeout(stopTimer.current);
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
    const box = event.currentTarget.getBoundingClientRect();
    walkTo(((event.clientX - box.left) / box.width) * 100, ((event.clientY - box.top) / box.height) * 100);
    if (window.innerWidth < 640) setPanel(false);
  }

  function speak(person: string, talk: TalkKind) {
    const verb = talkVerb(person, talk, spot);
    setLines((prev) => [...prev, { from: "you", text: youSay(talk, spot.name) }]);
    onAct(verb, person);
  }

  const zones = zonesFor(spot.id);
  const crowd = people.length;
  const flavor = spotFlavor(spot);

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
            ? "radial-gradient(ellipse at 50% 28%, #2a3348 0%, #0f1420 62%, #0a0d14 100%)"
            : "radial-gradient(ellipse at 50% 28%, #3a455c 0%, #1a2233 58%, #121820 100%)"
          : night
            ? "radial-gradient(circle at 50% 30%, #243044 0%, #12151c 70%)"
            : "radial-gradient(circle at 50% 30%, #d7e7c4 0%, #b7c99a 68%)",
      }}
    >
      <div ref={scroller} className="venue-scroll absolute inset-x-0 top-[4.25rem] bottom-36 z-0 isolate overflow-x-auto overflow-y-hidden overscroll-x-contain">
        <div ref={stage} onClick={tapFloor} className="relative mx-auto h-full w-[max(100%,44rem)] max-w-3xl cursor-pointer">
          <VenueScene spot={spot} night={night} kind={kind} party={party} />
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
          {party
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
            pose={stride.moving ? "walk" : "idle"}
            face={stride.face}
            skin={life.look.skin}
            shirt={life.look.cloth}
            hair={life.look.hair}
            pants={life.look.body === "woman" ? "#1c1917" : life.look.accent}
          />
        </div>
      </div>
      <p className="pointer-events-none absolute bottom-[max(8.5rem,calc(env(safe-area-inset-bottom)+8rem))] left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/45 px-3 py-1 text-[11px] font-semibold text-white sm:hidden">Tap to walk · swipe to look around</p>
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

          {zones.length ? (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {zones.map((zone) => (
                <button
                  key={zone.id}
                  type="button"
                  onClick={() => walkTo(zone.left, zone.top)}
                  className="flex shrink-0 items-center gap-1.5 rounded-2xl bg-[#f4f7fb] px-3 py-2 text-left text-xs font-semibold text-[#243044]"
                >
                  <span className="text-base leading-none">{zone.emoji}</span>
                  <span>{zone.label}</span>
                </button>
              ))}
            </div>
          ) : null}

          {party ? (
            <p className="mt-3 rounded-full bg-[#121212] px-3 py-1.5 text-center text-xs font-semibold text-[#FCD116]">
              {lively && !(BEACHES.has(spot.id) || CLUB_IDS.has(spot.id)) ? "Packed right now. Accra showed up." : "Party on. Highlife, and the floor is already full."}
            </p>
          ) : null}
          {onTrade && (isSupply(spot.id) || bagCount(life) > 0) ? (
            <button type="button" onClick={onTrade} className="mt-2 flex w-full items-center justify-between rounded-2xl bg-[#fff4c2] px-3 py-2.5 text-left text-sm font-semibold">
              <span>🧺 {isSupply(spot.id) ? "Buy goods to trade" : `Sell from your bag (${bagCount(life)})`}</span>
              <span className="text-[#006B3F]">Open</span>
            </button>
          ) : null}
          {children}
          <ActionDeck verbs={[...extra, ...spot.actions]} here focus={focus} onPay={(verb, offer) => onAct(payVerb(verb, offer))} />
          <button type="button" onClick={onHome} className="mt-2 w-full rounded-full bg-[#121212] px-3 py-2.5 text-sm font-semibold text-white">
            Head home · {cedis(homeFare)}
          </button>
        </div>
      )}
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
  pose?: "idle" | "walk" | "act";
  face?: 1 | -1;
  dance?: boolean;
  glide?: boolean | "live";
  online?: boolean;
  onClick?: () => void;
}) {
  const body = (
    <>
      <span className="relative mb-1 flex flex-col items-center">
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
        className="pointer-events-none absolute flex -translate-x-1/2 -translate-y-full flex-col items-center ease-linear"
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
  const club = CLUB_IDS.has(spot.id);
  const air = spot.id === "kotoka";
  return [
    {
      role: air ? "Check-in" : shore ? "Beach usher" : club ? "Door" : "Manager",
      line: air
        ? "Accra to Kumasi boards at gate B. Boarding pass ready?"
        : shore
          ? "The chairs are this way. The grill is already hot."
          : club
            ? "List is at the door. The night is inside."
            : `I run ${spot.name}. Tell me what you came for.`,
      style: air ? { left: "26%", top: "46%" } : { left: "18%", top: "42%" },
      skin: "#8d5a3b",
      shirt: air ? "#1d4ed8" : "#006B3F",
      hair: "Bun",
    },
    {
      role: air ? "Security" : shore || club ? "Floor" : "Cashier",
      line: air
        ? "Laptops out. Liquids in the tray. The queue moves if you listen."
        : shore
          ? "Feet in the water is free. Kelewele is not."
          : club
            ? "The floor is open. Drinks are at the bar."
            : "I take the money. The price is on the menu.",
      style: air ? { left: "68%", top: "40%" } : { left: "72%", top: "36%" },
      skin: "#c68a62",
      shirt: air ? "#FCD116" : "#FCD116",
      hair: "Afro",
    },
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
  if (CLUB_IDS.has(spotId) || spotId === "plus233" || spotId === "republic" || spotId === "still" || spotId === "monsoon") {
    return [
      { id: "bar", label: "The bar", emoji: "🍹", left: 24, top: 46 },
      { id: "floor", label: "Dance floor", emoji: "🪩", left: 52, top: 48 },
      { id: "booth", label: "VIP booth", emoji: "👑", left: 74, top: 54 },
      { id: "door", label: "Entrance", emoji: "🚪", left: 40, top: 68 },
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
  if (spotId === "buka" || spotId === "viewing") {
    return [
      { id: "counter", label: "Counter", emoji: "🍲", left: 48, top: 40 },
      { id: "tables", label: "Tables", emoji: "🪑", left: 36, top: 58 },
      { id: "tv", label: "Screen", emoji: "📺", left: 70, top: 46 },
      { id: "street", label: "Street edge", emoji: "🛣️", left: 22, top: 68 },
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
    { id: "mid", label: "Hang here", emoji: "✨", left: 50, top: 50 },
    { id: "left", label: "Left side", emoji: "👈", left: 28, top: 52 },
    { id: "right", label: "Right side", emoji: "👉", left: 72, top: 52 },
    { id: "back", label: "Back corner", emoji: "📷", left: 50, top: 36 },
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
  if (CLUB_IDS.has(spot.id)) return "club";
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
    spot.id === "golf" || kind === "garden" || kind === "club" || kind === "gym"
      ? "#3f5a2a"
      : kind === "airport"
        ? "#b7c98a"
        : kind === "shore"
          ? "#c4a574"
          : night
            ? "#2f3540"
            : "#d9d2c4";
  const wall = night || kind === "airport" || kind === "club" ? "#2a3140" : "#f7f4ef";
  const wallSide = night || kind === "airport" || kind === "club" ? "#1c2230" : "#e4e0d8";
  const items = furniture(kind, night, spot.id);
  const title = spot.name.toUpperCase();
  const lights = lightPools(kind, spot.id);
  return (
    <svg viewBox="0 0 760 480" className="h-full w-full" preserveAspectRatio="xMidYMid slice">
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
      <SpotLights pools={lights} />
      {party ? (
        <g>
          <circle cx="180" cy="90" r="10" fill="#CE1126" opacity="0.85" />
          <circle cx="560" cy="70" r="12" fill="#FCD116" opacity="0.9" />
          <circle cx="400" cy="120" r="8" fill="#006B3F" />
        </g>
      ) : null}
      {kind === "shore" ? <ShoreDress /> : null}
      {kind === "garden" || spot.id === "golf" ? <GardenDress golf={spot.id === "golf"} /> : null}
      {kind === "hotel" ? <Pool /> : null}
      {kind === "airport" ? <AirportDress night={night} /> : null}
      {kind === "club" || spot.id === "golf" ? <ClubGlow /> : null}
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
        <StandingBoard x={-70} z={-36} text="CLUBHOUSE" />
      ) : (
        <StandingBoard x={-72} z={6} text={title} />
      )}
    </svg>
  );
}

function lightPools(kind: Kind, spotId: string): { x: number; z: number; r: number }[] {
  if (spotId === "golf") return [{ x: -60, z: 20, r: 54 }, { x: 20, z: -10, r: 48 }, { x: 70, z: 30, r: 50 }, { x: 10, z: 40, r: 40 }];
  if (kind === "club") return [{ x: -50, z: 20, r: 50 }, { x: 10, z: -10, r: 56 }, { x: 60, z: 30, r: 46 }];
  if (kind === "airport") return [{ x: -60, z: -10, r: 48 }, { x: 10, z: 20, r: 44 }, { x: 70, z: 20, r: 42 }];
  if (kind === "shore") return [{ x: -20, z: 10, r: 52 }, { x: 40, z: 30, r: 48 }, { x: -70, z: 40, r: 40 }];
  if (kind === "hotel") return [{ x: -50, z: 20, r: 46 }, { x: 40, z: 20, r: 52 }, { x: 10, z: -20, r: 40 }];
  if (kind === "gym") return [{ x: -20, z: 10, r: 50 }, { x: 40, z: 10, r: 46 }];
  return [{ x: -40, z: 10, r: 48 }, { x: 30, z: 20, r: 50 }, { x: 70, z: 0, r: 40 }];
}

function SpotLights({ pools }: { pools: { x: number; z: number; r: number }[] }) {
  return (
    <g pointerEvents="none">
      {pools.map((pool, index) => {
        const [cx, cy] = pt(pool.x, 1.5, pool.z);
        return <ellipse key={index} cx={cx} cy={cy} rx={pool.r} ry={pool.r * 0.42} fill="#fff6d8" opacity="0.16" />;
      })}
    </g>
  );
}

function ClubGlow() {
  const neon = pt(-62, 28, 18);
  return (
    <g>
      <ellipse cx={neon[0]} cy={neon[1]} rx="28" ry="8" fill="#FCD116" opacity="0.35" />
      <text x={neon[0]} y={neon[1] + 4} textAnchor="middle" fill="#FCD116" fontSize="11" fontWeight="800" letterSpacing="1.5">
        CLUBHOUSE
      </text>
    </g>
  );
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
      // DJ / stage
      { x: -20, y: 0, z: -32, w: 64, h: 12, d: 34, color: "#141018" },
      { x: 4, y: 12, z: -24, w: 10, h: 24, d: 10, color: "#1c1917" },
      // Bar
      { x: -92, y: 0, z: 16, w: 42, h: 16, d: 18, color: night ? "#1a1410" : "#3a2a1c" },
      { x: -88, y: 16, z: 20, w: 34, h: 3, d: 12, color: "#c9a227" },
      { x: -84, y: 19, z: 18, w: 5, h: 10, d: 5, color: "#22d3ee" },
      { x: -76, y: 19, z: 20, w: 5, h: 12, d: 5, color: "#FCD116" },
      { x: -68, y: 19, z: 18, w: 5, h: 9, d: 5, color: "#ec4899" },
      // Speakers / booth
      { x: 62, y: 0, z: 0, w: 16, h: 26, d: 14, color: "#1c1917" },
      { x: 70, y: 0, z: 28, w: 28, h: 10, d: 20, color: "#121212" },
      { x: 74, y: 10, z: 32, w: 20, h: 3, d: 12, color: "#c9a227" },
      // Dance pads
      { x: -90, y: 0, z: 48, w: 22, h: 2, d: 22, color: "#ec4899" },
      { x: -50, y: 0, z: 52, w: 22, h: 2, d: 22, color: "#FCD116" },
      { x: -10, y: 0, z: 48, w: 22, h: 2, d: 22, color: "#006B3F" },
      { x: 30, y: 0, z: 52, w: 22, h: 2, d: 22, color: "#3b82f6" },
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
  // tables / default hang spots — waakye counter energy
  return [
    { x: -28, y: 0, z: -30, w: 80, h: 16, d: 16, color: "#c9842a" },
    { x: -20, y: 16, z: -26, w: 64, h: 3, d: 10, color: "#f3e6cf" },
    ...benchTable(-48, 24),
    ...benchTable(8, 40),
    ...cafeSet(56, 18, "#d64545"),
    { x: 78, y: 0, z: -20, w: 12, h: 28, d: 8, color: "#1e293b" },
    { x: 82, y: 10, z: -18, w: 6, h: 10, d: 2, color: "#22c55e" },
    { x: -96, y: 0, z: 36, w: 14, h: 12, d: 12, color: "#CE1126" },
    { x: -90, y: 12, z: 40, w: 6, h: 8, d: 6, color: "#FCD116" },
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
        const p = (dx: number, dy: number, dz: number) => pt(x + dx, y + dy, z + dz);
        const front = [p(0, 0, d), p(0, h, d), p(w, h, d), p(w, 0, d)];
        const side = [p(w, 0, 0), p(w, h, 0), p(w, h, d), p(w, 0, d)];
        const top = [p(0, h, 0), p(w, h, 0), p(w, h, d), p(0, h, d)];
        const points = (pts: [number, number][]) => pts.map(([px, py]) => `${px.toFixed(1)},${py.toFixed(1)}`).join(" ");
        return (
          <g key={`${x}-${y}-${z}-${index}`}>
            <polygon points={points(front)} fill={shade(color, 0.62)} />
            <polygon points={points(side)} fill={shade(color, 0.84)} />
            <polygon points={points(top)} fill={tint(color, 0.14)} />
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
