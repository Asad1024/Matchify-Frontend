import { cn } from "@/lib/utils";

export type FeedPill = { id: string; label: string };
export type FeedGroupChip = { id: string; name: string; onClick: () => void };

interface FeedFilterPillsProps {
  pills: readonly FeedPill[];
  activeId: string;
  onChange: (id: string) => void;
  groups?: FeedGroupChip[];
  className?: string;
}

export default function FeedFilterPills({
  pills,
  activeId,
  onChange,
  groups = [],
  className,
}: FeedFilterPillsProps) {
  return (
    <div
      className={cn(
        "matchify-surface overflow-hidden rounded-[18px]",
        className,
      )}
    >
      <div className="flex gap-2 overflow-x-auto px-3 py-2.5 scrollbar-hide" aria-label="Feed and group filters">
        {pills.map((f) => {
          const active = activeId === f.id;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => onChange(f.id)}
              className={cn(
                "inline-flex min-w-[92px] flex-shrink-0 items-center justify-center rounded-full px-3 py-1.5 text-xs font-medium tracking-[0.2px] transition",
                "border border-[#F0F0F0] bg-white text-slate-600 hover:bg-slate-900/[0.03]",
                active &&
                  "border-transparent bg-primary text-primary-foreground shadow-[0_10px_30px_-18px_rgba(114,47,55,0.35)]",
              )}
            >
              {f.label}
            </button>
          );
        })}

        {groups.length > 0 ? (
          <div className="flex shrink-0 items-center px-1" aria-hidden>
            <div className="h-6 w-px bg-[#F0F0F0]" />
          </div>
        ) : null}

        {groups.map((g) => (
          <button
            key={g.id}
            type="button"
            onClick={g.onClick}
            className={cn(
              "max-w-[10rem] flex-shrink-0 truncate rounded-full px-4 py-1.5 text-xs font-medium tracking-[0.2px] transition",
              "border border-[#F0F0F0] bg-white text-slate-600 hover:bg-slate-900/[0.03] hover:border-slate-200 hover:text-slate-900",
            )}
          >
            {g.name}
          </button>
        ))}
      </div>
    </div>
  );
}

