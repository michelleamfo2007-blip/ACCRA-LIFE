"use client";

import { useState } from "react";
import { Btn, Card, Label, Screen } from "@/components/game/life-apps";
import { Offline, post, useClock, usePoll } from "@/components/game/play-apps";
import type { NetAction } from "@/components/game/social-apps";
import type { ChartSong } from "@/lib/game/career";
import {
  CHOP_OPEN,
  COOK_FEE,
  COOK_MAX,
  COOK_WAGE,
  DISHES,
  MENU_MAX,
  STOCK_MAX,
  batchCost,
  batchSize,
  closeChop,
  collectChop,
  cookBatch,
  fireCook,
  hireCook,
  openChop,
  priceRange,
  salesOf,
  setDish,
  stars,
} from "@/lib/game/kitchen";
import { TRIP_IDS } from "@/lib/game/more-spots";
import { CABINS, ROUTES, canBoard, flightWait, type Cabin } from "@/lib/game/flights";
import { GOODS, buyPrice, isSupply } from "@/lib/game/trade";
import { checkInReward, checkedIn, weeklyAt } from "@/lib/game/weekly";
import { SPOTS, STAMP_BONUS, cedis, spotById, type Life, type StepResult } from "@/lib/game/world";

type Apply = (result: StepResult) => void;

function hours(minutes: number) {
  return `${Math.round(minutes / 60)}h`;
}

