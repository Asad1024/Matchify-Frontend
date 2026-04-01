import { motion } from "framer-motion";
import { Bot, PenSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";

export function LunaFab({ className }: { className?: string }) {
  const [location, setLocation] = useLocation();
  const loc = String(location ?? "");
  if (loc.startsWith("/luna")) return null;
  if (loc.startsWith("/admin")) return null;
  // Only show on Feed page, not globally.
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
        <div className="flex flex-col gap-3 items-end">
          <motion.button
            type="button"
            whileTap={{ scale: 0.94 }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
            className={cn(
              "pointer-events-auto grid place-items-center h-12 w-12 rounded-full border-2 border-stone-200/80 bg-white text-stone-900",
              "shadow-[0_14px_46px_-18px_rgba(15,23,42,0.45)] hover:glow-primary",
            )}
            onClick={() => setLocation("/luna")}
            aria-label="Open Luna"
          >
            <Bot className="h-5 w-5 text-primary" strokeWidth={1.75} aria-hidden />
          </motion.button>

          <motion.button
            type="button"
            whileTap={{ scale: 0.94 }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
            className={cn(
              "pointer-events-auto grid place-items-center h-12 w-12 rounded-full border-2 border-stone-200/80 bg-white text-stone-900",
              "shadow-[0_14px_46px_-18px_rgba(15,23,42,0.45)] hover:glow-primary",
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
                    detail: { groupId: null, from: "luna-fab" },
                  }),
                );
              } catch {
                /* ignore */
              }
              // If we're already on /community, no navigation occurs — event above opens the modal immediately.
              // If routing changes in the future and this FAB appears elsewhere, keep this navigation fallback.
              if (loc !== "/community") setLocation("/community");
            }}
            aria-label="Create post"
          >
            <PenSquare className="h-5 w-5 text-primary" strokeWidth={1.75} aria-hidden />
          </motion.button>
        </div>
      </div>
    </div>
  );
}

