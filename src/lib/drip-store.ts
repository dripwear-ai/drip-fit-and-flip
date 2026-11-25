import { useSyncExternalStore } from "react";

export type SavedItem = {
  key: string;
  name: string;
  brand: string;
  price: number;
  image: string;
  kind: "piece" | "look";
  /** Database ids, so a signed-out save can move to the account after sign-in. */
  productId?: string;
  variantId?: string;
};

type State = { wishlist: SavedItem[]; bag: SavedItem[] };

const STORAGE_KEY = "drip-store-v1";
let state: State = { wishlist: [], bag: [] };
let hydrated = false;
const listeners = new Set<() => void>();

function emit() {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }
  listeners.forEach((l) => l());
}

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) state = { ...state, ...JSON.parse(raw) };
  } catch {
    /* ignore corrupt storage */
  }
}

const EMPTY: State = { wishlist: [], bag: [] };

export function useDrip() {
  const snap = useSyncExternalStore(
    (cb) => {
      hydrate();
      listeners.add(cb);
      // notify once after hydrating so the client picks up saved items
      queueMicrotask(cb);
      return () => listeners.delete(cb);
    },
    () => state,
    () => EMPTY,
  );
  return snap;
}

export const dripActions = {
  save(item: SavedItem) {
    hydrate();
    if (state.wishlist.some((i) => i.key === item.key)) return;
    state = { ...state, wishlist: [item, ...state.wishlist] };
    emit();
  },
  unsave(key: string) {
    state = { ...state, wishlist: state.wishlist.filter((i) => i.key !== key) };
    emit();
  },
  addToBag(item: SavedItem) {
    hydrate();
    if (state.bag.some((i) => i.key === item.key)) return;
    state = { ...state, bag: [item, ...state.bag] };
    emit();
  },
  removeFromBag(key: string) {
    state = { ...state, bag: state.bag.filter((i) => i.key !== key) };
    emit();
  },
};
