"use client";

import { useEffect, useState, type ReactNode } from "react";
import { MediaDesk } from "@/components/media-desk";
import { cx, formatShortDate } from "@/lib/format";

type Snapshot = {
  stats: {
    users: number;
    places: number;
    events: number;
    reviews: number;
    pendingSubmissions: number;
    openReports: number;
  };
  mostViewed: { name: string; slug: string; views: number }[];
  mostSaved: { name: string; slug: string; saves: number }[];
  topSearches: { query: string; count: number }[];
  topCategories: { name: string; views: number }[];
  popularAreas: { name: string; count: number }[];
  eventEngagement: { name: string; views: number; reservations: number }[];
  users: { id: string; name: string; email: string; role: "user" | "admin"; createdAt: string }[];
  reviews: { id: string; placeName: string; userName: string; rating: number; body: string; status: string; createdAt: string }[];
  submissions: { id: string; type: string; status: string; createdAt: string; title: string; detail: string }[];
  reports: { id: string; reason: string; status: string; createdAt: string; review: string }[];
  places: { slug: string; name: string; area: string; featured: boolean }[];
};

type GameSnap = {
  reports: { who: string; reason: string; quote: string; at: string; by: string }[];
  players: {
    username: string;
    name: string;
    email: string;
    createdAt: string;
    hasLife: boolean;
    home: string | null;
    homeArea: string | null;
    where: string | null;
    cash: number | null;
    dream: string | null;
    seen: string | null;
    online: boolean;
  }[];
  stats: { players: number; online: number; withLife: number; houses: number };
};

const tabs = ["Overview", "Players", "Photos", "Places", "Events", "Reviews", "Submissions", "Users", "Reports", "Game chat"] as const;

