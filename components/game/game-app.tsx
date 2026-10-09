"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { ActionDeck } from "@/components/game/action-deck";
import { BOARDS, CityBoard } from "@/components/game/city-board";
import { IsoHuman } from "@/components/game/iso-human";
import { VenueFloor, type Peer } from "@/components/game/venue-floor";
import { Catalogue } from "@/components/game/catalogue";
import { Handset } from "@/components/game/handset";
import { RoomView } from "@/components/game/room-view";
import { Payday, ShiftFloor, StreetRide, FlightRide } from "@/components/game/life-scenes";
import { Soundtrack, tuneFor } from "@/components/game/soundtrack";
import { TourCoach } from "@/components/game/tour-coach";
import { FeatureBulletin } from "@/components/game/bulletin";
import { CrisisLayer } from "@/components/game/crisis-sheet";
import { callForPerson, helpPerson, leavePerson, personDown, robPerson } from "@/lib/game/crisis";
import { BULLETIN_ID, seenBulletin } from "@/lib/game/bulletin";
import { useInbox, type InboxPing } from "@/components/game/use-inbox";
import { QUIET_CITY, cityNow, eventSpot, eventVerbs, rideIn, type Weather } from "@/lib/game/city";
import { CLUB_IDS } from "@/lib/game/accra-spots";
import { hangoverActive, leaveClubNight, sessionOf } from "@/lib/game/club-night";
import { catchCash, sprayCash } from "@/lib/game/club-spray";
import { postClout } from "@/lib/game/phone-life";
import { happeningsAt, happeningVerbs, heatLabel } from "@/lib/game/happenings";
import { kitVerbs } from "@/lib/game/place-kit";
import { TradeSheet } from "@/components/game/trade-sheet";
import { buyGood, sellGood } from "@/lib/game/trade";
import { syncBadges } from "@/lib/game/badges";
import { carRide, carSpoilt, repairCar } from "@/lib/game/garage";
import { sickness } from "@/lib/game/health";
import { dressedFor } from "@/lib/game/tailor";
import { CODE_LABEL, EVENT_INFO, type HostHome, type LifeEvent, type Match } from "@/lib/game/net";
import { alertsFor } from "@/lib/game/alerts";
import { claimGuide, guideNext } from "@/lib/game/guide";
import { PlayerChops, WeeklyCard } from "@/components/game/city-apps";
import { chopSign } from "@/lib/game/kitchen";
import { checkIn } from "@/lib/game/weekly";
import { CABINS, bookFlight, flyOwnJet, jetFuel, routeOf } from "@/lib/game/flights";
import { TravelSheet } from "@/components/game/travel-sheet";
import { placeCard, spotOnMap, townEventNow, townOf, type TownId } from "@/lib/game/towns";
import { quoteTravel, type TravelMode } from "@/lib/game/travel";
import type { Cabin } from "@/lib/game/flights";
import { TOUR, finishTour, skipTour, type TourId } from "@/lib/game/tour";
import {
  cookAtHome,
  doorGuests,
  enRouteGuests,
  hangWithGuest,
  maybeKnock,
  minutesAway,
  offerSleepover,
  openDoor,
  receiveGuest,
  sendGuestHome,
  settleGuests,
  tickGuests,
} from "@/lib/game/home-life";
import { buyUsed, mendItem } from "@/lib/game/wear";

const LowPolyHuman = dynamic(() => import("@/components/game/low-poly-human").then((mod) => mod.LowPolyHuman), { ssr: false });
import { commitLife, getRaw, parseRaw, subscribeSave, writeSave, type Account } from "@/lib/game/save";
import {
  ACCENTS,
  BEARDS,
  BUILDS,
  CLOTHS,
  DREAMS,
  FACES,
  HAIRS,
  HEIGHTS,
  HOME_VERBS,
  HOMES,
  JOBS,
  OUTFITS,
  PATTERNS,
  SKINS,
  SPOTS,
  TRAITS,
  accraDateLabel,
  birthById,
  buyItem,
  buyCart,
  cedis,
  CLOTHES,
  clockLabel,
  distanceOf,
  farRide,
  freshLife,
  gemSpotId,
  giftCash,
  layMat,
  flipLamps,
  layPiece,
  widenRoom,
  receiveCash,
  goTo,
  toggleStar,
  carFuelBlock,
  homeById,
  homeLook,
  accraHour,
  realMinutes,
  huntGem,
  invitePerson,
  inviteToTable,
  claimTable,
  clearTable,
  moodOf,
  shiftPerformance,
  payOffer,
  passTime,
  questFor,
  RIDES,
  repayLoan,
  rollBirth,
  runVerb,
  sellPiece,
  storePiece,
  spotById,
  takePurse,
  type Life,
  type Look,
  type Offer,
  type Ride,
  type Spot,
  type StepResult,
  type Verb,
} from "@/lib/game/world";
import { useStock } from "@/lib/game/item-verbs";

const emptyServer = "";

function useSave() {
  const raw = useSyncExternalStore(subscribeSave, getRaw, () => emptyServer);
  return useMemo(() => parseRaw(raw), [raw]);
}

function subscribeMinute(callback: () => void) {
  const id = window.setInterval(callback, 30000);
  return () => window.clearInterval(id);
}

function useCityHeadline() {
  const minute = useSyncExternalStore(subscribeMinute, () => Math.floor(Date.now() / 60000), () => null);
  return useMemo(() => (minute == null ? null : cityNow(new Date(minute * 60000)).headline), [minute]);
}

function usePlayerEvents(on: boolean) {
  const [events, setEvents] = useState<LifeEvent[]>([]);
  useEffect(() => {
    if (!on) return;
    let stop = false;
    const load = () =>
      fetch("/api/live/play?view=events")
        .then((response) => (response.ok ? response.json() : null))
        .then((data: { events?: LifeEvent[] } | null) => {
          if (!stop && data?.events) setEvents(data.events);
        })
        .catch(() => undefined);
    void load();
    const id = window.setInterval(load, 60000);
    return () => {
      stop = true;
      window.clearInterval(id);
    };
  }, [on]);
  return events;
}

function notify(title: string, body: string, tag: string) {
  try {
    if (typeof Notification !== "undefined" && Notification.permission === "granted" && document.hidden) new Notification(title, { body, tag: `accralife-${tag}` });
  } catch {}
}

function useAlertPings(life: Life | null, onPing: (text: string) => void) {
  const seen = useRef<Set<string> | null>(null);
  const ping = useRef(onPing);
  useEffect(() => {
    ping.current = onPing;
  });
  useEffect(() => {
    if (!life) return;
    const list = alertsFor(life);
    const before = seen.current;
    seen.current = new Set(list.map((alert) => alert.id));
    if (!before) return;
    const fresh = list.find((alert) => !before.has(alert.id));
    if (!fresh) return;
    ping.current(`${fresh.emoji} ${fresh.text}`);
    notify("Accra Life", fresh.text, fresh.id);
  }, [life]);
}

function useChopSign(on: boolean, life: Life | null) {
  const sign = life ? chopSign(life) : null;
  const chop = life?.chop;
  const payload = sign && chop ? JSON.stringify({ name: sign.name, spot: sign.spot, menu: chop.menu, stock: Object.fromEntries(sign.menu.map((item) => [item.dish, 1])) }) : "null";
  const sent = useRef("null");
  useEffect(() => {
    if (!on || payload === sent.current) return;
    const id = window.setTimeout(() => {
      sent.current = payload;
      void fetch("/api/live/play", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "chop-publish", life: { cash: 0, chop: JSON.parse(payload) } }),
      }).catch(() => undefined);
    }, 1500);
    return () => window.clearTimeout(id);
  }, [on, payload]);
}

function useTurnPings(username: string, on: boolean, onPing: (text: string) => void) {
  const ping = useRef(onPing);
  useEffect(() => {
    ping.current = onPing;
  });
  useEffect(() => {
    if (!on) return;
    let stop = false;
    let known: Set<string> | null = null;
    const load = () =>
      fetch("/api/live/play?view=games")
        .then((response) => (response.ok ? response.json() : null))
        .then((data: { games?: Match[] } | null) => {
          if (stop || !data?.games) return;
          const mine = data.games.filter((match) => (match.status === "playing" && match.board.turn === (match.a === username ? 0 : 1)) || (match.status === "waiting" && match.b === username));
          const keys = new Set(mine.map((match) => `${match.id}:${match.moved}`));
          const before = known;
          known = keys;
          if (!before) return;
          const fresh = mine.find((match) => !before.has(`${match.id}:${match.moved}`));
          if (!fresh) return;
          const other = fresh.a === username ? fresh.b : fresh.a;
          const text = fresh.status === "waiting" ? `🎲 @${other} challenged you to ${fresh.game}.` : `🎲 Your move against @${other} in ${fresh.game}.`;
          ping.current(text);
          notify("Accra Life", text, `turn-${fresh.id}`);
        })
        .catch(() => undefined);
    void load();
    const id = window.setInterval(load, 30000);
    return () => {
      stop = true;
      window.clearInterval(id);
    };
  }, [username, on]);
}

function eventVerbId(event: LifeEvent) {
  return `pev-${[...event.id].map((char) => char.charCodeAt(0) % 10).join("")}`;
}

function playerVerbs(spotId: string, events: LifeEvent[], life: Life, now: number | null): Verb[] {
  if (now == null) return [];
  return events
    .filter((event) => event.spot === spotId && Date.parse(event.startsAt) <= now && Date.parse(event.endsAt) > now)
    .map((event) => {
      const meta = EVENT_INFO[event.kind];
      const dressed = dressedFor(life, event.code);
      const mark = event.code === "any" ? "" : dressed ? " You are dressed right." : ` Wear ${CODE_LABEL[event.code].toLowerCase()} for a warmer welcome.`;
      return {
        id: eventVerbId(event),
        label: meta.verb,
        detail: `${event.title} · @${event.host}.${mark}`,
        minutes: 90,
        cost: 0,
        earn: 0,
        effects: dressed ? { social: 32, fun: 24, hunger: 18 } : { social: 18, fun: 12, hunger: 18 },
        social: true,
        cool: true,
        emoji: meta.emoji,
      };
    });
}

function useCookie() {
  return useSyncExternalStore(
    (callback) => {
      window.addEventListener("accralife-cookie", callback);
      return () => window.removeEventListener("accralife-cookie", callback);
    },
    () => localStorage.getItem("accralife-cookie") === "1",
    () => false,
  );
}

const starterLook = (): Look => ({
  body: "woman",
  hair: "Braids",
  outfit: "Classic",
  pattern: "Kente",
  skin: "#8d5a3b",
  cloth: "#e7c85a",
  accent: "#1d2433",
});

export function GameApp() {
  const { session, accounts } = useSave();
  const me = accounts.find((account) => account.username === session) ?? null;
  const [auth, setAuth] = useState<"signup" | "login" | null>(null);
  const [resumed, setResumed] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const cookieOk = useCookie();

  useEffect(() => {
    let noteTimer = 0;
    const ping = (message: string) => {
      setToast(message);
      window.clearTimeout(noteTimer);
      noteTimer = window.setTimeout(() => setToast((current) => (current === message ? null : current)), 4600);
    };
    const id = window.setInterval(() => {
      const snap = parseRaw(getRaw());
      if (!snap.session) return;
      const account = snap.accounts.find((item) => item.username === snap.session);
      if (!account?.life?.needs) return;
      const now = realMinutes();
      let life = account.life;
      if (life.minutes < 1_000_000) {
        const day = Math.floor(now / 1440);
        life = { ...life, minutes: now, lastRentAt: day, outageCheckedDay: day };
        commitLife(account.username, life);
      } else {
        const delta = now - life.minutes;
        if (delta >= 1) {
          const timed = passTime(life, Math.min(delta, 180));
          if (delta > 180) timed.life.minutes = now;
          const settled = settleGuests(timed.life);
          if (timed.notes.length) settled.life.inbox = [...timed.notes, ...settled.life.inbox].slice(0, 20);
          life = settled.life;
          commitLife(account.username, life);
          if (settled.notes[0]) ping(settled.notes[0]);
        }
      }
      if (account.cloud) {
        void fetch("/api/live/life", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ life }),
        })
          .then((response) => (response.ok ? response.json() : null))
          .then((data: { life?: Life } | null) => {
            if (!data?.life) return;
            const snap = parseRaw(getRaw());
            const current = snap.accounts.find((item) => item.username === account.username)?.life;
            if (!current) return;
            const next = takePurse(current, life, data.life);
            if (next === current) return;
            const gained = next.cash > current.cash;
            commitLife(account.username, next);
            if (gained) ping(next.log[0] ?? "Money landed in your wallet.");
          })
          .catch(() => undefined);
      }
    }, 15000);
    return () => {
      window.clearInterval(id);
      window.clearTimeout(noteTimer);
    };
  }, []);

  function flash(message: string) {
    setToast(message);
    window.setTimeout(() => setToast((current) => (current === message ? null : current)), 4600);
  }

  return (
    <div className="game-root relative h-dvh overflow-hidden bg-[#fff6df] text-[#121212]">
      {me?.life?.needs && resumed ? (
        <Play account={me} flash={flash} />
      ) : me?.life?.needs ? (
        <Resume account={me} onContinue={() => setResumed(true)} />
      ) : me ? (
        <Creator account={me} flash={flash} />
      ) : auth ? (
        <Auth mode={auth} accounts={accounts} onMode={setAuth} onClose={() => setAuth(null)} flash={flash} />
      ) : (
        <Guest onAuth={setAuth} flash={flash} cookieOk={cookieOk} />
      )}
      {toast ? (
        <button type="button" onClick={() => setToast(null)} className="absolute left-1/2 top-24 z-50 w-[min(92vw,420px)] -translate-x-1/2 rounded-full bg-[#121212] px-4 py-3 text-center text-sm font-medium text-white shadow-xl">
          {toast}
        </button>
      ) : null}
      <div className="game-splash absolute inset-0 z-[60] flex items-center justify-center bg-[#fff6df]">
        <p className="font-display text-4xl tracking-tight text-[#121212]">Accra Life</p>
      </div>
    </div>
  );
}

function useCityCrowd() {
  const [crowd, setCrowd] = useState({ players: 0, online: 0 });
  useEffect(() => {
    let stop = false;
    const load = () => {
      fetch("/api/live/crowd")
        .then((res) => res.json())
        .then((data: { players?: number; online?: number }) => {
          if (stop || typeof data?.players !== "number") return;
          setCrowd({ players: data.players, online: typeof data.online === "number" ? data.online : 0 });
        })
        .catch(() => {});
    };
    load();
    const id = window.setInterval(load, 20000);
    return () => {
      stop = true;
      window.clearInterval(id);
    };
  }, []);
  return crowd;
}

