import { socialDb, socialCompoundKey, type PostReportRow } from "@/lib/socialPreferencesDb";
import { lookupMockUser } from "@/lib/mockData";

export type SocialSummary = {
  savedPostIds: string[];
  followingIds: string[];
  mutedAuthorIds: string[];
  blockedUserIds: string[];
  /** Posts this viewer reported — hidden from feed until cleared in Feed preferences. */
  reportedPostIds: string[];
  /** Users who follow this profile (IndexedDB / local handler only unless API adds it). */
  followerCount?: number;
  /** API may send this when `followingIds` is omitted (public profile summary). */
  followingCount?: number;
};

export type SocialListsReportedRow = {
  postId: string;
  authorId?: string;
  reason?: string;
  details?: string;
  createdAt: string;
  authorName?: string;
  authorAvatar?: string | null;
  preview?: string | null;
};

export async function listPostReportsMeta(
  userId: string,
): Promise<
  {
    postId: string;
    authorId?: string;
    authorName?: string;
    authorAvatar?: string | null;
    postPreview?: string | null;
    reason?: string;
    details?: string;
    createdAt: string;
  }[]
> {
  const rows = await socialDb.postReports.where("userId").equals(userId).toArray();
  rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const seen = new Set<string>();
  const deduped: typeof rows = [];
  for (const r of rows) {
    if (seen.has(r.postId)) continue;
    seen.add(r.postId);
    deduped.push(r);
  }
  return deduped.map((r) => ({
    postId: r.postId,
    authorId: r.authorId,
    authorName: r.authorName,
    authorAvatar: r.authorAvatar,
    postPreview: r.postPreview,
    reason: r.reason,
    details: r.details,
    createdAt: r.createdAt,
  }));
}

/** True for empty or API placeholder labels — prefer Dexie snapshot or id fallback in UI. */
export function isGenericReportAuthorLabel(name: string | undefined | null): boolean {
  const t = String(name ?? "").trim();
  return !t || t === "User" || t === "Unknown" || t === "Unknown author";
}

/** Ensures Feed preferences shows reports from IndexedDB even when GET /social/lists came from the API without them. */
export async function mergeReportedPostsIntoLists<T extends { reportedPosts?: SocialListsReportedRow[] }>(
  userId: string,
  lists: T,
): Promise<T & { reportedPosts: SocialListsReportedRow[] }> {
  const local = await listPostReportsMeta(userId);
  const fromServer = lists.reportedPosts ?? [];
  const byId = new Map<string, SocialListsReportedRow>();
  for (const r of fromServer) {
    if (r?.postId) byId.set(r.postId, r);
  }
  for (const r of local) {
    const aid = r.authorId || "";
    const mock = aid ? lookupMockUser(aid) : undefined;
    const fromLocal: Pick<SocialListsReportedRow, "authorName" | "authorAvatar" | "preview"> = {
      authorName: r.authorName?.trim() || mock?.name,
      authorAvatar: r.authorAvatar ?? mock?.avatar ?? null,
      preview: r.postPreview ?? null,
    };
    const existing = byId.get(r.postId);
    if (existing) {
      const mergedName = !isGenericReportAuthorLabel(existing.authorName)
        ? String(existing.authorName).trim()
        : fromLocal.authorName?.trim() ||
          String(existing.authorName ?? "").trim() ||
          (aid ? mock?.name ?? "User" : "Unknown");
      const mergedAvatar =
        (existing.authorAvatar != null && String(existing.authorAvatar).trim()
          ? existing.authorAvatar
          : null) ??
        fromLocal.authorAvatar ??
        null;
      const mergedPreview =
        existing.preview != null && String(existing.preview).trim()
          ? existing.preview
          : fromLocal.preview ?? null;
      byId.set(r.postId, {
        ...existing,
        authorName: mergedName,
        authorAvatar: mergedAvatar,
        preview: mergedPreview,
      });
      continue;
    }
    byId.set(r.postId, {
      postId: r.postId,
      authorId: aid || undefined,
      reason: r.reason,
      details: r.details,
      createdAt: r.createdAt,
      authorName: fromLocal.authorName || (aid ? mock?.name ?? "User" : "Unknown"),
      authorAvatar: fromLocal.authorAvatar,
      preview: fromLocal.preview,
    });
  }
  const reportedPosts = Array.from(byId.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return { ...lists, reportedPosts };
}

export async function getSocialSummary(userId: string): Promise<SocialSummary> {
  const [saved, follows, muted, blocked, followerCount, reportedMeta] = await Promise.all([
    socialDb.savedPosts.where("userId").equals(userId).toArray(),
    socialDb.follows.where("userId").equals(userId).toArray(),
    socialDb.mutedAuthors.where("userId").equals(userId).toArray(),
    socialDb.blockedUsers.where("userId").equals(userId).toArray(),
    socialDb.follows.where("targetUserId").equals(userId).count(),
    listPostReportsMeta(userId),
  ]);
  return {
    savedPostIds: saved.map((r) => r.postId),
    followingIds: follows.map((r) => r.targetUserId),
    mutedAuthorIds: muted.map((r) => r.authorId),
    blockedUserIds: blocked.map((r) => r.blockedUserId),
    reportedPostIds: reportedMeta.map((r) => r.postId),
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

export async function addPostReport(
  row: Omit<PostReportRow, "id" | "createdAt"> & { createdAt?: string },
): Promise<void> {
  await socialDb.postReports.add({
    userId: row.userId,
    postId: row.postId,
    authorId: row.authorId,
    authorName: row.authorName,
    authorAvatar: row.authorAvatar,
    postPreview: row.postPreview,
    reason: row.reason,
    details: row.details,
    createdAt: row.createdAt ?? new Date().toISOString(),
  });
}

export async function removePostReport(userId: string, postId: string): Promise<void> {
  await socialDb.postReports
    .where("userId")
    .equals(userId)
    .filter((r) => r.postId === postId)
    .delete();
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
  const reportedPosts = new Set(summary.reportedPostIds);
  return posts.filter((p) => {
    if (reportedPosts.has(p.id)) return false;
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
