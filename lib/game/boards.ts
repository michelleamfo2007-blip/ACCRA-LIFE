export type GameKind = "oware" | "draughts" | "ludo";
export type Side = 0 | 1;
export type Result = Side | "draw" | null;

export type Oware = { kind: "oware"; pits: number[]; store: [number, number]; turn: Side; winner: Result; last?: number; quiet?: number };
export type Draughts = { kind: "draughts"; board: number[]; turn: Side; chain: number | null; winner: Result; quiet: number; last?: [number, number] };
export type Ludo = { kind: "ludo"; tokens: [number[], number[]]; turn: Side; dice: number | null; winner: Result; note?: string };
export type Board = Oware | Draughts | Ludo;

export type Move = { pit?: number; from?: number; to?: number; token?: number; roll?: number };

export const GAME_LABEL: Record<GameKind, string> = { oware: "Oware", draughts: "Draughts", ludo: "Ludo" };

const range = (n: number) => Array.from({ length: n }, (_, i) => i);
const other = (side: Side): Side => (side === 0 ? 1 : 0);

export function startBoard(kind: GameKind): Board {
  if (kind === "oware") return { kind, pits: Array(12).fill(4), store: [0, 0], turn: 0, winner: null };
  if (kind === "draughts") {
    const board = range(64).map((i) => {
      const row = Math.floor(i / 8);
      const dark = (row + (i % 8)) % 2 === 1;
      if (!dark) return 0;
      if (row <= 2) return 3;
      if (row >= 5) return 1;
      return 0;
    });
    return { kind, board, turn: 0, chain: null, winner: null, quiet: 0 };
  }
  return { kind: "ludo", tokens: [[-1, -1, -1, -1], [-1, -1, -1, -1]], turn: 0, dice: null, winner: null };
}

const owns = (side: Side, pit: number) => (side === 0 ? pit < 6 : pit >= 6);

function sow(pits: number[], pit: number) {
  const next = [...pits];
  let seeds = next[pit];
  next[pit] = 0;
  let at = pit;
  while (seeds > 0) {
    at = (at + 1) % 12;
    if (at === pit) continue;
    next[at] += 1;
    seeds -= 1;
  }
  return { pits: next, last: at };
}

export function owareMoves(state: Oware) {
  if (state.winner !== null) return [];
  const side = state.turn;
  const mine = range(12).filter((pit) => owns(side, pit) && state.pits[pit] > 0);
  const starving = range(12).filter((pit) => !owns(side, pit)).every((pit) => state.pits[pit] === 0);
  if (!starving) return mine;
  return mine.filter((pit) => {
    const { pits } = sow(state.pits, pit);
    return range(12).some((at) => !owns(side, at) && pits[at] > 0);
  });
}

function owareCapture(state: Oware, pit: number) {
  const side = state.turn;
  const { pits, last } = sow(state.pits, pit);
  const taken = [...pits];
  let gain = 0;
  let at = last;
  while (!owns(side, at) && (taken[at] === 2 || taken[at] === 3)) {
    gain += taken[at];
    taken[at] = 0;
    at = (at + 11) % 12;
  }
  const left = range(12).filter((spot) => !owns(side, spot)).reduce((sum, spot) => sum + taken[spot], 0);
  if (gain > 0 && left === 0) return { pits, gain: 0 };
  return { pits: taken, gain };
}

function owareMove(state: Oware, pit: number): Oware | null {
  if (!owareMoves(state).includes(pit)) return null;
  const side = state.turn;
  const { pits, gain } = owareCapture(state, pit);
  const store: [number, number] = [state.store[0], state.store[1]];
  store[side] += gain;
  const quiet = gain > 0 ? 0 : (state.quiet ?? 0) + 1;
  let next: Oware = { kind: "oware", pits, store, turn: other(side), winner: null, last: pit, quiet };
  if (store[0] > 24) next.winner = 0;
  else if (store[1] > 24) next.winner = 1;
  else if (store[0] === 24 && store[1] === 24) next.winner = "draw";
  else if (!owareMoves(next).length || quiet >= 60) {
    const final: [number, number] = [store[0] + range(6).reduce((sum, at) => sum + pits[at], 0), store[1] + range(6).reduce((sum, at) => sum + pits[at + 6], 0)];
    next = { ...next, pits: Array(12).fill(0), store: final, winner: final[0] === final[1] ? "draw" : final[0] > final[1] ? 0 : 1 };
  }
  return next;
}

const pieceSide = (value: number): Side | -1 => (value === 1 || value === 2 ? 0 : value === 3 || value === 4 ? 1 : -1);
const isKing = (value: number) => value === 2 || value === 4;

