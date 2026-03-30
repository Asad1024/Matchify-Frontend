import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Sparkles, Check, AlertCircle, Heart } from "lucide-react";
import { useCurrentUser } from "@/contexts/UserContext";
import { getAIMatches } from "@/services/aiMatchmaker.service";
import type { AIMatch } from "@/services/aiMatchmaker.service";

interface MatchInsightsProps {
  targetUserId: string;
}

export function MatchInsights({ targetUserId }: MatchInsightsProps) {
  const { userId: currentUserId } = useCurrentUser();

  const { data: matches = [], isLoading } = useQuery<AIMatch[]>({
    queryKey: [`/api/users/${currentUserId}/ai-matches`],
    queryFn: async () => {
      const { matches } = await getAIMatches(currentUserId!);
      return matches;
    },
    enabled: !!currentUserId,
  });

  const matchData = matches.find((m) => m.id === targetUserId);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4 text-center text-sm text-muted-foreground">
          Calculating compatibility...
        </CardContent>
      </Card>
    );
  }

  if (!matchData) {
    return (
      <Card>
        <CardContent className="p-4 flex items-center gap-3 text-sm text-muted-foreground">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>Run the AI Matchmaker to see compatibility insights with this person.</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          AI Compatibility Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-4">
        {/* Overall score */}
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-muted-foreground">Overall Match</span>
              <span className="font-bold text-primary">{matchData.compatibility}%</span>
            </div>
            <Progress value={matchData.compatibility} className="h-2" />
          </div>
          {matchData.mutualCompatibility && (
            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs whitespace-nowrap">
              {matchData.mutualCompatibility}% Mutual
            </Badge>
          )}
        </div>

        {/* Emphasis */}
        {matchData.emphasis && (
          <p className="text-xs text-primary font-medium italic">{matchData.emphasis}</p>
        )}

        {/* Top reasons */}
        {matchData.reasons && matchData.reasons.length > 0 && (
          <div className="space-y-1.5">
            {matchData.reasons.slice(0, 3).map((reason, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                <Check className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
                <span>{reason}</span>
              </div>
            ))}
          </div>
        )}

        {/* Category breakdown */}
        {matchData.categories && (
          <div className="space-y-2 pt-1 border-t border-border">
            {Object.entries(matchData.categories)
              .sort((a, b) => b[1].score - a[1].score)
              .slice(0, 3)
              .map(([key, cat]) => (
                <div key={key}>
                  <div className="flex justify-between text-xs mb-0.5">
                    <span className="text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                    <span className="font-medium">{cat.score * 10}%</span>
                  </div>
                  <Progress value={cat.score * 10} className="h-1" />
                </div>
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
