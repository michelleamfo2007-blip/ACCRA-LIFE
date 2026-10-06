import { ACCRA_SPOTS } from "@/lib/game/accra-spots";

export type NeedKey = "hunger" | "energy" | "fun" | "social" | "hygiene" | "bladder";

export type Needs = Record<NeedKey, number>;

export type Look = {
  body: "woman" | "man";
  hair: string;
  outfit: string;
  pattern: string;
  skin: string;
  cloth: string;
  accent: string;
};

export type Skills = {
  hustle: number;
  cooking: number;
  music: number;
  fitness: number;
  charm: number;
  coding: number;
  career: number;
};

export type Life = {
  look: Look;
  traits: string[];
  dream: string;
  birthId: string;
  homeId: string;
  needs: Needs;
  cash: number;
  loan: number;
  weeklyLoan: number;
  learn: number;
  minutes: number;
  skills: Skills;
  where: string;
  inventory: string[];
  log: string[];
  inbox: string[];
  relations: { name: string; score: number }[];
  funded: boolean;
  lastRentAt: number;
  outageCheckedDay: number;
  dumsor: boolean;
  gemDay: number;
};

export type Verb = {
  id: string;
  label: string;
  detail: string;
  minutes: number;
  cost: number;
  earn: number;
  effects: Partial<Needs>;
  skill?: keyof Skills;
  social?: boolean;
  special?: "pitch" | "gem";
  tag?: "food" | "party" | "gym" | "church";
  job?: boolean;
  emoji?: string;
};

export type Spot = {
  id: string;
  name: string;
  emoji: string;
  x: number;
  y: number;
  group: "home" | "hang" | "sea" | "civic" | "work" | "soon";
  blurb: string;
  soon?: boolean;
  actions: Verb[];
};

export const HAIRS = ["Braids", "Afro", "Bun", "Ponytail", "Long", "Locs", "Low cut", "Headwrap"];
export const OUTFITS = ["Classic", "Casual", "Office", "All-white", "Site work"];
export const PATTERNS = ["Plain", "Kente", "Ankara", "Tie-dye"];
export const SKINS = ["#c68a62", "#a86f4c", "#8d5a3b", "#7a4a2c", "#653c24", "#51301d", "#3d2416", "#2a1a12"];
export const CLOTHS = ["#e7c85a", "#2f7de1", "#22b573", "#e5484d", "#f59e42", "#8b5cf6", "#ec4899", "#1d2433", "#f4efe6", "#c9a227"];
export const ACCENTS = ["#1d2433", "#f4efe6", "#c9a227", "#2f7de1", "#e5484d", "#14b8a6"];

export const TRAITS = [
  { id: "hustler", emoji: "💼", name: "Hustler", detail: "Sees money in a queue. Shifts pay more and hustle grows faster." },
  { id: "foodie", emoji: "🍲", name: "Foodie", detail: "Lives for waakye. Cooking comes easier and a good plate lifts you higher." },
  { id: "outout", emoji: "🎉", name: "Out Out", detail: "Always dressed for an all-white. Parties hit harder, and quiet time gets boring faster." },
  { id: "gym", emoji: "💪", name: "Gym Rat", detail: "Leg day is a personality. Workouts feel good and fitness climbs fast." },
  { id: "smooth", emoji: "😏", name: "Smooth Talker", detail: "Mouth sweet. People warm up faster when you hang around." },
  { id: "lazy", emoji: "😴", name: "Lazy Bone", detail: "Why stand when the stool is right there? Energy lasts longer. Work pays a little less." },
  { id: "fresh", emoji: "🧼", name: "Always Fresh", detail: "You stay neat longer than everybody else in this heat." },
  { id: "night", emoji: "🌙", name: "Night Owl", detail: "Accra no dey sleep, and neither do you. Nightlife treats you well." },
  { id: "tech", emoji: "💻", name: "Tech Person", detail: "Three startup ideas before breakfast. Coding at the hub sticks." },
  { id: "musical", emoji: "🎶", name: "Musical", detail: "Hums in the trotro. Music skill grows whenever a speaker is on." },
] as const;

export const DREAMS = [
  { id: "oga", emoji: "👔", name: "Oga at the Top", detail: "Reach the top level of a career." },
  { id: "landlord", emoji: "🏡", name: "East Legon Landlord", detail: "Build a net worth of ₵25,000." },
  { id: "star", emoji: "🎤", name: "Afrobeats Star", detail: "Max out Music (level 10)." },
  { id: "padi", emoji: "🤝", name: "Everybody's Padi", detail: "Become close with 4 people." },
  { id: "unicorn", emoji: "🦄", name: "Legon Unicorn", detail: "Get a startup funded at Impact Hub." },
] as const;

export type Birth = {
  id: string;
  emoji: string;
  name: string;
  line: string;
  perks: string[];
  cash: number;
  loan: number;
  weeklyLoan: number;
  learn: number;
  hustle: number;
  cooking: number;
  charm: number;
  socialBonus: number;
  blockedHomes: string[];
};

export const BIRTHS: Birth[] = [
  {
    id: "susu",
    emoji: "🏦",
    name: "Susu Baby!",
    line: "Self-made hits different.",
    perks: [
      "₵600 susu loan to start — repay ₵120 every Saturday",
      "Hustle skill starts at 2",
      "You learn every skill a little faster",
      "East Legon is a dream until the money is real",
    ],
    cash: 600,
    loan: 600,
    weeklyLoan: 120,
    learn: 1.25,
    hustle: 2,
    cooking: 0,
    charm: 0,
    socialBonus: 0,
    blockedHomes: ["east-legon"],
  },
  {
    id: "family",
    emoji: "🏡",
    name: "Cantonments Compound",
    line: "The gate already knows your name.",
    perks: ["Start with ₵2,400", "Every home is open if you can make rent", "The compound already likes you"],
    cash: 2400,
    loan: 0,
    weeklyLoan: 0,
    learn: 1,
    hustle: 0,
    cooking: 0,
    charm: 1,
    socialBonus: 15,
    blockedHomes: [],
  },
  {
    id: "market",
    emoji: "🧺",
    name: "Makola Child",
    line: "You can price a tomato from across the lane.",
    perks: ["Start with ₵380", "Cooking starts at 2", "Chop bars and Makola food cost less", "East Legon rent can wait"],
    cash: 380,
    loan: 0,
    weeklyLoan: 0,
    learn: 1,
    hustle: 1,
    cooking: 2,
    charm: 0,
    socialBonus: 0,
    blockedHomes: ["east-legon"],
  },
  {
    id: "pastor",
    emoji: "⛪",
    name: "Pastor's Child",
    line: "Half of Ridge already knows your surname.",
    perks: ["Start with ₵700", "Charm starts at 2", "Church lifts you higher than a normal Sunday"],
    cash: 700,
    loan: 0,
    weeklyLoan: 0,
    learn: 1,
    hustle: 0,
    cooking: 0,
    charm: 2,
    socialBonus: 10,
    blockedHomes: [],
  },
  {
    id: "returnee",
    emoji: "✈️",
    name: "Just Landed",
    line: "The accent arrives before the suitcase.",
    perks: ["Start with ₵3,200", "People assume the wallet is heavier than it is", "East Legon is open, and the rent still bites"],
    cash: 3200,
    loan: 0,
    weeklyLoan: 0,
    learn: 1,
    hustle: 0,
    cooking: 0,
    charm: 1,
    socialBonus: 5,
    blockedHomes: [],
  },
];

