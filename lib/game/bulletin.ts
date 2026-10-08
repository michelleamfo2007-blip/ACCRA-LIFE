import { cloneLife, type Life, type StepResult } from "@/lib/game/world";

export const BULLETIN_ID = "2026-10-shops";

export const BULLETIN = [
  { emoji: "🏪", title: "Own a shop", detail: "Phone → Business. Pick the type, name it, hire a crew, then walk in. They call you boss." },
  { emoji: "🔥", title: "A rival", detail: "Phone → Rival. Kojo Mensah starts level with you. Beat him, make peace, or end it." },
  { emoji: "🗣️", title: "The city keeps score", detail: "Help someone and word spreads. A cheat, a late loan, or a record can close doors." },
  { emoji: "💸", title: "Throw money. Catch it.", detail: "In a club, spray as long as the wallet lasts. Tap the notes. They land in your cash." },
] as const;

export function seenBulletin(life: Life): StepResult {
  if (life.bulletin === BULLETIN_ID) return { life, notes: [] };
  const next = cloneLife(life);
  next.bulletin = BULLETIN_ID;
  return { life: next, notes: [] };
}
