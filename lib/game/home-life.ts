import { cloneLife, hourOf, type Life, type Verb } from "@/lib/game/world";

export type GuestDoing = "arrive" | "chat" | "eat" | "cook" | "tv" | "game" | "sleep" | "leave";

export type HomeGuest = {
  name: string;
  arrivedAt: number;
  until: number;
  doing: GuestDoing;
  sleepover?: boolean;
  gift?: string;
};

export type Recipe = {
  id: string;
  label: string;
  detail: string;
  emoji: string;
  minutes: number;
  pantry: number;
  cost: number;
  hunger: number;
  fun: number;
  skill?: number;
  shareBonus: number;
};

export const RECIPES: Recipe[] = [
  {
    id: "cook-egg",
    label: "Eggs and bread",
    detail: "Onions, pepper, two eggs. Breakfast handled.",
    emoji: "🍳",
    minutes: 20,
    pantry: 1,
    cost: 8,
    hunger: 28,
    fun: 4,
    shareBonus: 6,
  },
  {
    id: "cook-kelewele",
    label: "Kelewele",
    detail: "Ginger, pepper, ripe plantain. The corridor follows the smell.",
    emoji: "🌶️",
    minutes: 25,
    pantry: 1,
    cost: 12,
    hunger: 26,
    fun: 12,
    shareBonus: 8,
  },
  {
    id: "cook-jollof",
    label: "Party jollof",
    detail: "One pot, smoky bottom, enough for tomorrow.",
    emoji: "🍚",
    minutes: 50,
    pantry: 2,
    cost: 22,
    hunger: 52,
    fun: 10,
    skill: 1,
    shareBonus: 14,
  },
  {
    id: "cook-waakye",
    label: "Waakye pot",
    detail: "Beans, rice, stew on the side. Friends will ask for more.",
    emoji: "🫘",
    minutes: 55,
    pantry: 2,
    cost: 20,
    hunger: 48,
    fun: 8,
    skill: 1,
    shareBonus: 12,
  },
  {
    id: "cook-banku",
    label: "Banku and okro",
    detail: "Stretch the dough. Pepper that clears the sinuses.",
    emoji: "🥣",
    minutes: 45,
    pantry: 2,
    cost: 18,
    hunger: 50,
    fun: 8,
    skill: 1,
    shareBonus: 12,
  },
  {
    id: "cook-lightsoup",
    label: "Light soup",
    detail: "Goat, garden eggs, and pepper. Sunday energy.",
    emoji: "🍲",
    minutes: 60,
    pantry: 2,
    cost: 28,
    hunger: 46,
    fun: 10,
    skill: 1,
    shareBonus: 16,
  },
];

const GIFTS = ["Sobolo", "Pure water", "Kelewele wrap", "Sugar bread", "Fan ice", "Groundnuts"];

export function friendTier(score: number) {
  if (score >= 90) return { id: "family", label: "Family-like", min: 90 };
  if (score >= 75) return { id: "best", label: "Best friend", min: 75 };
  if (score >= 50) return { id: "close", label: "Close friend", min: 50 };
  if (score >= 25) return { id: "friend", label: "Friend", min: 25 };
  if (score >= 10) return { id: "acquaintance", label: "Acquaintance", min: 10 };
  return { id: "stranger", label: "Stranger", min: 0 };
}

function bump(life: Life, name: string, amount: number) {
  const known = life.relations.find((person) => person.name === name);
  if (known) known.score = Math.max(0, Math.min(100, known.score + amount));
  else life.relations.push({ name, score: Math.max(0, Math.min(100, amount)) });
}

function pushNote(life: Life, line: string) {
  life.log = [line, ...life.log].slice(0, 14);
  life.inbox = [line, ...life.inbox].slice(0, 20);
}

function bumpStat(life: Life, key: string, n = 1) {
  life.stats = { ...(life.stats ?? {}), [key]: (life.stats?.[key] ?? 0) + n };
}

export function activeGuests(life: Life): HomeGuest[] {
  return (life.guests ?? [])
    .map((guest) => ({ ...guest, doing: guest.doing as GuestDoing }))
    .filter((guest) => guest.until > life.minutes && guest.doing !== "leave");
}

export function tickGuests(life: Life): Life {
  if (!life.guests?.length) return life;
  const next = cloneLife(life);
  const hour = hourOf(next.minutes);
  next.guests = (next.guests ?? [])
    .map((guest) => {
      if (guest.until <= next.minutes) return { ...guest, doing: "leave" as const };
      if (guest.sleepover && guest.doing === "sleep" && hour >= 6 && hour < 11) {
        return { ...guest, doing: "eat" as const, until: next.minutes + 40 };
      }
      const span = guest.until - guest.arrivedAt;
      const progress = span > 0 ? (next.minutes - guest.arrivedAt) / span : 1;
      if (guest.sleepover && progress > 0.55 && guest.doing !== "sleep") return { ...guest, doing: "sleep" as const };
      if (progress > 0.75) return { ...guest, doing: "chat" as const };
      if (progress > 0.45) return { ...guest, doing: guest.doing === "cook" ? "cook" : "tv" as const };
      if (progress > 0.2) return { ...guest, doing: "chat" as const };
      return guest;
    })
    .filter((guest) => guest.doing !== "leave" || guest.until > next.minutes - 5);
  return next;
}

