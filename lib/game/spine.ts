import { seasonOf } from "@/lib/game/sky";
import { cedis, cloneLife, logLine, passTime, spotById, type Life, type StepResult } from "@/lib/game/world";

export type Mark = { line: string; at: number };
export type Rival = {
  name: string;
  cash: number;
  biz: string;
  car: boolean;
  house: boolean;
  where: string;
  stance: "rival" | "friend" | "broken";
  touched: number;
  crush: string;
  line: string;
};
export type CityPost = { text: string; at: number; likes: number; state: "quiet" | "viral" | "flop" | "cancelled" };
export type Moment = { id: string; line: string; a: string; b: string };
export type Kin = { id: string; name: string; role: string; need: string };
export type Aim = { id: string; label: string; detail: string };
export type Memory = { year: number; line: string };
export type Spine = {
  rep: number;
  stress: number;
  marks: Mark[];
  record: Mark[];
  barred: string[];
  rival: Rival;
  followers: number;
  cancelledUntil: number;
  posts: CityPost[];
  moment: Moment | null;
  kin: Kin[];
  aims: Aim[];
  journal: Memory[];
  rare: string;
  season: string;
  arc: string;
  pulsedDay: number;
  drunkDay: number;
};

const RIVAL_SPOTS = ["buka", "makola", "mall", "beach", "office", "gym", "kejetia", "salon", "republic"];
const SHUT_DOORS = new Set(["enzo", "aura-cafe", "flicks-licks", "frozen-cabana", "trasacco-gate"]);

export const AIMS: Aim[] = [
  { id: "save", label: "Save ₵100,000", detail: "The wallet, not the dream." },
  { id: "trasacco", label: "A mansion in Trasacco", detail: "A finished plot inside the gate." },
  { id: "married", label: "Get married", detail: "A partner, then a date." },
  { id: "million", label: "Become a millionaire", detail: "₵1,000,000 in hand." },
  { id: "rival", label: "Beat my rival", detail: "More cash than them, or a peace they cannot spin." },
  { id: "shops", label: "Own 3 businesses", detail: "The book can carry four. Three is a name." },
  { id: "club", label: "Own the biggest club", detail: "A nightclub with your name on the door." },
];

const MOMENTS: Moment[] = [
  { id: "wallet", line: "A stranger dropped their wallet. Notes are sticking out.", a: "Return it", b: "Keep it" },
  { id: "two-am", line: "Your friend called at 2am. They need a person, not advice.", a: "Go to them", b: "Let it ring" },
  { id: "ex", line: "Your ex is at the same party. They have already seen you.", a: "Stay and speak", b: "Leave quietly" },
  { id: "rent-up", line: "The landlord is raising the rent next month. The note is on the door.", a: "Accept it", b: "Argue in the compound" },
  { id: "schoolmate", line: "An old schoolmate is doing well. They asked if the house is open.", a: "Invite them", b: "Say you are busy" },
  { id: "sweets", line: "A neighbour's child is selling sweets at the gate.", a: "Buy one", b: "Wave them on" },
];

export const CITY_VOICE: Record<string, { voice: string; outsider: string; food: string; music: string; slang: string }> = {
  accra: {
    voice: "Fast, expensive, and already late for the next thing.",
    outsider: "Accra prices you before it greets you.",
    food: "Waakye at dawn, shawarma after the club.",
    music: "Amapiano in the car, highlife when the uncles arrive.",
    slang: "Chale. E dey be.",
  },
  kumasi: {
    voice: "Proud, warm, and the market is the argument.",
    outsider: "Speak softly at Manhyia. Kejetia will still test your price.",
    food: "Fufu and groundnut soup. The portion is a statement.",
    music: "Highlife first. The palace does not rush the song.",
    slang: "The price is the price.",
  },
  takoradi: {
    voice: "Oil money on a slow coast. The harbour keeps its own hours.",
    outsider: "They can tell you did not grow up on the salt.",
    food: "Tilapia and kelewele when the boats come in.",
    music: "A speaker on Beach Road, never as loud as Osu.",
    slang: "The sea will wait. You will not.",
  },
  tamale: {
    voice: "Heat, smock, and a city that still asks who your people are.",
    outsider: "Dress properly. The north notices shorts and hurry.",
    food: "TZ, tuo, and pito when it is offered.",
    music: "Drums before the speakers.",
    slang: "Greet the room before you greet the deal.",
  },
  "cape-coast": {
    voice: "Castle, school bands, and tourists who want a ghost story.",
    outsider: "Students have the slang. The castle has the bill.",
    food: "Kenkey and fried fish on the stones.",
    music: "A school band, then a beach speaker.",
    slang: "The castle is not a backdrop. Take the tour or don't pose.",
  },
  ho: {
    voice: "Hills, a quiet market, and an evening that cools on purpose.",
    outsider: "People have time. Use it.",
    food: "Akple and a pepper that does not apologise.",
    music: "Borborbor when there is a reason. Quiet when there is not.",
    slang: "Come down from Accra speed.",
  },
};

