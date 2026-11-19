import type { ReactNode } from "react";
import { TopBar } from "./TopBar";

export function FeatureIntro({ title, kicker, children }: { title: ReactNode; kicker: string; children: ReactNode }) {
  return (
    <main className="pb-36">
      <TopBar back title={kicker} />
      <section className="px-5 pt-4">
        <h1 className="font-display text-5xl leading-[0.95]">{title}</h1>
        <div className="mt-6 space-y-4 text-sm text-muted-foreground">{children}</div>
      </section>
    </main>
  );
}
