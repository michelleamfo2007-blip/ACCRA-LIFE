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
}) {
  const spot = spotById(life.where);
  const night = accraHour() >= 19 || accraHour() < 5;
  const kind = sceneKind(spot);
  const [who, setWho] = useState<string | null>(null);
  const [lines, setLines] = useState<{ from: "you" | "them"; text: string }[]>([]);
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
  const party = BEACHES.has(spot.id) || CLUB_IDS.has(spot.id);
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

  return (
    <div className="relative h-full overflow-hidden" style={{ background: night ? "radial-gradient(circle at 50% 30%, #243044 0%, #12151c 70%)" : "radial-gradient(circle at 50% 30%, #d7e7c4 0%, #b7c99a 68%)" }}>
      <div ref={scroller} className="venue-scroll absolute inset-x-0 top-[4.25rem] bottom-36 overflow-x-auto overflow-y-hidden overscroll-x-contain">
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
        <div className="absolute inset-x-3 bottom-[max(5.5rem,env(safe-area-inset-bottom))] z-30 rounded-3xl bg-white p-4 shadow-xl">
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
          className="absolute inset-x-2 bottom-[max(4.75rem,env(safe-area-inset-bottom))] z-30 flex items-center justify-between rounded-full bg-white px-4 py-3 text-left text-sm font-semibold shadow-xl sm:inset-x-3"
        >
          <span className="truncate">
            {spot.emoji} {spot.name}
          </span>
          <span className="shrink-0 text-[#006B3F]">What to do ▲</span>
        </button>
      ) : (
        <div className="absolute inset-x-2 bottom-[max(4.75rem,env(safe-area-inset-bottom))] z-30 max-h-[min(40vh,22rem)] overflow-auto rounded-3xl bg-white p-3 shadow-xl sm:inset-x-3">
          <div className="flex items-start justify-between gap-2">
            <p className="font-semibold">
              {spot.emoji} {spot.name}
            </p>
            <button type="button" onClick={() => setPanel(false)} className="shrink-0 rounded-full bg-[#f4f7fb] px-3 py-1 text-xs font-semibold text-[#5c6b82]" aria-label="Hide panel">
              Hide ▼
            </button>
          </div>
          <p className="text-sm text-[#5c6b82]">{spot.blurb}</p>
          {party ? <p className="mt-2 rounded-full bg-[#121212] px-3 py-1 text-xs font-semibold text-[#FCD116]">Party on. Highlife, and the floor is already full.</p> : null}
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
  return <PersonTag {...look} tone="blue" style={style} pose={walking ? "walk" : "idle"} face={face} glide={live ? "live" : true} onClick={onClick} />;
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
  onClick?: () => void;
}) {
  const body = (
    <>
      <span className={`mb-1 rounded-full px-2 py-0.5 text-[11px] font-semibold text-white ${tone === "pink" ? "bg-[#ec4899]" : "bg-[#CE1126]"}`}>{name}</span>
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
    <div className="absolute inset-x-0 bottom-0 z-40 max-h-[62vh] overflow-auto rounded-t-[28px] bg-white p-4 shadow-[0_-16px_50px_rgba(22,32,60,.22)]">
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
      style: { left: "18%", top: "42%" },
      skin: "#8d5a3b",
      shirt: "#006B3F",
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
      style: { left: "72%", top: "36%" },
      skin: "#c68a62",
      shirt: "#FCD116",
      hair: "Afro",
    },
  ];
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
  const indoor = kind === "hotel" || kind === "club" || kind === "tables" || kind === "hall" || kind === "gym";
  const floor = kind === "airport" ? "#b9d48a" : kind === "shore" ? "#f6e7c8" : kind === "garden" ? "#cfe6a8" : kind === "club" ? (night ? "#1a1624" : "#2a2438") : night ? "#3a342c" : "#f3efe6";
  const wall = night ? "#3d4658" : "#f7f4ef";
  const wallSide = night ? "#2c3444" : "#e4e0d8";
  const items = furniture(kind, night);
  const title = spot.name.toUpperCase();
  return (
    <svg viewBox="0 0 760 480" className="h-full w-full" preserveAspectRatio="xMidYMid slice">
      <Blocks
        items={[
          { x: -118, y: -4, z: -62, w: 236, h: 4, d: 168, color: floor },
          ...(indoor
            ? [
                { x: -118, y: 0, z: -62, w: 10, h: 86, d: 168, color: wallSide },
                { x: -118, y: 0, z: -62, w: 236, h: 86, d: 10, color: wall },
              ]
            : []),
          ...items,
        ]}
      />
      {party ? (
        <g>
          <circle cx="180" cy="90" r="10" fill="#CE1126" opacity="0.85" />
          <circle cx="560" cy="70" r="12" fill="#FCD116" opacity="0.9" />
          <circle cx="400" cy="120" r="8" fill="#006B3F" />
        </g>
      ) : null}
      {kind === "shore" ? <ShoreDress /> : null}
      {kind === "garden" ? <GardenDress /> : null}
      {kind === "hotel" ? <Pool /> : null}
      {kind === "airport" ? <AirportDress night={night} /> : null}
      {kind === "airport" ? (
        <FaceSign axis="x" x={-54} y={22} z={-18} length={108} tall={12} text="KOTOKA INTERNATIONAL" fill="#006B3F" ink="white" />
      ) : indoor ? (
        <>
          <FaceSign axis="x" x={-6} y={52} z={-51} length={112} tall={15} text={title} fill="#121212" ink="white" />
          <FaceSign axis="z" x={-107} y={50} z={28} length={58} tall={14} text={bannerLine(kind)} fill={kind === "club" ? "#f5c542" : "#1f4d3a"} ink={kind === "club" ? "#121212" : "white"} />
        </>
      ) : (
        <StandingBoard x={-72} z={6} text={title} />
      )}
    </svg>
  );
}

