import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
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
} from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrentUser } from "@/contexts/UserContext";
import { useAiMatchCooldown, formatCountdown } from "@/hooks/useAiMatchCooldown";
import { AI_MATCH_COOLDOWN_MS, getAiMatchCooldownLabel } from "@/lib/matchifyBranding";
import type { User } from "@shared/schema";
import { cn } from "@/lib/utils";
import { markClientStateDirty } from "@/lib/clientStateSync";
import { useUpgrade } from "@/contexts/UpgradeContext";

export default function AIMatchmaker() {
  const [activePage, setActivePage] = useState("menu");
  const [, setLocation] = useLocation();
  const { logout } = useAuth();
  const { userId } = useCurrentUser();
  const { tier, requireTier } = useUpgrade();
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
  const aiAllowed = tier !== "free";

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
      markClientStateDirty();
    } catch {
      /* ignore */
    }
  }, [notifyWhenReady]);

  const cooldownProgress = useMemo(() => {
    if (ready) return 100;
    const elapsed = AI_MATCH_COOLDOWN_MS - msLeft;
    return Math.min(100, Math.max(0, (elapsed / AI_MATCH_COOLDOWN_MS) * 100));
  }, [msLeft, ready]);

  return (
    <div className="min-h-screen bg-[hsl(var(--surface-2))] pb-28">
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
            className="mx-auto mb-3 grid h-14 w-14 place-items-center overflow-hidden rounded-2xl border border-border/70 bg-primary text-primary-foreground shadow-lg"
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
                  <span className="font-semibold text-foreground">{`Hi ${firstName},`}</span>{" "}
                  <span className="font-normal text-muted-foreground">{`one AI match per ${getAiMatchCooldownLabel()}.`}</span>
                </>
              )
              : `Hi ${firstName} — finish 30 questions once to unlock timed picks and smarter matching in People.`}
          </p>
        </div>

        {!aiAllowed ? (
          <Card className="mb-4 overflow-hidden rounded-[24px] border border-border bg-card shadow-md dark:shadow-[0_10px_30px_-22px_rgba(0,0,0,0.4)]">
            <CardContent className="p-5">
              <div className="font-display text-[16px] font-bold text-foreground">AI Matchmaker is a Plus feature</div>
              <div className="mt-1 text-[13px] leading-5 text-muted-foreground">
                Free plan doesn’t include AI picks. Upgrade to unlock.
              </div>
              <div className="mt-4 flex gap-2">
                <Button
                  className="h-11 flex-1 rounded-full"
                  onClick={() => requireTier({ feature: "AI Matchmaker", minTier: "plus" })}
                >
                  Upgrade
                </Button>
                <Button
                  variant="outline"
                  className="h-11 flex-1 rounded-full border-border bg-transparent hover:bg-muted/50"
                  onClick={() => setLocation("/menu")}
                >
                  Back
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {!hasBlueprint && (
          <Card className="mb-4 border-amber-400/60 bg-amber-50/60 dark:border-amber-800/50 dark:bg-amber-950/45">
            <CardContent className="flex items-start gap-3 p-4">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700 dark:text-amber-300" aria-hidden />
              <p className="text-sm leading-relaxed text-amber-900 dark:text-amber-200/90">
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
                Open People
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Timed pick — only relevant after questionnaire */}
        {hasBlueprint && aiAllowed && (
          <Card
            className={cn(
              "mb-4 overflow-hidden rounded-[24px] border border-border bg-card shadow-md backdrop-blur-lg dark:shadow-[0_10px_30px_-18px_rgba(0,0,0,0.45)]",
              "ring-1 ring-black/[0.03] dark:ring-white/[0.06]",
              ready ? "ring-primary/15" : "",
            )}
            data-testid="card-ai-match-cooldown"
          >
            <CardContent className="relative space-y-3 overflow-hidden p-4">
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
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Next AI match
                  </p>
                  <motion.div
                    animate={ready ? { opacity: 1 } : { opacity: [0.92, 1, 0.92] }}
                    transition={{ duration: 2.2, repeat: ready ? 0 : Infinity, ease: [0.22, 1, 0.36, 1] }}
                    className="mt-1 font-display text-[26px] font-bold leading-none text-foreground tabular-nums"
                    aria-live="polite"
                  >
                    {ready ? "Ready" : formatCountdown(msLeft)}
                  </motion.div>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {ready
                      ? "Your match appears automatically in People — AI Matching."
                      : "Time remaining until your next pick."}
                  </p>
                </div>
              </div>

              {!ready && (
                <Progress
                  value={cooldownProgress}
                  className={cn(
                    "h-2 rounded-full bg-muted",
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
                    : "border border-border bg-transparent text-muted-foreground shadow-none hover:bg-muted/50",
                )}
                variant={ready ? "default" : "ghost"}
                disabled={false}
                onClick={() => setLocation("/directory")}
                data-testid="button-ai-reveal-matches"
              >
                <Users className="mr-2 h-4 w-4" />
                {ready ? "Open People — AI Matching tab" : `Wait ${formatCountdown(msLeft)}`}
              </Button>

              {!ready ? (
                <div className="flex items-center justify-between gap-3 rounded-[20px] border border-border bg-muted/40 px-3 py-2 shadow-sm backdrop-blur-md">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground">Notify me when ready</p>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
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
                Browse People
              </button>
            </CardContent>
          </Card>
        )}

        {/* Single action card */}
        <Card
          className={cn(
            "mb-4 overflow-hidden rounded-[24px] border border-border bg-card shadow-md dark:shadow-[0_14px_46px_-18px_rgba(0,0,0,0.4)]",
            hasBlueprint ? "ring-1 ring-emerald-500/10 shadow-[0_14px_46px_-18px_rgba(16,185,129,0.18)] dark:shadow-[0_14px_46px_-18px_rgba(16,185,129,0.12)]" : "",
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
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 ring-1 ring-black/[0.04]">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      Status
                    </p>
                    <p className="font-display text-[16px] font-bold leading-tight text-foreground">
                      Questionnaire saved
                    </p>
                  </div>
                </div>

                <p className="rounded-2xl border border-border bg-muted/40 px-4 py-3 text-sm leading-relaxed text-muted-foreground">
                  To change your answers after submission, please{" "}
                  <button
                    type="button"
                    className="font-semibold text-primary underline-offset-2 hover:underline"
                    onClick={() => setLocation("/support")}
                  >
                    contact support
                  </button>
                  .
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <p className="px-2 pb-4 text-center text-[12px] leading-[1.6] text-muted-foreground">
          AI uses only what you share. Answers are kept on file; use Support if you need them updated.
        </p>
      </PageWrapper>

      <BottomNav active={activePage} onNavigate={setActivePage} />
    </div>
  );
}
