import { photo } from "@/lib/format";
import type { Area, Category, Vibe } from "@/lib/types";

export const categories: Category[] = [
  {
    slug: "food-dining",
    name: "Food & Dining",
    emoji: "🍽️",
    lede: "Chop bars, long lunches, and the tables Accra actually argues about.",
    image: photo("1504674900247-0877df9cc836"),
  },
  {
    slug: "cafes",
    name: "Cafés",
    emoji: "☕",
    lede: "Coffee for the laptop hour, the catch-up, and the slow afternoon.",
    image: photo("1495474472287-4d71bcdd2085"),
  },
  {
    slug: "nightlife",
    name: "Nightlife",
    emoji: "🥂",
    lede: "Rooftops, live bands, and the rooms that start after ten.",
    image: photo("1519671482749-fd09be7ccebf"),
  },
  {
    slug: "events",
    name: "Events",
    emoji: "🎉",
    lede: "What is on tonight, this weekend, and the week ahead.",
    image: photo("1492684223066-81342ee5ff30"),
  },
  {
    slug: "date-ideas",
    name: "Date Ideas",
    emoji: "❤️",
    lede: "Tables, views, and plans that do not feel like a default dinner.",
    image: photo("1414235077428-338989a2e8c0"),
  },
  {
    slug: "things-to-do",
    name: "Things To Do",
    emoji: "🎨",
    lede: "Galleries, shorelines, forts, and the city when you are not in a rush.",
    image: photo("1518998053901-5348d3961a04"),
  },
  {
    slug: "shopping",
    name: "Shopping",
    emoji: "🛍️",
    lede: "Markets, malls, and the streets where Accra buys its week.",
    image: photo("1472851294608-062f824d29cc"),
  },
  {
    slug: "beauty-wellness",
    name: "Beauty & Wellness",
    emoji: "💅",
    lede: "Studios and quiet rooms for a reset between the traffic.",
    image: photo("1544161515-4ab6ce6db874"),
  },
  {
    slug: "beaches-outdoors",
    name: "Beaches & Outdoors",
    emoji: "🏖️",
    lede: "Sea breeze, Sunday sand, and the coast within reach of the city.",
    image: photo("1507525428034-b723cf961d3e"),
  },
  {
    slug: "stay",
    name: "Stay",
    emoji: "🏨",
    lede: "Hotels and beach houses worth the booking, not just the lobby photo.",
    image: photo("1566073771259-6a8506099945"),
  },
  {
    slug: "work-study",
    name: "Work & Study",
    emoji: "💻",
    lede: "Rooms with reliable wifi, decent coffee, and people building things.",
    image: photo("1497366216548-37526070297c"),
  },
  {
    slug: "family-kids",
    name: "Family & Kids",
    emoji: "👨‍👩‍👧",
    lede: "Gardens, animals, and outings that survive a short attention span.",
    image: photo("1502086223501-7ea6ecd79368"),
  },
];