function dayOf(minutes: number) {
  return Math.floor(minutes / 1440);
}

function yearOf(minutes: number) {
  return new Date(minutes > 1_000_000 ? minutes * 60000 : Date.now()).getUTCFullYear();
}

function push(life: Life, line: string) {
  life.log = [line, ...life.log].slice(0, 14);
  life.inbox = [line, ...life.inbox].slice(0, 20);
}

function hash(text: string) {
  let value = 2166136261;
  for (const char of text) value = Math.imul(value ^ char.charCodeAt(0), 16777619);
  return (value >>> 0) / 4294967295;
}

export function repLabel(score: number) {
  if (score >= 40) return "Respected";
  if (score >= 15) return "Known for good";
  if (score >= -14) return "Ordinary";
  if (score >= -39) return "People are talking";
  return "The city has a file on you";
}

export function copySpine(spine?: Spine): Spine | undefined {
  if (!spine) return undefined;
  return {
    ...spine,
    marks: spine.marks.map((mark) => ({ ...mark })),
    record: spine.record.map((mark) => ({ ...mark })),
    barred: [...spine.barred],
    rival: { ...spine.rival },
    posts: spine.posts.map((post) => ({ ...post })),
    moment: spine.moment ? { ...spine.moment } : null,
    kin: spine.kin.map((person) => ({ ...person })),
    aims: spine.aims.map((aim) => ({ ...aim })),
    journal: spine.journal.map((memory) => ({ ...memory })),
  };
}

export function arcOf(at = new Date()) {
  const month = at.getUTCMonth();
  if (month === 11) return { id: "christmas", label: "Christmas", line: "Family wants you home. Gifts, church, and a pot of jollof that is not optional.", food: "Jollof and chicken", cloth: "Lace and a new shirt", problem: "Everybody has a list with your name on it." };
  if (month === 7 || month === 8) return { id: "homowo", label: "Homowo", line: "Ga harvest. Kpokpoi in the lanes and a family that expects your hands, not a transfer.", food: "Kpokpoi", cloth: "White and red", problem: "The procession does not wait for traffic." };
  if (month === 10) return { id: "election", label: "Election season", line: "Rallies, a cancelled plan, and a street that argues in two colours.", food: "Whatever the campaign is sharing", cloth: "No party cloth unless you mean it", problem: "Tension. Some doors ask who you stand with." };
  if (month === 4) return { id: "funeral", label: "Funeral season", line: "A weekend on the road. Cloth, a donation, and a seat you cannot skip.", food: "Rice and a malt for the mourners", cloth: "Black and red", problem: "Travel and an envelope." };
  return null;
}

export function cityArrival(town: string) {
  return CITY_VOICE[town]?.voice ?? "";
}

function blank(life: Life): Spine {
  const crush = life.relations[0]?.name ?? "";
  return {
    rep: 0,
    stress: 0,
    marks: [],
    record: [],
    barred: [],
    rival: {
      name: "Kojo Mensah",
      cash: Math.max(400, Math.round(life.cash * 0.85)),
      biz: "A provisions shop",
      car: Boolean(life.car),
      house: false,
      where: life.where || "buka",
      stance: "rival",
      touched: dayOf(life.minutes),
      crush,
      line: crush ? `Kojo Mensah started level with you. He has already asked about ${crush}.` : "Kojo Mensah started level with you. Same cash, same hunger.",
    },
    followers: 0,
    cancelledUntil: 0,
    posts: [],
    moment: null,
    kin: [
      { id: "ma", name: "Maame", role: "Mother", need: "" },
      { id: "pa", name: "Papa", role: "Father", need: "" },
      { id: "sis", name: "Abena", role: "Sister", need: "" },
      { id: "bro", name: "Yaw", role: "Brother", need: "" },
      { id: "cuz", name: "Kofi", role: "Cousin", need: "" },
    ],
    aims: [],
    journal: [{ year: yearOf(life.minutes), line: "The city learned your name. So did Kojo Mensah." }],
    rare: "",
    season: seasonOf().id,
    arc: arcOf()?.id ?? "",
    pulsedDay: dayOf(life.minutes),
    drunkDay: -1,
  };
}

