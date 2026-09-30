"use client";

import { BOARD_SIZES, DIFFICULTIES, KOMI_CHOICES } from "@/lib/game/constants";
import type { BoardSize, Difficulty, Mode } from "@/lib/game/types";

interface MenuScreenProps {
  size: BoardSize;
  mode: Mode;
  difficulty: Difficulty;
  komi: number;
  soundEnabled: boolean;
  onSize: (size: BoardSize) => void;
  onMode: (mode: Mode) => void;
  onDifficulty: (difficulty: Difficulty) => void;
  onKomi: (komi: number) => void;
  onSound: (on: boolean) => void;
  onStart: () => void;
  onRules: () => void;
}

/** The opening screen: pick the board, the opponent and the rules, then start. */
export function MenuScreen({
  size,
  mode,
  difficulty,
  komi,
  soundEnabled,
  onSize,
  onMode,
  onDifficulty,
  onKomi,
  onSound,
  onStart,
  onRules,
}: MenuScreenProps) {
  return (
    <div className="menu">
      <header className="menu-head">
        <h1 className="title">
          <span className="title-mark stone stone-black" aria-hidden />
          GO
        </h1>
        <p className="tagline">Surround territory. Capture stones. The oldest game there is, in neon.</p>
      </header>

      <div className="menu-grid">
        <Segment label="Board">
          <div className="seg-row">
            {BOARD_SIZES.map((s) => (
              <button
                key={s}
                type="button"
                className={`chip${size === s ? " chip-on" : ""}`}
                onClick={() => onSize(s)}
              >
                {s}×{s}
              </button>
            ))}
          </div>
        </Segment>

        <Segment label="Opponent">
          <div className="seg-row">
            <button
              type="button"
              className={`chip${mode === "local" ? " chip-on" : ""}`}
              onClick={() => onMode("local")}
            >
              2 players
            </button>
            <button
              type="button"
              className={`chip${mode === "cpu" ? " chip-on" : ""}`}
              onClick={() => onMode("cpu")}
            >
              vs CPU
            </button>
          </div>
        </Segment>

        {mode === "cpu" ? (
          <Segment label="Difficulty">
            <div className="seg-row">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d}
                  type="button"
                  className={`chip${difficulty === d ? " chip-on" : ""}`}
                  onClick={() => onDifficulty(d)}
                >
                  {d}
                </button>
              ))}
            </div>
          </Segment>
        ) : null}

        <Segment label="Komi">
          <div className="seg-row">
            {KOMI_CHOICES.map((k) => (
              <button
                key={k}
                type="button"
                className={`chip${komi === k ? " chip-on" : ""}`}
                onClick={() => onKomi(k)}
              >
                {k}
              </button>
            ))}
          </div>
        </Segment>

        <Segment label="Sound">
          <div className="seg-row">
            <button
              type="button"
              className={`chip${soundEnabled ? " chip-on" : ""}`}
              onClick={() => onSound(true)}
            >
              on
            </button>
            <button
              type="button"
              className={`chip${!soundEnabled ? " chip-on" : ""}`}
              onClick={() => onSound(false)}
            >
              off
            </button>
          </div>
        </Segment>
      </div>

      <div className="menu-actions">
        <button type="button" className="btn btn-primary" onClick={onStart}>
          Start game
        </button>
        <button type="button" className="btn" onClick={onRules}>
          How to play
        </button>
      </div>
    </div>
  );
}

function Segment({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="segment">
      <span className="segment-label">{label}</span>
      {children}
    </div>
  );
}
