import { HeartHandshake, Compass, Globe, MessageCircle, UserCircle } from "lucide-react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";

interface BottomNavProps {
  active: string;
  onNavigate?: (page: string) => void;
}

/** Muzz-style 5-tab bar: Marriage · Explore · Jamaa · Chat · Menu */
const NAV_ITEMS = [
  { id: "marriage", icon: HeartHandshake, label: "Marriage", path: "/" },
  { id: "explore", icon: Compass, label: "Explore", path: "/explore" },
  { id: "jamaa", icon: Globe, label: "Jamaa", path: "/community", center: true },
  { id: "chat", icon: MessageCircle, label: "Chat", path: "/chat" },
  { id: "menu", icon: UserCircle, label: "Menu", path: "/menu" },
];

export default function BottomNav({ active, onNavigate }: BottomNavProps) {
  const [, setLocation] = useLocation();

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
                <Icon
                  className={`w-[22px] h-[22px] transition-colors duration-200 ${
                    isActive ? "text-primary" : "text-gray-400"
                  }`}
                  strokeWidth={isActive ? 2.5 : 1.8}
                />

                <AnimatePresence>
                  {isActive && (
                    <motion.span
                      layoutId={`dot-${item.id}`}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 500, damping: 28 }}
                      className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full"
                    />
                  )}
                </AnimatePresence>
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
