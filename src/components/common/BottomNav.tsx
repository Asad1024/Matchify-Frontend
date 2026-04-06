import { Gem, Globe, HeartHandshake, MessagesSquare, UserCircle, type LucideIcon } from "lucide-react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useCurrentUser } from "@/contexts/UserContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
  avatarFromStoredCurrentUserForUserId,
  resolveUserDisplayAvatarUrl,
} from "@/lib/userDisplayAvatar";

interface BottomNavProps {
  active: string;
  onNavigate?: (page: string) => void;
}

type NavIcon = LucideIcon;

/** 5-tab bar: Marriage · Explore · Feed · Chat · Menu */
const NAV_ITEMS: {
  id: string;
  icon: NavIcon;
  label: string;
  path: string;
}[] = [
  { id: "marriage", icon: Gem, label: "Marriage", path: "/" },
  { id: "explore", icon: HeartHandshake, label: "Discover", path: "/explore" },
  { id: "community", icon: Globe, label: "Explore", path: "/community" },
  { id: "chat", icon: MessagesSquare, label: "Chat", path: "/chat" },
  { id: "menu", icon: UserCircle, label: "Menu", path: "/menu" },
];

export default function BottomNav({ active, onNavigate }: BottomNavProps) {
  const [, setLocation] = useLocation();
  const { userId } = useCurrentUser();
  const menuActive = active === "menu";

  const { data: unreadPayload } = useQuery<{ count: number }>({
    queryKey: ["/api/users", userId, "chat-unread-count"],
    enabled: !!userId,
    refetchInterval: 2500,
  });
  const chatUnread = Math.min(99, Math.max(0, unreadPayload?.count ?? 0));

  const { data: me } = useQuery<{
    name?: string | null;
    avatar?: string | null;
    picture?: string | null;
    photos?: unknown;
  }>({
    queryKey: [`/api/users/${userId}`],
    enabled: !!userId,
  });
  const menuAvatarUrl =
    resolveUserDisplayAvatarUrl(me ?? undefined) || avatarFromStoredCurrentUserForUserId(userId);
  const menuInitials = (me?.name || "Me").slice(0, 2).toUpperCase();

  const handleNav = (item: { id: string; path: string }) => {
    setLocation(item.path);
    onNavigate?.(item.id);
  };

  const renderIcon = (item: (typeof NAV_ITEMS)[number], isActive: boolean) => {
    const Icon = item.icon;
    return (
      <Icon
        className={cn("h-[22px] w-[22px] transition-transform", isActive ? "scale-[1.06]" : "scale-100")}
        strokeWidth={2}
        aria-hidden
      />
    );
  };

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 safe-bottom">
      <div className="mx-auto max-w-lg px-4 pb-2.5 pt-2">
        <div className="relative">
          {/* Soft gradient “dock” fade so the bar feels embedded */}
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-x-6 -bottom-8 h-24 bg-gradient-to-t from-background via-background/70 to-transparent"
          />

          <div className="relative rounded-[26px] border border-border/70 bg-card/70 shadow-[0_18px_40px_-26px_rgba(15,23,42,0.35)] ring-1 ring-primary/10 backdrop-blur-xl">
            <div className="grid grid-cols-5 items-center gap-1 p-1.5">
              {NAV_ITEMS.map((item) => {
                const isActive = active === item.id;
                const isMenu = item.id === "menu";
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNav(item)}
                    className={cn(
                      "relative isolate flex items-center justify-center rounded-[20px] px-2 py-2.5 outline-none",
                      "transition-colors focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    )}
                    aria-current={isActive ? "page" : undefined}
                    aria-label={item.label}
                    data-testid={`tab-${item.id}`}
                  >
                    {isActive && !isMenu && (
                      <motion.div
                        layoutId="matchify-bottomnav-active"
                        className={cn(
                          "absolute inset-0 -z-10 rounded-[20px]",
                          "bg-primary",
                          "shadow-[0_12px_26px_-18px_rgba(114,47,55,0.75)]",
                          "ring-1 ring-primary/20",
                        )}
                        transition={{ type: "spring", stiffness: 520, damping: 38 }}
                      />
                    )}

                    <motion.div
                      whileTap={{ scale: 0.92 }}
                      transition={{ type: "spring", stiffness: 720, damping: 30 }}
                      className={cn(
                        "flex items-center gap-2",
                        isActive && !isMenu
                          ? "text-primary-foreground"
                          : menuActive && !isMenu
                            ? "text-primary/80"
                            : "text-primary/75",
                      )}
                    >
                      <span className="relative grid place-items-center">
                        {isMenu ? (
                          <Avatar
                            className={cn(
                              "h-9 w-9 shrink-0 border-2 bg-white/70 backdrop-blur",
                              isActive ? "border-primary/70" : "border-border/70",
                            )}
                          >
                            <AvatarImage
                              src={menuAvatarUrl || undefined}
                              alt={me?.name ? `${me.name} — open menu` : "Your profile — open menu"}
                              className="object-cover"
                            />
                            <AvatarFallback
                              className={cn(
                                "text-[10px] font-bold",
                                isActive ? "bg-primary/10 text-primary" : "bg-muted text-foreground/70",
                              )}
                            >
                              {userId ? (
                                menuInitials
                              ) : (
                                <UserCircle className="h-4 w-4 opacity-80" strokeWidth={1.75} aria-hidden />
                              )}
                            </AvatarFallback>
                          </Avatar>
                        ) : (
                          <span
                            className={cn(
                              "relative",
                              isActive && "drop-shadow-[0_0_18px_rgba(0,0,0,0.18)]",
                            )}
                          >
                            {renderIcon(item, isActive)}
                          </span>
                        )}

                        {item.id === "chat" && chatUnread > 0 && (
                          <span
                            className={cn(
                              "absolute -right-1 -top-1 z-20 grid place-items-center rounded-full border border-white bg-primary px-1 text-[9px] font-bold tabular-nums leading-none text-white shadow-sm",
                              chatUnread > 9 ? "h-[18px] min-w-[22px]" : "size-[18px] text-[10px]",
                            )}
                          >
                            {chatUnread > 9 ? "9+" : chatUnread}
                          </span>
                        )}
                      </span>

                      {/* Only the active tab shows the label (more modern + less cramped) */}
                      <span
                        className={cn(
                          "overflow-hidden whitespace-nowrap text-[11px] font-semibold tracking-tight transition-[max-width,opacity] duration-300",
                          isActive && !isMenu ? "max-w-[72px] opacity-100" : "max-w-0 opacity-0",
                        )}
                      >
                        {item.label}
                      </span>
                    </motion.div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
