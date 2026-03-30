/** True when the post was created inside a community group (has `groupId`). */
export function postIsGroupScoped(post: { groupId?: string | null }): boolean {
  const g = post.groupId;
  return typeof g === "string" && g.length > 0;
}

/** Marriage home + Community “Feed” tab: only general posts, not group threads. */
export function filterPostsForGlobalFeed<T extends { groupId?: string | null }>(
  posts: T[],
): T[] {
  return posts.filter((p) => !postIsGroupScoped(p));
}

/** Resolve the URL to show for a post in the feed (API may send `image`, `imageUrl`, or `images[]`). */
export function postDisplayImageUrl(post: {
  image?: string | null;
  imageUrl?: string | null;
  images?: unknown;
  mediaUrl?: string | null;
  photo?: string | null;
}): string | undefined {
  const a = post.imageUrl?.trim();
  if (a) return a;
  const b = post.image?.trim();
  if (b) return b;
  const m = post.mediaUrl?.trim();
  if (m) return m;
  const p = post.photo?.trim();
  if (p) return p;
  const imgs = post.images;
  if (Array.isArray(imgs) && imgs.length > 0) {
    const first = imgs[0];
    if (typeof first === "string" && first.trim()) return first.trim();
  }
  return undefined;
}
