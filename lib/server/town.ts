import "server-only";
import { simulate, teamPower, SQUAD_MIN } from "@/lib/game/football";
import { postSnap, putIn, sellables, takeOut } from "@/lib/game/market";
import {
  MARKET_FEE,
  MAX_LISTINGS,
  POST_GAP_MS,
  POST_LABEL,
  RUN_FEE,
  RUN_STANDING,
  STIPEND,
  crewWeek,
  type FcMatch,
  type Listing,
  type ListingKind,
  type Net,
  type NetRef,
  type Post,
  type PostKind,
} from "@/lib/game/net";
import { cedis, mergeMoney, type Life } from "@/lib/game/world";
import { chargePlayer, creditPlayer, readPlayer, savePlayer, sendChat, updateLife } from "@/lib/server/live";
import { netOf, newId, withNet } from "@/lib/server/net";
import { everyone, forget } from "@/lib/server/play";

const HANDLE = /^[a-z0-9_]{3,16}$/;
const KINDS: ListingKind[] = ["item", "good", "fit"];

type Done = { error: string } | { life?: Life; note: string };

function noteId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function debit(life: Life, amount: number, note: string, prefix: string): Life {
  const id = noteId(prefix);
  return {
    ...life,
    cash: life.cash - amount,
    transfers: [...(life.transfers ?? []), { id, delta: -amount, note }].slice(-80),
    seenTransfers: [...new Set([...(life.seenTransfers ?? []), id])].slice(-80),
    log: [note, ...(life.log ?? [])].slice(0, 14),
  };
}

async function exchange(username: string, latest: Life, change: (life: Life) => Life | string, netChange?: (net: Net) => Net): Promise<{ error: string } | { life: Life }> {
  const player = await readPlayer(username);
  if (!player?.life) return { error: "Log in again." };
  const result = change(mergeMoney(player.life, latest));
  if (typeof result === "string") return { error: result };
  const fresh = await readPlayer(username);
  const base = fresh?.life ?? player.life;
  const net = netChange ? netChange({ ...netOf(base) }) : netOf(base);
  const saved = await savePlayer({ ...player, life: { ...result, chats: base.chats, spot: base.spot, net } });
  if (!saved) return { error: "That did not save. Try again." };
  return { life: result };
}

function logged(life: Life, line: string): Life {
  return { ...life, log: [line, ...(life.log ?? [])].slice(0, 14) };
}

export async function listItem(username: string, kind: string, ref: string, qty: number, price: number, latest: Life): Promise<Done> {
  if (!KINDS.includes(kind as ListingKind)) return { error: "Pick something to sell." };
  const count = kind === "good" ? Math.max(1, Math.min(10, Math.round(qty))) : 1;
  const value = Math.round(price);
  if (!Number.isFinite(value) || value < 5 || value > 200000) return { error: "Price it between ₵5 and ₵200,000." };
  const me = await readPlayer(username);
  if ((netOf(me?.life).listings ?? []).length >= MAX_LISTINGS) return { error: `You can have ${MAX_LISTINGS} listings at once.` };
  const key = typeof ref === "string" ? ref.slice(0, 80) : "";
  const sellable = sellables(mergeMoney(me?.life ?? latest, latest)).find((item) => item.kind === kind && item.ref === key);
  if (!sellable) return { error: "You do not have that to sell." };
  if (count > sellable.max) return { error: `You only have ${sellable.max}.` };
  const listing: Listing = { id: newId(), kind: kind as ListingKind, ref: key, label: sellable.label, emoji: sellable.emoji, qty: count, price: value, at: new Date().toISOString() };
  const done = await exchange(
    username,
    latest,
    (life) => {
      const out = takeOut(life, listing.kind, listing.ref, count);
      return typeof out === "string" ? out : logged(out, `Listed ${count > 1 ? `${count}× ` : ""}${listing.label} on the market for ${cedis(value)}.`);
    },
    (net) => ({ ...net, listings: [...(net.listings ?? []), listing].slice(-MAX_LISTINGS) }),
  );
  if ("error" in done) return done;
  forget();
  return { life: done.life, note: `${listing.emoji} ${listing.label} is on the market for ${cedis(value)}.` };
}

