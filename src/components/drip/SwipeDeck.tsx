import {
  animate,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useTransform,
  type MotionValue,
  type PanInfo,
} from "motion/react";
import { useCallback, useEffect, useImperativeHandle, useRef, useState, type ReactNode, type Ref } from "react";
import { decideSwipe, haptic, tiltFor, type SwipeDir } from "@/lib/swipe-physics";
import { cn } from "@/lib/utils";

export type { SwipeDir };
export type SwipeDeckHandle = {
  swipe: (dir: SwipeDir) => void;
  undo: () => void;
  reset: () => void;
};

type Props<T> = {
  items: T[];
  getKey: (item: T) => string;
  renderCard: (item: T, active: boolean) => ReactNode;
  /** Return "stay" to keep the card (swipe up = flip to the next brand). */
  onSwipe?: (dir: SwipeDir, item: T) => "stay" | void;
  onUndo?: (dir: SwipeDir, item: T) => void;
  onTap?: (item: T) => void;
  onIndexChange?: (index: number) => void;
  onHistoryChange?: (canUndo: boolean) => void;
  /** Image URL used to preload the next 3 cards. */
  getImage?: (item: T) => string | undefined;
  loading?: boolean;
  allowUp?: boolean;
  labels?: { left: string; right: string; up?: string };
  empty?: ReactNode;
  className?: string;
  ref?: Ref<SwipeDeckHandle>;
};

const SPRING = { type: "spring" as const, stiffness: 420, damping: 32, mass: 0.9 };
const PRELOAD = 3;

type CardHandle = { fly: (dir: SwipeDir) => void };

