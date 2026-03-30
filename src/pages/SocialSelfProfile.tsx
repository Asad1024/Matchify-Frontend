import { useMemo, useState, useEffect } from "react";
import { useMutation, useQueries, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeft,
  Search,
  Share2,
  MapPin,
  Calendar,
  Users,
  MessageCircle,
  Heart,
  Bookmark,
  SlidersHorizontal,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GlobalSearch, OPEN_GLOBAL_SEARCH_EVENT } from "@/components/common/GlobalSearch";
import { ShareProfileDialog } from "@/components/profile/ShareProfileDialog";
import PostCard from "@/components/posts/PostCard";
import { LoadingState } from "@/components/common/LoadingState";
import { useCurrentUser } from "@/contexts/UserContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { fetchPostsFeed } from "@/lib/fetchPostsFeed";
import { isFeedMockMode } from "@/lib/feedMockMode";
import { setMockPostLiked } from "@/lib/mockLikesStore";
import { fetchPostComments, postCommentsQueryKey, type PostCommentRow } from "@/lib/postCommentsApi";
import { splitLocation, membershipBadgeLabel } from "@/lib/profileLabels";
import BottomNav from "@/components/common/BottomNav";
import type { Group, Post } from "@shared/schema";
import { postDisplayImageUrl } from "@/lib/postImage";
import { cn } from "@/lib/utils";
import { useSocialSummaryQuery } from "@/hooks/useSocialSummary";
import { consumeSocialProfileTab } from "@/lib/settingsSocialNav";
import { apiRequestJson } from "@/services/api";

type GroupRow = Group & { memberCount?: number };

function normalizeAuthorPreview(raw: unknown): { name: string; avatar?: string | null } {
  if (raw && typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    const name = typeof o.name === "string" ? o.name : "Member";
    const avatar =
      typeof o.avatar === "string"
        ? o.avatar
        : typeof o.image === "string"
          ? o.image
          : null;
    return { name, avatar };
  }
  return { name: "Member" };
}

function apiErrorMessage(err: unknown): string {
  if (!(err instanceof Error)) return "Something went wrong. Try again.";
  const raw = err.message;
  const m = raw.match(/^\d+:\s*([\s\S]+)$/);
  const payload = m?.[1] ?? raw;
  try {
    const j = JSON.parse(payload) as { message?: string };
    if (j?.message && typeof j.message === "string") return j.message;
  } catch {
    /* not JSON */
  }
  return payload.length > 160 ? `${payload.slice(0, 157)}…` : payload;
}

function groupCoverUrl(g: GroupRow): string | undefined {
  const u = g.image?.trim();
  return u || undefined;
}

function groupMembersBadgeText(g: GroupRow): string {
  const n = g.members ?? g.memberCount;
  if (typeof n !== "number" || n < 0) return "—";
  if (n >= 1000) return `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k members`;
  return `${n} members`;
}

function SmoothEmpty({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: LucideIcon;
  title: string;
  subtitle: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-3xl border border-stone-100/90 bg-gradient-to-b from-white via-white to-stone-50/90 px-6 py-14 text-center shadow-[0_10px_40px_-20px_rgba(15,23,42,0.12)]"
    >
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/[0.08] text-primary shadow-inner shadow-stone-200/40">
        <Icon className="h-7 w-7" strokeWidth={1.75} />
      </div>
      <p className="font-display text-base font-bold tracking-tight text-stone-900">{title}</p>
      <p className="mt-2 text-sm leading-relaxed text-stone-500">{subtitle}</p>
    </motion.div>
  );
}

type MeUser = {
  id: string;
  name: string;
  username: string;
  avatar?: string | null;
  location?: string | null;
  verified?: boolean | null;
  createdAt?: string | null;
};

function openGlobalSearch() {
  window.dispatchEvent(new Event(OPEN_GLOBAL_SEARCH_EVENT));
}

