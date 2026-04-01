import * as React from "react";
import { cn } from "@/lib/utils";

export function Section({
  title,
  subtitle,
  right,
  children,
  className,
  contentClassName,
}: {
  title?: string;
  subtitle?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  return (
    <section className={cn("space-y-2", className)}>
      {(title || subtitle || right) && (
        <div className="flex items-start justify-between gap-3 px-1">
          <div className="min-w-0">
            {title ? (
              <h2 className="truncate font-display text-[16px] font-semibold text-foreground">{title}</h2>
            ) : null}
            {subtitle ? (
              <p className="mt-0.5 text-[12px] font-medium text-muted-foreground">{subtitle}</p>
            ) : null}
          </div>
          {right ? <div className="shrink-0">{right}</div> : null}
        </div>
      )}
      <div className={cn("matchify-surface", contentClassName)}>{children}</div>
    </section>
  );
}

