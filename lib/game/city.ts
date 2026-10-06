import type { Ride, Verb } from "@/lib/game/world";

export type CityEvent = {
  id: string;
  title: string;
  emoji: string;
  detail: string;
  spots: string[];
  verb: Verb;
};

export type Weather = {
  rain: boolean;
  flood: boolean;
  label: string;
};

export type Match = {
  id: string;
  title: string;
  home: string;
  away: string;
  startHour: number;
  endHour: number;
  live: boolean;
  over: boolean;
  score: [number, number];
  spots: string[];
};

export type City = {
  events: CityEvent[];
  weather: Weather;
  match: Match | null;
  headline: string;
};

export const QUIET_CITY: City = { events: [], weather: { rain: false, flood: false, label: "Dry and bright" }, match: null, headline: "Accra is moving" };

const PARTY_SPOTS = ["twist", "mad-club", "ace-tantra", "tantra", "duplex", "front-back", "embar", "one-percent", "zen-garden", "afrikiko", "beach", "bojo", "kokrobite"];
const BAR_SPOTS = ["viewing", "stadium", "republic", "duncans", "purple-pub", "container", "plus233", "buka"];
const RIVALS = ["Côte d'Ivoire", "Senegal", "Cameroon", "Egypt", "Morocco", "Mali", "Burkina Faso", "Algeria", "Tunisia", "South Africa"];

function seed(text: string) {
  let hash = 2166136261;
  for (const char of text) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  hash = Math.imul(hash ^ (hash >>> 16), 0x85ebca6b);
  hash = Math.imul(hash ^ (hash >>> 13), 0xc2b2ae35);
  hash ^= hash >>> 16;
  return (hash >>> 0) / 4294967295;
}

function verb(partial: Partial<Verb> & Pick<Verb, "id" | "label" | "detail">): Verb {
  return { minutes: 60, cost: 0, earn: 0, effects: {}, social: true, ...partial };
}

function firstWeekday(year: number, month: number, weekday: number) {
  const first = new Date(Date.UTC(year, month, 1)).getUTCDay();
  return 1 + ((weekday - first + 7) % 7);
}

function weekOfYear(at: Date) {
  const start = Date.UTC(at.getUTCFullYear(), 0, 1);
  return Math.floor((at.getTime() - start) / (7 * 86400000));
}

