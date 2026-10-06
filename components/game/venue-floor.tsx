"use client";

import { useState } from "react";
import { IsoHuman } from "@/components/game/iso-human";
import { CLUB_IDS } from "@/lib/game/accra-spots";
import { accraHour, cedis, spotById, type Life, type Spot, type Verb } from "@/lib/game/world";

const SKINS = ["#c68a62", "#a86f4c", "#8d5a3b", "#7a4a2c", "#653c24", "#51301d"];
const SHIRTS = ["#CE1126", "#f5c542", "#ec4899", "#006B3F", "#f4efe6", "#e5484d"];
const PANTS = ["#1c1917", "#243056", "#6b3a4a", "#1f4d3a"];
const HAIR = ["Afro", "Bob", "Bun", "Cut"];
const HOTELS = new Set(["hotel", "kempinski", "movenpick"]);
const BEACHES = new Set(["beach", "bojo", "kokrobite"]);
const GARDENS = new Set(["aburi", "botanical", "golf", "sakumono"]);

type Kind = "hotel" | "club" | "shore" | "garden" | "gym" | "hall" | "tables";
type TalkKind = "hello" | "gist" | "joke" | "shade" | "place";

export function VenueFloor({
  life,
  people,
  onHome,
  onAct,
  onOpenChat,
  onPay,
}: {
  life: Life;
  people: { username: string; name: string }[];
  onHome: () => void;
  onAct: (verb: Verb, person?: string) => void;
  onOpenChat: (person: string) => void;
  onPay: (person: string, amount: number) => string | null;
}) {
  const spot = spotById(life.where);
  const night = accraHour() >= 19 || accraHour() < 5;
  const kind = sceneKind(spot);
  const [who, setWho] = useState<string | null>(null);
  const [lines, setLines] = useState<{ from: "you" | "them"; text: string }[]>([]);
  const stands = [
    { left: "24%", top: "62%" },
    { left: "50%", top: "46%" },
    { left: "72%", top: "60%" },
    { left: "18%", top: "48%" },
    { left: "62%", top: "70%" },
    { left: "40%", top: "38%" },
  ];
  const open = people.find((person) => person.username === who) ?? null;

  function speak(person: string, talk: TalkKind) {
    const verb = talkVerb(person, talk, spot);
    setLines((prev) => [...prev, { from: "you", text: youSay(talk, spot.name) }]);
    onAct(verb, person);
  }

  return (
    <div className="relative h-full overflow-hidden" style={{ background: night ? "radial-gradient(circle at 50% 30%, #243044 0%, #12151c 70%)" : "radial-gradient(circle at 50% 30%, #d7e7c4 0%, #b7c99a 68%)" }}>
      <div className="absolute inset-x-1 top-[4.25rem] bottom-36">
        <div className="relative mx-auto h-full max-w-3xl">
          <VenueScene spot={spot} night={night} kind={kind} />
          {people.slice(0, stands.length).map((person, index) => (
            <PersonTag
              key={person.username}
              name={person.name}
              tone="blue"
              style={stands[index]}
              skin={SKINS[index % SKINS.length]}
              shirt={SHIRTS[(index + 1) % SHIRTS.length]}
              hair={HAIR[index % HAIR.length]}
              pants={PANTS[index % PANTS.length]}
              onClick={() => {
                setWho(person.username);
                setLines([]);
              }}
            />
          ))}
          <PersonTag name="You" tone="pink" style={{ left: "36%", top: "78%" }} skin={life.look.skin} shirt={life.look.cloth} hair={life.look.hair} pants={life.look.body === "woman" ? "#1c1917" : life.look.accent} />
        </div>
      </div>
      {open ? (
        <TalkSheet
          person={`${open.name} · @${open.username}`}
          place={spot.name}
          cash={life.cash}
          lines={lines}
          onClose={() => setWho(null)}
          onChat={() => onOpenChat(open.username)}
          onPick={(talk) => speak(open.name, talk)}
          onPay={(amount) => onPay(open.name, amount)}
        />
      ) : (
        <div className="absolute inset-x-3 bottom-[5.5rem] z-30 rounded-3xl bg-white p-3 shadow-xl">
          <p className="font-semibold">
            {spot.emoji} {spot.name}
          </p>
          <p className="text-sm text-[#5c6b82]">{spot.blurb}</p>
          <div className="mt-2 flex gap-2 overflow-auto">
            {spot.actions.map((verb) => (
              <button key={verb.id} type="button" onClick={() => onAct(verb)} className="shrink-0 rounded-full bg-[#f4f7fb] px-3 py-1.5 text-sm font-semibold">
                {verb.label}
              </button>
            ))}
            <button type="button" onClick={onHome} className="shrink-0 rounded-full bg-[#121212] px-3 py-1.5 text-sm font-semibold text-white">
              Head home · ₵5
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function PersonTag({
  name,
  tone,
  style,
  skin,
  shirt,
  hair = "Bob",
  pants = "#1c1917",
  onClick,
}: {
  name: string;
  tone: "blue" | "pink";
  style: { left: string; top: string };
  skin: string;
  shirt: string;
  hair?: string;
  pants?: string;
  onClick?: () => void;
}) {
  const body = (
    <>
      <span className={`mb-1 rounded-full px-2 py-0.5 text-[11px] font-semibold text-white ${tone === "pink" ? "bg-[#ec4899]" : "bg-[#CE1126]"}`}>{name}</span>
      <IsoHuman skin={skin} shirt={shirt} pants={pants} hair={hair} className="h-20 w-fit" />
    </>
  );
  if (!onClick) {
    return (
      <div className="pointer-events-none absolute z-10 flex -translate-x-1/2 -translate-y-full flex-col items-center" style={style}>
        {body}
      </div>
    );
  }
  return (
    <button type="button" aria-label={`Talk to ${name}`} onClick={onClick} className="absolute z-10 flex -translate-x-1/2 -translate-y-full flex-col items-center" style={style}>
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
  onPay: (amount: number) => string | null;
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
            const error = onPay(value);
            setReceipt(error ?? `You sent ${person} ${cedis(value)}.`);
            if (!error) setPaying(false);
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

function sceneKind(spot: Spot): Kind {
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

function VenueScene({ spot, night, kind }: { spot: Spot; night: boolean; kind: Kind }) {
  const indoor = kind === "hotel" || kind === "club" || kind === "tables" || kind === "hall" || kind === "gym";
  const floor = kind === "shore" ? "#f6e7c8" : kind === "garden" ? "#cfe6a8" : kind === "club" ? (night ? "#1a1624" : "#2a2438") : night ? "#3a342c" : "#f3efe6";
  const wall = night ? "#3d4658" : "#f7f4ef";
  const wallSide = night ? "#2c3444" : "#e4e0d8";
  const items = furniture(kind, night);
  const title = spot.name.toUpperCase();
  return (
    <svg viewBox="0 0 760 480" className="h-full w-full" preserveAspectRatio="xMidYMid meet">
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
      {kind === "shore" ? <ShoreDress /> : null}
      {kind === "garden" ? <GardenDress /> : null}
      {kind === "hotel" ? <Pool /> : null}
      {indoor ? (
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
  return [...benchTable(-36, 12), ...benchTable(22, 40), { x: -20, y: 0, z: -28, w: 70, h: 16, d: 14, color: "#c9842a" }, ...chair(48, 8, "#d64545")];
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
  return "TABLES OPEN";
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
