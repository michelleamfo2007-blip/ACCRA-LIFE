import { noteRep } from "@/lib/game/spine";
import { cedis, cloneLife, logLine, passTime, type Life, type StepResult } from "@/lib/game/world";

export type Hearing = {
  id: string;
  title: string;
  time: string;
  yours: boolean;
  judge: string;
  crime: string;
};

const HANDLES = ["@mike_ee", "@Syndrome_45", "@ama_mensah", "@kofi.law", "@yaw_spintex", "@esi_osu", "@nana_kwame", "@adjoa.b", "@fiifi", "@selorm", "@abena_t", "@kojo_m"];
const JUDGES = ["Justice Mensah", "Justice Owusu", "Justice Adjei", "Justice Boateng"];
const CRIMES = ["robbery", "assault", "theft", "fraud", "a land quarrel"];

export const PHASES = ["The clerk reads the case.", "The prosecution opens.", "The defence answers.", "A witness is sworn.", "The judge asks one question.", "The verdict is read."] as const;

function clock(hour: number, minute: number) {
  const h = hour % 12 || 12;
  const m = String(minute).padStart(2, "0");
  return `${h}:${m} ${hour >= 12 ? "pm" : "am"}`;
}

export function courtTitle(spotId: string) {
  if (/kumasi/i.test(spotId)) return "Circuit Court, Kumasi";
  if (/tribunal|palace/i.test(spotId)) return "Community tribunal";
  if (/appeal/i.test(spotId)) return "Court of Appeal";
  if (/supreme/i.test(spotId)) return "Supreme Court";
  return "High Court, Accra";
}

export function causeList(life: Life, you = "you"): Hearing[] {
  const day = Math.floor(life.minutes / 1440);
  const rows: Hearing[] = [];
  for (let i = 0; i < 30; i += 1) {
    const left = HANDLES[(day + i) % HANDLES.length];
    const right = HANDLES[(day + i * 3 + 2) % HANDLES.length];
    const hour = 9 + Math.floor(i / 4);
    const minute = (i % 4) * 15;
    rows.push({
      id: `h-${day}-${i}`,
      title: left === right ? `${left} v. The Republic` : `${left} v. ${right}`,
      time: clock(hour, minute),
      yours: false,
      judge: JUDGES[i % JUDGES.length],
      crime: CRIMES[i % CRIMES.length],
    });
  }
  const docket = life.docket;
  if (docket && (docket.status === "court" || docket.status === "bail" || docket.status === "booked")) {
    rows.unshift({
      id: "yours",
      title: `@${you || "you"} v. The Republic`,
      time: "3:15 pm",
      yours: true,
      judge: "Justice Mensah",
      crime: docket.crime,
    });
  }
  return rows;
}

export function canPractice(life: Life) {
  return (life.school?.certs ?? []).includes("llb") || life.skills.career >= 6;
}

export function watchedHearing(life: Life, title: string): StepResult {
  const next = cloneLife(life);
  next.needs.fun = Math.min(100, next.needs.fun + 6);
  next.needs.social = Math.min(100, next.needs.social + 4);
  const line = `You watched ${title} from the gallery. The corridor is already retelling it.`;
  if (next.spine) next.spine.journal = [...next.spine.journal, { year: new Date().getFullYear(), line }].slice(-40);
  logLine(next, line);
  return { life: next, notes: [line] };
}

export function argueBrief(life: Life, hearing: Hearing): StepResult {
  if (hearing.yours) return { life, notes: [], error: "That file is yours. You do not brief yourself." };
  if (!canPractice(life)) return { life, notes: [], error: "The bar wants an LLB, or career skill 6." };
  const timed = passTime(cloneLife(life), 50).life;
  const won = Math.random() < 0.42 + timed.skills.career * 0.04;
  if (won) {
    const pay = 180 + timed.skills.career * 20;
    timed.cash += pay;
    timed.skills.career = Math.min(10, timed.skills.career + 1);
    noteRep(timed, 3, `You won ${hearing.title}.`);
    const line = `You took ${hearing.title}. The court found for your side. ${cedis(pay)}.`;
    logLine(timed, line);
    return { life: timed, notes: [line] };
  }
  noteRep(timed, -4, `You lost ${hearing.title}.`);
  timed.needs.fun = Math.max(0, timed.needs.fun - 6);
  const line = `${hearing.judge} was not moved. ${hearing.title} went the other way.`;
  logLine(timed, line);
  return { life: timed, notes: [line] };
}
