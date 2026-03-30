/** Luna API requires caller id header; JWT is also sent when present. */

import { buildApiUrl, getAuthHeaders } from "@/services/api";

export const getStoredUserId = (): string | null => {
  try {
    const raw = localStorage.getItem("currentUser");
    if (!raw) return null;
    const u = JSON.parse(raw) as { id?: string; userId?: string };
    return u.id || u.userId || null;
  } catch {
    return null;
  }
};

export const lunaHeaders = (): HeadersInit => {
  return { ...getAuthHeaders(true) };
};

export const lunaFetch = (input: string, init?: RequestInit): Promise<Response> => {
  const jsonBody = typeof init?.body === "string";
  const headers = new Headers({ ...getAuthHeaders(jsonBody) });
  const merged = new Headers(init?.headers);
  merged.forEach((v, k) => headers.set(k, v));
  return fetch(buildApiUrl(input), { ...init, headers, credentials: "include" });
};
