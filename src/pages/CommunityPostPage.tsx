import { useMemo } from "react";
import { useRoute, useLocation, Redirect } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import BottomNav from "@/components/common/BottomNav";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import PostCard from "@/components/posts/PostCard";
import { useCurrentUser } from "@/contexts/UserContext";
import { fetchPostsFeed } from "@/lib/fetchPostsFeed";
import { postDisplayImageUrl } from "@/lib/postImage";
import { apiRequestJson } from "@/services/api";
import { useSocialSummaryQuery } from "@/hooks/useSocialSummary";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { isFeedMockMode } from "@/lib/feedMockMode";
import { setMockPostLiked } from "@/lib/mockLikesStore";
import { useToast } from "@/hooks/use-toast";
import type { Group, Post } from "@shared/schema";
import { LoadingState } from "@/components/common/LoadingState";

type SavedItem = {
  postId: string;
  savedAt: string;
  preview: { content: string; author: unknown; image?: string | null } | null;
};

function normalizeAuthor(raw: unknown): { name: string; avatar?: string | null } {
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

type GroupRow = Group & { memberCount?: number };

export default function CommunityPostPage() {
  const [, params] = useRoute("/community/post/:postId");
  const rawId = params?.postId ?? "";
  const postId = rawId ? decodeURIComponent(rawId) : "";
  const [, setLocation] = useLocation();
  const { userId } = useCurrentUser();
  const { toast } = useToast();

  const { data: socialSummary } = useSocialSummaryQuery();
  const followingIds = useMemo(
    () => new Set(socialSummary?.followingIds ?? []),
    [socialSummary?.followingIds],
  );

  const { data: posts = [], isLoading: postsLoading } = useQuery<Post[]>({
    queryKey: ["/api/posts", { viewer: userId ?? "" }],
    queryFn: async () => (await fetchPostsFeed()) as Post[],
    enabled: !!userId && !!postId,
  });

  const { data: groups = [] } = useQuery<GroupRow[]>({
    queryKey: ["/api/groups"],
    enabled: !!userId && !!postId,
  });

  const { data: savedRow, isLoading: savedLoading } = useQuery({
    queryKey: ["/api/users", userId, "social-saved-posts", "one", postId],
    queryFn: async () => {
      const res = await apiRequestJson<{ items: SavedItem[] }>(
        "GET",
        `/api/users/${userId}/social/saved-posts`,
      );
      return res.items?.find((i) => i.postId === postId) ?? null;
    },
    enabled: !!userId && !!postId,
  });

  const groupNameById = useMemo(() => {
    const m = new Map<string, string>();
    for (const g of Array.isArray(groups) ? groups : []) {
      m.set(g.id, g.name);
    }
    return m;
  }, [groups]);

  const post = useMemo(() => {
    if (!postId) return null;
    const fromFeed = (Array.isArray(posts) ? posts : []).find((p) => p.id === postId);
    if (fromFeed) return fromFeed as Post & Record<string, unknown>;
    if (savedRow?.preview) {
      const au = normalizeAuthor(savedRow.preview.author);
      return {
        id: postId,
        userId: "",
        content: savedRow.preview.content || "",
        image: savedRow.preview.image || undefined,
        imageUrl: savedRow.preview.image || undefined,
        createdAt: savedRow.savedAt,
        likesCount: 0,
        commentsCount: 0,
        likes: 0,
        comments: 0,
        likedByMe: false,
        savedByMe: true,
        user: { name: au.name, avatar: au.avatar || undefined },
      } as unknown as Post & Record<string, unknown>;
    }
    return null;
  }, [postId, posts, savedRow]);

  const likeMutation = useMutation({
    mutationFn: async ({ postId: pid, like }: { postId: string; like: boolean }) => {
      if (!userId) throw new Error("Not signed in");
      if (isFeedMockMode()) {
        setMockPostLiked(userId, pid, like);
        return;
      }
      if (like) {
        return apiRequest("POST", "/api/likes", { userId, postId: pid });
      }
      const uid = encodeURIComponent(userId);
      const p = encodeURIComponent(pid);
      return apiRequest("DELETE", `/api/likes/${uid}/${p}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      toast({ title: "Could not update like", variant: "destructive" });
    },
  });

  if (!userId) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingState message="Loading…" showMascot />
      </div>
    );
  }

  if (!postId) {
    return <Redirect to="/community" />;
  }

  const loading = postsLoading || savedLoading;

  const p = post as
    | (Post & {
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
      })
    | null;

  const u = p?.user ?? p?.author;
  const gid = p ? (p as Post & { groupId?: string }).groupId : undefined;

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      <div className="sticky top-0 z-40 border-b border-gray-100 bg-white/95 backdrop-blur-md safe-top">
        <div className="mx-auto flex max-w-lg items-center gap-2 px-3 py-2 pt-[max(0.5rem,env(safe-area-inset-top))]">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-10 w-10 shrink-0 rounded-full text-gray-800"
            onClick={() => setLocation("/community")}
            aria-label="Back to feed"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="truncate text-base font-bold text-gray-900">Post</h1>
        </div>
      </div>

      <div className="mx-auto mt-3 max-w-lg px-4">
        {loading ? (
          <LoadingState message="Loading post…" showMascot />
        ) : !p ? (
          <div className="rounded-2xl border border-gray-100 bg-white p-6 text-center shadow-sm">
            <p className="text-sm font-medium text-gray-900">Post not found</p>
            <p className="mt-2 text-xs text-gray-500">It may have been removed or isn’t in your feed.</p>
            <Button type="button" className="mt-4" onClick={() => setLocation("/community")}>
              Back to feed
            </Button>
          </div>
        ) : (
          <PostCard
            id={p.id}
            authorId={p.userId || (p as { authorId?: string }).authorId}
            author={{
              name: u?.name || "Member",
              image: u?.avatar || (u as { image?: string })?.image,
              verified: u?.verified,
            }}
            content={p.content}
            image={postDisplayImageUrl(p)}
            likes={Number(p.likes ?? p.likesCount) || 0}
            comments={Number(p.comments ?? p.commentsCount) || 0}
            likedByMe={!!p.likedByMe}
            savedByMe={!!p.savedByMe}
            isFollowingAuthor={followingIds.has(p.userId || "")}
            firstComment={p.firstComment ?? null}
            groupId={gid}
            groupName={gid ? groupNameById.get(gid) : undefined}
            onLikeToggle={(pid, liked) => likeMutation.mutate({ postId: pid, like: liked })}
            timestamp={
              p.createdAt
                ? typeof p.createdAt === "string"
                  ? p.createdAt
                  : new Date(p.createdAt).toISOString()
                : ""
            }
            postedAt={
              p.createdAt
                ? typeof p.createdAt === "string"
                  ? p.createdAt
                  : new Date(p.createdAt).toISOString()
                : undefined
            }
          />
        )}
      </div>

      <BottomNav active="community" onNavigate={() => {}} />
    </div>
  );
}