export async function cancelListing(username: string, id: string, latest: Life): Promise<Done> {
  const me = await readPlayer(username);
  const listing = (netOf(me?.life).listings ?? []).find((item) => item.id === id);
  if (!listing) return { error: "That listing is gone." };
  const done = await exchange(
    username,
    latest,
    (life) => putIn(life, listing.kind, listing.ref, listing.qty, 0),
    (net) => ({ ...net, listings: (net.listings ?? []).filter((item) => item.id !== id) }),
  );
  if ("error" in done) return done;
  forget();
  return { life: done.life, note: `${listing.label} is back with you.` };
}

export async function buyListing(username: string, seller: string, id: string, latest: Life): Promise<Done> {
  if (seller === username) return { error: "That is your own listing." };
  let taken: Listing | null = null;
  const pulled = await updateLife(seller, (life) => {
    const listing = (netOf(life).listings ?? []).find((item) => item.id === id);
    if (!listing) return null;
    taken = listing;
    return withNet(life, (net) => ({ ...net, listings: (net.listings ?? []).filter((item) => item.id !== id) }));
  });
  const listing = taken as Listing | null;
  if (!pulled || !listing) return { error: "Someone else bought it first." };
  const done = await exchange(username, latest, (life) => {
    if (life.cash < listing.price) return `You need ${cedis(listing.price)}. You have ${cedis(life.cash)}.`;
    const got = putIn(life, listing.kind, listing.ref, listing.qty, listing.price);
    if (typeof got === "string") return got;
    return debit(got, listing.price, `Bought ${listing.label} from @${seller} for ${cedis(listing.price)}.`, "market");
  });
  if ("error" in done) {
    await updateLife(seller, (life) => withNet(life, (net) => ({ ...net, listings: [...(net.listings ?? []), listing] })));
    return done;
  }
  const payout = Math.max(1, Math.round(listing.price * (1 - MARKET_FEE)));
  await creditPlayer(seller, payout, `@${username} bought your ${listing.label}. ${cedis(payout)} after the market fee.`, "market");
  forget();
  return { life: done.life, note: `${listing.emoji} ${listing.label} is yours.` };
}

export async function marketView(username: string) {
  const rows = await everyone();
  const me = await readPlayer(username);
  const all = rows
    .filter((row) => row.username !== username)
    .flatMap((row) => (netOf(row.life).listings ?? []).map((item) => ({ ...item, seller: row.username, name: row.name })))
    .sort((a, b) => Date.parse(b.at) - Date.parse(a.at))
    .slice(0, 60);
  return { listings: all, mine: netOf(me?.life).listings ?? [] };
}

export async function makePost(username: string, kind: string, text: string, latest: Life): Promise<Done> {
  if (!(kind in POST_LABEL)) return { error: "Pick what to post." };
  const body = text.trim().replace(/\s+/g, " ").slice(0, 200);
  if (kind === "status" && body.length < 2) return { error: "Write something first." };
  const me = await readPlayer(username);
  const last = (netOf(me?.life).posts ?? []).at(-1);
  if (last && Date.now() - Date.parse(last.at) < POST_GAP_MS) return { error: `Give it ${Math.ceil((POST_GAP_MS - (Date.now() - Date.parse(last.at))) / 60000)} minutes before posting again.` };
  const post: Post = { id: newId(), kind: kind as PostKind, text: body, snap: postSnap(mergeMoney(me?.life ?? latest, latest), kind as PostKind), likes: [], at: new Date().toISOString() };
  const saved = await updateLife(username, (life) => withNet(life, (net) => ({ ...net, posts: [...(net.posts ?? []), post].slice(-20) })));
  if (!saved) return { error: "The post did not save." };
  forget();
  return { note: "Posted." };
}

