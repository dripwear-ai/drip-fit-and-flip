import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ChevronsUp, RotateCcw, Star, Truck } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { ActionButtons } from "@/components/drip/ActionButtons";
import { SwipeDeck, type SwipeDeckHandle, type SwipeDir } from "@/components/drip/SwipeDeck";
import { TopBar } from "@/components/drip/TopBar";
import { categories, formatPrice, getCategory, productsFor, type Product } from "@/lib/catalog";
import { dripActions } from "@/lib/drip-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/discover/$category")({
  loader: ({ params }) => {
    const category = getCategory(params.category);
    if (!category) throw notFound();
    return { category };
  },
  head: ({ loaderData }) => {
    const name = loaderData?.category.name ?? "Unavailable";
    return {
      meta: [
        { title: `${name} — Swipe on Drip` },
        { name: "description", content: `Swipe right to save ${name.toLowerCase()} to your wishlist, swipe up to see other brands.` },
        { property: "og:title", content: `${name} — Swipe on Drip` },
        { property: "og:description", content: `Full-screen swipe cards for ${name.toLowerCase()} from top brands.` },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
        ...(loaderData ? [] : [{ name: "robots", content: "noindex" }]),
      ],
    };
  },
  notFoundComponent: () => (
    <main className="grid h-dvh place-items-center px-6 text-center">
      <div>
        <div className="font-display text-5xl italic">No such drop.</div>
        <Link to="/discover" className="mt-5 inline-block rounded-full bg-primary px-5 py-2.5 font-label text-[10px] font-bold text-primary-foreground">
          Back to Discover
        </Link>
      </div>
    </main>
  ),
  component: CategoryDeck,
});

function ProductCard({ p, variantIndex }: { p: Product; variantIndex: number }) {
  const v = p.variants[variantIndex % p.variants.length]!;
  return (
    <div className="relative size-full bg-card">
      <img src={p.image} alt={p.name} className="size-full object-cover" draggable={false} />
      <div className="scrim-top absolute inset-x-0 top-0 h-28" />
      <div className="scrim absolute inset-0" />

      <div className="absolute inset-x-4 top-4 flex items-center justify-between">
        <span className="bg-signal rounded-full px-3 py-1.5 font-label text-[10px] font-extrabold text-primary-foreground">
          {p.match}% your vibe
        </span>
        <div className="glass flex items-center gap-1.5 rounded-full px-3 py-2">
          {p.variants.map((_, i) => (
            <span
              key={i}
              className={cn("h-1.5 rounded-full transition-all", i === variantIndex % p.variants.length ? "w-5 bg-primary" : "w-1.5 bg-foreground/40")}
            />
          ))}
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 p-5">
        <div key={v.brand} className="animate-rise">
          <div className="font-label text-[11px] font-extrabold text-primary">{v.brand}</div>
          <div className="font-display text-5xl leading-[0.95]">{p.name}</div>
          <div className="mt-3 flex items-center gap-3">
            <span className="text-2xl font-bold">{formatPrice(v.price)}</span>
            <span className="flex items-center gap-1 text-xs text-foreground/80">
              <Star className="size-3.5 fill-primary text-primary" /> {v.rating}
            </span>
            <span className="flex items-center gap-1 text-xs text-foreground/80">
              <Truck className="size-3.5" /> {v.delivery}
            </span>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {[v.fit, ...p.tags].map((t) => (
              <span key={t} className="glass rounded-full px-2.5 py-1 text-[11px]">
                {t}
              </span>
            ))}
          </div>
        </div>
        {p.variants.length > 1 && (
          <div className="mt-4 flex items-center justify-center gap-1.5 font-label text-[9px] font-bold text-foreground/60">
            <ChevronsUp className="size-3.5 animate-float" /> Swipe up · {p.variants.length - 1} more brands
          </div>
        )}
      </div>
    </div>
  );
}

function CategoryDeck() {
  const { category } = Route.useLoaderData();
  const items = productsFor(category.slug);
  const deck = useRef<SwipeDeckHandle>(null);
  const [variants, setVariants] = useState<Record<string, number>>({});
  const [index, setIndex] = useState(0);
  const others = categories.filter((c) => c.slug !== category.slug);

  const onSwipe = useCallback(
    (dir: SwipeDir, p: Product): "stay" | void => {
      const vi = (variants[p.id] ?? 0) % p.variants.length;
      const v = p.variants[vi]!;
      if (dir === "up") {
        const next = (vi + 1) % p.variants.length;
        setVariants((s) => ({ ...s, [p.id]: next }));
        const nv = p.variants[next]!;
        toast(`Now showing ${nv.brand}`, { description: `${p.name} · ${formatPrice(nv.price)}` });
        return "stay";
      }
      if (dir === "right") {
        dripActions.save({ key: `${p.id}-${v.brand}`, name: p.name, brand: v.brand, price: v.price, image: p.image, kind: "piece" });
        toast.success("Saved to wishlist", { description: `${v.brand} · ${p.name}` });
      }
    },
    [variants],
  );

  return (
    <main className="flex h-dvh flex-col pb-24">
      <TopBar back title={<span>{category.name} · {Math.min(index + 1, items.length)}/{items.length}</span>} />

      <div className="relative flex-1 px-3">
        <SwipeDeck
          key={category.slug}
          ref={deck}
          items={items}
          allowUp
          getKey={(p) => p.id}
          labels={{ left: "Nope", right: "Save", up: "Next brand" }}
          className="size-full"
          onIndexChange={setIndex}
          renderCard={(p) => <ProductCard p={p} variantIndex={variants[p.id] ?? 0} />}
          onSwipe={onSwipe}
          empty={
            <div className="flex size-full flex-col items-center justify-center rounded-[2rem] border border-dashed border-border px-6 text-center">
              <div className="font-display text-5xl italic">All caught up.</div>
              <p className="mt-2 text-sm text-muted-foreground">Fresh {category.name.toLowerCase()} land every morning. Try another drop:</p>
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                {others.map((c) => (
                  <Link
                    key={c.slug}
                    to="/discover/$category"
                    params={{ category: c.slug }}
                    className="rounded-full border border-border px-4 py-2 font-label text-[10px] font-bold hover:border-primary hover:text-primary"
                  >
                    {c.name}
                  </Link>
                ))}
              </div>
              <button
                type="button"
                onClick={() => deck.current?.reset()}
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 font-label text-[10px] font-bold text-primary-foreground"
              >
                <RotateCcw className="size-3.5" /> Swipe again
              </button>
            </div>
          }
        />
      </div>

      <ActionButtons className="mt-4" upLabel="Brand" onAction={(d) => deck.current?.swipe(d)} />
    </main>
  );
}
