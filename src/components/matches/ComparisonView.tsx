import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Check, X } from "lucide-react";
import type { AIMatch } from "@/services/aiMatchmaker.service";
import { useCurrentUser } from "@/contexts/UserContext";
import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

interface ComparisonViewProps {
  match: AIMatch;
}

export function ComparisonView({ match }: ComparisonViewProps) {
  const { userId } = useCurrentUser();
  const { data: currentUser } = useQuery<User & {
    relationshipGoal?: string | null;
    values?: string[] | null;
    lifestyle?: string[] | null;
    career?: string | null;
    education?: string | null;
    incomeRange?: string | null;
  }>({
    queryKey: [`/api/users/${userId}`],
    enabled: !!userId,
  });

  if (!match.attributeMatches) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        Comparison data not available for this match.
      </div>
    );
  }

  const attributes = [
    {
      key: 'age' as const,
      label: 'Age',
      userValue: currentUser?.age ? `${currentUser.age} years` : 'Not specified',
      matchValue: match.age ? `${match.age} years` : match.attributeMatches.age.details,
    },
    {
      key: 'relationshipGoal' as const,
      label: 'Relationship Goal',
      userValue: currentUser?.relationshipGoal || 'Not specified',
      matchValue: match.attributeMatches.relationshipGoal.details,
    },
    {
      key: 'values' as const,
      label: 'Core Values',
      userValue: currentUser?.values?.join(', ') || 'Not specified',
      matchValue: match.attributeMatches.values.details,
    },
    {
      key: 'lifestyle' as const,
      label: 'Lifestyle',
      userValue: currentUser?.lifestyle?.join(', ') || 'Not specified',
      matchValue: match.attributeMatches.lifestyle.details,
    },
    {
      key: 'career' as const,
      label: 'Career',
      userValue: currentUser?.career || 'Not specified',
      matchValue: match.attributeMatches.career.details,
    },
    ...(match.attributeMatches.education ? [{
      key: 'education' as const,
      label: 'Education',
      userValue: currentUser?.education || 'Not specified',
      matchValue: match.attributeMatches.education.details,
    }] : []),
    ...(match.attributeMatches.income ? [{
      key: 'income' as const,
      label: 'Income Range',
      userValue: currentUser?.incomeRange || 'Not specified',
      matchValue: match.attributeMatches.income.details,
    }] : []),
  ];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="text-center p-3 rounded-lg bg-primary/5 border border-primary/20">
          <p className="text-xs text-muted-foreground mb-1">Your Preferences</p>
          <p className="text-sm font-semibold text-foreground">{currentUser?.name || 'You'}</p>
        </div>
        <div className="text-center p-3 rounded-lg bg-card border border-border">
          <p className="text-xs text-muted-foreground mb-1">Their Profile</p>
          <p className="text-sm font-semibold text-foreground">{match.name}</p>
        </div>
      </div>

      {attributes.map((attr, index) => {
        const attributeMatch = match.attributeMatches![attr.key];
        const isMatch = attributeMatch?.match ?? false;

        return (
          <motion.div
            key={attr.key}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="p-3 rounded-lg border"
            style={{
              borderColor: isMatch ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)',
              backgroundColor: isMatch ? 'rgba(34, 197, 94, 0.05)' : 'rgba(239, 68, 68, 0.05)',
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold text-foreground">{attr.label}</h4>
              {isMatch ? (
                <Badge className="bg-primary/20 text-primary text-[10px] px-1.5 py-0.5">
                  <Check className="w-2.5 h-2.5 mr-0.5" />
                  Match
                </Badge>
              ) : (
                <Badge className="bg-red-500/20 text-red-400 text-[10px] px-1.5 py-0.5">
                  <X className="w-2.5 h-2.5 mr-0.5" />
                  Different
                </Badge>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="text-muted-foreground mb-1">You:</p>
                <p className="text-foreground font-medium">{attr.userValue}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Them:</p>
                <p className="text-foreground font-medium">{attr.matchValue}</p>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

