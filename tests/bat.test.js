import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createBat, setTarget, stepBat, batEnds } from '../web/games/pong/bat.js';
import { TEAM, FIELD_W, FIELD_H, BAT_THICKNESS, BAT_EASE_MS, BAT_EASE_REACHED, MS_PER_S } from '../web/shared/constants.js';

const DT = 1 / 60;
const STEPS = 120;

test('target x=1 keeps the whole left bat left of the centre line, also rotated 90 degrees', () => {
  for (const a of [0, Math.PI / 2]) {
    const bat = createBat({ id: 'p1', team: TEAM.LEFT, color: '#fff' });
    setTarget(bat, { x: 1, y: 1, a });
    for (let i = 0; i < STEPS; i++) stepBat(bat, DT);
    for (const p of batEnds(bat)) {
      assert.ok(p.x + BAT_THICKNESS / 2 <= FIELD_W / 2 + 1e-9, `a=${a} x=${p.x}`);
      assert.ok(p.y + BAT_THICKNESS / 2 <= FIELD_H + 1e-9, `a=${a} y=${p.y}`);
    }
    assert.ok(Math.abs(bat.a - a) < 1e-6);
  }
});

test('easing reaches 95% of the target within BAT_EASE_MS and tracks velocity', () => {
  const bat = createBat({ id: 'p2', team: TEAM.RIGHT, color: '#fff' });
  const start = { x: bat.x, y: bat.y, a: bat.a };
  setTarget(bat, { x: 0.25, y: 0.25, a: 1 });
  const goal = { ...bat.target };
  const steps = 8;
  for (let i = 0; i < steps; i++) stepBat(bat, BAT_EASE_MS / MS_PER_S / steps);
  for (const k of ['x', 'y', 'a']) {
    assert.ok((bat[k] - start[k]) / (goal[k] - start[k]) >= BAT_EASE_REACHED - 1e-9, k);
  }
  assert.ok(bat.x > FIELD_W / 2);
  assert.ok(bat.vx < 0 && bat.vy < 0 && bat.va > 0);
});
