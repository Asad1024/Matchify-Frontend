import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Compact light / dark toggle for public pages (landing, login, signup). */
export function ThemeToggleButton({ className }: { className?: string }) {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <span
        className={cn("inline-flex h-10 w-10 shrink-0 rounded-full bg-muted/50", className)}
        aria-hidden
      />
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn(
        "h-10 w-10 shrink-0 rounded-full border shadow-2xs transition-colors",
        "border-border bg-card/90 text-foreground hover:bg-muted/90",
        /* Dark: stronger rim + fill so the control doesn’t disappear on the header */
        "dark:border-primary/55 dark:bg-primary/20 dark:text-amber-300 dark:shadow-md dark:shadow-black/40 dark:hover:bg-primary/30 dark:hover:text-amber-200",
        className,
      )}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {isDark ? (
        <Sun className="h-5 w-5 drop-shadow-sm dark:text-amber-300" strokeWidth={2} aria-hidden />
      ) : (
        <Moon className="h-5 w-5 text-foreground/90" strokeWidth={2} aria-hidden />
      )}
    </Button>
  );
}
