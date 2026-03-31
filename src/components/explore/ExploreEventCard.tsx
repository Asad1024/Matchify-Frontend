import { Calendar, MapPin, ChevronRight } from "lucide-react";
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
  const priceLabel = event.price?.trim() || "";
  const isFree = /^free$/i.test(priceLabel) || /\bfree\b/i.test(priceLabel);
  const d = new Date(event.date);
  const valid = !Number.isNaN(d.getTime());
  const month = valid ? d.toLocaleString(undefined, { month: "short" }).toUpperCase() : "—";
  const day = valid ? String(d.getDate()) : "—";
  const timeLabel = event.time?.trim() || (valid ? d.toLocaleString(undefined, { timeStyle: "short" }) : "");

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group w-full overflow-hidden rounded-[24px] border border-[#F0F0F0] bg-white/85 text-left backdrop-blur-md",
        "shadow-[0_4px_20px_rgba(0,0,0,0.05)] transition hover:shadow-[0_10px_30px_rgba(15,23,42,0.10)] active:scale-[0.99]",
        className,
      )}
    >
      <div className="relative aspect-video w-full overflow-hidden bg-gradient-to-br from-primary/10 via-slate-100 to-primary/10">
        {event.image ? (
          <img src={event.image} alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/15 to-transparent" />
        <span
          className={cn(
            "absolute left-3 top-3 inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide",
            "border border-white/35 bg-white/20 text-white shadow-sm backdrop-blur-md",
          )}
        >
          {isOnline ? "ONLINE" : "IN PERSON"}
        </span>
        {priceLabel ? (
          <span
            className={cn(
              "absolute right-3 top-3 inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide",
              "border border-white/35 bg-white/20 text-white shadow-sm backdrop-blur-md",
              isFree ? "ring-1 ring-emerald-400/30" : "",
            )}
            title={priceLabel}
          >
            {isFree ? "FREE" : priceLabel}
          </span>
        ) : null}
      </div>

      <div className="flex gap-3 p-3">
        <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-2xl border border-[#F0F0F0] bg-white shadow-[0_10px_30px_-18px_rgba(15,23,42,0.22)]">
          <span className="text-[10px] font-bold text-slate-500">{month}</span>
          <span className="text-[16px] font-extrabold leading-none text-slate-900 tabular-nums">{day}</span>
        </div>

        <div className="min-w-0 flex-1 py-0.5">
          <h3 className="line-clamp-2 font-display text-[15px] font-extrabold leading-snug text-slate-900 group-hover:text-primary">
            {event.title}
          </h3>
          <div className="mt-1.5 flex flex-col gap-1 text-[12px] text-slate-600">
            <span className="flex items-center gap-1.5 font-medium">
              <Calendar className="h-3.5 w-3.5 shrink-0 text-slate-500" strokeWidth={1.75} />
              <span className="truncate">{timeLabel || event.date}</span>
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-500" strokeWidth={1.75} />
              <span className="truncate">{event.location}</span>
            </span>
          </div>
        </div>

        <div className="flex shrink-0 items-center self-center pr-0.5 text-slate-400 group-hover:text-primary">
          <ChevronRight className="h-5 w-5" strokeWidth={1.75} />
        </div>
      </div>

    </button>
  );
}
