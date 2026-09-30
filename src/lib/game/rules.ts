import { DEFAULT_KOMI } from "./constants";
import type { Board, BoardSize, Cell, Color, GameState, Move } from "./types";

/* ------------------------------------------------------------------ helpers */

export function opponent(color: Color): Color {
  return color === "black" ? "white" : "black";
}

export function idx(size: number, row: number, col: number): number {
  return row * size + col;
}

export function rowOf(size: number, i: number): number {
  return Math.floor(i / size);
}

export function colOf(size: number, i: number): number {
  return i % size;
}

/** The orthogonal neighbours of intersection `i` (the points that share a line). */
export function neighbors(size: number, i: number): number[] {
  const r = Math.floor(i / size);
  const c = i % size;
  const out: number[] = [];
  if (r > 0) out.push(i - size);
  if (r < size - 1) out.push(i + size);
  if (c > 0) out.push(i - 1);
  if (c < size - 1) out.push(i + 1);
  return out;
}

/** The diagonal neighbours of intersection `i` — used for eye detection. */
export function diagonals(size: number, i: number): number[] {
  const r = Math.floor(i / size);
  const c = i % size;
  const out: number[] = [];
  if (r > 0 && c > 0) out.push(i - size - 1);
  if (r > 0 && c < size - 1) out.push(i - size + 1);
  if (r < size - 1 && c > 0) out.push(i + size - 1);
  if (r < size - 1 && c < size - 1) out.push(i + size + 1);
  return out;
}

export function emptyBoard(size: number): Board {
  return new Array<Cell>(size * size).fill(null);
}

export function createBoard(size: BoardSize): Board {
  return emptyBoard(size);
}

export function boardsEqual(a: Board, b: Board): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

/* --------------------------------------------------------- groups & liberties */

export interface Group {
  /** Every stone in the connected same-colour chain. */
  readonly stones: number[];
  /** The distinct empty points adjacent to the chain. */
  readonly liberties: number[];
}

/**
 * Flood-fill the maximal chain of like-coloured stones that contains `start`,
 * collecting its liberties along the way. Returns empty arrays if `start` is an
 * empty point.
 */
export function groupAt(board: Board, size: number, start: number): Group {
  const color = board[start];
  if (color === null) return { stones: [], liberties: [] };

  const stones: number[] = [];
  const liberties = new Set<number>();
  const seen = new Uint8Array(board.length);
  const stack = [start];
  seen[start] = 1;

  while (stack.length > 0) {
    const cur = stack.pop() as number;
    stones.push(cur);
    for (const n of neighbors(size, cur)) {
      const v = board[n];
      if (v === null) {
        liberties.add(n);
      } else if (v === color && seen[n] === 0) {
        seen[n] = 1;
        stack.push(n);
      }
    }
  }

  return { stones, liberties: [...liberties] };
}

export function libertyCount(board: Board, size: number, start: number): number {
  return groupAt(board, size, start).liberties.length;
}

/** Every stone belonging to a chain with exactly one liberty (i.e. in atari). */
export function atariStones(board: Board, size: number): Set<number> {
  const out = new Set<number>();
  const seen = new Uint8Array(board.length);
  for (let i = 0; i < board.length; i++) {
    if (board[i] === null || seen[i] === 1) continue;
    const g = groupAt(board, size, i);
    for (const s of g.stones) seen[s] = 1;
    if (g.liberties.length === 1) {
      for (const s of g.stones) out.add(s);
    }
  }
  return out;
}

/* ---------------------------------------------------------------- move engine */

export interface MoveResult {
  readonly board: Board;
  readonly captured: number;
}

/**
 * Attempt to play `color` at `vertex` on `board`, following the full rules:
 *
 *  1. the point must be empty;
 *  2. any adjacent enemy chain left with no liberties is captured and removed;
 *  3. the move is illegal (suicide) if the played chain then has no liberties;
 *  4. the move is illegal (simple ko) if it recreates `koBoard` — the
 *     whole-board position from immediately before the previous move.
 *
 * Returns the resulting board and the number of captured stones, or `null` if
 * the move is illegal. Pass `koBoard = null` to disable the ko check.
 */
export function attemptMove(
  board: Board,
  size: number,
  color: Color,
  vertex: number,
  koBoard: Board | null,
): MoveResult | null {
  if (board[vertex] !== null) return null; // occupied

  const next = board.slice();
  next[vertex] = color;
  const enemy = opponent(color);

  // Remove any neighbouring enemy chain that this stone just deprived of its
  // last liberty.
  let captured = 0;
  for (const n of neighbors(size, vertex)) {
    if (next[n] === enemy) {
      const g = groupAt(next, size, n);
      if (g.liberties.length === 0) {
        for (const s of g.stones) next[s] = null;
        captured += g.stones.length;
      }
    }
  }

  // Suicide is illegal: after resolving captures the played chain must breathe.
  if (libertyCount(next, size, vertex) === 0) return null;

  // Simple ko: a capturing move may not restore the previous whole-board
  // position. Only capturing moves can, so the check is skipped otherwise.
  if (koBoard !== null && captured > 0 && boardsEqual(next, koBoard)) return null;

  return { board: next, captured };
}

