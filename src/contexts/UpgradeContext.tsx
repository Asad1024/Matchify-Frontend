import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { normalizeTier, tierAtLeast, type MembershipTier } from "@/lib/entitlements";
import { useCurrentUser } from "@/contexts/UserContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { User } from "@shared/schema";

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

  return (
    <UpgradeContext.Provider value={{ tier, requireTier, openUpgrade, closeUpgrade }}>
      {children}
      <AlertDialog open={prompt.open} onOpenChange={(v) => (v ? null : closeUpgrade())}>
        <AlertDialogContent className="rounded-[24px] border border-[#F0F0F0] bg-white shadow-[0_20px_70px_-32px_rgba(15,23,42,0.35)]">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-[18px] font-bold text-foreground">
              Upgrade to unlock
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[13px] leading-5 text-slate-600">
              <span className="font-semibold text-slate-900">{prompt.feature || "This feature"}</span>{" "}
              requires{" "}
              <Badge variant="secondary" className="mx-1 rounded-full">
                {String(prompt.minTier || "plus").toUpperCase()}
              </Badge>
              or higher.
              {prompt.reason ? <span className="mt-2 block text-slate-600">{prompt.reason}</span> : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-2">
            <AlertDialogCancel className="rounded-full">Not now</AlertDialogCancel>
            <Button
              className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => {
                closeUpgrade();
                setLocation("/subscriptions");
              }}
            >
              View plans
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </UpgradeContext.Provider>
  );
}

export function useUpgrade() {
  const ctx = useContext(UpgradeContext);
  if (!ctx) throw new Error("useUpgrade must be used inside UpgradeProvider");
  return ctx;
}

