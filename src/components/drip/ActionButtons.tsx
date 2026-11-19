import { ArrowUp, Heart, ShoppingBag, X } from "lucide-react";
import type { SwipeDir } from "./SwipeDeck";
import { cn } from "@/lib/utils";

type Props = {
  onAction: (dir: SwipeDir) => void;
  upLabel?: string;
  rightKind?: "heart" | "bag";
  className?: string;
};

export function ActionButtons({ onAction, upLabel, rightKind = "heart", className }: Props) {
  const Right = rightKind === "heart" ? Heart : ShoppingBag;
  return (
    <div className={cn("flex items-center justify-center gap-5", className)}>
      <button
        type="button"
        aria-label="Skip"
        onClick={() => onAction("left")}
        className="glass grid size-14 place-items-center rounded-full text-nope transition hover:scale-110 active:scale-95"
      >
        <X className="size-6" strokeWidth={2.6} />
      </button>
      {upLabel && (
        <button
          type="button"
          aria-label={upLabel}
          onClick={() => onAction("up")}
          className="glass flex h-11 items-center gap-1.5 rounded-full px-4 text-xs font-label font-bold text-foreground transition hover:scale-105 active:scale-95"
        >
          <ArrowUp className="size-4" strokeWidth={2.6} />
          {upLabel}
        </button>
      )}
      <button
        type="button"
        aria-label={rightKind === "heart" ? "Save to wishlist" : "Add to bag"}
        onClick={() => onAction("right")}
        className="bg-signal shadow-glow grid size-14 place-items-center rounded-full text-primary-foreground transition hover:scale-110 active:scale-95"
      >
        <Right className="size-6" strokeWidth={2.6} fill="currentColor" />
      </button>
    </div>
  );
}
