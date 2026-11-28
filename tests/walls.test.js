// The ball against the field's walls and goal mouths.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createBall, stepWorld } from '../web/games/pong/physics.js';
import { TEAM, FIELD_W, FIELD_H, BALL_RADIUS, EVENT, GOAL_TOP, GOAL_BOTTOM } from '../web/shared/constants.js';

const DT = 1 / 60;
const SPEED = 8;
const ball = (x, y, vx, vy) => Object.assign(createBall(), { x, y, vx, vy });
const types = (events) => events.map((e) => e.type);

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

test('an end wall outside the goal mouth bounces the ball back', () => {
  const above = GOAL_TOP - 0.01;
  const below = GOAL_BOTTOM + 0.01;
  for (const [x, y, vx] of [[BALL_RADIUS + 0.01, above, -SPEED], [FIELD_W - BALL_RADIUS - 0.01, below, SPEED]]) {
    const world = { ball: ball(x, y, vx, 0), bats: [] };
    assert.deepEqual(types(stepWorld(world, DT)), [EVENT.WALL]);
    assert.equal(world.ball.vx, -vx);
  }
  // A ball already past the line outside the mouth (a bat squeezed it there) is pushed back in, no goal.
  const squeezed = { ball: ball(-BALL_RADIUS - 0.1, above, -SPEED, 0), bats: [] };
  assert.deepEqual(types(stepWorld(squeezed, DT)), [EVENT.WALL]);
  assert.ok(squeezed.ball.x >= BALL_RADIUS && squeezed.ball.vx > 0);
  // Into a corner: both walls bounce it, with one bleep.
  const corner = { ball: ball(BALL_RADIUS + 0.01, BALL_RADIUS + 0.01, -SPEED, -SPEED), bats: [] };
  assert.deepEqual(types(stepWorld(corner, DT)), [EVENT.WALL]);
  assert.ok(corner.ball.vx > 0 && corner.ball.vy > 0);
  // Just inside the mouth at its top and bottom edges the ball still scores.
  for (const y of [GOAL_TOP, GOAL_BOTTOM]) {
    assert.deepEqual(stepWorld({ ball: ball(-BALL_RADIUS + 0.01, y, -SPEED, 0), bats: [] }, DT), [{ type: EVENT.GOAL, side: TEAM.RIGHT }]);
  }
});
