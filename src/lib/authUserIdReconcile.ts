import { getCurrentUserId, setCurrentUserId } from "@/lib/mockData";

/**
 * Read JWT `sub` without verifying signature (browser cannot verify without secret).
 * Used only to align `localStorage.currentUser.id` with the token the API trusts.
 */
export function readJwtSub(token: string): string | null {
  try {
    const p = token.split(".")[1];
    if (!p) return null;
    const b64 = p.replace(/-/g, "+").replace(/_/g, "/");
    const pad = b64.length % 4 ? "=".repeat(4 - (b64.length % 4)) : "";
    const json = JSON.parse(atob(b64 + pad)) as { sub?: string };
    const s = json?.sub;
    return typeof s === "string" && s.trim() ? s.trim() : null;
  } catch {
    return null;
  }
}

/**
 * Backend uses Bearer JWT `sub` for `/api/users/:id/*`. If `currentUser.id` drifts (merge bugs,
 * legacy shapes), the URL id ≠ sub → 403 → queryClient catch returns mock notifications → [] for real UUIDs.
 * Returns true if localStorage was updated.
 */
export function reconcileCurrentUserIdWithJwt(): boolean {
  try {
    const token = localStorage.getItem("authToken");
    if (!token) return false;
    const sub = readJwtSub(token);
    if (!sub) return false;
    const raw = localStorage.getItem("currentUser");
    if (!raw) return false;
    const u = JSON.parse(raw) as Record<string, unknown>;
    const curRaw = u.id ?? u.userId;
    const cur = typeof curRaw === "string" ? curRaw.trim() : "";
    if (!cur || cur === sub) return false;
    u.id = sub;
    u.userId = sub;
    localStorage.setItem("currentUser", JSON.stringify(u));
    setCurrentUserId(sub);
    return true;
  } catch {
    return false;
  }
}

export function getStoredUserIdFromCurrentUserJson(): string | null {
  try {
    const raw = localStorage.getItem("currentUser");
    if (raw) {
      const u = JSON.parse(raw) as { id?: string; userId?: string };
      if (u?.id) return String(u.id).trim();
      if (u?.userId) return String(u.userId).trim();
    }
  } catch {
    /* ignore */
  }
  return getCurrentUserId();
}

/** Reconcile JWT ↔ stored user, then read id (use for initial mount). */
export function getReconciledStoredUserId(): string | null {
  reconcileCurrentUserIdWithJwt();
  return getStoredUserIdFromCurrentUserJson();
}
