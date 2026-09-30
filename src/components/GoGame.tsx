"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { chooseMove } from "@/lib/game/cpu";
import { DEFAULT_KOMI, DEFAULT_SIZE } from "@/lib/game/constants";
import { makeRng } from "@/lib/game/rng";
import {
  colOf,
  isLegalMove,
  newGame,
  playMove,
  playPass,
  resign,
  rowOf,
  undo,
} from "@/lib/game/rules";
import { scoreGame } from "@/lib/game/scoring";
import type { BoardSize, Color, Difficulty, GameState, Mode } from "@/lib/game/types";
import { useLocalStorage } from "@/lib/hooks/useLocalStorage";
import { useSound } from "@/lib/hooks/useSound";
import { Board } from "./Board";
import { Hud } from "./Hud";
import { MenuScreen } from "./MenuScreen";
import { ResultPanel } from "./ResultPanel";
import { RulesPanel } from "./RulesPanel";

/** The human is always Black; the computer, when present, plays White. */
const CPU_COLOR: Color = "white";
const CPU_DELAY_MS = 380;

const centerOf = (size: number) => Math.floor((size * size) / 2);

function isFormElement(el: Element | null): boolean {
  if (!el) return false;
  const tag = el.tagName;
  return tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA";
}

export function GoGame() {
  const size = useLocalStorage<BoardSize>("go.size", DEFAULT_SIZE);
  const mode = useLocalStorage<Mode>("go.mode", "cpu");
  const difficulty = useLocalStorage<Difficulty>("go.difficulty", "medium");
  const komi = useLocalStorage<number>("go.komi", DEFAULT_KOMI);
  const sound = useLocalStorage<boolean>("go.sound", true);

  const play = useSound(sound.value);

  const [phase, setPhase] = useState<"menu" | "play">("menu");
  const [showRules, setShowRules] = useState(false);
  const [game, setGame] = useState<GameState>(() => newGame(DEFAULT_SIZE, DEFAULT_KOMI));
  const [dead, setDead] = useState<ReadonlySet<number>>(() => new Set());
  const [cursor, setCursor] = useState<number>(() => centerOf(DEFAULT_SIZE));
  const [shake, setShake] = useState(false);
  const [capFlash, setCapFlash] = useState(false);

  const seedRef = useRef(1);
  const wasOver = useRef(false);

  const scoring = game.over && game.endReason === "passes";

  const score = useMemo(
    () => (scoring ? scoreGame(game.board, game.size, game.komi, dead) : null),
    [scoring, game.board, game.size, game.komi, dead],
  );

  const lastMove = useMemo(() => {
    const last = game.history[game.history.length - 1];
    return last && last.vertex !== null ? last.vertex : null;
  }, [game.history]);

  const humanToMove = mode.value === "local" || game.toMove !== CPU_COLOR;
  const interactive = !game.over && humanToMove;
  const previewColor: Color | null = interactive ? game.toMove : null;

  /* ----------------------------------------------------------- actions */

  const flashReject = useCallback(() => {
    setShake(true);
    window.setTimeout(() => setShake(false), 360);
  }, []);

  const flashCapture = useCallback(() => {
    setCapFlash(true);
    window.setTimeout(() => setCapFlash(false), 400);
  }, []);

  const applyPlay = useCallback(
    (vertex: number) => {
      const r = playMove(game, vertex);
      if (r === null) {
        play("reject");
        flashReject();
        return;
      }
      setGame(r.state);
      if (r.capturesOpp) {
        play("capture", r.captured);
        flashCapture();
      } else if (r.givesAtari) play("atari");
      else play("place");
    },
    [game, play, flashReject, flashCapture],
  );

  const handlePlay = useCallback(
    (vertex: number) => {
      if (!interactive) return;
      setCursor(vertex);
      applyPlay(vertex);
    },
    [interactive, applyPlay],
  );

  const handlePass = useCallback(() => {
    if (!interactive) return;
    setGame((g) => playPass(g));
    play("pass");
  }, [interactive, play]);

  const handleResign = useCallback(() => {
    if (game.over) return;
    // In CPU mode the human (Black) resigns; in local play the side to move does.
    const who: Color = mode.value === "cpu" ? "black" : game.toMove;
    setGame((g) => resign(g, who));
    play("reject");
  }, [game.over, game.toMove, mode.value, play]);

  const handleUndo = useCallback(() => {
    setGame((g) => {
      let next = undo(g);
      // In CPU mode step back past the computer.s reply too, so it is the human's turn.
      if (mode.value === "cpu" && !next.over && next.toMove === CPU_COLOR && next.history.length > 0) {
        next = undo(next);
      }
      return next;
    });
    setDead(new Set());
  }, [mode.value]);

  const handleToggleDead = useCallback((vertex: number) => {
    setDead((prev) => {
      const next = new Set(prev);
      if (next.has(vertex)) next.delete(vertex);
      else next.add(vertex);
      return next;
    });
  }, []);

  const startGame = useCallback(() => {
    seedRef.current = Math.floor(Math.random() * 0x7fffffff) || 1;
    setGame(newGame(size.value, komi.value));
    setDead(new Set());
    setCursor(centerOf(size.value));
    wasOver.current = false;
    setPhase("play");
  }, [size.value, komi.value]);

  const backToMenu = useCallback(() => {
    setPhase("menu");
  }, []);

  /* ------------------------------------------------------------ effects */

  // The computer takes its turn on a short delay so its move is visible as a response.
  useEffect(() => {
    if (phase !== "play" || mode.value !== "cpu" || game.over || game.toMove !== CPU_COLOR) return;

    let cancelled = false;
    const timer = window.setTimeout(() => {
      if (cancelled) return;
      const rng = makeRng((seedRef.current + game.history.length * 0x9e3779b1) >>> 0);
      const vertex = chooseMove(game, difficulty.value, rng);
      if (vertex === null) {
        setGame((g) => playPass(g));
        play("pass");
        return;
      }
      const r = playMove(game, vertex);
      if (r === null) {
        setGame((g) => playPass(g));
        return;
      }
      setGame(r.state);
      if (r.capturesOpp) {
        play("capture", r.captured);
        flashCapture();
      } else if (r.givesAtari) play("atari");
      else play("place");
    }, CPU_DELAY_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [phase, mode.value, difficulty.value, game, play, flashCapture]);

  // A single flourish when the game reaches its end.
  useEffect(() => {
    if (game.over && !wasOver.current) play("win");
    wasOver.current = game.over;
  }, [game.over, play]);

  // Keyboard: arrows move the cursor, Enter/Space place, P passes.
  useEffect(() => {
    if (phase !== "play") return;

    const onKey = (e: KeyboardEvent) => {
      const active = document.activeElement;
      if (isFormElement(active)) return;

      const key = e.key;
      if (key === "ArrowLeft" || key === "ArrowRight" || key === "ArrowUp" || key === "ArrowDown") {
        e.preventDefault();
        setCursor((cur) => {
          const r = rowOf(game.size, cur);
          const c = colOf(game.size, cur);
          let nr = r;
          let nc = c;
          if (key === "ArrowLeft") nc = Math.max(0, c - 1);
          else if (key === "ArrowRight") nc = Math.min(game.size - 1, c + 1);
          else if (key === "ArrowUp") nr = Math.max(0, r - 1);
          else nr = Math.min(game.size - 1, r + 1);
          return nr * game.size + nc;
        });
        return;
      }

      if (key === "Enter" || key === " ") {
        // Let a focused control handle its own activation.
        if (active && active.tagName === "BUTTON") return;
        e.preventDefault();
        if (interactive && !scoring) handlePlay(cursor);
        return;
      }

      if (key === "p" || key === "P") {
        e.preventDefault();
        if (interactive) handlePass();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, game.size, cursor, interactive, scoring, handlePlay, handlePass]);

  /* -------------------------------------------------------------- render */

  if (phase === "menu") {
    return (
      <main className="stage">
        <MenuScreen
          size={size.value}
          mode={mode.value}
          difficulty={difficulty.value}
          komi={komi.value}
          soundEnabled={sound.value}
          onSize={size.store}
          onMode={mode.store}
          onDifficulty={difficulty.store}
          onKomi={komi.store}
          onSound={sound.store}
          onStart={startGame}
          onRules={() => setShowRules(true)}
        />
        {showRules ? <RulesPanel onClose={() => setShowRules(false)} /> : null}
      </main>
    );
  }

  const blackLabel = mode.value === "cpu" ? "you" : "player one";
  const whiteLabel = mode.value === "cpu" ? `CPU · ${difficulty.value}` : "player two";
  const cpuThinking = mode.value === "cpu" && !game.over && game.toMove === CPU_COLOR;

  return (
    <main className="stage">
      <Hud
        toMove={game.toMove}
        captures={game.captures}
        komi={game.komi}
        moveNumber={game.history.length}
        mode={mode.value}
        difficulty={difficulty.value}
        over={game.over}
        blackLabel={blackLabel}
        whiteLabel={whiteLabel}
      />

      <div
        className={`board-wrap${shake ? " shake" : ""}${capFlash ? " captured" : ""}${
          cpuThinking ? " thinking" : ""
        }`}
      >
        <Board
          size={game.size}
          board={game.board}
          lastMove={lastMove}
          koPoint={game.koPoint}
          interactive={interactive}
          previewColor={previewColor}
          cursor={cursor}
          scoring={scoring}
          territoryOwners={score ? score.territory.owners : null}
          dead={dead}
          isLegal={(v) => isLegalMove(game, v)}
          onPlay={handlePlay}
          onToggleDead={handleToggleDead}
        />
      </div>

      {game.over ? (
        <ResultPanel
          reason={game.endReason ?? "passes"}
          resignedBy={game.resignedBy}
          score={score}
          deadCount={dead.size}
          onNewGame={startGame}
          onMenu={backToMenu}
        />
      ) : (
        <div className="controls">
          <button type="button" className="btn" onClick={handlePass} disabled={!interactive}>
            Pass
          </button>
          <button
            type="button"
            className="btn"
            onClick={handleUndo}
            disabled={game.history.length === 0 && game.endReason !== "resign"}
          >
            Undo
          </button>
          <button type="button" className="btn" onClick={handleResign} disabled={game.over}>
            Resign
          </button>
          <button type="button" className="btn" onClick={startGame}>
            New
          </button>
          <button type="button" className="btn" onClick={backToMenu}>
            Menu
          </button>
        </div>
      )}

      <p className="turn-hint" aria-live="polite">
        {cpuThinking
          ? "CPU is thinking…"
          : scoring
            ? "Click dead chains to remove them, then read the score."
            : `${game.toMove === "black" ? "Black" : "White"} to play — click, or arrows + Enter, P to pass`}
      </p>

      {showRules ? <RulesPanel onClose={() => setShowRules(false)} /> : null}
    </main>
  );
}
