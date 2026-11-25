import { useEffect } from "react";
import { dripActions, useDrip, type SavedItem } from "@/lib/drip-store";
import { useAuth } from "./use-auth";
import { useRemoveFromWishlist, useSaveToWishlist, useWishlist, type CatalogProduct, type Variant } from "./use-drip-data";

export type SavedView = { key: string; name: string; brand: string; price: number; image: string };

const localKey = (p: CatalogProduct, v: Variant) => `${p.id}-${v.id}`;

/** One wishlist for every screen: the account's when signed in, this device's when signed out. */
export function useSaved() {
  const { user, loading: authLoading } = useAuth();
  const local = useDrip();
  const remote = useWishlist();
  const save = useSaveToWishlist();
  const remove = useRemoveFromWishlist();
  const signedIn = !!user;

  const wishlist: SavedView[] = signedIn
    ? (remote.data ?? []).map((w) => ({ key: w.id, name: w.name, brand: w.brand, price: w.price, image: w.image }))
    : local.wishlist;

  return {
    signedIn,
    loading: authLoading || (signedIn && remote.isLoading),
    wishlist,
    count: wishlist.length,
    bag: local.bag,
    savePiece(p: CatalogProduct, v: Variant) {
      if (signedIn) {
        if (remote.data?.some((w) => w.variantId === v.id)) return;
        save.mutate({ productId: p.id, variantId: v.id });
      } else {
        dripActions.save({ key: localKey(p, v), name: p.name, brand: v.brand, price: v.price, image: p.image, kind: "piece", productId: p.id, variantId: v.id });
      }
    },
    unsavePiece(p: CatalogProduct, v: Variant) {
      if (signedIn) remove.mutate({ variantId: v.id });
      else dripActions.unsave(localKey(p, v));
    },
    removeSaved(key: string) {
      if (signedIn) remove.mutate({ id: key });
      else dripActions.unsave(key);
    },
  };
}

/** Moves pieces saved while signed out into the account once the person signs in. */
export function SavedSync() {
  const { user } = useAuth();
  const { wishlist } = useDrip();
  const save = useSaveToWishlist();
  const userId = user?.id;
  useEffect(() => {
    if (!userId) return;
    wishlist.forEach((i: SavedItem) => {
      if (!i.productId || !i.variantId) return;
      save.mutate({ productId: i.productId, variantId: i.variantId }, { onSuccess: () => dripActions.unsave(i.key) });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);
  return null;
}