export function TripsApp({ life, onBack, onGo, onApply, onFly }: { life: Life; onBack: () => void; onGo: (spot: string) => void; onApply: Apply; onFly: (routeId: string, cabin: Cabin) => void }) {
  const stamps = life.stamps ?? [];
  const got = TRIP_IDS.filter((id) => stamps.includes(id)).length;
  const markets = SPOTS.filter((spot) => isSupply(spot.id));
  const day = Math.floor(life.minutes / 1440);
  const [cabin, setCabin] = useState<Cabin>("economy");
  const wait = flightWait(life);
  const seat = CABINS[cabin];
  return (
    <Screen title="Day trips" life={life} color="#7a3b0c" onBack={onBack}>
      <Card tone={got === TRIP_IDS.length ? "good" : undefined}>
        <p className="text-xs font-semibold uppercase tracking-wide text-[#8b97ab]">Travel book</p>
        <p className="font-display text-3xl">
          {got}/{TRIP_IDS.length} stamps
        </p>
        <p className="text-xs text-[#5c6b82]">{got === TRIP_IDS.length ? "Complete. You have seen Ghana beyond Accra." : `Visit every destination for a ${cedis(STAMP_BONUS)} bonus. Bus, car, or fly Accra–Kumasi.`}</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {TRIP_IDS.map((id) => (
            <span key={id} className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${stamps.includes(id) ? "bg-[#006B3F] text-white" : "bg-[#f4f7fb] text-[#8b97ab]"}`}>
              {spotById(id).emoji} {spotById(id).name}
            </span>
          ))}
        </div>
      </Card>

      <Label>✈️ ACCRA ↔ KUMASI</Label>
      <Card>
        <p className="font-semibold">Domestic flight</p>
        <p className="mt-1 text-xs text-[#5c6b82]">About 50 minutes in the air. Check in at Kotoka to fly up, or at Kumasi to fly home. Pick your cabin.</p>
        <div className="mt-3 grid gap-2">
          {(Object.keys(CABINS) as Cabin[]).map((id) => {
            const option = CABINS[id];
            return (
              <button
                key={id}
                type="button"
                onClick={() => setCabin(id)}
                className={`rounded-2xl px-3 py-2.5 text-left ${cabin === id ? "bg-[#121212] text-white" : "bg-[#f4f7fb]"}`}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="font-semibold">
                    {option.emoji} {option.label}
                  </span>
                  <span className="text-sm font-bold">{cedis(option.cost)}</span>
                </span>
                <span className={`mt-1 block text-[11px] ${cabin === id ? "text-white/75" : "text-[#5c6b82]"}`}>
                  {option.minutes} min · {option.bag} bag{option.bag === 1 ? "" : "s"} · {option.detail}
                </span>
              </button>
            );
          })}
        </div>
        {wait > 0 ? <p className="mt-2 text-xs font-semibold text-[#CE1126]">Next boarding in {Math.ceil(wait / 60)}h.</p> : null}
        <div className="mt-3 grid gap-2">
          {ROUTES.map((route) => {
            const here = life.where === route.from;
            return (
              <div key={route.id} className="rounded-2xl border border-[#ead9c4] bg-white p-3">
                <p className="text-sm font-semibold">{route.label}</p>
                <p className="text-[11px] text-[#5c6b82]">
                  Board at {spotById(route.from).name}
                  {here ? " · you are here" : ""}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {!here ? (
                    <Btn kind="light" onClick={() => onGo(route.from)}>
                      Go to {spotById(route.from).name}
                    </Btn>
                  ) : (
                    <Btn
                      kind="dark"
                      disabled={wait > 0 || life.cash < seat.cost}
                      onClick={() => {
                        const error = canBoard(life, route.id, cabin);
                        if (error) {
                          onApply({ life, notes: [], error });
                          return;
                        }
                        onFly(route.id, cabin);
                      }}
                    >
                      Board {seat.label} · {cedis(seat.cost)}
                    </Btn>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Label>OUT OF TOWN</Label>
      {TRIP_IDS.map((id) => {
        const spot = spotById(id);
        const far = spot.far ?? 0;
        return (
          <Card key={id}>
            <div className="flex items-start gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#fbe9d7] text-xl">{spot.emoji}</span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">
                  {spot.name} {stamps.includes(id) ? "✅" : ""}
                </span>
                <span className="block text-[11px] font-bold text-[#7a3b0c]">
                  {id === "kumasi" ? `Fly ~50 min or ${hours(far)} by bus · bus ${cedis(Math.round(far / 3))}` : `${hours(far)} by bus · ${cedis(Math.round(far / 3))} each way`}
                </span>
                <span className="mt-1 block text-xs text-[#5c6b82]">{spot.blurb.split(". ").slice(1).join(". ")}</span>
              </span>
            </div>
            <div className="mt-2">
              <Btn kind="light" onClick={() => onGo(id)}>
                📍 Show on the map
              </Btn>
            </div>
          </Card>
        );
      })}
      <Label>MARKETS FOR TRADERS</Label>
      <p className="-mt-1 text-xs text-[#5c6b82]">Buy here, sell anywhere else in town. Prices change every day.</p>
      {markets.map((spot) => {
        const goods = GOODS.filter((good) => buyPrice(good, spot.id, day) != null);
        return (
          <button key={spot.id} type="button" onClick={() => onGo(spot.id)} className="grid w-full min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl bg-white px-3 py-2.5 text-left shadow-sm">
            <span className="text-2xl">{spot.emoji}</span>
            <span className="min-w-0 overflow-hidden">
              <span className="block text-sm font-semibold">{spot.name}</span>
              <span className="block truncate text-[11px] text-[#5c6b82]">{goods.map((good) => `${good.emoji} ${good.label}`).join(" · ")}</span>
            </span>
            <span className="text-[#8b97ab]">›</span>
          </button>
        );
      })}
    </Screen>
  );
}

export function ChopApp({ life, onBack, onApply }: { life: Life; onBack: () => void; onApply: Apply }) {
  const chop = life.chop;
  const [name, setName] = useState("");
  const [closing, setClosing] = useState(false);
  const here = spotById(life.where);
  if (!chop) {
    const blocked = life.where === "home" || Boolean(here.far) || here.id !== life.where;
    return (
      <Screen title="Chop bar" life={life} color="#9a3412" onBack={onBack}>
        <Card>
          <p className="text-3xl">🍲</p>
          <p className="mt-1 font-semibold">Run your own chop bar</p>
          <p className="mt-1 text-xs text-[#5c6b82]">Open at the spot you are standing in. Pick up to {MENU_MAX} dishes, set your prices, cook in batches and hire cooks. Customers come all day, and players who stop by can eat at your place and pay you.</p>
          <p className="mt-2 rounded-xl bg-[#f6f1ea] px-3 py-2 text-xs font-semibold">{blocked ? "Go to a spot in Accra first. Your room is not a chop bar." : `You are at ${here.name}.`}</p>
          <input value={name} onChange={(event) => setName(event.target.value)} maxLength={28} placeholder="Chop bar name, e.g. Auntie's Kitchen" className="mt-2 h-10 w-full rounded-full bg-[#f4f7fb] px-4 text-sm outline-none" />
          <div className="mt-2">
            <Btn kind="dark" disabled={blocked || name.trim().length < 3 || life.cash < CHOP_OPEN} onClick={() => onApply(openChop(life, name))}>
              Open here · {cedis(CHOP_OPEN)}
            </Btn>
          </div>
        </Card>
      </Screen>
    );
  }
  const sales = salesOf(life);
  const sold = Object.values(sales.sold).reduce((sum, n) => sum + n, 0);
  const atBar = life.where === chop.spot;
  return (
    <Screen title={chop.name} life={life} color="#9a3412" onBack={onBack}>
      <Card tone={sales.empty.length ? "warn" : undefined}>
        <p className="text-xs font-semibold uppercase tracking-wide text-[#8b97ab]">{spotById(chop.spot).name}</p>
        <p className="mt-1 text-lg">
          {"★".repeat(Math.round(stars(chop)))}
          <span className="text-[#d5dbe6]">{"★".repeat(5 - Math.round(stars(chop)))}</span>
          <span className="ml-2 text-xs text-[#5c6b82]">{chop.served.toLocaleString("en-GH")} plates served</span>
        </p>
        <p className="mt-1 text-sm">
          In the tin: <b>{cedis(sales.revenue)}</b> from {sold} plates
          {sales.wages ? ` · cooks owed ${cedis(sales.wages)}` : ""}
        </p>
        {sales.empty.length ? <p className="mt-1 text-xs font-semibold text-[#CE1126]">Customers asked for {sales.empty.join(", ").toLowerCase()} and left hungry. Cook more.</p> : null}
        <div className="mt-2">
          <Btn kind="green" disabled={sales.revenue < 1 && sales.wages < 1} onClick={() => onApply(collectChop(life))}>
            Collect takings
          </Btn>
        </div>
        <p className="mt-2 text-[11px] text-[#5c6b82]">Takings build for up to a day. Fair prices raise your stars, and more stars bring more customers.</p>
      </Card>
      <Label>MENU · {chop.menu.length}/{MENU_MAX}</Label>
      {DISHES.map((dish) => {
        const item = chop.menu.find((entry) => entry.dish === dish.id);
        const range = priceRange(dish);
        const stock = chop.stock[dish.id] ?? 0;
        if (!item) {
          return (
            <div key={dish.id} className="flex items-center gap-3 rounded-2xl bg-white/60 px-3 py-2">
              <span className="text-xl">{dish.emoji}</span>
              <span className="min-w-0 flex-1 text-sm">
                {dish.label}
                <span className="block text-[11px] text-[#5c6b82]">Usual price {cedis(dish.fair)} · costs {cedis(dish.cost)} to make</span>
              </span>
              <Btn kind="light" disabled={chop.menu.length >= MENU_MAX} onClick={() => onApply(setDish(life, dish.id, dish.fair))}>
                Add
              </Btn>
            </div>
          );
        }
        return (
          <Card key={dish.id}>
            <div className="flex items-center gap-3">
              <span className="text-2xl">{dish.emoji}</span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">{dish.label}</span>
                <span className="block text-[11px] text-[#5c6b82]">
                  {stock} plates ready · usual price {cedis(dish.fair)}
                </span>
              </span>
              <span className="flex items-center gap-1">
                <button type="button" aria-label={`Lower the price of ${dish.label}`} disabled={item.price <= range.min} onClick={() => onApply(setDish(life, dish.id, item.price - 1))} className="grid h-8 w-8 place-items-center rounded-full bg-[#f4f7fb] font-bold disabled:opacity-40">
                  −
                </button>
                <span className="w-12 text-center text-sm font-bold">{cedis(item.price)}</span>
                <button type="button" aria-label={`Raise the price of ${dish.label}`} disabled={item.price >= range.max} onClick={() => onApply(setDish(life, dish.id, item.price + 1))} className="grid h-8 w-8 place-items-center rounded-full bg-[#f4f7fb] font-bold disabled:opacity-40">
                  +
                </button>
              </span>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <Btn kind="dark" disabled={(!atBar && !chop.cooks.length) || stock + batchSize(chop) > STOCK_MAX || life.cash < batchCost(chop, dish)} onClick={() => onApply(cookBatch(life, dish.id))}>
                {atBar ? "Cook" : "Cooks make"} {batchSize(chop)} · {cedis(batchCost(chop, dish))}
              </Btn>
              <Btn kind="red" onClick={() => onApply(setDish(life, dish.id, null))}>
                Take off menu
              </Btn>
            </div>
          </Card>
        );
      })}
      {!atBar && !chop.cooks.length ? <p className="text-xs text-[#5c6b82]">Go to {spotById(chop.spot).name} to cook, or hire a cook who cooks while you are away.</p> : null}
      <Label>
        KITCHEN · {chop.cooks.length}/{COOK_MAX} COOKS
      </Label>
      {chop.cooks.map((cook) => (
        <div key={cook.id} className="flex items-center gap-3 rounded-2xl bg-white px-3 py-2 shadow-sm">
          <span className="text-xl">👩🏾‍🍳</span>
          <span className="min-w-0 flex-1 text-sm font-semibold">
            {cook.name}
            <span className="block text-[11px] font-normal text-[#5c6b82]">{cedis(COOK_WAGE)} a day · bigger batches, faster service</span>
          </span>
          <Btn kind="red" onClick={() => onApply(fireCook(life, cook.id))}>
            Let go
          </Btn>
        </div>
      ))}
      <Btn kind="dark" disabled={chop.cooks.length >= COOK_MAX || life.cash < COOK_FEE} onClick={() => onApply(hireCook(life))}>
        Hire a cook · {cedis(COOK_FEE)}
      </Btn>
      <div className="pt-4 text-right">
        {closing ? (
          <span className="inline-flex gap-2">
            <Btn kind="red" onClick={() => onApply(closeChop(life))}>
              Sell for {cedis(Math.round(CHOP_OPEN * 0.5))}
            </Btn>
            <Btn kind="light" onClick={() => setClosing(false)}>
              Keep it
            </Btn>
          </span>
        ) : (
          <button type="button" onClick={() => setClosing(true)} className="text-xs font-semibold text-[#8b97ab]">
            Close the chop bar
          </button>
        )}
      </div>
    </Screen>
  );
}

type ChartView = { week: number; top: ChartSong[]; last: ChartSong[]; mine: number | null; prize: { rank: number; prize: number; song: string } | null };

export function ChartsApp({ me, life, cloud, onBack }: { me: string; life: Life; cloud: boolean; onBack: () => void }) {
  const [tab, setTab] = useState<"now" | "last">("now");
  const [notice, setNotice] = useState("");
  const [data, refresh] = usePoll<ChartView>(cloud ? "/api/live/play?view=chart" : null, 30000);
  if (!cloud) return <Offline title="Accra chart" color="#4c1d95" life={life} onBack={onBack} />;
  const list = tab === "now" ? (data?.top ?? []) : (data?.last ?? []);
  return (
    <Screen title="Accra chart" life={life} color="#4c1d95" onBack={onBack}>
      {notice ? <p className="rounded-2xl bg-[#fff4c2] px-3 py-2 text-xs font-semibold">{notice}</p> : null}
      {data?.prize ? (
        <Card tone="good">
          <p className="font-semibold">🏆 &ldquo;{data.prize.song}&rdquo; finished #{data.prize.rank} last week</p>
          <div className="mt-2">
            <Btn
              kind="gold"
              onClick={() =>
                void post({ action: "chart-claim" }).then(({ error }) => {
                  setNotice(error ?? `Prize collected: ${cedis(data.prize!.prize)}. It lands in your wallet shortly.`);
                  refresh();
                })
              }
            >
              Collect {cedis(data.prize.prize)}
            </Btn>
          </div>
        </Card>
      ) : null}
      <p className="text-xs text-[#5c6b82]">Every song by every player, ranked by streams this week. The top 10 artists each week win a prize, from {cedis(150)} up to {cedis(1000)} for number one. Record in the Studio and shoot videos to climb.</p>
      {data?.mine ? <p className="text-sm font-semibold">Your best song is #{data.mine} this week.</p> : null}
      <div className="flex gap-1.5">
        {(
          [
            ["now", "This week"],
            ["last", "Last week"],
          ] as const
        ).map(([id, label]) => (
          <button key={id} type="button" onClick={() => setTab(id)} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${tab === id ? "bg-[#4c1d95] text-white" : "bg-white"}`}>
            {label}
          </button>
        ))}
      </div>
      {!data ? <p className="text-sm text-[#5c6b82]">Loading…</p> : null}
      {data && !list.length ? <p className="text-sm text-[#5c6b82]">No streams counted yet. Be the first song on the chart.</p> : null}
      {list.map((song, index) => (
        <div key={`${song.username}-${song.title}-${index}`} className={`flex items-center gap-3 rounded-2xl px-3 py-2 shadow-sm ${song.username === me ? "bg-[#ede9fe]" : "bg-white"}`}>
          <span className={`w-7 text-center font-display text-xl ${index < 3 ? "text-[#b8860b]" : "text-[#8b97ab]"}`}>{index + 1}</span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold">
              {song.title} {song.video ? "🎬" : ""}
            </span>
            <span className="block truncate text-[11px] text-[#5c6b82]">
              {song.artist} · @{song.username}
            </span>
          </span>
          <span className="shrink-0 text-xs font-semibold text-[#4c1d95]">{song.streams.toLocaleString("en-GH")}</span>
        </div>
      ))}
    </Screen>
  );
}

