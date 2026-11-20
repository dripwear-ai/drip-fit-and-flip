import { describe, expect, it } from "vitest";
import { defaultBody, fitReport, recommendSize, statusForEase } from "./fit";

describe("size recommendation", () => {
  it("picks M for a 98cm chest top", () => {
    expect(recommendSize("top", { ...defaultBody, chest: 98 })).toBe("M");
  });
  it("picks XXL when the chest is above every size", () => {
    expect(recommendSize("top", { ...defaultBody, chest: 125 })).toBe("XXL");
  });
  it("sizes bottoms by the larger of waist and hips", () => {
    expect(recommendSize("bottom", { ...defaultBody, waist: 76, hips: 104 })).toBe("M");
  });
});

describe("fit report", () => {
  it("classifies ease into snug, perfect and relaxed", () => {
    expect(statusForEase(1)).toBe("snug");
    expect(statusForEase(5)).toBe("perfect");
    expect(statusForEase(12)).toBe("relaxed");
  });
  it("an oversized cut reads relaxed on the chest", () => {
    const [chest] = fitReport("top", { ...defaultBody, chest: 94 }, "Oversized");
    expect(chest?.status).toBe("relaxed");
  });
});