export function AdminDashboard() {
  const [data, setData] = useState<Snapshot | null>(null);
  const [game, setGame] = useState<GameSnap | null>(null);
  const [tab, setTab] = useState<(typeof tabs)[number]>("Overview");
  const [error, setError] = useState("");

  async function load() {
    const response = await fetch("/api/admin");
    if (!response.ok) {
      setError("This dashboard is for AccraLife editors.");
      return;
    }
    setData((await response.json()) as Snapshot);
  }

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin")
      .then(async (response) => {
        if (cancelled) return;
        if (!response.ok) {
          setError("This dashboard is for AccraLife editors.");
          return;
        }
        setData((await response.json()) as Snapshot);
      })
      .catch(() => {
        if (!cancelled) setError("The desk could not be opened.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function act(body: object) {
    await fetch("/api/admin", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    await load();
  }

  async function loadGame() {
    const response = await fetch("/api/admin/game");
    if (!response.ok) return;
    setGame((await response.json()) as GameSnap);
  }

  async function gameAct(body: object) {
    await fetch("/api/admin/game", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    await loadGame();
  }

  useEffect(() => {
    if (tab === "Game chat" || tab === "Players" || tab === "Overview") void loadGame();
  }, [tab]);

  if (error) return <p className="px-5 py-16 text-ink-soft">{error}</p>;
  if (!data) return <p className="px-5 py-16 text-muted">Opening the desk…</p>;

  return (
    <div className="mx-auto grid max-w-7xl gap-6 px-5 py-8 lg:grid-cols-[200px_1fr]">
      <aside className="flex gap-2 overflow-x-auto no-scrollbar lg:flex-col">
        {tabs.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setTab(item)}
            className={cx("shrink-0 rounded-full px-4 py-2 text-left text-sm font-semibold lg:rounded-2xl", tab === item ? "bg-ink text-paper" : "bg-card text-ink-soft")}
          >
            {item}
          </button>
        ))}
      </aside>
      <section>
        {tab === "Overview" ? (
          <div className="space-y-6">
            <div className="grid gap-3 sm:grid-cols-3">
              <Stat label="Site users" value={data.stats.users} onOpen={() => setTab("Users")} />
              <Stat label="Game players" value={game?.stats.players ?? 0} onOpen={() => setTab("Players")} />
              <Stat label="Online now" value={game?.stats.online ?? 0} hint="Seen in the last 15 min" onOpen={() => setTab("Players")} />
              <Stat label="Houses started" value={game?.stats.withLife ?? 0} onOpen={() => setTab("Players")} />
              <Stat label="Places" value={data.stats.places} onOpen={() => setTab("Places")} />
              <Stat label="Events" value={data.stats.events} onOpen={() => setTab("Events")} />
              <Stat label="Reviews" value={data.stats.reviews} onOpen={() => setTab("Reviews")} />
              <Stat label="In queue" value={data.stats.pendingSubmissions} onOpen={() => setTab("Submissions")} />
              <Stat label="Open reports" value={data.stats.openReports} onOpen={() => setTab("Reports")} />
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <Panel title="Most viewed places">
                {data.mostViewed.length === 0 ? <Empty hint="No place views yet." /> : null}
                {data.mostViewed.map((item) => (
                  <Row key={item.slug} label={item.name} value={String(item.views)} />
                ))}
              </Panel>
              <Panel title="Most saved">
                {data.mostSaved.length === 0 ? <Empty hint="No saves yet." /> : null}
                {data.mostSaved.map((item) => (
                  <Row key={item.slug} label={item.name} value={String(item.saves)} />
                ))}
              </Panel>
              <Panel title="Searches">
                {data.topSearches.length === 0 ? <Empty hint="No searches yet." /> : null}
                {data.topSearches.map((item) => (
                  <Row key={item.query} label={item.query} value={String(item.count)} />
                ))}
              </Panel>
              <Panel title="Category interest">
                {data.topCategories.length === 0 ? <Empty hint="No category views yet." /> : null}
                {data.topCategories.map((item) => (
                  <Row key={item.name} label={item.name} value={String(item.views)} />
                ))}
              </Panel>
              <Panel title="Popular areas">
                {data.popularAreas.map((item) => (
                  <Row key={item.name} label={item.name} value={`${item.count} places`} />
                ))}
              </Panel>
              <Panel title="Event engagement">
                {data.eventEngagement.length === 0 ? <Empty hint="No event views or tickets yet." /> : null}
                {data.eventEngagement.map((item) => (
                  <Row key={item.name} label={item.name} value={`${item.views} views · ${item.reservations} tickets`} />
                ))}
              </Panel>
            </div>
          </div>
        ) : null}

        {tab === "Players" ? (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-4">
              <Stat label="Accounts" value={game?.stats.players ?? 0} />
              <Stat label="Online" value={game?.stats.online ?? 0} hint="Seen in the last 15 min" />
              <Stat label="With a life" value={game?.stats.withLife ?? 0} />
              <Stat label="Houses" value={game?.stats.houses ?? 0} />
            </div>
            {!game ? <p className="text-sm text-muted">Loading players…</p> : null}
            {game && game.players.length === 0 ? <p className="text-sm text-muted">No game accounts yet.</p> : null}
            <div className="space-y-3">
              {game?.players.map((player) => (
                <article key={player.username} className="rounded-3xl border border-line bg-card p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-display text-2xl">
                        {player.name}{" "}
                        <span className="text-base font-semibold text-muted">@{player.username}</span>
                      </p>
                      <p className="mt-1 text-xs text-muted">
                        {player.email || "No email"} · joined {formatShortDate(player.createdAt)}
                        {player.seen ? ` · last seen ${formatShortDate(player.seen)}` : ""}
                      </p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${player.online ? "bg-[#006B3F] text-white" : "bg-[#f4f7fb] text-muted"}`}>
                      {player.online ? "Online" : player.hasLife ? "Offline" : "No life yet"}
                    </span>
                  </div>
                  {player.hasLife ? (
                    <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
                      <p>
                        <span className="text-muted">House · </span>
                        {player.home ?? "—"}
                        {player.homeArea ? ` (${player.homeArea})` : ""}
                      </p>
                      <p>
                        <span className="text-muted">Now · </span>
                        {player.where ?? "—"}
                      </p>
                      <p>
                        <span className="text-muted">Cash · </span>
                        {player.cash != null ? `₵${player.cash.toLocaleString("en-GH")}` : "—"}
                      </p>
                      <p>
                        <span className="text-muted">Dream · </span>
                        {player.dream ?? "—"}
                      </p>
                    </div>
                  ) : (
                    <p className="mt-3 text-sm text-muted">Account created, life not started.</p>
                  )}
                </article>
              ))}
            </div>
          </div>
        ) : null}

        {tab === "Photos" ? <MediaDesk /> : null}

        {tab === "Places" ? (
          <div className="space-y-3">
            {data.places.map((place) => (
              <div key={place.slug} className="flex items-center justify-between gap-3 rounded-3xl border border-line bg-card px-4 py-3">
                <div>
                  <p className="font-medium">{place.name}</p>
                  <p className="text-xs text-muted">{place.area}</p>
                </div>
                <button type="button" onClick={() => act({ action: "feature", slug: place.slug, featured: !place.featured })} className="rounded-full border border-line px-3 py-2 text-xs font-semibold">
                  {place.featured ? "Unfeature" : "Feature"}
                </button>
              </div>
            ))}
          </div>
        ) : null}

        {tab === "Events" ? (
          <Panel title="Event engagement">
            {data.eventEngagement.map((item) => (
              <Row key={item.name} label={item.name} value={`${item.views} views · ${item.reservations} reserved`} />
            ))}
          </Panel>
        ) : null}

        {tab === "Reviews" ? (
          <div className="space-y-3">
            {data.reviews.map((review) => (
              <article key={review.id} className="rounded-3xl border border-line bg-card p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium">{review.placeName}</p>
                  <span className="text-xs uppercase tracking-[0.14em] text-muted">{review.status}</span>
                </div>
                <p className="mt-1 text-xs text-muted">{review.userName} · {formatShortDate(review.createdAt)} · {review.rating} stars</p>
                <p className="mt-2 text-sm leading-6">{review.body}</p>
                <div className="mt-3 flex gap-2">
                  <button type="button" className="rounded-full bg-ink px-3 py-1.5 text-xs font-semibold text-paper" onClick={() => act({ action: "review", id: review.id, status: "published" })}>Publish</button>
                  <button type="button" className="rounded-full border border-line px-3 py-1.5 text-xs font-semibold" onClick={() => act({ action: "review", id: review.id, status: "hidden" })}>Hide</button>
                </div>
              </article>
            ))}
          </div>
        ) : null}

        {tab === "Submissions" ? (
          <div className="space-y-3">
            {data.submissions.map((submission) => (
              <article key={submission.id} className="rounded-3xl border border-line bg-card p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase tracking-[0.14em] text-clay">{submission.type} · {submission.status}</p>
                  <p className="text-xs text-muted">{formatShortDate(submission.createdAt)}</p>
                </div>
                <h3 className="mt-2 font-display text-2xl">{submission.title}</h3>
                <p className="mt-2 text-sm leading-6 text-ink-soft">{submission.detail}</p>
                {submission.status === "pending" ? (
                  <div className="mt-3 flex gap-2">
                    <button type="button" className="rounded-full bg-clay px-3 py-1.5 text-xs font-semibold text-white" onClick={() => act({ action: "submission", id: submission.id, status: "approved" })}>Approve</button>
                    <button type="button" className="rounded-full border border-line px-3 py-1.5 text-xs font-semibold" onClick={() => act({ action: "submission", id: submission.id, status: "rejected" })}>Reject</button>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        ) : null}

        {tab === "Users" ? (
          <div className="space-y-3">
            {data.users.map((user) => (
              <div key={user.id} className="flex items-center justify-between gap-3 rounded-3xl border border-line bg-card px-4 py-3">
                <div>
                  <p className="font-medium">{user.name}</p>
                  <p className="text-xs text-muted">{user.email} · joined {formatShortDate(user.createdAt)}</p>
                </div>
                <button
                  type="button"
                  className="rounded-full border border-line px-3 py-2 text-xs font-semibold"
                  onClick={() => act({ action: "role", id: user.id, role: user.role === "admin" ? "user" : "admin" })}
                >
                  {user.role}
                </button>
              </div>
            ))}
          </div>
        ) : null}

        {tab === "Reports" ? (
          <div className="space-y-3">
            {data.reports.length === 0 ? <p className="text-sm text-muted">No reports.</p> : null}
            {data.reports.map((report) => (
              <article key={report.id} className="rounded-3xl border border-line bg-card p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-muted">{report.status} · {formatShortDate(report.createdAt)}</p>
                <p className="mt-2 text-sm">{report.reason}</p>
                <p className="mt-2 text-sm text-muted">Review: {report.review}</p>
                {report.status === "open" ? (
                  <button type="button" className="mt-3 rounded-full bg-ink px-3 py-1.5 text-xs font-semibold text-paper" onClick={() => act({ action: "report", id: report.id })}>Resolve</button>
                ) : null}
              </article>
            ))}
          </div>
        ) : null}

        {tab === "Game chat" ? (
          <div className="space-y-3">
            {!game ? <p className="text-sm text-muted">Loading reports…</p> : null}
            {game && game.reports.length === 0 ? <p className="text-sm text-muted">No player chat reports.</p> : null}
            {game?.reports.map((report) => (
              <article key={`${report.by}-${report.who}-${report.at}`} className="rounded-3xl border border-line bg-card p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-muted">
                  @{report.by} → @{report.who} · {formatShortDate(report.at)}
                </p>
                <p className="mt-2 text-sm font-semibold">{report.reason}</p>
                {report.quote ? <p className="mt-2 text-sm text-muted">&ldquo;{report.quote}&rdquo;</p> : null}
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" className="rounded-full bg-ink px-3 py-1.5 text-xs font-semibold text-paper" onClick={() => gameAct({ action: "mute", who: report.who, hours: 24 })}>
                    Mute 24h
                  </button>
                  <button type="button" className="rounded-full border border-line px-3 py-1.5 text-xs font-semibold" onClick={() => gameAct({ action: "mute", who: report.who, hours: 72 })}>
                    Mute 3d
                  </button>
                  <button type="button" className="rounded-full border border-line px-3 py-1.5 text-xs font-semibold" onClick={() => gameAct({ action: "unmute", who: report.who })}>
                    Unmute
                  </button>
                  <button type="button" className="rounded-full border border-line px-3 py-1.5 text-xs font-semibold" onClick={() => gameAct({ action: "clear", by: report.by, who: report.who, at: report.at })}>
                    Clear
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}

function Stat({ label, value, onOpen, hint }: { label: string; value: number; onOpen?: () => void; hint?: string }) {
  const body = (
    <>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">{label}</p>
      <p className="mt-2 font-display text-4xl">{value}</p>
      {hint ? <p className="mt-1 text-[11px] text-muted">{hint}</p> : null}
      {onOpen ? <p className="mt-2 text-[11px] font-semibold text-clay">Tap to open →</p> : null}
    </>
  );
  if (onOpen) {
    return (
      <button type="button" onClick={onOpen} className="rounded-[28px] border border-line bg-card p-5 text-left transition hover:border-clay/40 hover:shadow-sm active:scale-[0.99]">
        {body}
      </button>
    );
  }
  return <div className="rounded-[28px] border border-line bg-card p-5">{body}</div>;
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-[28px] border border-line bg-card p-5">
      <h3 className="font-display text-2xl">{title}</h3>
      <div className="mt-3 space-y-2">{children}</div>
    </div>
  );
}

function Empty({ hint }: { hint: string }) {
  return <p className="text-sm text-muted">{hint}</p>;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span>{label}</span>
      <span className="text-muted">{value}</span>
    </div>
  );
}
