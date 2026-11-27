# 06-physics

Goal, behaviour and acceptance tests are below; the whole design is `docs/superpowers/specs/2026-11-27-team-pong-design.md` and the full plan (global constraints, message protocol, file structure) is `docs/superpowers/plans/2026-11-27-team-pong.md`. Earlier specs 01-rooms, 02-server, 03-pad-bat, 04-phone-page, 05-screen-lobby are merged first.

## Task 4: Ball physics and teammate collisions

**Files:** `web/games/pong/physics.js`, `tests/physics.test.js`.

**Interfaces — Consumes:** bat API. **Produces:** `createBall()`, `stepWorld(world, dt) → events[]` where
`world = {ball, bats}` and events are `{type:'wall'|'hit'|'goal', side?}` and `{type:'bump', ids:[a,b]}`; substeps
so the ball moves ≤ half the bat thickness per substep.

- [ ] Step 1: Failing tests: ball bounces off top/bottom; leaving left edge → `goal` for `right`; head-on bat hit
  reflects about the bat normal; a 45° bat sends the ball off at the reflected angle; a moving bat adds speed; speed
  never exceeds `BALL_MAX`; ball at `BALL_MAX` toward a thin bat does not tunnel; ball placed inside a rotating bat is
  out after one step; ball pinned by a bat at a wall is free within 2 steps; two teammate bats overlapping → `bump`,
  both pushed apart, both `frozenUntil = now+1000`, frozen bats ignore targets but still deflect the ball.
- [ ] Step 2: Implement (circle vs. thick segment, push-out along normal). `npm test` → PASS, `ℹ tests 32`.

## Out of scope

Anything assigned to another spec in the plan.

## Decisions

