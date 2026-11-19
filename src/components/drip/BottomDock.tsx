import { Link, useRouterState } from "@tanstack/react-router";
import { Compass, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function BottomDock() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const tabs = [
    { to: "/discover" as const, label: "Discover", icon: Compass, active: path.startsWith("/discover") },
    { to: "/ootd" as const, label: "OOTD", icon: Sparkles, active: path.startsWith("/ootd") },
  ];
  return (
    <nav
      aria-label="Main"
      className="fixed bottom-0 left-1/2 z-40 w-full max-w-[440px] -translate-x-1/2 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2"
    >
      <div className="glass shadow-dock grid grid-cols-2 gap-1.5 rounded-full p-1.5">
        {tabs.map(({ to, label, icon: Icon, active }) => (
          <Link
            key={to}
            to={to}
            className={cn(
              "flex h-12 items-center justify-center gap-2 rounded-full text-sm font-label font-bold transition-all duration-300",
              active
                ? "bg-signal text-primary-foreground shadow-glow"
                : "text-foreground/70 hover:bg-foreground/5 hover:text-foreground",
            )}
          >
            <Icon className="size-4" strokeWidth={2.4} />
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
