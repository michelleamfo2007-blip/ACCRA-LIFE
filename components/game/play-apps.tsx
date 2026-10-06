"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import type { NetAction } from "@/components/game/social-apps";
import { GAME_LABEL, LUDO_HOME, LUDO_SAFE, LUDO_START, aiMove, applyMove, draughtsMoves, ludoMoves, ludoSquare, owareMoves, rollDie, startBoard, type Board, type GameKind, type Move, type Side } from "@/lib/game/boards";
import { CODE_LABEL, EVENT_INFO, type EventKind, type LifeEvent, type Match } from "@/lib/game/net";
import { SPOTS, cedis, cloneLife, dayIndex, realMinutes, spotById, type Life, type StepResult } from "@/lib/game/world";

type Apply = (result: StepResult) => void;

const KINDS: GameKind[] = ["oware", "draughts", "ludo"];
const BET_CAP = 5;

function Screen({ title, color, life, onBack, children, scroll = true }: { title: string; color: string; life: Life; onBack: () => void; children: ReactNode; scroll?: boolean }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[#f6f1ea] text-[#121212]">
      <div className="flex items-center gap-2 px-2 py-2 text-white" style={{ background: color }}>
        <button type="button" onClick={onBack} className="grid h-9 w-9 place-items-center rounded-full text-lg" aria-label="Back">
          ‹
        </button>
        <p className="font-semibold">{title}</p>
        <span className="ml-auto pr-2 text-sm font-semibold text-[#FCD116]">{cedis(life.cash)}</span>
      </div>
      <div className={`min-h-0 flex-1 space-y-3 px-4 py-4 ${scroll ? "overflow-auto" : "flex flex-col"}`}>{children}</div>
    </div>
  );
}

function Label({ children }: { children: ReactNode }) {
  return <p className="text-[11px] font-bold tracking-wide text-[#8b97ab]">{children}</p>;
}

function Btn({ children, onClick, disabled, kind = "dark" }: { children: ReactNode; onClick: () => void; disabled?: boolean; kind?: "dark" | "green" | "light" | "red" | "gold" }) {
  const look = { dark: "bg-[#121212] text-white", green: "bg-[#006B3F] text-white", light: "bg-[#f4f7fb] text-[#121212]", red: "bg-[#f4f7fb] text-[#CE1126]", gold: "bg-[#FCD116] text-[#121212]" }[kind];
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={`rounded-full px-3 py-2 text-xs font-bold disabled:opacity-40 ${look}`}>
      {children}
    </button>
  );
}

export function Offline({ title, color, life, onBack }: { title: string; color: string; life: Life; onBack: () => void }) {
  return (
    <Screen title={title} color={color} life={life} onBack={onBack}>
      <p className="rounded-2xl bg-white px-4 py-3 text-sm shadow-sm">This needs an online account. Sign up from the menu to play with people across Accra.</p>
    </Screen>
  );
}

export function usePoll<T>(url: string | null, every: number) {
  const [data, setData] = useState<T | null>(null);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!url) return;
    let stop = false;
    const load = () =>
      fetch(url)
        .then((response) => (response.ok ? response.json() : null))
        .then((payload: T | null) => {
          if (!stop && payload) setData(payload);
        })
        .catch(() => undefined);
    void load();
    const id = window.setInterval(load, every);
    return () => {
      stop = true;
      window.clearInterval(id);
    };
  }, [url, every, tick]);
  const refresh = useCallback(() => setTick((value) => value + 1), []);
  return [data, refresh] as const;
}

function subscribeTick(callback: () => void) {
  const id = window.setInterval(callback, 20000);
  return () => window.clearInterval(id);
}

export function useClock() {
  return useSyncExternalStore(subscribeTick, () => Math.floor(Date.now() / 20000) * 20000, () => 0);
}

export function when(iso: string, now: number) {
  const minutes = Math.round((Date.parse(iso) - now) / 60000);
  const abs = Math.abs(minutes);
  const span = abs >= 60 ? `${Math.round(abs / 60)}h` : `${Math.max(1, abs)}m`;
  return minutes >= 0 ? `in ${span}` : `${span} ago`;
}

type CrewView = {
  crew: {
    id: string;
    owner: string;
    name: string;
    tag: string;
    members: string[];
    bank: number;
    raised: number;
    goal: number;
    level: number;
    won: boolean;
    mine: boolean;
    messages: { who: "me" | "them"; from: string; text: string; time: string }[];
  } | null;
  asks: { owner: string; id: string; name: string }[];
};

