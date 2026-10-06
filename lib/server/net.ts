import "server-only";
import { cedis, spotById, type Life } from "@/lib/game/world";
import type { Bond, BondStage, ChatGroup, HostHome, Net, NetRef, SocialView, SusuGroup } from "@/lib/game/net";
import { EMOTES, REFER_CAP, REFER_PRIZE, RING_PRICE, WEDDING_PRICE } from "@/lib/game/net";
import { chargePlayer, creditPlayer, mutedNote, readPlayer, sendChat, updateLife } from "@/lib/server/live";

const HANDLE = /^[a-z0-9_]{3,16}$/;

type Done = { error: string } | { life?: Life; note: string };

export function netOf(life: Life | null | undefined): Net {
  return life?.net && typeof life.net === "object" ? life.net : {};
}

export function withNet(life: Life, change: (net: Net) => Net): Life {
  return { ...life, net: change({ ...netOf(life) }) };
}

export function newId() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export function accraTime() {
  return new Intl.DateTimeFormat("en-GH", { timeZone: "Africa/Accra", hour: "numeric", minute: "2-digit", hour12: true }).format(new Date());
}

function cleanHandles(list: unknown, except: string) {
  if (!Array.isArray(list)) return [];
  const names = list.map((item) => String(item).trim().toLowerCase().replace(/^@/, "")).filter((item) => HANDLE.test(item) && item !== except);
  return [...new Set(names)].slice(0, 11);
}

async function realHandles(list: string[]) {
  const found = await Promise.all(list.map(async (name) => ((await readPlayer(name))?.life ? name : null)));
  return found.filter((name): name is string => Boolean(name));
}

export async function movePlayer(username: string, where: string, x: number, y: number, emote = "") {
  if (!where || where === "home" || !Number.isFinite(x) || !Number.isFinite(y)) return false;
  const at = new Date().toISOString();
  const face = (EMOTES as readonly string[]).includes(emote) ? { emote, emoteAt: at } : {};
  const spot = { where: where.slice(0, 40), x: Math.max(0, Math.min(100, Math.round(x))), y: Math.max(0, Math.min(100, Math.round(y))), at, ...face };
  const saved = await updateLife(username, (life) => ({ ...life, spot, where: spot.where }));
  return Boolean(saved);
}

async function ownedSusu(ref: NetRef) {
  const owner = await readPlayer(ref.owner);
  return netOf(owner?.life).susu?.find((group) => group.id === ref.id) ?? null;
}

async function ownedGroup(ref: NetRef) {
  const owner = await readPlayer(ref.owner);
  return netOf(owner?.life).groups?.find((group) => group.id === ref.id) ?? null;
}

export async function socialView(username: string): Promise<SocialView | null> {
  const player = await readPlayer(username);
  if (!player?.life) return null;
  const net = netOf(player.life);
  const joinedSusu = await Promise.all((net.susuIn ?? []).map(ownedSusu));
  const susu = [
    ...(net.susu ?? []).map((group) => ({ ...group, mine: true })),
    ...joinedSusu.filter((group): group is SusuGroup => Boolean(group && group.members.includes(username))).map((group) => ({ ...group, mine: false })),
  ];
  const joinedGroups = await Promise.all((net.groupsIn ?? []).map(ownedGroup));
  const groups = [...(net.groups ?? []), ...joinedGroups.filter((group): group is ChatGroup => Boolean(group && group.members.includes(username)))].map((group) => {
    const last = group.messages[group.messages.length - 1];
    return {
      id: group.id,
      owner: group.owner,
      name: group.name,
      members: group.members,
      last: last ? `${last.from === username ? "You" : `@${last.from}`}: ${last.text}` : "",
      time: last?.time ?? "",
      incoming: group.messages.filter((mail) => mail.from !== username).slice(-30).map((mail) => ({ at: mail.at, text: `@${mail.from}: ${mail.text}` })),
    };
  });
  const blocked = net.blocked ?? [];
  return { susu, groups, bond: net.bond ?? null, asks: (net.asks ?? []).filter((item) => !blocked.includes(item.from)), invites: (net.invites ?? []).filter((item) => Date.now() - Date.parse(item.at) < 86400000 && !blocked.includes(item.from)), blocked };
}

