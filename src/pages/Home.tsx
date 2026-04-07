import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import Header from "@/components/common/Header";
import { OPEN_GLOBAL_SEARCH_EVENT } from "@/components/common/GlobalSearch";
import PageWrapper from "@/components/common/PageWrapper";
import BottomNav from "@/components/common/BottomNav";
import { BlockReportDialog } from "@/components/common/BlockReportDialog";
import { ShareProfileDialog } from "@/components/profile/ShareProfileDialog";
import { Card, CardContent } from "@/components/ui/card";
import {
  MarriageDiscoveryProfile,
  type MarriageDiscoveryUser,
} from "@/components/marriage/MarriageDiscoveryProfile";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowRight, Sparkles } from "lucide-react";
import { LoadingState } from "@/components/common/LoadingState";
import { useToast } from "@/hooks/use-toast";
import { useCurrentUser } from "@/contexts/UserContext";
import { useAuth } from "@/contexts/AuthContext";
import { PullToRefresh } from "@/components/common/PullToRefresh";
import { queryClient } from "@/lib/queryClient";
import { buildApiUrl } from "@/services/api";
import {
  addMarriageLiked,
  addMarriagePassed,
  getMarriageLikedIds,
  getMarriagePassedIds,
  isMarriageFavorite,
  toggleMarriageFavorite,
} from "@/lib/marriageDeckStore";
import { chatRequestPairQueryKey, fetchChatRequestPair } from "@/lib/chatRequestsApi";
import { resetMarriageTestingState } from "@/lib/marriageTestingReset";
import { filterToOppositeGender } from "@/lib/oppositeGenderPreference";

function hashPairScore(a: string, b: string): number {
  const s = `${a}:${b}`;
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  return 70 + (h % 30);
}

function deckScore(
  me: MarriageDiscoveryUser | null | undefined,
  u: MarriageDiscoveryUser,
): number {
  let s = hashPairScore(me?.id || "viewer", u.id);
  if (me?.commitmentIntention && u.commitmentIntention === me.commitmentIntention) {
    s += 12;
  }
  const mine = me?.interests?.length ? new Set(me.interests) : null;
  const shared = mine && u.interests ? u.interests.filter((x) => mine.has(x)).length : 0;
  s += shared * 6;
  return s;
}

