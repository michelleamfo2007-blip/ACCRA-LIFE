import type { Spot, Verb } from "@/lib/game/world";

function act(partial: Partial<Verb> & Pick<Verb, "id" | "label" | "detail">): Verb {
  return { minutes: 40, cost: 0, earn: 0, effects: {}, ...partial };
}

const plate = (id: string, label: string, detail: string, cost: number, hunger = 34): Verb =>
  act({ id, label, detail, minutes: 35, cost, effects: { hunger, fun: 8, social: 6 }, tag: "food", social: true });

const stroll = (id: string, label: string, detail: string, cost = 0, fun = 18): Verb =>
  act({ id, label, detail, minutes: 45, cost, effects: { fun, energy: -4, social: 6 }, social: true });

const NEIGHBOURHOODS: Spot[] = [
  {
    id: "teshie",
    name: "Teshie Beach",
    emoji: "🐟",
    x: 1580,
    y: 1110,
    group: "sea",
    blurb: "Teshie. Fishing canoes, net menders, and the Kpeshie lagoon behind the road.",
    actions: [
      stroll("teshie-canoes", "Watch the canoes land", "The boats come in on the swell and the whole beach runs to meet them."),
      plate("teshie-fish", "Fried fish by the boats", "Straight from the net to the pan. Pepper on the side.", 16),
      act({ id: "teshie-net", label: "Help pull the net", detail: "Twenty people on one rope, singing to keep time. They give you a share.", minutes: 60, earn: 25, effects: { energy: -16, hygiene: -12, social: 14 }, skill: "fitness", social: true, cool: true, emoji: "🪢" }),
    ],
  },
  {
    id: "nungua",
    name: "Nungua",
    emoji: "🥁",
    x: 1800,
    y: 1110,
    group: "hang",
    blurb: "Nungua. Ga drums on a Sunday, a long beach, and grilled tilapia on every corner.",
    actions: [
      plate("nungua-tilapia", "Tilapia and banku", "The fish is charred, the banku is hot, the pepper is serious.", 24, 44),
      act({ id: "nungua-drums", label: "Join the drumming circle", detail: "Kpanlogo in the yard. Somebody hands you a small drum.", minutes: 50, effects: { fun: 26, social: 16, energy: -8 }, skill: "music", social: true, emoji: "🥁" }),
    ],
  },
  {
    id: "madina",
    name: "Madina Market",
    emoji: "🛒",
    x: 1050,
    y: 60,
    group: "hang",
    blurb: "Madina. Zongo Junction, trotro mates calling, and a market that sells everything at a fair price.",
    actions: [
      stroll("madina-junction", "Walk Zongo Junction", "Hausa koko, mobile money queues, and three stations calling at once."),
      plate("madina-waakye", "Waakye at the junction", "A leaf-wrapped portion with wele and an egg.", 12, 36),
    ],
  },
  {
    id: "achimota",
    name: "Achimota Forest",
    emoji: "🌲",
    x: 590,
    y: 60,
    group: "sea",
    blurb: "Achimota. Old forest in the middle of the city. Trails, monkeys, and joggers at 6am.",
    actions: [
      act({ id: "achimota-jog", label: "Jog the forest trail", detail: "Shade the whole way. The monkeys judge your pace.", minutes: 45, effects: { energy: -14, hygiene: -10, fun: 12 }, skill: "fitness", tag: "gym", emoji: "🏃🏾" }),
      act({ id: "achimota-picnic", label: "Picnic under the trees", detail: "A mat, a cooler, and a Sunday that stays slow.", minutes: 60, cost: 25, effects: { hunger: 22, fun: 20, social: 10 }, tag: "food", social: true, emoji: "🧺" }),
    ],
  },
  {
    id: "kaneshie-market",
    name: "Kaneshie Market",
    emoji: "🏬",
    x: 420,
    y: 580,
    group: "hang",
    blurb: "Kaneshie. Three floors of foodstuff and fabric, with the trotro station downstairs.",
    actions: [
      act({ id: "kaneshie-foodstuff", label: "Buy foodstuffs", detail: "Gari, beans, a bag of rice and the pepper seller who knows your name.", minutes: 30, cost: 14, effects: { hunger: 22 }, tag: "food", emoji: "🛍️" }),
      stroll("kaneshie-floors", "Walk the three floors", "Fabric upstairs, fish downstairs, gossip on every landing."),
    ],
  },
  {
    id: "kantamanto",
    name: "Kantamanto",
    emoji: "👕",
    x: 400,
    y: 690,
    group: "hang",
    blurb: "Kantamanto. Acres of second-hand clothes. Dig deep and you find a designer label for ₵20.",
    actions: [
      act({ id: "kantamanto-dig", label: "Dig for a bargain fit", detail: "An hour in the bales. You come out with a jacket nobody else has.", minutes: 60, cost: 20, effects: { fun: 20, social: 8, hygiene: -6 }, skill: "hustle", social: true, emoji: "🧥" }),
      stroll("kantamanto-lanes", "Walk the lanes", "Sellers shout prices. Every second stall has the same jeans."),
    ],
  },
  {
    id: "dansoman",
    name: "Dansoman",
    emoji: "🏘️",
    x: 240,
    y: 1080,
    group: "hang",
    blurb: "Dansoman. Long roads of family houses, a busy roundabout, and kelewele at night.",
    actions: [
      plate("dansoman-kelewele", "Kelewele at the roundabout", "Spicy plantain in newspaper, eaten standing.", 10, 22),
      act({ id: "dansoman-gist", label: "Gist at the junction", detail: "Old men on a bench, a draughts board, and opinions about everything.", minutes: 30, effects: { social: 18, fun: 8 }, skill: "charm", social: true, emoji: "💬" }),
    ],
  },
  {
    id: "spintex",
    name: "Spintex Road",
    emoji: "🛍️",
    x: 1600,
    y: 930,
    group: "hang",
    blurb: "Spintex. Showrooms, offices, and the traffic everybody complains about.",
    actions: [
      act({ id: "spintex-shop", label: "Shop the strip", detail: "Furniture showrooms, a phone shop and a pharmacy in one long walk.", minutes: 50, cost: 40, effects: { fun: 16, energy: -6 }, emoji: "🛍️" }),
      plate("spintex-lunch", "Office lunch spot", "Fried rice and chicken in a takeaway pack.", 30, 38),
    ],
  },
];