export async function createSusu(username: string, name: string, amount: number, members: unknown) {
  const title = name.trim().slice(0, 32);
  const value = Math.round(amount);
  if (!title) return "Name the susu group.";
  if (!Number.isFinite(value) || value < 10 || value > 5000) return "Pick a contribution between ₵10 and ₵5,000.";
  const others = await realHandles(cleanHandles(members, username));
  if (!others.length) return "Add at least one real username.";
  const group: SusuGroup = { id: newId(), name: title, owner: username, members: [username, ...others], amount: value, round: 0, paid: [], pot: 0, history: [], createdAt: new Date().toISOString() };
  const saved = await updateLife(username, (life) => withNet(life, (net) => ({ ...net, susu: [...(net.susu ?? []), group].slice(-6) })));
  if (!saved) return "The susu did not save.";
  for (const member of others) {
    await updateLife(member, (life) => withNet(life, (net) => ({ ...net, susuIn: [...(net.susuIn ?? []).filter((ref) => ref.id !== group.id), { owner: username, id: group.id }].slice(-12) })));
    await sendChat(username, member, `🤝 I added you to our susu "${title}". ${cedis(value)} a round. Open Susu on your phone.`);
  }
  return null;
}

export async function paySusu(username: string, ref: NetRef, latest: Life): Promise<Done> {
  const group = await ownedSusu(ref);
  if (!group || !group.members.includes(username)) return { error: "That susu is gone." } as const;
  if (group.paid.includes(username)) return { error: "You already paid this round." } as const;
  const charged = await chargePlayer(username, group.amount, latest, `You paid ${cedis(group.amount)} into the ${group.name} susu.`, "susu");
  if ("error" in charged) return { error: charged.error ?? "The payment did not go through." };
  let payout: { to: string; amount: number } | null = null;
  const saved = await updateLife(ref.owner, (life) =>
    withNet(life, (net) => ({
      ...net,
      susu: (net.susu ?? []).map((item) => {
        if (item.id !== ref.id || item.paid.includes(username)) return item;
        const paid = [...item.paid, username];
        const pot = item.pot + item.amount;
        if (paid.length < item.members.length) return { ...item, paid, pot };
        const to = item.members[item.round % item.members.length];
        payout = { to, amount: pot };
        return { ...item, paid: [], pot: 0, round: item.round + 1, history: [{ round: item.round + 1, to, amount: pot, at: new Date().toISOString() }, ...item.history].slice(0, 20) };
      }),
    })),
  );
  if (!saved) {
    await creditPlayer(username, group.amount, `Refund: the ${group.name} susu did not record your payment.`, "refund");
    return { error: "The susu book did not update. Your money is coming back." } as const;
  }
  const done = payout as { to: string; amount: number } | null;
  if (done) await creditPlayer(done.to, done.amount, `The ${group.name} susu paid you ${cedis(done.amount)}. Your turn came.`, "susu-out");
  return { life: charged.life, note: done ? `Round complete. @${done.to} collects ${cedis(done.amount)}.` : `Paid. Waiting on ${group.members.length - group.paid.length - 1} more.` } as const;
}

export async function leaveSusu(username: string, ref: NetRef) {
  const group = await ownedSusu(ref);
  if (!group) return "That susu is gone.";
  if (group.pot > 0) return "Wait for this round to pay out first.";
  if (ref.owner === username) {
    await updateLife(username, (life) => withNet(life, (net) => ({ ...net, susu: (net.susu ?? []).filter((item) => item.id !== ref.id) })));
    return null;
  }
  await updateLife(ref.owner, (life) => withNet(life, (net) => ({ ...net, susu: (net.susu ?? []).map((item) => (item.id === ref.id ? { ...item, members: item.members.filter((name) => name !== username) } : item)) })));
  await updateLife(username, (life) => withNet(life, (net) => ({ ...net, susuIn: (net.susuIn ?? []).filter((item) => item.id !== ref.id) })));
  return null;
}