export function WeeklyCard({ life, spotId, here, cloud, onCheck }: { life: Life; spotId: string; here: boolean; cloud: boolean; onCheck: () => void }) {
  const now = useClock();
  const live = now ? weeklyAt(spotId, new Date(now)) : null;
  const [data] = usePoll<{ live: { key: string } | null; count?: number; names?: string[] }>(cloud && live ? "/api/live/play?view=weekly" : null, 30000);
  if (!live) return null;
  const done = checkedIn(life, live.key);
  const crowd = data?.live?.key === live.key ? data : null;
  return (
    <div className="mt-3 rounded-2xl bg-[#121212] p-3 text-white">
      <p className="text-[11px] font-bold uppercase tracking-wide text-[#FCD116]">Live now · every week</p>
      <p className="mt-0.5 font-semibold">
        {live.event.emoji} {live.event.title}
      </p>
      <p className="text-xs text-white/75">{live.event.detail}</p>
      {crowd ? (
        <p className="mt-1 text-xs">
          👥 {crowd.count ?? 0} checked in{crowd.names?.length ? `: ${crowd.names.slice(0, 5).join(", ")}` : ""}
        </p>
      ) : null}
      <button type="button" disabled={!here || done} onClick={onCheck} className="mt-2 w-full rounded-full bg-[#FCD116] py-2 text-sm font-bold text-[#121212] disabled:opacity-50">
        {done ? "Checked in ✓" : here ? `Check in · +${cedis(checkInReward(life, new Date(now)))}` : "Go there to check in"}
      </button>
    </div>
  );
}

