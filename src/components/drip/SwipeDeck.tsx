import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type ReactNode,
  type Ref,
} from "react";
import { cn } from "@/lib/utils";

export type SwipeDir = "left" | "right" | "up";
export type SwipeDeckHandle = { swipe: (dir: SwipeDir) => void; reset: () => void };

type Props<T> = {
  items: T[];
  getKey: (item: T) => string;
  renderCard: (item: T, active: boolean) => ReactNode;
  /** Return "stay" to keep the card (e.g. swipe up to change brand). */
  onSwipe?: (dir: SwipeDir, item: T) => "stay" | void;
  onTap?: (item: T) => void;
  onIndexChange?: (index: number) => void;
  allowUp?: boolean;
  labels?: { left: string; right: string; up?: string };
  empty?: ReactNode;
  className?: string;
  ref?: Ref<SwipeDeckHandle>;
};

const THRESHOLD = 110;
const EXIT_MS = 280;

export function SwipeDeck<T>({
  items,
  getKey,
  renderCard,
  onSwipe,
  onTap,
  onIndexChange,
  allowUp = false,
  labels = { left: "Nope", right: "Save" },
  empty,
  className,
  ref,
}: Props<T>) {
  const [index, setIndex] = useState(0);
  const [drag, setDrag] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [exiting, setExiting] = useState<SwipeDir | null>(null);
  const [entering, setEntering] = useState(false);
  const start = useRef<{ x: number; y: number } | null>(null);
  const busy = useRef(false);

  const current = items[index];

  const swipe = useCallback(
    (dir: SwipeDir) => {
      if (busy.current || !current) return;
      if (dir === "up" && !allowUp) return;
      busy.current = true;
      setExiting(dir);
      window.setTimeout(() => {
        const result = onSwipe?.(dir, current);
        setDrag({ x: 0, y: 0 });
        setExiting(null);
        if (result === "stay") {
          setEntering(true);
          requestAnimationFrame(() =>
            requestAnimationFrame(() => {
              setEntering(false);
              busy.current = false;
            }),
          );
        } else {
          setIndex((i) => {
            const next = i + 1;
            onIndexChange?.(next);
            return next;
          });
          busy.current = false;
        }
      }, EXIT_MS);
    },
    [allowUp, current, onSwipe, onIndexChange],
  );

  useImperativeHandle(
    ref,
    () => ({
      swipe,
      reset: () => {
        setIndex(0);
        onIndexChange?.(0);
      },
    }),
    [swipe, onIndexChange],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === "ArrowLeft") swipe("left");
      if (e.key === "ArrowRight") swipe("right");
      if (e.key === "ArrowUp" && allowUp) {
        e.preventDefault();
        swipe("up");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [swipe, allowUp]);

  const onPointerDown = (e: React.PointerEvent) => {
    if (busy.current) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    start.current = { x: e.clientX, y: e.clientY };
    setDragging(true);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!start.current) return;
    const x = e.clientX - start.current.x;
    let y = e.clientY - start.current.y;
    if (!allowUp && y < 0) y = y * 0.25;
    setDrag({ x, y });
  };
  const onPointerUp = () => {
    if (!start.current) return;
    start.current = null;
    setDragging(false);
    const { x, y } = drag;
    const moved = Math.abs(x) + Math.abs(y);
    if (moved < 6) {
      setDrag({ x: 0, y: 0 });
      if (current) onTap?.(current);
      return;
    }
    if (allowUp && y < -THRESHOLD && Math.abs(y) > Math.abs(x)) return swipe("up");
    if (x > THRESHOLD) return swipe("right");
    if (x < -THRESHOLD) return swipe("left");
    setDrag({ x: 0, y: 0 });
  };

  if (!current) {
    return <div className={cn("relative", className)}>{empty}</div>;
  }

  const progress = Math.min(1, Math.max(Math.abs(drag.x), Math.abs(drag.y)) / THRESHOLD);
  const upIntent = allowUp && drag.y < 0 && Math.abs(drag.y) > Math.abs(drag.x);

  let transform = `translate(${drag.x}px, ${drag.y}px) rotate(${drag.x / 18}deg)`;
  let opacity = 1;
  if (exiting === "right") transform = `translate(140%, ${drag.y}px) rotate(24deg)`;
  if (exiting === "left") transform = `translate(-140%, ${drag.y}px) rotate(-24deg)`;
  if (exiting === "up") {
    transform = "translate(0, -120%) rotate(0deg)";
    opacity = 0;
  }
  if (entering) {
    transform = "translate(0, 48px) scale(0.94)";
    opacity = 0;
  }

  const likeOpacity = upIntent ? 0 : Math.max(0, Math.min(1, drag.x / 90));
  const nopeOpacity = upIntent ? 0 : Math.max(0, Math.min(1, -drag.x / 90));
  const upOpacity = upIntent ? Math.min(1, -drag.y / 90) : 0;

  return (
    <div className={cn("relative select-none", className)}>
      {items.slice(index + 1, index + 3).map((item, i) => {
        const depth = i + 1;
        const lift = depth === 1 ? progress : 0;
        const scale = 1 - depth * 0.05 + lift * 0.05;
        const ty = depth * 14 - lift * 14;
        return (
          <div
            key={getKey(item)}
            className="absolute inset-0 overflow-hidden rounded-[2rem] transition-transform duration-300"
            style={{ transform: `translateY(${ty}px) scale(${scale})`, zIndex: 10 - depth }}
            aria-hidden
          >
            {renderCard(item, false)}
            <div className="absolute inset-0 bg-background/40" />
          </div>
        );
      }).reverse()}

      <div
        key={getKey(current)}
        role="group"
        aria-label="Swipe card"
        className="absolute inset-0 z-20 cursor-grab touch-none overflow-hidden rounded-[2rem] shadow-card active:cursor-grabbing"
        style={{
          transform,
          opacity,
          transition: dragging || entering ? "none" : `transform ${EXIT_MS}ms cubic-bezier(.2,.8,.2,1), opacity ${EXIT_MS}ms ease`,
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {renderCard(current, true)}

        <div
          className="pointer-events-none absolute left-6 top-24 -rotate-12 text-like stamp text-2xl"
          style={{ opacity: likeOpacity }}
        >
          {labels.right}
        </div>
        <div
          className="pointer-events-none absolute right-6 top-24 rotate-12 text-nope stamp text-2xl"
          style={{ opacity: nopeOpacity }}
        >
          {labels.left}
        </div>
        {allowUp && labels.up && (
          <div
            className="pointer-events-none absolute inset-x-0 bottom-1/2 mx-auto w-fit text-shift stamp text-xl"
            style={{ opacity: upOpacity }}
          >
            {labels.up}
          </div>
        )}
      </div>
    </div>
  );
}
