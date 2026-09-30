"use client";

interface RulesPanelProps {
  onClose: () => void;
}

/** A modal that explains the rules, scoring and controls. */
export function RulesPanel({ onClose }: RulesPanelProps) {
  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label="How to play Go">
      <div className="panel">
        <h2 className="panel-title">How to play</h2>

        <div className="panel-body">
          <section>
            <h3>Goal</h3>
            <p>
              Control more of the board than your opponent. Your score is the area you hold — your
              stones plus the empty points they surround. White is given <em>komi</em> points to
              offset moving second.
            </p>
          </section>

          <section>
            <h3>Placing &amp; capturing</h3>
            <p>
              Black plays first. Take turns placing one stone on any empty intersection. The empty
              points touching a stone (or a solidly connected chain) are its <em>liberties</em>. Fill
              a chain&apos;s last liberty and it is captured and removed from the board.
            </p>
          </section>

          <section>
            <h3>Two rules to remember</h3>
            <ul>
              <li>
                <strong>No suicide.</strong> You may not play a stone that would leave your own chain
                with no liberties — unless the same move captures.
              </li>
              <li>
                <strong>Ko.</strong> You may not immediately recapture in a way that recreates the
                previous whole-board position. Play elsewhere first.
              </li>
            </ul>
          </section>

          <section>
            <h3>Ending &amp; scoring</h3>
            <p>
              When both players pass in a row the game ends. Empty regions surrounded by a single
              colour become that player&apos;s territory; regions touching both colours are neutral.
              Final score = your stones + your territory (+ komi for White). Before the count you can
              click any clearly dead chain to remove it.
            </p>
          </section>

          <section>
            <h3>Controls</h3>
            <ul>
              <li>Click or tap an intersection to play; a preview shows where the stone will land.</li>
              <li>Arrow keys move the cursor, Enter or Space places, <kbd>P</kbd> passes.</li>
              <li>Pass, undo, resign and a new game are on the control bar.</li>
            </ul>
          </section>
        </div>

        <div className="panel-actions">
          <button type="button" className="btn btn-primary" onClick={onClose}>
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
