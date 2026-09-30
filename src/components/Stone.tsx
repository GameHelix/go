import type { Color } from "@/lib/game/types";

interface StoneProps {
  color: Color;
  /** Marks the most recently played stone. */
  last?: boolean;
  /** The stone's chain is in atari (one liberty). */
  atari?: boolean;
  /** A translucent hover/keyboard preview rather than a real stone. */
  preview?: boolean;
  /** Marked dead during scoring. */
  dead?: boolean;
}

/**
 * A single glowing goban stone. Black stones read as dark discs rimmed in cyan;
 * white stones glow violet — both sit on the neon board without any wood.
 */
export function Stone({ color, last, atari, preview, dead }: StoneProps) {
  const classes = ["stone", `stone-${color}`];
  if (last) classes.push("stone-last");
  if (atari) classes.push("stone-atari");
  if (preview) classes.push("stone-preview");
  if (dead) classes.push("stone-dead");
  return <span className={classes.join(" ")} aria-hidden />;
}
