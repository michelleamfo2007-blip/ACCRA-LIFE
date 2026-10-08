import type { Board, GameKind } from "@/lib/game/boards";
import type { Look, Placed } from "@/lib/game/world";

export type NetRef = { owner: string; id: string };

export type SusuGroup = {
  id: string;
  name: string;
  owner: string;
  members: string[];
  amount: number;
  round: number;
  paid: string[];
  pot: number;
  history: { round: number; to: string; amount: number; at: string }[];
  createdAt: string;
};

export type GroupMail = { from: string; text: string; time: string; at: string };

export type ChatGroup = {
  id: string;
  name: string;
  owner: string;
  members: string[];
  messages: GroupMail[];
};

export type BondStage = "dating" | "engaged" | "married";

export type Bond = { with: string; stage: BondStage; since: string };

export type BondAsk = { from: string; kind: BondStage; at: string; paid?: number };

export type Invite = { from: string; at: string; kind?: "home" | "table"; spot?: string; seatId?: string };

export type Crew = {
  id: string;
  name: string;
  tag: string;
  owner: string;
  members: string[];
  bank: number;
  week: number;
  raised: number;
  level: number;
  wonWeek?: number;
  messages: GroupMail[];
};

export type CrewAsk = { owner: string; id: string; name: string; at: string };

export type EventKind = "funeral" | "wedding" | "engagement" | "outdooring" | "party";
export type DressCode = "black-red" | "white" | "kente" | "any";

export type LifeEvent = {
  id: string;
  host: string;
  kind: EventKind;
  title: string;
  spot: string;
  startsAt: string;
  endsAt: string;
  code: DressCode;
  attendees: string[];
  gifts: number;
  door?: number;
  paid?: string[];
};

export type MatchStatus = "waiting" | "playing" | "done" | "declined";

export type Match = {
  id: string;
  game: GameKind;
  a: string;
  b: string;
  stake: number;
  status: MatchStatus;
  board: Board;
  winner?: string | null;
  at: string;
  moved: string;
};

export type PostKind = "status" | "house" | "outfit" | "car" | "team" | "harvest";

export type PostReply = { id: string; who: string; name: string; text: string; at: string };

export type Post = { id: string; kind: PostKind; text: string; snap: string; likes: string[]; at: string; replies?: PostReply[]; by?: string; byName?: string };

export type ListingKind = "item" | "good" | "fit";

export type Listing = { id: string; kind: ListingKind; ref: string; label: string; emoji: string; qty: number; price: number; at: string };

export type FcStatus = "waiting" | "done" | "declined";

export type FcMatch = { id: string; a: string; b: string; aTeam: string; bTeam: string; stake: number; status: FcStatus; score?: [number, number]; at: string };

export type ChopSign = { name: string; spot: string; menu: { dish: string; price: number }[]; guests?: number; takings?: number };

export type Net = {
  chop?: ChopSign | null;
  chartPaid?: number;
  posts?: Post[];
  following?: string[];
  listings?: Listing[];
  fc?: FcMatch[];
  fcIn?: NetRef[];
  runs?: { week: number; pitch: string }[];
  votes?: { week: number; for: string }[];
  stipend?: number;
  susu?: SusuGroup[];
  susuIn?: NetRef[];
  groups?: ChatGroup[];
  groupsIn?: NetRef[];
  bond?: Bond | null;
  asks?: BondAsk[];
  invites?: Invite[];
  crew?: Crew | null;
  crewIn?: NetRef | null;
  crewAsks?: CrewAsk[];
  events?: LifeEvent[];
  games?: Match[];
  gamesIn?: NetRef[];
  blocked?: string[];
  reports?: Report[];
  mutedUntil?: string;
  cleared?: string;
  referredBy?: string;
  referrals?: Referral[];
  turfPaid?: number;
};

export type Report = { who: string; reason: string; quote: string; at: string };

export type Referral = { username: string; at: string; paid?: boolean };

export const REFER_PRIZE = 150;
export const REFER_CAP = 10;
export const DOOR_FEES = [0, 10, 20, 50];
export const EMOTES = ["👋", "💃", "😂", "🙌", "❤️", "📸"] as const;
export const EMOTE_MS = 6000;

export const EVENT_INFO: Record<EventKind, { label: string; emoji: string; cost: number; code: DressCode; verb: string }> = {
  funeral: { label: "Funeral", emoji: "🖤", cost: 500, code: "black-red", verb: "Pay respects and dance" },
  wedding: { label: "Wedding", emoji: "💒", cost: 800, code: "white", verb: "Celebrate the couple" },
  engagement: { label: "Knocking ceremony", emoji: "💍", cost: 600, code: "kente", verb: "Witness the knocking" },
  outdooring: { label: "Outdooring", emoji: "👶", cost: 300, code: "white", verb: "Bless the baby" },
  party: { label: "House party", emoji: "🎉", cost: 200, code: "any", verb: "Join the party" },
};

export const CODE_LABEL: Record<DressCode, string> = { "black-red": "Black and red", white: "All white", kente: "Kente", any: "Come as you are" };

export function crewWeek(at = Date.now()) {
  return Math.floor((at / 86400000 + 3) / 7);
}

export function crewGoal(crew: Crew) {
  return 1000 * crew.members.length;
}

export const POST_GAP_MS = 0;
export const MARKET_FEE = 0.05;
export const MAX_LISTINGS = 8;
export const RUN_FEE = 300;
export const RUN_STANDING = 60;
export const STIPEND = 400;

export const POST_LABEL: Record<PostKind, { label: string; emoji: string }> = {
  status: { label: "Status", emoji: "💬" },
  house: { label: "My room", emoji: "🏠" },
  outfit: { label: "Fit check", emoji: "👗" },
  car: { label: "My ride", emoji: "🚗" },
  team: { label: "My team", emoji: "⚽" },
  harvest: { label: "Harvest", emoji: "🧺" },
};

export type SpotPos = { where: string; x: number; y: number; at: string; emote?: string; emoteAt?: string };

export type HostHome = {
  username: string;
  name: string;
  homeId: string;
  look: Look;
  inventory: string[];
  furniture: Placed[];
  floor?: string;
};

export type SocialView = {
  susu: (SusuGroup & { mine: boolean })[];
  groups: { id: string; owner: string; name: string; members: string[]; last: string; time: string; incoming: { at: string; text: string }[] }[];
  bond: Bond | null;
  asks: BondAsk[];
  invites: Invite[];
  blocked?: string[];
};

export const BOND_LABEL: Record<BondStage, string> = { dating: "Dating", engaged: "Engaged", married: "Married" };

export const ASK_LABEL: Record<BondStage, string> = { dating: "wants to date you", engaged: "proposed to you", married: "wants to set the wedding date" };

export const RING_PRICE = 2500;
export const WEDDING_PRICE = 6000;

export function friendStage(score: number) {
  if (score >= 90) return "Family-like";
  if (score >= 75) return "Best friend";
  if (score >= 50) return "Close friend";
  if (score >= 25) return "Friend";
  if (score >= 10) return "Acquaintance";
  return "Stranger";
}

export function groupThread(owner: string, id: string) {
  return `group:${owner}:${id}`;
}

export function parseGroupThread(thread: string): NetRef | null {
  const parts = thread.split(":");
  if (parts.length !== 3 || parts[0] !== "group") return null;
  return { owner: parts[1], id: parts[2] };
}
