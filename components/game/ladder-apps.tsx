"use client";

import { useState } from "react";
import { Offline, usePoll } from "@/components/game/play-apps";
import type { NetAction } from "@/components/game/social-apps";
import { Screen, Label, Card, Btn } from "@/components/game/life-apps";
import { ADVANCE_WEEKS, MOVER_FEE, moveCost, moveHome, moveWait, movingHomes, ownsHouse } from "@/lib/game/ladder";
import { REFER_CAP, REFER_PRIZE } from "@/lib/game/net";
import { TURFS, TURF_MIN, TURF_PRIZE, joinTurf, turfById, turfPoints } from "@/lib/game/turf";
import { cedis, homeById, type Life, type StepResult } from "@/lib/game/world";

type Apply = (result: StepResult) => void;

export function HomeApp({ life, onBack, onApply, onLand }: { life: Life; onBack: () => void; onApply: Apply; onLand: () => void }) {
  const current = homeById(life.homeId);
  const wait = moveWait(life);
  const homes = movingHomes(life);
  return (
    <Screen title="Home" life={life} color="#0b3d6b" onBack={onBack}>
      <Card tone="good">
        <p className="font-semibold">
          {current.emoji} {current.name}
        </p>
        <p className="mt-1 text-sm text-[#5c6b82]">
          {current.area} · {current.rent ? `${cedis(current.rent)} rent every Saturday` : "No rent"} · comfort +{current.comfort} when you sleep
        </p>
        <p className="mt-2 text-xs text-[#5c6b82]">Moving costs {cedis(MOVER_FEE)}. Upgrades also take {ADVANCE_WEEKS} weeks of the new rent in advance.</p>
      </Card>
      {wait > 0 ? <p className="text-sm text-[#5c6b82]">You just moved. Ready again in {Math.ceil(wait / 60)}h.</p> : null}
      <Label>MOVE INTO</Label>
      {homes.map((home) => {
        const cost = moveCost(life, home.id);
        const here = home.id === life.homeId;
        return (
          <Card key={home.id}>
            <div className="flex items-start gap-3">
              <span className="text-2xl">{home.emoji}</span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">{home.name}</span>
                <span className="block text-xs text-[#5c6b82]">
                  {home.area} · {home.rent ? `${cedis(home.rent)}/Sat` : "own it"} · comfort +{home.comfort}
                </span>
                <span className="mt-1 block text-xs text-[#5c6b82]">{home.detail}</span>
              </span>
            </div>
            <div className="mt-3">
              {here ? (
                <p className="text-xs font-semibold text-[#006B3F]">You live here</p>
              ) : (
                <Btn kind="dark" disabled={(home.id !== "own-house" && wait > 0) || life.cash < cost} onClick={() => onApply(moveHome(life, home.id))}>
                  Move · {cedis(cost)}
                </Btn>
              )}
            </div>
          </Card>
        );
      })}
      {!ownsHouse(life) ? (
        <p className="text-sm text-[#5c6b82]">
          Build a finished house on Land to unlock &ldquo;Your own house&rdquo;.{" "}
          <button type="button" className="font-semibold text-[#CE1126]" onClick={onLand}>
            Open Land
          </button>
        </p>
      ) : null}
    </Screen>
  );
}

type TurfView = {
  week: number;
  areas: { id: string; points: number; players: number }[];
  last: { area: string; points: number } | null;
  claimable: boolean;
  top: { username: string; name: string; points: number }[];
  mine: { area: string; points: number; prev: { area: string; points: number } | null } | null;
};