/** Neighbour or friend knocks when player is home. */
export function maybeKnock(life: Life): { life: Life; note?: string } {
  if (life.where !== "home") return { life };
  if (activeGuests(life).length >= 2) return { life };
  const hour = hourOf(life.minutes);
  if (hour < 10 || hour > 22) return { life };
  if (Math.random() > 0.22) return { life };
  const pool = life.relations.filter((person) => person.score >= 10).sort((a, b) => b.score - a.score);
  const pick = pool[0] ?? { name: "Ama from next door", score: 16 };
  if ((life.guests ?? []).some((guest) => guest.name === pick.name)) return { life };
  return receiveGuest(life, pick.name, { invited: false });
}

export function receiveGuest(life: Life, name: string, opts: { invited?: boolean; sleepover?: boolean } = {}) {
  const next = cloneLife(life);
  const stay = opts.sleepover ? 480 : 90 + Math.floor(Math.random() * 70);
  const gift = Math.random() > 0.35 ? GIFTS[Math.floor(Math.random() * GIFTS.length)] : undefined;
  const guest: HomeGuest = {
    name,
    arrivedAt: next.minutes,
    until: next.minutes + stay,
    doing: "arrive",
    sleepover: opts.sleepover,
    gift,
  };
  next.guests = [...activeGuests(next).filter((item) => item.name !== name), guest];
  next.needs.social = Math.min(100, next.needs.social + (opts.invited ? 8 : 6));
  bump(next, name, opts.invited ? 8 : 5);
  if (gift) {
    next.needs.fun = Math.min(100, next.needs.fun + 4);
    bump(next, name, 3);
  }
  const line = opts.sleepover
    ? `${name} is crashing here tonight.${gift ? ` They brought ${gift}.` : ""}`
    : opts.invited
      ? `${name} is at the door.${gift ? ` Hands full — ${gift}.` : " Clear a chair."}`
      : `${name} just passed by.${gift ? ` They brought ${gift}.` : " You dey home?"}`;
  pushNote(next, line);
  return { life: next, note: line };
}

export function inviteHome(life: Life, name: string) {
  if (life.where !== "home") {
    return { life, notes: [] as string[], error: "Head home first. Then call them over." };
  }
  const known = life.relations.find((person) => person.name === name);
  if (known && known.score < 8) {
    return { life, notes: [] as string[], error: "They barely know you yet. Gist more outside first." };
  }
  return { ...receiveGuest(life, name, { invited: true }), notes: [`${name} is on the way.`] as string[], error: undefined as string | undefined };
}

export function hangWithGuest(life: Life, name: string, kind: "chat" | "tv" | "game" | "drink"): { life: Life; notes: string[]; error?: string } {
  const guest = activeGuests(life).find((item) => item.name === name);
  if (!guest) return { life, notes: [], error: "Nobody here by that name." };
  const next = cloneLife(life);
  const g = next.guests!.find((item) => item.name === name)!;
  g.doing = kind === "chat" ? "chat" : kind === "tv" ? "tv" : "game";
  next.minutes += kind === "game" ? 40 : 25;
  next.needs.social = Math.min(100, next.needs.social + (kind === "chat" ? 14 : 10));
  next.needs.fun = Math.min(100, next.needs.fun + (kind === "game" ? 16 : kind === "tv" ? 12 : 8));
  next.needs.energy = Math.max(0, next.needs.energy - 4);
  if (kind === "drink") {
    next.cash = Math.max(0, next.cash - 10);
    next.needs.bladder = Math.max(0, next.needs.bladder - 8);
    bump(next, name, 6);
  } else bump(next, name, kind === "game" ? 8 : 6);
  const line =
    kind === "chat"
      ? `You gist with ${name} until the story gets loud.`
      : kind === "tv"
        ? `You and ${name} watch whatever is on.`
        : kind === "game"
          ? `Ludo with ${name}. Somebody is cheating.`
          : `Small drink with ${name}. The night softens.`;
  pushNote(next, line);
  return { life: next, notes: [line] };
}

