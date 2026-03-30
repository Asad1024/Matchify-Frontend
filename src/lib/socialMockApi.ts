import { getCurrentUserId, getMockData, lookupMockUser } from "@/lib/mockData";
import {
  addPostReport,
  addUserReport,
  annotatePostsSaved,
  filterPostsForViewer,
  getSocialSummary,
  listBlocked,
  listFollowers,
  listFollowing,
  listMutedAuthors,
  listSavedPostMeta,
  setAuthorMuted,
  setFollowing,
  setPostSaved,
  setUserBlocked,
} from "@/lib/socialPreferencesService";

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function parseBody(body: unknown): Record<string, unknown> {
  if (body == null || body === "") return {};
  if (typeof body === "string") {
    try {
      return JSON.parse(body) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  return body as Record<string, unknown>;
}

/**
 * Client-side “DB” (IndexedDB via Dexie) for social actions when no API base URL is configured.
 */
export async function handleSocialApiAsync(
  method: string,
  rawPath: string,
  body?: unknown,
): Promise<Response | null> {
  let path = rawPath;
  try {
    if (rawPath.includes("://")) path = new URL(rawPath).pathname;
  } catch {
    /* use raw */
  }
  const q = path.indexOf("?");
  if (q >= 0) path = path.slice(0, q);
  const m = method.toUpperCase();
  const b = parseBody(body);
  const headerViewer = getCurrentUserId();

  const summaryMatch = path.match(/^\/api\/users\/([^/]+)\/social\/summary\/?$/);
  if (m === "GET" && summaryMatch?.[1]) {
    const uid = summaryMatch[1];
    const s = await getSocialSummary(uid);
    return jsonResponse(s);
  }

  const savePostMatch = path.match(/^\/api\/users\/([^/]+)\/social\/save-post\/?$/);
  if (savePostMatch?.[1]) {
    const uid = savePostMatch[1];
    if (m === "POST") {
      const postId = typeof b.postId === "string" ? b.postId : "";
      if (!postId) return jsonResponse({ message: "postId required" }, 400);
      await setPostSaved(uid, postId, true);
      return jsonResponse({ ok: true, saved: true });
    }
  }

  const unsaveMatch = path.match(/^\/api\/users\/([^/]+)\/social\/save-post\/([^/]+)\/?$/);
  if (m === "DELETE" && unsaveMatch?.[1] && unsaveMatch[2]) {
    await setPostSaved(unsaveMatch[1], unsaveMatch[2], false);
    return jsonResponse({ ok: true, saved: false });
  }

  const followMatch = path.match(/^\/api\/users\/([^/]+)\/social\/follow\/?$/);
  if (followMatch?.[1]) {
    const uid = followMatch[1];
    if (m === "POST") {
      const targetUserId = typeof b.targetUserId === "string" ? b.targetUserId : "";
      if (!targetUserId) return jsonResponse({ message: "targetUserId required" }, 400);
      await setFollowing(uid, targetUserId, true);
      return jsonResponse({ ok: true, following: true });
    }
  }

  const unfollowMatch = path.match(/^\/api\/users\/([^/]+)\/social\/follow\/([^/]+)\/?$/);
  if (m === "DELETE" && unfollowMatch?.[1] && unfollowMatch[2]) {
    await setFollowing(unfollowMatch[1], unfollowMatch[2], false);
    return jsonResponse({ ok: true, following: false });
  }

  const muteMatch = path.match(/^\/api\/users\/([^/]+)\/social\/mute\/?$/);
  if (muteMatch?.[1]) {
    const uid = muteMatch[1];
    if (m === "POST") {
      const authorId = typeof b.authorId === "string" ? b.authorId : "";
      if (!authorId) return jsonResponse({ message: "authorId required" }, 400);
      await setAuthorMuted(uid, authorId, true);
      return jsonResponse({ ok: true, muted: true });
    }
  }

  const unmuteMatch = path.match(/^\/api\/users\/([^/]+)\/social\/mute\/([^/]+)\/?$/);
  if (m === "DELETE" && unmuteMatch?.[1] && unmuteMatch[2]) {
    await setAuthorMuted(unmuteMatch[1], unmuteMatch[2], false);
    return jsonResponse({ ok: true, muted: false });
  }

  const blocksPost = path.match(/^\/api\/users\/([^/]+)\/blocks\/?$/);
  if (blocksPost?.[1]) {
    const uid = blocksPost[1];
    if (m === "POST") {
      const blockedId = typeof b.blockedId === "string" ? b.blockedId : "";
      if (!blockedId) return jsonResponse({ message: "blockedId required" }, 400);
      await setUserBlocked(uid, blockedId, true);
      return jsonResponse({ ok: true, blocked: true });
    }
  }

  const unblockMatch = path.match(/^\/api\/users\/([^/]+)\/blocks\/([^/]+)\/?$/);
  if (m === "DELETE" && unblockMatch?.[1] && unblockMatch[2]) {
    await setUserBlocked(unblockMatch[1], unblockMatch[2], false);
    return jsonResponse({ ok: true, blocked: false });
  }

  const blockedListMatch = path.match(/^\/api\/users\/([^/]+)\/blocked\/?$/);
  if (m === "GET" && blockedListMatch?.[1]) {
    const uid = blockedListMatch[1];
    const rows = await listBlocked(uid);
    const users = rows
      .map((r) => {
        const u = lookupMockUser(r.blockedUserId);
        if (!u) return { id: r.blockedUserId, name: "User", email: "" };
        return { id: u.id, name: u.name, email: u.email, avatar: u.avatar };
      });
    return jsonResponse(users);
  }

  const reportPostMatch = path.match(/^\/api\/users\/([^/]+)\/social\/report-post\/?$/);
  if (m === "POST" && reportPostMatch?.[1]) {
    const uid = reportPostMatch[1];
    const postId = typeof b.postId === "string" ? b.postId : "";
    if (!postId) return jsonResponse({ message: "postId required" }, 400);
    await addPostReport({
      userId: uid,
      postId,
      authorId: typeof b.authorId === "string" ? b.authorId : undefined,
      reason: typeof b.reason === "string" ? b.reason : undefined,
      details: typeof b.details === "string" ? b.details : undefined,
    });
    return jsonResponse({ ok: true }, 201);
  }

  const savedListMatch = path.match(/^\/api\/users\/([^/]+)\/social\/saved-posts\/?$/);
  if (m === "GET" && savedListMatch?.[1]) {
    const uid = savedListMatch[1];
    const meta = await listSavedPostMeta(uid);
    const allPosts = (getMockData("/api/posts") as unknown[]) || [];
    const byId = new Map(
      (Array.isArray(allPosts) ? allPosts : []).map((p: any) => [p.id, p]),
    );
    const items = meta.map((mrow) => {
      const p = byId.get(mrow.postId) as Record<string, unknown> | undefined;
      return {
        postId: mrow.postId,
        savedAt: mrow.savedAt,
        preview: p
          ? {
              content: String(p.content || "").slice(0, 160),
              author: p.author || p.user || null,
              image: p.image || p.imageUrl || null,
            }
          : null,
      };
    });
    return jsonResponse({ items });
  }

  const socialListsMatch = path.match(/^\/api\/users\/([^/]+)\/social\/lists\/?$/);
  if (m === "GET" && socialListsMatch?.[1]) {
    const uid = socialListsMatch[1];
    const [following, followers, muted, blocked] = await Promise.all([
      listFollowing(uid),
      listFollowers(uid),
      listMutedAuthors(uid),
      listBlocked(uid),
    ]);
    const nameOf = (id: string) => lookupMockUser(id)?.name ?? "User";
    const avatarOf = (id: string) => lookupMockUser(id)?.avatar ?? null;
    const userRow = (id: string, createdAt: string) => ({
      userId: id,
      name: nameOf(id),
      avatar: avatarOf(id),
      createdAt,
    });
    return jsonResponse({
      following: following.map((r) => userRow(r.targetUserId, r.createdAt)),
      followers: followers.map((r) => userRow(r.followerUserId, r.createdAt)),
      muted: muted.map((r) => ({
        authorId: r.authorId,
        name: nameOf(r.authorId),
        avatar: avatarOf(r.authorId),
        createdAt: r.createdAt,
      })),
      blocked: blocked.map((r) => ({
        userId: r.blockedUserId,
        name: nameOf(r.blockedUserId),
        avatar: avatarOf(r.blockedUserId),
        createdAt: r.createdAt,
      })),
    });
  }

  if (m === "POST" && /^\/api\/reports\/?$/.test(path)) {
    const reportedId = typeof b.reportedId === "string" ? b.reportedId : "";
    const reason = typeof b.reason === "string" ? b.reason : "";
    if (!reportedId) return jsonResponse({ message: "reportedId required" }, 400);
    await addUserReport(headerViewer, reportedId, reason || "Report");
    return jsonResponse({ ok: true }, 201);
  }

  return null;
}

/** Used by feed fetch when serving mock posts. */
export async function applySocialToMockPosts<T extends { id: string; userId?: string; authorId?: string }>(
  posts: T[],
  viewerId: string | null,
  opts?: { followingOnly?: boolean },
): Promise<(T & { savedByMe?: boolean })[]> {
  if (!viewerId || !Array.isArray(posts)) return posts;
  const filtered = await filterPostsForViewer(posts, viewerId, opts);
  return annotatePostsSaved(filtered, viewerId);
}
