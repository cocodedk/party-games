---
parent: "[[07-match]]"
---

# 073-screen-match

Part of `docs/lean/07-match.md` (Task 5: match rules and game-master flow), split so each part fits one card. The whole design is `docs/superpowers/specs/2026-11-27-team-pong-design.md` and the full plan (global constraints, message protocol, file structure) is `docs/superpowers/plans/2026-11-27-team-pong.md`. Merged first: 01-rooms, 02-server, 03-pad-bat, 04-phone-page, 05-screen-lobby, 06-physics, 071-roles, 072-match-rules.

## Goal

The TV screen (`/screen`) plays the match: it runs physics and the match module, obeys the game master's messages, draws the match and tells the phones the state. One screen. Design reference: the merged screen lobby and field (`web/screen.html`, `web/screen/lobby.js`, `web/games/pong/render.js`) and the merged phone page's look.

**Files:** `web/screen/main.js`, `web/screen/lobby.js`, `web/screen/styles.js`, `web/screen.html`, `web/games/pong/render.js`, `web/shared/constants.js`, `package.json` (coverage exclusions for any new glue file).

**Interfaces — Consumes:** `createMatch` (072), `createBall`, `stepWorld`, the messages of 071 (`settings`, `start`, `pause`, `resume`, `end`, `again`, `lobby` in; `state`, `buzz` out). **Produces:** `state {phase, score, timeLeft, settings, canStart}` sent on change only.

Journey on the TV:
- **Lobby phase** (as merged, plus): the current settings (mode and value) are shown; under the join URL, in small type, the `/host?room=CODE` link, labelled for the laptop. Bats move as today.
- **Start** (from the master): the lobby band (QR, code, team lists) is hidden; the field shows the ball, the score, and in time mode the clock. Physics steps only in `playing`; on a serve the screen makes a new ball with `createBall()` and sends it toward the team the match names.
- **Pause** (by the master or because a team emptied): a "Paused" label; nothing moves.
- **Over**: the score stays with the winner, or "Draw" (plain; 08 adds winner styling). Play again starts a new match with the same teams; Lobby brings the lobby band back.
- Players who join or leave mid-match appear or vanish at once; the screen passes the team counts to the match.
- Connection lost: the merged "Lost the connection to the game server. Reload this page." state, unchanged.

Builder's latitude: the screen sends `buzz {id, ms}` to both phones of a `bump` event (the plan's global constraint; the relay and `BUMP_FREEZE_MS` exist) so 074 has something to vibrate on.

## Acceptance

- [ ] Step 1: Implement the journey above; `web/screen/main.js` no longer calls `stepBat` itself.
- [ ] Step 2: Manual check with `npm start` and two `ws` clients or phones (one per team) sending the master messages by hand: lobby shows settings and the host link; `start` hides the lobby band and the ball is served after 3 s; a goal changes the score and re-serves after 1.5 s; `pause` shows "Paused"; `end` shows the result; `lobby` brings the band back; the phones receive `state` only when it changes.
- [ ] Step 3: `npm test` → PASS, `ℹ tests 47` (no new tests: DOM glue, proved by the e2e of 09), coverage ≥ 90%; lint clean; every code file under 200 lines.

## Out of scope

Score pop, bump flash, the drawn 3-2-1 and winner styling, sound (08); phone and `/host` controls (074, 075); WebMCP tools (09); anything assigned to another spec in the plan.

## Decisions

- runner (2026-11-27): every constant this spec needs goes in `web/shared/constants.js` (the plan's single constants module), which is part of this spec's files even where the Files line does not list it.
- runner (2026-11-27): `stepWorld` (spec 06) already steps the bats and skips frozen ones, so wiring physics into the screen removes the separate `stepBat` call in `web/screen/main.js`; `stepWorld` keeps its clock in `world.now` (ms), and after a goal the ball stays put until this spec re-serves it.
- runner (2026-11-27): `stepWorld(world, dt)` takes `bats` as an array or a Map and adds `world.now` (ms, default 0) as the clock for `frozenUntil`; after a goal the ball stays outside the field and the next `stepWorld` emits `goal` again, so the match stops stepping physics outside `playing` and re-serves a new ball with `createBall()`.
- person (2026-11-27): "it is okay" — a free bat that hits a frozen teammate freezes only itself, as spec 06 built it.
- runner (2026-11-27): this spec draws on the TV the ball, the score, the clock (time mode) and a "Paused" label, hides the lobby band (QR, code, team lists) once the match starts and brings it back in the lobby phase, and shows the current settings in the lobby; spec 08 adds only the juice listed there (score pop, bump flash, 3-2-1, winner styling).
- runner (2026-11-27): the TV lobby shows the `/host?room=CODE` link in small type under the join URL, labelled for the laptop.
- person (2026-11-27): "yes" — End goes to `over` with the current score; the leading team wins, and a tie shows "Draw"; Play again and Lobby work from there as after a normal finish. (This screen shows the result.)
- runner (2026-11-27): the game-master controls on the phone, the `/host` page and the TV during a match all follow the merged phone page's look (black background, white system-font type, player colours); large type on the TV.
- runner (2026-11-27): this spec's files include `web/games/pong/render.js`, `web/screen/lobby.js`, `web/screen/main.js`, `web/screen.html` and `package.json`.
- runner (2026-11-27): to keep files under 200 lines the builder may add DOM-only glue files beside the listed ones (e.g. `web/phone/controls.js`) and add each to the coverage exclusions in `package.json` like the existing DOM files; game logic stays in tested modules.
- runner (2026-11-27): new on-screen text goes through the customer-words pass before the PR.
