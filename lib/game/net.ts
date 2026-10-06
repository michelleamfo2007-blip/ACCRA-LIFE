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

export type Net = {
  susu?: SusuGroup[];
  susuIn?: NetRef[];
  groups?: ChatGroup[];
  groupsIn?: NetRef[];
  bond?: Bond | null;
  asks?: BondAsk[];
  invites?: Invite[];
};

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
