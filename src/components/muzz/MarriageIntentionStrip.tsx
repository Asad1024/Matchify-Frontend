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
          "matchify-surface rounded-[22px] border-white/0 bg-card/70 px-4 py-3 shadow-2xs",
          className,
        )}
      >
        {caption ? (
          <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            {caption}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary">
            <Heart className="h-3.5 w-3.5" fill="currentColor" stroke="none" aria-hidden />
            {m.left}
          </span>
          <span className="inline-flex items-center rounded-full border border-border/70 bg-muted/40 px-3 py-1 text-[11px] font-medium text-foreground/80">
            {m.middle}
          </span>
          <span className="inline-flex items-center rounded-full border border-border/70 bg-card/60 px-3 py-1 text-[11px] font-medium text-foreground/80">
            {m.right}
          </span>
        </div>

        {m.headline ? (
          <p className="mt-2 text-[13px] font-semibold leading-snug text-foreground">{m.headline}</p>
        ) : null}
        {m.subline ? (
          <p className="mt-1 text-[12px] font-medium leading-snug text-muted-foreground">{m.subline}</p>
        ) : null}

        {/* Minimal progress indicator (no "Soft/Serious" labels) */}
        <div className="mt-3 h-[8px] w-full overflow-hidden rounded-full bg-muted/50" aria-hidden>
          <div className="h-full rounded-full bg-primary" style={{ width: `${fillWidth}%` }} />
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "matchify-surface rounded-[24px] border-white/0 bg-card/70 px-4 py-3.5 shadow-2xs",
        className,
      )}
    >
      {caption ? (
        <p className="mb-1 text-center text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          {caption}
        </p>
      ) : null}
      {m.headline ? (
        <p className="mb-1 text-center font-display text-[13px] font-semibold leading-snug text-foreground">
          {m.headline}
        </p>
      ) : null}
      {m.subline ? (
        <p className="mb-3 text-center text-[11px] font-medium leading-snug text-muted-foreground">{m.subline}</p>
      ) : null}

      {/* Intent slider visual */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-[12px] font-medium text-muted-foreground">
          <span>Soft</span>
          <span>Serious</span>
        </div>
        <div className="relative">
          {/* Track */}
          <div className="h-[10px] w-full rounded-full bg-muted/60" aria-hidden />
          {/* Active fill */}
          <div
            className="absolute left-0 top-0 h-[10px] rounded-full bg-primary transition-[width] duration-300"
            style={{ width: `${fillWidth}%` }}
            aria-hidden
          />
          {/* Thumb */}
          <div
            className="absolute top-1/2 h-6 w-6 -translate-y-1/2 -translate-x-1/2 rounded-full bg-card shadow-lg ring-1 ring-border/70"
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
