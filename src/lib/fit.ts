/** Body measurements in cm / kg. Pure logic shared by the 3D twin and the fit report. */
export type Body = {
  height: number;
  weight: number;
  chest: number;
  waist: number;
  hips: number;
  shoulder: number;
  inseam: number;
  skin: string;
};

export const defaultBody: Body = {
  height: 172,
  weight: 66,
  chest: 94,
  waist: 78,
  hips: 96,
  shoulder: 44,
  inseam: 79,
  skin: "#c58c66",
};

export const skinTones = ["#f1d3bc", "#e0ac86", "#c58c66", "#9c6644", "#6b4430", "#4a2f22"];

export const SIZES = ["XS", "S", "M", "L", "XL", "XXL"] as const;
export type Size = (typeof SIZES)[number];

export type GarmentKind = "top" | "bottom" | "dress" | "shoes";

/** Upper body-measurement bound (cm) for each size, XS..XL. Anything bigger is XXL. */
const TOP_CHEST = [86, 94, 102, 110, 118];
const BOTTOM_WAIST = [70, 78, 86, 94, 102];
const BOTTOM_HIPS = [90, 98, 106, 114, 122];

const pick = (value: number, bounds: number[]): number => {
  const i = bounds.findIndex((b) => value <= b);
  return i === -1 ? bounds.length : i;
};

export function recommendSize(kind: GarmentKind, body: Body): Size {
  if (kind === "top") return SIZES[pick(body.chest, TOP_CHEST)]!;
  if (kind === "bottom") return SIZES[Math.max(pick(body.waist, BOTTOM_WAIST), pick(body.hips, BOTTOM_HIPS))]!;
  if (kind === "dress")
    return SIZES[Math.max(pick(body.chest, TOP_CHEST), pick(body.waist, BOTTOM_WAIST), pick(body.hips, BOTTOM_HIPS))]!;
  return "M";
}

/** Extra room (cm) a garment's cut adds over the size chart. */
export function easeForFit(fit: string): number {
  const f = fit.toLowerCase();
  if (f.includes("oversized") || f.includes("baggy")) return 14;
  if (f.includes("boxy") || f.includes("wide") || f.includes("flowy")) return 10;
  if (f.includes("relaxed")) return 6;
  if (f.includes("slim") || f.includes("bodycon") || f.includes("fitted") || f.includes("cropped")) return 1;
  return 4;
}

export type FitStatus = "snug" | "perfect" | "relaxed";
export type FitZone = { zone: string; ease: number; status: FitStatus };

export const statusForEase = (ease: number): FitStatus => (ease < 2 ? "snug" : ease <= 8 ? "perfect" : "relaxed");

export function fitReport(kind: GarmentKind, body: Body, fit: string, size?: Size): FitZone[] {
  const s = SIZES.indexOf(size ?? recommendSize(kind, body));
  const cut = easeForFit(fit);
  const zone = (name: string, bodyCm: number, bounds: number[]): FitZone => {
    const garment = (bounds[Math.min(s, bounds.length - 1)] ?? 0) + (s >= bounds.length ? 8 : 0) + cut;
    const ease = Math.round(garment - bodyCm);
    return { zone: name, ease, status: statusForEase(ease) };
  };
  if (kind === "top") return [zone("Chest", body.chest, TOP_CHEST), zone("Waist", body.waist, TOP_CHEST.map((c) => c - 8))];
  if (kind === "bottom") return [zone("Waist", body.waist, BOTTOM_WAIST), zone("Hips", body.hips, BOTTOM_HIPS)];
  if (kind === "dress")
    return [zone("Chest", body.chest, TOP_CHEST), zone("Waist", body.waist, BOTTOM_WAIST), zone("Hips", body.hips, BOTTOM_HIPS)];
  return [];
}
