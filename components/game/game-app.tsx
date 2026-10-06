"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import { ActionDeck } from "@/components/game/action-deck";
import { BOARDS, CityBoard } from "@/components/game/city-board";
import { IsoHuman } from "@/components/game/iso-human";
import { VenueFloor } from "@/components/game/venue-floor";
import { Catalogue } from "@/components/game/catalogue";
import { Handset } from "@/components/game/handset";
import { RoomView } from "@/components/game/room-view";
import { Payday, ShiftFloor, StreetRide } from "@/components/game/life-scenes";
import { Soundtrack, tuneFor } from "@/components/game/soundtrack";
import { useInbox, type InboxPing } from "@/components/game/use-inbox";

const LowPolyHuman = dynamic(() => import("@/components/game/low-poly-human").then((mod) => mod.LowPolyHuman), { ssr: false });
import { commitLife, getRaw, parseRaw, subscribeSave, writeSave, type Account } from "@/lib/game/save";
import {
  ACCENTS,
  CLOTHS,
  DREAMS,
  HAIRS,
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
  cedis,
  CLOTHES,
  clockLabel,
  freshLife,
  gemSpotId,
  giftCash,
  layPiece,
  receiveCash,
  goTo,
  homeById,
  homeLook,
  accraHour,
  realMinutes,
  huntGem,
  moodOf,
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

const emptyServer = "";

function useSave() {
  const raw = useSyncExternalStore(subscribeSave, getRaw, () => emptyServer);
  return useMemo(() => parseRaw(raw), [raw]);
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
          if (timed.notes.length) timed.life.inbox = [...timed.notes, ...timed.life.inbox].slice(0, 20);
          life = timed.life;
          commitLife(account.username, life);
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
            if (gained) setToast(next.log[0] ?? "Money landed in your wallet.");
          })
          .catch(() => undefined);
      }
    }, 15000);
    return () => window.clearInterval(id);
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
        <div className="pointer-events-none absolute left-1/2 top-24 z-50 w-[min(92vw,420px)] -translate-x-1/2 rounded-full bg-[#121212] px-4 py-3 text-center text-sm font-medium text-white shadow-xl">
          {toast}
        </div>
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
  const spot = SPOTS.find((item) => item.id === spotId) ?? null;

  return (
    <>
      <CityBoard
        filter={filter}
        boards={boards}
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
        <p className="rounded-full bg-[#006B3F] px-5 py-2 text-sm font-semibold text-white shadow">🎉 All-white season is law this week</p>
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
            <p className="text-sm font-semibold">{crowd.online.toLocaleString("en-GH")} Accra people playing right now · free</p>
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
    const life = freshLife({ look, traits, dream, birthId: birth.id, homeId });
    commitLife(account.username, life);
    flash(`Keys in hand. ${homeById(homeId).area} is home.`);
  }

  const canNext = step === 1 ? traits.length === 2 : true;

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
          </div>
        ) : null}
        {step === 1 ? (
          <div className="space-y-3">
            <p className="text-sm text-[#5c6b82]">Choose 2 traits for {account.username}.</p>
            {TRAITS.map((trait) => {
              const on = traits.includes(trait.id);
              return (
                <button
                  key={trait.id}
                  type="button"
                  onClick={() =>
                    setTraits((current) => {
                      if (current.includes(trait.id)) return current.filter((id) => id !== trait.id);
                      if (current.length >= 2) return current;
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
  const [filter, setFilter] = useState<Spot["group"] | "all">("all");
  const [boards, setBoards] = useState(true);
  const [ads, setAds] = useState<Record<string, string>>({});
  const [boardId, setBoardId] = useState<string | null>(null);
  const [adLine, setAdLine] = useState("");
  const [placeId, setPlaceId] = useState<string | null>(null);
  const [needsOpen, setNeedsOpen] = useState(false);
  const [walletOpen, setWalletOpen] = useState(false);
  const [clean, setClean] = useState(false);
  const [doOpen, setDoOpen] = useState(false);
  const [rideId, setRideId] = useState<(typeof RIDES)[number]["id"]>("trotro");
  const [trip, setTrip] = useState<{ name: string; placeId: string; ride: Ride } | null>(null);
  const [shiftId, setShiftId] = useState<string | null>(null);
  const [payday, setPayday] = useState<{ earned: number; performance: number } | null>(null);
  const [chatLaunch, setChatLaunch] = useState<{ id: string } | null>(null);
  const [onAir, setOnAir] = useState(false);
  const [errand, setErrand] = useState<{ spot: string; n: number } | null>(null);
  const [menuFocus, setMenuFocus] = useState<string | null>(null);
  const [now, setNow] = useState<number | null>(null);
  const herePeople = usePlacePeople(account.life?.where ?? null);
  const sheetPeople = usePlacePeople(placeId);
  const [ping, setPing] = useState<InboxPing | null>(null);
  const inbox = useInbox(account.username, Boolean(account.cloud), (next) => {
    setPing(next);
    window.setTimeout(() => setPing((current) => (current?.at === next.at ? null : current)), 6000);
    try {
      if (typeof Notification !== "undefined" && Notification.permission === "granted" && document.hidden) {
        new Notification(`@${next.username}`, { body: next.text, tag: `accralife-${next.username}` });
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
  if (!life) return null;
  const mood = moodOf(life.needs);
  const quest = questFor(life);
  const crowd = useCityCrowd();
  const place = placeId ? spotById(placeId) : null;

  function apply(result: StepResult) {
    if (result.error) {
      flash(result.error);
      return;
    }
    commitLife(account.username, result.life);
    const note = result.notes.filter(Boolean)[0];
    if (note) flash(note);
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

  return (
    <div className="fixed inset-0 h-dvh w-full max-w-full overflow-clip overscroll-none touch-none">
      <Soundtrack tune={tuneFor(life.where, onAir)} />
      {tab === "map" ? (
        <CityBoard
          night={now != null && (accraHour(new Date(now)) >= 19 || accraHour(new Date(now)) < 5)}
          filter={filter}
          boards={boards}
          ads={ads}
          onBoard={setBoardId}
          onSelect={(id) => {
            const spot = spotById(id);
            if (spot.soon) {
              flash(`${spot.name} is still on the drawing board.`);
              return;
            }
            if (id === "home") {
              setTrip({ name: "Home", placeId: "home", ride: RIDES[1] });
              setPlaceId(null);
              return;
            }
            setPlaceId(id);
          }}
        />
      ) : tab === "home" && life.where === "home" ? (
        <RoomView
          life={life}
          errand={errand}
          onMap={() => setTab("map")}
          onAsk={() => setDoOpen(true)}
          onLay={(id, x, z, rot) => apply(layPiece(life, id, x, z, rot))}
          onStore={(id) => apply(storePiece(life, id))}
          onSell={(id) => apply(sellPiece(life, id))}
          onAct={(id) => {
            const verb = HOME_VERBS.find((item) => item.id === id);
            if (verb) apply(runVerb(life, verb, "home"));
          }}
        />
      ) : tab === "home" ? (
        <VenueFloor
          life={life}
          people={herePeople}
          focus={menuFocus}
          onHome={() => setTrip({ name: "Home", placeId: "home", ride: RIDES[1] })}
          onAct={(verb, person) => apply(person ? runVerb(life, verb, life.where, person) : payOffer(life, verb, offerFrom(verb), life.where))}
          onPay={(person, amount, username) => paySomeone(person, amount, username)}
          onOpenChat={(username) => {
            setChatLaunch({ id: `user:${username}` });
            setTab("phone");
          }}
        />
      ) : (
        <div className="h-full bg-[#fff6df]" />
      )}
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
              <span className="hidden shrink-0 text-[#5c6b82] min-[520px]:inline">{crowd.players.toLocaleString("en-GH")}</span>
              <span className="shrink-0 text-[#006B3F]">● {crowd.online.toLocaleString("en-GH")} online</span>
            </div>
            <button type="button" className="shrink-0 rounded-full bg-white px-2.5 py-1.5 text-xs font-bold shadow-lg sm:px-3 sm:py-2 sm:text-sm" onClick={() => setWalletOpen(true)}>
              {cedis(life.cash)} +
            </button>
          </div>
          <div className={`absolute left-2 z-20 max-w-[min(13rem,calc(100%-5.5rem))] space-y-2 sm:left-3 ${tab === "map" ? "top-[max(7.4rem,calc(env(safe-area-inset-top)+6.6rem))]" : "top-[max(4.4rem,calc(env(safe-area-inset-top)+3.8rem))]"}`}>
            <button
              type="button"
              className="w-full rounded-full bg-white px-3 py-2 text-left shadow"
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
              <p className="text-sm font-bold">{quest.title}</p>
              <p className="text-xs text-[#5c6b82]">{quest.detail}</p>
            </button>
            {life.gemDay !== Math.floor(life.minutes / 1440) && quest.title !== "Daily gem hunt" ? (
              <button type="button" className="w-full rounded-full bg-white px-3 py-2 text-left shadow" onClick={() => setTab("map")}>
                <p className="text-sm font-bold">Daily gem hunt</p>
                <p className="text-xs text-[#5c6b82]">Look around {spotById(gemSpotId(life.minutes)).name}. Next find is {cedis(40)}.</p>
              </button>
            ) : null}
            {life.dumsor ? <p className="w-full rounded-full bg-[#121212] px-3 py-2 text-xs font-semibold text-white">Dumsor. The lights are out.</p> : null}
            <button type="button" className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold shadow" onClick={() => setClean(true)}>
              ⌃ Clean screen
            </button>
          </div>
          {tab === "map" ? (
            <div className="no-scrollbar absolute left-2 right-2 top-[max(4.6rem,calc(env(safe-area-inset-top)+4.1rem))] z-30 flex justify-start gap-2 overflow-x-auto px-1 pb-1 sm:left-3 sm:right-3 sm:top-[max(4.15rem,calc(env(safe-area-inset-top)+3.4rem))] sm:justify-center">
              <LayerChip active={filter === "all"} onClick={() => setFilter("all")}>
                Free road
              </LayerChip>
              <LayerChip active={boards || Boolean(boardId)} onClick={() => setBoardId((current) => (current ? null : "oxford"))}>
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
          ) : null}
          <button type="button" className="absolute bottom-[max(5.4rem,calc(env(safe-area-inset-bottom)+4.6rem))] left-2 z-20 flex items-center gap-2 rounded-full bg-white p-1 shadow-lg sm:bottom-[max(6.5rem,calc(env(safe-area-inset-bottom)+5.5rem))] sm:left-3 sm:p-1.5" onClick={() => setNeedsOpen(true)} aria-label="Open needs">
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
              <button key={id} type="button" onClick={() => setTab(id)} className={`relative rounded-full px-3 py-2 text-sm font-semibold sm:px-4 ${tab === id ? "bg-[#121212] text-white" : ""}`}>
                {label}
                {id === "phone" && inbox.total > 0 ? (
                  <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-[#ff3b30] px-1 text-[11px] font-bold text-white" aria-label={`${inbox.total} unread`}>
                    {inbox.total > 9 ? "9+" : inbox.total}
                  </span>
                ) : null}
              </button>
            ))}
          </nav>
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
      {place && tab === "map" ? (
        <PlaceSheet
          place={place}
          here={life.where === place.id}
          people={sheetPeople.map((person) => person.name)}
          rideId={rideId}
          onRide={setRideId}
          onClose={() => setPlaceId(null)}
          onGo={() => {
            const ride = RIDES.find((item) => item.id === rideId) ?? RIDES[1];
            setTrip({ name: place.name, placeId: place.id, ride });
            setPlaceId(null);
          }}
          onAct={(verb) => {
            if (life.where !== place.id) {
              flash("Pick a ride, then go.");
              return;
            }
            apply(payOffer(life, verb, offerFrom(verb), place.id));
          }}
          onGem={gemSpotId(life.minutes) === place.id ? () => apply(huntGem(life)) : null}
        />
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
          onBack={() => setTrip(null)}
          onArrive={() => {
            const going = trip;
            setTrip(null);
            const result = goTo(life, going.placeId, going.ride);
            if (result.error) {
              flash(result.error);
              return;
            }
            apply(result);
            setTab("home");
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
            setPayday({ earned: result.life.cash - before, performance: Math.min(96, 40 + life.skills.career * 4) });
            setTab("home");
          }}
        />
      ) : null}
      {payday ? <Payday earned={payday.earned} performance={payday.performance} onClose={() => setPayday(null)} /> : null}
      {tab === "buy" ? (
        <Catalogue cash={life.cash} owned={life.inventory} stored={life.stored ?? []} floor={life.floor} onClose={() => setTab("home")} onBuy={(id) => apply(buyItem(life, id))} />
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
            setChatLaunch({ id: `user:${ping.username}` });
            setTab("phone");
            setPing(null);
          }}
          className="absolute left-1/2 top-[max(0.75rem,env(safe-area-inset-top))] z-[60] flex w-[min(360px,calc(100%-1.5rem))] -translate-x-1/2 items-center gap-3 rounded-3xl bg-white/95 px-4 py-3 text-left shadow-[0_16px_40px_rgba(22,32,60,.25)] backdrop-blur"
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#006B3F] text-sm font-bold text-white">{ping.username.slice(0, 1).toUpperCase()}</span>
          <span className="min-w-0 flex-1">
            <span className="flex items-baseline justify-between gap-2">
              <span className="truncate text-sm font-bold text-[#121212]">@{ping.username}</span>
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
            if (id.startsWith("user:")) inbox.markRead(id.slice(5));
          }}
          launch={chatLaunch}
          onLaunchConsumed={() => setChatLaunch(null)}
          onAir={setOnAir}
          onClose={() => setTab("home")}
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

function usePlacePeople(where: string | null) {
  const [people, setPeople] = useState<{ username: string; name: string }[]>([]);
  useEffect(() => {
    if (!where || where === "home") {
      setPeople([]);
      return;
    }
    let stop = false;
    const load = () => {
      fetch(`/api/live/people?where=${encodeURIComponent(where)}`)
        .then((response) => response.json())
        .then((payload: { people?: { username: string; name: string }[] }) => {
          if (!stop && Array.isArray(payload.people)) setPeople(payload.people);
        })
        .catch(() => {});
    };
    load();
    const id = window.setInterval(load, 15000);
    return () => {
      stop = true;
      window.clearInterval(id);
    };
  }, [where]);
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

function PlaceSheet({
  place,
  here,
  people,
  rideId,
  onRide,
  onClose,
  onGo,
  onAct,
  onGem,
}: {
  place: Spot;
  here: boolean;
  people: string[];
  rideId: (typeof RIDES)[number]["id"];
  onRide: (id: (typeof RIDES)[number]["id"]) => void;
  onClose: () => void;
  onGo: () => void;
  onAct: (verb: Verb) => void;
  onGem: (() => void) | null;
}) {
  const ride = RIDES.find((item) => item.id === rideId) ?? RIDES[1];
  const area = areaOf(place);
  const blurb = place.blurb.startsWith(`${area}.`) ? place.blurb.slice(area.length + 1).trim() : place.blurb;
  const [copied, setCopied] = useState(false);
  return (
    <div className="absolute inset-x-0 bottom-0 z-40 max-h-[min(78vh,100dvh-4.5rem)] overflow-auto rounded-t-[28px] bg-white p-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-[0_-16px_50px_rgba(22,32,60,.2)] sm:p-5">
      <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-[#d5dbe6]" />
      <div className="flex items-start gap-3">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-[#f4f7fb] text-2xl">{place.emoji}</span>
        <span className="min-w-0 flex-1">
          <span className="block font-display text-2xl">{place.name}</span>
          <span className="text-sm text-[#5c6b82]">{area}</span>
        </span>
        <button type="button" onClick={onClose} className="rounded-full bg-[#f4f7fb] px-3 py-1 text-sm font-semibold">
          Hide
        </button>
      </div>
      <p className="mt-3 text-sm leading-6 text-[#5c6b82]">{blurb}</p>
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
      <ActionDeck verbs={place.actions} here={here} onPay={(verb, offer) => onAct({ ...verb, ...offer })} />
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
          <div className="mt-4 grid grid-cols-5 gap-1.5">
            {RIDES.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onRide(item.id)}
                className={`rounded-2xl px-1 py-2.5 text-center ${rideId === item.id ? "bg-[#fff4c2] ring-2 ring-[#CE1126]" : "bg-[#f4f7fb]"}`}
              >
                <span className="block text-lg">{item.id === "trek" ? "🚶" : item.id === "trotro" ? "🚐" : item.id === "train" ? "🚆" : item.id === "okada" ? "🏍️" : "🚕"}</span>
                <span className="mt-1 block text-sm font-semibold">{item.label}</span>
                <span className="block text-xs text-[#5c6b82]">{item.cost ? cedis(item.cost) : "Free"}</span>
              </button>
            ))}
          </div>
          <button type="button" onClick={onGo} className="mt-3 w-full rounded-full bg-[#006B3F] py-3.5 font-bold text-white">
            Go · {ride.cost ? cedis(ride.cost) : "Free"}
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
      <span className="text-xs font-semibold text-[#5c6b82]">{crowd.players.toLocaleString("en-GH")}</span>
      <span className="text-xs font-semibold text-[#006B3F]">● {crowd.online.toLocaleString("en-GH")} online</span>
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
    <div className="absolute inset-x-0 bottom-0 z-40 max-h-[78vh] overflow-auto rounded-t-[28px] bg-white p-5 shadow-[0_-16px_50px_rgba(22,32,60,.2)]">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-2xl">{title}</h2>
        <button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full bg-[#fff1c9]" aria-label="Close">
          ×
        </button>
      </div>
      {children}
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
    <button type="button" onClick={onClick} className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold shadow ${active ? "bg-[#121212] text-white" : "bg-white"}`}>
      {children}
    </button>
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
