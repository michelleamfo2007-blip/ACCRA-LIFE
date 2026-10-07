import type { Spot } from "@/lib/game/world";

export type TownId = "accra" | "kumasi" | "takoradi" | "tamale" | "cape-coast" | "ho";

export type PlaceKind = "food" | "nightlife" | "work" | "worship" | "shopping" | "transport" | "landmark";

export type MapPoint = { x: number; y: number };

export type Landmark = {
  id: string;
  name: string;
  kind: PlaceKind;
  neighborhood: string;
  hours: string;
  cost: string;
  blurb: string;
  x: number;
  y: number;
};

export type TownNpc = {
  id: string;
  name: string;
  line: string;
  x: number;
  y: number;
  shirt: string;
  slang: string;
};

export type TownEvent = {
  id: string;
  title: string;
  detail: string;
  /** 0–11, or null when it can fall any month. */
  month: number | null;
  spots: string[];
};

export type TransitLine = {
  id: string;
  name: string;
  mode: "trotro" | "bus";
  color: string;
  points: MapPoint[];
};

export type TownSkin = {
  ground: string;
  groundNight: string;
  beach: string;
  sea: string;
  deep: string;
  coast: boolean;
  roadsH: string[];
  roadsV: string[];
  west: string;
  east: string;
  areas: { x: number; y: number; label: string }[];
  lake: { x: number; y: number; name: string } | null;
  seaLabel: string;
  focus: MapPoint;
};

export type Town = {
  id: TownId;
  name: string;
  vibe: string;
  open: boolean;
  /** Spot you stand on after you arrive. */
  arrival: string;
  /** Spot id used by the existing intercity ride (Accra map gate or home). */
  gate: string;
  /** 1 = Accra prices. Kumasi food runs a little under. */
  priceIndex: number;
  weather: string;
  skin: TownSkin;
  neighborhoods: string[];
  landmarks: Landmark[];
  people: TownNpc[];
  events: TownEvent[];
  jobs: { id: string; place: string; title: string }[];
  lines: TransitLine[];
  taxis: { name: string; x: number; y: number }[];
  okada: { name: string; x: number; y: number }[];
  stops: { name: string; x: number; y: number }[];
};

const ACCRA_SKIN: TownSkin = {
  ground: "#d7ebbc",
  groundNight: "#1d2a22",
  beach: "#f4e3c4",
  sea: "#b9e4f5",
  deep: "#8fd0ea",
  coast: true,
  roadsH: ["RING ROAD NORTH", "LIBERATION ROAD", "OXFORD / OSU", "SPINTEX ROAD", "LABADI BEACH ROAD"],
  roadsV: ["N1 LINK", "ACHIMOTA RD", "INDEPENDENCE AVE", "CANTONMENTS", "LABONE LINK", "TEMA MOTORWAY"],
  west: "N1 WEST · CAPE COAST · ELMINA · KAKUM",
  east: "MOTORWAY EAST · SHAI HILLS · AKOSOMBO · ADA",
  areas: [
    { x: 620, y: 250, label: "OSU" },
    { x: 1320, y: 500, label: "LABONE" },
    { x: 1620, y: 230, label: "EAST LEGON" },
    { x: 250, y: 430, label: "AIRPORT RESIDENTIAL" },
    { x: 280, y: 760, label: "MAKOLA" },
    { x: 900, y: 470, label: "CANTONMENTS" },
    { x: 980, y: 1040, label: "LABADI" },
    { x: 1580, y: 1158, label: "TESHIE" },
    { x: 1800, y: 1158, label: "NUNGUA" },
    { x: 1050, y: 112, label: "MADINA" },
    { x: 590, y: 112, label: "ACHIMOTA" },
    { x: 420, y: 636, label: "KANESHIE" },
    { x: 240, y: 1132, label: "DANSOMAN" },
    { x: 1600, y: 982, label: "SPINTEX" },
    { x: 220, y: 1040, label: "JAMESTOWN" },
    { x: 700, y: 900, label: "ADABRAKA" },
    { x: 860, y: 160, label: "NIMA" },
  ],
  lake: { x: 500, y: 1048, name: "KORLE" },
  seaLabel: "GULF OF GUINEA",
  focus: { x: 1000, y: 680 },
};

