import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { Flower2, Gift, Heart, HeartHandshake, HeartPulse, Wine } from "lucide-react";

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

/** Countdown UI: burgundy / wine on dark (not gold). */
const WINE = {
  active: "#f2dde2",
  labelMuted: "rgba(232, 196, 204, 0.72)",
  footer: "rgba(200, 150, 162, 0.55)",
  pillBorder: "rgba(139, 41, 66, 0.55)",
  pillBg: "rgba(114, 47, 55, 0.35)",
  pillInset: "rgba(168, 72, 96, 0.12)",
};

/** Left-rail decorative icons — romantic only (hearts, couple, gift, flower, wine). */
const COUNTDOWN_SIDE_ICONS: LucideIcon[] = [
  Heart,
  HeartHandshake,
  HeartPulse,
  Gift,
  Flower2,
  Wine,
];
const SIDE_ICON_INTERVAL_MS = 2700;
const GLITTER_DOT_COUNT = 12;

/** Arc radius — circle center at origin; right tip (R,0) is the active digit. */
const ARC_RADIUS = 152;
/**
 * Four satellites: +2/+1 (previous seconds) on negative θ, −1/−2 (upcoming) on positive θ.
 * Active stays at θ=0. Slightly wider θ spacing = more air between all five numerals.
 */
const ARC_SATELLITES: { delta: number; theta: number }[] = [
  { delta: 2, theta: -1.22 },
  { delta: 1, theta: -0.64 },
  { delta: -1, theta: 0.64 },
  { delta: -2, theta: 1.22 },
];

const EXCITEMENT_TEXTS: Record<number, string> = {
  15: "Get ready!",
  14: "Here we go!",
  13: "The moment is near!",
  12: "Almost there!",
  11: "Stay tuned!",
  10: "Ten!",
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
  if (seconds > 15) return "Matches revealing soon";
  if (seconds > 10 && seconds <= 15) return EXCITEMENT_TEXTS[seconds] ?? "Hang tight — almost time!";
  if (seconds > 5 && seconds <= 10) return "Hang tight — almost time!";
  if (seconds <= 10 && seconds >= 0) return EXCITEMENT_TEXTS[seconds] ?? "Get ready!";
  return "Matches revealing soon";
}

function bubbleProps(i: number) {
  const seed = i * 9973;
  const left = ((seed * 17) % 100) / 100;
  const top = ((seed * 31) % 100) / 100;
  const size = 28 + (seed % 55);
  const delay = (i * 0.37) % 4;
  const duration = 10 + (seed % 8);
  return { leftPct: left * 100, topPct: top * 100, size, delay, duration };
}