type ChopsView = { spot: string; chops: { owner: string; host: string; name: string; guests: number; menu: { dish: string; price: number; label: string; emoji: string }[] }[] };

export function PlayerChops({ spotId, here, cloud, onNet }: { spotId: string; here: boolean; cloud: boolean; onNet: NetAction }) {
  const [data, refresh] = usePoll<ChopsView>(cloud ? `/api/live/play?view=chops&spot=${encodeURIComponent(spotId)}` : null, 30000);
  const [notice, setNotice] = useState("");
  const chops = data?.spot === spotId ? data.chops : [];
  if (!chops.length) return null;
  return (
    <div className="mt-3 space-y-2">
      <p className="text-sm font-semibold text-[#5c6b82]">Player chop bars here</p>
      {chops.map((chop) => (
        <div key={chop.owner} className="rounded-2xl bg-[#fff1e6] p-3">
          <p className="font-semibold">🍲 {chop.name}</p>
          <p className="text-[11px] text-[#5c6b82]">
            Run by {chop.host} · @{chop.owner} · {chop.guests} guests served
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {chop.menu.map((item) => (
              <button
                key={item.dish}
                type="button"
                disabled={!here}
                onClick={() =>
                  void onNet({ api: "play", action: "chop-eat", owner: chop.owner, dish: item.dish }).then((error) => {
                    setNotice(error ?? "");
                    refresh();
                  })
                }
                className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold shadow-sm disabled:opacity-50"
              >
                {item.emoji} {item.label} · {cedis(item.price)}
              </button>
            ))}
          </div>
        </div>
      ))}
      {notice ? <p className="text-xs font-semibold text-[#CE1126]">{notice}</p> : null}
      {!here ? <p className="text-xs text-[#5c6b82]">Go there to eat.</p> : null}
    </div>
  );
}
