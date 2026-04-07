import { motion } from "framer-motion";
import { PenSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";

/** Create-post FAB on Community feed. AI Luna uses the labeled quick action row (no duplicate Luna control). */
export function LunaFab({ className }: { className?: string }) {
  const [location, setLocation] = useLocation();
  const loc = String(location ?? "");
  if (loc.startsWith("/admin")) return null;
  if (loc !== "/community") return null;

  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-x-0 z-[60] flex justify-center",
        "bottom-[7.05rem]",
        className,
      )}
    >
      <div className="flex w-full max-w-lg justify-end px-5">
        <motion.button
          type="button"
          whileTap={{ scale: 0.94 }}
          transition={{ type: "spring", stiffness: 420, damping: 32 }}
          className={cn(
            "pointer-events-auto grid place-items-center h-12 w-12 rounded-full border-2 border-border bg-card text-foreground",
            "shadow-[0_14px_46px_-18px_rgba(15,23,42,0.45)] dark:shadow-[0_14px_46px_-12px_rgba(0,0,0,0.55)] hover:glow-primary",
          )}
          onClick={() => {
            try {
              sessionStorage.setItem("matchify_open_create_post", JSON.stringify({ groupId: null }));
            } catch {
              /* ignore */
            }
            try {
              window.dispatchEvent(
                new CustomEvent("matchify-open-create-post", {
                  detail: { groupId: null, from: "community-fab" },
                }),
              );
            } catch {
              /* ignore */
            }
            if (loc !== "/community") setLocation("/community");
          }}
          aria-label="Create post"
        >
          <PenSquare className="h-5 w-5 text-primary" strokeWidth={1.75} aria-hidden />
        </motion.button>
      </div>
    </div>
  );
}

