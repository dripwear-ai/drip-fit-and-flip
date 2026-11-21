export type SwipeDir = "left" | "right" | "up";

/** Distance (px) or flick speed (px/s) that commits a swipe. */
export const SWIPE_DISTANCE = 110;
export const SWIPE_VELOCITY = 650;
/** A flick must still travel this far so a tap-jitter never dismisses a card. */
export const MIN_FLICK_DISTANCE = 30;

type Vec = { x: number; y: number };

/** Decide what a released drag means: a committed direction, or null to spring back. */
export function decideSwipe({ offset, velocity, allowUp }: { offset: Vec; velocity: Vec; allowUp: boolean }): SwipeDir | null {
  const ax = Math.abs(offset.x);
  const ay = Math.abs(offset.y);
  if (allowUp && offset.y < 0 && ay > ax) {
    if (-offset.y > SWIPE_DISTANCE) return "up";
    if (velocity.y < -SWIPE_VELOCITY && -offset.y > MIN_FLICK_DISTANCE) return "up";
  }
  if (offset.x > SWIPE_DISTANCE || (velocity.x > SWIPE_VELOCITY && offset.x > MIN_FLICK_DISTANCE)) return "right";
  if (offset.x < -SWIPE_DISTANCE || (velocity.x < -SWIPE_VELOCITY && offset.x < -MIN_FLICK_DISTANCE)) return "left";
  return null;
}

/** Card tilt in degrees, proportional to horizontal drag and capped. */
export const tiltFor = (x: number, width = 360) => Math.max(-24, Math.min(24, (x / width) * 22));

export function haptic(pattern: number | number[]) {
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return;
  try {
    navigator.vibrate(pattern);
  } catch {
    /* some browsers throw when not triggered by a gesture */
  }
}
