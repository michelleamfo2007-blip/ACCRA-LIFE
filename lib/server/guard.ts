import "server-only";
import { getSession } from "@/lib/server/session";
import { readStore, type StoredUser } from "@/lib/server/store";

export async function currentUser(): Promise<StoredUser | null> {
  const session = await getSession();
  if (!session) return null;
  return readStore().users.find((user) => user.id === session.uid) ?? null;
}

export function clean(value: unknown, max: number) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}
