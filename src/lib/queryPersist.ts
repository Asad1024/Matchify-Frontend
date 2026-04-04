import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import type { PersistQueryClientOptions } from "@tanstack/react-query-persist-client";

const STORAGE_KEY = "matchify.tanstack.query.v1";
/** Keep persisted blobs from going stale before we rehydrate (see TanStack persist docs). */
export const PERSIST_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 7;

const persister = createSyncStoragePersister({
  storage: window.localStorage,
  key: STORAGE_KEY,
});

function isPostsFeedQueryKey(key: readonly unknown[]): boolean {
  if (key.length !== 2 || key[0] !== "/api/posts") return false;
  const v = key[1];
  return typeof v === "object" && v !== null && !Array.isArray(v) && "viewer" in v;
}

/**
 * Shared options for `useQuery` on the viewer-scoped posts list (same key shape we persist).
 * After hydrating from disk, still refetch on mount because default `staleTime: Infinity` would never update otherwise.
 */
export const postsFeedQueryOptions = {
  refetchOnMount: "always" as const,
};

/**
 * Only persist the viewer-scoped posts list (`["/api/posts", { viewer }]`).
 * `buster` is tied to the signed-in user so another account on the same device does not reuse the feed.
 */
export function getPostsPersistOptions(userId: string | null): Omit<
  PersistQueryClientOptions,
  "queryClient"
> {
  return {
    persister,
    maxAge: PERSIST_MAX_AGE_MS,
    buster: userId ?? "__anon__",
    dehydrateOptions: {
      shouldDehydrateQuery: (query) => isPostsFeedQueryKey(query.queryKey),
    },
  };
}
