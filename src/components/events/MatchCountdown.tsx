import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";

interface MatchCountdownProps {
  targetTime: Date;
  onComplete: () => void;
  eventTitle: string;
}

const CONFETTI_DURATION_MS = 2500;
const CONFETTI_COLORS = [
  "hsl(349 52% 38%)",
  "hsl(348 45% 48%)",
  "#722F37", "#8B2942", "#a84860", "#c4879a", "#e8d4dc", "#ffffff",
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
  if (seconds > 20) return "Matches revealing soon";
  if (seconds > 10 && seconds <= 20) return "Hang tight — almost time!";
  if (seconds <= 10 && seconds >= 0) return EXCITEMENT_TEXTS[seconds] ?? "Get ready!";
  return "Matches revealing soon";
}

export default function MatchCountdown({ targetTime, onComplete, eventTitle }: MatchCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<number>(20);
  const [countdownDuration, setCountdownDuration] = useState<number | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const onCompleteCalled = useRef(false);

  useEffect(() => {
    setCountdownDuration(null);
  }, [targetTime]);

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
      const sec = Math.floor(difference / 1000);
      setTimeLeft(sec);
      setCountdownDuration((d) => (d === null ? sec : d));
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

  const showReel = timeLeft <= 60;
  const excitementText = getExcitementText(timeLeft);

  const progress = useMemo(() => {
    const total = countdownDuration;
    if (!total || total <= 0) return 0;
    const t = Math.max(0, timeLeft);
    return Math.min(1, Math.max(0, (total - t) / total));
  }, [countdownDuration, timeLeft]);

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
        style={{ background: "linear-gradient(135deg, #722F37 0%, #8B2942 45%, #a84860 100%)" }}
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

  const ringR = 46;
  const ringC = 2 * Math.PI * ringR;
  const ringOffset = ringC * (1 - progress);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/35 backdrop-blur-[2px] pb-6 pt-[env(safe-area-inset-top)]"
    >
      <motion.div
        initial={{ y: 18, opacity: 0, scale: 0.98 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 26 }}
        className="w-[min(92vw,28rem)] overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-2xl"
      >
        <div className="px-5 pt-5 pb-4 bg-gradient-to-r from-primary to-red-950 text-primary-foreground">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] opacity-90">
            Match reveal
          </p>
          <p className="mt-1 font-display text-lg font-bold leading-tight">
            {eventTitle}
          </p>
          <p className="mt-1 text-xs opacity-90">{excitementText}</p>
        </div>

        <div className="px-5 py-5">
          <div className="flex items-center justify-center">
            <div className="relative h-32 w-32">
              <svg className="h-32 w-32 -rotate-90" viewBox="0 0 120 120">
                <circle
                  cx="60"
                  cy="60"
                  r={ringR}
                  fill="none"
                  stroke="rgba(114,47,55,0.12)"
                  strokeWidth="10"
                />
                <circle
                  cx="60"
                  cy="60"
                  r={ringR}
                  fill="none"
                  stroke="hsl(349 52% 38%)"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={ringC}
                  strokeDashoffset={ringOffset}
                />
              </svg>
              <div className="absolute inset-0 grid place-items-center">
                <div className="text-center">
                  <div className="text-5xl font-black tabular-nums text-primary leading-none">
                    {Math.max(0, timeLeft)}
                  </div>
                  <div className="mt-1 text-[11px] font-semibold text-muted-foreground">
                    seconds
                  </div>
                </div>
              </div>
            </div>
          </div>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            Everyone sees their matches at the same time.
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