export const areas: Area[] = [
  {
    slug: "osu",
    name: "Osu",
    tagline: "The city's loud, late, delicious centre.",
    description:
      "Oxford Street still sets the pace. Restaurants spill onto pavements, nightlife stacks itself into rooftops, and you can eat, shop, and stay out without crossing town.",
    image: photo("1517248135467-4c7edcad34c4"),
    lat: 5.5558,
    lng: -0.1752,
    knownFor: ["Oxford Street", "Late dinners", "Rooftops"],
  },
  {
    slug: "east-legon",
    name: "East Legon",
    tagline: "Brunch, houses, and nights that start in traffic.",
    description:
      "East Legon is where Accra goes when the plan involves a proper table, a mall run, or a house party that somehow became a restaurant reservation.",
    image: photo("1559339352-11d035aa65de"),
    lat: 5.6354,
    lng: -0.1568,
    knownFor: ["Brunch", "Lounges", "Accra Mall side"],
  },
  {
    slug: "airport",
    name: "Airport",
    tagline: "City hotels, sharp dining, easy arrivals.",
    description:
      "Airport Residential and Airport City mix quiet streets with restaurants that dress for the evening. Useful if you have a flight, a meeting, or both.",
    image: photo("1542314831-068cd1dbfeeb"),
    lat: 5.605,
    lng: -0.1718,
    knownFor: ["Hotels", "Airport City", "Date restaurants"],
  },
  {
    slug: "cantonments",
    name: "Cantonments",
    tagline: "Old trees, long lunches, embassy calm.",
    description:
      "Cantonments moves slower than Osu and spends more on the table. It is the neighbourhood for Sunday lunch, shade, and a plan that does not involve a queue on the pavement.",
    image: photo("1414235077428-338989a2e8c0"),
    lat: 5.5725,
    lng: -0.1638,
    knownFor: ["Long lunch", "Polo Club", "Quiet streets"],
  },
  {
    slug: "labone",
    name: "Labone",
    tagline: "Neighbourhood restaurants and an easy evening.",
    description:
      "Labone sits between the noise of Osu and the calm of Cantonments. Cafés, small restaurants, and streets you can actually walk after dark.",
    image: photo("1554118811-1e0d58224f24"),
    lat: 5.5652,
    lng: -0.1694,
    knownFor: ["Cafés", "Neighbourhood dining", "Walkable evenings"],
  },
  {
    slug: "labadi",
    name: "Labadi",
    tagline: "Beach traffic, hotel lawns, weekend sun.",
    description:
      "Labadi is Accra facing the water. The beach, the hotel strip, and a weekend rhythm that starts late morning and refuses to hurry.",
    image: photo("1507525428034-b723cf961d3e"),
    lat: 5.5604,
    lng: -0.1502,
    knownFor: ["Beach", "Hotels", "Sunday sun"],
  },
  {
    slug: "spintex",
    name: "Spintex",
    tagline: "Malls, new blocks, and roadside flavour.",
    description:
      "Spintex Road is Accra in motion. Shopping, apartments, and the kind of grill you find because the traffic finally stopped.",
    image: photo("1441986300917-64674bd600d8"),
    lat: 5.622,
    lng: -0.108,
    knownFor: ["Junction Mall", "Roadside eats", "New Accra"],
  },
  {
    slug: "dzorwulu",
    name: "Dzorwulu",
    tagline: "Studios, side streets, and room to work.",
    description:
      "Dzorwulu is quieter than its neighbours and full of people making things. Good for a workday, a low-key dinner, and conversations that run long.",
    image: photo("1497366216548-37526070297c"),
    lat: 5.6112,
    lng: -0.1986,
    knownFor: ["Coworking", "Creative studios", "Quiet dinners"],
  },
  {
    slug: "adabraka",
    name: "Adabraka",
    tagline: "Older Accra, real food, market energy.",
    description:
      "Adabraka holds the city's everyday appetite. Chop bars, the pull of Makola, and streets that have been busy longer than the new malls.",
    image: photo("1533900298318-6b8da08a523e"),
    lat: 5.5618,
    lng: -0.2134,
    knownFor: ["Chop bars", "Makola edge", "Everyday Accra"],
  },
  {
    slug: "ridge",
    name: "Ridge",
    tagline: "Lawns, hotels, and the ceremonial city.",
    description:
      "Ridge is wide roads, official Accra, and hotels that know how to do a quiet night. Black Star Square is the neighbour with the best sky.",
    image: photo("1566073771259-6a8506099945"),
    lat: 5.5568,
    lng: -0.1955,
    knownFor: ["Black Star Square", "Hotels", "Open lawns"],
  },
  {
    slug: "dansoman",
    name: "Dansoman",
    tagline: "Residential west, with the coast not far.",
    description:
      "Dansoman is lived-in Accra. Estates, local grills, and the road that keeps going until the city loosens into beach.",
    image: photo("1473496169904-658ba7c44d8a"),
    lat: 5.5375,
    lng: -0.268,
    knownFor: ["Local grills", "Estates", "Road to Bojo"],
  },
  {
    slug: "teshie",
    name: "Teshie",
    tagline: "Fishing coast and a slower shoreline.",
    description:
      "Teshie faces the sea without the Labadi crowd. Landing beach energy, family houses, and fish that did not travel far.",
    image: photo("1500375592092-40eb2168fd21"),
    lat: 5.583,
    lng: -0.106,
    knownFor: ["Coast", "Fresh fish", "Local weekends"],
  },
  {
    slug: "nungua",
    name: "Nungua",
    tagline: "Beach town before the city becomes Tema.",
    description:
      "Nungua is salt air and a shoreline Accra uses when Labadi feels too familiar. Come for the water, stay for the grilled fish.",
    image: photo("1519046904884-53103b34b206"),
    lat: 5.601,
    lng: -0.077,
    knownFor: ["Beach", "Grills", "Sea road"],
  },
  {
    slug: "tema",
    name: "Tema",
    tagline: "Harbour city with its own weekend.",
    description:
      "Tema is not a suburb you pass. The harbour, the communities, and a waterfront appetite make it a proper day out of central Accra.",
    image: photo("1468413253725-0d5181091126"),
    lat: 5.6698,
    lng: -0.0166,
    knownFor: ["Harbour", "Community life", "Seafood"],
  },
  {
    slug: "jamestown",
    name: "Jamestown",
    tagline: "Forts, boxing, paint, and the old harbour.",
    description:
      "Jamestown is Accra's origin story still in use. Fishing boats, lighthouse views, galleries, and streets that reward anyone who walks slowly.",
    image: photo("1468413253725-0d5181091126"),
    lat: 5.5336,
    lng: -0.2088,
    knownFor: ["Harbour", "Galleries", "History you can walk"],
  },
  {
    slug: "kokrobite",
    name: "Kokrobite",
    tagline: "The weekend beach Accra keeps choosing.",
    description:
      "Kokrobite is the exhale. Drums, cold drinks, horses on the sand, and a Sunday that starts whenever the traffic lets you arrive.",
    image: photo("1473496169904-658ba7c44d8a"),
    lat: 5.4965,
    lng: -0.3648,
    knownFor: ["Sunday beach", "Live music", "Backyard stays"],
  },
];

