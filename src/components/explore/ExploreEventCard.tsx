import { Calendar, MapPin, ChevronRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export type ExploreEventCardEvent = {
  id: string;
  title: string;
  description?: string | null;
  date: string;
  time?: string | null;
  location: string;
  type?: string | null;
  image?: string | null;
  price?: string | null;
};

type Props = {
  event: ExploreEventCardEvent;
  onClick?: () => void;
  className?: string;
};

/**
 * Compact explore-specific event row — distinct from the main Events grid cards.
 */
export function ExploreEventCard({ event, onClick, className }: Props) {
  const isOnline = (event.type || "").toLowerCase() === "online";

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex w-full gap-3 rounded-2xl border border-stone-200/90 bg-white p-3 text-left shadow-sm transition-all",
        "hover:border-primary/25 hover:shadow-md active:scale-[0.99]",
        className,
      )}
    >
      <div className="relative h-[4.5rem] w-[4.5rem] shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-primary/20 via-stone-100 to-primary/10">
        {event.image ? (
          <img src={event.image} alt="" className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Sparkles className="h-7 w-7 text-primary/60" strokeWidth={1.5} />
          </div>
        )}
        <span
          className={cn(
            "absolute bottom-1 left-1 rounded-md px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-white shadow-sm",
            isOnline ? "bg-sky-600" : "bg-stone-800/90",
          )}
        >
          {isOnline ? "Online" : "In person"}
        </span>
      </div>

      <div className="min-w-0 flex-1 py-0.5">
        <h3 className="line-clamp-2 text-sm font-bold leading-snug text-gray-900 group-hover:text-primary">
          {event.title}
        </h3>
        <div className="mt-1.5 flex flex-col gap-1 text-[11px] text-gray-600">
          <span className="flex items-center gap-1.5 font-medium">
            <Calendar className="h-3.5 w-3.5 shrink-0 text-primary" strokeWidth={2} />
            <span className="truncate">
              {event.date}
              {event.time ? ` · ${event.time}` : ""}
            </span>
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" strokeWidth={2} />
            <span className="truncate">{event.location}</span>
          </span>
        </div>
        {event.price ? (
          <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700">{event.price}</p>
        ) : null}
      </div>

      <div className="flex shrink-0 items-center self-center pr-0.5 text-gray-400 group-hover:text-primary">
        <ChevronRight className="h-5 w-5" strokeWidth={2} />
      </div>
    </button>
  );
}
