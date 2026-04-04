import { buildApiUrl, getAuthHeaders } from "@/services/api";
import { getMockData, getMockPostCommentSeeds } from "@/lib/mockData";
import { isFeedMockMode, setFeedMockMode } from "@/lib/feedMockMode";
import { queryClient } from "@/lib/queryClient";

export type PostCommentRow = {
  id: string;
  userId: string;
  content: string;
  createdAt: string;
  replyToCommentId?: string | null;
  user?: { name?: string; avatar?: string | null } | null;
  likes?: number;
  likedByMe?: boolean;
};

function mockCommentsStorageKey(postId: string): string {
  return `matchify_mock_comments_${postId}`;
}

export function readMockComments(postId: string): PostCommentRow[] {
  try {
    const raw = localStorage.getItem(mockCommentsStorageKey(postId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as PostCommentRow[]) : [];
  } catch {
    return [];
  }
}

export function writeMockComments(postId: string, rows: PostCommentRow[]): void {
  try {
    localStorage.setItem(mockCommentsStorageKey(postId), JSON.stringify(rows));
  } catch {
    /* ignore */
  }
}

export function storedUserDisplayName(): string {
  try {
    const raw = localStorage.getItem("currentUser");
    if (!raw) return "You";
    const j = JSON.parse(raw) as { name?: string };
    return j.name?.trim() || "You";
  } catch {
    return "You";
  }
}

export function postCommentsQueryKey(postId: string): readonly string[] {
  return ["post-comments", postId, isFeedMockMode() ? "mock" : "live"];
}

async function fetchLivePostComments(
  postId: string,
  viewerId?: string,
): Promise<PostCommentRow[] | null> {
  const qs = viewerId ? `?viewerId=${encodeURIComponent(viewerId)}` : "";
  const path = `/api/posts/${postId}/comments${qs}`;
  try {
    const res = await fetch(buildApiUrl(path), {
      credentials: "include",
      headers: getAuthHeaders(false),
    });
    if (res.status === 401 || res.status === 403) return null;
    if (!res.ok) return null;
    return (await res.json()) as PostCommentRow[];
  } catch {
    return null;
  }
}

export async function fetchPostComments(postId: string, viewerId?: string): Promise<PostCommentRow[]> {
  if (isFeedMockMode()) {
    const live = await fetchLivePostComments(postId, viewerId);
    if (live) {
      setFeedMockMode(false);
      void queryClient.invalidateQueries({ queryKey: ["post-comments", postId] });
      return live;
    }
    const stored = readMockComments(postId);
    if (stored.length > 0) return stored;
    return getMockPostCommentSeeds(postId);
  }
  const live = await fetchLivePostComments(postId, viewerId);
  if (live) return live;

  const qs = viewerId ? `?viewerId=${encodeURIComponent(viewerId)}` : "";
  const path = `/api/posts/${postId}/comments${qs}`;
  const fallback = getMockData(path);
  return Array.isArray(fallback) ? (fallback as PostCommentRow[]) : [];
}