export async function post(body: Record<string, unknown>) {
  const response = await fetch("/api/live/play", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = (await response.json().catch(() => null)) as ({ error?: string } & Record<string, unknown>) | null;
  if (!response.ok || data?.error) return { error: data?.error ?? "That did not go through.", data };
  return { error: null, data };
}

export function CrewApp({ me, life, cloud, onBack, onNet, onVisit }: { me: string; life: Life; cloud: boolean; onBack: () => void; onNet: NetAction; onVisit: (host: string) => void }) {
  const [view, refresh] = usePoll<CrewView>(cloud ? "/api/live/play?view=crew" : null, 5000);
  const [name, setName] = useState("");
  const [tag, setTag] = useState("");
  const [invite, setInvite] = useState("");
  const [amount, setAmount] = useState("50");
  const [text, setText] = useState("");
  const [notice, setNotice] = useState("");
  const [leaving, setLeaving] = useState(false);
  if (!cloud) return <Offline title="Crew" color="#121212" life={life} onBack={onBack} />;
  const crew = view?.crew ?? null;

  async function run(body: Record<string, unknown>, done?: string) {
    const { error } = await post(body);
    setNotice(error ?? done ?? "");
    refresh();
    return error;
  }

  return (
    <Screen title={crew ? `[${crew.tag}] ${crew.name}` : "Crew"} color="#121212" life={life} onBack={onBack}>
      {notice ? <p className="rounded-2xl bg-[#fff4c2] px-3 py-2 text-xs font-semibold">{notice}</p> : null}
      {!view ? <p className="text-sm text-[#5c6b82]">Loading…</p> : null}
      {view && !crew ? (
        <>
          {view.asks.length ? <Label>INVITES</Label> : null}
          {view.asks.map((ask) => (
            <div key={ask.id} className="flex items-center gap-2 rounded-2xl bg-white p-3 shadow-sm">
              <span className="min-w-0 flex-1 text-sm">
                <span className="font-semibold">{ask.name}</span> from @{ask.owner}
              </span>
              <Btn kind="green" onClick={() => void run({ action: "crew-join", owner: ask.owner, id: ask.id }, "Welcome to the crew.")}>
                Join
              </Btn>
              <Btn kind="light" onClick={() => void run({ action: "crew-decline", owner: ask.owner, id: ask.id })}>
                No
              </Btn>
            </div>
          ))}
          <div className="rounded-2xl bg-white p-3 shadow-sm">
            <p className="font-semibold">🛡️ Start a crew</p>
            <p className="mt-1 text-xs text-[#5c6b82]">Up to 12 people. Chip into a shared bank, hit the weekly goal together to level up, chat, and drop by each other&apos;s homes.</p>
            <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Crew name" maxLength={24} className="mt-2 h-10 w-full rounded-full bg-[#f4f7fb] px-4 text-sm outline-none" />
            <input value={tag} onChange={(event) => setTag(event.target.value.toUpperCase())} placeholder="Tag, e.g. OSU" maxLength={4} className="mt-2 h-10 w-full rounded-full bg-[#f4f7fb] px-4 text-sm uppercase outline-none" />
            <div className="mt-2">
              <Btn kind="dark" onClick={() => void run({ action: "crew-create", name, tag }, "Crew started. Invite your people.")}>
                Start crew
              </Btn>
            </div>
          </div>
        </>
      ) : null}
      {crew ? (
        <>
          <div className="rounded-2xl bg-white p-3 shadow-sm">
            <div className="flex items-baseline justify-between">
              <p className="font-display text-2xl">Level {crew.level}</p>
              <p className="text-sm font-semibold text-[#006B3F]">Bank {cedis(crew.bank)}</p>
            </div>
            <p className="mt-1 text-xs text-[#5c6b82]">{crew.won ? "🏆 This week's challenge is done." : `Weekly challenge: raise ${cedis(crew.goal)} together.`}</p>
            <div className="mt-2 h-2 rounded-full bg-[#e7edf5]">
              <div className="h-2 rounded-full bg-[#FCD116]" style={{ width: `${Math.min(100, (crew.raised / crew.goal) * 100)}%` }} />
            </div>
            <p className="mt-1 text-[11px] text-[#5c6b82]">
              {cedis(crew.raised)} of {cedis(crew.goal)} this week
            </p>
            <div className="mt-2 flex gap-2">
              <input value={amount} onChange={(event) => setAmount(event.target.value.replace(/[^0-9]/g, ""))} inputMode="numeric" className="h-9 w-24 rounded-full bg-[#f4f7fb] px-3 text-sm outline-none" />
              <Btn kind="gold" onClick={() => void onNet({ api: "play", action: "crew-chip", amount: Number(amount) }).then((error) => (setNotice(error ?? ""), refresh()))}>
                Chip in
              </Btn>
              {crew.mine ? (
                <Btn kind="light" disabled={crew.bank < crew.members.length} onClick={() => void run({ action: "crew-share" }, "Shared the bank out.")}>
                  Share bank
                </Btn>
              ) : null}
            </div>
          </div>
          <Label>MEMBERS · {crew.members.length}/12</Label>
          <div className="flex flex-wrap gap-2">
            {crew.members.map((member) => (
              <span key={member} className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-xs font-semibold shadow-sm">
                {member === crew.owner ? "👑 " : ""}@{member}
                {member !== me ? (
                  <button type="button" onClick={() => onVisit(member)} className="ml-1 rounded-full bg-[#f4f7fb] px-2 py-0.5 text-[10px]">
                    Visit
                  </button>
                ) : null}
              </span>
            ))}
          </div>
          {crew.mine ? (
            <div className="flex gap-2">
              <input value={invite} onChange={(event) => setInvite(event.target.value)} placeholder="@username" className="h-9 min-w-0 flex-1 rounded-full bg-white px-3 text-sm outline-none" />
              <Btn kind="dark" onClick={() => void run({ action: "crew-invite", to: invite }, `Invite sent to ${invite}.`).then((error) => (error ? null : setInvite("")))}>
                Invite
              </Btn>
            </div>
          ) : null}
          <Label>CREW CHAT</Label>
          <div className="space-y-1.5 rounded-2xl bg-[#e9e3d8] p-2">
            {crew.messages.length ? null : <p className="px-2 py-1 text-xs text-[#5c6b82]">Quiet in here. Say something.</p>}
            {crew.messages.map((mail, index) => (
              <p key={index} className={`max-w-[85%] rounded-2xl px-3 py-1.5 text-sm ${mail.from === "crew" ? "mx-auto bg-[#fff4c2] text-center text-xs" : mail.who === "me" ? "ml-auto bg-[#dcf8c6]" : "bg-white"}`}>
                {mail.who === "them" && mail.from !== "crew" ? <span className="block text-[10px] font-bold text-[#8a2f6a]">@{mail.from}</span> : null}
                {mail.text}
                <span className="ml-2 text-[9px] text-[#8b97ab]">{mail.time}</span>
              </p>
            ))}
          </div>
          <form
            className="flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              if (!text.trim()) return;
              void run({ action: "crew-send", text });
              setText("");
            }}
          >
            <input value={text} onChange={(event) => setText(event.target.value)} placeholder="Message the crew" className="h-10 min-w-0 flex-1 rounded-full bg-white px-4 text-sm outline-none" />
            <button type="submit" className="rounded-full bg-[#006B3F] px-4 text-sm font-semibold text-white">
              Send
            </button>
          </form>
          <div className="pt-2 text-center">
            {leaving ? (
              <span className="inline-flex gap-2">
                <Btn kind="red" onClick={() => void run({ action: "crew-leave" }, crew.mine ? "Crew closed. The bank was shared out." : "You left the crew.").then(() => setLeaving(false))}>
                  {crew.mine ? "Close the crew" : "Leave"}
                </Btn>
                <Btn kind="light" onClick={() => setLeaving(false)}>
                  Stay
                </Btn>
              </span>
            ) : (
              <button type="button" onClick={() => setLeaving(true)} className="text-xs font-semibold text-[#8b97ab]">
                {crew.mine ? "Close crew" : "Leave crew"}
              </button>
            )}
          </div>
        </>
      ) : null}
    </Screen>
  );
}

