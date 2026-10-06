"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { ASK_LABEL, BOND_LABEL, RING_PRICE, WEDDING_PRICE, friendStage, type SocialView } from "@/lib/game/net";
import { cedis, type Life } from "@/lib/game/world";

export type NetAction = (body: Record<string, unknown>) => Promise<string | null>;

function Header({ title, tone, onBack, right }: { title: string; tone: string; onBack: () => void; right?: ReactNode }) {
  return (
    <div className="flex items-center gap-2 px-2 py-2 text-white" style={{ background: tone }}>
      <button type="button" onClick={onBack} className="grid h-9 w-9 place-items-center rounded-full text-lg" aria-label="Back">
        ‹
      </button>
      <p className="font-semibold">{title}</p>
      <span className="ml-auto pr-2 text-sm font-semibold">{right}</span>
    </div>
  );
}

function handles(text: string) {
  return text
    .split(/[\s,]+/)
    .map((item) => item.replace(/^@/, "").toLowerCase())
    .filter(Boolean);
}

export function SusuApp({ me, life, social, cloud, onBack, onAction }: { me: string; life: Life; social: SocialView | null; cloud: boolean; onBack: () => void; onAction: NetAction }) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("50");
  const [members, setMembers] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const groups = social?.susu ?? [];

  async function run(body: Record<string, unknown>) {
    setBusy(true);
    const error = await onAction(body);
    setBusy(false);
    setNotice(error ?? "");
    return error;
  }

  async function create(event: FormEvent) {
    event.preventDefault();
    const error = await run({ action: "susu-create", name, amount: Number(amount), members: handles(members) });
    if (!error) {
      setName("");
      setMembers("");
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[#f6f1ea] text-[#121212]">
      <Header title="Susu" tone="#006B3F" onBack={onBack} right={cedis(life.cash)} />
      <div className="min-h-0 flex-1 space-y-3 overflow-auto px-4 py-4">
        <p className="text-sm leading-6 text-[#5c6b82]">Everyone pays the same amount each round. When the whole group has paid, one person takes the full pot. Then the next person, until everyone has collected once.</p>
        {!cloud ? <p className="rounded-2xl bg-white px-3 py-3 text-sm shadow-sm">Susu needs an online account. Sign up to save your Sim online, then start a group with friends.</p> : null}
        {notice ? <p className="rounded-2xl bg-[#fff4c2] px-3 py-2 text-sm">{notice}</p> : null}
        {groups.map((group) => {
          const next = group.members[group.round % group.members.length];
          const paid = group.paid.includes(me);
          return (
            <div key={`${group.owner}-${group.id}`} className="rounded-2xl bg-white p-3 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-semibold">🤝 {group.name}</p>
                  <p className="text-xs text-[#5c6b82]">
                    {cedis(group.amount)} a round · round {group.round + 1} · pot {cedis(group.pot)}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-[#fff4c2] px-2 py-0.5 text-[11px] font-bold">Next: @{next}</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {group.members.map((member) => (
                  <span key={member} className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${group.paid.includes(member) ? "bg-[#d9f2e4] text-[#006B3F]" : "bg-[#f4f7fb] text-[#5c6b82]"}`}>
                    {group.paid.includes(member) ? "✓ " : ""}@{member}
                  </span>
                ))}
              </div>
              {group.history[0] ? <p className="mt-2 text-xs text-[#5c6b82]">Last payout: @{group.history[0].to} got {cedis(group.history[0].amount)}</p> : null}
              <div className="mt-2 grid grid-cols-2 gap-2">
                <button type="button" disabled={busy || paid} onClick={() => void run({ action: "susu-pay", owner: group.owner, id: group.id })} className="rounded-full bg-[#006B3F] py-2 text-xs font-bold text-white disabled:opacity-40">
                  {paid ? "Paid this round" : `Pay ${cedis(group.amount)}`}
                </button>
                <button type="button" disabled={busy || group.pot > 0} onClick={() => void run({ action: "susu-leave", owner: group.owner, id: group.id })} className="rounded-full bg-[#f4f7fb] py-2 text-xs font-bold text-[#CE1126] disabled:opacity-40">
                  {group.mine ? "Close group" : "Leave"}
                </button>
              </div>
            </div>
          );
        })}
        {cloud ? (
          <form onSubmit={create} className="space-y-2 rounded-2xl bg-white p-3 shadow-sm">
            <p className="font-semibold">Start a susu</p>
            <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Group name, e.g. Osu girls" className="h-10 w-full rounded-full bg-[#f4f7fb] px-4 text-sm outline-none" />
            <div className="flex items-center gap-2">
              <span className="text-sm text-[#5c6b82]">Each round ₵</span>
              <input value={amount} onChange={(event) => setAmount(event.target.value.replace(/[^\d]/g, ""))} inputMode="numeric" className="h-10 w-24 rounded-full bg-[#f4f7fb] px-4 text-sm outline-none" />
            </div>
            <input value={members} onChange={(event) => setMembers(event.target.value)} placeholder="@ama @kojo @esi" className="h-10 w-full rounded-full bg-[#f4f7fb] px-4 text-sm outline-none" />
            <button type="submit" disabled={busy} className="w-full rounded-full bg-[#121212] py-2.5 text-sm font-bold text-white disabled:opacity-40">
              Start the susu
            </button>
          </form>
        ) : null}
      </div>
    </div>
  );
}

export function PeopleApp({
  me,
  life,
  social,
  cloud,
  friends,
  onBack,
  onAction,
  onVisit,
  onChat,
}: {
  me: string;
  life: Life;
  social: SocialView | null;
  cloud: boolean;
  friends: { username: string; name: string }[];
  onBack: () => void;
  onAction: NetAction;
  onVisit: (host: string) => void;
  onChat: (username: string) => void;
}) {
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [handle, setHandle] = useState("");
  const bond = social?.bond ?? null;
  const asks = social?.asks ?? [];
  const invites = social?.invites ?? [];

  async function run(body: Record<string, unknown>) {
    setBusy(true);
    const error = await onAction(body);
    setBusy(false);
    setNotice(error ?? "");
  }

  function scoreOf(person: { username: string; name: string }) {
    return life.relations.find((item) => item.name === person.name || item.name === `@${person.username}` || item.name === person.username)?.score ?? 0;
  }

  const list = friends.filter((person) => person.username !== me);

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[#fdf4f7] text-[#121212]">
      <Header title="People" tone="#c45c9a" onBack={onBack} />
      <div className="min-h-0 flex-1 space-y-3 overflow-auto px-4 py-4">
        {!cloud ? <p className="rounded-2xl bg-white px-3 py-3 text-sm shadow-sm">Friends, dating and house visits need an online account.</p> : null}
        {notice ? <p className="rounded-2xl bg-[#fff4c2] px-3 py-2 text-sm">{notice}</p> : null}
        {asks.map((ask) => (
          <div key={`${ask.from}-${ask.kind}`} className="rounded-2xl bg-white p-3 shadow-sm">
            <p className="font-semibold">
              {ask.kind === "dating" ? "💌" : ask.kind === "engaged" ? "💍" : "💒"} @{ask.from} {ASK_LABEL[ask.kind]}
            </p>
            {ask.kind === "married" ? <p className="text-xs text-[#5c6b82]">Saying yes costs your half of the wedding: {cedis(WEDDING_PRICE / 2)}.</p> : null}
            <div className="mt-2 grid grid-cols-2 gap-2">
              <button type="button" disabled={busy} onClick={() => void run({ action: "bond-answer", from: ask.from, yes: true })} className="rounded-full bg-[#c45c9a] py-2 text-xs font-bold text-white disabled:opacity-40">
                Yes
              </button>
              <button type="button" disabled={busy} onClick={() => void run({ action: "bond-answer", from: ask.from, yes: false })} className="rounded-full bg-[#f4f7fb] py-2 text-xs font-bold disabled:opacity-40">
                Not now
              </button>
            </div>
          </div>
        ))}
        {invites.map((invite) => (
          <div key={invite.from} className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm">
            <span className="text-2xl">🏠</span>
            <span className="min-w-0 flex-1 text-sm font-semibold">@{invite.from} invited you over</span>
            <button type="button" onClick={() => onVisit(invite.from)} className="shrink-0 rounded-full bg-[#006B3F] px-3 py-2 text-xs font-bold text-white">
              Visit
            </button>
          </div>
        ))}
        {bond ? (
          <div className="rounded-2xl bg-gradient-to-r from-[#ffe1ec] to-[#fff4c2] p-3 shadow-sm">
            <p className="text-xs font-bold tracking-wide text-[#c45c9a]">{BOND_LABEL[bond.stage].toUpperCase()}</p>
            <p className="font-display text-xl">@{bond.with}</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {bond.stage === "dating" ? (
                <button type="button" disabled={busy || life.cash < RING_PRICE} onClick={() => void run({ action: "bond-ask", to: bond.with, kind: "engaged" })} className="rounded-full bg-[#c45c9a] py-2 text-xs font-bold text-white disabled:opacity-40">
                  💍 Propose · {cedis(RING_PRICE)}
                </button>
              ) : bond.stage === "engaged" ? (
                <button type="button" disabled={busy || life.cash < WEDDING_PRICE / 2} onClick={() => void run({ action: "bond-ask", to: bond.with, kind: "married" })} className="rounded-full bg-[#c45c9a] py-2 text-xs font-bold text-white disabled:opacity-40">
                  💒 Wedding · {cedis(WEDDING_PRICE / 2)}
                </button>
              ) : (
                <button type="button" onClick={() => onVisit(bond.with)} className="rounded-full bg-[#006B3F] py-2 text-xs font-bold text-white">
                  🏠 Go to their place
                </button>
              )}
              <button type="button" onClick={() => onChat(bond.with)} className="rounded-full bg-white py-2 text-xs font-bold">
                💬 Message
              </button>
            </div>
            <button type="button" disabled={busy} onClick={() => void run({ action: "bond-end" })} className="mt-2 w-full text-xs font-semibold text-[#CE1126] disabled:opacity-40">
              {bond.stage === "married" ? "Divorce" : "Break up"}
            </button>
          </div>
        ) : null}
        <p className="pt-1 text-[11px] font-bold tracking-wide text-[#8b97ab]">YOUR PEOPLE</p>
        {list.length ? null : <p className="text-sm text-[#5c6b82]">Message someone or talk to them at a venue and they show up here.</p>}
        {list.map((person) => {
          const score = scoreOf(person);
          const partner = bond?.with === person.username;
          return (
            <div key={person.username} className="rounded-2xl bg-white p-3 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#f3d7e4] text-sm font-bold">{person.name.slice(0, 1).toUpperCase()}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">@{person.username}</span>
                  <span className="block text-xs text-[#5c6b82]">{partner ? BOND_LABEL[bond.stage] : friendStage(score)}</span>
                </span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#f4f7fb]">
                <div className="h-full rounded-full bg-[#c45c9a]" style={{ width: `${Math.min(100, score)}%` }} />
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2">
                <button type="button" onClick={() => onChat(person.username)} className="rounded-full bg-[#f4f7fb] py-2 text-[11px] font-bold">
                  💬 Chat
                </button>
                <button type="button" disabled={busy || !cloud} onClick={() => void run({ action: "invite", to: person.username })} className="rounded-full bg-[#f4f7fb] py-2 text-[11px] font-bold disabled:opacity-40">
                  🏠 Invite
                </button>
                <button
                  type="button"
                  disabled={busy || !cloud || Boolean(bond) || score < 25}
                  onClick={() => void run({ action: "bond-ask", to: person.username, kind: "dating" })}
                  className="rounded-full bg-[#ffe1ec] py-2 text-[11px] font-bold text-[#c45c9a] disabled:opacity-40"
                >
                  💌 Ask out
                </button>
              </div>
              {!bond && score < 25 ? <p className="mt-1 text-[11px] text-[#8b97ab]">Hang out more before asking them out.</p> : null}
            </div>
          );
        })}
        {cloud ? (
          <form
            className="flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              const to = handles(handle)[0];
              if (!to) return;
              void run({ action: "invite", to }).then(() => setHandle(""));
            }}
          >
            <input value={handle} onChange={(event) => setHandle(event.target.value)} placeholder="Invite @username over" className="h-10 flex-1 rounded-full bg-white px-4 text-sm outline-none" />
            <button type="submit" disabled={busy} className="rounded-full bg-[#121212] px-4 text-sm font-semibold text-white disabled:opacity-40">
              Invite
            </button>
          </form>
        ) : null}
      </div>
    </div>
  );
}
