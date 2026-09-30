import type { BoardSize, Difficulty } from "./types";

/** Board sizes offered in the menu; 9×9 is the default. */
export const BOARD_SIZES: readonly BoardSize[] = [9, 13, 19];
export const DEFAULT_SIZE: BoardSize = 9;

/**
 * Komi — compensation points added to White's area for moving second.
 * 7.5 is the modern default for Chinese area scoring; the extra half point
 * makes draws impossible.
 */
export const DEFAULT_KOMI = 7.5;
export const KOMI_CHOICES: readonly number[] = [0, 0.5, 5.5, 6.5, 7.5];

export const DIFFICULTIES: readonly Difficulty[] = ["easy", "medium", "hard"];

/**
 * Hoshi (star point) coordinates as `[row, col]` for each board size. These are
 * drawn as small dots and are the customary handicap points.
 */
export const STAR_POINTS: Record<BoardSize, readonly (readonly [number, number])[]> = {
  9: [
    [2, 2], [2, 6], [6, 2], [6, 6], [4, 4],
  ],
  13: [
    [3, 3], [3, 9], [9, 3], [9, 9], [6, 6],
  ],
  19: [
    [3, 3], [3, 9], [3, 15],
    [9, 3], [9, 9], [9, 15],
    [15, 3], [15, 9], [15, 15],
  ],
};
