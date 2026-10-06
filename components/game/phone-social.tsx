"use client";

import { useEffect, useState, type ReactNode } from "react";
import { cedis, handleOf, type Life } from "@/lib/game/world";

export type ChatMsg = { who: "me" | "them" | "note"; text: string; time: string };

const EMOJI = ["😊", "😂", "🙏🏾", "🔥", "❤️", "👀"];

export function MessagesApp({
  life,
  time,
  me,
  players,
  thread,
  chats,
  blocked,
  unread,
  groups,
  onOpen,
  onBack,
  onCreateGroup,
  onSend,
  onAct,
  onBlock,
  onReport,
}: {
  life: Life;
  time: string;
  me: string;
  players: { username: string; name: string }[];
  thread: string | null;
  chats: Record<string, ChatMsg[]>;
  blocked: string[];
  unread: Record<string, number>;
  groups: string[];
  onOpen: (id: string) => void;
  onBack: () => void;
  onCreateGroup: (name: string) => void;
  onSend: (text: string) => void;
  onAct: (kind: "invite" | "visit" | "food" | "pay" | "spare", amount?: number) => void;
  onBlock: (id: string) => void;
  onReport: (id: string) => void;
}) {
  if (thread) {
    const person = resolvePerson(thread, players);
    return (
      <Thread
        person={person}
        blocked={blocked.includes(thread)}
        lines={chats[thread] ?? []}
        time={time}
        me={me}
        cash={life.cash}
        onBack={onBack}
        onSend={onSend}
        onAct={onAct}
        onBlock={() => onBlock(thread)}
        onReport={() => onReport(thread)}
      />
    );
  }
  return (
      <Inbox
      life={life}
      players={players}
      chats={chats}
      blocked={blocked}
      unread={unread}
      groups={groups}
      onOpen={onOpen}
      onBack={onBack}
      onCreateGroup={onCreateGroup}
    />
  );
}