export const HOMES = [
  {
    id: "legon-hall",
    emoji: "🎓",
    name: "UG hall bunk",
    area: "Legon",
    tag: "Student life",
    detail: "Lectures, a hot plate, and somebody's speaker at midnight. A bunk in a hall at the University of Ghana.",
    rent: 25,
    comfort: 4,
    neighbor: "Ama from the next bunk",
  },
  {
    id: "jamestown",
    emoji: "🏘️",
    name: "Chamber and hall",
    area: "Jamestown",
    tag: "Hard start",
    detail: "One room, a shared yard, and the sea air when the wind is kind. Cheap rent, loud dreams.",
    rent: 40,
    comfort: 0,
    neighbor: "Auntie Esi downstairs",
  },
  {
    id: "adabraka",
    emoji: "🚪",
    name: "Self-contain",
    area: "Adabraka",
    tag: "Balanced",
    detail: "Your own door, a small kitchen corner, and a balcony that sees the street. Balanced.",
    rent: 120,
    comfort: 8,
    neighbor: "Auntie Akua next door",
  },
  {
    id: "east-legon",
    emoji: "✨",
    name: "Mini-flat",
    area: "East Legon",
    tag: "Big spender",
    detail: "Bedroom, sitting room, kitchen, your own bathroom. The light bill will introduce itself.",
    rent: 450,
    comfort: 14,
    neighbor: "Kojo from upstairs",
  },
] as const;

export type Home = (typeof HOMES)[number];

const eat = (partial: Partial<Verb> & Pick<Verb, "id" | "label" | "detail">): Verb => ({
  minutes: 30,
  cost: 0,
  earn: 0,
  effects: {},
  ...partial,
});

export const HOME_VERBS: Verb[] = [
  eat({ id: "sleep", label: "Sleep", detail: "Seven hours. Tomorrow can argue with you later.", minutes: 420, effects: { energy: 46, hunger: -8 } }),
  eat({ id: "cooler", label: "Eat from the cooler", detail: "Rice and stew. Not fancy. It works.", minutes: 20, cost: 12, effects: { hunger: 32, bladder: -8 }, tag: "food" }),
  eat({ id: "cook", label: "Cook jollof", detail: "One pot, too much pepper, the whole corridor smells it.", minutes: 50, cost: 22, effects: { hunger: 48, fun: 8 }, skill: "cooking", tag: "food" }),
  eat({ id: "shower", label: "Shower", detail: "Cold water still counts as a personality reset.", minutes: 20, effects: { hygiene: 46, energy: -2 } }),
  eat({ id: "toilet", label: "Use the toilet", detail: "Handle your business.", minutes: 8, effects: { bladder: 60 } }),
  eat({ id: "radio", label: "Play the radio", detail: "Joy FM, a gospel hour, or somebody's new single.", minutes: 25, effects: { fun: 16 }, skill: "music" }),
  eat({ id: "gist", label: "Gist with the neighbour", detail: "Five minutes that become forty.", minutes: 30, effects: { social: 16, fun: 6 }, social: true }),
  eat({ id: "sing", label: "Sing highlife", detail: "One chorus, then the neighbour joins whether you asked or not.", minutes: 15, effects: { fun: 14 }, skill: "music" }),
  eat({ id: "skit", label: "Record a skit", detail: "Phone up. One take. The corridor is the audience.", minutes: 18, effects: { fun: 12, social: 4 } }),
  eat({ id: "hustle-chat", label: "Chat hustle", detail: "A voice note, a price, and somebody who actually pays.", minutes: 20, earn: 15, effects: { social: 10 }, skill: "hustle", social: true }),
  eat({ id: "call-home", label: "Call mummy", detail: "She asks if you have eaten. You lie, then you don't.", minutes: 12, effects: { social: 14 }, social: true }),
  eat({ id: "daydream", label: "Daydream about abroad", detail: "A quiet minute where the ticket is already booked.", minutes: 10, effects: { fun: 8 } }),
  eat({ id: "dance", label: "Dance in the room", detail: "Highlife, then azonto, then you remember the neighbours.", minutes: 12, effects: { fun: 16, energy: -4 } }),
];

export const JOBS: { id: string; place: string; title: string; verb: Verb }[] = [
  {
    id: "buka-floor",
    place: "buka",
    title: "Floor at Buka",
    verb: eat({ id: "job-buka", label: "Work the floor", detail: "Plates, orders, and auntie watching your attitude.", minutes: 240, earn: 70, effects: { energy: -24, hunger: -12, fun: -4 }, skill: "career", job: true }),
  },
  {
    id: "ridge-intern",
    place: "office",
    title: "Ridge office intern",
    verb: eat({ id: "job-office", label: "Intern shift", detail: "Emails, water runs, and one meeting that could have been a text.", minutes: 360, earn: 140, effects: { energy: -28, fun: -8, social: 6 }, skill: "career", job: true }),
  },
  {
    id: "makola-hand",
    place: "makola",
    title: "Makola hand",
    verb: eat({ id: "job-makola", label: "Help the stall", detail: "Carry, call customers, don't drop the tomatoes.", minutes: 300, earn: 55, effects: { energy: -22, hunger: -10 }, skill: "hustle", job: true }),
  },
  {
    id: "labadi-usher",
    place: "beach",
    title: "Labadi usher",
    verb: eat({ id: "job-beach", label: "Usher the beach", detail: "Chairs, shade, and telling people the sea is not a bin.", minutes: 240, earn: 80, effects: { energy: -18, fun: 6, hygiene: -8 }, skill: "career", job: true }),
  },
  {
    id: "joy-runner",
    place: "joy",
    title: "Joy FM runner",
    verb: eat({ id: "job-joy", label: "Studio runner", detail: "Cues, water, and standing very still while the mics are hot.", minutes: 240, earn: 90, effects: { energy: -16, fun: 8 }, skill: "music", job: true }),
  },
];

