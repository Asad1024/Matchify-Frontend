import { useState } from "react";
import { useLocation } from "wouter";
import BottomNav from "@/components/common/BottomNav";
import { LunaChatPanel } from "@/components/assistant/PersonalAssistantOverlay";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, Bell, Settings, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function LunaPage() {
  const [, setLocation] = useLocation();
  const { logout } = useAuth();
  const [activePage, setActivePage] = useState("community");

  // Reuse the existing chat UI, but render it inline so Header+BottomNav remain visible.
  return (
    <div className="min-h-screen bg-[hsl(var(--surface-2))] pb-24">
      {/* Subtle mesh gradient just for Luna space */}
      <div
        className={cn(
          "pointer-events-none fixed inset-0 -z-10 opacity-70",
          "bg-[radial-gradient(circle_at_20%_10%,rgba(114,47,55,0.10),transparent_45%),radial-gradient(circle_at_85%_18%,rgba(248,113,113,0.10),transparent_42%),radial-gradient(circle_at_40%_90%,rgba(236,72,153,0.08),transparent_48%)]",
        )}
        aria-hidden
      />

      {/* Premium Luna header */}
      <div className="sticky top-0 z-40 border-b border-border/70 bg-card/70 backdrop-blur-md shadow-2xs">
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-transparent text-foreground/70 hover:border-border/70 hover:bg-foreground/[0.04]"
            onClick={() => {
              if (typeof window !== "undefined" && window.history.length > 1) {
                window.history.back();
                return;
              }
              setLocation("/community");
            }}
            aria-label="Back"
            title="Back"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={1.75} aria-hidden />
          </button>

          <div className="min-w-0 text-center">
            <div className="relative">
              <div className="mx-auto w-fit font-display text-[18px] font-bold tracking-[0.2px] text-slate-900 drop-shadow-[0_0_20px_rgba(114,47,55,0.10)]">
                Luna
              </div>
            </div>
            <div className="mt-1 flex items-center justify-center gap-2 text-[12px] text-slate-500">
              <motion.span
                className="relative inline-flex h-2.5 w-2.5 items-center justify-center"
                aria-hidden
              >
                <motion.span
                  className="absolute inline-flex h-2.5 w-2.5 rounded-full bg-primary/35 blur-[2px]"
                  animate={{ opacity: [0.25, 0.7, 0.25], scale: [0.9, 1.15, 0.9] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: [0.22, 1, 0.36, 1] }}
                />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary/70 ring-2 ring-white/60" />
              </motion.span>
              <span className="truncate">Always here to help</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-transparent text-foreground/70 hover:border-border/70 hover:bg-foreground/[0.04]"
              onClick={() => setLocation("/notifications")}
              aria-label="Notifications"
              title="Notifications"
            >
              <Bell className="h-5 w-5" strokeWidth={1.75} aria-hidden />
            </button>
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-transparent text-foreground/70 hover:border-border/70 hover:bg-foreground/[0.04]"
              onClick={() => setLocation("/settings")}
              aria-label="Settings"
              title="Settings"
            >
              <Settings className="h-5 w-5" strokeWidth={1.75} aria-hidden />
            </button>
            <button
              type="button"
              className="hidden h-10 items-center justify-center rounded-full border border-border/70 bg-card/70 px-3 text-[12px] font-semibold text-foreground/80 shadow-2xs hover:bg-card sm:inline-flex"
              onClick={logout}
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-lg px-4 pt-3">
        <div className="matchify-surface overflow-hidden border-white/0 bg-card/70">
          <div className="h-[calc(100svh-13rem)]">
            <LunaChatPanel />
          </div>
        </div>
      </div>

      <BottomNav active={activePage} onNavigate={setActivePage} />
    </div>
  );
}

