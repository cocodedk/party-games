import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createPad } from '../web/phone/pad.js';

const W = 400;
const H = 800;
const R = 100;
const POINTS = 32;
const TOLERANCE = 0.2;
const JITTER = 0.5;

function circle(sign) {
  const pad = createPad();
  const at = (i) => [W / 2 + R * Math.cos((sign * 2 * Math.PI * i) / POINTS), H / 2 + R * Math.sin((sign * 2 * Math.PI * i) / POINTS)];
  pad.down(...at(0), W, H);
  let pose;
  for (let i = 1; i <= POINTS; i++) pose = pad.move(...at(i), W, H);
  return pose.a;
}

test('a straight drag moves without turning and maps to 0..1', () => {
  const pad = createPad();
  pad.down(0, 0, W, H);
  let pose;
  for (let i = 1; i <= 10; i++) pose = pad.move(i * 40, i * 80, W, H);
  assert.equal(pose.a, 0);
  assert.deepEqual([pose.x, pose.y], [1, 1]);
});

test('a clockwise circle of 32 points turns about +2 pi', () => {
  assert.ok(Math.abs(circle(1) - 2 * Math.PI) <= TOLERANCE, String(circle(1)));
});

test('an anticlockwise circle turns about -2 pi', () => {
  assert.ok(Math.abs(circle(-1) + 2 * Math.PI) <= TOLERANCE, String(circle(-1)));
});

test('0.5 px jitter does not turn, and lifting keeps the angle', () => {
  const pad = createPad();
  pad.down(100, 100, W, H);
  let pose;
  for (let i = 0; i < 20; i++) pose = pad.move(100 + (i % 2) * JITTER, 100 + ((i >> 1) % 2) * JITTER, W, H);
  assert.equal(pose.a, 0);
  pad.move(200, 100, W, H);
  pad.move(200, 200, W, H);
  pad.up();
  const after = pad.move(300, 300, W, H);
  assert.ok(Math.abs(after.a - Math.PI / 2) < 1e-9);
});
