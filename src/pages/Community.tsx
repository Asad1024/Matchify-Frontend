import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import Header from "@/components/common/Header";
import GroupCard from "@/components/groups/GroupCard";
import BottomNav from "@/components/common/BottomNav";
import PostCard from "@/components/posts/PostCard";
import CreatePostDialog from "@/components/posts/CreatePostDialog";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useCurrentUser } from "@/contexts/UserContext";
import { useAuth } from "@/contexts/AuthContext";
import { LoadingState } from "@/components/common/LoadingState";
import { EmptyState } from "@/components/common/EmptyState";
import { Heart } from "lucide-react";
import type { Group } from "@shared/schema";
import { getReligionLabel } from "@/lib/religionOptions";

type GroupRow = Group & { memberCount?: number; religionFocus?: string | null };

function groupMatchesDiscovery(
  group: GroupRow,
  userReligion?: string | null,
  meetPreference?: string | null
): boolean {
  const f = group.religionFocus;
  if (!f || f === "all") return true;
  if (f === "interfaith") return true;
  if (meetPreference === "open_to_all" || meetPreference === "prefer_not_say" || !meetPreference) {
    return true;
  }
  if (meetPreference === "same_faith") {
    if (!userReligion || userReligion === "prefer_not_say") return true;
    // "all" / "interfaith" already returned true above
    return f === userReligion;
  }
  return true;
}

type Post = {
  id: string;
  userId: string;
  authorId?: string;
  content: string;
  imageUrl?: string;
  image?: string;
  likesCount: number;
  commentsCount: number;
  createdAt: string;
  user?: { name: string; avatar?: string; verified?: boolean };
  author?: { name: string; image?: string; verified?: boolean };
  category?: string;
  comments?: Array<{ user?: { name?: string }; content?: string }>;
  topComment?: { author: string; content: string } | null;
  viewsCount?: number;
};

const FEED_TABS = ['feed', 'groups'] as const;
const FEED_FILTERS = [
  { id: 'for_you', label: 'For you' },
  { id: 'new', label: 'New' },
  { id: 'following', label: 'Following' },
  { id: 'random', label: 'Random' },
] as const;

const CATEGORY_COLORS: Record<string, string> = {
  'All things marriage': 'bg-rose-100 text-rose-600',
  'Fitness': 'bg-primary/10 text-primary',
  'Faith': 'bg-amber-100 text-amber-600',
  'Career': 'bg-blue-100 text-blue-600',
  'Travel': 'bg-sky-100 text-sky-600',
  'Random': 'bg-violet-100 text-violet-600',
  'Advice': 'bg-orange-100 text-orange-600',
  'Food': 'bg-yellow-100 text-yellow-600',
};

const CATEGORIES = Object.keys(CATEGORY_COLORS);

function getCategory(post: Post, idx: number): string {
  if (post.category) return post.category;
  return CATEGORIES[idx % CATEGORIES.length];
}

