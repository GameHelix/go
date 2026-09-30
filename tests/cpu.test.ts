import { describe, expect, it } from "vitest";
import { chooseMove, isEye } from "../src/lib/game/cpu";
import { makeRng } from "../src/lib/game/rng";
import { boardFromString, idx, isLegalMove, newGame, playMove, playPass } from "../src/lib/game/rules";
import type { BoardSize, Color, Difficulty, GameState } from "../src/lib/game/types";

function makeState(rows: readonly string[], toMove: Color): GameState {
  const { board } = boardFromString(rows);
  return { ...newGame(rows.length as BoardSize, 7.5), board, toMove };
}

const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];

describe("legality", () => {
  it("only ever returns a legal move or a pass", () => {
    const state = newGame(9, 7.5);
    for (const d of DIFFICULTIES) {
      for (let seed = 1; seed <= 20; seed++) {
        const v = chooseMove(state, d, makeRng(seed));
        if (v !== null) expect(isLegalMove(state, v)).toBe(true);
      }
    }
  });

  it("stays legal across a whole self-played game and terminates", () => {
    let state = newGame(9, 0);
    let plies = 0;
    const maxPlies = 800;
    while (!state.over && plies < maxPlies) {
      const v = chooseMove(state, "medium", makeRng(1000 + plies));
      if (v === null) {
        state = playPass(state);
      } else {
        const r = playMove(state, v);
        expect(r).not.toBeNull(); // the computer never hands back an illegal move
        state = r!.state;
      }
      plies += 1;
    }
    expect(state.over).toBe(true);
  });
});

describe("tactics", () => {
  const captureBoard = [
    ".........",
    ".........",
    ".........",
    "....X....",
    "...XO....",
    "....X....",
    ".........",
    ".........",
    ".........",
  ];
  const CAPTURE = idx(9, 4, 5); // Black fills White's last liberty here

  it("takes an available capture", () => {
    const state = makeState(captureBoard, "black");
    for (const d of ["medium", "hard"] as Difficulty[]) {
      for (let seed = 1; seed <= 6; seed++) {
        expect(chooseMove(state, d, makeRng(seed))).toBe(CAPTURE);
      }
    }
  });

  it("returns only legal moves from a tactical position", () => {
    const state = makeState(captureBoard, "black");
    for (const d of DIFFICULTIES) {
      for (let seed = 1; seed <= 10; seed++) {
        const v = chooseMove(state, d, makeRng(seed));
        if (v !== null) expect(isLegalMove(state, v)).toBe(true);
      }
    }
  });
});

describe("eyes", () => {
  const eyeBoard = [
    "XXX......",
    "X.X......",
    "XXX......",
    ".........",
    ".........",
    ".........",
    ".........",
    ".........",
    ".........",
  ];
  const EYE = idx(9, 1, 1);

  it("recognises a real eye", () => {
    const { board, size } = boardFromString(eyeBoard);
    expect(isEye(board, size, EYE, "black")).toBe(true);
  });

  it("never fills its own eye", () => {
    const state = makeState(eyeBoard, "black");
    for (const d of DIFFICULTIES) {
      for (let seed = 1; seed <= 12; seed++) {
        expect(chooseMove(state, d, makeRng(seed))).not.toBe(EYE);
      }
    }
  });
});