function Resume({ account, onContinue }: { account: Account; onContinue: () => void }) {
  const life = account.life;
  const [when, setWhen] = useState("");
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    setWhen(accraDateLabel(new Date()));
  }, []);
  if (!life) return null;
  return (
    <div className="relative h-dvh overflow-hidden bg-[#d7ecf8]">
      <div className="pointer-events-none absolute inset-0">
        <RoomView life={life} onAct={() => {}} onMap={() => {}} onAsk={() => {}} />
      </div>
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 bg-gradient-to-b from-[#d7ecf8] via-[#d7ecf8]/80 to-transparent pb-16 pt-[max(1.5rem,env(safe-area-inset-top))] text-center">
        <p className="text-2xl" aria-hidden>
          👑
        </p>
        <h1 className="font-display text-4xl tracking-tight">Accra Life</h1>
        <p className="text-sm text-[#5c6b82]">Live your Accra story.</p>
      </div>
      <div className="absolute inset-x-0 bottom-0 z-20 px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto w-full max-w-md rounded-[28px] bg-white p-4 shadow-2xl">
          <div className="flex items-center gap-3 px-1">
            <span className="grid h-12 w-12 place-items-center overflow-hidden rounded-full" style={{ background: life.look.skin }}>
              <IsoHuman skin={life.look.skin} shirt={life.look.cloth} hair={life.look.hair} cloth={life.look.cloth} className="h-16 translate-y-3" />
            </span>
            <div>
              <p className="font-bold">{account.username}</p>
              <p className="text-sm text-[#5c6b82]">
                {when || "Accra"} · {cedis(life.cash)}
              </p>
            </div>
          </div>
          <button type="button" onClick={onContinue} className="mt-4 w-full rounded-full bg-[#006B3F] py-3.5 font-bold text-white">
            Continue
          </button>
          <button
            type="button"
            onClick={() => {
              if (!armed) {
                setArmed(true);
                return;
              }
              const snap = parseRaw(getRaw());
              writeSave(
                snap.accounts.map((item) => (item.username === account.username ? { ...item, life: null } : item)),
                snap.session,
              );
            }}
            className="mt-2 w-full rounded-full bg-[#fff6df] py-3.5 font-bold"
          >
            {armed ? "Tap again. This clears the room and the cash." : "New life"}
          </button>
          <div className="mt-3 flex items-center justify-between px-1 text-sm">
            <p className="text-[#5c6b82]">
              Signed in as <span className="font-semibold text-[#121212]">@{account.username}</span>
            </p>
            <button type="button" className="font-semibold text-[#CE1126]" onClick={() => writeSave(parseRaw(getRaw()).accounts, null)}>
              Log out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Guest({
  onAuth,
  flash,
  cookieOk,
}: {
  onAuth: (mode: "signup" | "login") => void;
  flash: (message: string) => void;
  cookieOk: boolean;
}) {
  const [filter, setFilter] = useState<Spot["group"] | "all">("all");
  const [boards, setBoards] = useState(true);
  const [spotId, setSpotId] = useState<string | null>(null);
  const [privacy, setPrivacy] = useState(false);
  const crowd = useCityCrowd();
  const headline = useCityHeadline();
  const spot = SPOTS.find((item) => item.id === spotId) ?? null;

  return (
    <>
      <CityBoard
        filter={filter}
        boards={boards}
        active={spotId}
        at={new Date()}
        onSelect={(id) => {
          const next = spotById(id);
          if (next.soon) {
            flash(`${next.name} is still on the drawing board.`);
            return;
          }
          setSpotId(id);
        }}
      />
      <TopBrand crowd={crowd} onSignup={() => onAuth("signup")} onLogin={() => onAuth("login")} />
      <div className="absolute left-1/2 top-[4.6rem] z-20 flex max-w-[96vw] -translate-x-1/2 flex-wrap justify-center gap-2">
        <LayerChip active={filter === "all"} onClick={() => setFilter("all")}>
          Free road
        </LayerChip>
        <LayerChip active={boards} onClick={() => setBoards((open) => !open)}>
          Billboards
        </LayerChip>
        <LayerChip active={filter === "hang"} onClick={() => setFilter("hang")}>
          Neighbours
        </LayerChip>
        <LayerChip active={filter === "sea"} onClick={() => setFilter("sea")}>
          Sea
        </LayerChip>
        <LayerChip active={filter === "civic"} onClick={() => setFilter("civic")}>
          Gov
        </LayerChip>
      </div>
      <div className="absolute left-1/2 top-[7.4rem] z-20 -translate-x-1/2">
        <p className="max-w-[92vw] truncate rounded-full bg-[#006B3F] px-5 py-2 text-sm font-semibold text-white shadow">{headline ?? "Accra is moving"}</p>
      </div>
      <div className="absolute bottom-4 left-1/2 z-20 w-[min(94vw,560px)] -translate-x-1/2 space-y-3">
        {spot ? (
          <div className="rounded-[28px] bg-white p-4 shadow-xl">
            <p className="text-lg font-bold">
              {spot.emoji} {spot.name}
            </p>
            <p className="mt-1 text-sm leading-6 text-[#5c6b82]">{spot.blurb}</p>
          </div>
        ) : null}
        <div className="rounded-[28px] bg-white p-3 shadow-xl">
          <div className="mb-3 flex items-center gap-3 px-2">
            <div className="flex -space-x-2">
              {["#c68a62", "#8d5a3b", "#3d2416", "#a86f4c"].map((color) => (
                <span key={color} className="h-8 w-8 rounded-full border-2 border-white" style={{ background: color }} />
              ))}
            </div>
            <p className="text-sm font-semibold">{crowd.online.toLocaleString("en-GH")} online · free to join</p>
          </div>
          <div className="grid grid-cols-[1.4fr_.8fr] gap-2">
            <button type="button" onClick={() => onAuth("signup")} className="rounded-full bg-[#006B3F] py-3.5 text-base font-bold text-white">
              Sign up free
            </button>
            <button type="button" onClick={() => onAuth("login")} className="rounded-full bg-[#fff1c9] py-3.5 text-base font-bold">
              Log in
            </button>
          </div>
        </div>
      </div>
      {cookieOk ? null : (
        <div className="absolute bottom-0 left-0 right-0 z-30 rounded-t-[28px] bg-white px-5 py-5 text-center shadow-[0_-12px_40px_rgba(22,32,60,.16)] sm:bottom-6 sm:left-1/2 sm:w-[min(92vw,640px)] sm:-translate-x-1/2 sm:rounded-[28px]">
          <p className="text-sm leading-6">
            We keep your Sim on this device, and count a visit. No ad trackers.{" "}
            <button type="button" className="font-semibold text-[#CE1126]" onClick={() => setPrivacy(true)}>
              Privacy
            </button>
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <button type="button" className="rounded-full bg-[#fff1c9] py-3 font-semibold" onClick={() => acceptCookie()}>
              Essential only
            </button>
            <button type="button" className="rounded-full bg-[#006B3F] py-3 font-bold text-white" onClick={() => acceptCookie()}>
              Accept
            </button>
          </div>
        </div>
      )}
      {privacy ? <Privacy onClose={() => setPrivacy(false)} /> : null}
    </>
  );
}

function acceptCookie() {
  localStorage.setItem("accralife-cookie", "1");
  window.dispatchEvent(new Event("accralife-cookie"));
}

function Auth({
  mode,
  accounts,
  onMode,
  onClose,
  flash,
}: {
  mode: "signup" | "login";
  accounts: Account[];
  onMode: (mode: "signup" | "login") => void;
  onClose: () => void;
  flash: (message: string) => void;
}) {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(form: FormData) {
    setError("");
    const username = String(form.get("username") ?? "")
      .trim()
      .toLowerCase()
      .replace(/^@/, "");
    const password = String(form.get("password") ?? "");
    if (!/^[a-z0-9_]{3,16}$/.test(username)) {
      setError("Username is 3–16 letters, numbers, or underscores.");
      return;
    }
    if (password.length < 6) {
      setError("Password needs at least 6 characters.");
      return;
    }
    setPending(true);
    const name = String(form.get("name") ?? "").trim();
    const email = String(form.get("email") ?? "").trim();
    const adult = form.get("adult") === "on";
    let response: Response;
    try {
      response = await fetch(mode === "login" ? "/api/live/login" : "/api/live/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username,
        password,
        name,
        email,
        adult,
        birthId: mode === "signup" ? rollBirth().id : undefined,
      }),
    });
    } catch {
      setPending(false);
      setError("Accra could not open that account.");
      return;
    }
    const payload = (await response.json().catch(() => null)) as { error?: string; account?: Account } | null;
    if (!response.ok || !payload?.account) {
      setPending(false);
      setError(payload?.error ?? "Accra could not open that account.");
      return;
    }
    const local = accounts.find((account) => account.username === username);
    const account: Account = {
      ...payload.account,
      cloud: true,
      life: payload.account.life ?? local?.life ?? null,
    };
    writeSave(
      [...accounts.filter((item) => item.username !== username), account],
      username,
    );
    flash(mode === "login" ? `Welcome back, @${username}.` : `You're in, @${username}.`);
  }

  return (
    <div className="h-dvh overflow-auto bg-[#fff6df] px-5 py-6">
      <button type="button" onClick={onClose} className="text-sm font-semibold text-[#CE1126]">
        ← Back to the city
      </button>
      <div className="mx-auto mt-6 w-full max-w-md text-center">
        <h1 className="font-display text-4xl tracking-tight">
          Accra Life <span className="ml-1 inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#121212] align-middle text-xs font-bold text-white">18+</span>
        </h1>
        <p className="mt-2 text-[#5c6b82]">Live your Accra story with real neighbourhoods.</p>
        <div className="mt-6 rounded-[28px] bg-[#e7edf5] p-1 text-left">
          <div className="grid grid-cols-2 gap-1">
            <button type="button" onClick={() => onMode("signup")} className={`rounded-full py-3 font-semibold ${mode === "signup" ? "bg-white shadow" : ""}`}>
              Create account
            </button>
            <button type="button" onClick={() => onMode("login")} className={`rounded-full py-3 font-semibold ${mode === "login" ? "bg-white shadow" : ""}`}>
              Log in
            </button>
          </div>
          <form
            className="space-y-4 px-3 py-4"
            onSubmit={(event) => {
              event.preventDefault();
              void submit(new FormData(event.currentTarget));
            }}
          >
            {mode === "signup" ? (
              <Field label="Your name" name="name" placeholder="e.g. Ama Mensah" />
            ) : null}
            <label className="block text-sm font-semibold">
              Username
              <span className="mt-2 flex items-center rounded-full bg-white px-4">
                <span className="text-[#8b97ab]">@</span>
                <input name="username" required placeholder="ama_osu" className="w-full bg-transparent py-3 pl-1 outline-none" />
              </span>
              <span className="mt-1 block text-xs font-normal text-[#5c6b82]">This is your Sim&apos;s name in Accra Life.</span>
            </label>
            <Field label="Password" name="password" type="password" placeholder="" hint="At least 6 characters." />
            {mode === "signup" ? (
              <Field label="Email (optional)" name="email" type="email" placeholder="you@email.com" hint="For getting back in. Your username is what people see." />
            ) : null}
            {mode === "signup" ? (
              <label className="flex items-start gap-3 rounded-2xl bg-white px-3 py-3 text-sm">
                <input name="adult" type="checkbox" className="mt-1" />
                <span>
                  I&apos;m <strong>18 or older</strong> and I agree to keep it respectful in this Accra.
                </span>
              </label>
            ) : null}
            {error ? <p className="text-sm font-medium text-[#c2413b]">{error}</p> : null}
            <button type="submit" disabled={pending} className="w-full rounded-full bg-[#006B3F] py-3.5 font-bold text-white disabled:opacity-60">
              {pending ? "Please wait…" : mode === "signup" ? "Sign up · it's free" : "Log in"}
            </button>
            <p className="text-center text-xs leading-5 text-[#5c6b82]">Create a username and you can log in from any phone. That name is yours in Accra.</p>
          </form>
        </div>
      </div>
    </div>
  );
}

