import { HeartHandshake, Compass, Globe, MessageCircle, UserCircle } from "lucide-react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useCurrentUser } from "@/contexts/UserContext";

interface BottomNavProps {
  active: string;
  onNavigate?: (page: string) => void;
}

/** 5-tab bar: Marriage · Explore · Community · Chat · Menu */
const NAV_ITEMS = [
  { id: "marriage", icon: HeartHandshake, label: "Marriage", path: "/" },
  { id: "explore", icon: Compass, label: "Explore", path: "/explore" },
  { id: "community", icon: Globe, label: "Community", path: "/community", center: true },
  { id: "chat", icon: MessageCircle, label: "Chat", path: "/chat" },
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
      <div className="flex items-end justify-around max-w-lg mx-auto px-1 pb-1 pt-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;

          if (item.center) {
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item)}
                className="flex flex-col items-center gap-0.5 py-1 px-3 -mt-5 outline-none"
                data-testid={`tab-${item.id}`}
              >
                <motion.div
                  whileTap={{ scale: 0.88 }}
                  transition={{ type: "spring", stiffness: 500, damping: 22 }}
                  className={`w-[52px] h-[52px] rounded-[18px] flex items-center justify-center shadow-lg transition-all ${
                    isActive ? "bg-primary shadow-primary/40" : "bg-primary shadow-primary/25"
                  }`}
                >
                  <Icon className="w-6 h-6 text-white" strokeWidth={isActive ? 2.5 : 2} />
                </motion.div>
                <span
                  className={`text-[10px] font-semibold transition-colors ${
                    isActive ? "text-primary" : "text-gray-400"
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
                <Icon
                  className={`w-[22px] h-[22px] transition-colors duration-200 relative z-10 ${
                    isActive ? "text-primary" : "text-gray-400"
                  }`}
                  strokeWidth={isActive ? 2.5 : 1.8}
                />
                {item.id === "chat" && chatUnread > 0 && (
                  <span className="absolute -top-1 -right-1 z-20 min-w-[16px] h-4 px-1 rounded-full bg-primary text-white text-[9px] font-bold flex items-center justify-center border border-white shadow-sm">
                    {chatUnread > 9 ? "9+" : chatUnread}
                  </span>
                )}
              </motion.div>

              <span
                className={`text-[10px] font-semibold transition-colors duration-200 ${
                  isActive ? "text-primary" : "text-gray-400"
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