const HOURS = [0, 2, 6, 12, 24, 48];

export function EventsApp({ me, life, cloud, onBack, onNet, onGo }: { me: string; life: Life; cloud: boolean; onBack: () => void; onNet: NetAction; onGo: (spot: string) => void }) {
  const [data, refresh] = usePoll<{ events: LifeEvent[] }>(cloud ? "/api/live/play?view=events" : null, 30000);
  const [hosting, setHosting] = useState(false);
  const [kind, setKind] = useState<EventKind>("party");
  const [spot, setSpot] = useState("osu");
  const [hours, setHours] = useState(2);
  const [title, setTitle] = useState("");
  const [notice, setNotice] = useState("");
  const now = useClock();
  if (!cloud) return <Offline title="Events" color="#4a1d1d" life={life} onBack={onBack} />;
  const spots = SPOTS.filter((item) => !item.soon && item.id !== "home");
  const events = data?.events ?? [];
  const info = EVENT_INFO[kind];

  return (
    <Screen title="Events" color="#4a1d1d" life={life} onBack={onBack}>
      {notice ? <p className="rounded-2xl bg-[#fff4c2] px-3 py-2 text-xs font-semibold">{notice}</p> : null}
      <p className="text-xs text-[#5c6b82]">Funerals, weddings, outdoorings and parties hosted by players. Go to the spot while it is on, dress for the code, and gift the host.</p>
      {hosting ? (
        <div className="space-y-2 rounded-2xl bg-white p-3 shadow-sm">
          <p className="font-semibold">Host an event</p>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(EVENT_INFO) as EventKind[]).map((item) => (
              <button key={item} type="button" onClick={() => setKind(item)} className={`rounded-xl px-2 py-2 text-left text-xs font-semibold ${kind === item ? "bg-[#121212] text-white" : "bg-[#f4f7fb]"}`}>
                {EVENT_INFO[item].emoji} {EVENT_INFO[item].label} · {cedis(EVENT_INFO[item].cost)}
              </button>
            ))}
          </div>
          <p className="text-xs text-[#5c6b82]">Dress code: {CODE_LABEL[info.code]}. Runs four hours.</p>
          <select value={spot} onChange={(event) => setSpot(event.target.value)} className="h-10 w-full rounded-full bg-[#f4f7fb] px-3 text-sm outline-none">
            {spots.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          <div className="flex flex-wrap gap-1.5">
            {HOURS.map((item) => (
              <button key={item} type="button" onClick={() => setHours(item)} className={`rounded-full px-3 py-1 text-xs font-semibold ${hours === item ? "bg-[#CE1126] text-white" : "bg-[#f4f7fb]"}`}>
                {item === 0 ? "Now" : `In ${item}h`}
              </button>
            ))}
          </div>
          <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder={`${info.label} at ${spotById(spot).name}`} maxLength={40} className="h-10 w-full rounded-full bg-[#f4f7fb] px-4 text-sm outline-none" />
          <div className="flex gap-2">
            <Btn
              kind="dark"
              disabled={life.cash < info.cost}
              onClick={() =>
                void onNet({ api: "play", action: "event-host", kind, spot, hours, title }).then((error) => {
                  setNotice(error ?? "");
                  if (!error) {
                    setHosting(false);
                    setTitle("");
                    refresh();
                  }
                })
              }
            >
              Host · {cedis(info.cost)}
            </Btn>
            <Btn kind="light" onClick={() => setHosting(false)}>
              Cancel
            </Btn>
          </div>
        </div>
      ) : (
        <Btn kind="gold" onClick={() => setHosting(true)}>
          + Host an event
        </Btn>
      )}
      <Label>WHAT&apos;S ON</Label>
      {data && !events.length ? <p className="text-sm text-[#5c6b82]">Nothing planned yet. Be the first.</p> : null}
      {events.map((event) => {
        const meta = EVENT_INFO[event.kind];
        const live = Date.parse(event.startsAt) <= now;
        const mine = event.host === me;
        return (
          <div key={event.id} className={`rounded-2xl bg-white p-3 shadow-sm ${live ? "ring-2 ring-[#CE1126]/50" : ""}`}>
            <div className="flex items-start gap-3">
              <span className="text-2xl">{meta.emoji}</span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">{event.title}</span>
                <span className="block text-xs text-[#5c6b82]">
                  @{event.host} · {spotById(event.spot).name} · {live ? `on now, ends ${when(event.endsAt, now)}` : `starts ${when(event.startsAt, now)}`}
                </span>
                <span className="block text-xs text-[#5c6b82]">
                  Dress: {CODE_LABEL[event.code]} · {event.attendees.length} came · {cedis(event.gifts)} gifted
                </span>
              </span>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <Btn kind={life.where === event.spot ? "light" : "dark"} disabled={life.where === event.spot} onClick={() => onGo(event.spot)}>
                {life.where === event.spot ? "You are here" : "Go there"}
              </Btn>
              {!mine
                ? [20, 50, 100].map((value) => (
                    <Btn key={value} kind="gold" disabled={life.cash < value} onClick={() => void onNet({ api: "play", action: "event-gift", owner: event.host, id: event.id, amount: value }).then((error) => (setNotice(error ?? ""), refresh()))}>
                      Gift {cedis(value)}
                    </Btn>
                  ))
                : null}
            </div>
          </div>
        );
      })}
    </Screen>
  );
}

