import { useMemo, useState, useCallback } from "react";
import { useRoute, useLocation } from "wouter";
import { useQueries, useQuery, useMutation, useInfiniteQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowLeft, Users, MessageCircle, Heart, Pencil, MapPin, Calendar } from "lucide-react";
import BottomNav from "@/components/common/BottomNav";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoadingState } from "@/components/common/LoadingState";
import type { Group, Post } from "@shared/schema";
import PostCard from "@/components/posts/PostCard";
import { fetchPostsFeedPage, POSTS_FEED_PAGE_SIZE } from "@/lib/fetchPostsFeed";
import { postsFeedQueryOptions } from "@/lib/queryPersist";
import { postDisplayImageUrl } from "@/lib/postImage";
import { useCurrentUser } from "@/contexts/UserContext";
import { useUpgrade } from "@/contexts/UpgradeContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { requestChatWithUser } from "@/lib/requestChatWithUser";
import { chatRequestPairQueryKey, fetchChatRequestPair } from "@/lib/chatRequestsApi";
import { isFeedMockMode } from "@/lib/feedMockMode";
import { setMockPostLiked } from "@/lib/mockLikesStore";
import { fetchPostComments, postCommentsQueryKey, type PostCommentRow } from "@/lib/postCommentsApi";
import { useSocialSummaryQuery } from "@/hooks/useSocialSummary";
import { apiRequestJson } from "@/services/api";
import { splitLocation, membershipBadgeLabel } from "@/lib/profileLabels";
import { cn } from "@/lib/utils";
import type { SocialSummary } from "@/lib/socialPreferencesService";

function patchViewerFollowingInCache(viewerId: string, targetUserId: string, following: boolean) {
  queryClient.setQueryData<SocialSummary>(["/api/users", viewerId, "social-summary"], (old) => {
    if (!old) return old;
    const set = new Set(old.followingIds ?? []);
    if (following) set.add(targetUserId);
    else set.delete(targetUserId);
    return {
      ...old,
      followingIds: Array.from(set),
      followingCount: set.size,
    };
  });
}

function patchViewedFollowerCountCache(viewedUserId: string, delta: number) {
  queryClient.setQueryData<SocialSummary>(
    ["/api/users", viewedUserId, "social-summary-viewed"],
    (old) => {
      if (!old) return old;
      const n = Math.max(0, (old.followerCount ?? 0) + delta);
      return { ...old, followerCount: n };
    },
  );
}

type MeUser = {
  id: string;
  name: string;
  username: string;
  avatar?: string | null;
  bio?: string | null;
  verified?: boolean | null;
  location?: string | null;
  createdAt?: string | null;
};

type GroupRow = Group & { memberCount?: number };

function normalizeAuthorPreview(raw: unknown): { name: string; avatar?: string | null; verified?: boolean } {
  if (raw && typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    return {
      name: typeof o.name === "string" ? o.name : "Member",
      avatar: typeof o.avatar === "string" ? o.avatar : null,
      verified: typeof o.verified === "boolean" ? o.verified : undefined,
    };
  }
  return { name: "Member" };
}

