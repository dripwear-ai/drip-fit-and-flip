import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, Box, Shirt, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { TopBar } from "@/components/drip/TopBar";
import { categories, formatPrice, lookTotal, looks } from "@/lib/catalog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Drip — Swipe your style into existence" },
      {
        name: "description",
        content: "Swipe through shirts, jeans and full outfits, try them on your 3D twin and let AI style your wardrobe.",
      },
      { property: "og:title", content: "Drip — Swipe your style into existence" },
      {
        property: "og:description",
        content: "The Tinder for fashion: swipe, save, try on in 3D and style your closet with AI.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

const fan = [
  { rotate: -9, x: -58, y: 18, z: 1 },
  { rotate: 8, x: 58, y: 22, z: 2 },
  { rotate: 0, x: 0, y: 0, z: 3 },
];

function StyleFan() {
  const [order, setOrder] = useState([0, 1, 2]);
  const fanLooks = looks.slice(0, 3);

  useEffect(() => {
    const t = window.setInterval(() => setOrder((o) => [o[2]!, o[0]!, o[1]!]), 3800);
    return () => window.clearInterval(t);
  }, []);

  return (
    <div className="relative mx-auto h-[430px] w-full">
      {fanLooks.map((look, i) => {
        const slot = fan[order.indexOf(i)] ?? fan[2]!;
        const front = slot.z === 3;
        return (
          <button
            key={look.id}
            type="button"
            onClick={() => setOrder((o) => [o[2]!, o[0]!, o[1]!])}
            className="absolute left-1/2 top-0 h-[400px] w-[255px] overflow-hidden rounded-[1.75rem] shadow-card transition-all duration-700 ease-[cubic-bezier(.2,.8,.2,1)]"
            style={{
              transform: `translateX(calc(-50% + ${slot.x}px)) translateY(${slot.y}px) rotate(${slot.rotate}deg) scale(${front ? 1 : 0.9})`,
              zIndex: slot.z,
            }}
            aria-label={`View ${look.title}`}
          >
            <img src={look.image} alt={look.title} className="size-full object-cover" draggable={false} />
            <div className="scrim absolute inset-0" />
            <div className={cn("absolute inset-x-0 bottom-0 p-4 text-left transition-opacity", front ? "opacity-100" : "opacity-0")}>
              <div className="font-label text-[10px] font-bold text-primary">{look.mood}</div>
              <div className="font-display text-3xl italic leading-tight">{look.title}</div>
              <div className="mt-1 flex items-center justify-between text-xs text-foreground/75">
                <span>{look.creator}</span>
                <span className="font-bold text-foreground">{formatPrice(lookTotal(look))}</span>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function Marquee() {
  const words = ["Swipe", "Save", "Try on in 3D", "Style your closet", "Cop the fit"];
  const row = [...words, ...words];
  return (
    <div className="bg-signal -mx-1 -rotate-2 overflow-hidden py-2.5 text-primary-foreground">
      <div className="flex w-max animate-marquee gap-6 whitespace-nowrap font-label text-sm font-extrabold">
        {[...row, ...row].map((w, i) => (
          <span key={i} className="flex items-center gap-6">
            {w} <span aria-hidden>✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function Home() {
  return (
    <main className="pb-36">
      <TopBar />

      <section className="px-5 pt-2 animate-rise">
        <div className="font-label text-[10px] font-bold text-muted-foreground">Issue 07 · The autumn drop</div>
        <h1 className="mt-3 font-display text-[3.4rem] leading-[0.92]">
          Swipe your <em className="text-primary">style</em> into existence.
        </h1>
        <p className="mt-4 max-w-[30ch] text-sm text-muted-foreground">
          Right to save. Left to skip. Up for another brand. Then see it on your own 3D twin.
        </p>
      </section>

      <section className="mt-8 px-5">
        <StyleFan />
      </section>

      <section className="mt-6">
        <Marquee />
      </section>

      <section className="mt-12 px-5">
        <div className="flex items-end justify-between">
          <h2 className="font-display text-4xl leading-none">
            Trending <em>fits</em>
          </h2>
          <Link to="/ootd" className="font-label text-[10px] font-bold text-primary">
            See all
          </Link>
        </div>
        <div className="no-scrollbar -mx-5 mt-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5">
          {looks.map((look) => (
            <Link
              key={look.id}
              to="/ootd"
              className="group relative h-72 w-48 shrink-0 snap-start overflow-hidden rounded-3xl"
            >
              <img
                src={look.image}
                alt={look.title}
                loading="lazy"
                className="size-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="scrim absolute inset-0" />
              <span className="glass absolute left-3 top-3 rounded-full px-2.5 py-1 font-label text-[9px] font-bold">
                {look.mood}
              </span>
              <div className="absolute inset-x-0 bottom-0 p-3">
                <div className="font-display text-2xl italic leading-tight">{look.title}</div>
                <div className="text-xs font-bold text-primary">{formatPrice(lookTotal(look))}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-12 grid grid-cols-2 gap-3 px-5">
        <Link
          to="/ootd/try-on"
          className="grain relative col-span-2 overflow-hidden rounded-3xl bg-clay-gradient p-5 text-clay-foreground"
        >
          <Box className="size-6" />
          <div className="mt-8 font-display text-4xl leading-none">
            Your <em>3D twin</em>
          </div>
          <p className="mt-2 max-w-[24ch] text-sm opacity-85">Enter your measurements. See every piece on your exact body.</p>
          <ArrowUpRight className="absolute right-5 top-5 size-6" />
        </Link>
        <Link to="/ootd/wardrobe" className="relative overflow-hidden rounded-3xl bg-card p-4">
          <Shirt className="size-5 text-primary" />
          <div className="mt-6 font-display text-2xl leading-none">
            AI <em>Wardrobe</em>
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">Outfits from clothes you own.</p>
        </Link>
        <Link to="/discover" className="relative overflow-hidden rounded-3xl bg-card p-4">
          <Sparkles className="size-5 text-primary" />
          <div className="mt-6 font-display text-2xl leading-none">
            Start <em>swiping</em>
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">8,000+ pieces, 140 brands.</p>
        </Link>
      </section>

      <section className="mt-12 px-5">
        <h2 className="font-display text-4xl leading-none">
          Shop by <em>drop</em>
        </h2>
        <div className="mt-5 grid grid-cols-3 gap-2.5">
          {categories.map((c, i) => (
            <Link
              key={c.slug}
              to="/discover/$category"
              params={{ category: c.slug }}
              className={cn(
                "group relative overflow-hidden rounded-2xl",
                i === 0 ? "col-span-2 row-span-2 aspect-auto" : "aspect-[3/4]",
              )}
            >
              <img src={c.cover} alt={c.name} loading="lazy" className="size-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="scrim absolute inset-0" />
              <div className="absolute bottom-2 left-2.5 font-label text-[10px] font-bold">{c.name}</div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
