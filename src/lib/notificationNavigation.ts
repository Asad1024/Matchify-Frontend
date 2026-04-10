/**
 * Deep-link targets for notification taps (bell + notifications page).
 * Backend may send camelCase or snake_case `type` values.
 */
export function socialNotificationNavigatePath(n: {
  type?: string | null;
  /** Backend follow / like / comment alerts often use `type: "system"`. */
  title?: string | null;
  message?: string | null;
  relatedUserId?: string | null;
  relatedEntityId?: string | null;
}): string | null {
  const normalized = String(n.type ?? "")
    .trim()
    .toLowerCase()
    .replace(/_/g, "");
  const other = n.relatedUserId != null && String(n.relatedUserId).trim() !== "" ? String(n.relatedUserId).trim() : null;
  const entity =
    n.relatedEntityId != null && String(n.relatedEntityId).trim() !== "" ? String(n.relatedEntityId).trim() : null;

  const followTypes = new Set([
    "follow",
    "follower",
    "newfollower",
    "new_follower",
    "socialfollow",
    "userfollow",
  ]);
  if (followTypes.has(normalized)) {
    if (other) return `/profile/social/user/${encodeURIComponent(other)}`;
    return null;
  }

  const postEngagementTypes = new Set([
    "postlike",
    "post_like",
    "like",
    "postcomment",
    "post_comment",
    "comment",
    "commentreply",
    "comment_reply",
  ]);
  if (postEngagementTypes.has(normalized)) {
    if (entity) return `/community/post/${encodeURIComponent(entity)}`;
    if (other) return `/profile/social/user/${encodeURIComponent(other)}`;
    return null;
  }

  // Likes & comments on your post: type "system", title "New like" / "New comment", relatedEntityId = postId.
  if (normalized === "system" && entity) {
    const titleLower = String(n.title ?? "").toLowerCase();
    const msgLower = String(n.message ?? "").toLowerCase();
    const isPostLike =
      titleLower.includes("new like") ||
      (msgLower.includes("liked") && msgLower.includes("your post"));
    const isPostComment =
      titleLower.includes("new comment") ||
      (msgLower.includes("commented") && msgLower.includes("your post"));
    if (isPostLike || isPostComment) {
      return `/community/post/${encodeURIComponent(entity)}`;
    }
  }

  // Follow endpoint creates Notification with type "system", not "follow".
  if (normalized === "system" && other) {
    const titleLower = String(n.title ?? "").toLowerCase();
    if (
      titleLower.includes("new follower") ||
      titleLower.includes("following you") ||
      titleLower.includes("started following")
    ) {
      return `/profile/social/user/${encodeURIComponent(other)}`;
    }
  }

  return null;
}
