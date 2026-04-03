import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { apiRequest, buildApiUrl, getAuthHeaders } from "@/services/api";
import { getMockData } from "./mockData";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// Re-export apiRequest for backward compatibility
export { apiRequest } from "@/services/api";

type UnauthorizedBehavior = "returnNull" | "throw";
export function getQueryFn<T>(options: {
  on401: UnauthorizedBehavior;
}): QueryFunction<T> {
  return async ({ queryKey }) => {
    try {
      const url = queryKey.join("/");
      const res = await fetch(buildApiUrl(url), {
        credentials: "include",
        headers: getAuthHeaders(false),
      });

      if (res.status === 401) {
        if (options.on401 === "returnNull") {
          return null as T;
        }
        await throwIfResNotOk(res);
      }

      // Auth / client errors must surface — do not silently return [] (breaks "My bookings", etc.)
      if (res.status === 403) {
        await throwIfResNotOk(res);
      }

      // Backend down or missing route: prefer mock/offline data, else empty list
      if (res.status === 404 || res.status === 500 || res.status === 503 || res.status === 502) {
        const mockData = getMockData(url);
        if (mockData !== null && mockData !== undefined) {
          return mockData as T;
        }
        return [] as T;
      }

      if (!res.ok) {
        await throwIfResNotOk(res);
      }

      const jsonData = await res.json();
      return jsonData as T;
    } catch (error) {
      const url = queryKey.join("/");
      // Never substitute mock data for the real notifications list (hides DB rows; breaks AI invites after refresh).
      if (url.includes("/notifications")) {
        throw error instanceof Error ? error : new Error(String(error));
      }
      // Do not mask auth failures with empty mock data (e.g. 403 when URL userId ≠ JWT sub).
      if (error instanceof Error && /^(401|403):/.test(error.message)) {
        throw error;
      }
      // Network errors or other fetch failures - use mock data silently
      const mockData = getMockData(url);
      if (mockData !== null && mockData !== undefined) {
        return mockData as T;
      }
      return [] as T;
    }
  };
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
