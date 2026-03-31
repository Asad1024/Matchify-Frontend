import { useState } from "react";
import { useLocation } from "wouter";
import BottomNav from "@/components/common/BottomNav";
import { LunaChatPanel } from "@/components/assistant/PersonalAssistantOverlay";
import { useAuth } from "@/contexts/AuthContext";
import { Bell, Settings, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function LunaPage() {
  const [, setLocation] = useLocation();
  const { logout } = useAuth();
  const [activePage, setActivePage] = useState("community");

  // Reuse the existing chat UI, but render it inline so Header+BottomNav remain visible.
  return (
    <div className="min-h-screen bg-[#F9FAFB] pb-24">
      {/* Subtle mesh gradient just for Luna space */}
      <div
        className={cn(
          "pointer-events-none fixed inset-0 -z-10 opacity-70",
          "bg-[radial-gradient(circle_at_20%_10%,rgba(114,47,55,0.10),transparent_45%),radial-gradient(circle_at_85%_18%,rgba(248,113,113,0.10),transparent_42%),radial-gradient(circle_at_40%_90%,rgba(236,72,153,0.08),transparent_48%)]",
        )}
        aria-hidden
      />

      {/* Premium Luna header */}
      <div className="sticky top-0 z-40 border-b border-[#F0F0F0] bg-white/70 backdrop-blur-md">
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-transparent text-slate-600 hover:border-[#F0F0F0] hover:bg-white"
            onClick={() => setLocation("/menu")}
            aria-label="Back"
            title="Back"
          >
            <Sparkles className="h-5 w-5 text-primary" strokeWidth={1.75} aria-hidden />
          </button>

          <div className="min-w-0 text-center">
            <div className="relative">
              <div className="mx-auto w-fit font-display text-[18px] font-extrabold tracking-[0.2px] text-slate-900 drop-shadow-[0_0_20px_rgba(114,47,55,0.18)]">
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
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-transparent text-slate-600 hover:border-[#F0F0F0] hover:bg-white"
              onClick={() => setLocation("/notifications")}
              aria-label="Notifications"
              title="Notifications"
            >
              <Bell className="h-5 w-5" strokeWidth={1.75} aria-hidden />
            </button>
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-transparent text-slate-600 hover:border-[#F0F0F0] hover:bg-white"
              onClick={() => setLocation("/profile")}
              aria-label="Settings"
              title="Settings"
            >
              <Settings className="h-5 w-5" strokeWidth={1.75} aria-hidden />
            </button>
            <button
              type="button"
              className="hidden h-10 items-center justify-center rounded-full border border-[#F0F0F0] bg-white px-3 text-[12px] font-semibold text-slate-700 shadow-sm hover:bg-white sm:inline-flex"
              onClick={logout}
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-lg px-4 pt-3">
        <div className="overflow-hidden rounded-[24px] border border-white/60 bg-white/70 shadow-[0_10px_30px_-18px_rgba(15,23,42,0.22)] backdrop-blur-md">
          <div className="h-[calc(100svh-13rem)]">
            <LunaChatPanel />
          </div>
        </div>
      </div>

      <BottomNav active={activePage} onNavigate={setActivePage} />
    </div>
  );
}

