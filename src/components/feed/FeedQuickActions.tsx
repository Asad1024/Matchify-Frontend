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
    <div className={cn("grid grid-cols-3 gap-3 px-4 py-3", className)}>
      {actions.map(({ id, label, icon: Icon, onClick, tone = "primary" }) => {
        const t = TONES[tone];
        return (
          <button
            key={id}
            type="button"
            onClick={onClick}
            className={cn(
              "group flex flex-col items-center justify-center gap-2 rounded-2xl p-3 text-center transition",
              "border border-white/60 bg-white/80 shadow-[0_4px_20px_rgba(0,0,0,0.05)] backdrop-blur-md",
              "hover:scale-[1.02] active:scale-[0.99]",
            )}
          >
            <div
              className={cn(
                "flex h-11 w-11 items-center justify-center rounded-2xl",
                t.wrap,
                "ring-1 ring-black/[0.04] group-hover:ring-black/[0.06] transition",
              )}
            >
              <Icon className={cn("h-6 w-6", t.icon, "opacity-90")} strokeWidth={1.75} aria-hidden />
            </div>
            <span className="text-xs font-semibold text-slate-900 tracking-[0.2px]">{label}</span>
          </button>
        );
      })}
    </div>
  );
}