export default function MatchCountdown({ targetTime, onComplete, eventTitle }: MatchCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<number>(15);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [sideIconIndex, setSideIconIndex] = useState(0);
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
      const sec = Math.floor(difference / 1000);
      setTimeLeft(sec);
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

  useEffect(() => {
    const id = window.setInterval(() => {
      setSideIconIndex((i) => (i + 1) % COUNTDOWN_SIDE_ICONS.length);
    }, SIDE_ICON_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  const excitementText = getExcitementText(timeLeft);

  /** Two “before” (+1,+2) and two “after” (−1,−2) on the arc; same type size as active, muted. */
  const arcSatellites = useMemo(() => {
    const out: { delta: number; value: number; theta: number; dullClass: string }[] = [];
    for (const { delta, theta } of ARC_SATELLITES) {
      const value = timeLeft + delta;
      if (value < 0) continue;
      const dullClass =
        Math.abs(delta) >= 2
          ? "text-[#c08090]/50 drop-shadow-[0_0_10px_rgba(114,47,55,0.25)]"
          : "text-[#e0aeb8]/65 drop-shadow-[0_0_12px_rgba(139,41,66,0.22)]";
      out.push({ delta, value, theta, dullClass });
    }
    return out;
  }, [timeLeft]);

  if (isComplete) return null;

  if (showConfetti) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex justify-center bg-[hsl(var(--surface-2))]"
      >
        <motion.div
          className="relative w-full max-w-lg min-h-[100svh] overflow-hidden shadow-[0_0_0_1px_rgba(0,0,0,0.06)]"
          style={{ background: "linear-gradient(135deg, #722F37 0%, #8B2942 45%, #a84860 100%)" }}
        >
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
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
                    y: "120%",
                    opacity: [1, 1, 0],
                    rotate: Math.random() * 720 - 360,
                    x: (Math.random() - 0.5) * 120,
                  }}
                  transition={{ duration: 2 + Math.random() * 1.5, delay: Math.random() * 0.8, ease: "easeIn" }}
                />
              );
            })}
          </div>

          <div className="relative z-10 flex min-h-[100svh] w-full flex-col items-center justify-center px-4 pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)]">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="w-full max-w-md text-center"
            >
              <div className="mb-4 text-6xl">🎉</div>
              <p className="text-4xl font-bold text-white drop-shadow-lg sm:text-5xl">Revealing matches…</p>
              <p className="mt-3 text-lg font-medium text-white/80">Get ready to meet your match!</p>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  /** Satellite numerals — slightly smaller than active center digit. */
  const boxHalf = 52;
  const satelliteDigitClass =
    "text-5xl font-bold tabular-nums leading-none tracking-tight sm:text-6xl";
  const activeDigitClass =
    "text-6xl font-bold tabular-nums leading-none tracking-tight sm:text-7xl";
  const CurrentSideIcon = COUNTDOWN_SIDE_ICONS[sideIconIndex];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex justify-center bg-[hsl(var(--surface-2))]"
    >
      <motion.div className="relative w-full max-w-lg min-h-[100svh] overflow-hidden bg-black text-[#e8c4ce] shadow-[0_0_0_1px_rgba(0,0,0,0.06)]">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {[...Array(22)].map((_, i) => {
            const b = bubbleProps(i);
            return (
              <motion.div
                key={i}
                className="absolute rounded-full"
                style={{
                  left: `${b.leftPct}%`,
                  top: `${b.topPct}%`,
                  width: b.size,
                  height: b.size,
                  marginLeft: -b.size / 2,
                  marginTop: -b.size / 2,
                  background:
                    i % 3 === 0
                      ? "radial-gradient(circle at 30% 30%, rgba(200,120,140,0.35), rgba(114,47,55,0.12) 55%, transparent 70%)"
                      : "radial-gradient(circle at 40% 40%, rgba(168,72,96,0.2), rgba(72,28,38,0.06) 60%, transparent 72%)",
                  boxShadow: "0 0 20px rgba(114,47,55,0.18)",
                }}
                animate={{
                  y: [0, -18, 4, -12, 0],
                  x: [0, 10, -8, 6, 0],
                  scale: [1, 1.08, 0.96, 1.04, 1],
                  opacity: [0.35, 0.65, 0.4, 0.55, 0.35],
                }}
                transition={{
                  duration: b.duration,
                  delay: b.delay,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            );
          })}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80" />
        </div>

        <div className="relative z-10 flex min-h-[100svh] w-full flex-col px-4 pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)]">
          <div className="shrink-0 pt-6 text-center">
            <motion.p
              className="text-[10px] font-bold uppercase tracking-[0.28em]"
              style={{ color: WINE.labelMuted }}
              animate={{ opacity: [0.75, 1, 0.75] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              Match reveal
            </motion.p>
            <p className="mt-2 text-base font-semibold text-[#eec7cf]">{eventTitle}</p>
          </div>

          <div className="flex min-h-0 flex-1 flex-row items-center justify-center gap-0 py-6 pl-1 pr-2 sm:gap-2 sm:pl-2 sm:pr-4">
            <div
              className="relative flex w-[5.25rem] shrink-0 flex-col items-center justify-center self-stretch pl-2 sm:w-[5.75rem] sm:pl-4"
              aria-hidden
            >
              <div className="translate-x-2 sm:translate-x-4">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={sideIconIndex}
                    initial={{ opacity: 0, scale: 0.9, filter: "blur(6px)" }}
                    animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                    exit={{ opacity: 0, scale: 1.05, filter: "blur(4px)" }}
                    transition={{
                      duration: 0.72,
                      ease: [0.22, 0.99, 0.36, 1],
                    }}
                    className="relative flex h-[5.5rem] w-[5.5rem] items-center justify-center sm:h-[6.25rem] sm:w-[6.25rem]"
                  >
                    <div className="pointer-events-none absolute inset-0 z-0 overflow-visible">
                      {Array.from({ length: GLITTER_DOT_COUNT }, (_, i) => {
                        const left = 8 + ((i * 67) % 84);
                        const top = 6 + ((i * 41 + 23) % 88);
                        return (
                          <motion.span
                            key={`${sideIconIndex}-g-${i}`}
                            className="absolute rounded-full bg-[#fff5f7]"
                            style={{
                              left: `${left}%`,
                              top: `${top}%`,
                              width: i % 3 === 0 ? 4 : 3,
                              height: i % 3 === 0 ? 4 : 3,
                              marginLeft: -2,
                              marginTop: -2,
                              boxShadow: "0 0 8px rgba(255,230,235,0.95), 0 0 14px rgba(232,180,195,0.55)",
                            }}
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{
                              opacity: [0, 1, 0.75, 0],
                              scale: [0, 1.35, 1, 0],
                            }}
                            transition={{
                              duration: 1.05,
                              delay: i * 0.045,
                              ease: [0.16, 1, 0.3, 1],
                            }}
                          />
                        );
                      })}
                    </div>
                    <CurrentSideIcon
                      className="relative z-10 h-[3.35rem] w-[3.35rem] text-[#e8c9d2] sm:h-[4rem] sm:w-[4rem]"
                      strokeWidth={1.45}
                    />
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            <div className="flex min-w-0 flex-1 flex-col items-center justify-center -translate-x-2 sm:-translate-x-4">
              <motion.p
                key={excitementText}
                className="mb-8 max-w-[min(100%,20rem)] px-2 text-center text-xl font-semibold leading-snug tracking-tight text-[#f5e6ea] sm:text-2xl sm:leading-snug"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 320, damping: 30 }}
              >
                {excitementText}
              </motion.p>
              <div
                className="relative mx-auto w-full max-w-[360px]"
                style={{ height: ARC_RADIUS * 2 + 128 }}
              >
              {/* Circle center (0,0): vertical semicircle opening right; active at (R,0). */}
              <div className="absolute left-1/2 top-[46%] -translate-x-1/2 -translate-y-1/2">
                <div className="absolute left-0 top-0 h-px w-px">
                  <div className="absolute left-0 top-0 h-0 w-0 overflow-visible">
                    {arcSatellites.map(({ delta, value, theta, dullClass }) => {
                      const x = Math.cos(theta) * ARC_RADIUS;
                      const y = Math.sin(theta) * ARC_RADIUS;

                      return (
                        <motion.div
                          key={`${delta}-${timeLeft}-${value}`}
                          className="absolute left-0 top-0 flex h-[6.5rem] w-[6.5rem] items-center justify-center sm:h-[7rem] sm:w-[7rem]"
                          style={{
                            marginLeft: -boxHalf,
                            marginTop: -boxHalf,
                          }}
                          initial={false}
                          animate={{ x, y }}
                          transition={{
                            type: "spring",
                            stiffness: 280,
                            damping: 36,
                            mass: 0.82,
                          }}
                        >
                          <span className={`${satelliteDigitClass} ${dullClass}`}>{value}</span>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                {/* Active second at arc apex — larger type + wine pill */}
                <div
                  className="pointer-events-none absolute z-20 flex h-[7.25rem] w-[7.25rem] -translate-x-1/2 -translate-y-1/2 items-center justify-center sm:h-[8rem] sm:w-[8rem]"
                  style={{
                    left: ARC_RADIUS,
                    top: 0,
                  }}
                >
                  <motion.span
                    className="relative drop-shadow-[0_0_28px_rgba(168,72,96,0.45)]"
                    style={{ color: WINE.active }}
                    animate={{ scale: [1, 1.03, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <span className="relative inline-flex min-w-[1ch] items-center justify-center px-4 py-1">
                      <span
                        className="absolute inset-0 -mx-3 -my-1 rounded-2xl border"
                        style={{
                          borderColor: WINE.pillBorder,
                          backgroundColor: WINE.pillBg,
                          boxShadow: `inset 0 0 22px ${WINE.pillInset}`,
                        }}
                      />
                      <span className={`relative ${activeDigitClass}`}>{timeLeft}</span>
                    </span>
                  </motion.span>
                </div>
              </div>
            </div>
            </div>
          </div>

          <motion.div
            className="shrink-0 pb-6 text-center text-xs"
            style={{ color: WINE.footer }}
            animate={{ opacity: [0.55, 0.88, 0.55] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            Everyone sees their matches at the same time.
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}
