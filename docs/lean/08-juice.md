# 08-juice

Goal, behaviour and acceptance tests are below; the whole design is `docs/superpowers/specs/2026-11-27-team-pong-design.md` and the full plan (global constraints, message protocol, file structure) is `docs/superpowers/plans/2026-11-27-team-pong.md`. Earlier specs 01-rooms, 02-server, 03-pad-bat, 04-phone-page, 05-screen-lobby, 06-physics, 07-match are merged first.

## Task 6: Juice — sound, goal fanfare, flashes, win screen

**Files:** `web/games/pong/sound.js`, `render.js` (score pop, bump flash, countdown, winner), `tests/es-level.test.js`, `package.json` (dev dep `acorn`).

- [ ] Step 1: WebAudio oscillators: `hit`, `wall`, `goal` (short arpeggio ~0.8 s), `win` (~2 s); unlock on first
  click / keydown on the screen ("Click or press OK for sound"); silent if never unlocked.
- [ ] Step 2: Render score pop, bump flash (bat blinks during freeze), 3-2-1, winner screen in the team colour.
- [ ] Step 3: `tests/es-level.test.js`: parse every `dist/assets/*.js` at `ecmaVersion: 2018, sourceType: 'module'`;
  fail on any parse error. `npm test` → PASS, `ℹ tests 48`.

## Out of scope

Anything assigned to another spec in the plan.

## Decisions

