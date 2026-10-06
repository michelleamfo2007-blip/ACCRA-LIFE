import type { Life } from "@/lib/game/world";

export type Account = {
  name: string;
  username: string;
  passwordHash: string;
  email: string;
  birthId: string;
  life: Life | null;
};

const ACCOUNTS = "accralife-accounts";
const SESSION = "accralife-session";
export const SAVE_EVENT = "accralife-life";

export type SaveSnap = { session: string | null; accounts: Account[] };

export function parseRaw(raw: string): SaveSnap {
  if (!raw) return { session: null, accounts: [] };
  const split = raw.indexOf("\n");
  const session = raw.slice(0, split) || null;
  try {
    const accounts = JSON.parse(raw.slice(split + 1)) as Account[];
    return { session, accounts: Array.isArray(accounts) ? accounts : [] };
  } catch {
    return { session, accounts: [] };
  }
}

export function getRaw() {
  if (typeof window === "undefined") return "";
  return `${localStorage.getItem(SESSION) ?? ""}\n${localStorage.getItem(ACCOUNTS) ?? "[]"}`;
}

export function subscribeSave(onStoreChange: () => void) {
  window.addEventListener(SAVE_EVENT, onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    window.removeEventListener(SAVE_EVENT, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

export function writeSave(accounts: Account[], session: string | null) {
  localStorage.setItem(ACCOUNTS, JSON.stringify(accounts));
  if (session) localStorage.setItem(SESSION, session);
  else localStorage.removeItem(SESSION);
  window.dispatchEvent(new Event(SAVE_EVENT));
}

export function commitLife(username: string, life: Life) {
  const { accounts, session } = parseRaw(getRaw());
  writeSave(
    accounts.map((account) => (account.username === username ? { ...account, life } : account)),
    session,
  );
}

export async function digestPassword(username: string, password: string) {
  const data = new TextEncoder().encode(`accralife:${username}:${password}`);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(buf)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}
