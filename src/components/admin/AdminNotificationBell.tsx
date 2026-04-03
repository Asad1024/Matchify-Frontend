import { useEffect, useState, type ComponentProps } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import NotificationItem from "@/components/notifications/NotificationItem";
import { useCurrentUser } from "@/contexts/UserContext";
import { queryClient } from "@/lib/queryClient";
import { buildApiUrl, getAuthHeaders, getNotificationsStreamUrl } from "@/services/api";

type Row = {
  id: string;
  userId: string;
  type: "match" | "message" | "event" | "system" | string;
  title: string;
  message: string;
  read: boolean | null;
  createdAt: string | null;
  relatedUserId?: string | null;
};

export default function AdminNotificationBell() {
  const [open, setOpen] = useState(false);
  const [, setLocation] = useLocation();
  const { userId } = useCurrentUser();

  const { data: notifications = [] } = useQuery<Row[]>({
    queryKey: ["/api/users", userId, "notifications"],
    enabled: !!userId,
    refetchInterval: 30_000,
  });

  useEffect(() => {
    if (!userId) return;
    const es = new EventSource(getNotificationsStreamUrl(userId));
    const invalidate = () => {
      void queryClient.invalidateQueries({ queryKey: ["/api/users", userId, "notifications"] });
    };
    es.onopen = () => invalidate();
    es.onmessage = () => invalidate();
    es.onerror = () => {};
    return () => es.close();
  }, [userId]);

  const list = Array.isArray(notifications) ? notifications : [];
  const unreadCount = list.filter((n) => !n.read).length;

  const markReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const res = await fetch(buildApiUrl(`/api/notifications/${notificationId}/read`), {
        method: "PATCH",
        headers: getAuthHeaders(false),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to mark read");
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["/api/users", userId, "notifications"] });
    },
  });

  if (!userId) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="relative h-9 w-9 md:h-10 md:w-10 shrink-0 rounded-full text-muted-foreground hover:bg-primary/10 hover:text-primary"
          aria-label="Admin notifications"
        >
          <Bell className="h-5 w-5" strokeWidth={2} aria-hidden />
          {unreadCount > 0 && (
            <span className="absolute right-0.5 top-0.5 grid min-h-[16px] min-w-[16px] place-items-center rounded-full bg-primary px-1 text-[9px] font-bold tabular-nums leading-none text-primary-foreground">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 shadow-xl rounded-2xl overflow-hidden" align="end" sideOffset={8}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/70">
          <h3 className="text-sm font-bold text-foreground">Notifications</h3>
          {unreadCount > 0 && (
            <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
              {unreadCount} new
            </span>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {list.length === 0 ? (
            <div className="py-8 text-center">
              <Bell className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No notifications yet</p>
            </div>
          ) : (
            list.slice(0, 10).map((n) => (
              <NotificationItem
                key={n.id}
                id={n.id}
                type={(n.type || "system") as ComponentProps<typeof NotificationItem>["type"]}
                title={n.title}
                message={n.message}
                read={!!n.read}
                timestamp={n.createdAt ? new Date(n.createdAt).toLocaleString() : "Just now"}
                relatedUserId={n.relatedUserId ?? null}
                onClick={(id) => {
                  if (!n.read) markReadMutation.mutate(id);
                  const isVerification =
                    /verification/i.test(n.title) || /verified badge/i.test(n.message || "");
                  const isDeletion = /deletion/i.test(n.title) || /delete their account/i.test(n.message || "");
                  setOpen(false);
                  if (isVerification || isDeletion) setLocation("/admin/users");
                  else setLocation("/admin/notifications");
                }}
              />
            ))
          )}
        </div>
        {list.length > 0 && (
          <div className="border-t border-border/70 px-4 py-2.5">
            <button
              type="button"
              className="text-xs text-primary font-semibold w-full text-center hover:underline"
              onClick={() => {
                setOpen(false);
                setLocation("/admin/notifications");
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
