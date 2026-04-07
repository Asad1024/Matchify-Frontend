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
            "max-h-[min(90vh,540px)] w-[min(19rem,calc(100vw-2rem))] max-w-[min(19rem,calc(100vw-2rem))] gap-0 overflow-hidden rounded-[28px] border border-border bg-card p-0 text-card-foreground shadow-[0_24px_80px_-24px_rgba(114,47,55,0.55)] dark:shadow-[0_24px_80px_-24px_rgba(0,0,0,0.65)] sm:max-w-[19rem]",
            "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-[0.98]",
          )}
        >
          <div className="relative">
            <div
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_-20%,hsl(var(--primary)/0.18),transparent_55%),linear-gradient(180deg,hsl(var(--primary)/0.08)_0%,hsl(var(--card))_45%,hsl(var(--card))_100%)] dark:bg-[radial-gradient(120%_80%_at_50%_-20%,hsl(var(--primary)/0.22),transparent_55%),linear-gradient(180deg,hsl(var(--primary)/0.14)_0%,hsl(var(--card))_50%,hsl(var(--card))_100%)]"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-primary/25 blur-3xl dark:bg-primary/20"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute -bottom-6 -left-10 h-28 w-28 rounded-full bg-violet-300/35 blur-3xl dark:bg-violet-600/25"
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
                className="mx-auto mb-5 flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-[1.35rem] bg-card shadow-[0_12px_40px_-16px_rgba(114,47,55,0.45)] ring-1 ring-border backdrop-blur-sm dark:shadow-[0_12px_40px_-16px_rgba(0,0,0,0.5)] dark:ring-primary/25"
              >
                <HeroIcon
                  className={cn(
                    "h-9 w-9",
                    minTier === "premium" || minTier === "elite"
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-primary",
                  )}
                  strokeWidth={1.75}
                  aria-hidden
                />
              </motion.div>

              <p className="font-display text-[11px] font-bold uppercase tracking-[0.2em] text-primary/80">
                Go further
              </p>
              <h2 className="mt-2 font-display text-[1.35rem] font-bold leading-tight tracking-tight text-foreground">
                Unlock for your best matches
              </h2>

              <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
                <span className="font-semibold text-foreground">{feature}</span>
                <span> needs </span>
                <span className="inline-flex items-center rounded-full bg-primary/15 px-2.5 py-0.5 align-middle text-[11px] font-bold uppercase tracking-wide text-primary ring-1 ring-primary/25 dark:bg-primary/20">
                  {tierLabel(minTier)}
                </span>
              </p>

              {prompt.reason ? (
                <div className="mt-4 rounded-2xl border border-border bg-muted/40 px-3.5 py-3 text-left backdrop-blur-md dark:bg-muted/25">
                  <div className="flex gap-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <MessageCircle className="h-4 w-4" strokeWidth={2} aria-hidden />
                    </div>
                    <p className="text-[12px] leading-[1.45] text-muted-foreground">{prompt.reason}</p>
                  </div>
                </div>
              ) : null}

              <div className="mt-5 flex flex-wrap justify-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-muted/70 px-2.5 py-1 text-[10px] font-semibold text-foreground ring-1 ring-border dark:bg-muted/40">
                  <Zap className="h-3 w-3 text-amber-500 dark:text-amber-400" aria-hidden />
                  Upgrade in one tap
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-muted/70 px-2.5 py-1 text-[10px] font-semibold text-foreground ring-1 ring-border dark:bg-muted/40">
                  <Sparkles className="h-3 w-3 text-primary" aria-hidden />
                  Cancel anytime
                </span>
              </div>
            </div>
          </div>

          <div className="relative border-t border-border bg-gradient-to-b from-muted/50 to-muted/30 px-5 pb-5 pt-4 dark:from-muted/30 dark:to-muted/15">
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
              className="mt-3 w-full py-2 text-[13px] font-semibold text-muted-foreground transition hover:text-foreground"
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