function directions(value: number) {
  if (isKing(value)) return [[-1, -1], [-1, 1], [1, -1], [1, 1]];
  return pieceSide(value) === 0 ? [[-1, -1], [-1, 1]] : [[1, -1], [1, 1]];
}

function jumpsFrom(board: number[], from: number) {
  const value = board[from];
  const side = pieceSide(value);
  const row = Math.floor(from / 8);
  const col = from % 8;
  const out: { from: number; to: number; over: number }[] = [];
  for (const [dr, dc] of directions(value)) {
    const midRow = row + dr;
    const midCol = col + dc;
    const toRow = row + dr * 2;
    const toCol = col + dc * 2;
    if (toRow < 0 || toRow > 7 || toCol < 0 || toCol > 7) continue;
    const over = midRow * 8 + midCol;
    const to = toRow * 8 + toCol;
    const victim = pieceSide(board[over]);
    if (victim !== -1 && victim !== side && board[to] === 0) out.push({ from, to, over });
  }
  return out;
}

function stepsFrom(board: number[], from: number) {
  const row = Math.floor(from / 8);
  const col = from % 8;
  const out: { from: number; to: number }[] = [];
  for (const [dr, dc] of directions(board[from])) {
    const toRow = row + dr;
    const toCol = col + dc;
    if (toRow < 0 || toRow > 7 || toCol < 0 || toCol > 7) continue;
    const to = toRow * 8 + toCol;
    if (board[to] === 0) out.push({ from, to });
  }
  return out;
}

export function draughtsMoves(state: Draughts) {
  if (state.winner !== null) return [];
  if (state.chain !== null) return jumpsFrom(state.board, state.chain);
  const mine = range(64).filter((at) => pieceSide(state.board[at]) === state.turn);
  const jumps = mine.flatMap((at) => jumpsFrom(state.board, at));
  if (jumps.length) return jumps;
  return mine.flatMap((at) => stepsFrom(state.board, at));
}

function draughtsMove(state: Draughts, from: number, to: number): Draughts | null {
  const move = draughtsMoves(state).find((item) => item.from === from && item.to === to);
  if (!move) return null;
  const board = [...state.board];
  const value = board[from];
  board[from] = 0;
  board[to] = value;
  const jumped = "over" in move;
  if (jumped) board[(move as { over: number }).over] = 0;
  const row = Math.floor(to / 8);
  const crowned = (value === 1 && row === 0) || (value === 3 && row === 7);
  if (crowned) board[to] = value + 1;
  const quiet = jumped ? 0 : state.quiet + 1;
  if (jumped && !crowned && jumpsFrom(board, to).length) return { kind: "draughts", board, turn: state.turn, chain: to, winner: null, quiet, last: [from, to] };
  const next: Draughts = { kind: "draughts", board, turn: other(state.turn), chain: null, winner: null, quiet, last: [from, to] };
  if (!draughtsMoves(next).length) next.winner = state.turn;
  else if (quiet >= 80) next.winner = "draw";
  return next;
}

export const LUDO_START: [number, number] = [0, 26];
export const LUDO_SAFE = new Set([0, 8, 13, 21, 26, 34, 39, 47]);
export const LUDO_HOME = 56;

export function ludoSquare(side: Side, pos: number) {
  return pos >= 0 && pos <= 50 ? (pos + LUDO_START[side]) % 52 : null;
}

export function ludoMoves(state: Ludo) {
  if (state.winner !== null || state.dice === null) return [];
  const dice = state.dice;
  return state.tokens[state.turn]
    .map((pos, token) => ({ pos, token }))
    .filter(({ pos }) => (pos === -1 ? dice === 6 : pos !== LUDO_HOME && pos + dice <= LUDO_HOME))
    .map(({ token }) => token);
}

function ludoRoll(state: Ludo, roll: number): Ludo | null {
  if (state.winner !== null || state.dice !== null || roll < 1 || roll > 6) return null;
  const rolled: Ludo = { ...state, dice: roll, note: undefined };
  if (ludoMoves(rolled).length) return rolled;
  return { ...state, dice: null, turn: other(state.turn), note: `Rolled ${roll}. No move.` };
}

