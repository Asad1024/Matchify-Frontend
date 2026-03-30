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
        "rounded-3xl border border-stone-200/90 bg-white p-4 shadow-[0_1px_0_rgba(0,0,0,0.04),0_8px_28px_-12px_rgba(25,20,30,0.12)]",
        className,
      )}
    >
      <div className="mb-3 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 text-primary shadow-inner">
          <Icon className="h-5 w-5" strokeWidth={2} />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-[15px] font-black leading-tight text-foreground">{title}</h2>
          {description ? (
            <p className="mt-0.5 text-[11px] font-medium leading-snug text-muted-foreground">{description}</p>
          ) : null}
        </div>
      </div>
      <div className="border-t border-stone-100/80 pt-3">{children}</div>
    </section>
  );
}
