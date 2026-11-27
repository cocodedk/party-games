// Canvas drawing of the field, bats, ball and match text, scaled to fit the canvas with the device-pixel ratio capped.
import { batEnds } from './bat.js';
import { frozen } from './bumps.js';
import {
  FIELD_W, FIELD_H, BAT_THICKNESS, DPR_MAX, FIELD_COLOR, LINE_COLOR, LINE_WIDTH, MIDLINE_DASH, BALL_RADIUS,
  HUD, S_PER_MIN, CLOCK_SECONDS_DIGITS, TEAM, TEAMS, BUMP_BLINK_MS,
} from '../../shared/constants.js';

/** Matches the canvas buffer to its CSS size (DPR capped) and returns the field-to-pixel transform. */
export function fit(canvas) {
  const dpr = Math.min(window.devicePixelRatio || 1, DPR_MAX);
  canvas.width = Math.round(canvas.clientWidth * dpr);
  canvas.height = Math.round(canvas.clientHeight * dpr);
  const scale = Math.min(canvas.width / FIELD_W, canvas.height / FIELD_H);
  return { scale, x: (canvas.width - FIELD_W * scale) / 2, y: (canvas.height - FIELD_H * scale) / 2 };
}

/**
 * now: the world's clock (ms), for the frozen bats' blink.
 * hud: null (lobby) or {score, timeLeft (s or null), label ({text, size, color} or null), grow ({team: extra size share})}.
 */
export function draw(ctx, view, bats, ball, hud, now) {
  const { canvas } = ctx;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = FIELD_COLOR;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.setTransform(view.scale, 0, 0, view.scale, view.x, view.y);

  ctx.strokeStyle = LINE_COLOR;
  ctx.lineWidth = LINE_WIDTH;
  ctx.setLineDash([]);
  ctx.strokeRect(LINE_WIDTH / 2, LINE_WIDTH / 2, FIELD_W - LINE_WIDTH, FIELD_H - LINE_WIDTH);
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
  }

  if (ball) {
    ctx.fillStyle = LINE_COLOR;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, BALL_RADIUS, 0, 2 * Math.PI);
    ctx.fill();
  }
  if (hud) drawHud(ctx, view, hud);
}

function clock(seconds) {
  const s = Math.ceil(seconds);
  return `${Math.floor(s / S_PER_MIN)}:${String(s % S_PER_MIN).padStart(CLOCK_SECONDS_DIGITS, '0')}`;
}

// Text in canvas pixels (fractional font sizes under the field transform render poorly), in the page's font.
function drawHud(ctx, view, { score, timeLeft, label, grow }) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = LINE_COLOR;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const text = (str, y, size, backed, dx = 0) => {
    const px = Math.round(size * view.scale);
    const [cx, cy] = [view.x + (FIELD_W / 2 + dx) * view.scale, view.y + y * view.scale];
    ctx.font = `bold ${px}px ${getComputedStyle(ctx.canvas).fontFamily}`;
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
  }
  if (timeLeft !== null) text(clock(timeLeft), HUD.CLOCK_Y, HUD.CLOCK_SIZE);
  if (label) {
    ctx.fillStyle = label.color;
    text(label.text, FIELD_H / 2, label.size, true);
  }
}
