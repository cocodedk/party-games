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

- runner (2026-11-27): every constant this spec needs goes in `web/shared/constants.js` (the plan's single constants module), which is part of this spec's files even where the Files line does not list it.
- runner (2026-11-27, the person delegated the call: "you run the show"): this spec's files also include `web/screen/main.js` (fires the sounds, attaches the unlock listener, passes freeze and countdown state to the drawing), `web/games/pong/match.js` (its `view()` may expose the countdown seconds left, asserted inside the existing countdown test), `web/screen.html` and `web/screen/styles.js`; the phones keep "Get ready" and the `state` message is unchanged; the count is `ℹ tests 48` (47 + the bundle check).
- runner (2026-11-27, the person delegated the call: "you run the show"): the sound prompt "Click or press OK for sound" is one small line at the bottom centre of the TV, in the small type of the lobby's laptop link, shown in every phase until the first click or keydown on the screen unlocks sound, then gone for good.
- runner (2026-11-27, the person delegated the call: "you run the show"): each team gets one colour, `TEAM_COLOR` in `web/shared/constants.js` (left `#4fc3f7` light blue, right `#ffb74d` orange); the winner line ("Left team wins") is drawn large in the winning team's colour, and a draw shows "Draw" in the field's white; player colours stay as they are.
- runner (2026-11-27): Vite's minifier emits optional catch binding (`catch{`) for the chrome69 target, which an ES2018 parse rejects; the bundle check must allow it (Chrome 66+ supports it), for example by parsing at ecmaVersion 2019.

