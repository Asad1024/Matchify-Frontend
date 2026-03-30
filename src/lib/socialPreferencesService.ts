import { socialDb, socialCompoundKey, type PostReportRow } from "@/lib/socialPreferencesDb";

export type SocialSummary = {
  savedPostIds: string[];
  followingIds: string[];
  mutedAuthorIds: string[];
  blockedUserIds: string[];
  /** Users who follow this profile (IndexedDB / local handler only unless API adds it). */
  followerCount?: number;
};

export async function getSocialSummary(userId: string): Promise<SocialSummary> {
  const [saved, follows, muted, blocked, followerCount] = await Promise.all([
    socialDb.savedPosts.where("userId").equals(userId).toArray(),
    socialDb.follows.where("userId").equals(userId).toArray(),
    socialDb.mutedAuthors.where("userId").equals(userId).toArray(),
    socialDb.blockedUsers.where("userId").equals(userId).toArray(),
    socialDb.follows.where("targetUserId").equals(userId).count(),
  ]);
  return {
    savedPostIds: saved.map((r) => r.postId),
    followingIds: follows.map((r) => r.targetUserId),
    mutedAuthorIds: muted.map((r) => r.authorId),
    blockedUserIds: blocked.map((r) => r.blockedUserId),
    followerCount,
  };
}

export async function setPostSaved(userId: string, postId: string, saved: boolean): Promise<void> {
  const key = socialCompoundKey(userId, postId);
  if (saved) {
    await socialDb.savedPosts.put({
      key,
      userId,
      postId,
      savedAt: new Date().toISOString(),
    });
  } else {
    await socialDb.savedPosts.delete(key);
  }
}

export async function setFollowing(userId: string, targetUserId: string, following: boolean): Promise<void> {
  const key = socialCompoundKey(userId, targetUserId);
  if (following) {
    await socialDb.follows.put({
      key,
      userId,
      targetUserId,
      createdAt: new Date().toISOString(),
    });
  } else {
    await socialDb.follows.delete(key);
  }
}

export async function setAuthorMuted(userId: string, authorId: string, muted: boolean): Promise<void> {
  const key = socialCompoundKey(userId, authorId);
  if (muted) {
    await socialDb.mutedAuthors.put({
      key,
      userId,
      authorId,
      createdAt: new Date().toISOString(),
    });
  } else {
    await socialDb.mutedAuthors.delete(key);
  }
}

export async function setUserBlocked(userId: string, blockedUserId: string, blocked: boolean): Promise<void> {
  const key = socialCompoundKey(userId, blockedUserId);
  if (blocked) {
    await socialDb.blockedUsers.put({
      key,
      userId,
      blockedUserId,
      createdAt: new Date().toISOString(),
    });
  } else {
    await socialDb.blockedUsers.delete(key);
  }
}

export async function addPostReport(row: Omit<PostReportRow, "id" | "createdAt"> & { createdAt?: string }): Promise<void> {
  await socialDb.postReports.add({
    userId: row.userId,
    postId: row.postId,
    authorId: row.authorId,
    reason: row.reason,
    details: row.details,
    createdAt: row.createdAt ?? new Date().toISOString(),
  });
}

export async function addUserReport(reporterId: string, reportedUserId: string, reason: string): Promise<void> {
  await socialDb.userReports.add({
    reporterId,
    reportedUserId,
    reason,
    createdAt: new Date().toISOString(),
  });
}

type PostLike = {
  id: string;
  userId?: string;
  authorId?: string;
};

/** Remove posts from muted/blocked authors; optionally restrict to following. */
export async function filterPostsForViewer<T extends PostLike>(
  posts: T[],
  viewerId: string,
  opts?: { followingOnly?: boolean },
): Promise<T[]> {
  const summary = await getSocialSummary(viewerId);
  const muted = new Set(summary.mutedAuthorIds);
  const blocked = new Set(summary.blockedUserIds);
  const following = new Set(summary.followingIds);
  return posts.filter((p) => {
    const aid = p.userId || p.authorId || "";
    if (!aid) return true;
    if (muted.has(aid) || blocked.has(aid)) return false;
    if (opts?.followingOnly && !following.has(aid)) return false;
    return true;
  });
}

export async function annotatePostsSaved<T extends { id: string }>(
  posts: T[],
  viewerId: string,
): Promise<(T & { savedByMe?: boolean })[]> {
  const summary = await getSocialSummary(viewerId);
  const saved = new Set(summary.savedPostIds);
  return posts.map((p) => ({ ...p, savedByMe: saved.has(p.id) }));
}

export async function listSavedPostMeta(userId: string): Promise<{ postId: string; savedAt: string }[]> {
  const rows = await socialDb.savedPosts.where("userId").equals(userId).toArray();
  return rows.map((r) => ({ postId: r.postId, savedAt: r.savedAt })).sort((a, b) => b.savedAt.localeCompare(a.savedAt));
}

export async function listMutedAuthors(userId: string): Promise<{ authorId: string; createdAt: string }[]> {
  const rows = await socialDb.mutedAuthors.where("userId").equals(userId).toArray();
  return rows.map((r) => ({ authorId: r.authorId, createdAt: r.createdAt }));
}

export async function listFollowing(userId: string): Promise<{ targetUserId: string; createdAt: string }[]> {
  const rows = await socialDb.follows.where("userId").equals(userId).toArray();
  return rows.map((r) => ({ targetUserId: r.targetUserId, createdAt: r.createdAt }));
}

/** Accounts that follow the given profile (incoming follows). */
export async function listFollowers(profileUserId: string): Promise<{ followerUserId: string; createdAt: string }[]> {
  const rows = await socialDb.follows.where("targetUserId").equals(profileUserId).toArray();
  return rows.map((r) => ({ followerUserId: r.userId, createdAt: r.createdAt }));
}

export async function listBlocked(userId: string): Promise<{ blockedUserId: string; createdAt: string }[]> {
  const rows = await socialDb.blockedUsers.where("userId").equals(userId).toArray();
  return rows.map((r) => ({ blockedUserId: r.blockedUserId, createdAt: r.createdAt }));
}
