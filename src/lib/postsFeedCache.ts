import type { QueryClient, InfiniteData } from "@tanstack/react-query";
import type { Post } from "@shared/schema";

function isInfinitePostsData(old: unknown): old is InfiniteData<Post[]> {
  return (
    !!old &&
    typeof old === "object" &&
    "pages" in old &&
    Array.isArray((old as InfiniteData<Post[]>).pages) &&
    "pageParams" in old &&
    Array.isArray((old as InfiniteData<Post[]>).pageParams)
  );
}

/** Prepend one page row to the first page of an infinite post feed (no-op if id already present). */
function prependToInfiniteFeed(old: unknown, post: Post): unknown {
  if (!post?.id || !isInfinitePostsData(old)) return old;
  const pid = String(post.id);
  const first = old.pages[0];
  if (!Array.isArray(first)) return old;
  if (first.some((row) => row && String(row.id) === pid)) return old;
  return {
    ...old,
    pages: [[post, ...first], ...old.pages.slice(1)],
  };
}

/**
 * After POST /api/posts succeeds, patch cached infinite feeds so the new post appears immediately.
 * Does not await `invalidateQueries` — awaiting it blocks the mutation until every `/api/posts` refetch
 * finishes (can hang the UI on "Posting...").
 */
export function applyCreatedPostToPostFeedCaches(
  queryClient: QueryClient,
  post: Post,
  viewerId: string | null | undefined,
): void {
  const uid = String(viewerId ?? "").trim();
  const p = post as Post & { userId?: string; authorId?: string };
  const authorId = String(p.userId ?? p.authorId ?? "").trim() || uid;
  const groupId =
    (post as Post & { groupId?: string | null }).groupId != null
      ? String((post as Post & { groupId?: string }).groupId).trim()
      : "";

  // v5 `setQueriesData` updater only receives `old` (no `query`). Match keys via the cache.
  const matches = queryClient.getQueryCache().findAll({ queryKey: ["/api/posts"], exact: false });
  for (const q of matches) {
    const key = q.queryKey;
    const meta = key[1];
    if (typeof meta !== "object" || meta === null || Array.isArray(meta)) continue;
    const m = meta as { scope?: unknown; author?: unknown; g?: unknown };

    let touch = false;
    if (m.scope === "author") {
      touch = Boolean(uid && authorId && String(m.author ?? "") === authorId);
    } else if (m.scope === "joined") {
      if (uid && groupId) {
        const groupsKey = String(m.g ?? "");
        const allowed = new Set(groupsKey.split(",").filter(Boolean));
        touch = allowed.has(groupId);
      }
    }
    if (!touch) continue;

    queryClient.setQueryData(key, (old) => prependToInfiniteFeed(old, post));
  }

  void queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
}