export function cookAtHome(life: Life, recipeId: string, shareWith?: string): { life: Life; notes: string[]; error?: string } {
  const recipe = RECIPES.find((item) => item.id === recipeId);
  if (!recipe) return { life, notes: [], error: "That dish is not on your menu." };
  if ((life.pantry ?? 0) < recipe.pantry && life.cash < recipe.cost) {
    return { life, notes: [], error: "Need groceries or cash. Restock the fridge." };
  }
  const next = cloneLife(life);
  if ((next.pantry ?? 0) >= recipe.pantry) next.pantry = (next.pantry ?? 0) - recipe.pantry;
  else next.cash -= recipe.cost;
  next.minutes += recipe.minutes;
  next.needs.hunger = Math.min(100, next.needs.hunger + recipe.hunger);
  next.needs.fun = Math.min(100, next.needs.fun + recipe.fun);
  next.needs.energy = Math.max(0, next.needs.energy - 6);
  next.skills.cooking = Math.min(10, next.skills.cooking + (recipe.skill ?? 0) * 0.15);
  bumpStat(next, "cooked");
  let line = `You cooked ${recipe.label}.`;
  if (shareWith && activeGuests(next).some((guest) => guest.name === shareWith)) {
    next.needs.social = Math.min(100, next.needs.social + recipe.shareBonus);
    next.needs.hunger = Math.min(100, next.needs.hunger + 6);
    bump(next, shareWith, recipe.shareBonus);
    const g = next.guests!.find((guest) => guest.name === shareWith)!;
    g.doing = "eat";
    line = `You cooked ${recipe.label} with ${shareWith}. Plates clean.`;
  }
  // Burn chance if cooking skill low
  if (next.skills.cooking < 2 && Math.random() < 0.12) {
    next.needs.hunger = Math.max(0, next.needs.hunger - 20);
    next.needs.fun = Math.max(0, next.needs.fun - 8);
    line = `The ${recipe.label} burned. Money gone. Mood too.`;
    pushNote(next, line);
    return { life: next, notes: [line] };
  }
  pushNote(next, line);
  return { life: next, notes: [line] };
}

export function offerSleepover(life: Life, name: string): { life: Life; notes: string[]; error?: string } {
  const guest = activeGuests(life).find((item) => item.name === name);
  if (!guest) return { life, notes: [], error: "They already left." };
  const score = life.relations.find((person) => person.name === name)?.score ?? 0;
  if (score < 40) return { life, notes: [], error: "Not that close yet. Invite them again another night." };
  const hour = hourOf(life.minutes);
  if (hour < 20 && hour > 5) return { life, notes: [], error: "Too early. Ask when the night is late." };
  const next = cloneLife(life);
  const g = next.guests!.find((item) => item.name === name)!;
  g.sleepover = true;
  g.doing = "sleep";
  g.until = next.minutes + 500;
  next.needs.social = Math.min(100, next.needs.social + 12);
  bump(next, name, 14);
  bumpStat(next, "sleepovers");
  const line = `${name} is crashing on the sofa. Morning will come with breakfast gist.`;
  pushNote(next, line);
  return { life: next, notes: [line] };
}

export function sendGuestHome(life: Life, name: string): { life: Life; notes: string[] } {
  const next = cloneLife(life);
  next.guests = (next.guests ?? []).filter((guest) => guest.name !== name);
  bump(next, name, 2);
  const line = `${name} headed out. See them soon.`;
  pushNote(next, line);
  return { life: next, notes: [line] };
}

export function recipeVerb(recipe: Recipe): Verb {
  return {
    id: recipe.id,
    label: recipe.label,
    detail: recipe.detail,
    minutes: recipe.minutes,
    cost: recipe.cost,
    earn: 0,
    effects: { hunger: recipe.hunger, fun: recipe.fun },
    skill: "cooking",
    tag: "food",
    pantry: recipe.pantry,
    emoji: recipe.emoji,
  };
}

/** Guest line when they notice upgrades. */
export function guestHomeReact(life: Life): string | null {
  const guest = activeGuests(life)[0];
  if (!guest) return null;
  const pieces = life.furniture?.length ?? 0;
  const hasSofa = life.inventory.some((id) => ["sofa", "family", "leather", "gold"].includes(id) || id.includes("sofa"));
  const hasTv = life.inventory.some((id) => id.includes("tv") || id === "flat");
  const hasGas = life.inventory.includes("gas-cooker");
  if (hasGas && Math.random() > 0.5) return `${guest.name}: "Chale, this kitchen dey serious."`;
  if (hasTv && Math.random() > 0.5) return `${guest.name}: "Ah, flat screen. We dey watch something?"`;
  if (hasSofa) return `${guest.name}: "Chale, your place dey nice o. Proper seat."`;
  if (pieces >= 3) return `${guest.name}: "You dey decorate small. I like am."`;
  return `${guest.name}: "At least you get four walls. Make we gist."`;
}

export function homeUpgradeHints(life: Life) {
  const tips: { id: string; label: string; why: string }[] = [];
  if (!life.inventory.includes("gas-cooker") && !life.inventory.includes("kero")) {
    tips.push({ id: "gas-cooker", label: "Gas cooker", why: "Cook better jollof, faster, for guests." });
  }
  if (!life.inventory.some((id) => ["sofa", "family", "leather", "gold", "armchair"].includes(id))) {
    tips.push({ id: "family", label: "Family sofa", why: "Guests stay longer when they can sit." });
  }
  if (!life.inventory.some((id) => id.includes("tv") || id === "flat")) {
    tips.push({ id: "flat", label: "TV", why: "Movie nights and sleepovers feel real." });
  }
  if ((life.pantry ?? 0) < 2) {
    tips.push({ id: "fridge-restock", label: "Restock fridge", why: "Cooking needs groceries." });
  }
  return tips.slice(0, 4);
}
