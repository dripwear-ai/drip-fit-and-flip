import { Link } from "@tanstack/react-router";
import { ChevronLeft, Heart, ShoppingBag, User } from "lucide-react";
import type { ReactNode } from "react";
import { useProfile } from "@/hooks/use-drip-data";
import { useSaved } from "@/hooks/use-saved";
import { cn } from "@/lib/utils";

export function DripLogo({ className }: { className?: string }) {
  return (
    <Link to="/" className={cn("font-display text-3xl italic leading-none", className)} aria-label="Drip home">
      Drip<span className="text-primary">.</span>
    </Link>
  );
}

export function IconBadgeLink({ to, label, count, children }: { to: "/wishlist"; label: string; count: number; children: ReactNode }) {
  return (
    <Link
      to={to}
      aria-label={label}
      className="glass relative grid size-10 place-items-center rounded-full text-foreground transition hover:scale-105"
    >
      {children}
      {count > 0 && (
        <span className="absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
          {count}
        </span>
      )}
    </Link>
  );
}

export function TopBar({ title, back, overlay = false }: { title?: ReactNode; back?: boolean; overlay?: boolean }) {
  const { count, bag, signedIn } = useSaved();
  const profile = useProfile();
  const avatar = signedIn ? profile.data?.avatar_url : null;
  const initial = profile.data?.display_name?.trim().charAt(0).toUpperCase();
  return (
    <header
      className={cn(
        "z-30 flex h-16 items-center justify-between gap-3 px-5",
        overlay ? "absolute inset-x-0 top-0" : "relative",
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        {back ? (
          <button
            type="button"
            onClick={() => window.history.back()}
            aria-label="Go back"
            className="glass grid size-10 place-items-center rounded-full"
          >
            <ChevronLeft className="size-5" />
          </button>
        ) : (
          <DripLogo />
        )}
        {title && <div className="truncate font-label text-xs font-bold">{title}</div>}
      </div>
      <div className="flex items-center gap-2">
        <IconBadgeLink to="/wishlist" label="Wishlist" count={count}>
          <Heart className="size-[18px]" />
        </IconBadgeLink>
        <IconBadgeLink to="/wishlist" label="Bag" count={bag.length}>
          <ShoppingBag className="size-[18px]" />
        </IconBadgeLink>
        <Link
          to="/auth"
          aria-label={signedIn ? "Your account" : "Sign in"}
          className="glass grid size-10 place-items-center overflow-hidden rounded-full text-foreground transition hover:scale-105"
        >
          {avatar ? (
            <img src={avatar} alt="" className="size-full object-cover" referrerPolicy="no-referrer" />
          ) : signedIn && initial ? (
            <span className="font-label text-xs font-extrabold text-primary">{initial}</span>
          ) : (
            <User className="size-[18px]" />
          )}
        </Link>
      </div>
    </header>
  );
}
