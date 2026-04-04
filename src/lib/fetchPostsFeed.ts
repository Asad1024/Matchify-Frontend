import { buildApiUrl, getAuthHeaders } from "@/services/api";
import { getMockData } from "@/lib/mockData";
import { setFeedMockMode } from "@/lib/feedMockMode";
import { applyMockLikedToPosts } from "@/lib/mockLikesStore";
import { applySocialToMockPosts } from "@/lib/socialMockApi";

/** Page size for Community / group / profile post feeds (backend max 100). */
export const POSTS_FEED_PAGE_SIZE = 15;

export type FetchPostsFeedParams = {
  limit?: number;
  offset?: number;
  groupId?: string;
  inGroups?: string[];
  authorId?: string;
};

function viewerUserIdFromStorage(): string | null {
  try {
    const raw = localStorage.getItem("currentUser");
    if (!raw) return null;
    const j = JSON.parse(raw) as { id?: string };
    return typeof j.id === "string" ? j.id : null;
  } catch {
    return null;
  }
}

function withMockLikeOverlay(rows: unknown[]): unknown[] {
  if (!Array.isArray(rows)) return rows;
  const uid = viewerUserIdFromStorage();
  if (!uid) return rows;
  return applyMockLikedToPosts(rows as { id: string; likedByMe?: boolean }[], uid);
}

function postsPathFromParams(params?: FetchPostsFeedParams): string {
  const qs = new URLSearchParams();
  if (params?.limit != null) qs.set("limit", String(params.limit));
  if (params?.offset != null) qs.set("offset", String(params.offset));
  if (params?.groupId) qs.set("groupId", params.groupId);
  if (params?.inGroups?.length) qs.set("inGroups", params.inGroups.join(","));
  if (params?.authorId) qs.set("authorId", params.authorId);
  const q = qs.toString();
  return q ? `/api/posts?${q}` : "/api/posts";
}

/**
 * GET `/api/posts` with optional pagination and filters (`inGroups`, `groupId`, `authorId`).
 */
export async function fetchPostsFeedPage(params?: FetchPostsFeedParams): Promise<unknown[]> {
  const path = postsPathFromParams(params);
  try {
    const res = await fetch(buildApiUrl(path), {
      credentials: "include",
      headers: getAuthHeaders(false),
    });

    if (res.status === 401 || res.status === 403) {
      setFeedMockMode(false);
      return [];
    }

    if (res.status === 404 || res.status === 500 || res.status === 503 || res.status === 502) {
      const mockPath = path.split("?")[0] || "/api/posts";
      const mock = getMockData(mockPath);
      if (mock != null) {
        setFeedMockMode(true);
        let rows = mock as unknown[];
        const uid = viewerUserIdFromStorage();
        if (uid) {
          rows = await applySocialToMockPosts(
            rows as { id: string; userId?: string; authorId?: string }[],
            uid,
          );
        }
        return withMockLikeOverlay(rows);
      }
      setFeedMockMode(false);
      return [];
    }

    if (!res.ok) {
      setFeedMockMode(false);
      return [];
    }

    setFeedMockMode(false);
    let okRows = (await res.json()) as unknown[];
    const uidOk = viewerUserIdFromStorage();
    if (uidOk && Array.isArray(okRows)) {
      okRows = await applySocialToMockPosts(
        okRows as { id: string; userId?: string; authorId?: string }[],
        uidOk,
      );
    }
    return okRows;
  } catch {
    const mockPath = path.split("?")[0] || "/api/posts";
    const mock = getMockData(mockPath);
    if (mock != null) {
      setFeedMockMode(true);
      let rows = mock as unknown[];
      const uid = viewerUserIdFromStorage();
      if (uid) {
        rows = await applySocialToMockPosts(
          rows as { id: string; userId?: string; authorId?: string }[],
          uid,
        );
      }
      return withMockLikeOverlay(rows);
    }
    setFeedMockMode(false);
    return [];
  }
}

/**
 * Full feed (no `limit` query) — avoid on hot paths; prefer `fetchPostsFeedPage` with pagination.
 */
export async function fetchPostsFeed(): Promise<unknown[]> {
  return fetchPostsFeedPage();
}

/**
 * Single post by id (for deep links). Returns null if missing.
 */
export async function fetchPostById(postId: string): Promise<unknown | null> {
  const id = String(postId || "").trim();
  if (!id) return null;
  try {
    const res = await fetch(buildApiUrl(`/api/posts/${encodeURIComponent(id)}`), {
      credentials: "include",
      headers: getAuthHeaders(false),
    });
    if (res.status === 404) return null;
    if (!res.ok) return null;
    const row = await res.json();
    const uidOk = viewerUserIdFromStorage();
    if (uidOk && row && typeof row === "object") {
      const enriched = await applySocialToMockPosts(
        [row as { id: string; userId?: string; authorId?: string }],
        uidOk,
      );
      const one = enriched[0];
      return one ?? row;
    }
    return row;
  } catch {
    return null;
  }
}
