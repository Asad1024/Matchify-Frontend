import { buildApiUrl, getAuthHeaders } from "@/services/api";

const EXACT_KEYS = [
  "matchify_explore_mode",
] as const;

const PREFIX_KEYS = [
  "matchify_marriage_deck_",
  "matchify_marriage_chat_v1_",
  "matchify_muzz_",
  "matchify_profile_identity_lock_",
] as const;

function shouldSyncKey(key: string): boolean {
  if (EXACT_KEYS.includes(key as (typeof EXACT_KEYS)[number])) return true;
  return PREFIX_KEYS.some((p) => key.startsWith(p));
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

