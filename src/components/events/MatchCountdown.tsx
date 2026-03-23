import { useState, useEffect, useRef, useMemo } from "react";
import { motion } from "framer-motion";

interface MatchCountdownProps {
  targetTime: Date;
  onComplete: () => void;
  eventTitle: string;
}

const CONFETTI_DURATION_MS = 2500;
const CONFETTI_COLORS = [
  "hsl(346 96% 62%)",
  "hsl(338 100% 72%)",
  "#f94272", "#ff6b9d", "#fda4c2", "#ffc2d9", "#ffe4ef", "#ffffff",
];

const ROW_HEIGHT = 128; // height of each row in the reel (more space between numbers)

const EXCITEMENT_TEXTS: Record<number, string> = {
  10: "Get ready!",
  9: "Here we go!",
  8: "The moment is near!",
  7: "Almost there!",
  6: "Stay tuned!",
  5: "Five!",
  4: "Four!",
  3: "Three!",
  2: "Two!",
  1: "One!",
  0: "Revealing…",
};

function getExcitementText(seconds: number): string {
  if (seconds <= 10 && seconds >= 0) return EXCITEMENT_TEXTS[seconds] ?? "Get ready!";
  return "Matches revealing soon";
}

export default function MatchCountdown({ targetTime, onComplete, eventTitle }: MatchCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<number>(10);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const onCompleteCalled = useRef(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const target = targetTime.getTime();
      const difference = target - now;
      if (difference <= 0) {
        setTimeLeft(0);
        setShowConfetti(true);
        return;
      }
      setTimeLeft(Math.floor(difference / 1000));
    };
    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 100);
    return () => clearInterval(interval);
  }, [targetTime]);

  useEffect(() => {
    if (!showConfetti || onCompleteCalled.current) return;
    const t = setTimeout(() => {
      onCompleteCalled.current = true;
      onComplete();
      setIsComplete(true);
    }, CONFETTI_DURATION_MS);
    return () => clearTimeout(t);
  }, [showConfetti, onComplete]);

  const showReel = timeLeft <= 10;
  const excitementText = getExcitementText(timeLeft);

  const reelItems = useMemo(() => {
    const formatLabel = (v: number) =>
      showReel ? String(v) : `${Math.floor(v / 60)}:${(v % 60).toString().padStart(2, "0")}`;

    const items: { value: number; label: string }[] = [];

    if (timeLeft + 1 >= 0) {
      items.push({ value: timeLeft + 1, label: formatLabel(timeLeft + 1) });
    }

    items.push({ value: timeLeft, label: formatLabel(timeLeft) });

    if (timeLeft - 1 >= 0) {
      items.push({ value: timeLeft - 1, label: formatLabel(timeLeft - 1) });
    }

    return items;
  }, [timeLeft, showReel]);

  const centerIndex = 1; // current value is always the middle item
  const viewportHeight = ROW_HEIGHT * 3;
  const listOffsetY = 0;

  if (isComplete) return null;

  if (showConfetti) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex flex-col items-center justify-center overflow-hidden"
        style={{ background: "linear-gradient(135deg, #f94272 0%, #ff6b9d 50%, #ff8ab6 100%)" }}
      >
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(100)].map((_, i) => {
            const isRect = i % 3 !== 2;
            const size = 6 + Math.random() * 14;
            return (
              <motion.div
                key={i}
                className={isRect ? "absolute rounded-sm" : "absolute rounded-full"}
                style={{
                  left: `${Math.random() * 100}%`,
                  top: "-10%",
                  width: isRect ? size : size * 0.7,
                  height: isRect ? size * 0.5 : size * 0.7,
                  backgroundColor: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
                }}
                initial={{ y: 0, opacity: 1, rotate: Math.random() * 360, scale: 1 }}
                animate={{
                  y: "120vh",
                  opacity: [1, 1, 0],
                  rotate: Math.random() * 720 - 360,
                  x: (Math.random() - 0.5) * 200,
                }}
                transition={{ duration: 2 + Math.random() * 1.5, delay: Math.random() * 0.8, ease: "easeIn" }}
              />
            );
          })}
        </div>
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="relative z-10 text-center px-6"
        >
          <div className="text-6xl mb-4">🎉</div>
          <p className="text-4xl md:text-6xl font-black text-white drop-shadow-lg">
            Revealing matches…
          </p>
          <p className="text-white/80 mt-3 text-lg font-medium">Get ready to meet your match!</p>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex flex-col min-h-dvh pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]"
      style={{ background: "linear-gradient(180deg, #0a1628 0%, #0f2040 60%, #0d1a30 100%)" }}
    >
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/40 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-1 bg-primary/40 pointer-events-none" />
      <div className="absolute top-6 left-0 right-0 z-10 text-center px-4">
        <p className="text-white/90 text-xs font-semibold uppercase tracking-[0.2em]">{eventTitle}</p>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center w-full min-h-0">
        <div
          className="relative flex items-center justify-center overflow-hidden"
          style={{ height: viewportHeight, width: "min(92vw, 340px)" }}
        >
          <motion.div
            className="absolute left-3 top-0 flex flex-col pointer-events-none z-10"
            style={{
              height: reelItems.length * ROW_HEIGHT,
              transform: `translateY(${listOffsetY}px)`,
            }}
            animate={{ transform: `translateY(${listOffsetY}px)` }}
            transition={{ type: "spring", stiffness: 130, damping: 22 }}
          >
            {reelItems.map((_, i) => (
              <div key={i} className="flex items-center shrink-0" style={{ height: ROW_HEIGHT }}>
                <div className="w-1 h-0.5 rounded-full bg-white/35" />
              </div>
            ))}
          </motion.div>
          <motion.div
            className="relative w-full"
            style={{
              height: reelItems.length * ROW_HEIGHT,
              transform: `translateY(${listOffsetY}px)`,
            }}
            animate={{ transform: `translateY(${listOffsetY}px)` }}
            transition={{ type: "spring", stiffness: 130, damping: 22 }}
          >
            {reelItems.map((item, index) => {
              const offset = item.value - timeLeft;
              const absOffset = Math.abs(offset);
              const isCenter = offset === 0;
              const scale = isCenter ? 1 : Math.max(0.4, 1 - absOffset * 0.2);
              const opacity = isCenter ? 1 : Math.max(0.25, 1 - absOffset * 0.35);
              return (
                <div
                  key={item.value}
                  className="absolute left-0 right-0 flex items-center justify-center"
                  style={{ top: index * ROW_HEIGHT, height: ROW_HEIGHT }}
                >
                  <span
                    className={`font-black tabular-nums select-none leading-none text-center ${isCenter ? "text-primary" : ""}`}
                    style={{
                      fontSize: isCenter ? "clamp(4rem, 28vmin, 14rem)" : "clamp(1.5rem, 7vmin, 3.5rem)",
                      ...(isCenter ? {} : { color: "rgba(255,255,255,0.45)" }),
                      transform: `scale(${scale})`,
                      opacity,
                    }}
                  >
                    {item.label}
                  </span>
                </div>
              );
            })}
          </motion.div>
        </div>
        <motion.p
          key={`excite-${timeLeft}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="mt-4 text-xl md:text-2xl font-bold text-white text-center px-4 pb-2"
        >
          {excitementText}
        </motion.p>
      </div>
      <p className="absolute bottom-20 left-0 right-0 text-center text-sm text-white/50 px-4">
        Everyone sees their matches at the same time
      </p>
    </motion.div>
  );
}
