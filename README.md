# ⚫ GO

Go — also known as Weiqi or Baduk — is the oldest board game still played in its
original form: two players place stones to surround territory and capture each
other's groups. This is a full implementation for the browser, built with
**Next.js 16**, **TypeScript** (strict) and **Tailwind CSS v4**, wrapped in a
neon CRT skin with no wood in sight. Play a friend across the table or take on a
built-in heuristic computer opponent, on a 9×9, 13×13 or 19×19 goban, with the complete rule set
and Chinese area scoring.

## ✨ Features

| Feature | Detail |
| --- | --- |
| Board sizes | 9×9 (default), 13×13 and 19×19, each with the correct star points |
| Full rules | Placement, liberties, group capture, illegal suicide, and simple ko |
| Ko rule | An immediate recapture that recreates the previous whole-board position is forbidden |
| End & undo | Pass, resign, two-passes-to-end, complete move history and unlimited undo |
| Scoring | Chinese **area** scoring (stones + surrounded territory) with adjustable komi (default 7.5) |
| Dead stones | Click any clearly dead chain before the count to remove it; the score updates live |
| Two modes | Local hot-seat for two players, or vs a heuristic computer opponent with Easy / Medium / Hard tiers |
| Smart-ish CPU | Takes captures, saves groups in atari, extends liberties, avoids filling its own eyes — and answers instantly |
| Neon board | Glowing stones, last-move marker, atari and capture flashes, live prisoner counts, territory shading |
| Input | Mouse, touch (with a placement preview) and full keyboard play |
| Sound | Procedural Web Audio for place, capture, atari, pass, illegal and win — no asset files |
| Polish | Responsive down to phone width, reduced-motion aware, and SSR-safe with no hydration flicker |

## 🎮 How to play

- **Goal.** Control more of the board than your opponent — your score is your
  stones plus the empty points they alone surround. White gets *komi* points to
  offset moving second.
- **Placing.** Black moves first. Click or tap an empty intersection to play; a
  translucent preview shows where the stone will land.
- **Capturing.** The empty points touching a chain are its *liberties*. Fill a
  chain's last liberty and it is captured and removed.
- **Two rules.** You may not play a stone that leaves your own group with no
  liberties (suicide), unless the move captures. And you may not immediately
  recapture in a way that recreates the previous whole-board position (ko).
- **Ending.** Two passes in a row end the game. Mark any dead chains, then read
  the final area score and the winner.

### Controls

- **Mouse / touch** — click or tap an intersection to play.
- **Keyboard** — arrow keys move the cursor, **Enter** or **Space** places, **P** passes.
- **Buttons** — pass, undo, resign, start a new game, or return to the menu.

## 🛠 Tech

- Next.js 16 (App Router) with React 19
- TypeScript in strict mode
- Tailwind CSS v4 via `@tailwindcss/postcss`
- Vitest for the rules, scoring and move-logic unit tests
- Pure, framework-free game logic in `src/lib/game` (types, rules, scoring, cpu)
- Procedural Web Audio and CSS-only animation — no external assets

## Getting started

```bash
npm install
npm run dev      # start the dev server at http://localhost:3000
npm run build    # production build
npm test         # run the unit tests
npm run lint     # lint
```
