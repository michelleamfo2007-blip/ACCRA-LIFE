"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { groupThread, type SocialView } from "@/lib/game/net";

export type InboxThread = {
  id: string;
  username: string;
  name: string;
  last: string;
  time: string;
  mine?: boolean;
  incoming: { at: string; text: string }[];
};

export type InboxPing = { id: string; username: string; name: string; text: string; at: string };

type ChatThread = Omit<InboxThread, "id">;

function readKey(username: string) {
  return `accralife-read:${username}`;
}

function loadSeen(username: string): Record<string, string> {
  try {
    const raw = JSON.parse(localStorage.getItem(readKey(username)) ?? "{}") as unknown;
    return raw && typeof raw === "object" ? (raw as Record<string, string>) : {};
  } catch {
    return {};
  }
}

function seenFor(seen: Record<string, string>, id: string) {
  return seen[id] ?? (id.startsWith("user:") ? seen[id.slice(5)] : undefined) ?? "";
}

export function useInbox(username: string, enabled: boolean, onPing: (ping: InboxPing) => void) {
  const [loaded, setThreads] = useState<InboxThread[]>([]);
  const [social, setSocial] = useState<SocialView | null>(null);
  const [seenBook, setSeenBook] = useState(() => ({ username, map: loadSeen(username) }));
  const seen = seenBook.username === username ? seenBook.map : loadSeen(username);
  const threads = enabled ? loaded : [];
  const announced = useRef<Set<string> | null>(null);
  const pingRef = useRef(onPing);
  const seenRef = useRef(seen);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    pingRef.current = onPing;
    seenRef.current = seen;
  });

  useEffect(() => {
    announced.current = null;
    if (!enabled) return;
    let stop = false;
    const load = async () => {
      const [chat, net] = await Promise.all([
        fetch("/api/live/chat")
          .then((response) => (response.ok ? response.json() : null))
          .catch(() => null) as Promise<{ threads?: ChatThread[] } | null>,
        fetch("/api/live/social")
          .then((response) => (response.ok ? response.json() : null))
          .catch(() => null) as Promise<SocialView | null>,
      ]);
      if (stop) return;
      const direct: InboxThread[] = Array.isArray(chat?.threads) ? chat.threads.map((thread) => ({ ...thread, id: `user:${thread.username}`, incoming: Array.isArray(thread.incoming) ? thread.incoming : [] })) : [];
      const groups: InboxThread[] =
        net && Array.isArray(net.groups) ? net.groups.map((group) => ({ id: groupThread(group.owner, group.id), username: group.owner, name: group.name, last: group.last, time: group.time, incoming: group.incoming ?? [] })) : [];
      if (net && Array.isArray(net.susu)) setSocial(net);
      const list = [...direct, ...groups];
      setThreads(list);
      const keys = list.flatMap((thread) => thread.incoming.map((mail) => `${thread.id}|${mail.at}`));
      if (!announced.current) {
        announced.current = new Set(keys);
        return;
      }
      for (const thread of list) {
        const since = seenFor(seenRef.current, thread.id);
        for (const mail of thread.incoming) {
          const key = `${thread.id}|${mail.at}`;
          if (announced.current.has(key)) continue;
          announced.current.add(key);
          if (mail.at > since) pingRef.current({ id: thread.id, username: thread.username, name: thread.id.startsWith("group:") ? thread.name : `@${thread.username}`, text: mail.text, at: mail.at });
        }
      }
    };
    void load();
    const id = window.setInterval(() => void load(), 5000);
    return () => {
      stop = true;
      window.clearInterval(id);
    };
  }, [enabled, username, tick]);

  const markRead = useCallback(
    (id: string) => {
      const thread = loaded.find((item) => item.id === id);
      const latest = thread?.incoming[thread.incoming.length - 1]?.at ?? new Date().toISOString();
      setSeenBook((book) => {
        const current = book.username === username ? book.map : loadSeen(username);
        if (seenFor(current, id) >= latest) return book;
        const next = { ...current, [id]: latest };
        try {
          localStorage.setItem(readKey(username), JSON.stringify(next));
        } catch {}
        return { username, map: next };
      });
    },
    [loaded, username],
  );

  const refresh = useCallback(() => setTick((value) => value + 1), []);

  const unread: Record<string, number> = {};
  for (const thread of threads) {
    const since = seenFor(seen, thread.id);
    const count = thread.incoming.filter((mail) => mail.at > since).length;
    if (count) unread[thread.id] = count;
  }
  const asks = enabled ? (social?.asks.length ?? 0) + (social?.invites.length ?? 0) : 0;
  const total = Object.values(unread).reduce((sum, count) => sum + count, 0);

  return { threads, unread, total, asks, markRead, social: enabled ? social : null, refresh };
}
