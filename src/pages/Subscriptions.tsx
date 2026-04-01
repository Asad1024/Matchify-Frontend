import { useState } from "react";
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

type User = {
  id: string;
  membershipTier?: string | null;
  membershipExpiresAt?: string | null;
};

export default function Subscriptions() {
  const [activePage, setActivePage] = useState('menu');
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

  const tiers = [
    {
      id: 'free',
      name: 'Free',
      description: 'Basics to get started',
      price: '$0',
      period: 'forever',
      features: [
        'Discovery + view profiles',
        '3 compliments/week',
        'No AI features',
        '2 message requests/day',
      ],
      current: currentTier === 'free'
    },
    {
      id: 'plus',
      name: 'Plus',
      description: 'More reach + limited AI',
      price: '$19',
      period: 'month',
      features: [
        '20 compliments/week',
        'AI Matchmaker: 15 matches every 48h',
        'Luna (global): 30 msgs/day',
        'Luna Partner Space: 1 partner + 20 msgs/day',
      ],
      popular: true,
      current: currentTier === 'plus'
    },
    {
      id: 'elite',
      name: 'Elite',
      description: 'Maximum visibility and features',
      price: '$49',
      period: 'month',
      features: [
        'Everything in Premium',
        'Highest priority/boosts',
        'Exclusive perks (later)',
      ],
      current: currentTier === 'elite'
    },
    {
      id: 'premium',
      name: 'Premium',
      description: 'Unlimited AI + unlimited limits',
      price: '$29',
      period: 'month',
      features: [
        'Unlimited compliments',
        'AI Matchmaker: unlimited',
        'Luna (global): unlimited',
        'Luna Partner Space: unlimited partners + higher limits',
      ],
      current: currentTier === 'premium'
    },
  ];

  return (
    <div className="min-h-screen bg-[hsl(var(--surface-2))] pb-24">
      <Header
        showSearch={false}
        onLogout={logout}
        title="Premium Plans"
      />

      <div className="mx-auto max-w-lg px-3 pt-2">
        <div className="mb-3 matchify-surface bg-primary/5 px-4 py-3">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-primary/10">
              <Info className="h-4 w-4 text-primary" />
            </span>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-slate-900">7-day money-back guarantee</p>
              <p className="mt-0.5 text-xs leading-relaxed text-slate-600">Cancel anytime. Your plan stays active until the end of the billing period.</p>
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
              onSubscribe={() =>
                fetch(`/api/users/${userId}/subscription`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  credentials: "include",
                  body: JSON.stringify({ tier: tier.id, days: 30 }),
                })
                  .then(async (r) => {
                    if (!r.ok) throw new Error((await r.json().catch(() => ({})))?.message || "Failed");
                    toast({ title: "Activated (demo)", description: `${tier.name} is now active.` });
                    const { queryClient } = await import("@/lib/queryClient");
                    await queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}`] });
                  })
                  .catch((e) =>
                    toast({ title: "Could not activate", description: e?.message || "Try again", variant: "destructive" }),
                  )
              }
            />
          ))}
        </div>

        <div className="mt-8 matchify-surface p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">FAQ</p>
          <h2 className="mt-2 font-display text-xl font-bold tracking-tight text-slate-900">
            Frequently Asked Questions
          </h2>
          <div className="mt-4 space-y-4">
            <div className="rounded-2xl border border-border/70 bg-card/60 px-4 py-3">
              <h3 className="text-sm font-semibold text-slate-900">Can I cancel anytime?</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">
                Yes. You’ll keep access to premium features until the end of your billing period.
              </p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-card/60 px-4 py-3">
              <h3 className="text-sm font-semibold text-slate-900">What payment methods do you accept?</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">
                Major credit/debit cards and supported digital payment methods (via Stripe when enabled).
              </p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-card/60 px-4 py-3">
              <h3 className="text-sm font-semibold text-slate-900">Can I upgrade or downgrade?</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">
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