function TopCard({
  children,
  allowUp,
  labels,
  enterFrom,
  progress,
  onCommit,
  onFlip,
  onTap,
  ref,
}: {
  children: ReactNode;
  allowUp: boolean;
  labels: { left: string; right: string; up?: string };
  enterFrom: SwipeDir | null;
  progress: MotionValue<number>;
  onCommit: (dir: SwipeDir) => void;
  onFlip: () => void;
  onTap?: () => void;
  ref?: Ref<CardHandle>;
}) {
  const width = typeof window === "undefined" ? 400 : Math.min(window.innerWidth, 440);
  const x = useMotionValue(enterFrom === "right" ? width * 1.3 : enterFrom === "left" ? -width * 1.3 : 0);
  const y = useMotionValue(0);
  const rotateX = useMotionValue(0);
  const rotate = useTransform(x, (v) => tiltFor(v, width));
  const likeOpacity = useTransform(x, [24, 130], [0, 1]);
  const nopeOpacity = useTransform(x, [-130, -24], [1, 0]);
  const upOpacity = useTransform(y, [-130, -24], [1, 0]);
  const likeTint = useTransform(likeOpacity, (v) => v * 0.45);
  const nopeTint = useTransform(nopeOpacity, (v) => v * 0.45);
  const busy = useRef(false);
  const armed = useRef<SwipeDir | null>(null);

  useEffect(() => {
    if (enterFrom) {
      busy.current = true;
      void animate(x, 0, SPRING).then(() => (busy.current = false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const track = () => {
    progress.set(Math.min(1, Math.max(Math.abs(x.get()), Math.abs(y.get())) / 130));
    const dir = decideSwipe({ offset: { x: x.get(), y: y.get() }, velocity: { x: 0, y: 0 }, allowUp });
    if (dir !== armed.current) {
      if (dir) haptic(8); // tick when crossing into a commit zone
      armed.current = dir;
    }
  };
  useMotionValueEvent(x, "change", track);
  useMotionValueEvent(y, "change", track);

  const fly = useCallback(
    async (dir: SwipeDir, velocity = { x: 0, y: 0 }) => {
      if (busy.current) return;
      busy.current = true;
      if (dir === "up") {
        haptic([6, 40, 10]);
        await Promise.all([
          animate(x, 0, SPRING),
          animate(y, 0, SPRING),
          animate(rotateX, 90, { duration: 0.17, ease: "easeIn" }),
        ]);
        onFlip();
        rotateX.set(-90);
        await animate(rotateX, 0, { type: "spring", stiffness: 260, damping: 20 });
        busy.current = false;
        return;
      }
      haptic(dir === "right" ? [14] : [8]);
      const target = (dir === "right" ? 1 : -1) * width * 1.4;
      const vx = dir === "right" ? Math.max(velocity.x, 800) : Math.min(velocity.x, -800);
      await Promise.all([
        animate(x, target, { type: "spring", velocity: vx, stiffness: 200, damping: 30, restDelta: 30, restSpeed: 500 }),
        animate(y, y.get() + velocity.y * 0.15, { duration: 0.3 }),
      ]);
      onCommit(dir);
    },
    [onCommit, onFlip, rotateX, width, x, y],
  );

  useImperativeHandle(ref, () => ({ fly: (dir) => void fly(dir) }), [fly]);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    const dir = decideSwipe({ offset: info.offset, velocity: info.velocity, allowUp });
    if (dir) {
      void fly(dir, info.velocity);
      return;
    }
    void animate(x, 0, { ...SPRING, velocity: info.velocity.x });
    void animate(y, 0, { ...SPRING, velocity: info.velocity.y });
  };

  return (
    <motion.div
      role="group"
      aria-label="Swipe card"
      className="absolute inset-0 z-20 cursor-grab touch-none overflow-hidden rounded-[2rem] shadow-card active:cursor-grabbing"
      style={{ x, y, rotate, rotateX, transformPerspective: 1200 }}
      drag={!busy.current}
      dragMomentum={false}
      dragElastic={0.9}
      onDragEnd={onDragEnd}
      onTap={() => !busy.current && onTap?.()}
    >
      {children}
      <motion.div className="pointer-events-none absolute inset-0 bg-like mix-blend-multiply" style={{ opacity: likeTint }} />
      <motion.div className="pointer-events-none absolute inset-0 bg-nope mix-blend-multiply" style={{ opacity: nopeTint }} />
      <motion.div
        className="pointer-events-none absolute left-6 top-24 -rotate-12 text-like stamp text-3xl"
        style={{ opacity: likeOpacity }}
      >
        {labels.right}
      </motion.div>
      <motion.div
        className="pointer-events-none absolute right-6 top-24 rotate-12 text-nope stamp text-3xl"
        style={{ opacity: nopeOpacity }}
      >
        {labels.left}
      </motion.div>
      {allowUp && labels.up && (
        <motion.div
          className="pointer-events-none absolute inset-x-0 bottom-1/2 mx-auto w-fit text-shift stamp text-xl"
          style={{ opacity: upOpacity }}
        >
          {labels.up}
        </motion.div>
      )}
    </motion.div>
  );
}

function BehindCard({ children, depth, progress }: { children: ReactNode; depth: number; progress: MotionValue<number> }) {
  const scale = useTransform(progress, [0, 1], depth === 1 ? [0.95, 1] : [0.9, 0.95]);
  const y = useTransform(progress, [0, 1], depth === 1 ? [14, 0] : [28, 14]);
  return (
    <motion.div className="absolute inset-0 overflow-hidden rounded-[2rem]" style={{ scale, y, zIndex: 10 - depth }} aria-hidden>
      {children}
      <div className="absolute inset-0 bg-background/40" />
    </motion.div>
  );
}

export function SwipeDeckSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("relative", className)} aria-busy="true" aria-label="Loading cards">
      <div className="absolute inset-0 translate-y-7 scale-90 rounded-[2rem] bg-card/50" />
      <div className="absolute inset-0 translate-y-3.5 scale-95 rounded-[2rem] bg-card/70" />
      <div className="absolute inset-0 overflow-hidden rounded-[2rem] bg-card">
        <div className="skeleton-sheen absolute inset-0" />
        <div className="absolute inset-x-5 bottom-6 space-y-3">
          <div className="h-3 w-24 rounded-full bg-muted" />
          <div className="h-10 w-3/4 rounded-xl bg-muted" />
          <div className="h-6 w-1/3 rounded-lg bg-muted" />
          <div className="flex gap-2">
            <div className="h-6 w-16 rounded-full bg-muted" />
            <div className="h-6 w-20 rounded-full bg-muted" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function SwipeDeck<T>({
  items,
  getKey,
  renderCard,
  onSwipe,
  onUndo,
  onTap,
  onIndexChange,
  onHistoryChange,
  getImage,
  loading = false,
  allowUp = false,
  labels = { left: "Nope", right: "Like" },
  empty,
  className,
  ref,
}: Props<T>) {
  const [index, setIndex] = useState(0);
  const [history, setHistory] = useState<SwipeDir[]>([]);
  const [enterFrom, setEnterFrom] = useState<SwipeDir | null>(null);
  const [generation, setGeneration] = useState(0);
  const card = useRef<CardHandle>(null);
  const progress = useMotionValue(0);
  const current = items[index];

  useEffect(() => onIndexChange?.(index), [index, onIndexChange]);
  useEffect(() => onHistoryChange?.(history.length > 0), [history, onHistoryChange]);

  // Preload the next cards' images so they are decoded before they reach the top.
  useEffect(() => {
    if (!getImage) return;
    items.slice(index + 1, index + 1 + PRELOAD).forEach((it) => {
      const src = getImage(it);
      if (!src) return;
      const img = new Image();
      img.decoding = "async";
      img.src = src;
    });
  }, [index, items, getImage]);

  const commit = useCallback(
    (dir: SwipeDir) => {
      if (!current) return;
      onSwipe?.(dir, current);
      progress.set(0);
      setEnterFrom(null);
      setHistory((h) => [...h, dir]);
      setIndex((i) => i + 1);
    },
    [current, onSwipe, progress],
  );

  const flip = useCallback(() => {
    if (current) onSwipe?.("up", current);
  }, [current, onSwipe]);

  const undo = useCallback(() => {
    const last = history[history.length - 1];
    const prev = items[index - 1];
    if (!last || !prev) return;
    haptic([4, 30, 4]);
    setHistory((h) => h.slice(0, -1));
    setEnterFrom(last);
    setGeneration((g) => g + 1);
    setIndex((i) => i - 1);
    onUndo?.(last, prev);
  }, [history, index, items, onUndo]);

  useImperativeHandle(
    ref,
    () => ({
      swipe: (dir) => {
        if (dir === "up" && !allowUp) return;
        card.current?.fly(dir);
      },
      undo,
      reset: () => {
        setHistory([]);
        setEnterFrom(null);
        setIndex(0);
      },
    }),
    [allowUp, undo],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "ArrowLeft") card.current?.fly("left");
      if (e.key === "ArrowRight") card.current?.fly("right");
      if (e.key === "ArrowUp" && allowUp) {
        e.preventDefault();
        card.current?.fly("up");
      }
      if (e.key === "Backspace" || (e.key === "z" && (e.metaKey || e.ctrlKey))) undo();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [allowUp, undo]);

  if (loading) return <SwipeDeckSkeleton className={className} />;
  if (!current) return <div className={cn("relative", className)}>{empty}</div>;

  return (
    <div className={cn("relative select-none", className)} style={{ perspective: 1200 }}>
      {items
        .slice(index + 1, index + 3)
        .map((item, i) => (
          <BehindCard key={getKey(item)} depth={i + 1} progress={progress}>
            {renderCard(item, false)}
          </BehindCard>
        ))
        .reverse()}
      <TopCard
        key={`${getKey(current)}-${generation}`}
        ref={card}
        allowUp={allowUp}
        labels={labels}
        enterFrom={enterFrom}
        progress={progress}
        onCommit={commit}
        onFlip={flip}
        onTap={onTap ? () => onTap(current) : undefined}
      >
        {renderCard(current, true)}
      </TopCard>
    </div>
  );
}