export default function SocialSelfProfile() {
  const [, setLocation] = useLocation();
  const { userId } = useCurrentUser();
  const { toast } = useToast();
  const [shareOpen, setShareOpen] = useState(false);
  const [profileTab, setProfileTab] = useState("posts");

  useEffect(() => {
    const t = consumeSocialProfileTab();
    if (t) setProfileTab(t);
  }, []);

  const { data: user, isLoading } = useQuery<MeUser>({
    queryKey: [`/api/users/${userId}`],
    enabled: !!userId,
  });

  const { data: posts = [] } = useQuery<Post[]>({
    queryKey: ["/api/posts", { viewer: userId ?? "" }],
    queryFn: async () => (await fetchPostsFeed()) as Post[],
    enabled: !!userId,
  });

  const { data: socialSummary, isLoading: socialSummaryLoading } = useSocialSummaryQuery();
  const followingIds = useMemo(
    () => new Set(socialSummary?.followingIds ?? []),
    [socialSummary?.followingIds],
  );

  const { data: memberships = [] } = useQuery({
    queryKey: ["/api/users", userId, "memberships"],
    enabled: !!userId,
  });

  const { data: groups = [] } = useQuery<GroupRow[]>({
    queryKey: ["/api/groups"],
  });

  const allPosts = useMemo(() => (Array.isArray(posts) ? posts : []), [posts]);

  const { data: savedFeedData, isLoading: savedFeedLoading } = useQuery({
    queryKey: ["/api/users", userId, "social-saved-posts"],
    queryFn: () =>
      apiRequestJson<{
        items: Array<{
          postId: string;
          savedAt: string;
          preview: { content: string; author: unknown; image?: string | null } | null;
        }>;
      }>("GET", `/api/users/${userId}/social/saved-posts`),
    enabled: !!userId,
  });

  const savedPostsDisplay = useMemo(() => {
    const items = savedFeedData?.items;
    if (!Array.isArray(items) || !items.length) return [] as Post[];
    const byId = new Map(allPosts.map((p) => [p.id, p]));
    const sorted = [...items].sort((a, b) => b.savedAt.localeCompare(a.savedAt));
    const out: Post[] = [];
    for (const row of sorted) {
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
          createdAt: row.savedAt,
          likesCount: 0,
          commentsCount: 0,
          user: { name: au.name, avatar: au.avatar || undefined },
          savedByMe: true,
        } as unknown as Post);
      }
    }
    return out;
  }, [savedFeedData, allPosts]);

  const myPosts = useMemo(() => {
    if (!userId) return [];
    return allPosts.filter((p) => (p as Post & { userId?: string }).userId === userId);
  }, [allPosts, userId]);

  const myLikedPosts = useMemo(() => {
    return allPosts.filter((p) => !!(p as Post & { likedByMe?: boolean }).likedByMe);
  }, [allPosts]);

  const postsForCommentLookup = useMemo(() => allPosts.slice(0, 48), [allPosts]);

  const commentQueries = useQueries({
    queries: postsForCommentLookup.map((post) => ({
      queryKey: postCommentsQueryKey(post.id),
      queryFn: () => fetchPostComments(post.id),
      enabled: !!userId && !!post.id,
      staleTime: 20_000,
    })),
  });

  const commentResults = commentQueries.map((q) => q.data);

  const myCommentActivity = useMemo(() => {
    if (!userId) return [] as Array<{ post: Post; comment: PostCommentRow }>;
    const out: Array<{ post: Post; comment: PostCommentRow }> = [];
    postsForCommentLookup.forEach((post, i) => {
      const data = commentResults[i];
      if (!Array.isArray(data)) return;
      for (const c of data) {
        if (c.userId === userId) {
          out.push({ post, comment: c });
        }
      }
    });
    return out.sort(
      (a, b) =>
        new Date(b.comment.createdAt).getTime() - new Date(a.comment.createdAt).getTime(),
    );
  }, [userId, postsForCommentLookup, commentResults]);

  const myGroupIds = useMemo(() => {
    if (!Array.isArray(memberships)) return new Set<string>();
    return new Set(
      memberships
        .map((m: { groupId?: string }) => m.groupId)
        .filter((id): id is string => typeof id === "string"),
    );
  }, [memberships]);

  const allGroupsSorted = useMemo(() => {
    if (!Array.isArray(groups)) return [];
    return [...groups].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
  }, [groups]);

  const groupNameById = useMemo(() => {
    const m = new Map<string, string>();
    for (const g of Array.isArray(groups) ? groups : []) {
      m.set(g.id, g.name);
    }
    return m;
  }, [groups]);

  const likeMutation = useMutation({
    mutationFn: async ({ postId, like }: { postId: string; like: boolean }) => {
      if (!userId) throw new Error("Not signed in");
      if (isFeedMockMode()) {
        setMockPostLiked(userId, postId, like);
        return;
      }
      if (like) {
        return apiRequest("POST", "/api/likes", { userId, postId });
      }
      const uid = encodeURIComponent(userId);
      const pid = encodeURIComponent(postId);
      return apiRequest("DELETE", `/api/likes/${uid}/${pid}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      toast({ title: "Could not update like", variant: "destructive" });
    },
  });

  const joinGroupMutation = useMutation({
    mutationFn: async ({ groupId }: { groupId: string }) => {
      const uid = userId;
      if (!uid) throw new Error("You're not signed in. Try logging in again.");
      const res = await apiRequest("POST", "/api/memberships", { userId: uid, groupId });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`${res.status}: ${text || res.statusText}`);
      }
      return res;
    },
    onSuccess: () => {
      if (!userId) return;
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users", userId, "memberships"] });
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      toast({ title: "Joined!", description: "You've joined the group." });
    },
    onError: (err) => {
      toast({
        variant: "destructive",
        title: "Could not join",
        description: apiErrorMessage(err),
      });
    },
  });

  const joinedLabel = useMemo(() => {
    if (!user?.createdAt) return "Member";
    const d = new Date(user.createdAt);
    if (Number.isNaN(d.getTime())) return membershipBadgeLabel(user.createdAt);
    return `Joined ${d.toLocaleDateString(undefined, { month: "short", year: "numeric" })}`;
  }, [user?.createdAt]);

  const { country, line: locationLine } = splitLocation(user?.location ?? null);
  const placeLine = [country, locationLine].filter(Boolean).join(" · ") || locationLine || country || "";

  const goBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      window.history.back();
      return;
    }
    setLocation("/menu");
  };

  const openConnections = (tab: "following" | "followers") => {
    setLocation(`/settings/social/connections?tab=${tab}`);
  };

  const followingCount = socialSummary?.followingIds?.length ?? 0;
  const followerCount = socialSummary?.followerCount ?? 0;
  const statDisplay = (n: number) => (socialSummaryLoading ? "–" : String(n));

  if (!userId || isLoading || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center pb-24">
        <LoadingState message="Loading profile…" showMascot />
        <BottomNav active="menu" onNavigate={() => {}} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      <GlobalSearch />

      <div className="sticky top-0 z-40 border-b border-stone-100/80 bg-white/90 shadow-[0_4px_24px_-8px_rgba(15,23,42,0.08)] backdrop-blur-xl">
        <div className="mx-auto w-full max-w-lg px-3 py-2 pt-[max(0.35rem,env(safe-area-inset-top))]">
          <div className="flex items-center justify-between gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0 -ml-1 h-11 w-11 rounded-full text-stone-800 hover:bg-stone-100/90"
              onClick={goBack}
              aria-label="Back"
            >
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <div className="flex shrink-0 items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full text-stone-700 hover:bg-stone-100/90"
                onClick={openGlobalSearch}
                aria-label="Search"
              >
                <Search className="h-5 w-5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full text-stone-700 hover:bg-stone-100/90"
                onClick={() => setShareOpen(true)}
                aria-label="Share profile"
              >
                <Share2 className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-lg">
        <div className="border-b border-stone-100/90 bg-gray-50 px-4 pb-4 pt-5">
          <div className="flex items-start gap-4">
            <div className="shrink-0">
              <div className="rounded-full bg-gradient-to-br from-stone-100 via-white to-stone-100 p-[3px] shadow-[0_12px_40px_-12px_rgba(15,23,42,0.2)]">
                <Avatar className="h-[5.5rem] w-[5.5rem] border-0 sm:h-24 sm:w-24">
                  <AvatarImage src={user.avatar || undefined} alt="" className="object-cover" />
                  <AvatarFallback className="bg-gradient-to-br from-primary/15 to-primary/5 text-2xl font-semibold text-primary">
                    {user.name?.slice(0, 2).toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
            <div className="min-w-0 flex-1 space-y-2.5 pt-0.5">
              <div>
                <h1 className="truncate font-display text-[1.35rem] font-bold leading-snug tracking-tight text-stone-900 sm:text-2xl">
                  {user.name}
                </h1>
                <p className="mt-0.5 truncate text-[0.9375rem] font-medium text-stone-500">@{user.username}</p>
              </div>
              <div className="flex flex-wrap items-end gap-x-8 gap-y-2">
                <button
                  type="button"
                  className="shrink-0 text-left transition-opacity hover:opacity-80 active:opacity-70"
                  onClick={() => openConnections("followers")}
                >
                  <p className="text-lg font-bold tabular-nums leading-none tracking-tight text-stone-900">
                    {statDisplay(followerCount)}
                  </p>
                  <p className="mt-1 whitespace-nowrap text-[10px] font-medium uppercase tracking-wide text-stone-400">
                    Followers
                  </p>
                </button>
                <button
                  type="button"
                  className="shrink-0 text-left transition-opacity hover:opacity-80 active:opacity-70"
                  onClick={() => openConnections("following")}
                >
                  <p className="text-lg font-bold tabular-nums leading-none tracking-tight text-stone-900">
                    {statDisplay(followingCount)}
                  </p>
                  <p className="mt-1 whitespace-nowrap text-[10px] font-medium uppercase tracking-wide text-stone-400">
                    Following
                  </p>
                </button>
              </div>
              <div className="space-y-1.5 text-sm text-stone-600">
                {placeLine ? (
                  <p className="flex items-start gap-1.5 font-medium text-stone-600">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-stone-400" />
                    <span className="leading-snug">{placeLine}</span>
                  </p>
                ) : null}
                <p className="flex items-start gap-1.5 text-xs text-stone-400">
                  <Calendar className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-80" />
                  <span className="leading-snug">{joinedLabel}</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-2 px-4">
          <Button
            type="button"
            className="h-[3.25rem] w-full rounded-full border-0 bg-gradient-to-b from-primary to-primary/88 px-6 text-[15px] font-semibold tracking-wide text-primary-foreground shadow-[0_14px_44px_-14px_hsl(var(--primary)/0.38)] transition-all duration-300 ease-out hover:to-primary hover:shadow-[0_18px_52px_-16px_hsl(var(--primary)/0.45)] active:scale-[0.985]"
            onClick={() => setLocation("/profile/social/edit")}
          >
            Edit my profile
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-12 w-full rounded-2xl border-stone-200/90 bg-white text-[14px] font-semibold text-stone-800 shadow-sm"
            onClick={() => setLocation("/settings/social")}
          >
            <SlidersHorizontal className="mr-2 h-4 w-4 text-primary" />
            Follows, mutes &amp; blocks
          </Button>
          <p className="px-1 text-center text-[11px] leading-snug text-stone-400">
            Saved posts are in the <span className="font-medium text-stone-500">Saved</span> tab below. Tap Followers or
            Following to manage lists in Settings.
          </p>
        </div>

        <div className="mt-7 px-4 pb-4">
          <Tabs value={profileTab} onValueChange={setProfileTab} className="w-full">
            <TabsList className="flex h-auto w-full gap-1 overflow-x-auto rounded-full bg-stone-200/40 p-1.5 shadow-[inset_0_1px_4px_rgba(15,23,42,0.05)] scrollbar-hide">
              <TabsTrigger
                value="posts"
                className="shrink-0 rounded-full px-3 py-2.5 text-[11px] font-semibold text-stone-500 shadow-none transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] data-[state=active]:bg-white data-[state=active]:text-stone-900 data-[state=active]:shadow-[0_8px_28px_-8px_rgba(15,23,42,0.2)] data-[state=inactive]:hover:bg-white/60 sm:px-3.5 sm:text-xs"
              >
                Posts
              </TabsTrigger>
              <TabsTrigger
                value="saved"
                className="shrink-0 rounded-full px-3 py-2.5 text-[11px] font-semibold text-stone-500 shadow-none transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] data-[state=active]:bg-white data-[state=active]:text-stone-900 data-[state=active]:shadow-[0_8px_28px_-8px_rgba(15,23,42,0.2)] data-[state=inactive]:hover:bg-white/60 sm:px-3.5 sm:text-xs"
              >
                Saved
              </TabsTrigger>
              <TabsTrigger
                value="comments"
                className="shrink-0 rounded-full px-3 py-2.5 text-[11px] font-semibold text-stone-500 shadow-none transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] data-[state=active]:bg-white data-[state=active]:text-stone-900 data-[state=active]:shadow-[0_8px_28px_-8px_rgba(15,23,42,0.2)] data-[state=inactive]:hover:bg-white/60 sm:px-3.5 sm:text-xs"
              >
                Comments
              </TabsTrigger>
              <TabsTrigger
                value="likes"
                className="shrink-0 rounded-full px-3 py-2.5 text-[11px] font-semibold text-stone-500 shadow-none transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] data-[state=active]:bg-white data-[state=active]:text-stone-900 data-[state=active]:shadow-[0_8px_28px_-8px_rgba(15,23,42,0.2)] data-[state=inactive]:hover:bg-white/60 sm:px-3.5 sm:text-xs"
              >
                Likes
              </TabsTrigger>
              <TabsTrigger
                value="groups"
                className="shrink-0 rounded-full px-3 py-2.5 text-[11px] font-semibold text-stone-500 shadow-none transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] data-[state=active]:bg-white data-[state=active]:text-stone-900 data-[state=active]:shadow-[0_8px_28px_-8px_rgba(15,23,42,0.2)] data-[state=inactive]:hover:bg-white/60 sm:px-3.5 sm:text-xs"
              >
                Groups
              </TabsTrigger>
            </TabsList>

            <TabsContent value="posts" className="mt-5 px-1 focus-visible:outline-none data-[state=inactive]:hidden">
              {myPosts.length === 0 ? (
                <SmoothEmpty
                  icon={Users}
                  title="Nothing to see here yet"
                  subtitle="You haven’t posted anything. Share an update from Community or home — your posts will show here."
                />
              ) : (
                <div className="space-y-4">
                  {myPosts.map((post, i) => {
                    const p = post as Post & {
                      user?: { name?: string; avatar?: string; verified?: boolean };
                      author?: { name?: string; avatar?: string | null; verified?: boolean };
                      imageUrl?: string;
                      likesCount?: number;
                      commentsCount?: number;
                      likes?: number;
                      comments?: number;
                      likedByMe?: boolean;
                      savedByMe?: boolean;
                      firstComment?: {
                        id: string;
                        userId: string;
                        content: string;
                        createdAt: string;
                        user?: { name?: string; avatar?: string | null } | null;
                      } | null;
                    };
                    const u = p.user ?? p.author;
                    const likeN = Number(p.likes ?? p.likesCount) || 0;
                    const commentN = Number(p.comments ?? p.commentsCount) || 0;
                    const gid = (p as Post & { groupId?: string }).groupId;
                    return (
                      <motion.div
                        key={post.id}
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          delay: Math.min(i * 0.05, 0.35),
                          duration: 0.35,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                        className="overflow-hidden rounded-3xl shadow-[0_12px_40px_-28px_rgba(15,23,42,0.22)]"
                      >
                        <PostCard
                          id={post.id}
                          authorId={p.userId}
                          author={{
                            name: u?.name || user.name,
                            image: u?.avatar || user.avatar || undefined,
                            verified: u?.verified ?? user.verified ?? undefined,
                          }}
                          content={post.content}
                          image={postDisplayImageUrl(p)}
                          likes={likeN}
                          comments={commentN}
                          likedByMe={p.likedByMe}
                          savedByMe={!!p.savedByMe}
                          isFollowingAuthor={followingIds.has(p.userId || "")}
                          firstComment={p.firstComment ?? null}
                          groupId={gid}
                          groupName={gid ? groupNameById.get(gid) : undefined}
                          onLikeToggle={(postId, liked) =>
                            likeMutation.mutate({ postId, like: liked })
                          }
                          timestamp={
                            post.createdAt
                              ? typeof post.createdAt === "string"
                                ? post.createdAt
                                : new Date(post.createdAt).toISOString()
                              : ""
                          }
                          postedAt={
                            post.createdAt
                              ? typeof post.createdAt === "string"
                                ? post.createdAt
                                : new Date(post.createdAt).toISOString()
                              : undefined
                          }
                        />
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="saved" className="mt-5 px-1 focus-visible:outline-none data-[state=inactive]:hidden">
              {savedFeedLoading ? (
                <LoadingState message="Loading saved posts…" showMascot />
              ) : savedPostsDisplay.length === 0 ? (
                <SmoothEmpty
                  icon={Bookmark}
                  title="No saved posts yet"
                  subtitle="Use Save on a post’s ⋯ menu in the feed. Everything you save shows up here — tap the text or image to open the full post."
                />
              ) : (
                <div className="space-y-4">
                  {savedPostsDisplay.map((post, i) => {
                    const p = post as Post & {
                      userId?: string;
                      user?: { name?: string; avatar?: string; verified?: boolean };
                      author?: { name?: string; avatar?: string | null; verified?: boolean };
                      imageUrl?: string;
                      likesCount?: number;
                      commentsCount?: number;
                      likes?: number;
                      comments?: number;
                      likedByMe?: boolean;
                      savedByMe?: boolean;
                      firstComment?: {
                        id: string;
                        userId: string;
                        content: string;
                        createdAt: string;
                        user?: { name?: string; avatar?: string | null } | null;
                      } | null;
                    };
                    const u = p.user ?? p.author;
                    const likeN = Number(p.likes ?? p.likesCount) || 0;
                    const commentN = Number(p.comments ?? p.commentsCount) || 0;
                    const gid = (p as Post & { groupId?: string }).groupId;
                    const detailHref = `/community/post/${encodeURIComponent(post.id)}`;
                    return (
                      <motion.div
                        key={post.id}
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          delay: Math.min(i * 0.05, 0.35),
                          duration: 0.35,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                        className="overflow-hidden rounded-3xl shadow-[0_12px_40px_-28px_rgba(15,23,42,0.22)]"
                      >
                        <PostCard
                          id={post.id}
                          authorId={p.userId}
                          author={{
                            name: u?.name || "Member",
                            image: u?.avatar || undefined,
                            verified: u?.verified ?? undefined,
                          }}
                          content={post.content}
                          image={postDisplayImageUrl(p)}
                          likes={likeN}
                          comments={commentN}
                          likedByMe={p.likedByMe ?? false}
                          savedByMe
                          detailHref={detailHref}
                          isFollowingAuthor={followingIds.has(p.userId || "")}
                          firstComment={p.firstComment ?? null}
                          groupId={gid}
                          groupName={gid ? groupNameById.get(gid) : undefined}
                          onLikeToggle={(postId, liked) =>
                            likeMutation.mutate({ postId, like: liked })
                          }
                          timestamp={
                            post.createdAt
                              ? typeof post.createdAt === "string"
                                ? post.createdAt
                                : new Date(post.createdAt).toISOString()
                              : ""
                          }
                          postedAt={
                            post.createdAt
                              ? typeof post.createdAt === "string"
                                ? post.createdAt
                                : new Date(post.createdAt).toISOString()
                              : undefined
                          }
                        />
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="comments" className="mt-5 px-1 focus-visible:outline-none data-[state=inactive]:hidden">
              {myCommentActivity.length === 0 ? (
                <SmoothEmpty
                  icon={MessageCircle}
                  title="Nothing to see here yet"
                  subtitle="No comments yet. When you reply on Community or home, your comments will show up here."
                />
              ) : (
                <div className="space-y-4">
                  {myCommentActivity.map(({ post, comment }, i) => {
                    const rp = post as Post & {
                      user?: { name?: string; avatar?: string | null; verified?: boolean };
                      author?: { name?: string; avatar?: string | null; verified?: boolean };
                    };
                    const author = rp.user ?? rp.author;
                    return (
                      <motion.div
                        key={`${post.id}-${comment.id}`}
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          delay: Math.min(i * 0.04, 0.3),
                          duration: 0.35,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                        className="overflow-hidden rounded-3xl border border-stone-100/90 bg-white shadow-[0_12px_40px_-28px_rgba(15,23,42,0.22)]"
                      >
                        <div className="border-b border-stone-100 bg-gradient-to-r from-primary/[0.06] to-transparent px-4 py-3">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-primary/90">Your comment</p>
                          <p className="mt-1.5 text-sm font-medium leading-relaxed text-stone-900">{comment.content}</p>
                          <p className="mt-2 text-xs text-stone-400">
                            {new Date(comment.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <div className="px-4 py-3">
                          <p className="text-xs font-medium text-stone-500">
                            On <span className="text-stone-800">{author?.name || "a post"}</span>&apos;s thread
                          </p>
                          <p className="mt-1 line-clamp-3 text-sm leading-relaxed text-stone-600">{post.content}</p>
                          <Button
                            type="button"
                            variant="ghost"
                            className="mt-2 h-auto px-0 text-xs font-semibold text-primary hover:bg-transparent hover:text-primary/90"
                            onClick={() => setLocation("/community")}
                          >
                            Open Community feed
                          </Button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="likes" className="mt-5 px-1 focus-visible:outline-none data-[state=inactive]:hidden">
              {myLikedPosts.length === 0 ? (
                <SmoothEmpty
                  icon={Heart}
                  title="Nothing to see here yet"
                  subtitle="Posts you heart will appear here — same list as on Community. Tap a heart on a post to add one."
                />
              ) : (
                <div className="space-y-4">
                  {myLikedPosts.map((post, i) => {
                    const p = post as Post & {
                      userId?: string;
                      user?: { name?: string; avatar?: string; verified?: boolean };
                      author?: { name?: string; avatar?: string | null; verified?: boolean };
                      imageUrl?: string;
                      likesCount?: number;
                      commentsCount?: number;
                      likes?: number;
                      comments?: number;
                      likedByMe?: boolean;
                      savedByMe?: boolean;
                      firstComment?: {
                        id: string;
                        userId: string;
                        content: string;
                        createdAt: string;
                        user?: { name?: string; avatar?: string | null } | null;
                     } | null;
                    };
                    const u = p.user ?? p.author;
                    const likeN = Number(p.likes ?? p.likesCount) || 0;
                    const commentN = Number(p.comments ?? p.commentsCount) || 0;
                    const gid = (p as Post & { groupId?: string }).groupId;
                    return (
                      <motion.div
                        key={post.id}
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          delay: Math.min(i * 0.05, 0.35),
                          duration: 0.35,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                        className="overflow-hidden rounded-3xl shadow-[0_12px_40px_-28px_rgba(15,23,42,0.22)]"
                      >
                        <PostCard
                          id={post.id}
                          authorId={p.userId}
                          author={{
                            name: u?.name || "Member",
                            image: u?.avatar || undefined,
                            verified: u?.verified ?? undefined,
                          }}
                          content={post.content}
                          image={postDisplayImageUrl(p)}
                          likes={likeN}
                          comments={commentN}
                          likedByMe={p.likedByMe ?? true}
                          savedByMe={!!p.savedByMe}
                          isFollowingAuthor={followingIds.has(p.userId || "")}
                          firstComment={p.firstComment ?? null}
                          groupId={gid}
                          groupName={gid ? groupNameById.get(gid) : undefined}
                          onLikeToggle={(postId, liked) =>
                            likeMutation.mutate({ postId, like: liked })
                          }
                          timestamp={
                            post.createdAt
                              ? typeof post.createdAt === "string"
                                ? post.createdAt
                                : new Date(post.createdAt).toISOString()
                              : ""
                          }
                          postedAt={
                            post.createdAt
                              ? typeof post.createdAt === "string"
                                ? post.createdAt
                                : new Date(post.createdAt).toISOString()
                              : undefined
                          }
                        />
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="groups" className="mt-5 space-y-3 px-1 focus-visible:outline-none data-[state=inactive]:hidden">
              {allGroupsSorted.length === 0 ? (
                <SmoothEmpty
                  icon={Users}
                  title="Nothing to see here yet"
                  subtitle="No groups to show. Open Community to browse and join — they’ll appear here with cover photos and member counts."
                />
              ) : (
                allGroupsSorted.map((g, i) => {
                  const isMember = myGroupIds.has(g.id);
                  const cover = groupCoverUrl(g);
                  const badge = groupMembersBadgeText(g);
                  return (
                    <motion.div
                      key={g.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        delay: Math.min(i * 0.04, 0.3),
                        duration: 0.34,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      className={cn(
                        "flex w-full items-stretch gap-3 overflow-hidden rounded-3xl border border-stone-100/90 bg-white p-3 shadow-[0_10px_36px_-22px_rgba(15,23,42,0.15)] transition-shadow duration-300",
                        "hover:shadow-[0_16px_44px_-22px_rgba(15,23,42,0.2)]",
                      )}
                    >
                      <div className="flex min-w-0 flex-[4] flex-col justify-center gap-2 py-0.5 pr-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate font-display font-bold text-stone-900">{g.name}</p>
                          {isMember ? (
                            <span className="shrink-0 rounded-full bg-primary/12 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
                              Joined
                            </span>
                          ) : null}
                        </div>
                        {g.description ? (
                          <p className="line-clamp-2 text-xs leading-relaxed text-stone-500">{g.description}</p>
                        ) : (
                          <p className="text-xs text-stone-400">Tap view to open this group.</p>
                        )}
                        <div className="flex flex-wrap gap-2 pt-0.5">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-9 rounded-full border-stone-200 px-4 text-xs font-semibold"
                            onClick={() => setLocation(`/group/${g.id}`)}
                          >
                            View group
                          </Button>
                          {isMember ? (
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              className="h-9 rounded-full px-4 text-xs font-semibold"
                              disabled
                            >
                              Joined
                            </Button>
                          ) : (
                            <Button
                              type="button"
                              size="sm"
                              className="h-9 rounded-full px-4 text-xs font-semibold"
                              disabled={joinGroupMutation.isPending}
                              onClick={() => joinGroupMutation.mutate({ groupId: g.id })}
                            >
                              {joinGroupMutation.isPending ? "Joining…" : "Join group"}
                            </Button>
                          )}
                        </div>
                      </div>
                      <div className="relative flex-[1] shrink-0 self-stretch">
                        <div className="relative h-full min-h-[7.5rem] overflow-hidden rounded-2xl bg-gradient-to-br from-primary/25 via-stone-100 to-stone-200/80 ring-1 ring-stone-200/60">
                          <span className="absolute left-1.5 right-1.5 top-1.5 z-10 truncate rounded-full bg-black/55 px-2 py-0.5 text-center text-[9px] font-bold uppercase tracking-wide text-white backdrop-blur-sm">
                            {badge}
                          </span>
                          {cover ? (
                            <img src={cover} alt="" className="h-full w-full object-cover" loading="lazy" />
                          ) : (
                            <div className="flex h-full min-h-[7.5rem] w-full items-center justify-center pt-6">
                              <Users className="h-7 w-7 text-primary/45" strokeWidth={1.5} />
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <ShareProfileDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        profileId={user.id}
        displayName={user.name}
      />

      <BottomNav active="menu" onNavigate={() => {}} />
    </div>
  );
}
