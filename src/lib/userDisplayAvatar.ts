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

/** When `/api/users/:id` is still loading or omits an image, reuse the last login snapshot in localStorage. */
export function avatarFromStoredCurrentUserForUserId(userId: string | null): string | null {
  if (!userId) return null;
  try {
    const raw = localStorage.getItem("currentUser");
    if (!raw) return null;
    const u = JSON.parse(raw) as Record<string, unknown>;
    const sid = String(u.userId ?? u.id ?? "").trim();
    if (sid !== userId) return null;
    return resolveUserDisplayAvatarUrl(u);
  } catch {
    return null;
  }
}
