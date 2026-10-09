import { CLUB_IDS } from "@/lib/game/accra-spots";
import { deskNpc } from "@/lib/game/place-desk";
import { isNightlife } from "@/lib/game/club-night";
import { SPOT_HOURS } from "@/lib/game/food-spots";
import { accraHour, type Spot, type Verb } from "@/lib/game/world";

export type RoomKind =
  | "court"
  | "chop"
  | "market"
  | "bar"
  | "club"
  | "shop"
  | "boutique"
  | "bank"
  | "clinic"
  | "school"
  | "police"
  | "worship"
  | "gym"
  | "station"
  | "beach"
  | "airport"
  | "cinema"
  | "office"
  | "hotel"
  | "garage"
  | "salon"
  | "hall";

type Room = {
  kind: RoomKind;
  hours: string;
  open: [number, number];
  staff: { role: string; name: string; line: string; shirt: string }[];
  customers: string[];
  event: string[];
  verb: { label: string; detail: string; minutes: number; cost: number; earn: number; fun: number; social: number; energy: number };
};

const ROOMS: Record<RoomKind, Room> = {
  court: {
    kind: "court",
    hours: "8:00 – 16:00",
    open: [8, 16],
    staff: [
      { role: "Judge", name: "Justice Mensah", line: "Stand when the court stands. Speak when I ask.", shirt: "#1c1917" },
      { role: "Clerk", name: "Auntie Grace", line: "File it here. The hearing date is on the slip.", shirt: "#f4efe6" },
    ],
    customers: ["A lawyer", "A defendant", "Someone in the gallery"],
    event: ["The gallery is whispering.", "A case just got stood down.", "The clerk is calling the next name."],
    verb: { label: "Sit in on a hearing", detail: "You take a bench and listen. The room is quieter than the street.", minutes: 40, cost: 0, earn: 0, fun: 6, social: 8, energy: -4 },
  },
  chop: {
    kind: "chop",
    hours: "6:00 – 21:00",
    open: [6, 21],
    staff: [
      { role: "Cook", name: "Auntie Esi", line: "The pot is hot. Tell me the plate.", shirt: "#CE1126" },
      { role: "Server", name: "Yaw", line: "I will bring it. Sit where there is space.", shirt: "#f5c542" },
    ],
    customers: ["A regular", "Two students", "Someone waiting on waakye"],
    event: ["A plate just landed at the next table.", "The shito is running low.", "Somebody is arguing about the bill."],
    verb: { label: "Order a plate", detail: "You eat here. The mood lifts with the food.", minutes: 30, cost: 18, earn: 0, fun: 10, social: 6, energy: 6 },
  },
  market: {
    kind: "market",
    hours: "6:00 – 18:00",
    open: [6, 18],
    staff: [
      { role: "Trader", name: "Maame Akua", line: "Last price is not the first price. Talk to me.", shirt: "#e5484d" },
      { role: "Porter", name: "Kofi", line: "I carry it to the gate. You pay the head.", shirt: "#1d2433" },
    ],
    customers: ["A shopper", "A hawker", "Someone counting change"],
    event: ["A lane just jammed.", "Someone is calling a special price.", "Watch your pocket in this crowd."],
    verb: { label: "Bargain a stall", detail: "You talk the price down and leave with something small.", minutes: 25, cost: 12, earn: 0, fun: 8, social: 10, energy: -4 },
  },
  bar: {
    kind: "bar",
    hours: "12:00 – 1:00",
    open: [12, 25],
    staff: [
      { role: "Bartender", name: "Selorm", line: "What are you drinking, and are you watching the match?", shirt: "#121212" },
      { role: "Regular", name: "Uncle Joe", line: "This seat is mine. The next one is free.", shirt: "#006B3F" },
    ],
    customers: ["A fan", "A couple", "Someone loud"],
    event: ["The screen just showed a chance.", "A stool scraped back.", "The speaker is louder than the conversation."],
    verb: { label: "Take a stool", detail: "One drink. The room gets softer.", minutes: 40, cost: 20, earn: 0, fun: 14, social: 8, energy: -4 },
  },
  club: {
    kind: "club",
    hours: "20:00 – 4:00",
    open: [20, 28],
    staff: [
      { role: "Bouncer", name: "Kojo", line: "Dress right. The list is at the door.", shirt: "#121212" },
      { role: "Bartender", name: "Abena", line: "Bar is open.", shirt: "#CE1126" },
    ],
    customers: ["The floor", "A VIP table", "Someone filming"],
    event: ["The next song is starting.", "A table just ordered a bottle.", "The door is checking outfits."],
    verb: { label: "Step inside", detail: "The night is already moving.", minutes: 20, cost: 0, earn: 0, fun: 8, social: 6, energy: -2 },
  },
  shop: {
    kind: "shop",
    hours: "8:00 – 20:00",
    open: [8, 20],
    staff: [
      { role: "Shopkeeper", name: "Efua", line: "Look around. The price is on the tag.", shirt: "#2f7de1" },
      { role: "Cashier", name: "Fiifi", line: "Cash or MoMo. I write the receipt.", shirt: "#f4efe6" },
    ],
    customers: ["A browser", "Someone at the counter"],
    event: ["A new box just came in.", "The fan is doing its best.", "Someone is asking for a discount."],
    verb: { label: "Browse the shelves", detail: "You look, you ask, you might leave with a bag.", minutes: 20, cost: 0, earn: 0, fun: 6, social: 4, energy: -2 },
  },
  boutique: {
    kind: "boutique",
    hours: "10:00 – 20:00",
    open: [10, 20],
    staff: [
      { role: "Stylist", name: "Nana Ama", line: "Try it on. The mirror does not lie.", shirt: "#ec4899" },
      { role: "Cashier", name: "Danielle", line: "Bag and receipt when you are ready.", shirt: "#121212" },
    ],
    customers: ["A friend waiting", "Someone in the fitting room"],
    event: ["A rail just got a new arrival.", "The fitting room curtain is closed.", "Someone is photographing a mirror."],
    verb: { label: "Ask for a look", detail: "The stylist pulls two pieces and tells you which one is for tonight.", minutes: 15, cost: 0, earn: 0, fun: 8, social: 6, energy: 0 },
  },
  bank: {
    kind: "bank",
    hours: "8:00 – 16:00",
    open: [8, 16],
    staff: [
      { role: "Teller", name: "Mr Owusu", line: "Take a number. The system is slow today.", shirt: "#1d4ed8" },
      { role: "Security", name: "Kwame", line: "Phones down at the counter.", shirt: "#1c1917" },
    ],
    customers: ["A queue", "Someone with a passbook"],
    event: ["The queue moved one person.", "The system just blinked.", "A MoMo agent is outside the door."],
    verb: { label: "Join the queue", detail: "You wait, then the teller looks up.", minutes: 30, cost: 0, earn: 0, fun: -2, social: 2, energy: -4 },
  },
  clinic: {
    kind: "clinic",
    hours: "Open all day",
    open: [0, 24],
    staff: [
      { role: "Nurse", name: "Sister Akosua", line: "Sit. Tell me what hurts.", shirt: "#f7f7f7" },
      { role: "Doctor", name: "Dr Boateng", line: "We will see you. The serious ones go first.", shirt: "#e7eef3" },
    ],
    customers: ["A patient", "A relative", "Someone at the pharmacy window"],
    event: ["A name was called.", "The pharmacy shutter is half up.", "Someone is asking for a folder."],
    verb: { label: "See the nurse", detail: "A check, a note, and you leave steadier.", minutes: 35, cost: 40, earn: 0, fun: 2, social: 4, energy: 8 },
  },
  school: {
    kind: "school",
    hours: "7:30 – 17:00",
    open: [7, 17],
    staff: [
      { role: "Lecturer", name: "Dr Adjei", line: "The back row can listen. The front row can answer.", shirt: "#1c1917" },
      { role: "Student", name: "Ama", line: "The next lecture is in the big hall.", shirt: "#FCD116" },
    ],
    customers: ["A class", "Someone with notes"],
    event: ["A bell just went.", "People are arguing a course.", "The library is the quiet room."],
    verb: { label: "Sit in a lecture", detail: "You stay for one hour. Something sticks.", minutes: 55, cost: 0, earn: 0, fun: 6, social: 8, energy: -4 },
  },
  police: {
    kind: "police",
    hours: "Open all day",
    open: [0, 24],
    staff: [
      { role: "Officer", name: "Inspector Larbi", line: "State your business. Slowly.", shirt: "#1d4ed8" },
      { role: "Desk", name: "Sergeant Esi", line: "Reports are written here. Fines are paid here.", shirt: "#1c1917" },
    ],
    customers: ["Someone waiting", "A driver with papers"],
    event: ["A radio crackled.", "Someone is asking about bail.", "The bench is full."],
    verb: { label: "Make a report", detail: "You tell the desk what happened. They write it down.", minutes: 25, cost: 0, earn: 0, fun: 0, social: 4, energy: -2 },
  },
  worship: {
    kind: "worship",
    hours: "Service hours vary",
    open: [5, 21],
    staff: [
      { role: "Usher", name: "Brother Kofi", line: "Welcome. There is a seat near the aisle.", shirt: "#f4efe6" },
      { role: "Leader", name: "Pastor / Imam", line: "Stay for the word. The offering box is by the door.", shirt: "#006B3F" },
    ],
    customers: ["The congregation", "A choir member", "Someone arriving late"],
    event: ["A hymn is starting.", "People are greeting across the aisle.", "The offering just went round."],
    verb: { label: "Stay for the service", detail: "You sit, you listen, the day feels lighter.", minutes: 70, cost: 0, earn: 0, fun: 12, social: 10, energy: 4 },
  },
  gym: {
    kind: "gym",
    hours: "5:30 – 21:00",
    open: [5, 21],
    staff: [
      { role: "Trainer", name: "Nii", line: "Warm up first. Ego later.", shirt: "#121212" },
      { role: "Desk", name: "Akua", line: "Sign in. Towels are by the mirror.", shirt: "#22b573" },
    ],
    customers: ["Someone on a bench", "A pair stretching"],
    event: ["Weights just hit the rack.", "A class is starting in the corner.", "The fan is losing to the room."],
    verb: { label: "Train for an hour", detail: "You sweat. Energy dips, then the body feels better.", minutes: 60, cost: 15, earn: 0, fun: 10, social: 4, energy: -8 },
  },
  station: {
    kind: "station",
    hours: "5:00 – 21:00",
    open: [5, 21],
    staff: [
      { role: "Mate", name: "Kwesi", line: "Circle! Circle! One seat left.", shirt: "#FCD116" },
      { role: "Driver", name: "Uncle Yaw", line: "We move when the seat is full.", shirt: "#1c1917" },
    ],
    customers: ["A passenger", "A hawker at the window"],
    event: ["A trotro just loaded.", "Someone missed it by a step.", "The mate is calling the next town."],
    verb: { label: "Ask the mate", detail: "You find out which car is leaving next.", minutes: 10, cost: 0, earn: 0, fun: 4, social: 6, energy: -2 },
  },
  beach: {
    kind: "beach",
    hours: "Daylight into night",
    open: [6, 23],
    staff: [
      { role: "Vendor", name: "Adjoa", line: "Coconut, kelewele, or a chair.", shirt: "#22d3ee" },
      { role: "Usher", name: "Kojo", line: "The chairs are this way.", shirt: "#f4efe6" },
    ],
    customers: ["Swimmers", "A football game", "Someone under an umbrella"],
    event: ["A wave just reached the chairs.", "A speaker started near the grill.", "The light is doing that gold thing."],
    verb: { label: "Sit by the water", detail: "Feet in, phone down, the noise of town drops.", minutes: 30, cost: 0, earn: 0, fun: 16, social: 6, energy: 6 },
  },
  airport: {
    kind: "airport",
    hours: "Flights through the day",
    open: [5, 23],
    staff: [
      { role: "Check-in", name: "Ama", line: "Accra and Kumasi board at the gate. Pass ready?", shirt: "#1d4ed8" },
      { role: "Security", name: "Officer Mensah", line: "Laptops out. The queue moves if you listen.", shirt: "#FCD116" },
    ],
    customers: ["A family", "Someone late", "A crew"],
    event: ["A flight was just called.", "The board changed a gate.", "Someone is running with a small bag."],
    verb: { label: "Check the board", detail: "You read the gates. Kumasi is on the list.", minutes: 15, cost: 0, earn: 0, fun: 4, social: 2, energy: -2 },
  },
  cinema: {
    kind: "cinema",
    hours: "11:00 – 22:00",
    open: [11, 22],
    staff: [
      { role: "Box office", name: "Serwaa", line: "The next show is in twenty minutes.", shirt: "#CE1126" },
      { role: "Usher", name: "Eli", line: "This way. Phones down when it starts.", shirt: "#121212" },
    ],
    customers: ["A date", "A group of friends"],
    event: ["A trailer is playing in the lobby.", "Someone is buying popcorn.", "The sold-out card is up for the late show."],
    verb: { label: "Buy a ticket", detail: "You sit in the dark for a Ghanaian feature.", minutes: 110, cost: 35, earn: 0, fun: 22, social: 8, energy: -4 },
  },
  office: {
    kind: "office",
    hours: "8:00 – 16:30",
    open: [8, 16],
    staff: [
      { role: "Clerk", name: "Mr Addo", line: "Take a form. The stamp is after the queue.", shirt: "#1d4ed8" },
      { role: "Officer", name: "Madam Dede", line: "Documents only. Stories can wait.", shirt: "#f4efe6" },
    ],
    customers: ["A queue", "Someone with a folder"],
    event: ["A number was called.", "The stamp pad is out.", "Someone has been here since morning."],
    verb: { label: "Take a number", detail: "You wait for a document that will matter later.", minutes: 40, cost: 20, earn: 0, fun: -2, social: 2, energy: -4 },
  },
  hotel: {
    kind: "hotel",
    hours: "Open all day",
    open: [0, 24],
    staff: [
      { role: "Reception", name: "Linda", line: "Checking in, or just the lobby?", shirt: "#c9a227" },
      { role: "Porter", name: "Isaac", line: "I can take the bag.", shirt: "#1c1917" },
    ],
    customers: ["A guest", "Someone waiting on a car"],
    event: ["A key card just hit the counter.", "The lobby music changed.", "A taxi is under the canopy."],
    verb: { label: "Sit in the lobby", detail: "Cold air, a chair, and nobody asking you to move.", minutes: 25, cost: 0, earn: 0, fun: 8, social: 4, energy: 4 },
  },
  garage: {
    kind: "garage",
    hours: "7:30 – 18:00",
    open: [7, 18],
    staff: [
      { role: "Mechanic", name: "Master Fii", line: "Open the bonnet. I will tell you the truth.", shirt: "#f59e42" },
      { role: "Apprentice", name: "Kwaku", line: "I can fetch the part if we have it.", shirt: "#1c1917" },
    ],
    customers: ["A driver", "Someone on a bench"],
    event: ["A spanner hit the floor.", "A car just started on the second try.", "The radio is on Joy FM."],
    verb: { label: "Ask about the car", detail: "Master Fii looks, then names a price.", minutes: 20, cost: 0, earn: 0, fun: 2, social: 4, energy: -2 },
  },
  salon: {
    kind: "salon",
    hours: "8:00 – 19:00",
    open: [8, 19],
    staff: [
      { role: "Stylist", name: "Auntie Esi", line: "Sit. Tell me the hair you want.", shirt: "#ec4899" },
      { role: "Assistant", name: "Maame", line: "The dryer is free in ten minutes.", shirt: "#f4efe6" },
    ],
    customers: ["Someone under a dryer", "A friend waiting"],
    event: ["Clippers are buzzing.", "Someone is choosing a colour.", "The mirror row is full."],
    verb: { label: "Take a chair", detail: "A cut or a retouch. You leave looking newer.", minutes: 45, cost: 30, earn: 0, fun: 12, social: 8, energy: 2 },
  },
  hall: {
    kind: "hall",
    hours: "Daytime",
    open: [8, 18],
    staff: [
      { role: "Manager", name: "The manager", line: "Tell me what you came for.", shirt: "#006B3F" },
      { role: "Cashier", name: "The cashier", line: "I take the money.", shirt: "#FCD116" },
    ],
    customers: ["A visitor", "Someone waiting"],
    event: ["The room is doing its usual work.", "Someone just walked in.", "A chair scraped."],
    verb: { label: "Look around", detail: "You take the room in before you spend anything.", minutes: 10, cost: 0, earn: 0, fun: 4, social: 2, energy: 0 },
  },
};