export const vibes: Vibe[] = [
  {
    slug: "chill",
    name: "Chill",
    emoji: "😌",
    lede: "Low volume, good light, nowhere you need to rush.",
    examples: ["Cafés", "Beach mornings", "Hotel lawns"],
  },
  {
    slug: "date-night",
    name: "Date Night",
    emoji: "❤️",
    lede: "Rooms with a point of view, and food worth dressing up for.",
    examples: ["Romantic restaurants", "Rooftops", "Live music"],
  },
  {
    slug: "outside",
    name: "Outside",
    emoji: "🥂",
    lede: "Air, music, and a plan that does not involve a ceiling.",
    examples: ["Beaches", "Rooftop bars", "Sunday sessions"],
  },
  {
    slug: "foodie",
    name: "Foodie",
    emoji: "🍽️",
    lede: "The plate is the plan. Everything else can wait.",
    examples: ["West African rooms", "Sushi counters", "Chop bars"],
  },
  {
    slug: "work-mode",
    name: "Work Mode",
    emoji: "💻",
    lede: "A table, a plug, and coffee that survives a long call.",
    examples: ["Cafés", "Coworking", "Quiet hotels"],
  },
  {
    slug: "explore",
    name: "Explore",
    emoji: "🎨",
    lede: "See the city instead of only consuming it.",
    examples: ["Jamestown", "Galleries", "Markets"],
  },
  {
    slug: "budget",
    name: "On a Budget",
    emoji: "💸",
    lede: "Accra does not require a big bill to be a good day.",
    examples: ["Chop bars", "Free events", "Public beaches"],
  },
  {
    slug: "luxury",
    name: "Luxury",
    emoji: "✨",
    lede: "When the occasion deserves the better room.",
    examples: ["Hotel dining", "Spa hours", "Tasting menus"],
  },
  {
    slug: "friends",
    name: "Friends",
    emoji: "👯",
    lede: "Tables for four or more, and nights that become stories.",
    examples: ["Bars", "Brunch", "Beach days"],
  },
  {
    slug: "family",
    name: "Family",
    emoji: "👨‍👩‍👧",
    lede: "Outings that work for children and the person driving.",
    examples: ["Gardens", "The zoo", "Early beaches"],
  },
];

export function categoryBySlug(slug: string) {
  return categories.find((category) => category.slug === slug);
}

export function areaBySlug(slug: string) {
  return areas.find((area) => area.slug === slug);
}

export function vibeBySlug(slug: string) {
  return vibes.find((vibe) => vibe.slug === slug);
}
