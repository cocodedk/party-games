// Clamps a number to 0..1: the pad's pose and the move_bat tool share it.
export const unit = (v) => Math.min(1, Math.max(0, v));
