import { HOME_VERBS, SHOP, type Life, type ShopItem, type Verb } from "@/lib/game/world";

export type ItemCard = { emoji: string; name: string; detail: string; verbs: Verb[] };

export type FixtureId = "bed" | "chair" | "radio" | "cooler" | "stove" | "toilet" | "shower";

const act = (partial: Partial<Verb> & Pick<Verb, "id" | "label" | "detail">): Verb => ({
  minutes: 20,
  cost: 0,
  earn: 0,
  effects: {},
  ...partial,
});

const home = (id: string) => HOME_VERBS.find((verb) => verb.id === id)!;

const EMOJI: Partial<Record<ShopItem["kind"], string>> = {
  chair: "🪑",
  sofa: "🛋️",
  bed: "🛏️",
  table: "🍽️",
  fan: "🌀",
  ac: "❄️",
  lamp: "💡",
  fridge: "🧊",
  stove: "🔥",
  sink: "🚰",
  toilet: "🚽",
  shower: "🚿",
  tv: "📺",
  desk: "💻",
  guitar: "🎸",
  weights: "🏋️",
  plant: "🪴",
  rug: "🟥",
  curtain: "🪞",
  tank: "🐠",
  statue: "🦁",
  dog: "🐕",
  cat: "🐈",
  bird: "🦜",
  throne: "👑",
  painting: "🖼️",
  vault: "🏦",
  jet: "🛩️",
};

const ID_EMOJI: Record<string, string> = {
  kente: "🧣",
  pillow: "🛌",
  pan: "🍲",
  bucket: "🪣",
  "bowl-set": "🪣",
  speaker: "🔊",
  transistor: "📻",
  book: "📚",
  generator: "⚡",
  "yellow-gen": "⚡",
  solar: "☀️",
  curtains: "🪟",
  coffee: "☕",
};

