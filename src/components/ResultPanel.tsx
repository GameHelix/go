"use client";

import type { ScoreResult } from "@/lib/game/scoring";
import type { Color, EndReason } from "@/lib/game/types";

interface ResultPanelProps {
  reason: EndReason;
  /** Winner by resignation; ignored when scoring by area. */
  resignedBy: Color | null;
  score: ScoreResult | null;
  deadCount: number;
  onNewGame: () => void;
  onMenu: () => void;
}

/**
 * The end-of-game summary. On a scored game it shows the area breakdown and
 * updates live as dead chains are toggled on the board behind it.
 */
export function ResultPanel({
  reason,
  resignedBy,
  score,
  deadCount,
  onNewGame,
  onMenu,
}: ResultPanelProps) {
  let headline: string;
  if (reason === "resign") {
    const winner = resignedBy === "black" ? "White" : "Black";
    headline = `${winner} wins by resignation`;
  } else if (score) {
    if (score.winner === "draw") headline = "A dead heat";
    else headline = `${cap(score.winner)} wins by ${fmt(score.margin)}`;
  } else {
    headline = "Game over";
  }

  return (
    <div className="result" role="status">
      <div className="result-headline">
        <span className="win-sweep">{headline}</span>
      </div>

      {reason === "passes" && score ? (
        <>
          <div className="score-grid">
            <ScoreColumn
              color="black"
              stones={score.blackStones}
              territory={score.territory.blackTerritory}
              komi={0}
              total={score.blackScore}
              win={score.winner === "black"}
            />
            <ScoreColumn
              color="white"
              stones={score.whiteStones}
              territory={score.territory.whiteTerritory}
              komi={score.komi}
              total={score.whiteScore}
              win={score.winner === "white"}
            />
          </div>
          <p className="result-hint">
            Chinese area scoring{score.territory.neutral > 0 ? ` · ${score.territory.neutral} neutral` : ""}
            {". "}
            Click a clearly dead chain to remove it{deadCount > 0 ? ` (${deadCount} marked)` : ""}.
          </p>
        </>
      ) : null}

      <div className="result-actions">
        <button type="button" className="btn btn-primary" onClick={onNewGame}>
          Play again
        </button>
        <button type="button" className="btn" onClick={onMenu}>
          Menu
        </button>
      </div>
    </div>
  );
}

function ScoreColumn({
  color,
  stones,
  territory,
  komi,
  total,
  win,
}: {
  color: Color;
  stones: number;
  territory: number;
  komi: number;
  total: number;
  win: boolean;
}) {
  return (
    <div className={`score-col${win ? " score-col-win" : ""}`}>
      <div className="score-head">
        <span className={`stone stone-${color} score-dot`} aria-hidden />
        <span>{cap(color)}</span>
      </div>
      <dl className="score-lines">
        <div>
          <dt>stones</dt>
          <dd>{stones}</dd>
        </div>
        <div>
          <dt>territory</dt>
          <dd>{territory}</dd>
        </div>
        {komi > 0 ? (
          <div>
            <dt>komi</dt>
            <dd>{fmt(komi)}</dd>
          </div>
        ) : null}
      </dl>
      <div className="score-total">{fmt(total)}</div>
    </div>
  );
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function fmt(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}
