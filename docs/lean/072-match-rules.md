---
parent: "[[07-match]]"
---

# 072-match-rules

Part of `docs/lean/07-match.md` (Task 5: match rules and game-master flow), split so each part fits one card. The whole design is `docs/superpowers/specs/2026-11-27-team-pong-design.md` and the full plan (global constraints, message protocol, file structure) is `docs/superpowers/plans/2026-11-27-team-pong.md`. Merged first: 01-rooms, 02-server, 03-pad-bat, 04-phone-page, 05-screen-lobby, 06-physics, 071-roles.

## Goal

The pure match module: phases, score, clock, end rules and serve. No DOM, no network; nothing imports it until 073.

**Files:** `web/games/pong/match.js`, `tests/match.test.js`, `web/shared/constants.js`.

**Interfaces — Consumes:** the `goal` events of `stepWorld` (`EVENT.GOAL`, with `side`), `TEAM`. **Produces:**
`createMatch({rng}) → { settings(mode, value), start(teamCounts), pause(), resume(), end(), again(), toLobby(), step(dt, events) → changes[], view() → {phase, score, timeLeft, settings, canStart} }`; phases `'lobby'|'countdown'|'playing'|'goal'|'paused'|'over'`; defaults `mode:'score', value:5`; time mode in minutes 1–10, score mode 1–20.

Behaviour:
- Start is refused while a team is empty (`canStart` false); Start → countdown 3 s → `playing`.
- The first serve direction comes from the injected `rng`.
- A goal → score +1 for the scoring team, phase `goal` for 1.5 s, then a serve toward the team that conceded.
- Score mode ends at the target; time mode ends when the clock reaches 0; a tie at time-out → the next goal wins.
- Pause freezes the clock; Resume continues.
- The match clock runs on simulated time: a 5 s `dt` is clamped (the clock drops ≤ 0.1 s).
- A team emptying pauses the match; `again` keeps the teams and resets the score; `toLobby` returns to `lobby`.
- The match does not move the ball: `changes` (or `view()`) tell the caller when to serve and toward which team, and the phase tells it when physics may step (only in `playing`). How team counts reach the match after `start` and the shape of `changes` are the builder's call.

## Acceptance

- [ ] Step 1: Eleven failing tests in `tests/match.test.js`, one `test()` each:
  1. start refused with an empty team;
  2. countdown 3 s → playing;
  3. goal → score +1, phase `goal` 1.5 s, serve toward the team that conceded;
  4. score mode ends at target;
  5. time mode ends at 0;
  6. tie at time-out → next goal wins;
  7. pause freezes the clock;
  8. a 5 s dt is clamped (clock drops ≤ 0.1 s);
  9. team empties while playing → paused;
  10. first serve direction from injected rng;
  11. `again` keeps teams and resets score.
  The decisions below (End → `over` with leader or draw, Resume refused with an empty team, the automatic pause in `countdown` and `goal` but not `lobby` or `over`, the setting ranges and defaults) have no test of their own: they are asserted inside these eleven.
- [ ] Step 2: Implement.
- [ ] Step 3: `npm test` → PASS, `ℹ tests 47` (36 + 11), coverage ≥ 90% with `match.js` counted; lint clean.

## Out of scope

Wiring into any page, drawing, messages; anything assigned to another spec in the plan.

## Decisions

- runner (2026-11-27): every constant this spec needs goes in `web/shared/constants.js` (the plan's single constants module), which is part of this spec's files even where the Files line does not list it.
- runner (2026-11-27): `stepWorld` keeps its clock in `world.now` (ms); after a goal the ball stays outside the field and the next `stepWorld` emits `goal` again, so the match stops stepping physics outside `playing` and has a new ball served with `createBall()`. (This module gives the phase and the serve; 073 does the stepping and creates the ball.)
- person (2026-11-27): "yes" — End goes to `over` with the current score; the leading team wins, and a tie shows "Draw"; Play again and Lobby work from there as after a normal finish. (This module: `end()` → `over`, and the view names the winner or a draw.)
- runner (2026-11-27, the person delegated the call: "you run the show"): Resume is refused (the control is disabled) while a team is empty, matching Start; a team emptying pauses the match in `countdown`, `playing` or `goal`, not in `lobby` or `over`. (This module: `resume()` refused; 074 disables the control.)
