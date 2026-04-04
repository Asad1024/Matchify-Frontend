import { type ReactNode, useSyncExternalStore } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Search, Settings, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { GlobalSearch, OPEN_GLOBAL_SEARCH_EVENT } from "./GlobalSearch";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import HamburgerMenu, { HamburgerMenuButton } from "./HamburgerMenu";
import { MATCHIFY_LOGO_URL } from "@/lib/matchifyBranding";
import { useCurrentUser } from "@/contexts/UserContext";
import { showOnlineDotForSelf } from "@/lib/presence";
import { OnlineIndicator } from "@/components/profile/OnlineIndicator";
import { cn } from "@/lib/utils";
import { resolveUserDisplayAvatarUrl } from "@/lib/userDisplayAvatar";

/** Dispatched when `localStorage.currentUser` is updated (profile save, etc.). */
export const MATCHIFY_CURRENT_USER_UPDATED_EVENT = "matchify-header-user";

/** Parsed user for header — only used after parsing a stable snapshot string. */
function parseHeaderUser(raw: string | null): { avatar: string | null; name: string } {
  if (!raw) return { avatar: null, name: "Profile" };
  try {
    const u = JSON.parse(raw) as {
      avatar?: string | null;
      picture?: string | null;
      photos?: unknown;
      name?: string;
    };
    const avatar = resolveUserDisplayAvatarUrl(u);
    return {
      avatar,
      name: (u.name || "").trim() || "Profile",
    };
  } catch {
    return { avatar: null, name: "Profile" };
  }
}

/**
 * Stable snapshot for useSyncExternalStore (must be === when data unchanged).
 * Returning a new object from getSnapshot every call causes infinite re-renders.
 */
function getHeaderUserSnapshot(): string {
  return localStorage.getItem("currentUser") ?? "";
}

function subscribeTabVisible(cb: () => void) {
  document.addEventListener("visibilitychange", cb);
  return () => document.removeEventListener("visibilitychange", cb);
}
function getTabVisibleSnapshot() {
  return document.visibilityState === "visible" ? "1" : "0";
}

function subscribeHeaderUser(cb: () => void) {
  const onStorage = (e: StorageEvent) => {
    if (e.key === "currentUser" || e.key === "authToken") cb();
  };
  const onCustom = () => cb();
  window.addEventListener("storage", onStorage);
  window.addEventListener(MATCHIFY_CURRENT_USER_UPDATED_EVENT, onCustom);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(MATCHIFY_CURRENT_USER_UPDATED_EVENT, onCustom);
  };
}

export function notifyHeaderUserUpdated() {
  window.dispatchEvent(new Event(MATCHIFY_CURRENT_USER_UPDATED_EVENT));
}

interface HeaderProps {
  showSearch?: boolean;
  unreadNotifications?: number;
  onSearch?: (query: string) => void;
  onNotifications?: () => void;
  onCreate?: () => void;
  onSettings?: () => void;
  onLogout?: () => void;
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  /** Extra control shown before notifications (e.g. Muzz-style boost pill) */
  rightAccessory?: ReactNode;
  /** Small line under title (e.g. community tagline) */
  subtitle?: string;
  /**
   * Show the top-right profile avatar. Hidden by default; primary entry is the bottom nav avatar → /menu.
   */
  hideProfileAvatar?: boolean;
  /** Override default title size (e.g. Explore uses a larger headline). */
  titleClassName?: string;
}

export default function Header({
  showSearch = true,
  unreadNotifications = 0,
  onSearch,
  onNotifications,
  onCreate,
  onSettings,
  hideProfileAvatar,
  onLogout,
  title,
  showBack,
  onBack,
  rightAccessory,
  subtitle,
  titleClassName,
}: HeaderProps) {
  const [location, setLocation] = useLocation();
  const { userId: headerUserId } = useCurrentUser();
  const tabVisible =
    useSyncExternalStore(subscribeTabVisible, getTabVisibleSnapshot, getTabVisibleSnapshot) === "1";
  const { data: meForPresence } = useQuery({
    queryKey: [`/api/users/${headerUserId}`],
    enabled: !!headerUserId,
  });
  const privacy = (meForPresence as { privacy?: { showOnlineStatus?: boolean } } | undefined)?.privacy;
  const showHeaderOnlineDot = showOnlineDotForSelf(privacy, tabVisible);

  const userJson = useSyncExternalStore(
    subscribeHeaderUser,
    getHeaderUserSnapshot,
    getHeaderUserSnapshot,
  );
  const headerUser = parseHeaderUser(userJson === "" ? null : userJson);
  /** Top avatar is off unless a screen explicitly sets `hideProfileAvatar={false}`. */
  const showProfileAvatar = hideProfileAvatar === false;
  const handleProfileAvatar = () => {
    if (onSettings) onSettings();
    else setLocation("/profile");
  };
  const showLuna = false;
  const headerInitials = headerUser.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <>
      <GlobalSearch />
      <HamburgerMenu onLogout={onLogout} buttonPosition="header">
        <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-md border-b border-border/70 shadow-2xs">
          <div className="mx-auto flex w-full max-w-lg items-center justify-between gap-3 px-4 py-2">
            {/* Left — menu + logo/title share one baseline-aligned row */}
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <div className="flex shrink-0 items-center justify-center">
                <HamburgerMenuButton />
              </div>
              {title ? (
                <div className="flex min-w-0 flex-col justify-center py-0.5">
                  <h1
                    className={cn(
                      "truncate text-[17px] font-semibold leading-tight text-foreground tracking-[0.2px]",
                      titleClassName,
                    )}
                  >
                    {title}
                  </h1>
                  {subtitle ? (
                    <p className="truncate text-[11px] font-medium text-muted-foreground">{subtitle}</p>
                  ) : null}
                </div>
              ) : (
                <div className="flex min-w-0 flex-1 items-center">
                  <img
                    src={MATCHIFY_LOGO_URL}
                    alt=""
                    className="h-10 w-auto max-h-10 object-contain object-left"
                  />
                </div>
              )}
            </div>

            {/* Right — same 40×40 hit targets as menu for vertical alignment */}
            <div className="flex shrink-0 items-center gap-1">
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-10 w-10 shrink-0 rounded-full text-foreground/55 hover:bg-foreground/[0.05] hover:text-foreground"
                data-testid="button-search"
                aria-label="Open search"
                onClick={() => window.dispatchEvent(new Event(OPEN_GLOBAL_SEARCH_EVENT))}
              >
                <Search className="h-5 w-5" strokeWidth={1.75} aria-hidden />
              </Button>
              <NotificationCenter />
            </div>
          </div>
        </header>
      </HamburgerMenu>
    </>
  );
}
