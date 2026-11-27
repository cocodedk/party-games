import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createBall, stepWorld } from '../web/games/pong/physics.js';
import { createBat, batEnds } from '../web/games/pong/bat.js';
import {
  TEAM, FIELD_W, FIELD_H, BAT_THICKNESS, BALL_RADIUS, BALL_MAX, BALL_HIT_SPEEDUP, BUMP_FREEZE_MS, EVENT,
  MS_PER_S,
} from '../web/shared/constants.js';

const DT = 1 / 60;
const SPEED = 8;
const REACH = BALL_RADIUS + BAT_THICKNESS / 2;
const EPS = 1e-9;

function place(bat, x, y, a = 0) {
  Object.assign(bat, { x, y, a });
  bat.target = { x, y, a };
  return bat;
}
const bat = (id, x, y, a, team = TEAM.LEFT) => place(createBat({ id, team, color: '#fff' }), x, y, a);
const ball = (x, y, vx, vy) => Object.assign(createBall(), { x, y, vx, vy });
const speed = (b) => Math.hypot(b.vx, b.vy);
const types = (events) => events.map((e) => e.type);
function batGap(a, b) {
  const along = (bt) => Array.from({ length: 101 }, (_, i) => {
    const [p, q] = batEnds(bt);
    return { x: p.x + (q.x - p.x) * i / 100, y: p.y + (q.y - p.y) * i / 100 };
  });
  return Math.min(...along(a).map((p) => gap(p, b)), ...along(b).map((p) => gap(p, a)));
}
function gap(b, bt) {
  const [p, q] = batEnds(bt);
  const ab = { x: q.x - p.x, y: q.y - p.y };
  const t = Math.min(1, Math.max(0, ((b.x - p.x) * ab.x + (b.y - p.y) * ab.y) / (ab.x ** 2 + ab.y ** 2)));
  return Math.hypot(b.x - p.x - ab.x * t, b.y - p.y - ab.y * t);
}

test('ball bounces off the top and bottom walls', () => {
  for (const [y, vy] of [[BALL_RADIUS + 0.01, -SPEED], [FIELD_H - BALL_RADIUS - 0.01, SPEED]]) {
    const world = { ball: ball(8, y, 0, vy), bats: [] };
    assert.deepEqual(types(stepWorld(world, DT)), [EVENT.WALL]);
    assert.equal(world.ball.vy, -vy);
  }
});

test('ball leaving the left edge is a goal for the right team', () => {
  const world = { ball: ball(-BALL_RADIUS + 0.01, 4, -SPEED, 0), bats: [] };
  assert.deepEqual(stepWorld(world, DT), [{ type: EVENT.GOAL, side: TEAM.RIGHT }]);
  const right = { ball: ball(FIELD_W + BALL_RADIUS - 0.01, 4, SPEED, 0), bats: [] };
  assert.deepEqual(stepWorld(right, DT), [{ type: EVENT.GOAL, side: TEAM.LEFT }]);
  assert.deepEqual(stepWorld({ ball: null, bats: [] }, DT), []); // no ball, no goal
});

test('head-on hit reflects about the bat normal', () => {
  const world = { ball: ball(4 + REACH + 0.05, 4.5, -SPEED, 0), bats: [bat('a', 4, 4.5, 0)] };
  assert.ok(types(stepWorld(world, DT)).includes(EVENT.HIT));
  assert.ok(Math.abs(world.ball.vx - SPEED * BALL_HIT_SPEEDUP) < EPS && Math.abs(world.ball.vy) < EPS);
});

test('a 45 degree bat sends the ball off at the reflected angle', () => {
  // dir (-sin a, cos a) at a = -45 degrees runs down-right; the ball coming from the right leaves upward.
  const world = { ball: ball(4 + REACH + 0.05, 4.5, -SPEED, 0), bats: [bat('a', 4, 4.5, -Math.PI / 4)] };
  assert.ok(types(stepWorld(world, DT)).includes(EVENT.HIT));
  assert.ok(Math.abs(world.ball.vx) < EPS);
  assert.ok(Math.abs(world.ball.vy + SPEED * BALL_HIT_SPEEDUP) < EPS);
});