const BY_ID: [RegExp, RoomKind][] = [
  [/shawarma|pizza|burger|fanice|coffee|bakery|food-court|street-food|night-food|night-grill|kejetia-night/, "chop"],
  [/casino|karaoke|shisha|cigar/, "bar"],
  [/spa|tattoo|nail-bar|braid-house|pet-groom/, "salon"],
  [/dental|eye-clinic|vet-clinic|pharmacy/, "clinic"],
  [/hardware|furniture-hall|showroom|laundry-house|dry-clean|shoe-fix|pet-shop|plant-nursery|builders-yard|mini-mart|supermarket|super/, "shop"],
  [/okada-hub/, "station"],
  [/car-wash/, "garage"],
  [/farmers-market|fish-market|meat-market/, "market"],
  [/embassy|barracks|parliament|jubilee|fire-station|law-office|accounts-firm|insurance-desk|immigration-desk|estate-agent|fuel|passport|dvla/, "office"],
  [/traffic-police/, "police"],
  [/court|tribunal/, "court"],
  [/korle|hospital|clinic|pharmacy/, "clinic"],
  [/police/, "police"],
  [/church|mosque|shrine/, "worship"],
  [/legon|knust|school|university|campus/, "school"],
  [/salon|barber/, "salon"],
  [/fitting|garage|motors/, "garage"],
  [/kotoka|airport/, "airport"],
  [/flicks|cinema|theatre/, "cinema"],
  [/gym|stadium/, "gym"],
  [/market|makola|kejetia|kaneshie|kantamanto/, "market"],
  [/hotel|kempinski|movenpick/, "hotel"],
  [/beach|bojo|kokrobite|labadi|teshie|nungua/, "beach"],
  [/buka|chop|kfc|waakye|asanka|muni|cafe|restaurant/, "chop"],
  [/bank|momo/, "bank"],
  [/station|rank|trotro|circle/, "station"],
  [/bar|pub|lounge|republic|bloom/, "bar"],
];

