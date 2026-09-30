/**
 * Core value types for the game of Go. Everything here is framework-free so the
 * rules, scoring and move logic can be unit-tested without React in the loop.
 */

/** The two stone colours. Black always moves first. */
export type Color = "black" | "white";

/** An intersection is empty (`null`) or holds a stone of one colour. */
export type Cell = Color | null;

/** A whole board as a flat, row-major array: index = row * size + col. */
export type Board = Cell[];

/** Supported goban dimensions. */
export type BoardSize = 9 | 13 | 19;

/** Two humans sharing a device, or one human against the built-in computer. */
export type Mode = "local" | "cpu";

/** Computer opponent strength tiers. */
export type Difficulty = "easy" | "medium" | "hard";

/** A single played move. `vertex === null` records a pass. */
export interface Move {
  readonly color: Color;
  readonly vertex: number | null;
  /** Opponent stones captured by this move. */
  readonly captured: number;
}

/** How a finished game ended. */
export type EndReason = "passes" | "resign";

/**
 * The complete, immutable state of a game. Every rule function takes one of
 * these and returns a fresh one — nothing is mutated in place.
 */
export interface GameState {
  readonly size: BoardSize;
  readonly komi: number;
  readonly board: Board;
  readonly toMove: Color;
  /**
   * The whole-board position that existed immediately before the last move.
   * This is the simple-ko guard: a move may not recreate it. `null` before the
   * first move (and reset after a pass).
   */
  readonly previousBoard: Board | null;
  /** Stones captured *by* each colour over the whole game. */
  readonly captures: { readonly black: number; readonly white: number };
  readonly history: readonly Move[];
  /** Consecutive passes; two in a row ends the game. */
  readonly passes: number;
  /** Point currently forbidden by the simple-ko rule, for display only. */
  readonly koPoint: number | null;
  readonly over: boolean;
  readonly endReason: EndReason | null;
  /** Set only when a player resigns. */
  readonly resignedBy: Color | null;
}