function furniture(kind: Kind, night: boolean): Block[] {
  if (kind === "hotel") {
    return [
      { x: -78, y: 0, z: 20, w: 36, h: 14, d: 22, color: "#6d4aff" },
      { x: -76, y: 14, z: 22, w: 32, h: 4, d: 16, color: "#efe8ff" },
      { x: -70, y: 18, z: 18, w: 10, h: 3, d: 6, color: "#ffffff" },
      { x: -16, y: 0, z: -28, w: 42, h: 18, d: 16, color: "#f7f4ef" },
      { x: -4, y: 18, z: -24, w: 10, h: 6, d: 4, color: "#7eb6e8" },
      { x: 28, y: 0, z: 36, w: 16, h: 4, d: 28, color: "#f4efe6" },
      { x: 52, y: 0, z: 40, w: 16, h: 4, d: 28, color: "#d7e7f4" },
      { x: 78, y: 0, z: -20, w: 8, h: 12, d: 8, color: "#c47a4a" },
    ];
  }
  if (kind === "club") {
    return [
      { x: -16, y: 0, z: -28, w: 58, h: 10, d: 32, color: "#141018" },
      { x: 8, y: 10, z: -22, w: 8, h: 22, d: 8, color: "#1c1917" },
      { x: -70, y: 0, z: 24, w: 36, h: 16, d: 14, color: night ? "#2a2018" : "#6b4a30" },
      { x: 62, y: 0, z: 8, w: 14, h: 22, d: 12, color: "#1c1917" },
      { x: -90, y: 0, z: 48, w: 18, h: 8, d: 18, color: "#ec4899" },
      { x: 24, y: 0, z: 48, w: 18, h: 8, d: 18, color: "#f5c542" },
    ];
  }
  if (kind === "shore") {
    return [
      { x: -118, y: 0, z: -62, w: 236, h: 3, d: 34, color: "#8fd0ea" },
      ...benchTable(-20, 18),
      ...cafeSet(36, 28, "#d64545"),
      { x: 70, y: 0, z: 48, w: 22, h: 4, d: 10, color: "#f7fbfe" },
      { x: -78, y: 0, z: 40, w: 16, h: 8, d: 10, color: "#2a2420" },
    ];
  }
  if (kind === "garden") {
    return [...benchTable(-24, 16, "#8d5a32"), ...benchTable(28, 36, "#8d5a32"), { x: 72, y: 0, z: -8, w: 8, h: 14, d: 8, color: "#8a5a32" }, { x: -86, y: 0, z: 30, w: 8, h: 14, d: 8, color: "#6b4428" }];
  }
  if (kind === "gym") {
    return [
      { x: -36, y: 0, z: 18, w: 46, h: 3, d: 28, color: "#CE1126" },
      { x: 28, y: 0, z: 10, w: 34, h: 8, d: 10, color: "#1c1917" },
      { x: 36, y: 8, z: 12, w: 18, h: 3, d: 3, color: "#9aa4b2" },
      { x: 70, y: 0, z: -16, w: 12, h: 28, d: 10, color: "#3a4454" },
    ];
  }
  if (kind === "hall") {
    return [
      { x: -28, y: 0, z: -30, w: 96, h: 18, d: 16, color: "#f7f4ef" },
      { x: 8, y: 18, z: -26, w: 22, h: 2, d: 8, color: "#fff6df" },
      ...chair(-62, 28, "#CE1126"),
      ...chair(-40, 40, "#CE1126"),
      ...cafeSet(36, 36, "#8d5a32"),
    ];
  }
  if (kind === "airport") {
    return [
      // Runway strip at the back
      { x: -110, y: 0, z: -58, w: 220, h: 2, d: 28, color: "#4a5564" },
      // Taxiway
      { x: -100, y: 0, z: -28, w: 200, h: 1.5, d: 10, color: "#6b7280" },
      // Terminal
      { x: -56, y: 0, z: -18, w: 112, h: 22, d: 36, color: "#d9dde3" },
      { x: -52, y: 22, z: -14, w: 104, h: 4, d: 28, color: "#9aa3b2" },
      // Glass front
      { x: -48, y: 6, z: 16, w: 28, h: 12, d: 2, color: "#7ec8ea" },
      { x: -12, y: 6, z: 16, w: 28, h: 12, d: 2, color: "#7ec8ea" },
      { x: 24, y: 6, z: 16, w: 28, h: 12, d: 2, color: "#7ec8ea" },
      // Control tower
      { x: 72, y: 0, z: -8, w: 14, h: 48, d: 14, color: "#f4f7fb" },
      { x: 68, y: 48, z: -12, w: 22, h: 10, d: 22, color: "#006B3F" },
      { x: 74, y: 58, z: -6, w: 10, h: 6, d: 10, color: "#121212" },
      // Helipads pad
      { x: -108, y: 0, z: 8, w: 36, h: 1.5, d: 36, color: "#6b7280" },
      // Parking lots
      { x: -70, y: 0, z: 36, w: 48, h: 1, d: 32, color: "#8b93a1" },
      { x: 10, y: 0, z: 36, w: 48, h: 1, d: 32, color: "#8b93a1" },
      // Fountain plaza
      { x: -10, y: 0, z: 48, w: 16, h: 2, d: 16, color: "#94a3b8" },
      { x: -6, y: 2, z: 52, w: 8, h: 3, d: 8, color: "#38bdf8" },
      // Gate jets (white + green Ghana tails)
      ...plane(-78, -42, "#f8fafc", "#006B3F"),
      ...plane(-40, -42, "#f8fafc", "#006B3F"),
      ...plane(-2, -42, "#f8fafc", "#006B3F"),
      ...plane(36, -42, "#f8fafc", "#CE1126"),
      // Private apron
      ...smallJet(78, 8, "#1c1917"),
      ...smallJet(92, 22, "#1c1917"),
      ...smallJet(84, 38, "#243044"),
      // Parked cars
      { x: -62, y: 1, z: 42, w: 5, h: 3, d: 3, color: "#CE1126" },
      { x: -52, y: 1, z: 46, w: 5, h: 3, d: 3, color: "#FCD116" },
      { x: -42, y: 1, z: 40, w: 5, h: 3, d: 3, color: "#006B3F" },
      { x: -32, y: 1, z: 48, w: 5, h: 3, d: 3, color: "#1d4ed8" },
      { x: 18, y: 1, z: 42, w: 5, h: 3, d: 3, color: "#f97316" },
      { x: 28, y: 1, z: 48, w: 5, h: 3, d: 3, color: "#121212" },
      { x: 38, y: 1, z: 40, w: 5, h: 3, d: 3, color: "#ec4899" },
      // Billboards
      { x: -112, y: 0, z: 52, w: 3, h: 28, d: 3, color: "#6b6256" },
      { x: -118, y: 18, z: 48, w: 18, h: 14, d: 2, color: "#CE1126" },
      { x: 98, y: 0, z: 52, w: 3, h: 28, d: 3, color: "#6b6256" },
      { x: 92, y: 18, z: 48, w: 18, h: 14, d: 2, color: "#FCD116" },
    ];
  }
  return [...benchTable(-36, 12), ...benchTable(22, 40), { x: -20, y: 0, z: -28, w: 70, h: 16, d: 14, color: "#c9842a" }, ...chair(48, 8, "#d64545")];
}

