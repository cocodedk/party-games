// Teammate bumps: overlapping teammates are pushed apart; the ones that were free freeze.
import { BAT_THICKNESS, BUMP_FREEZE_MS, BUMP_SEPARATE_TRIES, EVENT } from '../../shared/constants.js';
import { batEnds, clamp } from './bat.js';
import { sub, dot, len, unit, cross, closest } from './geom.js';

// A frozen bat ignores its target; separation can still move it.
export const frozen = (bat, now) => now < (bat.frozenUntil || 0);

// Distance between two bats' centre lines and the direction from a to b (0 when they cross).
function contact(a, b) {
  const [A, B] = [batEnds(a), batEnds(b)];
  if (cross(A[0], A[1], B[0]) * cross(A[0], A[1], B[1]) < 0
    && cross(B[0], B[1], A[0]) * cross(B[0], B[1], A[1]) < 0) return { d: 0, dir: unit(sub(b, a)) };
  const v = [
    [A[0], closest(A[0], B)], [A[1], closest(A[1], B)],
    [closest(B[0], A), B[0]], [closest(B[1], A), B[1]],
  ].map(([p, q]) => sub(q, p)).reduce((m, q) => (len(q) < len(m) ? q : m));
  return { d: len(v), dir: len(v) > 0 ? unit(v) : unit(sub(b, a)) };
}

// Moves the bat along dir, clamped to its half; returns how far it really went.
function shift(bat, dir, amount) {
  const { x, y } = bat;
  bat.x += dir.x * amount;
  bat.y += dir.y * amount;
  clamp(bat);
  return dot(sub(bat, { x, y }), dir) * Math.sign(amount);
}

// Relaxes every overlapping teammate pair for a few rounds: each pair is pushed apart,
// half each, and the second bat takes whatever the first could not move (field edge).
export function bump(bats, now, events) {
  const wasFrozen = new Set(bats.filter((bat) => frozen(bat, now)));
  const touched = new Map();
  for (let round = 0; round < BUMP_SEPARATE_TRIES; round++) {
    let overlap = false;
    for (let i = 0; i < bats.length; i++) {
      for (let j = i + 1; j < bats.length; j++) {
        const [a, b] = [bats[i], bats[j]];
        if (a.team !== b.team) continue;
        const { d, dir } = contact(a, b);
        if (d >= BAT_THICKNESS) continue;
        overlap = true;
        touched.set(`${i},${j}`, [a, b]);
        const need = BAT_THICKNESS - d;
        shift(b, dir, need - shift(a, dir, -need / 2));
      }
    }
    if (!overlap) break;
  }
  for (const [a, b] of touched.values()) {
    if (wasFrozen.has(a) && wasFrozen.has(b)) continue;
    for (const bat of [a, b]) {
      if (wasFrozen.has(bat)) continue;
      bat.frozenUntil = now + BUMP_FREEZE_MS;
      bat.vx = bat.vy = bat.va = 0;
    }
    events.push({ type: EVENT.BUMP, ids: [a.id, b.id] });
  }
}