type Local = { board: Board; stake: number; done: boolean; note: string };

export function GamesApp({ me, life, cloud, onBack, onApply, onNet }: { me: string; life: Life; cloud: boolean; onBack: () => void; onApply: Apply; onNet: NetAction }) {
  const [local, setLocal] = useState<Local | null>(null);
  const [kind, setKind] = useState<GameKind>("oware");
  const [stake, setStake] = useState(0);
  const [openId, setOpenId] = useState<string | null>(null);
  const [friend, setFriend] = useState("");
  const [friendStake, setFriendStake] = useState("0");
  const [notice, setNotice] = useState("");
  const [data, refresh] = usePoll<{ games: Match[] }>(cloud ? "/api/live/play?view=games" : null, openId ? 3000 : 10000);
  const lifeRef = useRef(life);
  const now = useClock();
  useEffect(() => {
    lifeRef.current = life;
  });
  const today = now ? dayIndex(realMinutes(now)) : -1;
  const bets = life.playDay?.day === today ? life.playDay.bets : 0;

  const finish = useCallback(
    (game: Local, board: Board) => {
      if (game.done || board.winner === null) return { ...game, board };
      const label = GAME_LABEL[board.kind];
      if (board.winner === 0) {
        const next = cloneLife(lifeRef.current);
        next.cash += game.stake * 2;
        next.stats = { ...next.stats, wins: (next.stats?.wins ?? 0) + 1 };
        onApply({ life: next, notes: [game.stake ? `You beat the computer at ${label}. +${cedis(game.stake * 2)}.` : `You beat the computer at ${label}.`] });
        return { ...game, board, done: true, note: "You won! 🎉" };
      }
      if (board.winner === "draw") {
        if (game.stake) {
          const next = cloneLife(lifeRef.current);
          next.cash += game.stake;
          onApply({ life: next, notes: ["A draw. Stake returned."] });
        }
        return { ...game, board, done: true, note: "A draw." };
      }
      return { ...game, board, done: true, note: "The computer won this one." };
    },
    [onApply],
  );

  useEffect(() => {
    if (!local || local.done || local.board.winner !== null || local.board.turn !== 1) return;
    const id = window.setTimeout(() => {
      const next = aiMove(local.board);
      setLocal(finish(local, next ?? { ...local.board, winner: "draw" }));
    }, 700);
    return () => window.clearTimeout(id);
  }, [local, finish]);

  function startLocal() {
    const day = dayIndex(realMinutes());
    const used = life.playDay?.day === day ? life.playDay.bets : 0;
    if (stake > 0) {
      if (used >= BET_CAP) {
        setNotice(`That is ${BET_CAP} staked games today. Play for fun or come back tomorrow.`);
        return;
      }
      if (life.cash < stake) {
        setNotice(`You need ${cedis(stake)}.`);
        return;
      }
      const next = cloneLife(life);
      next.cash -= stake;
      next.playDay = { day, bets: used + 1 };
      onApply({ life: next, notes: [`${cedis(stake)} on the table.`] });
    }
    setNotice("");
    setLocal({ board: startBoard(kind), stake, done: false, note: "" });
  }

  if (local) {
    const mine = local.board.turn === 0 && local.board.winner === null;
    return (
      <Screen title={`${GAME_LABEL[local.board.kind]} vs computer`} color="#5a3a1a" life={life} onBack={() => setLocal(null)}>
        <p className="text-center text-sm font-semibold">{local.done ? local.note : mine ? "Your move" : "Computer is thinking…"}</p>
        {local.stake ? <p className="text-center text-xs text-[#5c6b82]">Stake {cedis(local.stake)} · win pays {cedis(local.stake * 2)}</p> : null}
        <BoardView board={local.board} me={0} live={mine} onMove={(move) => {
          const next = applyMove(local.board, move.roll !== undefined ? { roll: rollDie() } : move);
          if (next) setLocal(finish(local, next));
        }} />
        <div className="flex justify-center gap-2">
          {local.done ? (
            <Btn kind="dark" onClick={() => setLocal(null)}>
              Back to games
            </Btn>
          ) : (
            <Btn kind="red" onClick={() => setLocal(null)}>
              Walk away{local.stake ? " (lose stake)" : ""}
            </Btn>
          )}
        </div>
      </Screen>
    );
  }

  const games = data?.games ?? [];
  const open = games.find((match) => match.id === openId) ?? null;
  if (open) {
    const side: Side = open.a === me ? 0 : 1;
    const foe = side === 0 ? open.b : open.a;
    const mine = open.status === "playing" && open.board.turn === side;
    const idle = now - Date.parse(open.moved) > 86400000;
    return (
      <Screen title={`${GAME_LABEL[open.game]} vs @${foe}`} color="#5a3a1a" life={life} onBack={() => setOpenId(null)}>
        {notice ? <p className="rounded-2xl bg-[#fff4c2] px-3 py-2 text-xs font-semibold">{notice}</p> : null}
        <p className="text-center text-sm font-semibold">
          {open.status === "done" ? (open.winner === me ? "You won! 🎉" : open.winner ? `@${open.winner} won.` : "A draw.") : open.status === "waiting" ? "Waiting for them to accept." : open.status === "declined" ? "They declined." : mine ? "Your move" : `@${foe}'s move`}
        </p>
        {open.stake ? <p className="text-center text-xs text-[#5c6b82]">Stake {cedis(open.stake)} each · winner takes {cedis(open.stake * 2)}</p> : null}
        <BoardView
          board={open.board}
          me={side}
          live={mine}
          onMove={(move) =>
            void post({ action: "game-move", owner: open.a, id: open.id, move }).then(({ error }) => {
              setNotice(error ?? "");
              refresh();
            })
          }
        />
        {open.status === "playing" && !mine && idle ? (
          <div className="text-center">
            <Btn kind="gold" onClick={() => void post({ action: "game-claim", owner: open.a, id: open.id }).then(({ error }) => (setNotice(error ?? "You claimed the win."), refresh()))}>
              They went quiet. Claim the win
            </Btn>
          </div>
        ) : null}
      </Screen>
    );
  }

  return (
    <Screen title="Games" color="#5a3a1a" life={life} onBack={onBack}>
      {notice ? <p className="rounded-2xl bg-[#fff4c2] px-3 py-2 text-xs font-semibold">{notice}</p> : null}
      <div className="grid grid-cols-3 gap-2">
        {KINDS.map((item) => (
          <button key={item} type="button" onClick={() => setKind(item)} className={`rounded-2xl px-2 py-3 text-center text-sm font-semibold shadow-sm ${kind === item ? "bg-[#5a3a1a] text-white" : "bg-white"}`}>
            <span className="block text-2xl">{item === "oware" ? "🌰" : item === "draughts" ? "⚫" : "🎲"}</span>
            {GAME_LABEL[item]}
          </button>
        ))}
      </div>
      <div className="rounded-2xl bg-white p-3 shadow-sm">
        <p className="font-semibold">Play the computer</p>
        <p className="mt-1 text-xs text-[#5c6b82]">Small stakes, up to {BET_CAP} staked games a day ({bets} used). Winning pays double.</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {[0, 10, 20, 50].map((value) => (
            <button key={value} type="button" onClick={() => setStake(value)} className={`rounded-full px-3 py-1 text-xs font-semibold ${stake === value ? "bg-[#CE1126] text-white" : "bg-[#f4f7fb]"}`}>
              {value ? cedis(value) : "For fun"}
            </button>
          ))}
        </div>
        <div className="mt-2">
          <Btn kind="dark" onClick={startLocal}>
            Start {GAME_LABEL[kind]}
          </Btn>
        </div>
      </div>
      {cloud ? (
        <>
          <div className="rounded-2xl bg-white p-3 shadow-sm">
            <p className="font-semibold">Challenge a friend</p>
            <div className="mt-2 flex gap-2">
              <input value={friend} onChange={(event) => setFriend(event.target.value)} placeholder="@username" className="h-9 min-w-0 flex-1 rounded-full bg-[#f4f7fb] px-3 text-sm outline-none" />
              <input value={friendStake} onChange={(event) => setFriendStake(event.target.value.replace(/[^0-9]/g, ""))} inputMode="numeric" aria-label="Stake" className="h-9 w-16 rounded-full bg-[#f4f7fb] px-3 text-sm outline-none" />
            </div>
            <p className="mt-1 text-[11px] text-[#5c6b82]">Stake in cedis, up to ₵500. Both sides put it down; the winner takes both.</p>
            <div className="mt-2">
              <Btn kind="green" onClick={() => void onNet({ api: "play", action: "game-challenge", to: friend, game: kind, stake: Number(friendStake) || 0 }).then((error) => (setNotice(error ?? ""), error ? null : setFriend(""), refresh()))}>
                Send {GAME_LABEL[kind]} challenge
              </Btn>
            </div>
          </div>
          {games.length ? <Label>YOUR MATCHES</Label> : null}
          {games.map((match) => {
            const side: Side = match.a === me ? 0 : 1;
            const foe = side === 0 ? match.b : match.a;
            const incoming = match.status === "waiting" && match.b === me;
            const turn = match.status === "playing" && match.board.turn === side;
            return (
              <div key={match.id} className={`rounded-2xl bg-white p-3 shadow-sm ${turn || incoming ? "ring-2 ring-[#006B3F]/50" : ""}`}>
                <button type="button" onClick={() => setOpenId(match.id)} className="block w-full text-left">
                  <span className="block font-semibold">
                    {GAME_LABEL[match.game]} vs @{foe}
                    {match.stake ? ` · ${cedis(match.stake)}` : ""}
                  </span>
                  <span className="block text-xs text-[#5c6b82]">
                    {match.status === "done" ? (match.winner === me ? "You won" : match.winner ? "You lost" : "Draw") : match.status === "declined" ? "Declined" : match.status === "waiting" ? (incoming ? "They challenged you" : "Waiting for them") : turn ? "Your move" : "Their move"}
                  </span>
                </button>
                {incoming ? (
                  <div className="mt-2 flex gap-2">
                    <Btn kind="green" onClick={() => void onNet({ api: "play", action: "game-answer", owner: match.a, id: match.id, yes: true }).then((error) => (setNotice(error ?? ""), refresh()))}>
                      Accept{match.stake ? ` · ${cedis(match.stake)}` : ""}
                    </Btn>
                    <Btn kind="light" onClick={() => void onNet({ api: "play", action: "game-answer", owner: match.a, id: match.id, yes: false }).then((error) => (setNotice(error ?? ""), refresh()))}>
                      Decline
                    </Btn>
                  </div>
                ) : null}
              </div>
            );
          })}
        </>
      ) : (
        <p className="text-xs text-[#5c6b82]">Sign up online to challenge friends.</p>
      )}
    </Screen>
  );
}