function Creator({ account, flash }: { account: Account; flash: (message: string) => void }) {
  const [step, setStep] = useState(0);
  const [look, setLook] = useState<Look>(starterLook);
  const [spin, setSpin] = useState(0);
  const [traits, setTraits] = useState<string[]>([]);
  const [dream, setDream] = useState("oga");
  const birth = birthById(account.birthId);
  const [homeId, setHomeId] = useState(HOMES.find((home) => !birth.blockedHomes.includes(home.id))?.id ?? "adabraka");
  const titles = ["Look", "Personality", "Dream", "Birth lottery", "Home"];

  function randomise() {
    const pick = <T,>(list: readonly T[]) => list[Math.floor(Math.random() * list.length)];
    setLook({
      body: Math.random() > 0.5 ? "woman" : "man",
      hair: pick(HAIRS),
      outfit: pick(OUTFITS),
      pattern: pick(PATTERNS),
      skin: pick(SKINS),
      cloth: pick(CLOTHS),
      accent: pick(ACCENTS),
    });
  }

  function moveIn() {
    const life = freshLife({ look, traits, dream, birthId: birth.id, homeId, username: account.username });
    commitLife(account.username, life);
    flash(`Keys in hand. ${homeById(homeId).area} is home.`);
  }

  const canNext = step === 1 ? traits.length >= 2 : true;

  return (
    <div className="flex h-dvh flex-col bg-[#fff6df] lg:flex-row">
      <div
        className="relative z-0 flex h-[56vh] shrink-0 items-center justify-center overflow-hidden pt-16 lg:h-dvh lg:flex-1"
        onPointerDown={(event) => {
          const start = event.clientX;
          const base = spin;
          const move = (ev: PointerEvent) => setSpin(base + (ev.clientX - start) / 2);
          const up = () => {
            window.removeEventListener("pointermove", move);
            window.removeEventListener("pointerup", up);
          };
          window.addEventListener("pointermove", move);
          window.addEventListener("pointerup", up);
        }}
      >
        <div className="absolute left-4 right-4 top-4 flex items-center justify-between">
          <button type="button" onClick={() => (step === 0 ? writeSave(parseRaw(getRaw()).accounts, null) : setStep((value) => value - 1))} className="grid h-11 w-11 place-items-center rounded-full bg-white shadow" aria-label="Back">
            ←
          </button>
          <div className="text-center">
            <p className="font-display text-xl">{titles[step]}</p>
            <div className="mt-1 flex justify-center gap-1">
              {[0, 1, 2, 3].map((index) => (
                <span key={index} className={`h-1.5 w-6 rounded-full ${index <= Math.min(step, 3) ? "bg-[#006B3F]" : "bg-[#ead9a0]"}`} />
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={randomise} className="grid h-11 w-11 place-items-center rounded-full bg-white shadow" aria-label="Randomise">
              ↻
            </button>
            <button type="button" disabled={!canNext || step === 4} onClick={() => setStep((value) => Math.min(4, value + 1))} className="rounded-full bg-[#006B3F] px-4 py-2 text-sm font-bold text-white disabled:opacity-40">
              Next
            </button>
          </div>
        </div>
        <div className="h-[min(44vh,340px)] w-[min(72vw,260px)]">
          <LowPolyHuman
            skin={look.skin}
            shirt={look.cloth}
            pants={look.accent}
            hair={look.hair}
            cloth={look.cloth}
            pattern={look.pattern}
            outfit={look.outfit}
            body={look.body}
            yaw={spin}
          />
        </div>
        <p className="absolute bottom-1 text-xs text-[#8b97ab]">Drag to spin</p>
      </div>
      <div className="relative z-10 min-h-0 flex-1 overflow-auto rounded-t-[28px] bg-white p-5 shadow-xl lg:m-4 lg:max-h-none lg:w-[440px] lg:flex-none lg:rounded-[28px]">
        {step === 0 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-full bg-[#fff1c9] px-4 py-3">
              <span className="font-bold">@{account.username}</span>
              <span className="text-sm text-[#8b97ab]">your Sim&apos;s name</span>
            </div>
            <Choice label="Body" options={["woman", "man"]} value={look.body} onChange={(body) => setLook({ ...look, body: body as Look["body"] })} />
            <p className="text-sm font-semibold">Hairstyle</p>
            <div className="flex flex-wrap gap-2">
              {HAIRS.map((hair) => (
                <Chip key={hair} active={look.hair === hair} onClick={() => setLook({ ...look, hair })}>
                  {hair}
                </Chip>
              ))}
            </div>
            <p className="text-sm font-semibold">Outfit</p>
            <div className="flex flex-wrap gap-2">
              {OUTFITS.map((outfit) => (
                <Chip key={outfit} active={look.outfit === outfit} onClick={() => setLook({ ...look, outfit })}>
                  {outfit}
                </Chip>
              ))}
            </div>
            <p className="text-sm font-semibold">Cloth</p>
            <div className="flex flex-wrap gap-2">
              {PATTERNS.map((pattern) => (
                <Chip key={pattern} active={look.pattern === pattern} onClick={() => setLook({ ...look, pattern })}>
                  {pattern}
                </Chip>
              ))}
            </div>
            <Swatches label="Skin" colors={SKINS} value={look.skin} onChange={(skin) => setLook({ ...look, skin })} />
            <Swatches label="Top" colors={CLOTHS} value={look.cloth} onChange={(cloth) => setLook({ ...look, cloth })} />
            <Swatches label="Accent" colors={ACCENTS} value={look.accent} onChange={(accent) => setLook({ ...look, accent })} />
            <Choice label="Height" options={[...HEIGHTS]} value={look.height ?? "medium"} onChange={(height) => setLook({ ...look, height: height as Look["height"] })} />
            <Choice label="Build" options={[...BUILDS]} value={look.build ?? "average"} onChange={(build) => setLook({ ...look, build: build as Look["build"] })} />
            <Choice label="Face" options={[...FACES]} value={look.face ?? "oval"} onChange={(face) => setLook({ ...look, face: face as Look["face"] })} />
            {look.body === "man" ? (
              <Choice label="Facial hair" options={[...BEARDS]} value={look.beard ?? "none"} onChange={(beard) => setLook({ ...look, beard: beard as Look["beard"] })} />
            ) : null}
          </div>
        ) : null}
        {step === 1 ? (
          <div className="space-y-3">
            <p className="text-sm text-[#5c6b82]">Choose 2 or 3 traits for {account.username}.</p>
            {TRAITS.map((trait) => {
              const on = traits.includes(trait.id);
              return (
                <button
                  key={trait.id}
                  type="button"
                  onClick={() =>
                    setTraits((current) => {
                      if (current.includes(trait.id)) return current.filter((id) => id !== trait.id);
                      if (current.length >= 3) return current;
                      return [...current, trait.id];
                    })
                  }
                  className={`block w-full rounded-3xl px-4 py-3 text-left ${on ? "bg-[#fff4c2] ring-2 ring-[#FCD116]" : "bg-[#f4f7fb]"}`}
                >
                  <p className="font-bold">
                    {trait.emoji} {trait.name}
                  </p>
                  <p className="text-sm leading-5 text-[#5c6b82]">{trait.detail}</p>
                </button>
              );
            })}
          </div>
        ) : null}
        {step === 2 ? (
          <div className="space-y-3">
            <p className="text-sm text-[#5c6b82]">What&apos;s {account.username}&apos;s big dream?</p>
            {DREAMS.map((item) => (
              <button key={item.id} type="button" onClick={() => setDream(item.id)} className={`block w-full rounded-3xl px-4 py-3 text-left ${dream === item.id ? "bg-[#fff4c2] ring-2 ring-[#FCD116]" : "bg-[#f4f7fb]"}`}>
                <p className="font-bold">
                  {item.emoji} {item.name}
                </p>
                <p className="text-sm text-[#5c6b82]">{item.detail}</p>
              </button>
            ))}
          </div>
        ) : null}
        {step === 3 ? (
          <div className="text-center">
            <p className="text-sm text-[#5c6b82]">Every Accra life starts somewhere. What was {account.username} born into?</p>
            <div className="mx-auto mt-4 grid h-24 w-24 place-items-center rounded-3xl bg-[#f6e7a8] text-4xl">{birth.emoji}</div>
            <h2 className="mt-3 font-display text-3xl">{birth.name}</h2>
            <p className="text-[#5c6b82]">{birth.line}</p>
            <ul className="mt-4 space-y-2 text-left">
              {birth.perks.map((perk) => (
                <li key={perk} className="rounded-2xl bg-[#f4f7fb] px-4 py-3 text-sm">
                  💪 {perk}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-[#8b97ab]">Decided once for this account. A new life on the same login keeps it.</p>
          </div>
        ) : null}
        {step === 4 ? (
          <div className="space-y-3">
            <p className="text-sm text-[#5c6b82]">Where will {account.username} live? Rent leaves the wallet every Saturday.</p>
            {HOMES.map((home) => {
              const blocked = birth.blockedHomes.includes(home.id);
              const on = homeId === home.id;
              return (
                <button
                  key={home.id}
                  type="button"
                  disabled={blocked}
                  onClick={() => setHomeId(home.id)}
                  className={`block w-full rounded-3xl px-4 py-3 text-left disabled:opacity-50 ${on ? "bg-[#fff4c2] ring-2 ring-[#FCD116]" : "bg-[#f4f7fb]"}`}
                >
                  <p className="font-bold">
                    {home.emoji} {home.name} · {home.area}
                  </p>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#006B3F]">{home.tag}</p>
                  <p className="mt-1 text-sm leading-5 text-[#5c6b82]">{blocked ? "Work your way here." : home.detail}</p>
                  <p className="text-sm text-[#5c6b82]">{homeLook(home.id).label}</p>
                  <p className="mt-1 text-sm font-semibold">Rent {cedis(home.rent)}/wk</p>
                </button>
              );
            })}
          </div>
        ) : null}
        <button
          type="button"
          disabled={!canNext}
          onClick={() => (step === 4 ? moveIn() : setStep((value) => value + 1))}
          className="mt-4 w-full rounded-full bg-[#006B3F] py-3.5 font-bold text-white disabled:opacity-40"
        >
          {step === 1 && traits.length < 2 ? `Choose ${2 - traits.length} more` : step === 3 ? "Choose where to live" : step === 4 ? "Move in" : "Continue"}
        </button>
      </div>
    </div>
  );
}

function Play({ account, flash }: { account: Account; flash: (message: string) => void }) {
  const life = account.life;
  const [tab, setTab] = useState<"home" | "buy" | "map" | "phone">("home");
  const [filter, setFilter] = useState<string>("all");
  const [mapQuery, setMapQuery] = useState("");
  const [routesOn, setRoutesOn] = useState(false);
  const [chipsOpen, setChipsOpen] = useState(true);
  const chipTimer = useRef<number | null>(null);
  const chipsHidden = useRef(false);
  const [travelOpen, setTravelOpen] = useState(false);
  const [boards, setBoards] = useState(true);
  const [ads, setAds] = useState<Record<string, string>>({});
  const [boardId, setBoardId] = useState<string | null>(null);
  const [adLine, setAdLine] = useState("");
  const [placeId, setPlaceId] = useState<string | null>(null);
  const [needsOpen, setNeedsOpen] = useState(false);
  const [walletOpen, setWalletOpen] = useState(false);
  const [clean, setClean] = useState(false);
  const [hintsOpen, setHintsOpen] = useState(false);
  const [doOpen, setDoOpen] = useState(false);
  const [rideId, setRideId] = useState<Ride["id"]>(life?.car ? "car" : "trotro");
  const [trip, setTrip] = useState<{ name: string; placeId: string; ride: Ride } | null>(null);
  const [flight, setFlight] = useState<{ routeId: string; cabin: Cabin; own?: boolean } | null>(null);
  const [shiftId, setShiftId] = useState<string | null>(null);
  const [payday, setPayday] = useState<{ earned: number; performance: number } | null>(null);
  const [chatLaunch, setChatLaunch] = useState<{ id: string } | null>(null);
  const [onAir, setOnAir] = useState(false);
  const [errand, setErrand] = useState<{ spot: string; n: number } | null>(null);
  const [menuFocus, setMenuFocus] = useState<string | null>(null);
  const [now, setNow] = useState<number | null>(null);
  const herePeople = usePlacePeople(account.life?.where ?? null, account.cloud ? 3000 : 15000);
  const sheetPeople = usePlacePeople(placeId);
  const moveGate = useRef<{ at: number; timer: number | null }>({ at: 0, timer: null });
  const [tradeOpen, setTradeOpen] = useState(false);
  const [visit, setVisit] = useState<HostHome | null>(null);
  const [ping, setPing] = useState<InboxPing | null>(null);
  const playerEvents = usePlayerEvents(Boolean(account.cloud));
  const [phoneApp, setPhoneApp] = useState<string | null>(null);
  const [arrangeHome, setArrangeHome] = useState(false);
  const [tourStep, setTourStep] = useState<TourId>("welcome");
  useAlertPings(life, flash);
  useTurnPings(account.username, Boolean(account.cloud), flash);
  useChopSign(Boolean(account.cloud), life);
  const inbox = useInbox(account.username, Boolean(account.cloud), (next) => {
    setPing(next);
    window.setTimeout(() => setPing((current) => (current?.at === next.at ? null : current)), 6000);
    // Visitor walked into your place — show them on the sofa as a real player guest.
    if (life?.where === "home" && /at your place/i.test(next.text) && next.username) {
      const arrived = receiveGuest(life, next.name.replace(/^@/, "") || next.username, { invited: true, username: next.username });
      commitLife(account.username, tickGuests(arrived.life));
      if (arrived.note) flash(arrived.note);
    }
    try {
      if (typeof Notification !== "undefined" && Notification.permission === "granted" && document.hidden) {
        new Notification(next.name, { body: next.text, tag: `accralife-${next.id}` });
      }
    } catch {}
  });
  useEffect(() => {
    try {
      const saved = localStorage.getItem("accralife-boards");
      if (saved) setAds(JSON.parse(saved) as Record<string, string>);
    } catch {
      setAds({});
    }
  }, []);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);
  useEffect(() => {
    if (life?.car && !carSpoilt(life)) setRideId("car");
    else setRideId((current) => (current === "car" ? "trotro" : current));
  }, [life?.car?.id, life?.car?.broken, life?.car?.condition]);
  if (!life) return null;
  const mood = moodOf(life.needs);
  const quest = questFor(life);
  const crowd = useCityCrowd();
  const place = placeId ? spotById(placeId) : null;
  const city = now == null ? QUIET_CITY : cityNow(new Date(now), life.town);
  const car = carRide(life);
  const sick = sickness(life);
  const guide = guideNext(life);
  const showGem = life.gemDay !== Math.floor(life.minutes / 1440) && quest.title !== "Daily gem hunt";
  const showCity = Boolean(city.events.length || city.match || city.weather.rain || city.weather.harmattan);
  const showGuide = Boolean(guide && (guide.done(life) || guide.title !== quest.title));
  const extraHints = [showGem, showCity, life.dumsor, showGuide, Boolean(sick)].filter(Boolean).length;
  const phoneHint = hintsOpen ? "" : "hidden";
  const homeRide = farRide(car && (life.car?.fuel ?? 0) >= 6 && !carSpoilt(life) ? car : rideIn(RIDES[1], city.weather), life.where, "home");
  const touring = !life.tour && !trip && !flight && !shiftId && !payday;
  const tourCard = TOUR.find((item) => item.id === tourStep) ?? TOUR[0];

  function apply(result: StepResult) {
    if (result.error) {
      flash(result.error);
      return;
    }
    const settled = settleGuests(result.life);
    if (settled.notes.length) result = { ...result, notes: [...settled.notes, ...result.notes] };
    let nextLife = settled.life;
    // Offline-only: scripted neighbours. Online homes invite real Accra Life players.
    if (!account.cloud && nextLife.where === "home" && !(nextLife.guests ?? []).some((guest) => guest.doing !== "leave" && guest.doing !== "dine") && Math.random() < 0.18) {
      const knock = maybeKnock(nextLife);
      nextLife = knock.life;
      if (knock.note) result = { ...result, notes: [knock.note, ...result.notes] };
    }
    const badged = syncBadges(nextLife);
    commitLife(account.username, badged.life);
    const note = [result.notes.filter(Boolean)[0], badged.notes[0]].filter(Boolean).join(" · ");
    if (note) flash(note);
  }

  function endClubNight(thenHome = false) {
    const left = leaveClubNight(life!);
    if (left.shouldPost && left.place) {
      const posted = postClout(left.life, left.place);
      apply({ life: posted.error ? left.life : posted.life, notes: [...left.notes, ...(posted.error ? [] : posted.notes)] });
    } else {
      apply(left);
    }
    if (thenHome) setTrip({ name: "Home", placeId: "home", ride: homeRide });
  }

  function actHere(verb: Verb, person?: string) {
    if (verb.id === "phone-post") {
      apply(postClout(life!, spotById(life!.where).name));
      return;
    }
    if (verb.id === "club-leave") {
      endClubNight(true);
      return;
    }
    const event = verb.id.startsWith("pev-") ? playerEvents.find((item) => eventVerbId(item) === verb.id) : null;
    const result = person ? runVerb(life!, verb, life!.where, person) : payOffer(life!, verb, offerFrom(verb), life!.where);
    apply(result);
    if (event && !result.error && account.cloud) {
      void fetch("/api/live/play", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "event-attend", owner: event.host, id: event.id }) }).catch(() => undefined);
    }
  }

  async function netAction(body: Record<string, unknown>) {
    if (body.action === "refresh") {
      inbox.refresh();
      return null;
    }
    if (!account.cloud) return "This needs an online account.";
    const { api, ...rest } = body;
    const response = await fetch(api === "play" ? "/api/live/play" : "/api/live/social", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...rest, life: account.life }) });
    const data = (await response.json().catch(() => null)) as { error?: string; life?: Life; note?: string } | null;
    if (!response.ok || data?.error) return data?.error ?? "That did not go through.";
    if (data?.life) commitLife(account.username, data.life);
    if (data?.note) flash(data.note);
    inbox.refresh();
    return null;
  }

  async function visitHost(host: string) {
    const response = await fetch(`/api/live/social?home=${encodeURIComponent(host)}`);
    const data = (await response.json().catch(() => null)) as { home?: HostHome; error?: string } | null;
    if (!response.ok || !data?.home) {
      flash(data?.error ?? "You need an invite to visit.");
      return;
    }
    setVisit(data.home);
    setTab("home");
    void fetch("/api/live/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ to: host, text: "🚪 I'm at your place!" }) }).catch(() => undefined);
  }

  function leaveVisit() {
    setVisit(null);
    setTab("map");
  }

  function shareSpot(x: number, y: number) {
    if (!account.cloud || !life || life.where === "home") return;
    const where = life.where;
    const send = () => {
      moveGate.current.at = Date.now();
      moveGate.current.timer = null;
      void fetch("/api/live/move", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ where, x, y }) }).catch(() => undefined);
    };
    if (moveGate.current.timer) window.clearTimeout(moveGate.current.timer);
    const wait = 1200 - (Date.now() - moveGate.current.at);
    if (wait <= 0) send();
    else moveGate.current.timer = window.setTimeout(send, wait);
  }

  async function paySomeone(name: string, amount: number, username?: string) {
    const mine = account.life;
    if (!mine) return "No life yet.";
    let handle = (username ?? "").trim().toLowerCase().replace(/^@/, "");
    if (account.cloud && !/^[a-z0-9_]{3,16}$/.test(handle)) {
      const found = await fetch(`/api/live/people?q=${encodeURIComponent(name)}`).then((response) => response.json()).catch(() => null);
      const match = (found?.people as { username: string; name: string }[] | undefined)?.find((person) => person.username === name.trim().toLowerCase() || person.name.trim().toLowerCase() === name.trim().toLowerCase());
      if (match) handle = match.username;
    }
    if (account.cloud && /^[a-z0-9_]{3,16}$/.test(handle) && handle !== account.username) {
      const response = await fetch("/api/live/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: handle, amount, life: mine }),
      });
      const data = (await response.json().catch(() => null)) as { error?: string; life?: Life; note?: string } | null;
      if (!response.ok || !data?.life) {
        const error = data?.error ?? "MoMo did not go through.";
        flash(error);
        return error;
      }
      commitLife(account.username, data.life);
      if (data.note) flash(data.note);
      return null;
    }
    const snap = parseRaw(getRaw());
    const other = snap.accounts.find((item) => {
      if (!item.life || item.username === account.username) return false;
      if (username && item.username === username) return true;
      return item.name === name || item.username === name;
    });
    const paid = giftCash(mine, other?.name ?? name, amount);
    if (paid.error) {
      flash(paid.error);
      return paid.error;
    }
    if (other?.life) {
      const received = receiveCash(other.life, `@${account.username}`, amount);
      writeSave(
        snap.accounts.map((item) => {
          if (item.username === account.username) return { ...item, life: paid.life };
          if (item.username === other.username) return { ...item, life: received };
          return item;
        }),
        snap.session,
      );
    } else commitLife(account.username, paid.life);
    const note = paid.notes[0];
    if (note) flash(note);
    return null;
  }

  const mapBeat = now != null ? Math.floor(now / 1_800_000) : 0;
  const mapAt = useMemo(() => new Date(mapBeat * 1_800_000 || Date.now()), [mapBeat]);
  const mapNight = now != null && (accraHour(new Date(now)) >= 19 || accraHour(new Date(now)) < 5);

  return (
    <div className="fixed inset-0 h-dvh w-full max-w-full overflow-clip overscroll-none touch-none">
      <Soundtrack tune={tuneFor(life.where, onAir)} />
      <CrisisLayer life={life} onApply={apply} />
      {tab === "map" ? (
        <CityBoard
          night={mapNight}
          filter={filter}
          boards={boards}
          ads={ads}
          active={placeId}
          at={mapAt}
          town={life.town}
          query={mapQuery}
          stars={life.stars ?? []}
          transport={routesOn}
          player={spotOnMap(spotById(life.where), (life.town ?? "accra") === "kumasi" ? "kumasi" : "accra") ? { x: spotById(life.where).x, y: spotById(life.where).y, name: account.name } : null}
          aim={place && spotOnMap(place, (life.town ?? "accra") === "kumasi" ? "kumasi" : "accra") && place.id !== life.where ? { x: place.x, y: place.y } : null}
          onBoard={setBoardId}
          onPan={() => {
            if (!chipsHidden.current) {
              chipsHidden.current = true;
              setChipsOpen(false);
            }
            if (chipTimer.current) window.clearTimeout(chipTimer.current);
            chipTimer.current = window.setTimeout(() => {
              chipsHidden.current = false;
              setChipsOpen(true);
            }, 700);
          }}
          onSelect={(id) => {
            const spot = spotById(id);
            if (spot.soon) {
              flash(`${spot.name} is still on the drawing board.`);
              return;
            }
            if (id === "home") {
              setTrip({ name: "Home", placeId: "home", ride: homeRide });
              setPlaceId(null);
              return;
            }
            setPlaceId(id);
          }}
        />
      ) : tab === "home" && life.where === "home" ? (
        <>
        <RoomView
          life={life}
          errand={errand}
          onMap={() => setTab("map")}
          onAsk={() => setDoOpen(true)}
          onMotor={apply}
          onLay={(id, x, z, rot) => apply(layPiece(life, id, x, z, rot))}
          onMat={(id) => apply(layMat(life, id))}
          onLights={() => apply(flipLamps(life))}
          onStore={(id) => apply(storePiece(life, id))}
          onSell={(id) => apply(sellPiece(life, id))}
          onMend={(id, how) => apply(mendItem(life, id, how))}
          onAct={(id) => {
            const verb = HOME_VERBS.find((item) => item.id === id);
            if (verb) apply(runVerb(life, verb, "home"));
          }}
          onRun={(verb) => apply(runVerb(life, verb, "home"))}
          onCook={(recipeId, shareWith) => apply(cookAtHome(life, recipeId, shareWith))}
          onHang={(name, kind) => apply(hangWithGuest(life, name, kind))}
          onSleepover={(name) => apply(offerSleepover(life, name))}
          onSendHome={(name) => apply(sendGuestHome(life, name))}
          onOpenDoor={(name) => apply(openDoor(life, name))}
          cloud={Boolean(account.cloud)}
          friends={inbox.threads.filter((thread) => thread.id.startsWith("user:")).map((thread) => ({ username: thread.username, name: thread.name }))}
          invites={inbox.social?.invites ?? []}
          onInvite={(username) => {
            if (!account.cloud) {
              flash("Sign in online to invite real Accra Life players.");
              return;
            }
            const friend = inbox.threads.find((thread) => thread.username === username);
            const name = friend?.name ?? `@${username}`;
            void netAction({ action: "invite", to: username }).then((error) => {
              if (error) {
                flash(error);
                return;
              }
              apply(invitePerson(life, name, username));
            });
          }}
          onVisit={(username) => void visitHost(username)}
          onUpgrade={() => setTab("buy")}
          onWiden={() => apply(widenRoom(life))}
          startArrange={arrangeHome}
          onArrangeSeen={() => setArrangeHome(false)}
        />
        </>
      ) : tab === "home" ? (
        <VenueFloor
          key={life.where}
          life={life}
          people={herePeople}
          me={account.username}
          sprayName={account.name}
          onPurse={(action) => {
            const snap = parseRaw(getRaw());
            const current = snap.accounts.find((item) => item.username === account.username)?.life ?? life;
            const result = action.kind === "spray" ? sprayCash(current, action.id, account.name) : catchCash(current, action.value);
            if (result.error) {
              if (action.kind === "spray") flash(result.error);
              return result;
            }
            commitLife(account.username, result.life);
            if (result.notes[0]) flash(result.notes[0]);
            return result;
          }}
          onMove={shareSpot}
          onTrade={() => setTradeOpen(true)}
          friends={inbox.threads.filter((thread) => thread.id.startsWith("user:")).map((thread) => ({ username: thread.username, name: thread.name }))}
          onClaimTable={(seatId) => commitLife(account.username, claimTable(life, seatId))}
          onClearTable={() => commitLife(account.username, clearTable(life))}
          onInviteTable={(username, seatId) => {
            if (!account.cloud) {
              const friend = inbox.threads.find((thread) => thread.username === username);
              apply(inviteToTable(life, friend?.name ?? `@${username}`, { username, seatId }));
              return;
            }
            void netAction({ action: "invite-table", to: username, spot: life.where, seatId }).then((error) => {
              if (error) {
                flash(error);
                return;
              }
              apply(inviteToTable(life, `@${username}`, { username, seatId }));
            });
          }}
          focus={menuFocus}
          lively={(() => {
            const heat = happeningsAt(life.where, now ? new Date(now) : new Date())[0]?.heat ?? "quiet";
            if (heat === "packed") return true;
            const group = spotById(life.where).group;
            return heat === "busy" && (group === "hang" || group === "sea");
          })()}
          extra={[
            ...playerVerbs(life.where, playerEvents, life, now),
            ...eventVerbs(life.where, city),
            ...happeningVerbs(life.where, now ? new Date(now) : new Date()),
            ...kitVerbs(spotById(life.where)),
            ...(CLUB_IDS.has(life.where) || spotById(life.where).group === "hang" || spotById(life.where).group === "sea"
              ? [
                  {
                    id: "phone-post",
                    label: "Post a story",
                    detail: "Snap the night. Accra sees it on your phone.",
                    minutes: 5,
                    cost: 5,
                    earn: 0,
                    effects: { fun: 6, social: 4 },
                    emoji: "📸",
                  } satisfies Verb,
                ]
              : []),
          ]}
          homeFare={homeRide.cost}
          onHome={() => {
            const session = sessionOf(life);
            if (session && (session.danced || session.bottles > 0 || session.spend >= 40)) {
              endClubNight(true);
              return;
            }
            setTrip({ name: "Home", placeId: "home", ride: homeRide });
          }}
          onAct={(verb, person) => actHere(verb, person)}
          onApply={apply}
          onPay={(person, amount, username) => paySomeone(person, amount, username)}
          onOpenChat={(username) => {
            setChatLaunch({ id: `user:${username}` });
            setTab("phone");
          }}
        >
          <HappeningBanner spotId={life.where} at={now ? new Date(now) : new Date()} people={herePeople.length} />
          <WeeklyCard life={life} spotId={life.where} here cloud={Boolean(account.cloud)} onCheck={() => apply(checkIn(life, new Date()))} />
          <PlayerChops spotId={life.where} here cloud={Boolean(account.cloud)} onNet={netAction} />
        </VenueFloor>
      ) : (
        <div className="h-full bg-[#fff6df]" />
      )}
      {city.weather.rain && !(tab === "home" && life.where === "home") ? <div className={`rain-layer pointer-events-none absolute inset-0 z-10 ${city.weather.flood ? "rain-heavy" : ""}`} aria-hidden /> : null}
      {city.weather.harmattan && !city.weather.rain && !(tab === "home" && life.where === "home") ? <div className="harmattan-layer pointer-events-none absolute inset-0 z-10" aria-hidden /> : null}
      {clean ? (
        <button type="button" className="absolute bottom-4 left-4 z-30 rounded-full bg-white px-4 py-2 text-sm font-semibold shadow" onClick={() => setClean(false)}>
          Show screen
        </button>
      ) : (
        <>
          <div className="absolute left-2 right-2 top-[max(0.5rem,env(safe-area-inset-top))] z-20 flex items-center gap-1.5 sm:left-3 sm:right-3 sm:gap-2">
            <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden rounded-full bg-white px-2.5 py-1.5 text-xs shadow-lg sm:gap-2 sm:px-3 sm:py-2 sm:text-sm">
              <span>🌙</span>
              <span className="truncate font-semibold">{now == null ? "Accra" : clockLabel(undefined, new Date(now))}</span>
              <span className="text-[#c5ceda]">|</span>
              <span className="shrink-0">
                {mood.emoji} <span className="hidden min-[420px]:inline">{mood.label}</span>
              </span>
              {crowd.online > 0 ? <span className="shrink-0 text-[#006B3F]">● {crowd.online.toLocaleString("en-GH")} online</span> : null}
            </div>
            <button type="button" className="shrink-0 rounded-full bg-white px-2.5 py-1.5 text-xs font-bold shadow-lg sm:px-3 sm:py-2 sm:text-sm" onClick={() => setWalletOpen(true)}>
              {cedis(life.cash)} +
            </button>
          </div>
          {enRouteGuests(life)[0] || doorGuests(life)[0] ? (
            <button
              type="button"
              className="absolute left-1/2 top-[max(3.4rem,calc(env(safe-area-inset-top)+2.8rem))] z-30 max-w-[min(22rem,calc(100%-2rem))] -translate-x-1/2 rounded-full bg-[#121212] px-4 py-2 text-center text-[11px] font-semibold text-white shadow-lg"
              onClick={() => {
                const knocking = doorGuests(life)[0];
                if (knocking && life.where === "home") {
                  apply(openDoor(life, knocking.name));
                  setTab("home");
                  return;
                }
                setTab(life.where === "home" ? "home" : "map");
              }}
            >
              {doorGuests(life)[0]
                ? `${doorGuests(life)[0].name} is at your door.${life.where === "home" ? " Tap to open." : " Head home."}`
                : `${enRouteGuests(life)[0].name} · ${enRouteGuests(life)[0].ride} from ${enRouteGuests(life)[0].from} · ${minutesAway(life, enRouteGuests(life)[0])}m`}
            </button>
          ) : null}
          <div className={`absolute left-2 z-20 max-w-[min(10rem,calc(100%-6.5rem))] space-y-1 sm:left-3 ${tab === "map" ? "top-[max(6.15rem,calc(env(safe-area-inset-top)+5.5rem))]" : "top-[max(4.4rem,calc(env(safe-area-inset-top)+3.8rem))]"}`}>
            <button
              type="button"
              className="w-full truncate rounded-full bg-white px-2.5 py-1 text-left text-xs font-bold shadow"
              onClick={() => {
                const sendHome = (spot: string) => {
                  if (life.where !== "home") {
                    flash(spot === "cooler" ? "Head home. The cooler is there." : spot === "toilet" ? "The toilet is at home." : "The bed is at home.");
                    return;
                  }
                  setTab("home");
                  setErrand((current) => ({ spot, n: (current?.n ?? 0) + 1 }));
                };
                if (quest.title === "Eat something") {
                  if (life.where === "home") {
                    sendHome("cooler");
                    return;
                  }
                  const food = spotById(life.where).actions.find((verb) => verb.tag === "food");
                  setTab("home");
                  if (food) {
                    setMenuFocus(food.id);
                    return;
                  }
                  flash("Head home. The cooler is there.");
                  return;
                }
                if (quest.title === "Find a toilet") {
                  sendHome("toilet");
                  return;
                }
                if (quest.title === "Rest your body") {
                  sendHome("bed");
                  return;
                }
                setTab("map");
              }}
            >
              {quest.title}
            </button>
            {showGem ? (
              <button type="button" className={`w-full truncate rounded-full bg-white px-2.5 py-1 text-left text-xs font-bold shadow ${phoneHint}`} onClick={() => setTab("map")}>
                Gem · {spotById(gemSpotId(life.minutes)).name}
              </button>
            ) : null}
            {showCity ? (
              <button
                type="button"
                className={`w-full rounded-2xl px-3 py-2 text-left text-white shadow ${phoneHint} ${city.weather.flood ? "bg-[#1f4e79]" : city.weather.harmattan && !city.weather.rain ? "bg-[#8a6a3c]" : city.match?.live ? "bg-[#CE1126]" : "bg-[#006B3F]"}`}
                onClick={() => {
                  const target = eventSpot(city);
                  if (!target) return;
                  setTab("map");
                  setPlaceId(target);
                }}
              >
                <p className="line-clamp-2 text-xs font-bold">{city.headline}</p>
                {city.weather.rain && !city.weather.flood ? <p className="text-[11px] opacity-90">🌧️ {city.weather.label} Rides are slower and cost a bit more.</p> : null}
                {city.weather.harmattan && !city.weather.rain ? <p className="text-[11px] opacity-90">🌫️ {city.weather.label}</p> : null}
              </button>
            ) : null}
            {life.dumsor ? <p className={`w-full rounded-full bg-[#121212] px-3 py-2 text-xs font-semibold text-white ${phoneHint}`}>Dumsor. The lights are out.</p> : null}
            {guide && showGuide ? (
              <button
                type="button"
                className={`w-full truncate rounded-full px-2.5 py-1 text-left text-xs font-bold shadow ${phoneHint} ${guide.done(life) ? "bg-[#FCD116]" : "bg-white"}`}
                onClick={() => {
                  if (guide.done(life)) {
                    apply(claimGuide(life, guide.id));
                    return;
                  }
                  if (guide.app) {
                    setPhoneApp(guide.app);
                    setTab("phone");
                    return;
                  }
                  setTab(guide.id === "eat" ? "home" : "map");
                }}
              >
                {guide.done(life) ? `${guide.title} ✓ ₵25` : guide.title}
              </button>
            ) : null}
            {sick ? (
              <button type="button" className={`w-full rounded-2xl bg-[#0e7c6b] px-3 py-2 text-left text-xs font-semibold text-white shadow ${phoneHint}`} onClick={() => (setPhoneApp("health"), setTab("phone"))}>
                🤒 {sick.label}. Work pays half. Open Health on your phone.
              </button>
            ) : null}
            {!sick && hangoverActive(life) ? (
              <p className={`w-full rounded-2xl bg-[#3b2a1a] px-3 py-2 text-left text-xs font-semibold text-[#f5d7a4] shadow ${phoneHint}`}>
                Club hangover. Sleep clears it — or move slow till it fades.
              </p>
            ) : null}
            <div className="flex flex-wrap gap-1.5">
              {extraHints ? (
                <button type="button" className="rounded-full bg-white/90 px-2.5 py-0.5 text-[11px] font-semibold shadow" onClick={() => setHintsOpen((open) => !open)}>
                  {hintsOpen ? "▴ Less" : `▾ ${extraHints} more`}
                </button>
              ) : null}
              <button type="button" className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold shadow" onClick={() => setClean(true)}>
                ⌃ <span className="sm:hidden">Hide</span>
                <span className="hidden sm:inline">Clean screen</span>
              </button>
            </div>
          </div>
          {tab === "map" ? (
            <div className="pointer-events-none absolute left-2 right-2 top-[max(3.35rem,calc(env(safe-area-inset-top)+2.85rem))] z-30 sm:left-3 sm:right-3 sm:top-[max(3.15rem,calc(env(safe-area-inset-top)+2.55rem))]">
              <MapFilterBar
                tucked={!chipsOpen}
                filter={filter}
                boards={boards || Boolean(boardId)}
                routesOn={routesOn}
                query={mapQuery}
                town={townOf(life.town).name}
                eventTitle={townEventNow(townOf(life.town), mapAt)?.title ?? "Hustle loop live"}
                onFilter={setFilter}
                onBoards={() => setBoardId((current) => (current ? null : "oxford"))}
                onRoutes={() => setRoutesOn((on) => !on)}
                onQuery={setMapQuery}
                onPerson={(person) => {
                  const here = (life.town ?? "accra") as TownId;
                  if (!person.where || person.where === "home") {
                    flash(`${person.name} is at home.`);
                    return;
                  }
                  const spot = SPOTS.find((item) => item.id === person.where);
                  if (!spot) {
                    flash(`${person.name} is out.`);
                    return;
                  }
                  const theirs = (spot.town ?? "accra") as TownId;
                  if (theirs !== here) {
                    flash(`${person.name} is in ${townOf(theirs).name}.`);
                    return;
                  }
                  setPlaceId(spot.id);
                }}
                onTravel={() => setTravelOpen(true)}
                onShops={() => {
                  setPhoneApp("shops");
                  setTab("phone");
                }}
                onShow={() => {
                  chipsHidden.current = false;
                  if (chipTimer.current) window.clearTimeout(chipTimer.current);
                  setChipsOpen(true);
                }}
              />
            </div>
          ) : null}
          <button
            type="button"
            className={`absolute bottom-[max(5.4rem,calc(env(safe-area-inset-bottom)+4.6rem))] left-2 z-20 flex items-center gap-2 rounded-full bg-white p-1 shadow-lg sm:bottom-[max(6.5rem,calc(env(safe-area-inset-bottom)+5.5rem))] sm:left-3 sm:p-1.5 ${touring && tourStep === "needs" ? "ring-2 ring-[#FCD116] ring-offset-2 animate-pulse" : ""}`}
            onClick={() => setNeedsOpen(true)}
            aria-label="Open needs"
          >
            <span className="grid h-10 w-10 place-items-center rounded-full text-lg sm:h-12 sm:w-12 sm:text-xl" style={{ background: life.look.skin }} aria-hidden>
              🙂
            </span>
            <span className="hidden grid-cols-3 gap-1 pr-2 sm:grid">
              <Need n={life.needs.hunger} icon="🍛" />
              <Need n={life.needs.energy} icon="⚡" />
              <Need n={life.needs.fun} icon="🎉" />
              <Need n={life.needs.social} icon="💬" />
              <Need n={life.needs.hygiene} icon="🫧" />
              <Need n={life.needs.bladder} icon="🚽" />
            </span>
          </button>
          <nav className="absolute bottom-[max(0.6rem,env(safe-area-inset-bottom))] left-1/2 z-20 flex max-w-[calc(100%-1rem)] -translate-x-1/2 items-center gap-0.5 rounded-full bg-white p-1 shadow-xl sm:gap-1 sm:p-1.5">
            {(
              [
                ["home", "Home"],
                ["buy", "Buy"],
                ["map", "Map"],
                ["phone", "Phone"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  if (visit) setVisit(null);
                  setTab(id);
                }}
                className={`relative rounded-full px-3 py-2 text-sm font-semibold sm:px-4 ${tab === id ? "bg-[#121212] text-white" : ""} ${touring && tourCard.pulse === id ? "ring-2 ring-[#FCD116] ring-offset-2 animate-pulse" : ""}`}
              >
                {label}
                {id === "phone" && inbox.total + inbox.asks > 0 ? (
                  <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-[#ff3b30] px-1 text-[11px] font-bold text-white" aria-label={`${inbox.total + inbox.asks} new`}>
                    {inbox.total + inbox.asks > 9 ? "9+" : inbox.total + inbox.asks}
                  </span>
                ) : null}
              </button>
            ))}
          </nav>
          {touring ? (
            <TourCoach
              step={tourStep}
              onSkip={() => apply(skipTour(life))}
              onNext={() => {
                if (tourStep === "done") {
                  apply(finishTour(life));
                  return;
                }
                const at = TOUR.findIndex((item) => item.id === tourStep);
                const next = TOUR[Math.min(at + 1, TOUR.length - 1)];
                if (next.tab) setTab(next.tab);
                if (next.id === "phone") setPhoneApp(null);
                setTourStep(next.id);
              }}
            />
          ) : null}
          {!touring && life.bulletin !== BULLETIN_ID ? (
            <FeatureBulletin
              onClose={() => apply(seenBulletin(life))}
              onShop={() => {
                apply(seenBulletin(life));
                setPhoneApp("biz");
                setTab("phone");
              }}
              onRival={() => {
                apply(seenBulletin(life));
                setPhoneApp("book");
                setTab("phone");
              }}
            />
          ) : null}
        </>
      )}
      {needsOpen ? (
        <Sheet onClose={() => setNeedsOpen(false)} title="Needs">
          {(
            [
              ["hunger", "Hunger", "🍛"],
              ["energy", "Energy", "⚡"],
              ["fun", "Fun", "🎉"],
              ["social", "Social", "💬"],
              ["hygiene", "Hygiene", "🫧"],
              ["bladder", "Bladder", "🚽"],
            ] as const
          ).map(([key, label, icon]) => (
            <div key={key} className="mb-3">
              <div className="mb-1 flex justify-between text-sm font-semibold">
                <span>
                  {icon} {label}
                </span>
                <span>{life.needs[key]}%</span>
              </div>
              <div className="h-2 rounded-full bg-[#e7edf5]">
                <div className={`h-2 rounded-full ${barColor(life.needs[key])}`} style={{ width: `${life.needs[key]}%` }} />
              </div>
            </div>
          ))}
        </Sheet>
      ) : null}
      {walletOpen ? (
        <Sheet onClose={() => setWalletOpen(false)} title="Wallet">
          <p className="font-display text-4xl">{cedis(life.cash)}</p>
          <p className="mt-2 text-sm text-[#5c6b82]">{life.loan > 0 ? `Susu left: ${cedis(life.loan)} · ${cedis(life.weeklyLoan)} every Saturday` : "No susu hanging over you."}</p>
          <p className="mt-2 text-sm text-[#5c6b82]">Rent at {homeById(life.homeId).name}: {cedis(homeById(life.homeId).rent)} every Saturday. Work a shift when the wallet is thin.</p>
          <WalletSend
            cash={life.cash}
            people={[
              ...life.relations.map((person) => person.name),
              ...parseRaw(getRaw())
                .accounts.filter((item) => item.username !== account.username && item.life)
                .map((item) => item.name),
            ]}
            onSend={paySomeone}
          />
          {life.loan > 0 ? (
            <button type="button" className="mt-4 w-full rounded-full bg-[#121212] py-3 font-bold text-white" onClick={() => apply(repayLoan(life))}>
              Pay toward the susu
            </button>
          ) : null}
        </Sheet>
      ) : null}
      {travelOpen && tab === "map" ? (
        <TravelSheet
          life={life}
          onClose={() => setTravelOpen(false)}
          onConfirm={(townId: TownId, mode: TravelMode) => {
            const quote = quoteTravel(life, townId, mode);
            if (quote.error) {
              flash(quote.error);
              return;
            }
            setTravelOpen(false);
            if (quote.ride.cost <= 0 && quote.ride.minutes <= 0) {
              apply(goTo(life, quote.placeId, quote.ride));
              setTab("map");
              return;
            }
            if ((mode === "flight" || mode === "jet") && quote.routeId) {
              setFlight({ routeId: quote.routeId, cabin: "economy", own: mode === "jet" });
              return;
            }
            setTrip({ name: townOf(townId).name, placeId: quote.placeId, ride: rideIn(quote.ride, city.weather) });
          }}
        />
      ) : null}
      {place && tab === "map" && !travelOpen ? (
        <PlaceSheet
          place={place}
          from={life.where}
          here={life.where === place.id}
          people={sheetPeople.map((person) => person.name)}
          rideId={rideId}
          sky={city.weather}
          car={car}
          extra={[...playerVerbs(place.id, playerEvents, life, now), ...eventVerbs(place.id, city), ...happeningVerbs(place.id, now ? new Date(now) : new Date()), ...kitVerbs(place)]}
          onRide={setRideId}
          onClose={() => setPlaceId(null)}
          onGo={() => {
            const ride = farRide(rideIn([...RIDES, ...(car ? [car] : [])].find((item) => item.id === rideId) ?? RIDES[1], city.weather), life.where, place.id);
            if (ride.blocked) {
              flash(ride.blocked);
              return;
            }
            if (ride.id === "car") {
              const blocked = carFuelBlock(life, ride.fuel ?? 6);
              if (blocked) {
                flash(blocked);
                return;
              }
            }
            setTrip({ name: place.name, placeId: place.id, ride });
            setPlaceId(null);
          }}
          onAct={(verb) => {
            if (verb.id.startsWith("fix-")) {
              if (life.where !== place.id) {
                flash("Get to the fitting shop first. A trotro will do if the car will not start.");
                return;
              }
              apply(repairCar(life, verb.id.slice(4)));
              return;
            }
            if (life.where !== place.id) {
              flash("Pick a ride, then go.");
              return;
            }
            apply(payOffer(life, verb, offerFrom(verb), place.id));
          }}
          onGem={gemSpotId(life.minutes) === place.id ? () => apply(huntGem(life)) : null}
          starred={(life.stars ?? []).includes(place.id)}
          onStar={() => apply({ life: toggleStar(life, place.id), notes: [] })}
          down={personDown(life, place.id)}
          onDown={(action) => {
            const run = action === "help" ? helpPerson : action === "call" ? callForPerson : action === "leave" ? leavePerson : robPerson;
            apply(run(life, place.id));
          }}
        >
          <HappeningBanner spotId={place.id} at={now ? new Date(now) : new Date()} people={sheetPeople.length} />
          <WeeklyCard life={life} spotId={place.id} here={life.where === place.id} cloud={Boolean(account.cloud)} onCheck={() => apply(checkIn(life, new Date()))} />
          <PlayerChops spotId={place.id} here={life.where === place.id} cloud={Boolean(account.cloud)} onNet={netAction} />
        </PlaceSheet>
      ) : null}
      {doOpen ? (
        <DoSheet
          name={account.username}
          look={life.look}
          onClose={() => setDoOpen(false)}
          onPick={(verb) => {
            setDoOpen(false);
            apply(runVerb(life, verb, "home"));
          }}
        />
      ) : null}
      {trip ? (
        <StreetRide
          life={life}
          place={trip.name}
          ride={trip.ride}
          onBack={() => {
            setTrip(null);
            setArrangeHome(false);
          }}
          onMap={() => {
            setTrip(null);
            setArrangeHome(false);
            setTab("map");
          }}
          sky={city.weather}
          onArrive={() => {
            const going = trip;
            setTrip(null);
            const result = goTo(life, going.placeId, going.ride);
            if (result.error) {
              flash(result.error);
              setArrangeHome(false);
              return;
            }
            apply(result);
            if (going.placeId !== "home") setArrangeHome(false);
            setTab("home");
          }}
        />
      ) : null}
      {flight ? (
        <FlightRide
          from={spotById(routeOf(flight.routeId)?.from ?? "kotoka").name}
          to={spotById(routeOf(flight.routeId)?.to ?? "kumasi").name}
          cabin={flight.own ? "Private" : CABINS[flight.cabin].label}
          minutes={flight.own ? 40 : CABINS[flight.cabin].minutes}
          fare={flight.own ? jetFuel(life) : CABINS[flight.cabin].cost}
          airline={flight.own ? "Your jet" : "Passion Airways"}
          onBack={() => setFlight(null)}
          onArrive={() => {
            const going = flight;
            setFlight(null);
            const result = going.own ? flyOwnJet(life, going.routeId) : bookFlight(life, going.routeId, going.cabin);
            if (result.error) {
              flash(result.error);
              return;
            }
            apply(result);
            setTab("home");
            setPhoneApp(null);
          }}
        />
      ) : null}
      {shiftId ? (
        <ShiftFloor
          life={life}
          title={JOBS.find((job) => job.id === shiftId)?.title ?? "Shift"}
          place={spotById(JOBS.find((job) => job.id === shiftId)?.place ?? life.where).name}
          minutes={JOBS.find((job) => job.id === shiftId)?.verb.minutes ?? 60}
          onLeave={() => setShiftId(null)}
          onDone={() => {
            const job = JOBS.find((item) => item.id === shiftId);
            setShiftId(null);
            if (!job) return;
            const before = life.cash;
            const result = runVerb(life, job.verb, job.place);
            if (result.error) {
              flash(result.error);
              return;
            }
            apply(result);
            setPayday({ earned: result.life.cash - before, performance: shiftPerformance(life) });
            setTab("home");
          }}
        />
      ) : null}
      {visit ? (
        <div className="absolute inset-x-0 top-0 bottom-[max(4.4rem,calc(env(safe-area-inset-bottom)+3.8rem))] z-[70] overflow-hidden bg-[#d7ecf8]">
          <div className="absolute inset-0">
            <RoomView life={{ ...life, homeId: visit.homeId, look: visit.look, inventory: visit.inventory, furniture: visit.furniture, floor: visit.floor, mat: visit.mat, stored: [], dumsor: false }} onAct={() => {}} onMap={leaveVisit} onAsk={() => {}} />
          </div>
          <div className="absolute left-3 right-3 top-[max(0.75rem,env(safe-area-inset-top))] z-[80] flex items-center justify-between gap-2">
            <p className="min-w-0 truncate rounded-full bg-white px-4 py-2 text-sm font-bold shadow-lg">
              🏠 At @{visit.username}&apos;s · {homeById(visit.homeId).area}
            </p>
            <button type="button" onClick={leaveVisit} className="shrink-0 rounded-full bg-[#121212] px-4 py-2 text-sm font-bold text-white shadow-lg">
              Leave
            </button>
          </div>
          <div className="absolute inset-x-3 bottom-3 z-[80] mx-auto max-h-[46vh] max-w-md space-y-2 overflow-auto rounded-3xl bg-white p-3 shadow-2xl">
            <p className="text-sm text-[#5c6b82]">{homeLook(visit.homeId).label}. {visit.furniture.length ? `${visit.furniture.length} pieces laid out.` : "Still bare walls."} The door takes you back out.</p>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  { id: "visit-gist", label: "Gist on the sofa", detail: "Old stories, new stories, louder each time.", minutes: 60, effects: { social: 26, fun: 14 } },
                  { id: "visit-cook", label: "Cook together", detail: "Jollof in their pot. Somebody argues about pepper.", minutes: 70, effects: { hunger: 34, social: 20, fun: 10 } },
                  { id: "visit-movie", label: "Watch a movie", detail: "A Ghallywood classic. You both pretend not to cry.", minutes: 110, effects: { fun: 30, social: 18, energy: -6 } },
                  { id: "visit-games", label: "Play ludo", detail: "Six, six, six. They swear the dice is cursed.", minutes: 50, effects: { fun: 26, social: 16 } },
                ] as const
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => apply(runVerb(life, { ...item, cost: 0, earn: 0, effects: { ...item.effects }, social: true }, life.where, visit.name))}
                  className="rounded-2xl bg-[#f4f7fb] px-3 py-2.5 text-left text-sm font-semibold"
                >
                  {item.label}
                  <span className="block text-[11px] font-normal text-[#5c6b82]">⏱ {item.minutes}m</span>
                </button>
              ))}
            </div>
            <button type="button" onClick={leaveVisit} className="w-full rounded-full bg-[#121212] py-3 text-sm font-bold text-white">
              Say bye and leave
            </button>
          </div>
        </div>
      ) : null}
      {tradeOpen && tab === "home" && life.where !== "home" ? (
        <TradeSheet
          life={life}
          onClose={() => setTradeOpen(false)}
          onBuy={(id) => {
            const result = buyGood(life, id);
            if (result.error) flash(result.error);
            else commitLife(account.username, result.life);
          }}
          onSell={(id) => {
            const result = sellGood(life, id);
            if (result.error) flash(result.error);
            else {
              commitLife(account.username, result.life);
              flash(result.notes[0] ?? "Sold.");
            }
          }}
        />
      ) : null}
      {payday ? <Payday earned={payday.earned} performance={payday.performance} onClose={() => setPayday(null)} /> : null}
      {tab === "buy" ? (
        <Catalogue
          cash={life.cash}
          owned={life.inventory}
          stored={life.stored ?? []}
          floor={life.floor}
          cupboard={life.cupboard}
          onClose={() => setTab("home")}
          onBuy={(id, stall) => apply(!stall || stall === "new" ? buyItem(life, id) : buyUsed(life, id, stall))}
          onUse={(id) => apply(useStock(life, id))}
          onCart={(ids) => {
            const result = buyCart(life, ids);
            apply(result);
            return !result.error;
          }}
        />
      ) : null}
      {boardId ? (
        <div className="absolute inset-x-0 bottom-0 z-40 max-h-[min(78vh,100dvh-4.5rem)] overflow-auto rounded-t-[28px] bg-white p-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-[0_-16px_50px_rgba(22,32,60,.2)] sm:p-5">
          <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-[#d5dbe6]" />
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl">Billboards</h2>
              <p className="text-sm text-[#5c6b82]">Digital. Live when you pay. Your line stays on that board.</p>
            </div>
            <button type="button" onClick={() => setBoardId(null)} className="rounded-full bg-[#f4f7fb] px-3 py-1 text-sm font-semibold">
              Hide
            </button>
          </div>
          <div className="mt-3 space-y-2">
            {BOARDS.map((board) => (
              <button key={board.id} type="button" onClick={() => setBoardId(board.id)} className={`flex w-full items-center justify-between gap-3 rounded-2xl px-3 py-3 text-left ${boardId === board.id ? "bg-[#fff4c2]" : "bg-[#f4f7fb]"}`}>
                <span>
                  <span className="block font-semibold">
                    {board.road}
                    {board.mega ? <span className="ml-2 rounded-full bg-[#121212] px-2 py-0.5 text-[10px] font-bold text-white">MEGA</span> : null}
                  </span>
                  <span className="mt-0.5 block text-xs text-[#5c6b82]">{ads[board.id] ? `On air · ${ads[board.id]}` : board.text}</span>
                </span>
                <span className="shrink-0 text-sm font-bold text-[#006B3F]">{cedis(board.price)}</span>
              </button>
            ))}
          </div>
          <form
            className="mt-3 space-y-2"
            onSubmit={(event) => {
              event.preventDefault();
              const board = BOARDS.find((item) => item.id === boardId);
              const line = adLine.trim();
              if (!board || !line) return;
              if (life.cash < board.price) {
                flash("Wallet light for that board.");
                return;
              }
              const next = { ...ads, [board.id]: line.slice(0, 22) };
              setAds(next);
              localStorage.setItem("accralife-boards", JSON.stringify(next));
              commitLife(account.username, { ...life, cash: life.cash - board.price });
              setAdLine("");
              flash(`${board.road} is carrying your line.`);
            }}
          >
            <input value={adLine} onChange={(event) => setAdLine(event.target.value)} maxLength={22} placeholder="Your line, 22 letters" className="h-11 w-full rounded-full bg-[#f4f7fb] px-4 text-sm outline-none" />
            <button type="submit" className="w-full rounded-full bg-[#006B3F] py-3 font-bold text-white">
              Put it on {BOARDS.find((item) => item.id === boardId)?.road} · {cedis(BOARDS.find((item) => item.id === boardId)?.price ?? 0)}
            </button>
          </form>
        </div>
      ) : null}
      {ping && !(tab === "phone") ? (
        <button
          type="button"
          onClick={() => {
            setChatLaunch({ id: ping.id });
            setTab("phone");
            setPing(null);
          }}
          className="absolute left-1/2 top-[max(0.75rem,env(safe-area-inset-top))] z-[60] flex w-[min(360px,calc(100%-1.5rem))] -translate-x-1/2 items-center gap-3 rounded-3xl bg-white/95 px-4 py-3 text-left shadow-[0_16px_40px_rgba(22,32,60,.25)] backdrop-blur"
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#006B3F] text-sm font-bold text-white">{ping.id.startsWith("group:") ? "👥" : ping.username.slice(0, 1).toUpperCase()}</span>
          <span className="min-w-0 flex-1">
            <span className="flex items-baseline justify-between gap-2">
              <span className="truncate text-sm font-bold text-[#121212]">{ping.name}</span>
              <span className="shrink-0 text-[11px] text-[#8b97ab]">now</span>
            </span>
            <span className="block truncate text-sm text-[#5c6b82]">{ping.text}</span>
          </span>
        </button>
      ) : null}
      {tab === "phone" ? (
        <Handset
          life={life}
          username={account.username}
          unread={inbox.unread}
          onRead={(id) => {
            inbox.markRead(id);
          }}
          social={inbox.social}
          cloud={Boolean(account.cloud)}
          asks={inbox.asks}
          onNet={netAction}
          married={inbox.social?.bond?.stage === "married"}
          raining={city.weather.rain}
          sky={city.weather}
          onGo={(spot) => {
            setTab("map");
            setPlaceId(spot);
            setPhoneApp(null);
          }}
          onFly={(routeId, cabin) => {
            setFlight({ routeId, cabin: cabin as Cabin });
            setTab("home");
            setPhoneApp(null);
          }}
          onMap={() => {
            setPhoneApp(null);
            setTab("map");
          }}
          onArrange={() => {
            if (life.homeId !== "own-house") {
              flash("Move into the house first. Then you arrange the rooms.");
              return;
            }
            setPhoneApp(null);
            if (life.where !== "home") {
              setArrangeHome(true);
              setTrip({ name: "Home", placeId: "home", ride: homeRide });
              return;
            }
            setTab("home");
            setArrangeHome(true);
          }}
          onVisit={(host) => void visitHost(host)}
          friends={inbox.threads.filter((thread) => thread.id.startsWith("user:")).map((thread) => ({ username: thread.username, name: thread.name }))}
          launch={chatLaunch}
          onLaunchConsumed={() => setChatLaunch(null)}
          openTo={phoneApp}
          onAir={setOnAir}
          onClose={() => (setTab("home"), setPhoneApp(null))}
          onWear={(look, cost) => {
            if (!cost) {
              commitLife(account.username, { ...life, look });
              return;
            }
            const cut = CLOTHES.find((item) => item.outfit === look.outfit);
            apply(
              payOffer(
                life,
                { id: cut?.id ?? "cloth", label: look.outfit, detail: "From the boutique.", minutes: 15, cost, earn: 0, effects: { fun: 6 } },
                { id: cut?.id ?? "cloth", label: look.outfit, detail: "From the boutique.", minutes: 15, cost, effects: { fun: 6 }, outfit: look.outfit, cloth: look.cloth },
                life.where,
              ),
            );
          }}
          onWork={(jobId) => {
            const job = JOBS.find((item) => item.id === jobId);
            if (!job) return;
            if (life.needs.energy < 25) {
              flash("You are too tired to work. Sleep first.");
              return;
            }
            setShiftId(jobId);
            setTab("home");
          }}
          onRepay={() => apply(repayLoan(life))}
          onLogout={() => writeSave(parseRaw(getRaw()).accounts, null)}
          onRide={() => setTab("map")}
          onMarket={() => setTab("buy")}
          email={account.email}
          players={parseRaw(getRaw()).accounts.filter((item) => item.username !== account.username && item.life).map((item) => ({ username: item.username, name: item.name }))}
          onEmail={(email) => {
            const snap = parseRaw(getRaw());
            writeSave(
              snap.accounts.map((item) => (item.username === account.username ? { ...item, email } : item)),
              snap.session,
            );
            flash("Recovery email saved.");
          }}
          onNewLife={() => {
            const snap = parseRaw(getRaw());
            writeSave(
              snap.accounts.map((item) => (item.username === account.username ? { ...item, life: null } : item)),
              snap.session,
            );
          }}
          onSocial={(result) => apply(result)}
          onPay={(name, handle, amount) => paySomeone(name, amount, handle.replace(/^@/, ""))}
        />
      ) : null}
    </div>
  );
}

