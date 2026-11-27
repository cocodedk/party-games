// Pure touch-pad math: finger position -> bat target {x, y, a}.
// x, y are the touch over the pad size (0..1); a turns by the signed angle between
// successive movement directions, so a straight drag keeps a and a circle adds about 2 pi.
import { PAD_MIN_MOVE } from '../shared/constants.js';

const unit = (v) => Math.min(1, Math.max(0, v));

export function createPad() {
  let a = 0;
  let anchor = null; // last point that started a counted segment
  let dir = null; // direction of the last counted segment

  const pose = (px, py, w, h) => ({ x: unit(px / w), y: unit(py / h), a });

  return {
    down(px, py, w, h) {
      anchor = { x: px, y: py };
      dir = null;
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
      return pose(px, py, w, h);
    },
    up() {
      anchor = null;
      dir = null;
    },
  };
}
