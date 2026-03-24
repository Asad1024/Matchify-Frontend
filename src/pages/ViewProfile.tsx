import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { motion } from "framer-motion";
import Header from "@/components/common/Header";
import BottomNav from "@/components/common/BottomNav";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  MapPin,
  Heart,
  Users,
  Calendar,
  CheckCircle,
  MessageCircle,
  ArrowLeft,
  Share2,
  MoreVertical,
  Sparkles,
  Award,
  Flag,
  Ban,
  X,
  Crown,
  Ruler,
  Baby,
  Check,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { LoadingState } from "@/components/common/LoadingState";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrentUser } from "@/contexts/UserContext";
import { BlockReportDialog } from "@/components/common/BlockReportDialog";
import { MatchInsights } from "@/components/matches/MatchInsights";
import MatchReveal from "@/components/matches/MatchReveal";
import { MuzzMarriageTimeline } from "@/components/muzz/MuzzMarriageTimeline";
import { useToast } from "@/hooks/use-toast";
import {
  pushExploreHistory,
  hasRevealedFilters,
  revealFiltersFor,
  getBoosts,
  setBoosts,
  isGoldMember,
} from "@/lib/muzzEconomy";
import { getReligionLabel } from "@/lib/religionOptions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { buildApiUrl } from "@/services/api";
import { queryClient, apiRequest } from "@/lib/queryClient";

type User = {
  id: string;
  name: string;
  username: string;
  email: string;
  age: number | null;
  location: string | null;
  bio: string | null;
  avatar: string | null;
  interests: string[] | null;
  membershipTier: string | null;
  verified: boolean | null;
  zodiacSign?: string | null;
  values?: string[] | null;
  commitmentIntention?: string | null;
  marriageTimeline?: string | null;
  religion?: string | null;
  height?: string | null;
  heightCm?: number | null;
  maritalStatus?: string | null;
  hasChildren?: string | boolean | null;
};

function hashId(id: string) {
  let sum = 0;
  for (let i = 0; i < id.length; i++) sum += id.charCodeAt(i);
  return sum;
}

function aboutMeRows(user: User): { label: string; value: string }[] {
  const h = hashId(user.id || "x");
  const fallbackH = ["160cm (5' 3\")", "165cm (5' 5\")", "172cm (5' 8\")"][h % 3];
  const fallbackM = ["Never Married", "Never Married", "Divorced"][h % 3];
  const fallbackC = ["Has children", "No children", "Has children"][(h >> 2) % 3];

  let childrenLabel: string;
  if (user.hasChildren === true || user.hasChildren === "yes" || user.hasChildren === "true") {
    childrenLabel = "Has children";
  } else if (user.hasChildren === false || user.hasChildren === "no" || user.hasChildren === "false") {
    childrenLabel = "No children";
  } else if (typeof user.hasChildren === "string" && user.hasChildren) {
    childrenLabel = user.hasChildren;
  } else {
    childrenLabel = fallbackC;
  }

  return [
    {
      label: "Height",
      value: user.height || (user.heightCm != null ? `${user.heightCm}cm` : fallbackH),
    },
    { label: "Marital status", value: user.maritalStatus || fallbackM },
    { label: "Children", value: childrenLabel },
  ];
}

function faithChipsFor(user: User): string[] {
  const tags: string[] = [];
  if (user.religion && user.religion !== "prefer_not_say") {
    tags.push(getReligionLabel(user.religion));
  }
  if (user.values?.length) {
    tags.push(...user.values.filter(Boolean).slice(0, 4));
  }
  if (!tags.length) {
    const h = hashId(user.id || "x");
    const pool = ["Values-led", "Family-oriented", "Open-minded", "Community-minded"];
    tags.push(pool[h % pool.length], pool[(h + 1) % pool.length]);
  }
  return Array.from(new Set(tags)).slice(0, 5);
}

function hashPairScore(a: string, b: string): number {
  const s = `${a}:${b}`;
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  return 70 + (h % 30);
}

