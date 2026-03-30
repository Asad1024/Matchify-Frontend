import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import Header from "@/components/common/Header";
import BottomNav from "@/components/common/BottomNav";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft } from "lucide-react";
import { useCurrentUser } from "@/contexts/UserContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { apiRequestJson } from "@/services/api";
import { LoadingState } from "@/components/common/LoadingState";

type ListPerson = {
  userId: string;
  name: string;
  avatar?: string | null;
  createdAt: string;
};

type SocialLists = {
  following: ListPerson[];
  followers: ListPerson[];
};

const CONNECTIONS_TABS = new Set(["following", "followers"]);

export default function SocialConnectionsPage() {
  const [, setLocation] = useLocation();
  const { userId } = useCurrentUser();
  const { logout } = useAuth();
  const { toast } = useToast();
  const [tab, setTab] = useState<"following" | "followers">("following");

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("tab");
    if (t && CONNECTIONS_TABS.has(t)) {
      setTab(t as "following" | "followers");
    }
  }, []);

  const syncUrl = (next: "following" | "followers") => {
    setTab(next);
    setLocation(`/settings/social/connections?tab=${next}`);
  };

  const { data: lists, isLoading } = useQuery({
    queryKey: ["/api/users", userId, "social-feed-lists"],
    queryFn: () => apiRequestJson<SocialLists>("GET", `/api/users/${userId}/social/lists`),
    enabled: !!userId,
  });

  const invalidateAll = () => {
    if (!userId) return;
    void queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
    void queryClient.invalidateQueries({ queryKey: ["/api/users", userId, "social-summary"] });
    void queryClient.invalidateQueries({ queryKey: ["/api/users", userId, "social-feed-lists"] });
    void queryClient.invalidateQueries({ queryKey: ["/api/users", userId, "social-saved-posts"] });
    void queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/blocked`] });
  };

  const unfollowMutation = useMutation({
    mutationFn: (targetUserId: string) =>
      apiRequest("DELETE", `/api/users/${userId}/social/follow/${encodeURIComponent(targetUserId)}`),
    onSuccess: () => {
      invalidateAll();
      toast({ title: "Unfollowed" });
    },
    onError: () => toast({ title: "Couldn’t unfollow", variant: "destructive" }),
  });

  if (!userId) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <Header showSearch={false} onLogout={logout} title="Following & followers" />
      <div className="mx-auto mt-2 max-w-lg px-3">
        <Button
          type="button"
          variant="ghost"
          className="-ml-2 mb-2 h-10 px-2 text-gray-700"
          onClick={() => setLocation("/settings/social")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Feed preferences
        </Button>

        <Tabs value={tab} onValueChange={(v) => syncUrl(v as "following" | "followers")} className="w-full">
          <TabsList className="grid h-11 w-full grid-cols-2 rounded-xl bg-gray-200/50 p-1">
            <TabsTrigger
              value="following"
              className="rounded-lg text-sm font-semibold data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              Following
            </TabsTrigger>
            <TabsTrigger
              value="followers"
              className="rounded-lg text-sm font-semibold data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              Followers
            </TabsTrigger>
          </TabsList>

          <TabsContent value="following" className="mt-4 focus-visible:outline-none data-[state=inactive]:hidden">
            {isLoading ? (
              <LoadingState message="Loading…" showMascot />
            ) : !lists?.following?.length ? (
              <p className="rounded-xl border border-gray-100 bg-white px-4 py-8 text-center text-sm text-muted-foreground">
                You’re not following anyone yet. Follow people from a post’s ⋯ menu.
              </p>
            ) : (
              <ul className="space-y-2">
                {lists.following.map((u) => (
                  <li
                    key={u.userId}
                    className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 bg-white p-3 shadow-sm"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <Avatar className="h-11 w-11 shrink-0 border border-gray-100">
                        <AvatarImage src={u.avatar?.trim() || undefined} alt="" className="object-cover" />
                        <AvatarFallback className="bg-primary/10 text-sm font-bold text-primary">
                          {u.name?.slice(0, 2).toUpperCase() || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">{u.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Since {new Date(u.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="text-muted-foreground"
                        onClick={() => setLocation(`/profile/${encodeURIComponent(u.userId)}`)}
                      >
                        Profile
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={unfollowMutation.isPending}
                        onClick={() => unfollowMutation.mutate(u.userId)}
                      >
                        Unfollow
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>

          <TabsContent value="followers" className="mt-4 focus-visible:outline-none data-[state=inactive]:hidden">
            {isLoading ? (
              <LoadingState message="Loading…" showMascot />
            ) : !lists?.followers?.length ? (
              <p className="rounded-xl border border-gray-100 bg-white px-4 py-8 text-center text-sm text-muted-foreground">
                No followers yet. When someone follows you in this app on this device, they’ll show up here.
              </p>
            ) : (
              <ul className="space-y-2">
                {lists.followers.map((u) => (
                  <li
                    key={u.userId}
                    className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 bg-white p-3 shadow-sm"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <Avatar className="h-11 w-11 shrink-0 border border-gray-100">
                        <AvatarImage src={u.avatar?.trim() || undefined} alt="" className="object-cover" />
                        <AvatarFallback className="bg-primary/10 text-sm font-bold text-primary">
                          {u.name?.slice(0, 2).toUpperCase() || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">{u.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Since {new Date(u.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setLocation(`/profile/${encodeURIComponent(u.userId)}`)}
                    >
                      View profile
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>
        </Tabs>
      </div>
      <BottomNav active="menu" />
    </div>
  );
}
