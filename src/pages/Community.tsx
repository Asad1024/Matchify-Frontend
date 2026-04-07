import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useInfiniteQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import Header from "@/components/common/Header";
import BottomNav from "@/components/common/BottomNav";
import PostCard from "@/components/posts/PostCard";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useCurrentUser } from "@/contexts/UserContext";
import { useAuth } from "@/contexts/AuthContext";
import { LoadingState } from "@/components/common/LoadingState";
import { EmptyState } from "@/components/common/EmptyState";
import { Users, Calendar, Plus, ImagePlus, Camera } from "lucide-react";
import { OPEN_GLOBAL_SEARCH_EVENT } from "@/components/common/GlobalSearch";
import type { Group, Story } from "@shared/schema";
import StoryCircles from "@/components/stories/StoryCircles";
import StoryViewer from "@/components/stories/StoryViewer";
import CreateStoryDialog from "@/components/stories/CreateStoryDialog";
import CreatePostDialog from "@/components/posts/CreatePostDialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { groupStoriesIntoRings, type StoryRing } from "@/lib/storyRings";
import { StorySkeleton } from "@/components/ui/skeleton-enhanced";
import { fetchPostsFeedPage, POSTS_FEED_PAGE_SIZE } from "@/lib/fetchPostsFeed";
import { postsFeedQueryOptions } from "@/lib/queryPersist";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { isFeedMockMode } from "@/lib/feedMockMode";
import { setMockPostLiked } from "@/lib/mockLikesStore";
import { postDisplayImageUrl } from "@/lib/postImage";
import { cn } from "@/lib/utils";
import { useSocialSummaryQuery } from "@/hooks/useSocialSummary";
import FeedFilterPills from "@/components/feed/FeedFilterPills";
import FeedQuickActions from "@/components/feed/FeedQuickActions";

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

type GroupRow = Group & { memberCount?: number; religionFocus?: string | null };

type Post = {
  id: string;
  userId: string;
  authorId?: string;
  content: string;
  imageUrl?: string;
  image?: string;
  likes?: number;
  comments?: number;
  likesCount: number;
  commentsCount: number;
  likedByMe?: boolean;
  createdAt: string;
  user?: { name: string; avatar?: string; verified?: boolean };
  author?: { name: string; avatar?: string | null; image?: string; verified?: boolean };
  category?: string;
  /** Legacy mock shape: nested comment list */
  embeddedComments?: Array<{ user?: { name?: string }; content?: string }>;
  viewsCount?: number;
  firstComment?: {
    id: string;
    userId: string;
    content: string;
    createdAt: string;
    user?: { name?: string; avatar?: string | null } | null;
  } | null;
  savedByMe?: boolean;
};

const FEED_FILTERS = [
  { id: 'for_you', label: 'For you' },
  { id: 'new', label: 'New' },
  { id: 'following', label: 'Following' },
  { id: 'random', label: 'Random' },
] as const;

