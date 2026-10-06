import { STAGES } from "@/lib/game/estate";
import { cedis, cloneLife, logLine, type Life, type Skills, type StepResult } from "@/lib/game/world";

type Has = "biz" | "plot" | "car" | "kid" | "pet" | "team" | "house" | "faith" | "chief" | "fleet";

export type Goal =
  | { kind: "where"; spot: string; label: string }
  | { kind: "cash"; amount: number }
  | { kind: "skill"; skill: keyof Skills; level: number }
  | { kind: "stat"; stat: string; count: number; label: string }
  | { kind: "has"; what: Has; label: string }
  | { kind: "friend"; score: number }
  | { kind: "savings"; amount: number }
  | { kind: "standing"; amount: number };

export type Chapter = { line: string; goals: Goal[]; reward: number; done: string };
export type Story = { id: string; title: string; who: string; emoji: string; blurb: string; chapters: Chapter[] };

export const STORIES: Story[] = [
  {
    id: "auntie",
    title: "Auntie Adjoa's chop bar",
    who: "Auntie Adjoa",
    emoji: "👵🏾",
    blurb: "Your mother's old friend runs the busiest chop bar in Makola. She has plans for you.",
    chapters: [
      { line: "My dear, come and see me at Makola. I have been asking about you.", goals: [{ kind: "where", spot: "makola", label: "Makola Market" }], reward: 100, done: "Auntie Adjoa hugged you and filled a bowl of light soup." },
      { line: "If you want to work with me, your jollof must not embarrass me. Learn to cook.", goals: [{ kind: "skill", skill: "cooking", level: 3 }, { kind: "stat", stat: "cooked", count: 5, label: "Cook at home" }], reward: 300, done: "She tasted your stew and nodded slowly. High praise." },
      { line: "Now open your own spot. I will send you my overflow customers.", goals: [{ kind: "has", what: "biz", label: "Own a business" }], reward: 800, done: "Auntie Adjoa sent a whole office lunch order your way." },
      { line: "Feed the area. When you have cooked twenty pots and have ₵2,000 in hand, we talk partnership.", goals: [{ kind: "stat", stat: "cooked", count: 20, label: "Cook at home" }, { kind: "cash", amount: 2000 }], reward: 1500, done: "She put your name on the chop bar signboard next to hers." },
    ],
  },
  {
    id: "kofi",
    title: "Kofi is back from London",
    who: "Cousin Kofi",
    emoji: "🧳",
    blurb: "Your cousin landed at Kotoka with two suitcases and big ideas.",
    chapters: [
      { line: "Chale, I have been gone ten years. Show me how Accra parties now.", goals: [{ kind: "stat", stat: "parties", count: 2, label: "Go out partying" }], reward: 150, done: "Kofi danced azonto badly and loved every minute." },
      { line: "I want land. Help me buy a plot, and please, no land guards.", goals: [{ kind: "has", what: "plot", label: "Own a plot" }], reward: 1000, done: "Kofi checked the site plan twice and sent you a thank-you." },
      { line: "Trotro is cute, but we need our own wheels.", goals: [{ kind: "has", what: "car", label: "Own a car" }], reward: 1500, done: "He sat in the passenger seat taking videos for his London friends." },
      { line: "Before I fly back, let me see you stand on your own: ₵5,000 in hand.", goals: [{ kind: "cash", amount: 5000 }], reward: 2500, done: "Kofi left you an envelope at the airport. He is moving back next year." },
    ],
  },
  {
    id: "landlord",
    title: "The landlord dispute",
    who: "Mr Owusu, the landlord",
    emoji: "🧓🏾",
    blurb: "Your landlord wants two years' rent advance, again. Time to fight back.",
    chapters: [
      { line: "Mr Owusu says the rent is going up. Get the neighbours on your side first.", goals: [{ kind: "friend", score: 40 }], reward: 100, done: "The whole compound signed your letter." },
      { line: "He will not listen. Take the matter to the High Court.", goals: [{ kind: "where", spot: "court", label: "High Court" }], reward: 200, done: "The judge told Mr Owusu to follow the Rent Act." },
      { line: "Keep ₵1,000 in the bank in case he appeals.", goals: [{ kind: "savings", amount: 1000 }], reward: 400, done: "Mr Owusu dropped the appeal when he saw you were ready." },
      { line: "The real win: build your own house and never pay him again.", goals: [{ kind: "has", what: "house", label: "Finish a house" }], reward: 3000, done: "You handed Mr Owusu your keys with a big smile." },
    ],
  },
  {
    id: "league",
    title: "Sunday league dreams",
    who: "Coach Abeiku",
    emoji: "⚽",
    blurb: "An old coach at the park thinks the neighbourhood can win the shield.",
    chapters: [
      { line: "These boys play every evening with no kits. Start a team for them.", goals: [{ kind: "has", what: "team", label: "Found a football team" }], reward: 300, done: "The boys wore the new kits to church on Sunday." },
      { line: "Win one gala and the area will believe.", goals: [{ kind: "stat", stat: "galaWins", count: 1, label: "Win a gala" }], reward: 500, done: "The whole street came out with vuvuzelas." },
      { line: "Five trophies and scouts will start coming to watch.", goals: [{ kind: "stat", stat: "galaWins", count: 5, label: "Win galas" }], reward: 2000, done: "A scout from a Premier League club took two of your boys for trials." },
    ],
  },
  {
    id: "nana",
    title: "Nana's blessing",
    who: "Nana Ama, the queen mother",
    emoji: "👑",
    blurb: "The queen mother of the area has been watching you.",
    chapters: [
      { line: "A person without a congregation is a tree without roots. Find yours.", goals: [{ kind: "has", what: "faith", label: "Join a church or mosque" }], reward: 100, done: "Nana Ama blessed you with schnapps poured on the ground." },
      { line: "Let the area know your name for good reasons.", goals: [{ kind: "standing", amount: 60 }], reward: 400, done: "People now greet you by name at the junction." },
      { line: "Build something that will outlive you.", goals: [{ kind: "standing", amount: 150 }], reward: 1000, done: "Nana Ama invited you to sit with the elders." },
      { line: "The stool is waiting. Hold your durbar.", goals: [{ kind: "has", what: "chief", label: "Become a chief" }], reward: 3000, done: "The queen mother herself placed the cloth on your shoulders." },
    ],
  },
];

