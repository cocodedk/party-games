import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createPad } from '../web/phone/pad.js';
import { TAP } from '../web/shared/constants.js';

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

test('a tap moves the bat there and stands it upright; a double tap lays it flat, each by the smaller turn', () => {
  const pad = createPad();
  pad.down(100, 100, W, H, 0); // a right-angle drag turns it a quarter turn
  pad.move(200, 100, W, H);
  pad.move(200, 200, W, H);
  assert.equal(pad.up(1000), null); // a drag is no tap
  const turned = pad.move(200, 200, W, H).a;
  assert.ok(Math.abs(turned - Math.PI / 2) < 1e-9);
  pad.down(40, 80, W, H, 2000);
  assert.equal(pad.up(2000 + TAP.MS), Math.PI); // pi/2 is as near 0 as pi; it rounds to pi, the same line
  pad.down(40, 80, W, H, 2100 + TAP.MS);
  assert.equal(pad.up(2100 + TAP.MS + 50), Math.PI + TAP.FLAT);
  // A third tap right after is a fresh single tap; a slow touch, a far wiggle or a cancel is not a tap.
  pad.down(40, 80, W, H, 2400 + TAP.MS);
  assert.equal(pad.up(2450 + TAP.MS), 2 * Math.PI);
  assert.deepEqual(pad.move(40, 80, W, H), { x: 40 / W, y: 80 / H, a: 2 * Math.PI }); // the pad keeps the snapped angle
  pad.up();
  pad.down(40, 80, W, H, 5000);
  assert.equal(pad.up(5001 + TAP.MS), null);
  pad.down(40, 80, W, H, 6000);
  pad.move(40 + TAP.MOVE_PX + 1, 80, W, H);
  pad.move(40, 80, W, H);
  assert.equal(pad.up(6050), null);
  pad.down(40, 80, W, H, 7000);
  assert.equal(pad.up(7010, true), null);
});

test('two taps too far apart are two upright taps', () => {
  const pad = createPad();
  pad.down(10, 10, W, H, 0);
  assert.equal(pad.up(10), TAP.UPRIGHT);
  pad.down(10, 10, W, H, 20 + TAP.DOUBLE_MS);
  assert.equal(pad.up(30 + TAP.DOUBLE_MS), TAP.UPRIGHT);
});
