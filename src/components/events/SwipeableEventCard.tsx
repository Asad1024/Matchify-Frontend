import { useState } from "react";
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Users, Clock, Heart, X } from "lucide-react";
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
          "flex max-h-[min(82vh,640px)] flex-col overflow-hidden rounded-2xl border border-gray-100/80 bg-white shadow-lg",
        )}
      >
        <div className="relative isolate min-h-[220px] shrink-0 basis-[min(42vh,300px)] overflow-hidden sm:min-h-[260px] sm:basis-[min(44vh,320px)]">
          {image ? (
            <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover" />
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
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/35" />

          <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-2 px-3 pt-3">
            <span
              className="inline-flex max-w-[56%] shrink-0 items-center truncate rounded-full border border-white/25 bg-white/95 px-3 py-1.5 text-[11px] font-bold text-gray-900 shadow-[0_2px_16px_rgba(0,0,0,0.45)] backdrop-blur-sm sm:text-xs"
              title={type === "online" ? "Online event" : "In person"}
            >
              {type === "online" ? "Online" : "In person"}
            </span>
            {price ? (
              <span
                className="inline-flex max-w-[56%] shrink-0 items-center truncate rounded-full border border-white/35 bg-emerald-600 px-3 py-1.5 text-[11px] font-bold text-white shadow-[0_2px_16px_rgba(0,0,0,0.45)] sm:text-xs"
                title={price}
              >
                {price}
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
            <h3 className="font-display text-xl font-bold leading-tight tracking-tight text-white drop-shadow-sm sm:text-2xl">
              {title}
            </h3>
            <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-white/90">{description}</p>
          </div>
        </div>

        <CardContent className="flex min-h-0 flex-1 flex-col space-y-3 overflow-y-auto p-4 sm:space-y-4 sm:p-5">
          <div className="grid grid-cols-1 gap-2 text-sm sm:gap-2.5">
            <div className="flex min-w-0 items-center gap-2.5 text-foreground">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15">
                <Calendar className="h-4 w-4 text-primary" />
              </div>
              <span className="min-w-0 font-medium">{date}</span>
            </div>
            <div className="flex min-w-0 items-center gap-2.5 text-foreground">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15">
                <Clock className="h-4 w-4 text-primary" />
              </div>
              <span className="min-w-0 font-medium">{time}</span>
            </div>
            <div className="flex min-w-0 items-center gap-2.5 text-foreground">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15">
                <MapPin className="h-4 w-4 text-primary" />
              </div>
              <span className="min-w-0 truncate font-medium">{location}</span>
            </div>
            <div className="flex min-w-0 items-center gap-2.5 text-foreground">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15">
                <Users className="h-4 w-4 text-primary" />
              </div>
              <span className="min-w-0 font-medium">
                {attendees}/{capacity} attending
              </span>
            </div>
          </div>

          <p className="text-center text-[11px] font-medium text-muted-foreground sm:text-xs">
            Swipe right to RSVP · left to skip
          </p>

          <div className="mt-auto flex gap-2.5 pt-1 sm:gap-3 sm:pt-2">
            <Button
              type="button"
              variant="outline"
              className="h-11 flex-1 rounded-full border-2 border-stone-200 font-bold text-foreground hover:bg-stone-50 sm:h-12"
              onClick={() => {
                setExitX(-200);
                setTimeout(() => onSwipeLeft?.(id), 100);
              }}
              data-testid="button-pass"
            >
              <X className="mr-2 h-4 w-4 shrink-0" />
              Skip
            </Button>
            <Button
              type="button"
              className="h-11 flex-1 rounded-full bg-success font-bold text-success-foreground shadow-md shadow-success/20 hover:bg-success/90 sm:h-12"
              onClick={() => {
                setExitX(200);
                setTimeout(() => onSwipeRight?.(id), 100);
              }}
              data-testid="button-interested"
            >
              <Heart className="mr-2 h-4 w-4 shrink-0" />
              RSVP
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
