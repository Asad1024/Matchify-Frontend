import type { Story } from "@shared/schema";

export type StoryRing = {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  stories: Story[];
  hasUnread: boolean;
};

/** One ring per author; stories ordered oldest-first inside each ring (tap-through order). */
export function groupStoriesIntoRings(stories: Story[]): StoryRing[] {
  const byUser = new Map<string, Story[]>();
  const order: string[] = [];

  for (const s of stories) {
    const uid = s.userId;
    if (!byUser.has(uid)) {
      byUser.set(uid, []);
      order.push(uid);
    }
    byUser.get(uid)!.push(s);
  }

  return order.map((userId) => {
    const group = byUser.get(userId)!;
    const sorted = [...group].sort((a, b) => {
      const ta = new Date(a.createdAt ?? 0).getTime();
      const tb = new Date(b.createdAt ?? 0).getTime();
      return ta - tb;
    });
    const u = sorted[0]?.user;
    const displayName = u?.name?.trim() || "Member";
    const avatarUrl = u?.avatar ?? null;
    return {
      userId,
      displayName,
      avatarUrl,
      stories: sorted,
      hasUnread: sorted.some((x) => x.hasUnread),
    };
  });
}
