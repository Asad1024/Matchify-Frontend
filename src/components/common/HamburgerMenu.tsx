import { useState, createContext, useContext } from "react";
import {
  Menu,
  X,
  Users,
  Compass,
  Calendar,
  MessageCircle,
  User,
  Bell,
  GraduationCap,
  Crown,
  LogOut,
  Sparkles,
  Heart,
  Eye,
  UserCircle,
  HeartHandshake,
  Globe,
} from "lucide-react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { MATCHIFY_LOGO_URL } from "@/lib/matchifyBranding";

const MenuContext = createContext<{
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}>({ isOpen: false, setIsOpen: () => {} });

export const useMenuContext = () => useContext(MenuContext);

type MenuItem = {
  icon: typeof HeartHandshake;
  label: string;
  path: string;
  highlight?: boolean;
};

const MENU_SECTIONS: { title: string; items: MenuItem[] }[] = [
  {
    title: "Main",
    items: [
      { icon: Sparkles, label: "AI Matchmaker", path: "/ai-matchmaker", highlight: true },
      { icon: HeartHandshake, label: "Marriage", path: "/" },
      { icon: Compass, label: "Discover", path: "/explore" },
      { icon: Globe, label: "Explore", path: "/community" },
      { icon: Users, label: "People", path: "/directory" },
      { icon: Calendar, label: "Events", path: "/events" },
      { icon: MessageCircle, label: "Chat", path: "/chat" },
      { icon: UserCircle, label: "Menu", path: "/menu" },
      { icon: User, label: "My profile", path: "/profile" },
    ],
  },
  {
    title: "Coaching & learning",
    items: [
      { icon: Heart, label: "AI Luna Coach", path: "/relationship-coaching" },
      { icon: UserCircle, label: "Coaches", path: "/coaches" },
      { icon: GraduationCap, label: "Courses", path: "/courses" },
    ],
  },
  {
    title: "More",
    items: [
      { icon: Eye, label: "Empathy Observer", path: "/empathy-observer" },
      { icon: Bell, label: "Notifications", path: "/notifications" },
    ],
  },
];

interface HamburgerMenuProps {
  onLogout?: () => void;
  buttonPosition?: "header" | "fixed";
  children?: React.ReactNode;
}

export default function HamburgerMenu({
  onLogout,
  buttonPosition = "fixed",
  children,
}: HamburgerMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [location, setLocation] = useLocation();

  const buttonClass =
    buttonPosition === "header"
      ? "flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all duration-300 hover-elevate hover:bg-primary/10 active:scale-95"
      : "fixed top-4 left-4 z-[100] w-11 h-11 flex items-center justify-center flex-shrink-0 transition-all duration-300 hover-elevate bg-background/95 backdrop-blur-md border border-border/60 shadow-lg hover:shadow-xl rounded-lg hover:bg-primary/10 hover:border-primary/30 active:scale-95";

  return (
    <MenuContext.Provider value={{ isOpen, setIsOpen }}>
      {buttonPosition === "fixed" && (
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          className={buttonClass}
          data-testid="button-hamburger-menu"
          aria-label={isOpen ? "Close menu" : "Open menu"}
          aria-expanded={isOpen}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <motion.div
            animate={{ rotate: isOpen ? 90 : 0 }}
            transition={{ duration: 0.2 }}
          >
            {isOpen ? (
              <X className="h-5 w-5 text-foreground" />
            ) : (
              <Menu className="h-5 w-5 text-foreground" />
            )}
          </motion.div>
        </motion.button>
      )}

      {children}

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[99]"
              onClick={() => setIsOpen(false)}
              data-testid="menu-backdrop"
            />

            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 bottom-0 w-72 sm:w-80 bg-background border-r border-primary/25 z-[100] overflow-y-auto scrollbar-hide shadow-2xl"
              data-testid="menu-panel"
            >
              <div className="p-6 sm:p-8">
                <motion.div
                  className="mb-8 flex justify-center items-center"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <img
                    src={MATCHIFY_LOGO_URL}
                    alt=""
                    className="h-24 sm:h-28 w-auto object-contain"
                    data-testid="menu-logo"
                  />
                </motion.div>

                <nav className="space-y-6">
                  {MENU_SECTIONS.map((section, si) => (
                    <div key={section.title}>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2 px-1">
                        {section.title}
                      </p>
                      <div className="space-y-1">
                        {section.items.map((item, index) => {
                          const Icon = item.icon;
                          const isActive =
                            location === item.path || location.startsWith(`${item.path}/`);
                          const isHighlight = !!item.highlight;
                          const globalIndex = si * 10 + index;

                          return (
                            <motion.button
                              key={item.path + item.label}
                              initial={{ opacity: 0, x: -16 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.05 + globalIndex * 0.02 }}
                              onClick={() => {
                                setIsOpen(false);
                                setLocation(item.path);
                              }}
                              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
                                isActive
                                  ? "bg-primary text-primary-foreground shadow-md"
                                  : isHighlight
                                    ? "text-primary bg-primary/10 hover:bg-primary/15"
                                    : "text-foreground/85 hover:bg-primary/10 hover:text-primary"
                              }`}
                              data-testid={`menu-link-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                              whileHover={{ x: 3 }}
                              whileTap={{ scale: 0.99 }}
                            >
                              <Icon
                                className={`h-5 w-5 flex-shrink-0 ${isHighlight && !isActive ? "text-primary" : ""}`}
                              />
                              <span className="font-medium text-sm text-left flex-1">{item.label}</span>
                              {isHighlight && !isActive && (
                                <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full font-semibold">
                                  AI
                                </span>
                              )}
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>
                  ))}

                  <div className="pt-2 border-t border-border">
                    <button
                      onClick={() => {
                        setIsOpen(false);
                        onLogout?.();
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer text-destructive hover:bg-destructive/10"
                      data-testid="menu-logout"
                    >
                      <LogOut className="h-5 w-5" />
                      <span className="font-medium text-sm">Logout</span>
                    </button>
                  </div>
                </nav>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </MenuContext.Provider>
  );
}

export function HamburgerMenuButton() {
  const { isOpen, setIsOpen } = useMenuContext();

  return (
    <motion.button
      onClick={() => setIsOpen(!isOpen)}
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all duration-300 hover-elevate hover:bg-primary/10 active:scale-95"
      data-testid="button-hamburger-menu-header"
      aria-label={isOpen ? "Close menu" : "Open menu"}
      aria-expanded={isOpen}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <motion.div animate={{ rotate: isOpen ? 90 : 0 }} transition={{ duration: 0.2 }}>
        {isOpen ? (
          <X className="h-5 w-5 text-foreground" strokeWidth={2} aria-hidden />
        ) : (
          <Menu className="h-5 w-5 text-foreground" strokeWidth={2} aria-hidden />
        )}
      </motion.div>
    </motion.button>
  );
}
