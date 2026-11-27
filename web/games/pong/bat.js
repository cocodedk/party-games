// Bat pose, easing toward the phone's target, and the clamp that keeps the whole
// rotated bat inside its team's half. dt is in seconds; velocities are per second.
import {
  TEAM, FIELD_W, FIELD_H, BAT_LENGTH, BAT_THICKNESS, BAT_EASE_MS, BAT_EASE_REACHED, MS_PER_S,
} from '../../shared/constants.js';

const HALF_W = FIELD_W / 2;
const EASE_RATE = -Math.log(1 - BAT_EASE_REACHED) / (BAT_EASE_MS / MS_PER_S);

const left = (team) => (team === TEAM.LEFT ? 0 : HALF_W);
const dirOf = (a) => ({ x: -Math.sin(a), y: Math.cos(a) });

export function clamp(bat) {
  const d = dirOf(bat.a);
  const ex = Math.abs(d.x) * BAT_LENGTH / 2 + BAT_THICKNESS / 2;
  const ey = Math.abs(d.y) * BAT_LENGTH / 2 + BAT_THICKNESS / 2;
  const x0 = left(bat.team);
  bat.x = Math.min(x0 + HALF_W - ex, Math.max(x0 + ex, bat.x));
  bat.y = Math.min(FIELD_H - ey, Math.max(ey, bat.y));
}

export function createBat({ id, team, color }) {
  const x = left(team) + HALF_W / 2;
  const y = FIELD_H / 2;
  return { id, team, color, x, y, a: 0, vx: 0, vy: 0, va: 0, target: { x, y, a: 0 } };
}

// target: pad pose, x and y 0..1 across the team's half.
export function setTarget(bat, { x, y, a }) {
  bat.target = { x: left(bat.team) + x * HALF_W, y: y * FIELD_H, a };
}

export function stepBat(bat, dt) {
  const k = 1 - Math.exp(-EASE_RATE * dt);
  const { x, y, a } = bat;
  bat.x += (bat.target.x - x) * k;
  bat.y += (bat.target.y - y) * k;
  bat.a += (bat.target.a - a) * k;
  clamp(bat);
  bat.vx = (bat.x - x) / dt;
  bat.vy = (bat.y - y) / dt;
  bat.va = (bat.a - a) / dt;
}

export function batEnds(bat) {
  const d = dirOf(bat.a);
  const h = BAT_LENGTH / 2;
  return [{ x: bat.x - d.x * h, y: bat.y - d.y * h }, { x: bat.x + d.x * h, y: bat.y + d.y * h }];
}
