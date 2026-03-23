import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
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

type Notification = {
  id: string;
  userId: string;
  type: "match" | "message" | "event" | "system";
  title: string;
  message: string;
  read: boolean | null;
  createdAt: Date | null;
};

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const { userId } = useCurrentUser();

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ["/api/users", userId, "notifications"],
    enabled: !!userId,
    refetchInterval: 30_000,
  });

  const safeNotifications = Array.isArray(notifications) ? notifications : [];
  const unreadCount = safeNotifications.filter((n) => !n.read).length;

  const markReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      await fetch(`/api/notifications/${notificationId}/read`, { method: "PATCH" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users", userId, "notifications"] });
    },
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          className="w-9 h-9 rounded-full text-gray-500 hover:text-primary hover:bg-primary/10 transition-colors relative"
          data-testid="button-notifications"
        >
          <Bell className="w-[18px] h-[18px]" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-primary text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
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
          {safeNotifications.length === 0 ? (
            <div className="py-8 text-center">
              <Bell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No notifications yet</p>
            </div>
          ) : (
            safeNotifications.slice(0, 10).map((n) => (
              <NotificationItem
                key={n.id}
                {...n}
                read={n.read ?? false}
                timestamp={n.createdAt ? new Date(n.createdAt).toLocaleString() : "Just now"}
                onClick={(id) => {
                  markReadMutation.mutate(id);
                  setOpen(false);
                }}
              />
            ))
          )}
        </div>

        {safeNotifications.length > 0 && (
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
