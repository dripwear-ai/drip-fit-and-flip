import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Heart, ImagePlus, Loader2, RefreshCw, Sparkles, Wand2, X } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { TopBar } from "@/components/drip/TopBar";
import { formatPrice, products, wardrobeGaps } from "@/lib/catalog";
import { dripActions } from "@/lib/drip-store";
import { styleOutfits, tagGarment, type StylistResult } from "@/lib/stylist.functions";
import { shrinkImage, useWardrobe, wardrobe, type WardrobeCategory, type WardrobeItem } from "@/lib/wardrobe-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/ootd/wardrobe")({
  head: () => ({
    meta: [
      { title: "AI Wardrobe — Drip" },
      { name: "description", content: "Upload your clothes and let Drip's AI stylist build outfits and spot what's missing." },
      { property: "og:title", content: "AI Wardrobe — Drip" },
      { property: "og:description", content: "Outfits from clothes you already own, plus smart buys." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Wardrobe,
});

const filters: { key: "all" | WardrobeCategory; label: string }[] = [
  { key: "all", label: "All" },
  { key: "top", label: "Tops" },
  { key: "bottom", label: "Bottoms" },
  { key: "layer", label: "Layers" },
  { key: "dress", label: "Dresses" },
  { key: "shoes", label: "Shoes" },
  { key: "accessory", label: "Extras" },
];
const occasions = ["Everyday", "Work", "Date night", "Weekend", "Party", "Travel"];

function ItemTile({ item, onRetry }: { item: WardrobeItem; onRetry: (i: WardrobeItem) => void }) {
  return (
    <div className="group relative aspect-[3/4] overflow-hidden rounded-2xl bg-card">
      <img src={item.image} alt={item.name} className="size-full object-cover" />
      <div className="scrim absolute inset-0" />
      <button
        type="button"
        aria-label={`Remove ${item.name}`}
        onClick={() => wardrobe.remove(item.id)}
        className="glass absolute right-1.5 top-1.5 grid size-7 place-items-center rounded-full opacity-90"
      >
        <X className="size-3.5" />
      </button>
      {item.status === "tagging" ? (
        <div className="absolute inset-x-2 bottom-2 flex items-center gap-1.5 font-label text-[9px] font-bold text-primary">
          <Loader2 className="size-3 animate-spin" /> AI tagging…
        </div>
      ) : item.status === "error" ? (
        <button type="button" onClick={() => onRetry(item)} className="absolute inset-x-2 bottom-2 flex items-center gap-1.5 text-left font-label text-[9px] font-bold text-nope">
          <RefreshCw className="size-3" /> Retry tagging
        </button>
      ) : (
        <div className="absolute inset-x-2 bottom-2">
          <div className="line-clamp-1 text-[11px] font-bold leading-tight">{item.name}</div>
          <div className="mt-0.5 flex items-center gap-1 text-[10px] text-foreground/70">
            <span className="size-2 rounded-full ring-1 ring-foreground/30" style={{ backgroundColor: item.colorHex }} />
            {item.colorName}
          </div>
        </div>
      )}
    </div>
  );
}

function Wardrobe() {
  const items = useWardrobe();
  const tag = useServerFn(tagGarment);
  const style = useServerFn(styleOutfits);
  const fileRef = useRef<HTMLInputElement>(null);
  const [filter, setFilter] = useState<(typeof filters)[number]["key"]>("all");
  const [occasion, setOccasion] = useState("Everyday");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<StylistResult | null>(null);

  const ready = items.filter((i) => i.status === "ready");
  const shown = filter === "all" ? items : items.filter((i) => i.category === filter);
  const byId = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);
  const combos = useMemo(() => {
    const c = (k: WardrobeCategory) => ready.filter((i) => i.category === k).length;
    return c("top") * c("bottom") * Math.max(1, c("shoes")) + c("dress") * Math.max(1, c("shoes"));
  }, [ready]);

  const runTag = async (item: WardrobeItem) => {
    wardrobe.update(item.id, { status: "tagging" });
    try {
      const t = await tag({ data: { image: item.image } });
      wardrobe.update(item.id, { ...t, status: "ready" });
    } catch (e) {
      wardrobe.update(item.id, { status: "error" });
      toast.error("Couldn't read that photo", { description: e instanceof Error ? e.message : undefined });
    }
  };

  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    for (const file of Array.from(files).slice(0, 8)) {
      try {
        const image = await shrinkImage(file);
        const item: WardrobeItem = {
          id: `u-${Date.now()}-${Math.round(Math.random() * 1e6)}`,
          name: "New piece",
          category: "top",
          colorName: "—",
          colorHex: "#888888",
          tags: [],
          image,
          status: "tagging",
        };
        wardrobe.add(item);
        void runTag(item);
      } catch {
        toast.error(`Couldn't open ${file.name}`);
      }
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  const styleMe = async () => {
    if (ready.length < 2) {
      toast("Add at least two pieces first");
      return;
    }
    setLoading(true);
    try {
      const r = await style({
        data: {
          occasion,
          items: ready.map(({ id, name, category, colorName, tags }) => ({ id, name, category, colorName, tags: tags.slice(0, 6) })),
          catalog: products.map((p) => ({ id: p.id, name: p.name, category: p.category })),
        },
      });
      setResult(r);
      if (!r.outfits.length) toast("The stylist needs a few more pieces to build full outfits.");
    } catch (e) {
      toast.error("Styling failed", { description: e instanceof Error ? e.message : undefined });
    } finally {
      setLoading(false);
    }
  };

  const missing = result?.missing.length
    ? result.missing.flatMap((m) => {
        const product = products.find((p) => p.id === m.catalogId);
        return product ? [{ product, reason: m.reason, unlocks: m.unlocks }] : [];
      })
    : wardrobeGaps;

  return (
    <main className="pb-36">
      <TopBar back title="AI Wardrobe" />

      <section className="px-5 pt-2 animate-rise">
        <h1 className="font-display text-5xl leading-[0.95]">
          Your closet, <em className="text-primary">styled.</em>
        </h1>
        <div className="mt-4 flex gap-2">
          <span className="glass rounded-full px-3 py-1.5 font-label text-[9px] font-bold">{items.length} pieces</span>
          <span className="glass rounded-full px-3 py-1.5 font-label text-[9px] font-bold">{combos}+ outfit combos</span>
        </div>
      </section>

      <section className="mt-6 px-5">
        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => void onFiles(e.target.files)} />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="grain flex w-full items-center gap-4 rounded-3xl border border-dashed border-primary/50 bg-primary/5 p-4 text-left transition hover:bg-primary/10"
        >
          <span className="bg-signal grid size-12 shrink-0 place-items-center rounded-2xl text-primary-foreground">
            <ImagePlus className="size-5" />
          </span>
          <span>
            <span className="block font-display text-2xl leading-tight">Add clothes</span>
            <span className="block text-xs text-muted-foreground">Snap or upload — AI names, colours and tags each piece.</span>
          </span>
        </button>

        <div className="no-scrollbar -mx-5 mt-5 flex gap-2 overflow-x-auto px-5">
          {filters.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={cn(
                "h-8 shrink-0 rounded-full px-4 font-label text-[10px] font-bold transition",
                filter === f.key ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground/80",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          {shown.map((i) => (
            <ItemTile key={i.id} item={i} onRetry={(x) => void runTag(x)} />
          ))}
          {!shown.length && <p className="col-span-3 py-6 text-center text-sm text-muted-foreground">Nothing here yet.</p>}
        </div>
      </section>

      <section className="mt-10 px-5">
        <div className="rounded-[2rem] bg-card p-5">
          <div className="flex items-center gap-2 font-label text-[10px] font-bold text-primary">
            <Sparkles className="size-3.5" /> AI stylist
          </div>
          <h2 className="mt-1 font-display text-4xl leading-none">
            What’s the <em>occasion?</em>
          </h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {occasions.map((o) => (
              <button
                key={o}
                type="button"
                onClick={() => setOccasion(o)}
                className={cn(
                  "rounded-full border px-3.5 py-2 text-xs font-bold transition",
                  occasion === o ? "border-primary bg-primary/10 text-primary" : "border-border",
                )}
              >
                {o}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => void styleMe()}
            disabled={loading}
            className="bg-signal shadow-glow mt-5 flex w-full items-center justify-center gap-2 rounded-full py-4 font-label text-xs font-extrabold text-primary-foreground disabled:opacity-70"
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Wand2 className="size-4" />}
            {loading ? "Styling your closet…" : "Style me"}
          </button>
        </div>

        {loading && (
          <div className="mt-4 space-y-3">
            {[0, 1].map((i) => (
              <div key={i} className="h-40 animate-pulse rounded-3xl bg-card" />
            ))}
          </div>
        )}

        {!loading && result && result.outfits.length > 0 && (
          <div className="mt-4 space-y-3">
            {result.outfits.map((o) => (
              <article key={o.title} className="overflow-hidden rounded-3xl bg-card animate-rise">
                <div className={cn("grid h-44 gap-0.5", o.itemIds.length >= 3 ? "grid-cols-3" : "grid-cols-2")}>
                  {o.itemIds.slice(0, 3).map((id) => {
                    const it = byId.get(id);
                    return it ? <img key={id} src={it.image} alt={it.name} className="size-full object-cover" /> : null;
                  })}
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-display text-3xl italic leading-none">{o.title}</h3>
                    <span className="bg-signal shrink-0 rounded-full px-2.5 py-1 font-label text-[9px] font-extrabold text-primary-foreground">
                      {Math.round(o.vibeScore)}% vibe
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{o.why}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {o.itemIds.map((id) => (
                      <span key={id} className="rounded-full bg-secondary px-2.5 py-1 text-[11px]">
                        {byId.get(id)?.name}
                      </span>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="mt-10 px-5">
        <h2 className="font-display text-4xl leading-none">
          Missing from <em>your closet</em>
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {result ? "Picked by your stylist for this wardrobe." : "Pieces that would unlock the most new outfits."}
        </p>
        <div className="mt-4 space-y-2.5">
          {missing.map((g) => {
            const v = g.product.variants[0];
            return (
              <div key={g.product.id} className="flex items-center gap-3 rounded-2xl bg-card p-2.5">
                <img src={g.product.image} alt={g.product.name} className="h-20 w-16 rounded-xl object-cover" />
                <div className="min-w-0 flex-1">
                  <div className="font-label text-[9px] font-bold text-primary">Unlocks {g.unlocks} outfits</div>
                  <div className="truncate font-bold">{g.product.name}</div>
                  <div className="line-clamp-2 text-xs text-muted-foreground">{g.reason}</div>
                  <div className="mt-0.5 text-xs font-bold">{formatPrice(v?.price ?? 0)}</div>
                </div>
                <button
                  type="button"
                  aria-label={`Save ${g.product.name}`}
                  onClick={() => {
                    if (!v) return;
                    dripActions.save({ key: `${g.product.id}-${v.brand}`, name: g.product.name, brand: v.brand, price: v.price, image: g.product.image, kind: "piece" });
                    toast.success("Saved to wishlist", { description: g.product.name });
                  }}
                  className="bg-signal grid size-10 shrink-0 place-items-center rounded-full text-primary-foreground"
                >
                  <Heart className="size-4" fill="currentColor" />
                </button>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