export default function SocialUserProfile() {
  const [, params] = useRoute("/profile/social/user/:id");
  const viewedUserIdRaw = params?.id ? decodeURIComponent(params.id) : "";
  const viewedUserId = String(viewedUserIdRaw).trim();
  const [, setLocation] = useLocation();
  const { userId: currentUserId } = useCurrentUser();
  const { openUpgrade } = useUpgrade();
  const { toast } = useToast();
  const [tab, setTab] = useState<"posts" | "comments" | "likes" | "groups">("posts");

  const goBack = useCallback(() => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      window.history.back();
      return;
    }
    setLocation("/community");
  }, [setLocation]);

  const { data: user, isLoading: userLoading } = useQuery<MeUser>({
    queryKey: [`/api/users/${viewedUserId}`],
    enabled: !!viewedUserId,
  });

  const { data: socialSummary } = useSocialSummaryQuery();
  const followingIds = useMemo(() => new Set(socialSummary?.followingIds ?? []), [socialSummary?.followingIds]);
  const blockedIds = useMemo(() => new Set(socialSummary?.blockedUserIds ?? []), [socialSummary?.blockedUserIds]);
  const isMe = !!currentUserId && !!viewedUserId && String(currentUserId) === String(viewedUserId);

  const { data: chatPair } = useQuery({
    queryKey: chatRequestPairQueryKey(currentUserId ?? "", viewedUserId),
    queryFn: () => fetchChatRequestPair(currentUserId!, viewedUserId),
    enabled: !!currentUserId && !!viewedUserId && !isMe,
  });
  const iBlockedThem = !isMe && !!viewedUserId && blockedIds.has(viewedUserId);
  const isFollowing = !isMe && !!viewedUserId && followingIds.has(viewedUserId);

  const { data: viewerMemberships = [] } = useQuery({
    queryKey: ["/api/users", currentUserId, "memberships"],
    enabled: !!currentUserId && !!viewedUserId,
  });

  const viewerMembershipIds = useMemo(() => {
    if (!Array.isArray(viewerMemberships)) return new Set<string>();
    return new Set(
      viewerMemberships
        .map((m: { groupId?: string }) => m.groupId)
        .filter((id): id is string => typeof id === "string" && id.length > 0),
    );
  }, [viewerMemberships]);

  const viewerGroupsKey = useMemo(
    () => Array.from(viewerMembershipIds).sort((a, b) => a.localeCompare(b)).join(","),
    [viewerMembershipIds],
  );

  const authoredInfinite = useInfiniteQuery({
    ...postsFeedQueryOptions,
    queryKey: [
      "/api/posts",
      { viewer: currentUserId ?? "", scope: "author", author: viewedUserId },
    ],
    queryFn: async ({ pageParam }) => {
      const offset = typeof pageParam === "number" ? pageParam : 0;
      return fetchPostsFeedPage({
        limit: POSTS_FEED_PAGE_SIZE,
        offset,
        authorId: viewedUserId,
      }) as Promise<Post[]>;
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, _pages, lastOffset) => {
      if (!Array.isArray(lastPage) || lastPage.length < POSTS_FEED_PAGE_SIZE) return undefined;
      return lastOffset + POSTS_FEED_PAGE_SIZE;
    },
    enabled: !!currentUserId && !!viewedUserId,
  });

  const allPosts = useMemo(
    () => authoredInfinite.data?.pages.flat() ?? [],
    [authoredInfinite.data],
  );

  const postsLoading = authoredInfinite.isPending;

  const userPosts = useMemo(() => {
    const vid = String(viewedUserId).trim();
    return allPosts.filter(
      (p) => String((p as Post & { userId?: string }).userId || "").trim() === vid,
    );
  }, [allPosts, viewedUserId]);

  const { data: commentScanPosts = [] } = useQuery({
    queryKey: [
      "/api/posts",
      { viewer: currentUserId ?? "", scope: "userprof-comment-scan", g: viewerGroupsKey },
    ],
    queryFn: () =>
      fetchPostsFeedPage({
        limit: 40,
        offset: 0,
        inGroups: Array.from(viewerMembershipIds),
      }) as Promise<Post[]>,
    enabled: !!currentUserId && !!viewedUserId && viewerMembershipIds.size > 0,
  });

  const { data: likedFeedData } = useQuery({
    queryKey: [`/api/users/${viewedUserId}/social/liked-posts`],
    queryFn: () =>
      apiRequestJson<{
        items: Array<{
          postId: string;
          likedAt: string;
          preview: { content: string; author: unknown; image?: string | null } | null;
        }>;
      }>("GET", `/api/users/${encodeURIComponent(viewedUserId)}/social/liked-posts`),
    enabled: !!viewedUserId,
  });

  const likedPostsDisplay = useMemo(() => {
    const items = likedFeedData?.items;
    if (!Array.isArray(items) || !items.length) return [] as Post[];
    const byId = new Map(allPosts.map((p) => [p.id, p]));
    const out: Post[] = [];
    for (const row of items) {
      const full = byId.get(row.postId);
      if (full) {
        out.push(full);
        continue;
      }
      if (row.preview) {
        const au = normalizeAuthorPreview(row.preview.author);
        out.push({
          id: row.postId,
          userId: "",
          content: row.preview.content || "",
          imageUrl: row.preview.image || undefined,
          image: row.preview.image || undefined,
          createdAt: row.likedAt,
          likesCount: 0,
          commentsCount: 0,
          user: { name: au.name, avatar: au.avatar || undefined, verified: au.verified },
        } as unknown as Post);
      }
    }
    return out;
  }, [likedFeedData, allPosts]);

  const postsForCommentLookup = useMemo(
    () => (Array.isArray(commentScanPosts) ? commentScanPosts : []).slice(0, 48),
    [commentScanPosts],
  );
  const commentQueries = useQueries({
    queries: postsForCommentLookup.map((post) => ({
      queryKey: postCommentsQueryKey(post.id),
      queryFn: () => fetchPostComments(post.id),
      enabled: !!viewedUserId && !!post.id,
      staleTime: 20_000,
    })),
  });
  const commentResults = commentQueries.map((q) => q.data);
  const commentActivity = useMemo(() => {
    if (!viewedUserId) return [] as Array<{ post: Post; comment: PostCommentRow }>;
    const out: Array<{ post: Post; comment: PostCommentRow }> = [];
    postsForCommentLookup.forEach((post, i) => {
      const data = commentResults[i];
      if (!Array.isArray(data)) return;
      for (const c of data) {
        if (c.userId === viewedUserId) out.push({ post, comment: c });
      }
    });
    return out.sort((a, b) => new Date(b.comment.createdAt).getTime() - new Date(a.comment.createdAt).getTime());
  }, [viewedUserId, postsForCommentLookup, commentResults]);

  const { data: memberships = [] } = useQuery({
    queryKey: ["/api/users", viewedUserId, "memberships"],
    enabled: !!viewedUserId,
  });
  const { data: groups = [] } = useQuery<GroupRow[]>({ queryKey: ["/api/groups"], enabled: !!viewedUserId });
  const groupNameById = useMemo(() => {
    const m = new Map<string, string>();
    for (const g of Array.isArray(groups) ? groups : []) m.set(g.id, g.name);
    return m;
  }, [groups]);
  const memberGroupIds = useMemo(() => {
    if (!Array.isArray(memberships)) return new Set<string>();
    return new Set(
      memberships.map((m: { groupId?: string }) => m.groupId).filter((id): id is string => typeof id === "string"),
    );
  }, [memberships]);
  const memberGroups = useMemo(() => (Array.isArray(groups) ? groups : []).filter((g) => memberGroupIds.has(g.id)), [
    groups,
    memberGroupIds,
  ]);

  const likeMutation = useMutation({
    mutationFn: async ({ postId, like }: { postId: string; like: boolean }) => {
      if (!currentUserId) throw new Error("Not signed in");
      if (isFeedMockMode()) {
        setMockPostLiked(currentUserId, postId, like);
        return;
      }
      if (like) return apiRequest("POST", "/api/likes", { userId: currentUserId, postId });
      const uid = encodeURIComponent(currentUserId);
      const pid = encodeURIComponent(postId);
      return apiRequest("DELETE", `/api/likes/${uid}/${pid}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/posts"] }),
    onError: () => toast({ title: "Could not update like", variant: "destructive" }),
  });

  const { data: viewedSummary } = useQuery<SocialSummary>({
    queryKey: ["/api/users", viewedUserId, "social-summary-viewed"],
    queryFn: () => apiRequestJson<SocialSummary>("GET", `/api/users/${encodeURIComponent(viewedUserId)}/social/summary`),
    enabled: !!viewedUserId,
  });

  const followMutation = useMutation({
    mutationFn: async ({ follow }: { follow: boolean }) => {
      if (!currentUserId) throw new Error("Not signed in");
      const uid = encodeURIComponent(currentUserId);
      const targetUserId = viewedUserId;
      if (!targetUserId) throw new Error("No user selected");
      if (follow) {
        const res = await apiRequest("POST", `/api/users/${uid}/social/follow`, { targetUserId });
        if (!res.ok) throw new Error("Failed to follow");
        return { following: true };
      }
      const res = await apiRequest(
        "DELETE",
        `/api/users/${uid}/social/follow/${encodeURIComponent(targetUserId)}`,
      );
      if (!res.ok) throw new Error("Failed to unfollow");
      return { following: false };
    },
    onSuccess: (_d, { follow }) => {
      if (currentUserId && viewedUserId) {
        patchViewerFollowingInCache(currentUserId, viewedUserId, follow);
        patchViewedFollowerCountCache(viewedUserId, follow ? 1 : -1);
      }
      void queryClient.invalidateQueries({ queryKey: ["/api/users", currentUserId, "social-summary"] });
      void queryClient.invalidateQueries({ queryKey: ["/api/users", viewedUserId, "social-summary-viewed"] });
      void queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      void queryClient.invalidateQueries({ queryKey: ["/api/users", currentUserId, "social-feed-lists"] });
    },
    onError: () => toast({ title: "Could not update follow", variant: "destructive" }),
  });

  if (!viewedUserId) return null;
  if (userLoading || !user) {
    return (
      <div className="min-h-screen bg-[hsl(var(--surface-2))] flex items-center justify-center pb-24">
        <LoadingState message="Loading profile…" showMascot />
      </div>
    );
  }

  if (iBlockedThem) {
    return (
      <div className="min-h-screen bg-[hsl(var(--surface-2))] pb-28">
        <div className="sticky top-0 z-40 border-b border-border/70 bg-card/80 shadow-2xs backdrop-blur-xl safe-top">
          <div className="mx-auto flex max-w-lg items-center gap-2 px-3 py-2 pt-[max(0.5rem,env(safe-area-inset-top))]">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-11 w-11 shrink-0 rounded-full text-foreground hover:bg-muted/60"
              onClick={goBack}
              aria-label="Back"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="truncate font-display text-[15px] font-bold text-foreground">Profile</h1>
          </div>
        </div>
        <div className="mx-auto max-w-lg px-3 pt-6">
          <div className="matchify-surface p-8 text-center">
            <p className="font-display text-lg font-semibold text-foreground">You&apos;ve blocked this account</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Their profile stays hidden until you unblock them in Settings → Feed preferences.
            </p>
            <Button type="button" className="mt-6 rounded-full" onClick={goBack}>
              Go back
            </Button>
          </div>
        </div>
        <BottomNav active="community" onNavigate={() => {}} />
      </div>
    );
  }

  const followerCount = viewedSummary?.followerCount ?? 0;
  const followingCount =
    viewedSummary?.followingCount ?? viewedSummary?.followingIds?.length ?? 0;
  const { country } = splitLocation(user.location ?? null);
  const joinedLabel = (() => {
    if (!user.createdAt) return "Member";
    const d = new Date(user.createdAt);
    if (Number.isNaN(d.getTime())) return membershipBadgeLabel(user.createdAt);
    return `Joined ${d.toLocaleDateString(undefined, { month: "short", year: "numeric" })}`;
  })();

  return (
    <div className="min-h-screen bg-[hsl(var(--surface-2))] pb-28">
      <div className="sticky top-0 z-40 border-b border-border/70 bg-card/80 shadow-2xs backdrop-blur-xl safe-top">
        <div className="mx-auto flex max-w-lg items-center gap-2 px-3 py-2 pt-[max(0.5rem,env(safe-area-inset-top))]">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-11 w-11 shrink-0 rounded-full text-foreground hover:bg-muted/60"
            onClick={goBack}
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="truncate font-display text-[15px] font-bold text-foreground">{user.name}</h1>
        </div>
      </div>

      <div className="mx-auto w-full max-w-lg px-3 pt-2">
        <div className="matchify-surface p-5">
          <div className="flex items-start gap-4">
            <Avatar className="h-20 w-20 shrink-0 border-[3px] border-background shadow-[0_10px_30px_-18px_rgba(15,23,42,0.28)] ring-1 ring-black/[0.04]">
              <AvatarImage src={user.avatar || undefined} alt="" className="object-cover" />
              <AvatarFallback className="bg-gradient-to-br from-primary/15 to-primary/5 text-xl font-semibold text-primary">
                {user.name?.slice(0, 2).toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-display text-[18px] font-bold leading-tight text-foreground">
                    {user.name}
                  </p>
                  <p className="mt-1 truncate text-[13px] font-medium text-muted-foreground">@{user.username}</p>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="rounded-[18px] border border-border/70 bg-card/60 px-3 py-2 text-center shadow-2xs">
                  <p className="text-[15px] font-bold tabular-nums leading-none text-foreground">
                    {String(followerCount)}
                  </p>
                  <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Followers
                  </p>
                </div>
                <div className="rounded-[18px] border border-border/70 bg-card/60 px-3 py-2 text-center shadow-2xs">
                  <p className="text-[15px] font-bold tabular-nums leading-none text-foreground">
                    {String(followingCount)}
                  </p>
                  <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Following
                  </p>
                </div>
              </div>

              {country ? (
                <p className="mt-3 flex items-start gap-1.5 text-sm font-medium text-muted-foreground">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/70" strokeWidth={1.75} aria-hidden />
                  <span className="leading-snug">{country}</span>
                </p>
              ) : null}
              <p className="mt-1 flex items-start gap-1.5 text-xs text-muted-foreground">
                <Calendar className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-80" strokeWidth={1.75} aria-hidden />
                <span className="leading-snug">{joinedLabel}</span>
              </p>

              <p className="mt-3 text-[14px] leading-relaxed text-foreground/90">
                {user.bio?.trim() || "No bio yet."}
              </p>

              {isMe ? (
                <Button
                  className="mt-4 h-11 w-full rounded-full text-[13px] font-semibold"
                  onClick={() => setLocation("/profile/social/edit")}
                >
                  <Pencil className="mr-2 h-4 w-4" strokeWidth={1.75} aria-hidden />
                  Edit profile
                </Button>
              ) : (
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "h-11 w-full rounded-full font-semibold",
                      chatPair?.outgoingStatus === "pending" &&
                        "border-primary/35 bg-primary/5 text-primary hover:bg-primary/10",
                      chatPair?.outgoingStatus === "accepted" &&
                        "border-transparent bg-primary text-primary-foreground hover:bg-primary/90",
                      (chatPair?.outgoingStatus === "none" || chatPair?.outgoingStatus === "declined") &&
                        "border-border bg-background text-foreground",
                    )}
                    disabled={chatPair?.outgoingStatus === "pending"}
                    onClick={() => {
                      const o = chatPair?.outgoingStatus ?? "none";
                      if (o === "accepted") {
                        setLocation(`/chat?user=${encodeURIComponent(viewedUserId)}`);
                        return;
                      }
                      if (o === "pending") return;
                      void requestChatWithUser({
                        fromUserId: currentUserId,
                        toUserId: viewedUserId,
                        setLocation,
                        toast,
                        openUpgrade,
                      });
                    }}
                  >
                    <MessageCircle className="mr-2 h-4 w-4" strokeWidth={1.75} aria-hidden />
                    {chatPair?.outgoingStatus === "pending"
                      ? "Request sent"
                      : chatPair?.outgoingStatus === "accepted"
                        ? "Chat"
                        : "Message"}
                  </Button>
                  <Button
                    type="button"
                    className="h-11 w-full rounded-full text-[13px] font-semibold"
                    disabled={followMutation.isPending}
                    onClick={() => followMutation.mutate({ follow: !isFollowing })}
                  >
                    {isFollowing ? "Following" : "Follow"}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4">
          <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="w-full">
            <TabsList className="flex h-auto w-full gap-1 overflow-x-auto rounded-full border border-border/60 bg-muted/50 p-1.5 shadow-inner scrollbar-hide dark:bg-muted/35">
              <TabsTrigger value="posts" className="shrink-0 rounded-full px-3 py-2.5 text-[11px] font-semibold text-muted-foreground transition-all duration-200 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm data-[state=inactive]:hover:bg-muted/80 data-[state=inactive]:hover:text-foreground">
                Posts
              </TabsTrigger>
              <TabsTrigger value="comments" className="shrink-0 rounded-full px-3 py-2.5 text-[11px] font-semibold text-muted-foreground transition-all duration-200 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm data-[state=inactive]:hover:bg-muted/80 data-[state=inactive]:hover:text-foreground">
                Comments
              </TabsTrigger>
              <TabsTrigger value="likes" className="shrink-0 rounded-full px-3 py-2.5 text-[11px] font-semibold text-muted-foreground transition-all duration-200 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm data-[state=inactive]:hover:bg-muted/80 data-[state=inactive]:hover:text-foreground">
                Likes
              </TabsTrigger>
              <TabsTrigger value="groups" className="shrink-0 rounded-full px-3 py-2.5 text-[11px] font-semibold text-muted-foreground transition-all duration-200 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm data-[state=inactive]:hover:bg-muted/80 data-[state=inactive]:hover:text-foreground">
                Groups
              </TabsTrigger>
            </TabsList>

            <TabsContent value="posts" className="mt-5 px-1 data-[state=inactive]:hidden">
              {postsLoading ? (
                <LoadingState message="Loading posts…" showMascot />
              ) : userPosts.length === 0 ? (
                <div className="rounded-3xl border border-border bg-card px-6 py-14 text-center shadow-sm">
                  <Users className="mx-auto h-7 w-7 text-primary/60" strokeWidth={1.75} />
                  <p className="mt-3 font-display text-base font-bold text-foreground">No posts yet</p>
                  <p className="mt-2 text-sm text-muted-foreground">When they post, it’ll show up here.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {userPosts.map((post) => {
                    const p = post as any;
                    const u = p.user ?? p.author;
                    const gid = (p as Post & { groupId?: string }).groupId;
                    return (
                      <PostCard
                        key={post.id}
                        id={post.id}
                        authorId={p.userId}
                        author={{
                          name: u?.name || user.name,
                          image: u?.avatar || user.avatar || undefined,
                          verified: u?.verified ?? user.verified ?? undefined,
                        }}
                        content={post.content}
                        image={postDisplayImageUrl(p)}
                        detailHref={`/community/post/${encodeURIComponent(post.id)}`}
                        likes={Number(p.likes ?? p.likesCount) || 0}
                        comments={Number(p.comments ?? p.commentsCount) || 0}
                        likedByMe={!!p.likedByMe}
                        visibility={(p as { visibility?: "public" | "private" }).visibility ?? "public"}
                        savedByMe={!!p.savedByMe}
                        isFollowingAuthor={followingIds.has(String(p.userId || "").trim())}
                        firstComment={p.firstComment ?? null}
                        groupId={gid}
                        groupName={gid ? groupNameById.get(gid) : undefined}
                        onLikeToggle={(postId, liked) => likeMutation.mutate({ postId, like: liked })}
                        timestamp={String(p.createdAt || "")}
                        postedAt={String(p.createdAt || "")}
                      />
                    );
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="comments" className="mt-5 px-1 data-[state=inactive]:hidden">
              {commentActivity.length === 0 ? (
                <div className="rounded-3xl border border-border bg-card px-6 py-14 text-center shadow-sm">
                  <MessageCircle className="mx-auto h-7 w-7 text-primary/60" strokeWidth={1.75} />
                  <p className="mt-3 font-display text-base font-bold text-foreground">No comments yet</p>
                  <p className="mt-2 text-sm text-muted-foreground">No recent public comments found.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {commentActivity.slice(0, 30).map(({ post, comment }) => (
                    <button
                      key={`${post.id}-${comment.id}`}
                      type="button"
                      onClick={() => setLocation(`/community/post/${encodeURIComponent(post.id)}`)}
                      className="w-full rounded-[24px] border border-border bg-card p-4 text-left shadow-sm"
                    >
                      <p className="text-xs font-semibold text-muted-foreground">Comment</p>
                      <p className="mt-1 text-sm font-medium text-foreground">{comment.content}</p>
                      <p className="mt-2 text-xs text-muted-foreground line-clamp-2">{post.content}</p>
                    </button>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="likes" className="mt-5 px-1 data-[state=inactive]:hidden">
              {likedPostsDisplay.length === 0 ? (
                <div className="rounded-3xl border border-border bg-card px-6 py-14 text-center shadow-sm">
                  <Heart className="mx-auto h-7 w-7 text-primary/60" strokeWidth={1.75} />
                  <p className="mt-3 font-display text-base font-bold text-foreground">No likes to show</p>
                  <p className="mt-2 text-sm text-muted-foreground">Liked posts will appear here.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {likedPostsDisplay.map((post) => {
                    const p = post as any;
                    const u = p.user ?? p.author;
                    const gid = (p as Post & { groupId?: string }).groupId;
                    return (
                      <PostCard
                        key={post.id}
                        id={post.id}
                        authorId={p.userId}
                        author={{
                          name: u?.name || "Member",
                          image: u?.avatar || undefined,
                          verified: u?.verified ?? undefined,
                        }}
                        content={post.content}
                        image={postDisplayImageUrl(p)}
                        detailHref={`/community/post/${encodeURIComponent(post.id)}`}
                        likes={Number(p.likes ?? p.likesCount) || 0}
                        comments={Number(p.comments ?? p.commentsCount) || 0}
                        likedByMe={!!p.likedByMe}
                        visibility={(p as { visibility?: "public" | "private" }).visibility ?? "public"}
                        savedByMe={!!p.savedByMe}
                        isFollowingAuthor={followingIds.has(String(p.userId || "").trim())}
                        firstComment={p.firstComment ?? null}
                        groupId={gid}
                        groupName={gid ? groupNameById.get(gid) : undefined}
                        onLikeToggle={(postId, liked) => likeMutation.mutate({ postId, like: liked })}
                        timestamp={String(p.createdAt || "")}
                        postedAt={String(p.createdAt || "")}
                      />
                    );
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="groups" className="mt-5 px-1 data-[state=inactive]:hidden">
              {memberGroups.length === 0 ? (
                <div className="rounded-3xl border border-border bg-card px-6 py-14 text-center shadow-sm">
                  <Users className="mx-auto h-7 w-7 text-primary/60" strokeWidth={1.75} />
                  <p className="mt-3 font-display text-base font-bold text-foreground">No groups yet</p>
                  <p className="mt-2 text-sm text-muted-foreground">Groups they join will show here.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {memberGroups.slice(0, 40).map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setLocation(`/group/${g.id}`)}
                      className={cn(
                        "w-full rounded-[24px] border border-border bg-card p-4 text-left shadow-sm",
                        "hover:bg-muted/50",
                      )}
                    >
                      <p className="font-semibold text-foreground">{g.name}</p>
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{g.description}</p>
                    </button>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <BottomNav active="community" onNavigate={() => {}} />
    </div>
  );
}

