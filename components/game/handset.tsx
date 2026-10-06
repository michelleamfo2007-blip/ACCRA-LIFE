"use client";

import { useEffect, useState, type ReactNode } from "react";
import { MessagesApp, SettingsApp, openingUnread, type ChatMsg } from "@/components/game/phone-social";
import {
  DREAMS,
  JOBS,
  careerLevel,
  cedis,
  clockLabel,
  dreamStatus,
  handleOf,
  homeById,
  invitePerson,
  spareChange,
  spotById,
  treatPerson,
  visitPerson,
  type Life,
  type StepResult,
} from "@/lib/game/world";

type AppId = "home" | "messages" | "work" | "goals" | "momo" | "contacts" | "radio" | "news" | "games" | "boutique" | "light" | "settings";

export function Handset({
  life,
  username,
  onClose,
  onWork,
  onRepay,
  onLogout,
  onRide,
  onMarket,
  email,
  players,
  onEmail,
  onNewLife,
  onSocial,
  onPay,
  launch,
  onLaunchConsumed,
}: {
  life: Life;
  username: string;
  onClose: () => void;
  onWork: (jobId: string) => void;
  onRepay: () => void;
  onLogout: () => void;
  onRide: () => void;
  onMarket: () => void;
  email: string;
  players: { username: string; name: string }[];
  onEmail: (email: string) => void;
  onNewLife: () => void;
  onSocial: (result: StepResult) => void;
  onPay: (name: string, handle: string, amount: number) => boolean;
  launch: { id: string } | null;
  onLaunchConsumed: () => void;
}) {
  const [app, setApp] = useState<AppId>(launch ? "messages" : "home");
  const [thread, setThread] = useState<string | null>(launch?.id ?? null);
  const [chats, setChats] = useState<Record<string, ChatMsg[]>>({});
  const [blocked, setBlocked] = useState<string[]>([]);
  const [unread, setUnread] = useState<Record<string, number>>(() => openingUnread(life));
  const [groups, setGroups] = useState<string[]>([]);
  const clock = clockLabel(life.minutes);
  const time = clock.split(" · ")[1] ?? clock;

  useEffect(() => {
    if (!launch) return;
    setApp("messages");
    setThread(launch.id);
    setUnread((current) => ({ ...current, [launch.id]: 0 }));
    onLaunchConsumed();
  }, [launch, onLaunchConsumed]);
  const battery = Math.max(8, Math.min(100, life.needs.energy));
  const inApp = app !== "home" || Boolean(thread);
  const unreadTotal = Object.values(unread).reduce((sum, count) => sum + count, 0);

  function openThread(id: string) {
    setThread(id);
    setApp("messages");
    setUnread((current) => ({ ...current, [id]: 0 }));
  }

  function pushChat(id: string, message: ChatMsg) {
    setChats((current) => {
      const base = current[id] ?? [];
      return { ...current, [id]: [...base, message] };
    });
  }

  function personName(id: string) {
    if (id.startsWith("user:")) return players.find((player) => player.username === id.slice(5))?.name ?? id.slice(5);
    if (id.startsWith("group:")) return id.slice(6);
    return id;
  }

  function homeBar() {
    if (thread) {
      setThread(null);
      return;
    }
    if (app !== "home") {
      setApp("home");
      return;
    }
    onClose();
  }

  return (
    <div className="absolute inset-0 z-40 grid place-items-center bg-[#0c1220]/55 px-4 backdrop-blur-[2px]">
      <button type="button" onClick={onClose} className="absolute right-4 top-4 z-50 rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#16203c] shadow">
        × Close
      </button>
      <div className="relative h-[min(760px,86dvh)] w-[min(390px,100%)]">
        <span className="absolute -left-[3px] top-[22%] h-7 w-[3px] rounded-l-sm bg-[#2c3038]" />
        <span className="absolute -left-[3px] top-[30%] h-12 w-[3px] rounded-l-sm bg-[#2c3038]" />
        <span className="absolute -left-[3px] top-[40%] h-12 w-[3px] rounded-l-sm bg-[#2c3038]" />
        <span className="absolute -right-[3px] top-[32%] h-16 w-[3px] rounded-r-sm bg-[#2c3038]" />
        <div className="flex h-full flex-col rounded-[46px] bg-gradient-to-b from-[#4a4e57] via-[#2a2d33] to-[#16181c] p-[11px] shadow-[0_40px_90px_rgba(0,0,0,.5),inset_0_0_0_1px_rgba(255,255,255,.2)]">
          <div className={`relative min-h-0 flex-1 overflow-hidden rounded-[36px] ${inApp ? "bg-white" : "bg-[#5b4bdb]"}`}>
            {inApp ? null : (
              <div className="pointer-events-none absolute inset-0" style={{ background: "linear-gradient(180deg, #5b4bdb 0%, #c45c9a 42%, #f08a3c 78%, #f6c15a 100%)" }} />
            )}
            {inApp ? null : <Skyline />}
            {inApp ? null : <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/30 to-transparent" />}
            <Status time={time} battery={battery} ink={inApp ? "dark" : "light"} />
            <div className="relative flex h-[calc(100%-28px)] flex-col">
              {app === "home" && !thread ? (
                <HomeScreen date={longDate(life.minutes)} time={time} inbox={unreadTotal} onOpen={setApp} onRide={onRide} onMarket={onMarket} />
              ) : null}
              {app === "messages" ? (
                <MessagesApp
                  life={life}
                  time={time}
                  me={username}
                  players={players}
                  thread={thread}
                  chats={chats}
                  blocked={blocked}
                  unread={unread}
                  groups={groups}
                  onOpen={openThread}
                  onCreateGroup={(name) => {
                    setGroups((current) => (current.includes(name) ? current : [...current, name]));
                    openThread(`group:${name}`);
                  }}
                  onBack={() => (thread ? setThread(null) : setApp("home"))}
                  onSend={(text) => {
                    if (!thread) return;
                    pushChat(thread, { who: "me", text, time });
                    if (thread.startsWith("user:") || thread.startsWith("group:")) return;
                    const reply = npcReply(thread, text);
                    window.setTimeout(() => pushChat(thread, { who: "them", text: reply, time }), 500);
                  }}
                  onAct={(kind, amount) => {
                    if (!thread) return;
                    const name = personName(thread);
                    const handle = thread.startsWith("user:") ? `@${thread.slice(5)}` : handleOf(name);
                    if (kind === "spare") {
                      if ((amount ?? 0) > 40) {
                        pushChat(thread, { who: "them", text: "I no get am. My MoMo is for rent.", time });
                        return;
                      }
                      const result = spareChange(life, name);
                      if (result.error) pushChat(thread, { who: "them", text: result.error, time });
                      else {
                        onSocial(result);
                        pushChat(thread, { who: "note", text: `${handle} sent you ${cedis(15)}`, time });
                      }
                      return;
                    }
                    if (kind === "pay") {
                      const value = Math.round(amount ?? 0);
                      if (onPay(name, handle, value)) pushChat(thread, { who: "note", text: `You sent ${handle} ${cedis(value)}`, time });
                      return;
                    }
                    const result = kind === "invite" ? invitePerson(life, name) : kind === "visit" ? visitPerson(life, name) : treatPerson(life, name);
                    if (result.error) pushChat(thread, { who: "them", text: result.error, time });
                    else {
                      onSocial(result);
                      pushChat(thread, { who: "note", text: result.notes[0] ?? "Done.", time });
                    }
                  }}
                  onBlock={(id) => {
                    setBlocked((current) => (current.includes(id) ? current : [...current, id]));
                    pushChat(id, { who: "note", text: "Blocked. Their messages stay on their phone.", time });
                  }}
                  onReport={(id) => pushChat(id, { who: "note", text: "Report sent. Accra Life will look at this chat.", time })}
                />
              ) : null}
              {app === "work" ? (
                <WorkScreen life={life} onBack={() => setApp("home")} onWork={onWork} />
              ) : null}
              {app === "goals" ? <GoalsScreen life={life} onBack={() => setApp("home")} /> : null}
              {app === "momo" ? <MomoScreen life={life} username={username} onBack={() => setApp("home")} onRepay={onRepay} onLogout={onLogout} /> : null}
              {app === "contacts" ? <ContactsScreen life={life} onBack={() => setApp("home")} onOpen={openThread} /> : null}
              {app === "radio" ? <NoteScreen title="Radio" onBack={() => setApp("home")} lines={["Joy, Peace, and the highlife station that only wakes up after nine.", life.dumsor && !life.inventory.includes("generator") ? "The set is quiet. ECG took the current." : "The room radio is live. Tap Radio in the house to sit with it."]} /> : null}
              {app === "news" ? <NoteScreen title="City desk" onBack={() => setApp("home")} lines={life.inbox.length ? life.inbox : ["Accra is moving. Your phone will hear about it."]} /> : null}
              {app === "games" ? <NoteScreen title="Oware" onBack={() => setApp("home")} lines={["The board is on the stoop.", "A full game lands later. For now, the seeds are just sitting there, waiting on you."]} /> : null}
              {app === "boutique" ? <NoteScreen title="Boutique" onBack={() => setApp("home")} lines={[`${life.look.outfit} · ${life.look.cloth}`, "New cloth shows up in the room you already wear. The market lanes have the rest."]} /> : null}
              {app === "light" ? <NoteScreen title="Light" onBack={() => setApp("home")} lines={[life.dumsor ? "Dumsor. The estate is dark." : "Current is on.", life.inventory.includes("generator") ? "Your generator can carry the room." : life.inventory.includes("bulb") ? "The rechargeable bulb is in the room." : "A bulb or a generator is in the catalogue."]} /> : null}
              {app === "settings" ? (
                <SettingsApp email={email} onBack={() => setApp("home")} onEmail={onEmail} onLogout={onLogout} onMenu={onClose} onNewLife={onNewLife} />
              ) : null}
            </div>
            <button type="button" onClick={homeBar} className={`absolute bottom-2 left-1/2 z-20 h-1.5 w-28 -translate-x-1/2 rounded-full ${inApp ? "bg-black/30" : "bg-white/90"}`} aria-label={app === "home" && !thread ? "Put the phone down" : "Back"} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Status({ time, battery, ink }: { time: string; battery: number; ink: "light" | "dark" }) {
  const color = ink === "dark" ? "text-[#16203c]" : "text-white";
  return (
    <div className={`relative z-10 flex items-center justify-between px-6 pt-3 text-[12px] font-semibold ${color}`}>
      <span>{time}</span>
      <span className="absolute left-1/2 top-2 h-6 w-24 -translate-x-1/2 rounded-full bg-black" />
      <span className="flex items-center gap-1.5">
        <Signal />
        <span className="text-[10px]">5G</span>
        <span className={`relative h-2.5 w-6 rounded-[3px] border ${ink === "dark" ? "border-[#16203c]/70" : "border-white/80"}`}>
          <span className={`absolute inset-y-[1px] left-[1px] rounded-[2px] ${ink === "dark" ? "bg-[#16203c]" : "bg-white"}`} style={{ width: `${Math.max(8, battery - 8)}%` }} />
        </span>
      </span>
    </div>
  );
}

function Signal() {
  return (
    <span className="flex items-end gap-[1px]" aria-hidden>
      {[4, 6, 8, 10].map((height) => (
        <span key={height} className="w-[2px] rounded-sm bg-current" style={{ height }} />
      ))}
    </span>
  );
}

function npcReply(name: string, text: string) {
  const lines = [
    "I hear you. I am still here.",
    "Say less. Come stand with me.",
    "😂 Okay. Text me when you are leaving.",
    "The place is still full. Do not rush off.",
    "I saved your message. Answer when you can.",
  ];
  let n = 0;
  for (const char of `${name}:${text}`) n = (n * 33 + char.charCodeAt(0)) % lines.length;
  return lines[n];
}

function longDate(minutes: number) {
  const day = Math.floor(minutes / 1440);
  const date = new Date(2026, 9, 5 + day);
  const weekday = date.toLocaleString("en-GH", { weekday: "long" });
  const month = date.toLocaleString("en-GH", { month: "long" });
  return `${weekday} ${date.getDate()} ${month} · Accra`;
}

function HomeScreen({
  date,
  time,
  inbox,
  onOpen,
  onRide,
  onMarket,
}: {
  date: string;
  time: string;
  inbox: number;
  onOpen: (app: AppId) => void;
  onRide: () => void;
  onMarket: () => void;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-auto px-4 pb-8 pt-3 text-white">
      <p className="text-center text-[52px] font-semibold leading-none tracking-tight">{time}</p>
      <p className="mt-1 text-center text-[13px] text-white/85">{date}</p>
      <div className="mt-5 grid grid-cols-4 gap-x-1 gap-y-4">
        <AppIcon label="Jobs" color="#3cba78" onClick={() => onOpen("work")}>
          <Briefcase />
        </AppIcon>
        <AppIcon label="Messages" color="#5b8def" badge={inbox} onClick={() => onOpen("messages")}>
          <Bubble />
        </AppIcon>
        <AppIcon label="Radio" color="#1c1c1c" onClick={() => onOpen("radio")}>
          <Disc />
        </AppIcon>
        <AppIcon label="Market" color="#2f9d62" onClick={onMarket}>
          <Basket />
        </AppIcon>
        <AppIcon label="Ride" color="#f0b429" onClick={onRide}>
          <Van />
        </AppIcon>
        <AppIcon label="Contacts" color="#7a5af5" onClick={() => onOpen("contacts")}>
          <PhoneMark />
        </AppIcon>
        <AppIcon label="Dream" color="#f08a3c" onClick={() => onOpen("goals")}>
          <Star />
        </AppIcon>
        <AppIcon label="MoMo" color="#f5c542" onClick={() => onOpen("momo")}>
          <WalletMark />
        </AppIcon>
        <AppIcon label="City desk" color="#243044" onClick={() => onOpen("news")}>
          <Paper />
        </AppIcon>
        <AppIcon label="Oware" color="#f4efe6" onClick={() => onOpen("games")}>
          <Seeds />
        </AppIcon>
        <AppIcon label="Boutique" color="#c45c9a" onClick={() => onOpen("boutique")}>
          <Hanger />
        </AppIcon>
        <AppIcon label="Light" color="#fff4c2" onClick={() => onOpen("light")}>
          <Bulb />
        </AppIcon>
        <AppIcon label="Settings" color="#e7edf5" onClick={() => onOpen("settings")}>
          <Gear />
        </AppIcon>
      </div>
      <div className="mt-auto grid grid-cols-4 gap-2 rounded-[28px] bg-white/25 p-3 backdrop-blur">
        <AppIcon label="Messages" color="#25d366" onClick={() => onOpen("messages")}>
          <Bubble />
        </AppIcon>
        <AppIcon label="MoMo" color="#111" onClick={() => onOpen("momo")}>
          <WalletMark />
        </AppIcon>
        <AppIcon label="Jobs" color="#16203c" onClick={() => onOpen("work")}>
          <Briefcase />
        </AppIcon>
        <AppIcon label="Ride" color="#e23d3d" onClick={onRide}>
          <Van />
        </AppIcon>
      </div>
    </div>
  );
}

function Skyline() {
  return (
    <svg viewBox="0 0 390 120" className="pointer-events-none absolute inset-x-0 bottom-0 h-28 w-full" aria-hidden>
      <path fill="rgba(20,16,40,.35)" d="M0 78h28v42H0zm36 18h22v24H36zm30-30h18v54H66zm26 12h40v42H92zm48-22h16v64h-16zm24 8h30v56h-30zm38-16h20v72h-20zm28 20h34v52h-34zm42-8h18v60h-18zm26 14h40v46h-40z" />
    </svg>
  );
}

function ContactsScreen({ life, onBack, onOpen }: { life: Life; onBack: () => void; onOpen: (id: string) => void }) {
  const people = life.relations.length ? life.relations : [{ name: homeById(life.homeId).neighbor, score: 10 }];
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[#f6f1ea] text-[#16203c]">
      <AppHeader title="Contacts" onBack={onBack} />
      <div className="min-h-0 flex-1 overflow-auto">
        {people.map((person) => (
          <ThreadRow key={person.name} name={person.name} preview={person.score >= 70 ? "Close" : "In your book"} time="" onClick={() => onOpen(person.name)} />
        ))}
      </div>
    </div>
  );
}

function NoteScreen({ title, lines, onBack }: { title: string; lines: string[]; onBack: () => void }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[#f4f7fb] text-[#16203c]">
      <AppHeader title={title} onBack={onBack} />
      <div className="min-h-0 flex-1 space-y-3 overflow-auto px-4 py-4">
        {lines.map((line) => (
          <p key={line} className="rounded-2xl bg-white px-4 py-3 text-sm leading-6 shadow-sm">
            {line}
          </p>
        ))}
      </div>
    </div>
  );
}

function AppIcon({ label, color, badge, onClick, children }: { label: string; color: string; badge?: number; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} className="flex flex-col items-center gap-1">
      <span className="relative grid h-[52px] w-[52px] place-items-center rounded-[16px] text-white shadow-md" style={{ background: color }}>
        {children}
        {badge ? <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-[#ff3b30] px-1 text-[10px] font-bold">{badge > 9 ? "9+" : badge}</span> : null}
      </span>
      <span className="max-w-[68px] truncate text-[11px] font-medium drop-shadow">{label}</span>
    </button>
  );
}

function ThreadRow({ name, preview, time, onClick }: { name: string; preview: string; time: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex w-full items-center gap-3 border-b border-black/5 px-4 py-3 text-left">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#d7c4a3] text-sm font-bold">{name.slice(0, 1)}</span>
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-2">
          <span className="truncate font-semibold">{name}</span>
          <span className="shrink-0 text-[11px] text-[#6b7c93]">{time}</span>
        </span>
        <span className="mt-0.5 block truncate text-sm text-[#5c6b82]">{preview}</span>
      </span>
    </button>
  );
}

function WorkScreen({ life, onBack, onWork }: { life: Life; onBack: () => void; onWork: (jobId: string) => void }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[#f4f7fb] text-[#16203c]">
      <AppHeader title="Jobs" onBack={onBack} />
      <div className="min-h-0 flex-1 space-y-2 overflow-auto px-3 py-3">
        <p className="px-1 text-xs text-[#5c6b82]">Career level {careerLevel(life)}. A shift needs energy, and trotro fare if you are not already there.</p>
        {JOBS.map((job) => (
          <button key={job.id} type="button" onClick={() => onWork(job.id)} className="block w-full rounded-2xl bg-white px-4 py-3 text-left shadow-sm">
            <span className="font-semibold">{job.title}</span>
            <span className="mt-1 block text-sm text-[#5c6b82]">
              {cedis(job.verb.earn * careerLevel(life))} · {Math.round(job.verb.minutes / 60)} hrs · {spotById(job.place).name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function GoalsScreen({ life, onBack }: { life: Life; onBack: () => void }) {
  const dream = DREAMS.find((item) => item.id === life.dream);
  const status = dreamStatus(life);
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[#f4f7fb] text-[#16203c]">
      <AppHeader title="Dream" onBack={onBack} />
      <div className="min-h-0 flex-1 overflow-auto px-4 py-4">
        <p className="font-display text-2xl">
          {dream?.emoji} {dream?.name}
        </p>
        <p className="mt-1 text-sm text-[#5c6b82]">{dream?.detail}</p>
        <div className="mt-4 h-2 rounded-full bg-[#e7edf5]">
          <div className="h-2 rounded-full bg-[#3cba78]" style={{ width: `${Math.min(100, (status.current / status.max) * 100)}%` }} />
        </div>
        <p className="mt-1 text-xs text-[#5c6b82]">
          {status.label}: {status.current} / {status.max}
        </p>
        <div className="mt-4 space-y-2">
          {life.relations.map((person) => (
            <p key={person.name} className="flex justify-between rounded-2xl bg-white px-4 py-3 text-sm shadow-sm">
              <span>{person.name}</span>
              <span>{person.score >= 70 ? "Close" : person.score}</span>
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

function MomoScreen({
  life,
  username,
  onBack,
  onRepay,
  onLogout,
}: {
  life: Life;
  username: string;
  onBack: () => void;
  onRepay: () => void;
  onLogout: () => void;
}) {
  const home = homeById(life.homeId);
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[#f6f1ea] text-[#16203c]">
      <AppHeader title="MoMo" onBack={onBack} tone="yellow" />
      <div className="min-h-0 flex-1 overflow-auto px-4 py-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#8a6a12]">Available</p>
        <p className="font-display text-4xl">{cedis(life.cash)}</p>
        <p className="mt-1 text-sm text-[#5c6b82]">@{username}</p>
        <div className="mt-4 space-y-2 rounded-3xl bg-white p-4 shadow-sm">
          <p className="text-sm">{life.loan > 0 ? `Susu left ${cedis(life.loan)} · ${cedis(life.weeklyLoan)} every Saturday` : "No susu on this line."}</p>
          <p className="text-sm text-[#5c6b82]">
            Rent at {home.name}: {cedis(home.rent)} every Saturday.
          </p>
          {life.loan > 0 ? (
            <button type="button" onClick={onRepay} className="mt-2 w-full rounded-full bg-[#16203c] py-3 text-sm font-bold text-white">
              Pay susu
            </button>
          ) : null}
        </div>
        <button type="button" onClick={onLogout} className="mt-4 w-full rounded-full bg-white py-3 text-sm font-semibold shadow-sm">
          Log out
        </button>
      </div>
    </div>
  );
}

function AppHeader({ title, onBack, tone = "dark" }: { title: string; onBack: () => void; tone?: "dark" | "green" | "yellow" }) {
  const bar = tone === "green" ? "bg-[#075e54] text-white" : tone === "yellow" ? "bg-[#f5c542] text-[#16203c]" : "bg-white text-[#16203c]";
  return (
    <div className={`flex items-center gap-2 px-2 py-2 ${bar}`}>
      <button type="button" onClick={onBack} className="grid h-9 w-9 place-items-center rounded-full text-lg" aria-label="Back">
        ‹
      </button>
      <p className="font-semibold">{title}</p>
    </div>
  );
}

function Bubble() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7 fill-white" aria-hidden>
      <path d="M5 6h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H9l-4 3v-3H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z" />
    </svg>
  );
}

function Briefcase() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7 fill-white" aria-hidden>
      <path d="M9 7V6a3 3 0 0 1 6 0v1h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h3zm2 0h2V6a1 1 0 0 0-2 0v1z" />
    </svg>
  );
}

function Star() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7 fill-white" aria-hidden>
      <path d="M12 3l2.4 5.6L20 9.2l-4 3.8.9 6L12 16.8 7.1 19l.9-6-4-3.8 5.6-.6L12 3z" />
    </svg>
  );
}

function Disc() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" aria-hidden>
      <circle cx="12" cy="12" r="8" fill="none" stroke="#3cba78" strokeWidth="2" />
      <circle cx="12" cy="12" r="2" fill="#3cba78" />
    </svg>
  );
}

function Basket() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7 fill-white" aria-hidden>
      <path d="M6 9h12l-1.2 9H7.2L6 9zm2.2-3h7.6l1 3H7.2l1-3z" />
    </svg>
  );
}

function Van() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7 fill-current" aria-hidden>
      <path d="M3 8h11v8H3V8zm11 2h4l3 3v3h-7v-6zM7 18a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm10 0a2 2 0 1 1 0-4 2 2 0 0 1 0 4z" />
    </svg>
  );
}

function PhoneMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7 fill-white" aria-hidden>
      <path d="M8 3h3l1 4-2 1a12 12 0 0 0 6 6l1-2 4 1v3a2 2 0 0 1-2 2A16 16 0 0 1 6 5a2 2 0 0 1 2-2z" />
    </svg>
  );
}

function Paper() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7 fill-white" aria-hidden>
      <path d="M7 3h8l4 4v14H7V3zm8 1.5V8h3.5L15 4.5zM9 12h6v1.5H9V12zm0 3h6v1.5H9V15z" />
    </svg>
  );
}

