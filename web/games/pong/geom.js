// 2D vector helpers shared by the ball and bump physics.
export const sub = (p, q) => ({ x: p.x - q.x, y: p.y - q.y });
export const dot = (p, q) => p.x * q.x + p.y * q.y;
export const len = (p) => Math.hypot(p.x, p.y);
export const unit = (p) => (len(p) > 0 ? { x: p.x / len(p), y: p.y / len(p) } : { x: 0, y: 1 });
export const cross = (o, p, q) => (p.x - o.x) * (q.y - o.y) - (p.y - o.y) * (q.x - o.x);

// Point of segment [a, b] closest to p.
export function closest(p, [a, b]) {
  const ab = sub(b, a);
  const t = Math.min(1, Math.max(0, dot(sub(p, a), ab) / dot(ab, ab)));
  return { x: a.x + ab.x * t, y: a.y + ab.y * t };
}
