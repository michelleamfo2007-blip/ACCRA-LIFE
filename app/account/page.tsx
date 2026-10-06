import Link from "next/link";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/logout-button";
import { formatEventDate, formatShortDate } from "@/lib/format";
import { allEvents, getViewer } from "@/lib/server/content";
import { readStore } from "@/lib/server/store";

export const dynamic = "force-dynamic";
export const metadata = { title: "Account" };

export default async function AccountPage() {
  const viewer = await getViewer();
  if (!viewer.user) redirect("/login?next=/account");
  const reservations = readStore().reservations.filter((item) => item.userId === viewer.user?.id || item.email === viewer.user?.email);
  const events = allEvents();

  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-clay">Account</p>
      <h1 className="mt-2 font-display text-5xl">{viewer.user.name}</h1>
      <p className="mt-2 text-ink-soft">{viewer.user.email}</p>
      <div className="mt-6 flex gap-3">
        <Link href="/saved" className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-paper">Saved</Link>
        {viewer.user.role === "admin" ? (
          <Link href="/admin" className="rounded-full border border-line px-4 py-2 text-sm font-semibold">Admin</Link>
        ) : null}
        <LogoutButton />
      </div>
      <section className="mt-10">
        <h2 className="font-display text-3xl">Reservations</h2>
        {reservations.length === 0 ? <p className="mt-3 text-sm text-muted">No tickets reserved yet.</p> : null}
        <ul className="mt-4 space-y-3">
          {reservations.map((reservation) => {
            const event = events.find((item) => item.slug === reservation.eventSlug);
            return (
              <li key={reservation.id} className="rounded-3xl border border-line bg-card p-4">
                <p className="font-medium">{event?.name ?? reservation.eventSlug}</p>
                <p className="text-sm text-muted">
                  {event ? formatEventDate(event.date) : ""} · {reservation.quantity} {reservation.quantity === 1 ? "ticket" : "tickets"} · {reservation.code}
                </p>
                <p className="text-xs text-muted">{formatShortDate(reservation.createdAt)}</p>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
