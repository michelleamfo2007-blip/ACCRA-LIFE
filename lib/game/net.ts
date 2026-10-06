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

export type Invite = { from: string; at: string };

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

export type EventKind = "funeral" | "wedding" | "outdooring" | "party";
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

export type Net = {
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
};

export const EVENT_INFO: Record<EventKind, { label: string; emoji: string; cost: number; code: DressCode; verb: string }> = {
  funeral: { label: "Funeral", emoji: "🖤", cost: 500, code: "black-red", verb: "Pay respects and dance" },
  wedding: { label: "Wedding", emoji: "💒", cost: 800, code: "kente", verb: "Celebrate the couple" },
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

export type SpotPos = { where: string; x: number; y: number; at: string };

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
};

export const BOND_LABEL: Record<BondStage, string> = { dating: "Dating", engaged: "Engaged", married: "Married" };

export const ASK_LABEL: Record<BondStage, string> = { dating: "wants to date you", engaged: "proposed to you", married: "wants to set the wedding date" };

export const RING_PRICE = 2500;
export const WEDDING_PRICE = 6000;

export function friendStage(score: number) {
  if (score >= 75) return "Best friend";
  if (score >= 50) return "Close friend";
  if (score >= 25) return "Friend";
  return "Met once";
}

export function groupThread(owner: string, id: string) {
  return `group:${owner}:${id}`;
}

export function parseGroupThread(thread: string): NetRef | null {
  const parts = thread.split(":");
  if (parts.length !== 3 || parts[0] !== "group") return null;
  return { owner: parts[1], id: parts[2] };
}