function book(life: Life) {
  if (!life.spine) life.spine = blank(life);
  return life.spine;
}

export function openBook(life: Life): StepResult {
  if (life.spine) return { life, notes: [], error: "The city already has your name." };
  const next = cloneLife(life);
  const spine = blank(next);
  next.spine = spine;
  const line = `${spine.rival.name} is keeping pace. ${cedis(spine.rival.cash)} in his pocket, and he is at ${spotById(spine.rival.where).name}.`;
  logLine(next, line);
  return { life: next, notes: [line] };
}

function stamp(spine: Spine, line: string, at: number, delta: number) {
  spine.rep = Math.max(-100, Math.min(100, spine.rep + delta));
  spine.marks = [{ line, at }, ...spine.marks].slice(0, 8);
}

export function noteRep(life: Life, delta: number, line: string) {
  if (!life.spine) return;
  stamp(life.spine, line, life.minutes, delta);
}

export function doorBlocked(life: Life, placeId: string) {
  if (!life.spine?.barred.includes("record")) return null;
  if (!SHUT_DOORS.has(placeId)) return null;
  return "Your record is still open. That door will not have you.";
}

export function jobBlocked(life: Life, jobId: string) {
  if (jobId !== "ridge-intern") return null;
  if (!life.spine) return null;
  if (life.spine.barred.includes("record")) return "Ridge checked your name. The record is still open.";
  if (life.spine.barred.includes("office")) return "The bank's late list reached the office. Clear the loan first.";
  return null;
}

export function clearDebtMark(life: Life) {
  if (!life.spine?.barred.includes("office")) return;
  life.spine.barred = life.spine.barred.filter((id) => id !== "office");
  stamp(life.spine, "The bank took your name off the late list.", life.minutes, 6);
}

export function stampPost(life: Life, likes: number, place: string) {
  const spine = life.spine;
  if (!spine) return likes;
  const cancelled = spine.cancelledUntil > life.minutes;
  const viral = !cancelled && likes > 36 && hash(`${life.minutes}-viral`) > 0.72;
  const flop = cancelled || likes < 14;
  const state: CityPost["state"] = cancelled ? "cancelled" : viral ? "viral" : flop ? "flop" : "quiet";
  const gained = state === "viral" ? 28 : state === "flop" ? 1 : state === "cancelled" ? 0 : 8;
  spine.followers += gained;
  spine.posts = [{ text: place, at: life.minutes, likes: state === "cancelled" ? 0 : likes, state }, ...spine.posts].slice(0, 8);
  if (state === "viral") stamp(spine, `A post from ${place} travelled. People are sharing it.`, life.minutes, 4);
  if (state === "cancelled") stamp(spine, "The comments turned. Brands will wait.", life.minutes, -2);
  return state === "cancelled" ? 0 : likes;
}

export function aimProgress(life: Life, id: string) {
  const rival = life.spine?.rival;
  if (id === "save") return { current: Math.max(0, life.cash), max: 100000 };
  if (id === "trasacco") return { current: (life.plots ?? []).some((plot) => plot.area === "trasacco" && plot.stage >= 5) ? 1 : 0, max: 1 };
  if (id === "married") return { current: life.relations.some((person) => person.score >= 80) ? 1 : 0, max: 1 };
  if (id === "million") return { current: Math.max(0, life.cash), max: 1000000 };
  if (id === "rival") return { current: rival && (rival.stance !== "rival" || life.cash > rival.cash) ? 1 : 0, max: 1 };
  if (id === "shops") return { current: Math.min(3, (life.businesses ?? []).length), max: 3 };
  if (id === "club") return { current: (life.businesses ?? []).some((shop) => shop.kind === "nightclub") ? 1 : 0, max: 1 };
  return { current: 0, max: 1 };
}

