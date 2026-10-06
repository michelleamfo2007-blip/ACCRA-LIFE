import { bump, cedis, cloneLife, logLine, type Footballer, type Life, type StepResult, type Team } from "@/lib/game/world";

export const FOUND = 1500;
export const SQUAD_MAX = 11;
export const SQUAD_MIN = 7;
export const TRAIN_COST = 50;
const TRAIN_GAP = 360;
const GALA_GAP = 240;

export const GALAS = [
  { id: "estate", label: "Estate gala", fee: 50, prize: 200, strength: 3 },
  { id: "district", label: "District cup", fee: 200, prize: 700, strength: 5 },
  { id: "regional", label: "Greater Accra shield", fee: 600, prize: 2000, strength: 7 },
] as const;

export const COLORS = ["#CE1126", "#FCD116", "#006B3F", "#121212", "#1d4ed8", "#7c3aed"];

const FIRST = ["Kofi", "Kwame", "Yaw", "Kojo", "Kwabena", "Kwaku", "Kwesi", "Nii", "Ebo", "Fiifi", "Selasi", "Mawuli", "Issah", "Abdul", "Atsu", "Mensah", "Tetteh", "Baba", "Elikem", "Dela"];
const LAST = ["Boateng", "Asante", "Owusu", "Mensah", "Quaye", "Lamptey", "Addo", "Agyei", "Tetteh", "Ofori", "Amankwah", "Danso", "Yeboah", "Sarpong", "Adjei", "Annan"];
const POSITIONS: Footballer["pos"][] = ["GK", "DEF", "DEF", "MID", "MID", "FWD", "FWD"];

