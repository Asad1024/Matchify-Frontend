import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getMarriageStripMilestones,
  type MarriageIntentProfileInput,
} from "@/lib/marriageIntentionUi";

type Props = MarriageIntentProfileInput & {
  /** e.g. "Sarah's marriage intention" — optional caption above the track */
  caption?: string;
  className?: string;
  /** Compact = pill-first (used in Marriage screen). */
  variant?: "default" | "compact";
};

export function MarriageIntentionStrip({ caption, className, variant = "default", ...intent }: Props) {
  const m = getMarriageStripMilestones(intent);
  const fillWidth = Math.max(12, Math.min(100, m.progressPercent));

  if (variant === "compact") {
    return (
      <div
        className={cn(
          "rounded-[22px] border border-[#F0F0F0] bg-white px-4 py-3 shadow-[0_4px_20px_rgba(0,0,0,0.05)]",
          className,
        )}
      >
        {caption ? (
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            {caption}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#722F37]/10 px-3 py-1 text-[11px] font-bold text-[#722F37]">
            <Heart className="h-3.5 w-3.5" fill="currentColor" stroke="none" aria-hidden />
            {m.left}
          </span>
          <span className="inline-flex items-center rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-[11px] font-semibold text-slate-800">
            {m.middle}
          </span>
          <span className="inline-flex items-center rounded-full border border-stone-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-800">
            {m.right}
          </span>
        </div>

        {m.headline ? (
          <p className="mt-2 text-[13px] font-semibold leading-snug text-slate-900">{m.headline}</p>
        ) : null}
        {m.subline ? (
          <p className="mt-1 text-[12px] font-medium leading-snug text-slate-600">{m.subline}</p>
        ) : null}

        {/* Minimal progress indicator (no "Soft/Serious" labels) */}
        <div className="mt-3 h-[8px] w-full overflow-hidden rounded-full bg-[#F1F2F4]" aria-hidden>
          <div className="h-full rounded-full bg-[#722F37]" style={{ width: `${fillWidth}%` }} />
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-[24px] border border-[#F0F0F0] bg-white px-4 py-3.5 shadow-[0_4px_20px_rgba(0,0,0,0.05)]",
        className,
      )}
    >
      {caption ? (
        <p className="mb-1 text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          {caption}
        </p>
      ) : null}
      {m.headline ? (
        <p className="mb-1 text-center font-display text-[13px] font-bold leading-snug text-slate-900">
          {m.headline}
        </p>
      ) : null}
      {m.subline ? (
        <p className="mb-3 text-center text-[11px] font-medium leading-snug text-slate-600">{m.subline}</p>
      ) : null}

      {/* Intent slider visual */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-[12px] font-medium text-slate-500">
          <span>Soft</span>
          <span>Serious</span>
        </div>
        <div className="relative">
          {/* Track */}
          <div className="h-[10px] w-full rounded-full bg-[#F1F2F4]" aria-hidden />
          {/* Active fill */}
          <div
            className="absolute left-0 top-0 h-[10px] rounded-full bg-primary transition-[width] duration-300"
            style={{ width: `${fillWidth}%` }}
            aria-hidden
          />
          {/* Thumb */}
          <div
            className="absolute top-1/2 h-6 w-6 -translate-y-1/2 -translate-x-1/2 rounded-full bg-white shadow-[0_10px_30px_-18px_rgba(15,23,42,0.45)] ring-1 ring-black/[0.06]"
            style={{ left: `${fillWidth}%` }}
            aria-hidden
          >
            <div className="absolute inset-0 grid place-items-center">
              <Heart className="h-3.5 w-3.5 text-primary" fill="currentColor" stroke="none" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
