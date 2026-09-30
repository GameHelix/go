import { describe, expect, it } from "vitest";
import {
  attemptMove,
  boardFromString,
  boardsEqual,
  groupAt,
  idx,
  isLegalMove,
  libertyCount,
  newGame,
  playMove,
  playPass,
  undo,
} from "../src/lib/game/rules";
import type { BoardSize, GameState } from "../src/lib/game/types";

describe("groups and liberties", () => {
  it("counts liberties of a lone stone by position", () => {
    const { board, size } = boardFromString([
      ".....",
      ".....",
      "..X..",
      ".....",
      ".....",
    ]);
    // Centre stone breathes on all four sides.
    expect(libertyCount(board, size, idx(size, 2, 2))).toBe(4);
  });

  it("counts liberties of a corner stone", () => {
    const { board, size } = boardFromString([
      "X....",
      ".....",
      ".....",
      ".....",
      ".....",
    ]);
    expect(libertyCount(board, size, 0)).toBe(2);
  });

  it("treats a connected chain as one group with shared liberties", () => {
    const { board, size } = boardFromString([
      ".....",
      ".XX..",
      ".....",
      ".....",
      ".....",
    ]);
    const g = groupAt(board, size, idx(size, 1, 1));
    expect(g.stones.sort((a, b) => a - b)).toEqual([idx(size, 1, 1), idx(size, 1, 2)]);
    // Two horizontally adjacent stones share six liberties.
    expect(g.liberties.length).toBe(6);
  });
});

describe("captures", () => {
  it("captures a single surrounded stone when its last liberty is filled", () => {
    const { board, size } = boardFromString([
      ".....",
      "..X..",
      ".XO..",
      "..X..",
      ".....",
    ]);
    const res = attemptMove(board, size, "black", idx(size, 2, 3), null);
    expect(res).not.toBeNull();
    expect(res?.captured).toBe(1);
    // The white stone is gone.
    expect(res?.board[idx(size, 2, 2)]).toBeNull();
  });

  it("captures two separate groups with a single move", () => {
    // Both white stones are in atari sharing only the corner as a liberty.
    const { board, size } = boardFromString([
      ".OX..",
      "OX...",
      "X....",
      ".....",
      ".....",
    ]);
    const res = attemptMove(board, size, "black", 0, null);
    expect(res).not.toBeNull();
    expect(res?.captured).toBe(2);
    expect(res?.board[idx(size, 0, 1)]).toBeNull();
    expect(res?.board[idx(size, 1, 0)]).toBeNull();
  });

  it("allows an otherwise-suicidal move that captures (the capture happens first)", () => {
    const { board, size } = boardFromString([
      ".OX..",
      "OX...",
      "X....",
      ".....",
      ".....",
    ]);
    // Playing into the corner would have no liberties, but it captures two
    // stones, so it is legal.
    const res = attemptMove(board, size, "black", 0, null);
    expect(res).not.toBeNull();
    expect(res?.board[0]).toBe("black");
  });
});

describe("suicide", () => {
  it("forbids filling the last liberty of your own would-be group", () => {
    const { board, size } = boardFromString([
      ".X.",
      "X.X",
      ".X.",
    ]);
    // White plays the surrounded centre: no capture, no liberties → illegal.
    const res = attemptMove(board, size, "white", idx(size, 1, 1), null);
    expect(res).toBeNull();
  });
});

describe("simple ko", () => {
  // Textbook ko: Black captures one stone; White may not immediately recapture.
  const koRows = [
    ".........",
    "..XO.....",
    ".XO.O....",
    "..XO.....",
    ".........",
    ".........",
    ".........",
    ".........",
    ".........",
  ];
  const CAPTURE = idx(9, 2, 3); // Black plays here to capture the white stone
  const RECAPTURE = idx(9, 2, 2); // the point White would love to take straight back

  it("rejects a recapture that recreates the previous whole-board position", () => {
    const { board, size } = boardFromString(koRows);
    const capture = attemptMove(board, size, "black", CAPTURE, null);
    expect(capture).not.toBeNull();
    expect(capture?.captured).toBe(1);

    const afterCapture = capture!.board;
    // With the ko guard (the position before Black's capture) the recapture is illegal…
    expect(attemptMove(afterCapture, size, "white", RECAPTURE, board)).toBeNull();
    // …but without a ko guard it is a legal move that restores the old position.
    const noGuard = attemptMove(afterCapture, size, "white", RECAPTURE, null);
    expect(noGuard).not.toBeNull();
    expect(boardsEqual(noGuard!.board, board)).toBe(true);
    // Playing anywhere else is fine even under the ko.
    expect(attemptMove(afterCapture, size, "white", 0, board)).not.toBeNull();
  });

  it("wires the ko guard through playMove via previousBoard", () => {
    const { board } = boardFromString(koRows);
    const state: GameState = {
      ...newGame(9 as BoardSize, 0),
      board,
    };
    const captured = playMove(state, CAPTURE);
    expect(captured).not.toBeNull();
    const s2 = captured!.state;
    expect(s2.previousBoard).toEqual(board); // the pre-move position is remembered
    expect(s2.toMove).toBe("white");
    expect(isLegalMove(s2, RECAPTURE)).toBe(false); // ko forbids the recapture
    expect(playMove(s2, RECAPTURE)).toBeNull();
  });
});

describe("passing, ending and undo", () => {
  it("ends the game after two consecutive passes", () => {
    let s = newGame(9, 7.5);
    s = playPass(s);
    expect(s.over).toBe(false);
    s = playPass(s);
    expect(s.over).toBe(true);
    expect(s.endReason).toBe("passes");
  });

  it("replays history to take back the last move exactly", () => {
    const start = newGame(9, 7.5);
    const a = playMove(start, idx(9, 2, 2));
    const b = playMove(a!.state, idx(9, 4, 4));
    const back = undo(b!.state);
    expect(boardsEqual(back.board, a!.state.board)).toBe(true);
    expect(back.toMove).toBe(a!.state.toMove);
    expect(back.history.length).toBe(1);
  });

  it("occupied points are never legal", () => {
    const start = newGame(9, 7.5);
    const a = playMove(start, idx(9, 2, 2))!.state;
    expect(isLegalMove(a, idx(9, 2, 2))).toBe(false);
  });
});