function sortPosts(posts: Post[], filter: string): Post[] {
  if (filter === "random") return [...posts].sort(() => Math.random() - 0.5);
  // Restore latest-first behavior for all feed modes.
  return [...posts].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

const ONBOARDING_KEY = 'community_likes_count';

function enrichPostWithMeta(post: Post, idx: number): Post {
  const topComment = post.topComment ?? (
    Array.isArray(post.comments) && post.comments.length > 0
      ? {
          author: post.comments[0]?.user?.name || "User",
          content: post.comments[0]?.content || "",
        }
      : null
  );
  return {
    ...post,
    category: getCategory(post, idx),
    topComment: topComment?.content ? topComment : null,
  };
}

export default function Community() {
  const [activeTab, setActiveTab] = useState<typeof FEED_TABS[number]>('feed');
  const [feedFilter, setFeedFilter] = useState<string>('for_you');
  const [selectedGroupId, setSelectedGroupId] = useState<string>('all');
  const [activePage, setActivePage] = useState('jamaa');
  const [createPostOpen, setCreatePostOpen] = useState(false);
  const [groupsDiscoverMode, setGroupsDiscoverMode] = useState<"for_you" | "all">("for_you");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { userId: currentUserId } = useCurrentUser();
  const { logout } = useAuth();

  const onboardingLikes = parseInt(localStorage.getItem(ONBOARDING_KEY) || '0', 10);
  const [likedCount, setLikedCount] = useState(onboardingLikes);
  const ONBOARDING_GOAL = 5;
  const showOnboarding = likedCount < ONBOARDING_GOAL;

  const { data: posts = [], isLoading: postsLoading } = useQuery<Post[]>({
    queryKey: ['/api/posts'],
  });

  const { data: groups = [], isLoading: groupsLoading } = useQuery<GroupRow[]>({
    queryKey: ['/api/groups'],
  });

  const { data: currentProfile } = useQuery<{
    religion?: string | null;
    meetPreference?: string | null;
  }>({
    queryKey: [`/api/users/${currentUserId}`],
    enabled: !!currentUserId,
  });

  const discoveryGroups = useMemo(() => {
    const list = Array.isArray(groups) ? groups : [];
    if (groupsDiscoverMode === "all") return list;
    return list.filter((g) =>
      groupMatchesDiscovery(g, currentProfile?.religion, currentProfile?.meetPreference)
    );
  }, [groups, groupsDiscoverMode, currentProfile?.religion, currentProfile?.meetPreference]);

  const { data: memberships = [] } = useQuery({
    queryKey: ['/api/users', currentUserId, 'memberships'],
    enabled: !!currentUserId,
  });

  if (!currentUserId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingState message="Loading community..." showMascot={true} />
      </div>
    );
  }

  const joinMutation = useMutation({
    mutationFn: async ({ groupId }: { groupId: string }) => {
      return apiRequest('POST', '/api/memberships', { userId: currentUserId, groupId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/groups'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users', currentUserId, 'memberships'] });
      toast({ title: "Joined!", description: "You've joined the group" });
    },
  });

  const leaveMutation = useMutation({
    mutationFn: async ({ groupId }: { groupId: string }) => {
      return apiRequest('DELETE', `/api/memberships/${currentUserId}/${groupId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/groups'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users', currentUserId, 'memberships'] });
      toast({ title: "Left group", description: "You've left the group" });
    },
  });

  const membershipIds = new Set(
    Array.isArray(memberships)
      ? memberships.map((m: any) => m.groupId || m.id)
      : []
  );

  const sortedPosts = sortPosts(Array.isArray(posts) ? posts : [], feedFilter).map(enrichPostWithMeta);
  const selectedGroup = selectedGroupId === 'all'
    ? null
    : groups.find((g) => g.id === selectedGroupId) || null;
  const groupPosts = selectedGroup
    ? sortedPosts.filter((p: any) => p.groupId === selectedGroup.id)
    : [];

  const handlePostLike = () => {
    const next = likedCount + 1;
    setLikedCount(next);
    localStorage.setItem(ONBOARDING_KEY, String(next));
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <Header
        showSearch={true}
        title="Jamaa"
        subtitle="Community feed & groups"
        onNotifications={() => setLocation("/notifications")}
        onCreate={() => setCreatePostOpen(true)}
        onSettings={() => setLocation("/profile")}
        onLogout={logout}
      />

      <div className="max-w-lg mx-auto">
        {/* Main tabs: Feed / Groups */}
        <div className="flex border-b border-gray-200 bg-white sticky top-16 z-20">
          {FEED_TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 text-sm font-semibold capitalize transition-colors ${
                activeTab === tab
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-gray-500'
              }`}
            >
              {tab === 'feed' ? '📱 Feed' : '👥 Groups'}
            </button>
          ))}
        </div>

        {activeTab === 'feed' && (
          <>
            {/* Filter chips */}
            <div className="px-4 pt-3 pb-1">
              <div className="flex gap-2 overflow-x-auto">
                {FEED_FILTERS.map(f => (
                  <button
                    key={f.id}
                    onClick={() => setFeedFilter(f.id)}
                    className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                      feedFilter === f.id
                        ? 'bg-primary text-white border-primary'
                        : 'bg-white text-gray-600 border-gray-200'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Onboarding banner */}
            {showOnboarding && (
              <div className="mx-4 mt-3 rounded-2xl overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #f94272, #ff6b9d)' }}>
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
              ) : sortedPosts.length === 0 ? (
                <EmptyState
                  title="No posts yet"
                  description="Be the first to share something!"
                  useMascot={true}
                />
              ) : (
                sortedPosts.map((post, idx) => (
                  <PostCard
                    key={post.id}
                    id={post.id}
                    authorId={post.userId || post.authorId}
                    author={{
                      name: post.user?.name || post.author?.name || "Anonymous",
                      image: post.user?.avatar || post.author?.image,
                      verified: post.user?.verified ?? post.author?.verified,
                    }}
                    content={post.content}
                    image={post.imageUrl || post.image}
                    likes={post.likesCount || 0}
                    comments={post.commentsCount || 0}
                    timestamp={new Date(post.createdAt).toLocaleDateString()}
                    category={post.category}
                    topComment={post.topComment}
                    onLike={handlePostLike}
                  />
                ))
              )}
            </div>
          </>
        )}

        {activeTab === 'groups' && (
          <div className="px-4 mt-4 space-y-4">
            {!groupsLoading && groups.length > 0 && (
              <>
                <div className="rounded-2xl bg-primary/5 border border-primary/15 p-3">
                  <p className="text-xs font-bold text-gray-800 mb-2">How should we list groups?</p>
                  <div className="flex gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => {
                        setGroupsDiscoverMode("for_you");
                        setSelectedGroupId("all");
                      }}
                      className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                        groupsDiscoverMode === "for_you"
                          ? "bg-primary text-white border-primary"
                          : "bg-white text-gray-600 border-gray-200"
                      }`}
                    >
                      For you
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setGroupsDiscoverMode("all");
                        setSelectedGroupId("all");
                      }}
                      className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                        groupsDiscoverMode === "all"
                          ? "bg-primary text-white border-primary"
                          : "bg-white text-gray-600 border-gray-200"
                      }`}
                    >
                      All communities
                    </button>
                  </div>
                  {groupsDiscoverMode === "for_you" &&
                    currentProfile?.meetPreference === "same_faith" &&
                    currentProfile?.religion &&
                    currentProfile.religion !== "prefer_not_say" && (
                      <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">
                        Surfacing groups that fit{" "}
                        <span className="font-semibold text-foreground">
                          {getReligionLabel(currentProfile.religion)}
                        </span>{" "}
                        first. Matchify is for every background — switch to &quot;All communities&quot; anytime.
                      </p>
                    )}
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  <button
                    onClick={() => setSelectedGroupId("all")}
                    className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                      selectedGroupId === "all"
                        ? "bg-primary text-white border-primary"
                        : "bg-white text-gray-600 border-gray-200"
                    }`}
                  >
                    All
                  </button>
                  {discoveryGroups.map((group) => (
                    <button
                      key={group.id}
                      onClick={() => setSelectedGroupId(group.id)}
                      className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                        selectedGroupId === group.id
                          ? "bg-primary text-white border-primary"
                          : "bg-white text-gray-600 border-gray-200"
                      }`}
                    >
                      {group.name}
                    </button>
                  ))}
                </div>
              </>
            )}

            {groupsLoading ? (
              <LoadingState message="Loading groups..." showMascot={true} />
            ) : groups.length === 0 ? (
              <EmptyState
                title="No groups yet"
                description="Groups will appear here when available"
                useMascot={true}
              />
            ) : discoveryGroups.length === 0 && groupsDiscoverMode === "for_you" && groups.length > 0 ? (
              <EmptyState
                title="No groups in this view"
                description="Try “All communities” to browse every group."
                useMascot={true}
                actionLabel="Show all communities"
                onAction={() => {
                  setGroupsDiscoverMode("all");
                  setSelectedGroupId("all");
                }}
              />
            ) : selectedGroup ? (
              <>
                <GroupCard
                  key={selectedGroup.id}
                  group={{
                    ...selectedGroup,
                    memberCount: (selectedGroup as GroupRow).memberCount ?? 0,
                  }}
                  isMember={membershipIds.has(selectedGroup.id)}
                  onJoin={() => joinMutation.mutate({ groupId: selectedGroup.id })}
                  onLeave={() => leaveMutation.mutate({ groupId: selectedGroup.id })}
                />

                <div className="bg-white rounded-2xl border border-gray-100 p-4">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                    Posts in this group
                  </p>
                  {!membershipIds.has(selectedGroup.id) ? (
                    <p className="text-sm text-gray-500">
                      Join this group to view and participate in group posts.
                    </p>
                  ) : groupPosts.length === 0 ? (
                    <p className="text-sm text-gray-500">
                      No posts yet in this group.
                    </p>
                  ) : (
                    <div className="space-y-4 mt-2">
                      {groupPosts.map((post) => (
                        <PostCard
                          key={post.id}
                          id={post.id}
                          authorId={post.userId || post.authorId}
                          author={{
                            name: post.user?.name || post.author?.name || "Anonymous",
                            image: post.user?.avatar || post.author?.image,
                            verified: post.user?.verified ?? post.author?.verified,
                          }}
                          content={post.content}
                          image={post.imageUrl || post.image}
                          likes={post.likesCount || 0}
                          comments={post.commentsCount || 0}
                          timestamp={new Date(post.createdAt).toLocaleDateString()}
                          category={post.category}
                          topComment={post.topComment}
                          onLike={handlePostLike}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              discoveryGroups.map((group) => (
                <GroupCard
                  key={group.id}
                  group={{
                    ...group,
                    memberCount: group.memberCount ?? 0,
                  }}
                  isMember={membershipIds.has(group.id)}
                  onJoin={() => joinMutation.mutate({ groupId: group.id })}
                  onLeave={() => leaveMutation.mutate({ groupId: group.id })}
                  onView={() => setSelectedGroupId(group.id)}
                />
              ))
            )}
          </div>
        )}
      </div>

      <BottomNav active={activePage} onNavigate={setActivePage} />

      <CreatePostDialog
        open={createPostOpen}
        onOpenChange={setCreatePostOpen}
        userId={currentUserId}
      />
    </div>
  );
}