function calendar(at: Date): CityEvent[] {
  const month = at.getUTCMonth();
  const day = at.getUTCDate();
  const weekday = at.getUTCDay();
  const year = at.getUTCFullYear();
  const list: CityEvent[] = [];
  if ((month === 11 && day >= 15) || (month === 0 && day <= 2)) {
    list.push({
      id: "detty",
      title: "Detty December",
      emoji: "🎆",
      detail: "The whole diaspora is home. Every club and beach is packed till sunrise.",
      spots: PARTY_SPOTS,
      verb: verb({ id: "ev-detty", label: "Detty December night", detail: "Afrobeats, fireworks and everybody you know from abroad.", minutes: 150, cost: 70, effects: { fun: 42, social: 28, energy: -18, hygiene: -10 }, tag: "party", skill: "music", emoji: "🎆" }),
    });
  }
  if (month === 0 && day === 1) {
    list.push({
      id: "new-year",
      title: "New Year in Accra",
      emoji: "🎇",
      detail: "Watch-night at church, then fireworks over Labadi.",
      spots: ["church", "beach", "independence"],
      verb: verb({ id: "ev-new-year", label: "Count down with the city", detail: "Ten, nine, eight… the whole square shouts the last one.", minutes: 90, effects: { fun: 30, social: 24 }, emoji: "🎇" }),
    });
  }
  if (month === 2) {
    list.push({
      id: "ghana-month",
      title: day === 6 ? "Independence Day" : "Ghana Month",
      emoji: "🇬🇭",
      detail: day === 6 ? "Parade at Independence Square. Red, gold and green everywhere." : "Wear made-in-Ghana, eat local. The parade is on 6 March.",
      spots: day === 6 ? ["independence", "nkrumah"] : ["independence", "nkrumah", "makola", "osu-night-market"],
      verb:
        day === 6
          ? verb({ id: "ev-parade", label: "Watch the 6 March parade", detail: "Schools march past. The crowd sings the anthem with them.", minutes: 90, effects: { fun: 26, social: 22 }, emoji: "🇬🇭" })
          : verb({ id: "ev-ghana-month", label: "Eat local for Ghana Month", detail: "Waakye, kelewele and a sobolo, all from the same corner.", minutes: 45, cost: 18, effects: { hunger: 34, fun: 12, social: 10 }, tag: "food", emoji: "🇬🇭" }),
    });
  }
  if (month === 6 && day === 1) {
    list.push({
      id: "republic",
      title: "Republic Day",
      emoji: "🧺",
      detail: "Families take the day out to the gardens.",
      spots: ["aburi", "botanical"],
      verb: verb({ id: "ev-republic", label: "Republic Day picnic", detail: "Jollof in a cooler, a mat under the trees.", minutes: 120, cost: 25, effects: { fun: 26, social: 20, hunger: 24 }, emoji: "🧺" }),
    });
  }
  if ((month === 7 && day === 4) || (month === 8 && day === 21)) {
    list.push({
      id: month === 7 ? "founders" : "nkrumah-day",
      title: month === 7 ? "Founders' Day" : "Kwame Nkrumah Memorial Day",
      emoji: "🕊️",
      detail: "A quiet crowd at the memorial park.",
      spots: ["nkrumah", "dubois"],
      verb: verb({ id: "ev-memorial", label: "Pay respects at the park", detail: "You read the plaque twice and stay for the speeches.", minutes: 60, effects: { fun: 10, social: 12 }, skill: "charm", emoji: "🕊️" }),
    });
  }
  if (month === 7 && (weekday === 6 || weekday === 0)) {
    list.push({
      id: "homowo",
      title: "Homowo",
      emoji: "🥣",
      detail: "The Ga harvest festival. Kpokpoi and palm-nut soup in Jamestown.",
      spots: ["jamestown", "chale-wote"],
      verb: verb({ id: "ev-homowo", label: "Eat kpokpoi with the Ga crowd", detail: "Somebody's auntie hands you a bowl before you ask.", minutes: 60, cost: 10, effects: { hunger: 36, social: 24, fun: 14 }, tag: "food", emoji: "🥣" }),
    });
  }
  if (month === 7 && day >= 18 && day <= 24) {
    list.push({
      id: "chale-wote",
      title: "Chale Wote",
      emoji: "🎨",
      detail: "Street art festival. Jamestown's walls are covered in fresh paint.",
      spots: ["chale-wote", "jamestown", "gallery-1957", "artists-alliance"],
      verb: verb({ id: "ev-chale-wote", label: "Walk the Chale Wote street", detail: "Murals, stilt walkers and a sound system every ten metres.", minutes: 90, effects: { fun: 34, social: 20, energy: -8 }, emoji: "🎨" }),
    });
  }
  if (month === 11 && weekday === 5 && day === firstWeekday(year, 11, 5)) {
    list.push({
      id: "farmers",
      title: "Farmers' Day",
      emoji: "🌽",
      detail: "Makola is full of fresh produce at holiday prices.",
      spots: ["makola", "osu-night-market"],
      verb: verb({ id: "ev-farmers", label: "Farmers' Day market run", detail: "Roasted corn, coconut and a bag of tomatoes for the week.", minutes: 45, cost: 8, effects: { hunger: 30, fun: 8 }, tag: "food", emoji: "🌽" }),
    });
  }
  if (month === 11 && day >= 24 && day <= 26) {
    list.push({
      id: "christmas",
      title: "Christmas",
      emoji: "🎄",
      detail: "Carols at church, then jollof at every house.",
      spots: ["church", "mall"],
      verb: verb({ id: "ev-christmas", label: "Christmas service and jollof", detail: "The choir goes long. Nobody minds.", minutes: 120, cost: 12, effects: { fun: 24, social: 26, hunger: 30 }, tag: "church", emoji: "🎄" }),
    });
  }
  return list;
}

function weather(at: Date): Weather {
  const month = at.getUTCMonth();
  const hour = at.getUTCHours();
  const key = `${at.getUTCFullYear()}-${month}-${at.getUTCDate()}`;
  const major = month >= 3 && month <= 6;
  const minor = month === 8 || month === 9;
  const chance = major ? 0.45 : minor ? 0.3 : 0.06;
  if (seed(`rain-${key}`) >= chance) return { rain: false, flood: false, label: "Dry and bright" };
  const start = 12 + Math.floor(seed(`start-${key}`) * 7);
  const length = 2 + Math.floor(seed(`length-${key}`) * 4);
  if (hour < start || hour >= start + length) return { rain: false, flood: false, label: `Rain due around ${start > 12 ? start - 12 : start}${start >= 12 ? "pm" : "am"}` };
  const flood = major && seed(`flood-${key}`) < 0.35;
  return { rain: true, flood, label: flood ? "Heavy rain. Roads around Circle are flooding." : "Rain in Accra." };
}

