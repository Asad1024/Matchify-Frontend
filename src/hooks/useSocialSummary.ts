import { useQuery } from "@tanstack/react-query";
import { useCurrentUser } from "@/contexts/UserContext";
import { apiRequestJson } from "@/services/api";
import type { SocialSummary } from "@/lib/socialPreferencesService";

export function useSocialSummaryQuery() {
  const { userId } = useCurrentUser();
  return useQuery({
    queryKey: ["/api/users", userId, "social-summary"],
    queryFn: () => apiRequestJson<SocialSummary>("GET", `/api/users/${userId}/social/summary`),
    enabled: !!userId,
  });
}