export function roomOf(spot: Spot): RoomKind {
  if (isNightlife(spot.id, CLUB_IDS)) return "club";
  const id = `${spot.id} ${spot.name}`.toLowerCase();
  if (spot.id === "trasacco-gate") return "hotel";
  if (spot.id === "kantamanto" || spot.id.endsWith("-rails") || spot.id === "adum-print") return "boutique";
  for (const [test, kind] of BY_ID) {
    if (test.test(id)) return kind;
  }
  if (spot.group === "sea") return "beach";
  if (spot.group === "work") return "office";
  if (spot.group === "civic") return "hall";
  if (spot.group === "hang") return "chop";
  return "hall";
}

export function roomProfile(spot: Spot) {
  return ROOMS[roomOf(spot)];
}

function hourOpen(open: [number, number], hour: number) {
  const [from, to] = open;
  if (to >= 24) return hour >= from || hour < to - 24;
  return hour >= from && hour < to;
}

export function roomLine(spot: Spot, hour = accraHour()) {
  const room = roomProfile(spot);
  const special = SPOT_HOURS[spot.id];
  const open = hourOpen(special?.open ?? room.open, hour);
  const event = room.event[hour % room.event.length];
  return `${open ? "Open" : "Closed for the night"} · ${special?.hours ?? room.hours}. ${event}`;
}

