import * as React from "react";
import { cn } from "@/lib/utils";

type PillProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: "default" | "strong" | "active";
};

export function Pill({ className, variant = "default", ...props }: PillProps) {
  const base =
    variant === "active"
      ? "matchify-pill-active"
      : variant === "strong"
        ? "matchify-pill-strong"
        : "matchify-pill";
  return <span className={cn(base, className)} {...props} />;
}

