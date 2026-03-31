import { motion } from "framer-motion";
import { Bell, Heart, MessageCircle, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type NotificationType =
  | "match"
  | "message"
  | "event"
  | "system"
  | "curated_match"
  | "marriage_chat_request"
  | "marriage_chat_accepted";

interface NotificationItemProps {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  timestamp: string;
  user?: { name: string; avatar?: string };
  /** For actions/navigation */
  relatedUserId?: string | null;
  relatedEntityId?: string | null;
  onClick?: (id: string) => void;
  onAccept?: (id: string) => void;
  onDecline?: (id: string) => void;
  actionsDisabled?: boolean;
}

const ICON_MAP: Record<NotificationType, React.ElementType> = {
  match: Heart,
  curated_match: Heart,
  message: MessageCircle,
  event: Calendar,
  system: Bell,
  marriage_chat_request: MessageCircle,
  marriage_chat_accepted: MessageCircle,
};

const COLOR_MAP: Record<NotificationType, string> = {
  match: "bg-primary/10 text-primary",
  curated_match: "bg-primary/10 text-primary",
  message: "bg-primary/10 text-primary",
  event: "bg-amber-100 text-amber-500",
  system: "bg-gray-100 text-gray-500",
  marriage_chat_request: "bg-primary/10 text-primary",
  marriage_chat_accepted: "bg-primary/10 text-primary",
};

export default function NotificationItem({
  id,
  type,
  title,
  message,
  read,
  timestamp,
  onClick,
  onAccept,
  onDecline,
  actionsDisabled = false,
}: NotificationItemProps) {
  const Icon = ICON_MAP[type] || Bell;
  const iconColor = COLOR_MAP[type] || COLOR_MAP.system;
  const showActions = type === "marriage_chat_request" && (onAccept || onDecline);

  return (
    <motion.div
      initial={{ opacity: 0, x: -4 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn(
        "flex items-start gap-3 px-4 py-3.5 transition-colors",
        onClick && "cursor-pointer hover:bg-gray-50 active:bg-gray-100",
        !read && "bg-primary/5",
      )}
      onClick={onClick ? () => onClick(id) : undefined}
      data-testid={`notification-${id}`}
    >
      {/* Icon */}
      <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 mt-0.5", iconColor)}>
        <Icon className="w-5 h-5" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={cn("text-sm leading-snug", !read ? "font-semibold text-gray-900" : "font-medium text-gray-700")}>
            {title}
          </p>
          {!read && (
            <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
          )}
        </div>
        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">{message}</p>
        <p className="text-[10px] text-gray-400 mt-1">{timestamp}</p>

        {showActions ? (
          <div
            className="mt-2 flex gap-2"
            onClick={(e) => {
              // Prevent parent click (mark read + navigate).
              e.stopPropagation();
            }}
          >
            <Button
              type="button"
              size="sm"
              className="h-8 rounded-full px-3 text-xs font-bold"
              disabled={actionsDisabled}
              onClick={() => onAccept?.(id)}
            >
              Accept
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 rounded-full px-3 text-xs font-bold"
              disabled={actionsDisabled}
              onClick={() => onDecline?.(id)}
            >
              Decline
            </Button>
          </div>
        ) : null}
      </div>
    </motion.div>
  );
}