function ludoMove(state: Ludo, token: number): Ludo | null {
  if (!ludoMoves(state).includes(token) || state.dice === null) return null;
  const side = state.turn;
  const tokens: [number[], number[]] = [[...state.tokens[0]], [...state.tokens[1]]];
  const from = tokens[side][token];
  const to = from === -1 ? 0 : from + state.dice;
  tokens[side][token] = to;
  let captured = false;
  const square = ludoSquare(side, to);
  if (square !== null && !LUDO_SAFE.has(square)) {
    const foe = other(side);
    tokens[foe] = tokens[foe].map((pos) => {
      if (ludoSquare(foe, pos) === square) {
        captured = true;
        return -1;
      }
      return pos;
    });
  }
  const winner: Result = tokens[side].every((pos) => pos === LUDO_HOME) ? side : null;
  const again = !winner && (state.dice === 6 || captured || to === LUDO_HOME);
  return { kind: "ludo", tokens, turn: again ? side : other(side), dice: null, winner, note: captured ? "Captured! Back to the yard." : again ? "Go again." : undefined };
}

export function legalCount(board: Board) {
  if (board.kind === "oware") return owareMoves(board).length;
  if (board.kind === "draughts") return draughtsMoves(board).length;
  return board.dice === null ? 1 : ludoMoves(board).length;
}

export function applyMove(board: Board, move: Move): Board | null {
  if (board.winner !== null) return null;
  if (board.kind === "oware") return typeof move.pit === "number" ? owareMove(board, move.pit) : null;
  if (board.kind === "draughts") return typeof move.from === "number" && typeof move.to === "number" ? draughtsMove(board, move.from, move.to) : null;
  if (typeof move.roll === "number") return ludoRoll(board, move.roll);
  return typeof move.token === "number" ? ludoMove(board, move.token) : null;
}

export function rollDie() {
  return 1 + Math.floor(Math.random() * 6);
}

function pick<T>(items: T[], score: (item: T) => number) {
  let best: T[] = [];
  let top = -Infinity;
  for (const item of items) {
    const value = score(item);
    if (value > top) {
      top = value;
      best = [item];
    } else if (value === top) best.push(item);
  }
  return best[Math.floor(Math.random() * best.length)];
}

function material(board: number[], side: Side) {
  return board.reduce((sum, value) => sum + (pieceSide(value) === side ? (isKing(value) ? 3 : 2) : pieceSide(value) === other(side) ? -(isKing(value) ? 3 : 2) : 0), 0);
}

export function aiMove(board: Board): Board | null {
  if (board.winner !== null) return null;
  if (board.kind === "oware") {
    const moves = owareMoves(board);
    if (!moves.length) return null;
    const pit = pick(moves, (choice) => {
      const after = owareMove(board, choice);
      if (!after) return -99;
      if (after.winner === board.turn) return 99;
      const gain = after.store[board.turn] - board.store[board.turn];
      const reply = owareMoves(after).reduce((worst, answer) => {
        const next = owareMove(after, answer);
        return Math.max(worst, next ? next.store[after.turn] - after.store[after.turn] : 0);
      }, 0);
      return gain * 2 - reply * 2 + Math.random() * 0.5;
    });
    return owareMove(board, pit);
  }
  if (board.kind === "draughts") {
    const moves = draughtsMoves(board);
    if (!moves.length) return null;
    const move = pick(moves, (choice) => {
      const after = draughtsMove(board, choice.from, choice.to);
      if (!after) return -99;
      if (after.winner === board.turn) return 99;
      let score = material(after.board, board.turn) * 3;
      if (after.turn !== board.turn) {
        const threats = draughtsMoves(after).filter((item) => "over" in item).length;
        score -= threats * 4;
      } else score += 3;
      const row = Math.floor(choice.to / 8);
      score += board.turn === 1 ? row * 0.2 : (7 - row) * 0.2;
      return score + Math.random() * 0.3;
    });
    return draughtsMove(board, move.from, move.to);
  }
  if (board.dice === null) return ludoRoll(board, rollDie());
  const moves = ludoMoves(board);
  if (!moves.length) return null;
  const side = board.turn;
  const foe = other(side);
  const token = pick(moves, (choice) => {
    const from = board.tokens[side][choice];
    const to = from === -1 ? 0 : from + (board.dice ?? 0);
    const square = ludoSquare(side, to);
    let score = to;
    if (to === LUDO_HOME) score += 100;
    if (from === -1) score += 40;
    if (square !== null && !LUDO_SAFE.has(square) && board.tokens[foe].some((pos) => ludoSquare(foe, pos) === square)) score += 60;
    if (square !== null && LUDO_SAFE.has(square)) score += 8;
    if (square !== null && !LUDO_SAFE.has(square)) {
      const danger = board.tokens[foe].some((pos) => {
        const at = ludoSquare(foe, pos);
        if (at === null) return false;
        const gap = (square - at + 52) % 52;
        return gap >= 1 && gap <= 6;
      });
      if (danger) score -= 20;
    }
    return score + Math.random();
  });
  return ludoMove(board, token);
}
