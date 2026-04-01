import * as React from "react";
import { cn } from "@/lib/utils";

type SurfaceProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: "default" | "strong";
};

export function Surface({ className, variant = "default", ...props }: SurfaceProps) {
  return (
    <div
      className={cn(variant === "strong" ? "matchify-surface-strong" : "matchify-surface", className)}
      {...props}
    />
  );
}

