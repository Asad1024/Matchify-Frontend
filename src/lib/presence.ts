/** Consider a user “online” if we’ve seen activity within this window. */
export const ONLINE_PRESENCE_WINDOW_MS = 5 * 60 * 1000;

export type PrivacyLike = {
  showOnlineStatus?: boolean;
} | null | undefined;

export type PresenceUserLike = {
  lastActiveAt?: string | null;
  privacy?: PrivacyLike;
};

function parseMs(iso: string | null | undefined): number | null {
  if (!iso || typeof iso !== "string") return null;
  const t = Date.parse(iso);
  return Number.isFinite(t) ? t : null;
}

export function isRecentlyActive(lastActiveAt: string | null | undefined): boolean {
  const t = parseMs(lastActiveAt);
  if (t == null) return false;
  return Date.now() - t < ONLINE_PRESENCE_WINDOW_MS;
}

/** Others may see your dot only if you allow it in privacy (default on). */
export function allowsOnlineStatusVisibility(privacy: PrivacyLike): boolean {
  return privacy?.showOnlineStatus !== false;
}

/** Green dot for someone else’s profile (directory, view profile). */
export function showOnlineDotForOther(user: PresenceUserLike): boolean {
  if (!allowsOnlineStatusVisibility(user.privacy)) return false;
  return isRecentlyActive(user.lastActiveAt);
}

/** Green dot on your own avatar in the header: setting on + app tab visible. */
export function showOnlineDotForSelf(
  privacy: PrivacyLike,
  tabVisible: boolean,
): boolean {
  if (!allowsOnlineStatusVisibility(privacy)) return false;
  return tabVisible;
}
