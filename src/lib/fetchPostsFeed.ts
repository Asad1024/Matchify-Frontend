import { buildApiUrl, getAuthHeaders, isClientOnlyApi } from "@/services/api";
import { getMockData } from "@/lib/mockData";
import { setFeedMockMode } from "@/lib/feedMockMode";
import { applyMockLikedToPosts } from "@/lib/mockLikesStore";
import { applySocialToMockPosts } from "@/lib/socialMockApi";

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

/**
 * Always GET `/api/posts` (never `/api/posts/:userId`).
 * The default React Query queryFn joins queryKey with "/", so `['/api/posts', userId]` became a 404 path
 * and the UI fell back to mock posts — likes then failed against the real API.
 */
export async function fetchPostsFeed(): Promise<unknown[]> {
  const path = "/api/posts";
  try {
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
      const mock = getMockData(path);
      if (mock != null) {
        setFeedMockMode(true);
        let rows = mock as unknown[];
        const uid = viewerUserIdFromStorage();
        if (isClientOnlyApi() && uid) {
          rows = await applySocialToMockPosts(rows as { id: string; userId?: string; authorId?: string }[], uid);
        }
        return withMockLikeOverlay(rows);
      }
      setFeedMockMode(false);
      return [];
    }

    setFeedMockMode(false);
    let okRows = (await res.json()) as unknown[];
    const uidOk = viewerUserIdFromStorage();
    if (isClientOnlyApi() && uidOk && Array.isArray(okRows)) {
      okRows = await applySocialToMockPosts(okRows as { id: string; userId?: string; authorId?: string }[], uidOk);
    }
    return okRows;
  } catch {
    const mock = getMockData(path);
    if (mock != null) {
      setFeedMockMode(true);
      let rows = mock as unknown[];
      const uid = viewerUserIdFromStorage();
      if (isClientOnlyApi() && uid) {
        rows = await applySocialToMockPosts(rows as { id: string; userId?: string; authorId?: string }[], uid);
      }
      return withMockLikeOverlay(rows);
    }
    setFeedMockMode(false);
    return [];
  }
}
