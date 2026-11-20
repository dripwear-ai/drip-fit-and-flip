import { ClientOnly, createFileRoute } from "@tanstack/react-router";
import { Check, Ruler, ScanLine, Shirt, Sparkles } from "lucide-react";
import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { TopBar } from "@/components/drip/TopBar";
import { Slider } from "@/components/ui/slider";
import { formatPrice, looks, products, type Product } from "@/lib/catalog";
import { defaultBody, fitReport, recommendSize, skinTones, type Body, type GarmentKind } from "@/lib/fit";
import { cn } from "@/lib/utils";

const BodyTwin3D = lazy(() => import("@/components/drip/BodyTwin3D"));

export const Route = createFileRoute("/ootd/try-on")({
  head: () => ({
    meta: [
      { title: "3D Virtual Try-On — Drip" },
      { name: "description", content: "Enter your measurements to build a 3D twin and see exactly how each piece fits." },
      { property: "og:title", content: "3D Virtual Try-On — Drip" },
      { property: "og:description", content: "Your exact body, in 3D, wearing every piece." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TryOn,
});

const BODY_KEY = "drip-body-v1";

const sliders: { key: keyof Omit<Body, "skin">; label: string; min: number; max: number; unit: string }[] = [
  { key: "height", label: "Height", min: 145, max: 205, unit: "cm" },
  { key: "weight", label: "Weight", min: 40, max: 130, unit: "kg" },
  { key: "chest", label: "Chest", min: 72, max: 130, unit: "cm" },
  { key: "waist", label: "Waist", min: 56, max: 120, unit: "cm" },
  { key: "hips", label: "Hips", min: 76, max: 136, unit: "cm" },
  { key: "shoulder", label: "Shoulder width", min: 34, max: 56, unit: "cm" },
  { key: "inseam", label: "Inseam", min: 64, max: 96, unit: "cm" },
];

const kindOf = (p: Product): GarmentKind =>
  p.category === "jeans" ? "bottom" : p.category === "dresses" ? "dress" : p.category === "sneakers" ? "shoes" : "top";
const longSleeve = new Set(["oxford", "linen", "suede", "biker", "trucker"]);

type Wearing = { top?: Product | undefined; bottom?: Product | undefined; dress?: Product | undefined; shoes?: Product | undefined; focus?: Product | undefined };

const statusStyle = {
  snug: "bg-nope",
  perfect: "bg-primary",
  relaxed: "bg-clay",
} as const;

function TwinFallback() {
  return (
    <div className="grid size-full place-items-center">
      <div className="text-center">
        <ScanLine className="mx-auto size-8 animate-pulse text-primary" />
        <div className="mt-2 font-label text-[10px] font-bold text-muted-foreground">Printing your twin…</div>
      </div>
    </div>
  );
}

function GarmentRow({ title, items, active, onPick }: { title: string; items: Product[]; active?: string | undefined; onPick: (p: Product) => void }) {
  return (
    <div>
      <div className="mb-2 font-label text-[10px] font-bold text-muted-foreground">{title}</div>
      <div className="no-scrollbar -mx-5 flex gap-2.5 overflow-x-auto px-5">
        {items.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onPick(p)}
            aria-pressed={active === p.id}
            className={cn(
              "relative h-28 w-20 shrink-0 overflow-hidden rounded-2xl ring-2 transition",
              active === p.id ? "ring-primary" : "ring-transparent opacity-80 hover:opacity-100",
            )}
          >
            <img src={p.image} alt={p.name} loading="lazy" className="size-full object-cover" />
            {active === p.id && (
              <span className="absolute right-1.5 top-1.5 grid size-5 place-items-center rounded-full bg-primary text-primary-foreground">
                <Check className="size-3" strokeWidth={3} />
              </span>
            )}
            <span className="scrim absolute inset-0" />
            <span className="absolute inset-x-1.5 bottom-1.5 line-clamp-2 text-left text-[10px] font-bold leading-tight">{p.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function TryOn() {
  const [body, setBody] = useState<Body>(defaultBody);
  const [tab, setTab] = useState<"body" | "wear">("body");
  const [wearing, setWearing] = useState<Wearing>(() => ({
    top: products.find((p) => p.id === "oxford"),
    bottom: products.find((p) => p.id === "baggy"),
    shoes: products.find((p) => p.id === "minimal"),
    focus: products.find((p) => p.id === "oxford"),
  }));
  const [lookColors, setLookColors] = useState<{ top: string; bottom: string; title: string } | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(BODY_KEY);
      if (raw) setBody({ ...defaultBody, ...JSON.parse(raw) });
    } catch {
      /* ignore */
    }
  }, []);

  const saveTwin = () => {
    window.localStorage.setItem(BODY_KEY, JSON.stringify(body));
    toast.success("Your 3D twin is saved", { description: "Every piece you swipe will be sized to it." });
    setTab("wear");
  };

  const pick = (p: Product) => {
    setLookColors(null);
    const k = kindOf(p);
    setWearing((w) => {
      if (k === "dress") return { ...w, dress: w.dress?.id === p.id ? undefined : p, focus: p };
      if (k === "top") return { ...w, top: p, dress: undefined, focus: p };
      if (k === "bottom") return { ...w, bottom: p, dress: undefined, focus: p };
      return { ...w, shoes: p, focus: w.focus };
    });
  };

  const outfit = lookColors
    ? { top: lookColors.top, bottom: lookColors.bottom, shoes: wearing.shoes?.color, longSleeve: true }
    : {
        top: wearing.top?.color,
        bottom: wearing.bottom?.color,
        dress: wearing.dress?.color,
        shoes: wearing.shoes?.color,
        longSleeve: wearing.top ? longSleeve.has(wearing.top.id) : false,
      };

  const focus = wearing.focus;
  const focusKind = focus ? kindOf(focus) : "top";
  const focusFit = focus?.variants[0]?.fit ?? "Regular";
  const size = recommendSize(focusKind, body);
  const report = useMemo(() => fitReport(focusKind, body, focusFit), [focusKind, body, focusFit]);

  const byCat = (c: Product["category"][]) => products.filter((p) => c.includes(p.category));

  return (
    <main className="pb-32">
      <TopBar back title="3D Try-On" />

      <section className="px-4">
        <div className="relative h-[50dvh] min-h-[340px] overflow-hidden rounded-[2rem] shadow-card">
          <ClientOnly fallback={<TwinFallback />}>
            <Suspense fallback={<TwinFallback />}>
              <BodyTwin3D body={body} outfit={outfit} />
            </Suspense>
          </ClientOnly>
          <div className="pointer-events-none absolute inset-x-3 top-3 flex items-start justify-between">
            <span className="glass rounded-full px-3 py-1.5 font-label text-[9px] font-bold">
              Digital twin · {body.height}cm · {body.weight}kg
            </span>
            {focus && (
              <span className="bg-signal rounded-full px-3 py-1.5 font-label text-[10px] font-extrabold text-primary-foreground">
                Size {size}
              </span>
            )}
          </div>
          <div className="pointer-events-none absolute inset-x-0 bottom-3 text-center font-label text-[9px] font-bold text-foreground/60">
            Drag to rotate · pinch to zoom
          </div>
        </div>
      </section>

      <div className="mx-5 mt-4 grid grid-cols-2 gap-1 rounded-full bg-secondary p-1">
        {(
          [
            ["body", "Your body", Ruler],
            ["wear", "Try on", Shirt],
          ] as const
        ).map(([k, label, Icon]) => (
          <button
            key={k}
            type="button"
            onClick={() => setTab(k)}
            className={cn(
              "flex h-10 items-center justify-center gap-2 rounded-full font-label text-[10px] font-bold transition",
              tab === k ? "bg-foreground text-background" : "text-foreground/70",
            )}
          >
            <Icon className="size-3.5" /> {label}
          </button>
        ))}
      </div>

      {tab === "body" ? (
        <section className="mt-5 space-y-5 px-5 animate-rise">
          {sliders.map((s) => (
            <div key={s.key}>
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-muted-foreground">{s.label}</span>
                <span className="font-display text-2xl">
                  {body[s.key]}
                  <span className="ml-1 text-sm text-muted-foreground">{s.unit}</span>
                </span>
              </div>
              <Slider
                className="mt-2"
                min={s.min}
                max={s.max}
                step={1}
                value={[body[s.key]]}
                onValueChange={([v]) => setBody((b) => ({ ...b, [s.key]: v ?? b[s.key] }))}
                aria-label={s.label}
              />
            </div>
          ))}
          <div>
            <div className="text-sm text-muted-foreground">Skin tone</div>
            <div className="mt-2 flex gap-2.5">
              {skinTones.map((t) => (
                <button
                  key={t}
                  type="button"
                  aria-label={`Skin tone ${t}`}
                  onClick={() => setBody((b) => ({ ...b, skin: t }))}
                  className={cn(
                    "size-9 rounded-full ring-2 ring-offset-2 ring-offset-background transition",
                    body.skin === t ? "ring-primary" : "ring-transparent",
                  )}
                  style={{ backgroundColor: t }}
                />
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={saveTwin}
            className="bg-signal shadow-glow flex h-13 w-full items-center justify-center gap-2 rounded-full py-4 font-label text-xs font-extrabold text-primary-foreground"
          >
            <ScanLine className="size-4" /> Save my 3D twin
          </button>
        </section>
      ) : (
        <section className="mt-5 space-y-5 px-5 animate-rise">
          {focus && (
            <div className="rounded-3xl bg-card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-label text-[9px] font-bold text-primary">{focus.variants[0]?.brand}</div>
                  <div className="font-display text-2xl leading-tight">{focus.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {focusFit} cut · {formatPrice(focus.variants[0]?.price ?? 0)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="font-display text-5xl leading-none text-primary">{size}</div>
                  <div className="font-label text-[8px] font-bold text-muted-foreground">Your size</div>
                </div>
              </div>
              {report.length > 0 && (
                <div className="mt-4 space-y-2.5">
                  {report.map((z) => (
                    <div key={z.zone} className="flex items-center gap-3 text-xs">
                      <span className="w-12 text-muted-foreground">{z.zone}</span>
                      <div className="relative h-1.5 flex-1 rounded-full bg-secondary">
                        <span
                          className={cn("absolute inset-y-0 left-0 rounded-full", statusStyle[z.status])}
                          style={{ width: `${Math.min(100, Math.max(12, 30 + z.ease * 4))}%` }}
                        />
                      </div>
                      <span className="w-24 text-right font-bold capitalize">
                        {z.status} <span className="font-normal text-muted-foreground">{z.ease >= 0 ? "+" : ""}{z.ease}cm</span>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <GarmentRow title="Tops & jackets" items={byCat(["shirts", "jackets"])} active={lookColors ? undefined : wearing.dress ? undefined : wearing.top?.id} onPick={pick} />
          <GarmentRow title="Bottoms" items={byCat(["jeans"])} active={lookColors || wearing.dress ? undefined : wearing.bottom?.id} onPick={pick} />
          <GarmentRow title="Dresses" items={byCat(["dresses"])} active={wearing.dress?.id} onPick={pick} />
          <GarmentRow title="Sneakers" items={byCat(["sneakers"])} active={wearing.shoes?.id} onPick={pick} />

          <div>
            <div className="mb-2 font-label text-[10px] font-bold text-muted-foreground">Full looks</div>
            <div className="flex flex-wrap gap-2">
              {looks.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => {
                    setLookColors({ top: l.top, bottom: l.bottom, title: l.title });
                    toast(`Wearing ${l.title}`, { description: formatPrice(l.pieces.reduce((s, p) => s + p.price, 0)) });
                  }}
                  className={cn(
                    "flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-bold transition",
                    lookColors?.title === l.title ? "border-primary text-primary" : "border-border",
                  )}
                >
                  <Sparkles className="size-3.5" /> {l.title}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