function plane(x: number, z: number, body: string, tail: string): Block[] {
  return [
    { x, y: 4, z, w: 28, h: 6, d: 6, color: body },
    { x: x + 6, y: 5, z: z - 10, w: 14, h: 2, d: 26, color: body },
    { x: x + 22, y: 6, z: z - 1, w: 4, h: 10, d: 8, color: tail },
    { x: x + 2, y: 8, z: z + 1, w: 6, h: 4, d: 4, color: "#7ec8ea" },
  ];
}

function smallJet(x: number, z: number, color: string): Block[] {
  return [
    { x, y: 3, z, w: 14, h: 4, d: 4, color },
    { x: x + 2, y: 4, z: z - 5, w: 8, h: 1.5, d: 14, color },
    { x: x + 11, y: 5, z: z - 1, w: 3, h: 6, d: 5, color },
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
  const marks = [-90, -50, -10, 30, 70].map((x) => {
    const a = pt(x, 2.5, -48);
    const b = pt(x + 14, 2.5, -48);
    return [a, b] as const;
  });
  const h1 = pt(-90, 2, 26);
  const h2 = pt(-90, 2, 42);
  return (
    <g>
      {marks.map(([a, b], index) => (
        <line key={index} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke="white" strokeWidth="3" strokeLinecap="round" opacity={night ? 0.95 : 0.85} />
      ))}
      <text x={pt(-100, 3, -44)[0]} y={pt(-100, 3, -44)[1]} fill="white" fontSize="11" fontWeight="700" opacity="0.9">
        21
      </text>
      <text x={pt(88, 3, -44)[0]} y={pt(88, 3, -44)[1]} fill="white" fontSize="11" fontWeight="700" opacity="0.9">
        03
      </text>
      <circle cx={h1[0]} cy={h1[1]} r="10" fill="#121212" stroke="#FCD116" strokeWidth="2" />
      <text x={h1[0]} y={h1[1] + 4} textAnchor="middle" fill="#FCD116" fontSize="10" fontWeight="700">
        H
      </text>
      <circle cx={h2[0]} cy={h2[1]} r="10" fill="#121212" stroke="#FCD116" strokeWidth="2" />
      <text x={h2[0]} y={h2[1] + 4} textAnchor="middle" fill="#FCD116" fontSize="10" fontWeight="700">
        H
      </text>
      <Palm x={-100} z={58} />
      <Palm x={-78} z={62} />
      <Palm x={56} z={58} />
      <Palm x={86} z={62} />
      <Palm x={104} z={20} />
      {night ? (
        <g>
          <circle cx={pt(78, 62, -2)[0]} cy={pt(78, 62, -2)[1]} r="5" fill="#FCD116" opacity="0.85" />
          <circle cx={pt(-40, 24, -10)[0]} cy={pt(-40, 24, -10)[1]} r="3" fill="#fff4c2" opacity="0.7" />
          <circle cx={pt(10, 24, -10)[0]} cy={pt(10, 24, -10)[1]} r="3" fill="#fff4c2" opacity="0.7" />
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

function GardenDress() {
  return (
    <g>
      <Palm x={-96} z={4} />
      <Palm x={100} z={18} />
      <Palm x={70} z={-16} />
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
