export type MembershipTier = "free" | "plus" | "premium" | "elite";

export function normalizeTier(raw: unknown): MembershipTier {
  const t = String(raw || "").toLowerCase().trim();
  if (t === "plus" || t === "premium" || t === "elite") return t;
  return "free";
}

const TIER_RANK: Record<MembershipTier, number> = {
  free: 0,
  plus: 1,
  premium: 2,
  elite: 3,
};

export function tierAtLeast(tier: MembershipTier, min: MembershipTier): boolean {
  return (TIER_RANK[tier] ?? 0) >= (TIER_RANK[min] ?? 0);
}

export function weeklyKey(prefix: string, userId: string): string {
  // ISO week-ish (good enough for client-side limits).
  const d = new Date();
  const year = d.getUTCFullYear();
  const week = Math.floor((Date.UTC(year, d.getUTCMonth(), d.getUTCDate()) - Date.UTC(year, 0, 1)) / 86400000 / 7);
  return `matchify:${prefix}:${userId}:${year}:w${week}`;
}

function safeGetInt(key: string): number {
  try {
    const raw = localStorage.getItem(key);
    const n = raw == null ? 0 : Number(raw);
    return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
  } catch {
    return 0;
  }
}

function safeSetInt(key: string, value: number): void {
  try {
    localStorage.setItem(key, String(Math.max(0, Math.floor(value))));
  } catch {
    /* ignore */
  }
}

export function complimentsWeeklyLimitForTier(tier: MembershipTier): number {
  if (tier === "free") return 3;
  if (tier === "plus") return 20;
  return Number.POSITIVE_INFINITY;
}

export function complimentsLeft(params: { userId: string; tier: MembershipTier }): number {
  const limit = complimentsWeeklyLimitForTier(params.tier);
  if (!Number.isFinite(limit)) return 9999;
  const used = safeGetInt(weeklyKey("compliments_used", params.userId));
  return Math.max(0, limit - used);
}

export function consumeCompliment(params: { userId: string; tier: MembershipTier }): { ok: true; left: number } | { ok: false; left: number } {
  const left = complimentsLeft(params);
  if (left < 1) return { ok: false, left };
  const key = weeklyKey("compliments_used", params.userId);
  const used = safeGetInt(key);
  safeSetInt(key, used + 1);
  return { ok: true, left: complimentsLeft(params) };
}

export function lunaDailyLimitForTier(tier: MembershipTier): number {
  if (tier === "free") return 0;
  if (tier === "plus") return 30;
  return Number.POSITIVE_INFINITY;
}

export function lunaPartnerDailyLimitForTier(tier: MembershipTier): number {
  if (tier === "free") return 0;
  if (tier === "plus") return 20;
  return Number.POSITIVE_INFINITY;
}

export function dailyKey(prefix: string, userId: string): string {
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `matchify:${prefix}:${userId}:${y}-${m}-${day}`;
}

export function dailyCount(key: string): number {
  return safeGetInt(key);
}

export function incrementDailyCount(key: string, by = 1): number {
  const cur = safeGetInt(key);
  const next = cur + Math.max(1, Math.floor(by));
  safeSetInt(key, next);
  return next;
}

