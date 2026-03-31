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
  { id: "explore", icon: "double-heart", label: "Discover", path: "/explore" },
  { id: "community", icon: Globe, label: "Explore", path: "/community", center: true },
  { id: "chat", icon: MessagesSquare, label: "Chat", path: "/chat" },
  { id: "menu", icon: UserCircle, label: "Menu", path: "/menu" },
];

export default function BottomNav({ active, onNavigate }: BottomNavProps) {
  const [, setLocation] = useLocation();
  const { userId } = useCurrentUser();

  const { data: unreadPayload } = useQuery<{ count: number }>({
    queryKey: ["/api/users", userId, "chat-unread-count"],
    enabled: !!userId,
    refetchInterval: 2500,
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

  const renderGlyph = (item: (typeof NAV_ITEMS)[number], size: "center" | "tab") => {
    if (item.icon === "double-heart") {
      return (
        <DoubleHeartIcon
          className={size === "center" ? "h-7 w-7" : "h-[26px] w-[26px]"}
          strokeWidth={1.75}
        />
      );
    }
    if (item.icon === "wedding-ring") {
      return (
        <WeddingRingIcon
          className={size === "center" ? "h-7 w-7" : "h-[26px] w-[26px]"}
          strokeWidth={1.75}
        />
      );
    }
    const Icon = item.icon;
    return (
      <Icon
        className={size === "center" ? "h-7 w-7" : "h-[26px] w-[26px]"}
        strokeWidth={1.75}
        aria-hidden
      />
    );
  };

  const leftItems = NAV_ITEMS.filter((i) => !i.center).slice(0, 2);
  const centerItem = NAV_ITEMS.find((i) => i.center);
  const rightItems = NAV_ITEMS.filter((i) => !i.center).slice(2);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 safe-bottom">
      <div className="mx-auto max-w-lg px-4 pb-3 pt-2">
        <div className="relative">
          <div
            className={cn(
              "relative grid grid-cols-5 items-end rounded-[24px] border-2 border-primary/40 bg-white/65 px-2 pb-1 pt-3 shadow-[0_30px_80px_rgba(15,23,42,0.26)] ring-1 ring-primary/15 backdrop-blur-xl",
              // Concave notch cut-out for the elevated center item (broad browser support via both mask props).
              "[mask:radial-gradient(circle_34px_at_50%_0px,transparent_33px,black_34px)]",
              "[-webkit-mask:radial-gradient(circle_34px_at_50%_0px,transparent_33px,black_34px)]"
            )}
          >
            {/* Left two tabs */}
            {leftItems.map((item) => {
              const isActive = active === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNav(item)}
                  className="relative flex flex-col items-center gap-1.5 px-2 py-2 outline-none"
                  data-testid={`tab-${item.id}`}
                >
                  <motion.div whileTap={{ scale: 0.9 }} transition={{ type: "spring", stiffness: 520, damping: 28 }} className="relative">
                    <span className={cn("relative z-10 transition-colors", isActive ? "text-white" : "text-slate-500")}>
                      <span className="relative grid place-items-center">
                        <AnimatePresence>
                          {isActive && (
                            <motion.span
                              layoutId="bottomnav-active-circle"
                              initial={{ opacity: 0, scale: 0.6 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.6 }}
                              transition={{ type: "spring", stiffness: 520, damping: 32 }}
                              className="absolute -inset-2 rounded-full bg-gradient-to-br from-primary to-[#1F2937] shadow-[0_10px_28px_-18px_rgba(15,23,42,0.50)]"
                            />
                          )}
                        </AnimatePresence>
                        <motion.span
                          className="relative z-10 inline-flex"
                          initial={false}
                          animate={isActive ? { y: [0, -1, 0] } : { y: 0 }}
                          transition={{ duration: 0.35, ease: "easeOut" }}
                        >
                          {renderGlyph(item, "tab")}
                        </motion.span>
                      </span>
                    </span>
                  </motion.div>
                  <span className={cn("text-[10px] font-semibold transition-colors", isActive ? "text-primary" : "text-slate-600")}>
                    {item.label}
                  </span>
                </button>
              );
            })}

            {/* Center spacer cell (the elevated button is absolutely positioned) */}
            <div aria-hidden className="h-full" />

            {/* Right two tabs */}
            {rightItems.map((item) => {
              const isActive = active === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNav(item)}
                  className="relative flex flex-col items-center gap-1.5 px-2 py-2 outline-none"
                  data-testid={`tab-${item.id}`}
                >
                  <motion.div whileTap={{ scale: 0.9 }} transition={{ type: "spring", stiffness: 520, damping: 28 }} className="relative">
                    {item.id === "menu" ? (
                      <Avatar
                        className={cn(
                          "relative z-10 h-8 w-8 shrink-0 border-2 bg-white transition-all duration-200",
                          isActive ? "border-primary ring-2 ring-primary/25" : "border-gray-200 hover:border-gray-300"
                        )}
                      >
                        <AvatarImage
                          src={menuAvatarUrl || undefined}
                          alt={me?.name ? `${me.name} — open menu` : "Your profile — open menu"}
                          className="object-cover"
                        />
                        <AvatarFallback
                          className={cn("text-[10px] font-bold", isActive ? "bg-primary/15 text-primary" : "bg-gray-100 text-gray-600")}
                        >
                          {userId ? menuInitials : <UserCircle className="h-4 w-4 opacity-80" strokeWidth={1.75} aria-hidden />}
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <span className={cn("relative z-10 transition-colors", isActive ? "text-white" : "text-slate-500")}>
                        <span className="relative grid place-items-center">
                          <AnimatePresence>
                            {isActive && (
                              <motion.span
                                layoutId="bottomnav-active-circle"
                                initial={{ opacity: 0, scale: 0.6 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.6 }}
                                transition={{ type: "spring", stiffness: 520, damping: 32 }}
                                className="absolute -inset-2 rounded-full bg-gradient-to-br from-primary to-[#1F2937] shadow-[0_10px_28px_-18px_rgba(15,23,42,0.50)]"
                              />
                            )}
                          </AnimatePresence>
                          <motion.span
                            className="relative z-10 inline-flex"
                            initial={false}
                            animate={isActive ? { y: [0, -1, 0] } : { y: 0 }}
                            transition={{ duration: 0.35, ease: "easeOut" }}
                          >
                            {renderGlyph(item, "tab")}
                          </motion.span>
                        </span>
                      </span>
                    )}

                    {item.id === "chat" && chatUnread > 0 && (
                      <span
                        className={cn(
                          "absolute -right-1 -top-1 z-20 grid place-items-center rounded-full border border-white bg-primary px-1 text-[9px] font-bold tabular-nums leading-none text-white shadow-sm",
                          chatUnread > 9 ? "h-[18px] min-w-[22px]" : "size-[18px] text-[10px]"
                        )}
                      >
                        {chatUnread > 9 ? "9+" : chatUnread}
                      </span>
                    )}
                  </motion.div>

                  <span className={cn("text-[10px] font-semibold transition-colors", isActive ? "text-primary" : "text-slate-600")}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Elevated center action (Explore) */}
          {centerItem && (
            <button
              type="button"
              onClick={() => handleNav(centerItem)}
              className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-full"
              data-testid={`tab-${centerItem.id}`}
              aria-label={centerItem.label}
            >
              <div className="flex flex-col items-center">
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  whileHover={{ y: -2 }}
                  transition={{ type: "spring", stiffness: 520, damping: 26 }}
                  className="relative grid size-[60px] place-items-center rounded-full border border-white/70 bg-gradient-to-br from-primary to-[#1F2937] text-primary-foreground shadow-[0_18px_40px_-22px_rgba(15,23,42,0.55)]"
                >
                  <span className="relative z-10">{renderGlyph(centerItem, "center")}</span>
                </motion.div>
              </div>
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
