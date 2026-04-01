import * as React from "react";
import { cn } from "@/lib/utils";

type IconButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  size?: "sm" | "md";
};

export function IconButton({ className, size = "md", ...props }: IconButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        "matchify-icon-btn",
        size === "sm" ? "h-9 w-9" : "h-10 w-10",
        className,
      )}
      {...props}
    />
  );
}