function BoardView({ board, me, live, onMove }: { board: Board; me: Side; live: boolean; onMove: (move: Move) => void }) {
  if (board.kind === "oware") return <OwareView board={board} me={me} live={live} onMove={onMove} />;
  if (board.kind === "draughts") return <DraughtsView board={board} me={me} live={live} onMove={onMove} />;
  return <LudoView board={board} me={me} live={live} onMove={onMove} />;
}

function OwareView({ board, me, live, onMove }: { board: Extract<Board, { kind: "oware" }>; me: Side; live: boolean; onMove: (move: Move) => void }) {
  const legal = new Set(live ? owareMoves(board) : []);
  const mineRow = me === 0 ? [0, 1, 2, 3, 4, 5] : [6, 7, 8, 9, 10, 11];
  const theirRow = me === 0 ? [11, 10, 9, 8, 7, 6] : [5, 4, 3, 2, 1, 0];
  const pit = (index: number) => (
    <button
      key={index}
      type="button"
      disabled={!legal.has(index)}
      onClick={() => onMove({ pit: index })}
      className={`relative grid aspect-square place-items-center rounded-full bg-[#5a3a1a] text-sm font-bold text-[#f6e7c8] shadow-inner ${legal.has(index) ? "ring-2 ring-[#FCD116]" : ""} ${board.last === index ? "outline outline-2 outline-white/70" : ""}`}
    >
      <span className="absolute inset-1 flex flex-wrap content-center justify-center gap-[2px] p-1">
        {Array.from({ length: Math.min(board.pits[index], 10) }, (_, seed) => (
          <span key={seed} className="h-1.5 w-1.5 rounded-full bg-[#e9dcc0]" />
        ))}
      </span>
      <span className="relative rounded-full bg-black/40 px-1.5 text-[11px]">{board.pits[index]}</span>
    </button>
  );
  return (
    <div className="rounded-3xl bg-[#8b5a2b] p-3 shadow-md">
      <p className="mb-1 text-center text-[11px] font-semibold text-[#f6e7c8]">Them · {board.store[me === 0 ? 1 : 0]} seeds</p>
      <div className="grid grid-cols-6 gap-1.5">{theirRow.map(pit)}</div>
      <div className="my-2 h-px bg-black/20" />
      <div className="grid grid-cols-6 gap-1.5">{mineRow.map(pit)}</div>
      <p className="mt-1 text-center text-[11px] font-semibold text-[#FCD116]">You · {board.store[me]} seeds · 25 wins</p>
    </div>
  );
}