test('a bat swinging into the ball adds speed', () => {
  const still = { ball: ball(4 + REACH + 0.05, 4.5, -SPEED, 0), bats: [bat('a', 4, 4.5, 0)] };
  const moving = { ball: ball(4 + REACH + 0.05, 4.5, -SPEED, 0), bats: [bat('a', 4, 4.5, 0)] };
  moving.bats[0].target.x = 4.3;
  stepWorld(still, DT);
  stepWorld(moving, DT);
  assert.ok(speed(moving.ball) > speed(still.ball) + 1);
  // A fast swing (absolute pad mapping) jumps far in one step but still hits a still ball.
  const fast = { ball: ball(3.2, 4.5, 0, 0), bats: [bat('a', 2, 4.5, 0)] };
  fast.bats[0].target.x = 6;
  assert.ok(types(stepWorld(fast, DT)).includes(EVENT.HIT));
  assert.ok(fast.ball.x >= fast.bats[0].x + REACH - EPS && fast.ball.vx > 0);
});

test('speed never exceeds BALL_MAX', () => {
  for (const tx of [4.3, 7.5]) {
    const world = { ball: ball(4 + REACH + 0.05, 4.5, -BALL_MAX, 0), bats: [bat('a', 4, 4.5, 0)] };
    world.bats[0].target.x = tx;
    assert.ok(types(stepWorld(world, DT)).includes(EVENT.HIT));
    assert.ok(speed(world.ball) <= BALL_MAX + EPS);
  }
});

test('ball at BALL_MAX does not tunnel through a bat in a long step', () => {
  const world = { ball: ball(6, 4.5, -BALL_MAX, 0), bats: [bat('a', 4, 4.5, 0)] };
  assert.ok(types(stepWorld(world, 0.1)).includes(EVENT.HIT));
  assert.ok(world.ball.x > 4 && world.ball.vx > 0);
});

test('ball placed inside a rotating bat is out after one step', () => {
  const world = { ball: ball(4, 4.5, 0, 0), bats: [bat('a', 4, 4.5, 0)] };
  world.bats[0].target.a = 1;
  stepWorld(world, DT);
  assert.ok(gap(world.ball, world.bats[0]) >= REACH - EPS);
  // Exactly on the centre line, moving along the normal (+x): pushed out on the side it came from.
  // The speed is so small that the move leaves x at exactly 4.
  const on = { ball: ball(4, 4.5, 1e-20, 0), bats: [bat('a', 4, 4.5, 0)] };
  assert.ok(types(stepWorld(on, DT)).includes(EVENT.HIT));
  assert.ok(Math.abs(on.ball.x - (4 - REACH)) < EPS && on.ball.vx < 0);
});

test('ball pinned by a bat at the top wall is free within 2 steps', () => {
  const world = { ball: ball(4, 0.1, 0, -SPEED), bats: [bat('a', 4, 0.3, Math.PI / 2)] };
  stepWorld(world, DT);
  stepWorld(world, DT);
  assert.ok(world.ball.y >= BALL_RADIUS - EPS);
  assert.ok(gap(world.ball, world.bats[0]) >= REACH - EPS);
  // A ball skimming the wall into a bat's end comes back the way it came, never through the bat.
  for (const vy of [0, -1]) {
    const skim = { ball: ball(4.5, BALL_RADIUS, -SPEED, vy), bats: [bat('a', 4, 1.2, 0)] };
    for (let i = 0; i < 30; i++) {
      stepWorld(skim, DT);
      assert.ok(skim.ball.x > 4, `vy=${vy} step ${i} x=${skim.ball.x}`);
    }
  }
});

