import { describe, expect, it } from "vitest";
import { boardFromString, emptyBoard, idx } from "../src/lib/game/rules";
import { computeTerritory, scoreGame } from "../src/lib/game/scoring";

describe("area scoring", () => {
  it("gives an empty board to nobody but the komi", () => {
    const board = emptyBoard(9);
    const s = scoreGame(board, 9, 7.5);
    expect(s.blackScore).toBe(0);
    expect(s.whiteScore).toBe(7.5);
    expect(s.territory.neutral).toBe(81); // touches no colour → dame
    expect(s.winner).toBe("white");
  });

  it("splits territory by which single colour surrounds it", () => {
    // Black wall on column 1, white wall on column 3. Column 0 is Black's,
    // column 2 is contested (touches both) and column 4 is White's.
    const { board, size } = boardFromString([
      ".X.O.",
      ".X.O.",
      ".X.O.",
      ".X.O.",
      ".X.O.",
    ]);
    const t = computeTerritory(board, size);
    expect(t.blackTerritory).toBe(5); // column 0
    expect(t.whiteTerritory).toBe(5); // column 4
    expect(t.neutral).toBe(5); // column 2 borders both walls

    const s = scoreGame(board, size, 0);
    // 5 stones + 5 territory each.
    expect(s.blackScore).toBe(10);
    expect(s.whiteScore).toBe(10);
    expect(s.winner).toBe("draw");
  });

  it("counts the point owner for a fully enclosed region", () => {
    const { board, size } = boardFromString([
      "XXXXX",
      "X...X",
      "X.O.X",
      "X...X",
      "XXXXX",
    ]);
    // The lone white stone means the interior touches both colours → neutral.
    const t = computeTerritory(board, size);
    expect(t.blackTerritory).toBe(0);
    expect(t.neutral).toBe(8);
  });

  it("removes marked-dead stones and awards the vacated area", () => {
    const { board, size } = boardFromString([
      "XXXXX",
      "X...X",
      "X.O.X",
      "X...X",
      "XXXXX",
    ]);
    const dead = new Set<number>([idx(size, 2, 2)]); // the dead white stone

    const t = computeTerritory(board, size, dead);
    expect(t.blackTerritory).toBe(9); // the whole 3×3 interior is now Black's

    const s = scoreGame(board, size, 0, dead);
    expect(s.blackStones).toBe(16); // border stones
    expect(s.whiteStones).toBe(0); // the dead stone no longer counts
    expect(s.blackScore).toBe(25);
    expect(s.whiteScore).toBe(0);
    expect(s.winner).toBe("black");
  });
});
