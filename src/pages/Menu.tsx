import { useMemo, useState, useEffect } from "react";
import { useLocation } from "wouter";
import Header from "@/components/common/Header";
import BottomNav from "@/components/common/BottomNav";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import ViewProfile from "@/pages/ViewProfile";
import SocialSelfProfile from "@/pages/SocialSelfProfile";
import { ShareProfileDialog } from "@/components/profile/ShareProfileDialog";
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
  const [socialShareOpen, setSocialShareOpen] = useState(false);

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

  const shareMyPublicProfile = async () => {
    if (!userId) return;
    const name = me?.name?.trim() || "Matchify";
    const url = `${window.location.origin}/profile/${userId}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: `${name} · Matchify`, url });
        return;
      }
    } catch {
      /* user cancelled share */
    }
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: "Link copied", description: "Share your public profile with this link." });
    } catch {
      toast({ title: "Copy this link", description: url });
    }
  };

  const marriageItems = useMemo(
    () => [
      {
        id: "message-requests",
        label: "Message requests",
        sub: "Requests you’ve sent and received before chat opens.",
        icon: MessageCircle,
        onClick: () => setLocation("/chat-requests"),
      },
    ],
    [setLocation],
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
                  mode === "marriage" ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {mode === "marriage" ? (
                  <span className="absolute inset-0 rounded-full bg-background shadow-2xs" />
                ) : null}
                <span className="relative">Matches</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode("social");
                  setExploreModePersisted("social");
                }}
                className={cn(
                  "relative h-10 rounded-full text-[13px] font-medium transition-colors",
                  mode === "social" ? "text-foreground" : "text-muted-foreground hover:text-foreground",
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
          {userId ? (
            <>
              <div className="matchify-surface flex items-center gap-3 rounded-[20px] border-white/0 bg-card/70 p-4 shadow-2xs">
                <Avatar className="h-14 w-14 shrink-0 border-2 border-background ring-1 ring-black/[0.04]">
                  <AvatarImage src={menuAvatarSrc || undefined} />
                  <AvatarFallback className="bg-amber-100 text-lg">😊</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate text-[17px] font-semibold text-foreground">{displayName}</p>
                    {me?.verified ? <VerifiedTick size="md" /> : null}
                  </div>
                  {handle ? (
                    <p className="truncate text-[12px] font-medium text-muted-foreground">{handle}</p>
                  ) : null}
                </div>
                <div className="flex shrink-0 items-center gap-0.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-full text-foreground hover:bg-muted/60"
                    onClick={() => setLocation("/profile/social/edit")}
                    aria-label="Edit profile"
                  >
                    <Pencil className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-full text-foreground hover:bg-muted/60"
                    aria-label="Share profile"
                    onClick={() => {
                      if (mode === "social") {
                        setSocialShareOpen(true);
                        return;
                      }
                      void shareMyPublicProfile();
                    }}
                  >
                    <Share2 className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 rounded-full text-foreground hover:bg-muted/60"
                        aria-label="Settings menu"
                      >
                        <Settings className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[min(100vw-2rem,17rem)]">
                      <DropdownMenuItem onClick={() => setLocation("/settings")}>
                        <Settings className="mr-2 h-4 w-4" strokeWidth={1.75} aria-hidden />
                        Account &amp; privacy
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setLocation("/support")}>
                        <Shield className="mr-2 h-4 w-4" strokeWidth={1.75} aria-hidden />
                        Help &amp; support
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          void inviteFriends();
                        }}
                      >
                        <Share2 className="mr-2 h-4 w-4" strokeWidth={1.75} aria-hidden />
                        Invite friends
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => logout()}
                      >
                        <LogOut className="mr-2 h-4 w-4" strokeWidth={1.75} aria-hidden />
                        Logout
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {mode === "marriage" ? (
                <>
                  <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    How others see you
                  </p>
                  <ViewProfile embedded embedUserId={userId} />
                </>
              ) : null}
              {mode === "social" ? <SocialSelfProfile menuEmbed /> : null}

              {mode === "marriage" ? (
                <MenuCard title="Account">
                  {marriageItems.map((item) => (
                    <MenuItemRow key={item.id} {...item} />
                  ))}
                </MenuCard>
              ) : (
                <MenuCard title="Social">
                  <MenuItemRow
                    label="Connections & privacy"
                    sub="Followers, muted accounts, and blocked users."
                    icon={SlidersHorizontal}
                    onClick={() => setLocation("/settings/social")}
                  />
                </MenuCard>
              )}
            </>
          ) : null}
        </div>

        {userId ? (
          <ShareProfileDialog
            open={socialShareOpen}
            onOpenChange={setSocialShareOpen}
            profileId={userId}
            displayName={displayName}
          />
        ) : null}
      </div>

      <BottomNav active="menu" onNavigate={() => {}} />
    </div>
  );
}

function MenuCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="matchify-surface rounded-[20px] border-white/0 bg-card/70 shadow-2xs">
      <div className="px-4 pt-4 pb-1">
        <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{title}</p>
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
          <span className="text-[15px] font-medium text-foreground">{label}</span>
          {dot && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
          {premium ? (
            <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
              <Sparkles className="h-3 w-3" strokeWidth={1.75} aria-hidden />
              AI
            </span>
          ) : null}
        </div>
        {sub ? <p className="mt-1 text-[12px] font-normal text-muted-foreground leading-relaxed">{sub}</p> : null}
      </div>
    </button>
  );
}

