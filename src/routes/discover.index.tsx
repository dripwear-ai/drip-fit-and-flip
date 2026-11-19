import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight, RotateCcw, Search, SlidersHorizontal, X } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { ActionButtons } from "@/components/drip/ActionButtons";
import { SwipeDeck, type SwipeDeckHandle } from "@/components/drip/SwipeDeck";
import { TopBar } from "@/components/drip/TopBar";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { Slider } from "@/components/ui/slider";
import { categories, type Category } from "@/lib/catalog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/discover/")({
  head: () => ({
    meta: [
      { title: "Discover — Drip" },
      { name: "description", content: "Search and swipe through shirts, jeans, jackets, sneakers and dresses on Drip." },
      { property: "og:title", content: "Discover — Drip" },
      { property: "og:description", content: "Swipe right on a category to dive into full-screen fashion cards." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Discover,
});

const genders = ["All", "Women", "Men"] as const;
const vibes = ["Streetwear", "Quiet luxury", "Y2K", "Minimal", "Resort", "Noir"];
const sizes = ["XS", "S", "M", "L", "XL", "XXL"];
const swatches = [
  { name: "Bone", className: "bg-bone" },
  { name: "Ink", className: "bg-ink border border-border" },
  { name: "Clay", className: "bg-clay" },
  { name: "Lime", className: "bg-primary" },
  { name: "Blush", className: "bg-blush" },
  { name: "Denim", className: "bg-chart-4" },
];

function CategoryCard({ c }: { c: Category }) {
  return (
    <div className="relative size-full">
      <img src={c.cover} alt={c.name} className="size-full object-cover" draggable={false} />
      <div className="scrim absolute inset-0" />
      <div className="absolute left-4 top-4 flex gap-2">
        <span className="glass rounded-full px-3 py-1.5 font-label text-[10px] font-bold">{c.pieces} pieces</span>
        <span className="glass rounded-full px-3 py-1.5 font-label text-[10px] font-bold">{c.brands} brands</span>
      </div>
      <div className="absolute inset-x-0 bottom-0 p-6">
        <div className="font-label text-[10px] font-bold text-primary">{c.tagline}</div>
        <div className="font-display text-7xl italic leading-[0.9]">{c.name}</div>
        <div className="mt-3 flex items-center gap-2 text-xs text-foreground/75">
          Swipe right to open <ArrowRight className="size-3.5" />
        </div>
      </div>
    </div>
  );
}

function Discover() {
  const navigate = useNavigate();
  const deck = useRef<SwipeDeckHandle>(null);
  const [query, setQuery] = useState("");
  const [gender, setGender] = useState<(typeof genders)[number]>("All");
  const [activeVibes, setActiveVibes] = useState<string[]>([]);
  const [activeSizes, setActiveSizes] = useState<string[]>(["M"]);
  const [price, setPrice] = useState([500, 9000]);
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return categories.filter((c) => {
      if (gender !== "All" && !c.for.includes(gender.toLowerCase() as "women" | "men")) return false;
      if (!q) return true;
      return c.name.toLowerCase().includes(q) || c.tagline.toLowerCase().includes(q);
    });
  }, [query, gender]);

  const toggle = (list: string[], set: (v: string[]) => void, v: string) =>
    set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  const filterCount = activeVibes.length + activeSizes.length + (gender !== "All" ? 1 : 0);

  return (
    <main className="flex h-dvh flex-col pb-24">
      <TopBar title="Discover" />

      <div className="flex gap-2 px-5">
        <label className="glass flex h-12 flex-1 items-center gap-2.5 rounded-full px-4">
          <Search className="size-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search shirts, jeans, brands…"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          {query && (
            <button type="button" onClick={() => setQuery("")} aria-label="Clear search">
              <X className="size-4 text-muted-foreground" />
            </button>
          )}
        </label>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Filters"
          className="relative grid size-12 place-items-center rounded-full bg-foreground text-background"
        >
          <SlidersHorizontal className="size-4" />
          {filterCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 grid size-5 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {filterCount}
            </span>
          )}
        </button>
      </div>

      <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto px-5 pb-1">
        {genders.map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => setGender(g)}
            className={cn(
              "h-8 shrink-0 rounded-full px-4 font-label text-[10px] font-bold transition",
              gender === g ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground/80",
            )}
          >
            {g}
          </button>
        ))}
        {vibes.map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => toggle(activeVibes, setActiveVibes, v)}
            className={cn(
              "h-8 shrink-0 rounded-full border px-4 font-label text-[10px] font-bold transition",
              activeVibes.includes(v) ? "border-primary text-primary" : "border-border text-foreground/70",
            )}
          >
            {v}
          </button>
        ))}
      </div>

      <div className="relative mt-4 flex-1 px-5">
        <SwipeDeck
          key={`${gender}-${query}`}
          ref={deck}
          items={filtered}
          getKey={(c) => c.slug}
          labels={{ left: "Skip", right: "Open" }}
          className="size-full"
          renderCard={(c) => <CategoryCard c={c} />}
          onTap={(c) => navigate({ to: "/discover/$category", params: { category: c.slug } })}
          onSwipe={(dir, c) => {
            if (dir === "right") navigate({ to: "/discover/$category", params: { category: c.slug } });
          }}
          empty={
            <div className="grid size-full place-items-center rounded-[2rem] border border-dashed border-border text-center">
              <div>
                <div className="font-display text-4xl italic">That’s every drop.</div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {filtered.length ? "Run it back for another look." : "No matches — try another search."}
                </p>
                {filtered.length > 0 && (
                  <button
                    type="button"
                    onClick={() => deck.current?.reset()}
                    className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 font-label text-[10px] font-bold text-primary-foreground"
                  >
                    <RotateCcw className="size-3.5" /> Start over
                  </button>
                )}
              </div>
            </div>
          }
        />
      </div>

      <ActionButtons className="mt-4" rightKind="heart" onAction={(d) => deck.current?.swipe(d)} />

      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent className="mx-auto max-w-[440px] border-border bg-card">
          <div className="max-h-[75dvh] overflow-y-auto px-5 pb-8 pt-4">
            <DrawerTitle className="font-display text-4xl font-normal italic">Filters</DrawerTitle>

            <div className="mt-6 font-label text-[10px] font-bold text-muted-foreground">Price</div>
            <Slider value={price} onValueChange={setPrice} min={0} max={15000} step={250} className="mt-4" />
            <div className="mt-2 flex justify-between text-xs text-muted-foreground">
              <span>₹{price[0].toLocaleString("en-IN")}</span>
              <span>₹{price[1].toLocaleString("en-IN")}</span>
            </div>

            <div className="mt-6 font-label text-[10px] font-bold text-muted-foreground">Size</div>
            <div className="mt-3 grid grid-cols-6 gap-2">
              {sizes.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggle(activeSizes, setActiveSizes, s)}
                  className={cn(
                    "h-10 rounded-xl text-xs font-bold transition",
                    activeSizes.includes(s) ? "bg-primary text-primary-foreground" : "bg-secondary",
                  )}
                >
                  {s}
                </button>
              ))}
            </div>

            <div className="mt-6 font-label text-[10px] font-bold text-muted-foreground">Colour</div>
            <div className="mt-3 flex gap-3">
              {swatches.map((s) => (
                <button key={s.name} type="button" aria-label={s.name} className={cn("size-9 rounded-full ring-offset-2 ring-offset-card hover:ring-2 hover:ring-primary", s.className)} />
              ))}
            </div>

            <div className="mt-6 font-label text-[10px] font-bold text-muted-foreground">Vibe</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {vibes.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => toggle(activeVibes, setActiveVibes, v)}
                  className={cn(
                    "rounded-full border px-4 py-2 text-xs font-bold transition",
                    activeVibes.includes(v) ? "border-primary bg-primary/10 text-primary" : "border-border",
                  )}
                >
                  {v}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="bg-signal mt-8 h-12 w-full rounded-full font-label text-xs font-extrabold text-primary-foreground"
            >
              Show {filtered.length} drops
            </button>
          </div>
        </DrawerContent>
      </Drawer>
    </main>
  );
}
