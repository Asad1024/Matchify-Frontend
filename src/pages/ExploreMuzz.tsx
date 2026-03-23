import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import Header from "@/components/common/Header";
import BottomNav from "@/components/common/BottomNav";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SlidersHorizontal, ArrowUpDown, Rocket, CheckCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrentUser } from "@/contexts/UserContext";
import { MuzzEconomyPill } from "@/components/muzz/MuzzEconomyPill";
import { getExploreHistory, pushExploreHistory } from "@/lib/muzzEconomy";
import { useToast } from "@/hooks/use-toast";

type PublicUser = {
  id: string;
  name: string;
  username?: string;
  location?: string | null;
  avatar?: string | null;
  verified?: boolean | null;
  interests?: string[] | null;
};

const TAG_POOL = [
  "Abu Dhabi",
  "Dubai",
  "London",
  "Sharjah",
  "Arab European",
  "South Asian",
  "Engineer",
  "Teacher",
  "HR Pro",
  "Physician",
  "3 days ago",
  "2 weeks ago",
];

function tagsForUser(id: string): string[] {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  const a = TAG_POOL[h % TAG_POOL.length];
  const b = TAG_POOL[(h >> 3) % TAG_POOL.length];
  const c = TAG_POOL[(h >> 6) % TAG_POOL.length];
  return Array.from(new Set([a, b, c])).slice(0, 3);
}

export default function ExploreMuzz() {
  const [, setLocation] = useLocation();
  const { logout } = useAuth();
  const { userId } = useCurrentUser();
  const { toast } = useToast();
  const [tab, setTab] = useState<"foryou" | "events" | "history">("foryou");

  const { data: users = [] } = useQuery<PublicUser[]>({
    queryKey: ["/api/users"],
  });

  const likesYou = useMemo(() => {
    const list = Array.isArray(users) ? users : [];
    return list.filter((u) => u.id !== userId).slice(0, 12);
  }, [users, userId]);

  const history = getExploreHistory();

  return (
    <div className="min-h-screen bg-white pb-28">
      <Header
        showSearch={false}
        title="Explore"
        unreadNotifications={0}
        onNotifications={() => setLocation("/notifications")}
        onCreate={() => setLocation("/community")}
        onSettings={() => setLocation("/menu")}
        onLogout={logout}
        rightAccessory={<MuzzEconomyPill onClick={() => setLocation("/subscriptions")} />}
      />

      <div className="max-w-lg mx-auto px-3 pt-1">
        <div className="flex items-center justify-between py-2">
          <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setLocation("/directory")}>
            <SlidersHorizontal className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="sm" className="text-xs font-semibold gap-1">
            <ArrowUpDown className="w-3.5 h-3.5" />
            Sort
          </Button>
        </div>

        <div className="flex border-b border-gray-200">
          {(
            [
              ["foryou", "For you"],
              ["events", "Events"],
              ["history", "My history"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`flex-1 py-3 text-sm font-bold relative ${
                tab === id ? "text-gray-900" : "text-gray-400"
              }`}
            >
              {label}
              {tab === id && (
                <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-gray-900 rounded-full" />
              )}
            </button>
          ))}
        </div>

        {tab === "foryou" && (
          <div className="pt-4 space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <h2 className="text-base font-bold text-gray-900">Likes in your filters</h2>
                <Badge variant="secondary" className="rounded-full font-bold">
                  {likesYou.length}
                </Badge>
              </div>
              <p className="text-xs text-gray-500 mb-3">
                People who may align with your preferences — open a profile to connect.
              </p>
              <div className="grid grid-cols-2 gap-2">
                {likesYou.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => {
                      pushExploreHistory(u.id);
                      setLocation(`/profile/${u.id}`);
                    }}
                    className="relative rounded-2xl overflow-hidden border border-gray-100 bg-gray-100 aspect-[3/4] text-left group"
                  >
                    <div
                      className="absolute inset-0 bg-cover bg-center blur-md scale-110 opacity-90"
                      style={{ backgroundImage: u.avatar ? `url(${u.avatar})` : undefined }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    <span className="absolute top-2 left-2 text-[10px] font-bold bg-primary text-white px-2 py-0.5 rounded-full">
                      Liked you
                    </span>
                    <div className="absolute bottom-2 left-2 right-2 space-y-1">
                      <div className="flex items-center gap-1">
                        <span className="text-white text-xs font-bold truncate">{u.name}</span>
                        {u.verified && <CheckCircle className="w-3.5 h-3.5 text-sky-300 shrink-0" />}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {tagsForUser(u.id).map((t) => (
                          <span
                            key={t}
                            className="text-[9px] font-medium bg-white/20 text-white px-1.5 py-0.5 rounded-md backdrop-blur-sm"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-teal-100 bg-teal-50/60 p-4">
              <h3 className="font-bold text-gray-900 mb-1">Boosted visits</h3>
              <p className="text-xs text-gray-600 mb-3">
                These people found your profile when you boosted.
              </p>
              <Button
                className="w-full rounded-xl bg-teal-600 hover:bg-teal-700 font-bold gap-2"
                onClick={() => {
                  toast({
                    title: "Boost",
                    description: "Use Profile Boosts from Menu → Marriage (demo).",
                  });
                  setLocation("/menu");
                }}
              >
                <Rocket className="w-4 h-4" />
                Get seen more
              </Button>
            </div>
          </div>
        )}

        {tab === "events" && (
          <div className="pt-6 space-y-3">
            <p className="text-sm text-gray-600">Discover in-person and online events.</p>
            <Button className="w-full rounded-xl font-bold" onClick={() => setLocation("/events")}>
              Browse all events
            </Button>
            <Button variant="outline" className="w-full rounded-xl" onClick={() => setLocation("/events/create")}>
              Host an event
            </Button>
          </div>
        )}

        {tab === "history" && (
          <div className="pt-6 space-y-2">
            {history.length === 0 ? (
              <p className="text-sm text-gray-500">Profiles you open from Explore appear here.</p>
            ) : (
              history.map((h) => (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => setLocation(`/profile/${h.id}`)}
                  className="w-full text-left py-3 px-3 rounded-xl border border-gray-100 bg-gray-50 text-sm font-medium"
                >
                  Profile · {h.id.slice(0, 8)}…
                  <span className="block text-xs text-gray-400 font-normal">
                    {new Date(h.at).toLocaleString()}
                  </span>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      <BottomNav active="explore" onNavigate={() => {}} />
    </div>
  );
}
