"use client";

import { useEffect, useState } from "react";
import { getRaw, parseRaw } from "@/lib/game/save";

export type NameHit = { username: string; name: string };

export function NameSuggest({
  query,
  known = [],
  onPick,
  className = "",
}: {
  query: string;
  known?: NameHit[];
  onPick: (person: NameHit) => void;
  className?: string;
}) {
  const hints = useNameHints(query, known);
  if (!query.trim() || !hints.length) return null;
  return (
    <div className={`z-30 mt-1 overflow-hidden rounded-2xl bg-white text-left shadow-lg ${className}`}>
      {hints.map((person) => (
        <button key={person.username} type="button" onClick={() => onPick(person)} className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-[#fff8e6]">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#d7c4a3] text-xs font-bold">{person.name.slice(0, 1).toUpperCase()}</span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold">@{person.username}</span>
            <span className="block truncate text-[11px] text-[#5c6b82]">{person.name}</span>
          </span>
        </button>
      ))}
    </div>
  );
}

function useNameHints(query: string, known: NameHit[]) {
  const typed = query.trim().replace(/^@/, "").toLowerCase();
  const [remote, setRemote] = useState<NameHit[]>([]);
  useEffect(() => {
    if (typed.length < 1) return;
    const id = window.setTimeout(() => {
      fetch(`/api/live/people?q=${encodeURIComponent(typed)}`)
        .then((response) => response.json())
        .then((payload: { people?: NameHit[] }) => setRemote(Array.isArray(payload?.people) ? payload.people.map(publicName) : []))
        .catch(() => setRemote([]));
    }, 160);
    return () => window.clearTimeout(id);
  }, [typed]);
  if (typed.length < 1) return [];
  return rankNames(typed, [...localNames(), ...known, ...remote]).slice(0, 6);
}

function publicName(person: NameHit): NameHit {
  return { username: person.username, name: person.name };
}

function localNames(): NameHit[] {
  return parseRaw(getRaw()).accounts.map((account) => ({ username: account.username, name: account.name }));
}

function rankNames(query: string, people: NameHit[]) {
  const seen = new Set<string>();
  const ranked: { person: NameHit; score: number }[] = [];
  for (const person of people) {
    const username = person.username?.toLowerCase();
    if (!username || seen.has(username)) continue;
    const score = matchScore(query, username, person.name.toLowerCase());
    if (score == null) continue;
    seen.add(username);
    ranked.push({ person: { username, name: person.name }, score });
  }
  ranked.sort((a, b) => a.score - b.score || a.person.username.localeCompare(b.person.username));
  return ranked.map((item) => item.person);
}

function matchScore(query: string, username: string, name: string) {
  if (username === query || name === query) return 0;
  if (username.startsWith(query) || name.startsWith(query)) return 1;
  if (username.includes(query) || name.includes(query)) return 2;
  if (query.length >= 2 && (username.startsWith(query.slice(0, 2)) || name.startsWith(query.slice(0, 2)))) return 3;
  if (query.length >= 3 && (editNear(username, query) || editNear(name, query))) return 4;
  return null;
}

function editNear(text: string, query: string) {
  const slice = text.slice(0, query.length + 1);
  if (Math.abs(slice.length - query.length) > 2) return false;
  let changes = 0;
  const length = Math.max(slice.length, query.length);
  for (let i = 0; i < length; i += 1) if (slice[i] !== query[i]) changes += 1;
  return changes <= 2;
}
