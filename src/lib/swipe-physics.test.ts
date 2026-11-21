import { describe, expect, it } from "vitest";
import { decideSwipe, tiltFor } from "./swipe-physics";

const still = { x: 0, y: 0 };

describe("swipe decision", () => {
  it("drag far right saves (right)", () => {
    expect(decideSwipe({ offset: { x: 140, y: 10 }, velocity: still, allowUp: true })).toBe("right");
  });
  it("drag far left skips (left)", () => {
    expect(decideSwipe({ offset: { x: -140, y: 0 }, velocity: still, allowUp: true })).toBe("left");
  });
  it("a fast short flick right still dismisses", () => {
    expect(decideSwipe({ offset: { x: 50, y: 0 }, velocity: { x: 900, y: 0 }, allowUp: true })).toBe("right");
  });
  it("a slow short drag springs back", () => {
    expect(decideSwipe({ offset: { x: 60, y: 0 }, velocity: { x: 100, y: 0 }, allowUp: true })).toBeNull();
  });
  it("drag up switches brand only when allowed", () => {
    expect(decideSwipe({ offset: { x: 10, y: -150 }, velocity: still, allowUp: true })).toBe("up");
    expect(decideSwipe({ offset: { x: 10, y: -150 }, velocity: still, allowUp: false })).toBeNull();
  });
});

describe("tilt", () => {
  it("is proportional to drag and capped", () => {
    expect(tiltFor(0)).toBe(0);
    expect(tiltFor(180, 360)).toBe(11);
    expect(tiltFor(5000, 360)).toBe(24);
  });
});