const KUMASI_SKIN: TownSkin = {
  ground: "#efe6cf",
  groundNight: "#46546e",
  beach: "#d7c4a2",
  sea: "#8fb8d8",
  deep: "#6f9bbf",
  coast: false,
  roadsH: ["BANTAMA ROAD", "PREMPEH II STREET", "HARPER ROAD", "LAKE ROAD", "ASOKWA ROAD"],
  roadsV: ["ABOABO", "KEJETIA LINK", "ADUM", "MANHYIA", "KNUST ROAD", "AIRPORT ROAD"],
  west: "TECHIMAN · SUNYANI · WENCHI",
  east: "ACCRA ROAD · EJISU · KONONGO",
  areas: [
    { x: 780, y: 250, label: "ADUM" },
    { x: 1120, y: 250, label: "MANHYIA" },
    { x: 440, y: 250, label: "BANTAMA" },
    { x: 1460, y: 160, label: "KNUST" },
    { x: 1500, y: 700, label: "ASOKWA" },
    { x: 400, y: 980, label: "LAKE ROAD" },
    { x: 1100, y: 980, label: "AHODWO" },
  ],
  lake: { x: 420, y: 1180, name: "BOSOMTWE" },
  seaLabel: "",
  focus: { x: 860, y: 620 },
};

