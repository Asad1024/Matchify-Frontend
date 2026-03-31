import { useState, useCallback, useEffect, useMemo } from "react";
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
import {
  isMarriageSyntheticNotificationId,
  markMarriageSyntheticNotificationRead,
  marriageNotificationsForUser,
} from "@/lib/marriageChatRequests";
import { notificationCreatedAtMs } from "@/lib/utils";

type Notification = {
  id: string;
  userId: string;
  type:
    | "match"
    | "message"
    | "event"
    | "system"
    | "curated_match"
    | "marriage_chat_request"
    | "marriage_chat_accepted";
  title: string;
  message: string;
  read: boolean | null;
  createdAt: Date | string | null;
  relatedUserId?: string | null;
  relatedEntityId?: string | null;
};

export default function Notifications() {
  const [notificationTab, setNotificationTab] = useState("all");
  const [, setLocation] = useLocation();
  const { userId } = useCurrentUser();
  const { logout } = useAuth();
  const [marriageEpoch, setMarriageEpoch] = useState(0);

  useEffect(() => {
    const onUpd = () => setMarriageEpoch((e) => e + 1);
    window.addEventListener("matchify-marriage-chat-updated", onUpd);
    return () => window.removeEventListener("matchify-marriage-chat-updated", onUpd);
  }, []);

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

  const mergedNotifications = useMemo(() => {
    void marriageEpoch;
    if (!userId) return safeNotifications;
    const marriageRows: Notification[] = marriageNotificationsForUser(userId).map((m) => ({
      id: m.id,
      userId: m.userId,
      type: m.type,
      title: m.title,
      message: m.message,
      read: m.read,
      createdAt: m.createdAt ? new Date(m.createdAt) : null,
      relatedUserId: m.relatedUserId ?? undefined,
    }));
    return [...marriageRows, ...safeNotifications].sort(
      (a, b) => notificationCreatedAtMs(b.createdAt) - notificationCreatedAtMs(a.createdAt),
    );
  }, [userId, marriageEpoch, safeNotifications]);

  const matchNotifications = mergedNotifications.filter(
    (n) => n.type === "match" || n.type === "curated_match",
  );
  const messageNotifications = mergedNotifications.filter((n) => n.type === "message");
  const eventNotifications = mergedNotifications.filter((n) => n.type === "event");
  const systemNotifications = mergedNotifications.filter((n) => n.type === "system");

  const handleNotificationClick = useCallback(
    (n: Notification) => {
      if (userId && isMarriageSyntheticNotificationId(n.id)) {
        if (!n.read) {
          markMarriageSyntheticNotificationRead(userId, n.id);
          setMarriageEpoch((e) => e + 1);
        }
        if (n.relatedUserId) {
          setLocation(`/chat?user=${encodeURIComponent(n.relatedUserId)}`);
        }
        return;
      }
      if (!n.read) {
        markReadMutation.mutate(n.id);
      }
      const other = n.relatedUserId;
      const entity = n.relatedEntityId;

      switch (n.type) {
        case "match":
          // Matches should open the curated area so users see the card immediately.
          setLocation("/directory?tab=curated");
          break;
        case "curated_match":
          setLocation("/directory?tab=curated");
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
    [markReadMutation, setLocation, userId],
  );

  const formatRow = (n: Notification) => ({
    ...n,
    read: n.read || false,
    timestamp: n.createdAt ? new Date(n.createdAt).toLocaleString() : "Just now",
    user:
      n.type === "match" || n.type === "curated_match" || n.type === "message"
        ? { name: n.title?.replace(/^New match:?\s*/i, "").trim() || "Member" }
        : undefined,
  });

  const tabRows =
    notificationTab === "all"
      ? mergedNotifications.map(formatRow)
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
          ) : mergedNotifications.length === 0 ? (
            <div className="py-12">
              <EmptyNotifications />
            </div>
          ) : (
            <>
              <div className="bg-white border-b border-gray-100 px-4 py-3">
                <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                  {[
                    { value: "all", label: `All (${mergedNotifications.length})` },
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
                      const raw = mergedNotifications.find((x) => x.id === id);
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
