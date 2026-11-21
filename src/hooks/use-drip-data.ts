import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { BrandVariant, Look } from "@/lib/catalog";
import { imageFor } from "@/lib/images";
import type { SwipeDir } from "@/lib/swipe-physics";
import { useAuth } from "./use-auth";

export type Variant = BrandVariant & { id: string };
export type CatalogProduct = {
  id: string;
  category: string;
  name: string;
  image: string;
  color: string;
  tags: string[];
  match: number;
  variants: Variant[];
};
export type Outfit = Look;

const PRODUCT_SELECT =
  "id, category, name, image_key, color, tags, match, sort, product_variants(id, brand, price, rating, delivery, fit, position)";

type ProductRow = {
  id: string;
  category: string;
  name: string;
  image_key: string;
  color: string;
  tags: string[];
  match: number;
  product_variants: { id: string; brand: string; price: number; rating: number; delivery: string; fit: string; position: number }[];
};

const toProduct = (r: ProductRow): CatalogProduct => ({
  id: r.id,
  category: r.category,
  name: r.name,
  image: imageFor(r.image_key),
  color: r.color,
  tags: r.tags,
  match: r.match,
  variants: [...r.product_variants]
    .sort((a, b) => a.position - b.position)
    .map(({ id, brand, price, rating, delivery, fit }) => ({ id, brand, price, rating: Number(rating), delivery, fit })),
});

/* ---------- Catalog (public) ---------- */

export function useProducts(category: string) {
  return useQuery({
    queryKey: ["products", category],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(PRODUCT_SELECT)
        .eq("category", category)
        .order("sort");
      if (error) throw error;
      return (data as unknown as ProductRow[]).map(toProduct);
    },
    staleTime: 5 * 60_000,
  });
}

export function useOutfits() {
  return useQuery({
    queryKey: ["outfits"],
    queryFn: async (): Promise<Outfit[]> => {
      const { data, error } = await supabase
        .from("outfits")
        .select("id, title, mood, image_key, creator, top_color, bottom_color, sort, outfit_pieces(name, brand, price, position)")
        .order("sort");
      if (error) throw error;
      return data.map((o) => ({
        id: o.id,
        title: o.title,
        mood: o.mood,
        image: imageFor(o.image_key),
        creator: o.creator,
        top: o.top_color,
        bottom: o.bottom_color,
        pieces: [...o.outfit_pieces].sort((a, b) => a.position - b.position).map(({ name, brand, price }) => ({ name, brand, price })),
      }));
    },
    staleTime: 5 * 60_000,
  });
}

/* ---------- Wishlist (signed-in) ---------- */

export type WishlistEntry = {
  id: string;
  kind: "piece" | "look";
  name: string;
  brand: string;
  price: number;
  image: string;
  variantId: string | null;
  outfitId: string | null;
};

export function useWishlist() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["me", user?.id, "wishlist"],
    enabled: !!user,
    queryFn: async (): Promise<WishlistEntry[]> => {
      const { data, error } = await supabase
        .from("wishlist_items")
        .select(
          "id, created_at, variant_id, outfit_id, product:products(name, image_key), variant:product_variants(brand, price), outfit:outfits(title, image_key, creator, outfit_pieces(price))",
        )
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data.map((w) =>
        w.outfit
          ? {
              id: w.id,
              kind: "look" as const,
              name: w.outfit.title,
              brand: w.outfit.creator,
              price: w.outfit.outfit_pieces.reduce((s, p) => s + p.price, 0),
              image: imageFor(w.outfit.image_key),
              variantId: null,
              outfitId: w.outfit_id,
            }
          : {
              id: w.id,
              kind: "piece" as const,
              name: w.product?.name ?? "Saved piece",
              brand: w.variant?.brand ?? "",
              price: w.variant?.price ?? 0,
              image: imageFor(w.product?.image_key ?? ""),
              variantId: w.variant_id,
              outfitId: null,
            },
      );
    },
  });
}

export function useSaveToWishlist() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (target: { productId: string; variantId: string } | { outfitId: string }) => {
      const row: { outfit_id: string | null; product_id: string | null; variant_id: string | null } =
        "outfitId" in target
          ? { outfit_id: target.outfitId, product_id: null, variant_id: null }
          : { outfit_id: null, product_id: target.productId, variant_id: target.variantId };
      const { error } = await supabase.from("wishlist_items").insert(row);
      // 23505 = already saved; treat as success
      if (error && error.code !== "23505") throw error;
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["me", user?.id, "wishlist"] }),
  });
}

export function useRemoveFromWishlist() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (target: { id: string } | { variantId: string } | { outfitId: string }) => {
      let q = supabase.from("wishlist_items").delete();
      if ("id" in target) q = q.eq("id", target.id);
      else if ("variantId" in target) q = q.eq("variant_id", target.variantId);
      else q = q.eq("outfit_id", target.outfitId);
      const { error } = await q;
      if (error) throw error;
    },
    onMutate: async (target) => {
      const key = ["me", user?.id, "wishlist"];
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<WishlistEntry[]>(key);
      qc.setQueryData<WishlistEntry[]>(key, (list) =>
        list?.filter((w) =>
          "id" in target ? w.id !== target.id : "variantId" in target ? w.variantId !== target.variantId : w.outfitId !== target.outfitId,
        ),
      );
      return { prev, key };
    },
    onError: (_e, _t, ctx) => ctx && qc.setQueryData(ctx.key, ctx.prev),
    onSettled: () => qc.invalidateQueries({ queryKey: ["me", user?.id, "wishlist"] }),
  });
}

/* ---------- Swipes (signed-in) ---------- */

export type SwipeTarget = { productId: string; variantId?: string } | { outfitId: string };

/** Records swipes and lets the latest one be undone. Silently no-ops when signed out. */
export function useSwipes() {
  const { user } = useAuth();
  const record = async (direction: SwipeDir, target: SwipeTarget): Promise<string | null> => {
    if (!user) return null;
    const row: { direction: SwipeDir; outfit_id: string | null; product_id: string | null; variant_id: string | null } =
      "outfitId" in target
        ? { direction, outfit_id: target.outfitId, product_id: null, variant_id: null }
        : { direction, outfit_id: null, product_id: target.productId, variant_id: target.variantId ?? null };
    const { data, error } = await supabase.from("swipes").insert(row).select("id").single();
    if (error) {
      console.error("swipe not recorded", error.message);
      return null;
    }
    return data.id;
  };
  const remove = async (swipeId: string | null | Promise<string | null>) => {
    const id = await swipeId;
    if (!id) return;
    const { error } = await supabase.from("swipes").delete().eq("id", id);
    if (error) console.error("swipe undo failed", error.message);
  };
  return { record, remove, signedIn: !!user };
}

/* ---------- Profile ---------- */

export function useProfile() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["me", user?.id, "profile"],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("display_name, avatar_url").eq("id", user!.id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}