function sortPosts(posts: Post[], filter: string, followingIds: Set<string>): Post[] {
  let list = [...posts];
  if (filter === "following") {
    list = list.filter((p) => followingIds.has(String(p.userId || "").trim()));
  }
  if (filter === "random") return list.sort(() => Math.random() - 0.5);
  return list.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export default function Community() {
  const [feedFilter, setFeedFilter] = useState<string>('for_you');
  const [activePage, setActivePage] = useState('community');
  const [storyViewer, setStoryViewer] = useState<{
    stories: Story[];
    initialIndex: number;
  } | null>(null);
  const [createStoryOpen, setCreateStoryOpen] = useState(false);
  const [createPostOpen, setCreatePostOpen] = useState(false);
  const [composeChoiceOpen, setComposeChoiceOpen] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { userId: currentUserId } = useCurrentUser();
  const { logout } = useAuth();
  const [composePrefillGroupId, setComposePrefillGroupId] = useState<string | null>(null);

  const clearCreatePostLauncherFlag = () => {
    try {
      sessionStorage.removeItem("matchify_open_create_post");
    } catch {
      /* ignore */
    }
  };

  /** Legacy share links used `?post=`; normalize to `/community/post/:id`. */
  useEffect(() => {
    try {
      const q = new URLSearchParams(window.location.search).get("post");
      if (q) {
        setLocation(`/community/post/${encodeURIComponent(q)}`);
      }
    } catch {
      /* ignore */
    }
  }, [setLocation]);

  useEffect(() => {
    const onOpen = (ev: Event) => {
      const ce = ev as CustomEvent<{ groupId?: string | null }>;
      const gid = ce?.detail?.groupId ?? null;
      setComposePrefillGroupId(gid ? String(gid) : null);
      setCreatePostOpen(true);
      // If a launcher stored a sticky flag, clear it now that we've consumed it.
      clearCreatePostLauncherFlag();
    };
    window.addEventListener("matchify-open-create-post", onOpen as EventListener);
    return () => window.removeEventListener("matchify-open-create-post", onOpen as EventListener);
  }, []);

  useEffect(() => {
    // Support "launcher" routes that navigate away then back (event may fire before we mount).
    try {
      const raw = sessionStorage.getItem("matchify_open_create_post");
      if (!raw) return;
      sessionStorage.removeItem("matchify_open_create_post");
      const parsed = JSON.parse(raw) as { groupId?: string | null };
      const gid = parsed?.groupId ? String(parsed.groupId) : null;
      setComposePrefillGroupId(gid);
      setCreatePostOpen(true);
    } catch {
      /* ignore */
    }
  }, []);

  const { data: socialSummary } = useSocialSummaryQuery();
  const followingIds = useMemo(
    () => new Set(socialSummary?.followingIds ?? []),
    [socialSummary?.followingIds],
  );

  const { data: stories = [], isLoading: storiesLoading } = useQuery<Story[]>({
    queryKey: [`/api/stories?viewerId=${encodeURIComponent(currentUserId ?? "")}`],
    enabled: !!currentUserId,
  });

  const storyRings = useMemo(() => groupStoriesIntoRings(stories), [stories]);

  const { data: groups = [] } = useQuery<GroupRow[]>({
    queryKey: ['/api/groups'],
  });

  /** All groups as chips (sorted by name). */
  const sortedGroupChips = useMemo(() => {
    const list = Array.isArray(groups) ? groups : [];
    return [...list].sort((a, b) => (a.name || "").localeCompare(b.name || "", undefined, { sensitivity: "base" }));
  }, [groups]);

  const { data: memberships = [] } = useQuery({
    queryKey: ['/api/users', currentUserId, 'memberships'],
    enabled: !!currentUserId,
  });

  const membershipIds = useMemo(() => {
    if (!Array.isArray(memberships)) return new Set<string>();
    const ids = memberships
      .map((m: { groupId?: string }) => m.groupId)
      .filter((gid): gid is string => typeof gid === "string" && gid.length > 0);
    return new Set(ids);
  }, [memberships]);

  const groupsKey = useMemo(
    () => Array.from(membershipIds).sort((a, b) => a.localeCompare(b)).join(","),
    [membershipIds],
  );

  const postsInfinite = useInfiniteQuery({
    ...postsFeedQueryOptions,
    queryKey: ["/api/posts", { viewer: currentUserId ?? "", scope: "joined", g: groupsKey }],
    queryFn: async ({ pageParam }) => {
      const offset = typeof pageParam === "number" ? pageParam : 0;
      return fetchPostsFeedPage({
        limit: POSTS_FEED_PAGE_SIZE,
        offset,
        inGroups: Array.from(membershipIds),
      }) as Promise<Post[]>;
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, _pages, lastOffset) => {
      if (!Array.isArray(lastPage) || lastPage.length < POSTS_FEED_PAGE_SIZE) return undefined;
      return lastOffset + POSTS_FEED_PAGE_SIZE;
    },
    enabled: !!currentUserId && membershipIds.size > 0,
  });

  const posts = useMemo(
    () => postsInfinite.data?.pages.flat() ?? [],
    [postsInfinite.data],
  );

  const postsLoading = postsInfinite.isPending;

  const { loadMoreRef } = useInfiniteScroll({
    hasNextPage: !!postsInfinite.hasNextPage,
    fetchNextPage: postsInfinite.fetchNextPage,
    isFetchingNextPage: postsInfinite.isFetchingNextPage,
  });

  const sortedPosts = useMemo(
    () => sortPosts(Array.isArray(posts) ? posts : [], feedFilter, followingIds),
    [posts, feedFilter, followingIds],
  );

  /** Feed: only posts in groups the viewer has joined. */
  const joinedGroupsFeedPosts = useMemo(
    () =>
      sortedPosts.filter((p) => {
        const gid = (p as Post & { groupId?: string }).groupId;
        return typeof gid === "string" && gid.length > 0 && membershipIds.has(gid);
      }),
    [sortedPosts, membershipIds],
  );

  const groupNameById = useMemo(() => {
    const m = new Map<string, string>();
    for (const g of Array.isArray(groups) ? groups : []) {
      m.set(g.id, g.name);
    }
    return m;
  }, [groups]);

  const likeMutation = useMutation({
    mutationFn: async ({ postId, like }: { postId: string; like: boolean }) => {
      if (!currentUserId) throw new Error("Not signed in");
      if (isFeedMockMode()) {
        setMockPostLiked(currentUserId, postId, like);
        return;
      }
      if (like) {
        return apiRequest("POST", "/api/likes", { userId: currentUserId, postId });
      }
      const uid = encodeURIComponent(currentUserId);
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

  if (!currentUserId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingState message="Loading feed..." showMascot={true} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--surface-2))] pb-28">
      <Header
        showSearch={true}
        title="Explore"
        subtitle="People, events, stories & posts"
        onSearch={() => window.dispatchEvent(new Event(OPEN_GLOBAL_SEARCH_EVENT))}
        onNotifications={() => setLocation("/notifications")}
        onCreate={() => {
          setComposePrefillGroupId(null);
          clearCreatePostLauncherFlag();
          setComposeChoiceOpen(true);
        }}
        onSettings={() => setLocation("/profile")}
        onLogout={logout}
      />

      <div className="max-w-lg mx-auto">
        {/* One bar: feed filters + every group — same horizontal inset as stories + quick links (mx-4 rhythm) */}
        <div className="sticky top-16 z-20 px-4 pt-2">
          <FeedFilterPills
            pills={FEED_FILTERS}
            activeId={feedFilter}
            onChange={(id) => setFeedFilter(id)}
            groups={sortedGroupChips.map((g) => ({
              id: g.id,
              name: g.name,
              onClick: () => setLocation(`/group/${g.id}?from=community`),
            }))}
          />
        </div>

        <div className="mx-4 mt-3 overflow-hidden rounded-[20px] matchify-surface">
              <div
                className="overflow-x-auto scroll-smooth scrollbar-hide px-4 py-3"
                aria-label="Stories"
              >
                {storiesLoading ? (
                  <div className="flex gap-4 pb-1">
                    {[...Array(5)].map((_, i) => (
                      <StorySkeleton key={i} />
                    ))}
                  </div>
                ) : (
                  <StoryCircles
                    rings={storyRings}
                    onRingClick={(userId) => {
                      const ring = storyRings.find((r: StoryRing) => r.userId === userId);
                      if (ring?.stories.length) {
                        setStoryViewer({ stories: ring.stories, initialIndex: 0 });
                      }
                    }}
                    onCreateStory={() => setComposeChoiceOpen(true)}
                  />
                )}
              </div>
            </div>

            <FeedQuickActions
              actions={[
                { id: "people", label: "People", icon: Users, onClick: () => setLocation("/directory"), tone: "primary" },
                { id: "events", label: "Events", icon: Calendar, onClick: () => setLocation("/events?from=community"), tone: "amber" },
                {
                  id: "create",
                  label: "Create",
                  icon: Plus,
                  onClick: () => setComposeChoiceOpen(true),
                  tone: "violet",
                },
              ]}
            />

            <Dialog open={composeChoiceOpen} onOpenChange={setComposeChoiceOpen}>
              <DialogContent className="max-w-md gap-0 overflow-hidden rounded-[24px] border-border/80 p-0 sm:max-w-lg">
                <DialogHeader className="space-y-1.5 px-6 pb-2 pt-6 text-left">
                  <DialogTitle className="font-display text-xl">Create</DialogTitle>
                  <DialogDescription className="text-[13px] leading-relaxed text-muted-foreground">
                    Share in the feed or add a story friends see at the top.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-3 px-6 pb-6 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setComposeChoiceOpen(false);
                      setComposePrefillGroupId(null);
                      clearCreatePostLauncherFlag();
                      setCreatePostOpen(true);
                    }}
                    className={cn(
                      "group flex flex-col items-center gap-3 rounded-2xl border border-border/70 bg-card/90 p-4 text-center shadow-2xs",
                      "transition-all hover:border-primary/40 hover:bg-primary/[0.06] hover:shadow-md",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    )}
                  >
                    <div
                      className={cn(
                        "grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary shadow-2xs",
                        "ring-1 ring-primary/15 transition group-hover:bg-primary/15 group-hover:ring-primary/25",
                      )}
                    >
                      <ImagePlus className="h-7 w-7" strokeWidth={1.75} aria-hidden />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-foreground">New post</p>
                      <p className="mt-1 text-[11px] font-medium leading-snug text-muted-foreground">
                        Photos &amp; text in the feed
                      </p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setComposeChoiceOpen(false);
                      setCreateStoryOpen(true);
                    }}
                    className={cn(
                      "group flex flex-col items-center gap-3 rounded-2xl border border-border/70 bg-card/90 p-4 text-center shadow-2xs",
                      "transition-all hover:border-violet-500/40 hover:bg-violet-500/[0.07] hover:shadow-md",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/35 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    )}
                  >
                    <div
                      className={cn(
                        "grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-violet-500/10 text-violet-700 shadow-2xs ring-1 ring-violet-500/15",
                        "transition group-hover:bg-violet-500/15 group-hover:text-violet-800 dark:text-violet-300 dark:group-hover:text-violet-200 dark:ring-violet-400/20",
                      )}
                    >
                      <Camera className="h-7 w-7" strokeWidth={1.75} aria-hidden />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-foreground">New story</p>
                      <p className="mt-1 text-[11px] font-medium leading-snug text-muted-foreground">
                        Full-screen moment · 24h
                      </p>
                    </div>
                  </button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Posts feed */}
            <div className="px-4 mt-3 space-y-4">
              {postsLoading ? (
                <LoadingState message="Loading posts..." showMascot={true} />
              ) : joinedGroupsFeedPosts.length === 0 ? (
                <EmptyState
                  title={membershipIds.size === 0 ? "Join a group to see posts" : "No posts in your groups yet"}
                  description={
                    membershipIds.size === 0
                      ? "Posts are grouped by community. Join a group, then create a post from the header or that group’s page."
                      : "Be the first to share in a group you’ve joined."
                  }
                  useMascot={true}
                />
              ) : (
                joinedGroupsFeedPosts.map((post) => {
                  const gid = (post as Post & { groupId?: string }).groupId;
                  return (
                    <PostCard
                      key={post.id}
                      id={post.id}
                      authorId={post.userId || post.authorId}
                      author={{
                        name: post.user?.name || post.author?.name || "Anonymous",
                        image: post.user?.avatar || post.author?.avatar || post.author?.image,
                        verified: post.user?.verified ?? post.author?.verified,
                      }}
                      content={post.content}
                      image={postDisplayImageUrl(post)}
                      detailHref={`/community/post/${encodeURIComponent(post.id)}`}
                      likes={post.likes ?? post.likesCount ?? 0}
                      comments={post.comments ?? post.commentsCount ?? 0}
                      firstComment={post.firstComment ?? null}
                      likedByMe={!!post.likedByMe}
                      visibility={((post as Post & { visibility?: "public" | "private" }).visibility ?? "public")}
                      savedByMe={!!post.savedByMe}
                      isFollowingAuthor={followingIds.has(String(post.userId || "").trim())}
                      timestamp={new Date(post.createdAt).toLocaleDateString()}
                      postedAt={post.createdAt}
                      category={post.category}
                      groupId={gid}
                      groupName={gid ? groupNameById.get(gid) : undefined}
                      onLikeToggle={(postId, liked) =>
                        likeMutation.mutate({ postId, like: liked })
                      }
                    />
                  );
                })
              )}
              {(postsInfinite.hasNextPage || postsInfinite.isFetchingNextPage) && membershipIds.size > 0 ? (
                <div ref={loadMoreRef} className="h-10 shrink-0" aria-hidden />
              ) : null}
              {postsInfinite.isFetchingNextPage ? (
                <p className="text-center text-sm text-muted-foreground py-2">Loading more…</p>
              ) : null}
            </div>
      </div>

      <BottomNav active={activePage} onNavigate={setActivePage} />

      {storyViewer && (
        <StoryViewer
          key={storyViewer.stories[0]?.id ?? "viewer"}
          stories={storyViewer.stories}
          initialIndex={storyViewer.initialIndex}
          currentUserId={currentUserId}
          onClose={() => setStoryViewer(null)}
        />
      )}

      <CreateStoryDialog
        open={createStoryOpen}
        onOpenChange={setCreateStoryOpen}
        userId={currentUserId}
      />

      {currentUserId ? (
        <CreatePostDialog
          open={createPostOpen}
          onOpenChange={(o) => {
            setCreatePostOpen(o);
            if (!o) {
              setComposePrefillGroupId(null);
              // Ensure refresh doesn't re-open after the user explicitly closed.
              clearCreatePostLauncherFlag();
            }
          }}
          userId={currentUserId}
          groupId={composePrefillGroupId}
          groupName={null}
        />
      ) : null}
    </div>
  );
}
