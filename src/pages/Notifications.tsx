import { useState, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import Header from "@/components/common/Header";
import PageWrapper from "@/components/common/PageWrapper";
import NotificationItem from "@/components/notifications/NotificationItem";
import BottomNav from "@/components/common/BottomNav";
import { EmptyNotifications } from "@/components/common/EmptyState";
import { LoadingState } from "@/components/common/LoadingState";
import { useCurrentUser } from "@/contexts/UserContext";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest, queryClient } from "@/lib/queryClient";

type Notification = {
  id: string;
  userId: string;
  type: "match" | "message" | "event" | "system";
  title: string;
  message: string;
  read: boolean | null;
  createdAt: Date | null;
  relatedUserId?: string | null;
  relatedEntityId?: string | null;
};

export default function Notifications() {
  const [notificationTab, setNotificationTab] = useState("all");
  const [, setLocation] = useLocation();
  const { userId } = useCurrentUser();
  const { logout } = useAuth();

  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ["/api/users", userId, "notifications"],
    enabled: !!userId,
  });

  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("PATCH", `/api/notifications/${id}/read`, {});
      if (!res.ok) throw new Error("Failed to mark read");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users", userId, "notifications"] });
    },
  });

  const safeNotifications = Array.isArray(notifications) ? notifications : [];

  const matchNotifications = safeNotifications.filter((n) => n.type === "match");
  const messageNotifications = safeNotifications.filter((n) => n.type === "message");
  const eventNotifications = safeNotifications.filter((n) => n.type === "event");
  const systemNotifications = safeNotifications.filter((n) => n.type === "system");

  const handleNotificationClick = useCallback(
    (n: Notification) => {
      if (!n.read) {
        markReadMutation.mutate(n.id);
      }
      const other = n.relatedUserId;
      const entity = n.relatedEntityId;

      switch (n.type) {
        case "match":
          if (other) {
            setLocation(`/profile/${other}`);
          } else {
            setLocation("/directory");
          }
          break;
        case "message":
          if (other) {
            setLocation(`/chat?user=${encodeURIComponent(other)}`);
          } else {
            setLocation("/chat");
          }
          break;
        case "event":
          if (entity) {
            setLocation(`/events/${entity}`);
          } else {
            setLocation("/events");
          }
          break;
        case "system":
        default:
          setLocation("/menu");
          break;
      }
    },
    [markReadMutation, setLocation],
  );

  const formatRow = (n: Notification) => ({
    ...n,
    read: n.read || false,
    timestamp: n.createdAt ? new Date(n.createdAt).toLocaleString() : "Just now",
    user:
      n.type === "match" || n.type === "message"
        ? { name: n.title?.replace(/^New match:?\s*/i, "").trim() || "Member" }
        : undefined,
  });

  const tabRows =
    notificationTab === "all"
      ? safeNotifications.map(formatRow)
      : notificationTab === "matches"
        ? matchNotifications.map(formatRow)
        : notificationTab === "messages"
          ? messageNotifications.map(formatRow)
          : notificationTab === "events"
            ? eventNotifications.map(formatRow)
            : systemNotifications.map(formatRow);

  return (
    <PageWrapper>
      <div className="min-h-screen bg-gray-50 pb-24">
        <Header showSearch={false} onLogout={logout} title="Notifications" />

        <div className="max-w-lg mx-auto">
          {isLoading ? (
            <div className="py-12">
              <LoadingState message="Loading notifications..." showMascot={true} />
            </div>
          ) : safeNotifications.length === 0 ? (
            <div className="py-12">
              <EmptyNotifications />
            </div>
          ) : (
            <>
              <div className="bg-white border-b border-gray-100 px-4 py-3">
                <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                  {[
                    { value: "all", label: `All (${safeNotifications.length})` },
                    { value: "matches", label: `Matches (${matchNotifications.length})` },
                    { value: "messages", label: `Messages (${messageNotifications.length})` },
                    { value: "events", label: `Events (${eventNotifications.length})` },
                    { value: "system", label: `System (${systemNotifications.length})` },
                  ].map((tab) => (
                    <button
                      key={tab.value}
                      onClick={() => setNotificationTab(tab.value)}
                      className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                        notificationTab === tab.value
                          ? "bg-primary text-white"
                          : "bg-gray-100 text-gray-500"
                      }`}
                      data-testid={`tab-${tab.value}`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="divide-y divide-gray-50 bg-white">
                {tabRows.map((row) => (
                  <NotificationItem
                    key={row.id}
                    id={row.id}
                    type={row.type}
                    title={row.title}
                    message={row.message}
                    read={row.read}
                    timestamp={row.timestamp}
                    user={row.user}
                    onClick={(id) => {
                      const raw = safeNotifications.find((x) => x.id === id);
                      if (raw) handleNotificationClick(raw);
                    }}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        <BottomNav active="menu" />
      </div>
    </PageWrapper>
  );
}