export async function createGroup(username: string, name: string, members: unknown): Promise<{ error: string } | { ref: NetRef }> {
  const title = name.trim().slice(0, 32);
  if (!title) return { error: "Name the group." } as const;
  const others = await realHandles(cleanHandles(members, username));
  if (!others.length) return { error: "Add at least one real username." } as const;
  const group: ChatGroup = { id: newId(), name: title, owner: username, members: [username, ...others], messages: [] };
  const saved = await updateLife(username, (life) => withNet(life, (net) => ({ ...net, groups: [...(net.groups ?? []), group].slice(-10) })));
  if (!saved) return { error: "The group did not save." } as const;
  for (const member of others) {
    await updateLife(member, (life) => withNet(life, (net) => ({ ...net, groupsIn: [...(net.groupsIn ?? []).filter((ref) => ref.id !== group.id), { owner: username, id: group.id }].slice(-20) })));
  }
  return { ref: { owner: username, id: group.id } } as const;
}

export async function readGroup(username: string, ref: NetRef) {
  const group = await ownedGroup(ref);
  if (!group || !group.members.includes(username)) return null;
  return group;
}

export async function sendGroup(username: string, ref: NetRef, text: string) {
  const body = text.trim().slice(0, 500);
  if (!body) return "Write something first.";
  const muted = mutedNote((await readPlayer(username))?.life);
  if (muted) return muted;
  const group = await ownedGroup(ref);
  if (!group || !group.members.includes(username)) return "You are not in that group.";
  const saved = await updateLife(ref.owner, (life) =>
    withNet(life, (net) => ({
      ...net,
      groups: (net.groups ?? []).map((item) => (item.id === ref.id ? { ...item, messages: [...item.messages, { from: username, text: body, time: accraTime(), at: new Date().toISOString() }].slice(-120) } : item)),
    })),
  );
  return saved ? null : "The message did not save.";
}

export async function leaveGroup(username: string, ref: NetRef) {
  if (ref.owner === username) {
    await updateLife(username, (life) => withNet(life, (net) => ({ ...net, groups: (net.groups ?? []).filter((item) => item.id !== ref.id) })));
    return null;
  }
  await updateLife(ref.owner, (life) => withNet(life, (net) => ({ ...net, groups: (net.groups ?? []).map((item) => (item.id === ref.id ? { ...item, members: item.members.filter((name) => name !== username) } : item)) })));
  await updateLife(username, (life) => withNet(life, (net) => ({ ...net, groupsIn: (net.groupsIn ?? []).filter((item) => item.id !== ref.id) })));
  return null;
}

const NEXT_STAGE: Record<BondStage, BondStage | null> = { dating: "engaged", engaged: "married", married: null };

export async function askBond(username: string, to: string, kind: BondStage, latest: Life): Promise<Done> {
  if (!HANDLE.test(to) || to === username) return { error: "Pick a real username." } as const;
  const me = await readPlayer(username);
  const them = await readPlayer(to);
  if (!me?.life || !them?.life) return { error: "Nobody in Accra goes by that name." } as const;
  const mine = netOf(me.life).bond ?? null;
  const theirs = netOf(them.life).bond ?? null;
  if (netOf(them.life).asks?.some((ask) => ask.from === username)) return { error: `@${to} has not answered yet.` } as const;
  if (kind === "dating") {
    if (mine) return { error: `You are already ${mine.stage} with @${mine.with}.` } as const;
    if (theirs) return { error: `@${to} is already taken.` } as const;
  } else {
    if (mine?.with !== to) return { error: `Date @${to} first.` } as const;
    if (NEXT_STAGE[mine.stage] !== kind) return { error: kind === "engaged" ? "You are past that step." : "Get engaged first." } as const;
  }
  const price = kind === "engaged" ? RING_PRICE : kind === "married" ? WEDDING_PRICE / 2 : 0;
  let life: Life | undefined;
  if (price) {
    const charged = await chargePlayer(username, price, latest, kind === "engaged" ? `You bought a ring for ${cedis(price)}.` : `You paid your half of the wedding: ${cedis(price)}.`, kind === "engaged" ? "ring" : "wedding");
    if ("error" in charged) return { error: charged.error ?? "The payment did not go through." };
    life = charged.life;
  }
  const saved = await updateLife(to, (current) => withNet(current, (net) => ({ ...net, asks: [...(net.asks ?? []).filter((ask) => ask.from !== username), { from: username, kind, at: new Date().toISOString(), paid: price || undefined }].slice(-10) })));
  if (!saved) {
    if (price) await creditPlayer(username, price, `Refund: your request to @${to} did not send.`, "refund");
    return { error: "The request did not send." } as const;
  }
  const line = kind === "dating" ? "💌 Will you go out with me? Open People on your phone to answer." : kind === "engaged" ? "💍 Will you marry me? Open People on your phone to answer." : "💒 Let's set the wedding date. Open People on your phone.";
  await sendChat(username, to, line);
  return { life, note: kind === "dating" ? `You asked @${to} out.` : kind === "engaged" ? `Ring bought. You proposed to @${to}.` : `You paid your half. Waiting on @${to}.` } as const;
}