export async function likePost(username: string, author: string, id: string) {
  const saved = await updateLife(author, (life) => {
    const post = (netOf(life).posts ?? []).find((item) => item.id === id);
    if (!post) return null;
    return withNet(life, (net) => ({ ...net, posts: (net.posts ?? []).map((item) => (item.id === id ? { ...item, likes: item.likes.includes(username) ? item.likes.filter((name) => name !== username) : [...item.likes, username].slice(-500) } : item)) }));
  });
  if (!saved) return "That post is gone.";
  forget();
  return null;
}

export async function deletePost(username: string, id: string) {
  await updateLife(username, (life) => withNet(life, (net) => ({ ...net, posts: (net.posts ?? []).filter((item) => item.id !== id) })));
  forget();
  return null;
}

export async function followPlayer(username: string, who: string) {
  if (!HANDLE.test(who) || who === username) return "Pick a real username.";
  const them = await readPlayer(who);
  if (!them?.life) return "Nobody in Accra goes by that name.";
  await updateLife(username, (life) => withNet(life, (net) => {
    const list = net.following ?? [];
    return { ...net, following: list.includes(who) ? list.filter((name) => name !== who) : [...list, who].slice(-300) };
  }));
  forget();
  return null;
}

export async function feedView(username: string, tab: string) {
  const rows = await everyone();
  const me = await readPlayer(username);
  const following = netOf(me?.life).following ?? [];
  const followers = rows.filter((row) => (netOf(row.life).following ?? []).includes(username)).length;
  const now = Date.now();
  let posts = rows.flatMap((row) =>
    (row.username === username ? netOf(me?.life).posts ?? [] : netOf(row.life).posts ?? []).map((post) => ({
      id: post.id,
      kind: post.kind,
      text: post.text,
      snap: post.snap,
      at: post.at,
      likes: post.likes.length,
      liked: post.likes.includes(username),
      author: row.username,
      name: row.name,
      mine: row.username === username,
      followed: following.includes(row.username),
    })),
  );
  if (tab === "following") posts = posts.filter((post) => post.followed || post.mine);
  if (tab === "me") posts = posts.filter((post) => post.mine);
  if (tab === "trending") posts = posts.filter((post) => now - Date.parse(post.at) < 72 * 3600000).sort((a, b) => b.likes - a.likes || Date.parse(b.at) - Date.parse(a.at));
  else posts.sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
  return { posts: posts.slice(0, 40), following: following.length, followers };
}

async function loadFc(ref: NetRef) {
  const owner = await readPlayer(ref.owner);
  return (netOf(owner?.life).fc ?? []).find((item) => item.id === ref.id) ?? null;
}

export async function fcView(username: string) {
  const me = await readPlayer(username);
  const net = netOf(me?.life);
  const joined = await Promise.all((net.fcIn ?? []).map(loadFc));
  return [...(net.fc ?? []), ...joined.filter((item): item is FcMatch => Boolean(item && item.b === username))].sort((a, b) => Date.parse(b.at) - Date.parse(a.at)).slice(0, 15);
}

