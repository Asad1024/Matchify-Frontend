import * as React from "react";
import { cn } from "@/lib/utils";

export function PageLayout({
  children,
  className,
  contentClassName,
  maxWidth = "lg",
}: {
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  maxWidth?: "md" | "lg" | "xl";
}) {
  const mw = maxWidth === "xl" ? "max-w-6xl" : maxWidth === "md" ? "max-w-md" : "max-w-lg";
  return (
    <div className={cn("min-h-screen bg-[hsl(var(--surface-2))] pb-28", className)}>
      <div className={cn("mx-auto w-full px-3", mw, contentClassName)}>{children}</div>
    </div>
  );
}

