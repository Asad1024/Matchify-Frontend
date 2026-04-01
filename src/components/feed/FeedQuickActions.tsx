import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type FeedQuickAction = {
  id: string;
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  tone?: "primary" | "amber" | "violet";
};

const TONES: Record<NonNullable<FeedQuickAction["tone"]>, { wrap: string; icon: string }> = {
  primary: {
    wrap: "bg-primary/10",
    icon: "text-primary",
  },
  amber: {
    wrap: "bg-amber-500/10",
    icon: "text-amber-700",
  },
  violet: {
    wrap: "bg-violet-500/10",
    icon: "text-violet-700",
  },
};

export default function FeedQuickActions({
  actions,
  className,
}: {
  actions: FeedQuickAction[];
  className?: string;
}) {
  return (
    <div className={cn("grid grid-cols-3 gap-2 px-4 py-2", className)}>
      {actions.map(({ id, label, icon: Icon, onClick, tone = "primary" }) => {
        const t = TONES[tone];
        return (
          <button
            key={id}
            type="button"
            onClick={onClick}
            className={cn(
              "group flex flex-col items-center justify-center gap-1 rounded-2xl p-2 text-center transition",
              "matchify-surface border-white/0 bg-white/80",
            )}
          >
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-2xl",
                t.wrap,
                "ring-1 ring-black/[0.04] group-hover:ring-black/[0.06] transition",
              )}
            >
              <Icon className={cn("h-4.5 w-4.5", t.icon, "opacity-90")} strokeWidth={1.75} aria-hidden />
            </div>
            <span className="text-[11px] font-medium text-slate-900/90 tracking-[0.2px]">{label}</span>
          </button>
        );
      })}
    </div>
  );
}

