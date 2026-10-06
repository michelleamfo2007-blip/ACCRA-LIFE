"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { IsoHuman } from "@/components/game/iso-human";
import { MessagesApp, SettingsApp, type ChatMsg } from "@/components/game/phone-social";
import { BizApp } from "@/components/game/biz-app";
import { BadgesApp, FamilyApp, FarmApp, GarageApp, HealthApp, LandApp, SchoolApp, StudioApp, TailorApp } from "@/components/game/life-apps";
import { CrewApp, EventsApp, GamesApp, LeaderApp } from "@/components/game/play-apps";
import { PeopleApp, SusuApp, type NetAction } from "@/components/game/social-apps";
import { AlertsApp, BankApp, CalendarApp, CommunityApp, FeedApp, FleetApp, FootballApp, GuideApp, MarketApp, PetsApp, StoriesApp } from "@/components/game/town-apps";
import { alertsFor } from "@/lib/game/alerts";
import { streakState } from "@/lib/game/badges";
import { guideLeft } from "@/lib/game/guide";
import { storyReady } from "@/lib/game/story";
import { parseGroupThread, type SocialView } from "@/lib/game/net";
import {
  CLOTHES,
  CLOTHS,
  DREAMS,
  JOBS,
  OUTFITS,
  careerLevel,
  cedis,
  accraDateLabel,
  clockLabel,
  dreamStatus,
  handleOf,
  hasCurrent,
  homeById,
  invitePerson,
  spareChange,
  spotById,
  treatPerson,
  visitPerson,
  type Life,
  type Look,
  type StepResult,
} from "@/lib/game/world";

type AppId =
  | "home"
  | "messages"
  | "work"
  | "goals"
  | "momo"
  | "contacts"
  | "radio"
  | "news"
  | "games"
  | "boutique"
  | "light"
  | "settings"
  | "biz"
  | "susu"
  | "people"
  | "land"
  | "family"
  | "studio"
  | "school"
  | "garage"
  | "farm"
  | "health"
  | "tailor"
  | "badges"
  | "crew"
  | "events"
  | "leader"
  | "calendar"
  | "stories"
  | "bank"
  | "fleet"
  | "football"
  | "pets"
  | "community"
  | "guide"
  | "alerts"
  | "feed"
  | "trade";

const APP_IDS: AppId[] = ["messages", "work", "goals", "momo", "contacts", "radio", "news", "games", "boutique", "light", "settings", "biz", "susu", "people", "land", "family", "studio", "school", "garage", "farm", "health", "tailor", "badges", "crew", "events", "leader", "calendar", "stories", "bank", "fleet", "football", "pets", "community", "guide", "alerts", "feed", "trade"];

