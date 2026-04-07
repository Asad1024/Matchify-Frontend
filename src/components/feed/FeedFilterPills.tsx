import { cn } from "@/lib/utils";

export type FeedPill = { id: string; label: string };
export type FeedGroupChip = { id: string; name: string; onClick: () => void };

interface FeedFilterPillsProps {
  pills: readonly FeedPill[];
  activeId: string;
  onChange: (id: string) => void;
  groups?: FeedGroupChip[];
  className?: string;
  /** When set with no `groups`, pills split the row evenly (e.g. Activity → My history). */
  variant?: "default" | "equalWidth";
}

export default function FeedFilterPills({
  pills,
  activeId,
  onChange,
  groups = [],
  className,
  variant = "default",
}: FeedFilterPillsProps) {
  const equalWidth = variant === "equalWidth" && groups.length === 0;

  return (
    <div
      className={cn(
        "matchify-surface overflow-hidden rounded-[18px]",
        className,
      )}
    >
      <div
        className={cn(
          "flex gap-2 px-3 py-2.5",
          equalWidth ? "w-full" : "overflow-x-auto scrollbar-hide",
        )}
        aria-label="Feed and group filters"
      >
        {pills.map((f) => {
          const active = activeId === f.id;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => onChange(f.id)}
              className={cn(
                "items-center justify-center rounded-full px-2 py-1.5 text-xs font-medium tracking-[0.2px] transition sm:px-3",
                "border border-border bg-muted/40 text-muted-foreground hover:bg-muted/60",
                active &&
                  "border-transparent bg-primary text-primary-foreground shadow-[0_10px_30px_-18px_rgba(114,47,55,0.35)]",
                equalWidth
                  ? "flex min-w-0 flex-1"
                  : "inline-flex min-w-[92px] flex-shrink-0",
              )}
            >
              {f.label}
            </button>
          );
        })}

        {groups.length > 0 ? (
          <div className="flex shrink-0 items-center px-1" aria-hidden>
            <div className="h-6 w-px bg-border" />
          </div>
        ) : null}

        {groups.map((g) => (
          <button
            key={g.id}
            type="button"
            onClick={g.onClick}
            className={cn(
              "max-w-[10rem] flex-shrink-0 truncate rounded-full px-4 py-1.5 text-xs font-medium tracking-[0.2px] transition",
              "border border-border bg-muted/40 text-muted-foreground hover:bg-muted/60 hover:text-foreground",
            )}
          >
            {g.name}
          </button>
        ))}
      </div>
    </div>
  );
}

