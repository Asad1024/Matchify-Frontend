import type { MembershipTier } from "@/lib/entitlements";

/** Public / in-app subscription card copy — aligned with `entitlements.ts` + curated AI match cooldown (≈48h, one pick per window). */
export type SubscriptionTierDefinition = {
  id: MembershipTier;
  name: string;
  description: string;
  price: string;
  period: string;
  features: string[];
  popular?: boolean;
};

export const SUBSCRIPTION_TIER_DEFINITIONS: SubscriptionTierDefinition[] = [
  {
    id: "free",
    name: "Free",
    description: "Basics to get started",
    price: "$0",
    period: "forever",
    features: [
      "Discovery, profiles, feed & chat basics",
      "2 message requests per day (recipient accepts in notifications)",
      "AI Matchmaker questionnaire — save answers; personalized AI picks need Plus",
      "No Luna AI chat",
    ],
  },
  {
    id: "plus",
    name: "Plus",
    description: "More reach + AI matches & Luna",
    price: "$19",
    period: "month",
    popular: true,
    features: [
      "Same messaging & discovery as Free, with higher Luna limits below",
      "AI Matchmaker: about 1 curated match every 48h (after you finish the questionnaire)",
      "Luna (global): 30 messages per day",
      "Luna Partner Space: 20 messages per day per space",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    description: "Unlimited Luna & heavier usage",
    price: "$29",
    period: "month",
    features: [
      "Unlimited message requests",
      "Unlimited Luna (global + partner spaces)",
      "AI Matchmaker: same ~48h curated cadence as Plus today",
      "Best if you chat heavily with Luna and send many intros",
    ],
  },
  {
    id: "elite",
    name: "Elite",
    description: "Premium + top placement",
    price: "$49",
    period: "month",
    features: [
      "Everything in Premium",
      "Boosts & higher visibility when those features roll out",
      "Exclusive perks (coming soon)",
    ],
  },
];
