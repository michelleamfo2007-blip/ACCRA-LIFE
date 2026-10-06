import { weeklyNow } from "@/lib/game/weekly";
import type { Verb } from "@/lib/game/world";
import {
  seasonOf,
  weatherAt,
  type Season,
  type Weather,
  rideIn,
  travelFactor,
  weatherStress,
} from "@/lib/game/sky";

export type { Season, Weather };
export { seasonOf, rideIn, travelFactor, weatherStress };

export type CityEvent = {
  id: string;
  title: string;
  emoji: string;
  detail: string;
  spots: string[];
  verb: Verb;
  more?: Verb[];
};

export type Upcoming = { id: string; title: string; emoji: string; detail: string; date: Date; spots: string[] };

export function upcomingEvents(at = new Date(), days = 150): Upcoming[] {
  const seen = new Set<string>();
  const out: Upcoming[] = [];
  const start = Date.UTC(at.getUTCFullYear(), at.getUTCMonth(), at.getUTCDate(), 12);
  for (let offset = 0; offset <= days; offset += 1) {
    const date = new Date(start + offset * 86400000);
    for (const event of calendar(date)) {
      const key = event.id === "ghana-month" && date.getUTCDate() === 6 ? "independence-day" : event.id;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ id: key, title: event.title, emoji: event.emoji, detail: event.detail, date, spots: event.spots });
    }
  }
  return out;
}

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

export const QUIET_CITY: City = {
  events: [],
  weather: { rain: false, flood: false, harmattan: false, label: "Dry and bright", season: "dry" },
  match: null,
  headline: "Accra is moving",
};

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
      more: [verb({ id: "ev-detty-day", label: "Day party with the returnees", detail: "Jollof, a DJ under a tent, and cousins with new accents.", minutes: 120, cost: 50, effects: { fun: 30, social: 30, hunger: 16, energy: -10 }, tag: "party", emoji: "🌴" })],
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
      more:
        day === 6
          ? [verb({ id: "ev-flag", label: "Wave red, gold and green", detail: "A flag on a stick, a whistle, and the anthem twice.", minutes: 30, cost: 5, effects: { fun: 14, social: 14 }, emoji: "🎌" })]
          : [verb({ id: "ev-made-in-ghana", label: "Shop made-in-Ghana", detail: "Batik, shea butter and a smock from a Bolga weaver.", minutes: 40, cost: 30, effects: { fun: 16, social: 8 }, emoji: "🧺" })],
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
      more: [
        verb({ id: "ev-homowo-sprinkle", label: "Sprinkle kpokpoi with the chief", detail: "The procession moves through the lanes. You throw a pinch for the ancestors.", minutes: 45, effects: { social: 22, fun: 16 }, skill: "charm", emoji: "👑" }),
        verb({ id: "ev-homowo-drums", label: "Dance to the kpanlogo drums", detail: "The circle opens and somebody pulls you in.", minutes: 40, effects: { fun: 26, social: 14, energy: -10 }, tag: "party", emoji: "🥁" }),
      ],
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
      more: [
        verb({ id: "ev-chale-portrait", label: "Sit for a street portrait", detail: "Twenty minutes, charcoal on brown paper. It looks like you on a good day.", minutes: 30, cost: 40, effects: { fun: 20, social: 8 }, emoji: "🖼️" }),
        verb({ id: "ev-chale-paint", label: "Help paint a mural", detail: "A painter hands you a brush and points at a corner of the wall.", minutes: 60, effects: { fun: 24, social: 16, hygiene: -12 }, skill: "charm", emoji: "🖌️" }),
      ],
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
  if ((month === 11 || month === 0 || month === 1) && !list.some((event) => event.id === "detty")) {
    list.push({
      id: "harmattan",
      title: "Harmattan",
      emoji: "🌫️",
      detail: "Dusty haze over the city. Cool mornings, dry lips and a quiet beach.",
      spots: ["beach", "aburi"],
      verb: verb({ id: "ev-harmattan", label: "Watch the haze over the sea", detail: "The sun is a pale coin. The beach is nearly empty and cool.", minutes: 45, effects: { fun: 16, energy: 6 }, emoji: "🌫️" }),
    });
  }
  return list;
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
  const weekly = weeklyNow(at);
  if (weekly) {
    const [first, ...rest] = weekly.event.verbs;
    events.unshift({ id: weekly.key, title: weekly.event.title, emoji: weekly.event.emoji, detail: `${weekly.event.detail} Check in for a reward.`, spots: [weekly.event.spot], verb: first, more: rest });
  }
  const sky = weatherAt(at);
  const game = match(at);
  let headline = "A normal Accra day. The city is moving.";
  if (game?.live) headline = `⚽ ${game.title} is on now`;
  else if (game?.over) headline = `⚽ Full time: ${game.home} ${game.score[0]}–${game.score[1]} ${game.away}`;
  else if (game) headline = `⚽ ${game.title} at ${game.startHour > 12 ? game.startHour - 12 : game.startHour}pm`;
  if (events[0]) headline = `${events[0].emoji} ${events[0].title}: ${events[0].detail}`;
  if (sky.flood) headline = `🌊 ${sky.label}`;
  else if (sky.rain) headline = `🌧️ ${sky.label}`;
  else if (sky.harmattan) headline = `🌫️ ${sky.label}`;
  return { events, weather: sky, match: game, headline };
}

export function eventVerbs(spotId: string, city: City): Verb[] {
  const verbs = city.events.filter((event) => event.spots.includes(spotId)).flatMap((event) => [event.verb, ...(event.more ?? [])]);
  if (city.match && !city.match.over && city.match.spots.includes(spotId)) verbs.unshift(matchVerb(city.match));
  return verbs;
}

export function eventSpot(city: City) {
  if (city.match && !city.match.over) return city.match.spots[0];
  return city.events[0]?.spots[0] ?? null;
}