export function Handset({
  life,
  username,
  onClose,
  onWork,
  onWear,
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
  onAir,
  unread,
  onRead,
  social,
  cloud,
  asks,
  onNet,
  onVisit,
  friends,
  married,
  raining,
  onGo,
  openTo,
}: {
  openTo?: string | null;
  married: boolean;
  raining: boolean;
  onGo: (spot: string) => void;
  friends: { username: string; name: string }[];
  life: Life;
  username: string;
  unread: Record<string, number>;
  onRead: (id: string) => void;
  social: SocialView | null;
  cloud: boolean;
  asks: number;
  onNet: NetAction;
  onVisit: (host: string) => void;
  onClose: () => void;
  onWork: (jobId: string) => void;
  onWear: (look: Look, cost?: number) => void;
  onRepay: () => void;
  onLogout: () => void;
  onRide: () => void;
  onMarket: () => void;
  email: string;
  players: { username: string; name: string }[];
  onEmail: (email: string) => void;
  onNewLife: () => void;
  onSocial: (result: StepResult) => void;
  onPay: (name: string, handle: string, amount: number) => string | null | Promise<string | null>;
  launch: { id: string } | null;
  onLaunchConsumed: () => void;
  onAir: (playing: boolean) => void;
}) {
  const [app, setApp] = useState<AppId>(launch ? "messages" : openTo && APP_IDS.includes(openTo as AppId) ? (openTo as AppId) : "home");
  const [thread, setThread] = useState<string | null>(launch?.id ?? null);
  const [chats, setChats] = useState<Record<string, ChatMsg[]>>({});
  const [blocked, setBlocked] = useState<string[]>([]);
  const readRef = useRef(onRead);
  useEffect(() => {
    readRef.current = onRead;
  });
  const groups = (social?.groups ?? []).map((group) => ({ id: `group:${group.owner}:${group.id}`, name: group.name, last: group.last, time: group.time, members: group.members }));
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);
  const clock = now == null ? "" : clockLabel(undefined, new Date(now));
  const time = clock.split(" · ")[1] ?? clock;

  useEffect(() => {
    if (!launch) return;
    setApp("messages");
    setThread(launch.id);
    readRef.current(launch.id);
    onLaunchConsumed();
  }, [launch, onLaunchConsumed]);
  useEffect(() => {
    onAir(app === "radio");
  }, [app, onAir]);
  useEffect(() => {
    const room = thread ? parseGroupThread(thread) : null;
    if (!thread || (!thread.startsWith("user:") && !room)) return;
    const url = room ? `/api/live/social?group=${encodeURIComponent(`${room.owner}:${room.id}`)}` : `/api/live/chat?with=${encodeURIComponent(thread.slice(5))}`;
    let stop = false;
    const load = () => {
      fetch(url)
        .then((response) => response.json())
        .then((payload: { messages?: ChatMsg[]; group?: { messages: { who: "me" | "them"; from: string; text: string; time: string }[] } }) => {
          const lines = room ? payload.group?.messages.map((mail) => ({ who: mail.who, time: mail.time, text: mail.who === "me" ? mail.text : `@${mail.from}: ${mail.text}` })) : payload.messages;
          if (stop || !Array.isArray(lines)) return;
          setChats((current) => ({ ...current, [thread]: lines }));
          readRef.current(thread);
        })
        .catch(() => {});
    };
    load();
    const id = window.setInterval(load, 4000);
    return () => {
      stop = true;
      window.clearInterval(id);
    };
  }, [thread]);

  useEffect(() => () => onAir(false), [onAir]);
  const battery = Math.max(8, Math.min(100, life.needs.energy));
  const inApp = app !== "home" || Boolean(thread);
  const unreadTotal = Object.values(unread).reduce((sum, count) => sum + count, 0);

  function openApp(id: string) {
    setApp(APP_IDS.includes(id as AppId) ? (id as AppId) : "home");
  }

  function openThread(id: string) {
    setThread(id);
    setApp("messages");
    onRead(id);
  }

  function pushChat(id: string, message: ChatMsg) {
    setChats((current) => {
      const base = current[id] ?? [];
      return { ...current, [id]: [...base, message] };
    });
  }

  function personName(id: string) {
    if (id.startsWith("user:")) return players.find((player) => player.username === id.slice(5))?.name ?? id.slice(5);
    if (id.startsWith("group:")) return groups.find((group) => group.id === id)?.name ?? "Group";
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
      <button type="button" onClick={onClose} className="absolute right-4 top-4 z-50 rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#121212] shadow">
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
                <HomeScreen date={now == null ? "Accra" : longDate(new Date(now))} time={time || "--:--"} inbox={unreadTotal} asks={asks} daily={now != null && !streakState(life, now).claimed} sick={Boolean(life.health?.sick)} alerts={alertsFor(life).length} stories={storyReady(life)} guide={guideLeft(life).filter((step) => step.done(life)).length} onOpen={setApp} onRide={onRide} onMarket={onMarket} />
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
                  onCreateGroup={async (name, members) => {
                    if (!cloud) return "Groups need an online account.";
                    const response = await fetch("/api/live/social", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "group-create", name, members }) });
                    const payload = (await response.json().catch(() => null)) as { error?: string; ref?: { owner: string; id: string } } | null;
                    if (!response.ok || !payload?.ref) return payload?.error ?? "The group did not save.";
                    void onNet({ action: "refresh" });
                    openThread(`group:${payload.ref.owner}:${payload.ref.id}`);
                    return null;
                  }}
                  onBack={() => (thread ? setThread(null) : setApp("home"))}
                  onSend={(text) => {
                    if (!thread) return;
                    pushChat(thread, { who: "me", text, time });
                    const room = parseGroupThread(thread);
                    if (room) {
                      void fetch("/api/live/social", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "group-send", owner: room.owner, id: room.id, text }) })
                        .then((response) => response.json())
                        .then((payload: { error?: string }) => {
                          if (payload.error) pushChat(thread, { who: "note", text: payload.error, time });
                        })
                        .catch(() => pushChat(thread, { who: "note", text: "The message did not leave this phone.", time }));
                      return;
                    }
                    if (!thread.startsWith("user:")) {
                      pushChat(thread, { who: "note", text: "That chat is not a real account.", time });
                      return;
                    }
                    const to = thread.slice(5);
                    void fetch("/api/live/chat", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ to, text }),
                    })
                      .then((response) => response.json())
                      .then((payload: { error?: string; messages?: ChatMsg[] }) => {
                        if (payload.messages) setChats((current) => ({ ...current, [thread]: payload.messages ?? [] }));
                        else if (payload.error) pushChat(thread, { who: "note", text: payload.error, time });
                      })
                      .catch(() => pushChat(thread, { who: "note", text: "The message did not leave this phone.", time }));
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
                      void Promise.resolve(onPay(name, handle, value)).then((error) => {
                        pushChat(thread, { who: "note", text: error ?? `You sent ${handle} ${cedis(value)}`, time });
                      });
                      return;
                    }
                    if (cloud && thread.startsWith("user:") && (kind === "invite" || kind === "visit")) {
                      const other = thread.slice(5);
                      if (kind === "visit") {
                        onVisit(other);
                        return;
                      }
                      void onNet({ action: "invite", to: other }).then((error) => {
                        pushChat(thread, { who: "note", text: error ?? `You invited @${other} over. They can visit for the next day.`, time });
                        if (!error) onSocial(invitePerson(life, name));
                      });
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
              {app === "radio" ? <NoteScreen title="Radio" onBack={() => setApp("home")} lines={["Joy FM is on.", "Highlife, a gospel hour, and whoever just walked into the studio."]} /> : null}
              {app === "news" ? <NoteScreen title="City desk" onBack={() => setApp("home")} lines={life.inbox.length ? life.inbox : ["Accra is moving. Your phone will hear about it."]} /> : null}
              {app === "games" ? <GamesApp me={username} life={life} cloud={cloud} onBack={() => setApp("home")} onApply={onSocial} onNet={onNet} /> : null}
              {app === "land" ? <LandApp life={life} onBack={() => setApp("home")} onApply={onSocial} /> : null}
              {app === "family" ? <FamilyApp life={life} married={married} onBack={() => setApp("home")} onApply={onSocial} /> : null}
              {app === "studio" ? <StudioApp life={life} onBack={() => setApp("home")} onApply={onSocial} /> : null}
              {app === "school" ? <SchoolApp life={life} onBack={() => setApp("home")} onApply={onSocial} /> : null}
              {app === "garage" ? <GarageApp life={life} onBack={() => setApp("home")} onApply={onSocial} /> : null}
              {app === "farm" ? <FarmApp life={life} raining={raining} onBack={() => setApp("home")} onApply={onSocial} /> : null}
              {app === "health" ? <HealthApp life={life} onBack={() => setApp("home")} onApply={onSocial} /> : null}
              {app === "tailor" ? <TailorApp life={life} onBack={() => setApp("home")} onApply={onSocial} /> : null}
              {app === "badges" ? <BadgesApp life={life} onBack={() => setApp("home")} onApply={onSocial} /> : null}
              {app === "crew" ? <CrewApp me={username} life={life} cloud={cloud} onBack={() => setApp("home")} onNet={onNet} onVisit={onVisit} /> : null}
              {app === "events" ? <EventsApp me={username} life={life} cloud={cloud} onBack={() => setApp("home")} onNet={onNet} onGo={onGo} /> : null}
              {app === "leader" ? <LeaderApp me={username} life={life} cloud={cloud} onBack={() => setApp("home")} /> : null}
              {app === "calendar" ? <CalendarApp life={life} onBack={() => setApp("home")} onGo={onGo} /> : null}
              {app === "stories" ? <StoriesApp life={life} onBack={() => setApp("home")} onApply={onSocial} onGo={onGo} /> : null}
              {app === "bank" ? <BankApp life={life} onBack={() => setApp("home")} onApply={onSocial} /> : null}
              {app === "fleet" ? <FleetApp life={life} onBack={() => setApp("home")} onApply={onSocial} /> : null}
              {app === "football" ? <FootballApp me={username} life={life} cloud={cloud} onBack={() => setApp("home")} onApply={onSocial} onNet={onNet} /> : null}
              {app === "pets" ? <PetsApp life={life} onBack={() => setApp("home")} onApply={onSocial} /> : null}
              {app === "community" ? <CommunityApp me={username} life={life} cloud={cloud} onBack={() => setApp("home")} onApply={onSocial} onNet={onNet} onGo={onGo} /> : null}
              {app === "guide" ? <GuideApp life={life} onBack={() => setApp("home")} onApply={onSocial} onOpen={openApp} /> : null}
              {app === "alerts" ? <AlertsApp life={life} onBack={() => setApp("home")} onOpen={openApp} /> : null}
              {app === "feed" ? <FeedApp life={life} cloud={cloud} onBack={() => setApp("home")} onNet={onNet} /> : null}
              {app === "trade" ? <MarketApp life={life} cloud={cloud} onBack={() => setApp("home")} onNet={onNet} /> : null}
              {app === "boutique" ? <BoutiqueScreen life={life} onBack={() => setApp("home")} onWear={onWear} /> : null}
              {app === "light" ? <NoteScreen title="Light" onBack={() => setApp("home")} lines={[life.dumsor ? "Dumsor. The estate is dark." : "Current is on.", hasCurrent(life.inventory) ? "Your gen or solar can carry the room." : life.inventory.includes("bulb") ? "The rechargeable bulb is in the room." : "A bulb, a gen, or solar is in the catalogue."]} /> : null}
              {app === "biz" ? <BizApp life={life} onBack={() => setApp("home")} onApply={onSocial} /> : null}
              {app === "susu" ? <SusuApp me={username} life={life} social={social} cloud={cloud} onBack={() => setApp("home")} onAction={onNet} /> : null}
              {app === "people" ? (
                <PeopleApp
                  me={username}
                  life={life}
                  social={social}
                  cloud={cloud}
                  friends={friends}
                  onBack={() => setApp("home")}
                  onAction={onNet}
                  onVisit={onVisit}
                  onChat={(other) => openThread(`user:${other}`)}
                />
              ) : null}
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
  const color = ink === "dark" ? "text-[#121212]" : "text-white";
  return (
    <div className={`relative z-10 flex items-center justify-between px-6 pt-3 text-[12px] font-semibold ${color}`}>
      <span>{time}</span>
      <span className="absolute left-1/2 top-2 h-6 w-24 -translate-x-1/2 rounded-full bg-black" />
      <span className="flex items-center gap-1.5">
        <Signal />
        <span className="text-[10px]">5G</span>
        <span className={`relative h-2.5 w-6 rounded-[3px] border ${ink === "dark" ? "border-[#121212]/70" : "border-white/80"}`}>
          <span className={`absolute inset-y-[1px] left-[1px] rounded-[2px] ${ink === "dark" ? "bg-[#121212]" : "bg-white"}`} style={{ width: `${Math.max(8, battery - 8)}%` }} />
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

function longDate(at = new Date()) {
  return `${accraDateLabel(at)} · Accra`;
}

function HomeScreen({
  date,
  time,
  inbox,
  asks,
  daily,
  sick,
  alerts,
  stories,
  guide,
  onOpen,
  onRide,
  onMarket,
}: {
  date: string;
  time: string;
  inbox: number;
  asks: number;
  daily: boolean;
  sick: boolean;
  alerts: number;
  stories: number;
  guide: number;
  onOpen: (app: AppId) => void;
  onRide: () => void;
  onMarket: () => void;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-auto px-4 pb-8 pt-3 text-white">
      <p className="text-center text-[52px] font-semibold leading-none tracking-tight">{time}</p>
      <p className="mt-1 text-center text-[13px] text-white/85">{date}</p>
      <div className="mt-4 grid grid-cols-4 gap-x-1 gap-y-4">
        <AppIcon label="Alerts" color="#243044" badge={alerts} onClick={() => onOpen("alerts")}>
          <span className="text-2xl">🔔</span>
        </AppIcon>
        <AppIcon label="Messages" color="#5b8def" badge={inbox} onClick={() => onOpen("messages")}>
          <Bubble />
        </AppIcon>
        <AppIcon label="Guide" color="#006B3F" badge={guide} onClick={() => onOpen("guide")}>
          <span className="text-2xl">🧭</span>
        </AppIcon>
        <AppIcon label="Calendar" color="#7a3b0c" onClick={() => onOpen("calendar")}>
          <span className="text-2xl">📅</span>
        </AppIcon>
      </div>
      <Section title="Life">
        <AppIcon label="Jobs" color="#006B3F" onClick={() => onOpen("work")}>
          <Briefcase />
        </AppIcon>
        <AppIcon label="Stories" color="#5c2a86" badge={stories} onClick={() => onOpen("stories")}>
          <span className="text-2xl">📖</span>
        </AppIcon>
        <AppIcon label="Dream" color="#f08a3c" onClick={() => onOpen("goals")}>
          <Star />
        </AppIcon>
        <AppIcon label="Family" color="#e88bbf" onClick={() => onOpen("family")}>
          <span className="text-2xl">👨🏾‍👩🏾‍👧🏾</span>
        </AppIcon>
        <AppIcon label="Pets" color="#8a5a2b" onClick={() => onOpen("pets")}>
          <span className="text-2xl">🐕</span>
        </AppIcon>
        <AppIcon label="Health" color="#0e7c6b" badge={sick ? 1 : 0} onClick={() => onOpen("health")}>
          <span className="text-2xl">🩺</span>
        </AppIcon>
        <AppIcon label="School" color="#1f4e8c" onClick={() => onOpen("school")}>
          <span className="text-2xl">🎓</span>
        </AppIcon>
        <AppIcon label="Garage" color="#243044" onClick={() => onOpen("garage")}>
          <span className="text-2xl">🚗</span>
        </AppIcon>
        <AppIcon label="Ride" color="#f0b429" onClick={onRide}>
          <Van />
        </AppIcon>
        <AppIcon label="Boutique" color="#c45c9a" onClick={() => onOpen("boutique")}>
          <Hanger />
        </AppIcon>
        <AppIcon label="Seamstress" color="#8a2f6a" onClick={() => onOpen("tailor")}>
          <span className="text-2xl">🧵</span>
        </AppIcon>
        <AppIcon label="Light" color="#fff4c2" onClick={() => onOpen("light")}>
          <Bulb />
        </AppIcon>
      </Section>
      <Section title="Money">
        <AppIcon label="MoMo" color="#f5c542" onClick={() => onOpen("momo")}>
          <WalletMark />
        </AppIcon>
        <AppIcon label="Bank" color="#0b3d6b" onClick={() => onOpen("bank")}>
          <span className="text-2xl">🏦</span>
        </AppIcon>
        <AppIcon label="Business" color="#121212" onClick={() => onOpen("biz")}>
          <span className="text-2xl">🏪</span>
        </AppIcon>
        <AppIcon label="Market" color="#006B3F" onClick={onMarket}>
          <Basket />
        </AppIcon>
        <AppIcon label="Buy & Sell" color="#0f766e" onClick={() => onOpen("trade")}>
          <span className="text-2xl">🏷️</span>
        </AppIcon>
        <AppIcon label="Fleet" color="#b45309" onClick={() => onOpen("fleet")}>
          <span className="text-2xl">🚐</span>
        </AppIcon>
        <AppIcon label="Land" color="#6b4423" onClick={() => onOpen("land")}>
          <span className="text-2xl">🏗️</span>
        </AppIcon>
        <AppIcon label="Farm" color="#3f7d20" onClick={() => onOpen("farm")}>
          <span className="text-2xl">🌶️</span>
        </AppIcon>
        <AppIcon label="Susu" color="#006B3F" onClick={() => onOpen("susu")}>
          <span className="text-2xl">🤝</span>
        </AppIcon>
      </Section>
      <Section title="Social">
        <AppIcon label="Feed" color="#c2185b" onClick={() => onOpen("feed")}>
          <span className="text-2xl">📸</span>
        </AppIcon>
        <AppIcon label="People" color="#c45c9a" badge={asks} onClick={() => onOpen("people")}>
          <span className="text-2xl">💞</span>
        </AppIcon>
        <AppIcon label="Contacts" color="#7a5af5" onClick={() => onOpen("contacts")}>
          <PhoneMark />
        </AppIcon>
        <AppIcon label="Crew" color="#121212" onClick={() => onOpen("crew")}>
          <span className="text-2xl">🛡️</span>
        </AppIcon>
        <AppIcon label="Events" color="#4a1d1d" onClick={() => onOpen("events")}>
          <span className="text-2xl">🎉</span>
        </AppIcon>
        <AppIcon label="Community" color="#1e3a5f" onClick={() => onOpen("community")}>
          <span className="text-2xl">⛪</span>
        </AppIcon>
        <AppIcon label="City desk" color="#243044" onClick={() => onOpen("news")}>
          <Paper />
        </AppIcon>
      </Section>
      <Section title="Play">
        <AppIcon label="Games" color="#f4efe6" onClick={() => onOpen("games")}>
          <Seeds />
        </AppIcon>
        <AppIcon label="Football" color="#14532d" onClick={() => onOpen("football")}>
          <span className="text-2xl">⚽</span>
        </AppIcon>
        <AppIcon label="Studio" color="#3b1f5c" onClick={() => onOpen("studio")}>
          <span className="text-2xl">🎙️</span>
        </AppIcon>
        <AppIcon label="Radio" color="#1c1c1c" onClick={() => onOpen("radio")}>
          <Disc />
        </AppIcon>
        <AppIcon label="Badges" color="#b8860b" badge={daily ? 1 : 0} onClick={() => onOpen("badges")}>
          <span className="text-2xl">🏅</span>
        </AppIcon>
        <AppIcon label="Top 10" color="#FCD116" onClick={() => onOpen("leader")}>
          <span className="text-2xl">🏆</span>
        </AppIcon>
        <AppIcon label="Settings" color="#e7edf5" onClick={() => onOpen("settings")}>
          <Gear />
        </AppIcon>
      </Section>
      <div className="mt-auto grid grid-cols-4 gap-2 rounded-[28px] bg-white/25 p-3 backdrop-blur">
        <AppIcon label="Messages" color="#25d366" onClick={() => onOpen("messages")}>
          <Bubble />
        </AppIcon>
        <AppIcon label="MoMo" color="#111" onClick={() => onOpen("momo")}>
          <WalletMark />
        </AppIcon>
        <AppIcon label="Jobs" color="#121212" onClick={() => onOpen("work")}>
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

function ContactsScreen({ onBack, onOpen }: { life: Life; onBack: () => void; onOpen: (id: string) => void }) {
  const [query, setQuery] = useState("");
  const [people, setPeople] = useState<{ username: string; name: string }[]>([]);
  const [notice, setNotice] = useState("");
  async function search(event: FormEvent) {
    event.preventDefault();
    const typed = query.trim().replace(/^@/, "");
    if (!typed) return;
    const response = await fetch(`/api/live/people?q=${encodeURIComponent(typed)}`);
    const payload = (await response.json().catch(() => null)) as { people?: { username: string; name: string }[] } | null;
    const hits = payload?.people ?? [];
    setPeople(hits);
    setNotice(hits.length ? "" : `Nobody in Accra goes by @${typed}.`);
  }
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[#f6f1ea] text-[#121212]">
      <AppHeader title="Contacts" onBack={onBack} />
      <form className="mx-4 mt-3 flex gap-2" onSubmit={search}>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="@username" className="h-10 flex-1 rounded-full bg-white px-4 text-sm outline-none" />
        <button type="submit" className="rounded-full bg-[#121212] px-4 text-sm font-semibold text-white">
          Find
        </button>
      </form>
      {notice ? <p className="px-4 pt-3 text-sm text-[#8b97ab]">{notice}</p> : null}
      <div className="min-h-0 flex-1 overflow-auto">
        {people.map((person) => (
          <ThreadRow key={person.username} name={person.name} preview={`@${person.username}`} time="" onClick={() => onOpen(`user:${person.username}`)} />
        ))}
      </div>
    </div>
  );
}

function NoteScreen({ title, lines, onBack }: { title: string; lines: string[]; onBack: () => void }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[#f4f7fb] text-[#121212]">
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

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mt-5">
      <p className="mb-2 px-1 text-[11px] font-bold uppercase tracking-[0.14em] text-white/80">{title}</p>
      <div className="grid grid-cols-4 gap-x-1 gap-y-4 rounded-[24px] bg-white/10 p-2 backdrop-blur-[2px]">{children}</div>
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

function BoutiqueScreen({ life, onBack, onWear }: { life: Life; onBack: () => void; onWear: (look: Look, cost?: number) => void }) {
  const [wear, setWear] = useState("Everyday");
  const picks = CLOTHES.filter((item) => {
    if (wear === "Sleep") return item.outfit === "All-white" || item.outfit === "Classic";
    if (wear === "Date night") return item.outfit === "Office" || item.outfit === "Classic";
    if (wear === "Home") return item.outfit === "Casual" || item.outfit === "Classic";
    return true;
  });
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[#f6f1ea] text-[#121212]">
      <AppHeader title="Accra Boutique" onBack={onBack} />
      <div className="relative grid h-40 place-items-center bg-gradient-to-b from-[#f3e4ff] to-[#fff6df]">
        <IsoHuman skin={life.look.skin} shirt={life.look.cloth} hair={life.look.hair} cloth={life.look.cloth} className="h-36" />
        <p className="absolute bottom-2 left-3 rounded-full bg-white px-3 py-1 text-[11px] font-semibold shadow">Your look today</p>
      </div>
      <div className="flex gap-2 overflow-auto px-3 py-2 text-xs font-semibold">
        {["Everyday", "Home", "Sleep", "Date night"].map((item) => (
          <button key={item} type="button" onClick={() => setWear(item)} className={`shrink-0 rounded-full px-3 py-1.5 ${wear === item ? "bg-[#CE1126] text-white" : "bg-white"}`}>
            {item}
          </button>
        ))}
      </div>
      <div className="min-h-0 flex-1 space-y-2 overflow-auto px-3 pb-4">
        {picks.map((item) => (
          <button key={item.id} type="button" onClick={() => onWear({ ...life.look, outfit: item.outfit ?? life.look.outfit, cloth: item.cloth ?? life.look.cloth }, item.cost)} className={`block w-full rounded-2xl bg-white px-4 py-3 text-left shadow-sm ${life.look.outfit === item.outfit ? "ring-2 ring-[#006B3F]" : ""}`}>
            <span className="flex items-center justify-between gap-2">
              <span className="font-semibold">{item.label}</span>
              <span className="text-sm font-bold text-[#006B3F]">{cedis(item.cost)}</span>
            </span>
            <span className="mt-1 block text-xs text-[#5c6b82]">{item.detail} Wear it for {wear.toLowerCase()}.</span>
          </button>
        ))}
        <div className="flex flex-wrap gap-2 pt-1">
          {CLOTHS.map((cloth) => (
            <button key={cloth} type="button" aria-label="Cloth colour" onClick={() => onWear({ ...life.look, cloth })} className={`h-8 w-8 rounded-full border-2 ${life.look.cloth === cloth ? "border-[#121212]" : "border-white"}`} style={{ background: cloth }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function WorkScreen({ life, onBack, onWork }: { life: Life; onBack: () => void; onWork: (jobId: string) => void }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[#f4f7fb] text-[#121212]">
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
    <div className="flex min-h-0 flex-1 flex-col bg-[#f4f7fb] text-[#121212]">
      <AppHeader title="Dream" onBack={onBack} />
      <div className="min-h-0 flex-1 overflow-auto px-4 py-4">
        <p className="font-display text-2xl">
          {dream?.emoji} {dream?.name}
        </p>
        <p className="mt-1 text-sm text-[#5c6b82]">{dream?.detail}</p>
        <div className="mt-4 h-2 rounded-full bg-[#e7edf5]">
          <div className="h-2 rounded-full bg-[#006B3F]" style={{ width: `${Math.min(100, (status.current / status.max) * 100)}%` }} />
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
    <div className="flex min-h-0 flex-1 flex-col bg-[#f6f1ea] text-[#121212]">
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
            <button type="button" onClick={onRepay} className="mt-2 w-full rounded-full bg-[#121212] py-3 text-sm font-bold text-white">
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
  const bar = tone === "green" ? "bg-[#075e54] text-white" : tone === "yellow" ? "bg-[#f5c542] text-[#121212]" : "bg-white text-[#121212]";
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
      <circle cx="12" cy="12" r="8" fill="none" stroke="#006B3F" strokeWidth="2" />
      <circle cx="12" cy="12" r="2" fill="#006B3F" />
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
      <circle cx="8" cy="10" r="2.2" fill="#121212" />
      <circle cx="14" cy="8" r="2.2" fill="#121212" />
      <circle cx="16" cy="14" r="2.2" fill="#121212" />
      <circle cx="10" cy="15" r="2.2" fill="#121212" />
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
    <svg viewBox="0 0 24 24" className="h-7 w-7 fill-[#121212]" aria-hidden>
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
