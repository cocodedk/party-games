// Canvas drawing of the field and bats, scaled to fit the canvas with the device-pixel ratio capped.
import { batEnds } from './bat.js';
import {
  FIELD_W, FIELD_H, BAT_THICKNESS, DPR_MAX, FIELD_COLOR, LINE_COLOR, LINE_WIDTH, MIDLINE_DASH,
} from '../../shared/constants.js';

/** Matches the canvas buffer to its CSS size (DPR capped) and returns the field-to-pixel transform. */
export function fit(canvas) {
  const dpr = Math.min(window.devicePixelRatio || 1, DPR_MAX);
  canvas.width = Math.round(canvas.clientWidth * dpr);
  canvas.height = Math.round(canvas.clientHeight * dpr);
  const scale = Math.min(canvas.width / FIELD_W, canvas.height / FIELD_H);
  return { scale, x: (canvas.width - FIELD_W * scale) / 2, y: (canvas.height - FIELD_H * scale) / 2 };
}

export function draw(ctx, view, bats) {
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
    ctx.strokeStyle = bat.color;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }
}
