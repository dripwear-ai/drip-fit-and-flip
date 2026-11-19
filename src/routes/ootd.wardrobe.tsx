import { createFileRoute } from "@tanstack/react-router";
import { FeatureIntro } from "@/components/drip/ComingSoon";
import { formatPrice, wardrobeGaps } from "@/lib/catalog";

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
  component: () => (
    <FeatureIntro kicker="AI Wardrobe" title={<>Your closet, <em className="text-primary">styled.</em></>}>
      <p>Upload photos of your clothes and the AI stylist builds outfits from them. Missing pieces it would add:</p>
      {wardrobeGaps.map((g) => (
        <div key={g.product.id} className="flex items-center gap-3 rounded-2xl bg-card p-3">
          <img src={g.product.image} alt={g.product.name} className="size-16 rounded-xl object-cover" />
          <div className="flex-1">
            <div className="font-bold text-foreground">{g.product.name}</div>
            <div className="text-xs">{g.reason} · unlocks {g.unlocks} outfits</div>
          </div>
          <div className="text-sm font-bold text-primary">{formatPrice(g.product.variants[0]?.price ?? 0)}</div>
        </div>
      ))}
    </FeatureIntro>
  ),
});