export const TOWNS: Town[] = [
  {
    id: "accra",
    name: "Accra",
    vibe: "Capital, coast, offices, and a night that does not end.",
    open: true,
    arrival: "home",
    gate: "home",
    priceIndex: 1,
    weather: "Sea breeze, sudden rain, harmattan dust in December.",
    skin: ACCRA_SKIN,
    neighborhoods: [
      "Osu",
      "Labone",
      "Cantonments",
      "Airport Residential",
      "East Legon",
      "Madina",
      "Achimota",
      "Dansoman",
      "Kaneshie",
      "Makola",
      "Jamestown",
      "Nima",
      "Adabraka",
      "Spintex",
    ],
    landmarks: [
      { id: "independence", name: "Black Star Square", kind: "landmark", neighborhood: "Osu", hours: "Daylight", cost: "Free", blurb: "Independence Arch and the square. Parade ground of the city.", x: 1040, y: 420 },
      { id: "nkrumah", name: "Kwame Nkrumah Memorial", kind: "landmark", neighborhood: "High Street", hours: "9:00 – 17:00", cost: "From ₵10", blurb: "The mausoleum, the fountains, and a quiet walk.", x: 900, y: 700 },
      { id: "jamestown-light", name: "Jamestown Lighthouse", kind: "landmark", neighborhood: "Jamestown", hours: "9:00 – 17:00", cost: "From ₵20", blurb: "Climb the lighthouse. The harbour and the sea sit under you.", x: 180, y: 1080 },
      { id: "osu-castle", name: "Osu Castle", kind: "landmark", neighborhood: "Osu", hours: "Closed to the public", cost: "Look from the road", blurb: "The castle on the rocks. You walk the road outside the walls.", x: 760, y: 1088 },
      { id: "makola", name: "Makola Market", kind: "shopping", neighborhood: "Makola", hours: "6:00 – 18:00", cost: "From ₵5", blurb: "Cloth, tomatoes, and a lane that never sits down.", x: 280, y: 760 },
      { id: "kaneshie-market", name: "Kaneshie Market", kind: "shopping", neighborhood: "Kaneshie", hours: "6:00 – 18:00", cost: "From ₵8", blurb: "Foodstuffs under one roof. Gari, rice, and the pepper seller.", x: 420, y: 700 },
      { id: "beach", name: "Labadi Beach", kind: "nightlife", neighborhood: "Labadi", hours: "9:00 – late", cost: "From ₵10", blurb: "Horses, speakers, and the Gulf of Guinea.", x: 1100, y: 1100 },
      { id: "bojo", name: "Bojo Beach", kind: "nightlife", neighborhood: "Bortianor", hours: "9:00 – 18:00", cost: "Boat fare", blurb: "A boat, then a quieter beach.", x: 200, y: 1200 },
      { id: "mall", name: "Accra Mall", kind: "shopping", neighborhood: "Tetteh Quarshie", hours: "10:00 – 21:00", cost: "From ₵18", blurb: "Cinema, grocery, and cold air.", x: 1500, y: 400 },
      { id: "kotoka", name: "Kotoka Airport", kind: "transport", neighborhood: "Airport Residential", hours: "Always", cost: "Fare on the board", blurb: "Domestic gate for Kumasi. Passion Airways boards here.", x: 180, y: 520 },
      { id: "legon", name: "University of Ghana", kind: "work", neighborhood: "Legon", hours: "8:00 – 17:00", cost: "Free to walk", blurb: "The hill, the tower, and students crossing the road.", x: 1200, y: 180 },
      { id: "botanical", name: "Legon Botanical", kind: "landmark", neighborhood: "Legon", hours: "8:00 – 17:00", cost: "From ₵10", blurb: "Trees and a quiet path above the city.", x: 1400, y: 200 },
      { id: "enzo", name: "Enzo Club", kind: "nightlife", neighborhood: "East Legon", hours: "20:00 – late", cost: "From ₵36", blurb: "A late door and a dark floor.", x: 1588, y: 248 },
      { id: "aura-cafe", name: "Aura Cafe", kind: "food", neighborhood: "East Legon", hours: "8:00 – 21:00", cost: "From ₵22", blurb: "Coffee and a slow table.", x: 1660, y: 220 },
      { id: "kfc", name: "KFC", kind: "food", neighborhood: "Osu", hours: "10:00 – 22:00", cost: "From ₵28", blurb: "Streetwise on Oxford Street.", x: 560, y: 500 },
      { id: "flicks-licks", name: "Flicks and Licks", kind: "food", neighborhood: "East Legon", hours: "11:00 – 22:00", cost: "From ₵26", blurb: "Waffles and ice cream.", x: 1588, y: 500 },
      { id: "frozen-cabana", name: "Frozen Cabana", kind: "food", neighborhood: "East Legon", hours: "12:00 – 22:00", cost: "From ₵18", blurb: "A cold cup in the shade.", x: 1720, y: 500 },
    ],
    people: [],
    events: [
      { id: "detty", title: "Detty December", detail: "The diaspora is home. Clubs and Labadi run all night.", month: 11, spots: ["beach", "osu-night-market"] },
      { id: "homowo", title: "Homowo", detail: "Ga harvest. Kpokpoi in Jamestown.", month: 7, spots: ["jamestown"] },
      { id: "chale-wote", title: "Chale Wote", detail: "Street art on the Jamestown lanes.", month: 7, spots: ["jamestown", "jamestown-light"] },
    ],
    jobs: [],
    lines: [
      { id: "circle-madina", name: "Circle – Madina", mode: "trotro", color: "#FCD116", points: [{ x: 440, y: 380 }, { x: 780, y: 380 }, { x: 1120, y: 380 }, { x: 1460, y: 140 }] },
      { id: "kaneshie-spintex", name: "Kaneshie – Spintex", mode: "trotro", color: "#CE1126", points: [{ x: 440, y: 620 }, { x: 780, y: 880 }, { x: 1460, y: 880 }, { x: 1600, y: 930 }] },
      { id: "osu-labadi", name: "Osu – Labadi", mode: "trotro", color: "#006B3F", points: [{ x: 780, y: 380 }, { x: 780, y: 880 }, { x: 1120, y: 1160 }] },
    ],
    taxis: [
      { name: "Circle taxi rank", x: 780, y: 620 },
      { name: "Kotoka taxi", x: 220, y: 560 },
      { name: "Kaneshie rank", x: 440, y: 680 },
    ],
    okada: [
      { name: "Madina okada", x: 1120, y: 160 },
      { name: "Nima okada", x: 860, y: 200 },
      { name: "Spintex okada", x: 1600, y: 900 },
    ],
    stops: [
      { name: "Makola stop", x: 280, y: 800 },
      { name: "Osu Oxford stop", x: 640, y: 400 },
      { name: "37 stop", x: 1120, y: 400 },
      { name: "Labadi stop", x: 1120, y: 1100 },
    ],
  },
  {
    id: "kumasi",
    name: "Kumasi",
    vibe: "Garden city. Markets, kente, and the Asante palace.",
    open: true,
    arrival: "kejetia",
    gate: "kumasi",
    priceIndex: 0.9,
    weather: "Greener, wetter, cooler under the trees than Accra.",
    skin: KUMASI_SKIN,
    neighborhoods: ["Adum", "Manhyia", "Bantama", "Asokwa", "Ahodwo", "KNUST", "Suame", "Nhyiaeso"],
    landmarks: [
      { id: "kejetia", name: "Kejetia Market", kind: "shopping", neighborhood: "Adum", hours: "6:00 – 18:00", cost: "From ₵8", blurb: "The biggest market in West Africa. You will lose the lane and find a price.", x: 780, y: 620 },
      { id: "kumasi-central", name: "Kumasi Central Market", kind: "shopping", neighborhood: "Adum", hours: "6:00 – 18:00", cost: "From ₵6", blurb: "The older lanes beside Kejetia. Cloth and second-hand shoes.", x: 700, y: 740 },
      { id: "manhyia", name: "Manhyia Palace", kind: "landmark", neighborhood: "Manhyia", hours: "9:00 – 17:00", cost: "₵40 museum", blurb: "Gold weights, stools, and the seat of the Asantehene.", x: 1120, y: 380 },
      { id: "baba-yara", name: "Baba Yara Stadium", kind: "nightlife", neighborhood: "Bantama", hours: "Match days", cost: "From ₵20", blurb: "Asante Kotoko. The stands do not sit quietly.", x: 440, y: 380 },
      { id: "knust", name: "KNUST", kind: "work", neighborhood: "KNUST", hours: "8:00 – 17:00", cost: "Free to walk", blurb: "The university in the trees. Tech junction feeds the whole campus.", x: 1460, y: 250 },
      { id: "bosomtwe", name: "Lake Bosomtwe", kind: "landmark", neighborhood: "Lake Road", hours: "8:00 – 17:00", cost: "From ₵15", blurb: "A crater lake outside the city. Grilled tilapia and still water.", x: 400, y: 1100 },
      { id: "adum-night", name: "Adum night", kind: "nightlife", neighborhood: "Adum", hours: "19:00 – late", cost: "From ₵30", blurb: "Prempeh II after dark. Highlife, then something louder.", x: 900, y: 520 },
      { id: "fufu-joint", name: "Asafo fufu joint", kind: "food", neighborhood: "Asafo", hours: "11:00 – 21:00", cost: "From ₵25", blurb: "Ashanti fufu and light soup. You will need the bench after.", x: 620, y: 500 },
      { id: "kumasi-airport", name: "Kumasi Airport", kind: "transport", neighborhood: "Airport Road", hours: "Always", cost: "Fare on the board", blurb: "Passion Airways back to Kotoka. A short terminal and a long queue.", x: 1700, y: 280 },
      { id: "bonwire-stall", name: "Bonwire kente stall", kind: "shopping", neighborhood: "Adum", hours: "9:00 – 17:00", cost: "From ₵180", blurb: "Handwoven strips. Heavy, bright, and not cheap.", x: 980, y: 700 },
      { id: "tech-junction", name: "Tech Junction", kind: "food", neighborhood: "KNUST", hours: "6:00 – 21:00", cost: "From ₵5", blurb: "Waakye, trotros, and the gate of the university.", x: 1340, y: 300 },
      { id: "komfo-anokye", name: "Komfo Anokye", kind: "landmark", neighborhood: "Bantama", hours: "Always", cost: "From ₵30", blurb: "The teaching hospital. Wards, queues, and malt for the person you came to see.", x: 360, y: 520 },
      { id: "ahodwo-gym", name: "Ahodwo Gym", kind: "work", neighborhood: "Ahodwo", hours: "5:30 – 21:00", cost: "From ₵25", blurb: "Weights, a class, and afrobeats.", x: 1280, y: 1000 },
      { id: "kumasi-mall", name: "Kumasi City Mall", kind: "shopping", neighborhood: "Lake Road", hours: "10:00 – 21:00", cost: "From ₵12", blurb: "Cinema and a food court on Lake Road.", x: 860, y: 1000 },
      { id: "cultural-centre", name: "Cultural Centre", kind: "landmark", neighborhood: "Bantama", hours: "9:00 – 17:00", cost: "From ₵10", blurb: "Drums and craft stalls.", x: 300, y: 260 },
      { id: "rattray", name: "Rattray Park", kind: "landmark", neighborhood: "Nhyiaeso", hours: "9:00 – 18:00", cost: "₵15 gate", blurb: "A lake path and shade.", x: 1600, y: 760 },
      { id: "suame", name: "Suame Magazine", kind: "work", neighborhood: "Suame", hours: "7:00 – 18:00", cost: "From ₵40", blurb: "Spare parts and apprentices.", x: 960, y: 220 },
    ],
    people: [
      { id: "yaa", name: "Yaa", line: "Yaa is at Kejetia", x: 800, y: 600, shirt: "#FCD116", slang: "Chale, the price is the price." },
      { id: "kwadwo", name: "Kwadwo", line: "Kwadwo is at Manhyia", x: 1140, y: 360, shirt: "#006B3F", slang: "The palace does not rush." },
      { id: "akosua", name: "Akosua", line: "Akosua is at KNUST", x: 1480, y: 230, shirt: "#CE1126", slang: "Tech junction, then the library." },
      { id: "kojo-k", name: "Kojo", line: "Kojo is at Baba Yara", x: 460, y: 360, shirt: "#121212", slang: "Kotoko, no discussion." },
    ],
    events: [
      { id: "akwasidae", title: "Akwasidae", detail: "A Sunday for the Asantehene. Cloth, drums, and Manhyia full.", month: null, spots: ["manhyia"] },
      { id: "kejetia-friday", title: "Friday market rush", detail: "Kejetia before the weekend. Every lane is a person.", month: null, spots: ["kejetia", "kumasi-central"] },
    ],
    jobs: [
      { id: "kejetia-hand", place: "kejetia", title: "Kejetia hand" },
      { id: "palace-guide", place: "manhyia", title: "Palace museum guide" },
    ],
    lines: [
      { id: "kejetia-knust", name: "Kejetia – KNUST", mode: "trotro", color: "#FCD116", points: [{ x: 780, y: 620 }, { x: 1120, y: 380 }, { x: 1460, y: 250 }] },
      { id: "kejetia-asokwa", name: "Kejetia – Asokwa", mode: "trotro", color: "#CE1126", points: [{ x: 780, y: 620 }, { x: 1120, y: 880 }, { x: 1500, y: 880 }] },
      { id: "bantama-lake", name: "Bantama – Lake Road", mode: "bus", color: "#006B3F", points: [{ x: 440, y: 380 }, { x: 440, y: 880 }, { x: 400, y: 1100 }] },
    ],
    taxis: [
      { name: "Kejetia taxi rank", x: 820, y: 660 },
      { name: "KNUST taxi", x: 1460, y: 300 },
      { name: "Airport taxi", x: 1660, y: 320 },
    ],
    okada: [
      { name: "Adum okada", x: 860, y: 500 },
      { name: "Asokwa okada", x: 1400, y: 860 },
    ],
    stops: [
      { name: "Kejetia station", x: 740, y: 640 },
      { name: "Manhyia stop", x: 1120, y: 420 },
      { name: "Tech junction", x: 1400, y: 280 },
    ],
  },
  {
    id: "takoradi",
    name: "Takoradi",
    vibe: "Harbour, oil, and a slower coast.",
    open: false,
    arrival: "takoradi",
    gate: "takoradi",
    priceIndex: 1,
    weather: "Salt air off the harbour.",
    skin: ACCRA_SKIN,
    neighborhoods: ["Market Circle", "Beach Road", "Harbour"],
    landmarks: [],
    people: [],
    events: [],
    jobs: [],
    lines: [],
    taxis: [],
    okada: [],
    stops: [],
  },
  {
    id: "tamale",
    name: "Tamale",
    vibe: "Northern capital. Heat, smock, and the central mosque.",
    open: false,
    arrival: "tamale",
    gate: "tamale",
    priceIndex: 0.85,
    weather: "Hot, dry, and a hard sun.",
    skin: ACCRA_SKIN,
    neighborhoods: ["Central", "Lamashegu"],
    landmarks: [],
    people: [],
    events: [],
    jobs: [],
    lines: [],
    taxis: [],
    okada: [],
    stops: [],
  },
  {
    id: "cape-coast",
    name: "Cape Coast",
    vibe: "Castle, school bands, and the sea at the end of every road.",
    open: false,
    arrival: "cape-coast",
    gate: "cape-coast",
    priceIndex: 1,
    weather: "Coast mist in the morning.",
    skin: ACCRA_SKIN,
    neighborhoods: ["Castle", "Kotokuraba"],
    landmarks: [],
    people: [],
    events: [],
    jobs: [],
    lines: [],
    taxis: [],
    okada: [],
    stops: [],
  },
  {
    id: "ho",
    name: "Ho",
    vibe: "Volta hills, a quiet market, and a long view.",
    open: false,
    arrival: "ho",
    gate: "ho",
    priceIndex: 0.9,
    weather: "Cooler evenings in the hills.",
    skin: KUMASI_SKIN,
    neighborhoods: ["Market", "Civic Centre"],
    landmarks: [],
    people: [],
    events: [],
    jobs: [],
    lines: [],
    taxis: [],
    okada: [],
    stops: [],
  },
];

