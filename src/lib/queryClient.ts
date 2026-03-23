import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { apiRequest } from "@/services/api";
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
      const res = await fetch(url, {
        credentials: "include",
      });

      if (options.on401 === "returnNull" && res.status === 401) {
        return null as T;
      }

      // If backend is not available (404, 500, 503, 502) or any error, use mock data silently
      // Suppress console errors for backend unavailability or missing endpoints
      if (res.status === 404 || res.status === 500 || res.status === 503 || res.status === 502 || !res.ok) {
        const mockData = getMockData(url);
        if (mockData !== null && mockData !== undefined) {
          return mockData as T;
        }
        // If no mock data available, return empty array/object based on expected type
        return [] as T;
      }

      await throwIfResNotOk(res);
      const jsonData = await res.json();
      return jsonData as T;
    } catch (error) {
      // Network errors or other fetch failures - use mock data silently
      // Suppress console errors for network failures
      const url = queryKey.join("/");
      const mockData = getMockData(url);
      if (mockData !== null && mockData !== undefined) {
        return mockData as T;
      }
      // If no mock data available, return empty array/object
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