function Seeds() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" aria-hidden>
      <circle cx="8" cy="10" r="2.2" fill="#16203c" />
      <circle cx="14" cy="8" r="2.2" fill="#16203c" />
      <circle cx="16" cy="14" r="2.2" fill="#16203c" />
      <circle cx="10" cy="15" r="2.2" fill="#16203c" />
    </svg>
  );
}

function Hanger() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7 fill-white" aria-hidden>
      <path d="M12 6a2 2 0 1 1 0 4h-.2L20 16H4l8.2-6H12V6z" />
    </svg>
  );
}

function Bulb() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7 fill-[#f0b429]" aria-hidden>
      <path d="M12 3a6 6 0 0 1 3 11.2V16H9v-1.8A6 6 0 0 1 12 3zm-1.5 15h3v1.2a1.5 1.5 0 0 1-3 0V18z" />
    </svg>
  );
}

function Gear() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7 fill-[#16203c]" aria-hidden>
      <path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zm8.2 2.6-.9-.2a6.8 6.8 0 0 0-.7-1.6l.5-.8a1 1 0 0 0-.2-1.3l-1.1-1.1a1 1 0 0 0-1.3-.2l-.8.5a6.8 6.8 0 0 0-1.6-.7l-.2-.9a1 1 0 0 0-1-0.8h-1.6a1 1 0 0 0-1 .8l-.2.9a6.8 6.8 0 0 0-1.6.7l-.8-.5a1 1 0 0 0-1.3.2L4.1 7.2a1 1 0 0 0-.2 1.3l.5.8a6.8 6.8 0 0 0-.7 1.6l-.9.2a1 1 0 0 0-.8 1v1.6a1 1 0 0 0 .8 1l.9.2c.1.6.4 1.1.7 1.6l-.5.8a1 1 0 0 0 .2 1.3l1.1 1.1a1 1 0 0 0 1.3.2l.8-.5c.5.3 1 .6 1.6.7l.2.9a1 1 0 0 0 1 .8h1.6a1 1 0 0 0 1-.8l.2-.9c.6-.1 1.1-.4 1.6-.7l.8.5a1 1 0 0 0 1.3-.2l1.1-1.1a1 1 0 0 0 .2-1.3l-.5-.8c.3-.5.6-1 .7-1.6l.9-.2a1 1 0 0 0 .8-1v-1.6a1 1 0 0 0-.8-1z" />
    </svg>
  );
}

function WalletMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7 fill-current" aria-hidden>
      <path d="M4 7a3 3 0 0 1 3-3h11v2H7a1 1 0 0 0 0 2h11a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H7a3 3 0 0 1-3-3V7zm12 7a1.4 1.4 0 1 0 0-2.8 1.4 1.4 0 0 0 0 2.8z" />
    </svg>
  );
}
