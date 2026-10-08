import { CLUB_IDS } from "@/lib/game/accra-spots";

export type Meal = "breakfast" | "lunch" | "dinner" | "late";
export type Stall = "street" | "chop" | "fast" | "fine" | "bar" | "beach" | "cafe" | "late";

export type Food = {
  id: string;
  name: string;
  price: number;
  detail: string;
  stall: Stall[];
  meal: Meal[];
  hunger: number;
  fun: number;
  energy: number;
  risk?: number;
  deliver?: boolean;
  city?: "accra" | "kumasi";
  /** Clean food lifts hygiene. That is the health effect. */
  health?: number;
  season?: "rainy" | "harmattan";
  /** Only listed when the order text matches that kind of place. */
  where?: "beach" | "airport" | "club";
};

const day: Meal[] = ["breakfast", "lunch", "dinner"];
const all: Meal[] = ["breakfast", "lunch", "dinner", "late"];
const night: Meal[] = ["dinner", "late"];

function food(
  id: string,
  name: string,
  price: number,
  detail: string,
  stall: Stall[],
  meal: Meal[],
  hunger: number,
  fun: number,
  energy = 0,
  extra: Partial<Food> = {},
): Food {
  return { id, name, price, detail, stall, meal, hunger, fun, energy, ...extra };
}

