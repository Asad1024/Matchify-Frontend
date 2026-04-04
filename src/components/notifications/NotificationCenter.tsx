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
import { buildApiUrl, getAuthHeaders, getNotificationsStreamUrl } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import {
  filterMarriageSyntheticDuplicatesAgainstApi,
  isMarriageSyntheticNotificationId,
  markMarriageSyntheticNotificationRead,
  marriageNotificationsForUser,
  patchMarriageIncomingDecision,
} from "@/lib/marriageChatRequests";
import { normalizeNotificationRowFromApi, notificationRequestIdForPatch } from "@/lib/notificationRow";
import { notificationCreatedAtMs } from "@/lib/utils";
import { useUpgrade } from "@/contexts/UpgradeContext";
import { refreshChatRequestQueries } from "@/lib/chatRequestsApi";

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

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [, setLocation] = useLocation();
  const { userId } = useCurrentUser();
  const { toast } = useToast();
  const { tier, requireTier } = useUpgrade();
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
      // Browser will auto-retry. No-op.
    };
    return () => es.close();
  }, [userId]);

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
      type: m.type,
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

  const unreadCount = mergedForBell.filter((n) => !n.read).length;

  const markReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const res = await fetch(buildApiUrl(`/api/notifications/${notificationId}/read`), {
        method: "PATCH",
        headers: { ...getAuthHeaders(false) },
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to mark read");
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
                unreadCount > 99
                  ? "absolute right-0 top-0 translate-x-[14%] -translate-y-[14%] grid h-[18px] min-w-[24px] place-items-center rounded-full bg-primary px-1 text-[9px] font-bold tabular-nums leading-none tracking-tight text-white"
                  : unreadCount > 9
                    ? "absolute right-0 top-0 translate-x-[14%] -translate-y-[14%] grid h-[18px] min-w-[22px] place-items-center rounded-full bg-primary px-1 text-[9px] font-bold tabular-nums leading-none tracking-tight text-white"
                    : "absolute right-0 top-0 translate-x-[14%] -translate-y-[14%] grid size-[18px] place-items-center rounded-full bg-primary text-[10px] font-bold tabular-nums leading-none text-white"
              }
            >
              {unreadCount > 99 ? "99+" : unreadCount}
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
          {mergedForBell.length === 0 ? (
            <div className="py-8 text-center">
              <Bell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No notifications yet</p>
            </div>
          ) : (
            mergedForBell.slice(0, 10).map((n) => (
              <NotificationItem
                key={n.id}
                {...n}
                read={n.read ?? false}
                timestamp={n.createdAt ? new Date(n.createdAt).toLocaleString() : "Just now"}
                relatedUserId={n.relatedUserId ?? null}
                relatedEntityId={n.relatedEntityId ?? null}
                onAccept={(id) => {
                  if (actionNotificationId) return;
                  const row = mergedForBell.find((x) => x.id === id);
                  const reqId = notificationRequestIdForPatch(row as Notification);
                  const other = row?.relatedUserId || null;
                  if (!row) return;
                  if (row.type === "chat_request") {
                    if (!reqId || !other) return;
                  } else if (row.type === "marriage_chat_request") {
                    if (!reqId && !other) return;
                  } else {
                    return;
                  }
                  setActionNotificationId(id);
                  if (row.type === "chat_request") {
                    respondChatReqMutation.mutate(
                      { requestId: reqId, decision: "approved" },
                      {
                        onSuccess: () => setLocation(`/chat?user=${encodeURIComponent(other!)}`),
                        onSettled: () => setActionNotificationId(null),
                      },
                    );
                  } else {
                    respondMarriageReqMutation.mutate(
                      { requestId: reqId, decision: "approved", fromUserId: other },
                      {
                        onSuccess: () => {
                          const u = other ?? row.relatedUserId;
                          if (u) setLocation(`/chat?user=${encodeURIComponent(u)}`);
                        },
                        onSettled: () => setActionNotificationId(null),
                      },
                    );
                  }
                }}
                onDecline={(id) => {
                  if (actionNotificationId) return;
                  const row = mergedForBell.find((x) => x.id === id);
                  const reqId = notificationRequestIdForPatch(row as Notification);
                  const other = row?.relatedUserId ?? null;
                  if (!row) return;
                  if (row.type === "chat_request") {
                    if (!reqId) return;
                  } else if (row.type === "marriage_chat_request") {
                    if (!reqId && !other) return;
                  } else {
                    return;
                  }
                  setActionNotificationId(id);
                  if (row.type === "chat_request") {
                    respondChatReqMutation.mutate(
                      { requestId: reqId, decision: "rejected" },
                      { onSettled: () => setActionNotificationId(null) },
                    );
                  } else {
                    respondMarriageReqMutation.mutate(
                      { requestId: reqId, decision: "rejected", fromUserId: other },
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
                    const row = mergedForBell.find((x) => x.id === id);
                    if (row?.relatedUserId) {
                      setLocation(`/chat?user=${encodeURIComponent(row.relatedUserId)}`);
                    }
                  } else {
                    markReadMutation.mutate(id);
                    const row = mergedForBell.find((x) => x.id === id);
                    if (row?.type === "curated_match") {
                      if (tier === "free") {
                        requireTier({
                          feature: "AI Matching",
                          minTier: "plus",
                          reason: "Free plan doesn’t include AI picks.",
                        });
                      } else {
                        setLocation("/directory?tab=curated");
                      }
                    } else if (row?.type === "match" && row.relatedUserId) {
                      setLocation(`/profile/${encodeURIComponent(row.relatedUserId)}`);
                    } else if (row?.type === "chat_request" && row.relatedUserId) {
                      setLocation(`/profile/${encodeURIComponent(row.relatedUserId)}`);
                    } else if (row?.type === "chat_request_declined") {
                      setLocation("/chat-requests");
                    } else if (row?.type === "chat_request_you_accepted" && row.relatedUserId) {
                      setLocation(`/chat?user=${encodeURIComponent(row.relatedUserId)}`);
                    } else if (row?.type === "chat_request_accepted" && row.relatedUserId) {
                      setLocation(`/chat?user=${encodeURIComponent(row.relatedUserId)}`);
                    } else if (row?.type === "marriage_chat_accepted" && row.relatedUserId) {
                      setLocation(`/chat?user=${encodeURIComponent(row.relatedUserId)}`);
                    } else if (row?.type === "message" && row.relatedUserId) {
                      setLocation(`/chat?user=${encodeURIComponent(row.relatedUserId)}`);
                    } else if (
                      (row?.type === "event" || row?.type === "ai_event_invite") &&
                      row.relatedEntityId
                    ) {
                      setLocation(`/event/${encodeURIComponent(row.relatedEntityId)}`);
                    }
                  }
                  setOpen(false);
                }}
              />
            ))
          )}
        </div>

        {mergedForBell.length > 0 && (
          <div className="border-t border-gray-100 px-4 py-2.5">
            <button
              className="text-xs text-primary font-semibold w-full text-center hover:underline"
              onClick={() => {
                setOpen(false);
                setLocation("/notifications");
              }}
            >
              View all notifications
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