export function townOf(id: string | undefined): Town {
  return TOWNS.find((town) => town.id === id) ?? TOWNS[0];
}

export function townIdOfSpot(spot: { id: string; town?: string }): TownId {
  if (spot.id === "home") return "accra";
  if (spot.town === "kumasi" || spot.town === "takoradi" || spot.town === "tamale" || spot.town === "cape-coast" || spot.town === "ho") return spot.town;
  return "accra";
}

export function arrivalFor(placeId: string, spotTown?: string): { where: string; town: TownId } {
  if (placeId === "kumasi") return { where: "kejetia", town: "kumasi" };
  if (placeId === "home") return { where: "home", town: "accra" };
  const town = townIdOfSpot({ id: placeId, town: spotTown });
  return { where: placeId, town };
}

export function crossedTownNote(from: TownId, to: TownId, drove: boolean, hasCar: boolean) {
  if (from === to) return null;
  if (to === "accra") return "Back in Accra. The room is as you left it. Rent still fell due, and any shop you left kept selling.";
  const car = hasCar && !drove ? " Your car stays parked in Accra." : hasCar && drove ? " The car came with you." : "";
  return `${townOf(to).name}. Your Accra home stays locked. Rent still falls due, the businesses keep their tills, and MoMo brought your cash. Friends will call.${car}`;
}

