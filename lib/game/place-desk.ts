import { CLUB_IDS } from "@/lib/game/accra-spots";
import { deposit, loanLimit, scoreLabel, takeLoan } from "@/lib/game/bank";
import { isNightlife } from "@/lib/game/club-night";
import { seeClinic, selfMedicate } from "@/lib/game/health";
import { postBail } from "@/lib/game/justice";
import { fileMemory, nudgeCircle, recall, type Circle } from "@/lib/game/spine";
import { accraHour, cedis, cloneLife, logLine, passTime, type Life, type Spot, type StepResult } from "@/lib/game/world";

export type DeskRow = { label: string; detail: string };
export type DeskNpc = { role: string; name: string; line: string };
export type Desk = {
  id: string;
  title: string;
  button: string;
  npc: DeskNpc;
  board: (life: Life, spot: Spot) => DeskRow[];
  act: (life: Life, spot: Spot) => StepResult;
};

function dayKey(life: Life) {
  return String(Math.floor(life.minutes / 1440));
}

function pick(seed: string, list: string[]) {
  let hash = 0;
  for (const char of seed) hash = (hash * 33 + char.charCodeAt(0)) >>> 0;
  return list[hash % list.length];
}

function run(
  life: Life,
  spot: Spot,
  npc: DeskNpc,
  opts: { minutes: number; cost: number; note: string; fun?: number; social?: number; energy?: number; hunger?: number; hygiene?: number; skill?: keyof Life["skills"]; circle?: Circle },
): StepResult {
  if (opts.cost > 0 && life.cash < opts.cost) return { life, notes: [], error: `${npc.name} wants ${cedis(opts.cost)}.` };
  const timed = passTime(cloneLife(life), opts.minutes).life;
  timed.cash -= opts.cost;
  if (opts.fun) timed.needs.fun = Math.max(0, Math.min(100, timed.needs.fun + opts.fun));
  if (opts.social) timed.needs.social = Math.max(0, Math.min(100, timed.needs.social + opts.social));
  if (opts.energy) timed.needs.energy = Math.max(0, Math.min(100, timed.needs.energy + opts.energy));
  if (opts.hunger) timed.needs.hunger = Math.max(0, Math.min(100, timed.needs.hunger + opts.hunger));
  if (opts.hygiene) timed.needs.hygiene = Math.max(0, Math.min(100, timed.needs.hygiene + opts.hygiene));
  if (opts.skill) timed.skills[opts.skill] = Math.min(10, timed.skills[opts.skill] + 1);
  const memory = `${opts.note.replace(/\.$/, "")} at ${spot.name}`;
  fileMemory(timed, npc.name, memory);
  if (opts.circle) nudgeCircle(timed, opts.circle, 2);
  logLine(timed, opts.note);
  return { life: timed, notes: [opts.note] };
}

function desk(partial: Omit<Desk, "act"> & { minutes: number; cost: number; note: string; fun?: number; social?: number; energy?: number; hunger?: number; hygiene?: number; skill?: keyof Life["skills"]; circle?: Circle; act?: Desk["act"] }): Desk {
  const { minutes, cost, note, fun, social, energy, hunger, hygiene, skill, circle, act, ...rest } = partial;
  return {
    ...rest,
    act: act ?? ((life, spot) => run(life, spot, rest.npc, { minutes, cost, note, fun, social, energy, hunger, hygiene, skill, circle })),
  };
}

