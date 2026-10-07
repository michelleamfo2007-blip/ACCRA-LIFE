import { travelFactor, weatherAt } from "@/lib/game/sky";
import { cloneLife, homeById, hourOf, type Life, type StepResult, type Verb } from "@/lib/game/world";

export type GuestDoing = "coming" | "door" | "arrive" | "chat" | "eat" | "cook" | "tv" | "game" | "sleep" | "leave";

export type InvitePurpose = "eat" | "gist" | "pass";

export type HomeGuest = {
  name: string;
  /** Real Accra Life player handle when this guest is online. */
  username?: string;
  arrivedAt: number;
  until: number;
  doing: GuestDoing;
  sleepover?: boolean;
  gift?: string;
  eta?: number;
  ride?: string;
  purpose?: string;
  from?: string;
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

const AREAS = ["Madina", "Kaneshie", "Osu", "Lapaz", "Tema", "Dansoman", "Spintex", "Circle"];

function hash(text: string) {
  let value = 2166136261;
  for (const char of text) value = Math.imul(value ^ char.charCodeAt(0), 16777619);
  return (value >>> 0) / 4294967295;
}

function liveGuests(life: Life) {
  return (life.guests ?? []).filter((guest) => guest.until > life.minutes && guest.doing !== "leave" && guest.doing !== "dine");
}

export function activeGuests(life: Life): HomeGuest[] {
  return liveGuests(life)
    .map((guest) => ({ ...guest, doing: guest.doing as GuestDoing }))
    .filter((guest) => guest.doing !== "coming" && guest.doing !== "door");
}

export function enRouteGuests(life: Life): HomeGuest[] {
  return liveGuests(life)
    .filter((guest) => guest.doing === "coming")
    .map((guest) => ({ ...guest, doing: "coming" as const }));
}

export function doorGuests(life: Life): HomeGuest[] {
  return liveGuests(life)
    .filter((guest) => guest.doing === "door")
    .map((guest) => ({ ...guest, doing: "door" as const }));
}

export function minutesAway(life: Life, guest: HomeGuest) {
  return Math.max(0, (guest.eta ?? guest.arrivedAt) - life.minutes);
}

export function settleGuests(life: Life): { life: Life; notes: string[] } {
  if (!life.guests?.length) return { life, notes: [] };
  const next = cloneLife(life);
  const hour = hourOf(next.minutes);
  const notes: string[] = [];
  next.guests = (next.guests ?? [])
    .map((guest) => {
      if (guest.doing === "dine" || guest.doing === "leave") return guest;
      if (guest.doing === "coming") {
        if (next.minutes < (guest.eta ?? guest.arrivedAt)) return guest;
        if (next.where !== "home") {
          bump(next, guest.name, -4);
          const line = `${guest.name} came by but you weren't home.`;
          notes.push(line);
          pushNote(next, line);
          return { ...guest, doing: "leave" as const, until: next.minutes };
        }
        const score = next.relations.find((person) => person.name === guest.name)?.score ?? 0;
        if (score >= 50) {
          guest.doing = "arrive";
          guest.arrivedAt = next.minutes;
          guest.until = next.minutes + 90;
          guest.gift = giftFor(guest.name);
          const line = welcome(next, guest.name, true);
          notes.push(line);
          return guest;
        }
        const line = `${guest.name} is at your door.`;
        notes.push(line);
        pushNote(next, line);
        return { ...guest, doing: "door" as const, arrivedAt: next.minutes, until: next.minutes + 8 };
      }
      if (guest.doing === "door") {
        if (guest.until > next.minutes) return guest;
        bump(next, guest.name, -3);
        const line = `${guest.name} waited, then left.`;
        notes.push(line);
        pushNote(next, line);
        return { ...guest, doing: "leave" as const };
      }
      if (guest.until <= next.minutes) return { ...guest, doing: "leave" as const };
      if (guest.sleepover && guest.doing === "sleep" && hour >= 6 && hour < 11) {
        const line = `${guest.name} is up. Breakfast gist before they go.`;
        notes.push(line);
        pushNote(next, line);
        return { ...guest, doing: "eat" as const, until: next.minutes + 40 };
      }
      const span = guest.until - guest.arrivedAt;
      const progress = span > 0 ? (next.minutes - guest.arrivedAt) / span : 1;
      if (guest.sleepover && progress > 0.55 && guest.doing !== "sleep") return { ...guest, doing: "sleep" as const };
      if (progress > 0.75 && guest.doing !== "chat") return { ...guest, doing: "chat" as const };
      if (progress > 0.45 && guest.doing !== "cook" && guest.doing !== "tv") return { ...guest, doing: "tv" as const };
      if (progress > 0.2 && guest.doing === "arrive") return { ...guest, doing: "chat" as const };
      return guest;
    })
    .filter((guest) => guest.doing !== "leave" || guest.until > next.minutes - 5);
  return { life: next, notes };
}

export function tickGuests(life: Life): Life {
  return settleGuests(life).life;
}

export function askOver(life: Life, name: string, purpose: InvitePurpose = "gist"): StepResult {
  const known = life.relations.find((person) => person.name === name);
  const score = known?.score ?? 0;
  if (score < 8) return { life, notes: [], error: `${name} barely knows you. Gist more outside first.` };
  if (liveGuests(life).some((guest) => guest.name === name)) {
    return { life, notes: [], error: `${name} is already coming, or already here.` };
  }
  const hour = hourOf(life.minutes);
  const day = Math.floor(life.minutes / 1440);
  const roll = hash(`${name}:${day}:${purpose}`);
  const sky = weatherAt(new Date(), life.town);
  let decline = "";
  if ((hour >= 23 || hour < 6) && score < 70) decline = "It's late. I'll pass tomorrow.";
  else if (hour >= 8 && hour < 17 && score < 45 && roll > 0.4) decline = "I dey work. I can't today, sorry.";
  else if (score < 22 && roll > 0.5) decline = "I can't today, sorry.";
  else if (score < 36 && roll > 0.78) decline = "I'll pass tomorrow.";
  const next = cloneLife(life);
  next.minutes += 2;
  if (decline) {
    const line = `${name}: "${decline}"`;
    pushNote(next, line);
    return { life: next, notes: [line] };
  }

  let mins = score >= 70 ? 6 : score >= 40 ? 12 : 18;
  const from = AREAS[Math.floor(hash(name) * AREAS.length)];
  if (sky.flood) mins = Math.round(mins * 1.8);
  else if (sky.rain) mins = Math.round(mins * 1.35);
  if (travelFactor(hour, sky) > 1.3) mins = Math.round(mins * 1.25);
  const afterWork = hour >= 8 && hour < 17 && score < 65;
  if (afterWork) mins += 12;
  mins = Math.max(4, Math.min(24, mins));
  const ride = mins <= 8 && !sky.rain ? "walking" : mins <= 22 ? "trotro" : "taxi";
  const reply = afterWork ? "I dey work. Give me time, I go pass." : mins >= 24 ? "Give me small time." : "I dey come.";
  const memory = (known?.visits ?? 0) > 0 ? " Last time was sweet." : "";
  const weather = sky.flood ? " Roads flood, so e go take longer." : sky.rain ? " Rain go slow me small." : "";
  const guest: HomeGuest = {
    name,
    arrivedAt: next.minutes,
    eta: next.minutes + mins,
    until: next.minutes + mins + (purpose === "eat" ? 100 : 80),
    doing: "coming",
    ride,
    purpose,
    from,
  };
  next.guests = [...(next.guests ?? []).filter((item) => item.name !== name && item.doing !== "leave"), guest];
  bump(next, name, 2);
  const line = `${name}: "${reply}${memory}" ${ride} from ${from}. About ${mins}m.${weather}`;
  pushNote(next, line);
  return { life: next, notes: [line] };
}

export function openDoor(life: Life, name: string): StepResult {
  const guest = doorGuests(life).find((item) => item.name === name);
  if (!guest) return { life, notes: [], error: "Nobody is at the door." };
  const next = cloneLife(life);
  const found = next.guests!.find((item) => item.name === name && item.doing === "door");
  if (!found) return { life, notes: [], error: "Nobody is at the door." };
  found.doing = "arrive";
  found.arrivedAt = next.minutes;
  found.until = next.minutes + 90;
  found.gift = giftFor(name);
  const line = welcome(next, name, false);
  return { life: next, notes: [line] };
}

function giftFor(name: string) {
  return hash(name) > 0.35 ? GIFTS[Math.floor(hash(`${name}:gift`) * GIFTS.length)] : undefined;
}

function welcome(life: Life, name: string, walkedIn: boolean) {
  const known = life.relations.find((person) => person.name === name);
  if (known) known.visits = (known.visits ?? 0) + 1;
  else life.relations.push({ name, score: 12, visits: 1 });
  bump(life, name, walkedIn ? 6 : 8);
  life.needs.social = Math.min(100, life.needs.social + 8);
  const gift = life.guests?.find((guest) => guest.name === name)?.gift;
  if (gift) life.needs.fun = Math.min(100, life.needs.fun + 4);
  const line = walkedIn
    ? `${name} knows the place. They stepped in.${gift ? ` Brought ${gift}.` : ""}`
    : `${name} is in.${gift ? ` They brought ${gift}.` : " Clear a chair."}`;
  pushNote(life, line);
  const react = guestHomeReact(life);
  if (react) pushNote(life, react);
  return line;
}

/** Neighbour or friend knocks when player is home. */
export function maybeKnock(life: Life): { life: Life; note?: string } {
  if (life.where !== "home") return { life };
  if (liveGuests(life).length >= 4) return { life };
  const hour = hourOf(life.minutes);
  if (hour < 10 || hour > 22) return { life };
  if (Math.random() > 0.22) return { life };
  const pool = life.relations.filter((person) => person.score >= 10).sort((a, b) => b.score - a.score);
  const pick = pool[0] ?? { name: "Ama from next door", score: 16 };
  if ((life.guests ?? []).some((guest) => guest.name === pick.name)) return { life };
  return receiveGuest(life, pick.name, { invited: false });
}

export function receiveGuest(life: Life, name: string, opts: { invited?: boolean; sleepover?: boolean; username?: string } = {}) {
  const next = cloneLife(life);
  const stay = opts.sleepover ? 480 : 90 + Math.floor(Math.random() * 70);
  const gift = Math.random() > 0.35 ? GIFTS[Math.floor(Math.random() * GIFTS.length)] : undefined;
  const guest: HomeGuest = {
    name,
    username: opts.username,
    arrivedAt: next.minutes,
    until: next.minutes + stay,
    doing: "arrive",
    sleepover: opts.sleepover,
    gift,
  };
  next.guests = [
    ...(next.guests ?? []).filter((item) => item.until > next.minutes && item.doing !== "leave" && item.name !== name && item.username !== opts.username),
    guest,
  ];
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

export function inviteHome(life: Life, name: string, username?: string) {
  if (life.where !== "home") {
    return { life, notes: [] as string[], error: "Head home first. Then call them over." };
  }
  const known = life.relations.find((person) => person.name === name || person.name === username || person.name === `@${username}`);
  if (known && known.score < 8 && !username) {
    return { life, notes: [] as string[], error: "They barely know you yet. Gist more outside first." };
  }
  const label = username ? `@${username}` : name;
  return {
    ...receiveGuest(life, name, { invited: true, username }),
    notes: [`Invite out to ${label}. They can open People and Visit.`] as string[],
    error: undefined as string | undefined,
  };
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

export function guestHomeReact(life: Life): string | null {
  const guest = activeGuests(life).find((item) => item.doing === "arrive") ?? activeGuests(life)[0];
  if (!guest) return null;
  const name = guest.name;
  const visits = life.relations.find((person) => person.name === name)?.visits ?? 0;
  const home = homeById(life.homeId);
  const hasSofa = life.inventory.some((id) => ["sofa", "family", "leather", "gold", "armchair"].includes(id));
  const hasAc = life.inventory.includes("ac");
  const hour = hourOf(life.minutes);
  if (life.needs.hygiene < 35) return `${name}: "You no dey clean? Hmm."`;
  if (visits > 1) return `${name}: "Same seat as last time. I remember."`;
  if ((life.pantry ?? 0) >= 3) return `${name}: "Ah, you get food! Make I take something."`;
  if (hasAc) return `${name}: "Ah, this place cold pass outside!"`;
  if (!hasAc && hour >= 11 && hour < 16) return `${name}: "This place hot o. Open window."`;
  if (hasSofa && (life.furniture?.length ?? 0) >= 3) return `${name}: "Ei, new things! You dey chop money."`;
  if (hasSofa) return `${name}: "Chale, your place dey nice o!"`;
  if (home.comfort <= 4) return `${name}: "Space small, but e dey okay."`;
  return `${name}: "At least you get four walls. Make we gist."`;
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
