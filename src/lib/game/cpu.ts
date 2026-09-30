import {
  attemptMove,
  colOf,
  diagonals,
  groupAt,
  libertyCount,
  neighbors,
  opponent,
  rowOf,
} from "./rules";
import type { MoveResult } from "./rules";
import type { Rng } from "./rng";
import type { Board, Color, Difficulty, GameState } from "./types";

/**
 * A light, capture-aware heuristic opponent — a fun casual player, not a strong
 * engine. It only ever returns a legal move (or a pass), and it will:
 *
 *   • take captures, and put enemy chains in atari;
 *   • rescue its own chains that are in atari and extend their liberties;
 *   • avoid self-atari and never fill its own real eyes;
 *   • otherwise favour sound shape — the 3rd/4th lines, contact with its stones.
 *
 * Difficulty only changes how much randomness is mixed in and whether a shallow
 * one-ply capture check is run, so every tier obeys the rules above.
 */

/**
 * Is `vertex` a real eye for `color` — a point we must not fill? All four
 * orthogonal neighbours must be our stones; on the board's interior at most one
 * diagonal may be missing, and on an edge or in a corner none may be.
 */
export function isEye(board: Board, size: number, vertex: number, color: Color): boolean {
  if (board[vertex] !== null) return false;
  for (const n of neighbors(size, vertex)) {
    if (board[n] !== color) return false;
  }
  const diag = diagonals(size, vertex);
  const onEdge = diag.length < 4;
  let notOurs = 0;
  for (const d of diag) {
    if (board[d] !== color) notOurs++;
  }
  return onEdge ? notOurs === 0 : notOurs <= 1;
}

/** A small preference for good opening shape: the 3rd and 4th lines, not the 1st. */
function positionalBias(size: number, vertex: number): number {
  const r = rowOf(size, vertex);
  const c = colOf(size, vertex);
  const line = Math.min(r, size - 1 - r, c, size - 1 - c);
  if (line === 0) return -6; // first line — poor early
  if (line === 1) return -1;
  if (line === 2) return 4; // third line — territory
  if (line === 3) return 3; // fourth line — influence
  return 1;
}

/** Score a legal move for `color`. `res.board` is the position after the move. */
function evaluateMove(state: GameState, vertex: number, color: Color, res: MoveResult): number {
  const size = state.size;
  const board = res.board;
  const enemy = opponent(color);
  let score = 0;

  // Captures dominate.
  score += res.captured * 12;

  // A safer resulting chain (more liberties) is better; a self-atari that
  // captures nothing is almost always a blunder.
  const myLibs = libertyCount(board, size, vertex);
  if (myLibs === 1 && res.captured === 0) score -= 9;
  else score += Math.min(myLibs, 6) * 1.2;

  // Rescue: extend a friendly chain that was in atari before this move.
  for (const n of neighbors(size, vertex)) {
    if (state.board[n] === color && libertyCount(state.board, size, n) === 1 && myLibs >= 2) {
      score += 7;
      break;
    }
  }

  // Pressure the enemy: reward taking a chain to one liberty (atari) or two.
  const counted = new Set<number>();
  for (const n of neighbors(size, vertex)) {
    if (board[n] !== enemy || counted.has(n)) continue;
    const g = groupAt(board, size, n);
    for (const s of g.stones) counted.add(s);
    if (g.liberties.length === 1) score += 5 + g.stones.length * 1.5;
    else if (g.liberties.length === 2) score += 1.5;
  }

  // Shape and contact.
  score += positionalBias(size, vertex);
  let own = 0;
  let opp = 0;
  for (const n of neighbors(size, vertex)) {
    if (board[n] === color) own++;
    else if (board[n] === enemy) opp++;
  }
  score += own * 0.6 + opp * 0.4;

  return score;
}

/** The most stones the opponent could capture with a single legal reply. */
function bestOpponentCapture(board: Board, size: number, cpuColor: Color, koBoard: Board): number {
  const enemy = opponent(cpuColor);
  let best = 0;
  for (let v = 0; v < board.length; v++) {
    if (board[v] !== null) continue;
    const r = attemptMove(board, size, enemy, v, koBoard);
    if (r !== null && r.captured > best) best = r.captured;
  }
  return best;
}

interface Candidate {
  readonly vertex: number;
  score: number;
  readonly res: MoveResult;
}

/**
 * Choose a move for the side to move. Returns a vertex to play, or `null` to
 * pass. Responds in well under the required time budget on 9×9.
 */
export function chooseMove(state: GameState, difficulty: Difficulty, rng: Rng): number | null {
  if (state.over) return null;
  const size = state.size;
  const color = state.toMove;

  const candidates: Candidate[] = [];
  for (let v = 0; v < state.board.length; v++) {
    if (state.board[v] !== null) continue;
    if (isEye(state.board, size, v, color)) continue; // never fill our own eyes
    const res = attemptMove(state.board, size, color, v, state.previousBoard);
    if (res === null) continue; // occupied / suicide / ko
    candidates.push({ vertex: v, score: evaluateMove(state, v, color, res), res });
  }

  if (candidates.length === 0) return null; // only eyes or illegal points left → pass

  // More noise makes a weaker, more human opponent.
  const noise = difficulty === "easy" ? 6 : difficulty === "medium" ? 2.5 : 0.5;
  for (const c of candidates) c.score += rng() * noise;

  // Hard tier: a one-ply look at the best few moves, so it does not hand a chain
  // straight back to the opponent.
  if (difficulty === "hard") {
    candidates.sort((a, b) => b.score - a.score);
    for (const c of candidates.slice(0, 8)) {
      c.score -= bestOpponentCapture(c.res.board, size, color, state.board) * 8;
    }
  }

  candidates.sort((a, b) => b.score - a.score);
  const best = candidates[0];

  // If the opponent has just passed and nothing worthwhile remains, pass too so
  // the game can be scored instead of dragging on.
  if (state.passes >= 1 && best.score < 2) return null;

  return best.vertex;
}