const BY_ID: Record<string, Verb[]> = {
  kente: [
    act({ id: "kente-admire", label: "Admire the weave", detail: "Red, gold and green, counted thread by thread.", minutes: 10, effects: { fun: 8 } }),
    act({ id: "kente-wrap", label: "Wrap up for a photo", detail: "One shoulder, chin up. The status will do numbers.", minutes: 15, effects: { fun: 10, social: 6 } }),
  ],
  pillow: [
    act({ id: "pillow-rest", label: "Rest your head", detail: "Ten minutes that turn into forty.", minutes: 40, effects: { energy: 14 }, sleep: true }),
    act({ id: "pillow-fight", label: "Pillow fight", detail: "Nobody wins. Everybody laughs.", minutes: 10, effects: { fun: 14, energy: -4 } }),
  ],
  pan: [
    act({ id: "pan-lightsoup", label: "Cook light soup", detail: "Goat, garden eggs, and pepper that clears the sinuses.", minutes: 60, effects: { hunger: 46, fun: 6 }, skill: "cooking", pantry: 1, tag: "food" }),
    act({ id: "pan-kelewele", label: "Fry kelewele", detail: "Ginger, pepper, ripe plantain. The corridor follows the smell.", minutes: 25, effects: { hunger: 24, fun: 10 }, skill: "cooking", pantry: 1, tag: "food" }),
  ],
  bucket: [
    act({ id: "bucket-bath", label: "Bucket bath", detail: "Cup, bucket, done. Old school still works.", minutes: 15, effects: { hygiene: 42 } }),
    act({ id: "bucket-wash", label: "Wash clothes", detail: "Soap, a scrubbing board, and the line in the yard.", minutes: 40, effects: { hygiene: 12, fun: -4, energy: -4 } }),
  ],
  "bowl-set": [
    act({ id: "bowl-bath", label: "Bucket bath", detail: "Warm water from the kettle, the red bowl for scooping.", minutes: 15, effects: { hygiene: 40 } }),
    act({ id: "bowl-feet", label: "Wash your feet", detail: "Dust from the road, gone before bed.", minutes: 5, effects: { hygiene: 10 } }),
  ],
  speaker: [
    act({ id: "speaker-blast", label: "Blast highlife", detail: "Volume up. The corridor gets a free concert.", minutes: 30, effects: { fun: 22 }, skill: "music" }),
    act({ id: "speaker-party", label: "Room party", detail: "Three friends, one speaker, the neighbours eventually join.", minutes: 60, effects: { fun: 24, social: 18, energy: -10 }, social: true, tag: "party" }),
  ],
  transistor: [
    act({ id: "transistor-news", label: "Morning news", detail: "Who said what in Parliament, and the traffic on the motorway.", minutes: 15, effects: { fun: 6, social: 4 } }),
    act({ id: "transistor-highlife", label: "Highlife hour", detail: "Old records and a presenter who knows every one.", minutes: 30, effects: { fun: 16 }, skill: "music" }),
  ],
  book: [
    act({ id: "book-code", label: "Study for coding", detail: "Past questions on loops and logic.", minutes: 45, effects: { fun: -6 }, skill: "coding" }),
    act({ id: "book-biz", label: "Read up on business", detail: "Margins, stock, and why credit kills a kiosk.", minutes: 40, effects: { fun: -4 }, skill: "hustle" }),
  ],
  bulb: [
    act({ id: "bulb-read", label: "Read by the bulb", detail: "The rest of the street is dark. Your page is not.", minutes: 25, effects: { fun: 8 }, skill: "career" }),
    act({ id: "bulb-charge", label: "Charge the bulb", detail: "Plug it in while the current lasts.", minutes: 5, effects: {}, power: true }),
  ],
  generator: [
    act({ id: "gen-service", label: "Service the gen", detail: "Fresh oil, a clean plug, and it starts on the first pull.", minutes: 30, cost: 20, effects: { fun: 4, hygiene: -8 }, skill: "fitness" }),
    act({ id: "gen-phones", label: "Charge neighbours' phones", detail: "A power strip at the gate and a small fee per phone.", minutes: 60, earn: 12, perSkill: 3, effects: { social: 10 }, skill: "hustle", social: true, cool: true }),
  ],
  "yellow-gen": [
    act({ id: "ygen-service", label: "Service the gen", detail: "It coughs less after a clean plug.", minutes: 30, cost: 20, effects: { fun: 4, hygiene: -8 }, skill: "fitness" }),
    act({ id: "ygen-phones", label: "Charge neighbours' phones", detail: "Extension board at the gate. A cedi or two each.", minutes: 60, earn: 14, perSkill: 3, effects: { social: 10 }, skill: "hustle", social: true, cool: true }),
  ],
  solar: [
    act({ id: "solar-street", label: "Power the street's phones", detail: "The panels did the work. You hold the extension.", minutes: 60, earn: 18, perSkill: 4, effects: { social: 12 }, skill: "hustle", social: true, cool: true }),
    act({ id: "solar-check", label: "Check the inverter", detail: "Green lights. Full battery. Dumsor can try.", minutes: 10, effects: { fun: 6 } }),
  ],
  "lamp-stand": [
    act({ id: "lamp-read", label: "Read in bed", detail: "One more chapter. Then one more.", minutes: 30, effects: { fun: 10, energy: 2 } }),
    act({ id: "lamp-study", label: "Night study", detail: "The house sleeps. You study.", minutes: 45, effects: { fun: -6, energy: -4 }, skill: "coding" }),
  ],
  "cooler-box": [
    act({ id: "box-drink", label: "Cold malt drink", detail: "Out of the ice, straight into your hand.", minutes: 5, cost: 6, effects: { hunger: 6, fun: 8 }, tag: "food" }),
    act({ id: "box-water", label: "Ice-cold sachet water", detail: "Bite the corner. Instant relief.", minutes: 3, effects: { hunger: 2, energy: 4, bladder: -4 } }),
  ],
  kerosene: [
    act({ id: "kero-tea", label: "Boil water for tea", detail: "Lipton, milk, too much sugar.", minutes: 15, effects: { energy: 8, hunger: 6 }, pantry: 1, tag: "food" }),
    act({ id: "kero-eggs", label: "Fry eggs and bread", detail: "Onions, pepper, two eggs. Breakfast handled.", minutes: 20, effects: { hunger: 26 }, skill: "cooking", pantry: 1, tag: "food" }),
  ],
  "gas-cooker": [
    act({ id: "gas-jollof", label: "Cook party jollof", detail: "Four rings, smoky bottom, enough for tomorrow.", minutes: 50, effects: { hunger: 58, fun: 10 }, skill: "cooking", pantry: 1, tag: "food" }),
    act({ id: "gas-bofrot", label: "Fry bofrot", detail: "Puff-puff, golden and still too hot to hold.", minutes: 40, effects: { hunger: 22, fun: 14 }, skill: "cooking", pantry: 1, tag: "food" }),
    act({ id: "gas-plates", label: "Sell plates at the gate", detail: "Waakye in takeaway packs. The workers queue at six.", minutes: 60, earn: 25, perSkill: 6, effects: { social: 8, energy: -8 }, skill: "cooking", pantry: 2, cool: true }),
  ],
  "double-fridge": [
    act({ id: "fridge-water", label: "Ice-cold water", detail: "From the bottle in the door.", minutes: 3, effects: { energy: 4, hunger: 2 } }),
    act({ id: "fridge-leftover", label: "Leftover jollof", detail: "Better on the second day. Everybody knows.", minutes: 10, effects: { hunger: 32 }, pantry: 1, tag: "food" }),
    act({ id: "fridge-sobolo", label: "Chill sobolo to sell", detail: "Hibiscus, ginger, cloves, bottled and frozen for the corner.", minutes: 90, earn: 20, perSkill: 4, effects: { fun: 4 }, skill: "hustle", pantry: 1, cool: true }),
  ],
  counter: [
    act({ id: "counter-salad", label: "Make fruit salad", detail: "Pineapple, pawpaw, watermelon. Cold and sweet.", minutes: 20, effects: { hunger: 18, fun: 6 }, pantry: 1, tag: "food" }),
    act({ id: "counter-prep", label: "Prep for the week", detail: "Pepper ground, onions chopped, stew in containers.", minutes: 45, effects: { fun: -2 }, skill: "cooking" }),
  ],
  sink: [
    act({ id: "sink-dishes", label: "Wash the dishes", detail: "The pile goes down. Peace returns to the house.", minutes: 20, effects: { hygiene: 8, fun: -4 } }),
    act({ id: "sink-water", label: "Drink a glass of water", detail: "Filtered, or close enough.", minutes: 2, effects: { energy: 2, bladder: -4 } }),
  ],
  wc: [
    act({ id: "wc-use", label: "Use the WC", detail: "A seat, a flush, a closed door.", minutes: 6, effects: { bladder: 70, hygiene: 2 } }),
    act({ id: "wc-scroll", label: "Scroll on the throne", detail: "Five minutes became fifteen. Your legs are asleep.", minutes: 15, effects: { bladder: 60, fun: 8 } }),
  ],
  rain: [
    act({ id: "rain-shower", label: "Rain shower", detail: "Wide head, strong pressure. The day washes off.", minutes: 15, effects: { hygiene: 60, energy: 4 } }),
    act({ id: "rain-sing", label: "Sing in the shower", detail: "Acoustics of a stadium. Audience of one.", minutes: 20, effects: { hygiene: 50, fun: 12 }, skill: "music" }),
  ],
  chair: [
    act({ id: "chair-rest", label: "Sit and rest", detail: "Feet up on the second chair.", minutes: 15, effects: { energy: 6 } }),
    act({ id: "chair-street", label: "Watch the street", detail: "Hawkers, horns, and gist from across the road.", minutes: 20, effects: { fun: 8, social: 6 } }),
  ],
  armchair: [
    act({ id: "arm-paper", label: "Read the papers", detail: "Headlines, the sports page, then the cartoons.", minutes: 20, effects: { fun: 8 } }),
    act({ id: "arm-doze", label: "Doze off", detail: "Eyes closed for a second. An hour later.", minutes: 45, effects: { energy: 14 }, sleep: true }),
  ],
  fan: [
    act({ id: "fan-cool", label: "Cool off", detail: "Face in front of the fan. Speed three.", minutes: 15, effects: { energy: 8, fun: 4 }, power: true }),
    act({ id: "fan-nap", label: "Nap under the fan", detail: "The hum puts you out in minutes.", minutes: 45, effects: { energy: 18 }, sleep: true, power: true }),
  ],
  dining: [
    act({ id: "dining-tea", label: "Tea and bread", detail: "Sugar bread, margarine, tea with milk.", minutes: 15, effects: { hunger: 18, energy: 6 }, pantry: 1, tag: "food" }),
    act({ id: "dining-meal", label: "Sunday family meal", detail: "Rice, stew, fried plantain, everybody at one table.", minutes: 45, effects: { hunger: 42, social: 14 }, pantry: 2, social: true, tag: "food" }),
    act({ id: "dining-gist", label: "Gist on the phone", detail: "Elbows on the table, a long call with the cousins.", minutes: 15, effects: { social: 12 } }),
  ],
  ac: [
    act({ id: "ac-chill", label: "Chill in the AC", detail: "Eighteen degrees. The harmattan cannot reach you.", minutes: 30, effects: { energy: 14, fun: 8 }, power: true }),
    act({ id: "ac-nap", label: "AC nap", detail: "Cold room, warm blanket. Deep sleep.", minutes: 90, effects: { energy: 28 }, sleep: true, power: true }),
  ],
  tv32: [
    act({ id: "tv-news", label: "Watch the news", detail: "Headlines at seven, then the weather.", minutes: 20, effects: { fun: 6 }, power: true }),
    act({ id: "tv-series", label: "Watch a Ghanaian series", detail: "One episode. Then autoplay decides for you.", minutes: 45, effects: { fun: 22 }, power: true }),
    act({ id: "tv-match", label: "Watch the match", detail: "The whole compound in your room for ninety minutes.", minutes: 90, effects: { fun: 28, social: 10 }, power: true, social: true }),
  ],
  tv65: [
    act({ id: "tv-movie", label: "Movie night", detail: "Lights off, popcorn, the big screen.", minutes: 120, effects: { fun: 34, social: 10 }, power: true, social: true }),
    act({ id: "tv-game", label: "Play FIFA", detail: "Black Stars on the controller. Nobody uses Kotoko.", minutes: 40, effects: { fun: 24, energy: -4 }, power: true }),
    act({ id: "tv-big-series", label: "Binge a series", detail: "Three episodes in. It is past midnight.", minutes: 90, effects: { fun: 30, energy: -8 }, power: true }),
  ],
  desk: [
    act({ id: "desk-code", label: "Practice coding", detail: "A tutorial, a bug, and finally a working button.", minutes: 45, effects: { fun: -6 }, skill: "coding" }),
    act({ id: "desk-freelance", label: "Freelance gig", detail: "A landing page for a client in Osu. Paid on delivery.", minutes: 60, earn: 30, perSkill: 10, effects: { fun: -8, energy: -6 }, skill: "coding", cool: true }),
    act({ id: "desk-shop", label: "Run an Instagram shop", detail: "Post the stock, answer DMs, book a rider.", minutes: 30, earn: 15, perSkill: 6, effects: { fun: 4, social: 6 }, skill: "hustle", cool: true }),
    act({ id: "desk-twitter", label: "Scroll Ghana Twitter", detail: "Three trending topics and one argument you stay out of.", minutes: 15, effects: { fun: 10, social: 6 } }),
  ],
  guitar: [
    act({ id: "guitar-chords", label: "Practise highlife chords", detail: "The palm-wine progression, slow, then faster.", minutes: 30, effects: { fun: 8 }, skill: "music" }),
    act({ id: "guitar-compound", label: "Play for the compound", detail: "Kids dance, an auntie sings along.", minutes: 30, effects: { fun: 12, social: 12 }, skill: "music", social: true }),
    act({ id: "guitar-busk", label: "Busk at the gate", detail: "Case open, two songs, a few cedis from passers-by.", minutes: 45, earn: 8, perSkill: 5, effects: { social: 8, energy: -4 }, skill: "music", cool: true }),
  ],
  weights: [
    act({ id: "weights-lift", label: "Lift", detail: "Three sets, then a fourth to prove a point.", minutes: 30, effects: { fun: 4, energy: -10, hygiene: -10 }, skill: "fitness", tag: "gym" }),
    act({ id: "weights-hiit", label: "Quick workout", detail: "Burpees between the bed and the door.", minutes: 15, effects: { energy: -6, hygiene: -8 }, skill: "fitness", tag: "gym" }),
  ],
  coffee: [
    act({ id: "coffee-tea", label: "Tea and gist", detail: "Two cups on the glass and the latest from the street.", minutes: 20, effects: { social: 12, fun: 6 }, social: true }),
    act({ id: "coffee-ludo", label: "Play Ludo", detail: "Friendship on the line over four coloured tokens.", minutes: 30, effects: { fun: 16, social: 6 } }),
  ],
  plant: [
    act({ id: "plant-water", label: "Water the plant", detail: "A cup of water. A new leaf next week.", minutes: 5, effects: { fun: 4 } }),
    act({ id: "plant-talk", label: "Talk to the plant", detail: "It listens better than most people.", minutes: 10, effects: { fun: 6, social: 2 } }),
  ],
  rug: [
    act({ id: "rug-stretch", label: "Stretch on the rug", detail: "Back cracks, shoulders loosen.", minutes: 15, effects: { energy: 6 }, skill: "fitness" }),
    act({ id: "rug-dance", label: "Dance on the rug", detail: "Azonto with nobody watching.", minutes: 12, effects: { fun: 14, energy: -4 } }),
  ],
  mirror: [
    act({ id: "mirror-fit", label: "Check the fit", detail: "Turn left, turn right, approve.", minutes: 5, effects: { fun: 4 }, skill: "charm" }),
    act({ id: "mirror-lines", label: "Practise your lines", detail: "The interview answer, the date opener, the price you will not drop.", minutes: 15, effects: { social: 4 }, skill: "charm" }),
  ],
  curtains: [
    act({ id: "curtain-draw", label: "Draw the curtains", detail: "The afternoon sun stays outside.", minutes: 5, effects: { energy: 6 } }),
    act({ id: "curtain-light", label: "Let the morning in", detail: "Silk back, light across the floor.", minutes: 5, effects: { fun: 6 } }),
  ],
  aquarium: [
    act({ id: "fish-feed", label: "Feed the fish", detail: "A pinch of flakes. Everybody rushes up.", minutes: 5, cost: 3, effects: { fun: 8 } }),
    act({ id: "fish-watch", label: "Watch the fish", detail: "Bubbles, blue light, slow minds.", minutes: 20, effects: { fun: 12, energy: 6 } }),
  ],
  lion: [
    act({ id: "lion-polish", label: "Polish the lion", detail: "Gold should shine. This one does.", minutes: 15, effects: { fun: 10 } }),
    act({ id: "lion-show", label: "Show it to guests", detail: "Everybody takes a photo. Nobody asks the price.", minutes: 20, effects: { social: 18, fun: 10 }, social: true }),
  ],
  bingo: [
    act({ id: "dog-walk", label: "Walk Bingo", detail: "Round the block twice. He greets every gate.", minutes: 30, effects: { fun: 14, energy: -6, hygiene: -4 }, skill: "fitness" }),
    act({ id: "dog-feed", label: "Feed Bingo", detail: "Rice, fish, and the bone he was hoping for.", minutes: 5, cost: 8, effects: { fun: 6 } }),
    act({ id: "dog-fetch", label: "Play fetch", detail: "The ball. The ball. The ball again.", minutes: 15, effects: { fun: 16, energy: -4 } }),
  ],
  mimi: [
    act({ id: "cat-pet", label: "Pet Mimi", detail: "Purring on your lap. You cannot move now.", minutes: 10, effects: { fun: 10, energy: 4 } }),
    act({ id: "cat-feed", label: "Feed Mimi", detail: "Fish heads. She eats like royalty.", minutes: 5, cost: 6, effects: { fun: 6 } }),
    act({ id: "cat-chase", label: "String chase", detail: "She pounces, misses, pretends she meant it.", minutes: 12, effects: { fun: 14 } }),
  ],
  parrot: [
    act({ id: "bird-teach", label: "Teach a new word", detail: "She already says your name. Now she says 'Chale'.", minutes: 15, effects: { fun: 12 }, skill: "charm" }),
    act({ id: "bird-feed", label: "Feed seeds", detail: "Groundnuts first. Always groundnuts first.", minutes: 5, cost: 5, effects: { fun: 6 } }),
    act({ id: "bird-chat", label: "Morning chatter", detail: "She talks, you answer, the neighbours wonder.", minutes: 10, effects: { social: 8, fun: 6 } }),
  ],
  throne: [
    act({ id: "throne-sit", label: "Sit in state", detail: "Back straight, hand on the armrest.", minutes: 15, effects: { fun: 16, social: 4 } }),
    act({ id: "throne-court", label: "Receive guests", detail: "Visitors greet you before they sit.", minutes: 30, effects: { social: 24, fun: 8 }, social: true }),
  ],
  painting: [
    act({ id: "art-study", label: "Study the brushwork", detail: "Every visit you see something new.", minutes: 20, effects: { fun: 10 } }),
    act({ id: "art-host", label: "Host a viewing", detail: "Wine, small chops, and opinions about colour.", minutes: 60, effects: { social: 22, fun: 10 }, social: true }),
  ],
  vault: [
    act({ id: "vault-count", label: "Count the bars", detail: "Still all there. Count again tomorrow.", minutes: 15, effects: { fun: 16 } }),
    act({ id: "vault-polish", label: "Polish the door", detail: "The handle should catch the light.", minutes: 10, effects: { fun: 6 } }),
  ],
  jet: [
    act({ id: "jet-cockpit", label: "Sit in the cockpit", detail: "Headset on. Flaps down. Imagination does the rest.", minutes: 20, effects: { fun: 22 } }),
    act({ id: "jet-charter", label: "Charter it out", detail: "A weekend run to Kumasi for a wedding party. You get the fee.", minutes: 240, earn: 450, effects: { social: 6 }, cool: true }),
  ],
  "heavy-jet": [
    act({ id: "hjet-cockpit", label: "Sit in the cockpit", detail: "Bigger panel, more buttons, same smile.", minutes: 20, effects: { fun: 24 } }),
    act({ id: "hjet-charter", label: "Charter it out", detail: "A cargo run to Tamale and back.", minutes: 360, earn: 1300, effects: { social: 6 }, cool: true }),
  ],
};

