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

const ROW_HEIGHT = 104; // height of each row in the reel

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
  const [startSeconds, setStartSeconds] = useState<number | null>(null);

  useEffect(() => {
    setCountdownDuration(null);
    setStartSeconds(null);
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
      setStartSeconds((s) => (s === null ? sec : s));
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

  const excitementText = getExcitementText(timeLeft);

  const reel = useMemo(() => {
    const start = Math.max(0, startSeconds ?? countdownDuration ?? Math.max(0, timeLeft));
    const values = Array.from({ length: start + 1 }, (_, i) => start - i);
    const active = Math.max(0, timeLeft);
    const activeIndex = Math.min(values.length - 1, Math.max(0, start - active));

    // Position so the active row sits centered.
    const viewportHeight = ROW_HEIGHT * 5;
    const centeredOffset = viewportHeight / 2 - ROW_HEIGHT / 2;
    const translateY = centeredOffset - activeIndex * ROW_HEIGHT;

    return { values, viewportHeight, translateY, active };
  }, [startSeconds, countdownDuration, timeLeft]);

  if (isComplete) return null;

  if (showConfetti) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] overflow-hidden"
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

        <div className="relative z-10 mx-auto flex min-h-[100svh] w-full max-w-lg flex-col items-center justify-center px-4 pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)]">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="w-full text-center"
          >
            <div className="text-6xl mb-4">🎉</div>
            <p className="text-4xl md:text-6xl font-bold text-white drop-shadow-lg">
              Revealing matches…
            </p>
            <p className="text-white/80 mt-3 text-lg font-medium">Get ready to meet your match!</p>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-black text-[#D4AF37]"
    >
      <div className="mx-auto flex min-h-[100svh] w-full max-w-lg flex-col px-4 pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)]">
        <div className="pt-8 text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#D4AF37]/80">
            Match reveal
          </p>
          <p className="mt-2 text-base font-semibold text-[#D4AF37]/90">{eventTitle}</p>
          <p className="mt-1 text-xs text-[#D4AF37]/70">{excitementText}</p>
        </div>

        <div className="flex flex-1 items-center justify-center">
          <div
            className="relative w-full overflow-hidden rounded-3xl border border-[#D4AF37]/15 bg-black"
            style={{ height: reel.viewportHeight }}
          >
            {/* Center highlight */}
            <div className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2">
              <div className="mx-6 rounded-2xl border border-[#D4AF37]/20 bg-[#D4AF37]/[0.06] py-6" />
            </div>
            <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black to-transparent" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black to-transparent" />

            <motion.div
              className="absolute left-0 top-0 w-full"
              animate={{ y: reel.translateY }}
              transition={{ type: "spring", stiffness: 210, damping: 28 }}
            >
              {reel.values.map((v) => {
                const isActive = v === reel.active;
                return (
                  <div
                    key={v}
                    className="grid w-full place-items-center tabular-nums"
                    style={{ height: ROW_HEIGHT }}
                  >
                    <div
                      className={
                        isActive
                          ? "text-7xl font-bold tracking-tight text-[#D4AF37] drop-shadow-[0_0_18px_rgba(212,175,55,0.22)]"
                          : "text-4xl font-bold text-[#D4AF37]/35"
                      }
                    >
                      {v}
                    </div>
                  </div>
                );
              })}
            </motion.div>
          </div>
        </div>

        <div className="pb-6 text-center text-xs text-[#D4AF37]/60">
          Everyone sees their matches at the same time.
        </div>
      </div>
    </motion.div>
  );
}
