"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type InboxThread = {
  username: string;
  name: string;
  last: string;
  time: string;
  mine?: boolean;
  incoming: { at: string; text: string }[];
};

export type InboxPing = { username: string; name: string; text: string; at: string };

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

export function useInbox(username: string, enabled: boolean, onPing: (ping: InboxPing) => void) {
  const [loaded, setThreads] = useState<InboxThread[]>([]);
  const [seenBook, setSeenBook] = useState(() => ({ username, map: loadSeen(username) }));
  const seen = seenBook.username === username ? seenBook.map : loadSeen(username);
  const threads = enabled ? loaded : [];
  const announced = useRef<Set<string> | null>(null);
  const pingRef = useRef(onPing);
  const seenRef = useRef(seen);
  useEffect(() => {
    pingRef.current = onPing;
    seenRef.current = seen;
  });

  useEffect(() => {
    announced.current = null;
    if (!enabled) return;
    let stop = false;
    const load = () => {
      fetch("/api/live/chat")
        .then((response) => (response.ok ? response.json() : null))
        .then((payload: { threads?: InboxThread[] } | null) => {
          if (stop || !Array.isArray(payload?.threads)) return;
          const list = payload.threads.map((thread) => ({ ...thread, incoming: Array.isArray(thread.incoming) ? thread.incoming : [] }));
          setThreads(list);
          const keys = list.flatMap((thread) => thread.incoming.map((mail) => `${thread.username}|${mail.at}`));
          if (!announced.current) {
            announced.current = new Set(keys);
            return;
          }
          for (const thread of list) {
            const since = seenRef.current[thread.username] ?? "";
            for (const mail of thread.incoming) {
              const key = `${thread.username}|${mail.at}`;
              if (announced.current.has(key)) continue;
              announced.current.add(key);
              if (mail.at > since) pingRef.current({ username: thread.username, name: thread.name, text: mail.text, at: mail.at });
            }
          }
        })
        .catch(() => {});
    };
    load();
    const id = window.setInterval(load, 5000);
    return () => {
      stop = true;
      window.clearInterval(id);
    };
  }, [enabled, username]);

  const markRead = useCallback(
    (other: string) => {
      const thread = loaded.find((item) => item.username === other);
      const latest = thread?.incoming[thread.incoming.length - 1]?.at ?? new Date().toISOString();
      setSeenBook((book) => {
        const current = book.username === username ? book.map : loadSeen(username);
        if (current[other] && current[other] >= latest) return book;
        const next = { ...current, [other]: latest };
        try {
          localStorage.setItem(readKey(username), JSON.stringify(next));
        } catch {}
        return { username, map: next };
      });
    },
    [loaded, username],
  );

  const unread: Record<string, number> = {};
  for (const thread of threads) {
    const since = seen[thread.username] ?? "";
    const count = thread.incoming.filter((mail) => mail.at > since).length;
    if (count) unread[`user:${thread.username}`] = count;
  }
  const total = Object.values(unread).reduce((sum, count) => sum + count, 0);

  return { threads, unread, total, markRead };
}