function Inbox({
  life,
  players,
  chats,
  blocked,
  unread,
  groups,
  onOpen,
  onBack,
  onCreateGroup,
}: {
  life: Life;
  players: { username: string; name: string }[];
  chats: Record<string, ChatMsg[]>;
  blocked: string[];
  unread: Record<string, number>;
  groups: string[];
  onOpen: (id: string) => void;
  onBack: () => void;
  onCreateGroup: (name: string) => void;
}) {
  const [tab, setTab] = useState<"chats" | "updates">("chats");
  const [query, setQuery] = useState("");
  const [lookup, setLookup] = useState("");
  const [groupName, setGroupName] = useState("");
  const [making, setMaking] = useState(false);
  const [notice, setNotice] = useState("");
  const [found, setFound] = useState<{ username: string; name: string }[]>([]);
  const [previews, setPreviews] = useState<Record<string, ChatMsg>>({});
  useEffect(() => {
    let stop = false;
    const load = () => {
      fetch("/api/live/chat")
        .then((response) => response.json())
        .then((payload: { threads?: { username: string; name: string; last?: string; time?: string; mine?: boolean }[] }) => {
          if (stop || !Array.isArray(payload.threads)) return;
          const threads = payload.threads;
          setFound((current) => {
            const known = new Set(threads.map((thread) => thread.username));
            return [...threads.map((thread) => ({ username: thread.username, name: thread.name })), ...current.filter((person) => !known.has(person.username))];
          });
          setPreviews(
            Object.fromEntries(
              threads.filter((thread) => thread.last).map((thread) => [`user:${thread.username}`, { who: thread.mine ? "me" : "them", text: thread.last ?? "", time: thread.time ?? "" } as ChatMsg]),
            ),
          );
        })
        .catch(() => {});
    };
    load();
    const id = window.setInterval(load, 5000);
    return () => {
      stop = true;
      window.clearInterval(id);
    };
  }, []);
  const people = peopleBook([...players, ...found]).filter((person) => !blocked.includes(person.id));
  const unreadTotal = people.reduce((sum, person) => sum + (unread[person.id] ?? 0), 0);
  const shown = people.filter((person) => {
    const hay = `${person.name} ${person.handle}`.toLowerCase();
    return hay.includes(query.trim().toLowerCase());
  });

  async function findPerson() {
    const typed = lookup.trim().toLowerCase().replace(/^@/, "");
    if (!typed) return;
    const response = await fetch(`/api/live/people?q=${encodeURIComponent(typed)}`);
    const payload = (await response.json().catch(() => null)) as { people?: { username: string; name: string }[] } | null;
    const hits = payload?.people ?? [];
    if (!hits.length) {
      setNotice(`Nobody in Accra goes by @${typed}.`);
      return;
    }
    setFound((current) => {
      const seen = new Set(current.map((person) => person.username));
      return [...current, ...hits.filter((person) => !seen.has(person.username))];
    });
    setNotice("");
    setLookup("");
    const exact = hits.find((person) => person.username === typed) ?? (hits.length === 1 ? hits[0] : null);
    if (exact) onOpen(`user:${exact.username}`);
    else setNotice(hits.map((person) => `@${person.username}`).join(", "));
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-white text-[#121212]">
      <PhoneTitle title="Messages" onBack={onBack} />
      <div className="min-h-0 flex-1 overflow-auto px-4 pb-8">
        <div className="grid grid-cols-2 rounded-full bg-[#f2f4f8] p-1 text-sm font-semibold">
          <button type="button" onClick={() => setTab("chats")} className={`rounded-full py-2 ${tab === "chats" ? "bg-white shadow-sm" : "text-[#8b97ab]"}`}>
            Chats {unreadTotal > 0 ? <span className="ml-1 rounded-full bg-[#ff3b30] px-1.5 text-[11px] text-white">{unreadTotal}</span> : null}
          </button>
          <button type="button" onClick={() => setTab("updates")} className={`rounded-full py-2 ${tab === "updates" ? "bg-white shadow-sm" : "text-[#8b97ab]"}`}>
            Updates
          </button>
        </div>
        {tab === "updates" ? (
          <div className="mt-4 space-y-2">
            {life.inbox.length ? life.inbox.map((line) => (
              <p key={line} className="rounded-2xl bg-[#f4f7fb] px-4 py-3 text-sm leading-6">
                {line}
              </p>
            )) : <p className="text-sm text-[#8b97ab]">The city is quiet.</p>}
          </div>
        ) : (
          <>
            <div className="mt-3 flex items-center gap-3 rounded-2xl bg-[#eef3ff] px-4 py-3 text-sm">
              <span className="min-w-0 flex-1">🔔 Get notified when friends message you</span>
              <button
                type="button"
                className="font-semibold text-[#5b8def]"
                onClick={() => {
                  let prefs: Record<string, unknown> = {};
                  try {
                    prefs = JSON.parse(localStorage.getItem("accralife-phone") ?? "{}") as Record<string, unknown>;
                  } catch {
                    prefs = {};
                  }
                  localStorage.setItem("accralife-phone", JSON.stringify({ ...prefs, notifications: true }));
                  if (typeof Notification === "undefined") {
                    setNotice("New messages will pop up at the top while you play.");
                    return;
                  }
                  Notification.requestPermission()
                    .then((permission) =>
                      setNotice(permission === "granted" ? "Notifications are on. Messages pop up even when this tab is in the background." : "New messages will pop up at the top while you play. Allow notifications in your browser to get them in the background too."),
                    )
                    .catch(() => setNotice("New messages will pop up at the top while you play."));
                }}
              >
                Turn on
              </button>
            </div>
            <form
              className="mt-2 flex items-center gap-2 rounded-2xl bg-[#f4f7fb] px-4 py-3"
              onSubmit={(event) => {
                event.preventDefault();
                findPerson();
              }}
            >
              <span aria-hidden>✎</span>
              <input
                value={lookup}
                onChange={(event) => setLookup(event.target.value)}
                placeholder="Message someone: @username"
                className="w-full bg-transparent text-sm outline-none"
              />
            </form>
            {notice ? <p className="mt-2 text-xs text-[#c4563a]">{notice}</p> : null}
            <div className="mt-4 flex items-center justify-between">
              <p className="text-[11px] font-bold tracking-wide text-[#8b97ab]">GROUPS</p>
              <button type="button" className="text-sm font-semibold text-[#5b8def]" onClick={() => setMaking((value) => !value)}>
                + New group
              </button>
            </div>
            <button type="button" onClick={() => setMaking(true)} className="mt-2 flex w-full items-center gap-3 rounded-2xl bg-gradient-to-r from-[#f3e9ff] to-[#fff1df] px-3 py-3 text-left">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-[#7a5af5] text-lg">👥</span>
              <span>
                <span className="block text-sm font-bold">Make a group with your people</span>
                <span className="block text-xs text-[#5c6b82]">Add them by username and plan an Accra night.</span>
              </span>
            </button>
            {groups.map((name) => (
              <button key={name} type="button" onClick={() => onOpen(`group:${name}`)} className="mt-2 flex w-full items-center gap-3 border-b border-black/5 py-2 text-left">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-[#7a5af5] text-sm text-white">👥</span>
                <span className="font-semibold">{name}</span>
              </button>
            ))}
            {making ? (
              <form
                className="mt-2 flex gap-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  const name = groupName.trim();
                  if (!name) return;
                  setGroupName("");
                  setMaking(false);
                  onCreateGroup(name);
                }}
              >
                <input value={groupName} onChange={(event) => setGroupName(event.target.value)} placeholder="Group name" className="h-10 flex-1 rounded-full bg-[#f4f7fb] px-4 text-sm outline-none" />
                <button type="submit" className="rounded-full bg-[#121212] px-4 text-sm font-semibold text-white">
                  Create
                </button>
              </form>
            ) : null}
            <p className="mt-4 text-[11px] font-bold tracking-wide text-[#8b97ab]">CHATS</p>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search your chats" className="mt-2 h-10 w-full rounded-2xl bg-[#f4f7fb] px-4 text-sm outline-none" />
            <div className="mt-2">
              {shown.length ? null : <p className="mt-3 text-sm text-[#8b97ab]">Search a username. Only real accounts show up.</p>}
              {shown.map((person) => {
                const last = [...(chats[person.id] ?? [])].reverse()[0] ?? previews[person.id];
                const fresh = (unread[person.id] ?? 0) > 0;
                return (
                  <button key={person.id} type="button" onClick={() => onOpen(person.id)} className="flex w-full items-center gap-3 border-b border-black/5 py-3 text-left">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#d7c4a3] text-sm font-bold">{person.name.slice(0, 1).toUpperCase()}</span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className="truncate font-semibold">{person.handle}</span>
                        <span className="shrink-0 text-[11px] text-[#6b7c93]">{last?.time ?? ""}</span>
                      </span>
                      <span className={`mt-0.5 block truncate text-sm ${fresh ? "font-semibold text-[#121212]" : "text-[#5c6b82]"}`}>{last ? `${last.who === "me" ? "You: " : ""}${last.text}` : "No messages yet"}</span>
                    </span>
                    {(unread[person.id] ?? 0) > 0 ? <span className="grid h-5 min-w-5 place-items-center rounded-full bg-[#ff3b30] px-1 text-[11px] font-bold text-white">{unread[person.id]}</span> : null}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Thread({
  person,
  blocked,
  lines,
  time,
  me,
  cash,
  onBack,
  onSend,
  onAct,
  onBlock,
  onReport,
}: {
  person: { id: string; name: string; handle: string };
  blocked: boolean;
  lines: ChatMsg[];
  time: string;
  me: string;
  cash: number;
  onBack: () => void;
  onSend: (text: string) => void;
  onAct: (kind: "invite" | "visit" | "food" | "pay" | "spare", amount?: number) => void;
  onBlock: () => void;
  onReport: () => void;
}) {
  const [draft, setDraft] = useState("");
  const [emoji, setEmoji] = useState(false);
  const [paying, setPaying] = useState(false);
  const [amount, setAmount] = useState("20");
  const group = person.id.startsWith("group:");

  function submit(text: string) {
    const clean = text.trim();
    if (!clean || blocked) return;
    onSend(clean);
    const ask = clean.match(/(?:give me|send me|gimme)\s*₵?\s*(\d[\d,]*)/i);
    if (ask && !group && !person.id.startsWith("user:")) {
      const wanted = Number(ask[1].replace(/,/g, ""));
      if (wanted > 40) onAct("spare", wanted);
      else onAct("spare", wanted);
    }
    setDraft("");
    setEmoji(false);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-white text-[#121212]">
      <div className="flex items-center gap-1 px-2 pt-1">
        <button type="button" onClick={onBack} className="grid h-9 w-9 place-items-center text-xl" aria-label="Back">
          ‹
        </button>
        <p className="font-display text-lg">{person.id.startsWith("group:") ? person.name : person.handle}</p>
      </div>
      {group ? null : (
        <div className="flex flex-wrap gap-2 px-4 pb-2">
          <Chip tint="green" onClick={() => onAct("invite")}>🏠 Invite over</Chip>
          <Chip tint="blue" onClick={() => onAct("visit")}>🚪 Visit them</Chip>
          <Chip tint="yellow" onClick={() => setPaying((value) => !value)}>💸 Send money</Chip>
          <Chip tint="orange" onClick={() => onAct("food")}>🍲 Buy food</Chip>
          <Chip tint="gray" onClick={onBlock}>🚫 Block</Chip>
          <Chip tint="gray" onClick={onReport}>⚑ Report</Chip>
        </div>
      )}
      {paying ? (
        <form
          className="mx-4 mb-2 flex items-center gap-2 rounded-2xl bg-[#fff8e8] px-3 py-2"
          onSubmit={(event) => {
            event.preventDefault();
            const value = Number(String(amount).replace(/[^\d.]/g, ""));
            onAct("pay", value);
            if (value >= 1 && value <= cash) setPaying(false);
          }}
        >
          <span className="text-sm text-[#8a6a12]">Wallet {cedis(cash)}</span>
          <input value={amount} onChange={(event) => setAmount(event.target.value)} inputMode="numeric" className="h-9 w-20 rounded-full bg-white px-3 text-sm outline-none" />
          <button type="submit" className="rounded-full bg-[#121212] px-3 py-1.5 text-sm font-semibold text-white">
            Send
          </button>
        </form>
      ) : null}
      <div className="min-h-0 flex-1 space-y-2 overflow-auto px-4 py-2">
        {blocked ? <p className="rounded-2xl bg-[#f4f7fb] px-3 py-2 text-center text-sm text-[#8b97ab]">You blocked {person.handle}.</p> : null}
        {!blocked && lines.length === 0 ? <p className="pt-8 text-center text-sm text-[#8b97ab]">No messages yet. Say something.</p> : null}
        {lines.map((line, index) =>
          line.who === "note" ? (
            <p key={`${line.text}-${index}`} className="mx-auto max-w-[90%] rounded-full bg-[#fff4c2] px-3 py-2 text-center text-sm text-[#6a5410]">
              {line.text}
              <span className="mt-0.5 block text-[11px] text-[#8a6a12]">{line.time}</span>
            </p>
          ) : (
            <div key={`${line.text}-${index}`} className={line.who === "me" ? "ml-auto max-w-[78%]" : "max-w-[78%]"}>
              <p className={`rounded-3xl px-3 py-2 text-sm leading-5 ${line.who === "me" ? "bg-[#006B3F] text-white" : "bg-[#fff1c9] text-[#121212]"}`}>{line.text}</p>
              <p className={`mt-0.5 text-[11px] text-[#8b97ab] ${line.who === "me" ? "text-right" : ""}`}>{line.time}</p>
            </div>
          ),
        )}
      </div>
      <form
        className="flex items-center gap-2 px-3 pb-6 pt-2"
        onSubmit={(event) => {
          event.preventDefault();
          submit(draft);
        }}
      >
        <button type="button" onClick={() => setEmoji((value) => !value)} className="grid h-10 w-10 place-items-center rounded-full bg-[#f4f7fb] text-lg" aria-label="Emoji">
          😊
        </button>
        <input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={`Message ${person.handle}…`} className="h-10 flex-1 rounded-full bg-[#f4f7fb] px-4 text-sm outline-none" />
        <button type="submit" className="grid h-10 w-10 place-items-center rounded-full bg-[#b7ebc6] text-[#121212]" aria-label="Send">
          ➤
        </button>
      </form>
      {emoji ? (
        <div className="flex justify-center gap-2 px-4 pb-3">
          {EMOJI.map((mark) => (
            <button key={mark} type="button" className="text-xl" onClick={() => setDraft((value) => `${value}${mark}`)}>
              {mark}
            </button>
          ))}
        </div>
      ) : null}
      <span className="sr-only">{time} {me}</span>
    </div>
  );
}

function Chip({ tint, onClick, children }: { tint: "green" | "blue" | "yellow" | "orange" | "gray"; onClick: () => void; children: ReactNode }) {
  const tone = {
    green: "bg-[#e7f8ee] text-[#1f8a4c]",
    blue: "bg-[#e7f0ff] text-[#CE1126]",
    yellow: "bg-[#fff4c2] text-[#8a6a12]",
    orange: "bg-[#fff1e4] text-[#c46a2f]",
    gray: "bg-[#f4f7fb] text-[#5c6b82]",
  }[tint];
  return (
    <button type="button" onClick={onClick} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${tone}`}>
      {children}
    </button>
  );
}

export function SettingsApp({
  email,
  onBack,
  onEmail,
  onLogout,
  onMenu,
  onNewLife,
}: {
  email: string;
  onBack: () => void;
  onEmail: (email: string) => void;
  onLogout: () => void;
  onMenu: () => void;
  onNewLife: () => void;
}) {
  const [prefs, setPrefs] = useState(readPrefs);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState(email);
  const [armed, setArmed] = useState(false);

  function save(next: Prefs) {
    setPrefs(next);
    localStorage.setItem("accralife-phone", JSON.stringify(next));
    localStorage.setItem("accralife-freewill", next.freeWill ? "1" : "0");
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-white text-[#121212]">
      <PhoneTitle title="Settings" onBack={onBack} />
      <div className="min-h-0 flex-1 space-y-4 overflow-auto px-4 pb-8">
        <div>
          <p className="font-semibold">Data & battery saver</p>
          <p className="mt-1 text-sm text-[#5c6b82]">Uses less data and keeps your phone cool. Accra still looks like Accra.</p>
          <div className="mt-3 grid grid-cols-3 rounded-full bg-[#f2f4f8] p-1 text-sm font-semibold">
            {(["auto", "on", "off"] as const).map((mode) => (
              <button key={mode} type="button" onClick={() => save({ ...prefs, data: mode })} className={`rounded-full py-2 capitalize ${prefs.data === mode ? "bg-white shadow-sm" : "text-[#8b97ab]"}`}>
                {mode}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-[#8b97ab]">Auto: turns on when battery is low or the network is slow</p>
        </div>
        <Toggle label="Sound effects" on={prefs.sound} onChange={(sound) => save({ ...prefs, sound })} />
        <Toggle label="Music" on={prefs.music} onChange={(music) => save({ ...prefs, music })} />
        <Toggle label="Free will" on={prefs.freeWill} onChange={(freeWill) => save({ ...prefs, freeWill })} />
        <div>
          <p className="text-[11px] font-bold tracking-wide text-[#8b97ab]">NOTIFICATIONS</p>
          <div className="mt-2 flex items-center justify-between gap-3 border-b border-black/5 py-3">
            <span>
              <span className="block font-semibold">Messages & city desk</span>
              <span className="block text-sm text-[#5c6b82]">Friends&apos; messages, the light coming back, and what the city is doing.</span>
            </span>
            <ToggleSwitch on={prefs.notifications} onChange={(notifications) => save({ ...prefs, notifications })} />
          </div>
        </div>
        <div>
          <p className="text-[11px] font-bold tracking-wide text-[#8b97ab]">RECOVERY EMAIL</p>
          {adding ? (
            <form
              className="mt-2 flex gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                if (!draft.includes("@")) return;
                onEmail(draft.trim());
                setAdding(false);
              }}
            >
              <input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="you@email.com" className="h-10 flex-1 rounded-full bg-[#f4f7fb] px-4 text-sm outline-none" />
              <button type="submit" className="rounded-full bg-[#121212] px-4 text-sm font-semibold text-white">
                Save
              </button>
            </form>
          ) : (
            <div className="mt-2 flex items-center justify-between gap-3">
              <span>
                <span className="block font-semibold">{email || "Add an email"}</span>
                <span className="block text-sm text-[#5c6b82]">So you can reset your password if you forget it</span>
              </span>
              <button type="button" className="font-semibold text-[#5b8def]" onClick={() => setAdding(true)}>
                {email ? "Edit" : "Add"}
              </button>
            </div>
          )}
        </div>
        <button type="button" onClick={onLogout} className="w-full rounded-full border border-black/5 py-3 font-semibold">
          Log out
        </button>
        <button type="button" onClick={onMenu} className="w-full rounded-full border border-black/5 py-3 font-semibold">
          Main menu
        </button>
        <button type="button" onClick={() => (armed ? onNewLife() : setArmed(true))} className="w-full rounded-full bg-[#fff1f0] py-3 font-semibold text-[#e23d3d]">
          {armed ? "Tap again. This clears the room and the cash." : "New life"}
        </button>
        <p className="pb-4 text-center text-xs text-[#8b97ab]">Terms · Privacy · 18+</p>
      </div>
    </div>
  );
}

type Prefs = { data: "auto" | "on" | "off"; sound: boolean; music: boolean; freeWill: boolean; notifications: boolean };

function readPrefs(): Prefs {
  const fallback: Prefs = { data: "auto", sound: true, music: true, freeWill: true, notifications: false };
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem("accralife-phone");
    return raw ? { ...fallback, ...(JSON.parse(raw) as Prefs) } : fallback;
  } catch {
    return fallback;
  }
}

function Toggle({ label, on, onChange }: { label: string; on: boolean; onChange: (value: boolean) => void }) {
  return (
    <div className="flex items-center justify-between border-b border-black/5 py-3">
      <span className="font-semibold">{label}</span>
      <ToggleSwitch on={on} onChange={onChange} />
    </div>
  );
}

function ToggleSwitch({ on, onChange }: { on: boolean; onChange: (value: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!on)} className={`h-7 w-12 rounded-full p-1 ${on ? "bg-[#006B3F]" : "bg-[#d5dbe6]"}`} aria-pressed={on}>
      <span className={`block h-5 w-5 rounded-full bg-white shadow ${on ? "ml-auto" : ""}`} />
    </button>
  );
}

function PhoneTitle({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="flex items-center gap-1 px-2 pt-1">
      <button type="button" onClick={onBack} className="grid h-9 w-9 place-items-center text-xl" aria-label="Back">
        ‹
      </button>
      <h2 className="font-display text-2xl tracking-tight">{title}</h2>
    </div>
  );
}

function peopleBook(players: { username: string; name: string }[]) {
  const seen = new Set<string>();
  return players.flatMap((player) => {
    if (seen.has(player.username)) return [];
    seen.add(player.username);
    return [{ id: `user:${player.username}`, name: player.name, handle: `@${player.username}` }];
  });
}

function resolvePerson(id: string, players: { username: string; name: string }[]) {
  if (id.startsWith("group:")) return { id, name: id.slice(6), handle: id.slice(6) };
  return peopleBook(players).find((person) => person.id === id) ?? { id, name: id.startsWith("user:") ? id.slice(5) : id, handle: id.startsWith("user:") ? `@${id.slice(5)}` : handleOf(id) };
}
