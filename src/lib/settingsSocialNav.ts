/** Session key: scroll target section id suffix (following | followers | blocked | muted). */
export const SETTINGS_SOCIAL_SCROLL_SECTION_KEY = "matchify_social_scroll_section";

/** Menu / deep-link → SocialSelfProfile tab (`posts` | `saved` | …). */
export const SOCIAL_PROFILE_TAB_KEY = "matchify_social_profile_tab";

const SOCIAL_PROFILE_TABS = new Set(["posts", "saved", "comments", "likes", "groups"]);

/** Read and clear tab intent (e.g. Menu → Saved Posts). */
export function consumeSocialProfileTab(): string | null {
  try {
    const v = sessionStorage.getItem(SOCIAL_PROFILE_TAB_KEY);
    sessionStorage.removeItem(SOCIAL_PROFILE_TAB_KEY);
    if (v && SOCIAL_PROFILE_TABS.has(v)) return v;
  } catch {
    /* ignore */
  }
  return null;
}