export const SPOTS: Spot[] = [
  { id: "home", name: "Home", emoji: "🏠", x: 980, y: 500, group: "home", blurb: "Your room. A bed, a cooler, and a window on the street.", actions: [] },
  {
    id: "viewing",
    name: "Viewing Centre",
    emoji: "⚽",
    x: 560,
    y: 280,
    group: "hang",
    blurb: "Circle. Plastic chairs, a big screen, and everybody is the coach.",
    actions: [
      eat({ id: "match", label: "Watch the match", detail: "Pay for a chair and lose your voice.", minutes: 100, cost: 10, effects: { fun: 30, social: 16, bladder: -14, hunger: -8 }, social: true }),
      eat({ id: "fan-ice", label: "Buy fan ice", detail: "Cold, sweet, gone in a minute.", minutes: 10, cost: 5, effects: { hunger: 8, fun: 6 }, tag: "food" }),
    ],
  },
  {
    id: "buka",
    name: "Buka",
    emoji: "🍲",
    x: 390,
    y: 460,
    group: "hang",
    blurb: "Osu. Waakye in the morning, jollof when the sun drops, gist all day.",
    actions: [
      eat({ id: "waakye", label: "Chop waakye", detail: "Egg, spaghetti, extra shito.", minutes: 35, cost: 18, effects: { hunger: 46, social: 6, bladder: -6 }, tag: "food", skill: "cooking" }),
      eat({ id: "buka-gist", label: "Hear the gossip", detail: "Sit long enough and the whole street passes through.", minutes: 30, cost: 8, effects: { social: 18, fun: 8 }, social: true }),
    ],
  },
  {
    id: "hub",
    name: "Impact Hub",
    emoji: "💡",
    x: 1280,
    y: 300,
    group: "work",
    blurb: "Osu. Laptops, pitch decks, and somebody always on a call with 'the investor'.",
    actions: [
      eat({ id: "cowork", label: "Cowork an hour", detail: "Bad coffee, good wifi, one real idea.", minutes: 60, cost: 20, effects: { energy: -8, fun: -2 }, skill: "coding" }),
      eat({ id: "pitch", label: "Pitch the startup", detail: "Five minutes. Don't say 'Uber for trotros' unless you mean it.", minutes: 40, effects: { energy: -12, social: 8 }, special: "pitch", skill: "charm" }),
    ],
  },
  {
    id: "makola",
    name: "Makola Market",
    emoji: "🧺",
    x: 300,
    y: 780,
    group: "hang",
    blurb: "Makola. Cloth, spices, and the city's commerce in one loud set of lanes.",
    actions: [
      eat({ id: "market-walk", label: "Walk the lanes", detail: "Cloth, tomatoes, speakers, and three people calling you.", minutes: 40, effects: { fun: 12, social: 10, hunger: -6 }, social: true }),
      eat({ id: "foodstuffs", label: "Buy foodstuffs", detail: "Rice, oil, and a sachet of pepper.", minutes: 25, cost: 16, effects: { hunger: 22 }, tag: "food" }),
    ],
  },
  {
    id: "theatre",
    name: "National Theatre",
    emoji: "🎭",
    x: 760,
    y: 860,
    group: "hang",
    blurb: "Victoriaborg. The steps are a hangout even when the stage is dark.",
    actions: [
      eat({ id: "play", label: "Catch a show", detail: "Lights down. Accra on the stage for once.", minutes: 120, cost: 40, effects: { fun: 32, social: 8 }, skill: "music" }),
      eat({ id: "steps", label: "Sit on the steps", detail: "Watch the traffic and the couples.", minutes: 25, effects: { fun: 12, energy: 4 } }),
    ],
  },
  {
    id: "gym",
    name: "Pulse Gym",
    emoji: "🏋️",
    x: 860,
    y: 680,
    group: "work",
    blurb: "East Legon side. Mirrors, afrobeats, and somebody filming a set.",
    actions: [
      eat({ id: "train", label: "Train", detail: "Sweat honestly.", minutes: 60, cost: 25, effects: { energy: -18, hygiene: -16, fun: 6 }, skill: "fitness", tag: "gym" }),
      eat({ id: "stretch", label: "Stretch and leave", detail: "You showed your face. That counts a little.", minutes: 15, cost: 10, effects: { energy: 4, fun: 4 }, tag: "gym" }),
    ],
  },
  {
    id: "office",
    name: "Office",
    emoji: "🏢",
    x: 690,
    y: 600,
    group: "work",
    blurb: "Ridge. Glass, badges, and a canteen that closes too early.",
    actions: [
      eat({ id: "cv", label: "Drop a CV", detail: "The front desk smiles like they have a drawer for this.", minutes: 20, effects: { social: 6 }, skill: "career" }),
      eat({ id: "coffee", label: "Canteen coffee", detail: "Sweet, milky, and strong enough to restart a Monday.", minutes: 15, cost: 12, effects: { hunger: 8, energy: 10 }, tag: "food" }),
    ],
  },
  {
    id: "plus233",
    name: "+233 Jazz Bar",
    emoji: "🎷",
    x: 1120,
    y: 980,
    group: "hang",
    blurb: "Osu. Jazz, a grill, and a room that would rather you listen than shout.",
    actions: [
      eat({ id: "jazz-set", label: "Stay for the set", detail: "Horns, a low light, and a table you do not give up.", minutes: 70, cost: 30, effects: { fun: 24, social: 10 }, skill: "music", social: true }),
      eat({ id: "jazz-plate", label: "Eat at the grill", detail: "Something hot while the next song finds itself.", minutes: 40, cost: 28, effects: { hunger: 30, fun: 8 }, tag: "food" }),
    ],
  },
  {
    id: "aburi",
    name: "Aburi Gardens",
    emoji: "🌿",
    x: 1560,
    y: 640,
    group: "sea",
    blurb: "Up the hills. Cooler air, tall trees, and a walk that makes the city feel far.",
    actions: [
      eat({ id: "gardens", label: "Walk the gardens", detail: "Take the climb slow. The view pays you back.", minutes: 80, cost: 20, effects: { fun: 28, energy: -10, hygiene: -4 } }),
      eat({ id: "picnic", label: "Picnic", detail: "Bread, egg, and a bottle of something cold.", minutes: 40, cost: 25, effects: { hunger: 20, fun: 12 }, tag: "food" }),
    ],
  },
  {
    id: "mall",
    name: "Accra Mall",
    emoji: "🛍️",
    x: 1620,
    y: 820,
    group: "hang",
    blurb: "Teshie. A cinema, a supermarket, a food court, and air-con for the afternoon.",
    actions: [
      eat({ id: "mall-grocery", emoji: "🛒", label: "Grocery run", detail: "Rice, oil, and the thing you forgot last week.", minutes: 40, cost: 80, effects: { fun: 4 } }),
      eat({ id: "mall-cinema", emoji: "🎬", label: "Cinema", detail: "A ticket, a cold drink, and the lights going down.", minutes: 120, cost: 45, effects: { fun: 28, energy: -6 } }),
      eat({ id: "mall-meal", emoji: "🍗", label: "Food court", detail: "A tray number and something hot.", minutes: 35, cost: 40, effects: { hunger: 32, fun: 6 }, tag: "food" }),
      eat({ id: "mall-icecream", emoji: "🍦", label: "Ice cream", detail: "One scoop. Then the second one.", minutes: 15, cost: 18, effects: { hunger: 8, fun: 10 }, tag: "food" }),
      eat({ id: "mall-outfit", emoji: "👗", label: "Try on an outfit", detail: "The mirror is honest. You still walk out with a bag.", minutes: 30, cost: 120, effects: { fun: 14, hygiene: 4 } }),
      eat({ id: "window", emoji: "🛍️", label: "Window shop", detail: "Look at the price. Put it back. Repeat.", minutes: 40, effects: { fun: 12, social: 6 } }),
    ],
  },
  {
    id: "beach",
    name: "Labadi Beach",
    emoji: "🏖️",
    x: 1720,
    y: 1040,
    group: "sea",
    blurb: "Labadi. Weekend drums, acrobats, horses, and a grill every few steps.",
    actions: [
      eat({ id: "shore", label: "Feet in the water", detail: "Drums behind you. The Gulf in front.", minutes: 40, effects: { fun: 26, energy: 6, hygiene: -8 } }),
      eat({ id: "kelewele", label: "Buy kelewele", detail: "Hot plantain, ginger, a napkin that gives up.", minutes: 15, cost: 15, effects: { hunger: 22, fun: 6 }, tag: "food" }),
    ],
  },
  {
    id: "korlebu",
    name: "Korle Bu",
    emoji: "🏥",
    x: 1500,
    y: 250,
    group: "civic",
    blurb: "The big hospital. You come for a person, or before a small thing becomes a big thing.",
    actions: [
      eat({ id: "nurse", label: "See a nurse", detail: "Vitals, advice, and a receipt.", minutes: 50, cost: 30, effects: { energy: 18, hygiene: 6 } }),
      eat({ id: "visit-ward", label: "Visit somebody", detail: "You brought malt. That is the love language.", minutes: 40, effects: { social: 18, fun: 4 }, social: true }),
    ],
  },
  {
    id: "salon",
    name: "Auntie Esi's Salon",
    emoji: "💇",
    x: 1680,
    y: 460,
    group: "hang",
    blurb: "Osu. Dryers, Nollywood, and a braid that lasts through the humidity.",
    actions: [
      eat({ id: "braids", label: "Wash and braid", detail: "You leave shining. Your neck knows the work.", minutes: 90, cost: 60, effects: { hygiene: 40, fun: 10, social: 8 }, social: true }),
      eat({ id: "salon-gist", label: "Sit and gist", detail: "You did not come for hair. You came for the story.", minutes: 30, effects: { social: 18, fun: 8 }, social: true }),
    ],
  },
  {
    id: "republic",
    name: "Republic Bar & Grill",
    emoji: "🕯️",
    x: 1240,
    y: 900,
    group: "hang",
    blurb: "Osu. Live highlife, a proudly Ghanaian room, and a Kokroko if you are staying.",
    actions: [
      eat({ id: "sunset", label: "Order a Kokroko", detail: "The house drink. The band is already warming up.", minutes: 60, cost: 28, effects: { fun: 22, social: 14 }, tag: "party", social: true }),
      eat({ id: "liveset", label: "Stay for highlife", detail: "Afropop, a live set, and a floor that fills without a speech.", minutes: 70, cost: 20, effects: { fun: 26, social: 12 }, tag: "party", skill: "music", social: true }),
    ],
  },
  {
    id: "police",
    name: "Police Station",
    emoji: "🚓",
    x: 250,
    y: 980,
    group: "civic",
    blurb: "Ministries. Fans, forms, and a bench that has heard everything.",
    actions: [
      eat({ id: "form", label: "Collect a form", detail: "Stamp number 4 is out. Come back... they do not say when.", minutes: 25, effects: { fun: -4, energy: -4 } }),
      eat({ id: "directions", label: "Ask for directions", detail: "You leave with three routes and a warning about the traffic.", minutes: 10, effects: { social: 4 } }),
    ],
  },
  {
    id: "church",
    name: "Ridge Church",
    emoji: "⛪",
    x: 240,
    y: 640,
    group: "civic",
    blurb: "Sunday best on Sunday. A quiet pew if you need one on a Wednesday.",
    actions: [
      eat({ id: "service", label: "Sit through service", detail: "Songs, a word, and somebody saving you a seat.", minutes: 70, effects: { social: 16, fun: 10, energy: -4 }, tag: "church", social: true }),
      eat({ id: "choir", label: "Choir practice", detail: "You are not the solo. You still leave lighter.", minutes: 40, effects: { fun: 12, social: 8 }, skill: "music", tag: "church" }),
    ],
  },
  {
    id: "mosque",
    name: "Central Mosque",
    emoji: "🕌",
    x: 220,
    y: 820,
    group: "civic",
    blurb: "The call cuts through the traffic. Shoes off, shoulders down.",
    actions: [
      eat({ id: "pray", label: "Pray", detail: "A still pocket in a loud city.", minutes: 25, effects: { social: 8, fun: 8, hygiene: 4 } }),
      eat({ id: "yard", label: "Talk in the yard", detail: "After prayers the yard becomes a parlour.", minutes: 20, effects: { social: 14 }, social: true }),
    ],
  },
  {
    id: "joy",
    name: "Joy FM",
    emoji: "📻",
    x: 500,
    y: 180,
    group: "work",
    blurb: "The station the trotros argue with. You can hear it from the car park.",
    actions: [
      eat({ id: "tour", label: "Studio tour", detail: "Glass, mics, and a producer who has heard every excuse.", minutes: 30, effects: { fun: 16 }, skill: "music" }),
      eat({ id: "callin", label: "Call in", detail: "You get on air for twenty seconds and text everybody.", minutes: 15, effects: { fun: 10, social: 12 }, social: true, skill: "charm" }),
    ],
  },
  {
    id: "polls",
    name: "Polling Unit",
    emoji: "🗳️",
    x: 900,
    y: 1120,
    group: "civic",
    blurb: "A classroom that becomes the country for one day, and a notice board the rest of the year.",
    actions: [
      eat({ id: "register", label: "Check your name", detail: "Your name is there. One line, still yours.", minutes: 15, effects: { fun: 4, social: 4 } }),
      eat({ id: "help-queue", label: "Help the queue", detail: "An older man needed the form read out. You stayed.", minutes: 25, effects: { social: 16 }, social: true, skill: "charm" }),
    ],
  },
  {
    id: "hotel",
    name: "Labadi Beach Hotel",
    emoji: "🏨",
    x: 1420,
    y: 1000,
    group: "sea",
    blurb: "The lobby is cold on purpose. You can hear the sea behind the glass.",
    actions: [
      eat({ id: "lobby", label: "Borrow the AC", detail: "You are not a guest. The air conditioner does not check.", minutes: 30, cost: 20, effects: { energy: 10, fun: 8, hygiene: 4 } }),
      eat({ id: "lunch", label: "Seaside lunch", detail: "A proper plate. You sit up straighter.", minutes: 55, cost: 70, effects: { hunger: 36, fun: 10, social: 6 }, tag: "food" }),
    ],
  },
  {
    id: "motors",
    name: "Japan Motors",
    emoji: "🚘",
    x: 480,
    y: 920,
    group: "work",
    blurb: "Airport road energy. New cars, and a lot of people just looking.",
    actions: [
      eat({ id: "look-car", label: "Look at a car", detail: "One day. You touch the steering wheel anyway.", minutes: 20, effects: { fun: 10 } }),
      eat({ id: "prices", label: "Talk prices", detail: "You learn what a dream costs this month.", minutes: 25, effects: { social: 6 }, skill: "hustle" }),
    ],
  },
  {
    id: "bojo",
    name: "Bojo Beach",
    emoji: "⛵",
    x: 1180,
    y: 760,
    group: "sea",
    blurb: "Bojo. A short canoe across the channel, then a quieter beach.",
    actions: [
      eat({ id: "cruise", label: "Take the boat", detail: "The city shrinks. Somebody starts a song.", minutes: 90, cost: 40, effects: { fun: 30, energy: -8, social: 10 }, social: true }),
      eat({ id: "lagoon", label: "Watch the lagoon", detail: "Sit by the jetty and let the hour go.", minutes: 25, effects: { fun: 14, energy: 4 } }),
    ],
  },
  {
    id: "golf",
    name: "Achimota Golf",
    emoji: "⛳",
    x: 1760,
    y: 560,
    group: "sea",
    blurb: "Wide grass inside the city. You can walk it even if you do not own a club.",
    actions: [
      eat({ id: "fairway", label: "Walk the course", detail: "You did not golf. The grass still did its job.", minutes: 60, cost: 30, effects: { fun: 16, energy: -8 } }),
      eat({ id: "clubhouse", label: "Clubhouse water", detail: "Cold water and a chair in the shade.", minutes: 15, cost: 10, effects: { energy: 6, hygiene: 4 } }),
    ],
  },
  {
    id: "court",
    name: "High Court",
    emoji: "⚖️",
    x: 640,
    y: 760,
    group: "civic",
    blurb: "Black gowns, a slow ceiling fan, and cases that started before some of the lawyers.",
    actions: [
      eat({ id: "case", label: "Watch a case", detail: "You follow half of it. The other half is Latin and patience.", minutes: 40, effects: { fun: 6, social: 4, energy: -4 } }),
      eat({ id: "court-steps", label: "Sit on the steps", detail: "Lawyers eat lunch here like everybody else.", minutes: 20, effects: { energy: 4, social: 6 }, social: true }),
    ],
  },
  {
    id: "legon",
    name: "University of Ghana",
    emoji: "🎓",
    x: 1360,
    y: 200,
    group: "work",
    blurb: "Legon. Balme Library, campus jollof, and a hill that keeps you honest.",
    actions: [
      eat({ id: "balme", label: "Read in Balme", detail: "Silence, air conditioning, and a chapter you actually finish.", minutes: 60, effects: { energy: -6, fun: -2 }, skill: "coding" }),
      eat({ id: "campus-jollof", label: "Campus jollof", detail: "The plate is full. The price still feels like student life.", minutes: 25, cost: 12, effects: { hunger: 28, social: 6 }, tag: "food", social: true }),
    ],
  },
  {
    id: "still",
    name: "Still Space",
    emoji: "🫶🏾",
    x: 1080,
    y: 250,
    group: "hang",
    blurb: "Labone. A quiet room when the group chat is too loud.",
    actions: [
      eat({ id: "breathe", label: "Sit and breathe", detail: "Twenty quiet minutes. Accra can wait outside.", minutes: 30, cost: 20, effects: { fun: 18, energy: 10 } }),
      eat({ id: "journal", label: "Write it down", detail: "You put the week on paper so it stops spinning.", minutes: 20, effects: { fun: 10, social: 4 } }),
    ],
  },
  {
    id: "stadium",
    name: "Accra Stadium",
    emoji: "🏟️",
    x: 860,
    y: 160,
    group: "hang",
    blurb: "Ohene Djan. The stands know every anthem and every argument.",
    actions: [
      eat({ id: "jog", label: "Jog the stands", detail: "Empty seats, your own pace.", minutes: 30, effects: { energy: -12, hygiene: -10, fun: 6 }, skill: "fitness", tag: "gym" }),
      eat({ id: "matchday", label: "Match day", detail: "Flags, horns, and a goal that lifts the whole bowl.", minutes: 110, cost: 20, effects: { fun: 32, social: 18, hunger: -10, bladder: -12 }, social: true }),
    ],
  },
  ...ACCRA_SPOTS,
  { id: "kotoka", name: "Kotoka Airport", emoji: "✈️", x: 180, y: 520, group: "soon", blurb: "Coming soon.", soon: true, actions: [] },
  { id: "tema", name: "Tema Port", emoji: "🚢", x: 140, y: 1160, group: "soon", blurb: "Coming soon.", soon: true, actions: [] },
];

