import { cloneLife, dayIndex, logLine, realMinutes, cedis, type Life, type StepResult } from "@/lib/game/world";

export type Badge = { id: string; emoji: string; label: string; detail: string; test: (life: Life) => boolean };

const minutesNow = (life: Life) => life.minutes;

export const BADGES: Badge[] = [
  { id: "pocket", emoji: "💵", label: "Pocket money", detail: "Hold ₵1,000.", test: (life) => life.cash >= 1000 },
  { id: "ten-k", emoji: "💰", label: "Ten thousand", detail: "Hold ₵10,000.", test: (life) => life.cash >= 10000 },
  { id: "hundred-k", emoji: "🏦", label: "Big money", detail: "Hold ₵100,000.", test: (life) => life.cash >= 100000 },
  { id: "plot", emoji: "📜", label: "Indenture", detail: "Buy a plot of land.", test: (life) => (life.plots ?? []).length > 0 },
  { id: "landlord", emoji: "🏘️", label: "Landlord", detail: "Finish a house and take in tenants.", test: (life) => (life.plots ?? []).some((plot) => plot.stage >= 5 && plot.tenants > 0) },
  { id: "parent", emoji: "👶", label: "Proud parent", detail: "Welcome a child.", test: (life) => (life.kids ?? []).length > 0 },
  { id: "legacy", emoji: "🌳", label: "Legacy", detail: "Live as the next generation.", test: (life) => (life.generation ?? 1) > 1 },
  { id: "first-song", emoji: "🎙️", label: "First single", detail: "Release a song.", test: (life) => (life.music?.songs.length ?? 0) > 0 },
  { id: "headliner", emoji: "🎤", label: "Headliner", detail: "Reach 25,000 fans.", test: (life) => (life.music?.fans ?? 0) >= 25000 },
  { id: "wassce", emoji: "📝", label: "Certified", detail: "Pass WASSCE.", test: (life) => (life.school?.certs ?? []).includes("wassce") },
  { id: "graduate", emoji: "🎓", label: "Graduate", detail: "Earn a university degree.", test: (life) => (life.school?.certs ?? []).includes("degree") },
  { id: "driver", emoji: "🚗", label: "On the road", detail: "Own a car.", test: (life) => Boolean(life.car) },
  { id: "farmer", emoji: "🌶️", label: "Farmer", detail: "Harvest five beds.", test: (life) => (life.stats?.harvests ?? 0) >= 5 },
  { id: "mogul", emoji: "🏪", label: "Mogul", detail: "Run three businesses.", test: (life) => (life.businesses ?? []).length >= 3 },
  { id: "chef", emoji: "👩🏾‍🍳", label: "Top chef", detail: "Reach Cooking 8.", test: (life) => life.skills.cooking >= 8 },
  { id: "fit", emoji: "💪", label: "Fit fam", detail: "Reach Fitness 8.", test: (life) => life.skills.fitness >= 8 },
  { id: "dressed", emoji: "🧵", label: "Best dressed", detail: "Own five tailored pieces.", test: (life) => (life.tailor?.wardrobe.length ?? 0) >= 5 },
  { id: "social", emoji: "💬", label: "Everybody's friend", detail: "Five close friends.", test: (life) => life.relations.filter((person) => person.score >= 50).length >= 5 },
  { id: "insured", emoji: "🩺", label: "Covered", detail: "Hold a valid NHIS card.", test: (life) => (life.health?.nhisUntil ?? 0) > minutesNow(life) },
  { id: "streak", emoji: "🔥", label: "Week streak", detail: "Claim the daily bonus 7 days in a row.", test: (life) => (life.streak?.count ?? 0) >= 7 },
  { id: "board-wins", emoji: "🎲", label: "Board master", detail: "Win five board games.", test: (life) => (life.stats?.wins ?? 0) >= 5 },
];

export function earnedBadges(life: Life) {
  const kept = new Set(life.badges ?? []);
  return BADGES.filter((badge) => kept.has(badge.id) || badge.test(life)).map((badge) => badge.id);
}

export function syncBadges(life: Life): StepResult {
  const earned = earnedBadges(life);
  const fresh = earned.filter((badgeId) => !(life.badges ?? []).includes(badgeId));
  if (!fresh.length) return { life, notes: [] };
  const next = cloneLife(life);
  next.badges = earned;
  const names = fresh.map((badgeId) => BADGES.find((badge) => badge.id === badgeId)).filter(Boolean).map((badge) => `${badge!.emoji} ${badge!.label}`);
  logLine(next, `New badge: ${names.join(", ")}`);
  return { life: next, notes: [`New badge: ${names.join(", ")}`] };
}

export function dailyReward(count: number) {
  return 10 + 5 * Math.min(count, 8);
}

export function streakState(life: Life, at = Date.now()) {
  const today = dayIndex(realMinutes(at));
  const streak = life.streak;
  const claimed = streak?.day === today;
  const next = streak && streak.day === today - 1 ? streak.count + 1 : claimed ? streak.count : 1;
  return { claimed, count: streak?.count ?? 0, next, reward: dailyReward(next) };
}

export function claimDaily(life: Life, at = Date.now()): StepResult {
  const state = streakState(life, at);
  if (state.claimed) return { life, notes: [], error: "Already claimed today. Come back tomorrow." };
  const next = cloneLife(life);
  next.streak = { day: dayIndex(realMinutes(at)), count: state.next };
  next.cash += state.reward;
  return { life: next, notes: [`Day ${state.next} streak: ${cedis(state.reward)}.`] };
}
