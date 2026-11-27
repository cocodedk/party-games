// Ball step with wall, goal and bat collisions; teammate bumps live in bumps.js.
// world = { ball, bats (array or Map), now (ms) }; stepWorld advances now by dt.
// Bats and ball move together in substeps, each moving at most half a bat thickness.
import {
  TEAM, FIELD_W, FIELD_H, BAT_LENGTH, BAT_THICKNESS, MS_PER_S, BALL_RADIUS, BALL_MAX,
  BALL_HIT_SPEEDUP, BAT_SWING_SHARE, WALL_FREE_STEPS, EVENT,
} from '../../shared/constants.js';
import { stepBat, batEnds, clamp } from './bat.js';
import { sub, dot, len, unit, closest } from './geom.js';
import { bump, frozen } from './bumps.js';

const MAX_SUBSTEP = BAT_THICKNESS / 2;
const REACH = BALL_RADIUS + BAT_THICKNESS / 2; // ball centre to bat centre line at contact

const inField = (y) => Math.min(FIELD_H - BALL_RADIUS, Math.max(BALL_RADIUS, y));
const gapAt = (p, ends) => len(sub(p, closest(p, ends)));

export function createBall() {
  return { x: FIELD_W / 2, y: FIELD_H / 2, vx: 0, vy: 0 };
}

function limit(v) {
  const s = len(v);
  return s > BALL_MAX ? { x: v.x * BALL_MAX / s, y: v.y * BALL_MAX / s } : v;
}

// A ball pinned between a bat and the wall slides along the wall, away from the bat, until free.
function freeAlongWall(ball, ends, dirX, y) {
  ball.y = y;
  if (gapAt(ball, ends) >= REACH) return;
  const s = Math.sign(dirX || ball.vx) || 1;
  let lo = ball.x;
  let hi = ball.x + s * (BAT_LENGTH + 2 * REACH);
  for (let i = 0; i < WALL_FREE_STEPS; i++) {
    const mid = (lo + hi) / 2;
    if (gapAt({ x: mid, y }, ends) < REACH) lo = mid;
    else hi = mid;
  }
  ball.x = hi;
}

// Pushes the ball out of the bat; reflects it on the first contact per step when moving into it.
function collideBat(ball, bat, hit, events) {
  const ends = batEnds(bat);
  let p = closest(ball, ends);
  const d = len(sub(ball, p));
  if (d >= REACH) return;
  let n = d > 0 ? unit(sub(ball, p)) : { x: Math.cos(bat.a), y: Math.sin(bat.a) };
  if (d === 0 && dot({ x: ball.vx, y: ball.vy }, n) > 0) n = { x: -n.x, y: -n.y };
  const y = p.y + n.y * REACH;
  if (y !== inField(y)) {
    freeAlongWall(ball, ends, n.x, inField(y));
    p = closest(ball, ends);
    n = unit(sub(ball, p));
  } else {
    ball.x = p.x + n.x * REACH;
    ball.y = y;
  }
  if (hit.has(bat)) return;
  const vb = { x: bat.vx - bat.va * (p.y - bat.y), y: bat.vy + bat.va * (p.x - bat.x) };
  const v = { x: ball.vx, y: ball.vy };
  if (dot(sub(v, vb), n) >= 0) return;
  const k = 2 * dot(v, n);
  let out = {
    x: (v.x - k * n.x) * BALL_HIT_SPEEDUP + vb.x * BAT_SWING_SHARE,
    y: (v.y - k * n.y) * BALL_HIT_SPEEDUP + vb.y * BAT_SWING_SHARE,
  };
  const lag = dot(vb, n) - dot(out, n); // the ball leaves at least as fast as the bat comes
  if (lag > 0) out = { x: out.x + lag * n.x, y: out.y + lag * n.y };
  out = limit(out);
  ball.vx = out.x;
  ball.vy = out.y;
  hit.add(bat);
  events.push({ type: EVENT.HIT });
}

function collideWalls(ball, events) {
  const y = inField(ball.y);
  if (y === ball.y) return;
  ball.vy = y > ball.y ? Math.abs(ball.vy) : -Math.abs(ball.vy);
  ball.y = y;
  events.push({ type: EVENT.WALL });
}

function goalSide(ball) {
  if (ball.x + BALL_RADIUS < 0) return TEAM.RIGHT;
  if (ball.x - BALL_RADIUS > FIELD_W) return TEAM.LEFT;
  return null;
}

// The pose change this step: frozen bats ignore their target.
function plan(bat, dt, now) {
  if (frozen(bat, now)) {
    bat.vx = bat.vy = bat.va = 0;
    return { x: 0, y: 0, a: 0 };
  }
  const start = { x: bat.x, y: bat.y, a: bat.a };
  stepBat(bat, dt);
  const move = { x: bat.x - start.x, y: bat.y - start.y, a: bat.a - start.a };
  Object.assign(bat, start);
  return move;
}

export function stepWorld(world, dt) {
  const events = [];
  const now = world.now || 0;
  world.now = now + dt * MS_PER_S;
  const bats = [...world.bats.values()];
  const moves = bats.map((bat) => plan(bat, dt, now));
  const farthest = Math.max(BALL_MAX * dt, ...moves.map((m) => len(m) + Math.abs(m.a) * BAT_LENGTH / 2));
  const n = Math.max(1, Math.ceil(farthest / MAX_SUBSTEP));
  const { ball } = world;
  const hit = new Set();
  let scored = false;
  for (let i = 0; i < n; i++) {
    bats.forEach((bat, j) => {
      if (frozen(bat, now)) return;
      bat.x += moves[j].x / n;
      bat.y += moves[j].y / n;
      bat.a += moves[j].a / n;
      clamp(bat);
    });
    bump(bats, now, events);
    if (scored) continue;
    ball.x += ball.vx * dt / n;
    ball.y += ball.vy * dt / n;
    collideWalls(ball, events);
    for (const bat of bats) collideBat(ball, bat, hit, events);
    const side = goalSide(ball);
    if (side) {
      events.push({ type: EVENT.GOAL, side });
      scored = true;
    }
  }
  return events;
}