export const SHOP_CATEGORIES = [
  { id: "design", label: "Design" },
  { id: "sleep", label: "Sleep" },
  { id: "kitchen", label: "Kitchen" },
  { id: "bath", label: "Bath" },
  { id: "comfort", label: "Comfort" },
  { id: "fun", label: "Fun" },
  { id: "skills", label: "Skills" },
  { id: "light", label: "Light" },
] as const;

export type ShopCategory = (typeof SHOP_CATEGORIES)[number]["id"];
export type ShopKind = "chair" | "sofa" | "bed" | "table" | "fan" | "ac" | "box" | "food" | "lamp";

export type ShopItem = {
  id: string;
  name: string;
  price: number;
  detail: string;
  consume?: boolean;
  category: ShopCategory;
  size: string;
  stars: number;
  color: string;
  kind: ShopKind;
};

export const SHOP: ShopItem[] = [
  { id: "kente", name: "Kente throw", price: 80, detail: "A cloth for the wall. The room looks like somebody lives here.", category: "design", size: "wall", stars: 2, color: "#c4563a", kind: "box" },
  { id: "mattress", name: "Thicker mattress", price: 480, detail: "Sleep gives more of you back.", category: "sleep", size: "2×1", stars: 3, color: "#6d4aff", kind: "bed" },
  { id: "pillow", name: "Extra pillow", price: 40, detail: "One more place to put your head.", category: "sleep", size: "1×1", stars: 1, color: "#f4efe6", kind: "box" },
  { id: "pan", name: "Good cooking pot", price: 150, detail: "Home jollof fills the plate properly.", category: "kitchen", size: "1×1", stars: 2, color: "#8d5a32", kind: "box" },
  { id: "kenkey", name: "Kenkey and fish", price: 20, detail: "Eat it now. Pepper included.", consume: true, category: "kitchen", size: "1×1", stars: 2, color: "#e7c85a", kind: "food" },
  { id: "bucket", name: "Bath bucket", price: 35, detail: "For the mornings the shower is a rumour.", category: "bath", size: "1×1", stars: 1, color: "#3d7ea6", kind: "box" },
  { id: "chair", name: "Plastic chair", price: 40, detail: "The red one. Every compound has one.", category: "comfort", size: "1×1", stars: 1, color: "#d64545", kind: "chair" },
  { id: "sofa", name: "Velvet sofa", price: 180, detail: "Guests stop standing in the doorway.", category: "comfort", size: "2×1", stars: 2, color: "#1f8a70", kind: "sofa" },
  { id: "family", name: "Family sofa", price: 420, detail: "Three people, one remote, no argument about the seat.", category: "comfort", size: "3×1", stars: 3, color: "#c4844a", kind: "sofa" },
  { id: "leather", name: "Black leather sofa", price: 680, detail: "Looks like a promotion even when the lights are off.", category: "comfort", size: "2×1", stars: 3, color: "#1c1c1c", kind: "sofa" },
  { id: "gold", name: "Royal sofa", price: 1100, detail: "Too much sofa for the room. That is the point.", category: "comfort", size: "2×1", stars: 4, color: "#8b1e3f", kind: "sofa" },
  { id: "armchair", name: "Lounge armchair", price: 240, detail: "The corner where the day ends.", category: "comfort", size: "1×1", stars: 2, color: "#f3e2b0", kind: "chair" },
  { id: "fan", name: "Standing fan", price: 180, detail: "The heat leaves the room before you do.", category: "comfort", size: "1×1", stars: 2, color: "#d7e7f4", kind: "fan" },
  { id: "dining", name: "Dining table", price: 320, detail: "A place for jollof that is not the bed.", category: "comfort", size: "2×2", stars: 2, color: "#e7c9a0", kind: "table" },
  { id: "ac", name: "Split air conditioner", price: 1200, detail: "East Legon weather, rented by the hour of current.", category: "comfort", size: "wall", stars: 4, color: "#f7f7f7", kind: "ac" },
  { id: "speaker", name: "Bluetooth speaker", price: 220, detail: "The radio gets sweeter, and the corridor will know.", category: "fun", size: "1×1", stars: 2, color: "#1d2433", kind: "box" },
  { id: "book", name: "Exam past questions", price: 60, detail: "A stack that makes the coding and the hustle less guesswork.", category: "skills", size: "1×1", stars: 2, color: "#2f6fed", kind: "box" },
  { id: "bulb", name: "Rechargeable bulb", price: 25, detail: "A small sun for when ECG takes the evening.", category: "light", size: "wall", stars: 1, color: "#fff4c2", kind: "lamp" },
  { id: "generator", name: "Small generator", price: 900, detail: "Dumsor becomes a story instead of a blackout.", category: "light", size: "1×1", stars: 3, color: "#355f86", kind: "box" },
];

