import { useSyncExternalStore } from "react";
import { products } from "./catalog";

export type WardrobeCategory = "top" | "bottom" | "layer" | "shoes" | "dress" | "accessory";

export type WardrobeItem = {
  id: string;
  name: string;
  category: WardrobeCategory;
  colorName: string;
  colorHex: string;
  tags: string[];
  image: string;
  status: "ready" | "tagging" | "error";
};

const KEY = "drip-wardrobe-v1";
const listeners = new Set<() => void>();
let items: WardrobeItem[] = [];
let loaded = false;

function sample(): WardrobeItem[] {
  const map: [string, WardrobeCategory, string, string][] = [
    ["oxford", "top", "Sky blue", "#a9c4ea"],
    ["tee", "top", "Black", "#1c1c1e"],
    ["baggy", "bottom", "Light wash", "#a6bdd6"],
    ["flare", "bottom", "Washed black", "#2b2b2e"],
    ["trucker", "layer", "Mid denim", "#7f9fc6"],
    ["runner", "shoes", "Grey white", "#e6e6e6"],
    ["slip", "dress", "Champagne", "#e8d9bf"],
  ];
  return map.flatMap(([id, category, colorName, colorHex]) => {
    const p = products.find((x) => x.id === id);
    return p
      ? [{ id: `sample-${id}`, name: p.name, category, colorName, colorHex, tags: p.tags, image: p.image, status: "ready" as const }]
      : [];
  });
}

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    items = raw ? (JSON.parse(raw) as WardrobeItem[]) : sample();
    // anything still "tagging" from a previous visit never finished
    items = items.map((i) => (i.status === "tagging" ? { ...i, status: "error" } : i));
  } catch {
    items = sample();
  }
}

function emit() {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    /* storage full — keep in memory */
  }
  listeners.forEach((l) => l());
}

const EMPTY: WardrobeItem[] = [];

export function useWardrobe() {
  return useSyncExternalStore(
    (cb) => {
      load();
      listeners.add(cb);
      queueMicrotask(cb);
      return () => listeners.delete(cb);
    },
    () => items,
    () => EMPTY,
  );
}

export const wardrobe = {
  add(item: WardrobeItem) {
    load();
    items = [item, ...items];
    emit();
  },
  update(id: string, patch: Partial<WardrobeItem>) {
    items = items.map((i) => (i.id === id ? { ...i, ...patch } : i));
    emit();
  },
  remove(id: string) {
    items = items.filter((i) => i.id !== id);
    emit();
  },
};

/** Shrink a photo to a small JPEG data URL so it can be stored and sent to the stylist. */
export async function shrinkImage(file: File, max = 512): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = url;
    });
    const scale = Math.min(1, max / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.82);
  } finally {
    URL.revokeObjectURL(url);
  }
}
