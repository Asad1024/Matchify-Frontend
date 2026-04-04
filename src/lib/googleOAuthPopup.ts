/**
 * Google OAuth always uses a full-page redirect so login/signup and the post-Google
 * steps stay in the same browser tab (no separate popup window on desktop).
 */
export const MATCHIFY_GOOGLE_OAUTH_WINDOW_NAME = "matchify_google_oauth";

export function startGoogleOAuth(startUrl: string): void {
  if (typeof window === "undefined") return;
  window.location.assign(startUrl);
}

/** After auth completes in the OAuth popup: sync opener and close. Returns false if not a popup. */
export function closeOAuthPopupAndNavigate(path: string): boolean {
  if (typeof window === "undefined") return false;
  if (window.name !== MATCHIFY_GOOGLE_OAUTH_WINDOW_NAME) return false;
  const op = window.opener as Window | null;
  if (!op || op.closed) return false;
  try {
    const target = path.startsWith("http")
      ? path
      : new URL(path.startsWith("/") ? path : `/${path}`, op.location.origin).href;
    op.dispatchEvent(new Event("matchify-auth-changed"));
    op.location.assign(target);
    window.close();
    return true;
  } catch {
    return false;
  }
}
