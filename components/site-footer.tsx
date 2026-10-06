import Link from "next/link";
import { KenteRule } from "@/components/page-header";

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-line bg-forest text-paper">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <p className="font-display text-4xl tracking-tight">
            Accra<span className="text-clay">Life</span>
          </p>
          <KenteRule className="mt-4" />
          <p className="mt-4 max-w-sm text-sm leading-7 text-paper/75">
            The city guide for people who live here, land here, and want to know what Accra is actually doing tonight.
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sand">Discover</p>
          <ul className="mt-4 space-y-2 text-sm text-paper/80">
            <li><Link href="/explore">Categories</Link></li>
            <li><Link href="/events">Events</Link></li>
            <li><Link href="/areas">Areas</Link></li>
            <li><Link href="/vibe">What’s your vibe?</Link></li>
            <li><Link href="/map">Map</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sand">For the city</p>
          <ul className="mt-4 space-y-2 text-sm text-paper/80">
            <li><Link href="/submit/place">Add a place</Link></li>
            <li><Link href="/submit/event">Submit an event</Link></li>
            <li><Link href="/saved">Saved</Link></li>
            <li><Link href="/login">Sign in</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <p className="mx-auto max-w-7xl px-5 py-5 text-xs text-paper/60">Live Accra. AccraLife.app</p>
      </div>
    </footer>
  );
}
