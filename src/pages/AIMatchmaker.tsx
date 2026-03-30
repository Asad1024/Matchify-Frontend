import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import Header from "@/components/common/Header";
import PageWrapper from "@/components/common/PageWrapper";
import BottomNav from "@/components/common/BottomNav";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Sparkles,
  ArrowRight,
  Clock,
  Users,
  CheckCircle2,
  AlertCircle,
  Trash2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrentUser } from "@/contexts/UserContext";
import { useAiMatchCooldown, formatCountdown } from "@/hooks/useAiMatchCooldown";
import { useToast } from "@/hooks/use-toast";
import { AI_MATCH_COOLDOWN_MS, getAiMatchCooldownLabel } from "@/lib/matchifyBranding";
import type { User } from "@shared/schema";
import { resetAIMatchmakerSubmission } from "@/services/aiMatchmaker.service";

export default function AIMatchmaker() {
  const [activePage, setActivePage] = useState("menu");
  const [, setLocation] = useLocation();
  const { logout } = useAuth();
  const { userId } = useCurrentUser();
  const { toast } = useToast();
  const { data: profile } = useQuery<
    User & {
      attractionBlueprint?: unknown;
      name?: string;
      lastAiMatchClaimedAt?: string | null;
    }
  >({
    queryKey: [`/api/users/${userId}`],
    enabled: !!userId,
  });

  const { msLeft, ready } = useAiMatchCooldown(1000, profile?.lastAiMatchClaimedAt);

  const hasBlueprint = !!profile?.attractionBlueprint;
  const matchmakerLocked = !!(profile as { matchmakerLocked?: boolean } | undefined)?.matchmakerLocked;
  const firstName = profile?.name?.split(" ")[0] || "there";

  const cooldownProgress = useMemo(() => {
    if (ready) return 100;
    const elapsed = AI_MATCH_COOLDOWN_MS - msLeft;
    return Math.min(100, Math.max(0, (elapsed / AI_MATCH_COOLDOWN_MS) * 100));
  }, [msLeft, ready]);

  const resetSubmissionMutation = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error("Not signed in");
      await resetAIMatchmakerSubmission(userId);
    },
    onSuccess: () => {
      toast({
        title: "Submission deleted",
        description: "You can now fill the 30-question flow again.",
      });
    },
    onError: () => {
      toast({
        title: "Something went wrong",
        description: "Could not delete your submission.",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-primary/[0.03] to-background pb-28">
      <Header
        showSearch={false}
        unreadNotifications={0}
        onNotifications={() => setLocation("/notifications")}
        onCreate={() => setLocation("/")}
        onSettings={() => setLocation("/profile")}
        onLogout={logout}
      />

      <PageWrapper className="mx-auto max-w-lg px-4 pt-4">
        {/* Title + one line of context */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-md shadow-primary/25">
            <Sparkles className="h-6 w-6" strokeWidth={2} aria-hidden />
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">AI Matchmaker</h1>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
            {hasBlueprint
              ? `Hi ${firstName} — one curated pick per ${getAiMatchCooldownLabel()}.`
              : `Hi ${firstName} — finish 30 questions once to unlock timed picks and smarter Discover.`}
          </p>
        </div>

        {!hasBlueprint && (
          <Card className="mb-4 border-amber-200 bg-amber-50/60">
            <CardContent className="flex items-start gap-3 p-4">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" aria-hidden />
              <p className="text-sm leading-relaxed text-amber-900">
                To activate AI Matchmaker, please complete and submit all 30 questions once. This one-time
                questionnaire is required before personalized matches can be generated.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Edge: locked without blueprint */}
        {!hasBlueprint && matchmakerLocked && (
          <Card className="mb-4 border-border">
            <CardContent className="p-4 text-center text-sm text-muted-foreground">
              <Button variant="ghost" className="text-primary" onClick={() => setLocation("/directory")}>
                Open Discover
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Timed pick — only relevant after questionnaire */}
        {hasBlueprint && (
          <Card
            className={`mb-4 border-2 shadow-sm transition-colors ${
              ready ? "border-primary/30 ring-1 ring-primary/10" : "border-border"
            }`}
            data-testid="card-ai-match-cooldown"
          >
            <CardContent className="space-y-3 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/12">
                  <Clock className="h-5 w-5 text-primary" aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-sm font-semibold text-foreground">Next curated pick</h2>
                  <p className="text-xs text-muted-foreground">
                    {ready
                      ? "Your pick appears automatically in Discover — Curated picks."
                      : `${formatCountdown(msLeft)} until your next pick`}
                  </p>
                </div>
              </div>
              {!ready && <Progress value={cooldownProgress} className="h-1.5 bg-muted" />}
              <Button
                className="h-11 w-full rounded-full font-semibold shadow-sm"
                variant={ready ? "default" : "secondary"}
                disabled={!ready}
                onClick={() => setLocation("/directory?tab=curated")}
                data-testid="button-ai-reveal-matches"
              >
                <Users className="mr-2 h-4 w-4" />
                {ready ? "Open curated pick in Discover" : `Wait ${formatCountdown(msLeft)}`}
              </Button>
              <button
                type="button"
                className="w-full text-center text-xs text-muted-foreground underline-offset-2 hover:underline"
                onClick={() => setLocation("/directory")}
              >
                Browse Discover
              </button>
            </CardContent>
          </Card>
        )}

        {/* Single action card */}
        <Card
          className="mb-4 border-2 border-primary/20 shadow-sm"
          data-testid="card-flow-combined"
        >
          <CardContent className="space-y-4 p-4">
            {!hasBlueprint ? (
              <>
                <p className="text-sm text-muted-foreground">
                  ~12 minutes · order follows your profile gender.
                </p>
                <Button
                  className="h-12 w-full rounded-full text-base font-bold shadow-md shadow-primary/15"
                  onClick={() => setLocation("/ai-matchmaker/flow-b")}
                >
                  <Sparkles className="mr-2 h-5 w-5" />
                  Start questionnaire
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" aria-hidden />
                  Questionnaire saved
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-full text-xs text-muted-foreground hover:text-destructive"
                  disabled={resetSubmissionMutation.isPending}
                  onClick={() => resetSubmissionMutation.mutate()}
                >
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                  {resetSubmissionMutation.isPending ? "Deleting..." : "Delete submission (testing)"}
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        <p className="px-2 pb-4 text-center text-[11px] leading-relaxed text-muted-foreground">
          AI uses only what you share. Questionnaire responses are locked after submission.
        </p>
      </PageWrapper>

      <BottomNav active={activePage} onNavigate={setActivePage} />
    </div>
  );
}
