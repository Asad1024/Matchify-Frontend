import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { useRoute, useLocation, useSearchParams } from "wouter";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  MoreVertical,
  PenSquare,
  Search,
  Share2,
  Users,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import BottomNav from "@/components/common/BottomNav";
import { GlobalSearch, OPEN_GLOBAL_SEARCH_EVENT } from "@/components/common/GlobalSearch";
import PostCard from "@/components/posts/PostCard";
import CreatePostDialog from "@/components/posts/CreatePostDialog";
import { LoadingState } from "@/components/common/LoadingState";
import { useCurrentUser } from "@/contexts/UserContext";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { fetchPostsFeedPage, POSTS_FEED_PAGE_SIZE } from "@/lib/fetchPostsFeed";
import { postsFeedQueryOptions } from "@/lib/queryPersist";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { postDisplayImageUrl, postIsGroupScoped } from "@/lib/postImage";
import { isFeedMockMode } from "@/lib/feedMockMode";
import { setMockPostLiked } from "@/lib/mockLikesStore";
import type { Group, Post } from "@shared/schema";
import { cn } from "@/lib/utils";
import { useSocialSummaryQuery } from "@/hooks/useSocialSummary";

type GroupRow = Group & { memberCount?: number; religionFocus?: string | null };

type FeedPost = Post & {
  userId?: string;
  authorId?: string;
  user?: { name: string; avatar?: string; verified?: boolean };
  author?: { name: string; avatar?: string | null; image?: string; verified?: boolean };
  likes?: number;
  comments?: number;
  likesCount?: number;
  commentsCount?: number;
  likedByMe?: boolean;
  savedByMe?: boolean;
  groupId?: string;
  firstComment?: {
    id: string;
    userId: string;
    content: string;
    createdAt: string;
    user?: { name?: string; avatar?: string | null } | null;
  } | null;
};

type DirectoryUser = {
  id: string;
  name: string;
  avatar?: string | null;
};

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

function memberCountLabel(g: GroupRow): number {
  const n = g.members ?? g.memberCount;
  return typeof n === "number" && n >= 0 ? n : 0;
}

function openGlobalSearch() {
  window.dispatchEvent(new Event(OPEN_GLOBAL_SEARCH_EVENT));
}

