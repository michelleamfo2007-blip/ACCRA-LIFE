"use client";

import { useState, type ReactNode } from "react";
import {
  RECIPES,
  activeGuests,
  friendTier,
  guestHomeReact,
  homeUpgradeHints,
  type HomeGuest,
} from "@/lib/game/home-life";
import { cedis, type Life } from "@/lib/game/world";

export function HomeDesk({
  life,
  onCook,
  onHang,
  onSleepover,
  onSendHome,
  onInviteKnock,
  onBuyHint,
}: {
  life: Life;
  onCook: (recipeId: string, shareWith?: string) => void;
  onHang: (name: string, kind: "chat" | "tv" | "game" | "drink") => void;
  onSleepover: (name: string) => void;
  onSendHome: (name: string) => void;
  onInviteKnock: () => void;
  onBuyHint?: () => void;
}) {
  const guests = activeGuests(life);
  const [cookOpen, setCookOpen] = useState(false);
  const [share, setShare] = useState<string | undefined>(guests[0]?.name);
  const react = guestHomeReact(life);
  const tips = homeUpgradeHints(life);
  const pantry = life.pantry ?? 0;

  return (
    <div className="pointer-events-auto absolute left-2 top-[max(4.4rem,calc(env(safe-area-inset-top)+3.8rem))] z-30 w-[min(16.5rem,calc(100%-5.5rem))] space-y-2 sm:left-3">
      <div className="rounded-2xl bg-white/95 p-3 shadow-lg">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-bold uppercase tracking-wide text-[#006B3F]">Home life</p>
          <p className="text-[11px] font-semibold text-[#5c6b82]">🛒 {pantry} groceries</p>
        </div>
        {guests.length === 0 ? (
          <p className="mt-1 text-xs text-[#5c6b82]">Quiet for now. Friends can pass by, or you cook.</p>
        ) : (
          <div className="mt-2 space-y-2">
            {guests.map((guest) => (
              <GuestCard
                key={guest.name}
                guest={guest}
                score={life.relations.find((person) => person.name === guest.name)?.score ?? 0}
                onHang={(kind) => onHang(guest.name, kind)}
                onSleepover={() => onSleepover(guest.name)}
                onSendHome={() => onSendHome(guest.name)}
              />
            ))}
          </div>
        )}
        {react ? <p className="mt-2 rounded-xl bg-[#f4f7fb] px-2.5 py-1.5 text-[11px] font-medium text-[#243044]">{react}</p> : null}
        <div className="mt-2 flex flex-wrap gap-1.5">
          <button type="button" onClick={() => setCookOpen((open) => !open)} className="rounded-full bg-[#006B3F] px-3 py-1.5 text-[11px] font-bold text-white">
            🍲 Cook
          </button>
          <button type="button" onClick={onInviteKnock} className="rounded-full bg-[#121212] px-3 py-1.5 text-[11px] font-bold text-white">
            🚪 Who dey outside?
          </button>
          {onBuyHint ? (
            <button type="button" onClick={onBuyHint} className="rounded-full bg-[#fff4c2] px-3 py-1.5 text-[11px] font-bold text-[#7a3b0c]">
              Upgrade home
            </button>
          ) : null}
        </div>
      </div>

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
                  <option key={guest.name} value={guest.name}>
                    {guest.name}
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

      {tips.length && !cookOpen ? (
        <div className="rounded-2xl bg-[#121212]/85 px-3 py-2 text-[11px] text-white shadow">
          <p className="font-bold text-[#FCD116]">Next for the place</p>
          {tips.slice(0, 2).map((tip) => (
            <p key={tip.id} className="mt-1 opacity-95">
              {tip.label} — {tip.why}
            </p>
          ))}
        </div>
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
    <div className="rounded-xl bg-[#f4f7fb] p-2.5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-bold text-[#121212]">{guest.name}</p>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[#006B3F]">
            {tier.label} · {doing}
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
