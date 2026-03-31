import { useMemo, useState, useEffect } from "react";
import { useLocation } from "wouter";
import Header from "@/components/common/Header";
import BottomNav from "@/components/common/BottomNav";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Pencil,
  SlidersHorizontal,
  Settings,
  Ticket,
  Shield,
  Share2,
  Bookmark,
  Sparkles,
  CheckCircle,
  LogOut,
} from "lucide-react";
import { useCurrentUser } from "@/contexts/UserContext";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { SOCIAL_PROFILE_TAB_KEY } from "@/lib/settingsSocialNav";
import { setExploreModePersisted } from "@/lib/exploreMode";
import { cn } from "@/lib/utils";

export default function Menu() {
  const [location, setLocation] = useLocation();
  const { userId } = useCurrentUser();
  const { logout } = useAuth();
  const { toast } = useToast();
  const [mode, setMode] = useState<"marriage" | "social">("marriage");

  useEffect(() => {
    if (location === "/menu") setMode("marriage");
  }, [location]);

  const { data: me } = useQuery<{
    name?: string;
    username?: string;
    avatar?: string | null;
    verified?: boolean | null;
  }>({
    queryKey: [`/api/users/${userId}`],
    enabled: !!userId,
  });

  const displayName = me?.name || "Member";
  const handle = me?.username ? `@${me.username}` : "";

  const marriageItems = useMemo(
    () => [
      {
        id: "edit",
        label: "Edit profile",
        sub: "Keep your profile fresh and intentional.",
        icon: Pencil,
        onClick: () => setLocation("/profile?marriage=1&tab=edit"),
      },
      {
        id: "filters",
        label: "Search filters",
        sub: "Tune who you see in discovery.",
        icon: SlidersHorizontal,
        onClick: () => setLocation("/directory"),
      },
      {
        id: "settings",
        label: "Settings",
        sub: "Privacy, notifications, and account.",
        icon: Settings,
        dot: true,
        onClick: () => setLocation("/settings"),
      },
      {
        id: "events",
        label: "Events",
        sub: "Meet singles face-to-face. Discover events near you.",
        icon: Ticket,
        onClick: () => setLocation("/events"),
      },
    ],
    [setLocation],
  );

  const marriageMoreItems = useMemo(
    () => [
      {
        id: "support",
        label: "Help & support",
        sub: "Get answers and report issues.",
        icon: Shield,
        onClick: () => toast({ title: "Support", description: "Coming soon." }),
      },
      {
        id: "invite",
        label: "Invite friends",
        sub: "Bring friends into your community.",
        icon: Share2,
        onClick: () => toast({ title: "Invite", description: "Share link coming soon." }),
      },
    ],
    [toast],
  );

  const socialItems = useMemo(
    () => [
      {
        id: "edit",
        label: "Edit profile",
        sub: "Update your social presence.",
        icon: Pencil,
        dot: true,
        onClick: () => setLocation("/profile/social/edit"),
      },
      {
        id: "saved",
        label: "Saved posts",
        sub: "Quick access to what you bookmarked.",
        icon: Bookmark,
        onClick: () => {
          try {
            sessionStorage.setItem(SOCIAL_PROFILE_TAB_KEY, "saved");
          } catch {
            /* ignore */
          }
          setLocation("/profile/social");
        },
      },
      {
        id: "settings",
        label: "Settings",
        sub: "Privacy, notifications, and account.",
        icon: Settings,
        onClick: () => setLocation("/settings"),
      },
      {
        id: "support",
        label: "Help & support",
        sub: "Get answers and report issues.",
        icon: Shield,
        onClick: () => toast({ title: "Support", description: "Coming soon." }),
      },
      {
        id: "invite",
        label: "Invite friends",
        sub: "Bring friends into your community.",
        icon: Share2,
        onClick: () => toast({ title: "Invite", description: "Share link coming soon." }),
      },
    ],
    [setLocation, toast],
  );

  return (
    <div className="min-h-screen bg-[#F9FAFB] pb-32">
      <Header
        showSearch={false}
        title="Menu"
        unreadNotifications={0}
        onNotifications={() => setLocation("/notifications")}
        onCreate={() => setLocation("/")}
        onLogout={logout}
      />

      <div className="max-w-lg mx-auto px-4 pt-2">
        <div className="rounded-[20px] border border-[#F0F0F0] bg-white/80 p-3 shadow-[0_4px_20px_rgba(0,0,0,0.05)] backdrop-blur-md">
          <div className="rounded-full bg-[#F1F2F4] p-1">
            <div className="grid grid-cols-2 gap-1">
              <button
                type="button"
                onClick={() => {
                  setMode("marriage");
                  setExploreModePersisted("marriage");
                  toast({
                    title: "Marriage mode",
                    description: "Explore shows people sorted for serious dating.",
                  });
                }}
                className={cn(
                  "relative h-10 rounded-full text-[13px] font-semibold transition",
                  mode === "marriage" ? "text-slate-900" : "text-slate-500 hover:text-slate-700",
                )}
              >
                {mode === "marriage" ? (
                  <span className="absolute inset-0 rounded-full bg-white shadow-[0_10px_30px_-18px_rgba(15,23,42,0.22)]" />
                ) : null}
                <span className="relative">Marriage</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode("social");
                  setExploreModePersisted("social");
                  toast({
                    title: "Social mode",
                    description: "Explore prioritizes friends & community-first connections.",
                  });
                }}
                className={cn(
                  "relative h-10 rounded-full text-[13px] font-semibold transition",
                  mode === "social" ? "text-slate-900" : "text-slate-500 hover:text-slate-700",
                )}
              >
                {mode === "social" ? (
                  <span className="absolute inset-0 rounded-full bg-white shadow-[0_10px_30px_-18px_rgba(15,23,42,0.22)]" />
                ) : null}
                <span className="relative inline-flex items-center gap-1">
                  Social
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
                </span>
              </button>
            </div>
          </div>
        </div>

        <div className="mt-3 space-y-3">
          {mode === "marriage" && (
            <>
              <div className="rounded-[20px] border border-[#F0F0F0] bg-white p-5 shadow-sm">
                <div className="flex flex-col items-center text-center">
                  <Avatar className="h-28 w-28 border-[3px] border-white shadow-[0_10px_30px_-18px_rgba(15,23,42,0.28)] ring-1 ring-black/[0.04]">
                    <AvatarImage src={me?.avatar || undefined} />
                    <AvatarFallback className="bg-amber-100 text-3xl">😊</AvatarFallback>
                  </Avatar>
                  <div className="mt-4 flex items-center justify-center gap-1.5 flex-wrap">
                    <p className="text-[22px] font-semibold text-slate-900">{displayName}</p>
                    {me?.verified ? (
                      <CheckCircle className="w-5 h-5 text-sky-500 shrink-0" strokeWidth={1.75} aria-label="Verified" />
                    ) : null}
                  </div>
                  {handle ? <p className="mt-1 text-[13px] font-medium text-slate-500">{handle}</p> : null}
                  <Button
                    variant="outline"
                    className="mt-4 h-9 rounded-full border-[#F0F0F0] bg-transparent px-3 text-[13px] font-semibold text-slate-700 hover:bg-slate-900/[0.03]"
                    onClick={() => setLocation("/profile")}
                  >
                    View profile
                  </Button>
                </div>
              </div>

              <MenuCard title="Dashboard">
                {marriageItems.map((item) => (
                  <MenuItemRow key={item.id} {...item} />
                ))}
              </MenuCard>

              <MenuCard title="More">
                {marriageMoreItems.map((item) => (
                  <MenuItemRow key={item.id} {...item} />
                ))}
              </MenuCard>

              <div className="rounded-[20px] bg-gradient-to-br from-primary/20 via-transparent to-sky-200/30 p-[1px] shadow-sm">
                <div className="rounded-[20px] bg-white">
                  <MenuItemRow
                    label="AI Matchmaker"
                    sub="AI-powered questionnaire for better matches."
                    icon={Sparkles}
                    premium
                    onClick={() => setLocation("/ai-matchmaker")}
                  />
                </div>
              </div>
            </>
          )}

          {mode === "social" && (
            <div className="pt-6 pb-2">
              <div className="flex flex-col items-center text-center mb-6">
                <Avatar className="w-24 h-24 border-4 border-teal-200">
                  <AvatarImage src={me?.avatar || undefined} />
                  <AvatarFallback className="bg-amber-100 text-2xl">😊</AvatarFallback>
                </Avatar>
                <p className="font-bold text-lg mt-3">{displayName}</p>
                <p className="text-sm text-gray-500">{handle}</p>
                <Button
                  variant="ghost"
                  className="text-primary font-semibold h-auto py-1"
                  onClick={() => setLocation("/profile/social")}
                >
                  View profile
                </Button>
              </div>
              <nav className="rounded-[20px] border border-[#F0F0F0] bg-white shadow-sm">
                <MenuRow
                  icon={<Pencil className="w-5 h-5 text-gray-600" />}
                  label="Edit Profile"
                  dot
                  onClick={() => setLocation("/profile/social/edit")}
                />
                <MenuRow
                  icon={<Bookmark className="w-5 h-5 text-gray-600" />}
                  label="Saved Posts"
                  onClick={() => {
                    try {
                      sessionStorage.setItem(SOCIAL_PROFILE_TAB_KEY, "saved");
                    } catch {
                      /* ignore */
                    }
                    setLocation("/profile/social");
                  }}
                />
                <MenuRow
                  icon={<Settings className="w-5 h-5 text-gray-600" />}
                  label="Settings"
                  onClick={() => setLocation("/settings")}
                />
                <MenuRow
                  icon={<Shield className="w-5 h-5 text-gray-600" />}
                  label="Help & Support Center"
                  onClick={() => toast({ title: "Support", description: "Coming soon." })}
                />
                <MenuRow
                  icon={<Share2 className="w-5 h-5 text-gray-600" />}
                  label="Invite friends"
                  onClick={() => toast({ title: "Invite", description: "Coming soon." })}
                />
              </nav>
            </div>
          )}
        </div>

        <div className="mt-3">
          <button
            type="button"
            onClick={logout}
            className="w-full rounded-[20px] border border-[#F0F0F0] bg-rose-500/10 px-4 py-3 text-left text-[15px] font-medium text-rose-700 shadow-sm transition hover:bg-rose-500/15"
          >
            <span className="inline-flex items-center gap-2">
              <LogOut className="h-4 w-4" strokeWidth={1.75} aria-hidden />
              Logout
            </span>
          </button>
        </div>
      </div>

      <BottomNav active="menu" onNavigate={() => {}} />
    </div>
  );
}

function MenuCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[20px] border border-[#F0F0F0] bg-white shadow-sm">
      <div className="px-4 pt-4 pb-1">
        <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-slate-500">{title}</p>
      </div>
      <div className="divide-y divide-[#F0F0F0]">{children}</div>
    </section>
  );
}

function MenuItemRow({
  icon: Icon,
  label,
  sub,
  dot,
  premium,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: string | number }>;
  label: string;
  sub?: string;
  dot?: boolean;
  premium?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-start gap-3 px-4 py-4 text-left transition-colors hover:bg-[#F9FAFB]"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/5 text-primary">
        <Icon
          className={cn(
            "h-5 w-5",
            premium &&
              "text-transparent bg-clip-text [background-image:linear-gradient(135deg,#722F37,#7C3AED,#06B6D4)]",
          )}
          strokeWidth={1.75}
        />
      </div>

      <div className="flex-1 min-w-0 pt-0.5">
        <div className="flex items-center gap-2">
          <span className="text-[15px] font-medium text-slate-900">{label}</span>
          {dot && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
          {premium ? (
            <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
              <Sparkles className="h-3 w-3" strokeWidth={1.75} aria-hidden />
              AI
            </span>
          ) : null}
        </div>
        {sub ? <p className="mt-1 text-[12px] font-normal text-slate-500 leading-relaxed">{sub}</p> : null}
      </div>
    </button>
  );
}

function MenuRow({
  icon,
  label,
  sub,
  dot,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  sub?: string;
  dot?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-start gap-3 px-4 py-4 text-left transition-colors hover:bg-[#F9FAFB]"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[15px] font-medium text-slate-900">{label}</span>
          {dot && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
        </div>
        {sub ? <p className="mt-1 text-[12px] font-normal text-slate-500 leading-relaxed">{sub}</p> : null}
      </div>
      <div className="flex-shrink-0 text-gray-400">{icon}</div>
    </button>
  );
}