export const FOODS: Food[] = [
  food("loaded-fries", "Loaded fries", 18, "Fries, sausage, and a spoon of shito.", ["street", "fast", "late"], all, 16, 8, 0, { deliver: true, risk: 0.04 }),
  food("fries", "Plain fries", 10, "Salt, paper, and a traffic light.", ["street", "fast"], all, 10, 4, 0, { deliver: true }),
  food("kelewele", "Kelewele", 8, "Ripe plantain, ginger, pepper.", ["street", "chop", "late"], all, 14, 8, 0, { deliver: true }),
  food("bofrot", "Bofrot", 5, "Puff-puff in a rubber.", ["street", "chop"], day, 10, 6),
  food("koose", "Koose", 5, "Bean cakes, hot from the pan.", ["street", "chop"], ["breakfast", "lunch"], 12, 4),
  food("chichinga", "Chichinga", 12, "Beef kebab, pepper, a stick.", ["street", "late"], night, 16, 6, 0, { risk: 0.06 }),
  food("wings", "Chicken wings", 22, "Peppered, or plain if you ask nicely.", ["street", "fast", "late"], night, 18, 8, 0, { deliver: true }),
  food("feet", "Chicken feet", 10, "The spicy ones at the roadside grill.", ["street", "chop"], ["lunch", "dinner"], 12, 4, 0, { risk: 0.08 }),
  food("gizzard", "Peppered gizzard", 15, "Grilled, then drowned in pepper.", ["street", "chop", "late"], night, 14, 8),
  food("egg-pepper", "Boiled egg and pepper", 4, "The egg seller's small tray.", ["street"], all, 8, 2),
  food("corn", "Roasted corn", 5, "Or boiled, if the pot is out.", ["street", "beach"], day, 10, 4),
  food("groundnut", "Roasted groundnuts", 3, "A cup, still warm.", ["street"], all, 6, 2),
  food("harmattan-nuts", "Harmattan groundnuts", 4, "Dry-season cups. The wind does the roasting.", ["street"], all, 6, 2, 0, { season: "harmattan" }),
  food("coconut", "Fresh coconut", 8, "The man with the machete. Best when the rains are on.", ["street", "beach"], day, 8, 6, 2, { season: "rainy", health: 2 }),
  food("plantain-chips", "Plantain chips", 5, "A bag that does not last the ride.", ["street"], all, 6, 4),
  food("chin-chin", "Chin chin", 6, "Sweet, crunchy, gone.", ["street", "chop", "cafe"], all, 6, 4),
  food("meat-pie", "Meat pie", 8, "From the glass case.", ["street", "cafe", "fast"], day, 12, 4),
  food("sausage-roll", "Sausage roll", 8, "The flaky one.", ["street", "cafe", "fast"], day, 12, 4),
  food("ice-kenkey", "Ice kenkey", 6, "Cold, smooth, a roadside cup.", ["street"], day, 10, 6, 2),
  food("sobolo", "Sobolo", 5, "Hibiscus, ginger, cold.", ["street", "chop"], all, 4, 6, 2, { deliver: true }),
  food("sachet", "Sachet water", 1, "Pure water.", ["street", "chop", "late"], all, 2, 0, 1, { health: 1 }),
  food("bottle-water", "Bottled water", 4, "The cold one from the fridge.", ["fast", "cafe", "fine", "bar"], all, 2, 0, 1, { health: 1 }),
  food("airport-wrap", "Departure wrap", 35, "You eat it standing at the gate.", ["fast", "cafe"], all, 18, 2, 0, { where: "airport" }),
  food("gate-coffee", "Gate coffee", 18, "The last hot thing before boarding.", ["cafe"], all, 2, 2, 4, { where: "airport" }),
  food("coke", "Coke", 6, "A cold bottle.", ["street", "fast", "chop"], all, 4, 4, 2),
  food("fanta", "Fanta", 6, "Orange, sweating.", ["street", "fast", "chop"], all, 4, 4, 2),
  food("sprite", "Sprite", 6, "Clear and cold.", ["street", "fast", "chop"], all, 4, 3, 2),
  food("malta", "Malta", 7, "Heavy, sweet, filling.", ["street", "chop"], all, 8, 3),
  food("alvaro", "Alvaro", 8, "The pear one, or the other pear one.", ["street", "chop"], all, 6, 4),
  food("club-beer-street", "Club beer", 12, "A roadside cold one.", ["street", "bar", "late"], night, 4, 8, -2),
  food("fan-yoghurt", "Fan yoghurt", 6, "The sachet you bite.", ["street"], all, 6, 4),
  food("yoghurt", "Yoghurt", 8, "A cup from the fridge, not the sachet.", ["fast", "cafe"], all, 6, 3, 0, { health: 2 }),
  food("fan-milk", "Fan milk", 4, "The frozen sachet. Bite, then squeeze.", ["street"], all, 6, 6),
  food("fanice", "FanIce", 5, "The cart, the bell, the cup.", ["street", "beach"], day, 6, 8),
  food("waakye", "Waakye", 18, "Shito, gari, egg, fish, wele if you nod.", ["chop", "street"], ["breakfast", "lunch"], 36, 8, 4, { deliver: true }),
  food("jollof", "Jollof rice", 25, "Smoky, with chicken.", ["chop", "fast", "fine"], ["lunch", "dinner"], 34, 10, 2, { deliver: true }),
  food("fried-rice", "Fried rice", 28, "Egg, carrots, and a piece of chicken.", ["chop", "fast"], ["lunch", "dinner"], 32, 8, 2, { deliver: true }),
  food("rice-stew", "Rice and stew", 16, "The everyday plate.", ["chop"], day, 30, 4, 2, { deliver: true }),
  food("banku-tilapia", "Banku and tilapia", 40, "Grilled, with pepper.", ["chop", "beach"], ["lunch", "dinner"], 42, 12, 2, { deliver: true }),
  food("banku-okro", "Banku and okro", 22, "Okro stew, a ball of banku.", ["chop"], ["lunch", "dinner"], 38, 6),
  food("fufu-light", "Fufu and light soup", 30, "Goat, or chicken if the pot says so.", ["chop"], ["lunch", "dinner"], 44, 8, 2, { city: "accra" }),
  food("fufu-palm", "Fufu and palm nut soup", 32, "Heavy, red, and worth the nap.", ["chop"], ["lunch", "dinner"], 46, 8),
  food("fufu-groundnut", "Fufu and groundnut soup", 32, "The northern pot, thick and hot.", ["chop"], ["lunch", "dinner"], 46, 8, 0, { city: "kumasi" }),
  food("kenkey-fish", "Kenkey and fish", 20, "Pepper on the side.", ["chop", "street"], day, 34, 6, 0, { deliver: true }),
  food("kenkey-fried", "Kenkey and fried fish", 24, "Crisp fish, black pepper.", ["chop", "beach"], ["lunch", "dinner"], 36, 8),
  food("tz", "Tuo zaafi", 18, "TZ and ayoyo. A Kumasi plate.", ["chop"], ["lunch", "dinner"], 40, 6, 2, { city: "kumasi", deliver: true }),
  food("ampesi", "Ampesi and kontomire", 18, "Yam, plantain, and green stew.", ["chop"], ["lunch", "dinner"], 36, 6),
  food("red-red", "Red red", 16, "Beans and fried plantain.", ["chop"], day, 32, 8, 0, { deliver: true }),
  food("gobe", "Gobe", 12, "Gari and beans. Student fuel.", ["chop", "street"], day, 28, 4),
  food("yam-chips", "Yam chips", 15, "Fried yam, pepper sauce.", ["street", "chop"], day, 18, 6),
  food("yam-egg", "Yam and egg sauce", 18, "Breakfast that holds.", ["chop"], ["breakfast"], 30, 6),
  food("mpoto", "Mpoto mpoto", 16, "Mashed plantain, pepper, smoked fish.", ["chop"], ["lunch", "dinner"], 34, 6),
  food("etor", "Etor", 14, "Mashed yam, palm oil, eggs.", ["chop"], ["breakfast", "lunch"], 28, 4),
  food("omo-tuo", "Omo tuo", 20, "Rice balls and groundnut soup.", ["chop"], ["lunch", "dinner"], 40, 6, 0, { city: "kumasi" }),
  food("konkonte", "Konkonte", 16, "Dried cassava, palm nut soup.", ["chop"], ["lunch", "dinner"], 36, 4),
  food("rice-water", "Rice water", 8, "A light breakfast bowl.", ["chop", "street"], ["breakfast"], 16, 2),
  food("hausa-koko", "Hausa koko", 8, "Millet porridge and koose.", ["street", "chop"], ["breakfast"], 20, 4, 0, { city: "kumasi" }),
  food("koko", "Koko and koose", 8, "The morning stall.", ["street", "chop"], ["breakfast"], 20, 4, 2, { deliver: true }),
  food("tom-brown", "Tom brown", 8, "Roasted porridge, sweet.", ["street", "chop"], ["breakfast"], 18, 4),
  food("shawarma-chicken", "Chicken shawarma", 25, "Wrap, chips, and the white sauce.", ["fast", "street", "late"], night, 28, 10, 0, { deliver: true }),
  food("shawarma-beef", "Beef shawarma", 28, "The heavier wrap.", ["fast", "late"], night, 30, 8, 0, { deliver: true }),
  food("shawarma-mix", "Mixed shawarma", 32, "Chicken and beef. Do not ask them to choose.", ["fast", "late"], night, 32, 10, 0, { deliver: true }),
  food("burger-beef", "Beef burger", 35, "A mall burger.", ["fast"], ["lunch", "dinner"], 30, 8),
  food("burger-chicken", "Chicken burger", 32, "Crispy, with salad if you want it.", ["fast"], ["lunch", "dinner"], 28, 8),
  food("burger-veg", "Veggie burger", 30, "The one without the meat.", ["fast"], ["lunch", "dinner"], 24, 6),
  food("pizza-marg", "Margherita", 55, "A whole pizza, to share or not.", ["fast", "fine"], ["lunch", "dinner"], 28, 10, 0, { deliver: true }),
  food("pizza-pepperoni", "Pepperoni pizza", 62, "Cups of pepper, a lot of cheese.", ["fast"], ["lunch", "dinner", "late"], 30, 8, 0, { deliver: true }),
  food("pizza-veg", "Veggie pizza", 52, "Peppers, onion, and no argument about meat.", ["fast"], ["lunch", "dinner"], 24, 6, 0, { deliver: true }),
  food("pizza-chicken", "Chicken pizza", 65, "The one this city actually orders.", ["fast"], ["lunch", "dinner", "late"], 30, 10, 0, { deliver: true }),
  food("fried-chicken", "Fried chicken", 30, "A bucket piece, hot.", ["fast"], all, 26, 8, 0, { deliver: true }),
  food("grilled-chicken", "Grilled chicken", 35, "Charcoal, not the fryer.", ["chop", "fast", "beach"], ["lunch", "dinner"], 30, 10),
  food("fish-chips", "Fish and chips", 40, "The hotel version.", ["fine", "fast"], ["lunch", "dinner"], 28, 6),
  food("spaghetti", "Spaghetti", 32, "Tomato sauce, a fork, a napkin.", ["fast", "fine"], ["lunch", "dinner"], 28, 6),
  food("penne", "Penne", 34, "The short pasta, same pot.", ["fast", "fine"], ["lunch", "dinner"], 28, 6),
  food("pasta-creamy", "Creamy pasta", 38, "The white sauce one.", ["fast", "fine"], ["dinner"], 30, 8),
  food("sandwich", "Sandwich", 22, "Bread, filling, a cafe plate.", ["cafe", "fast"], day, 18, 4),
  food("sub", "Sub", 26, "A long roll. You will not finish it walking.", ["fast", "cafe"], day, 22, 4),
  food("wrap", "Wrap", 24, "Not shawarma. Chicken, salad, a tortilla.", ["fast", "cafe"], day, 20, 4),
  food("hot-dog", "Hot dog", 18, "The mall one.", ["fast"], day, 16, 4),
  food("taco", "Tacos", 36, "Three, and a lime.", ["fast", "fine"], ["lunch", "dinner"], 22, 8),
  food("burrito", "Burrito", 38, "One, and it is a meal.", ["fast"], ["lunch", "dinner"], 30, 6),
  food("sushi", "Sushi", 120, "Only if the room has a wine list.", ["fine"], ["dinner"], 18, 12, 0),
  food("salad", "Salad", 28, "Leaves, and something grilled on top.", ["fine", "cafe"], day, 12, 4, 4, { health: 4 }),
  food("soup-bowl", "Soup of the day", 24, "Whatever pot the kitchen started this morning.", ["fine", "cafe", "chop"], day, 16, 4, 2, { health: 2 }),
  food("steak", "Steak", 160, "The expensive plate. They ask how you want it.", ["fine"], ["dinner"], 36, 14),
  food("seafood", "Seafood platter", 180, "Prawns, a fish, and a bill that arrives slowly.", ["fine", "beach"], ["dinner"], 34, 16),
  food("eggs-toast", "Eggs and toast", 20, "Breakfast, plated.", ["cafe", "fine"], ["breakfast"], 22, 4, 4),
  food("pancakes", "Pancakes", 24, "Syrup, and a second coffee.", ["cafe"], ["breakfast"], 20, 8),
  food("oats", "Oats", 16, "The quiet breakfast.", ["cafe"], ["breakfast"], 16, 2, 4),
  food("smoothie", "Smoothie", 18, "Fruit, cold, a straw.", ["cafe", "beach"], day, 8, 6, 4, { health: 2 }),
  food("juice", "Juice", 12, "Orange, pineapple, or whatever was pressed.", ["cafe", "fast", "street"], day, 4, 4, 2, { health: 2 }),
  food("milkshake", "Milkshake", 18, "Thick. Two straws if you share.", ["cafe", "fast"], day, 10, 8),
  food("coffee", "Coffee", 15, "The one you wait for.", ["cafe", "fine"], day, 2, 6, 6),
  food("tea", "Tea", 8, "Milk and sugar, or none.", ["cafe", "chop"], day, 2, 2, 2),
  food("hot-chocolate", "Hot chocolate", 14, "For a harmattan morning, or an air-conditioned mall.", ["cafe"], ["breakfast", "dinner"], 6, 6, 2),
  food("cake", "Slice of cake", 18, "From the glass.", ["cafe", "fast"], day, 10, 8),
  food("pastry", "Pastry", 10, "The laminated one, still warm.", ["cafe", "fast"], ["breakfast", "lunch"], 8, 4),
  food("doughnut", "Doughnut", 12, "Sugar on your shirt.", ["cafe", "fast"], day, 8, 6),
  food("boba", "Bubble tea", 22, "Pearls, a wide straw, a queue.", ["cafe", "fast"], day, 6, 8, 2),
  food("star", "Star beer", 14, "A cold Star.", ["bar", "late"], night, 4, 8, -2),
  food("guinness", "Guinness", 16, "Small stout, big reputation.", ["bar"], night, 6, 6, -2),
  food("gulder", "Gulder", 14, "The one your uncle asks for.", ["bar"], night, 4, 6, -2),
  food("heineken", "Heineken", 18, "The green bottle.", ["bar", "fine"], night, 4, 6, -2),
  food("whisky", "Whisky", 30, "A tot, then the conversation changes.", ["bar", "fine"], night, 2, 8, -6),
  food("vodka", "Vodka", 28, "Clear, and gone.", ["bar", "fine"], night, 2, 6, -6),
  food("gin", "Gin", 25, "With tonic, or brave.", ["bar"], night, 2, 6, -4),
  food("rum", "Rum", 26, "Dark, with coke if you say so.", ["bar"], night, 2, 6, -4),
  food("brandy", "Brandy", 32, "The older table's drink.", ["bar", "fine"], night, 2, 6, -4),
  food("mojito", "Mojito", 40, "Mint, lime, a club glass.", ["bar", "fine"], night, 2, 10, -2),
  food("cosmo", "Cosmopolitan", 42, "The pink one. They still make it.", ["bar", "fine"], night, 2, 8, -2),
  food("whiskey-sour", "Whiskey sour", 40, "Lemon, sugar, a short glass.", ["bar", "fine"], night, 2, 8, -4),
  food("local-twist", "Local twist", 35, "A mojito that met sobolo.", ["bar"], night, 2, 10, -2),
  food("wine-red", "Red wine", 45, "A glass, not the bottle. Unless you insist.", ["fine", "bar"], night, 2, 8, -2),
  food("wine-white", "White wine", 45, "Cold. The bottle stays in the ice.", ["fine", "bar"], night, 2, 8, -2),
  food("sparkling", "Sparkling wine", 70, "Not champagne. Close enough for the toast.", ["fine", "bar"], night, 2, 10, -2),
  food("moet", "Moët", 280, "The gold bottle. The table stands up.", ["fine", "bar"], night, 2, 16, -2, { where: "club" }),
  food("veuve", "Veuve", 320, "Orange label. Somebody is celebrating.", ["fine", "bar"], night, 2, 16, -2, { where: "club" }),
  food("ciroc", "Cîroc", 260, "The clear bottle with the blue light.", ["bar", "fine"], night, 2, 14, -4, { where: "club" }),
  food("shot", "Tequila shot", 20, "Salt, lime, a decision.", ["bar", "late"], ["late"], 0, 6, -6),
  food("jager", "Jägermeister", 22, "The dark shot. Cold.", ["bar", "late"], ["late"], 0, 4, -6),
  food("bitters", "Local bitters", 12, "A small bottle. The table shares it.", ["bar", "late"], night, 0, 4, -2, { where: "club" }),
  food("redbull", "Red Bull", 12, "For the hour you should have slept.", ["late", "fast", "bar"], night, 2, 2, 8),
  food("monster", "Monster", 14, "The tall can. The night gets longer.", ["late", "fast", "bar"], night, 2, 2, 8),
  food("palm-wine", "Palm wine", 10, "Fresh, sweet, then it turns.", ["street", "chop", "beach"], night, 6, 8, -2, { risk: 0.05 }),
  food("akpeteshie", "Akpeteshie", 8, "Local gin. Respect it.", ["street", "chop"], night, 2, 4, -8, { risk: 0.1 }),
  food("pito", "Pito", 8, "Millet beer, a calabash.", ["chop", "street"], night, 8, 6, -2, { city: "kumasi" }),
  food("asaana", "Asaana", 6, "Caramelised corn drink.", ["street", "chop"], day, 8, 4, 0, { city: "accra" }),
];