export default function GroupDetailPage() {
  const [, params] = useRoute("/group/:id");
  const groupId = params?.id ?? "";
  const [, setLocation] = useLocation();
  const [searchParams] = useSearchParams();
  const { userId } = useCurrentUser();
  const { toast } = useToast();
  const [heroTab, setHeroTab] = useState<"posts" | "members">("posts");
  const [fabCompact, setFabCompact] = useState(false);
  const [createPostOpen, setCreatePostOpen] = useState(false);
  const [launchComposerOnce, setLaunchComposerOnce] = useState(false);

  const clearCreatePostLauncherFlag = () => {
    try {
      sessionStorage.removeItem("matchify_open_create_post");
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    setFabCompact(false);
    const t = window.setTimeout(() => setFabCompact(true), 3500);
    return () => window.clearTimeout(t);
  }, [groupId]);

  useEffect(() => {
    const onOpen = (ev: Event) => {
      const ce = ev as CustomEvent<{ groupId?: string | null }>;
      const gid = ce?.detail?.groupId ? String(ce.detail.groupId) : null;
      if (!gid || gid !== groupId) return;
      setLaunchComposerOnce(true);
    };
    window.addEventListener("matchify-open-create-post", onOpen as EventListener);
    return () => window.removeEventListener("matchify-open-create-post", onOpen as EventListener);
  }, [groupId]);

  useEffect(() => {
    if (!launchComposerOnce) return;
    setLaunchComposerOnce(false);
    clearCreatePostLauncherFlag();
    setCreatePostOpen(true);
  }, [launchComposerOnce]);

  const { data: group, isLoading: groupLoading } = useQuery<GroupRow>({
    queryKey: [`/api/groups/${groupId}`],
    enabled: !!groupId,
  });

  const { data: socialSummary } = useSocialSummaryQuery();
  const followingIds = useMemo(
    () => new Set(socialSummary?.followingIds ?? []),
    [socialSummary?.followingIds],
  );

  const { data: memberships = [] } = useQuery({
    queryKey: ["/api/users", userId, "memberships"],
    enabled: !!userId,
  });

  const isMember = useMemo(() => {
    if (!groupId || !Array.isArray(memberships)) return false;
    return memberships.some((m: { groupId?: string }) => m.groupId === groupId);
  }, [memberships, groupId]);

  const postsInfinite = useInfiniteQuery({
    ...postsFeedQueryOptions,
    queryKey: ["/api/posts", { viewer: userId ?? "", scope: "group", groupId }],
    queryFn: async ({ pageParam }) => {
      const offset = typeof pageParam === "number" ? pageParam : 0;
      return fetchPostsFeedPage({
        limit: POSTS_FEED_PAGE_SIZE,
        offset,
        groupId,
      }) as Promise<FeedPost[]>;
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, _pages, lastOffset) => {
      if (!Array.isArray(lastPage) || lastPage.length < POSTS_FEED_PAGE_SIZE) return undefined;
      return lastOffset + POSTS_FEED_PAGE_SIZE;
    },
    enabled: !!userId && !!groupId && isMember,
  });

  const posts = useMemo(
    () => postsInfinite.data?.pages.flat() ?? [],
    [postsInfinite.data],
  );

  const { loadMoreRef } = useInfiniteScroll({
    hasNextPage: !!postsInfinite.hasNextPage,
    fetchNextPage: postsInfinite.fetchNextPage,
    isFetchingNextPage: postsInfinite.isFetchingNextPage,
  });

  const { data: users = [] } = useQuery<DirectoryUser[]>({
    queryKey: ["/api/users"],
    // Member directory is only visible once the viewer joins.
    enabled: !!userId && isMember,
  });

  const groupPosts = useMemo(() => {
    if (!groupId || !Array.isArray(posts)) return [];
    return posts.filter((p) => postIsGroupScoped(p) && p.groupId === groupId);
  }, [posts, groupId]);

  const previewMembers = useMemo(() => {
    if (!isMember) return [] as DirectoryUser[];
    const list = Array.isArray(users) ? users : [];
    const others = list.filter((u) => u.id !== userId);
    return others.slice(0, 3);
  }, [users, userId, isMember]);

  const joinMutation = useMutation({
    mutationFn: async ({ gid }: { gid: string }) => {
      const uid = userId;
      if (!uid) throw new Error("You're not signed in. Try logging in again.");
      const res = await apiRequest("POST", "/api/memberships", { userId: uid, groupId: gid });
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
      toast({ title: "Joined!", description: "You're in this group now." });
    },
    onError: (err) => {
      toast({
        variant: "destructive",
        title: "Could not join",
        description: apiErrorMessage(err),
      });
    },
  });

  const leaveMutation = useMutation({
    mutationFn: async ({ gid }: { gid: string }) => {
      const uid = userId;
      if (!uid) throw new Error("You're not signed in. Try logging in again.");
      const res = await apiRequest("DELETE", `/api/memberships/${uid}/${gid}`);
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
      toast({ title: "Left group", description: "You can rejoin anytime from Community." });
      setLocation("/community");
    },
    onError: (err) => {
      toast({
        variant: "destructive",
        title: "Could not leave",
        description: apiErrorMessage(err),
      });
    },
  });

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

  const shareGroup = async () => {
    const url = `${window.location.origin}/group/${groupId}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: group?.name ?? "Group", url });
        return;
      }
    } catch {
      /* dismissed or unsupported */
    }
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: "Link copied", description: "Share this group with friends." });
    } catch {
      toast({
        variant: "destructive",
        title: "Could not share",
        description: "Copy the address from your browser bar.",
      });
    }
  };

  const goBack = () => {
    if (window.history.length > 1) {
      window.history.back();
      return;
    }
    if (searchParams.get("from") === "community") {
      setLocation("/community");
      return;
    }
    setLocation("/profile/social");
  };

  if (!userId) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingState message="Loading…" showMascot />
      </div>
    );
  }

  if (!groupId || groupLoading || !group) {
    return (
      <div className="min-h-screen bg-[hsl(var(--surface-2))] pb-28">
        <LoadingState message="Loading group…" showMascot />
        <BottomNav active="community" />
      </div>
    );
  }

  const cover = groupCoverUrl(group);
  const totalMembers = memberCountLabel(group);

  return (
    <div className="min-h-screen bg-[hsl(var(--surface-2))] pb-28">
      <GlobalSearch />

      <header className="sticky top-0 z-40 border-b border-border/70 bg-card/80 shadow-2xs backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-lg items-center justify-between gap-2 px-4 py-2 pt-[max(0.35rem,env(safe-area-inset-top))]">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-11 w-11 shrink-0 rounded-full text-stone-800 hover:bg-stone-100/90"
            onClick={goBack}
            aria-label="Back"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <div className="flex shrink-0 items-center gap-0.5">
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
              onClick={() => void shareGroup()}
              aria-label="Share group"
            >
              <Share2 className="h-5 w-5" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-full text-stone-700 hover:bg-stone-100/90"
                  aria-label="More"
                >
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem onClick={() => void shareGroup()}>
                  <Share2 className="mr-2 h-4 w-4" />
                  Share group
                </DropdownMenuItem>
                {isMember ? (
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => leaveMutation.mutate({ gid: groupId })}
                    disabled={leaveMutation.isPending}
                  >
                    Leave group
                  </DropdownMenuItem>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-lg px-3">
        <div className="relative mt-3 h-36 w-full overflow-hidden rounded-[24px] border border-border/70 bg-card/60 shadow-2xs sm:h-40">
          {cover ? (
            <img src={cover} alt="" className="h-full w-full object-cover" loading="lazy" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Users className="h-11 w-11 text-primary/35 sm:h-12 sm:w-12" strokeWidth={1.25} />
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 rounded-b-[24px] bg-gradient-to-t from-black/55 via-black/15 to-transparent pt-10 pb-2">
            <div className="flex justify-center px-2">
              <div className="inline-flex rounded-full bg-black/35 p-1 backdrop-blur-md">
                <button
                  type="button"
                  onClick={() => setHeroTab("posts")}
                  className={cn(
                    "rounded-full px-4 py-1.5 text-xs font-semibold transition-colors",
                    heroTab === "posts" ? "bg-white text-stone-900" : "text-white/90 hover:bg-white/10",
                  )}
                >
                  Posts
                </button>
                <button
                  type="button"
                  onClick={() => setHeroTab("members")}
                  className={cn(
                    "rounded-full px-4 py-1.5 text-xs font-semibold transition-colors",
                    heroTab === "members" ? "bg-white text-stone-900" : "text-white/90 hover:bg-white/10",
                  )}
                >
                  Members
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 w-full space-y-4 rounded-2xl border border-border/70 bg-card/70 p-4 shadow-2xs">
          <div className="flex w-full flex-wrap items-start justify-between gap-3">
            <h1 className="min-w-0 flex-1 font-display text-xl font-bold tracking-tight text-stone-900 sm:text-2xl">
              {group.name}
            </h1>
            <div className="shrink-0">
              {!isMember ? (
                <Button
                  type="button"
                  size="sm"
                  className="rounded-full"
                  disabled={joinMutation.isPending}
                  onClick={() => joinMutation.mutate({ gid: groupId })}
                >
                  {joinMutation.isPending ? "Joining…" : "Join group"}
                </Button>
              ) : (
                <span className="inline-flex rounded-full bg-primary/12 px-3 py-1 text-xs font-bold uppercase tracking-wide text-primary">
                  Member
                </span>
              )}
            </div>
          </div>

          <div className="flex w-full min-w-0 items-center gap-2">
            {isMember ? (
              <div className="flex shrink-0 -space-x-2">
                {previewMembers.map((u) => (
                  <Avatar
                    key={u.id}
                    className="h-10 w-10 border-2 border-white shadow-sm ring-1 ring-stone-100"
                  >
                    <AvatarImage src={u.avatar || undefined} alt="" />
                    <AvatarFallback className="text-xs font-semibold">
                      {u.name?.slice(0, 2).toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                ))}
              </div>
            ) : (
              <div className="flex shrink-0 -space-x-2 opacity-70" aria-hidden>
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-10 w-10 rounded-full border-2 border-white bg-stone-100 shadow-sm ring-1 ring-stone-100"
                  />
                ))}
              </div>
            )}
            <p className="min-w-0 text-sm font-medium text-stone-600">
              <span className="font-bold text-stone-900">{totalMembers.toLocaleString()}</span> members
              {!isMember ? <span className="text-stone-400"> · Join to view</span> : null}
            </p>
          </div>

          {group.description ? (
            <p className="w-full text-sm leading-relaxed text-stone-600">{group.description}</p>
          ) : null}
        </div>

        <div className="mt-4 w-full space-y-4 pb-8">
          {heroTab === "members" ? (
            <div className="w-full rounded-2xl border border-stone-200/90 bg-white p-4 shadow-sm">
              <p className="text-sm font-semibold text-stone-900">Who&apos;s here</p>
              <p className="mt-1 text-xs text-stone-500">
                A sample of members in this space. Open Community to discover more people.
              </p>
              {!isMember ? (
                <div className="mt-6 rounded-2xl border border-dashed border-stone-200 bg-stone-50/80 px-4 py-10 text-center shadow-sm">
                  <p className="text-sm font-semibold text-stone-900">Members are private</p>
                  <p className="mt-1 text-xs text-stone-500">
                    Join this group to see who’s here.
                  </p>
                  <Button
                    type="button"
                    className="mt-4 rounded-full"
                    onClick={() => joinMutation.mutate({ gid: groupId })}
                    disabled={joinMutation.isPending}
                  >
                    {joinMutation.isPending ? "Joining…" : "Join group"}
                  </Button>
                </div>
              ) : (Array.isArray(users) ? users : []).length === 0 ? (
                <div className="mt-8 flex flex-col items-center px-4 pb-6 text-center">
                  <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-100 text-stone-400">
                    <Users className="h-7 w-7" strokeWidth={1.5} />
                  </div>
                  <p className="font-display text-sm font-bold text-stone-900">Nothing to see here yet</p>
                  <p className="mt-2 max-w-xs text-xs leading-relaxed text-stone-500">
                    No member directory loaded. Check back when you&apos;re online, or try again from Community.
                  </p>
                </div>
              ) : (
                <ul className="mt-4 space-y-3">
                  {(Array.isArray(users) ? users : []).slice(0, 12).map((u) => (
                    <li key={u.id} className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={u.avatar || undefined} alt="" />
                        <AvatarFallback>{u.name?.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium text-stone-800">{u.name}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : !isMember ? (
            <div className="w-full rounded-2xl border border-dashed border-stone-200 bg-stone-50/80 px-4 py-10 text-center shadow-sm">
              <p className="text-sm font-semibold text-stone-900">Nothing to see here yet</p>
              <p className="mt-1 text-xs text-stone-500">
                Join this group to read posts and take part in discussions.
              </p>
              <Button
                type="button"
                className="mt-4 rounded-full"
                onClick={() => joinMutation.mutate({ gid: groupId })}
                disabled={joinMutation.isPending}
              >
                {joinMutation.isPending ? "Joining…" : "Join group"}
              </Button>
            </div>
          ) : groupPosts.length === 0 ? (
            <div className="w-full rounded-2xl border border-dashed border-primary/25 bg-primary/[0.04] px-4 py-10 text-center shadow-sm">
              <p className="text-sm font-semibold text-stone-900">Nothing to see here yet</p>
              <p className="mt-1 text-xs text-stone-500">No posts in this group. Start the thread with Create post.</p>
            </div>
          ) : (
            <div className="flex w-full flex-col space-y-4">
              {groupPosts.map((post) => {
                const author = post.user ?? post.author;
                const authorFace =
                  author && typeof author === "object"
                    ? ("avatar" in author && author.avatar
                        ? author.avatar
                        : "image" in author
                          ? (author as { image?: string | null }).image
                          : undefined) ?? undefined
                    : undefined;
                return (
                  <PostCard
                    key={post.id}
                    id={post.id}
                    authorId={post.userId || post.authorId}
                    author={{
                      name: author?.name || "Member",
                      image: authorFace || undefined,
                      verified: author?.verified,
                    }}
                    content={post.content}
                    image={postDisplayImageUrl(post)}
                    detailHref={`/community/post/${encodeURIComponent(post.id)}`}
                    likes={post.likes ?? post.likesCount ?? 0}
                    comments={post.comments ?? post.commentsCount ?? 0}
                    firstComment={post.firstComment ?? null}
                    likedByMe={!!post.likedByMe}
                    visibility={(post as FeedPost & { visibility?: "public" | "private" }).visibility ?? "public"}
                    savedByMe={!!post.savedByMe}
                    isFollowingAuthor={followingIds.has(
                      String(post.userId || post.authorId || "").trim(),
                    )}
                    groupId={groupId}
                    groupName={group.name}
                    timestamp={new Date(post.createdAt as string).toLocaleDateString()}
                    postedAt={post.createdAt as string}
                    onLikeToggle={(postId, liked) =>
                      likeMutation.mutate({ postId, like: liked })
                    }
                  />
                );
              })}
              {(postsInfinite.hasNextPage || postsInfinite.isFetchingNextPage) ? (
                <div ref={loadMoreRef} className="h-10 shrink-0" aria-hidden />
              ) : null}
              {postsInfinite.isFetchingNextPage ? (
                <p className="text-center text-sm text-muted-foreground py-2">Loading more…</p>
              ) : null}
            </div>
          )}
        </div>
      </div>

      {isMember ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-[5.5rem] z-30 flex justify-center sm:bottom-[5.75rem]">
          <div className="pointer-events-auto flex w-full max-w-lg justify-end px-4">
            <motion.button
              type="button"
              layout
              transition={{ type: "spring", stiffness: 420, damping: 32 }}
              className={cn(
                "flex items-center gap-2 overflow-hidden rounded-full border border-border/70 bg-card/75 py-3 text-sm font-semibold text-stone-900 shadow-lg backdrop-blur-xl",
                fabCompact ? "px-3.5" : "px-4",
              )}
              style={{
                paddingLeft: fabCompact ? undefined : "1.1rem",
                paddingRight: fabCompact ? undefined : "1.1rem",
              }}
              onClick={() => setCreatePostOpen(true)}
              aria-label="Create post"
            >
              <PenSquare className="h-5 w-5 shrink-0 text-primary" strokeWidth={2} />
              {!fabCompact ? (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="whitespace-nowrap pr-0.5"
                >
                  Create post
                </motion.span>
              ) : null}
            </motion.button>
          </div>
        </div>
      ) : null}

      {isMember ? (
        <CreatePostDialog
          open={createPostOpen}
            onOpenChange={(o) => {
              setCreatePostOpen(o);
              if (!o) clearCreatePostLauncherFlag();
            }}
          userId={userId}
          groupId={groupId}
          groupName={group.name}
        />
      ) : null}

      <BottomNav active="community" />
    </div>
  );
}
