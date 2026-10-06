import Link from "next/link";
import { HeaderMenu } from "@/components/header-menu";
import { getViewer } from "@/lib/server/content";
import { crowdCounts } from "@/lib/server/live";

export const navLinks = [
  { href: "/explore", label: "Explore" },
  { href: "/events", label: "Events" },
  { href: "/areas", label: "Areas" },
  { href: "/map", label: "Map" },
  { href: "/vibe", label: "Vibe" },
];

export async function SiteHeader() {
  const [{ user }, crowd] = await Promise.all([getViewer(), crowdCounts()]);
  const online = crowd.signedUp || crowd.players;
  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-paper/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-5">
        <Link href="/" className="font-display text-[1.7rem] leading-none tracking-tight text-ink">
          Accra<span className="text-clay">Life</span>
        </Link>
        <nav className="hidden items-center gap-5 text-sm font-medium text-ink-soft lg:flex">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="transition hover:text-ink">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-3">
          {online > 0 ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#006B3F] sm:text-sm" title="People signed up on AccraLife">
              <span className="h-2 w-2 rounded-full bg-[#006B3F]" aria-hidden />
              {online.toLocaleString("en-GH")} online
            </span>
          ) : null}
          <HeaderMenu user={user} links={navLinks} />
        </div>
      </div>
    </header>
  );
}
