import { useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import Header from "@/components/common/Header";
import BottomNav from "@/components/common/BottomNav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, UserMinus, Users, Volume2, Ban, Flag, Pencil } from "lucide-react";
import { useCurrentUser } from "@/contexts/UserContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { SETTINGS_SOCIAL_SCROLL_SECTION_KEY } from "@/lib/settingsSocialNav";
import { apiRequestJson } from "@/services/api";
import {
  isGenericReportAuthorLabel,
  mergeReportedPostsIntoLists,
  removePostReport,
  setAuthorMuted,
  setUserBlocked,
} from "@/lib/socialPreferencesService";

const CONNECTIONS_PREVIEW = 3;

type SocialLists = {
  following: { userId: string; name: string; avatar?: string | null; createdAt: string }[];
  followers: { userId: string; name: string; avatar?: string | null; createdAt: string }[];
  muted: { authorId: string; name: string; avatar?: string | null; createdAt: string }[];
  blocked: { userId: string; blockedUserId?: string; name: string; avatar?: string | null; createdAt: string }[];
  reportedPosts?: {
    postId: string;
    authorId?: string;
    reason?: string;
    details?: string;
    createdAt: string;
    authorName?: string;
    authorAvatar?: string | null;
    preview?: string | null;
  }[];
};

export default function SettingsSocial() {
  const [, setLocation] = useLocation();
  const { userId } = useCurrentUser();
  const { logout } = useAuth();
  const { toast } = useToast();

  const { data: lists, isLoading: listsLoading } = useQuery({
    queryKey: ["/api/users", userId, "social-feed-lists"],
    queryFn: async () => {
      if (!userId) throw new Error("Not signed in");
      const raw = await apiRequestJson<SocialLists>("GET", `/api/users/${userId}/social/lists`);
      return mergeReportedPostsIntoLists(userId, raw);
    },
    enabled: !!userId,
  });

  const invalidateAll = () => {
    if (!userId) return;
    void queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
    void queryClient.invalidateQueries({ queryKey: ["/api/users", userId, "social-summary"] });
    void queryClient.invalidateQueries({ queryKey: ["/api/users", userId, "social-feed-lists"] });
    void queryClient.invalidateQueries({ queryKey: ["/api/users", userId, "social-saved-posts"] });
    void queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/blocked`] });
  };

  const unfollowMutation = useMutation({
    mutationFn: (targetUserId: string) =>
      apiRequest("DELETE", `/api/users/${userId}/social/follow/${encodeURIComponent(targetUserId)}`),
    onSuccess: () => {
      invalidateAll();
      toast({ title: "Unfollowed" });
    },
    onError: () => toast({ title: "Couldn’t unfollow", variant: "destructive" }),
  });

  const unmuteMutation = useMutation({
    mutationFn: async (authorId: string) => {
      if (!userId) throw new Error("Not signed in");
      const res = await apiRequest(
        "DELETE",
        `/api/users/${userId}/social/mute/${encodeURIComponent(authorId)}`,
      );
      if (!res.ok) throw new Error("Unmute failed");
      try {
        await setAuthorMuted(userId, authorId, false);
      } catch {
        /* ignore */
      }
    },
    onSuccess: () => {
      invalidateAll();
      toast({ title: "Unmuted" });
    },
    onError: () => toast({ title: "Couldn’t unmute", variant: "destructive" }),
  });

  const unblockMutation = useMutation({
    mutationFn: (blockedUserId: string) =>
      apiRequest("DELETE", `/api/users/${userId}/blocks/${encodeURIComponent(blockedUserId)}`),
    onSuccess: async (_data, blockedUserId) => {
      if (userId) {
        try {
          await setUserBlocked(userId, blockedUserId, false);
        } catch {
          /* ignore */
        }
      }
      invalidateAll();
      toast({ title: "Unblocked" });
    },
    onError: () => toast({ title: "Couldn’t unblock", variant: "destructive" }),
  });

  const unreportPostMutation = useMutation({
    mutationFn: async (postId: string) => {
      if (!userId) throw new Error("Not signed in");
      const res = await apiRequest(
        "DELETE",
        `/api/users/${userId}/social/report-post/${encodeURIComponent(postId)}`,
      );
      if (!res.ok) throw new Error("Unreport failed");
      try {
        await removePostReport(userId, postId);
      } catch {
        /* ignore */
      }
    },
    onSuccess: () => {
      invalidateAll();
      toast({ title: "Post visible again", description: "This post can show in your feed." });
    },
    onError: () => toast({ title: "Couldn’t update report", variant: "destructive" }),
  });

  useEffect(() => {
    if (listsLoading) return;
    let section: string | null = null;
    try {
      section = sessionStorage.getItem(SETTINGS_SOCIAL_SCROLL_SECTION_KEY);
      if (section) sessionStorage.removeItem(SETTINGS_SOCIAL_SCROLL_SECTION_KEY);
    } catch {
      /* ignore */
    }
    if (!section) return;
    const t = window.setTimeout(() => {
      document.getElementById(`social-section-${section}`)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
    return () => window.clearTimeout(t);
  }, [listsLoading]);

  if (!userId) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--surface-2))] pb-24">
      <Header showSearch={false} onLogout={logout} title="Feed preferences" />
      <div className="mx-auto mt-2 max-w-lg space-y-3 px-3">
        <Card className="matchify-surface scroll-mt-24 overflow-hidden border-white/0 bg-card/70">
          <CardHeader className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Pencil className="h-5 w-5 text-primary" />
              <CardTitle>Profile &amp; photos</CardTitle>
            </div>
            <CardDescription>
              Edit your display name, username, short bio, main photo, and gallery — the same fields used on your social
              profile.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              type="button"
              className="h-11 w-full rounded-2xl font-semibold"
              onClick={() => setLocation("/profile/social/edit")}
            >
              Open profile editor
            </Button>
          </CardContent>
        </Card>

        <Card
          id="social-section-followers"
          className="matchify-surface scroll-mt-24 overflow-hidden border-white/0 bg-card/70"
        >
          <CardHeader className="flex flex-col gap-3 space-y-0 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <CardTitle>Followers</CardTitle>
              </div>
              <CardDescription>
                People who follow you (stored in this browser). Someone only appears here after they follow you from this app
                on the same device.
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={listsLoading || (lists?.followers?.length ?? 0) === 0}
              className="h-9 shrink-0 self-start rounded-full font-semibold text-primary hover:bg-primary/10 hover:text-primary disabled:opacity-50"
              onClick={() => setLocation("/settings/social/connections?tab=followers")}
            >
              View all
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {listsLoading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : !lists?.followers?.length ? (
              <p className="rounded-2xl border border-dashed border-stone-200 bg-stone-50/80 px-4 py-8 text-center text-sm text-muted-foreground">
                No followers yet.
              </p>
            ) : (
              lists.followers.slice(0, CONNECTIONS_PREVIEW).map((u) => (
                <div
                  key={u.userId}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-border/70 bg-card/60 p-3 shadow-2xs"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <Avatar className="h-10 w-10 shrink-0 border border-stone-200">
                      <AvatarImage src={u.avatar?.trim() || undefined} alt="" className="object-cover" />
                      <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">
                        {u.name?.slice(0, 2).toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="truncate text-sm font-medium">{u.name}</span>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="shrink-0 rounded-full text-muted-foreground hover:bg-slate-900/[0.03]"
                    onClick={() => setLocation(`/profile/${encodeURIComponent(u.userId)}`)}
                  >
                    View
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card
          id="social-section-following"
          className="matchify-surface scroll-mt-24 overflow-hidden border-white/0 bg-card/70"
        >
          <CardHeader className="flex flex-col gap-3 space-y-0 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <UserMinus className="h-5 w-5 text-primary" />
                <CardTitle>Following</CardTitle>
              </div>
              <CardDescription>
                People you follow in the feed. Unfollow to stop prioritizing them in Following.
              </CardDescription>
            </div>
            {(lists?.following?.length ?? 0) > 0 ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-9 shrink-0 self-start rounded-full font-semibold text-primary hover:bg-primary/10 hover:text-primary"
                onClick={() => setLocation("/settings/social/connections?tab=following")}
              >
                View all
              </Button>
            ) : null}
          </CardHeader>
          <CardContent className="space-y-2">
            {listsLoading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : !lists?.following?.length ? (
              <p className="rounded-2xl border border-dashed border-stone-200 bg-stone-50/80 px-4 py-8 text-center text-sm text-muted-foreground">
                You’re not following anyone yet.
              </p>
            ) : (
              lists.following.slice(0, CONNECTIONS_PREVIEW).map((u) => (
                <div
                  key={u.userId}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-border/70 bg-card/60 p-3 shadow-2xs"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <Avatar className="h-10 w-10 shrink-0 border border-stone-200">
                      <AvatarImage src={u.avatar?.trim() || undefined} alt="" className="object-cover" />
                      <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">
                        {u.name?.slice(0, 2).toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="truncate text-sm font-medium">{u.name}</span>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={unfollowMutation.isPending}
                    className="rounded-full border-stone-200"
                    onClick={() => unfollowMutation.mutate(u.userId)}
                  >
                    Unfollow
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card
          id="social-section-muted"
          className="matchify-surface scroll-mt-24 overflow-hidden border-white/0 bg-card/70"
        >
          <CardHeader>
            <div className="flex items-center gap-2">
              <Volume2 className="h-5 w-5 text-primary" />
              <CardTitle>Muted authors</CardTitle>
            </div>
            <CardDescription>Their posts stay hidden until you unmute.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {listsLoading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : !lists?.muted?.length ? (
              <p className="rounded-2xl border border-dashed border-stone-200 bg-stone-50/80 px-4 py-8 text-center text-sm text-muted-foreground">
                No muted authors.
              </p>
            ) : (
              lists.muted.map((u) => (
                <div
                  key={u.authorId}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-border/70 bg-card/60 p-3 shadow-2xs"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <Avatar className="h-10 w-10 shrink-0 border border-stone-200">
                      <AvatarImage src={u.avatar?.trim() || undefined} alt="" className="object-cover" />
                      <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">
                        {(u.name?.trim() || u.authorId).slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="truncate text-sm font-medium">
                      {u.name?.trim() || `User ${u.authorId.length > 8 ? `${u.authorId.slice(0, 8)}…` : u.authorId}`}
                    </span>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={unmuteMutation.isPending}
                    className="rounded-full border-border/70 bg-card/60 shadow-2xs hover:bg-card"
                    onClick={() => unmuteMutation.mutate(u.authorId)}
                  >
                    Unmute
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card
          id="social-section-reported"
          className="matchify-surface scroll-mt-24 overflow-hidden border-white/0 bg-card/70"
        >
          <CardHeader>
            <div className="flex items-center gap-2">
              <Flag className="h-5 w-5 text-amber-600" />
              <CardTitle>Reported posts</CardTitle>
            </div>
            <CardDescription>
              Posts you reported stay hidden until you remove them from this list (stored in this browser / social
              layer).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {listsLoading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : !(lists?.reportedPosts && lists.reportedPosts.length > 0) ? (
              <p className="rounded-2xl border border-dashed border-stone-200 bg-stone-50/80 px-4 py-8 text-center text-sm text-muted-foreground">
                No reported posts.
              </p>
            ) : (
              lists.reportedPosts!.map((row) => {
                const hasRealName = row.authorName?.trim() && !isGenericReportAuthorLabel(row.authorName);
                const displayName = hasRealName
                  ? row.authorName!.trim()
                  : row.authorId
                    ? `Member · ${row.authorId.length > 10 ? `${row.authorId.slice(0, 8)}…` : row.authorId}`
                    : "Unknown author";
                const fallbackInitials = row.authorId
                  ? row.authorId.replace(/-/g, "").slice(0, 2).toUpperCase()
                  : "?";
                const avatarInitials = hasRealName
                  ? row.authorName!.trim().slice(0, 2).toUpperCase()
                  : fallbackInitials;
                return (
                <div
                  key={row.postId}
                  className="flex flex-col gap-2 rounded-2xl border border-border/70 bg-card/60 p-3 shadow-2xs sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 flex-1 gap-3">
                    <Avatar className="h-10 w-10 shrink-0 border border-stone-200">
                      <AvatarImage src={row.authorAvatar?.trim() || undefined} alt="" className="object-cover" />
                      <AvatarFallback className="bg-amber-100 text-xs font-bold text-amber-800">
                        {avatarInitials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium" title={row.authorId}>
                        {displayName}
                      </p>
                      {row.reason ? (
                        <p className="text-xs text-muted-foreground">Reason: {row.reason}</p>
                      ) : null}
                      {row.preview ? (
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{row.preview}</p>
                      ) : null}
                    </div>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={unreportPostMutation.isPending}
                    className="shrink-0 rounded-full border-stone-200"
                    onClick={() => unreportPostMutation.mutate(row.postId)}
                  >
                    Show in feed
                  </Button>
                </div>
              );
              })
            )}
          </CardContent>
        </Card>

        <Card
          id="social-section-blocked"
          className="matchify-surface scroll-mt-24 overflow-hidden border-white/0 bg-card/70"
        >
          <CardHeader>
            <div className="flex items-center gap-2">
              <Ban className="h-5 w-5 text-destructive" />
              <CardTitle>Blocked users</CardTitle>
            </div>
            <CardDescription>Blocked from the post ⋯ menu. Tap Unblock here to see their posts again.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {listsLoading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : !lists?.blocked?.length ? (
              <p className="rounded-2xl border border-dashed border-stone-200 bg-stone-50/80 px-4 py-8 text-center text-sm text-muted-foreground">
                No blocked users.
              </p>
            ) : (
              lists.blocked.map((u) => (
                <div
                  key={u.userId}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-border/70 bg-card/60 p-3 shadow-2xs"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <Avatar className="h-10 w-10 shrink-0 border border-stone-200">
                      <AvatarImage src={u.avatar?.trim() || undefined} alt="" className="object-cover" />
                      <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">
                        {u.name?.slice(0, 2).toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="truncate text-sm font-medium">{u.name}</span>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={unblockMutation.isPending}
                    className="rounded-full border-stone-200"
                    onClick={() => unblockMutation.mutate(u.userId)}
                  >
                    Unblock
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <p className="px-1 pb-4 text-xs leading-relaxed text-muted-foreground">
          Preferences are stored in your browser&apos;s IndexedDB (Dexie) when no API server is configured — not in
          localStorage. With a live backend, the same routes should persist to your database.
        </p>
      </div>
      <BottomNav active="menu" />
    </div>
  );
}