export async function answerBond(username: string, from: string, yes: boolean, latest: Life): Promise<Done> {
  const me = await readPlayer(username);
  const ask = netOf(me?.life).asks?.find((item) => item.from === from);
  if (!me?.life || !ask) return { error: "That request is gone." } as const;
  const clearAsk = () => updateLife(username, (life) => withNet(life, (net) => ({ ...net, asks: (net.asks ?? []).filter((item) => item.from !== from) })));
  if (!yes) {
    await clearAsk();
    if (ask.paid) await creditPlayer(from, ask.paid, `@${username} said no. ${cedis(ask.paid)} came back to you.`, "refund");
    await sendChat(username, from, "Not this time. Still friends?");
    return { note: `You said no to @${from}.` } as const;
  }
  let life: Life | undefined;
  if (ask.kind === "married") {
    const charged = await chargePlayer(username, WEDDING_PRICE / 2, latest, `You paid your half of the wedding: ${cedis(WEDDING_PRICE / 2)}.`, "wedding");
    if ("error" in charged) return { error: `${charged.error ?? "Payment failed."} Your half of the wedding is ${cedis(WEDDING_PRICE / 2)}.` } as const;
    life = charged.life;
  }
  await clearAsk();
  const since = new Date().toISOString();
  const bondFor = (other: string): Bond => ({ with: other, stage: ask.kind, since });
  await updateLife(username, (current) => withNet(current, (net) => ({ ...net, bond: bondFor(from) })));
  await updateLife(from, (current) => withNet(current, (net) => ({ ...net, bond: bondFor(username) })));
  const line = ask.kind === "dating" ? "Yes! 💕 We're dating." : ask.kind === "engaged" ? "Yes! 💍 We're engaged." : "Yes! 💒 We're married.";
  await sendChat(username, from, line);
  return { life, note: ask.kind === "married" ? `You married @${from}. Congratulations!` : `You and @${from} are ${ask.kind} now.` } as const;
}

export async function endBond(username: string) {
  const me = await readPlayer(username);
  const bond = netOf(me?.life).bond;
  if (!bond) return "You are single.";
  await updateLife(username, (life) => withNet(life, (net) => ({ ...net, bond: null })));
  await updateLife(bond.with, (life) => withNet(life, (net) => (net.bond?.with === username ? { ...net, bond: null } : net)));
  await sendChat(username, bond.with, "💔 I think we should go our separate ways.");
  return null;
}

export async function blockPlayer(username: string, who: string, on: boolean) {
  if (!HANDLE.test(who) || who === username) return "Pick a real username.";
  const saved = await updateLife(username, (life) =>
    withNet(life, (net) => {
      const rest = (net.blocked ?? []).filter((name) => name !== who);
      return { ...net, blocked: on ? [...rest, who].slice(-100) : rest };
    }),
  );
  return saved ? null : "That did not save.";
}

export async function reportPlayer(username: string, who: string, reason: string, quote: string) {
  if (!HANDLE.test(who) || who === username) return "Pick a real username.";
  if (!(await readPlayer(who))?.life) return "Nobody in Accra goes by that name.";
  const report = { who, reason: reason.trim().slice(0, 40) || "Other", quote: quote.trim().slice(0, 300), at: new Date().toISOString() };
  const saved = await updateLife(username, (life) => withNet(life, (net) => ({ ...net, reports: [...(net.reports ?? []).filter((item) => item.who !== who || item.quote !== report.quote), report].slice(-20) })));
  return saved ? null : "The report did not send.";
}

export async function referralView(username: string) {
  const me = await readPlayer(username);
  if (!me?.life) return null;
  const net = netOf(me.life);
  const friends = await Promise.all(
    (net.referrals ?? []).map(async (item) => {
      const life = (await readPlayer(item.username))?.life;
      return { ...item, ready: (life?.stats?.shifts ?? 0) > 0 };
    }),
  );
  return { referrals: friends, paid: friends.filter((item) => item.paid).length, referredBy: net.referredBy ?? null };
}

