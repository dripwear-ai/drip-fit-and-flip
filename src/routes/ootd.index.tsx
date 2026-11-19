import { createFileRoute, Link } from "@tanstack/react-router";
import { Box, RotateCcw, Shirt } from "lucide-react";
import { useRef } from "react";
import { toast } from "sonner";
import { ActionButtons } from "@/components/drip/ActionButtons";
import { SwipeDeck, type SwipeDeckHandle } from "@/components/drip/SwipeDeck";
import { TopBar } from "@/components/drip/TopBar";
import { formatPrice, lookTotal, looks } from "@/lib/catalog";
import { dripActions } from "@/lib/drip-store";

export const Route = createFileRoute("/ootd/")({
  head: () => ({
    meta: [
      { title: "OOTD — Complete outfits on Drip" },
      { name: "description", content: "Swipe complete outfits, try them on in 3D and style your own wardrobe with AI." },
      { property: "og:title", content: "OOTD — Complete outfits on Drip" },
      { property: "og:description", content: "Full-screen outfit cards you can buy in one swipe." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Ootd,
});

function Ootd() {
  const deck = useRef<SwipeDeckHandle>(null);
  return (
    <main className="flex h-dvh flex-col pb-24">
      <TopBar title="Outfit of the day" />
      <div className="grid grid-cols-2 gap-2.5 px-5">
        <Link to="/ootd/wardrobe" className="glass flex items-center gap-2.5 rounded-2xl p-3">
          <Shirt className="size-5 text-primary" />
          <div className="font-display text-xl italic leading-none">AI Wardrobe</div>
        </Link>
        <Link to="/ootd/try-on" className="bg-clay-gradient flex items-center gap-2.5 rounded-2xl p-3 text-clay-foreground">
          <Box className="size-5" />
          <div className="font-display text-xl italic leading-none">3D Try-On</div>
        </Link>
      </div>
      <div className="relative mt-3 flex-1 px-3">
        <SwipeDeck
          ref={deck}
          items={looks}
          getKey={(l) => l.id}
          labels={{ left: "Pass", right: "Cop it" }}
          className="size-full"
          onSwipe={(dir, l) => {
            if (dir === "right") {
              dripActions.addToBag({ key: l.id, name: l.title, brand: l.creator, price: lookTotal(l), image: l.image, kind: "look" });
              toast.success("Full look added to bag", { description: `${l.title} · ${formatPrice(lookTotal(l))}` });
            }
          }}
          renderCard={(l) => (
            <div className="relative size-full">
              <img src={l.image} alt={l.title} className="size-full object-cover" draggable={false} />
              <div className="scrim absolute inset-0" />
              <div className="absolute inset-x-0 bottom-0 p-5">
                <div className="font-label text-[10px] font-bold text-primary">{l.mood} · {l.creator}</div>
                <div className="font-display text-5xl italic leading-[0.95]">{l.title}</div>
                <ul className="mt-3 space-y-1 text-xs">
                  {l.pieces.map((p) => (
                    <li key={p.name} className="flex justify-between text-foreground/85">
                      <span>{p.name} · <span className="text-muted-foreground">{p.brand}</span></span>
                      <span>{formatPrice(p.price)}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 text-2xl font-bold">{formatPrice(lookTotal(l))}</div>
              </div>
            </div>
          )}
          empty={
            <div className="grid size-full place-items-center rounded-[2rem] border border-dashed border-border text-center">
              <div>
                <div className="font-display text-4xl italic">That’s today’s fits.</div>
                <button type="button" onClick={() => deck.current?.reset()} className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 font-label text-[10px] font-bold text-primary-foreground">
                  <RotateCcw className="size-3.5" /> Start over
                </button>
              </div>
            </div>
          }
        />
      </div>
      <ActionButtons className="mt-4" rightKind="bag" onAction={(d) => deck.current?.swipe(d)} />
    </main>
  );
}
