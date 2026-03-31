import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useCurrentUser } from "@/contexts/UserContext";
import { useAiMatchCooldown } from "@/hooks/useAiMatchCooldown";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { claimNextCuratedMatch } from "@/services/aiMatchmaker.service";
import type { User } from "@shared/schema";

/**
 * When the server says the cooldown has ended, claims the next curated pick (one per cycle),
 * creates an in-app notification on the server, and shows a toast if a match was assigned.
 */
export function CuratedMatchAutoClaim() {
  const { userId } = useCurrentUser();
  const { toast } = useToast();

  const { data: profile } = useQuery<
    User & { attractionBlueprint?: unknown; lastAiMatchClaimedAt?: string | null }
  >({
    queryKey: [`/api/users/${userId}`],
    enabled: !!userId,
    refetchInterval: 10000,
  });

  const hasBlueprint = !!profile?.attractionBlueprint;
  const { ready } = useAiMatchCooldown(1000, profile?.lastAiMatchClaimedAt);

  const cycleStartedRef = useRef(false);
  const inFlightRef = useRef(false);

  useEffect(() => {
    if (!ready) {
      cycleStartedRef.current = false;
      return;
    }
    if (!userId || !hasBlueprint) return;
    if (cycleStartedRef.current || inFlightRef.current) return;

    inFlightRef.current = true;
    void claimNextCuratedMatch(userId)
      .then((res) => {
        cycleStartedRef.current = true;
        // Immediately reflect cooldown reset in UI (avoid waiting for polling/refetch).
        try {
          queryClient.setQueryData([`/api/users/${userId}`], (old: unknown) => {
            if (!old || typeof old !== "object") return old;
            return { ...(old as Record<string, unknown>), lastAiMatchClaimedAt: new Date().toISOString() };
          });
        } catch {
          /* ignore */
        }
        void queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}`] });
        void queryClient.invalidateQueries({ queryKey: ["/api/users", userId, "notifications"] });
        void queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/ai-matches`] });

        if (res.match) {
          toast({
            title: "Your curated match is ready",
            description: `${res.match.name} is listed under Discover → Curated picks.`,
          });
          try {
            if (typeof Notification !== "undefined" && Notification.permission === "granted") {
              new Notification("Matchify — curated match ready", {
                body: `View ${res.match.name} in Discover under Curated picks.`,
              });
            }
          } catch {
            /* ignore */
          }
        }
      })
      .catch((e: unknown) => {
        const err = e as { status?: number; message?: string };
        if (err.status === 409) return;
        console.error("CuratedMatchAutoClaim", e);
        cycleStartedRef.current = false;
      })
      .finally(() => {
        inFlightRef.current = false;
      });
  }, [ready, userId, hasBlueprint, toast]);

  return null;
}
