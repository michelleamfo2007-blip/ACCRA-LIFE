import "server-only";
import type { Report } from "@/lib/game/net";
import { everyone, forget } from "@/lib/server/play";
import { netOf, withNet } from "@/lib/server/net";
import { updateLife } from "@/lib/server/live";

export type GameReport = Report & { by: string };

export async function listGameReports(): Promise<GameReport[]> {
  const rows = await everyone(true);
  return rows
    .flatMap((row) => (netOf(row.life).reports ?? []).map((report) => ({ ...report, by: row.username })))
    .sort((a, b) => Date.parse(b.at) - Date.parse(a.at))
    .slice(0, 80);
}

export async function mutePlayer(who: string, hours: number) {
  const name = who.trim().toLowerCase().replace(/^@/, "");
  if (!/^[a-z0-9_]{3,16}$/.test(name)) return "Pick a real username.";
  const ms = Math.min(168, Math.max(1, Math.round(hours))) * 3600000;
  const until = new Date(Date.now() + ms).toISOString();
  const saved = await updateLife(name, (life) => withNet(life, (net) => ({ ...net, mutedUntil: until })));
  if (!saved) return "That player is gone.";
  forget();
  return null;
}

export async function unmutePlayer(who: string) {
  const name = who.trim().toLowerCase().replace(/^@/, "");
  if (!/^[a-z0-9_]{3,16}$/.test(name)) return "Pick a real username.";
  const saved = await updateLife(name, (life) => withNet(life, (net) => ({ ...net, mutedUntil: undefined })));
  if (!saved) return "That player is gone.";
  forget();
  return null;
}

export async function clearGameReport(by: string, who: string, at: string) {
  const reporter = by.trim().toLowerCase().replace(/^@/, "");
  const target = who.trim().toLowerCase().replace(/^@/, "");
  if (!/^[a-z0-9_]{3,16}$/.test(reporter) || !/^[a-z0-9_]{3,16}$/.test(target)) return "That report is gone.";
  const saved = await updateLife(reporter, (life) => withNet(life, (net) => ({ ...net, reports: (net.reports ?? []).filter((item) => !(item.who === target && item.at === at)) })));
  return saved ? null : "That report is gone.";
}
