import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Crown, MessageCircle, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { normalizeTier, tierAtLeast, type MembershipTier } from "@/lib/entitlements";
import { useCurrentUser } from "@/contexts/UserContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { User } from "@shared/schema";
import { cn } from "@/lib/utils";

type UpgradePrompt = {
  open: boolean;
  feature?: string;
  minTier?: MembershipTier;
  reason?: string;
};

type UpgradeContextValue = {
  tier: MembershipTier;
  requireTier: (args: { feature: string; minTier: MembershipTier; reason?: string }) => boolean;
  openUpgrade: (args: { feature: string; minTier: MembershipTier; reason?: string }) => void;
  closeUpgrade: () => void;
};

function tierLabel(t: MembershipTier | undefined): string {
  return String(t || "plus").toUpperCase();
}

function heroIconForTier(minTier: MembershipTier | undefined) {
  if (minTier === "premium" || minTier === "elite") return Crown;
  return Sparkles;
}

const UpgradeContext = createContext<UpgradeContextValue | null>(null);
export function UpgradeProvider({ children }: { children: React.ReactNode }) {
  const { userId } = useCurrentUser();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [prompt, setPrompt] = useState<UpgradePrompt>({ open: false });

  const { data: me } = useQuery<User & { membershipTier?: unknown }>({
    queryKey: [`/api/users/${userId}`],
    enabled: !!userId,
    staleTime: 15_000,
  });

  useEffect(() => {
    if (!userId) return;
    const refetchMe = () => {
      void queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}`] });
    };
    const onStorage = (ev: StorageEvent) => {
      if (ev.key === "currentUser") refetchMe();
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("matchify-membership-updated", refetchMe);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("matchify-membership-updated", refetchMe);
    };
  }, [userId, queryClient]);

  const tier = useMemo(() => normalizeTier((me as { membershipTier?: unknown })?.membershipTier), [me]);

  const openUpgrade = (args: { feature: string; minTier: MembershipTier; reason?: string }) => {
    setPrompt({ open: true, ...args });
  };
  const closeUpgrade = () => setPrompt({ open: false });

  const requireTier = (args: { feature: string; minTier: MembershipTier; reason?: string }) => {
    if (tierAtLeast(tier, args.minTier)) return true;
    openUpgrade(args);
    return false;
  };

  const minTier = prompt.minTier ?? "plus";
  const HeroIcon = heroIconForTier(minTier);
  const feature = prompt.feature || "This perk";

  return (
    <UpgradeContext.Provider value={{ tier, requireTier, openUpgrade, closeUpgrade }}>
      {children}
      <Dialog
        open={prompt.open}
        onOpenChange={(open) => {
          if (!open) closeUpgrade();
        }}
      >
        <DialogContent
          className={cn(
            "max-h-[min(90vh,540px)] w-[min(19rem,calc(100vw-2rem))] max-w-[min(19rem,calc(100vw-2rem))] gap-0 overflow-hidden rounded-[28px] border border-white/60 bg-white p-0 shadow-[0_24px_80px_-24px_rgba(114,47,55,0.55)] sm:max-w-[19rem]",
            "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-[0.98]",
          )}
        >
          <div className="relative">
            <div
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_-20%,hsl(var(--primary)/0.18),transparent_55%),linear-gradient(180deg,hsl(var(--primary)/0.08)_0%,white_45%,white_100%)]"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-primary/25 blur-3xl"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute -bottom-6 -left-10 h-28 w-28 rounded-full bg-violet-300/35 blur-3xl"
              aria-hidden
            />

            <div className="relative px-6 pb-2 pt-10 text-center">
              <DialogTitle className="sr-only">
                Upgrade to unlock {feature} — {tierLabel(minTier)} or higher
              </DialogTitle>
              <DialogDescription className="sr-only">
                {prompt.reason
                  ? `${feature} requires ${tierLabel(minTier)} or higher. ${prompt.reason}`
                  : `${feature} requires ${tierLabel(minTier)} or higher.`}
              </DialogDescription>

              <motion.div
                initial={{ opacity: 0, scale: 0.88, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 380, damping: 28 }}
                className="mx-auto mb-5 flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-[1.35rem] bg-white/95 shadow-[0_12px_40px_-16px_rgba(114,47,55,0.45)] ring-1 ring-primary/15 backdrop-blur-sm"
              >
                <HeroIcon
                  className={cn(
                    "h-9 w-9",
                    minTier === "premium" || minTier === "elite"
                      ? "text-amber-600"
                      : "text-primary",
                  )}
                  strokeWidth={1.75}
                  aria-hidden
                />
              </motion.div>

              <p className="font-display text-[11px] font-bold uppercase tracking-[0.2em] text-primary/80">
                Go further
              </p>
              <h2 className="mt-2 font-display text-[1.35rem] font-bold leading-tight tracking-tight text-slate-900">
                Unlock for your best matches
              </h2>

              <p className="mt-3 text-[13px] leading-relaxed text-slate-600">
                <span className="font-semibold text-slate-800">{feature}</span>
                <span className="text-slate-500"> needs </span>
                <span className="inline-flex items-center rounded-full bg-primary/12 px-2.5 py-0.5 align-middle text-[11px] font-bold uppercase tracking-wide text-primary ring-1 ring-primary/15">
                  {tierLabel(minTier)}
                </span>
              </p>

              {prompt.reason ? (
                <div className="mt-4 rounded-2xl border border-slate-200/80 bg-white/70 px-3.5 py-3 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] backdrop-blur-md">
                  <div className="flex gap-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <MessageCircle className="h-4 w-4" strokeWidth={2} aria-hidden />
                    </div>
                    <p className="text-[12px] leading-[1.45] text-slate-600">{prompt.reason}</p>
                  </div>
                </div>
              ) : null}

              <div className="mt-5 flex flex-wrap justify-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-900/[0.04] px-2.5 py-1 text-[10px] font-semibold text-slate-600 ring-1 ring-slate-200/90">
                  <Zap className="h-3 w-3 text-amber-500" aria-hidden />
                  Upgrade in one tap
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-900/[0.04] px-2.5 py-1 text-[10px] font-semibold text-slate-600 ring-1 ring-slate-200/90">
                  <Sparkles className="h-3 w-3 text-primary" aria-hidden />
                  Cancel anytime
                </span>
              </div>
            </div>
          </div>

          <div className="relative border-t border-slate-100/90 bg-gradient-to-b from-slate-50/90 to-slate-50 px-5 pb-5 pt-4">
            <Button
              type="button"
              className="h-12 w-full rounded-full bg-primary text-[15px] font-bold text-primary-foreground shadow-[0_14px_36px_-18px_rgba(114,47,55,0.85)] transition hover:bg-primary/92 active:scale-[0.98]"
              onClick={() => {
                closeUpgrade();
                setLocation("/subscriptions");
              }}
            >
              <Sparkles className="mr-2 h-4 w-4 opacity-95" aria-hidden />
              View plans
            </Button>
            <button
              type="button"
              className="mt-3 w-full py-2 text-[13px] font-semibold text-slate-500 transition hover:text-slate-800"
              onClick={closeUpgrade}
            >
              Not now
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </UpgradeContext.Provider>
  );
}

export function useUpgrade() {
  const ctx = useContext(UpgradeContext);
  if (!ctx) throw new Error("useUpgrade must be used inside UpgradeProvider");
  return ctx;
}
