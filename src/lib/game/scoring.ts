import { neighbors } from "./rules";
import type { Board, Color } from "./types";

/**
 * Chinese AREA scoring.
 *
 * A player's score is the number of their stones on the board plus the empty
 * points they alone surround (their territory), and White additionally receives
 * `komi`. Territory is found by flood-filling each connected empty region and
 * asking which stone colours touch it: a region touching only one colour is
 * that colour's territory, and a region touching both (or neither) is neutral
 * ("dame") and counts for no one.
 *
 * Dead stones are not detected automatically — solving that is a hard problem.
 * Instead the UI lets players mark obviously dead chains before the final count;
 * `dead` lists those points. A dead stone is treated as removed, so it stops
 * counting for its owner and the empty point it leaves is scored as territory,
 * which is exactly how a settled Go position is counted by hand.
 */

export type Owner = Color | "neutral";

export interface Territory {
  /** Per intersection: a stone is `null`, an empty point carries its owner. */
  readonly owners: (Owner | null)[];
  readonly blackTerritory: number;
  readonly whiteTerritory: number;
  readonly neutral: number;
}

export interface ScoreResult {
  readonly territory: Territory;
  readonly blackStones: number;
  readonly whiteStones: number;
  readonly blackScore: number;
  readonly whiteScore: number;
  readonly komi: number;
  readonly winner: Color | "draw";
  /** Absolute point difference between the two scores. */
  readonly margin: number;
}

export function computeTerritory(
  board: Board,
  size: number,
  dead?: ReadonlySet<number>,
): Territory {
  // Treat marked-dead stones as empty for the purpose of the flood fill.
  const eff = board.slice();
  if (dead) {
    for (const d of dead) eff[d] = null;
  }

  const owners: (Owner | null)[] = new Array<Owner | null>(board.length).fill(null);
  const seen = new Uint8Array(board.length);
  let blackTerritory = 0;
  let whiteTerritory = 0;
  let neutral = 0;

  for (let i = 0; i < eff.length; i++) {
    if (eff[i] !== null || seen[i] === 1) continue;

    // Flood one empty region, noting which colours border it.
    const region: number[] = [];
    const stack = [i];
    seen[i] = 1;
    let touchesBlack = false;
    let touchesWhite = false;

    while (stack.length > 0) {
      const cur = stack.pop() as number;
      region.push(cur);
      for (const n of neighbors(size, cur)) {
        const v = eff[n];
        if (v === null) {
          if (seen[n] === 0) {
            seen[n] = 1;
            stack.push(n);
          }
        } else if (v === "black") {
          touchesBlack = true;
        } else {
          touchesWhite = true;
        }
      }
    }

    let owner: Owner;
    if (touchesBlack && !touchesWhite) {
      owner = "black";
      blackTerritory += region.length;
    } else if (touchesWhite && !touchesBlack) {
      owner = "white";
      whiteTerritory += region.length;
    } else {
      owner = "neutral";
      neutral += region.length;
    }
    for (const p of region) owners[p] = owner;
  }

  return { owners, blackTerritory, whiteTerritory, neutral };
}

export function scoreGame(
  board: Board,
  size: number,
  komi: number,
  dead?: ReadonlySet<number>,
): ScoreResult {
  const territory = computeTerritory(board, size, dead);

  let blackStones = 0;
  let whiteStones = 0;
  for (let i = 0; i < board.length; i++) {
    if (dead && dead.has(i)) continue; // removed from the count
    if (board[i] === "black") blackStones++;
    else if (board[i] === "white") whiteStones++;
  }

  const blackScore = blackStones + territory.blackTerritory;
  const whiteScore = whiteStones + territory.whiteTerritory + komi;
  const margin = Math.abs(blackScore - whiteScore);
  const winner: Color | "draw" =
    blackScore > whiteScore ? "black" : whiteScore > blackScore ? "white" : "draw";

  return { territory, blackStones, whiteStones, blackScore, whiteScore, komi, winner, margin };
}