export async function claimReferral(username: string, friend: string) {
  const me = await readPlayer(username);
  const net = netOf(me?.life);
  const item = (net.referrals ?? []).find((entry) => entry.username === friend);
  if (!item) return "That friend did not join with your link.";
  if (item.paid) return "Already paid.";
  if ((net.referrals ?? []).filter((entry) => entry.paid).length >= REFER_CAP) return `Invite rewards stop after ${REFER_CAP} friends.`;
  const life = (await readPlayer(friend))?.life;
  if (!life || (life.stats?.shifts ?? 0) < 1) return `@${friend} has to work one shift first.`;
  let fresh = false;
  const saved = await updateLife(username, (current) =>
    withNet(current, (inner) => {
      const list = inner.referrals ?? [];
      fresh = list.some((entry) => entry.username === friend && !entry.paid);
      return { ...inner, referrals: list.map((entry) => (entry.username === friend ? { ...entry, paid: true } : entry)) };
    }),
  );
  if (!saved || !fresh) return "That did not save.";
  await creditPlayer(username, REFER_PRIZE, `@${friend} settled into Accra. Invite reward: ${cedis(REFER_PRIZE)}.`, "refer");
  await creditPlayer(friend, REFER_PRIZE, `Welcome bonus from @${username}'s invite: ${cedis(REFER_PRIZE)}.`, "refer");
  return null;
}

export async function invitePlayer(username: string, to: string) {
  if (!HANDLE.test(to) || to === username) return "Pick a real username.";
  const them = await readPlayer(to);
  if (!them?.life) return "Nobody in Accra goes by that name.";
  if (netOf(them.life).blocked?.includes(username)) return `@${to} is not taking invites from you.`;
  const saved = await updateLife(to, (life) => withNet(life, (net) => ({ ...net, invites: [...(net.invites ?? []).filter((item) => !(item.from === username && (item.kind ?? "home") === "home")), { from: username, at: new Date().toISOString(), kind: "home" as const }].slice(-10) })));
  if (!saved) return "The invite did not send.";
  await sendChat(username, to, "🏠 Come over to my place! Open People on your phone to visit.");
  return null;
}

export async function inviteTable(username: string, to: string, spot: string, seatId: string) {
  if (!HANDLE.test(to) || to === username) return "Pick a real username.";
  if (!spot || !seatId) return "Sit at a table first.";
  const them = await readPlayer(to);
  if (!them?.life) return "Nobody in Accra goes by that name.";
  if (netOf(them.life).blocked?.includes(username)) return `@${to} is not taking invites from you.`;
  const place = spotById(spot).name;
  const saved = await updateLife(to, (life) =>
    withNet(life, (net) => ({
      ...net,
      invites: [
        ...(net.invites ?? []).filter((item) => !(item.from === username && item.kind === "table")),
        { from: username, at: new Date().toISOString(), kind: "table" as const, spot, seatId },
      ].slice(-10),
    })),
  );
  if (!saved) return "The table invite did not send.";
  await sendChat(username, to, `🍽️ Come eat with me at ${place}. I saved you a seat — open the map and meet me there.`);
  return null;
}

export async function hostHome(username: string, host: string): Promise<HostHome | null> {
  const me = await readPlayer(username);
  const invited = (netOf(me?.life).invites ?? []).some((item) => item.from === host && Date.now() - Date.parse(item.at) < 86400000);
  const partner = netOf(me?.life).bond?.with === host;
  const owner = await readPlayer(host);
  if (!owner?.life) return null;
  const crewRef = netOf(me?.life).crew ? { owner: username, id: netOf(me?.life).crew!.id } : netOf(me?.life).crewIn;
  const crewOwner = crewRef ? (crewRef.owner === username ? me : await readPlayer(crewRef.owner)) : null;
  const crewmate = Boolean(crewRef && netOf(crewOwner?.life).crew?.id === crewRef.id && netOf(crewOwner?.life).crew?.members.includes(host));
  if (!invited && !partner && !crewmate) return null;
  return {
    username: owner.username,
    name: owner.name,
    homeId: owner.life.homeId,
    look: owner.life.look,
    inventory: owner.life.inventory ?? [],
    furniture: owner.life.furniture ?? [],
    floor: owner.life.floor,
  };
}