export default function ViewProfile() {
  const [activePage, setActivePage] = useState('explore');
  const [, params] = useRoute('/profile/:id');
  const [, setLocation] = useLocation();
  const { logout } = useAuth();
  const { userId: currentUserId } = useCurrentUser();
  const { toast } = useToast();
  const [blockReportOpen, setBlockReportOpen] = useState(false);
  const [blockReportType, setBlockReportType] = useState<'block' | 'report' | 'both'>('both');
  const [filtersUnlocked, setFiltersUnlocked] = useState(false);
  const [likeRevealMatch, setLikeRevealMatch] = useState<{
    id: string;
    compatibility: number;
    user: {
      id: string;
      name: string;
      age?: number | null;
      avatar?: string | null;
      location?: string | null;
      bio?: string | null;
    };
  } | null>(null);

  // Fetch user profile
  const { data: user, isLoading } = useQuery<User>({
    queryKey: [`/api/users/${params?.id}`],
    enabled: !!params?.id,
  });

  const { data: me } = useQuery<User>({
    queryKey: [`/api/users/${currentUserId}`],
    enabled: !!currentUserId,
  });

  useEffect(() => {
    if (!user?.id) return;
    pushExploreHistory(user.id);
    if (hasRevealedFilters(user.id)) setFiltersUnlocked(true);
  }, [user?.id]);

  const sharedInterests = useMemo(() => {
    if (!me?.interests?.length || !user?.interests?.length) return [];
    const mine = new Set(me.interests);
    return user.interests.filter((x) => mine.has(x));
  }, [me, user]);

  const sameCommitment =
    Boolean(me?.commitmentIntention && user?.commitmentIntention) &&
    me?.commitmentIntention === user?.commitmentIntention;

  const handleRevealFilters = () => {
    if (!user?.id) return;
    if (isGoldMember()) {
      revealFiltersFor(user.id);
      setFiltersUnlocked(true);
      toast({ title: "Filters revealed", description: "Included with Gold." });
      return;
    }
    const b = getBoosts();
    if (b < 1) {
      toast({
        title: "No boosts left",
        description: "Open Menu → Buy more (demo) to refill.",
        variant: "destructive",
      });
      return;
    }
    setBoosts(b - 1);
    revealFiltersFor(user.id);
    setFiltersUnlocked(true);
    toast({ title: "Filters revealed", description: "Used 1 boost." });
  };

  const compatibilityScore = useMemo(() => {
    if (!currentUserId || !params?.id) return 82;
    return hashPairScore(currentUserId, params.id);
  }, [currentUserId, params?.id]);

  const markMatchRevealedMutation = useMutation({
    mutationFn: async (matchId: string) => {
      return apiRequest("PATCH", `/api/matches/${matchId}/reveal`, {});
    },
    onSuccess: () => {
      if (currentUserId) {
        queryClient.invalidateQueries({ queryKey: [`/api/users/${currentUserId}/unrevealed-matches`] });
        queryClient.invalidateQueries({ queryKey: [`/api/users/${currentUserId}/matches`] });
      }
    },
  });

  const likeProfileMutation = useMutation({
    mutationFn: async () => {
      if (!currentUserId || !user?.id) throw new Error("Missing user");
      const res = await fetch(buildApiUrl("/api/matches"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          user1Id: currentUserId,
          user2Id: user.id,
          compatibility: compatibilityScore,
        }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(err.message || "Could not send like");
      }
      return (await res.json()) as { id: string; compatibility: number; existing?: boolean };
    },
    onSuccess: (data) => {
      if (!user) return;
      setLikeRevealMatch({
        id: data.id,
        compatibility: data.compatibility ?? compatibilityScore,
        user: {
          id: user.id,
          name: user.name,
          age: user.age,
          avatar: user.avatar,
          location: user.location,
          bio: user.bio,
        },
      });
      if (currentUserId) {
        queryClient.invalidateQueries({ queryKey: [`/api/users/${currentUserId}/unrevealed-matches`] });
        queryClient.invalidateQueries({ queryKey: [`/api/users/${currentUserId}/matches`] });
      }
    },
    onError: (e: Error) => {
      toast({
        title: "Like didn’t go through",
        description: e.message,
        variant: "destructive",
      });
    },
  });

  const closeLikeReveal = () => {
    if (likeRevealMatch) {
      markMatchRevealedMutation.mutate(likeRevealMatch.id);
    }
    setLikeRevealMatch(null);
  };

  const activityStats = useMemo(() => {
    const base = hashPairScore(user?.id || "x", "activity");
    return {
      matches: 8 + (base % 15),
      events: 3 + (base % 12),
      groups: 2 + (base % 8),
    };
  }, [user?.id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#faf8f5] pb-24">
        <Header 
          showSearch={false} 
          unreadNotifications={3}
          onNotifications={() => setLocation('/notifications')}
          onCreate={() => setLocation('/')}
          onSettings={() => setLocation('/profile')}
          onLogout={logout} 
        />
        <div className="flex items-center justify-center py-20">
          <LoadingState message="Loading profile..." showMascot={true} />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#faf8f5] pb-24">
        <Header 
          showSearch={false} 
          unreadNotifications={3}
          onNotifications={() => setLocation('/notifications')}
          onCreate={() => setLocation('/')}
          onSettings={() => setLocation('/profile')}
          onLogout={logout} 
        />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">Profile not found</p>
            <Button onClick={() => setLocation('/explore')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Explore
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const aboutRows = aboutMeRows(user);
  const faithChips = faithChipsFor(user);
  const firstName = user.name.split(/\s+/)[0] || user.name;

  return (
    <div className="min-h-screen bg-[#faf8f5] pb-28">
      <Header showSearch={false} unreadNotifications={3} onLogout={logout} />

      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <div className="p-3 sm:p-4 sticky top-16 bg-background/95 backdrop-blur-sm z-30">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
          <Button 
            variant="ghost" 
                  size="icon" 
            onClick={() => setLocation('/explore')}
                  className="rounded-full hover-elevate"
            data-testid="button-back"
          >
                  <ArrowLeft className="w-5 h-5" />
          </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Back to Explore</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Profile Hero */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative"
        >
          {/* Cover gradient */}
          <div className="h-48 bg-gradient-to-br from-primary/20 via-chart-1/20 to-chart-4/20 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
          </div>

          {/* Profile Info */}
          <div className="px-3 sm:px-4 -mt-16 sm:-mt-20 relative z-10">
            <div className="flex flex-col md:flex-row gap-4 sm:gap-6 items-start md:items-end">
              {/* Avatar */}
              <div className="relative">
                <Avatar className="w-24 h-24 sm:w-32 sm:h-32 border-4 border-background shadow-2xl">
                  <AvatarImage src={user.avatar || undefined} alt={user.name} />
                  <AvatarFallback className="text-3xl sm:text-4xl bg-gradient-to-br from-primary/20 to-chart-1/20">
                    {user.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {user.verified && (
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 sm:w-10 sm:h-10 bg-primary rounded-full flex items-center justify-center border-4 border-background">
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />
                  </div>
                )}
              </div>

              {/* Name and Actions */}
              <div className="flex-1 min-w-0 w-full md:w-auto">
                <div className="flex flex-wrap items-start justify-between gap-2 sm:gap-3">
                  <div className="flex-1 min-w-0">
                    <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground flex items-center gap-2 flex-wrap">
                      {user.name}{user.age ? `, ${user.age}` : ''}
                      {user.membershipTier && user.membershipTier !== 'free' && (
                        <Badge className="bg-gradient-to-r from-chart-4 to-chart-1 border-0">
                          <Award className="w-3 h-3 mr-1" />
                          {user.membershipTier.charAt(0).toUpperCase() + user.membershipTier.slice(1)}
                        </Badge>
                      )}
                    </h1>
                    {user.location && (
                      <div className="flex items-center gap-2 text-muted-foreground mt-2">
                        <MapPin className="w-4 h-4" />
                        <span>{user.location}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button size="icon" variant="outline" className="rounded-full hover-elevate">
                      <Share2 className="w-4 h-4" />
                    </Button>
                    {user.id !== currentUserId && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                    <Button size="icon" variant="outline" className="rounded-full hover-elevate">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setBlockReportType('report');
                              setBlockReportOpen(true);
                            }}
                          >
                            <Flag className="w-4 h-4 mr-2" />
                            Report User
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => {
                              setBlockReportType('block');
                              setBlockReportOpen(true);
                            }}
                            className="text-destructive"
                          >
                            <Ban className="w-4 h-4 mr-2" />
                            Block User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 sm:gap-3 mt-4 sm:mt-6">
              <Button
                className="flex-1 gap-2 h-10 sm:h-11 bg-primary hover:bg-primary/90 text-sm sm:text-base"
                data-testid="button-message"
                onClick={() => setLocation(`/chat?user=${encodeURIComponent(user.id)}`)}
              >
                <MessageCircle className="w-4 h-4" />
                Message
              </Button>
              <Button
                variant="outline"
                className="flex-1 gap-2 h-10 sm:h-11 hover-elevate text-sm sm:text-base"
                data-testid="button-like"
                onClick={() => toast({ title: "Like sent", description: `You liked ${user.name.split(/\s+/)[0] || user.name}.` })}
              >
                <Heart className="w-4 h-4" />
                Like
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Compatibility Score & Match Insights */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="px-3 sm:px-4 mt-4 sm:mt-6 space-y-3 sm:space-y-4"
        >
          <Card className="bg-gradient-to-br from-primary/10 to-chart-1/10 border-primary/20">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-primary-foreground" />
                </div>
                <div className="flex-1">
                  <h3 className="font-display font-semibold text-lg sm:text-xl text-foreground mb-1">
                    {compatibilityScore}% Match
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    You have great compatibility based on shared interests
                  </p>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="mt-4 h-2 bg-muted rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-gradient-to-r from-primary to-chart-1"
                  initial={{ width: 0 }}
                  animate={{ width: `${compatibilityScore}%` }}
                  transition={{ duration: 1, delay: 0.3 }}
                />
              </div>
            </CardContent>
          </Card>

          {/* AI compatibility (uses /ai-matches when available) */}
          {currentUserId && user.id !== currentUserId && (
            <MatchInsights targetUserId={user.id} />
          )}
        </motion.div>

        {/* Premium filter reveal — Muzz-style gold banner */}
        {user.id !== currentUserId && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="px-3 sm:px-4 mt-4"
          >
            <div
              className={`rounded-2xl border shadow-sm overflow-hidden ${
                filtersUnlocked
                  ? "bg-white border-stone-200/80"
                  : "bg-[#f0e8dc] border-amber-200/60"
              }`}
            >
              {filtersUnlocked ? (
                <div className="px-4 sm:px-5 pt-4 pb-3 flex items-center gap-2 border-b border-stone-100">
                  <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <p className="font-display font-bold text-stone-900 text-sm">Their filters</p>
                    <p className="text-[11px] text-stone-500">What they look for in Discover</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="px-4 sm:px-5 pt-5 pb-4 text-center">
                    <Crown className="w-9 h-9 mx-auto text-amber-600 mb-3 drop-shadow-sm" strokeWidth={1.5} />
                    <p className="text-[10px] sm:text-[11px] font-bold tracking-[0.2em] text-amber-950/75 uppercase leading-snug">
                      Reveal {firstName.toUpperCase()}&apos;s filters
                    </p>
                    <p className="text-[11px] text-amber-950/55 mt-2 max-w-xs mx-auto">
                      See if you match what they’re looking for — Gold or 1 boost.
                    </p>
                  </div>
                  <div className="px-4 sm:px-5 pb-5">
                    <Button
                      className="w-full h-12 sm:h-14 rounded-xl font-bold text-amber-950 bg-gradient-to-b from-amber-300 via-amber-400 to-amber-600 hover:from-amber-200 hover:to-amber-500 border border-amber-300/80 shadow-md shadow-amber-900/10"
                      onClick={handleRevealFilters}
                    >
                      Check if you match their filters
                    </Button>
                  </div>
                </>
              )}
              <div
                className={`px-4 sm:px-5 pb-5 ${filtersUnlocked ? "pt-4" : "-mt-1 border-t border-amber-200/40 bg-white/50"}`}
              >
                <div
                  className={`relative rounded-xl border p-3 min-h-[64px] ${
                    filtersUnlocked
                      ? "border-stone-200 bg-stone-50/80 mt-0"
                      : "border-amber-100/80 bg-white/80 mt-3 select-none"
                  }`}
                >
                  {!filtersUnlocked && (
                    <div className="absolute inset-0 z-10 backdrop-blur-[2px] bg-[#faf8f5]/70 flex items-center justify-center rounded-xl">
                      <span className="text-[11px] font-semibold text-amber-950/50">Unlocked after reveal</span>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {["Faith & values", "Marriage-minded", "Same city", "Age range match"].map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className={
                          filtersUnlocked
                            ? "bg-white text-stone-800 border-stone-200 font-medium"
                            : "bg-amber-50 text-amber-950 border-amber-200/80 font-medium"
                        }
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Similarities */}
        {user.id !== currentUserId && (sharedInterests.length > 0 || sameCommitment) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.14 }}
            className="px-3 sm:px-4 mt-4"
          >
            <Card>
              <CardContent className="p-4 sm:p-5">
                <h3 className="font-display font-semibold text-base mb-3 text-foreground">Your similarities</h3>
                <div className="flex flex-wrap gap-2">
                  {sameCommitment && user.commitmentIntention && (
                    <Badge className="bg-chart-4/15 text-chart-4 border-chart-4/30">
                      Same marriage intention ·{" "}
                      {user.commitmentIntention.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                    </Badge>
                  )}
                  {sharedInterests.map((interest) => (
                    <Badge key={interest} variant="outline" className="border-primary/30 text-primary">
                      {interest}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* About me — Muzz-style fact rows */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
          className="px-3 sm:px-4 mt-4"
        >
          <Card className="border-stone-200/80 bg-white shadow-sm">
            <CardContent className="p-4 sm:p-5">
              <h3 className="font-display font-semibold text-base mb-4 text-foreground">About me</h3>
              <div className="space-y-3">
                {aboutRows.map((row, i) => {
                  const Icon = i === 0 ? Ruler : i === 1 ? Heart : Baby;
                  return (
                    <div
                      key={row.label}
                      className="flex items-center gap-3 rounded-xl bg-stone-50/90 border border-stone-100 px-3 py-2.5"
                    >
                      <div className="w-9 h-9 rounded-full bg-white border border-stone-200 flex items-center justify-center shrink-0 text-stone-600">
                        <Icon className="w-4 h-4" strokeWidth={2} />
                      </div>
                      <div className="min-w-0 flex-1 flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold text-stone-500">{row.label}</span>
                        <Badge
                          variant="secondary"
                          className="font-semibold bg-white text-stone-800 border-stone-200 shadow-sm"
                        >
                          {row.value}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Marriage intentions — Muzz-style timeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22 }}
          className="px-3 sm:px-4 mt-4"
        >
          <MuzzMarriageTimeline
            firstName={firstName}
            commitmentIntention={user.commitmentIntention}
            marriageTimeline={user.marriageTimeline}
          />
        </motion.div>

        {/* My faith / values — Muzz-style tags */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.24 }}
          className="px-3 sm:px-4 mt-4"
        >
          <Card className="border-stone-200/80 bg-white shadow-sm">
            <CardContent className="p-4 sm:p-5">
              <h3 className="font-display font-semibold text-base mb-3 text-foreground">My faith & values</h3>
              <div className="flex flex-wrap gap-2">
                {faithChips.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="px-3 py-1.5 text-sm font-medium bg-stone-100 text-stone-800 border-stone-200/80 rounded-full"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Bio */}
        {user.bio && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.26 }}
            className="px-4 mt-6"
          >
            <Card className="border-stone-200/80 bg-white shadow-sm">
              <CardContent className="p-4 sm:p-6">
                <h2 className="font-display font-semibold text-lg mb-3 text-foreground">In their own words</h2>
                <p className="text-foreground leading-relaxed">{user.bio}</p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Interests */}
        {user.interests && Array.isArray(user.interests) && user.interests.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="px-4 mt-6"
          >
            <Card>
              <CardContent className="p-4 sm:p-6">
                <h2 className="font-display font-semibold text-lg mb-4 text-foreground">Interests</h2>
                <div className="flex flex-wrap gap-2">
                  {user.interests.map((interest) => (
                    <Badge 
                      key={interest} 
                      variant="secondary"
                      className="bg-primary/10 text-primary border-primary/20 px-4 py-1.5"
                    >
                      {interest}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Stats */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="px-4 mt-6 mb-6"
        >
          <Card>
            <CardContent className="p-4 sm:p-6">
              <h2 className="font-display font-semibold text-lg mb-4 text-foreground">Activity</h2>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 text-xl sm:text-2xl font-bold text-foreground">
                    <Heart className="w-5 h-5 text-chart-2" />
                    <span>{activityStats.matches}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">Matches</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 text-xl sm:text-2xl font-bold text-foreground">
                    <Calendar className="w-5 h-5 text-chart-3" />
                    <span>{activityStats.events}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">Events</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 text-xl sm:text-2xl font-bold text-foreground">
                    <Users className="w-5 h-5 text-chart-4" />
                    <span>{activityStats.groups}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">Groups</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <BottomNav active={activePage} onNavigate={setActivePage} />

      {/* Floating quick actions (Muzz-style) */}
      {user.id !== currentUserId && (
        <div
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 rounded-full bg-white/95 backdrop-blur-md border border-stone-200/90 shadow-xl px-3 py-2.5 safe-bottom"
          style={{ boxShadow: "0 12px 40px rgba(0,0,0,0.14)" }}
        >
          <Button
            size="icon"
            className="rounded-full h-12 w-12 bg-zinc-700 text-white hover:bg-zinc-800 shadow-md"
            aria-label="Pass"
            onClick={() => {
              toast({ title: "Passed", description: "We’ll show you fewer similar profiles." });
              setLocation("/explore");
            }}
          >
            <X className="w-6 h-6 stroke-[2.5]" />
          </Button>
          <Button
            size="icon"
            className="rounded-full h-11 w-11 bg-violet-600 text-white hover:bg-violet-700 shadow-md border border-violet-500/30"
            aria-label="Instant match"
            onClick={() => toast({ title: "Instant match", description: "Demo — opens boosts / Gold from Menu." })}
          >
            <Sparkles className="w-5 h-5" />
          </Button>
          <Button
            size="icon"
            className="rounded-full h-[3.75rem] w-[3.75rem] bg-primary hover:bg-primary/92 shadow-lg shadow-primary/35 border-2 border-white"
            aria-label="Like"
            disabled={likeProfileMutation.isPending}
            onClick={() => {
              if (!currentUserId) return;
              likeProfileMutation.mutate();
            }}
          >
            <Check className="w-8 h-8 text-white stroke-[3]" />
          </Button>
        </div>
      )}

      {likeRevealMatch && (
        <MatchReveal
          match={{
            id: likeRevealMatch.id,
            compatibility: likeRevealMatch.compatibility,
            user: likeRevealMatch.user,
          }}
          onClose={closeLikeReveal}
          onMessage={(matchedUserId) => {
            closeLikeReveal();
            setLocation(`/chat?user=${encodeURIComponent(matchedUserId)}`);
          }}
        />
      )}

      {/* Block/Report Dialog */}
      {user.id !== currentUserId && (
        <BlockReportDialog
          open={blockReportOpen}
          onOpenChange={setBlockReportOpen}
          userId={user.id}
          userName={user.name}
          type={blockReportType}
        />
      )}
    </div>
  );
}
