---
parent: "[[07-match]]"
---

# 074-phone-controls

Part of `docs/lean/07-match.md` (Task 5: match rules and game-master flow), split so each part fits one card. The whole design is `docs/superpowers/specs/2026-11-27-team-pong-design.md` and the full plan (global constraints, message protocol, file structure) is `docs/superpowers/plans/2026-11-27-team-pong.md`. Merged first: 01-rooms, 02-server, 03-pad-bat, 04-phone-page, 05-screen-lobby, 06-physics, 071-roles, 072-match-rules, 073-screen-match.

## Goal

The phone page (`/`) follows the match: every phone shows the phase over its pad, and the game master's phone shows the controls. One screen. Design reference: the merged phone page (`web/index.html`, `web/phone/main.js`, `web/phone/styles.js`).

**Files:** `web/phone/main.js` (169 lines now: the controls go in a glue file), a new DOM-only controls module (e.g. `web/phone/controls.js`) that has no pad in it so 075 can reuse it, `web/phone/styles.js`, `web/index.html`, `web/shared/net.js`, `web/shared/constants.js`, `package.json` (coverage exclusion for the new glue file).

**Interfaces — Consumes:** `joined {id, color, isMaster}`, `role {isMaster}`, `state {phase, score, timeLeft, settings, canStart}`, `buzz {id, ms}` (071, 073). **Produces:** `settings {mode, value}`, `start`, `pause`, `resume`, `end`, `again`, `lobby` from the master.

Journey on the phone (join form, errors, "Joining…", and the two lost-connection states stay as merged):
- Every phone keeps its pad in every phase; a status line over the pad says the phase: the countdown number, the score, "Paused", the winner (or "Draw").
- **Lobby** — master: settings (a mode toggle Time / Score, the value with − and +; minutes 1–10, points 1–20; shown from `state.settings`) and Start, disabled while `canStart` is false. Others: "Waiting for the game master".
- **Countdown, playing, goal, paused** — master: small Pause and End buttons at the pad edge, so the player keeps playing; Pause becomes Resume when paused, also after an automatic pause; Resume is disabled while a team is empty. Others: pad and status line only.
- **Over** — master: Play again and Lobby. Others: "Waiting for the game master".
- `role {isMaster}` switches a phone between the two at once (the master left, or a host joined or left).
- `buzz` → `navigator.vibrate(ms)` if present; silently nothing otherwise.

## Acceptance

- [ ] Step 1: Implement the journey above.
- [ ] Step 2: Manual check with `npm start`, the screen and two phones (one per team): the first phone shows settings and Start, the second "Waiting for the game master"; changing mode and value shows on the TV lobby; Start runs the match; Pause/Resume and End work from the pad edge while the bat still moves; with one team emptied Resume is disabled; Play again and Lobby work; closing the master phone hands the controls to the other.
- [ ] Step 3: `npm test` → PASS, `ℹ tests 47` (no new tests: DOM glue), coverage ≥ 90%; lint clean; every code file under 200 lines.

## Out of scope

The `/host` page (075); WebMCP tools (09); anything assigned to another spec in the plan.

## Decisions

- runner (2026-11-27): every constant this spec needs goes in `web/shared/constants.js` (the plan's single constants module), which is part of this spec's files even where the Files line does not list it.
- runner (2026-11-27): every phone keeps its pad in every phase; a status line over the pad says the phase (countdown number, score, "Paused", the winner). Only the master phone (and `/host`) shows controls: settings and Start in the lobby, Pause/Resume and End in countdown, playing, goal and paused, Play again and Lobby when over. Others see "Waiting for the game master" in the lobby and when over.
- person (2026-11-27): "yes" — End goes to `over` with the current score; the leading team wins, and a tie shows "Draw"; Play again and Lobby work from there as after a normal finish.
- runner (2026-11-27, the person delegated the call: "you run the show"): Resume is refused (the control is disabled) while a team is empty, matching Start; a team emptying pauses the match in `countdown`, `playing` or `goal`, not in `lobby` or `over`.
- runner (2026-11-27): the game-master controls on the phone, the `/host` page and the TV during a match all follow the merged phone page's look (black background, white system-font type, player colours); large type on the TV.
- runner (2026-11-27): this spec's files include `web/phone/main.js`, `web/phone/styles.js`, `web/shared/net.js`, `web/index.html` and `package.json`.
- runner (2026-11-27): to keep files under 200 lines the builder may add DOM-only glue files beside the listed ones (e.g. `web/phone/controls.js`) and add each to the coverage exclusions in `package.json` like the existing DOM files; game logic stays in tested modules.
- runner (2026-11-27): new on-screen text goes through the customer-words pass before the PR.
- runner (2026-11-27): `state` carries no countdown seconds, so during `countdown` the phone's status line says "Get ready" instead of a number (the TV shows the count, spec 08); no change to match.js, the screen or the relay.