export function mealNow(hour: number): Meal {
  if (hour >= 5 && hour < 11) return "breakfast";
  if (hour >= 11 && hour < 16) return "lunch";
  if (hour >= 16 && hour < 22) return "dinner";
  return "late";
}

export function stallOf(text: string): Stall {
  const line = text.toLowerCase();
  if (/beer|whisky|spirit|lounge|cocktail|champagne|vodka|gin|wine|drink|stool/.test(line)) return "bar";
  if (/beach|labadi|bojo|tilapia/.test(line)) return "beach";
  if (/coffee|cafe|tea|pancake|oat|bakery|pastry|doughnut/.test(line)) return "cafe";
  if (/pizza|burger|shawarma|kfc|mall|fast|food-court/.test(line)) return "fast";
  if (/steak|sushi|hotel|platter|fine/.test(line)) return "fine";
  if (/late|suya|2am|night bite|chichinga|night-food|night-grill/.test(line)) return "late";
  if (/fanice|ice cream|scoop|parlour/.test(line)) return "street";
  if (/kelewele|hawker|traffic|street|bofrot|fries/.test(line)) return "street";
  return "chop";
}

function inSeason(item: Food, month = new Date().getUTCMonth()) {
  if (!item.season) return true;
  const rainy = (month >= 3 && month <= 6) || month === 8 || month === 9;
  const harmattan = month === 11 || month === 0 || month === 1;
  return item.season === "rainy" ? rainy : harmattan;
}