function DraughtsView({ board, me, live, onMove }: { board: Extract<Board, { kind: "draughts" }>; me: Side; live: boolean; onMove: (move: Move) => void }) {
  const [from, setFrom] = useState<number | null>(null);
  const moves = live ? draughtsMoves(board) : [];
  const starts = new Set(moves.map((move) => move.from));
  const targets = new Set(moves.filter((move) => move.from === (board.chain ?? from)).map((move) => move.to));
  const picked = board.chain ?? from;
  return (
    <div className="mx-auto grid aspect-square w-full max-w-[320px] grid-cols-8 overflow-hidden rounded-xl border-4 border-[#5a3a1a] shadow-md">
      {Array.from({ length: 64 }, (_, cell) => {
        const at = me === 0 ? cell : 63 - cell;
        const row = Math.floor(at / 8);
        const dark = (row + (at % 8)) % 2 === 1;
        const value = board.board[at];
        const lit = board.last && (board.last[0] === at || board.last[1] === at);
        return (
          <button
            key={at}
            type="button"
            onClick={() => {
              if (targets.has(at) && picked !== null) {
                onMove({ from: picked, to: at });
                setFrom(null);
              } else if (starts.has(at)) setFrom(at);
            }}
            className={`relative grid place-items-center ${dark ? (lit ? "bg-[#8a6b3a]" : "bg-[#6b4423]") : "bg-[#f3e6d4]"}`}
          >
            {value ? (
              <span className={`grid h-[78%] w-[78%] place-items-center rounded-full text-[10px] shadow ${value <= 2 ? "bg-[#CE1126] text-[#FCD116]" : "bg-[#1b1b1b] text-[#FCD116]"} ${picked === at ? "ring-2 ring-[#FCD116]" : starts.has(at) ? "ring-1 ring-white/70" : ""}`}>
                {value === 2 || value === 4 ? "♛" : ""}
              </span>
            ) : targets.has(at) ? (
              <span className="h-3 w-3 rounded-full bg-[#FCD116]/80" />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

function LudoView({ board, me, live, onMove }: { board: Extract<Board, { kind: "ludo" }>; me: Side; live: boolean; onMove: (move: Move) => void }) {
  const legal = new Set(live ? ludoMoves(board) : []);
  const offset = me === 0 ? 0 : 26;
  const size = 300;
  const center = size / 2;
  const radius = 122;
  const point = (square: number) => {
    const angle = Math.PI / 2 + ((square - offset) / 52) * Math.PI * 2;
    return { x: center + Math.cos(angle) * radius, y: center + Math.sin(angle) * radius };
  };
  const colors = ["#CE1126", "#006B3F"];
  const where = (side: Side, token: number) => {
    const pos = board.tokens[side][token];
    if (pos === -1) {
      const corner = side === me ? { x: 34, y: size - 34 } : { x: size - 34, y: 34 };
      return { x: corner.x + (token % 2 ? 12 : -12), y: corner.y + (token < 2 ? -12 : 12) };
    }
    if (pos >= 51) {
      const gate = point((LUDO_START[side] + 50) % 52);
      const t = Math.min(1, (pos - 50) / 6.5);
      const spread = pos === LUDO_HOME ? (token - 1.5) * 7 : 0;
      return { x: gate.x + (center - gate.x) * t + spread, y: gate.y + (center - gate.y) * t };
    }
    const square = ludoSquare(side, pos) ?? 0;
    const at = point(square);
    const twins = board.tokens[side].filter((other, index) => index < token && other === pos).length;
    return { x: at.x + twins * 4, y: at.y - twins * 4 };
  };
  return (
    <div className="space-y-2">
      <svg viewBox={`0 0 ${size} ${size}`} className="mx-auto w-full max-w-[320px] rounded-3xl bg-[#fff8e7] shadow-md">
        <circle cx={center} cy={center} r={radius} fill="none" stroke="#e8dcc0" strokeWidth={18} />
        {Array.from({ length: 52 }, (_, square) => {
          const at = point(square);
          const start = LUDO_START.indexOf(square);
          return <circle key={square} cx={at.x} cy={at.y} r={6.5} fill={start >= 0 ? colors[start] : LUDO_SAFE.has(square) ? "#FCD116" : "#ffffff"} stroke="#c9b48a" strokeWidth={1} />;
        })}
        {([0, 1] as Side[]).map((side) => {
          const gate = point((LUDO_START[side] + 50) % 52);
          return <line key={side} x1={gate.x} y1={gate.y} x2={center} y2={center} stroke={colors[side]} strokeOpacity={0.3} strokeWidth={10} strokeLinecap="round" />;
        })}
        <circle cx={center} cy={center} r={22} fill="#121212" />
        <text x={center} y={center + 5} textAnchor="middle" fontSize={14} fill="#FCD116" fontWeight={700}>
          {board.dice ?? "🎲"}
        </text>
        {([0, 1] as Side[]).flatMap((side) =>
          board.tokens[side].map((_, token) => {
            const at = where(side, token);
            const can = side === board.turn && legal.has(token);
            return (
              <g key={`${side}${token}`} onClick={() => (can ? onMove({ token }) : undefined)} style={{ cursor: can ? "pointer" : "default" }}>
                {can ? <circle cx={at.x} cy={at.y} r={11} fill="none" stroke="#FCD116" strokeWidth={3} /> : null}
                <circle cx={at.x} cy={at.y} r={7.5} fill={colors[side]} stroke="#fff" strokeWidth={2} />
              </g>
            );
          }),
        )}
      </svg>
      <p className="text-center text-xs text-[#5c6b82]">
        {board.note ?? (live && board.dice === null ? "Roll the die. A 6 brings a seed out of the yard." : live ? "Tap a glowing piece to move it." : " ")}
      </p>
      <p className="text-center text-xs">
        <span style={{ color: colors[me] }}>● You: {board.tokens[me].filter((pos) => pos === LUDO_HOME).length}/4 home</span>
        {"  ·  "}
        <span style={{ color: colors[me === 0 ? 1 : 0] }}>● Them: {board.tokens[me === 0 ? 1 : 0].filter((pos) => pos === LUDO_HOME).length}/4 home</span>
      </p>
      {live && board.dice === null ? (
        <div className="text-center">
          <Btn kind="gold" onClick={() => onMove({ roll: 1 })}>
            🎲 Roll
          </Btn>
        </div>
      ) : null}
    </div>
  );
}

type BoardRow = { username: string; name: string; value: number };
type Boards = Record<"worth" | "social" | "chef" | "fans" | "badges" | "football" | "elders", BoardRow[]>;

const TABS: { id: keyof Boards; label: string; unit: (value: number) => string }[] = [
  { id: "worth", label: "Net worth", unit: (value) => cedis(value) },
  { id: "social", label: "Social", unit: (value) => `${value} pts` },
  { id: "chef", label: "Chef", unit: (value) => `Cooking ${value}` },
  { id: "fans", label: "Music", unit: (value) => `${value.toLocaleString("en-GH")} fans` },
  { id: "badges", label: "Badges", unit: (value) => `${value} badges` },
  { id: "football", label: "Football", unit: (value) => `${value} 🏆` },
  { id: "elders", label: "Community", unit: (value) => `${value} standing` },
];

export function LeaderApp({ me, life, cloud, onBack }: { me: string; life: Life; cloud: boolean; onBack: () => void }) {
  const [data] = usePoll<Boards>(cloud ? "/api/live/play?view=board" : null, 60000);
  const [tab, setTab] = useState<keyof Boards>("worth");
  if (!cloud) return <Offline title="Leaderboard" color="#b8860b" life={life} onBack={onBack} />;
  const meta = TABS.find((item) => item.id === tab)!;
  const rows = data?.[tab] ?? [];
  return (
    <Screen title="Leaderboard" color="#b8860b" life={life} onBack={onBack}>
      <div className="flex gap-1.5 overflow-auto">
        {TABS.map((item) => (
          <button key={item.id} type="button" onClick={() => setTab(item.id)} className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${tab === item.id ? "bg-[#121212] text-white" : "bg-white"}`}>
            {item.label}
          </button>
        ))}
      </div>
      {!data ? <p className="text-sm text-[#5c6b82]">Counting…</p> : null}
      {data && !rows.length ? <p className="text-sm text-[#5c6b82]">Nobody on this board yet.</p> : null}
      {rows.map((row, index) => (
        <div key={row.username} className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 shadow-sm ${row.username === me ? "bg-[#fff4c2]" : "bg-white"}`}>
          <span className={`grid h-8 w-8 place-items-center rounded-full text-sm font-bold ${index === 0 ? "bg-[#FCD116]" : index === 1 ? "bg-[#d9dde3]" : index === 2 ? "bg-[#e0b089]" : "bg-[#f4f7fb]"}`}>{index + 1}</span>
          <span className="min-w-0 flex-1">
            <span className="block truncate font-semibold">{row.name}</span>
            <span className="block text-xs text-[#5c6b82]">@{row.username}</span>
          </span>
          <span className="text-sm font-bold">{meta.unit(row.value)}</span>
        </div>
      ))}
    </Screen>
  );
}