export async function fcChallenge(username: string, to: string, stake: number, latest: Life): Promise<Done> {
  if (!HANDLE.test(to) || to === username) return { error: "Pick a real username." };
  const value = Math.round(stake);
  if (!Number.isFinite(value) || value < 0 || value > 500) return { error: "Stake between ₵0 and ₵500." };
  const mine = latest.team;
  if (!mine || mine.players.length < SQUAD_MIN) return { error: `You need a team of ${SQUAD_MIN}.` };
  const them = await readPlayer(to);
  if (!them?.life) return { error: "Nobody in Accra goes by that name." };
  const theirs = them.life.team;
  if (!theirs || theirs.players.length < SQUAD_MIN) return { error: `@${to} has no team to field.` };
  const me = await readPlayer(username);
  if ((netOf(me?.life).fc ?? []).some((item) => item.status === "waiting" && item.b === to)) return { error: `@${to} has not answered your last challenge.` };
  let life: Life | undefined;
  if (value) {
    const charged = await chargePlayer(username, value, latest, `You staked ${cedis(value)} on ${mine.name} vs ${theirs.name}.`, "fc");
    if ("error" in charged) return { error: charged.error ?? "The stake did not go through." };
    life = charged.life;
  }
  const match: FcMatch = { id: newId(), a: username, b: to, aTeam: mine.name, bTeam: theirs.name, stake: value, status: "waiting", at: new Date().toISOString() };
  const saved = await updateLife(username, (current) => withNet(current, (net) => ({ ...net, fc: [...(net.fc ?? []).slice(-9), match] })));
  if (!saved) {
    if (value) await creditPlayer(username, value, "Refund: your football challenge did not send.", "refund");
    return { error: "The challenge did not send." };
  }
  await updateLife(to, (current) => withNet(current, (net) => ({ ...net, fcIn: [...(net.fcIn ?? []).filter((ref) => ref.id !== match.id), { owner: username, id: match.id }].slice(-15) })));
  await sendChat(username, to, `⚽ ${mine.name} want a gala against ${theirs.name}${value ? ` for ${cedis(value)}` : ""}. Open Football on your phone.`);
  return { life, note: `Challenge sent to @${to}.` };
}

export async function fcAnswer(username: string, ref: NetRef, yes: boolean, latest: Life): Promise<Done> {
  const match = await loadFc(ref);
  if (!match || match.b !== username || match.status !== "waiting") return { error: "That challenge is gone." };
  const save = (change: (item: FcMatch) => FcMatch) => updateLife(ref.owner, (life) => withNet(life, (net) => ({ ...net, fc: (net.fc ?? []).map((item) => (item.id === ref.id && item.status === "waiting" ? change(item) : item)) })));
  if (!yes) {
    await save((item) => ({ ...item, status: "declined" }));
    if (match.stake) await creditPlayer(match.a, match.stake, `@${username} turned down the gala. Stake returned.`, "refund");
    return { note: "Declined." };
  }
  const mine = latest.team;
  if (!mine || mine.players.length < SQUAD_MIN) return { error: `You need a team of ${SQUAD_MIN} to play.` };
  const owner = await readPlayer(match.a);
  const theirs = owner?.life?.team;
  if (!theirs || theirs.players.length < SQUAD_MIN) {
    await save((item) => ({ ...item, status: "declined" }));
    if (match.stake) await creditPlayer(match.a, match.stake, "Your team could not field seven. Stake returned.", "refund");
    return { error: `@${match.a} cannot field a team any more.` };
  }
  let life: Life | undefined;
  if (match.stake) {
    const charged = await chargePlayer(username, match.stake, latest, `You staked ${cedis(match.stake)} on ${mine.name} vs ${theirs.name}.`, "fc");
    if ("error" in charged) return { error: charged.error ?? "The stake did not go through." };
    life = charged.life;
  }
  const [home, away] = simulate(teamPower(theirs), teamPower(mine));
  const saved = await save((item) => ({ ...item, status: "done", score: [home, away], aTeam: theirs.name, bTeam: mine.name }));
  if (!saved) {
    if (match.stake) await creditPlayer(username, match.stake, "Refund: the match did not record.", "refund");
    return { error: "The match did not record." };
  }
  const line = `${theirs.name} ${home}–${away} ${mine.name}`;
  if (match.stake) {
    if (home === away) {
      await creditPlayer(match.a, match.stake, `${line}. Draw, stake returned.`, "fc");
      await creditPlayer(username, match.stake, `${line}. Draw, stake returned.`, "fc");
    } else await creditPlayer(home > away ? match.a : username, match.stake * 2, `${line}. You won ${cedis(match.stake * 2)}.`, "fc");
  }
  await sendChat(username, match.a, `⚽ Full time: ${line}.`);
  return { life, note: `Full time: ${line}. ${away > home ? "You won!" : away === home ? "A draw." : "Beaten this time."}` };
}

