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
};

function Milestone({ label, left }: { label: string; left: string }) {
  return (
    <div
      className="absolute top-1/2 z-[2] flex -translate-x-1/2 flex-col items-center"
      style={{ left }}
    >
      <div className="h-2.5 w-px shrink-0 bg-neutral-900" aria-hidden />
      <span className="mt-0.5 max-w-[5.5rem] text-center rounded-md bg-black px-1.5 py-0.5 text-[7px] font-bold uppercase leading-tight tracking-[0.08em] text-white shadow-sm">
        {label}
      </span>
    </div>
  );
}

export function MarriageIntentionStrip({ caption, className, ...intent }: Props) {
  const m = getMarriageStripMilestones(intent);
  const fillWidth = Math.max(12, Math.min(100, m.progressPercent));

  return (
    <div
      className={cn(
        "rounded-xl border border-stone-200/80 bg-white px-3 py-2.5 shadow-sm",
        className,
      )}
    >
      {caption ? (
        <p className="mb-1 text-center text-[9px] font-semibold uppercase tracking-[0.18em] text-stone-400">
          {caption}
        </p>
      ) : null}
      {m.headline ? (
        <p className="mb-1 text-center text-[12px] font-semibold leading-snug text-stone-800">{m.headline}</p>
      ) : null}
      {m.subline ? (
        <p className="mb-2 text-center text-[11px] font-medium leading-snug text-stone-500">{m.subline}</p>
      ) : null}

      <div className="flex min-h-[46px] items-center gap-0">
        <div className="pointer-events-none relative z-[3] flex shrink-0 items-center pr-0.5" aria-hidden>
          <Heart
            className="h-[18px] w-[18px] shrink-0 text-primary"
            fill="currentColor"
            stroke="none"
            strokeWidth={0}
          />
        </div>

        <div className="relative min-h-[46px] min-w-0 flex-1 pr-2">
          <div
            className="pointer-events-none absolute left-0 right-0 top-1/2 z-[1] h-px -translate-y-1/2 bg-stone-300"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute left-0 top-1/2 z-[1] h-px max-w-full -translate-y-1/2 bg-gradient-to-r from-primary/50 to-primary/15 transition-[width] duration-300"
            style={{ width: `${fillWidth}%` }}
            aria-hidden
          />

          <Milestone label={m.left} left="20%" />
          <Milestone label={m.middle} left="48%" />
          <Milestone label={m.right} left="78%" />
        </div>
      </div>
    </div>
  );
}