const DESKS: Desk[] = [
  desk({
    id: "restaurant",
    title: "MENU BOARD",
    button: "Review the special",
    npc: { role: "Chef", name: "Chef Kojo", line: "The special is the plate I would eat myself." },
    minutes: 40,
    cost: 45,
    note: "You tasted the special and left a review.",
    hunger: 28,
    fun: 8,
    social: 4,
    skill: "cooking",
    board: (life, spot) => [
      { label: "Chef's special", detail: pick(spot.id + dayKey(life), ["Grilled tilapia", "Light soup and fufu", "Jollof and chicken", "Banku and okro"]) },
      { label: "Table", detail: "A two-top by the window is free." },
      { label: "Price", detail: "₵45 for the special. Water is on the house." },
    ],
  }),
  desk({
    id: "chop",
    title: "CHALK BOARD",
    button: "Share a bowl",
    npc: { role: "Cook", name: "Mama Esi", line: "Use your hand. The spoon is for visitors." },
    minutes: 25,
    cost: 15,
    note: "You ate with your hand and shared the bowl.",
    hunger: 24,
    social: 8,
    fun: 6,
    board: (life) => {
      const hour = accraHour();
      return [
        { label: "Today", detail: pick(dayKey(life), ["Waakye and egg", "Kenkey and fish", "Rice and stew", "TZ and ayoyo"]) },
        { label: "Pot", detail: hour >= 15 ? "Waakye finished." : "The pot is still going." },
        { label: "Crowd", detail: hour >= 12 && hour < 14 ? "The benches are full." : "There is a seat." },
      ];
    },
  }),
  desk({
    id: "street",
    title: "TODAY'S FIRE",
    button: "Buy from the fire",
    npc: { role: "Vendor", name: "Auntie Adwoa", line: "It is hot. Do not stand there thinking." },
    minutes: 15,
    cost: 8,
    note: "You bought off the fire and stayed to talk.",
    hunger: 16,
    social: 6,
    board: (life) => [
      { label: "On the coal", detail: pick(dayKey(life), ["Kelewele", "Roasted plantain", "Chichinga", "Boiled groundnuts"]) },
      { label: "Queue", detail: `${3 + (Math.floor(life.minutes / 60) % 6)} people ahead of you.` },
    ],
  }),
  desk({
    id: "market",
    title: "HAGGLE",
    button: "Talk the price down",
    npc: { role: "Market queen", name: "Nana Akua", line: "First price is a greeting. Last price is the sale." },
    minutes: 20,
    cost: 18,
    note: "You haggled. The last price stuck.",
    social: 8,
    fun: 4,
    skill: "hustle",
    board: (life, spot) => {
      const ask = 40 + (spot.id.length % 20);
      return [
        { label: "Asking", detail: cedis(ask) },
        { label: "If you talk", detail: cedis(Math.round(ask * 0.55)) },
        { label: "Rare tray", detail: pick(spot.id + dayKey(life), ["A brass bowl", "Vintage wax print", "A radio that still works"]) },
      ];
    },
  }),
  desk({
    id: "bar",
    title: "MATCH BOARD",
    button: "Join the pool",
    npc: { role: "Bartender", name: "Uncle Kwame", line: "I know who is drinking and who is hiding." },
    minutes: 30,
    cost: 20,
    note: "You watched the match and put a note in the pool.",
    fun: 12,
    social: 8,
    circle: "club",
    board: (life) => [
      { label: "On the screen", detail: pick(dayKey(life), ["Hearts v Kotoko", "Accra Lions v a quiet side", "A late Premier League"]) },
      { label: "Pool", detail: "₵20 a slip. Uncle Kwame holds the book." },
      { label: "Bar", detail: accraHour() >= 18 ? "The room is loud." : "A few regulars and the television." },
    ],
  }),
  desk({
    id: "club",
    title: "VIP BOOK",
    button: "Hold a table",
    npc: { role: "Hype man", name: "Yoofi", line: "If your name is on the book, the rope moves." },
    minutes: 20,
    cost: 80,
    note: "Yoofi put your name on a table.",
    fun: 10,
    social: 8,
    circle: "club",
    board: (life, spot) => [
      { label: "Table", detail: pick(spot.id + dayKey(life), ["Booth 2", "The rail", "Back corner"]) },
      { label: "Bottle floor", detail: "₵80 holds it. Spray is still the room's own game." },
      { label: "Door", detail: accraHour() >= 21 ? "The rope is up." : "Too early for the rope." },
    ],
  }),
  desk({
    id: "shop",
    title: "DEAL OF THE DAY",
    button: "Take today's deal",
    npc: { role: "Owner", name: "Mr Mensah", line: "This shelf changes. Yesterday's price is a rumour." },
    minutes: 15,
    cost: 22,
    note: "You took the day's deal.",
    fun: 4,
    board: (life, spot) => [
      { label: "Today only", detail: pick(spot.id + dayKey(life), ["A torch and batteries", "Two soaps and a sponge", "Rice, oil, and a sachet"]) },
      { label: "Was", detail: "₵35" },
      { label: "Now", detail: "₵22" },
    ],
  }),
  desk({
    id: "super",
    title: "WEEKLY SPECIALS",
    button: "Use the loyalty card",
    npc: { role: "Store manager", name: "Abena Quaye", line: "Aisle three is the one that moves." },
    minutes: 25,
    cost: 30,
    note: "The loyalty card took a little off the basket.",
    hunger: 8,
    board: () => [
      { label: "Aisle 1", detail: "Rice and oil." },
      { label: "Aisle 3", detail: "This week's cut: tinned fish." },
      { label: "Card", detail: "One stamp. Ten stamps is a free basket later." },
    ],
  }),
  desk({
    id: "boutique",
    title: "FITTING ROOM",
    button: "Try a look",
    npc: { role: "Stylist", name: "Selorm", line: "Stand still. I will tell you if it sits." },
    minutes: 25,
    cost: 0,
    note: "Selorm talked you through a look.",
    fun: 8,
    social: 6,
    skill: "charm",
    board: (life) => [
      { label: "On the rail", detail: pick(dayKey(life), ["Ankara set", "All-white two-piece", "A quiet black dress"]) },
      { label: "Mirror", detail: "The curtain is free." },
      { label: "Advice", detail: "No charge to try. Buying is another conversation." },
    ],
  }),
  desk({
    id: "tailor",
    title: "ORDER BOOK",
    button: "Get measured",
    npc: { role: "Master tailor", name: "Master Yaw", line: "I need the shoulder, the waist, and when you want it." },
    minutes: 30,
    cost: 60,
    note: "Master Yaw took your cloth and your measurements.",
    fun: 6,
    social: 4,
    board: (life) => [
      { label: "Cloth", detail: pick(dayKey(life), ["Kente strip", "Plain cotton", "A wax you brought"]) },
      { label: "Book", detail: "Ready in three days." },
      { label: "Fee", detail: "₵60 to cut." },
    ],
  }),
  desk({
    id: "bank",
    title: "CREDIT DESK",
    button: "See the manager",
    npc: { role: "Bank manager", name: "Mrs Asante", line: "Your score is the door. The cash is the room behind it." },
    minutes: 15,
    cost: 0,
    note: "",
    board: (life) => {
      const score = life.bank?.score ?? 600;
      return [
        { label: "Score", detail: `${score} · ${scoreLabel(score)}` },
        { label: "Limit", detail: cedis(loanLimit(life)) },
        { label: "Savings", detail: cedis(life.bank?.savings ?? 0) },
        { label: "Loan out", detail: cedis(life.bank?.loan ?? 0) },
      ];
    },
    act: (life) => {
      const limit = loanLimit(life);
      if ((life.bank?.loan ?? 0) < 1 && limit >= 200) return takeLoan(life, Math.min(500, limit));
      if (life.cash >= 40) return deposit(life, 40);
      return { life, notes: [], error: "Mrs Asante needs room on your credit, or ₵40 for a deposit." };
    },
  }),
  desk({
    id: "momo",
    title: "AGENT WINDOW",
    button: "Buy airtime",
    npc: { role: "MoMo agent", name: "Fiifi", line: "Cash in, cash out. Count it before you leave the shade." },
    minutes: 8,
    cost: 5,
    note: "Fiifi loaded ₵5 of airtime.",
    board: (life) => [
      { label: "Float", detail: "The window is open." },
      { label: "Airtime", detail: "₵5 for a small bundle." },
      { label: "Your wallet", detail: cedis(life.cash) },
    ],
  }),
  desk({
    id: "hospital",
    title: "TRIAGE",
    button: "See the nurse",
    npc: { role: "Nurse", name: "Nurse Ama", line: "Sit. I will call you when the chair is yours." },
    minutes: 10,
    cost: 0,
    note: "You gave blood. Nurse Ama wrote your name.",
    energy: -6,
    social: 6,
    hygiene: 4,
    board: (life) => {
      const sick = life.health?.sick;
      return [
        { label: "Queue", detail: `${4 + (accraHour() % 5)} people ahead.` },
        { label: "You", detail: sick ? "You look unwell. The doctor can see you." : "You can donate, or sit with someone." },
        { label: "Wait", detail: "About twenty minutes if nobody collapses." },
      ];
    },
    act: (life, spot) => (life.health?.sick ? seeClinic(life) : run(life, spot, { role: "Nurse", name: "Nurse Ama", line: "" }, { minutes: 20, cost: 0, note: "You donated blood. Nurse Ama wrote your name.", energy: -8, social: 6 })),
  }),
  desk({
    id: "pharmacy",
    title: "DISPENSARY",
    button: "Ask the chemist",
    npc: { role: "Pharmacist", name: "Pharm. Linda", line: "Tell me the symptom. Do not invent the drug." },
    minutes: 10,
    cost: 0,
    note: "",
    board: () => [
      { label: "On the shelf", detail: "Painkillers, ORS, a malaria course." },
      { label: "Advice", detail: "Free if you are only asking." },
      { label: "Script", detail: "A real fever still belongs at the clinic." },
    ],
    act: (life, spot) => (life.health?.sick ? selfMedicate(life) : run(life, spot, { role: "Pharmacist", name: "Pharm. Linda", line: "" }, { minutes: 10, cost: 0, note: "Pharm. Linda talked you through what not to mix.", social: 4, hygiene: 2 })),
  }),
  desk({
    id: "school",
    title: "TIMETABLE",
    button: "Sit the period",
    npc: { role: "Principal", name: "Mr Boateng", line: "The bell is not a suggestion." },
    minutes: 45,
    cost: 0,
    note: "You sat a period. Mr Boateng noticed.",
    energy: -4,
    skill: "career",
    board: (life) => [
      { label: "Now", detail: pick(dayKey(life), ["Maths", "English", "Integrated science"]) },
      { label: "Exam", detail: "End of term is on the board in the hall." },
      { label: "Report", detail: `Career skill ${life.skills.career}.` },
    ],
  }),
  desk({
    id: "university",
    title: "LECTURES",
    button: "Join the lecture",
    npc: { role: "Professor", name: "Prof. Hammond", line: "If you are late, take the back and stay quiet." },
    minutes: 50,
    cost: 0,
    note: "You sat in on Prof. Hammond.",
    energy: -4,
    social: 4,
    skill: "career",
    circle: "work",
    board: (life) => [
      { label: "This hour", detail: pick(dayKey(life), ["Political science", "Law of contract", "Development economics"]) },
      { label: "Union", detail: "A notice about fees is on the board." },
      { label: "You", detail: (life.school?.certs ?? []).length ? `Papers: ${life.school?.certs?.join(", ")}` : "No certificate on file yet." },
    ],
  }),
  desk({
    id: "police",
    title: "WANTED BOARD",
    button: "Desk window",
    npc: { role: "Desk officer", name: "Inspector Owusu", line: "State the matter. Do not decorate it." },
    minutes: 15,
    cost: 0,
    note: "You reported a matter at the desk.",
    social: 2,
    board: (life) => [
      { label: "On the wall", detail: pick(dayKey(life), ["A phone snatcher at Circle", "A missing apprentice", "A car taken at the mall"]) },
      { label: "Your file", detail: life.docket ? life.docket.note : "No open charge in your name." },
      { label: "Bail", detail: life.docket?.status === "booked" ? cedis(life.docket.bail) : "Nobody of yours is in the book." },
    ],
    act: (life, spot) => {
      if (life.docket?.status === "booked") return postBail(life, "self");
      return run(life, spot, { role: "Desk officer", name: "Inspector Owusu", line: "" }, { minutes: 15, cost: 0, note: "You reported a matter. Inspector Owusu wrote it down.", social: 2 });
    },
  }),
  desk({
    id: "church",
    title: "SERVICE",
    button: "Join the choir",
    npc: { role: "Pastor", name: "Pastor Ebenezer", line: "The offering is quiet. The choir is not." },
    minutes: 40,
    cost: 10,
    note: "You stood with the choir and left an offering.",
    social: 10,
    fun: 6,
    energy: -2,
    circle: "church",
    board: () => [
      { label: "Sunday", detail: "First service 7:30. Second service 10:00." },
      { label: "Offering", detail: "₵10 is a decent envelope." },
      { label: "Prayer", detail: "Write it. The usher takes the slip." },
    ],
  }),
  desk({
    id: "mosque",
    title: "PRAYER TIMES",
    button: "Stay for prayer",
    npc: { role: "Imam", name: "Imam Rashid", line: "Shoes off. Phone down. The room is for the prayer." },
    minutes: 25,
    cost: 0,
    note: "You stayed through the prayer.",
    social: 8,
    energy: 4,
    circle: "church",
    board: () => [
      { label: "Next", detail: "The board by the door has the five times." },
      { label: "Friday", detail: "Jumu'ah fills the yard." },
      { label: "Sadaqah", detail: "A box by the shoe rack." },
    ],
  }),
  desk({
    id: "gym",
    title: "CLASS BOARD",
    button: "Spar a round",
    npc: { role: "Trainer", name: "Coach Razak", line: "Hands up. The bag does not hit back. I do." },
    minutes: 35,
    cost: 15,
    note: "You sparred a round with Coach Razak.",
    energy: -8,
    fun: 6,
    skill: "fitness",
    board: (life) => [
      { label: "Now", detail: pick(dayKey(life), ["Pads", "Spin", "A quiet lift"]) },
      { label: "Board", detail: `Your fitness is ${life.skills.fitness}.` },
      { label: "Fee", detail: "₵15 for the round." },
    ],
  }),
  desk({
    id: "stadium",
    title: "FIXTURES",
    button: "Buy a jersey",
    npc: { role: "Coach", name: "Coach Addo", line: "The team sheet is on the wall. The noise is extra." },
    minutes: 20,
    cost: 50,
    note: "You bought a jersey at the window.",
    fun: 8,
    social: 4,
    board: (life) => [
      { label: "Next match", detail: pick(dayKey(life), ["Saturday, 3pm", "Sunday, 4pm", "Midweek, 7pm"]) },
      { label: "Gate", detail: "The cheap stand is still a stand." },
      { label: "Shirt", detail: "₵50 at the window." },
    ],
  }),
  desk({
    id: "station",
    title: "DEPARTURES",
    button: "Pay the mate",
    npc: { role: "Dispatcher", name: "Brother Kofi", line: "Circle, Madina, Kasoa. Shout it or miss it." },
    minutes: 12,
    cost: 8,
    note: "You paid the mate and took a seat.",
    energy: -2,
    board: () => [
      { label: "Loading", detail: "Madina. Two seats." },
      { label: "Next", detail: "Kasoa. The mate is still calling." },
      { label: "Fare", detail: "₵8 to the next junction." },
    ],
  }),
  desk({
    id: "beach",
    title: "WATER",
    button: "Swim a length",
    npc: { role: "Lifeguard", name: "Esi the guard", line: "Red flag means you stay on the sand." },
    minutes: 30,
    cost: 0,
    note: "You swam. Esi watched the line.",
    fun: 12,
    energy: -6,
    hygiene: -4,
    board: (life) => [
      { label: "Flag", detail: accraHour() >= 16 ? "Yellow. Stay shallow." : "Green. The line is calm." },
      { label: "Tide", detail: pick(dayKey(life), ["Coming in", "Slack water", "Going out"]) },
      { label: "Grill", detail: "Fresh fish if you want it after." },
    ],
  }),
  desk({
    id: "airport",
    title: "DEPARTURES",
    button: "Check the board",
    npc: { role: "Airline agent", name: "Ama at the desk", line: "Passport, ticket, and do not joke at security." },
    minutes: 15,
    cost: 0,
    note: "Ama checked you against the board.",
    social: 2,
    board: (life) => [
      { label: "ACC → KMS", detail: pick(dayKey(life), ["11:40", "14:10", "18:20"]) },
      { label: "Security", detail: "The belt is moving." },
      { label: "Duty-free", detail: "Perfume and a sad sandwich." },
    ],
  }),
  desk({
    id: "cinema",
    title: "SHOWTIMES",
    button: "Buy two tickets",
    npc: { role: "Usher", name: "Usher Naana", line: "Screen two. No light on the phone." },
    minutes: 100,
    cost: 40,
    note: "You took a seat in the dark with someone.",
    fun: 14,
    social: 8,
    energy: -2,
    board: (life) => [
      { label: "Screen 1", detail: `${pick(dayKey(life), ["A Ghana film", "A loud import", "A quiet romance"])} · 6:30` },
      { label: "Screen 2", detail: "9:00" },
      { label: "Snacks", detail: "Popcorn is a separate argument." },
    ],
  }),
  desk({
    id: "government",
    title: "QUEUE",
    button: "Take a number",
    npc: { role: "Civil servant", name: "Mr Dogbe", line: "Form, photocopy, and the fee. Then you wait." },
    minutes: 40,
    cost: 25,
    note: "You took a number for papers.",
    energy: -4,
    social: -2,
    board: (life) => [
      { label: "Now serving", detail: String(20 + (Math.floor(life.minutes / 30) % 40)) },
      { label: "You need", detail: "ID, a photo, and ₵25." },
      { label: "Window", detail: "Passport, licence, or a letter that proves you exist." },
    ],
  }),
  desk({
    id: "hotel",
    title: "ROOMS",
    button: "Book the night",
    npc: { role: "Concierge", name: "Phillip", line: "I can do the room. The city outside is your problem." },
    minutes: 20,
    cost: 120,
    note: "Phillip held a room in your name.",
    fun: 8,
    energy: 6,
    hygiene: 6,
    board: (life, spot) => [
      { label: "Free tonight", detail: pick(spot.id + dayKey(life), ["A double facing the pool", "A quiet single", "A suite if the wallet agrees"]) },
      { label: "Rate", detail: "₵120 for the night on this desk." },
      { label: "Room service", detail: "Jollof until 11." },
    ],
  }),
  desk({
    id: "garage",
    title: "JOB CARD",
    button: "Book the ramp",
    npc: { role: "Head mechanic", name: "Master Ali", line: "Leave the key. I will tell you what it actually needs." },
    minutes: 40,
    cost: 35,
    note: "Master Ali put the car on the card.",
    fun: 2,
    board: (life) => [
      { label: "On the ramp", detail: pick(dayKey(life), ["Brakes", "A service", "A dent and a story"]) },
      { label: "Parts", detail: "Filters are in. Body kits are a wait." },
      { label: "Your motor", detail: life.car ? "You have a car on file." : "No car in your name yet." },
    ],
  }),
  desk({
    id: "barber",
    title: "STYLES",
    button: "Sit in the chair",
    npc: { role: "Head barber", name: "Barber Razak", line: "Fade, beard, or both. The gossip is free." },
    minutes: 30,
    cost: 20,
    note: "Razak cut your hair and told you the street.",
    hygiene: 8,
    fun: 6,
    social: 6,
    board: (life) => [
      { label: "Waiting", detail: `${life.relations.length % 4} ahead of you.` },
      { label: "Chair", detail: pick(dayKey(life), ["Low fade", "A clean shave", "Line-up only"]) },
      { label: "Mirror", detail: "You will see it before you pay." },
    ],
  }),
  desk({
    id: "salon",
    title: "APPOINTMENTS",
    button: "Take the chair",
    npc: { role: "Stylist", name: "Aunty Linda", line: "Braids, a wash, or we leave it natural and neat." },
    minutes: 50,
    cost: 40,
    note: "Aunty Linda did your hair.",
    hygiene: 10,
    fun: 8,
    social: 6,
    board: (life) => [
      { label: "Book", detail: pick(dayKey(life), ["Knotless braids", "A wash and set", "Natural, trimmed"]) },
      { label: "Wait", detail: "She is on the head in the corner." },
      { label: "Price", detail: "₵40 for the short work." },
    ],
  }),
  desk({
    id: "casino",
    title: "TABLES",
    button: "Buy into a table",
    npc: { role: "Dealer", name: "Dealer Kojo", line: "Minimum is on the felt. I do not lend." },
    minutes: 25,
    cost: 30,
    note: "You sat at Dealer Kojo's table.",
    fun: 8,
    board: () => [
      { label: "Roulette", detail: "Minimum ₵10." },
      { label: "Cards", detail: "Minimum ₵30." },
      { label: "Pit", detail: "The boss is watching the high table." },
    ],
  }),
  desk({
    id: "karaoke",
    title: "SONG LIST",
    button: "Take the mic",
    npc: { role: "Host", name: "Host Mimi", line: "One song. The room will tell you the truth." },
    minutes: 15,
    cost: 10,
    note: "You sang. Mimi gave you the room.",
    fun: 12,
    social: 8,
    skill: "music",
    board: (life) => [
      { label: "Up next", detail: pick(dayKey(life), ["A highlife chorus", "A gospel line", "Something everybody knows"]) },
      { label: "You", detail: `Music skill ${life.skills.music}.` },
    ],
  }),
  desk({
    id: "shisha",
    title: "FLAVOURS",
    button: "Order a pipe",
    npc: { role: "Server", name: "Server Malik", line: "Mint, apple, or something that smells like a sweet shop." },
    minutes: 30,
    cost: 25,
    note: "You sat with a pipe and let the hour go.",
    fun: 8,
    social: 6,
    energy: 2,
    board: () => [
      { label: "Mint", detail: "The usual." },
      { label: "Apple", detail: "Sweeter. Same coal." },
      { label: "Seat", detail: "The low couches by the fan." },
    ],
  }),
  desk({
    id: "spa",
    title: "TREATMENTS",
    button: "Book a massage",
    npc: { role: "Therapist", name: "Efe", line: "Shoes off. Phone off. I will tell you when to turn." },
    minutes: 50,
    cost: 70,
    note: "Efe worked the day out of your shoulders.",
    energy: 12,
    hygiene: 8,
    fun: 8,
    board: () => [
      { label: "60 minutes", detail: "₵70." },
      { label: "Face", detail: "Another day. The book is full." },
      { label: "Room", detail: "The quiet one at the back." },
    ],
  }),
  desk({
    id: "estate",
    title: "LISTINGS",
    button: "Tour a place",
    npc: { role: "Agent", name: "Agent Serwaa", line: "I will show you the room. The price is the price." },
    minutes: 40,
    cost: 0,
    note: "Agent Serwaa walked you through a listing.",
    fun: 4,
    social: 4,
    board: (life) => [
      { label: "This week", detail: pick(dayKey(life), ["A chamber and hall in Dansoman", "A two-bed in Spintex", "A plot that still needs a wall"]) },
      { label: "Your cash", detail: cedis(life.cash) },
      { label: "Mortgage", detail: "The bank will want the same score they always want." },
    ],
  }),
  desk({
    id: "yard",
    title: "WHAT'S ON",
    button: "Stay a while",
    npc: { role: "Regular", name: "Brother Selorm", line: "This spot has its own hour. Do not rush it." },
    minutes: 20,
    cost: 0,
    note: "You stayed and let the place do what it does.",
    fun: 6,
    social: 6,
    board: (_life, spot) => [
      { label: "Here", detail: spot.name },
      { label: "Why people come", detail: spot.blurb.split(".")[0] ?? spot.blurb },
      { label: "Selorm", detail: "He is here most days. He remembers a face." },
    ],
  }),
  desk({
    id: "law",
    title: "CASE BOARD",
    button: "Ask for a minute",
    npc: { role: "Senior lawyer", name: "Counsel Ama", line: "Tell me the facts. I will tell you the fee." },
    minutes: 20,
    cost: 40,
    note: "Counsel Ama heard the facts.",
    social: 2,
    board: (life) => [
      { label: "Open matters", detail: life.docket ? life.docket.crime : "Nothing of yours on her desk." },
      { label: "Consult", detail: "₵40 to sit down." },
      { label: "Bar", detail: (life.school?.certs ?? []).includes("llb") ? "You can take a brief yourself." : "An LLB is how you stand on that side." },
    ],
  }),
];

