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
  onSubscribe?: (id: string) => void;
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
  onSubscribe
}: SubscriptionTierProps) {
  return (
    <Card 
      className={`relative ${popular ? 'border-primary shadow-lg shadow-primary/10' : ''}`}
      data-testid={`card-tier-${id}`}
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
          className={`w-full rounded-full ${popular && !current ? 'glow-primary transition-all duration-300' : ''}`}
          variant={current ? "outline" : popular ? "default" : "outline"}
          onClick={() => onSubscribe?.(id)}
          disabled={current}
          data-testid={`button-subscribe-${id}`}
        >
          {current ? 'Current Plan' : 'Upgrade Now'}
        </Button>
      </CardContent>
    </Card>
  );
}
