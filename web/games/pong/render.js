// Canvas drawing of the field, bats, ball and match text, stretched to the canvas width with the device-pixel ratio capped.
import { batEnds } from './bat.js';
import { frozen } from './bumps.js';
import {
  FIELD_W, FIELD_H, BAT_THICKNESS, DPR_MAX, FIELD_COLOR, LINE_COLOR, LINE_WIDTH, MIDLINE_DASH, BALL_RADIUS,
  HUD, S_PER_MIN, CLOCK_SECONDS_DIGITS, TEAM, TEAMS, BUMP_BLINK_MS, GOAL_TOP, GOAL_BOTTOM, BAT_NAME,
} from '../../shared/constants.js';

/**
 * Matches the canvas buffer to its CSS size (DPR capped) and returns the field-to-pixel transform:
 * sx stretches the field edge to edge, sy fits its height (centred), so a wide screen has no side bars;
 * family is the page's font, read here once rather than every frame.
 */
export function fit(canvas) {
  const dpr = Math.min(window.devicePixelRatio || 1, DPR_MAX);
  canvas.width = Math.round(canvas.clientWidth * dpr);
  canvas.height = Math.round(canvas.clientHeight * dpr);
  const sx = canvas.width / FIELD_W;
  const sy = Math.min(sx, canvas.height / FIELD_H);
  return { sx, sy, y: (canvas.height - FIELD_H * sy) / 2, family: getComputedStyle(canvas).fontFamily };
}

/**
 * now: the world's clock (ms), for the frozen bats' blink.
 * hud: null (lobby) or {score, timeLeft (s or null), label ({text, size, color} or null), grow ({team: extra size share}),
 *   scorers ({team: [line]} or null)}.
 */
export function draw(ctx, view, bats, ball, hud, now) {
  const { canvas } = ctx;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = FIELD_COLOR;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.setTransform(view.sx, 0, 0, view.sy, 0, view.y);

  ctx.strokeStyle = LINE_COLOR;
  ctx.lineWidth = LINE_WIDTH;
  ctx.setLineDash([]);
  const e = LINE_WIDTH / 2; // lines sit just inside the field edge
  ctx.beginPath();
  for (const y of [e, FIELD_H - e]) {
    ctx.moveTo(0, y);
    ctx.lineTo(FIELD_W, y);
  }
  for (const x of [e, FIELD_W - e]) { // end walls, open across the goal mouth
    ctx.moveTo(x, 0);
    ctx.lineTo(x, GOAL_TOP);
    ctx.moveTo(x, GOAL_BOTTOM);
    ctx.lineTo(x, FIELD_H);
  }
  ctx.stroke();
  ctx.setLineDash(MIDLINE_DASH);
  ctx.beginPath();
  ctx.moveTo(FIELD_W / 2, 0);
  ctx.lineTo(FIELD_W / 2, FIELD_H);
  ctx.stroke();

  ctx.setLineDash([]);
  ctx.lineCap = 'round';
  ctx.lineWidth = BAT_THICKNESS;
  for (const bat of bats) {
    const [a, b] = batEnds(bat);
    const blink = frozen(bat, now) && Math.floor((bat.frozenUntil - now) / BUMP_BLINK_MS) % 2 === 1;
    ctx.strokeStyle = blink ? LINE_COLOR : bat.color;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
    if (bat.name) drawName(ctx, view, bat, a, b);
  }

  if (ball) {
    ctx.fillStyle = LINE_COLOR;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, BALL_RADIUS, 0, 2 * Math.PI);
    ctx.fill();
  }
  if (hud) drawHud(ctx, view, hud);
}

const font = (px, family) => `bold ${Math.round(px)}px ${family}`;
const toPx = (view, x, y) => [x * view.sx, view.y + y * view.sy]; // a field point in canvas pixels

// The name along the bat in canvas pixels, kept upright, narrowed to fit its length.
function drawName(ctx, view, bat, a, b) {
  const dx = (b.x - a.x) * view.sx; // the bat end to end on screen, under the stretch
  const dy = (b.y - a.y) * view.sy;
  const turn = Math.atan2(dy, dx);
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, ...toPx(view, bat.x, bat.y));
  ctx.rotate(turn - Math.round(turn / Math.PI) * Math.PI); // the same line, turned to read upright
  ctx.font = font(BAT_THICKNESS * view.sy * BAT_NAME.SIZE, view.family);
  ctx.fillStyle = BAT_NAME.COLOR;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(bat.name, 0, 0, Math.hypot(dx, dy) * BAT_NAME.FILL);
  ctx.restore();
}

function clock(seconds) {
  const s = Math.ceil(seconds);
  return `${Math.floor(s / S_PER_MIN)}:${String(s % S_PER_MIN).padStart(CLOCK_SECONDS_DIGITS, '0')}`;
}

// Text in canvas pixels (fractional font sizes under the field transform render poorly), in the page's font,
// sized by the height scale so the stretch never widens it.
function drawHud(ctx, view, { score, timeLeft, label, grow, scorers }) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = LINE_COLOR;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const text = (str, y, size, backed, dx = 0) => {
    const px = Math.round(size * view.sy);
    const [cx, cy] = toPx(view, FIELD_W / 2 + dx, y);
    ctx.font = font(px, view.family);
    if (backed) { // a field-coloured outline keeps the midline off the centre label
      ctx.save();
      ctx.strokeStyle = FIELD_COLOR;
      ctx.lineWidth = px * HUD.LABEL_OUTLINE;
      ctx.lineJoin = 'round';
      ctx.strokeText(str, cx, cy);
      ctx.restore();
    }
    ctx.fillText(str, cx, cy);
  };
  for (const team of TEAMS) {
    const side = team === TEAM.LEFT ? -1 : 1;
    text(String(score[team]), HUD.SCORE_Y, HUD.SCORE_SIZE * (1 + grow[team]), false, side * HUD.SCORE_GAP);
    // The end screen's scorers, centred in the team's half under the winner line.
    if (scorers) scorers[team].forEach((line, i) => text(line, HUD.SCORERS_Y + i * HUD.SCORERS_GAP, HUD.SCORERS_SIZE, true, side * FIELD_W / 4));
  }
  if (timeLeft !== null) text(clock(timeLeft), HUD.CLOCK_Y, HUD.CLOCK_SIZE);
  if (label) {
    ctx.fillStyle = label.color;
    text(label.text, FIELD_H / 2, label.size, true);
  }
}
