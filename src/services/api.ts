/**
 * Base API client for making HTTP requests
 */

import { getMockData, tryMockApiWrite } from "@/lib/mockData";
import { handleSocialApiAsync } from "@/lib/socialMockApi";

export function getAuthHeaders(includeJsonContentType = false): Record<string, string> {
  const h: Record<string, string> = {};
  if (includeJsonContentType) {
    h["Content-Type"] = "application/json";
  }
  try {
    const t = localStorage.getItem("authToken");
    if (t) h["Authorization"] = `Bearer ${t}`;
    const raw = localStorage.getItem("currentUser");
    if (raw) {
      const j = JSON.parse(raw) as { id?: string };
      if (j?.id) h["X-Matchify-User-Id"] = j.id;
    }
  } catch {
    /* ignore */
  }
  return h;
}

function getApiBaseUrl(): string {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  return "";
}

/** No remote API — mock feed + IndexedDB (Dexie) social layer. */
export function isClientOnlyApi(): boolean {
  return !getApiBaseUrl();
}

/** Routes handled by IndexedDB in-app (backend often doesn’t implement them yet). */
export function isSocialPreferenceApiPath(pathname: string): boolean {
  const p = pathname.split("?")[0] || "";
  return (
    /^\/api\/users\/[^/]+\/social\//.test(p) ||
    /^\/api\/users\/[^/]+\/blocks/.test(p) ||
    /^\/api\/reports\/?$/.test(p)
  );
}

function pathnameFromFullUrl(fullUrl: string): string {
  try {
    if (fullUrl.startsWith("http://") || fullUrl.startsWith("https://")) {
      return new URL(fullUrl).pathname;
    }
  } catch {
    /* fall through */
  }
  const q = fullUrl.indexOf("?");
  return q >= 0 ? fullUrl.slice(0, q) : fullUrl;
}

export function buildApiUrl(url: string): string {
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  const baseUrl = getApiBaseUrl();
  const cleanBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  const cleanUrl = url.startsWith("/") ? url : `/${url}`;

  return baseUrl ? `${cleanBase}${cleanUrl}` : cleanUrl;
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const fullUrl = buildApiUrl(url);
  const pathOnly = pathnameFromFullUrl(fullUrl);
  const headers: Record<string, string> = {
    ...getAuthHeaders(!!data),
  };

  /** Prefer remote for social only when explicitly set (most backends don’t have these routes yet). */
  const socialOnServer = import.meta.env.VITE_SOCIAL_USE_REMOTE === "true";
  if (!socialOnServer && (isClientOnlyApi() || isSocialPreferenceApiPath(pathOnly))) {
    const socialRes = await handleSocialApiAsync(method, pathOnly, data);
    if (socialRes) return socialRes;
  }

  try {
    const res = await fetch(fullUrl, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });

    if (!res.ok && (res.status === 500 || res.status === 503 || res.status === 502) && method === "GET") {
      const mockData = getMockData(url);
      if (mockData !== null && mockData !== undefined) {
        return new Response(JSON.stringify(mockData), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    if (
      !res.ok &&
      (res.status === 502 || res.status === 503 || res.status === 504 || res.status === 404) &&
      method !== "GET"
    ) {
      const sr = await handleSocialApiAsync(method, pathOnly, data);
      if (sr) return sr;
      const mockRes = tryMockApiWrite(method, fullUrl, data);
      if (mockRes) return mockRes;
    }

    await throwIfResNotOk(res);
    return res;
  } catch (error) {
    const srCatch = await handleSocialApiAsync(method, pathOnly, data);
    if (srCatch) return srCatch;
    if (method === "GET") {
      const mockData = getMockData(url);
      if (mockData !== null && mockData !== undefined) {
        return new Response(JSON.stringify(mockData), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
    }
    const mockRes = tryMockApiWrite(method, fullUrl, data);
    if (mockRes) return mockRes;
    throw error;
  }
}

export async function apiRequestJson<T>(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<T> {
  const res = await apiRequest(method, url, data);
  return res.json();
}
