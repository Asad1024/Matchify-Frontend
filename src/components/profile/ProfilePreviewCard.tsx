import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function ProfilePreviewCard({
  icon: Icon,
  title,
  description,
  children,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "matchify-surface rounded-3xl border-white/0 bg-card/70 p-4 shadow-2xs",
        className,
      )}
    >
      <div className="mb-3 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-2xs">
          <Icon className="h-5 w-5" strokeWidth={2} />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-[15px] font-bold leading-tight text-foreground">{title}</h2>
          {description ? (
            <p className="mt-0.5 text-[11px] font-medium leading-snug text-muted-foreground">{description}</p>
          ) : null}
        </div>
      </div>
      <div className="border-t border-border/70 pt-3">{children}</div>
    </section>
  );
}
