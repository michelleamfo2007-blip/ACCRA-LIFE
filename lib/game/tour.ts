import { cedis, cloneLife, logLine, type Life, type StepResult } from "@/lib/game/world";

export const TOUR_BONUS = 40;

export const TOUR = [
  {
    id: "welcome",
    title: "Welcome to Accra",
    body: "This is your life here. Keep your needs up, earn cedis, and make a name for yourself.",
    cta: "Show me around",
    tab: null as "home" | "map" | "phone" | "buy" | null,
    pulse: null as "home" | "map" | "phone" | "buy" | null,
  },
  {
    id: "needs",
    title: "Watch your needs",
    body: "Hunger, energy, fun, social, hygiene, bladder. Tap the bars on the left when they drop. Eat, sleep, shower, go out.",
    cta: "Got it",
    tab: "home" as const,
    pulse: "home" as const,
  },
  {
    id: "map",
    title: "The city is open",
    body: "Map shows Accra. Tap a pin to see the name, then go. Trek is free. Later you can fly Accra to Kumasi.",
    cta: "Next",
    tab: "map" as const,
    pulse: "map" as const,
  },
  {
    id: "phone",
    title: "Your phone is everything",
    body: "Jobs, MoMo, Trips, Guide, Messages. Open Phone and work a shift when cash is thin.",
    cta: "Open phone",
    tab: "phone" as const,
    pulse: "phone" as const,
  },
  {
    id: "done",
    title: "You're in",
    body: `Follow the Getting started tips for small cash. Here's ${cedis(TOUR_BONUS)} to start. Accra is already moving.`,
    cta: "Start living",
    tab: null,
    pulse: null,
  },
] as const;

export type TourId = (typeof TOUR)[number]["id"];

export function finishTour(life: Life): StepResult {
  if (life.tour) return { life, notes: [] };
  const next = cloneLife(life);
  next.tour = true;
  next.cash += TOUR_BONUS;
  const line = `Welcome pack: ${cedis(TOUR_BONUS)}. Accra is yours now.`;
  logLine(next, line);
  return { life: next, notes: [line] };
}

export function skipTour(life: Life): StepResult {
  if (life.tour) return { life, notes: [] };
  const next = cloneLife(life);
  next.tour = true;
  return { life: next, notes: ["Tutorial skipped. Open Guide on your phone anytime."] };
}