export function TurfApp({ me, life, cloud, onBack, onApply, onNet }: { me: string; life: Life; cloud: boolean; onBack: () => void; onApply: Apply; onNet: NetAction }) {
  const [data, refresh] = usePoll<TurfView>(cloud ? "/api/live/play?view=turf" : null, 30000);
  const [notice, setNotice] = useState("");
  if (!cloud) return <Offline title="Neighbourhoods" color="#006B3F" life={life} onBack={onBack} />;
  const mine = turfById(life.turf?.area);
  return (
    <Screen title="Neighbourhoods" life={life} color="#006B3F" onBack={onBack}>
      {notice ? <p className="rounded-2xl bg-[#fff4c2] px-3 py-2 text-xs font-semibold">{notice}</p> : null}
      <p className="text-xs text-[#5c6b82]">Pick an area. Shifts, nights out, hangouts and weekly check-ins score points. Last week&apos;s winners with {TURF_MIN}+ points share {cedis(TURF_PRIZE)}.</p>
      {mine ? (
        <Card tone="good">
          <p className="font-semibold">
            {mine.emoji} You rep {mine.name}
          </p>
          <p className="mt-1 text-sm text-[#5c6b82]">{turfPoints(life)} points this week</p>
          {data?.claimable ? (
            <div className="mt-3">
              <Btn
                kind="gold"
                onClick={() =>
                  void onNet({ api: "play", action: "turf-claim" }).then((error) => {
                    setNotice(error ?? `Prize claimed: ${cedis(TURF_PRIZE)}.`);
                    refresh();
                  })
                }
              >
                Claim last week&apos;s prize
              </Btn>
            </div>
          ) : null}
        </Card>
      ) : (
        <Label>PICK YOUR AREA</Label>
      )}
      {!mine
        ? TURFS.map((turf) => (
            <Card key={turf.id}>
              <div className="flex items-center gap-3">
                <span className="text-2xl">{turf.emoji}</span>
                <span className="min-w-0 flex-1 font-semibold">{turf.name}</span>
                <Btn kind="dark" onClick={() => onApply(joinTurf(life, turf.id))}>
                  Rep this
                </Btn>
              </div>
            </Card>
          ))
        : null}
      <Label>THIS WEEK</Label>
      {(data?.areas ?? []).map((row, index) => {
        const turf = turfById(row.id);
        if (!turf) return null;
        return (
          <div key={row.id} className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 shadow-sm ${row.id === life.turf?.area ? "bg-[#fff4c2]" : "bg-white"}`}>
            <span className="grid h-8 w-8 place-items-center rounded-full bg-[#f4f7fb] text-sm font-bold">{index + 1}</span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold">
                {turf.emoji} {turf.name}
              </span>
              <span className="block text-xs text-[#5c6b82]">{row.players} scoring</span>
            </span>
            <span className="text-sm font-bold">{row.points}</span>
          </div>
        );
      })}
      {data?.top?.length ? (
        <>
          <Label>YOUR AREA</Label>
          {data.top.map((row) => (
            <div key={row.username} className={`flex justify-between rounded-2xl bg-white px-3 py-2 text-sm shadow-sm ${row.username === me ? "ring-2 ring-[#FCD116]" : ""}`}>
              <span>@{row.username}</span>
              <span className="font-semibold">{row.points}</span>
            </div>
          ))}
        </>
      ) : null}
      {data?.last ? <p className="text-xs text-[#5c6b82]">Last week: {turfById(data.last.area)?.name ?? data.last.area} with {data.last.points} points.</p> : null}
    </Screen>
  );
}

type ReferView = { referrals: { username: string; at: string; paid?: boolean; ready: boolean }[]; paid: number; referredBy: string | null };

export function InviteApp({ me, life, cloud, onBack, onNet }: { me: string; life: Life; cloud: boolean; onBack: () => void; onNet: NetAction }) {
  const [data, refresh] = usePoll<ReferView>(cloud ? "/api/live/social?view=refer" : null, 20000);
  const [copied, setCopied] = useState(false);
  const [notice, setNotice] = useState("");
  if (!cloud) return <Offline title="Invite" color="#CE1126" life={life} onBack={onBack} />;
  const link = typeof window !== "undefined" ? `${window.location.origin}/?ref=${me}` : `/?ref=${me}`;
  return (
    <Screen title="Invite a friend" life={life} color="#CE1126" onBack={onBack}>
      {notice ? <p className="rounded-2xl bg-[#fff4c2] px-3 py-2 text-xs font-semibold">{notice}</p> : null}
      <p className="text-xs text-[#5c6b82]">
        Share your link. When a friend signs up and works one shift, you both get {cedis(REFER_PRIZE)}. Cap {REFER_CAP} paid invites.
      </p>
      <Card>
        <p className="break-all text-sm font-semibold">{link}</p>
        <div className="mt-3">
          <Btn
            kind="gold"
            onClick={() => {
              void navigator.clipboard?.writeText(link).then(() => {
                setCopied(true);
                window.setTimeout(() => setCopied(false), 1600);
              });
            }}
          >
            {copied ? "Copied" : "Copy link"}
          </Btn>
        </div>
      </Card>
      <Label>
        FRIENDS · {data?.paid ?? 0}/{REFER_CAP} paid
      </Label>
      {!data?.referrals?.length ? <p className="text-sm text-[#5c6b82]">Nobody has joined with your link yet.</p> : null}
      {data?.referrals?.map((item) => (
        <div key={item.username} className="flex items-center gap-3 rounded-2xl bg-white px-3 py-2.5 shadow-sm">
          <span className="min-w-0 flex-1">
            <span className="block font-semibold">@{item.username}</span>
            <span className="block text-xs text-[#5c6b82]">{item.paid ? "Reward paid" : item.ready ? "Ready to claim" : "Waiting for their first shift"}</span>
          </span>
          {!item.paid && item.ready ? (
            <Btn
              kind="green"
              onClick={() =>
                void onNet({ action: "refer-claim", to: item.username }).then((error) => {
                  setNotice(error ?? `You and @${item.username} got ${cedis(REFER_PRIZE)}.`);
                  refresh();
                })
              }
            >
              Claim
            </Btn>
          ) : null}
        </div>
      ))}
    </Screen>
  );
}
