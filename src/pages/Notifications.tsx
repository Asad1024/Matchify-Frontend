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
import { buildApiUrl, getAuthHeaders, getNotificationsStreamUrl } from "@/services/api";
import { Button } from "@/components/ui/button";
import {
  filterMarriageSyntheticDuplicatesAgainstApi,
  isMarriageSyntheticNotificationId,
  markMarriageSyntheticNotificationRead,
  marriageNotificationsForUser,
  patchMarriageIncomingDecision,
  removeMarriageSyntheticNotification,
} from "@/lib/marriageChatRequests";
import { normalizeNotificationRowFromApi, notificationRequestIdForPatch } from "@/lib/notificationRow";
import { notificationCreatedAtMs } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useUpgrade } from "@/contexts/UpgradeContext";
import { refreshChatRequestQueries } from "@/lib/chatRequestsApi";

/** Shown on Message requests page instead of the main bell list. */
const BELL_HIDDEN_NOTIFICATION_TYPES = new Set(["chat_request_sent", "chat_request_outgoing_declined"]);

type Notification = {
  id: string;
  userId: string;
  type:
    | "match"
    | "message"
    | "event"
    | "ai_event_invite"
    | "system"
    | "curated_match"
    | "marriage_chat_request"
    | "marriage_chat_accepted"
    | "chat_request"
    | "chat_request_accepted"
    | "chat_request_declined"
    | "chat_request_you_accepted";
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
  const { tier, requireTier } = useUpgrade();
  const { toast } = useToast();
  const [marriageEpoch, setMarriageEpoch] = useState(0);
  const [actionNotificationId, setActionNotificationId] = useState<string | null>(null);

  useEffect(() => {
    const onUpd = () => setMarriageEpoch((e) => e + 1);
    window.addEventListener("matchify-marriage-chat-updated", onUpd);
    return () => window.removeEventListener("matchify-marriage-chat-updated", onUpd);
  }, []);

  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ["/api/users", userId, "notifications"],
    enabled: !!userId,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    if (!userId) return;
    const es = new EventSource(getNotificationsStreamUrl(userId));
    const invalidate = () => {
      void queryClient.invalidateQueries({ queryKey: ["/api/users", userId, "notifications"] });
    };
    es.onopen = () => invalidate();
    es.onmessage = () => invalidate();
    es.onerror = () => {
      // Browser auto-retries.
    };
    return () => es.close();
  }, [userId]);

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

  const respondMarriageReqMutation = useMutation({
    mutationFn: async (vars: {
      requestId: string;
      decision: "approved" | "rejected";
      fromUserId?: string | null;
    }) => {
      if (!userId) throw new Error("Not signed in");
      return patchMarriageIncomingDecision(userId, vars.requestId, vars.decision, {
        fromUserId: vars.fromUserId,
      });
    },
    onSuccess: (_d, vars) => {
      queryClient.invalidateQueries({ queryKey: ["/api/users", userId, "notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users", userId, "marriage-incoming"] });
      setMarriageEpoch((e) => e + 1);
      if (vars.decision === "approved") toast({ title: "Request accepted" });
      else toast({ title: "Request declined" });
    },
    onError: (e) => {
      toast({
        variant: "destructive",
        title: "Could not update request",
        description: e instanceof Error ? e.message : "Try again.",
      });
    },
  });

  const respondChatReqMutation = useMutation({
    mutationFn: async (vars: { requestId: string; decision: "approved" | "rejected" }) => {
      if (!userId) throw new Error("Not signed in");
      const res = await fetch(buildApiUrl(`/api/users/${userId}/chat-requests/${vars.requestId}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getAuthHeaders(false) },
        credentials: "include",
        body: JSON.stringify({ decision: vars.decision }),
      });
      if (!res.ok) throw new Error("Failed to respond");
      return res.json() as Promise<{ conversationId?: string }>;
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ["/api/users", userId, "notifications"] });
      refreshChatRequestQueries(userId!);
      if (vars.decision === "approved") toast({ title: "Request accepted" });
      else toast({ title: "Request declined" });
    },
    onError: (e) => {
      toast({
        variant: "destructive",
        title: "Could not update request",
        description: e instanceof Error ? e.message : "Try again.",
      });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error("Not signed in");
      const res = await apiRequest("PATCH", `/api/users/${userId}/notifications/read-all`, {});
      if (!res.ok) throw new Error("Failed to mark all as read");
      for (const row of marriageNotificationsForUser(userId)) {
        if (!row.read) {
          markMarriageSyntheticNotificationRead(userId, row.id);
        }
      }
    },
    onSuccess: () => {
      setMarriageEpoch((e) => e + 1);
      queryClient.invalidateQueries({ queryKey: ["/api/users", userId, "notifications"] });
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/notifications/${encodeURIComponent(id)}`);
      if (!res.ok) throw new Error("Failed to delete notification");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users", userId, "notifications"] });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Could not delete",
        description: "Try again in a moment.",
      });
    },
  });

  const safeNotifications = useMemo(() => {
    const arr = Array.isArray(notifications) ? notifications : [];
    return arr.map((n) => {
      const norm = normalizeNotificationRowFromApi(n);
      return { ...(n as Notification), ...norm };
    });
  }, [notifications]);

  const mergedNotifications = useMemo(() => {
    void marriageEpoch;
    if (!userId) return safeNotifications;
    const marriageRows: Notification[] = marriageNotificationsForUser(userId).map((m) => ({
      id: m.id,
      userId: m.userId,
      type: m.type as Notification["type"],
      title: m.title,
      message: m.message,
      read: m.read,
      createdAt: m.createdAt ? new Date(m.createdAt) : null,
      relatedUserId: m.relatedUserId ?? undefined,
      relatedEntityId: m.relatedEntityId ?? null,
    }));
    const marriageFiltered = filterMarriageSyntheticDuplicatesAgainstApi(marriageRows, safeNotifications);
    return [...marriageFiltered, ...safeNotifications].sort(
      (a, b) => notificationCreatedAtMs(b.createdAt) - notificationCreatedAtMs(a.createdAt),
    );
  }, [userId, marriageEpoch, safeNotifications]);

  const mergedForBell = useMemo(
    () => mergedNotifications.filter((n) => !BELL_HIDDEN_NOTIFICATION_TYPES.has(String(n.type))),
    [mergedNotifications],
  );

  const matchNotifications = mergedForBell.filter(
    (n) => n.type === "match" || n.type === "curated_match",
  );
  const messageNotifications = mergedForBell.filter(
    (n) =>
      n.type === "message" ||
      n.type === "marriage_chat_request" ||
      n.type === "marriage_chat_accepted" ||
      n.type === "chat_request" ||
      n.type === "chat_request_accepted" ||
      n.type === "chat_request_declined" ||
      n.type === "chat_request_you_accepted",
  );
  const eventNotifications = mergedForBell.filter(
    (n) => n.type === "event" || n.type === "ai_event_invite",
  );
  const systemNotifications = mergedForBell.filter((n) => n.type === "system");

  const unreadCount = mergedForBell.filter((n) => !n.read).length;

  const handleMarkReadOnly = useCallback(
    (id: string) => {
      const raw = mergedForBell.find((x) => x.id === id);
      if (!raw || raw.read) return;
      if (userId && isMarriageSyntheticNotificationId(raw.id)) {
        markMarriageSyntheticNotificationRead(userId, raw.id);
        setMarriageEpoch((e) => e + 1);
        return;
      }
      markReadMutation.mutate(id);
    },
    [mergedForBell, userId, markReadMutation],
  );

  const handleDeleteNotification = useCallback(
    (id: string) => {
      if (!userId) return;
      if (isMarriageSyntheticNotificationId(id)) {
        removeMarriageSyntheticNotification(userId, id);
        setMarriageEpoch((e) => e + 1);
        return;
      }
      deleteNotificationMutation.mutate(id);
    },
    [userId, deleteNotificationMutation],
  );

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
        case "curated_match":
          if (tier === "free") {
            requireTier({
              feature: "AI Matching",
              minTier: "plus",
              reason: "Free plan doesn’t include AI picks.",
            });
            break;
          }
          setLocation("/directory?tab=curated");
          break;
        case "marriage_chat_request":
        case "chat_request":
          if (other) {
            setLocation(`/profile/${encodeURIComponent(other)}`);
          }
          break;
        case "chat_request_declined":
          setLocation("/chat-requests");
          break;
        case "chat_request_you_accepted":
          if (other) {
            setLocation(`/chat?user=${encodeURIComponent(other)}`);
          } else {
            setLocation("/chat-requests");
          }
          break;
        case "marriage_chat_accepted":
        case "chat_request_accepted":
          if (other) {
            setLocation(`/chat?user=${encodeURIComponent(other)}`);
          } else {
            setLocation("/chat");
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
        case "ai_event_invite":
          if (entity) {
            setLocation(`/event/${entity}`);
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
    [markReadMutation, requireTier, setLocation, tier, userId],
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
      ? mergedForBell.map(formatRow)
      : notificationTab === "matches"
        ? matchNotifications.map(formatRow)
        : notificationTab === "messages"
          ? messageNotifications.map(formatRow)
          : notificationTab === "events"
            ? eventNotifications.map(formatRow)
            : systemNotifications.map(formatRow);

  return (
    <PageWrapper>
      <div className="min-h-screen bg-[hsl(var(--surface-2))] pb-24">
        <Header showSearch={false} onLogout={logout} title="Notifications" />

        <div className="mx-auto max-w-lg px-3 pt-2">
          {isLoading ? (
            <div className="py-10">
              <LoadingState message="Loading notifications..." showMascot={true} />
            </div>
          ) : mergedForBell.length === 0 ? (
            <div className="py-10">
              <EmptyNotifications />
            </div>
          ) : (
            <>
              <div className="matchify-surface p-2">
                <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
                  {[
                    { value: "all", label: `All (${mergedForBell.length})` },
                    { value: "matches", label: `Matches (${matchNotifications.length})` },
                    { value: "messages", label: `Messages (${messageNotifications.length})` },
                    { value: "events", label: `Events (${eventNotifications.length})` },
                    { value: "system", label: `System (${systemNotifications.length})` },
                  ].map((tab) => (
                    <button
                      key={tab.value}
                      onClick={() => setNotificationTab(tab.value)}
                      className={`flex-shrink-0 rounded-full px-3.5 py-2 text-[11px] font-medium transition-colors ${
                        notificationTab === tab.value
                          ? "bg-primary text-primary-foreground shadow-2xs"
                          : "bg-muted/60 text-muted-foreground hover:text-foreground"
                      }`}
                      data-testid={`tab-${tab.value}`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {unreadCount > 0 ? (
                <div className="mt-2 flex justify-end px-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-9 text-xs font-semibold text-primary hover:text-primary/90"
                    disabled={markAllReadMutation.isPending}
                    onClick={() => markAllReadMutation.mutate()}
                    data-testid="button-mark-all-read"
                  >
                    Mark all as read
                  </Button>
                </div>
              ) : null}

              <div className="mt-1 overflow-hidden matchify-surface">
                <div>
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
                    relatedEntityId={(row as Notification).relatedEntityId ?? null}
                    onMarkRead={!row.read ? handleMarkReadOnly : undefined}
                    markReadDisabled={markReadMutation.isPending}
                    onDelete={handleDeleteNotification}
                    deleteDisabled={deleteNotificationMutation.isPending}
                    onAccept={(id) => {
                      if (actionNotificationId) return;
                      const raw = mergedForBell.find((x) => x.id === id);
                      const reqId = raw ? notificationRequestIdForPatch(raw as Notification) : "";
                      const other = raw?.relatedUserId || null;
                      if (!raw) return;
                      if (raw.type === "chat_request") {
                        if (!reqId || !other) return;
                      } else if (raw.type === "marriage_chat_request") {
                        if (!reqId && !other) return;
                      } else {
                        return;
                      }
                      setActionNotificationId(id);
                      if (raw.type === "chat_request") {
                        respondChatReqMutation.mutate(
                          { requestId: reqId, decision: "approved" },
                          {
                            onSuccess: () => {
                              if (other) setLocation(`/chat?user=${encodeURIComponent(other)}`);
                            },
                            onSettled: () => setActionNotificationId(null),
                          },
                        );
                      } else if (raw.type === "marriage_chat_request") {
                        respondMarriageReqMutation.mutate(
                          { requestId: reqId, decision: "approved", fromUserId: other },
                          {
                            onSuccess: () => {
                              const u = other ?? raw.relatedUserId;
                              if (u) setLocation(`/chat?user=${encodeURIComponent(u)}`);
                            },
                            onSettled: () => setActionNotificationId(null),
                          },
                        );
                      } else {
                        setActionNotificationId(null);
                      }
                    }}
                    onDecline={(id) => {
                      if (actionNotificationId) return;
                      const raw = mergedForBell.find((x) => x.id === id);
                      const reqId = raw ? notificationRequestIdForPatch(raw as Notification) : "";
                      const other = raw?.relatedUserId ?? null;
                      if (!raw) return;
                      if (raw.type === "chat_request") {
                        if (!reqId) return;
                      } else if (raw.type === "marriage_chat_request") {
                        if (!reqId && !other) return;
                      } else {
                        return;
                      }
                      setActionNotificationId(id);
                      if (raw.type === "chat_request") {
                        respondChatReqMutation.mutate(
                          { requestId: reqId, decision: "rejected" },
                          { onSettled: () => setActionNotificationId(null) },
                        );
                      } else if (raw.type === "marriage_chat_request") {
                        respondMarriageReqMutation.mutate(
                          { requestId: reqId, decision: "rejected", fromUserId: other },
                          { onSettled: () => setActionNotificationId(null) },
                        );
                      } else {
                        setActionNotificationId(null);
                      }
                    }}
                    actionsDisabled={
                      actionNotificationId === row.id ||
                      respondMarriageReqMutation.isPending ||
                      respondChatReqMutation.isPending
                    }
                    onClick={(id) => {
                      const raw = mergedForBell.find((x) => x.id === id);
                      if (raw) handleNotificationClick(raw);
                    }}
                  />
                ))}
                </div>
              </div>
            </>
          )}
        </div>

        <BottomNav active="menu" />
      </div>
    </PageWrapper>
  );
}
