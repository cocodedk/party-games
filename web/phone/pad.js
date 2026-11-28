// Pure touch-pad math: finger position -> bat target {x, y, a}.
// x, y are the touch over the pad size (0..1); a turns by the signed angle between
// successive movement directions, so a straight drag keeps a and a circle adds about 2 pi.
// A quick tap stands the bat upright and a double tap lays it flat, each by the smaller turn.
import { PAD_MIN_MOVE, TAP } from '../shared/constants.js';
import { unit } from '../shared/unit.js';

// A bat turned half a turn is the same line, so snap to the nearest angle of that line.
const nearest = (a, to) => to + Math.round((a - to) / Math.PI) * Math.PI;

export function createPad() {
  let a = 0;
  let anchor = null; // last point that started a counted segment
  let dir = null; // direction of the last counted segment
  let press = null; // the touch so far: where and when (ms) it began, and whether it moved too far for a tap
  let tapAt = -Infinity; // when the last single tap ended (ms)

  const pose = (px, py, w, h) => ({ x: unit(px / w), y: unit(py / h), a });

  return {
    down(px, py, w, h, now) {
      anchor = { x: px, y: py };
      dir = null;
      press = { x: px, y: py, now, moved: false };
      return pose(px, py, w, h);
    },
    move(px, py, w, h) {
      if (!anchor) anchor = { x: px, y: py };
      const dx = px - anchor.x;
      const dy = py - anchor.y;
      if (Math.hypot(dx, dy) >= PAD_MIN_MOVE) {
        if (dir) a += Math.atan2(dir.x * dy - dir.y * dx, dir.x * dx + dir.y * dy);
        dir = { x: dx, y: dy };
        anchor = { x: px, y: py };
      }
      if (press && Math.hypot(px - press.x, py - press.y) > TAP.MOVE_PX) press.moved = true;
      return pose(px, py, w, h);
    },
    /** now: ms. Returns the new angle when the touch was a tap, else null; a cancelled touch is never a tap. */
    up(now, cancelled = false) {
      anchor = null;
      dir = null;
      const tap = !cancelled && press !== null && !press.moved && now - press.now <= TAP.MS;
      press = null;
      if (!tap) {
        tapAt = -Infinity;
        return null;
      }
      const double = now - tapAt <= TAP.DOUBLE_MS;
      a = nearest(a, double ? TAP.FLAT : TAP.UPRIGHT);
      tapAt = double ? -Infinity : now;
      return a;
    },
  };
}