function usePlacePeople(where: string | null, every = 15000) {
  const [found, setPeople] = useState<{ where: string; people: Peer[] }>({ where: "", people: [] });
  const people = where && found.where === where ? found.people : [];
  useEffect(() => {
    if (!where || where === "home") return;
    let stop = false;
    const load = () => {
      fetch(`/api/live/people?where=${encodeURIComponent(where)}`)
        .then((response) => response.json())
        .then((payload: { people?: Peer[] }) => {
          if (!stop && Array.isArray(payload.people)) setPeople({ where, people: payload.people });
        })
        .catch(() => {});
    };
    load();
    const id = window.setInterval(load, every);
    return () => {
      stop = true;
      window.clearInterval(id);
    };
  }, [where, every]);
  return people;
}

function offerFrom(verb: Verb): Offer {
  const extra = verb as Verb & { outfit?: string; cloth?: string };
  return {
    id: verb.id,
    label: verb.label,
    detail: verb.detail,
    minutes: verb.minutes,
    cost: verb.cost,
    effects: verb.effects,
    outfit: extra.outfit,
    cloth: extra.cloth,
  };
}

function WalletSend({ cash, people, onSend }: { cash: number; people: string[]; onSend: (name: string, amount: number) => string | null | Promise<string | null> }) {
  const names = [...new Set(people)];
  const [who, setWho] = useState(names[0] ?? "");
  const [amount, setAmount] = useState("20");
  const [receipt, setReceipt] = useState<string | null>(null);
  return (
    <form
      className="mt-4 space-y-2"
      onSubmit={(event) => {
        event.preventDefault();
        if (!who) return;
        const value = Number(String(amount).replace(/[^\d.]/g, ""));
        void Promise.resolve(onSend(who, value)).then((error) => {
          setReceipt(error ?? `You sent ${who} ${cedis(value)}.`);
        });
      }}
    >
      <p className="text-sm font-semibold">Send money</p>
      {names.length === 0 ? (
        <p className="text-sm text-[#5c6b82]">Meet someone in Accra first. Tap them, then send.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {names.map((name) => (
            <button key={name} type="button" onClick={() => setWho(name)} className={`rounded-full px-3 py-1.5 text-sm font-semibold ${who === name ? "bg-[#121212] text-white" : "bg-[#f4f7fb]"}`}>
              {name}
            </button>
          ))}
        </div>
      )}
      <div className="flex items-center gap-2">
        <span className="text-sm text-[#5c6b82]">{cedis(cash)}</span>
        <input value={amount} onChange={(event) => setAmount(event.target.value)} inputMode="numeric" aria-label="Amount in cedis" className="h-10 w-24 rounded-full bg-[#f4f7fb] px-3 text-sm outline-none" />
        <button type="submit" disabled={!who} className="rounded-full bg-[#006B3F] px-4 py-2 text-sm font-bold text-white disabled:opacity-40">
          Send
        </button>
      </div>
      {receipt ? <p className="rounded-2xl bg-[#f4f7fb] px-3 py-2 text-sm">{receipt}</p> : null}
    </form>
  );
}