test('overlapping teammates bump: pushed apart and both frozen for BUMP_FREEZE_MS', () => {
  const now = 5000;
  const a = bat('a', 3, 4.5, 0);
  const b = bat('b', 3.1, 4.5, 0);
  const other = bat('c', 12, 4.5, 0, TEAM.RIGHT);
  const world = { ball: ball(8, 1, 0, 0), bats: new Map([['a', a], ['b', b], ['c', other]]), now };
  const events = stepWorld(world, DT);
  assert.deepEqual(events, [{ type: EVENT.BUMP, ids: ['a', 'b'] }]);
  assert.ok(b.x - a.x >= BAT_THICKNESS - EPS);
  assert.equal(a.frozenUntil, now + BUMP_FREEZE_MS);
  assert.equal(b.frozenUntil, now + BUMP_FREEZE_MS);
  assert.equal(other.frozenUntil, undefined);
  // Crossing teammates, a bat swung across a teammate, and bats at the field edge all end apart.
  const cases = [
    [bat('a', 3, 4.5, 0), bat('b', 3, 4.5, Math.PI / 2)],
    [bat('a', 3, 4.5, 0), Object.assign(bat('b', 3.6, 4.5, 0), { target: { x: 2.4, y: 4.5, a: Math.PI / 2 } })],
    [bat('a', 0.125, 4.5, 0), bat('b', 0.2, 4.5, 0)],
  ];
  for (const [p, q] of cases) {
    const w = { ball: null, bats: [p, q], now }; // no ball (outside playing): bats still bump
    assert.ok(types(stepWorld(w, DT)).includes(EVENT.BUMP));
    assert.ok(batGap(p, q) >= BAT_THICKNESS - EPS, `${p.x},${q.x} gap ${batGap(p, q)}`);
    assert.equal(p.frozenUntil, now + BUMP_FREEZE_MS);
  }
  // Four teammates piled on one spot all end apart.
  const pile = [bat('p', 3, 4.5, 0), bat('q', 3.05, 4.5, 0), bat('r', 3.1, 4.6, 0.3), bat('s', 2.95, 4.4, -0.2)];
  stepWorld({ ball: ball(8, 1, 0, 0), bats: pile, now }, DT);
  for (let i = 0; i < pile.length; i++) {
    for (let j = i + 1; j < pile.length; j++) assert.ok(batGap(pile[i], pile[j]) >= BAT_THICKNESS - EPS, `${i},${j}`);
  }
  // The clock advances; the bumped bats hold still while frozen and follow their targets again after.
  assert.equal(world.now, now + DT * MS_PER_S);
  a.target = { x: 1, y: 2, a: 0 };
  b.target = { x: 6, y: 7, a: 0 };
  const held = { x: a.x, y: a.y };
  while (world.now < a.frozenUntil) {
    stepWorld(world, DT);
    if (world.now < a.frozenUntil) assert.deepEqual({ x: a.x, y: a.y }, held);
  }
  for (let i = 0; i < 30; i++) stepWorld(world, DT);
  assert.ok(Math.hypot(a.x - 1, a.y - 2) < 0.01 && Math.hypot(b.x - 6, b.y - 7) < 0.01);
});

test('a frozen bat ignores its target but still deflects the ball', () => {
  const now = 5000;
  const a = bat('a', 4, 4.5, 0);
  a.frozenUntil = now + BUMP_FREEZE_MS;
  a.target = { x: 2, y: 2, a: 1 };
  const world = { ball: ball(4 + REACH + 0.05, 4.5, -SPEED, 0), bats: [a], now };
  assert.ok(types(stepWorld(world, DT)).includes(EVENT.HIT));
  assert.deepEqual([a.x, a.y, a.a], [4, 4.5, 0]);
  assert.ok(world.ball.vx > 0);
  // A free teammate running into a frozen bat: both pushed apart, only the free one freezes anew.
  const still = bat('s', 4, 4.5, 0);
  still.frozenUntil = now + BUMP_FREEZE_MS / 2;
  const runner = Object.assign(bat('r', 5, 4.5, 0), { target: { x: 3, y: 4.5, a: 0 } });
  const w = { ball: ball(8, 1, 0, 0), bats: [still, runner], now };
  const events = stepWorld(w, DT);
  assert.deepEqual(events, [{ type: EVENT.BUMP, ids: ['s', 'r'] }]);
  assert.equal(still.frozenUntil, now + BUMP_FREEZE_MS / 2);
  assert.ok(runner.x > still.x && batGap(still, runner) >= BAT_THICKNESS - EPS);
  assert.equal(runner.frozenUntil, now + BUMP_FREEZE_MS);
  // Two frozen teammates that overlap are pushed apart without a new bump.
  const f1 = Object.assign(bat('f1', 4, 4.5, 0), { frozenUntil: now + BUMP_FREEZE_MS });
  const f2 = Object.assign(bat('f2', 4.1, 4.5, 0), { frozenUntil: now + BUMP_FREEZE_MS });
  assert.deepEqual(stepWorld({ ball: ball(8, 1, 0, 0), bats: [f1, f2], now }, DT), []);
  assert.ok(batGap(f1, f2) >= BAT_THICKNESS - EPS);
});
