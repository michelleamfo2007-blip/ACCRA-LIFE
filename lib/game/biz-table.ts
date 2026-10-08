export type BizKind = {
  id: string;
  label: string;
  emoji: string;
  area: string;
  price: number;
  perHour: number;
  wages: number;
  detail: string;
  group?: string;
  /** Map pin the owner walks into. */
  spot?: string;
  town?: "accra" | "kumasi";
  difficulty?: "easy" | "steady" | "hard";
  skill?: "hustle" | "cooking" | "charm" | "fitness" | "music" | "career";
  homeOk?: boolean;
};

function row(
  id: string,
  label: string,
  emoji: string,
  group: string,
  area: string,
  spot: string,
  price: number,
  perHour: number,
  wages: number,
  detail: string,
  extra: Partial<BizKind> = {},
): BizKind {
  return { id, label, emoji, group, area, spot, price, perHour, wages, detail, difficulty: "steady", skill: "hustle", ...extra };
}

export const BUSINESSES: BizKind[] = [
  row("momo", "MoMo agent stand", "📱", "Services", "Circle", "viewing", 2500, 6, 180, "A float and a queue sending money home.", { difficulty: "easy" }),
  row("kiosk", "Provisions shop", "🏪", "Retail", "Madina", "madina", 1500, 4, 120, "Sachet water, Milo, airtime.", { difficulty: "easy" }),
  row("barber", "Barber shop", "💈", "Services", "Kaneshie", "kaneshie-market", 3000, 8, 300, "Two chairs and a Saturday queue.", { skill: "charm", difficulty: "easy" }),
  row("salon", "Hair salon", "✂️", "Services", "Adabraka", "salon", 4000, 10, 380, "Braids, weave, and the gist.", { skill: "charm" }),
  row("chop-bar", "Chop bar", "🍲", "Food", "Osu", "buka", 6000, 15, 600, "Fufu, banku, and light soup.", { skill: "cooking" }),
  row("drinks", "Bar", "🍺", "Food", "Labadi", "beach", 9000, 22, 900, "Cold Club and a speaker that does not rest.", { skill: "charm" }),
  row("boutique", "Boutique", "👗", "Retail", "East Legon", "mall", 12000, 28, 1100, "Clothes people post.", { skill: "charm", difficulty: "hard" }),
  row("waakye", "Waakye stand", "🫘", "Food", "Madina", "madina", 2200, 7, 160, "The morning pot. Shito on the side.", { skill: "cooking", difficulty: "easy", town: "accra" }),
  row("shawarma", "Shawarma spot", "🌯", "Food", "Osu", "osu-shawarma", 4500, 12, 280, "Wraps after the clubs empty.", { skill: "cooking" }),
  row("pizza", "Pizza shop", "🍕", "Food", "Spintex", "pizza-oven", 8000, 16, 420, "One oven and a delivery bike.", { skill: "cooking" }),
  row("burger", "Burger joint", "🍔", "Food", "Circle", "burger-joint", 5500, 13, 320, "A grill and fries in a paper boat.", { skill: "cooking" }),
  row("ice-cream", "Ice cream parlor", "🍦", "Food", "Labadi", "fanice-parlour", 3500, 9, 200, "Cups, cones, and a humming freezer.", { difficulty: "easy" }),
  row("coffee", "Coffee shop", "☕", "Food", "Airport City", "morning-coffee", 7000, 14, 360, "Opens with the offices.", { skill: "charm" }),
  row("bakery", "Bakery", "🍞", "Food", "Circle", "circle-bakery", 4000, 10, 240, "Bread before dawn. Pies by nine.", { skill: "cooking", difficulty: "easy" }),
  row("lounge", "Lounge", "🛋️", "Food", "Osu", "bloom", 18000, 30, 1400, "Low light and a short menu.", { skill: "charm", difficulty: "hard" }),
  row("nightclub", "Club", "🪩", "Food", "East Legon", "enzo", 40000, 48, 2800, "A door, a floor, and a till that only moves at night.", { skill: "charm", difficulty: "hard" }),
  row("truck", "Food truck", "🚚", "Food", "Circle", "viewing", 5000, 11, 200, "You park where the crowd already is.", { skill: "cooking", homeOk: true }),
  row("catering", "Catering", "🍱", "Food", "Home", "home", 2500, 8, 0, "Pots at home. You deliver the party.", { skill: "cooking", homeOk: true, difficulty: "easy" }),
  row("mini-mart", "Mini-mart", "🏬", "Retail", "Spintex", "mini-mart", 9000, 14, 400, "Open when the street is shut.", { difficulty: "steady" }),
  row("supermarket", "Supermarket", "🛒", "Retail", "Teshie", "mall-super", 35000, 40, 2200, "Aisles, a cold room, a long receipt.", { difficulty: "hard", skill: "career" }),
  row("shoes", "Shoe shop", "👞", "Retail", "Kantamanto", "kantamanto", 4500, 10, 260, "Pairs on the wall. The right size is the sale.", { skill: "charm" }),
  row("phones", "Phone shop", "📱", "Retail", "Circle", "viewing", 8000, 15, 380, "Handsets, cases, and a glass counter.", { skill: "charm" }),
  row("electronics", "Electronics shop", "📺", "Retail", "Accra Mall", "mall", 15000, 22, 700, "Speakers, screens, and a warranty you explain twice.", { skill: "career" }),
  row("cosmetics", "Cosmetics shop", "💄", "Retail", "Osu", "mall", 6000, 12, 300, "Creams, oils, and a tester no one puts back.", { skill: "charm" }),
  row("furniture", "Furniture showroom", "🛋️", "Retail", "Spintex", "furniture-hall", 20000, 24, 800, "Sofas in a row. The van is extra.", { skill: "career", difficulty: "hard" }),
  row("books", "Bookstore", "📚", "Retail", "Ridge", "public-library", 5000, 8, 220, "Quiet trade. The regulars know the shelf.", { skill: "career", difficulty: "easy" }),
  row("hardware", "Hardware store", "🔩", "Retail", "Spintex", "hardware-yard", 10000, 16, 450, "Cement, nails, and the pipe they actually need.", { skill: "career" }),
  row("nails", "Nail salon", "💅", "Services", "Osu", "nail-bar", 3500, 9, 220, "A colour wheel and an hour in the chair.", { skill: "charm", difficulty: "easy" }),
  row("spa", "Spa", "💆", "Services", "Airport", "spa-house", 14000, 20, 700, "An hour where nobody needs them.", { skill: "charm", difficulty: "hard" }),
  row("tailor", "Tailor shop", "🧵", "Services", "Adabraka", "kantamanto", 3000, 8, 200, "Measure twice. The wedding is on Saturday.", { skill: "charm", homeOk: true }),
  row("laundry", "Laundry", "👕", "Services", "Osu", "laundry-house", 4500, 10, 250, "Machines, tokens, and Thursday pickup.", { difficulty: "easy" }),
  row("wash", "Car wash", "🧽", "Services", "Spintex", "osu-car-wash", 3500, 9, 180, "Soap, a hose, and a tip that is not on the sign.", { difficulty: "easy" }),
  row("mechanic", "Mechanic garage", "🔧", "Services", "Suame", "suame", 8000, 14, 400, "The car comes in loud and leaves quieter.", { skill: "career", town: "kumasi" }),
  row("repair", "Phone repair", "🛠️", "Services", "Circle", "viewing", 2500, 7, 140, "A screen, a battery, and a promise of one hour.", { difficulty: "easy", homeOk: true }),
  row("studio", "Photo studio", "📸", "Services", "Osu", "mall", 6000, 12, 280, "Passport photos and the portrait they actually wanted.", { skill: "charm", homeOk: true }),
  row("print", "Printing shop", "🖨️", "Services", "Adum", "adum-print", 4000, 9, 200, "Flyers, a cyber hour, and a queue for the colour machine.", { town: "kumasi", difficulty: "easy" }),
  row("events", "Event planning", "🎉", "Services", "East Legon", "kempinski", 5000, 12, 0, "You sell the Saturday. The hall is someone else's.", { skill: "charm", homeOk: true }),
  row("cleaning", "Cleaning service", "🧹", "Services", "Home", "home", 1500, 6, 0, "A crew, a list, and houses that want you back.", { homeOk: true, difficulty: "easy" }),
  row("security", "Security company", "🛡️", "Services", "Ridge", "estate-agent", 12000, 18, 800, "Guards on a roster. The gate is the product.", { skill: "career", difficulty: "hard" }),
  row("taxi", "Taxi fleet", "🚕", "Transport", "Circle", "viewing", 15000, 20, 600, "Two cars and drivers who know the fare.", { skill: "career", difficulty: "hard" }),
  row("trotro", "Trotro fleet", "🚐", "Transport", "Circle", "kaneshie-market", 22000, 26, 900, "A route and a mate who calls the stop.", { skill: "career", difficulty: "hard" }),
  row("okada", "Okada fleet", "🏍️", "Transport", "Circle", "okada-hub", 6000, 12, 250, "Helmets on the handlebars.", { difficulty: "steady" }),
  row("delivery", "Delivery fleet", "📦", "Transport", "Spintex", "mini-mart", 7000, 13, 300, "The phone rings. A rider goes.", { homeOk: true }),
  row("rental", "Car rental", "🚗", "Transport", "Airport", "car-showroom", 25000, 28, 700, "Keys, a deposit, and a car that must come back.", { skill: "career", difficulty: "hard" }),
  row("tours", "Tour company", "🗺️", "Transport", "Kotoka", "kotoka", 8000, 14, 300, "A van, a story, and visitors who want the city.", { skill: "charm" }),
  row("cinema", "Cinema", "🎬", "Entertainment", "Accra Mall", "mall", 50000, 42, 2000, "A dark room and a ticket.", { skill: "career", difficulty: "hard" }),
  row("arcade", "Arcade", "🕹️", "Entertainment", "Accra Mall", "mall", 9000, 12, 280, "Tokens and a high score nobody believes.", { difficulty: "steady" }),
  row("karaoke", "Karaoke bar", "🎤", "Entertainment", "Osu", "karaoke-box", 11000, 16, 450, "A book of songs and friends who will not sit.", { skill: "music" }),
  row("concert", "Concert venue", "🎶", "Entertainment", "Accra", "theatre", 60000, 50, 2500, "A stage. The night is the product.", { skill: "music", difficulty: "hard" }),
  row("record", "Recording studio", "🎙️", "Entertainment", "Osu", "mall", 18000, 20, 500, "A booth, a beat, and a session that runs late.", { skill: "music", difficulty: "hard" }),
  row("gaming", "Gaming lounge", "🎮", "Entertainment", "East Legon", "mall", 8000, 13, 300, "Screens, chairs, and an hour you sell twice.", { skill: "charm" }),
  row("apartments", "Rental apartments", "🏘️", "Property", "Spintex", "estate-agent", 40000, 30, 400, "Rooms you do not sleep in. Rent on the first.", { skill: "career", difficulty: "hard" }),
  row("hostel", "Hostel", "🛏️", "Property", "Madina", "madina", 20000, 22, 600, "Students, bunks, and a gate that locks at midnight.", { skill: "career" }),
  row("hotel", "Hotel", "🏨", "Property", "Ridge", "kempinski", 120000, 70, 4000, "A desk, a key, and breakfast you did not cook.", { skill: "career", difficulty: "hard" }),
  row("guesthouse", "Guesthouse", "🏡", "Property", "Cantonments", "kempinski", 30000, 26, 800, "Fewer rooms. The guest knows your name.", { skill: "charm", difficulty: "hard" }),
  row("farm", "Farm", "🌽", "Other", "Kasoa", "home", 4000, 8, 150, "Beds, water, and a Saturday harvest.", { homeOk: true, skill: "hustle", difficulty: "easy" }),
  row("fishing", "Fishing business", "🐟", "Other", "Tema", "tema-fish-market", 7000, 12, 250, "Ice, a boat contact, and the morning price.", { town: "accra" }),
  row("poultry", "Poultry farm", "🐓", "Other", "Kasoa", "home", 5000, 10, 180, "Birds, feed, and eggs you can count.", { homeOk: true }),
  row("imports", "Import desk", "🚢", "Other", "Tema", "tema", 15000, 20, 400, "A container, a clearing agent, and a phone that never sleeps.", { skill: "career", difficulty: "hard" }),
  row("online", "Online store", "🛒", "Other", "Home", "home", 800, 4, 0, "Photos, MoMo, and a rider.", { homeOk: true, difficulty: "easy" }),
  row("socials", "Social page", "📣", "Other", "Home", "home", 400, 3, 0, "You sell attention. The product can be someone else's.", { homeOk: true, skill: "charm", difficulty: "easy" }),
  row("creator", "Content work", "🎬", "Other", "Home", "home", 600, 5, 0, "A phone, a cut, and a post that has to land.", { homeOk: true, skill: "charm" }),
  row("beats", "Music production", "🎵", "Other", "Home", "home", 3000, 8, 0, "Beats for people who will pay when the song lands.", { homeOk: true, skill: "music" }),
  row("photos", "Photography", "📷", "Other", "Osu", "mall", 2000, 7, 0, "Weddings, graduations, and the edit after.", { homeOk: true, skill: "charm" }),
  row("gym", "Fitness gym", "💪", "Other", "Osu", "gym", 16000, 18, 700, "Weights, a class, and a membership that renews.", { skill: "fitness", difficulty: "hard" }),
  row("kejetia-stall", "Kejetia stall", "🧺", "Retail", "Kejetia", "kejetia", 2000, 7, 140, "The biggest market. The lane is the rent.", { town: "kumasi", difficulty: "easy" }),
];

export const MAX_BIZ_LEVEL = 3;
export const TILL_HOURS = 48;

export function bizKind(id: string) {
  return BUSINESSES.find((item) => item.id === id) ?? BUSINESSES[0];
}

export function bizRate(kind: string, level: number) {
  return bizKind(kind).perHour * (1 + 0.5 * (Math.max(1, level) - 1));
}

export function bizWages(kind: string, level: number, shop?: { staff?: { pay: number }[] }) {
  if (shop?.staff?.length) return shop.staff.reduce((sum, person) => sum + person.pay, 0);
  return Math.round(bizKind(kind).wages * (1 + 0.4 * (Math.max(1, level) - 1)));
}

export const BIZ_GROUPS = ["Food", "Retail", "Services", "Transport", "Entertainment", "Property", "Other"] as const;
