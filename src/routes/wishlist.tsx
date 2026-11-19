import { createFileRoute } from "@tanstack/react-router";
import { X } from "lucide-react";
import { TopBar } from "@/components/drip/TopBar";
import { formatPrice } from "@/lib/catalog";
import { dripActions, useDrip, type SavedItem } from "@/lib/drip-store";

export const Route = createFileRoute("/wishlist")({
  head: () => ({
    meta: [
      { title: "Wishlist & Bag — Drip" },
      { name: "description", content: "Everything you swiped right on Drip, in one place." },
      { property: "og:title", content: "Wishlist & Bag — Drip" },
      { property: "og:description", content: "Your saved pieces and outfits." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Wishlist,
});

function Grid({ items, onRemove }: { items: SavedItem[]; onRemove: (k: string) => void }) {
  if (!items.length) return <p className="text-sm text-muted-foreground">Nothing yet — start swiping.</p>;
  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map((i) => (
        <div key={i.key} className="relative overflow-hidden rounded-2xl bg-card">
          <img src={i.image} alt={i.name} className="aspect-[3/4] w-full object-cover" />
          <button type="button" aria-label="Remove" onClick={() => onRemove(i.key)} className="glass absolute right-2 top-2 grid size-8 place-items-center rounded-full">
            <X className="size-4" />
          </button>
          <div className="p-3">
            <div className="font-label text-[9px] font-bold text-primary">{i.brand}</div>
            <div className="text-sm font-bold">{i.name}</div>
            <div className="text-xs text-muted-foreground">{formatPrice(i.price)}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function Wishlist() {
  const { wishlist, bag } = useDrip();
  return (
    <main className="pb-36">
      <TopBar back title="Saved" />
      <section className="px-5">
        <h1 className="font-display text-5xl italic">Wishlist</h1>
        <div className="mt-4"><Grid items={wishlist} onRemove={dripActions.unsave} /></div>
        <h2 className="mt-10 font-display text-4xl italic">Bag</h2>
        <div className="mt-4"><Grid items={bag} onRemove={dripActions.removeFromBag} /></div>
      </section>
    </main>
  );
}