export function landmarkOf(id: string) {
  for (const town of TOWNS) {
    const found = town.landmarks.find((item) => item.id === id);
    if (found) return found;
  }
  return null;
}

export function placeCard(spot: Spot) {
  const known = landmarkOf(spot.id);
  const costs = spot.actions.map((verb) => verb.cost).filter((cost) => cost > 0);
  const low = costs.length ? Math.min(...costs) : 0;
  return {
    hours: known?.hours ?? (spot.group === "hang" || spot.group === "sea" ? "11:00 – late" : "8:00 – 18:00"),
    cost: known?.cost ?? (low ? `From ₵${low}` : "Free to walk in"),
    neighborhood: known?.neighborhood ?? "",
  };
}

export function kindsOf(spot: Spot): PlaceKind[] {
  const known = landmarkOf(spot.id);
  if (known) return [known.kind];
  const kinds: PlaceKind[] = [];
  if (spot.actions.some((verb) => verb.tag === "food")) kinds.push("food");
  if (spot.actions.some((verb) => verb.tag === "church")) kinds.push("worship");
  if (spot.group === "work") kinds.push("work");
  if (spot.group === "hang" || spot.group === "sea") kinds.push("nightlife");
  if (spot.group === "civic") kinds.push("landmark");
  if (/church|mosque/.test(spot.id)) kinds.push("worship");
  if (/market|mall|makola|kejetia/.test(spot.id)) kinds.push("shopping");
  if (/kotoka|airport|station/.test(spot.id)) kinds.push("transport");
  return kinds;
}

export function spotOnMap(spot: Spot, town: TownId) {
  return townIdOfSpot(spot) === town;
}

export function spotMatches(spot: Spot, filter: string, query: string) {
  const text = query.trim().toLowerCase();
  if (text && !`${spot.name} ${spot.blurb}`.toLowerCase().includes(text)) return false;
  if (filter === "all" || filter === "stars") return true;
  if (spot.group === filter) return true;
  return kindsOf(spot).includes(filter as PlaceKind);
}

export function townEventNow(town: Town, at: Date) {
  const month = at.getUTCMonth();
  const weekday = at.getUTCDay();
  return (
    town.events.find((event) => {
      if (event.id === "akwasidae") return weekday === 0;
      if (event.id === "kejetia-friday") return weekday === 5;
      return event.month == null || event.month === month;
    }) ?? null
  );
}

export function roadTone(index: number, at: Date) {
  const hour = at.getUTCHours();
  const rush = (hour >= 7 && hour <= 9) || (hour >= 16 && hour <= 19);
  const band = (index + hour) % 3;
  if (!rush && band === 0) return "#3f8f4a";
  if (band === 1) return rush ? "#e0b325" : "#3f8f4a";
  return rush ? "#d23b45" : "#e0b325";
}
