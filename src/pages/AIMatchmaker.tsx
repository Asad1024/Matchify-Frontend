import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/common/Header";
import PageWrapper from "@/components/common/PageWrapper";
import BottomNav from "@/components/common/BottomNav";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Sparkles,
  ArrowRight,
  Clock,
  Users,
  Brain,
  Compass,
  Zap,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrentUser } from "@/contexts/UserContext";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useAiMatchCooldown, formatCountdown } from "@/hooks/useAiMatchCooldown";
import { useToast } from "@/hooks/use-toast";
import { AI_MATCH_COOLDOWN_MS } from "@/lib/matchifyBranding";
import type { User } from "@shared/schema";

const stagger = (i: number) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: 0.06 * i, duration: 0.4, ease: [0.22, 1, 0.36, 1] as const },
});

export default function AIMatchmaker() {
  const [activePage, setActivePage] = useState("menu");
  const [, setLocation] = useLocation();
  const { logout } = useAuth();
  const { userId } = useCurrentUser();
  const prefersReducedMotion = useReducedMotion();
  const { toast } = useToast();
  const { data: profile } = useQuery<
    User & {
      attractionBlueprint?: unknown;
      selfDiscoveryCompleted?: boolean;
      name?: string;
      lastAiMatchClaimedAt?: string | null;
    }
  >({
    queryKey: [`/api/users/${userId}`],
    enabled: !!userId,
  });

  const { msLeft, ready } = useAiMatchCooldown(1000, profile?.lastAiMatchClaimedAt);

  const hasBlueprint = !!profile?.attractionBlueprint;
  const matchmakerLocked = !!(profile as any)?.matchmakerLocked;
  const selfDone = !!profile?.selfDiscoveryCompleted;
  const firstName = profile?.name?.split(" ")[0] || "there";

  const cooldownProgress = useMemo(() => {
    if (ready) return 100;
    const elapsed = AI_MATCH_COOLDOWN_MS - msLeft;
    return Math.min(100, Math.max(0, (elapsed / AI_MATCH_COOLDOWN_MS) * 100));
  }, [msLeft, ready]);

  const handleRevealMatches = () => {
    if (!ready) {
      toast({
        title: "Almost there",
        description: `Directory boost unlocks in ${formatCountdown(msLeft)} (same 48h rhythm as your curated match).`,
      });
      return;
    }
    setLocation("/directory");
  };

  const goFlow = (path: string) => setLocation(path);

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

      <PageWrapper className="max-w-lg mx-auto px-4 pt-2">
        {!hasBlueprint && (
          <div
            className="mb-4 rounded-2xl border-2 border-amber-400/80 bg-amber-50 p-4 shadow-sm"
            role="status"
            data-testid="banner-ai-matchmaker-required"
          >
            <div className="flex gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-amber-100">
                <AlertCircle className="h-5 w-5 text-amber-700" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-sm text-amber-950 mb-1">Complete questions to see matches</p>
                <p className="text-xs text-amber-900/85 leading-relaxed mb-3">
                  Until you finish all <span className="font-semibold">30 AI Matchmaker questions</span>,
                  curated matches and AI-ranked people in <span className="font-semibold">Discover</span> stay
                  locked.
                </p>
                <Button
                  size="sm"
                  className="bg-primary text-primary-foreground font-bold rounded-xl h-9 text-xs"
                  onClick={() => setLocation(matchmakerLocked ? "/directory" : "/ai-matchmaker/flow-b")}
                >
                  <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                  {matchmakerLocked ? "Open your matches" : "Start or continue"}
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Decorative header blob */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/15 via-chart-4/10 to-primary/5 border border-primary/10 p-6 mb-6">
          <div
            className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/20 blur-2xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-6 left-1/4 h-24 w-24 rounded-full bg-chart-4/15 blur-xl"
            aria-hidden
          />

          <motion.div
            initial={prefersReducedMotion ? {} : { opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.45 }}
            className="relative text-center"
          >
            <Badge
              variant="secondary"
              className="mb-3 border-primary/20 bg-white/80 text-primary shadow-sm backdrop-blur-sm"
            >
              <Zap className="w-3 h-3 mr-1" />
              Personalized for every background
            </Badge>
            <div className="mx-auto mb-4 flex h-[72px] w-[72px] items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-pink-500 shadow-lg shadow-primary/25">
              <Sparkles className="h-9 w-9 text-white" strokeWidth={2} />
            </div>
            <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
              AI Matchmaker
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground max-w-sm mx-auto">
              Hi {firstName} — <strong className="text-foreground">30 questions</strong>, ordered for your
              profile gender, cover what you’re drawn to and what you’re ready for.
              {matchmakerLocked
                ? " Your AI Matchmaker is completed and locked; Luna coaching and AI date features now use this profile."
                : " When you finish, you get one curated match and unlock Luna coaching + AI dates."}
            </p>
          </motion.div>
        </div>

        {/* Profile readiness */}
        <motion.div
          {...(prefersReducedMotion ? {} : stagger(1))}
          className="flex flex-wrap gap-2 justify-center mb-6"
        >
          <Badge
            variant="outline"
            className={`rounded-full px-3 py-1 font-medium ${
              hasBlueprint
                ? "border-primary/40 bg-primary/5 text-primary"
                : "border-border text-muted-foreground"
            }`}
          >
            {hasBlueprint ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                {matchmakerLocked ? "Attraction map saved (locked)" : "Attraction map saved"}
              </>
            ) : (
              <>
                <Compass className="w-3.5 h-3.5 mr-1" />
                Attraction map — not started
              </>
            )}
          </Badge>
          <Badge
            variant="outline"
            className={`rounded-full px-3 py-1 font-medium ${
              selfDone
                ? "border-primary/40 bg-primary/5 text-primary"
                : "border-border text-muted-foreground"
            }`}
          >
            {selfDone ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                Self-discovery done
              </>
            ) : (
              <>
                <Brain className="w-3.5 h-3.5 mr-1" />
                Self-discovery optional
              </>
            )}
          </Badge>
        </motion.div>

        {/* Directory boost / cooldown */}
        <motion.div {...(prefersReducedMotion ? {} : stagger(2))}>
          <Card
            className={`mb-5 overflow-hidden border-2 shadow-sm transition-colors ${
              ready ? "border-primary/35 bg-white ring-1 ring-primary/10" : "border-border bg-card"
            }`}
            data-testid="card-ai-match-cooldown"
          >
            <CardContent className="p-5 space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-primary/12">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="font-display font-semibold text-base text-foreground">
                    Directory boost
                  </h2>
                  <p className="text-sm text-muted-foreground mt-0.5 leading-snug">
                    {ready
                      ? "48h cycle is clear — open People with extra AI ranking emphasis."
                      : `Matches your curated-match timer. Unlocks in ${formatCountdown(msLeft)}. You can still browse anytime.`}
                  </p>
                </div>
              </div>
              {!ready && (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] text-muted-foreground uppercase tracking-wide font-medium">
                    <span>Recharging</span>
                    <span>{Math.round(cooldownProgress)}%</span>
                  </div>
                  <Progress value={cooldownProgress} className="h-2 bg-muted" />
                </div>
              )}
              <Button
                className="w-full rounded-full h-11 font-semibold shadow-md shadow-primary/15"
                disabled={!ready}
                onClick={handleRevealMatches}
                data-testid="button-ai-reveal-matches"
              >
                <Users className="w-4 h-4 mr-2" />
                {ready ? "Open People with boost" : `Wait ${formatCountdown(msLeft)}`}
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        <motion.p
          {...(prefersReducedMotion ? {} : stagger(3))}
          className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 px-1"
        >
          Start here
        </motion.p>

        <motion.div {...(prefersReducedMotion ? {} : stagger(4))}>
          <Card
            role="button"
            tabIndex={0}
            aria-label={matchmakerLocked ? "AI Matchmaker completed" : "Start the 30-question AI Matchmaker"}
            className={`mb-6 overflow-hidden border-2 bg-gradient-to-br from-white to-primary/[0.08] transition-all group shadow-sm ${
              matchmakerLocked
                ? "border-green-300/80"
                : "border-primary/30 hover:border-primary/55 hover:shadow-lg cursor-pointer"
            }`}
            onClick={() => {
              if (!matchmakerLocked) goFlow("/ai-matchmaker/flow-b");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                if (!matchmakerLocked) goFlow("/ai-matchmaker/flow-b");
              }
            }}
            data-testid="card-flow-combined"
          >
            <CardContent className="p-5">
              <div className="flex gap-4 items-center">
                <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-pink-500 text-white shadow-lg shadow-primary/20">
                  <Sparkles className="h-7 w-7" strokeWidth={2} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-display font-bold text-lg text-foreground">
                      AI Matchmaker
                    </h3>
                    <Badge className={`text-[10px] ${matchmakerLocked ? "bg-green-600 text-white" : "bg-primary text-primary-foreground"}`}>
                      {matchmakerLocked ? "Completed" : "30 questions"}
                    </Badge>
                    <Badge variant="secondary" className="text-[10px]">
                      ~12 min
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 leading-snug">
                    Attraction, values, lifestyle, and readiness.
                    {matchmakerLocked
                      ? " Your answers are now locked and used for all future match ranking and Luna guidance."
                      : " Finish once to unlock curated matching and Luna coaching."}
                  </p>
                </div>
                <ArrowRight className={`w-5 h-5 flex-shrink-0 ${matchmakerLocked ? "text-green-600" : "text-primary group-hover:translate-x-0.5 transition-transform"}`} />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* How it works */}
        <motion.div
          {...(prefersReducedMotion ? {} : stagger(5))}
          className="rounded-2xl border border-border bg-muted/30 p-5 mb-4"
        >
          <h3 className="font-display font-semibold text-sm text-foreground mb-3 flex items-center gap-2">
            <Brain className="w-4 h-4 text-primary" />
            How it works
          </h3>
          <ol className="space-y-3 text-sm text-muted-foreground">
            <li className="flex gap-3">
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                1
              </span>
              <span>Answer all 30 steps — order follows your profile gender.</span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                2
              </span>
              <span>We save your blueprint and show exactly one top curated match for this cycle.</span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                3
              </span>
              <span>Directory ranking refreshes in cycles, but your Matchmaker answers stay locked unless support resets them.</span>
            </li>
          </ol>
        </motion.div>

        <motion.p
          {...(prefersReducedMotion ? {} : stagger(6))}
          className="text-center text-xs text-muted-foreground px-2 pb-2"
        >
          Matchify welcomes all faiths and worldviews. AI only uses what you choose to share.
        </motion.p>
      </PageWrapper>

      <BottomNav active={activePage} onNavigate={setActivePage} />
    </div>
  );
}
