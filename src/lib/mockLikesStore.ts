/** Persist “I liked this post” in offline/mock feeds (API has no like rows). */

function storageKey(userId: string): string {
  return `matchify_mock_likes_${userId}`;
}

export function readMockLikedPostIds(userId: string): Set<string> {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as unknown;
    if (!Array.isArray(arr)) return new Set();
    return new Set(arr.filter((id): id is string => typeof id === "string" && id.length > 0));
  } catch {
    return new Set();
  }
}

export function setMockPostLiked(userId: string, postId: string, liked: boolean): void {
  try {
    const next = readMockLikedPostIds(userId);
    if (liked) next.add(postId);
    else next.delete(postId);
    localStorage.setItem(storageKey(userId), JSON.stringify(Array.from(next)));
  } catch {
    /* ignore */
  }
}

export function applyMockLikedToPosts<T extends { id: string; likedByMe?: boolean }>(
  posts: T[],
  userId: string | null,
): T[] {
  if (!userId) return posts;
  const liked = readMockLikedPostIds(userId);
  if (liked.size === 0) return posts;
  return posts.map((p) => (liked.has(p.id) ? { ...p, likedByMe: true } : p));
}
