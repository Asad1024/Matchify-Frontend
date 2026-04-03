import Dexie, { type Table } from "dexie";

export type SavedPostRow = {
  key: string;
  userId: string;
  postId: string;
  savedAt: string;
};

export type FollowRow = {
  key: string;
  userId: string;
  targetUserId: string;
  createdAt: string;
};

export type MutedAuthorRow = {
  key: string;
  userId: string;
  authorId: string;
  createdAt: string;
};

export type BlockedUserRow = {
  key: string;
  userId: string;
  blockedUserId: string;
  createdAt: string;
};

export type PostReportRow = {
  id?: number;
  userId: string;
  postId: string;
  authorId?: string;
  /** Snapshot at report time so Feed preferences can show real users without mock lookup. */
  authorName?: string;
  authorAvatar?: string | null;
  postPreview?: string | null;
  reason?: string;
  details?: string;
  createdAt: string;
};

export type UserReportRow = {
  id?: number;
  reporterId: string;
  reportedUserId: string;
  reason?: string;
  createdAt: string;
};

function compound(userId: string, second: string): string {
  return `${userId}::${second}`;
}

export class MatchifySocialDB extends Dexie {
  savedPosts!: Table<SavedPostRow, string>;
  follows!: Table<FollowRow, string>;
  mutedAuthors!: Table<MutedAuthorRow, string>;
  blockedUsers!: Table<BlockedUserRow, string>;
  postReports!: Table<PostReportRow, number>;
  userReports!: Table<UserReportRow, number>;

  constructor() {
    super("matchify_social_db");
    this.version(1).stores({
      savedPosts: "key, userId, postId",
      follows: "key, userId, targetUserId",
      mutedAuthors: "key, userId, authorId",
      blockedUsers: "key, userId, blockedUserId",
      postReports: "++id, userId, postId",
      userReports: "++id, reporterId, reportedUserId",
    });
    this.version(2).stores({
      savedPosts: "key, userId, postId",
      follows: "key, userId, targetUserId",
      mutedAuthors: "key, userId, authorId",
      blockedUsers: "key, userId, blockedUserId",
      postReports: "++id, userId, postId",
      userReports: "++id, reporterId, reportedUserId",
    });
  }
}

export const socialDb = new MatchifySocialDB();

export { compound as socialCompoundKey };