/** Would playing `vertex` be legal for the side to move? */
export function isLegalMove(state: GameState, vertex: number): boolean {
  if (state.over) return false;
  return attemptMove(state.board, state.size, state.toMove, vertex, state.previousBoard) !== null;
}

/**
 * The single point (if any) that the simple-ko rule forbids to the opponent
 * after this move. This is purely for display; legality is always enforced by
 * the whole-board comparison in {@link attemptMove}. A ko exists in the classic
 * shape: exactly one stone was captured and the played stone stands alone with
 * a single liberty.
 */
function computeKoPoint(board: Board, size: number, vertex: number, captured: number): number | null {
  if (captured !== 1) return null;
  const g = groupAt(board, size, vertex);
  if (g.stones.length === 1 && g.liberties.length === 1) return g.liberties[0];
  return null;
}

/* -------------------------------------------------------------- game actions */

export function newGame(size: BoardSize, komi: number = DEFAULT_KOMI): GameState {
  return {
    size,
    komi,
    board: createBoard(size),
    toMove: "black",
    previousBoard: null,
    captures: { black: 0, white: 0 },
    history: [],
    passes: 0,
    koPoint: null,
    over: false,
    endReason: null,
    resignedBy: null,
  };
}

/** Extra facts about a move that the UI uses to pick a sound and flash. */
export interface PlayResult {
  readonly state: GameState;
  readonly captured: number;
  /** The played chain ended with a single liberty (self-atari). */
  readonly selfAtari: boolean;
  /** The move captured one or more enemy stones. */
  readonly capturesOpp: boolean;
  /** The move puts an enemy chain into atari. */
  readonly givesAtari: boolean;
}

/** Play a stone. Returns `null` if the move is illegal. */
export function playMove(state: GameState, vertex: number): PlayResult | null {
  if (state.over) return null;
  const res = attemptMove(state.board, state.size, state.toMove, vertex, state.previousBoard);
  if (res === null) return null;

  const mover = state.toMove;
  const enemy = opponent(mover);
  const captures = {
    black: state.captures.black + (mover === "black" ? res.captured : 0),
    white: state.captures.white + (mover === "white" ? res.captured : 0),
  };
  const move: Move = { color: mover, vertex, captured: res.captured };

  const selfAtari = libertyCount(res.board, state.size, vertex) === 1 && res.captured === 0;
  let givesAtari = false;
  for (const n of neighbors(state.size, vertex)) {
    if (res.board[n] === enemy && libertyCount(res.board, state.size, n) === 1) {
      givesAtari = true;
      break;
    }
  }

  const next: GameState = {
    ...state,
    board: res.board,
    toMove: enemy,
    previousBoard: state.board,
    captures,
    history: [...state.history, move],
    passes: 0,
    koPoint: computeKoPoint(res.board, state.size, vertex, res.captured),
    over: false,
    endReason: null,
  };

  return { state: next, captured: res.captured, selfAtari, capturesOpp: res.captured > 0, givesAtari };
}

/** Pass. Two passes in a row end the game. */
export function playPass(state: GameState): GameState {
  if (state.over) return state;
  const passes = state.passes + 1;
  const over = passes >= 2;
  const move: Move = { color: state.toMove, vertex: null, captured: 0 };
  return {
    ...state,
    toMove: opponent(state.toMove),
    // A pass places nothing, so nothing can be recreated: ko is cleared.
    previousBoard: state.board,
    history: [...state.history, move],
    passes,
    koPoint: null,
    over,
    endReason: over ? "passes" : null,
  };
}

export function resign(state: GameState, color: Color): GameState {
  return { ...state, over: true, endReason: "resign", resignedBy: color };
}

/**
 * Take back the last action. Resignation simply resumes play. Otherwise the
 * move list is replayed from the start, which reconstructs captures, ko state
 * and everything else exactly — the move list is the single source of truth.
 */
export function undo(state: GameState): GameState {
  if (state.endReason === "resign") {
    return { ...state, over: false, endReason: null, resignedBy: null };
  }
  if (state.history.length === 0) return state;

  const moves = state.history.slice(0, -1);
  let s = newGame(state.size, state.komi);
  for (const m of moves) {
    if (m.vertex === null) {
      s = playPass(s);
    } else {
      const r = playMove(s, m.vertex);
      if (r !== null) s = r.state; // recorded moves are always legal
    }
  }
  return s;
}

/* -------------------------------------------------------------- test helpers */

/**
 * Build a board from ASCII rows, handy for tests and debugging:
 * `.`/space = empty, `X`/`#`/`B` = black, `O`/`W` = white. The board is square,
 * sized from the number of rows.
 */
export function boardFromString(rows: readonly string[]): { size: number; board: Board } {
  const size = rows.length;
  const board = emptyBoard(size);
  for (let r = 0; r < size; r++) {
    const line = rows[r];
    for (let c = 0; c < size; c++) {
      const ch = line[c] ?? ".";
      if (ch === "X" || ch === "#" || ch === "B") board[idx(size, r, c)] = "black";
      else if (ch === "O" || ch === "W") board[idx(size, r, c)] = "white";
    }
  }
  return { size, board };
}
