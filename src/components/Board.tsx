"use client";

import { useMemo, useState } from "react";
import { atariStones, colOf, rowOf } from "@/lib/game/rules";
import type { Owner } from "@/lib/game/scoring";
import type { Board as BoardType, BoardSize, Color } from "@/lib/game/types";
import { STAR_POINTS } from "@/lib/game/constants";
import { Stone } from "./Stone";

interface BoardProps {
  size: BoardSize;
  board: BoardType;
  lastMove: number | null;
  koPoint: number | null;
  /** The local player may place a stone right now. */
  interactive: boolean;
  /** Colour to show as a hover/keyboard preview, or `null` for none. */
  previewColor: Color | null;
  /** Keyboard cursor position. */
  cursor: number;
  /** Scoring phase: show territory shading and allow marking dead stones. */
  scoring: boolean;
  territoryOwners: (Owner | null)[] | null;
  dead: ReadonlySet<number>;
  isLegal: (vertex: number) => boolean;
  onPlay: (vertex: number) => void;
  onToggleDead: (vertex: number) => void;
}

/** Column letters skip "I" by Go convention. */
const COLS = "ABCDEFGHJKLMNOPQRST";

function vertexLabel(size: number, i: number): string {
  return `${COLS[colOf(size, i)]}${size - rowOf(size, i)}`;
}

export function Board({
  size,
  board,
  lastMove,
  koPoint,
  interactive,
  previewColor,
  cursor,
  scoring,
  territoryOwners,
  dead,
  isLegal,
  onPlay,
  onToggleDead,
}: BoardProps) {
  const [hover, setHover] = useState<number | null>(null);
  const atari = useMemo(() => atariStones(board, size), [board, size]);

  const cell = 100 / size;
  const pos = (k: number) => (k + 0.5) * cell;
  const lineStart = pos(0);
  const lineEnd = pos(size - 1);
  const lines = Array.from({ length: size }, (_, k) => pos(k));
  const stars = STAR_POINTS[size];

  const previewIndex = hover ?? cursor;

  return (
    <div
      className="goban"
      style={{ ["--n" as string]: size }}
      role="grid"
      aria-label={`${size} by ${size} Go board`}
    >
      <svg className="goban-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
        {lines.map((p, k) => (
          <line key={`h${k}`} x1={lineStart} y1={p} x2={lineEnd} y2={p} vectorEffect="non-scaling-stroke" />
        ))}
        {lines.map((p, k) => (
          <line key={`v${k}`} x1={p} y1={lineStart} x2={p} y2={lineEnd} vectorEffect="non-scaling-stroke" />
        ))}
        {stars.map(([r, c], k) => (
          <circle key={`s${k}`} className="goban-star" cx={pos(c)} cy={pos(r)} r={0.9} />
        ))}
      </svg>

      <div
        className="goban-grid"
        style={{
          gridTemplateColumns: `repeat(${size}, 1fr)`,
          gridTemplateRows: `repeat(${size}, 1fr)`,
        }}
      >
        {board.map((stone, i) => {
          const isDead = scoring && dead.has(i);
          const owner = scoring && territoryOwners ? territoryOwners[i] : null;
          const canToggle = scoring && stone !== null;
          const canPlace = interactive && !scoring && stone === null;
          const showPreview =
            canPlace && previewColor !== null && i === previewIndex;
          const legalPreview = showPreview && isLegal(i);

          const cellClasses = ["goban-cell"];
          if (i === cursor && !scoring) cellClasses.push("goban-cell-cursor");
          if (canPlace || canToggle) cellClasses.push("goban-cell-active");

          return (
            <div
              key={i}
              className={cellClasses.join(" ")}
              role="gridcell"
              aria-label={`${vertexLabel(size, i)} ${
                stone ? stone : owner && owner !== "neutral" ? `${owner} territory` : "empty"
              }`}
              onPointerEnter={() => setHover(i)}
              onPointerLeave={() => setHover((h) => (h === i ? null : h))}
              onClick={() => {
                if (canToggle) onToggleDead(i);
                else if (canPlace) onPlay(i);
              }}
            >
              {owner && owner !== "neutral" && stone === null ? (
                <span className={`territory territory-${owner}`} aria-hidden />
              ) : null}

              {stone !== null ? (
                <Stone
                  color={stone}
                  last={i === lastMove}
                  atari={atari.has(i)}
                  dead={isDead}
                />
              ) : null}

              {koPoint === i && stone === null && !scoring ? (
                <span className="ko-marker" aria-hidden />
              ) : null}

              {showPreview && previewColor !== null ? (
                legalPreview ? (
                  <Stone color={previewColor} preview />
                ) : (
                  <span className="preview-illegal" aria-hidden />
                )
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
