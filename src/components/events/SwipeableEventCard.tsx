import { useState } from "react";
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Users, Clock, Heart, X, Sparkles } from "lucide-react";
import { getEventTheme } from "@/lib/eventCardTheme";
import { cn } from "@/lib/utils";

interface SwipeableEventCardProps {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  type: "online" | "offline";
  attendees: number;
  capacity: number;
  price?: string;
  image?: string;
  youAreInvited?: boolean;
  onSwipeLeft?: (id: string) => void;
  onSwipeRight?: (id: string) => void;
}

export default function SwipeableEventCard({
  id,
  title,
  description,
  date,
  time,
  location,
  type,
  attendees,
  capacity,
  price,
  image,
  youAreInvited = false,
  onSwipeLeft,
  onSwipeRight,
}: SwipeableEventCardProps) {
  const [exitX, setExitX] = useState(0);
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-18, 18]);
  const cardOpacity = useTransform(x, [-220, -80, 0, 80, 220], [0.65, 1, 1, 1, 0.65]);
  const passStampOpacity = useTransform(x, [-200, -50, 0], [1, 0.45, 0]);
  const rsvpStampOpacity = useTransform(x, [0, 50, 200], [0, 0.45, 1]);

  const theme = getEventTheme(id);
  const ThemeIcon = theme.icon;

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.x > 100) {
      setExitX(200);
      setTimeout(() => {
        onSwipeRight?.(id);
      }, 100);
    } else if (info.offset.x < -100) {
      setExitX(-200);
      setTimeout(() => {
        onSwipeLeft?.(id);
      }, 100);
    } else {
      setExitX(0);
    }
  };

  return (
    <motion.div
      style={{ x, rotate, opacity: cardOpacity }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.85}
      onDragEnd={handleDragEnd}
      animate={exitX !== 0 ? { x: exitX } : {}}
      className="relative mx-auto w-full max-w-md px-0.5"
    >
      <Card
        className={cn(
          "flex max-h-[min(82vh,640px)] flex-col overflow-hidden rounded-[28px] border border-[#F0F0F0] bg-white shadow-[0_18px_60px_-28px_rgba(15,23,42,0.35)]",
        )}
      >
        <div className="relative isolate min-h-[220px] shrink-0 basis-[min(42vh,300px)] overflow-hidden sm:min-h-[260px] sm:basis-[min(44vh,320px)]">
          {image ? (
            <img
              src={image}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
              decoding="async"
              fetchPriority="high"
            />
          ) : (
            <div
              className={`absolute inset-0 flex items-center justify-center bg-gradient-to-br ${theme.gradient}`}
            >
              <div
                className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage: "radial-gradient(circle, white 1.5px, transparent 1.5px)",
                  backgroundSize: "24px 24px",
                }}
              />
              <ThemeIcon className="relative z-[1] h-20 w-20 text-white/80 sm:h-24 sm:w-24" strokeWidth={1} />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-black/20" />

          <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-2 px-3 pt-3">
            <span
              className="inline-flex max-w-[56%] shrink-0 items-center truncate rounded-full border border-white/35 bg-white/20 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-white shadow-sm backdrop-blur-md sm:text-xs"
              title={type === "online" ? "Online event" : "In person"}
            >
              {type === "online" ? "ONLINE" : "IN PERSON"}
            </span>
            {price ? (
              <span
                className="inline-flex max-w-[56%] shrink-0 items-center truncate rounded-full border border-white/35 bg-white/20 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-white shadow-sm backdrop-blur-md sm:text-xs"
                title={price}
              >
                {/free/i.test(price) ? "FREE" : price}
              </span>
            ) : null}
          </div>

          <motion.div
            className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2"
            style={{ opacity: passStampOpacity }}
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-red-500/90 bg-red-500/15 backdrop-blur-sm sm:h-[4.5rem] sm:w-[4.5rem]">
              <X className="h-9 w-9 text-red-600 sm:h-10 sm:w-10" strokeWidth={2.5} />
            </div>
          </motion.div>

          <motion.div
            className="pointer-events-none absolute right-4 top-1/2 z-10 -translate-y-1/2"
            style={{ opacity: rsvpStampOpacity }}
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-emerald-600/90 bg-emerald-500/15 backdrop-blur-sm sm:h-[4.5rem] sm:w-[4.5rem]">
              <Heart className="h-9 w-9 fill-emerald-600/30 text-emerald-600 sm:h-10 sm:w-10" strokeWidth={2.5} />
            </div>
          </motion.div>

          <div className="absolute bottom-0 left-0 right-0 z-[2] p-4 sm:p-5">
            {youAreInvited ? (
              <div className="mb-2 flex justify-center">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-200/90 bg-violet-600/95 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-lg backdrop-blur-sm sm:text-xs">
                  <Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  You&apos;re invited — swipe right to RSVP
                </span>
              </div>
            ) : null}
            <h3 className="font-display text-xl font-bold leading-tight tracking-tight text-white drop-shadow-sm sm:text-2xl">
              {title}
            </h3>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] font-medium text-white/90">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-white/85" strokeWidth={1.75} aria-hidden />
                <span className="max-w-[18rem] truncate">{location}</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-white/85" strokeWidth={1.75} aria-hidden />
                <span className="truncate">{date}</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-white/85" strokeWidth={1.75} aria-hidden />
                <span className="truncate">{time}</span>
              </span>
            </div>
          </div>
        </div>

        <CardContent className="flex min-h-0 flex-1 flex-col justify-end p-4 sm:p-5">
          <div className="pointer-events-none mb-2 text-center text-[11px] font-medium text-muted-foreground sm:text-xs">
            Swipe right to like · left to pass
          </div>

          <div className="flex items-center justify-center gap-4">
            <button
              type="button"
              aria-label="Pass"
              onClick={() => {
                setExitX(-200);
                setTimeout(() => onSwipeLeft?.(id), 100);
              }}
              className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-black text-white shadow-[0_18px_60px_-28px_rgba(0,0,0,0.55)] transition hover:bg-black/90 active:scale-95"
              data-testid="button-pass"
            >
              <X className="h-6 w-6" strokeWidth={2.6} aria-hidden />
            </button>
            <button
              type="button"
              aria-label="Like"
              onClick={() => {
                setExitX(200);
                setTimeout(() => onSwipeRight?.(id), 100);
              }}
              className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_18px_60px_-28px_rgba(114,47,55,0.55)] transition hover:brightness-[0.98] active:scale-95"
              data-testid="button-interested"
            >
              <Heart className="h-6 w-6 fill-white/20" strokeWidth={2.6} aria-hidden />
            </button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
