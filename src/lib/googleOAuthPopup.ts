/**
 * Google OAuth: prefer a **popup** so the login/signup SPA stays mounted (smooth, like email login).
 * If the browser blocks the popup, fall back to a full redirect to `startUrl`.
 */
export const MATCHIFY_GOOGLE_OAUTH_WINDOW_NAME = "matchify_google_oauth";

const POPUP_FEATURES =
  "width=520,height=680,scrollbars=yes,resizable=yes,status=no,toolbar=no,menubar=no,location=yes";

export function startGoogleOAuth(startUrl: string): void {
  if (typeof window === "undefined") return;
  const popup = window.open(startUrl, MATCHIFY_GOOGLE_OAUTH_WINDOW_NAME, POPUP_FEATURES);
  if (!popup || popup.closed || typeof popup.closed === "undefined") {
    window.location.assign(startUrl);
    return;
  }
  try {
    popup.focus();
  } catch {
    /* ignore */
  }
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
    op.location.replace(target);
    window.close();
    return true;
  } catch {
    return false;
  }
}
