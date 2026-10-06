import { NextResponse } from "next/server";
import { currentUser } from "@/lib/server/guard";
import { clearGameReport, listGameReports, mutePlayer, unmutePlayer } from "@/lib/server/moderate";
import { crowdCounts, listPlayersForAdmin, topUpJoinWallets } from "@/lib/server/live";

async function editor() {
  const user = await currentUser();
  if (!user || user.role !== "admin") return null;
  return user;
}

export async function GET() {
  const user = await editor();
  if (!user) return NextResponse.json({ error: "Editors only." }, { status: 403 });
  const [reports, players, crowd] = await Promise.all([listGameReports(), listPlayersForAdmin(), crowdCounts()]);
  const withLife = players.filter((player) => player.hasLife).length;
  const online = players.filter((player) => player.online).length;
  return NextResponse.json({
    reports,
    players,
    stats: {
      players: crowd.players || players.length,
      online: crowd.online || online,
      withLife,
      houses: withLife,
    },
  });
}

export async function PATCH(request: Request) {
  const user = await editor();
  if (!user) return NextResponse.json({ error: "Editors only." }, { status: 403 });
  const body = await request.json().catch(() => null);
  const action = String(body?.action ?? "");
  if (action === "mute") {
    const error = await mutePlayer(String(body?.who ?? ""), Number(body?.hours ?? 24));
    return error ? NextResponse.json({ error }, { status: 400 }) : NextResponse.json({ ok: true });
  }
  if (action === "unmute") {
    const error = await unmutePlayer(String(body?.who ?? ""));
    return error ? NextResponse.json({ error }, { status: 400 }) : NextResponse.json({ ok: true });
  }
  if (action === "clear") {
    const error = await clearGameReport(String(body?.by ?? ""), String(body?.who ?? ""), String(body?.at ?? ""));
    return error ? NextResponse.json({ error }, { status: 400 }) : NextResponse.json({ ok: true });
  }
  if (action === "topup-wallets") {
    const result = await topUpJoinWallets();
    return NextResponse.json({ ok: true, ...result });
  }
  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