function tally(rows: Awaited<ReturnType<typeof everyone>>, week: number) {
  const votes = new Map<string, number>();
  for (const row of rows) {
    const vote = (netOf(row.life).votes ?? []).find((item) => item.week === week);
    if (vote) votes.set(vote.for, (votes.get(vote.for) ?? 0) + 1);
  }
  return rows
    .flatMap((row) => {
      const run = (netOf(row.life).runs ?? []).find((item) => item.week === week);
      return run ? [{ username: row.username, name: row.name, pitch: run.pitch, votes: votes.get(row.username) ?? 0 }] : [];
    })
    .sort((a, b) => b.votes - a.votes || a.username.localeCompare(b.username));
}

export async function electionView(username: string) {
  const rows = await everyone();
  const week = crewWeek();
  const me = await readPlayer(username);
  const net = netOf(me?.life);
  const last = tally(rows, week - 1);
  const winner = last[0] && last[0].votes > 0 ? last[0] : null;
  return {
    week,
    candidates: tally(rows, week),
    myVote: (net.votes ?? []).find((item) => item.week === week)?.for ?? null,
    running: (net.runs ?? []).some((item) => item.week === week),
    winner,
    canClaim: winner?.username === username && net.stipend !== week - 1,
  };
}

export async function runForOffice(username: string, pitch: string, latest: Life): Promise<Done> {
  const week = crewWeek();
  const words = pitch.trim().replace(/\s+/g, " ").slice(0, 140);
  if (words.length < 8) return { error: "Tell the area why they should vote for you." };
  if ((latest.community?.standing ?? 0) < RUN_STANDING) return { error: `You need ${RUN_STANDING} community standing to run.` };
  const me = await readPlayer(username);
  if ((netOf(me?.life).runs ?? []).some((item) => item.week === week)) return { error: "You are already on the ballot this week." };
  const charged = await chargePlayer(username, RUN_FEE, latest, `Paid ${cedis(RUN_FEE)} to file for assembly member.`, "ballot");
  if ("error" in charged) return { error: charged.error ?? "The filing fee did not go through." };
  const saved = await updateLife(username, (life) => withNet(life, (net) => ({ ...net, runs: [...(net.runs ?? []).filter((item) => item.week >= week - 1), { week, pitch: words }] })));
  if (!saved) {
    await creditPlayer(username, RUN_FEE, "Refund: your filing did not save.", "refund");
    return { error: "The filing did not save." };
  }
  forget();
  return { life: charged.life, note: "You are on the ballot. Get the area to vote." };
}

export async function castVote(username: string, candidate: string) {
  const week = crewWeek();
  if (candidate === username) return "Vote for someone else. Humility wins elections.";
  const them = await readPlayer(candidate);
  if (!(netOf(them?.life).runs ?? []).some((item) => item.week === week)) return "That person is not on the ballot.";
  const me = await readPlayer(username);
  if ((netOf(me?.life).votes ?? []).some((item) => item.week === week)) return "You already voted this week.";
  const saved = await updateLife(username, (life) => withNet(life, (net) => ({ ...net, votes: [...(net.votes ?? []).filter((item) => item.week >= week - 1), { week, for: candidate }] })));
  if (!saved) return "Your vote did not save.";
  forget();
  return null;
}

export async function claimStipend(username: string) {
  const view = await electionView(username);
  if (!view.canClaim) return "Only last week's assembly member can claim the stipend.";
  const saved = await updateLife(username, (life) => (netOf(life).stipend === view.week - 1 ? null : withNet(life, (net) => ({ ...net, stipend: view.week - 1 }))));
  if (!saved) return "Already claimed.";
  await creditPlayer(username, STIPEND, `Assembly member stipend: ${cedis(STIPEND)}. Serve the people well.`, "stipend");
  return null;
}