const PEOPLE = ["Kojo", "Abena", "Efua", "Yaw", "Selorm", "Maame", "Akua", "Nana", "Esi", "Kweku", "Adjoa", "Fiifi"];

export function peopleAt(id: string) {
  let hash = 0;
  for (const char of id) hash = (hash * 33 + char.charCodeAt(0)) % 997;
  return [0, 1, 2].map((step) => PEOPLE[(hash + step * 4) % PEOPLE.length]);
}

export function birthById(id: string) {
  return BIRTHS.find((birth) => birth.id === id) ?? BIRTHS[0];
}

export function homeById(id: string) {
  return HOMES.find((home) => home.id === id) ?? HOMES[2];
}

export function spotById(id: string) {
  return SPOTS.find((spot) => spot.id === id) ?? SPOTS[0];
}

export function rollBirth() {
  const bag = ["susu", "susu", "family", "market", "pastor", "returnee"];
  return birthById(bag[Math.floor(Math.random() * bag.length)]);
}

export function cedis(value: number) {
  const sign = value < 0 ? "-" : "";
  return `${sign}₵${Math.abs(Math.round(value)).toLocaleString("en-GH")}`;
}

export function dayIndex(minutes: number) {
  return Math.floor(minutes / 1440);
}

export function realMinutes(at = Date.now()) {
  return Math.floor(at / 60000);
}