const SOFA_BASE = [
  act({ id: "sofa-lounge", label: "Lounge", detail: "Shoes off, remote somewhere.", minutes: 30, effects: { energy: 10, fun: 6 } }),
  act({ id: "sofa-nap", label: "Nap on the sofa", detail: "Cushion under the head. The best hour of the day.", minutes: 60, effects: { energy: 18 }, sleep: true }),
];

const SOFA_EXTRA: Record<string, Verb> = {
  sofa: act({ id: "sofa-guests", label: "Sit with guests", detail: "Nobody stands in the doorway now.", minutes: 25, effects: { social: 14 }, social: true }),
  family: act({ id: "family-host", label: "Host the family", detail: "Three on the sofa, two on the arms, one on the floor.", minutes: 45, effects: { social: 20, fun: 10 }, social: true }),
  leather: act({ id: "leather-call", label: "Take a big call", detail: "Leg crossed, voice low. You sound like a manager.", minutes: 20, effects: { fun: 8 }, skill: "career" }),
  gold: act({ id: "gold-court", label: "Hold court", detail: "Everybody faces you. Gist flows your way.", minutes: 30, effects: { social: 18, fun: 12 }, social: true }),
};

export function itemCard(item: ShopItem): ItemCard {
  const verbs = item.kind === "sofa" ? [...SOFA_BASE.map((verb) => ({ ...verb, id: `${verb.id}-${item.id}` })), SOFA_EXTRA[item.id]].filter(Boolean) : (BY_ID[item.id] ?? []);
  return { emoji: ID_EMOJI[item.id] ?? EMOJI[item.kind] ?? "✨", name: item.name, detail: item.detail, verbs };
}

