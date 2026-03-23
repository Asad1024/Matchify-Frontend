import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Sparkles, TrendingUp, TrendingDown, Info } from "lucide-react";
import type { AIMatch } from "@/services/aiMatchmaker.service";

interface AIInsightsProps {
  match: AIMatch;
  userName: string;
}

export function AIInsights({ match, userName }: AIInsightsProps) {
  if (!match.categories) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        Detailed insights not available for this match.
      </div>
    );
  }

  const { categories } = match;

  const categoryConfig = [
    {
      key: 'futureTogether' as const,
      title: 'Future Together',
      icon: Sparkles,
      color: 'bg-blue-500/20 text-blue-400',
    },
    {
      key: 'lifestyleTravel' as const,
      title: 'Lifestyle & Travel',
      icon: TrendingUp,
      color: 'bg-primary/20 text-primary',
    },
    {
      key: 'fitness' as const,
      title: 'Fitness',
      icon: TrendingUp,
      color: 'bg-purple-500/20 text-purple-400',
    },
    {
      key: 'foodCompatibility' as const,
      title: 'Food Compatibility',
      icon: Info,
      color: 'bg-orange-500/20 text-orange-400',
    },
    {
      key: 'communication' as const,
      title: 'Communication',
      icon: Info,
      color: 'bg-pink-500/20 text-pink-400',
    },
    {
      key: 'values' as const,
      title: 'Values',
      icon: Sparkles,
      color: 'bg-primary/20 text-primary',
    },
  ];

  return (
    <div className="space-y-4">
      {categoryConfig.map((config, index) => {
        const category = categories[config.key];
        const Icon = config.icon;
        const scorePercentage = (category.score / 10) * 100;

        return (
          <motion.div
            key={config.key}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="p-4 rounded-lg bg-card border border-border"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Icon className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-foreground text-sm">{config.title}</h3>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={`${config.color} text-xs px-2 py-1`}>
                  {category.score}/10
                </Badge>
                {category.score >= 7 ? (
                  <TrendingUp className="w-4 h-4 text-primary" />
                ) : category.score <= 4 ? (
                  <TrendingDown className="w-4 h-4 text-red-400" />
                ) : null}
              </div>
            </div>

            <Progress value={scorePercentage} className="h-2 mb-3" />

            {category.details.length > 0 && (
              <div className="space-y-1.5 mb-2">
                {category.details.map((detail, i) => (
                  <p key={i} className="text-xs text-muted-foreground leading-relaxed">
                    • {detail}
                  </p>
                ))}
              </div>
            )}

            {category.suggestions.length > 0 && (
              <div className="mt-3 pt-3 border-t border-border">
                <p className="text-xs font-medium text-foreground mb-1.5">Suggestions:</p>
                {category.suggestions.map((suggestion, i) => (
                  <p key={i} className="text-xs text-primary leading-relaxed">
                    💡 {suggestion}
                  </p>
                ))}
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}

