import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";

type PageBackBarProps = {
  /** Used when there is no in-app history entry to go back to. */
  fallback: string;
  label?: string;
};

export function PageBackBar({ fallback, label = "Back" }: PageBackBarProps) {
  const [, setLocation] = useLocation();

  const goBack = () => {
    if (window.history.length > 1) {
      window.history.back();
      return;
    }
    setLocation(fallback);
  };

  return (
    <div className="border-b border-border bg-background/95 px-2 py-1">
      <Button type="button" variant="ghost" size="sm" className="gap-1" onClick={goBack}>
        <ArrowLeft className="h-4 w-4" aria-hidden />
        {label}
      </Button>
    </div>
  );
}