const GATEWAYS: Spot[] = [
  {
    id: "kotoka",
    name: "Kotoka Airport",
    emoji: "✈️",
    x: 180,
    y: 520,
    group: "work",
    blurb: "Airport. Arrivals hall hugs, departure tears, and planes low over Airport Residential.",
    actions: [
      stroll("kotoka-planes", "Watch the planes land", "Wheels down, engines roaring, kids pointing at the fence."),
      act({ id: "kotoka-arrivals", label: "Meet arrivals", detail: "A cousin from abroad, two suitcases and a hug that lasts a minute.", minutes: 40, effects: { social: 22, fun: 10 }, social: true, emoji: "🤗" }),
      act({ id: "kotoka-lounge", label: "Sit in the lounge", detail: "Quiet chairs, soft drinks, and a board of domestic flights to Kumasi.", minutes: 40, cost: 80, effects: { fun: 16, energy: 8, hygiene: 4 }, emoji: "🛋️" }),
      plate("kotoka-snack", "Arrivals hall snack", "Meat pie and a cold malt while you wait.", 25, 24),
    ],
  },
  {
    id: "tema",
    name: "Tema Port",
    emoji: "🚢",
    x: 140,
    y: 1160,
    group: "work",
    blurb: "Tema. Cranes, containers, and clearing agents with three phones each.",
    actions: [
      stroll("tema-cranes", "Watch the cranes", "A container swings over your head like it weighs nothing."),
      plate("tema-canteen", "Port canteen", "Rice and stew for the dock workers. Big portion, small price.", 14, 40),
    ],
  },
];