export function rivalHere(life: Life) {
  const rival = life.spine?.rival;
  if (!rival || rival.stance === "broken") return null;
  if (rival.where !== life.where) return null;
  return rival;
}

function remember(spine: Spine, minutes: number, line: string) {
  if (spine.journal.some((memory) => memory.line === line)) return;
  spine.journal = [...spine.journal, { year: yearOf(minutes), line }].slice(-24);
}

function growRival(spine: Spine, life: Life, day: number) {
  const rival = spine.rival;
  if (rival.stance === "broken") return;
  const swing = Math.round((hash(`rival-${day}`) - 0.42) * 900);
  rival.cash = Math.max(80, rival.cash + swing);
  rival.car = rival.cash > 3500;
  rival.house = rival.cash > 12000;
  rival.biz = rival.cash > 8000 ? "A second shop" : rival.cash > 2000 ? "A provisions shop" : "A table at the market";
  rival.where = RIVAL_SPOTS[day % RIVAL_SPOTS.length];
  const crush = life.relations[0]?.name;
  if (crush) rival.crush = crush;
  if (rival.stance === "rival" && day - rival.touched >= 2) {
    stamp(spine, `${rival.name} is telling people you stalled. The rumour is moving.`, life.minutes, -4);
    rival.line = crush ? `${rival.name} asked ${crush} out, and he is talking about you.` : `${rival.name} is spending. People are starting to believe him.`;
  } else if (rival.where === life.where) {
    rival.line = `${rival.name} walked into ${spotById(life.where).name} the same minute you did.`;
  } else {
    rival.line = `${rival.name} is at ${spotById(rival.where).name} with ${cedis(rival.cash)}.`;
  }
}

export function pulseSpine(life: Life, notes: string[]) {
  const spine = life.spine;
  if (!spine) return;
  const day = dayOf(life.minutes);
  if (spine.pulsedDay === day) return;
  spine.pulsedDay = day;
  const at = new Date(life.minutes > 1_000_000 ? life.minutes * 60000 : Date.now());

  if (life.needs.hunger < 18 || life.needs.energy < 15) {
    spine.stress += 1;
    if (spine.stress >= 3 && !life.health?.sick) {
      life.health = { ...(life.health ?? {}), sick: { kind: life.needs.hunger < 18 ? "tummy" : "burnout", since: life.minutes } };
      spine.stress = 0;
      const line = "Skipped food and sleep. You are sick, and a sick day pays half.";
      notes.push(line);
      push(life, line);
    }
  } else spine.stress = Math.max(0, spine.stress - 1);

  if (life.hangover && spine.drunkDay !== day) {
    spine.drunkDay = day;
    stamp(spine, "Someone posted you from the club. The caption is not kind.", life.minutes, -5);
    notes.push("A club photo is going around.");
  }

  const bank = life.bank;
  if (bank && bank.loan > 0 && life.minutes > bank.loanDue && !spine.barred.includes("office")) {
    spine.barred = [...spine.barred, "office"];
    stamp(spine, "Late on the bank. The name is on a list offices can see.", life.minutes, -8);
    notes.push("The bank marked you. Ridge will hear about it.");
  }
  if (life.cash < 0) {
    stamp(spine, "Rent bounced. The landlord has a mark by your name.", life.minutes, -6);
    notes.push("The landlord marked the missed rent.");
  }

  growRival(spine, life, day);
  if (spine.rival.where === life.where && spine.rival.stance !== "broken") {
    notes.push(`${spine.rival.name} is in the same place as you.`);
  }

  const season = seasonOf(at);
  if (spine.season !== season.id) {
    spine.season = season.id;
    if (season.id === "harmattan") {
      life.needs.hygiene = Math.max(0, life.needs.hygiene - 6);
      notes.push("Harmattan. Dust on the skin, and lips that crack by noon.");
    } else if (season.id === "major-rains" || season.id === "minor-rains") {
      notes.push("Rain on the roads. A plan you made outside may not survive the gutter.");
    } else if (season.id === "detty") {
      notes.push("Detty December. The city is expensive and awake.");
    } else notes.push(season.detail);
    remember(spine, life.minutes, season.label);
  }
  const arc = arcOf(at);
  const arcId = arc?.id ?? "";
  if (arc && spine.arc !== arcId) {
    spine.arc = arcId;
    notes.push(arc.line);
    remember(spine, life.minutes, arc.label);
    if (arcId === "christmas" || arcId === "funeral") {
      const person = spine.kin[0];
      if (person) person.need = arcId === "christmas" ? "Christmas rice and a cloth. ₵80." : "Funeral cloth and the road. ₵80.";
    }
  }

  if (!spine.moment && hash(`moment-${day}`) > 0.55) {
    spine.moment = MOMENTS[day % MOMENTS.length];
    notes.push(spine.moment.line);
  }

  if (!spine.kin.some((person) => person.need) && hash(`kin-${day}`) > 0.72) {
    const person = spine.kin[day % spine.kin.length];
    person.need = `${person.name} needs ₵80. School, medicine, or a fare.`;
    notes.push(person.need);
  }

  if ((life.businesses ?? []).length && !spine.journal.some((memory) => memory.line.startsWith("Opened"))) {
    remember(spine, life.minutes, `Opened ${life.businesses![0].name || "a shop"}.`);
  }
  if (life.car && !spine.journal.some((memory) => memory.line.includes("car"))) remember(spine, life.minutes, "Bought a car.");
  if ((life.kids ?? []).length && !spine.journal.some((memory) => memory.line.includes("born"))) remember(spine, life.minutes, "A child was born.");

  if (!spine.rare && hash(`rare-${day}`) > 0.93) {
    const shops = life.businesses ?? [];
    if (shops.length && hash(`rare-${day}`) > 0.97) {
      const shop = shops[0];
      shop.stars = Math.min(5, (shop.stars ?? 3) + 0.3);
      spine.rare = `A celebrity stopped at ${shop.name || "your shop"}. The queue noticed.`;
    } else if (hash(`rare-${day}`) > 0.95) {
      life.cash += 120;
      spine.rare = "A small lottery ticket paid ₵120.";
    } else {
      spine.rare = "An East Legon host sent a private invite. The door is a name, not a flyer.";
    }
    notes.push(spine.rare);
    remember(spine, life.minutes, spine.rare);
  }

  if (spine.rep <= -40 && !spine.barred.includes("record")) {
    spine.barred = [...spine.barred, "record"];
    spine.record = [{ line: "Picked up. The record follows you into offices and some doors.", at: life.minutes }, ...spine.record].slice(0, 6);
    stamp(spine, "The police wrote your name down.", life.minutes, -6);
    notes.push("You were picked up. The record is open.");
  }
}

