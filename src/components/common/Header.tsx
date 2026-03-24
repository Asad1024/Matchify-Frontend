import type { ReactNode } from "react";
import { Search, Settings, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlobalSearch } from "./GlobalSearch";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import HamburgerMenu, { HamburgerMenuButton } from "./HamburgerMenu";
import { MATCHIFY_LOGO_URL } from "@/lib/matchifyBranding";

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
}

export default function Header({
  showSearch = true,
  unreadNotifications = 0,
  onSearch,
  onNotifications,
  onCreate,
  onSettings,
  onLogout,
  title,
  showBack,
  onBack,
  rightAccessory,
  subtitle,
}: HeaderProps) {
  return (
    <>
      <GlobalSearch />
      <HamburgerMenu onLogout={onLogout} buttonPosition="header">
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100"
                style={{ boxShadow: "0 1px 0 rgba(0,0,0,0.06)" }}>
          <div className="flex items-center justify-between px-4 min-h-[4rem] py-2 max-w-2xl mx-auto">
            {/* Left */}
            <div className="flex items-center gap-2">
              <HamburgerMenuButton />
              {title ? (
                <div className="flex flex-col min-w-0">
                  <h1 className="text-[17px] font-bold text-gray-900 leading-tight truncate">{title}</h1>
                  {subtitle ? (
                    <p className="text-[11px] text-gray-500 font-medium truncate">{subtitle}</p>
                  ) : null}
                </div>
              ) : (
                <img
                  src={MATCHIFY_LOGO_URL}
                  alt=""
                  className="h-11 sm:h-12 w-auto object-contain"
                  style={{ maxHeight: 48 }}
                />
              )}
            </div>

            {/* Right: actions */}
            <div className="flex items-center gap-0.5">
              {showSearch && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="w-9 h-9 rounded-full text-gray-500 hover:text-primary hover:bg-primary/10 transition-colors"
                  data-testid="button-search"
                >
                  <Search className="w-[18px] h-[18px]" />
                </Button>
              )}

              {onCreate && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="w-9 h-9 rounded-full text-primary hover:text-primary hover:bg-primary/10 transition-colors"
                  onClick={onCreate}
                  data-testid="button-create-post"
                  aria-label="Create post"
                >
                  <Plus className="w-[20px] h-[20px]" strokeWidth={2.5} />
                </Button>
              )}

              {rightAccessory}

              <NotificationCenter />

              <Button
                size="icon"
                variant="ghost"
                className="w-9 h-9 rounded-full text-gray-500 hover:text-primary hover:bg-primary/10 transition-colors hidden md:flex"
                onClick={onSettings}
                data-testid="button-settings"
              >
                <Settings className="w-[18px] h-[18px]" />
              </Button>
            </div>
          </div>
        </header>
      </HamburgerMenu>
    </>
  );
}