export function staffOf(spot: Spot) {
  const room = roomProfile(spot);
  const lead = deskNpc(spot);
  const staff = lead ? [{ role: lead.role, name: lead.name, line: lead.line, shirt: room.staff[0]?.shirt ?? "#1c1917" }, ...room.staff.slice(1)] : room.staff;
  return staff.map((person, index) => ({
    role: person.role,
    line: `${person.name}: ${person.line}`,
    style: index === 0 ? { left: "22%", top: "44%" } : { left: "70%", top: "38%" },
    skin: index === 0 ? "#8d5a3b" : "#c68a62",
    shirt: person.shirt,
    hair: index === 0 ? "Bun" : "Afro",
  }));
}

export function kitVerbs(spot: Spot): Verb[] {
  const room = roomProfile(spot);
  if (room.kind === "club") return [];
  const verb = room.verb;
  return [
    {
      id: `room-${spot.id}`,
      label: verb.label,
      detail: verb.detail,
      minutes: verb.minutes,
      cost: verb.cost,
      earn: verb.earn,
      effects: { fun: verb.fun, social: verb.social, energy: verb.energy },
      tag: room.kind === "chop" || room.kind === "bar" ? "food" : undefined,
      emoji: spot.emoji,
      social: verb.social > 0,
    },
  ];
}
