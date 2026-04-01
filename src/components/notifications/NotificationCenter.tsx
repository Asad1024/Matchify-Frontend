import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import NotificationItem from "./NotificationItem";
import { useCurrentUser } from "@/contexts/UserContext";
import { queryClient } from "@/lib/queryClient";
import { buildApiUrl, getAuthHeaders } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
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
    | "marriage_chat_accepted"
    | "chat_request"
    | "chat_request_accepted";
  title: string;
  message: string;
  read: boolean | null;
  createdAt: Date | string | null;
  relatedUserId?: string | null;
  relatedEntityId?: string | null;
};

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [, setLocation] = useLocation();
  const { userId } = useCurrentUser();
  const { toast } = useToast();
  const [marriageEpoch, setMarriageEpoch] = useState(0);
  const [actionNotificationId, setActionNotificationId] = useState<string | null>(null);

  useEffect(() => {
    const onUpd = () => setMarriageEpoch((e) => e + 1);
    window.addEventListener("matchify-marriage-chat-updated", onUpd);
    return () => window.removeEventListener("matchify-marriage-chat-updated", onUpd);
  }, []);

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ["/api/users", userId, "notifications"],
    enabled: !!userId,
    refetchInterval: 30_000,
  });

  useEffect(() => {
    if (!userId) return;
    const es = new EventSource(`/api/users/${encodeURIComponent(userId)}/notifications/stream`);
    es.onmessage = () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users", userId, "notifications"] });
    };
    es.onerror = () => {
      // Browser will auto-retry. No-op.
    };
    return () => es.close();
  }, [userId]);

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
      relatedUserId: m.relatedUserId,
    }));
    return [...marriageRows, ...safeNotifications].sort(
      (a, b) => notificationCreatedAtMs(b.createdAt) - notificationCreatedAtMs(a.createdAt),
    );
  }, [userId, marriageEpoch, safeNotifications]);

  const unreadCount = mergedNotifications.filter((n) => !n.read).length;

  const markReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      await fetch(`/api/notifications/${notificationId}/read`, { method: "PATCH" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users", userId, "notifications"] });
    },
  });

  const respondMarriageReqMutation = useMutation({
    mutationFn: async (vars: { requestId: string; decision: "approved" | "rejected" }) => {
      if (!userId) throw new Error("Not signed in");
      const res = await fetch(buildApiUrl(`/api/users/${userId}/marriage/chat-requests/${vars.requestId}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getAuthHeaders(false) },
        credentials: "include",
        body: JSON.stringify({ decision: vars.decision }),
      });
      if (!res.ok) throw new Error("Failed to respond");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users", userId, "notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users", userId, "marriage-incoming"] });
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
      if (vars.decision === "approved") toast({ title: "Request accepted" });
      else toast({ title: "Request declined" });
    },
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          className="relative h-10 w-10 shrink-0 rounded-full text-gray-500 transition-colors hover:bg-primary/10 hover:text-primary"
          data-testid="button-notifications"
        >
          <Bell className="h-5 w-5" strokeWidth={2} aria-hidden />
          {unreadCount > 0 && (
            <span
              className={
                unreadCount > 9
                  ? "absolute right-0.5 top-0.5 grid h-[18px] min-w-[22px] place-items-center rounded-full bg-primary px-1 text-[9px] font-bold tabular-nums leading-none tracking-tight text-white"
                  : "absolute right-0.5 top-0.5 grid size-[18px] place-items-center rounded-full bg-primary text-[10px] font-bold tabular-nums leading-none text-white"
              }
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-80 p-0 shadow-xl rounded-2xl overflow-hidden"
        align="end"
        sideOffset={8}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h3 className="text-sm font-bold text-gray-900">Notifications</h3>
          {unreadCount > 0 && (
            <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
              {unreadCount} new
            </span>
          )}
        </div>

        {/* List */}
        <div className="max-h-80 overflow-y-auto">
          {mergedNotifications.length === 0 ? (
            <div className="py-8 text-center">
              <Bell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No notifications yet</p>
            </div>
          ) : (
            mergedNotifications.slice(0, 10).map((n) => (
              <NotificationItem
                key={n.id}
                {...n}
                read={n.read ?? false}
                timestamp={n.createdAt ? new Date(n.createdAt).toLocaleString() : "Just now"}
                relatedUserId={n.relatedUserId ?? null}
                relatedEntityId={(n as any).relatedEntityId ?? null}
                onAccept={(id) => {
                  if (actionNotificationId) return;
                  const row = mergedNotifications.find((x) => x.id === id);
                  const reqId = (row as any)?.relatedEntityId as string | undefined;
                  const other = row?.relatedUserId || null;
                  if (!reqId || !other) return;
                  setActionNotificationId(id);
                  if (row?.type === "chat_request") {
                    respondChatReqMutation.mutate(
                      { requestId: reqId, decision: "approved" },
                      {
                        onSuccess: () => setLocation(`/chat?user=${encodeURIComponent(other)}`),
                        onSettled: () => setActionNotificationId(null),
                      },
                    );
                  } else {
                    respondMarriageReqMutation.mutate(
                      { requestId: reqId, decision: "approved" },
                      {
                        onSuccess: () => setLocation(`/chat?user=${encodeURIComponent(other)}`),
                        onSettled: () => setActionNotificationId(null),
                      },
                    );
                  }
                }}
                onDecline={(id) => {
                  if (actionNotificationId) return;
                  const row = mergedNotifications.find((x) => x.id === id);
                  const reqId = (row as any)?.relatedEntityId as string | undefined;
                  if (!reqId) return;
                  setActionNotificationId(id);
                  if (row?.type === "chat_request") {
                    respondChatReqMutation.mutate(
                      { requestId: reqId, decision: "rejected" },
                      { onSettled: () => setActionNotificationId(null) },
                    );
                  } else {
                    respondMarriageReqMutation.mutate(
                      { requestId: reqId, decision: "rejected" },
                      { onSettled: () => setActionNotificationId(null) },
                    );
                  }
                }}
                actionsDisabled={
                  actionNotificationId === n.id || respondMarriageReqMutation.isPending || respondChatReqMutation.isPending
                }
                onClick={(id) => {
                  if (userId && isMarriageSyntheticNotificationId(id)) {
                    markMarriageSyntheticNotificationRead(userId, id);
                    setMarriageEpoch((e) => e + 1);
                    const row = mergedNotifications.find((x) => x.id === id);
                    if (row?.relatedUserId) {
                      setLocation(`/chat?user=${encodeURIComponent(row.relatedUserId)}`);
                    }
                  } else {
                    markReadMutation.mutate(id);
                    const row = mergedNotifications.find((x) => x.id === id);
                    if (row?.type === "curated_match") {
                      setLocation("/directory?tab=curated");
                    } else if (row?.type === "match" && row.relatedUserId) {
                      setLocation(`/profile/${encodeURIComponent(row.relatedUserId)}`);
                    } else if (row?.type === "chat_request_accepted" && row.relatedUserId) {
                      setLocation(`/chat?user=${encodeURIComponent(row.relatedUserId)}`);
                    } else if (row?.type === "marriage_chat_accepted" && row.relatedUserId) {
                      setLocation(`/chat?user=${encodeURIComponent(row.relatedUserId)}`);
                    } else if (row?.type === "message" && row.relatedUserId) {
                      setLocation(`/chat?user=${encodeURIComponent(row.relatedUserId)}`);
                    }
                  }
                  setOpen(false);
                }}
              />
            ))
          )}
        </div>

        {mergedNotifications.length > 0 && (
          <div className="border-t border-gray-100 px-4 py-2.5">
            <button
              className="text-xs text-primary font-semibold w-full text-center hover:underline"
              onClick={() => setOpen(false)}
            >
              View all notifications
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