export function accraHour(at = new Date()) {
  const hour = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Accra",
    hour: "2-digit",
    hourCycle: "h23",
  }).format(at);
  return Number(hour);
}

export function accraDateLabel(at = new Date()) {
  return new Intl.DateTimeFormat("en-GH", {
    timeZone: "Africa/Accra",
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(at);
}

export function clockLabel(_minutes?: number, at = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GH", {
    timeZone: "Africa/Accra",
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).formatToParts(at);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("weekday")} ${part("day")} ${part("month")} · ${part("hour")}:${part("minute")} ${part("dayPeriod").toUpperCase()}`;
}

export function hourOf(minutes: number) {
  return Math.floor((minutes % 1440) / 60);
}

export function moodOf(needs: Needs) {
  const average = (needs.hunger + needs.energy + needs.fun + needs.social + needs.hygiene + needs.bladder) / 6;
  if (average >= 75) return { emoji: "🙂", label: "Happy" };
  if (average >= 55) return { emoji: "😐", label: "Okay" };
  if (average >= 35) return { emoji: "😣", label: "Stressed" };
  return { emoji: "😩", label: "Drained" };
}

export function clampNeed(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function clone(life: Life): Life {
  return {
    ...life,
    look: { ...life.look },
    traits: [...life.traits],
    needs: { ...life.needs },
    skills: { ...life.skills },
    inventory: [...life.inventory],
    log: [...life.log],
    inbox: [...life.inbox],
    relations: life.relations.map((person) => ({ ...person })),
  };
}

function pushLog(life: Life, line: string) {
  life.log = [line, ...life.log].slice(0, 14);
  life.inbox = [line, ...life.inbox].slice(0, 20);
}

export function freshLife(input: { look: Look; traits: string[]; dream: string; birthId: string; homeId: string }): Life {
  const birth = birthById(input.birthId);
  const home = homeById(input.homeId);
  const life: Life = {
    look: input.look,
    traits: input.traits,
    dream: input.dream,
    birthId: birth.id,
    homeId: home.id,
    needs: {
      hunger: 72,
      energy: 82,
      fun: 68,
      social: clampNeed(58 + birth.socialBonus),
      hygiene: 76,
      bladder: 80,
    },
    cash: birth.cash + 40,
    loan: birth.loan,
    weeklyLoan: birth.weeklyLoan,
    learn: birth.learn,
    minutes: realMinutes(),
    skills: {
      hustle: birth.hustle,
      cooking: birth.cooking,
      music: 0,
      fitness: 0,
      charm: birth.charm,
      coding: input.traits.includes("tech") ? 1 : 0,
      career: 0,
    },
    where: "home",
    inventory: ["bed", "cooler", "stove"],
    log: [`You have the key to ${home.name} in ${home.area}.`, "Your cousin sent ₵40. Buy kenkey, don't starve."],
    inbox: ["Welcome to Accra. The city is already moving — keep your needs up and your name clean."],
    relations: [{ name: home.neighbor, score: 16 }],
    funded: false,
    lastRentAt: -1,
    outageCheckedDay: -1,
    dumsor: false,
    gemDay: -1,
  };
  return life;
}

export type StepResult = { life: Life; notes: string[]; error?: string };

export function passTime(life: Life, minutes: number, mode: "awake" | "sleep" = "awake"): StepResult {
  const next = clone(life);
  const from = next.minutes;
  const to = from + minutes;
  const hours = minutes / 60;
  if (mode === "awake") {
    next.needs.hunger = clampNeed(next.needs.hunger - 5 * hours);
    next.needs.energy = clampNeed(next.needs.energy - (next.traits.includes("lazy") ? 2.2 : 3.4) * hours);
    const bored = next.traits.includes("outout") || next.traits.includes("night") ? 4.6 : 2.6;
    next.needs.fun = clampNeed(next.needs.fun - bored * hours);
    next.needs.social = clampNeed(next.needs.social - 2 * hours);
    next.needs.hygiene = clampNeed(next.needs.hygiene - (next.traits.includes("fresh") ? 1.4 : 3) * hours);
    next.needs.bladder = clampNeed(next.needs.bladder - 6.5 * hours);
  } else {
    next.needs.hunger = clampNeed(next.needs.hunger - 2.4 * hours);
    next.needs.hygiene = clampNeed(next.needs.hygiene - 1.1 * hours);
    next.needs.bladder = clampNeed(next.needs.bladder - 2.2 * hours);
  }
  const real = from >= 1_000_000;
  const clockTo = real ? realMinutes() : to;
  next.minutes = clockTo;
  const notes = settleBills(next, real ? Math.min(from, clockTo) : from, clockTo);
  const hour = real ? accraHour() : hourOf(clockTo);
  const day = dayIndex(clockTo);
  if (hour >= 5 && hour < 19) next.dumsor = false;
  if ((hour >= 19 || hour < 5) && next.outageCheckedDay !== day) {
    next.outageCheckedDay = day;
    next.dumsor = !next.inventory.includes("generator") && day % 2 === 1;
    if (next.dumsor) notes.push("Dumsor. The meter just sighed.");
  }
  return { life: next, notes };
}

function settleBills(life: Life, from: number, to: number) {
  const notes: string[] = [];
  const start = dayIndex(from);
  const end = dayIndex(to);
  for (let day = start + 1; day <= end; day += 1) {
    if (new Date(day * 86400000).getUTCDay() !== 6 || life.lastRentAt === day) continue;
    life.lastRentAt = day;
    const rent = homeById(life.homeId).rent;
    const loanPay = Math.min(life.loan, life.weeklyLoan);
    life.cash -= rent + loanPay;
    life.loan -= loanPay;
    if (life.loan <= 0) {
      life.loan = 0;
      life.weeklyLoan = 0;
    }
    notes.push(`Saturday bill: rent ${cedis(rent)}${loanPay ? ` and susu ${cedis(loanPay)}` : ""}.`);
    if (life.cash < 0) notes.push("The wallet is in the red. Rent still left.");
  }
  return notes;
}

function gainSkill(life: Life, skill: keyof Skills, verb: Verb) {
  let amount = 1;
  if (life.traits.includes("musical") && skill === "music") amount += 1;
  if (life.traits.includes("foodie") && skill === "cooking") amount += 1;
  if (life.traits.includes("gym") && skill === "fitness") amount += 1;
  if (life.traits.includes("tech") && skill === "coding") amount += 1;
  if (life.traits.includes("hustler") && (skill === "hustle" || skill === "career")) amount += 1;
  if (life.traits.includes("smooth") && skill === "charm") amount += 1;
  if (life.learn > 1 && Math.random() < life.learn - 1) amount += 1;
  life.skills[skill] = Math.min(10, life.skills[skill] + amount);
  if (verb.job && skill !== "career") life.skills.career = Math.min(10, life.skills.career + 1);
}

export function careerLevel(life: Life) {
  return Math.min(5, 1 + Math.floor(life.skills.career / 3));
}

export const RIDES = [
  { id: "trek", label: "Trek", cost: 0, minutes: 40 },
  { id: "trotro", label: "Trotro", cost: 5, minutes: 25 },
  { id: "okada", label: "Okada", cost: 12, minutes: 14 },
  { id: "taxi", label: "Taxi", cost: 28, minutes: 12 },
] as const;

export type Ride = (typeof RIDES)[number];

export function goTo(life: Life, placeId: string, ride: Ride = RIDES[1]): StepResult {
  if (life.where === placeId) return { life, notes: [] };
  if (ride.cost > 0 && life.cash < ride.cost) return { life, notes: [], error: `You need ${cedis(ride.cost)} for ${ride.label.toLowerCase()}.` };
  const timed = passTime({ ...clone(life), cash: life.cash - ride.cost }, ride.minutes);
  timed.life.where = placeId;
  const fare = ride.cost ? ` ${cedis(ride.cost)}.` : ".";
  timed.notes.unshift(`${ride.label} to ${spotById(placeId).name}${fare}`);
  return timed;
}

export function runVerb(life: Life, verb: Verb, placeId = life.where, withName?: string): StepResult {
  const moved = goTo(life, placeId);
  if (moved.error) return moved;
  const next = clone(moved.life);
  const notes = [...moved.notes];
  if (verb.id === "radio" && next.dumsor && !next.inventory.includes("generator")) {
    return { life: next, notes, error: "The radio is quiet. Dumsor took the socket." };
  }
  if (verb.special === "gem" && next.gemDay === dayIndex(next.minutes)) {
    return { life: next, notes, error: "You already found today's gem." };
  }
  let cost = verb.cost;
  if (verb.tag === "food" && next.birthId === "market") cost = Math.round(cost * 0.7);
  if (cost > 0 && next.cash < cost) return { life: next, notes, error: "Wallet light. Make some money first." };
  const timed = passTime(next, verb.minutes, verb.id === "sleep" ? "sleep" : "awake");
  const after = timed.life;
  notes.push(...timed.notes);
  after.cash -= cost;
  let earn = verb.earn;
  if (verb.job) {
    earn *= careerLevel(after);
    if (after.traits.includes("hustler")) earn = Math.round(earn * 1.15);
    if (after.traits.includes("lazy")) earn = Math.round(earn * 0.85);
  }
  after.cash += earn;
  const boost = actionBoost(after, verb);
  (Object.keys(verb.effects) as NeedKey[]).forEach((key) => {
    const delta = verb.effects[key] ?? 0;
    const shaped = delta > 0 ? delta * boost : delta;
    after.needs[key] = clampNeed(after.needs[key] + shaped);
  });
  if (verb.id === "sleep") {
    const bonus = (after.inventory.includes("mattress") ? 14 : 0) + homeById(after.homeId).comfort;
    after.needs.energy = clampNeed(after.needs.energy + bonus);
  }
  if (verb.id === "cook" && after.inventory.includes("pan")) after.needs.hunger = clampNeed(after.needs.hunger + 12);
  if (verb.id === "radio" && after.inventory.includes("speaker")) after.needs.fun = clampNeed(after.needs.fun + 12);
  if (verb.id === "kenkey") after.needs.hunger = clampNeed(after.needs.hunger + 34);
  if (verb.skill) gainSkill(after, verb.skill, verb);
  if (verb.social) {
    const name = withName || (placeId === "home" ? homeById(after.homeId).neighbor : peopleAt(placeId)[0]);
    const bump = after.traits.includes("smooth") ? 16 : 12;
    const known = after.relations.find((person) => person.name === name);
    if (known) known.score = Math.min(100, known.score + bump);
    else after.relations.push({ name, score: bump });
  }
  if (verb.special === "pitch") {
    if (after.funded) notes.push("You already have a term sheet. Go build the thing.");
    else if (after.skills.coding < 4) notes.push("They liked the story. They want a prototype. Build the skill at the hub.");
    else {
      after.funded = true;
      after.cash += 8000;
      notes.push("Funded. ₵8,000 lands. Legon unicorn, loading.");
    }
  }
  if (verb.special === "gem") {
    after.gemDay = dayIndex(after.minutes);
    after.cash += 40;
    notes.push("A gem in the gutter. ₵40.");
  }
  pushLog(after, verb.detail);
  return { life: after, notes: [verb.label, ...notes.filter(Boolean)] };
}

function actionBoost(life: Life, verb: Verb) {
  let boost = 1;
  if (verb.tag === "food" && life.traits.includes("foodie")) boost += 0.25;
  if (verb.tag === "party" && (life.traits.includes("outout") || life.traits.includes("night"))) boost += 0.35;
  if (verb.tag === "gym" && life.traits.includes("gym")) boost += 0.35;
  if (verb.social && life.traits.includes("smooth")) boost += 0.2;
  if (verb.tag === "church" && life.birthId === "pastor") boost += 0.25;
  return boost;
}

export function buyItem(life: Life, itemId: string): StepResult {
  const item = SHOP.find((entry) => entry.id === itemId);
  if (!item) return { life, notes: [], error: "That item is gone." };
  if (!item.consume && life.inventory.includes(item.id)) return { life, notes: [], error: "You already own that." };
  if (life.cash < item.price) return { life, notes: [], error: "Not enough cedis." };
  if (item.consume) {
    return runVerb({ ...clone(life) }, eat({ id: "kenkey", label: "Kenkey and fish", detail: item.detail, minutes: 15, cost: item.price, effects: { hunger: 34, fun: 4 }, tag: "food" }), life.where);
  }
  const next = clone(life);
  next.cash -= item.price;
  next.inventory = [...next.inventory, item.id];
  if (item.id === "generator") next.dumsor = false;
  pushLog(next, `Bought ${item.name}.`);
  return { life: next, notes: [`${item.name} is yours.`] };
}

export function repayLoan(life: Life): StepResult {
  if (life.loan <= 0) return { life, notes: [], error: "No susu hanging over you." };
  const amount = Math.min(life.loan, Math.max(life.weeklyLoan, 120), life.cash);
  if (amount <= 0) return { life, notes: [], error: "The wallet cannot cover a payment." };
  const next = clone(life);
  next.cash -= amount;
  next.loan -= amount;
  if (next.loan <= 0) {
    next.loan = 0;
    next.weeklyLoan = 0;
  }
  pushLog(next, `Paid ${cedis(amount)} off the susu.`);
  return { life: next, notes: [`Susu payment ${cedis(amount)}.`] };
}

export function gemSpotId(minutes: number) {
  const pool = SPOTS.filter((spot) => !spot.soon && spot.id !== "home");
  return pool[dayIndex(minutes) % pool.length]?.id ?? "beach";
}

export function questFor(life: Life) {
  if (life.needs.hunger < 55) return { title: "Eat something", detail: "Tap the cooler or the stove" };
  if (life.needs.bladder < 35) return { title: "Find a toilet", detail: "Your bladder is filing a complaint" };
  if (life.needs.energy < 40) return { title: "Rest your body", detail: "The bed is right there" };
  if (life.gemDay !== dayIndex(life.minutes)) {
    const spot = spotById(gemSpotId(life.minutes));
    return { title: "Daily gem hunt", detail: `Look around ${spot.name}` };
  }
  return { title: "Step outside", detail: "Accra is moving. Go meet it." };
}

export function dreamStatus(life: Life) {
  if (life.dream === "oga") return { label: "Career level", current: careerLevel(life), max: 5 };
  if (life.dream === "landlord") return { label: "Net worth", current: Math.max(0, Math.min(25000, life.cash - life.loan)), max: 25000 };
  if (life.dream === "star") return { label: "Music", current: life.skills.music, max: 10 };
  if (life.dream === "padi") return { label: "Close friends", current: Math.min(4, life.relations.filter((person) => person.score >= 70).length), max: 4 };
  return { label: life.funded ? "Funded" : "Coding", current: life.funded ? 1 : Math.min(4, life.skills.coding), max: life.funded ? 1 : 4 };
}

export const KENKEY_VERB = eat({
  id: "kenkey",
  label: "Kenkey and fish",
  detail: "Pepper included.",
  minutes: 15,
  cost: 20,
  effects: { hunger: 34, fun: 4 },
  tag: "food",
});

export function handleOf(name: string) {
  const words = name
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, "")
    .split(/\s+/)
    .filter(Boolean);
  const first = words[0] ?? "accra";
  const last = words.length > 1 ? words[words.length - 1] : "";
  const handle = last && last !== first ? `${first}_${last}` : first;
  return `@${handle.slice(0, 16)}`;
}

export function meetPerson(life: Life, name: string): StepResult {
  const next = clone(life);
  if (!next.relations.some((person) => person.name === name)) next.relations.push({ name, score: 8 });
  return { life: next, notes: [] };
}

function bumpRelation(life: Life, name: string, amount: number) {
  const known = life.relations.find((person) => person.name === name);
  if (known) known.score = Math.min(100, known.score + amount);
  else life.relations.push({ name, score: Math.min(100, amount) });
}

export function giftCash(life: Life, name: string, amount: number): StepResult {
  const value = Math.round(amount);
  if (!Number.isFinite(value) || value < 1) return { life, notes: [], error: "Enter an amount in cedis." };
  if (value > life.cash) return { life, notes: [], error: `MoMo cannot cover ${cedis(value)}. You have ${cedis(life.cash)}.` };
  const next = clone(life);
  next.cash -= value;
  next.needs.social = clampNeed(next.needs.social + 4);
  bumpRelation(next, name, 6);
  pushLog(next, `You sent ${cedis(value)} to ${handleOf(name)}.`);
  return { life: next, notes: [`${handleOf(name)} has the ${cedis(value)}.`] };
}

export function receiveCash(life: Life, from: string, amount: number) {
  const next = clone(life);
  next.cash += Math.round(amount);
  pushLog(next, `${from} sent you ${cedis(amount)}.`);
  return next;
}

export function spareChange(life: Life, name: string): StepResult {
  const handle = handleOf(name);
  if (life.inbox.some((line) => line.includes(`${handle} sent you`))) {
    return { life, notes: [], error: "I already sent you something. Go and work small." };
  }
  const person = life.relations.find((entry) => entry.name === name);
  if (!person || person.score < 40) return { life, notes: [], error: "My MoMo is dry. I no get am." };
  const gift = 15;
  const next = clone(life);
  next.cash += gift;
  pushLog(next, `${handle} sent you ${cedis(gift)}.`);
  return { life: next, notes: [`${handle} sent you ${cedis(gift)}.`] };
}

export function treatPerson(life: Life, name: string): StepResult {
  const cost = 18;
  if (life.cash < cost) return { life, notes: [], error: "Food money no dey." };
  const next = clone(life);
  next.cash -= cost;
  next.needs.hunger = clampNeed(next.needs.hunger + 8);
  next.needs.social = clampNeed(next.needs.social + 10);
  bumpRelation(next, name, 8);
  pushLog(next, `You bought food for ${handleOf(name)}.`);
  return { life: next, notes: [`Waakye is on the way to ${name}.`] };
}

export function invitePerson(life: Life, name: string): StepResult {
  const next = clone(life);
  next.needs.social = clampNeed(next.needs.social + 12);
  bumpRelation(next, name, 10);
  pushLog(next, `${name} is coming over.`);
  return { life: next, notes: [`${name} is on the way. Clear a chair.`] };
}

export function visitPerson(life: Life, name: string): StepResult {
  if (life.cash < 5) return { life, notes: [], error: "Trotro fare is ₵5." };
  const next = clone(life);
  next.cash -= 5;
  next.minutes += 25;
  next.needs.social = clampNeed(next.needs.social + 14);
  next.needs.fun = clampNeed(next.needs.fun + 6);
  next.needs.energy = clampNeed(next.needs.energy - 4);
  bumpRelation(next, name, 8);
  pushLog(next, `You visited ${name}.`);
  return { life: next, notes: [`You sat with ${name}. Trotro was ₵5.`] };
}

export function huntGem(life: Life): StepResult {
  const spot = gemSpotId(life.minutes);
  if (life.where !== spot) return { life, notes: [], error: `Today's gem is at ${spotById(spot).name}.` };
  return runVerb(life, eat({ id: "gem", label: "Search for the gem", detail: "Eyes down.", minutes: 15, effects: { fun: 4 }, special: "gem" }), spot);
}