const LOUNGES = new Set(["lizzys", "duncans", "adum-night"]);

function placeOk(item: Food, place: string, line: string) {
  if (!item.where) return true;
  const blob = `${place} ${line}`;
  if (item.where === "beach") return /beach|labadi|bojo|tilapia/.test(blob);
  if (item.where === "airport") return /airport|kotoka|departure/.test(blob);
  return CLUB_IDS.has(place) || LOUNGES.has(place) || /club|lounge/.test(blob);
}

export function menuFor(text: string, hour: number, town = "accra", index = 1, place = "") {
  const stall = stallOf(`${text} ${place}`);
  const meal = mealNow(hour);
  const line = `${text} ${place}`.toLowerCase();
  const fitting = FOODS.filter((item) => item.stall.includes(stall) && (!item.city || item.city === town) && inSeason(item) && placeOk(item, place, line));
  const timed = fitting.filter((item) => item.meal.includes(meal));
  const pool = timed.length >= 4 ? timed : fitting;
  const words = line.split(/[^a-z]+/).filter((word) => word.length >= 4);
  const score = (item: Food) => {
    const blob = `${item.id} ${item.name}`.toLowerCase();
    let total = words.reduce((sum, word) => sum + (blob.includes(word) ? 1 : 0), 0);
    if (item.where === "club" && (CLUB_IDS.has(place) || LOUNGES.has(place))) total += 3;
    if (item.where === "airport" && /kotoka|airport/.test(place)) total += 3;
    if (item.where === "beach" && /beach|labadi|bojo/.test(place)) total += 3;
    return total;
  };
  const rows = [...pool].sort((a, b) => score(b) - score(a)).slice(0, 8);
  return rows.map((item) => ({
    id: `food-${item.id}`,
    label: item.name,
    detail: item.risk ? `${item.detail} The stall looks tired.` : item.detail,
    minutes: item.hunger > 24 ? 30 : 15,
    cost: Math.max(1, Math.round(item.price * index)),
    effects: {
      hunger: item.hunger,
      fun: item.fun,
      energy: item.energy,
      ...(item.health ? { hygiene: item.health } : {}),
    },
  }));
}

export function foodFromOffer(id: string) {
  return FOODS.find((item) => id === `food-${item.id}`) ?? null;
}

export function deliverableFoods() {
  return FOODS.filter((item) => item.deliver);
}
