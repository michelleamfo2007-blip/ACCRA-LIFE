import "server-only";
import { CHART_PRIZES, chartWindow, streamsBetween, type ChartSong } from "@/lib/game/career";
import { dishOf, priceRange } from "@/lib/game/kitchen";
import type { ChopSign } from "@/lib/game/net";
import { weekOf, weeklyNow } from "@/lib/game/weekly";
import { SPOTS, cedis, realMinutes, type Life } from "@/lib/game/world";
import { chargePlayer, creditPlayer, readPlayer, updateLife } from "@/lib/server/live";
import { netOf, withNet } from "@/lib/server/net";
import { everyone, forget } from "@/lib/server/play";

type Done = { error: string } | { life?: Life; note: string };
type Row = Awaited<ReturnType<typeof everyone>>[number];

function chartFor(rows: Row[], week: number): ChartSong[] {
  const { start, end } = chartWindow(week);
  const to = Math.min(end, realMinutes());
  return rows
    .flatMap((row) => {
      const music = row.life?.music;
      if (!music?.songs?.length || (row.life?.minutes ?? 0) < 1_000_000) return [];
      return music.songs.map((song) => ({
        title: song.title,
        artist: row.name,
        username: row.username,
        streams: streamsBetween(song, music.fans ?? 0, start, to),
        quality: song.quality,
        video: Boolean(song.video),
      }));
    })
    .filter((song) => song.streams > 0)
    .sort((a, b) => b.streams - a.streams || b.quality - a.quality);
}

function prizeFor(chart: ChartSong[], username: string) {
  const seen = new Set<string>();
  let rank = 0;
  for (const song of chart) {
    if (seen.has(song.username)) continue;
    seen.add(song.username);
    rank += 1;
    if (rank > CHART_PRIZES.length) return null;
    if (song.username === username) return { rank, prize: CHART_PRIZES[rank - 1], song: song.title };
  }
  return null;
}

export async function chartView(username: string) {
  const rows = await everyone();
  const week = weekOf(Date.now());
  const now = chartFor(rows, week);
  const last = chartFor(rows, week - 1);
  const me = await readPlayer(username);
  const win = prizeFor(last, username);
  return {
    week,
    top: now.slice(0, 20),
    last: last.slice(0, 10),
    mine: now.findIndex((song) => song.username === username) + 1 || null,
    prize: win && netOf(me?.life).chartPaid !== week - 1 ? win : null,
  };
}

export async function claimChart(username: string) {
  const rows = await everyone(true);
  const week = weekOf(Date.now());
  const win = prizeFor(chartFor(rows, week - 1), username);
  if (!win) return "Only last week's top 10 artists get a chart prize.";
  const saved = await updateLife(username, (life) => (netOf(life).chartPaid === week - 1 ? null : withNet(life, (net) => ({ ...net, chartPaid: week - 1 }))));
  if (!saved) return "You already collected last week's prize.";
  await creditPlayer(username, win.prize, `"${win.song}" finished #${win.rank} on the Accra chart. Prize: ${cedis(win.prize)}.`, "chart");
  forget();
  return null;
}

export async function weeklyView() {
  const live = weeklyNow();
  if (!live) return { live: null };
  const rows = await everyone();
  const here = rows.filter((row) => (row.life?.checkins ?? []).includes(live.key));
  return { live: { key: live.key, title: live.event.title, spot: live.event.spot }, count: here.length, names: here.slice(0, 12).map((row) => row.name) };
}

function cleanSign(life: Life | null | undefined): ChopSign | null {
  const chop = life?.chop;
  if (!chop) return null;
  const spot = SPOTS.find((item) => item.id === chop.spot && item.id !== "home" && !item.far && !item.soon);
  if (!spot) return null;
  const menu = (chop.menu ?? [])
    .filter((item) => (chop.stock?.[item.dish] ?? 0) > 0)
    .flatMap((item) => {
      const dish = dishOf(item.dish);
      if (!dish) return [];
      const range = priceRange(dish);
      const price = Math.round(item.price);
      return Number.isFinite(price) && price >= range.min && price <= range.max ? [{ dish: dish.id, price }] : [];
    })
    .slice(0, 4);
  return { name: String(chop.name ?? "Chop bar").slice(0, 28), spot: spot.id, menu };
}

export async function publishChop(username: string, latest: Life) {
  const sign = cleanSign(latest);
  const saved = await updateLife(username, (life) =>
    withNet(life, (net) => ({ ...net, chop: sign ? { ...sign, guests: net.chop?.guests ?? 0, takings: net.chop?.takings ?? 0 } : null })),
  );
  if (!saved) return "The menu board did not update.";
  forget();
  return null;
}

export async function chopsAt(username: string, spot: string) {
  const rows = await everyone();
  return rows
    .filter((row) => row.username !== username)
    .flatMap((row) => {
      const sign = netOf(row.life).chop;
      if (!sign || sign.spot !== spot || !sign.menu.length) return [];
      return [{ owner: row.username, host: row.name, name: sign.name, guests: sign.guests ?? 0, menu: sign.menu.flatMap((item) => (dishOf(item.dish) ? [{ ...item, label: dishOf(item.dish)!.label, emoji: dishOf(item.dish)!.emoji }] : [])) }];
    })
    .slice(0, 8);
}

export async function eatAtChop(username: string, owner: string, dishId: string, latest: Life): Promise<Done> {
  if (owner === username) return { error: "That is your own chop bar. Eat from the pot at home." };
  const host = await readPlayer(owner);
  const sign = netOf(host?.life).chop;
  const item = sign?.menu.find((entry) => entry.dish === dishId);
  const dish = dishOf(dishId);
  if (!sign || !item || !dish) return { error: "That dish has finished for today." };
  if (latest.where !== sign.spot) return { error: `${sign.name} is at another spot. Go there to eat.` };
  const charged = await chargePlayer(username, item.price, latest, `You ate ${dish.label.toLowerCase()} at @${owner}'s ${sign.name}. ${cedis(item.price)}.`, "chop");
  if ("error" in charged) return { error: charged.error ?? "The payment did not go through." };
  await creditPlayer(owner, item.price, `@${username} ate ${dish.label.toLowerCase()} at ${sign.name}. +${cedis(item.price)}.`, "chop");
  await updateLife(owner, (life) => withNet(life, (net) => (net.chop ? { ...net, chop: { ...net.chop, guests: (net.chop.guests ?? 0) + 1, takings: (net.chop.takings ?? 0) + item.price } } : net)));
  forget();
  const fed: Life = {
    ...charged.life,
    needs: {
      ...charged.life.needs,
      hunger: Math.min(100, charged.life.needs.hunger + dish.hunger),
      social: Math.min(100, charged.life.needs.social + 8),
      fun: Math.min(100, charged.life.needs.fun + 6),
    },
  };
  return { life: fed, note: `${dish.emoji} ${dish.label} at ${sign.name}. The plate is generous.` };
}
