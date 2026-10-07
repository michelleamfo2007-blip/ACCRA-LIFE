import type { Spot, Verb } from "@/lib/game/world";

function act(partial: Partial<Verb> & Pick<Verb, "id" | "label" | "detail">): Verb {
  return { minutes: 40, cost: 0, earn: 0, effects: {}, ...partial };
}

const plate = (id: string, label: string, detail: string, cost: number, hunger = 36): Verb =>
  act({ id, label, detail, minutes: 40, cost, effects: { hunger, fun: 8, social: 6 }, tag: "food", social: true });

export const KUMASI_SPOTS: Spot[] = [
  {
    id: "kejetia",
    name: "Kejetia Market",
    emoji: "🧺",
    x: 780,
    y: 620,
    group: "hang",
    town: "kumasi",
    blurb: "Adum. The biggest market in West Africa. Lanes, cloth, and a price that moves if you look tired.",
    actions: [
      act({ id: "kejetia-walk", label: "Walk the lanes", detail: "You lose the entrance and find a better price two turns later.", minutes: 70, cost: 15, effects: { fun: 18, social: 12, energy: -10, hygiene: -6 }, emoji: "🧺" }),
      plate("kejetia-koko", "Koko and koose", "Morning porridge and bean cakes before the lanes fill.", 8, 28),
    ],
  },
  {
    id: "kumasi-central",
    name: "Kumasi Central Market",
    emoji: "🧵",
    x: 700,
    y: 740,
    group: "hang",
    town: "kumasi",
    blurb: "Adum. The older market beside Kejetia. Second-hand shoes and bolts of cloth.",
    actions: [
      act({ id: "central-cloth", label: "Buy cloth", detail: "The seller snaps the fabric so you hear the quality.", minutes: 40, cost: 60, effects: { fun: 12, social: 8 }, emoji: "🧵" }),
      plate("central-rice", "Rice and stew at the stall", "A plastic chair and a plate that arrives fast.", 12, 34),
    ],
  },
  {
    id: "manhyia",
    name: "Manhyia Palace",
    emoji: "👑",
    x: 1120,
    y: 380,
    group: "civic",
    town: "kumasi",
    blurb: "Manhyia. Gold weights, stools, and the museum of the Asantehene.",
    actions: [
      act({ id: "manhyia-museum", label: "Tour the museum", detail: "You read the stools twice. The guide does not hurry you.", minutes: 80, cost: 40, effects: { fun: 16, social: 10, energy: -6 }, skill: "charm", emoji: "👑" }),
      act({ id: "manhyia-yard", label: "Stand in the palace yard", detail: "On Akwasidae the drums start before you are ready.", minutes: 40, effects: { fun: 14, social: 12 }, emoji: "🥁" }),
    ],
  },
  {
    id: "baba-yara",
    name: "Baba Yara Stadium",
    emoji: "🏟️",
    x: 440,
    y: 380,
    group: "hang",
    town: "kumasi",
    blurb: "Bantama. Baba Yara. Asante Kotoko, horns, and a stand that stands up together.",
    actions: [
      act({ id: "baba-match", label: "Watch Kotoko", detail: "The anthem, then the argument, then a goal.", minutes: 110, cost: 25, effects: { fun: 30, social: 16, hunger: -8 }, social: true, emoji: "🏟️" }),
      act({ id: "baba-jog", label: "Jog the empty stands", detail: "No match today. Just the concrete and your own pace.", minutes: 30, effects: { energy: -10, hygiene: -8, fun: 6 }, skill: "fitness", tag: "gym", emoji: "🏃" }),
    ],
  },
  {
    id: "knust",
    name: "KNUST",
    emoji: "🎓",
    x: 1460,
    y: 250,
    group: "work",
    town: "kumasi",
    blurb: "KNUST. The campus sits in trees. Tech junction feeds everyone who is late for a lecture.",
    actions: [
      act({ id: "knust-walk", label: "Walk the campus", detail: "Neem trees, a faculty you cannot name, and students in a hurry.", minutes: 50, effects: { fun: 12, energy: -6, social: 8 }, emoji: "🌳" }),
      plate("knust-junction", "Eat at Tech junction", "Waakye in a leaf, eaten on the curb.", 14, 36),
    ],
  },
  {
    id: "bosomtwe",
    name: "Lake Bosomtwe",
    emoji: "🌊",
    x: 400,
    y: 1100,
    group: "sea",
    town: "kumasi",
    blurb: "Lake Road. A crater lake outside Kumasi. The water is still and the tilapia is not.",
    actions: [
      act({ id: "bosomtwe-shore", label: "Sit on the shore", detail: "No tide. Just the bowl of the lake and a long afternoon.", minutes: 70, effects: { fun: 22, energy: 6, social: 6 }, emoji: "🌊" }),
      plate("bosomtwe-fish", "Grilled tilapia", "Pepper, banku, and a view of the crater.", 30, 42),
    ],
  },
  {
    id: "adum-night",
    name: "Adum night",
    emoji: "🎶",
    x: 900,
    y: 520,
    group: "hang",
    town: "kumasi",
    blurb: "Prempeh II after dark. Highlife first, then the speakers get rude.",
    actions: [
      act({ id: "adum-club", label: "Stay for the set", detail: "A small floor, a big speaker, and somebody who knows your cousin.", minutes: 120, cost: 40, effects: { fun: 28, social: 16, energy: -14, hygiene: -8 }, tag: "party", skill: "music", emoji: "🎶" }),
      plate("adum-suya", "Night suya", "Smoke, pepper, and a toothpick.", 18, 24),
    ],
  },
  {
    id: "fufu-joint",
    name: "Asafo fufu joint",
    emoji: "🍲",
    x: 620,
    y: 500,
    group: "hang",
    town: "kumasi",
    blurb: "Asafo. Fufu pounded in the yard. Light soup that means it.",
    actions: [
      plate("asafo-fufu", "Fufu and light soup", "Goat, a ball of fufu, and a bench you will not leave quickly.", 28, 50),
      act({ id: "asafo-pound", label: "Help pound", detail: "They hand you the pestle. Your arms file a complaint.", minutes: 25, effects: { social: 14, energy: -12, fun: 8 }, skill: "cooking", emoji: "🥁" }),
    ],
  },
  {
    id: "kumasi-airport",
    name: "Kumasi Airport",
    emoji: "✈️",
    x: 1700,
    y: 280,
    group: "work",
    town: "kumasi",
    blurb: "A short terminal. Passion Airways back to Kotoka, and a taxi rank that already knows your bag.",
    actions: [
      act({ id: "kumasi-planes", label: "Watch the apron", detail: "One jet, a lot of sky, and somebody waving at a cousin.", minutes: 30, effects: { fun: 10, social: 6 }, emoji: "✈️" }),
      plate("kumasi-snack", "Terminal meat pie", "Hot, flaky, gone before boarding.", 15, 18),
    ],
  },
  {
    id: "bonwire-stall",
    name: "Bonwire kente stall",
    emoji: "🟨",
    x: 980,
    y: 700,
    group: "hang",
    town: "kumasi",
    blurb: "Adum. A stall that sells Bonwire strips. The cloth is heavier than the bag.",
    actions: [
      act({ id: "bonwire-buy", label: "Buy a kente strip", detail: "Handwoven. Red, gold, and a price you feel in the wallet.", minutes: 40, cost: 180, effects: { fun: 14, social: 8 }, emoji: "🟨" }),
      act({ id: "bonwire-watch", label: "Watch the weave", detail: "The loom clicks. You stop talking so you can hear it.", minutes: 25, effects: { fun: 12 }, emoji: "🧵" }),
    ],
  },
];
