import { buildApiUrl, getAuthHeaders } from "@/services/api";

/** Keys stored under `users.profile.clientState.localStorage` (MySQL JSON) — not for auth tokens.
 * Keep `isClientStateSyncedKey` in matchify-app-style1-backend/src/clientStateSyncedKeys.ts in sync. */
const EXACT_KEYS = ["matchify_explore_mode", "matchify_notify_ai_pick_ready"] as const;

const PREFIX_KEYS = [
  "matchify_marriage_deck_",
  "matchify_marriage_chat_v1_",
  "matchify_muzz_",
  "matchify_profile_identity_lock_",
  "matchify_luna_assistant_v1_",
] as const;

function shouldSyncKey(key: string): boolean {
  if (EXACT_KEYS.includes(key as (typeof EXACT_KEYS)[number])) return true;
  if (PREFIX_KEYS.some((p) => key.startsWith(p))) return true;
  if (key.startsWith("matchify.profileIdentityLock.")) return true;
  // Entitlements, social gallery, identity locks (matchify:name:lockUntil:…)
  if (key.startsWith("matchify:")) {
    if (key.startsWith("matchify:plan_override:")) return false;
    return true;
  }
  return false;
}

/** Call after writes to any synced localStorage key so the server copy updates before the 15s interval. */
export function markClientStateDirty(): void {
  try {
    window.dispatchEvent(new Event("matchify-client-state-dirty"));
  } catch {
    /* ignore */
  }
}

function readSyncableLocalStorage(): Record<string, string> {
  const out: Record<string, string> = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k || !shouldSyncKey(k)) continue;
      const v = localStorage.getItem(k);
      if (typeof v === "string") out[k] = v;
    }
  } catch {
    /* ignore */
  }
  return out;
}

function applyLocalStorageMap(map: Record<string, string>): void {
  try {
    for (const [k, v] of Object.entries(map || {})) {
      if (!shouldSyncKey(k)) continue;
      localStorage.setItem(k, String(v));
    }
  } catch {
    /* ignore */
  }
}

export async function pullClientStateFromBackend(userId: string): Promise<void> {
  if (!userId) return;
  try {
    const res = await fetch(buildApiUrl(`/api/users/${userId}/client-state`), {
      method: "GET",
      headers: { ...getAuthHeaders(false) },
      credentials: "include",
    });
    if (!res.ok) return;
    const data = (await res.json()) as { localStorage?: Record<string, string> };
    if (data?.localStorage && typeof data.localStorage === "object") {
      applyLocalStorageMap(data.localStorage);
    }
  } catch {
    /* offline / unavailable */
  }
}

export async function pushClientStateToBackend(userId: string): Promise<void> {
  if (!userId) return;
  const payload = { localStorage: readSyncableLocalStorage() };
  try {
    await fetch(buildApiUrl(`/api/users/${userId}/client-state`), {
      method: "PATCH",
      headers: { ...getAuthHeaders(true) },
      credentials: "include",
      body: JSON.stringify(payload),
    });
  } catch {
    /* offline / unavailable */
  }
}