export default function Home() {
  const [activePage, setActivePage] = useState("marriage");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { userId: currentUserId } = useCurrentUser();
  const { logout } = useAuth();
  const [deckNonce, setDeckNonce] = useState(0);
  const [favRev, setFavRev] = useState(0);
  const [blockOpen, setBlockOpen] = useState(false);
  const [blockReportType, setBlockReportType] = useState<"block" | "report">("report");
  const [shareOpen, setShareOpen] = useState(false);
  const [marriageChatEpoch, setMarriageChatEpoch] = useState(0);

  useEffect(() => {
    const onUpd = () => setMarriageChatEpoch((n) => n + 1);
    window.addEventListener("matchify-marriage-chat-updated", onUpd);
    return () => window.removeEventListener("matchify-marriage-chat-updated", onUpd);
  }, []);

  const { data: users = [], isLoading: usersLoading } = useQuery<MarriageDiscoveryUser[]>({
    queryKey: ["/api/users"],
  });

  const { data: me, isLoading: meLoading } = useQuery<MarriageDiscoveryUser>({
    queryKey: [`/api/users/${currentUserId}`],
    enabled: !!currentUserId,
  });

  const candidates = useMemo(() => {
    void deckNonce;
    if (!currentUserId) return [];
    const passed = getMarriagePassedIds();
    const liked = getMarriageLikedIds();
    const base = (Array.isArray(users) ? users : []).filter((u) => {
      if (!u || u.id === currentUserId) return false;
      if (passed.has(u.id) || liked.has(u.id)) return false;
      return true;
    });

    const viewerGender = me?.gender ?? (me as { profile?: { gender?: string } } | null)?.profile?.gender;
    // Strict: male → female profiles only, female → male only (no fallback to mixed deck).
    const list = filterToOppositeGender(base, viewerGender, false);

    const scored = list.map((u) => ({ u, score: deckScore(me ?? null, u) }));
    scored.sort((a, b) => b.score - a.score);
    return scored.map((x) => x.u);
  }, [users, currentUserId, me, deckNonce]);

  const current = candidates[0] ?? null;
  void marriageChatEpoch;
  const compatibilityScore =
    current && currentUserId ? hashPairScore(currentUserId, current.id) : 82;
  const { data: chatPair } = useQuery({
    queryKey: currentUserId && current?.id ? chatRequestPairQueryKey(currentUserId, current.id) : ["chat-pair", "disabled"],
    enabled: !!currentUserId && !!current?.id,
    queryFn: () => fetchChatRequestPair(currentUserId!, current!.id),
    refetchInterval: 8000,
  });
  const messageRequestStatus = chatPair?.outgoingStatus ?? "none";

  // Note: do not auto-redirect into Chat on approval.
  // The user should explicitly choose when to open chat from the profile UI.

  const likeMutation = useMutation({
    mutationFn: async (targetId: string) => {
      if (!currentUserId) throw new Error("Not signed in");
      const res = await fetch(buildApiUrl("/api/matches"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          user1Id: currentUserId,
          user2Id: targetId,
          compatibility: compatibilityScore,
        }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(err.message || "Could not send like");
      }
      return res.json() as Promise<{ id: string }>;
    },
    onSuccess: () => {
      if (currentUserId) {
        queryClient.invalidateQueries({ queryKey: [`/api/users/${currentUserId}/matches`] });
        queryClient.invalidateQueries({ queryKey: [`/api/users/${currentUserId}/unrevealed-matches`] });
      }
    },
    onError: (e: Error) => {
      toast({ title: "Like didn’t go through", description: e.message, variant: "destructive" });
    },
  });

  const bumpDeck = () => setDeckNonce((n) => n + 1);

  const handlePass = () => {
    if (!current) return;
    addMarriagePassed(current.id);
    toast({ title: "Passed", description: "We’ll show you someone new." });
    bumpDeck();
  };

  const handleLike = () => {
    if (!current) return;
    const targetId = current.id;
    likeMutation.mutate(targetId, {
      onSuccess: () => {
        addMarriageLiked(targetId);
        toast({
          title: "Liked",
          description: "Saved under Activity → My history → Liked.",
        });
        bumpDeck();
      },
    });
  };

  const handleToggleFavorite = () => {
    if (!current) return;
    const on = toggleMarriageFavorite(current.id);
    setFavRev((r) => r + 1);
    toast({ title: on ? "Favorited" : "Removed from favorites" });
  };

  const handleOpenChat = (initialMessage?: string) => {
    if (!current) return;
    const q = new URLSearchParams({ user: current.id });
    if (initialMessage) q.set("draft", initialMessage);
    setLocation(`/chat?${q.toString()}`);
  };

  if (!currentUserId) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingState message="Loading Matches…" showMascot={true} />
      </div>
    );
  }

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["/api/users"] });
  };

  const favActive =
    !!current && (isMarriageFavorite(current.id) || false);
  void favRev; // re-read favorite flag from store after toggle
  const likedCount = getMarriageLikedIds().size;
  const passedCount = getMarriagePassedIds().size;

  const aiMatchmakerComplete = !!(me as { attractionBlueprint?: unknown } | null | undefined)?.attractionBlueprint;
  const showAiMatchmakerBanner = !meLoading && !!currentUserId && !aiMatchmakerComplete;

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <PageWrapper>
        <div className="min-h-screen bg-[hsl(var(--surface-2))] pb-24">
          <Header
            showSearch={true}
            onSearch={() => window.dispatchEvent(new Event(OPEN_GLOBAL_SEARCH_EVENT))}
            onNotifications={() => setLocation("/notifications")}
            onCreate={() => {
              try {
                sessionStorage.setItem("matchify_open_create_post", JSON.stringify({ groupId: null }));
              } catch {
                /* ignore */
              }
              setLocation("/community");
            }}
            onSettings={() => setLocation("/profile")}
            onLogout={logout}
            title="Matches"
            subtitle="One profile at a time — your deck syncs to Activity"
          />

          <div className="mx-auto max-w-lg space-y-3 px-4 pt-3">
            {showAiMatchmakerBanner ? (
              <div className="flex items-start gap-3 rounded-2xl border border-amber-400/60 bg-amber-50/70 p-4 shadow-2xs backdrop-blur-md dark:border-amber-800/50 dark:bg-amber-950/45">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/55">
                  <AlertCircle className="h-5 w-5 text-amber-700 dark:text-amber-300" aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="mb-0.5 text-sm font-semibold text-amber-950 dark:text-amber-100">
                    Finish AI Matchmaker to see matches
                  </p>
                  <p className="mb-2 text-xs leading-relaxed text-amber-900/85 dark:text-amber-200/90">
                    Complete all 30 questions to unlock full People browse and compatibility scores. Timed AI picks
                    use the <span className="font-semibold">AI Matching</span> tab (Plus).
                  </p>
                  <button
                    type="button"
                    onClick={() => setLocation("/ai-matchmaker/flow-b")}
                    className="flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-2xs"
                  >
                    <Sparkles className="h-3 w-3" aria-hidden />
                    Continue
                    <ArrowRight className="h-3 w-3" aria-hidden />
                  </button>
                </div>
              </div>
            ) : null}
            <div className="space-y-1.5">
              <Button
                type="button"
                variant="outline"
                className="h-11 w-full rounded-2xl border-border/70 bg-card/70 font-semibold text-foreground shadow-2xs"
                onClick={() => setLocation("/directory")}
              >
                <Sparkles className="mr-2 h-4 w-4 text-primary" strokeWidth={1.75} aria-hidden />
                Browse People
              </Button>
              <p className="text-center text-[11px] leading-snug text-muted-foreground px-1">
                Timed AI picks: open <span className="font-semibold text-foreground/90">AI Matching</span> in People
                (Plus).
              </p>
            </div>
          </div>

          <div className="mx-auto max-w-lg">
            {usersLoading || meLoading ? (
              <div className="px-4 py-10">
                <Card className="matchify-surface overflow-hidden border-white/0 bg-card/70">
                  <CardContent className="p-6">
                    <LoadingState message="Finding people for you…" showMascot={true} />
                  </CardContent>
                </Card>
              </div>
            ) : !current ? (
              <div className="px-4 py-8">
                <Card className="matchify-surface overflow-hidden border-white/0 bg-card/70">
                  <CardContent className="p-6 text-center">
                    <p className="font-display text-lg font-bold text-foreground">You’re all caught up</p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      No new profiles right now. Try AI matches, Activity, or check back later.
                    </p>

                    <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                      <span className="rounded-full border border-border/70 bg-card/60 px-3 py-1 text-[12px] font-semibold text-stone-700 tabular-nums">
                        Liked: <span className="font-bold text-primary">{likedCount}</span>
                      </span>
                      <span className="rounded-full border border-border/70 bg-card/60 px-3 py-1 text-[12px] font-semibold text-foreground/90 tabular-nums">
                        Passed: <span className="font-bold text-foreground">{passedCount}</span>
                      </span>
                    </div>

                    <div className="mt-6 grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="h-11 rounded-full border-border/70 bg-card/60 font-semibold text-foreground shadow-2xs hover:bg-card"
                        onClick={() => setLocation("/explore")}
                      >
                        Open Activity
                      </Button>
                      <Button
                        type="button"
                        className="h-11 rounded-full font-semibold shadow-2xs"
                        onClick={() => setLocation("/community")}
                      >
                        Open Explore
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                {import.meta.env.DEV ? (
                  <div className="mx-auto mt-4 max-w-lg rounded-[24px] border border-amber-200/60 bg-amber-50/70 px-4 py-4 text-left shadow-2xs">
                    <p className="text-xs font-bold uppercase tracking-wide text-amber-900/80">Testing only</p>
                    <p className="mt-1 text-xs leading-relaxed text-amber-950/80">
                      Clears pass/like/favorite lists (Matches deck + Activity → My history) and local marriage chat demo
                      keys.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-3 w-full border-amber-300 bg-white font-semibold text-amber-950 shadow-2xs hover:bg-amber-100/80"
                      onClick={() => {
                        resetMarriageTestingState();
                        setMarriageChatEpoch((n) => n + 1);
                        bumpDeck();
                        toast({
                          title: "Testing reset",
                          description: "All profiles can show again; My history and chat demo state cleared.",
                        });
                      }}
                    >
                      Show all profiles again
                    </Button>
                  </div>
                ) : null}
              </div>
            ) : (
              <MarriageDiscoveryProfile
                key={current.id}
                user={current}
                me={me ?? null}
                viewerId={currentUserId}
                messageRequestStatus={messageRequestStatus}
                compatibilityScore={compatibilityScore}
                isFavorite={!!favActive}
                onToggleFavorite={handleToggleFavorite}
                onPass={handlePass}
                onLike={handleLike}
                onShareProfile={() => setShareOpen(true)}
                onBlock={() => {
                  setBlockReportType("block");
                  setBlockOpen(true);
                }}
                onReport={() => {
                  setBlockReportType("report");
                  setBlockOpen(true);
                }}
                onOpenChat={handleOpenChat}
                onMessageRequestSent={() => {
                  if (currentUserId && current?.id) {
                    void queryClient.invalidateQueries({
                      queryKey: chatRequestPairQueryKey(currentUserId, current.id),
                    });
                  }
                }}
              />
            )}
          </div>

          <BottomNav active={activePage} onNavigate={setActivePage} />

          {current ? (
            <>
              <BlockReportDialog
                open={blockOpen}
                onOpenChange={setBlockOpen}
                userId={current.id}
                userName={current.name}
                type={blockReportType}
                onBlocked={() => {
                  addMarriagePassed(current.id);
                  bumpDeck();
                }}
              />
              <ShareProfileDialog
                open={shareOpen}
                onOpenChange={setShareOpen}
                profileId={current.id}
                displayName={current.name}
              />
            </>
          ) : null}
        </div>
      </PageWrapper>
    </PullToRefresh>
  );
}