function match(at: Date): Match | null {
  const weekday = at.getUTCDay();
  const hour = at.getUTCHours();
  const week = weekOfYear(at);
  const key = `${at.getUTCFullYear()}-${week}`;
  let fixture: Omit<Match, "live" | "over" | "score"> | null = null;
  if (weekday === 6 && week % 2 === 1) {
    const away = RIVALS[Math.floor(seed(`rival-${key}`) * RIVALS.length)];
    fixture = { id: `stars-${key}`, title: `Black Stars vs ${away}`, home: "Black Stars", away, startHour: 18, endHour: 20, spots: BAR_SPOTS };
  } else if (weekday === 0 && week % 2 === 0) {
    fixture = { id: `derby-${key}`, title: "Hearts of Oak vs Asante Kotoko", home: "Hearts", away: "Kotoko", startHour: 15, endHour: 17, spots: BAR_SPOTS };
  }
  if (!fixture || hour < fixture.startHour - 3) return null;
  const score: [number, number] = [Math.floor(seed(`home-${fixture.id}`) * 4), Math.floor(seed(`away-${fixture.id}`) * 3)];
  return { ...fixture, live: hour >= fixture.startHour && hour < fixture.endHour, over: hour >= fixture.endHour, score };
}

export function matchVerb(game: Match): Verb {
  return verb({
    id: `ev-match-${game.id}`,
    label: game.live ? `Watch ${game.title}` : `Grab a seat for ${game.title}`,
    detail: game.live ? "The whole room jumps on every corner kick." : `Kick-off ${game.startHour > 12 ? game.startHour - 12 : game.startHour}pm. Get there early for a seat.`,
    minutes: game.live ? 100 : 40,
    cost: 15,
    effects: game.live ? { fun: 34, social: 24, energy: -6 } : { fun: 12, social: 10 },
    tag: "party",
    emoji: "⚽",
  });
}

export function cityNow(at = new Date()): City {
  const events = calendar(at);
  const sky = weather(at);
  const game = match(at);
  let headline = "A normal Accra day. The city is moving.";
  if (game?.live) headline = `⚽ ${game.title} is on now`;
  else if (game?.over) headline = `⚽ Full time: ${game.home} ${game.score[0]}–${game.score[1]} ${game.away}`;
  else if (game) headline = `⚽ ${game.title} at ${game.startHour > 12 ? game.startHour - 12 : game.startHour}pm`;
  if (events[0]) headline = `${events[0].emoji} ${events[0].title}: ${events[0].detail}`;
  if (sky.flood) headline = `🌊 ${sky.label}`;
  return { events, weather: sky, match: game, headline };
}

export function eventVerbs(spotId: string, city: City): Verb[] {
  const verbs = city.events.filter((event) => event.spots.includes(spotId)).map((event) => event.verb);
  if (city.match && !city.match.over && city.match.spots.includes(spotId)) verbs.unshift(matchVerb(city.match));
  return verbs;
}

export function eventSpot(city: City) {
  if (city.match && !city.match.over) return city.match.spots[0];
  return city.events[0]?.spots[0] ?? null;
}

export function rideIn(ride: Ride, sky: Weather): Ride & { blocked?: string; note?: string } {
  if (!sky.rain || ride.id === "train") return ride;
  if (sky.flood && ride.id === "okada") return { ...ride, blocked: "Okada riders have parked for the flood." };
  if (ride.id === "trek") return { ...ride, minutes: ride.minutes + (sky.flood ? 25 : 15), note: "Wet walk" };
  const slow = sky.flood ? 2 : 1.5;
  const extra = ride.id === "taxi" ? (sky.flood ? 15 : 8) : sky.flood ? 4 : 2;
  return { ...ride, minutes: Math.round(ride.minutes * slow), cost: ride.cost + extra, note: sky.flood ? "Flood fare" : "Rain fare" };
}
