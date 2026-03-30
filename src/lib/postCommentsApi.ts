import { buildApiUrl, getAuthHeaders } from "@/services/api";
import { getMockData, getMockPostCommentSeeds } from "@/lib/mockData";
import { isFeedMockMode } from "@/lib/feedMockMode";

export type PostCommentRow = {
  id: string;
  userId: string;
  content: string;
  createdAt: string;
  user?: { name?: string; avatar?: string | null } | null;
  likes?: number;
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

export async function fetchPostComments(postId: string): Promise<PostCommentRow[]> {
  if (isFeedMockMode()) {
    const stored = readMockComments(postId);
    if (stored.length > 0) return stored;
    return getMockPostCommentSeeds(postId);
  }
  const path = `/api/posts/${postId}/comments`;
  const res = await fetch(buildApiUrl(path), {
    credentials: "include",
    headers: getAuthHeaders(false),
  });
  if (
    res.status === 404 ||
    res.status === 500 ||
    res.status === 503 ||
    res.status === 502 ||
    !res.ok
  ) {
    const fallback = getMockData(path);
    return Array.isArray(fallback) ? (fallback as PostCommentRow[]) : [];
  }
  return (await res.json()) as PostCommentRow[];
}