export function answerMoment(life: Life, pick: "a" | "b"): StepResult {
  const spine = life.spine;
  const moment = spine?.moment;
  if (!spine || !moment) return { life, notes: [], error: "The moment has passed." };
  const next = cloneLife(life);
  const bookNext = book(next);
  bookNext.moment = null;
  if (moment.id === "wallet" && pick === "a") {
    stamp(bookNext, "You returned a wallet. The stranger is telling people.", next.minutes, 8);
    next.needs.social = Math.min(100, next.needs.social + 6);
  } else if (moment.id === "wallet") {
    next.cash += 40;
    stamp(bookNext, "You kept the wallet. Word is moving the other way.", next.minutes, -12);
  } else if (moment.id === "two-am" && pick === "a") {
    const timed = passTime(next, 40);
    stamp(book(timed.life), "You showed up at 2am. That story will be told kindly.", timed.life.minutes, 6);
    const line = "You went. They will not forget the hour.";
    return { life: timed.life, notes: [line] };
  } else if (moment.id === "two-am") stamp(bookNext, "You let the 2am call ring out.", next.minutes, -4);
  else if (moment.id === "sweets" && pick === "a") {
    if (next.cash < 2) return { life, notes: [], error: "The sweets are ₵2." };
    next.cash -= 2;
    stamp(bookNext, "You bought from the neighbour's child. The compound noticed.", next.minutes, 3);
  } else if (moment.id === "schoolmate" && pick === "a") {
    next.needs.social = Math.min(100, next.needs.social + 8);
    stamp(bookNext, "An old schoolmate came over. The house has a story now.", next.minutes, 2);
  } else if (moment.id === "rent-up" && pick === "b") stamp(bookNext, "You argued with the landlord in front of the compound.", next.minutes, -2);
  else stamp(bookNext, pick === "a" ? "You stayed in it." : "You stepped away.", next.minutes, pick === "a" ? 1 : 0);
  const line = bookNext.marks[0]?.line ?? "The city filed that.";
  logLine(next, line);
  return { life: next, notes: [line] };
}

