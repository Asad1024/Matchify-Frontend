import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Users, Clock, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { getEventTheme } from "@/lib/eventCardTheme";

interface EventCardProps {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  type: 'online' | 'offline';
  attendees: number;
  capacity: number;
  price?: string;
  image?: string;
  /** Matchify AI added this user to the guest list (show on the list, not only in the bell). */
  youAreInvited?: boolean;
  isRSVPd?: boolean;
  isLoading?: boolean;
  onRSVP?: (id: string) => void;
  onClick?: (id: string) => void;
}

export default function EventCard({
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
  isRSVPd = false,
  isLoading = false,
  onRSVP,
  onClick
}: EventCardProps) {
  const theme = getEventTheme(id);
  const ThemeIcon = theme.icon;

  return (
    <motion.div
      className="w-full min-w-0 max-w-full"
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
    >
      <Card 
        className="w-full min-w-0 max-w-full overflow-hidden rounded-2xl border border-gray-100/80 bg-white shadow-md transition-all hover:shadow-lg"
        onClick={() => onClick?.(id)}
        data-testid={`card-event-${id}`}
      >
        <div className="relative h-44 w-full overflow-hidden sm:h-48">
          {image ? (
            <img src={image} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${theme.gradient}`}>
              <div className="absolute inset-0 opacity-10"
                style={{ backgroundImage: "radial-gradient(circle, white 1.5px, transparent 1.5px)", backgroundSize: "24px 24px" }}
              />
              <ThemeIcon className="h-16 w-16 text-white/80 sm:h-20 sm:w-20" strokeWidth={1} />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/35" />
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
          {youAreInvited && !isRSVPd ? (
            <div className="pointer-events-none absolute left-3 right-3 top-14 z-10 sm:left-4 sm:right-4 sm:top-16">
              <span
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-violet-300/90 bg-violet-600/95 px-3 py-2 text-center text-[11px] font-bold uppercase tracking-wide text-white shadow-[0_4px_20px_rgba(91,33,182,0.45)] backdrop-blur-sm sm:text-xs"
                title="You were picked for this meetup — RSVP to save your spot"
              >
                <Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden />
                You&apos;re invited — RSVP
              </span>
            </div>
          ) : null}
        </div>
        <CardContent className="space-y-3 p-4 sm:space-y-4 sm:p-5">
          <div className="min-w-0">
            <h3 className="font-display text-lg font-bold leading-snug text-foreground sm:text-xl">{title}</h3>
            <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
          </div>
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
              <span className="min-w-0 font-medium">{attendees}/{capacity} attending</span>
            </div>
          </div>
          <motion.div whileTap={{ scale: isLoading ? 1 : 0.95 }} className="w-full min-w-0 pt-1">
            <Button
              className={`h-11 w-full rounded-full text-sm font-bold shadow-md sm:h-12 sm:text-base ${!isRSVPd ? "bg-success text-success-foreground shadow-success/20 hover:bg-success/90" : ""}`}
              variant={isRSVPd ? "outline" : "default"}
              disabled={isLoading}
              onClick={(e) => {
                e.stopPropagation();
                onRSVP?.(id);
              }}
              data-testid={`button-rsvp-${id}`}
            >
              {isLoading ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2"
                  />
                  {isRSVPd ? 'Cancelling...' : 'RSVPing...'}
                </>
              ) : (
                isRSVPd ? '✓ RSVP\'d' : 'RSVP Now'
              )}
            </Button>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
