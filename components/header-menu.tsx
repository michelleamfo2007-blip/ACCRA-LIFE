"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import type { PublicUser } from "@/lib/types";

export function HeaderMenu({
  user,
  links,
}: {
  user: PublicUser | null;
  links: { href: string; label: string }[];
}) {
  const [openPath, setOpenPath] = useState<string | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const open = openPath === pathname;

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      <Link href="/search" className="hidden rounded-full border border-line px-3 py-2 text-sm font-medium sm:inline-flex" aria-label="Search">
        Search
      </Link>
      <Link href="/saved" className="hidden rounded-full border border-line px-3 py-2 text-sm font-medium sm:inline-flex">
        Saved
      </Link>
      {user ? (
        <Link href="/account" className="hidden rounded-full bg-ink px-3 py-2 text-sm font-semibold text-paper sm:inline-flex">
          {user.name.split(" ")[0]}
        </Link>
      ) : (
        <Link href="/login" className="hidden rounded-full bg-clay px-3 py-2 text-sm font-semibold text-white sm:inline-flex">
          Sign in
        </Link>
      )}
      <button
        type="button"
        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-line lg:hidden"
        aria-expanded={open}
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpenPath(open ? null : pathname)}
      >
        <span className="sr-only">Menu</span>
        <span className="flex w-4 flex-col gap-1">
          <span className="h-px bg-ink" />
          <span className="h-px bg-ink" />
          <span className="h-px bg-ink" />
        </span>
      </button>
      {open ? (
        <div className="fixed inset-0 top-16 z-30 bg-paper px-5 py-6 lg:hidden">
          <nav className="flex flex-col gap-2 text-2xl font-display">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className="border-b border-line py-3">
                {link.label}
              </Link>
            ))}
            <Link href="/saved" className="border-b border-line py-3">
              Saved
            </Link>
            <Link href="/submit/place" className="border-b border-line py-3">
              Add a place
            </Link>
            {user?.role === "admin" ? (
              <Link href="/admin" className="border-b border-line py-3">
                Admin
              </Link>
            ) : null}
          </nav>
          <div className="mt-6">
            {user ? (
              <button type="button" onClick={logout} className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-paper">
                Sign out
              </button>
            ) : (
              <Link href="/login" className="inline-flex rounded-full bg-clay px-5 py-3 text-sm font-semibold text-white">
                Sign in
              </Link>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
