export type BizKind = {
  id: string;
  label: string;
  emoji: string;
  area: string;
  price: number;
  perHour: number;
  wages: number;
  detail: string;
};

export const BUSINESSES: BizKind[] = [
  { id: "kiosk", label: "Provisions kiosk", emoji: "🏪", area: "Madina", price: 1500, perHour: 4, wages: 120, detail: "Sachet water, Milo, airtime. Small and steady." },
  { id: "barber", label: "Barbering shop", emoji: "💈", area: "Kaneshie", price: 3000, perHour: 8, wages: 300, detail: "Two chairs, a generator and a queue on Saturdays." },
  { id: "salon", label: "Salon", emoji: "💇🏾‍♀️", area: "Adabraka", price: 4000, perHour: 10, wages: 380, detail: "Braids, wigs and the best gist on the street." },
  { id: "chop-bar", label: "Chop bar", emoji: "🍲", area: "Osu", price: 6000, perHour: 15, wages: 600, detail: "Fufu, banku and light soup from 11am till it finishes." },
  { id: "drinks", label: "Drinking spot", emoji: "🍻", area: "Labadi", price: 9000, perHour: 22, wages: 900, detail: "Plastic chairs, cold Club and a speaker that never rests." },
  { id: "boutique", label: "Boutique", emoji: "👗", area: "East Legon", price: 12000, perHour: 28, wages: 1100, detail: "Made-in-Ghana fits for people who post their outfits." },
];

export const MAX_BIZ_LEVEL = 3;
export const TILL_HOURS = 48;

export function bizKind(id: string) {
  return BUSINESSES.find((item) => item.id === id) ?? BUSINESSES[0];
}

export function bizRate(kind: string, level: number) {
  return bizKind(kind).perHour * (1 + 0.5 * (Math.max(1, level) - 1));
}

export function bizWages(kind: string, level: number) {
  return Math.round(bizKind(kind).wages * (1 + 0.4 * (Math.max(1, level) - 1)));
}