function seeded(seed: number) {
  let state = seed % 2147483647 || 1;
  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

function footballer(rand: () => number, pos: Footballer["pos"], key: string, top = 4): Footballer {
  return {
    id: key,
    name: `${FIRST[Math.floor(rand() * FIRST.length)]} ${LAST[Math.floor(rand() * LAST.length)]}`,
    pos,
    skill: 1 + Math.floor(rand() * top),
  };
}

export function scoutPool(life: Life) {
  const day = Math.floor(life.minutes / 1440);
  const rand = seeded(day * 7919 + 13);
  const pos: Footballer["pos"][] = ["GK", "DEF", "MID", "FWD", "DEF", "MID", "FWD", "MID"];
  const owned = new Set(life.team?.players.map((player) => player.id));
  return pos.map((item, index) => footballer(rand, item, `s${day}-${index}`, 7)).filter((player) => !owned.has(player.id));
}

export function signFee(player: Footballer) {
  return player.skill * player.skill * 60;
}

export function teamPower(team: Team) {
  const best = [...team.players].sort((a, b) => b.skill - a.skill).slice(0, SQUAD_MAX);
  if (best.length < SQUAD_MIN) return 0;
  const skill = best.reduce((sum, player) => sum + player.skill, 0) / best.length;
  const keeper = best.some((player) => player.pos === "GK") ? 0 : -1.2;
  return Math.max(0.5, skill + keeper + (team.morale - 50) / 40 + Math.min(1, (best.length - SQUAD_MIN) * 0.25));
}

function goals(power: number, other: number, rand: () => number) {
  const expected = Math.max(0.2, 1.3 + (power - other) * 0.35);
  let count = 0;
  for (let shot = 0; shot < 8; shot += 1) if (rand() < expected / 8) count += 1;
  return count;
}

export function simulate(a: number, b: number, rand: () => number = Math.random) {
  return [goals(a, b, rand), goals(b, a, rand)] as const;
}

export function foundTeam(life: Life, name: string, color: string): StepResult {
  const clean = name.trim().slice(0, 28);
  if (life.team) return { life, notes: [], error: "You already run a team." };
  if (clean.length < 3) return { life, notes: [], error: "Give the team a name." };
  if (life.cash < FOUND) return { life, notes: [], error: `Kits, balls and registration cost ${cedis(FOUND)}.` };
  const next = cloneLife(life);
  const rand = seeded(life.minutes + clean.length * 31);
  next.cash -= FOUND;
  next.team = {
    name: clean,
    color: COLORS.includes(color) ? color : COLORS[0],
    players: POSITIONS.map((pos, index) => footballer(rand, pos, `f${life.minutes}-${index}`, 3)),
    morale: 60,
    wins: 0,
    draws: 0,
    losses: 0,
    trophies: 0,
  };
  logLine(next, `Founded ${clean}. Seven boys from the neighbourhood signed up.`);
  return { life: next, notes: [`${clean} is registered. Seven players from the neighbourhood signed up.`] };
}

export function signPlayer(life: Life, playerId: string): StepResult {
  const team = life.team;
  if (!team) return { life, notes: [], error: "Found a team first." };
  if (team.players.length >= SQUAD_MAX) return { life, notes: [], error: "The squad is full. Release someone first." };
  const player = scoutPool(life).find((item) => item.id === playerId);
  if (!player) return { life, notes: [], error: "That player signed elsewhere." };
  const fee = signFee(player);
  if (life.cash < fee) return { life, notes: [], error: `${player.name} wants ${cedis(fee)}.` };
  const next = cloneLife(life);
  next.cash -= fee;
  next.team = { ...team, players: [...team.players, player] };
  return { life: next, notes: [`Signed ${player.name} (${player.pos}) for ${cedis(fee)}.`] };
}

export function releasePlayer(life: Life, playerId: string): StepResult {
  const team = life.team;
  const player = team?.players.find((item) => item.id === playerId);
  if (!team || !player) return { life, notes: [], error: "Not on your squad." };
  const next = cloneLife(life);
  next.team = { ...team, players: team.players.filter((item) => item.id !== playerId), morale: Math.max(0, team.morale - 3) };
  return { life: next, notes: [`Released ${player.name}.`] };
}

export function trainTeam(life: Life): StepResult {
  const team = life.team;
  if (!team) return { life, notes: [], error: "Found a team first." };
  const wait = (team.lastTrain ?? -Infinity) + TRAIN_GAP - life.minutes;
  if (wait > 0) return { life, notes: [], error: `The boys are tired. Train again in ${Math.ceil(wait / 60)}h.` };
  if (life.cash < TRAIN_COST) return { life, notes: [], error: `Water and pitch fees cost ${cedis(TRAIN_COST)}.` };
  const next = cloneLife(life);
  const rand = seeded(life.minutes + 7);
  const lucky = team.players.length ? Math.floor(rand() * team.players.length) : -1;
  const players = team.players.map((player, index) => (index === lucky && player.skill < 10 && rand() < 0.45 ? { ...player, skill: player.skill + 1 } : player));
  const grew = lucky >= 0 && players[lucky].skill > team.players[lucky].skill;
  next.cash -= TRAIN_COST;
  next.team = { ...team, players, morale: Math.min(100, team.morale + 6), lastTrain: life.minutes };
  if (rand() < 0.25) next.skills.fitness = Math.min(10, next.skills.fitness + 1);
  return { life: next, notes: [grew ? `Training at the park. ${players[lucky].name} is sharper now.` : "Training at the park. Morale is up."] };
}

export function playGala(life: Life, galaId: string): StepResult {
  const team = life.team;
  const gala = GALAS.find((item) => item.id === galaId);
  if (!team || !gala) return { life, notes: [], error: "Pick a gala." };
  if (team.players.length < SQUAD_MIN) return { life, notes: [], error: `You need ${SQUAD_MIN} players to field a team.` };
  const wait = (team.lastGala ?? -Infinity) + GALA_GAP - life.minutes;
  if (wait > 0) return { life, notes: [], error: `Next gala in ${Math.ceil(wait / 60)}h.` };
  if (life.cash < gala.fee) return { life, notes: [], error: `Entry fee is ${cedis(gala.fee)}.` };
  const [mine, theirs] = simulate(teamPower(team), gala.strength);
  const next = cloneLife(life);
  next.cash -= gala.fee;
  const won = mine > theirs;
  const drew = mine === theirs;
  const prize = won ? gala.prize : drew ? Math.round(gala.fee * 1.2) : 0;
  next.cash += prize;
  next.team = {
    ...team,
    wins: team.wins + (won ? 1 : 0),
    draws: team.draws + (drew ? 1 : 0),
    losses: team.losses + (!won && !drew ? 1 : 0),
    trophies: team.trophies + (won ? 1 : 0),
    morale: Math.max(0, Math.min(100, team.morale + (won ? 8 : drew ? 1 : -7))),
    lastGala: life.minutes,
  };
  if (won) bump(next, "galaWins");
  const line = `${gala.label}: ${team.name} ${mine}–${theirs}. ${won ? `Champions! ${cedis(prize)} prize.` : drew ? `Draw. ${cedis(prize)} shared out.` : "Beaten this time."}`;
  logLine(next, line);
  return { life: next, notes: [line] };
}
