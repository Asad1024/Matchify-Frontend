import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
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
  MapPin, Heart, Users, Calendar, CheckCircle, 
  MessageCircle, ArrowLeft, Share2, MoreVertical,
  Sparkles, Award, Flag, Ban, Star, X
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { LoadingState } from "@/components/common/LoadingState";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrentUser } from "@/contexts/UserContext";
import { BlockReportDialog } from "@/components/common/BlockReportDialog";
import { MatchInsights } from "@/components/matches/MatchInsights";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
};

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
      <div className="min-h-screen bg-gray-50 pb-24">
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
      <div className="min-h-screen bg-gray-50 pb-24">
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

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
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

        {/* Filter reveal (Muzz-style) */}
        {user.id !== currentUserId && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="px-3 sm:px-4 mt-4"
          >
            <Card className="border-primary/15 overflow-hidden">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <h3 className="font-display font-semibold text-base text-foreground">Their filters</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {filtersUnlocked
                        ? "What they’re looking for in Discover."
                        : "Blur preview · reveal with Gold or 1 boost."}
                    </p>
                  </div>
                  {!filtersUnlocked && (
                    <Button size="sm" className="shrink-0" onClick={handleRevealFilters}>
                      Reveal
                    </Button>
                  )}
                </div>
                <div
                  className={`relative rounded-xl border border-dashed border-primary/20 bg-muted/30 p-3 min-h-[72px] ${
                    !filtersUnlocked ? "select-none" : ""
                  }`}
                >
                  {!filtersUnlocked && (
                    <div className="absolute inset-0 z-10 backdrop-blur-sm bg-background/40 flex items-center justify-center rounded-xl">
                      <span className="text-xs font-semibold text-muted-foreground">Tap Reveal to unlock</span>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {["Faith & values", "Marriage-minded", "Same city", "Age range match"].map((tag) => (
                      <Badge key={tag} variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
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
                <h3 className="font-display font-semibold text-base mb-3 text-foreground">Similarities</h3>
                <div className="flex flex-wrap gap-2">
                  {sameCommitment && user.commitmentIntention && (
                    <Badge className="bg-chart-4/15 text-chart-4 border-chart-4/30">
                      Both: {user.commitmentIntention}
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

        {/* Bio */}
        {user.bio && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="px-4 mt-6"
          >
            <Card>
              <CardContent className="p-4 sm:p-6">
                <h2 className="font-display font-semibold text-lg mb-3 text-foreground">About</h2>
                <p className="text-foreground leading-relaxed">{user.bio}</p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Marriage intentions — Muzz-style timeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="px-4 mt-6"
        >
          <MuzzMarriageTimeline
            firstName={user.name.split(/\s+/)[0] || user.name}
            commitmentIntention={user.commitmentIntention}
            marriageTimeline={user.marriageTimeline}
          />
        </motion.div>

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
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 rounded-full bg-white/95 backdrop-blur-md border border-gray-100 shadow-lg px-2 py-2 safe-bottom"
          style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }}
        >
          <Button
            size="icon"
            variant="ghost"
            className="rounded-full h-12 w-12 text-gray-500"
            aria-label="Pass"
            onClick={() => {
              toast({ title: "Passed", description: "We’ll show you fewer similar profiles." });
              setLocation("/explore");
            }}
          >
            <X className="w-6 h-6" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="rounded-full h-12 w-12 text-amber-500"
            aria-label="Compliment"
            onClick={() => toast({ title: "Compliment", description: "Send a compliment from Menu (demo)." })}
          >
            <Star className="w-6 h-6 fill-amber-400/20" />
          </Button>
          <Button
            size="icon"
            className="rounded-full h-14 w-14 bg-primary hover:bg-primary/90 shadow-md"
            aria-label="Like"
            onClick={() => toast({ title: "Like sent", description: `You liked ${user.name.split(/\s+/)[0] || user.name}.` })}
          >
            <Heart className="w-7 h-7 text-white fill-white" />
          </Button>
        </div>
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
