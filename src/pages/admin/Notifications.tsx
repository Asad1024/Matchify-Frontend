import { useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import AdminLayout from "@/components/admin/AdminLayout";
import NotificationItem from "@/components/notifications/NotificationItem";
import { EmptyNotifications } from "@/components/common/EmptyState";
import { LoadingState } from "@/components/common/LoadingState";
import { useCurrentUser } from "@/contexts/UserContext";
import { apiRequest, getNotificationsStreamUrl } from "@/services/api";
import { queryClient } from "@/lib/queryClient";

type AdminNotification = {
  id: string;
  userId: string;
  type: "match" | "message" | "event" | "system";
  title: string;
  message: string;
  read: boolean | null;
  createdAt: string | null;
  relatedEntityId?: string | null;
  relatedUserId?: string | null;
};

export default function AdminNotifications() {
  const { userId } = useCurrentUser();
  const [, setLocation] = useLocation();

  const { data: notifications = [], isLoading } = useQuery<AdminNotification[]>({
    queryKey: ["/api/users", userId, "notifications"],
    enabled: !!userId,
  });

  useEffect(() => {
    if (!userId) return;
    const es = new EventSource(getNotificationsStreamUrl(userId));
    const invalidate = () => {
      void queryClient.invalidateQueries({ queryKey: ["/api/users", userId, "notifications"] });
    };
    es.onopen = () => invalidate();
    es.onmessage = () => invalidate();
    return () => es.close();
  }, [userId]);

  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("PATCH", `/api/notifications/${id}/read`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users", userId, "notifications"] });
    },
  });

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 space-y-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Notifications</h1>
          <p className="text-sm text-muted-foreground">System alerts and request updates for admin</p>
        </div>

        {isLoading ? (
          <div className="py-8">
            <LoadingState message="Loading notifications..." showMascot={true} />
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-8">
            <EmptyNotifications />
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border/70 bg-card">
            <div className="divide-y divide-border/70">
              {notifications.map((n) => (
                <NotificationItem
                  key={n.id}
                  id={n.id}
                  type={n.type || "system"}
                  title={n.title}
                  message={n.message}
                  read={!!n.read}
                  timestamp={n.createdAt ? new Date(n.createdAt).toLocaleString() : "Just now"}
                  onClick={(id) => {
                    if (!n.read) markReadMutation.mutate(id);
                    const bookingId = n.relatedEntityId?.trim();
                    const coachRelated =
                      /coach/i.test(n.title) ||
                      /coach/i.test(n.message) ||
                      /booking/i.test(n.message);
                    if (bookingId && coachRelated) {
                      setLocation(
                        `/admin/coaches?tab=bookings&booking=${encodeURIComponent(bookingId)}`,
                      );
                    }
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
