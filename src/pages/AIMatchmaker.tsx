import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import Header from "@/components/common/Header";
import PageWrapper from "@/components/common/PageWrapper";
import BottomNav from "@/components/common/BottomNav";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import {
  Sparkles,
  ArrowRight,
  Clock,
  Users,
  CheckCircle2,
  AlertCircle,
  Trash2,
} from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrentUser } from "@/contexts/UserContext";
import { useAiMatchCooldown, formatCountdown } from "@/hooks/useAiMatchCooldown";
import { useToast } from "@/hooks/use-toast";
import { AI_MATCH_COOLDOWN_MS, getAiMatchCooldownLabel } from "@/lib/matchifyBranding";
import type { User } from "@shared/schema";
import { resetAIMatchmakerSubmission } from "@/services/aiMatchmaker.service";
import { cn } from "@/lib/utils";

export default function AIMatchmaker() {
  const [activePage, setActivePage] = useState("menu");
  const [, setLocation] = useLocation();
  const { logout } = useAuth();
  const { userId } = useCurrentUser();
  const { toast } = useToast();
  const [notifyWhenReady, setNotifyWhenReady] = useState(false);
  const { data: profile } = useQuery<
    User & {
      attractionBlueprint?: unknown;
      name?: string;
      lastAiMatchClaimedAt?: string | null;
    }
  >({
    queryKey: [`/api/users/${userId}`],
    enabled: !!userId,
    refetchInterval: 10000,
  });

  const { msLeft, ready } = useAiMatchCooldown(1000, profile?.lastAiMatchClaimedAt);

  const hasBlueprint = !!profile?.attractionBlueprint;
  const matchmakerLocked = !!(profile as { matchmakerLocked?: boolean } | undefined)?.matchmakerLocked;
  const firstName = profile?.name?.split(" ")[0] || "there";

  useEffect(() => {
    try {
      const raw = localStorage.getItem("matchify_notify_ai_pick_ready");
      if (raw === "true") setNotifyWhenReady(true);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("matchify_notify_ai_pick_ready", notifyWhenReady ? "true" : "false");
    } catch {
      /* ignore */
    }
  }, [notifyWhenReady]);

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
    <div className="min-h-screen bg-[#F9FAFB] pb-28">
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
          <motion.div
            className="mx-auto mb-3 grid h-14 w-14 place-items-center overflow-hidden rounded-2xl border border-white/60 bg-gradient-to-br from-[#722F37] to-[#8B2942] text-primary-foreground shadow-[0_18px_60px_-28px_rgba(114,47,55,0.55)]"
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 420, damping: 30 }}
            aria-hidden
          >
            <motion.div
              className="absolute inset-0"
              animate={{ opacity: [0.15, 0.35, 0.15] }}
              transition={{ duration: 2.6, repeat: Infinity, ease: [0.22, 1, 0.36, 1] }}
              style={{
                background:
                  "radial-gradient(circle at 30% 20%, rgba(255,255,255,0.24), transparent 55%), radial-gradient(circle at 70% 80%, rgba(255,255,255,0.14), transparent 60%)",
              }}
            />
            <motion.div
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: [0.22, 1, 0.36, 1] }}
              className="relative"
            >
              <Sparkles className="h-7 w-7 drop-shadow-[0_0_14px_rgba(255,255,255,0.25)]" strokeWidth={2} />
            </motion.div>
          </motion.div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">AI Matchmaker</h1>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
            {hasBlueprint
              ? (
                <>
                  <span className="font-semibold text-slate-900">{`Hi ${firstName},`}</span>{" "}
                  <span className="font-normal text-slate-600">{`one curated pick per ${getAiMatchCooldownLabel()}.`}</span>
                </>
              )
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
            className={cn(
              "mb-4 overflow-hidden rounded-[24px] border border-white/60 bg-white/75 shadow-[0_10px_30px_-18px_rgba(15,23,42,0.22)] backdrop-blur-lg",
              "ring-1 ring-black/[0.03]",
              ready ? "ring-primary/15" : "",
            )}
            data-testid="card-ai-match-cooldown"
          >
            <CardContent className="space-y-3 p-4">
              <div
                className="pointer-events-none absolute inset-0"
                aria-hidden
                style={{
                  background:
                    "linear-gradient(135deg, rgba(114,47,55,0.06), rgba(255,255,255,0.00) 55%)",
                }}
              />

              <div className="relative flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-black/[0.04]">
                  <Clock className="h-5 w-5 text-primary" aria-hidden strokeWidth={1.75} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Next curated pick
                  </p>
                  <motion.div
                    animate={ready ? { opacity: 1 } : { opacity: [0.92, 1, 0.92] }}
                    transition={{ duration: 2.2, repeat: ready ? 0 : Infinity, ease: [0.22, 1, 0.36, 1] }}
                    className="mt-1 font-display text-[26px] font-extrabold leading-none text-slate-900 tabular-nums"
                    aria-live="polite"
                  >
                    {ready ? "Ready" : formatCountdown(msLeft)}
                  </motion.div>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600">
                    {ready
                      ? "Your pick appears automatically in Discover — Curated picks."
                      : "Time remaining until your next pick."}
                  </p>
                </div>
              </div>

              {!ready && (
                <Progress
                  value={cooldownProgress}
                  className={cn(
                    "h-2 rounded-full bg-slate-200/70",
                    "[&>div]:rounded-full",
                    "[&>div]:bg-gradient-to-r [&>div]:from-[#722F37] [&>div]:to-[#B85A74]",
                  )}
                />
              )}
              <Button
                className={cn(
                  "h-11 w-full rounded-full font-semibold",
                  ready
                    ? "shadow-sm"
                    : "border border-[#F0F0F0] bg-transparent text-slate-700 shadow-none hover:bg-white/70",
                )}
                variant={ready ? "default" : "ghost"}
                disabled={false}
                onClick={() => setLocation("/directory?tab=curated")}
                data-testid="button-ai-reveal-matches"
              >
                <Users className="mr-2 h-4 w-4" />
                {ready ? "Open curated pick in Discover" : `Wait ${formatCountdown(msLeft)}`}
              </Button>

              {!ready ? (
                <div className="flex items-center justify-between gap-3 rounded-[20px] border border-[#F0F0F0] bg-white/60 px-3 py-2 shadow-sm backdrop-blur-md">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-900">Notify me when ready</p>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-slate-600">
                      We’ll surface a reminder in-app (demo toggle).
                    </p>
                  </div>
                  <Switch checked={notifyWhenReady} onCheckedChange={setNotifyWhenReady} aria-label="Notify me" />
                </div>
              ) : null}

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
          className={cn(
            "mb-4 overflow-hidden rounded-[24px] border border-[#F0F0F0] bg-white shadow-[0_10px_30px_-18px_rgba(15,23,42,0.22)]",
            hasBlueprint ? "ring-1 ring-emerald-500/10 shadow-[0_14px_46px_-18px_rgba(16,185,129,0.18)]" : "",
          )}
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
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 ring-1 ring-black/[0.04]">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Status
                    </p>
                    <p className="font-display text-[16px] font-bold leading-tight text-slate-900">
                      Questionnaire saved
                    </p>
                  </div>
                </div>

                <Button
                  className="h-12 w-full rounded-full bg-gradient-to-br from-[#722F37] to-[#8B2942] text-base font-bold text-white shadow-[0_18px_60px_-28px_rgba(114,47,55,0.55)] hover:brightness-[0.98]"
                  onClick={() => setLocation("/ai-matchmaker/flow-b")}
                >
                  <Sparkles className="mr-2 h-5 w-5" strokeWidth={1.75} />
                  Update questionnaire
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-full text-xs text-slate-500 hover:text-destructive"
                  disabled={resetSubmissionMutation.isPending}
                  onClick={() => resetSubmissionMutation.mutate()}
                >
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                  {resetSubmissionMutation.isPending ? "Deleting..." : "Reset submission"}
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        <p className="px-2 pb-4 text-center text-[12px] leading-[1.6] text-slate-500">
          AI uses only what you share. Questionnaire responses are locked after submission.
        </p>
      </PageWrapper>

      <BottomNav active={activePage} onNavigate={setActivePage} />
    </div>
  );
}