const TRIPS: Spot[] = [
  {
    id: "kumasi",
    name: "Kumasi",
    emoji: "👑",
    x: 52,
    y: 80,
    group: "trip",
    far: 270,
    blurb: "Kumasi. The Garden City. Kejetia market, kente, and the seat of the Asantehene.",
    actions: [
      act({ id: "kumasi-kejetia", label: "Walk Kejetia market", detail: "The biggest market in West Africa. You will lose your way and find a bargain.", minutes: 90, cost: 20, effects: { fun: 22, social: 14, energy: -12, hygiene: -8 }, emoji: "🧺" }),
      act({ id: "kumasi-palace", label: "Visit Manhyia Palace museum", detail: "Gold weights, stools, and the story of Asante royalty.", minutes: 80, cost: 40, effects: { fun: 18, social: 10, energy: -6 }, skill: "charm", emoji: "🏰" }),
      act({ id: "kumasi-kente", label: "Buy a kente strip", detail: "Handwoven cloth from Bonwire. Heavy, bright, and worth the price.", minutes: 50, cost: 180, effects: { fun: 16, social: 8 }, emoji: "🟨" }),
      plate("kumasi-fufu", "Fufu and light soup", "Ashanti fufu done properly. You will need a nap after.", 28, 48),
      stroll("kumasi-lake", "Lake Bosomtwe day", "A crater lake outside the city. Quiet water and grilled tilapia."),
    ],
  },
  {
    id: "cape-coast",
    name: "Cape Coast Castle",
    emoji: "🏰",
    x: 52,
    y: 250,
    group: "trip",
    far: 180,
    blurb: "Cape Coast. Whitewashed walls over the sea, the Door of No Return, and a guide who tells it straight.",
    actions: [
      act({ id: "cape-tour", label: "Take the castle tour", detail: "The dungeons are quiet. The guide does not rush the story, and nobody talks on the way out.", minutes: 120, cost: 60, effects: { fun: 8, social: 14, energy: -8 }, skill: "charm", emoji: "🏰" }),
      stroll("cape-town", "Walk Cape Coast town", "Colonial streets, a school band practising, and the sea at the end of every road."),
      plate("cape-fish", "Fresh fish by the castle", "Red snapper off the grill with kenkey.", 20, 40),
    ],
  },
  {
    id: "kakum",
    name: "Kakum canopy walk",
    emoji: "🌉",
    x: 52,
    y: 400,
    group: "trip",
    far: 200,
    blurb: "Kakum. Rope bridges forty metres up in the rainforest canopy.",
    actions: [
      act({ id: "kakum-canopy", label: "Cross the canopy walkway", detail: "Seven bridges, swaying, the forest floor a long way down.", minutes: 90, cost: 50, effects: { fun: 38, energy: -14 }, emoji: "🌉" }),
      act({ id: "kakum-trail", label: "Forest trail with a guide", detail: "Medicinal plants, elephant tracks, and birds you only hear.", minutes: 80, cost: 20, effects: { fun: 22, energy: -12, social: 6 }, skill: "fitness", emoji: "🌳" }),
    ],
  },
  {
    id: "elmina",
    name: "Elmina",
    emoji: "🏯",
    x: 52,
    y: 700,
    group: "trip",
    far: 200,
    blurb: "Elmina. St George's Castle, a lagoon full of painted canoes, and the loudest fish market on the coast.",
    actions: [
      act({ id: "elmina-castle", label: "Tour St George's Castle", detail: "The oldest European building south of the Sahara. The courtyard is very still.", minutes: 100, cost: 50, effects: { fun: 10, social: 12, energy: -6 }, emoji: "🏯" }),
      stroll("elmina-canoes", "Watch the canoes come in", "Hundreds of painted boats, flags, and a market that starts on the sand."),
    ],
  },
  {
    id: "akosombo",
    name: "Akosombo",
    emoji: "🌊",
    x: 1950,
    y: 250,
    group: "trip",
    far: 150,
    blurb: "Akosombo. The dam that lights the country, and Lake Volta behind it.",
    actions: [
      act({ id: "akosombo-cruise", label: "Cruise on Lake Volta", detail: "The boat goes out to Dodi Island. Music on deck, water to the horizon.", minutes: 150, cost: 90, effects: { fun: 34, social: 16, energy: -8 }, social: true, emoji: "🛳️" }),
      stroll("akosombo-dam", "Look at the dam", "A wall of concrete holding back the biggest man-made lake on earth."),
      plate("akosombo-tilapia", "Lakeside tilapia", "Fresh from the lake, grilled with onions.", 26, 44),
    ],
  },
  {
    id: "shai-hills",
    name: "Shai Hills",
    emoji: "🦌",
    x: 1950,
    y: 680,
    group: "trip",
    far: 75,
    blurb: "Shai Hills. Baboons on the road, antelope in the grass, and caves at the top.",
    actions: [
      act({ id: "shai-hike", label: "Hike with a ranger", detail: "Baboons follow at a polite distance. The ranger knows each one by name.", minutes: 90, cost: 30, effects: { fun: 26, energy: -16, hygiene: -10 }, skill: "fitness", emoji: "🥾" }),
      stroll("shai-caves", "Climb to the caves", "The old Shai people lived up here. The view goes all the way to the sea.", 0, 22),
    ],
  },
  {
    id: "ada",
    name: "Ada Foah",
    emoji: "🛶",
    x: 1950,
    y: 1080,
    group: "trip",
    far: 120,
    blurb: "Ada. Where the Volta meets the sea. Islands, boats, and huts on the sand.",
    actions: [
      act({ id: "ada-boat", label: "Boat to the estuary", detail: "River on one side, ocean on the other, a sandbar in between.", minutes: 90, cost: 60, effects: { fun: 32, social: 12 }, social: true, emoji: "🛥️" }),
      act({ id: "ada-kayak", label: "Kayak on the river", detail: "Mangroves, kingfishers and sore arms.", minutes: 60, cost: 30, effects: { fun: 22, energy: -14 }, skill: "fitness", emoji: "🛶" }),
      act({ id: "ada-hut", label: "Sleep in a beach hut", detail: "Waves all night, a hammock, and no traffic noise for once.", minutes: 420, cost: 150, effects: { energy: 52, fun: 14, hunger: -8 }, sleep: true, emoji: "🛖" }),
    ],
  },
];

export const TRIP_IDS = TRIPS.map((spot) => spot.id);

export const MORE_SPOTS: Spot[] = [...NEIGHBOURHOODS, ...GATEWAYS, ...TRIPS];
