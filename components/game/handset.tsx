"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { IsoHuman } from "@/components/game/iso-human";
import { NameSuggest } from "@/components/game/name-hints";
import { MessagesApp, SettingsApp, type ChatMsg } from "@/components/game/phone-social";
import { BizApp } from "@/components/game/biz-app";
import { JusticeApp } from "@/components/game/justice-app";
import { BetTable } from "@/components/game/bet-table";
import { SpineApp } from "@/components/game/spine-app";
import { BadgesApp, FamilyApp, FarmApp, GarageApp, HealthApp, LandApp, SchoolApp, StudioApp, TailorApp } from "@/components/game/life-apps";
import { CrewApp, EventsApp, GamesApp, LeaderApp } from "@/components/game/play-apps";
import { HomeApp, InviteApp, TurfApp } from "@/components/game/ladder-apps";
import { PeopleApp, SusuApp, type NetAction } from "@/components/game/social-apps";
import { AlertsApp, BankApp, CalendarApp, CommunityApp, FeedApp, FleetApp, FootballApp, GuideApp, MarketApp, PetsApp, StoriesApp } from "@/components/game/town-apps";
import { HUSTLES, MONEY_LINE, doHustle, hustleLabel, hustleLock, nextMoneyStep } from "@/lib/game/money-path";
import {
  WALLPAPERS,
  chargePhone,
  cloutTier,
  followersOf,
  hasSignal,
  hideApp,
  lastPost,
  phoneNotices,
  phoneOf,
  replacePhone,
  setWallpaper,
  todayCards,
  topUpAirtime,
  useAirtime,
  wallpaperCss,
  wallpaperOf,
} from "@/lib/game/phone-shell";
import { ChartsApp, ChopApp, TripsApp } from "@/components/game/city-apps";
import { askPrice, buyGarment, RACK, TIERS, wearGarment, type RackItem, type Tier } from "@/lib/game/boutique";
import { ADDRESSES, MENU, RIDERS, collectErrand, errandLine, placeErrand, rateDrop } from "@/lib/game/errand";
import { alertsFor } from "@/lib/game/alerts";
import { streakState } from "@/lib/game/badges";
import { guideLeft } from "@/lib/game/guide";
import { askPromotion, nextRank } from "@/lib/game/ladder";
import { askOver } from "@/lib/game/home-life";
import { callPerson, cloutOf, postClout, textPerson, weatherBrief, type CallKind } from "@/lib/game/phone-life";
import { storyReady } from "@/lib/game/story";
import { parseGroupThread, type SocialView } from "@/lib/game/net";
import type { Weather } from "@/lib/game/sky";
import {
  CLOTHES,
  CLOTHS,
  DREAMS,
  JOBS,
  JOB_RANKS,
  OUTFITS,
  RANK_PAY,
  careerLevel,
  cedis,
  accraDateLabel,
  clockLabel,
  dreamStatus,
  handleOf,
  hasCurrent,
  homeById,
  hourOf,
  moodOf,
  invitePerson,
  rankOf,
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
  | "calls"
  | "memories"
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
  | "trade"
  | "trips"
  | "chop"
  | "charts"
  | "house"
  | "turf"
  | "invite"
  | "photos"
  | "delivery"
  | "bet"
  | "papers"
  | "book"
  | "law";

const APP_IDS: AppId[] = ["messages", "calls", "memories", "work", "goals", "momo", "contacts", "radio", "news", "games", "boutique", "light", "settings", "biz", "susu", "people", "land", "family", "studio", "school", "garage", "farm", "health", "tailor", "badges", "crew", "events", "leader", "calendar", "stories", "bank", "fleet", "football", "pets", "community", "guide", "alerts", "feed", "trade", "trips", "chop", "charts", "house", "turf", "invite", "photos", "delivery", "bet", "papers", "book", "law"];

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
  sky,
  onGo,
  onFly,
  onMap,
  onArrange,
  openTo,
}: {
  openTo?: string | null;
  married: boolean;
  raining: boolean;
  sky: Weather;
  onGo: (spot: string) => void;
  onFly: (routeId: string, cabin: string) => void;
  onMap?: () => void;
  onArrange?: () => void;
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
  const [blocked, setBlocked] = useState<string[]>(() => social?.blocked ?? []);
  useEffect(() => {
    if (social?.blocked) setBlocked(social.blocked.map((name) => `user:${name}`));
  }, [social?.blocked]);
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
    if (!openTo || !APP_IDS.includes(openTo as AppId)) return;
    setApp(openTo as AppId);
  }, [openTo]);
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
          setChats((current) => {
            const local = current[thread] ?? [];
            // Keep optimistic local sends if the server list is still catching up.
            if (local.length > lines.length) {
              const remoteTexts = new Set(lines.map((line) => `${line.who}:${line.text}`));
              const pending = local.filter((line) => line.who === "me" && !remoteTexts.has(`${line.who}:${line.text}`));
              return { ...current, [thread]: [...lines, ...pending] };
            }
            return { ...current, [thread]: lines };
          });
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
  const handset = phoneOf(life);
  const battery = handset.battery;
  const signal = hasSignal(life.where);
  const paper = wallpaperOf(life, sky, hourOf(life.minutes));
  const lost = Boolean(handset.lostUntil && life.minutes < handset.lostUntil);
  const dead = battery <= 0 && !lost;
  const inApp = (app !== "home" || Boolean(thread)) && !lost && !dead;
  const unreadTotal = Object.values(unread).reduce((sum, count) => sum + count, 0);
  const clout = cloutOf(life);
  const weatherLine = weatherBrief(sky, hourOf(life.minutes));

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
      return { ...current, [id]: [...base, { ...message, at: message.at ?? new Date().toISOString() }] };
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
    <div className="absolute inset-0 z-40 grid grid-cols-[minmax(0,1fr)] place-items-center overflow-hidden bg-[#0c1220]/55 px-4 backdrop-blur-[2px]">
      <button type="button" onClick={onClose} className="absolute right-4 top-4 z-50 rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#121212] shadow">
        × Close
      </button>
      <div className="relative h-[min(760px,86dvh)] w-full min-w-0 max-w-[390px]">
        <span className="absolute -left-[3px] top-[22%] h-7 w-[3px] rounded-l-sm bg-[#2c3038]" />
        <span className="absolute -left-[3px] top-[30%] h-12 w-[3px] rounded-l-sm bg-[#2c3038]" />
        <span className="absolute -left-[3px] top-[40%] h-12 w-[3px] rounded-l-sm bg-[#2c3038]" />
        <span className="absolute -right-[3px] top-[32%] h-16 w-[3px] rounded-r-sm bg-[#2c3038]" />
        <div className="flex h-full flex-col rounded-[46px] bg-gradient-to-b from-[#4a4e57] via-[#2a2d33] to-[#16181c] p-[11px] shadow-[0_40px_90px_rgba(0,0,0,.5),inset_0_0_0_1px_rgba(255,255,255,.2)]">
          <div className={`relative min-h-0 flex-1 overflow-hidden rounded-[36px] ${inApp ? "bg-white" : ""}`}>
            {inApp ? null : <div className="pointer-events-none absolute inset-0" style={{ background: wallpaperCss(paper) }} />}
            {inApp ? null : <Skyline />}
            {inApp ? null : <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/30 to-transparent" />}
            <Status time={time} battery={battery} ink={inApp ? "dark" : "light"} signal={signal} />
            <div className="relative flex h-[calc(100%-28px)] flex-col">
              {lost || dead ? (
                <PhoneLock
                  lost={lost}
                  atHome={life.where === "home"}
                  onCharge={() => onSocial(chargePhone(life))}
                  onReplace={() => onSocial(replacePhone(life))}
                  onClose={onClose}
                />
              ) : null}
              {app === "home" && !thread && !lost && !dead ? (
                <HomeScreen
                  date={now == null ? townName(life) : `${longDate(new Date(now)).replace(" · Accra", "")} · ${townName(life)}`}
                  time={time || "--:--"}
                  inbox={unreadTotal}
                  asks={asks}
                  daily={now != null && !streakState(life, now).claimed}
                  sick={Boolean(life.health?.sick)}
                  alerts={phoneNotices(life).length}
                  stories={storyReady(life)}
                  guide={guideLeft(life).filter((step) => step.done(life)).length}
                  cards={todayCards(life, sky, hourOf(life.minutes), weatherLine)}
                  notices={phoneNotices(life)}
                  now={now}
                  mood={`${moodOf(life.needs).emoji} ${moodOf(life.needs).label}`}
                  clout={clout}
                  tier={cloutTier(clout)}
                  followers={followersOf(life)}
                  post={lastPost(life)}
                  airtime={handset.airtime}
                  hidden={handset.hidden}
                  onOpen={setApp}
                  onRide={onRide}
                  onMarket={onMarket}
                  onMap={onMap}
                  onPost={() => onSocial(postClout(life, spotById(life.where).name))}
                  onTopUp={(bundle) => onSocial(topUpAirtime(life, bundle))}
                />
              ) : null}
              {app === "calls" ? <CallsScreen life={life} onBack={() => setApp("home")} onApply={onSocial} /> : null}
              {app === "memories" ? <MemoriesScreen life={life} onBack={() => setApp("home")} /> : null}
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
                    const sent = useAirtime(life, 1);
                    if (sent.error) {
                      pushChat(thread, { who: "note", text: sent.error, time });
                      return;
                    }
                    onSocial(sent);
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
                      if (!thread.startsWith("user:")) {
                        pushChat(thread, { who: "note", text: "Pay a real account by username.", time });
                        return;
                      }
                      const other = thread.slice(5);
                      void Promise.resolve(onPay(name, handle, value)).then((error) => {
                        if (error) {
                          pushChat(thread, { who: "note", text: error, time });
                          return;
                        }
                        pushChat(thread, { who: "me", text: `💸 You sent ${cedis(value)}`, time });
                        // Pull the saved MoMo line from the server so it does not vanish on refresh.
                        void fetch(`/api/live/chat?with=${encodeURIComponent(other)}`)
                          .then((response) => response.json())
                          .then((payload: { messages?: ChatMsg[] }) => {
                            if (Array.isArray(payload.messages)) setChats((current) => ({ ...current, [thread]: payload.messages ?? [] }));
                          })
                          .catch(() => undefined);
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
                        pushChat(thread, { who: "note", text: error ?? `You invited @${other} over. They can Visit from People for the next day.`, time });
                        if (!error) onSocial(invitePerson(life, name, other));
                      });
                      return;
                    }
                    const result = kind === "invite" ? askOver(life, name, "gist") : kind === "visit" ? visitPerson(life, name) : treatPerson(life, name);
                    if (result.error) pushChat(thread, { who: "them", text: result.error, time });
                    else {
                      onSocial(result);
                      pushChat(thread, { who: "note", text: result.notes[0] ?? "Done.", time });
                    }
                  }}
                  onBlock={(id) => {
                    const handle = id.startsWith("user:") ? id.slice(5) : "";
                    if (cloud && handle) {
                      void onNet({ action: "block", to: handle }).then((error) => {
                        if (error) pushChat(id, { who: "note", text: error, time });
                        else {
                          setBlocked((current) => (current.includes(id) ? current : [...current, id]));
                          pushChat(id, { who: "note", text: "Blocked. Their messages stay on their phone.", time });
                        }
                      });
                      return;
                    }
                    setBlocked((current) => (current.includes(id) ? current : [...current, id]));
                    pushChat(id, { who: "note", text: "Blocked. Their messages stay on their phone.", time });
                  }}
                  onReport={(id) => {
                    const handle = id.startsWith("user:") ? id.slice(5) : "";
                    const quote = (chats[id] ?? []).filter((mail) => mail.who === "them").at(-1)?.text ?? "";
                    if (cloud && handle) {
                      void onNet({ action: "report", to: handle, reason: "Chat", quote }).then((error) => {
                        pushChat(id, { who: "note", text: error ?? "Report sent. Accra Life will look at this chat.", time });
                      });
                      return;
                    }
                    pushChat(id, { who: "note", text: "Report sent. Accra Life will look at this chat.", time });
                  }}
                />
              ) : null}
              {app === "work" ? (
                <WorkScreen life={life} onBack={() => setApp("home")} onWork={onWork} onPromote={(jobId) => onSocial(askPromotion(life, jobId))} onHustle={(id) => onSocial(doHustle(life, id))} onOpen={setApp} />
              ) : null}
              {app === "goals" ? <GoalsScreen life={life} onBack={() => setApp("home")} /> : null}
              {app === "book" ? <SpineApp life={life} onBack={() => setApp("home")} onApply={onSocial} /> : null}
              {app === "law" ? <JusticeApp life={life} onBack={() => setApp("home")} onApply={onSocial} /> : null}
              {app === "momo" ? (
                <MomoScreen
                  life={life}
                  username={username}
                  onBack={() => setApp("home")}
                  onRepay={onRepay}
                  onLogout={onLogout}
                  onSend={(handle, amount) => onPay(handle, handle, amount)}
                />
              ) : null}
              {app === "contacts" ? <ContactsScreen life={life} onBack={() => setApp("home")} onOpen={openThread} /> : null}
              {app === "radio" ? <NoteScreen title="Radio" onBack={() => setApp("home")} lines={["Joy FM is on.", "Highlife, a gospel hour, and whoever just walked into the studio."]} /> : null}
              {app === "news" ? <NoteScreen title="City desk" onBack={() => setApp("home")} lines={life.inbox.length ? life.inbox : ["Accra is moving. Your phone will hear about it."]} /> : null}
              {app === "games" ? <GamesApp me={username} life={life} cloud={cloud} onBack={() => setApp("home")} onApply={onSocial} onNet={onNet} /> : null}
              {app === "land" ? <LandApp life={life} onBack={() => setApp("home")} onApply={onSocial} onArrange={onArrange} /> : null}
              {app === "house" ? <HomeApp life={life} onBack={() => setApp("home")} onApply={onSocial} onLand={() => setApp("land")} /> : null}
              {app === "turf" ? <TurfApp me={username} life={life} cloud={cloud} onBack={() => setApp("home")} onApply={onSocial} onNet={onNet} /> : null}
              {app === "invite" ? <InviteApp me={username} life={life} cloud={cloud} onBack={() => setApp("home")} onNet={onNet} /> : null}
              {app === "family" ? <FamilyApp life={life} married={married} onBack={() => setApp("home")} onApply={onSocial} /> : null}
              {app === "studio" ? <StudioApp life={life} onBack={() => setApp("home")} onApply={onSocial} onGo={onGo} /> : null}
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
              {app === "trips" ? <TripsApp life={life} onBack={() => setApp("home")} onGo={onGo} onApply={onSocial} onFly={onFly} /> : null}
              {app === "chop" ? <ChopApp life={life} onBack={() => setApp("home")} onApply={onSocial} /> : null}
              {app === "charts" ? <ChartsApp me={username} life={life} cloud={cloud} onBack={() => setApp("home")} /> : null}
              {app === "boutique" ? <BoutiqueScreen life={life} onBack={() => setApp("home")} onApply={onSocial} /> : null}
              {app === "light" ? <NoteScreen title="Light" onBack={() => setApp("home")} lines={[life.dumsor ? "Dumsor. The estate is dark." : "Current is on.", hasCurrent(life.inventory) ? "Your gen or solar can carry the room." : life.inventory.includes("bulb") ? "The rechargeable bulb is in the room." : "A bulb, a gen, or solar is in the catalogue."]} /> : null}
              {app === "biz" ? <BizApp life={life} onBack={() => setApp("home")} onApply={onSocial} onVisit={(spot) => (life.where === spot ? onClose() : onGo(spot))} /> : null}
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
              {app === "photos" ? <PhotosScreen life={life} onBack={() => setApp("home")} onSnap={() => onSocial(postClout(life, spotById(life.where).name))} /> : null}
              {app === "delivery" ? (
                <DeliveryScreen life={life} onBack={() => setApp("home")} onRun={() => onSocial(doHustle(life, "hustle-delivery"))} onApply={onSocial} />
              ) : null}
              {app === "bet" ? <BetTable life={life} onBack={() => setApp("home")} onApply={onSocial} /> : null}
              {app === "papers" ? (
                <PapersScreen
                  life={life}
                  onBack={() => setApp("home")}
                  onPaper={(id) => onSocial(setWallpaper(life, id))}
                  onTopUp={(bundle) => onSocial(topUpAirtime(life, bundle))}
                  onHide={(id) => onSocial(hideApp(life, id))}
                  onCharge={() => onSocial(chargePhone(life))}
                />
              ) : null}
              {app === "settings" ? (
                <SettingsApp email={email} onBack={() => setApp("home")} onEmail={onEmail} onLogout={onLogout} onMenu={onClose} onNewLife={onNewLife} />
              ) : null}
            </div>
          </div>
          <button
            type="button"
            onClick={homeBar}
            className="mx-auto mt-2 mb-0.5 h-1.5 w-28 shrink-0 rounded-full bg-white/35"
            aria-label={app === "home" && !thread ? "Put the phone down" : "Back"}
          />
        </div>
      </div>
    </div>
  );
}