export function faceRival(life: Life, how: "beat" | "friend" | "cut"): StepResult {
  const spine = life.spine;
  if (!spine) return { life, notes: [], error: "You have not met him yet." };
  if (spine.rival.stance === "broken" && how !== "friend") return { life, notes: [], error: "Kojo Mensah is already out of the story." };
  const next = cloneLife(life);
  const bookNext = book(next);
  const rival = bookNext.rival;
  rival.touched = dayOf(next.minutes);
  if (how === "friend") {
    rival.stance = "friend";
    rival.line = "The rivalry cooled. He still watches the money.";
    stamp(bookNext, "You and Kojo Mensah made peace. The rumours stopped.", next.minutes, 6);
    next.needs.social = Math.min(100, next.needs.social + 8);
  } else if (how === "cut") {
    rival.stance = "broken";
    rival.cash = Math.max(80, Math.round(rival.cash * 0.4));
    rival.biz = "Closed";
    rival.line = "You ended it. People are taking sides.";
    stamp(bookNext, "You cut Kojo Mensah down. The city is split about you.", next.minutes, -8);
  } else if (next.cash > rival.cash || (next.stats?.clout ?? 0) > 40) {
    rival.cash = Math.max(80, rival.cash - 500);
    rival.line = "He lost the room. He will be back with a new number.";
    stamp(bookNext, "You beat Kojo Mensah in the open. People saw it.", next.minutes, 8);
    next.stats = { ...(next.stats ?? {}), clout: (next.stats?.clout ?? 0) + 2 };
  } else {
    rival.line = "He had the louder story tonight. Your name took the loss.";
    stamp(bookNext, "Kojo Mensah won the room.", next.minutes, -4);
    next.needs.fun = Math.max(0, next.needs.fun - 6);
  }
  const line = bookNext.marks[0]?.line ?? rival.line;
  logLine(next, line);
  remember(bookNext, next.minutes, line);
  return { life: next, notes: [line] };
}

export function helpKin(life: Life, id: string, yes: boolean): StepResult {
  const person = life.spine?.kin.find((item) => item.id === id);
  if (!person?.need) return { life, notes: [], error: "They are quiet for now." };
  if (yes && life.cash < 80) return { life, notes: [], error: "They need ₵80. The wallet is short." };
  const next = cloneLife(life);
  const bookNext = book(next);
  const kin = bookNext.kin.find((item) => item.id === id)!;
  kin.need = "";
  if (yes) {
    next.cash -= 80;
    stamp(bookNext, `You covered ${kin.name}. The family will say your name properly.`, next.minutes, 5);
    remember(bookNext, next.minutes, `Helped ${kin.name}.`);
  } else stamp(bookNext, `You told ${kin.name} not this time. They will remember the no.`, next.minutes, -4);
  const line = bookNext.marks[0]?.line ?? "Family filed it.";
  logLine(next, line);
  return { life: next, notes: [line] };
}

export function chooseAim(life: Life, id: string): StepResult {
  const aim = AIMS.find((item) => item.id === id);
  if (!aim) return { life, notes: [], error: "That dream is not on the list." };
  const next = cloneLife(life);
  const bookNext = book(next);
  if (!bookNext.aims.some((item) => item.id === id)) bookNext.aims = [...bookNext.aims, aim].slice(0, 3);
  const line = `You wrote it down: ${aim.label}.`;
  logLine(next, line);
  return { life: next, notes: [line] };
}

export function serveRecord(life: Life): StepResult {
  if (!life.spine?.barred.includes("record")) return { life, notes: [], error: "There is no open record." };
  const timed = passTime(cloneLife(life), 120).life;
  const bookNext = book(timed);
  bookNext.barred = bookNext.barred.filter((id) => id !== "record");
  stamp(bookNext, "You sat with the record and it was closed.", timed.minutes, 10);
  const line = "The record is closed. The doors open again.";
  logLine(timed, line);
  remember(bookNext, timed.minutes, line);
  return { life: timed, notes: [line] };
}

export function dismissRare(life: Life): StepResult {
  if (!life.spine?.rare) return { life, notes: [], error: "Nothing rare is waiting." };
  const next = cloneLife(life);
  book(next).rare = "";
  return { life: next, notes: ["You kept the story."] };
}
