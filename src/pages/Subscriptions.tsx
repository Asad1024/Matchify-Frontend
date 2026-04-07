import { useState } from "react";

const TIER_ORDER = ["free", "plus", "premium", "elite"] as const;

function tierRank(id: string): number {
  const i = TIER_ORDER.indexOf(id as (typeof TIER_ORDER)[number]);
  return i >= 0 ? i : 0;
}

function subscriptionPendingLabel(currentTierId: string, targetTierId: string): string {
  const cr = tierRank(currentTierId);
  const tr = tierRank(targetTierId);
  if (cr === 0 && tr > 0) return "Subscribing...";
  if (tr > cr) return "Upgrading...";
  return "Updating...";
}
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import Header from "@/components/common/Header";
import SubscriptionTier from "@/components/common/SubscriptionTier";
import BottomNav from "@/components/common/BottomNav";
import { useCurrentUser } from "@/contexts/UserContext";
import { useAuth } from "@/contexts/AuthContext";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/services/api";
import { queryClient } from "@/lib/queryClient";
import { SUBSCRIPTION_TIER_DEFINITIONS } from "@/lib/subscriptionPlans";

type User = {
  id: string;
  membershipTier?: string | null;
  membershipExpiresAt?: string | null;
};
export default function Subscriptions() {
  const [activePage, setActivePage] = useState('menu');
  const [pendingTierId, setPendingTierId] = useState<string | null>(null);
  const [, setLocation] = useLocation();
  const { userId } = useCurrentUser();
  const { logout } = useAuth();
  const { toast } = useToast();

  // Fetch current user to check membership tier
  const { data: user } = useQuery<User>({
    queryKey: [`/api/users/${userId}`],
    enabled: !!userId,
  });

  const currentTier = (user?.membershipTier || "free").toLowerCase();

  const tiers = SUBSCRIPTION_TIER_DEFINITIONS.map((def) => ({
    ...def,
    current: currentTier === def.id,
  }));

  return (
    <div className="min-h-screen bg-[hsl(var(--surface-2))] pb-24">
      <Header
        showSearch={false}
        onLogout={logout}
        title="Premium Plans"
      />

      <div className="mx-auto max-w-lg px-3 pt-2">
        <div className="mb-3 matchify-surface bg-primary/5 px-4 py-3 dark:bg-primary/10">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-full bg-card shadow-sm ring-1 ring-border">
              <Info className="h-4 w-4 text-primary" />
            </span>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-foreground">7-day money-back guarantee</p>
              <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                Cancel anytime. Your plan stays active until the end of the billing period.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {tiers.map((tier) => (
            <SubscriptionTier
              key={tier.id}
              id={tier.id}
              name={tier.name}
              description={tier.description}
              price={tier.price}
              period={tier.period}
              features={tier.features}
              popular={tier.popular}
              current={tier.current}
              data-testid={`tier-${tier.id}`}
              subscribePending={pendingTierId === tier.id}
              subscribeDisabled={pendingTierId !== null && pendingTierId !== tier.id}
              pendingLabel={
                pendingTierId === tier.id ? subscriptionPendingLabel(currentTier, tier.id) : undefined
              }
              onSubscribe={async () => {
                if (!userId) {
                  toast({ title: "Please log in", description: "Sign in to subscribe to a plan.", variant: "destructive" });
                  return;
                }

                setPendingTierId(tier.id);
                try {
                  const res = await apiRequest("PATCH", `/api/users/${userId}/subscription`, {
                    tier: tier.id,
                    days: 30,
                  });
                  const body = (await res.json()) as {
                    membershipTier?: string;
                    membershipExpiresAt?: string | null;
                  };
                  const nextTier = (body.membershipTier || tier.id).toLowerCase();
                  const nextExp = body.membershipExpiresAt ?? null;

                  queryClient.setQueryData<User>([`/api/users/${userId}`], (prev) => ({
                    ...(prev || { id: userId }),
                    membershipTier: nextTier,
                    membershipExpiresAt: nextExp,
                  }));

                  try {
                    localStorage.removeItem(`matchify:plan_override:${userId}`);
                    const raw = localStorage.getItem("currentUser");
                    const cur = raw ? JSON.parse(raw) : {};
                    localStorage.setItem(
                      "currentUser",
                      JSON.stringify({
                        ...cur,
                        membershipTier: nextTier,
                        membershipExpiresAt: nextExp,
                      }),
                    );
                  } catch {
                    /* ignore */
                  }

                  window.dispatchEvent(new Event("matchify-membership-updated"));
                  toast({ title: "Plan activated", description: `${tier.name} is now active.` });
                  await queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}`] });
                } catch (e: unknown) {
                  await queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}`] });
                  const msg = e instanceof Error ? e.message : "Could not update subscription.";
                  toast({ title: "Subscription failed", description: msg, variant: "destructive" });
                } finally {
                  setPendingTierId(null);
                }
              }}
            />
          ))}
        </div>

        <div className="mt-8 matchify-surface p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">FAQ</p>
          <h2 className="mt-2 font-display text-xl font-bold tracking-tight text-foreground">
            Frequently Asked Questions
          </h2>
          <div className="mt-4 space-y-4">
            <div className="rounded-2xl border border-border/70 bg-card/60 px-4 py-3 dark:bg-card/80">
              <h3 className="text-sm font-semibold text-foreground">Can I cancel anytime?</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                Yes. You’ll keep access to premium features until the end of your billing period.
              </p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-card/60 px-4 py-3 dark:bg-card/80">
              <h3 className="text-sm font-semibold text-foreground">What payment methods do you accept?</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                Major credit/debit cards and supported digital payment methods (via Stripe when enabled).
              </p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-card/60 px-4 py-3 dark:bg-card/80">
              <h3 className="text-sm font-semibold text-foreground">Can I upgrade or downgrade?</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                Yes. Upgrades apply immediately; downgrades apply at the end of the current cycle.
              </p>
            </div>
          </div>
        </div>
      </div>

      <BottomNav active={activePage} onNavigate={setActivePage} />
    </div>
  );
}