function owns(life: Life, what: Has) {
  switch (what) {
    case "biz": return (life.businesses ?? []).length > 0;
    case "plot": return (life.plots ?? []).length > 0;
    case "car": return Boolean(life.car);
    case "kid": return (life.kids ?? []).length > 0;
    case "pet": return (life.pets ?? []).length > 0;
    case "team": return Boolean(life.team);
    case "house": return (life.plots ?? []).some((plot) => plot.stage >= STAGES.length - 1);
    case "faith": return Boolean(life.community?.faith);
    case "chief": return Boolean(life.community?.chief);
    case "fleet": return (life.fleet ?? []).length > 0;
  }
}

export function goalMet(life: Life, goal: Goal) {
  switch (goal.kind) {
    case "where": return life.where === goal.spot;
    case "cash": return life.cash >= goal.amount;
    case "skill": return life.skills[goal.skill] >= goal.level;
    case "stat": return (life.stats?.[goal.stat] ?? 0) >= goal.count;
    case "has": return owns(life, goal.what);
    case "friend": return life.relations.some((person) => person.score >= goal.score);
    case "savings": return (life.bank?.savings ?? 0) >= goal.amount;
    case "standing": return (life.community?.standing ?? 0) >= goal.amount;
  }
}

export function goalText(life: Life, goal: Goal) {
  switch (goal.kind) {
    case "where": return `Visit ${goal.label}`;
    case "cash": return `Have ${cedis(goal.amount)} in hand (${cedis(life.cash)})`;
    case "skill": return `${goal.skill[0].toUpperCase()}${goal.skill.slice(1)} level ${goal.level} (${life.skills[goal.skill]})`;
    case "stat": return `${goal.label}: ${Math.min(goal.count, life.stats?.[goal.stat] ?? 0)}/${goal.count}`;
    case "has": return goal.label;
    case "friend": return `A friendship at ${goal.score}+ (best ${Math.max(0, ...life.relations.map((person) => person.score))})`;
    case "savings": return `${cedis(goal.amount)} in the bank (${cedis(life.bank?.savings ?? 0)})`;
    case "standing": return `Community standing ${goal.amount} (${life.community?.standing ?? 0})`;
  }
}

export function chapterOf(life: Life, story: Story) {
  const step = life.story?.[story.id] ?? 0;
  return { step, chapter: story.chapters[step] ?? null };
}

export function storyReady(life: Life) {
  return STORIES.filter((story) => {
    const { chapter } = chapterOf(life, story);
    return chapter ? chapter.goals.every((goal) => goalMet(life, goal)) : false;
  }).length;
}

export function advanceStory(life: Life, storyId: string): StepResult {
  const story = STORIES.find((item) => item.id === storyId);
  if (!story) return { life, notes: [], error: "No such story." };
  const { step, chapter } = chapterOf(life, story);
  if (!chapter) return { life, notes: [], error: "You finished this story." };
  const missing = chapter.goals.filter((goal) => !goalMet(life, goal));
  if (missing.length) return { life, notes: [], error: `Not yet: ${goalText(life, missing[0])}.` };
  const next = cloneLife(life);
  next.story = { ...next.story, [story.id]: step + 1 };
  next.cash += chapter.reward;
  const last = step + 1 >= story.chapters.length;
  logLine(next, `${story.title}: ${chapter.done}`);
  return { life: next, notes: [`${chapter.done} +${cedis(chapter.reward)}.${last ? " Story complete." : ""}`] };
}