export function pieceCard(id: string) {
  const item = SHOP.find((entry) => entry.id === id);
  return item ? itemCard(item) : null;
}

const BED_RANK = ["king", "spring", "mattress", "foam"];

export function fixtureCard(id: FixtureId, life: Life): ItemCard {
  if (id === "bed") {
    const best = BED_RANK.map((bed) => SHOP.find((item) => item.id === bed)).find((item) => item && life.inventory.includes(item.id));
    const verbs = [
      home("sleep"),
      act({ id: "bed-nap", label: "Take a nap", detail: "One hour. Alarm set. Snoozed once.", minutes: 60, effects: { energy: 16 }, sleep: true }),
      act({ id: "bed-lie", label: "Lie in and scroll", detail: "Under the cover, phone at full brightness.", minutes: 30, effects: { fun: 10, energy: 4 } }),
    ];
    if (life.inventory.includes("king")) verbs.unshift(act({ id: "bed-nana", label: "Sleep like Nana", detail: "Eight hours across the whole bed. Wake up like royalty.", minutes: 480, effects: { energy: 62, hunger: -8, fun: 6 }, sleep: true, needs: ["king"] }));
    if (life.inventory.includes("pillow")) verbs.push(act({ id: "bed-pillow", label: "Pillow talk call", detail: "Late-night phone call, voice low.", minutes: 25, effects: { social: 14 }, needs: ["pillow"] }));
    return { emoji: best?.id === "king" ? "👑" : "🛏️", name: best?.name ?? "Your bed", detail: best?.detail ?? "Where every day ends and the next one starts.", verbs };
  }
  if (id === "chair") {
    return {
      emoji: "🛋️",
      name: "Sofa",
      detail: "Where guests sit and the day slows down.",
      verbs: [home("gist"), act({ id: "home-lounge", label: "Lounge", detail: "Feet up, eyes half closed.", minutes: 30, effects: { energy: 8, fun: 6 } }), home("call-home"), home("daydream")],
    };
  }
  if (id === "radio") {
    return { emoji: "📻", name: "Radio", detail: "Joy FM, gospel hour, or the latest single.", verbs: [home("radio"), home("sing"), home("dance")] };
  }
  if (id === "cooler") {
    return {
      emoji: "🧊",
      name: "Fridge",
      detail: `Groceries in stock: ${life.pantry ?? 0}. Cooking at home uses them.`,
      verbs: [
        act({ id: "fridge-restock", label: "Restock groceries", detail: "Rice, tomatoes, onions, tinned fish, sugar bread and tea from the provisions shop.", minutes: 30, cost: 60, stock: 6, effects: { fun: -2 } }),
        home("cooler"),
        act({ id: "home-water", label: "Cold water", detail: "Straight from the bottle.", minutes: 3, effects: { energy: 3, hunger: 2 } }),
      ],
    };
  }
  if (id === "stove") {
    return {
      emoji: "🔥",
      name: "Stove",
      detail: "Pepper, onions, and the smell that tells the corridor you are home.",
      verbs: [
        home("cook"),
        act({ id: "stove-waakye", label: "Cook from the pantry", detail: "Waakye from what is in the fridge.", minutes: 45, effects: { hunger: 46, fun: 6 }, skill: "cooking", pantry: 1, tag: "food" }),
        act({ id: "stove-tea", label: "Make tea", detail: "Kettle on, milk, two sugars.", minutes: 10, effects: { energy: 6, hunger: 4 } }),
      ],
    };
  }
  if (id === "toilet") {
    return { emoji: "🚽", name: "Toilet", detail: "Handle your business.", verbs: [home("toilet"), act({ id: "home-scroll-loo", label: "Scroll while you're there", detail: "One video became ten.", minutes: 15, effects: { bladder: 55, fun: 6 } })] };
  }
  return {
    emoji: "🚿",
    name: "Shower",
    detail: "Cold water still counts as a reset.",
    verbs: [home("shower"), act({ id: "home-cold-shower", label: "Cold wake-up shower", detail: "Ninety seconds that replace coffee.", minutes: 10, effects: { hygiene: 38, energy: 10 } })],
  };
}
