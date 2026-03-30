import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import Header from "@/components/common/Header";
import BottomNav from "@/components/common/BottomNav";
import { Card, CardContent } from "@/components/ui/card";
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
  Crown,
  Sparkles,
  CheckCircle,
} from "lucide-react";
import { useCurrentUser } from "@/contexts/UserContext";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  getBoosts,
  getCompliments,
  buyMoreDemo,
  isGoldMember,
  setGoldMember,
} from "@/lib/muzzEconomy";
import { SOCIAL_PROFILE_TAB_KEY } from "@/lib/settingsSocialNav";
import { MuzzEconomyPill } from "@/components/muzz/MuzzEconomyPill";
import { setExploreModePersisted } from "@/lib/exploreMode";

export default function Menu() {
  const [location, setLocation] = useLocation();
  const { userId } = useCurrentUser();
  const { logout } = useAuth();
  const { toast } = useToast();
  const [mode, setMode] = useState<"marriage" | "social">("marriage");

  useEffect(() => {
    if (location === "/menu") setMode("marriage");
  }, [location]);
  const [boosts, setBoostsState] = useState(getBoosts);
  const [compliments, setComplimentsState] = useState(getCompliments);
  const gold = isGoldMember();

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

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      <Header
        showSearch={false}
        title="Menu"
        unreadNotifications={0}
        onNotifications={() => setLocation("/notifications")}
        onCreate={() => setLocation("/")}
        onLogout={logout}
        rightAccessory={<MuzzEconomyPill onClick={() => setLocation("/subscriptions")} />}
      />

      <div className="max-w-lg mx-auto px-4 pt-2">
        <div className="flex border-b border-gray-200 bg-white rounded-t-2xl overflow-hidden">
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
            className={`flex-1 py-3 text-sm font-bold relative ${
              mode === "marriage" ? "text-gray-900" : "text-gray-400"
            }`}
          >
            Marriage
            {mode === "marriage" && (
              <span className="absolute bottom-0 left-4 right-4 h-0.5 bg-gray-900 rounded-full" />
            )}
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
            className={`flex-1 py-3 text-sm font-bold relative ${
              mode === "social" ? "text-gray-900" : "text-gray-400"
            }`}
          >
            Social
            <span className="ml-1 inline-block w-1.5 h-1.5 rounded-full bg-primary" />
            {mode === "social" && (
              <span className="absolute bottom-0 left-4 right-4 h-0.5 bg-gray-900 rounded-full" />
            )}
          </button>
        </div>

        <div className="bg-white rounded-b-2xl shadow-sm border border-t-0 border-gray-100 px-4 pb-6">
          {mode === "marriage" && (
            <>
              <div className="flex flex-col items-center text-center pt-6 pb-2">
                <Avatar className="w-28 h-28 border-4 border-teal-200 sm:w-32 sm:h-32">
                  <AvatarImage src={me?.avatar || undefined} />
                  <AvatarFallback className="bg-amber-100 text-3xl">😊</AvatarFallback>
                </Avatar>
                <div className="flex items-center justify-center gap-1.5 mt-3 flex-wrap">
                  <p className="font-bold text-lg">{displayName}</p>
                  {me?.verified ? (
                    <CheckCircle
                      className="w-5 h-5 text-sky-500 shrink-0"
                      aria-label="Verified"
                    />
                  ) : null}
                </div>
                <Button
                  variant="ghost"
                  className="text-primary font-semibold h-auto py-1 mt-1"
                  onClick={() => setLocation("/profile?marriage=1")}
                >
                  View profile
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <Card className="border-gray-100 shadow-none bg-gray-50/80">
                  <CardContent className="p-3">
                    <p className="text-xs font-bold text-gray-800">{boosts} Profile Boosts</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">Get up to 11× more visits</p>
                    <Button
                      size="sm"
                      className="mt-2 w-full h-8 text-xs bg-teal-600 hover:bg-teal-700"
                      onClick={() => {
                        buyMoreDemo("boosts");
                        setBoostsState(getBoosts());
                        toast({ title: "Boosts added (demo)", description: "+5 boosts for testing." });
                      }}
                    >
                      Buy more
                    </Button>
                  </CardContent>
                </Card>
                <Card className="border-gray-100 shadow-none bg-gray-50/80">
                  <CardContent className="p-3">
                    <p className="text-xs font-bold text-gray-800">{compliments} Compliments</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">Message without waiting</p>
                    <Button
                      size="sm"
                      className="mt-2 w-full h-8 text-xs bg-violet-600 hover:bg-violet-700"
                      onClick={() => {
                        buyMoreDemo("compliments");
                        setComplimentsState(getCompliments());
                        toast({ title: "Compliments added (demo)", description: "+5 compliments for testing." });
                      }}
                    >
                      Buy more
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <nav className="mt-4 space-y-0 divide-y divide-gray-100">
                <MenuRow
                  icon={<Crown className="w-5 h-5 text-amber-500" />}
                  label={gold ? "Gold membership (active)" : "Manage Gold membership"}
                  onClick={() => {
                    setGoldMember(!gold);
                    toast({
                      title: gold ? "Gold disabled (demo)" : "Gold enabled (demo)",
                      description: "Filter reveal & perks toggled for this device.",
                    });
                  }}
                />
                <MenuRow
                  icon={<Pencil className="w-5 h-5 text-gray-600" />}
                  label="Edit Profile"
                  onClick={() => setLocation("/profile?marriage=1&tab=edit")}
                />
                <MenuRow
                  icon={<SlidersHorizontal className="w-5 h-5 text-gray-600" />}
                  label="Search filters"
                  onClick={() => setLocation("/directory")}
                />
                <MenuRow
                  icon={<Settings className="w-5 h-5 text-gray-600" />}
                  label="Settings"
                  dot
                  onClick={() => setLocation("/settings")}
                />
                <MenuRow
                  icon={<Ticket className="w-5 h-5 text-gray-600" />}
                  label="Events"
                  sub="Meet singles face-to-face. Discover exciting events near you!"
                  onClick={() => setLocation("/events")}
                />
                <MenuRow
                  icon={<Shield className="w-5 h-5 text-gray-600" />}
                  label="Help & Support Center"
                  onClick={() => toast({ title: "Support", description: "Coming soon." })}
                />
                <MenuRow
                  icon={<Share2 className="w-5 h-5 text-gray-600" />}
                  label="Invite friends"
                  onClick={() => toast({ title: "Invite", description: "Share link coming soon." })}
                />
                <MenuRow
                  icon={<Sparkles className="w-5 h-5 text-primary" />}
                  label="AI Matchmaker"
                  onClick={() => setLocation("/ai-matchmaker")}
                />
              </nav>
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
              <nav className="space-y-0 divide-y divide-gray-100 border-t border-gray-100">
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
      </div>

      <BottomNav active="menu" onNavigate={() => {}} />
    </div>
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
      className="w-full flex items-start gap-3 py-3.5 text-left hover:bg-gray-50/80 transition-colors"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-900">{label}</span>
          {dot && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
        </div>
        {sub && <p className="text-xs text-gray-500 mt-1 leading-snug">{sub}</p>}
      </div>
      <div className="flex-shrink-0 text-gray-400">{icon}</div>
    </button>
  );
}
