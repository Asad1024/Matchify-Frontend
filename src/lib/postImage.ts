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

function firstUrlFromImagesValue(imgs: unknown): string | undefined {
  if (imgs == null) return undefined;
  const pickFromArr = (arr: unknown): string | undefined => {
    if (!Array.isArray(arr) || arr.length === 0) return undefined;
    const x = arr[0];
    if (typeof x === "string" && x.trim()) return x.trim();
    if (x && typeof x === "object" && typeof (x as { url?: unknown }).url === "string") {
      const u = String((x as { url: string }).url).trim();
      return u || undefined;
    }
    return undefined;
  };
  if (typeof imgs === "string") {
    const t = imgs.trim();
    if (!t) return undefined;
    if (t.startsWith("[")) {
      try {
        return pickFromArr(JSON.parse(t) as unknown);
      } catch {
        return /^https?:\/\//i.test(t) ? t : undefined;
      }
    }
    return /^https?:\/\//i.test(t) ? t : undefined;
  }
  return pickFromArr(imgs);
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
  const fromArr = firstUrlFromImagesValue(post.images);
  if (fromArr) return fromArr;
  return undefined;
}
