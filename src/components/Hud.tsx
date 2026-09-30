import type { Color, Difficulty, Mode } from "@/lib/game/types";

interface HudProps {
  toMove: Color;
  captures: { black: number; white: number };
  komi: number;
  moveNumber: number;
  mode: Mode;
  difficulty: Difficulty;
  over: boolean;
  /** Label for the white player (e.g. "CPU · hard"). */
  whiteLabel: string;
  blackLabel: string;
}

/**
 * Two player cards — the one to move glows — plus a shared status line with the
 * move number and komi.
 */
export function Hud({
  toMove,
  captures,
  komi,
  moveNumber,
  over,
  whiteLabel,
  blackLabel,
}: HudProps) {
  return (
    <div className="hud">
      <PlayerCard
        color="black"
        label={blackLabel}
        captured={captures.black}
        active={!over && toMove === "black"}
      />
      <div className="hud-status">
        <span className="hud-move">move {moveNumber}</span>
        <span className="hud-komi">komi {komi}</span>
      </div>
      <PlayerCard
        color="white"
        label={whiteLabel}
        captured={captures.white}
        active={!over && toMove === "white"}
      />
    </div>
  );
}

function PlayerCard({
  color,
  label,
  captured,
  active,
}: {
  color: Color;
  label: string;
  captured: number;
  active: boolean;
}) {
  return (
    <div className={`player-card${active ? " player-card-active" : ""}`}>
      <span className={`player-dot stone stone-${color}`} aria-hidden />
      <span className="player-meta">
        <span className="player-name">{color}</span>
        <span className="player-sub">{label}</span>
      </span>
      <span className="player-caps" title="prisoners taken">
        {captured}
      </span>
    </div>
  );
}
