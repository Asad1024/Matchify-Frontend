/** Profile image URL for header, bottom nav, and `currentUser` after login. */
export function resolveUserDisplayAvatarUrl(
  u: { avatar?: unknown; picture?: unknown; photos?: unknown } | null | undefined,
): string | null {
  if (!u || typeof u !== "object") return null;
  const av = u.avatar;
  if (typeof av === "string" && av.trim()) return av.trim();
  const pic = u.picture;
  if (typeof pic === "string" && pic.trim()) return pic.trim();
  const photos = u.photos;
  if (Array.isArray(photos)) {
    const first = photos[0];
    if (typeof first === "string" && first.trim()) return first.trim();
  }
  return null;
}
