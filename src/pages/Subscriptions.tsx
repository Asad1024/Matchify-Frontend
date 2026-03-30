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
  membershipTier: string | null;
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

  const currentTier = user?.membershipTier || 'free';

  const tiers = [
    {
      id: 'free',
      name: 'Free',
      description: 'Get started with basic features',
      price: '$0',
      period: 'forever',
      features: [
        'Limited matches per day',
        'Basic profile features',
        'Join public events',
        'Access to 3 groups',
        'Standard support'
      ],
      current: currentTier === 'free'
    },
    {
      id: 'premium',
      name: 'Premium',
      description: 'Perfect for active daters',
      price: '$29',
      period: 'month',
      features: [
        'Unlimited likes and matches',
        'See who liked you',
        'Advanced filters',
        'Priority event access',
        'Join unlimited groups',
        'Message read receipts',
        'Priority support'
      ],
      popular: true,
      current: currentTier === 'premium'
    },
    {
      id: 'elite',
      name: 'Elite',
      description: 'Maximum visibility and features',
      price: '$49',
      period: 'month',
      features: [
        'Everything in Premium',
        'Profile boost (2x visibility)',
        'AI match insights',
        'Video/voice calls',
        'Access to exclusive events',
        'VIP support',
        'Dedicated matchmaker'
      ],
      current: currentTier === 'elite'
    },
    {
      id: 'diamond',
      name: 'Diamond',
      description: 'The ultimate dating experience',
      price: '$99',
      period: 'month',
      features: [
        'Everything in Elite',
        'Profile verification badge',
        'Unlimited profile boosts',
        'Background check included',
        'Concierge service',
        '24/7 VIP support',
        'Exclusive diamond events'
      ],
      current: currentTier === 'diamond'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <Header
        showSearch={false}
        onLogout={logout}
        title="Premium Plans"
      />

      <div className="max-w-lg mx-auto p-4">
        <div className="mb-4 bg-primary/5 border border-primary/20 rounded-2xl px-4 py-3 flex items-start gap-3">
          <Info className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
          <p className="text-xs text-gray-600">All plans include a 7-day money-back guarantee. Cancel anytime.</p>
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
                toast({
                  title: "Checkout not enabled",
                  description:
                    "Add Stripe keys and a checkout API route to process payments. UI-only for now.",
                })
              }
            />
          ))}
        </div>

        <div className="mt-10">
          <h2 className="text-2xl font-display font-bold text-foreground mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-foreground mb-2">Can I cancel anytime?</h3>
              <p className="text-muted-foreground">Yes, you can cancel your subscription at any time. You'll continue to have access to premium features until the end of your billing period.</p>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-2">What payment methods do you accept?</h3>
              <p className="text-muted-foreground">We accept all major credit cards, debit cards, and digital payment methods through our secure payment processor.</p>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-2">Can I upgrade or downgrade my plan?</h3>
              <p className="text-muted-foreground">Yes, you can change your plan at any time. When upgrading, you'll get immediate access to new features. When downgrading, changes take effect at the end of your current billing cycle.</p>
            </div>
          </div>
        </div>
      </div>

      <BottomNav active={activePage} onNavigate={setActivePage} />
    </div>
  );
}
