/** Luna API requires the logged-in user id (matches backend `X-Matchify-User-Id`). */

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
  const id = getStoredUserId();
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (id) h["X-Matchify-User-Id"] = id;
  return h;
};

export const lunaFetch = (input: string, init?: RequestInit): Promise<Response> => {
  const headers = new Headers(init?.headers);
  const id = getStoredUserId();
  if (id) headers.set("X-Matchify-User-Id", id);
  return fetch(input, { ...init, headers });
};
