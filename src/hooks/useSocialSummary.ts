import { useQuery } from "@tanstack/react-query";
import { useCurrentUser } from "@/contexts/UserContext";
import { apiRequestJson } from "@/services/api";
import type { SocialSummary } from "@/lib/socialPreferencesService";

export function useSocialSummaryQuery() {
  const { userId } = useCurrentUser();
  return useQuery({
    queryKey: ["/api/users", userId, "social-summary"],
    queryFn: async () => {
      const s = await apiRequestJson<SocialSummary>("GET", `/api/users/${userId}/social/summary`);
      return {
        ...s,
        savedPostIds: Array.isArray(s.savedPostIds) ? s.savedPostIds : [],
        followingIds: Array.isArray(s.followingIds) ? s.followingIds : [],
        mutedAuthorIds: Array.isArray(s.mutedAuthorIds) ? s.mutedAuthorIds : [],
        blockedUserIds: Array.isArray(s.blockedUserIds) ? s.blockedUserIds : [],
        reportedPostIds: Array.isArray(s.reportedPostIds) ? s.reportedPostIds : [],
      };
    },
    enabled: !!userId,
  });
}
