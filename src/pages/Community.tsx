import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
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
import {
  Heart,
  Users,
  Calendar,
  Brain,
  Sparkles,
  ArrowRight,
  AlertCircle,
  PenSquare,
} from "lucide-react";
import type { Group, Story } from "@shared/schema";
import StoryCircles from "@/components/stories/StoryCircles";
import StoryViewer from "@/components/stories/StoryViewer";
import CreateStoryDialog from "@/components/stories/CreateStoryDialog";
import CreatePostDialog from "@/components/posts/CreatePostDialog";
import { groupStoriesIntoRings, type StoryRing } from "@/lib/storyRings";
import { StorySkeleton } from "@/components/ui/skeleton-enhanced";
import { fetchPostsFeed } from "@/lib/fetchPostsFeed";
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
    list = list.filter((p) => followingIds.has(p.userId));
  }
  if (filter === "random") return list.sort(() => Math.random() - 0.5);
  return list.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

const ONBOARDING_KEY = 'community_likes_count';

export default function Community() {
  const [feedFilter, setFeedFilter] = useState<string>('for_you');
  const [activePage, setActivePage] = useState('community');
  const [storyViewer, setStoryViewer] = useState<{
    stories: Story[];
    initialIndex: number;
  } | null>(null);
  const [createStoryOpen, setCreateStoryOpen] = useState(false);
  const [createPostOpen, setCreatePostOpen] = useState(false);
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

  const onboardingLikes = parseInt(localStorage.getItem(ONBOARDING_KEY) || '0', 10);
  const [likedCount, setLikedCount] = useState(onboardingLikes);
  const ONBOARDING_GOAL = 5;
  const showOnboarding = likedCount < ONBOARDING_GOAL;

  const { data: posts = [], isLoading: postsLoading } = useQuery<Post[]>({
    queryKey: ["/api/posts", { viewer: currentUserId ?? "" }],
    queryFn: async () => (await fetchPostsFeed()) as Post[],
    enabled: !!currentUserId,
  });

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

  const { data: currentProfile } = useQuery<{
    religion?: string | null;
    meetPreference?: string | null;
    attractionBlueprint?: unknown;
  }>({
    queryKey: [`/api/users/${currentUserId}`],
    enabled: !!currentUserId,
  });

  const aiMatchmakerComplete = !!currentProfile?.attractionBlueprint;

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
    onSuccess: (_data, { like }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      if (like) {
        setLikedCount((c) => {
          if (c >= ONBOARDING_GOAL) return c;
          const next = c + 1;
          localStorage.setItem(ONBOARDING_KEY, String(next));
          return next;
        });
      }
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
        subtitle="Stories, groups & discover"
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
        onCreate={() => {
          setComposePrefillGroupId(null);
          // Header sets a launcher flag for route-based flows; clear it for in-place open so refresh doesn't auto-open.
          clearCreatePostLauncherFlag();
          setCreatePostOpen(true);
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

        {!aiMatchmakerComplete && (
              <div className="mx-4 mt-3 rounded-2xl border border-amber-400/60 bg-amber-50/70 p-4 shadow-2xs flex items-start gap-3 backdrop-blur-md">
                <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-5 h-5 text-amber-700" aria-hidden />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-amber-950 mb-0.5">Finish AI Matchmaker to see matches</p>
                  <p className="text-xs text-amber-900/85 mb-2 leading-relaxed">
                    Complete all 30 questions to unlock Discover matches and AI scores.
                  </p>
                  <button
                    type="button"
                    onClick={() => setLocation("/ai-matchmaker/flow-b")}
                    className="flex items-center gap-1.5 bg-primary text-primary-foreground rounded-xl px-3 py-1.5 text-xs font-semibold shadow-2xs"
                  >
                    <Sparkles className="w-3 h-3" aria-hidden />
                    Continue
                    <ArrowRight className="w-3 h-3" aria-hidden />
                  </button>
                </div>
              </div>
            )}

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
                    onCreateStory={() => setCreateStoryOpen(true)}
                  />
                )}
              </div>
            </div>

            <FeedQuickActions
              actions={[
                { id: "people", label: "People", icon: Users, onClick: () => setLocation("/directory"), tone: "primary" },
                { id: "events", label: "Events", icon: Calendar, onClick: () => setLocation("/explore?tab=events"), tone: "amber" },
                { id: "ai", label: "AI Match", icon: Brain, onClick: () => setLocation("/ai-matchmaker"), tone: "violet" },
              ]}
            />

            {/* Onboarding banner */}
            {showOnboarding && (
              <div className="mx-4 mt-3 rounded-2xl overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #722F37, #8B2942)' }}>
                <div className="p-4 text-white">
                  <p className="text-sm font-bold mb-1">Like {ONBOARDING_GOAL} posts to get started</p>
                  <div className="flex gap-2 mt-2 items-center justify-center">
                    {Array.from({ length: ONBOARDING_GOAL }).map((_, i) => (
                      <Heart
                        key={i}
                        className={`w-5 h-5 transition-all ${
                          i < likedCount ? 'text-white fill-white' : 'text-white/35 fill-transparent'
                        }`}
                        strokeWidth={i < likedCount ? 0 : 2}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-white/70 mt-1">{likedCount}/{ONBOARDING_GOAL} liked</p>
                </div>
              </div>
            )}

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
                joinedGroupsFeedPosts.map((post, idx) => {
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
                      savedByMe={!!post.savedByMe}
                      isFollowingAuthor={followingIds.has(post.userId)}
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
