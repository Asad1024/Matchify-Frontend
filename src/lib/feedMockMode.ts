const SESSION_KEY = "matchify_feed_is_mock";

/** Call when the posts feed is served from mock data (API unreachable). */
export function setFeedMockMode(isMock: boolean): void {
  try {
    if (typeof sessionStorage === "undefined") return;
    if (isMock) sessionStorage.setItem(SESSION_KEY, "1");
    else sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
}

export function isFeedMockMode(): boolean {
  try {
    if (typeof sessionStorage === "undefined") return false;
    return sessionStorage.getItem(SESSION_KEY) === "1";
  } catch {
    return false;
  }
}
