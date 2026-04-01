import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function VerifiedTick({
  className,
  size = "sm",
}: {
  className?: string;
  size?: "xs" | "sm" | "md" | "lg";
}) {
  const dims =
    size === "lg"
      ? "h-5 w-5"
      : size === "md"
        ? "h-4 w-4"
        : size === "sm"
          ? "h-3.5 w-3.5"
          : "h-3 w-3";
  const icon =
    size === "lg"
      ? "h-3.5 w-3.5"
      : size === "md"
        ? "h-3 w-3"
        : size === "sm"
          ? "h-2.5 w-2.5"
          : "h-2 w-2";

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full",
        "bg-primary text-primary-foreground shadow-2xs ring-1 ring-primary/20",
        dims,
        className,
      )}
      aria-label="Verified"
      title="Verified"
    >
      <Check className={icon} strokeWidth={3} aria-hidden />
    </span>
  );
}