function townName(life: Life) {
  if (life.town === "kumasi") return "Kumasi";
  return "Accra";
}

function Status({ time, battery, ink, signal }: { time: string; battery: number; ink: "light" | "dark"; signal: boolean }) {
  const color = ink === "dark" ? "text-[#121212]" : "text-white";
  return (
    <div className={`relative z-10 flex items-center justify-between px-6 pt-3 text-[12px] font-semibold ${color}`}>
      <span>{time}</span>
      <span className="absolute left-1/2 top-2 h-6 w-24 -translate-x-1/2 rounded-full bg-black" />
      <span className="flex items-center gap-1.5">
        <Signal />
        <span className="text-[10px]">{signal ? "5G" : "No service"}</span>
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
  cards,
  notices,
  now,
  mood,
  clout,
  tier,
  followers,
  post,
  airtime,
  hidden,
  onOpen,
  onRide,
  onMarket,
  onMap,
  onPost,
  onTopUp,
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
  cards: { id: string; app: string; kicker: string; title: string; detail: string }[];
  notices: { id: string; emoji: string; text: string; app: string }[];
  now: number | null;
  mood: string;
  clout: number;
  tier: string;
  followers: number;
  post: string;
  airtime: number;
  hidden: string[];
  onOpen: (app: AppId) => void;
  onRide: () => void;
  onMarket: () => void;
  onMap?: () => void;
  onPost: () => void;
  onTopUp: (bundle: 5 | 15) => void;
}) {
  const [shade, setShade] = useState(false);
  const card = cards[Math.floor((now ?? 0) / 8000) % Math.max(1, cards.length)] ?? cards[0];
  const show = (id: string) => !hidden.includes(id);
  return (
    <div className="no-scrollbar flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto px-4 pb-8 pt-3 text-white">
      <button type="button" onClick={() => setShade((open) => !open)} className="mx-auto mb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white/70">
        {shade ? "Close shade" : "Pull shade"}
      </button>
      {shade ? (
        <div className="no-scrollbar mb-2 max-h-48 space-y-1.5 overflow-y-auto rounded-2xl bg-black/45 p-2 backdrop-blur">
          {notices.length ? null : <p className="px-2 py-2 text-xs text-white/80">Nothing waiting.</p>}
          {notices.map((notice) => (
            <button
              key={notice.id}
              type="button"
              onClick={() => {
                setShade(false);
                if (notice.app === "map") onMap?.();
                else onOpen(APP_IDS.includes(notice.app as AppId) ? (notice.app as AppId) : "alerts");
              }}
              className="block w-full rounded-xl bg-white/15 px-3 py-2 text-left text-[12px] leading-4"
            >
              {notice.emoji} {notice.text}
            </button>
          ))}
        </div>
      ) : null}
      <p className="text-center text-[52px] font-semibold leading-none tracking-tight">{time}</p>
      <p className="mt-1 text-center text-[13px] text-white/85">{date}</p>
      {card ? (
        <button type="button" onClick={() => (card.app === "map" ? onMap?.() : onOpen(APP_IDS.includes(card.app as AppId) ? (card.app as AppId) : "news"))} className="mt-3 rounded-2xl bg-black/25 px-3 py-2 text-left backdrop-blur">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/70">{card.kicker}</p>
          <p className="text-[13px] font-semibold leading-4">{card.title}</p>
          <p className="text-[11px] leading-4 text-white/80">{card.detail}</p>
        </button>
      ) : null}
      <div className="mt-2 rounded-2xl bg-white/15 px-3 py-2 backdrop-blur">
        <div className="flex items-start justify-between gap-2">
          <button type="button" onClick={() => onOpen("feed")} className="min-w-0 text-left">
            <p className="text-[11px] font-bold uppercase tracking-wide text-white/70">Clout · {tier}</p>
            <p className="text-sm font-semibold">{clout}</p>
            <p className="text-[11px] text-white/80">
              {followers.toLocaleString("en-GH")} followers · {mood}
            </p>
          </button>
          <button type="button" onClick={onPost} className="shrink-0 rounded-full bg-white/90 px-3 py-1.5 text-xs font-bold text-[#121212]">
            Post
          </button>
        </div>
        <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-white/85">{post}</p>
        <div className="mt-2 flex items-center gap-2">
          <p className="text-[11px] font-semibold text-white">Airtime {airtime}</p>
          <button type="button" onClick={() => onTopUp(5)} className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-[#121212]">
            ₵5 · 20 units
          </button>
          <button type="button" onClick={() => onTopUp(15)} className="rounded-full bg-[#FCD116] px-2.5 py-1 text-[11px] font-bold text-[#121212]">
            ₵15 · 80 units
          </button>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-4 gap-x-1 gap-y-4">
        <AppIcon label="Alerts" color="#243044" badge={alerts} onClick={() => onOpen("alerts")}>
          <span className="text-2xl">🔔</span>
        </AppIcon>
        <AppIcon label="Messages" color="#5b8def" badge={inbox} onClick={() => onOpen("messages")}>
          <Bubble />
        </AppIcon>
        <AppIcon label="Calls" color="#25d366" onClick={() => onOpen("calls")}>
          <PhoneMark />
        </AppIcon>
        <AppIcon label="Memories" color="#7a3b0c" onClick={() => onOpen("memories")}>
          <span className="text-2xl">📔</span>
        </AppIcon>
      </div>
      <Section title="Pocket">
        {show("map") ? (
          <AppIcon label="Map" color="#1f7a4d" onClick={() => onMap?.()}>
            <span className="text-2xl">🗺️</span>
          </AppIcon>
        ) : null}
        {show("photos") ? (
          <AppIcon label="Photos" color="#c45c9a" onClick={() => onOpen("photos")}>
            <span className="text-2xl">🖼️</span>
          </AppIcon>
        ) : null}
        {show("delivery") ? (
          <AppIcon label="Delivery" color="#CE1126" onClick={() => onOpen("delivery")}>
            <span className="text-2xl">🚲</span>
          </AppIcon>
        ) : null}
        {show("bet") ? (
          <AppIcon label="Bet" color="#121212" onClick={() => onOpen("bet")}>
            <span className="text-2xl">♠️</span>
          </AppIcon>
        ) : null}
        {show("papers") ? (
          <AppIcon label="Look" color="#f6e7c1" onClick={() => onOpen("papers")}>
            <span className="text-2xl">🎨</span>
          </AppIcon>
        ) : null}
      </Section>
      <Section title="Life">
        <AppIcon label="Money" color="#006B3F" onClick={() => onOpen("work")}>
          <Briefcase />
        </AppIcon>
        <AppIcon label="Home" color="#0b3d6b" onClick={() => onOpen("house")}>
          <span className="text-2xl">🏠</span>
        </AppIcon>
        <AppIcon label="Stories" color="#5c2a86" badge={stories} onClick={() => onOpen("stories")}>
          <span className="text-2xl">📖</span>
        </AppIcon>
        <AppIcon label="Dream" color="#f08a3c" onClick={() => onOpen("goals")}>
          <Star />
        </AppIcon>
        <AppIcon label="Rival" color="#7a1f1f" onClick={() => onOpen("book")}>
          <span className="text-2xl">🔥</span>
        </AppIcon>
        <AppIcon label="Law" color="#1d2433" onClick={() => onOpen("law")}>
          <span className="text-2xl">⚖️</span>
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
        <AppIcon label="Trips" color="#8a4b1c" onClick={() => onOpen("trips")}>
          <span className="text-2xl">🧳</span>
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
        <AppIcon label="Guide" color="#006B3F" badge={guide} onClick={() => onOpen("guide")}>
          <span className="text-2xl">🧭</span>
        </AppIcon>
        <AppIcon label="Calendar" color="#7a3b0c" onClick={() => onOpen("calendar")}>
          <span className="text-2xl">📅</span>
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
        <AppIcon label="Chop bar" color="#CE1126" onClick={() => onOpen("chop")}>
          <span className="text-2xl">🍲</span>
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
        <AppIcon label="Areas" color="#006B3F" onClick={() => onOpen("turf")}>
          <span className="text-2xl">🗺️</span>
        </AppIcon>
        <AppIcon label="Invite" color="#CE1126" onClick={() => onOpen("invite")}>
          <span className="text-2xl">📨</span>
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
        <AppIcon label="Charts" color="#0b3d6b" onClick={() => onOpen("charts")}>
          <span className="text-2xl">📈</span>
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
        <AppIcon label="Calls" color="#111" onClick={() => onOpen("calls")}>
          <PhoneMark />
        </AppIcon>
        <AppIcon label="MoMo" color="#f5c542" onClick={() => onOpen("momo")}>
          <WalletMark />
        </AppIcon>
        <AppIcon label="Ride" color="#e23d3d" onClick={onRide}>
          <Van />
        </AppIcon>
      </div>
    </div>
  );
}

function CallsScreen({ life, onBack, onApply }: { life: Life; onBack: () => void; onApply: (result: StepResult) => void }) {
  const people = [...life.relations].sort((a, b) => b.score - a.score).slice(0, 12);
  const kinds: { id: CallKind; label: string }[] = [
    { id: "gist", label: "Gist" },
    { id: "plan", label: "Plan" },
    { id: "come-home", label: "Come over" },
    { id: "check", label: "Check" },
  ];
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[#f4f7fb] text-[#121212]">
      <AppHeader title="Calls" onBack={onBack} />
      <div className="min-h-0 flex-1 space-y-2 overflow-auto px-3 py-3">
        {!people.length ? <p className="px-1 text-sm text-[#5c6b82]">Meet people outside, then call them here.</p> : null}
        {people.map((person) => (
          <div key={person.name} className="rounded-2xl bg-white px-3 py-3 shadow-sm">
            <p className="font-semibold">
              {person.name} <span className="text-xs font-normal text-[#8b97ab]">· {person.score}</span>
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {kinds.map((kind) => (
                <button
                  key={kind.id}
                  type="button"
                  onClick={() => onApply(callPerson(life, person.name, kind.id))}
                  className="rounded-full bg-[#121212] px-3 py-1.5 text-[11px] font-bold text-white"
                >
                  {kind.label}
                </button>
              ))}
              <button type="button" onClick={() => onApply(callPerson(life, person.name, "come-home", "eat"))} className="rounded-full bg-[#006B3F] px-3 py-1.5 text-[11px] font-bold text-white">
                Come eat
              </button>
              <button type="button" onClick={() => onApply(textPerson(life, person.name, "hi"))} className="rounded-full bg-[#25d366] px-3 py-1.5 text-[11px] font-bold text-white">
                Text
              </button>
              <button type="button" onClick={() => onApply(textPerson(life, person.name, "come"))} className="rounded-full bg-[#006B3F] px-3 py-1.5 text-[11px] font-bold text-white">
                Text come
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MemoriesScreen({ life, onBack }: { life: Life; onBack: () => void }) {
  const lines = life.log.length ? life.log : ["Nothing written yet. Live a day in Accra — calls, cooks, rides — and it lands here."];
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[#f6f1ea] text-[#121212]">
      <AppHeader title="Memories" onBack={onBack} />
      <div className="min-h-0 flex-1 space-y-2 overflow-auto px-4 py-4">
        <p className="text-xs text-[#8b97ab]">Your Accra diary. Newest first.</p>
        {lines.map((line, index) => (
          <p key={`${index}-${line.slice(0, 24)}`} className="rounded-2xl bg-white px-4 py-3 text-sm leading-6 shadow-sm">
            {line}
          </p>
        ))}
      </div>
    </div>
  );
}

function PhoneLock({ lost, atHome, onCharge, onReplace, onClose }: { lost: boolean; atHome: boolean; onCharge: () => void; onReplace: () => void; onClose: () => void }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-6 text-center text-white">
      <p className="text-3xl font-semibold">{lost ? "Phone snatched" : "Battery dead"}</p>
      <p className="mt-2 text-sm text-white/80">{lost ? "A hand took it in the crowd. Replace it, or wait four hours." : atHome ? "Plug in. The socket is here." : "Get home, then charge."}</p>
      {lost ? (
        <button type="button" onClick={onReplace} className="mt-4 rounded-full bg-white px-4 py-2 text-sm font-bold text-[#121212]">
          Replace · ₵150
        </button>
      ) : (
        <button type="button" onClick={onCharge} className="mt-4 rounded-full bg-white px-4 py-2 text-sm font-bold text-[#121212]">
          Charge at home
        </button>
      )}
      <button type="button" onClick={onClose} className="mt-3 text-sm font-semibold text-white/80">
        Put it down
      </button>
    </div>
  );
}

function PhotosScreen({ life, onBack, onSnap }: { life: Life; onBack: () => void; onSnap: () => void }) {
  const shots = life.log.filter((line) => line.startsWith("Posted"));
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[#111] text-white">
      <AppHeader title="Photos" onBack={onBack} />
      <div className="min-h-0 flex-1 space-y-2 overflow-auto px-3 py-3">
        <button type="button" onClick={onSnap} className="w-full rounded-2xl bg-white py-3 text-sm font-bold text-[#121212]">
          Snap this place · 1 airtime
        </button>
        {shots.length ? null : <p className="text-sm text-white/70">The roll is empty. Snap where you are standing.</p>}
        {shots.map((line, index) => (
          <p key={`${index}-${line.slice(0, 18)}`} className="rounded-2xl bg-white/10 px-3 py-3 text-sm leading-6">
            {line}
          </p>
        ))}
      </div>
    </div>
  );
}

function DeliveryScreen({ life, onBack, onRun, onApply }: { life: Life; onBack: () => void; onRun: () => void; onApply: (result: StepResult) => void }) {
  const runs = life.stats?.hustles ?? 0;
  const [item, setItem] = useState<string>(MENU[0].id);
  const [rider, setRider] = useState<string>(RIDERS[0].id);
  const [speed, setSpeed] = useState("standard");
  const [address, setAddress] = useState<string>(ADDRESSES[0]);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!life.errand) return;
    const id = window.setInterval(() => setTick((value) => value + 1), 1000);
    return () => window.clearInterval(id);
  }, [life.errand]);
  void tick;
  const row = MENU.find((entry) => entry.id === item) ?? MENU[0];
  const who = RIDERS.find((entry) => entry.id === rider) ?? RIDERS[0];
  const speedFee = speed === "same" ? 2.2 : speed === "express" ? 1.6 : 1;
  const fee = Math.round(row.price + who.fee * speedFee);
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[#fff6df] text-[#121212]">
      <AppHeader title="Delivery" onBack={onBack} />
      <div className="min-h-0 flex-1 space-y-3 overflow-auto px-4 py-4">
        {life.errand ? (
          <div className="rounded-3xl bg-white p-4 shadow-sm">
            <p className="text-sm font-semibold">{errandLine(life)}</p>
            <p className="mt-1 text-sm text-[#5c6b82]">
              {life.errand.vehicle} · {life.errand.address} · {cedis(life.errand.paid)}
            </p>
            <button type="button" onClick={() => onApply(collectErrand(life))} className="mt-3 w-full rounded-full bg-[#006B3F] py-3 text-sm font-bold text-white">
              Open the gate
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm font-semibold">What</p>
            <div className="flex flex-wrap gap-2">
              {MENU.map((entry) => (
                <button key={entry.id} type="button" onClick={() => setItem(entry.id)} className={`rounded-full px-3 py-2 text-xs font-bold ${item === entry.id ? "bg-[#121212] text-white" : "bg-white"}`}>
                  {entry.label} {cedis(entry.price)}
                </button>
              ))}
            </div>
            <p className="text-sm font-semibold">Who</p>
            <div className="flex flex-wrap gap-2">
              {RIDERS.map((entry) => (
                <button key={entry.id} type="button" onClick={() => setRider(entry.id)} className={`rounded-full px-3 py-2 text-xs font-bold ${rider === entry.id ? "bg-[#CE1126] text-white" : "bg-white"}`}>
                  {entry.name} · {entry.vehicle} · {entry.rating}
                </button>
              ))}
            </div>
            <p className="text-sm font-semibold">Speed</p>
            <div className="flex flex-wrap gap-2">
              {["standard", "express", "same"].map((entry) => (
                <button key={entry} type="button" onClick={() => setSpeed(entry)} className={`rounded-full px-3 py-2 text-xs font-bold ${speed === entry ? "bg-[#121212] text-white" : "bg-white"}`}>
                  {entry}
                </button>
              ))}
            </div>
            <p className="text-sm font-semibold">Where</p>
            <div className="flex flex-wrap gap-2">
              {ADDRESSES.map((entry) => (
                <button key={entry} type="button" onClick={() => setAddress(entry)} className={`rounded-full px-3 py-2 text-xs font-bold ${address === entry ? "bg-[#121212] text-white" : "bg-white"}`}>
                  {entry}
                </button>
              ))}
            </div>
            <button type="button" onClick={() => onApply(placeErrand(life, item, rider, speed, address))} className="w-full rounded-full bg-[#CE1126] py-3 text-sm font-bold text-white">
              Order · {cedis(fee)}
            </button>
          </div>
        )}
        {life.drop ? (
          <div className="rounded-3xl bg-white p-4 shadow-sm">
            <p className="text-sm font-semibold">Rate {life.drop.rider}</p>
            <div className="mt-2 flex gap-2">
              {[1, 2, 3, 4, 5].map((stars) => (
                <button key={stars} type="button" onClick={() => onApply(rateDrop(life, stars))} className="rounded-full bg-[#fff1c9] px-3 py-2 text-sm font-bold">
                  {stars}
                </button>
              ))}
            </div>
          </div>
        ) : null}
        <div className="rounded-3xl bg-white p-4 shadow-sm">
          <p className="text-sm leading-6 text-[#5c6b82]">Or ride it yourself. Cash when you hand it over. Hustle skill raises the pay.</p>
          <p className="mt-1 text-sm font-semibold">Runs so far: {runs}</p>
          <button type="button" onClick={onRun} className="mt-3 w-full rounded-full bg-[#121212] py-3 text-sm font-bold text-white">
            Take a bike order
          </button>
        </div>
      </div>
    </div>
  );
}

function PapersScreen({
  life,
  onBack,
  onPaper,
  onTopUp,
  onHide,
  onCharge,
}: {
  life: Life;
  onBack: () => void;
  onPaper: (id: string) => void;
  onTopUp: (bundle: 5 | 15) => void;
  onHide: (id: string) => void;
  onCharge: () => void;
}) {
  const phone = phoneOf(life);
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[#f6f1ea] text-[#121212]">
      <AppHeader title="Look" onBack={onBack} />
      <div className="min-h-0 flex-1 space-y-3 overflow-auto px-3 py-3">
        <p className="text-sm text-[#5c6b82]">
          Battery {phone.battery}% · Airtime {phone.airtime} · {phone.ringtone}
        </p>
        <div className="flex gap-2">
          <button type="button" onClick={() => onTopUp(5)} className="rounded-full bg-[#121212] px-3 py-2 text-xs font-bold text-white">
            ₵5 airtime
          </button>
          <button type="button" onClick={() => onTopUp(15)} className="rounded-full bg-[#006B3F] px-3 py-2 text-xs font-bold text-white">
            ₵15 airtime
          </button>
          <button type="button" onClick={onCharge} className="rounded-full bg-white px-3 py-2 text-xs font-bold">
            Charge
          </button>
        </div>
        <p className="text-[11px] font-bold uppercase tracking-wide text-[#8b97ab]">Wallpapers</p>
        {WALLPAPERS.map((paper) => {
          const open = paper.unlock(life);
          return (
            <button key={paper.id} type="button" disabled={!open} onClick={() => onPaper(paper.id)} className="flex w-full items-center justify-between rounded-2xl bg-white px-3 py-2 text-left disabled:opacity-40">
              <span>
                <span className="block text-sm font-semibold">{paper.name}</span>
                <span className="text-[11px] text-[#8b97ab]">{open ? paper.hint : paper.hint}</span>
              </span>
              <span className="h-8 w-8 rounded-lg" style={{ background: `linear-gradient(180deg, ${paper.from}, ${paper.to})` }} />
            </button>
          );
        })}
        <p className="text-[11px] font-bold uppercase tracking-wide text-[#8b97ab]">Hide an app</p>
        {["photos", "delivery", "map"].map((id) => (
          <button key={id} type="button" onClick={() => onHide(id)} className="w-full rounded-full bg-white px-3 py-2 text-left text-sm font-semibold">
            {phone.hidden.includes(id) ? `Show ${id}` : `Hide ${id}`}
          </button>
        ))}
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
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="@username" className="h-10 flex-1 rounded-full bg-white px-4 text-sm outline-none" autoComplete="off" />
        <button type="submit" className="rounded-full bg-[#121212] px-4 text-sm font-semibold text-white">
          Find
        </button>
      </form>
      <NameSuggest
        className="mx-4"
        query={query}
        onPick={(person) => {
          setQuery(person.username);
          setPeople([person]);
          setNotice("");
          onOpen(`user:${person.username}`);
        }}
      />
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

function BoutiqueScreen({ life, onBack, onApply }: { life: Life; onBack: () => void; onApply: (result: StepResult) => void }) {
  const [tier, setTier] = useState<Tier>("mid");
  const [preview, setPreview] = useState<RackItem | null>(null);
  const rack = RACK.filter((item) => item.tier === tier && (!item.city || item.city === (life.town ?? "accra")));
  const look = preview ? { ...life.look, outfit: preview.outfit, cloth: preview.cloth } : life.look;
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[#f6f1ea] text-[#121212]">
      <AppHeader title="Boutique" onBack={onBack} />
      <div className="relative grid h-36 place-items-center bg-gradient-to-b from-[#f3e4ff] to-[#fff6df]">
        <IsoHuman skin={look.skin} shirt={look.cloth} hair={look.hair} cloth={look.cloth} className="h-32" />
        <p className="absolute bottom-2 left-3 rounded-full bg-white px-3 py-1 text-[11px] font-semibold shadow">{preview ? preview.label : life.look.outfit}</p>
      </div>
      <div className="flex gap-2 overflow-auto px-3 py-2 text-xs font-semibold">
        {(Object.keys(TIERS) as Tier[]).map((item) => (
          <button key={item} type="button" onClick={() => setTier(item)} className={`shrink-0 rounded-full px-3 py-1.5 ${tier === item ? "bg-[#CE1126] text-white" : "bg-white"}`}>
            {TIERS[item].label}
          </button>
        ))}
      </div>
      <div className="min-h-0 flex-1 space-y-2 overflow-auto px-3 pb-4">
        <p className="text-xs text-[#5c6b82]">{TIERS[tier].note}</p>
        {rack.map((item) => {
          const owned = (life.wardrobe ?? []).some((row) => row.id === item.id);
          return (
            <div key={item.id} className="rounded-2xl bg-white px-4 py-3 shadow-sm">
              <p className="font-semibold">
                {item.label} · {cedis(askPrice(life, item))}
              </p>
              <p className="mt-1 text-xs text-[#5c6b82]">
                {item.brand} · {item.category}
              </p>
              <div className="mt-2 flex gap-2">
                <button type="button" onClick={() => setPreview(item)} className="rounded-full bg-[#f6f1ea] px-3 py-1.5 text-xs font-bold">
                  Try on
                </button>
                <button type="button" onClick={() => onApply(owned ? wearGarment(life, item.id) : buyGarment(life, item.id))} className="rounded-full bg-[#121212] px-3 py-1.5 text-xs font-bold text-white">
                  {owned ? "Wear" : "Buy"}
                </button>
              </div>
            </div>
          );
        })}
        {(life.wardrobe ?? []).map((item) => (
          <button key={item.id} type="button" onClick={() => onApply(wearGarment(life, item.id))} className="block w-full rounded-2xl bg-[#fff1c9] px-4 py-2 text-left text-sm font-semibold">
            Wardrobe · {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function WorkScreen({ life, onBack, onWork, onPromote, onHustle, onOpen }: { life: Life; onBack: () => void; onWork: (jobId: string) => void; onPromote: (jobId: string) => void; onHustle: (id: string) => void; onOpen: (app: AppId) => void }) {
  const step = nextMoneyStep(life);
  const openLabel = step?.app === "biz" ? "Business" : step?.app === "fleet" ? "Fleet" : step?.app === "land" ? "Land" : step?.app === "bank" ? "Bank" : "School";
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[#f4f7fb] text-[#121212]">
      <AppHeader title="Make money" onBack={onBack} />
      <div className="min-h-0 flex-1 space-y-2 overflow-auto px-3 py-3">
        <div className="rounded-2xl bg-[#006B3F] px-4 py-3 text-white">
          <p className="text-sm font-semibold">{MONEY_LINE}</p>
          <p className="mt-1 text-xs text-white/80">Work, then save, then buy something that pays you back.</p>
          {step ? (
            <>
              <p className="mt-3 text-[11px] font-bold uppercase tracking-wide text-[#FCD116]">Next · {step.title}</p>
              <p className="text-xs text-white/85">{step.detail}</p>
              {step.app ? (
                <button type="button" onClick={() => onOpen(step.app!)} className="mt-2 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-[#121212]">
                  Open {openLabel}
                </button>
              ) : null}
            </>
          ) : (
            <p className="mt-3 text-sm font-semibold">You are stacking. Keep buying things that earn while you sleep.</p>
          )}
        </div>
        <p className="px-1 pt-1 text-xs font-semibold uppercase tracking-wide text-[#8b97ab]">Starter hustles</p>
        {HUSTLES.map((verb) => {
          const locked = hustleLock(life, verb);
          return (
            <button key={verb.id} type="button" disabled={Boolean(locked)} onClick={() => onHustle(verb.id)} className="block w-full rounded-2xl bg-white px-4 py-3 text-left shadow-sm disabled:opacity-50">
              <span className="font-semibold">{verb.label}</span>
              <span className="mt-1 block text-sm text-[#5c6b82]">
                {hustleLabel(life, verb)} · {verb.minutes} min
              </span>
            </button>
          );
        })}
        <p className="px-1 pt-2 text-xs font-semibold uppercase tracking-wide text-[#8b97ab]">Jobs · career {careerLevel(life)}</p>
        {JOBS.map((job) => {
          const held = rankOf(life, job.id);
          const title = JOB_RANKS[held.rank] ?? JOB_RANKS[0];
          const pay = Math.round(job.verb.earn * careerLevel(life) * (RANK_PAY[held.rank] ?? 1));
          const next = nextRank(life, job.id);
          return (
            <div key={job.id} className="rounded-2xl bg-white px-4 py-3 shadow-sm">
              <button type="button" onClick={() => onWork(job.id)} className="block w-full text-left">
                <span className="font-semibold">{job.title}</span>
                <span className="mt-1 block text-sm text-[#5c6b82]">
                  {title} · {cedis(pay)} · {Math.round(job.verb.minutes / 60)} hrs · {spotById(job.place).name}
                </span>
                {next ? (
                  <span className="mt-1 block text-xs text-[#8b97ab]">
                    Next: {next.title} after {Math.max(0, next.shifts - held.shifts)} more shifts · career {next.career}+
                  </span>
                ) : (
                  <span className="mt-1 block text-xs text-[#006B3F]">You run this place.</span>
                )}
              </button>
              {next ? (
                <button type="button" onClick={() => onPromote(job.id)} className="mt-2 rounded-full bg-[#121212] px-3 py-1.5 text-xs font-bold text-white">
                  Ask for a promotion
                </button>
              ) : null}
            </div>
          );
        })}
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
  onSend,
}: {
  life: Life;
  username: string;
  onBack: () => void;
  onRepay: () => void;
  onLogout: () => void;
  onSend: (handle: string, amount: number) => string | null | Promise<string | null>;
}) {
  const home = homeById(life.homeId);
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("20");
  const [line, setLine] = useState("");
  useEffect(() => {
    if (!line) return;
    const id = window.setTimeout(() => setLine(""), 4600);
    return () => window.clearTimeout(id);
  }, [line]);

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[#f6f1ea] text-[#121212]">
      <AppHeader title="MoMo" onBack={onBack} tone="yellow" />
      <div className="min-h-0 flex-1 overflow-auto px-4 py-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#8a6a12]">Available</p>
        <p className="font-display text-4xl">{cedis(life.cash)}</p>
        <p className="mt-1 text-sm text-[#5c6b82]">@{username}</p>
        <form
          className="mt-4 space-y-2 rounded-3xl bg-white p-4 shadow-sm"
          onSubmit={(event) => {
            event.preventDefault();
            const handle = to.trim().toLowerCase().replace(/^@/, "");
            const value = Math.round(Number(amount));
            void Promise.resolve(onSend(handle, value)).then((error) => {
              setLine(error ?? `Sent ${cedis(value)} to @${handle}.`);
            });
          }}
        >
          <p className="text-sm font-semibold">Send to a player</p>
          <input
            value={to}
            onChange={(event) => setTo(event.target.value)}
            placeholder="username"
            className="w-full rounded-2xl bg-[#f6f1ea] px-3 py-3 text-sm"
            autoComplete="off"
          />
          <input
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            inputMode="numeric"
            className="w-full rounded-2xl bg-[#f6f1ea] px-3 py-3 text-sm"
          />
          <button type="submit" className="w-full rounded-full bg-[#f5c542] py-3 text-sm font-bold">
            Send
          </button>
          {line ? <p className="text-sm text-[#5c6b82]">{line}</p> : null}
        </form>
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
