"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import {
  RECIPES,
  activeGuests,
  doorGuests,
  enRouteGuests,
  friendTier,
  guestHomeReact,
  homeUpgradeHints,
  minutesAway,
  type HomeGuest,
} from "@/lib/game/home-life";
import { cedis, type Life } from "@/lib/game/world";

export type HomeFriend = { username: string; name: string };

export function HomeDesk({
  life,
  cloud,
  friends,
  invites,
  onCook,
  onHang,
  onSleepover,
  onSendHome,
  onOpenDoor,
  onInvite,
  onVisit,
  onBuyHint,
  onArrange,
}: {
  life: Life;
  cloud: boolean;
  friends: HomeFriend[];
  invites: { from: string; at: string }[];
  onCook: (recipeId: string, shareWith?: string) => void;
  onHang: (name: string, kind: "chat" | "tv" | "game" | "drink") => void;
  onSleepover: (name: string) => void;
  onSendHome: (name: string) => void;
  onOpenDoor?: (name: string) => void;
  onInvite: (username: string) => void;
  onVisit: (username: string) => void;
  onBuyHint?: () => void;
  onArrange?: () => void;
}) {
  const guests = activeGuests(life);
  const coming = enRouteGuests(life);
  const knocking = doorGuests(life);
  const [cookOpen, setCookOpen] = useState(false);
  const [doorOpen, setDoorOpen] = useState(false);
  const [tipsOpen, setTipsOpen] = useState(false);
  const [share, setShare] = useState<string | undefined>(guests[0]?.name);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<HomeFriend[]>([]);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const react = guestHomeReact(life);
  const tips = homeUpgradeHints(life);
  const pantry = life.pantry ?? 0;
  const people = friends.filter((person) => !guests.some((guest) => guest.username === person.username));

  async function search(event: FormEvent) {
    event.preventDefault();
    const typed = query.trim().replace(/^@/, "").toLowerCase();
    if (!typed || !cloud) return;
    setBusy(true);
    const response = await fetch(`/api/live/people?q=${encodeURIComponent(typed)}`);
    const payload = (await response.json().catch(() => null)) as { people?: HomeFriend[] } | null;
    setHits(payload?.people ?? []);
    setNotice(payload?.people?.length ? "" : `Nobody in Accra goes by @${typed}.`);
    setBusy(false);
  }

  function pick(username: string) {
    setDoorOpen(false);
    setQuery("");
    setHits([]);
    setNotice("");
    onInvite(username);
  }

  return (
    <div className="pointer-events-auto absolute left-2 top-[max(4.4rem,calc(env(safe-area-inset-top)+3.8rem))] z-30 w-[min(14.25rem,calc(100%-6.5rem))] space-y-1.5 sm:left-3">
      <div className="rounded-2xl bg-white/95 p-2 shadow-lg">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-bold uppercase tracking-wide text-[#006B3F]">Home life</p>
          <p className="text-[11px] font-semibold text-[#5c6b82]">🛒 {pantry} groceries</p>
        </div>
        {guests.length === 0 && coming.length === 0 && knocking.length === 0 ? (
          <p className="mt-1 text-xs text-[#5c6b82]">Quiet for now. Call someone to pass by.</p>
        ) : (
          <div className="mt-2 space-y-2">
            {coming.map((guest) => (
              <p key={guest.name} className="rounded-xl bg-[#f4f7fb] px-2.5 py-2 text-[11px] leading-4 text-[#243044]">
                <span className="font-bold">{guest.name}</span> is {guest.ride ?? "on the way"} from {guest.from ?? "town"}. About {minutesAway(life, guest)}m.
              </p>
            ))}
            {knocking.map((guest) => (
              <div key={guest.name} className="flex items-center justify-between gap-2 rounded-xl bg-[#121212] px-2.5 py-2 text-[11px] text-white">
                <p>
                  <span className="font-bold">{guest.name}</span> is at the door.
                </p>
                {onOpenDoor ? (
                  <button type="button" onClick={() => onOpenDoor(guest.name)} className="rounded-full bg-[#FCD116] px-2 py-1 text-[10px] font-bold text-[#121212]">
                    Open
                  </button>
                ) : null}
              </div>
            ))}
            {guests.map((guest) => (
              <GuestCard
                key={guest.username ?? guest.name}
                guest={guest}
                score={life.relations.find((person) => person.name === guest.name || person.name === guest.username || person.name === `@${guest.username}`)?.score ?? 0}
                onHang={(kind) => onHang(guest.name, kind)}
                onSleepover={() => onSleepover(guest.name)}
                onSendHome={() => onSendHome(guest.name)}
              />
            ))}
          </div>
        )}
        {react ? <p className="mt-1.5 line-clamp-2 rounded-xl bg-[#f4f7fb] px-2 py-1 text-[11px] font-medium leading-4 text-[#243044]">{react}</p> : null}
        <div className="mt-1.5 flex flex-wrap gap-1">
          <button type="button" onClick={() => { setCookOpen((open) => !open); setDoorOpen(false); }} className="rounded-full bg-[#006B3F] px-2.5 py-1 text-[10px] font-bold text-white">
            🍲 Cook
          </button>
          <button
            type="button"
            onClick={() => {
              setDoorOpen((open) => !open);
              setCookOpen(false);
            }}
            className="rounded-full bg-[#121212] px-2.5 py-1 text-[10px] font-bold text-white"
          >
            🚪 Invite over
          </button>
          {onArrange ? (
            <button type="button" onClick={onArrange} className="rounded-full bg-[#121212] px-2.5 py-1 text-[10px] font-bold text-white">
              Arrange
            </button>
          ) : null}
          {onBuyHint ? (
            <button type="button" onClick={onBuyHint} className="rounded-full bg-[#fff4c2] px-2.5 py-1 text-[10px] font-bold text-[#7a3b0c]">
              Upgrade
            </button>
          ) : null}
        </div>
      </div>

      {doorOpen ? (
        <div className="max-h-[45vh] space-y-2 overflow-auto rounded-2xl bg-white p-3 shadow-lg">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold">Who should come?</p>
            <button type="button" onClick={() => setDoorOpen(false)} className="text-xs font-semibold text-[#5c6b82]">
              Close
            </button>
          </div>
          {!cloud ? (
            <p className="text-xs leading-5 text-[#5c6b82]">Sign in online to invite real Accra Life players. They Visit from People on their phone.</p>
          ) : (
            <>
              {invites.length ? (
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-[#8b97ab]">Invites for you</p>
                  {invites.map((invite) => (
                    <button
                      key={invite.from}
                      type="button"
                      onClick={() => {
                        setDoorOpen(false);
                        onVisit(invite.from);
                      }}
                      className="flex w-full items-center gap-2 rounded-xl bg-[#e8f6ee] px-3 py-2 text-left"
                    >
                      <span className="text-lg">🏠</span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-bold">@{invite.from}</span>
                        <span className="block text-[11px] text-[#006B3F]">Invited you · Visit their place</span>
                      </span>
                    </button>
                  ))}
                </div>
              ) : null}
              <p className="text-[10px] font-bold uppercase tracking-wide text-[#8b97ab]">Your people</p>
              {!people.length ? <p className="text-xs text-[#5c6b82]">Message someone in the city first — they show up here.</p> : null}
              {people.map((person) => (
                <button key={person.username} type="button" onClick={() => pick(person.username)} className="flex w-full items-center gap-2 rounded-xl bg-[#f4f7fb] px-3 py-2 text-left">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-[#d7c4a3] text-xs font-bold">{person.name.slice(0, 1).toUpperCase()}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold">@{person.username}</span>
                    <span className="block truncate text-[11px] text-[#5c6b82]">{person.name}</span>
                  </span>
                  <span className="text-[11px] font-bold text-[#006B3F]">Invite</span>
                </button>
              ))}
              <form className="flex gap-1.5 pt-1" onSubmit={search}>
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="@username"
                  className="h-9 min-w-0 flex-1 rounded-full bg-[#f4f7fb] px-3 text-sm outline-none"
                />
                <button type="submit" disabled={busy} className="rounded-full bg-[#121212] px-3 text-xs font-bold text-white disabled:opacity-40">
                  Find
                </button>
              </form>
              {notice ? <p className="text-[11px] text-[#8b97ab]">{notice}</p> : null}
              {hits.map((person) => (
                <button key={person.username} type="button" onClick={() => pick(person.username)} className="flex w-full items-center gap-2 rounded-xl bg-[#fff4c2] px-3 py-2 text-left">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold">@{person.username}</span>
                    <span className="block truncate text-[11px] text-[#5c6b82]">{person.name}</span>
                  </span>
                  <span className="text-[11px] font-bold">Invite</span>
                </button>
              ))}
            </>
          )}
        </div>
      ) : null}

      {cookOpen ? (
        <div className="max-h-[40vh] space-y-2 overflow-auto rounded-2xl bg-white p-3 shadow-lg">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold">Cook at home</p>
            <button type="button" onClick={() => setCookOpen(false)} className="text-xs font-semibold text-[#5c6b82]">
              Close
            </button>
          </div>
          {guests.length ? (
            <label className="block text-[11px] font-semibold text-[#5c6b82]">
              Share with
              <select
                value={share ?? ""}
                onChange={(event) => setShare(event.target.value || undefined)}
                className="mt-1 w-full rounded-xl bg-[#f4f7fb] px-2 py-1.5 text-sm text-[#121212]"
              >
                <option value="">Just me</option>
                {guests.map((guest) => (
                  <option key={guest.username ?? guest.name} value={guest.name}>
                    {guest.username ? `@${guest.username}` : guest.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          {RECIPES.map((recipe) => (
            <button
              key={recipe.id}
              type="button"
              onClick={() => {
                onCook(recipe.id, share);
                setCookOpen(false);
              }}
              className="flex w-full items-start gap-2 rounded-2xl bg-[#f4f7fb] px-3 py-2 text-left"
            >
              <span className="text-xl">{recipe.emoji}</span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold">{recipe.label}</span>
                <span className="block text-[11px] text-[#5c6b82]">{recipe.detail}</span>
                <span className="mt-0.5 block text-[11px] font-semibold text-[#006B3F]">
                  {recipe.pantry} groceries or {cedis(recipe.cost)} · {recipe.minutes}m
                </span>
              </span>
            </button>
          ))}
        </div>
      ) : null}

      {tips.length && !cookOpen && !doorOpen ? (
        <button type="button" onClick={() => setTipsOpen((open) => !open)} className="w-full rounded-xl bg-[#121212]/85 px-2.5 py-1.5 text-left text-[11px] text-white shadow">
          <p className="font-bold text-[#FCD116]">Next for the place</p>
          {tipsOpen ? (
            tips.slice(0, 2).map((tip) => (
              <p key={tip.id} className="mt-1 opacity-95">
                {tip.label} — {tip.why}
              </p>
            ))
          ) : (
            <p className="truncate opacity-90">{tips[0].label}</p>
          )}
        </button>
      ) : null}
    </div>
  );
}

function GuestCard({
  guest,
  score,
  onHang,
  onSleepover,
  onSendHome,
}: {
  guest: HomeGuest;
  score: number;
  onHang: (kind: "chat" | "tv" | "game" | "drink") => void;
  onSleepover: () => void;
  onSendHome: () => void;
}) {
  const tier = friendTier(score);
  const title = guest.username ? `@${guest.username}` : guest.name;
  const doing =
    guest.doing === "sleep"
      ? "Sleeping over"
      : guest.doing === "cook"
        ? "In the kitchen"
        : guest.doing === "tv"
          ? "Watching something"
          : guest.doing === "game"
            ? "Playing"
            : guest.doing === "eat"
              ? "Chopping"
              : guest.doing === "arrive"
                ? "Just arrived"
                : "Gisting";
  return (
    <div className="rounded-xl bg-[#f4f7fb] p-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[13px] font-bold text-[#121212]">{title}</p>
          {guest.username && guest.name !== title ? <p className="text-[11px] text-[#5c6b82]">{guest.name}</p> : null}
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[#006B3F]">
            {guest.username ? "Player" : tier.label} · {doing}
          </p>
          {guest.gift ? <p className="text-[11px] text-[#5c6b82]">Brought {guest.gift}</p> : null}
        </div>
        <button type="button" onClick={onSendHome} className="text-[10px] font-bold text-[#8b97ab]">
          Bye
        </button>
      </div>
      <div className="mt-1.5 flex flex-wrap gap-1">
        <Chip onClick={() => onHang("chat")}>Gist</Chip>
        <Chip onClick={() => onHang("tv")}>TV</Chip>
        <Chip onClick={() => onHang("game")}>Ludo</Chip>
        <Chip onClick={() => onHang("drink")}>Drink</Chip>
        {!guest.sleepover ? (
          <Chip onClick={onSleepover} hot>
            Sleep over
          </Chip>
        ) : null}
      </div>
    </div>
  );
}

function Chip({ children, onClick, hot }: { children: ReactNode; onClick: () => void; hot?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${hot ? "bg-[#CE1126] text-white" : "bg-white text-[#243044] shadow-sm"}`}
    >
      {children}
    </button>
  );
}
