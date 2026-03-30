import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import Header from "@/components/common/Header";
import PageWrapper from "@/components/common/PageWrapper";
import BottomNav from "@/components/common/BottomNav";
import { BlockReportDialog } from "@/components/common/BlockReportDialog";
import { ShareProfileDialog } from "@/components/profile/ShareProfileDialog";
import {
  MarriageDiscoveryProfile,
  type MarriageDiscoveryUser,
} from "@/components/marriage/MarriageDiscoveryProfile";
import { Button } from "@/components/ui/button";
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
import { getOutgoingChatRequest } from "@/lib/marriageChatRequests";
import { resetMarriageTestingState } from "@/lib/marriageTestingReset";

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
    const list = (Array.isArray(users) ? users : []).filter(
      (u) => u.id !== currentUserId && !passed.has(u.id) && !liked.has(u.id),
    );
    const scored = list.map((u) => ({ u, score: deckScore(me ?? null, u) }));
    scored.sort((a, b) => b.score - a.score);
    return scored.map((x) => x.u);
  }, [users, currentUserId, me, deckNonce]);

  const current = candidates[0] ?? null;
  void marriageChatEpoch;
  const compatibilityScore =
    current && currentUserId ? hashPairScore(currentUserId, current.id) : 82;
  const outgoing =
    current && currentUserId ? getOutgoingChatRequest(currentUserId, current.id) : null;

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
          description: "Saved under Explore → My history → Liked.",
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

  const handleExploreNextAfterCompliment = () => {
    if (!current) return;
    addMarriagePassed(current.id);
    bumpDeck();
  };

  if (!currentUserId) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingState message="Loading Marriage…" showMascot={true} />
      </div>
    );
  }

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["/api/users"] });
  };

  const favActive =
    !!current && (isMarriageFavorite(current.id) || false);
  void favRev; // re-read favorite flag from store after toggle

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <PageWrapper>
        <div className="min-h-screen bg-gray-50 pb-24">
          <Header
            showSearch={true}
            onSearch={(query) => {
              const q = query.trim();
              if (q) {
                try {
                  sessionStorage.setItem("matchify_explore_search", q);
                } catch {
                  /* ignore */
                }
                setLocation("/explore");
              }
            }}
            onNotifications={() => setLocation("/notifications")}
            onCreate={() => setLocation("/community/create-post")}
            onSettings={() => setLocation("/profile")}
            onLogout={logout}
            title="Marriage"
            subtitle="One profile at a time — your picks sync to Explore"
          />

          <div className="mx-auto max-w-lg">
            {usersLoading || meLoading ? (
              <div className="flex justify-center py-20">
                <LoadingState message="Finding people for you…" showMascot={true} />
              </div>
            ) : !current ? (
              <div className="px-6 py-16 text-center">
                <p className="font-display text-lg font-bold text-stone-900">You’re all caught up</p>
                <p className="mt-2 text-sm text-stone-600">
                  No new profiles right now. Browse Explore to find more people, or check back later.
                </p>
                <Button type="button" className="mt-6 rounded-full" onClick={() => setLocation("/explore")}>
                  Open Explore
                </Button>
                {import.meta.env.DEV ? (
                  <div className="mx-auto mt-8 max-w-sm rounded-2xl border border-amber-200/80 bg-amber-50/90 px-4 py-4 text-left">
                    <p className="text-xs font-bold uppercase tracking-wide text-amber-900/80">Testing only</p>
                    <p className="mt-1 text-xs leading-relaxed text-amber-950/80">
                      Clears pass/like/favorite/compliment lists (Marriage deck + Explore → My history) and marriage
                      chat-request demo data.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-3 w-full border-amber-300 bg-white font-semibold text-amber-950 hover:bg-amber-100/80"
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
                viewerName={me?.name?.trim() || "You"}
                outgoing={outgoing}
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
                onExploreNext={handleExploreNextAfterCompliment}
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
