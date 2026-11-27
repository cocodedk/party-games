# 03-pad-bat

Goal, behaviour and acceptance tests are below; the whole design is `docs/superpowers/specs/2026-11-27-team-pong-design.md` and the full plan (global constraints, message protocol, file structure) is `docs/superpowers/plans/2026-11-27-team-pong.md`. Earlier specs 01-rooms, 02-server are merged first.

## Task 3a: Control math — pad and bat (pure)

**Files:** `web/phone/pad.js`, `web/games/pong/bat.js`, `tests/pad.test.js`, `tests/bat.test.js`.

**Interfaces — Produces:**
- `createPad() → { down(px,py,w,h), move(px,py,w,h) → {x,y,a}, up() }` — x,y = touch / pad size (0..1, same
  orientation for both teams); angle changes by the signed turn of successive movement directions, ignoring
  segments shorter than `PAD_MIN_MOVE` (jitter), so a straight drag does not rotate and a full circle turns ≈ 2π.
- `createBat({id, team, color}) → bat`, `setTarget(bat, {x,y,a})`, `stepBat(bat, dt)` (ease toward target with
  `BAT_EASE_MS`, track `vx, vy, va`), `batEnds(bat) → [p1,p2]`; both ends clamped inside the team's half.

- [ ] Step 1: Failing tests: straight drag → a unchanged; clockwise circle of 32 points → a ≈ +2π (±0.2); anticlockwise
  → −2π; 0.5 px jitter → no change; target x=1 for the left team keeps the whole bat left of the centre line, also
  rotated 90°; easing reaches 95% of target within `BAT_EASE_MS`.
- [ ] Step 2: Implement. `npm test` → PASS, `ℹ tests 21`.

## Out of scope

Anything assigned to another spec in the plan.

## Decisions

