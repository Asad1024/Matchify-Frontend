import { useMemo, useState, useEffect } from "react";
import { useLocation } from "wouter";
import Header from "@/components/common/Header";
import BottomNav from "@/components/common/BottomNav";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Pencil,
  Settings,
  Shield,
  Share2,
  SlidersHorizontal,
  Sparkles,
  LogOut,
  MessageCircle,
} from "lucide-react";
import { VerifiedTick } from "@/components/common/VerifiedTick";
import { VerificationRequestBanner } from "@/components/profile/VerificationRequestBanner";
import { useCurrentUser } from "@/contexts/UserContext";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { setExploreModePersisted } from "@/lib/exploreMode";
import { cn } from "@/lib/utils";
import {
  avatarFromStoredCurrentUserForUserId,
  resolveUserDisplayAvatarUrl,
} from "@/lib/userDisplayAvatar";

export default function Menu() {
  const [location, setLocation] = useLocation();
  const { userId } = useCurrentUser();
  const { logout } = useAuth();
  const { toast } = useToast();
  const [mode, setMode] = useState<"marriage" | "social">("marriage");

  const buildInviteLink = () => {
    const base = window.location.origin;
    const ref = encodeURIComponent(userId ?? "");
    return ref ? `${base}/signup?ref=${ref}` : `${base}/signup`;
  };

  const inviteFriends = async () => {
    try {
      const url = buildInviteLink();
      const title = "Join me on Matchify";
      const text = "Come join Matchify — here's my invite link:";
      const sharePayload = { title, text, url };

      if (navigator.share) {
        await navigator.share(sharePayload);
        toast({ title: "Invite shared" });
        return;
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        toast({ title: "Invite link copied", description: url });
        return;
      }

      toast({ title: "Invite link", description: url });
    } catch {
      toast({ title: "Could not share invite", variant: "destructive" });
    }
  };

  useEffect(() => {
    if (location === "/menu") setMode("marriage");
  }, [location]);

  const { data: me } = useQuery<{
    name?: string;
    username?: string;
    avatar?: string | null;
    verified?: boolean | null;
    verificationRequest?: {
      status?: string;
      message?: string;
      submittedAt?: string;
    } | null;
  }>({
    queryKey: [`/api/users/${userId}`],
    enabled: !!userId,
  });

  const menuAvatarSrc =
    resolveUserDisplayAvatarUrl(me ?? undefined) || avatarFromStoredCurrentUserForUserId(userId);

  const displayName = me?.name || "Member";
  const handle = me?.username ? `@${me.username}` : "";

  const marriageItems = useMemo(
    () => [
      {
        id: "edit",
        label: "Edit profile",
        sub: "Name, username, bio, and photos (onboarding changes go through support).",
        icon: Pencil,
        onClick: () => setLocation("/profile/social/edit"),
      },
      {
        id: "message-requests",
        label: "Message requests",
        sub: "Requests you’ve sent and received before chat opens.",
        icon: MessageCircle,
        onClick: () => setLocation("/chat-requests"),
      },
      {
        id: "settings",
        label: "Settings",
        sub: "Privacy, notifications, and account.",
        icon: Settings,
        dot: true,
        onClick: () => setLocation("/settings"),
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
        onClick: () => setLocation("/support"),
      },
      {
        id: "invite",
        label: "Invite friends",
        sub: "Bring friends into your community.",
        icon: Share2,
        onClick: inviteFriends,
      },
    ],
    [inviteFriends, setLocation],
  );

  return (
    <div className="min-h-screen bg-[hsl(var(--surface-2))] pb-32">
      <Header
        showSearch={false}
        title="Menu"
        subtitle="Profile, settings, and support"
        unreadNotifications={0}
        onNotifications={() => setLocation("/notifications")}
        onCreate={() => setLocation("/")}
        onLogout={logout}
      />

      <div className="max-w-lg mx-auto px-4 pt-2">
        <div className="matchify-surface rounded-[20px] p-3">
          <div className="rounded-full bg-muted/60 p-1">
            <div className="grid grid-cols-2 gap-1">
              <button
                type="button"
                onClick={() => {
                  setMode("marriage");
                  setExploreModePersisted("marriage");
                }}
                className={cn(
                  "relative h-10 rounded-full text-[13px] font-medium transition-colors",
                  mode === "marriage" ? "text-slate-900" : "text-slate-500 hover:text-slate-700",
                )}
              >
                {mode === "marriage" ? (
                  <span className="absolute inset-0 rounded-full bg-background shadow-2xs" />
                ) : null}
                <span className="relative">Marriage</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode("social");
                  setExploreModePersisted("social");
                }}
                className={cn(
                  "relative h-10 rounded-full text-[13px] font-medium transition-colors",
                  mode === "social" ? "text-slate-900" : "text-slate-500 hover:text-slate-700",
                )}
              >
                {mode === "social" ? (
                  <span className="absolute inset-0 rounded-full bg-background shadow-2xs" />
                ) : null}
                <span className="relative inline-flex items-center gap-1">
                  Social
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
                </span>
              </button>
            </div>
          </div>
        </div>

        {userId && me && !me.verified ? (
          <div className="mt-3">
            <VerificationRequestBanner
              userId={userId}
              verified={me.verified}
              verificationRequest={me.verificationRequest}
              compact
            />
          </div>
        ) : null}

        <div className="mt-3 space-y-3">
          {mode === "marriage" && (
            <>
              <div className="matchify-surface rounded-[20px] p-5">
                <div className="flex flex-col items-center text-center">
                  <Avatar className="h-28 w-28 border-[3px] border-white shadow-lg ring-1 ring-black/[0.04]">
                    <AvatarImage src={menuAvatarSrc || undefined} />
                    <AvatarFallback className="bg-amber-100 text-3xl">😊</AvatarFallback>
                  </Avatar>
                  <div className="mt-4 flex items-center justify-center gap-1.5 flex-wrap">
                    <p className="text-[22px] font-semibold text-slate-900">{displayName}</p>
                    {me?.verified ? (
                      <VerifiedTick size="lg" />
                    ) : null}
                  </div>
                  {handle ? <p className="mt-1 text-[13px] font-medium text-slate-500">{handle}</p> : null}
                  <Button
                    variant="outline"
                    className="mt-4 h-9 rounded-full px-3 text-[13px]"
                    onClick={() => setLocation("/profile")}
                  >
                    View profile
                  </Button>

                  <div className="mt-3 flex items-center justify-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-9 w-11 rounded-full px-0"
                      onClick={() => setLocation("/profile/social/edit")}
                      aria-label="Edit profile"
                      title="Edit profile"
                    >
                      <Pencil className="h-4.5 w-4.5" strokeWidth={1.75} aria-hidden />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-9 w-11 rounded-full px-0"
                      onClick={() => setLocation("/settings")}
                      aria-label="Settings"
                      title="Settings"
                    >
                      <Settings className="h-4.5 w-4.5" strokeWidth={1.75} aria-hidden />
                    </Button>
                  </div>
                </div>
              </div>

              <MenuCard title="More">
                {marriageMoreItems.map((item) => (
                  <MenuItemRow key={item.id} {...item} />
                ))}
              </MenuCard>
            </>
          )}

          {mode === "social" && (
            <>
              <div className="matchify-surface rounded-[20px] border-white/0 bg-card/70 p-5 shadow-2xs">
                <div className="flex flex-col items-center text-center">
                  <Avatar className="h-28 w-28 border-[3px] border-white shadow-lg ring-1 ring-black/[0.04]">
                    <AvatarImage src={menuAvatarSrc || undefined} />
                    <AvatarFallback className="bg-amber-100 text-3xl">😊</AvatarFallback>
                  </Avatar>
                  <div className="mt-4 flex items-center justify-center gap-1.5 flex-wrap">
                    <p className="text-[22px] font-semibold text-slate-900">{displayName}</p>
                    {me?.verified ? (
                      <VerifiedTick size="lg" />
                    ) : null}
                  </div>
                  {handle ? <p className="mt-1 text-[13px] font-medium text-slate-500">{handle}</p> : null}
                  <Button
                    variant="outline"
                    className="mt-4 h-9 rounded-full border-border/70 bg-transparent px-3 text-[13px] font-semibold text-slate-700 shadow-2xs hover:bg-slate-900/[0.03]"
                    onClick={() => setLocation("/profile/social")}
                  >
                    View profile
                  </Button>

                  <div className="mt-3 flex items-center justify-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-9 w-11 rounded-full border-border/70 bg-card/60 px-0 text-slate-700 shadow-2xs hover:bg-slate-900/[0.03]"
                      onClick={() => setLocation("/profile/social/edit")}
                      aria-label="Edit profile"
                      title="Edit profile"
                    >
                      <Pencil className="h-4.5 w-4.5" strokeWidth={1.75} aria-hidden />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-9 w-11 rounded-full border-border/70 bg-card/60 px-0 text-slate-700 shadow-2xs hover:bg-slate-900/[0.03]"
                      onClick={() => setLocation("/settings")}
                      aria-label="Settings"
                      title="Settings"
                    >
                      <Settings className="h-4.5 w-4.5" strokeWidth={1.75} aria-hidden />
                    </Button>
                  </div>
                </div>
              </div>

              <MenuCard title="Social">
                <MenuItemRow
                  label="Connections & privacy"
                  sub="Followers, muted accounts, and blocked users."
                  icon={SlidersHorizontal}
                  onClick={() => setLocation("/settings/social")}
                />
              </MenuCard>

              <MenuCard title="More">
                {marriageMoreItems.map((item) => (
                  <MenuItemRow key={item.id} {...item} />
                ))}
              </MenuCard>
            </>
          )}
        </div>

        <div className="mt-3">
          <button
            type="button"
            onClick={logout}
            className="w-full rounded-[20px] border border-border/70 bg-rose-500/10 px-4 py-3 text-left text-[15px] font-medium text-rose-700 shadow-2xs transition hover:bg-rose-500/15"
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
    <section className="matchify-surface rounded-[20px] border-white/0 bg-card/70 shadow-2xs">
      <div className="px-4 pt-4 pb-1">
        <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-slate-500">{title}</p>
      </div>
      <div className="divide-y divide-border/70">{children}</div>
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
      className="w-full flex items-start gap-3 px-4 py-4 text-left transition-colors hover:bg-foreground/[0.03]"
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
      className="w-full flex items-start gap-3 px-4 py-4 text-left transition-colors hover:bg-foreground/[0.03]"
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