function DoSheet({ name, look, onClose, onPick }: { name: string; look: Look; onClose: () => void; onPick: (verb: Verb) => void }) {
  const cards = HOME_VERBS.filter((verb) => ["sing", "skit", "hustle-chat", "call-home", "daydream", "dance", "radio", "gist"].includes(verb.id));
  return (
    <div className="absolute inset-x-0 bottom-0 z-40 max-h-[78vh] overflow-auto rounded-t-[28px] bg-[#f7f8fb] p-4 shadow-[0_-16px_50px_rgba(22,32,60,.2)]">
      <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-[#d5dbe6]" />
      <div className="flex items-center gap-3">
        <span className="grid h-12 w-12 place-items-center overflow-hidden rounded-full bg-[#f3d7e4]">
          <IsoHuman skin={look.skin} shirt={look.cloth} pants={look.body === "woman" ? "#1c1917" : look.accent} hair={look.hair} cloth={look.cloth} className="h-12 w-fit" />
        </span>
        <span>
          <span className="block font-display text-xl">{name}</span>
          <span className="text-sm text-[#5c6b82]">What should they do?</span>
        </span>
        <button type="button" onClick={onClose} className="ml-auto rounded-full bg-white px-3 py-1 text-sm font-semibold text-[#5c6b82]">
          Hide
        </button>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 pb-4">
        {cards.map((verb) => (
          <button key={verb.id} type="button" onClick={() => onPick(verb)} className="rounded-2xl bg-white p-3 text-left shadow-sm">
            <span className="flex items-start justify-between">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-[#f4f7fb] text-lg">{CARD_ICON[verb.id] ?? "✨"}</span>
              <span className="text-right">
                <span className="block rounded-full bg-[#f4f7fb] px-2 py-0.5 text-[11px] text-[#5c6b82]">⏱ {verb.minutes}m</span>
                <span className={`mt-1 block text-xs font-semibold ${verb.earn ? "text-[#006B3F]" : "text-[#006B3F]"}`}>{verb.earn ? `Earns ${cedis(verb.earn)}` : verb.cost ? cedis(verb.cost) : "Free"}</span>
              </span>
            </span>
            <span className="mt-3 block font-semibold">{verb.label}</span>
            <span className="mt-2 flex flex-wrap gap-1">
              {tagsFor(verb).map((tag) => (
                <span key={tag} className="rounded-full bg-[#f4f0ff] px-2 py-0.5 text-[11px] font-semibold text-[#6d5bd0]">
                  +{tag}
                </span>
              ))}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function HappeningBanner({ spotId, at, people }: { spotId: string; at: Date; people: number }) {
  const live = happeningsAt(spotId, at);
  if (!live.length) return null;
  return (
    <div className="mt-3 space-y-2">
      {live.map((item, index) => {
        const heatTone = item.heat === "packed" ? "bg-[#121212] text-[#FCD116]" : item.heat === "busy" ? "bg-[#fff4c2] text-[#7a3b0c]" : "bg-[#f4f7fb] text-[#5c6b82]";
        return (
          <div key={item.id} className="rounded-2xl bg-[#fff8ea] px-3 py-2.5">
            <div className="flex items-center gap-2">
              <span className="text-lg leading-none">{item.emoji}</span>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${heatTone}`}>{heatLabel(item.heat)}</span>
              {index === 0 && people > 0 ? <span className="text-[10px] font-semibold text-[#5c6b82]">{people} here</span> : null}
            </div>
            <p className="mt-1.5 text-sm leading-5 text-[#3d4a5c]">{item.line}</p>
          </div>
        );
      })}
    </div>
  );
}

function PlaceSheet({
  place,
  from,
  here,
  people,
  rideId,
  sky,
  car,
  extra,
  onRide,
  onClose,
  onGo,
  onAct,
  onGem,
  starred = false,
  onStar,
  down,
  onDown,
  children,
}: {
  children?: ReactNode;
  place: Spot;
  from: string;
  here: boolean;
  people: string[];
  rideId: Ride["id"];
  sky: Weather;
  car: Ride | null;
  extra: Verb[];
  onRide: (id: Ride["id"]) => void;
  onClose: () => void;
  onGo: () => void;
  onAct: (verb: Verb) => void;
  onGem: (() => void) | null;
  starred?: boolean;
  onStar?: () => void;
  down?: { name: string; reason: string } | null;
  onDown?: (action: "help" | "call" | "leave" | "rob") => void;
}) {
  const rides = car ? [...RIDES, car] : RIDES;
  const ride = farRide(rideIn(rides.find((item) => item.id === rideId) ?? RIDES[1], sky), from, place.id);
  const far = distanceOf(from, place.id);
  const area = areaOf(place);
  const card = placeCard(place);
  const blurb = place.blurb.startsWith(`${area}.`) ? place.blurb.slice(area.length + 1).trim() : place.blurb;
  const [copied, setCopied] = useState(false);
  return (
    <div className="absolute inset-x-0 bottom-0 z-40 max-h-[min(78vh,100dvh-4.5rem)] overflow-auto rounded-t-[28px] bg-white p-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-[0_-16px_50px_rgba(22,32,60,.2)] sm:p-5">
      <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-[#d5dbe6]" />
      <div className="flex items-start gap-3">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-[#f4f7fb] text-2xl">{place.emoji}</span>
        <span className="min-w-0 flex-1">
          <span className="block font-display text-2xl">{place.name}</span>
          <span className="text-sm text-[#5c6b82]">{card.neighborhood || area}</span>
        </span>
        {onStar ? (
          <button type="button" aria-label={starred ? "Unsave place" : "Save place"} onClick={onStar} className={`rounded-full px-3 py-1 text-sm font-semibold ${starred ? "bg-[#FCD116]" : "bg-[#f4f7fb]"}`}>
            {starred ? "★" : "☆"}
          </button>
        ) : null}
        <button type="button" onClick={onClose} className="rounded-full bg-[#f4f7fb] px-3 py-1 text-sm font-semibold">
          Hide
        </button>
      </div>
      <p className="mt-3 text-sm leading-6 text-[#5c6b82]">{blurb}</p>
      {down && onDown ? (
        <div className="mt-3 rounded-2xl bg-[#f6f1ea] p-3">
          <p className="text-sm font-semibold">{down.name} is on the ground</p>
          <p className="mt-1 text-xs text-[#5c6b82]">{down.name} {down.reason}.</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button type="button" onClick={() => onDown("help")} className="rounded-full bg-[#121212] py-2 text-xs font-bold text-white">Stay with them</button>
            <button type="button" onClick={() => onDown("call")} className="rounded-full bg-white py-2 text-xs font-bold">Call for help</button>
            <button type="button" onClick={() => onDown("leave")} className="rounded-full bg-white py-2 text-xs font-bold">Walk on</button>
            <button type="button" onClick={() => onDown("rob")} className="rounded-full bg-white py-2 text-xs font-bold text-[#9a3412]">Take their money</button>
          </div>
        </div>
      ) : null}
      <p className="mt-2 text-xs font-semibold text-[#5c6b82]">
        {card.hours} · {card.cost}
        {far ? ` · ${far} min away` : ""}
      </p>
      <button
        type="button"
        className="mt-3 flex items-center gap-2 text-sm font-semibold text-[#CE1126]"
        onClick={() => {
          const url = `${window.location.origin}/?spot=${place.id}`;
          void navigator.clipboard?.writeText(url).then(() => {
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1600);
          });
        }}
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M10 13a5 5 0 0 0 7.07 0l1.41-1.41a5 5 0 0 0-7.07-7.07L10 5" strokeLinecap="round" />
          <path d="M14 11a5 5 0 0 0-7.07 0L5.5 12.41a5 5 0 0 0 7.07 7.07L14 19" strokeLinecap="round" />
        </svg>
        {copied ? "Link copied" : `Share a link to ${place.name}`}
      </button>
      {children}
      <ActionDeck verbs={[...extra, ...place.actions]} here={here} town={place.town ?? "accra"} place={place.id} onPay={(verb, offer) => onAct({ ...verb, ...offer })} />
      {onGem ? (
        <button type="button" onClick={onGem} className="mt-2 rounded-full bg-[#fff4c2] px-3 py-1.5 text-sm font-semibold text-[#1f8a4c]">
          Search for the gem
        </button>
      ) : null}
      <p className="mt-4 text-sm font-semibold text-[#5c6b82]">Here now</p>
      {people.length ? null : <p className="mt-2 text-sm text-[#5c6b82]">Nobody else is here.</p>}
      <div className="mt-2 flex gap-3">
        {people.map((person) => (
          <span key={person} className="text-center text-xs">
            <span className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-[#f3d7e4] text-sm font-bold">{person.slice(0, 1)}</span>
            <span className="mt-1 block max-w-16 truncate">{person}</span>
          </span>
        ))}
      </div>
      {here ? (
        <p className="mt-4 rounded-full bg-[#fff4c2] py-3 text-center text-sm font-semibold text-[#1f8a4c]">You&apos;re already here.</p>
      ) : (
        <>
          <div className={`mt-4 grid gap-1.5 ${car ? "grid-cols-6" : "grid-cols-5"}`}>
            {rides.map((base) => {
              const item = farRide(rideIn(base, sky), from, place.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  disabled={Boolean(item.blocked)}
                  onClick={() => onRide(item.id)}
                  className={`rounded-2xl px-1 py-2.5 text-center disabled:opacity-40 ${rideId === item.id ? "bg-[#fff4c2] ring-2 ring-[#CE1126]" : "bg-[#f4f7fb]"}`}
                >
                  <span className="block text-lg">{item.id === "trek" ? "🚶" : item.id === "trotro" ? "🚐" : item.id === "train" ? "🚆" : item.id === "okada" ? "🏍️" : item.id === "car" ? "🚗" : "🚕"}</span>
                  <span className="mt-1 block text-sm font-semibold">{item.label}</span>
                  <span className={`block text-xs ${item.note ? "font-semibold text-[#1f4e79]" : "text-[#5c6b82]"}`}>{item.blocked ? (far ? "Too far" : "Parked") : item.cost ? cedis(item.cost) : item.id === "car" ? "Fuel" : "Free"}</span>
                </button>
              );
            })}
          </div>
          {far ? <p className="mt-2 text-xs font-semibold text-[#7a3b0c]">🛣️ Out of town. About {Math.round(far / 60)}h on the intercity bus, a bit faster by taxi or your own car.</p> : null}
          {sky.rain && !far ? <p className="mt-2 text-xs font-semibold text-[#1f4e79]">🌧️ {sky.label} Roads are slow. The train runs on time.</p> : null}
          <button type="button" onClick={onGo} disabled={Boolean(ride.blocked)} className="mt-3 w-full rounded-full bg-[#006B3F] py-3.5 font-bold text-white disabled:opacity-40">
            {ride.blocked ? ride.blocked : `Go · ${ride.id === "car" ? "Your car" : ride.cost ? cedis(ride.cost) : "Free"} · ${ride.minutes >= 90 ? `${Math.floor(ride.minutes / 60)}h ${ride.minutes % 60 ? `${ride.minutes % 60}m` : ""}`.trim() : `${ride.minutes}m`}`}
          </button>
        </>
      )}
    </div>
  );
}

function verbEmoji(verb: Verb) {
  if (verb.emoji) return verb.emoji;
  if (verb.tag === "food") return "🍽️";
  if (verb.tag === "party") return "🎶";
  if (verb.tag === "gym") return "💪";
  if (verb.tag === "church") return "⛪";
  const label = verb.label.toLowerCase();
  if (label.includes("dance")) return "💃";
  if (label.includes("drink") || label.includes("pint") || label.includes("cocktail") || label.includes("round")) return "🍹";
  if (label.includes("walk") || label.includes("stroll") || label.includes("stand")) return "🚶";
  if (label.includes("shop") || label.includes("outfit")) return "🛍️";
  return "✨";
}

function areaOf(place: Spot) {
  const lead = place.blurb.split(".")[0]?.trim() ?? "";
  if (lead.length > 1 && lead.length < 22 && !lead.includes(",")) return lead;
  if (place.group === "sea") return "The coast";
  if (place.group === "civic") return "Civic Accra";
  if (place.group === "work") return "Work side";
  return "Accra";
}

const CARD_ICON: Record<string, string> = {
  radio: "📻",
  gist: "💬",
  sing: "🎤",
  skit: "🎬",
  "hustle-chat": "💬",
  "call-home": "📞",
  daydream: "✈️",
  dance: "💃",
};

function tagsFor(verb: Verb) {
  const tags: string[] = [];
  if ((verb.effects.fun ?? 0) > 0) tags.push("Fun");
  if (verb.social || (verb.effects.social ?? 0) > 0) tags.push("Social");
  if (verb.skill === "music") tags.push("Music");
  if (verb.skill === "hustle") tags.push("Hustle");
  if (verb.skill === "cooking") tags.push("Cooking");
  if (verb.id === "dance") tags.push("Dance");
  return tags;
}

function TopBrand({ crowd, onSignup, onLogin }: { crowd: { players: number; online: number }; onSignup: () => void; onLogin: () => void }) {
  return (
    <div className="absolute left-3 right-3 top-3 z-20 flex items-center gap-2 rounded-full bg-white px-3 py-2 shadow-lg">
      <span className="font-display text-lg tracking-tight">Accra Life</span>
      {crowd.online > 0 ? <span className="text-xs font-semibold text-[#006B3F]">● {crowd.online.toLocaleString("en-GH")} online</span> : null}
      <span className="ml-auto flex gap-2">
        <button type="button" onClick={onSignup} className="rounded-full bg-[#006B3F] px-3 py-1.5 text-sm font-bold text-white">
          Sign up
        </button>
        <button type="button" onClick={onLogin} className="rounded-full px-3 py-1.5 text-sm font-bold">
          Log in
        </button>
      </span>
    </div>
  );
}

function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="absolute inset-0 z-[55] flex flex-col justify-end bg-black/35" onClick={onClose}>
      <div
        className="max-h-[78vh] overflow-auto rounded-t-[28px] bg-white p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-[0_-16px_50px_rgba(22,32,60,.2)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-2xl">{title}</h2>
          <button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full bg-[#fff1c9]" aria-label="Close">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Privacy({ onClose }: { onClose: () => void }) {
  return (
    <div className="absolute inset-0 z-50 grid place-items-end bg-black/30 sm:place-items-center">
      <div className="w-full max-w-md rounded-t-[28px] bg-white p-5 sm:rounded-[28px]">
        <h2 className="font-display text-2xl">Privacy</h2>
        <p className="mt-2 text-sm leading-6 text-[#5c6b82]">
          Accra Life stores your Sim, password hash, and choices in this browser. Nothing is sold, and there is no ad tracker. Clearing site data logs the life out of this device.
        </p>
        <button type="button" className="mt-4 w-full rounded-full bg-[#121212] py-3 font-bold text-white" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}

function Field({ label, name, placeholder, type = "text", hint }: { label: string; name: string; placeholder: string; type?: string; hint?: string }) {
  return (
    <label className="block text-sm font-semibold">
      {label}
      <input name={name} type={type} placeholder={placeholder} className="mt-2 w-full rounded-full bg-white px-4 py-3 font-normal outline-none" />
      {hint ? <span className="mt-1 block text-xs font-normal text-[#5c6b82]">{hint}</span> : null}
    </label>
  );
}

function Choice({ label, options, value, onChange }: { label: string; options: string[]; value: string; onChange: (value: string) => void }) {
  return (
    <div>
      <p className="mb-2 text-sm font-semibold">{label}</p>
      <div className="grid grid-cols-2 gap-2">
        {options.map((option) => (
          <button key={option} type="button" onClick={() => onChange(option)} className={`rounded-full py-3 font-semibold capitalize ${value === option ? "bg-[#121212] text-white" : "bg-[#fff1c9]"}`}>
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} className={`rounded-full px-3 py-2 text-sm font-semibold ${active ? "bg-[#121212] text-white" : "bg-[#fff1c9]"}`}>
      {children}
    </button>
  );
}

function Swatches({ label, colors, value, onChange }: { label: string; colors: readonly string[]; value: string; onChange: (value: string) => void }) {
  return (
    <div>
      <p className="mb-2 text-sm font-semibold">{label}</p>
      <div className="flex flex-wrap gap-2">
        {colors.map((color) => (
          <button key={color} type="button" aria-label={color} onClick={() => onChange(color)} className={`h-8 w-8 rounded-full ${value === color ? "ring-2 ring-[#121212] ring-offset-2" : ""}`} style={{ background: color }} />
        ))}
      </div>
    </div>
  );
}

function LayerChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} className={`inline-flex h-7 shrink-0 items-center rounded-full border px-2.5 text-[11px] font-semibold ${active ? "border-[#006B3F] bg-[#006B3F] font-bold text-white" : "border-[#ead9a0] bg-[#fff8e6] text-[#121212] hover:bg-[#f6e7b0] active:scale-95"}`}>
      {children}
    </button>
  );
}

function MapFilterBar({
  tucked,
  filter,
  boards,
  routesOn,
  query,
  town,
  eventTitle,
  onFilter,
  onBoards,
  onRoutes,
  onQuery,
  onPerson,
  onTravel,
  onShow,
  onShops,
}: {
  tucked: boolean;
  filter: string;
  boards: boolean;
  routesOn: boolean;
  query: string;
  town: string;
  eventTitle: string;
  onFilter: (id: string) => void;
  onBoards: () => void;
  onRoutes: () => void;
  onQuery: (value: string) => void;
  onPerson: (person: SitePerson) => void;
  onTravel: () => void;
  onShow: () => void;
  onShops: () => void;
}) {
  const [more, setMore] = useState(false);
  const [peopleOpen, setPeopleOpen] = useState(false);
  const chips: { id: string; label: string; icon: ChipName; active: boolean; onClick: () => void; late?: boolean }[] = [
    { id: "all", label: "Road", icon: "road", active: filter === "all", onClick: () => onFilter("all") },
    { id: "boards", label: "Boards", icon: "sign", active: boards, onClick: onBoards },
    { id: "people", label: "People", icon: "users", active: peopleOpen, onClick: () => setPeopleOpen((open) => !open) },
    { id: "sea", label: "Sea", icon: "waves", active: filter === "sea", onClick: () => onFilter("sea") },
    { id: "civic", label: "Gov", icon: "landmark", active: filter === "civic", onClick: () => onFilter("civic") },
    { id: "work", label: "Work", icon: "briefcase", active: filter === "work", onClick: () => onFilter("work"), late: true },
    { id: "trip", label: "Day trips", icon: "pin", active: filter === "trip", onClick: () => onFilter("trip"), late: true },
    { id: "food", label: "Food", icon: "utensils", active: filter === "food", onClick: () => onFilter("food"), late: true },
    { id: "nightlife", label: "Night", icon: "moon", active: filter === "nightlife", onClick: () => onFilter("nightlife"), late: true },
    { id: "shopping", label: "Shop", icon: "bag", active: filter === "shopping", onClick: () => onFilter("shopping"), late: true },
    { id: "shops", label: "Shops", icon: "bag", active: false, onClick: onShops },
    { id: "worship", label: "Worship", icon: "worship", active: filter === "worship", onClick: () => onFilter("worship"), late: true },
    { id: "transport", label: "Ride", icon: "car", active: filter === "transport", onClick: () => onFilter("transport"), late: true },
    { id: "stars", label: "Saved", icon: "bookmark", active: filter === "stars", onClick: () => onFilter("stars"), late: true },
    { id: "routes", label: "Routes", icon: "route", active: routesOn, onClick: onRoutes, late: true },
  ];
  return (
    <div className="relative h-8">
      <div className={`pointer-events-auto absolute inset-x-0 top-0 transition duration-200 ${tucked ? "pointer-events-none -translate-y-1 opacity-0" : "translate-y-0 opacity-100"}`}>
        <div className="no-scrollbar flex h-8 items-center gap-1 overflow-x-auto scroll-smooth overscroll-x-contain px-1 [mask-image:linear-gradient(to_right,transparent,black_10px,black_calc(100%-18px),transparent)] [scroll-snap-type:x_mandatory]">
            {chips.map((chip) => (
              <button
                key={chip.id}
                type="button"
                onClick={() => {
                  if (chip.id !== "people") setPeopleOpen(false);
                  chip.onClick();
                }}
                className={`inline-flex h-7 shrink-0 snap-start items-center gap-1 rounded-full border px-2 text-[11px] leading-none transition active:scale-95 ${chip.late && !more ? "max-sm:hidden" : ""} ${chip.active ? "border-[#c9a227] bg-[#FCD116] font-bold text-[#121212]" : "border-[#ead9a0] bg-[#fff8e6]/95 font-semibold text-[#121212] hover:bg-[#f6e7b0]"}`}
              >
                <ChipIcon name={chip.icon} />
                {chip.label}
              </button>
            ))}
            <button type="button" onClick={onTravel} className="inline-flex h-7 shrink-0 snap-start items-center rounded-full bg-[#006B3F] px-2.5 text-[11px] font-bold leading-none text-white active:scale-95">
              {town}
            </button>
            <input
              value={query}
              onChange={(event) => onQuery(event.target.value)}
              placeholder="Search"
              aria-label="Search the map"
              className="h-7 w-[4.75rem] shrink-0 snap-start rounded-full border border-[#ead9a0] bg-[#fff8e6] px-2 text-[11px] font-semibold text-[#121212] outline-none placeholder:text-[#8a7d62]"
            />
            <span className={`inline-flex h-7 max-w-[8.5rem] shrink-0 snap-start items-center truncate rounded-full bg-[#121212]/85 px-2 text-[10px] font-semibold leading-none text-white ${more ? "" : "max-sm:hidden"}`}>
              {eventTitle}
            </span>
            <button type="button" onClick={() => setMore((open) => !open)} aria-label={more ? "Fewer filters" : "More filters"} className="inline-flex h-7 w-7 shrink-0 snap-start items-center justify-center rounded-full border border-[#ead9a0] bg-[#fff8e6] text-[#121212] active:scale-95 sm:hidden">
              <ChipIcon name={more ? "up" : "down"} />
            </button>
          </div>
        {peopleOpen && !tucked ? (
          <PeopleMenu
            onPick={(person) => {
              setPeopleOpen(false);
              onPerson(person);
            }}
          />
        ) : null}
      </div>
      {tucked ? (
        <button type="button" onClick={onShow} className="pointer-events-auto absolute left-1 top-0.5 inline-flex h-7 items-center gap-1 rounded-full border border-[#ead9a0] bg-[#fff8e6] px-2 text-[11px] font-bold text-[#121212] shadow-sm">
          <ChipIcon name="pin" />
          Filters
        </button>
      ) : null}
    </div>
  );
}

type SitePerson = { username: string; name: string; where: string | null; town?: string | null; online?: boolean };

function placeLine(person: SitePerson) {
  if (!person.where || person.where === "home") return "At home";
  const spot = SPOTS.find((item) => item.id === person.where);
  if (!spot) return "Out";
  return `${spot.name} · ${townOf((spot.town ?? "accra") as TownId).name}`;
}

function PeopleMenu({ onPick }: { onPick: (person: SitePerson) => void }) {
  const [people, setPeople] = useState<SitePerson[]>([]);
  const [q, setQ] = useState("");
  const [state, setState] = useState<"load" | "ready" | "off">("load");

  useEffect(() => {
    let stop = false;
    fetch("/api/live/people?list=1")
      .then((response) => response.json())
      .then((payload: { people?: SitePerson[] }) => {
        if (stop) return;
        setPeople(Array.isArray(payload.people) ? payload.people : []);
        setState("ready");
      })
      .catch(() => {
        if (!stop) setState("off");
      });
    return () => {
      stop = true;
    };
  }, []);

  useEffect(() => {
    const text = q.trim();
    if (text.length < 2) return;
    const timer = window.setTimeout(() => {
      fetch(`/api/live/people?q=${encodeURIComponent(text)}`)
        .then((response) => response.json())
        .then((payload: { people?: SitePerson[] }) => {
          const found = Array.isArray(payload.people) ? payload.people : [];
          setPeople((current) => {
            const seen = new Set(current.map((person) => person.username));
            return [...current, ...found.filter((person) => !seen.has(person.username))];
          });
        })
        .catch(() => {});
    }, 180);
    return () => window.clearTimeout(timer);
  }, [q]);

  const text = q.trim().toLowerCase();
  const shown = people.filter((person) => !text || person.name.toLowerCase().includes(text) || person.username.toLowerCase().includes(text));

  return (
    <div className="absolute left-2 top-9 z-40 w-[min(18rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-[#ead9a0] bg-[#fff8e6] shadow-xl">
      <p className="px-3 pt-2 text-[10px] font-bold tracking-wide text-[#8a7d62]">PEOPLE ON ACCRA LIFE</p>
      <input
        value={q}
        onChange={(event) => setQ(event.target.value)}
        placeholder="Find a name"
        aria-label="Find a person"
        className="mx-2 mt-1 h-8 w-[calc(100%-1rem)] rounded-full border border-[#ead9a0] bg-white px-3 text-xs font-semibold outline-none"
      />
      <div className="max-h-64 overflow-auto py-1">
        {state === "load" ? <p className="px-3 py-2 text-xs text-[#5c6b82]">Looking…</p> : null}
        {state === "off" ? <p className="px-3 py-2 text-xs text-[#5c6b82]">People are offline right now.</p> : null}
        {state === "ready" && !shown.length ? <p className="px-3 py-2 text-xs text-[#5c6b82]">Nobody else is on the map yet.</p> : null}
        {shown.map((person) => (
          <button key={person.username} type="button" onClick={() => onPick(person)} className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-[#f6e7b0]">
            <span className="relative grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#d7e4f5] text-[11px] font-bold text-[#1d2433]">
              {person.name.slice(0, 1).toUpperCase()}
              {person.online ? <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#fff8e6] bg-[#22c55e]" aria-hidden /> : null}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-xs font-bold">{person.name}</span>
              <span className="block truncate text-[10px] text-[#5c6b82]">
                @{person.username} · {placeLine(person)}
              </span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

type ChipName = "road" | "sign" | "users" | "waves" | "landmark" | "briefcase" | "pin" | "utensils" | "moon" | "bag" | "worship" | "car" | "bookmark" | "route" | "up" | "down";

function ChipIcon({ name }: { name: ChipName }) {
  const pen = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0" aria-hidden {...pen}>
      {name === "waves" ? (
        <>
          <path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
          <path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
          <path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
        </>
      ) : null}
      {name === "landmark" ? (
        <>
          <path d="M3 22h18" />
          <path d="M6 18V9" />
          <path d="M10 18V9" />
          <path d="M14 18V9" />
          <path d="M18 18V9" />
          <path d="m12 2 9 7H3l9-7z" />
        </>
      ) : null}
      {name === "briefcase" ? (
        <>
          <rect x="2" y="7" width="20" height="14" rx="2" />
          <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
          <path d="M2 13h20" />
        </>
      ) : null}
      {name === "pin" ? (
        <>
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
          <circle cx="12" cy="10" r="3" />
        </>
      ) : null}
      {name === "utensils" ? (
        <>
          <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
          <path d="M7 2v20" />
          <path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
        </>
      ) : null}
      {name === "moon" ? <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" /> : null}
      {name === "bag" ? (
        <>
          <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
          <path d="M3 6h18" />
          <path d="M16 10a4 4 0 0 1-8 0" />
        </>
      ) : null}
      {name === "worship" ? (
        <>
          <path d="M12 2v5" />
          <path d="M9.5 4.5h5" />
          <path d="M4 22V10l8-4 8 4v12" />
          <path d="M4 22h16" />
          <path d="M10 22v-6h4v6" />
        </>
      ) : null}
      {name === "car" ? (
        <>
          <path d="M19 17h2a1 1 0 0 0 1-1v-3a2 2 0 0 0-1.5-1.9L19 10s-1.3-1.4-2.2-2.3A2 2 0 0 0 15 7H5a2 2 0 0 0-1.4.9L2 11v5a1 1 0 0 0 1 1h2" />
          <circle cx="7" cy="17" r="2" />
          <circle cx="17" cy="17" r="2" />
        </>
      ) : null}
      {name === "bookmark" ? <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /> : null}
      {name === "route" ? (
        <>
          <circle cx="6" cy="19" r="3" />
          <path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15" />
          <circle cx="18" cy="5" r="3" />
        </>
      ) : null}
      {name === "road" ? (
        <>
          <path d="M4 19 8 5" />
          <path d="M20 19 16 5" />
          <path d="M12 6v2" />
          <path d="M12 11v2" />
          <path d="M12 16v2" />
        </>
      ) : null}
      {name === "sign" ? (
        <>
          <rect x="3" y="4" width="18" height="12" rx="2" />
          <path d="M12 16v5" />
        </>
      ) : null}
      {name === "users" ? (
        <>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </>
      ) : null}
      {name === "up" ? <path d="m6 14 6-6 6 6" /> : null}
      {name === "down" ? <path d="m6 10 6 6 6-6" /> : null}
    </svg>
  );
}

function Need({ n, icon }: { n: number; icon: string }) {
  return (
    <span className="flex items-center gap-1">
      <span className="text-[10px]">{icon}</span>
      <span className="h-1.5 w-8 overflow-hidden rounded-full bg-[#e7edf5]">
        <span className={`block h-full ${barColor(n)}`} style={{ width: `${n}%` }} />
      </span>
    </span>
  );
}

function barColor(value: number) {
  if (value < 30) return "bg-[#e5484d]";
  if (value < 55) return "bg-[#f59e42]";
  return "bg-[#006B3F]";
}
