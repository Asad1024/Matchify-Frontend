import { Globe, Heart, MessagesSquare, UserCircle, type LucideIcon } from "lucide-react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useCurrentUser } from "@/contexts/UserContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface BottomNavProps {
  active: string;
  onNavigate?: (page: string) => void;
}

/** Two overlapping hearts (Explore). */
function DoubleHeartIcon({ className, strokeWidth = 2 }: { className?: string; strokeWidth?: number }) {
  return (
    <span className={cn("relative inline-flex h-[1.15em] w-[1.15em] shrink-0 items-center justify-center", className)}>
      <Heart
        className="absolute left-0 top-[12%] h-[62%] w-[62%]"
        strokeWidth={strokeWidth}
        aria-hidden
      />
      <Heart
        className="absolute right-0 bottom-[12%] h-[62%] w-[62%]"
        strokeWidth={strokeWidth}
        aria-hidden
      />
    </span>
  );
}

/** Simple ring icon (band + stone) for Marriage tab. */
function WeddingRingIcon({ className, strokeWidth = 2 }: { className?: string; strokeWidth?: number }) {
  return (
    <span className={cn("relative inline-flex h-[1.15em] w-[1.15em] shrink-0 items-center justify-center", className)}>
      <svg viewBox="0 0 24 24" className="h-full w-full" fill="none" aria-hidden>
        <circle cx="12" cy="14.2" r="5.4" stroke="currentColor" strokeWidth={strokeWidth} />
        <path
          d="M9.4 7.8L12 5.2L14.6 7.8L12 10.4Z"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

type NavIcon = LucideIcon | "double-heart" | "wedding-ring";

/** 5-tab bar: Marriage · Explore · Feed · Chat · Menu */
const NAV_ITEMS: {
  id: string;
  icon: NavIcon;
  label: string;
  path: string;
  center?: boolean;
}[] = [
  { id: "marriage", icon: "wedding-ring", label: "Marriage", path: "/" },
  { id: "explore", icon: "double-heart", label: "Explore", path: "/explore" },
  { id: "community", icon: Globe, label: "Feed", path: "/community", center: true },
  { id: "chat", icon: MessagesSquare, label: "Chat", path: "/chat" },
  { id: "menu", icon: UserCircle, label: "Menu", path: "/menu" },
];

export default function BottomNav({ active, onNavigate }: BottomNavProps) {
  const [, setLocation] = useLocation();
  const { userId } = useCurrentUser();

  const { data: unreadPayload } = useQuery<{ count: number }>({
    queryKey: ["/api/users", userId, "chat-unread-count"],
    enabled: !!userId,
  });
  const chatUnread = Math.min(99, Math.max(0, unreadPayload?.count ?? 0));

  const { data: me } = useQuery<{ name?: string | null; avatar?: string | null }>({
    queryKey: [`/api/users/${userId}`],
    enabled: !!userId,
  });
  const menuAvatarUrl = me?.avatar?.trim() || null;
  const menuInitials = (me?.name || "Me").slice(0, 2).toUpperCase();

  const handleNav = (item: { id: string; path: string }) => {
    setLocation(item.path);
    onNavigate?.(item.id);
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-gray-100 safe-bottom"
      style={{
        boxShadow: "0 -1px 0 0 rgba(0,0,0,0.06), 0 -8px 24px rgba(0,0,0,0.04)",
      }}
    >
      <div className="flex items-end justify-around max-w-lg mx-auto px-4 pb-1 pt-1">
        {NAV_ITEMS.map((item) => {
          const isActive = active === item.id;

          const renderGlyph = (size: "center" | "tab") => {
            if (item.icon === "double-heart") {
              return (
                <DoubleHeartIcon
                  className={size === "center" ? "h-7 w-7" : "h-[22px] w-[22px]"}
                  strokeWidth={2}
                />
              );
            }
            if (item.icon === "wedding-ring") {
              return (
                <WeddingRingIcon
                  className={size === "center" ? "h-7 w-7" : "h-[22px] w-[22px]"}
                  strokeWidth={2}
                />
              );
            }
            const Icon = item.icon;
            return (
              <Icon
                className={size === "center" ? "w-6 h-6" : "w-[22px] h-[22px]"}
                strokeWidth={2}
                aria-hidden
              />
            );
          };

          if (item.center) {
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNav(item)}
                className="flex flex-col items-center gap-0.5 py-1 px-3 -mt-5 outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-xl"
                data-testid={`tab-${item.id}`}
              >
                <motion.div
                  whileTap={{ scale: 0.88 }}
                  transition={{ type: "spring", stiffness: 500, damping: 22 }}
                  className={`w-[52px] h-[52px] rounded-[18px] flex items-center justify-center transition-all ${
                    isActive
                      ? "bg-primary text-white shadow-lg shadow-primary/40"
                      : "bg-gradient-to-b from-white to-primary/[0.08] border-2 border-primary/35 text-primary shadow-md shadow-primary/10"
                  }`}
                >
                  <span className={isActive ? "text-white [&_svg]:stroke-white" : "text-primary [&_svg]:stroke-primary"}>
                    {renderGlyph("center")}
                  </span>
                </motion.div>
                <span
                  className={`text-[10px] font-semibold transition-colors ${
                    isActive ? "text-primary font-bold" : "text-primary/80"
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          }

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNav(item)}
              className="relative flex flex-col items-center gap-0.5 py-2 px-3 min-w-[56px] outline-none"
              data-testid={`tab-${item.id}`}
            >
              <motion.div
                whileTap={{ scale: 0.85 }}
                transition={{ type: "spring", stiffness: 500, damping: 22 }}
                className="relative"
              >
                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      layoutId="nav-active-bg"
                      initial={{ opacity: 0, scale: 0.7 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.7 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      className="absolute inset-[-6px] rounded-2xl bg-primary/10"
                    />
                  )}
                </AnimatePresence>
                {item.id === "menu" ? (
                  <Avatar
                    className={`relative z-10 h-7 w-7 shrink-0 border-2 bg-white transition-colors duration-200 ${
                      isActive
                        ? "border-primary ring-2 ring-primary/25 shadow-sm"
                        : "border-gray-200"
                    }`}
                  >
                    <AvatarImage
                      src={menuAvatarUrl || undefined}
                      alt={me?.name ? `${me.name} — open menu` : "Your profile — open menu"}
                      className="object-cover"
                    />
                    <AvatarFallback
                      className={`text-[9px] font-bold ${
                        isActive ? "bg-primary/15 text-primary" : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {userId ? menuInitials : <UserCircle className="h-4 w-4 opacity-80" aria-hidden />}
                    </AvatarFallback>
                  </Avatar>
                ) : item.icon === "double-heart" || item.icon === "wedding-ring" ? (
                  <span
                    className={`relative z-10 transition-colors duration-200 ${
                      isActive ? "text-primary [&_svg]:stroke-primary" : "text-gray-500 [&_svg]:stroke-gray-500"
                    }`}
                  >
                    {renderGlyph("tab")}
                  </span>
                ) : (
                  (() => {
                    const Icon = item.icon;
                    return (
                      <Icon
                        className={`w-[22px] h-[22px] transition-colors duration-200 relative z-10 ${
                          isActive ? "text-primary" : "text-gray-500"
                        }`}
                        strokeWidth={2}
                        aria-hidden
                      />
                    );
                  })()
                )}
                {item.id === "chat" && chatUnread > 0 && (
                  <span
                    className={
                      chatUnread > 9
                        ? "absolute -right-1 -top-1 z-20 grid h-[18px] min-w-[22px] place-items-center rounded-full border border-white bg-primary px-1 text-[9px] font-bold tabular-nums leading-none tracking-tight text-white shadow-sm"
                        : "absolute -right-1 -top-1 z-20 grid size-[18px] place-items-center rounded-full border border-white bg-primary text-[10px] font-bold tabular-nums leading-none text-white shadow-sm"
                    }
                  >
                    {chatUnread > 9 ? "9+" : chatUnread}
                  </span>
                )}
              </motion.div>

              <span
                className={`text-[10px] font-semibold transition-colors duration-200 ${
                  isActive ? "text-primary" : "text-gray-600"
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
