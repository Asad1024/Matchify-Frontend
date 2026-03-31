import { motion } from "framer-motion";
import { Bot, PenSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";

export function LunaFab({ className }: { className?: string }) {
  const [location, setLocation] = useLocation();
  if (location.startsWith("/luna")) return null;
  if (location.startsWith("/admin")) return null;
  // Only show on Feed page, not globally.
  if (location !== "/community") return null;

  const isChat = location.startsWith("/chat");
  const showCreatePost =
    location === "/community" ||
    (location.startsWith("/community/") && !location.startsWith("/community/create-post"));

  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-x-0 z-[60] flex justify-center",
        isChat ? "bottom-[6.25rem]" : "bottom-[5.5rem]",
        className,
      )}
    >
      <div className="flex w-full max-w-lg justify-end px-4">
        <div className="flex flex-col gap-3 items-end">
          <motion.button
            type="button"
            whileTap={{ scale: 0.94 }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
            className={cn(
              "pointer-events-auto grid place-items-center h-14 w-14 rounded-full border border-stone-200/80 bg-white text-stone-900",
              "shadow-[0_14px_46px_-18px_rgba(15,23,42,0.45)] hover:glow-primary",
            )}
            onClick={() => setLocation("/luna")}
            aria-label="Open Luna"
          >
            <Bot className="h-5 w-5 text-primary" strokeWidth={1.75} aria-hidden />
          </motion.button>

          {showCreatePost ? (
            <motion.button
              type="button"
              whileTap={{ scale: 0.94 }}
              transition={{ type: "spring", stiffness: 420, damping: 32 }}
              className={cn(
                "pointer-events-auto grid place-items-center h-14 w-14 rounded-full border border-stone-200/80 bg-white text-stone-900",
                "shadow-[0_14px_46px_-18px_rgba(15,23,42,0.45)] hover:glow-primary",
              )}
              onClick={() => setLocation("/community/create-post")}
              aria-label="Create post"
            >
              <PenSquare className="h-5 w-5 text-primary" strokeWidth={1.75} aria-hidden />
            </motion.button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