const ORDER: [RegExp, string][] = [
  [/pharmacy|chemist/, "pharmacy"],
  [/hospital|clinic|korle|dental|vet/, "hospital"],
  [/momo/, "momo"],
  [/bank/, "bank"],
  [/mosque/, "mosque"],
  [/church|shrine/, "church"],
  [/legon|knust|university|campus/, "university"],
  [/school/, "school"],
  [/police/, "police"],
  [/stadium/, "stadium"],
  [/gym/, "gym"],
  [/kotoka|airport/, "airport"],
  [/cinema|flicks|theatre/, "cinema"],
  [/beach|labadi|kokrobite/, "beach"],
  [/hotel|kempinski/, "hotel"],
  [/barber/, "barber"],
  [/salon|braid/, "salon"],
  [/tailor|seamstress|kantamanto/, "tailor"],
  [/casino/, "casino"],
  [/karaoke/, "karaoke"],
  [/shisha/, "shisha"],
  [/spa/, "spa"],
  [/estate-agent|estate agent/, "estate"],
  [/law-office|law office/, "law"],
  [/passport|dvla|immigration|parliament|embassy|jubilee/, "government"],
  [/super|mini-mart/, "super"],
  [/market|makola|kejetia/, "market"],
  [/street-food|kelewele|night-grill/, "street"],
  [/restaurant|kempinski|cafe/, "restaurant"],
  [/buka|chop|waakye|asanka/, "chop"],
  [/fitting|garage|motors|car-wash/, "garage"],
  [/station|trotro|rank|circle/, "station"],
  [/bar|pub|lounge|republic|bloom/, "bar"],
];

const BY_ID = new Map(DESKS.map((item) => [item.id, item]));

export function deskOf(spot: Spot): Desk | null {
  const id = `${spot.id} ${spot.name}`.toLowerCase();
  if (/court|tribunal/.test(id)) return null;
  if (isNightlife(spot.id, CLUB_IDS)) return BY_ID.get("club") ?? null;
  for (const [test, key] of ORDER) {
    if (test.test(id)) return BY_ID.get(key) ?? null;
  }
  if (spot.group === "sea") return BY_ID.get("beach") ?? null;
  if (spot.group === "work" || spot.group === "civic") return BY_ID.get("government") ?? null;
  if (spot.group === "hang") return BY_ID.get("yard") ?? null;
  return BY_ID.get("yard") ?? null;
}

export function deskNpc(spot: Spot) {
  return deskOf(spot)?.npc ?? null;
}

export function deskMemory(life: Life, spot: Spot) {
  const npc = deskNpc(spot);
  if (!npc) return null;
  return recall(life, npc.name);
}
