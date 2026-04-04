import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

interface SubscriptionTierProps {
  id: string;
  name: string;
  description: string;
  price: string;
  period: string;
  features: string[];
  popular?: boolean;
  current?: boolean;
  onSubscribe?: (id: string) => void | Promise<void>;
  /** Landing / marketing: always-enabled CTA, no “current plan” state */
  variant?: "default" | "marketing";
  onMarketingAction?: () => void;
  marketingButtonLabel?: string;
  /** This tier’s subscribe/upgrade request is in flight */
  subscribePending?: boolean;
  /** While true, non-current plan buttons are disabled (e.g. another tier is loading) */
  subscribeDisabled?: boolean;
  /** Shown on the button while subscribePending (e.g. “Subscribing…”, “Upgrading…”) */
  pendingLabel?: string;
  "data-testid"?: string;
}

export default function SubscriptionTier({
  id,
  name,
  description,
  price,
  period,
  features,
  popular = false,
  current = false,
  onSubscribe,
  variant = "default",
  onMarketingAction,
  marketingButtonLabel = "Get started",
  subscribePending = false,
  subscribeDisabled = false,
  pendingLabel,
  "data-testid": dataTestId,
}: SubscriptionTierProps) {
  const marketing = variant === "marketing";
  const ctaDisabled =
    marketing ? false : current ? true : subscribePending || subscribeDisabled;

  const ctaLabel = (() => {
    if (marketing) return marketingButtonLabel;
    if (subscribePending && pendingLabel) return pendingLabel;
    if (current) return "Current Plan";
    return "Upgrade Now";
  })();

  return (
    <Card 
      className={`relative ${popular ? 'border-primary shadow-lg shadow-primary/10' : ''}`}
      data-testid={dataTestId ?? `card-tier-${id}`}
    >
      {popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <div className="bg-gradient-to-r from-primary to-chart-2 text-primary-foreground px-4 py-1 rounded-full text-xs font-semibold">
            Most Popular
          </div>
        </div>
      )}
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-2xl font-display">{name}</CardTitle>
        <CardDescription>{description}</CardDescription>
        <div className="mt-4">
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-4xl font-bold font-display text-foreground">{price}</span>
            <span className="text-muted-foreground">/{period}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <ul className="space-y-3">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-3">
              <Check className="w-5 h-5 text-chart-2 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-foreground">{feature}</span>
            </li>
          ))}
        </ul>
        <Button
          className={`w-full rounded-full ${popular && (!current || marketing) ? 'glow-primary transition-all duration-300' : ''}`}
          variant={marketing ? (popular ? "default" : "outline") : current ? "outline" : popular ? "default" : "outline"}
          onClick={() => {
            if (marketing) {
              onMarketingAction?.();
              return;
            }
            void onSubscribe?.(id);
          }}
          disabled={ctaDisabled}
          data-testid={`button-subscribe-${id}`}
        >
          {ctaLabel}
        </Button>
      </CardContent>
    </Card>
  );
}
