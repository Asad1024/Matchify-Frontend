import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import Header from "@/components/common/Header";
import PageWrapper from "@/components/common/PageWrapper";
import StoryCircles from "@/components/stories/StoryCircles";
import StoryViewer from "@/components/stories/StoryViewer";
import CreateStoryDialog from "@/components/stories/CreateStoryDialog";
import CreatePostDialog from "@/components/posts/CreatePostDialog";
import PostCard from "@/components/posts/PostCard";
import BottomNav from "@/components/common/BottomNav";
import { Button } from "@/components/ui/button";
import { Users, Calendar, Brain, Sparkles, ArrowRight, AlertCircle } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useCurrentUser } from "@/contexts/UserContext";
import { useAuth } from "@/contexts/AuthContext";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { PullToRefresh } from "@/components/common/PullToRefresh";
import { PostSkeleton, StorySkeleton } from "@/components/ui/skeleton-enhanced";
import { EmptyPosts } from "@/components/common/EmptyState";
import { LoadingState } from "@/components/common/LoadingState";
import type { Story, Post, User } from "@shared/schema";

export default function Home() {
  const [activePage, setActivePage] = useState('marriage');
  const [selectedStoryIndex, setSelectedStoryIndex] = useState<number | null>(null);
  const [createStoryOpen, setCreateStoryOpen] = useState(false);
  const [createPostOpen, setCreatePostOpen] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { userId: currentUserId } = useCurrentUser();
  const { logout } = useAuth();
  const prefersReducedMotion = useReducedMotion();

  // Fetch stories - hooks must be called before any conditional returns
  const { data: stories = [], isLoading: storiesLoading } = useQuery<Story[]>({
    queryKey: ['/api/stories'],
  });

  // Fetch posts
  const { data: posts = [], isLoading: postsLoading } = useQuery<Post[]>({
    queryKey: ['/api/posts'],
  });

  const { data: currentUser } = useQuery<User & { attractionBlueprint?: unknown }>({
    queryKey: [`/api/users/${currentUserId}`],
    enabled: !!currentUserId,
  });

  const aiMatchmakerComplete = !!currentUser?.attractionBlueprint;

  // Like mutation
  const likeMutation = useMutation({
    mutationFn: async ({ postId }: { postId: string }) => {
      return apiRequest('POST', '/api/likes', { userId: currentUserId || 'mock-user-id', postId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/posts'] });
      toast({
        title: "Post liked!",
        description: "You liked this post",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Could not like post",
        variant: "destructive",
      });
    },
  });

  // Handle loading state after all hooks are called
  if (!currentUserId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingState message="Loading your feed..." showMascot={true} />
      </div>
    );
  }

  const handleLike = (postId: string) => {
    likeMutation.mutate({ postId });
  };

  const handleRefresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['/api/stories'] }),
      queryClient.invalidateQueries({ queryKey: ['/api/posts'] }),
    ]);
  };

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
        onNotifications={() => setLocation('/notifications')}
        onCreate={() => setCreatePostOpen(true)}
        onSettings={() => setLocation('/profile')}
        onLogout={logout}
      />

      <div className="max-w-lg mx-auto">
        {!aiMatchmakerComplete && (
          <div className="mx-4 mt-4 rounded-2xl border-2 border-amber-400/80 bg-amber-50 p-4 shadow-sm flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-5 h-5 text-amber-700" aria-hidden />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm text-amber-950 mb-0.5">Finish AI Matchmaker to see matches</p>
              <p className="text-xs text-amber-900/85 mb-2 leading-relaxed">
                Complete all 30 questions to unlock Discover matches and AI scores.
              </p>
              <button
                type="button"
                onClick={() => setLocation("/ai-matchmaker/flow-b")}
                className="flex items-center gap-1.5 bg-primary text-primary-foreground rounded-xl px-3 py-1.5 text-xs font-bold shadow-sm"
              >
                <Sparkles className="w-3 h-3" />
                Continue
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}

        {/* Stories */}
        <div className="mt-4 bg-white border-b border-gray-100">
          <div className="overflow-x-auto scrollbar-hide">
            <div className="flex gap-0 px-4 py-3">
              {storiesLoading ? (
                <>
                  {[...Array(5)].map((_, i) => (
                    <StorySkeleton key={i} />
                  ))}
                </>
              ) : (
                <StoryCircles
                  stories={stories as any}
                  onStoryClick={(id) => {
                    const index = stories.findIndex(s => s.id === id);
                    if (index !== -1) setSelectedStoryIndex(index);
                  }}
                  onCreateStory={() => setCreateStoryOpen(true)}
                />
              )}
            </div>
          </div>
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-3 gap-3 px-4 py-4">
          {[
            { label: 'Explore', icon: Users, path: '/explore', color: 'bg-primary/10 text-primary' },
            { label: 'Events', icon: Calendar, path: '/events', color: 'bg-amber-50 text-amber-600' },
            { label: 'AI Match', icon: Brain, path: '/ai-matchmaker', color: 'bg-purple-50 text-purple-600' },
          ].map(({ label, icon: Icon, path, color }) => (
            <button
              key={label}
              onClick={() => setLocation(path)}
              className="bg-white rounded-2xl p-3 flex flex-col items-center gap-1.5 border border-gray-100 shadow-sm active:scale-95 transition-transform"
            >
              <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-gray-700">{label}</span>
            </button>
          ))}
        </div>

        {/* Feed */}
        <div className="px-4 pb-4 space-y-4">
          {postsLoading ? (
            <>
              {[...Array(3)].map((_, i) => (
                <PostSkeleton key={i} />
              ))}
            </>
          ) : posts.length === 0 ? (
            <EmptyPosts onCreatePost={() => setCreatePostOpen(true)} />
          ) : (
            (posts as Post[]).map((post) => {
              const p = post as Post & {
                user?: { name?: string; avatar?: string; verified?: boolean };
                author?: { name?: string; image?: string; verified?: boolean };
                imageUrl?: string;
              };
              const u = p.user;
              const a = p.author;
              return (
                <PostCard
                  key={post.id}
                  id={post.id}
                  authorId={(post as any).userId || (post as any).authorId}
                  author={{
                    name: u?.name || a?.name || "Unknown",
                    image: u?.avatar || a?.image,
                    verified: u?.verified ?? a?.verified,
                  }}
                  content={p.content || ""}
                  image={p.imageUrl || (p as any).image}
                  likes={(post as any).likesCount || 0}
                  comments={(post as any).commentsCount || 0}
                  timestamp={
                    p.createdAt ? new Date(p.createdAt).toLocaleString() : "Just now"
                  }
                  onLike={() => handleLike(post.id)}
                />
              );
            })
          )}
        </div>
      </div>

      <BottomNav active={activePage} onNavigate={setActivePage} />

      {/* Story viewer */}
      {selectedStoryIndex !== null && (
        <StoryViewer
          stories={stories as any}
          initialIndex={selectedStoryIndex}
          onClose={() => setSelectedStoryIndex(null)}
        />
      )}

      {/* Create story dialog */}
      <CreateStoryDialog
        open={createStoryOpen}
        onOpenChange={setCreateStoryOpen}
        userId={currentUserId}
      />

      <CreatePostDialog
        open={createPostOpen}
        onOpenChange={setCreatePostOpen}
        userId={currentUserId}
      />
    </div>
    </PageWrapper>
    </PullToRefresh>
  );
}
