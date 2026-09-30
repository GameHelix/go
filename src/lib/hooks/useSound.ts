"use client";

import { useCallback, useRef } from "react";

export type Voice = "place" | "capture" | "atari" | "pass" | "reject" | "win";

/**
 * Procedural Web Audio effects — no asset files, so nothing to load or 404.
 * The context is created lazily on the first sound because browsers refuse to
 * start one before a user gesture.
 */
export function useSound(enabled: boolean) {
  const ctxRef = useRef<AudioContext | null>(null);

  const context = useCallback((): AudioContext | null => {
    if (typeof window === "undefined") return null;
    if (!ctxRef.current) {
      const Ctor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      ctxRef.current = new Ctor();
    }
    if (ctxRef.current.state === "suspended") void ctxRef.current.resume();
    return ctxRef.current;
  }, []);

  const blip = useCallback(
    (
      ctx: AudioContext,
      freq: number,
      duration: number,
      type: OscillatorType,
      gain: number,
      slideTo?: number,
      delay = 0
    ) => {
      const start = ctx.currentTime + delay;
      const osc = ctx.createOscillator();
      const amp = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, start);
      if (slideTo !== undefined) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(slideTo, 1), start + duration);
      }
      amp.gain.setValueAtTime(gain, start);
      amp.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      osc.connect(amp).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + duration);
      // Release the nodes as soon as they are silent so nothing accumulates
      // over a long session.
      osc.onended = () => {
        osc.disconnect();
        amp.disconnect();
      };
    },
    []
  );

  const play = useCallback(
    (voice: Voice, magnitude = 1) => {
      if (!enabled) return;
      const ctx = context();
      if (!ctx) return;

      switch (voice) {
        case "place":
          // The dry "clack" of a stone meeting the board: a short click plus a
          // low body tone.
          blip(ctx, 220, 0.05, "square", 0.03, 130);
          blip(ctx, 880, 0.04, "triangle", 0.03);
          break;
        case "capture":
          // Brighter and busier the more stones are lifted from the board.
          blip(ctx, 180, 0.08, "square", 0.035, 110);
          {
            const extra = Math.min(magnitude, 5);
            for (let i = 0; i < extra; i++) {
              blip(ctx, 520 + i * 90, 0.1, "triangle", 0.035, undefined, 0.04 + i * 0.05);
            }
          }
          break;
        case "atari":
          // A two-note warning — the group is one liberty from death.
          blip(ctx, 740, 0.1, "sawtooth", 0.03, undefined, 0);
          blip(ctx, 988, 0.12, "sawtooth", 0.03, undefined, 0.1);
          break;
        case "pass":
          blip(ctx, 300, 0.14, "sine", 0.035, 220);
          break;
        case "reject":
          blip(ctx, 190, 0.2, "sawtooth", 0.04, 96);
          break;
        case "win":
          [523, 659, 784, 1046, 1318].forEach((f, i) =>
            blip(ctx, f, 0.24, "triangle", 0.055, undefined, i * 0.1)
          );
          break;
      }
    },
    [blip, context, enabled]
  );

  return play;
}
