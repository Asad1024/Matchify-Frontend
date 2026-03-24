import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import Header from "@/components/common/Header";
import PageWrapper from "@/components/common/PageWrapper";
import ProfileCard from "@/components/profile/ProfileCard";
import BottomNav from "@/components/common/BottomNav";
import MatchReveal from "@/components/matches/MatchReveal";
import { EmptyState } from "@/components/common/EmptyState";
import { LoadingState } from "@/components/common/LoadingState";
import { Button } from "@/components/ui/button";
import { Sparkles, Check, ArrowRight, Crown, Rocket, AlertCircle } from "lucide-react";
import { useCurrentUser } from "@/contexts/UserContext";
import { useAuth } from "@/contexts/AuthContext";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { User } from "@shared/schema";
import { getAIMatches } from "@/services/aiMatchmaker.service";
import type { AIMatch } from "@/services/aiMatchmaker.service";

type Profile = {
  id: string;
  name: string;
  age: number | null;
  location: string | null;
  bio: string | null;
  interests: string[] | null;
  avatar: string | null;
  membershipTier: string | null;
  verified: boolean | null;
  gender?: string | null;
  education?: string | null;
  career?: string | null;
  incomeRange?: string | null;
  loveLanguage?: string | null;
  commitmentIntention?: string | null;
  relationshipGoal?: string | null;
};

type UnrevealedMatch = {
  id: string;
  user: User;
  compatibility: number;
};

export default function Directory() {
  const [activePage, setActivePage] = useState('explore');
  const [, setLocation] = useLocation();
  const { userId } = useCurrentUser();
  const { logout } = useAuth();
  const prefersReducedMotion = useReducedMotion();
  const [showMatchReveal, setShowMatchReveal] = useState(false);
  const [currentMatch, setCurrentMatch] = useState<UnrevealedMatch | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Filter states
  const [ageRange, setAgeRange] = useState<[number, number]>([18, 100]);
  const [selectedGender, setSelectedGender] = useState<string>('all');
  const [selectedEducation, setSelectedEducation] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sortBy, setSortBy] = useState('compatibility');

  const { data: profiles = [], isLoading } = useQuery<Profile[]>({
    queryKey: ['/api/users'],
    enabled: !!userId,
  });

  const { data: unrevealedMatches = [] } = useQuery<UnrevealedMatch[]>({
    queryKey: [`/api/users/${userId}/unrevealed-matches`],
    enabled: !!userId,
  });

  useEffect(() => {
    if (unrevealedMatches.length > 0 && !showMatchReveal) {
      setCurrentMatch(unrevealedMatches[0]);
      setShowMatchReveal(true);
    }
  }, [unrevealedMatches, showMatchReveal]);

  const markRevealedMutation = useMutation({
    mutationFn: async (matchId: string) => {
      return apiRequest("PATCH", `/api/matches/${matchId}/reveal`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/unrevealed-matches`] });
    },
  });

  const handleCloseMatchReveal = () => {
    if (currentMatch) markRevealedMutation.mutate(currentMatch.id);
    setShowMatchReveal(false);
    setCurrentMatch(null);
  };

  const { data: currentUser } = useQuery<User & {
    selfDiscoveryCompleted?: boolean;
    attractionBlueprint?: any;
    gender?: string | null;
    dealbreakers?: string[] | null;
    topPriorities?: string[] | null;
    interests?: string[] | null;
    loveLanguage?: string | null;
    commitmentIntention?: string | null;
  }>({
    queryKey: [`/api/users/${userId}`],
    enabled: !!userId,
  });

  const hasAttractionBlueprint = !!currentUser?.attractionBlueprint;
  /** AI Matchmaker (30 questions) saves the blueprint — required for AI matches & full Discover list */
  const aiMatchmakerComplete = hasAttractionBlueprint;

  const { data: aiMatches = [] } = useQuery<AIMatch[]>({
    queryKey: [`/api/users/${userId}/ai-matches`],
    enabled: !!userId && hasAttractionBlueprint,
    queryFn: async () => {
      if (!userId) return [];
      try { return await getAIMatches(userId); } catch { return []; }
    },
  });

  const safeProfiles = Array.isArray(profiles) ? profiles : [];
  const safeAiMatches = Array.isArray(aiMatches) ? aiMatches : [];

  const aiMatchMap = new Map<string, AIMatch>();
  safeAiMatches.forEach(match => { if (match?.id) aiMatchMap.set(match.id, match); });

  let filteredProfiles = safeProfiles.filter(p => p?.id !== userId);
  if (selectedGender !== 'all') filteredProfiles = filteredProfiles.filter(p => p.gender === selectedGender);
  if (selectedEducation !== 'all') filteredProfiles = filteredProfiles.filter(p => p.education === selectedEducation);
  if (selectedLocation !== 'all') filteredProfiles = filteredProfiles.filter(p => p.location?.toLowerCase().includes(selectedLocation.toLowerCase()));
  if (verifiedOnly) filteredProfiles = filteredProfiles.filter(p => p.verified === true);
  filteredProfiles = filteredProfiles.filter(p => { if (!p.age) return false; return p.age >= ageRange[0] && p.age <= ageRange[1]; });

  const calculateCompatibility = (profile: Profile): { score: number; reasons: string[] } => {
    let baseScore = 50;
    const reasons: string[] = [];
    const userInterests = Array.isArray(currentUser?.interests) ? currentUser.interests : [];
    const profileInterests = Array.isArray(profile.interests) ? profile.interests : [];
    const sharedInterests = userInterests.filter(i => profileInterests.includes(i));
    if (sharedInterests.length > 0) { baseScore += Math.min(sharedInterests.length * 5, 25); reasons.push(`${sharedInterests.length} shared interest${sharedInterests.length > 1 ? 's' : ''}`); }
    if (profile.avatar) { baseScore += 5; reasons.push("Complete profile"); }
    if (profile.verified) { baseScore += 5; reasons.push("Verified"); }
    if (currentUser?.commitmentIntention && profile.commitmentIntention) {
      const compatible = { 'marriage': ['marriage', 'serious'], 'serious': ['serious', 'marriage', 'casual'], 'casual': ['casual', 'serious'] };
      if (compatible[currentUser.commitmentIntention as keyof typeof compatible]?.includes(profile.commitmentIntention)) { baseScore += 15; reasons.push("Aligned marriage intentions"); }
    }
    return { score: Math.min(Math.max(baseScore, 0), 100), reasons: reasons.length > 0 ? reasons : ["Potential match"] };
  };

  let profilesWithCompatibility = filteredProfiles.map(profile => {
    const matchResult = calculateCompatibility(profile);
    return { ...profile, tags: Array.isArray(profile.interests) ? profile.interests : [], compatibility: matchResult.score, matchReasons: matchResult.reasons };
  });

  if (sortBy === 'compatibility') profilesWithCompatibility.sort((a, b) => b.compatibility - a.compatibility);
  else if (sortBy === 'age') profilesWithCompatibility.sort((a, b) => (a.age || 0) - (b.age || 0));
  if (aiMatchmakerComplete) profilesWithCompatibility = profilesWithCompatibility.filter(p => p.compatibility >= 40).slice(0, 20);

  const uniqueLocations = Array.from(new Set(profiles.map(p => p.location).filter(Boolean))) as string[];
  const uniqueGenders = Array.from(new Set(profiles.map(p => p.gender).filter(Boolean))) as string[];

  const sortOptions = [
    { id: 'compatibility', label: 'Best Match' },
    { id: 'age', label: 'Age' },
    { id: 'newest', label: 'Newest' },
  ];

  return (
    <PageWrapper>
    <div className="min-h-screen bg-gray-50 pb-24">
      <Header showSearch={true} onLogout={logout} title="Discover" />

      <div className="max-w-lg mx-auto">
        {/* AI Matchmaker required — no AI matches / full list until 30 questions are finished */}
        {!aiMatchmakerComplete && (
          <div
            className="mx-4 mt-4 rounded-2xl border-2 border-amber-400/80 bg-amber-50 p-4 shadow-sm"
            role="status"
            data-testid="banner-ai-matchmaker-incomplete"
          >
            <div className="flex gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-amber-100">
                <AlertCircle className="h-5 w-5 text-amber-700" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-sm text-amber-950 mb-1">Finish AI Matchmaker to see matches</p>
                <p className="text-xs text-amber-900/85 leading-relaxed mb-3">
                  Personalized and AI-ranked matches stay hidden until you complete all{" "}
                  <span className="font-semibold">30 questions</span>. People in Discover will show here
                  after you finish.
                </p>
                <Button
                  size="sm"
                  className="bg-primary text-primary-foreground font-bold rounded-xl h-9 text-xs hover:bg-primary/90 shadow-sm"
                  onClick={() => setLocation("/ai-matchmaker/flow-b")}
                >
                  <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                  Continue AI Matchmaker
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* AI Match banner */}
        {hasAttractionBlueprint && safeAiMatches.length > 0 && (
          <div className="mx-4 mt-3 bg-primary/5 border border-primary/20 rounded-2xl px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-800">AI Matchmaker Active</p>
              <p className="text-xs text-gray-500">{safeAiMatches.length} AI-powered match{safeAiMatches.length !== 1 ? 'es' : ''} found</p>
            </div>
          </div>
        )}

        {/* Filter chips */}
        <div className="px-4 mt-4">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
            {/* Sort chips */}
            {sortOptions.map(opt => (
              <button
                key={opt.id}
                onClick={() => setSortBy(opt.id)}
                className={`flex-shrink-0 flex items-center gap-1 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                  sortBy === opt.id
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white text-gray-600 border-gray-200'
                }`}
              >
                {sortBy === opt.id && <Check className="w-3 h-3" />}
                {opt.label}
              </button>
            ))}

            {/* Gender chips */}
            {uniqueGenders.map(g => (
              <button
                key={g}
                onClick={() => setSelectedGender(selectedGender === g ? 'all' : g)}
                className={`flex-shrink-0 flex items-center gap-1 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors capitalize ${
                  selectedGender === g
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white text-gray-600 border-gray-200'
                }`}
              >
                {selectedGender === g && <Check className="w-3 h-3" />}
                {g}
              </button>
            ))}

            {/* Verified chip */}
            <button
              onClick={() => setVerifiedOnly(!verifiedOnly)}
              className={`flex-shrink-0 flex items-center gap-1 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                verifiedOnly ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-200'
              }`}
            >
              {verifiedOnly && <Check className="w-3 h-3" />}
              Verified
            </button>

            {/* Location chips */}
            {uniqueLocations.slice(0, 5).map(loc => (
              <button
                key={loc}
                onClick={() => setSelectedLocation(selectedLocation === loc ? 'all' : loc)}
                className={`flex-shrink-0 flex items-center gap-1 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                  selectedLocation === loc
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white text-gray-600 border-gray-200'
                }`}
              >
                {selectedLocation === loc && <Check className="w-3 h-3" />}
                {loc}
              </button>
            ))}
          </div>

          {/* Age range */}
          <div className="mt-3 bg-white rounded-2xl px-4 py-3 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Age Range</span>
              <span className="text-xs font-bold text-primary">{ageRange[0]} – {ageRange[1]}</span>
            </div>
            <div className="flex gap-3 items-center">
              <input type="range" min="18" max="100" value={ageRange[0]} onChange={(e) => setAgeRange([parseInt(e.target.value), ageRange[1]])} className="flex-1 accent-primary" />
              <input type="range" min="18" max="100" value={ageRange[1]} onChange={(e) => setAgeRange([ageRange[0], parseInt(e.target.value)])} className="flex-1 accent-primary" />
            </div>
          </div>
        </div>

        {/* Likes in your filters — blurred profile card grid */}
        <div className="px-4 mt-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-gray-800">Likes in your filters</h3>
            <span className="text-xs text-primary font-semibold">Upgrade to see</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { loc: 'London', eth: 'British', job: 'Teacher', time: '2h ago' },
              { loc: 'Manchester', eth: 'Pakistani', job: 'Engineer', time: '5h ago' },
              { loc: 'Birmingham', eth: 'Somali', job: 'Doctor', time: '1d ago' },
              { loc: 'Leeds', eth: 'Bengali', job: 'Nurse', time: '2d ago' },
            ].map((card, i) => (
              <div key={i} className="relative rounded-2xl overflow-hidden bg-gray-100 border border-gray-100 shadow-sm">
                <div className="h-36 bg-gradient-to-br from-primary/20 to-chart-1/30 flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 backdrop-blur-xl bg-white/30" />
                  <div className="relative z-10 flex flex-col items-center gap-1">
                    <Crown className="w-7 h-7 text-primary/70" />
                    {card.loc && (
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="text-[10px] text-gray-600 bg-white/80 rounded px-1.5 py-0.5">📍 {card.loc}</span>
                        <span className="text-[10px] text-gray-600 bg-white/80 rounded px-1.5 py-0.5">🌍 {card.eth}</span>
                        <span className="text-[10px] text-gray-600 bg-white/80 rounded px-1.5 py-0.5">💼 {card.job}</span>
                        <span className="text-[10px] text-gray-500 mt-0.5">{card.time}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button
            className="mt-3 w-full py-2.5 rounded-2xl text-sm font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #f94272, #ff6b9d)' }}
            onClick={() => setLocation('/subscriptions')}
          >
            See who liked you — Upgrade
          </button>
        </div>

        {/* Boosted visits — blurred placeholder cards */}
        <div className="px-4 mt-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-gray-800">Boosted visits</h3>
            <span className="text-xs text-primary font-semibold">Boost your profile</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { loc: 'Bristol', job: 'Accountant', time: '3h ago' },
              { loc: 'Cardiff', job: 'Designer', time: '6h ago' },
            ].map((card, i) => (
              <div key={i} className="relative rounded-2xl overflow-hidden bg-gray-100 border border-gray-100 shadow-sm">
                <div className="h-36 bg-gradient-to-br from-chart-4/20 to-chart-1/30 flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 backdrop-blur-xl bg-white/30" />
                  <div className="relative z-10 flex flex-col items-center gap-1">
                    <Rocket className="w-7 h-7 text-chart-4/70" />
                    <span className="text-[10px] text-gray-600 bg-white/80 rounded px-1.5 py-0.5">📍 {card.loc}</span>
                    <span className="text-[10px] text-gray-600 bg-white/80 rounded px-1.5 py-0.5">💼 {card.job}</span>
                    <span className="text-[10px] text-gray-500 mt-0.5">{card.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button
            className="mt-3 w-full py-2.5 rounded-2xl text-sm font-bold text-white bg-chart-4"
            onClick={() => setLocation('/subscriptions')}
          >
            🚀 Get seen more — Boost Profile
          </button>
        </div>

        {/* Profile list */}
        <div className="px-4 mt-4 space-y-4">
          {!aiMatchmakerComplete ? (
            <EmptyState
              useMascot={true}
              mascotType="default"
              title="AI Matchmaker not finished"
              description="Complete all 30 questions to unlock matches and AI compatibility scores in Discover."
              actionLabel="Go to AI Matchmaker"
              onAction={() => setLocation("/ai-matchmaker/flow-b")}
              className="max-w-md mx-auto py-12"
            />
          ) : isLoading ? (
            <div className="py-12">
              <LoadingState message="Finding your matches..." showMascot={true} />
            </div>
          ) : profilesWithCompatibility.length === 0 ? (
            <EmptyState
              useMascot={true}
              mascotType="no-matches"
              title="No matches found"
              description="Try adjusting your filters or finish AI Matchmaker!"
              className="max-w-md mx-auto py-12"
            />
          ) : (
            profilesWithCompatibility.map((profile) => {
              const aiMatch = aiMatchMap.get(profile.id);
              return (
                <ProfileCard
                  key={profile.id}
                  id={profile.id}
                  name={profile.name}
                  age={profile.age || 0}
                  image={aiMatch?.image ?? profile.avatar ?? undefined}
                  onViewProfile={(id: string) => setLocation(`/profile/${id}`)}
                  location={profile.location || 'Location not set'}
                  bio={profile.bio || 'No bio available'}
                  tags={profile.tags}
                  compatibility={aiMatch?.compatibility || profile.compatibility}
                  matchReasons={aiMatch?.reasons || profile.matchReasons}
                  mutualCompatibility={aiMatch?.mutualCompatibility}
                  isAIMatch={!!aiMatch}
                  lookingFor={profile.relationshipGoal ? `Looking for ${profile.relationshipGoal.toLowerCase()}` : "Looking for meaningful connection"}
                />
              );
            })
          )}
        </div>
      </div>

      <BottomNav active={activePage} onNavigate={setActivePage} />

      {showMatchReveal && currentMatch && (
        <MatchReveal
          match={currentMatch}
          onClose={handleCloseMatchReveal}
          onMessage={(matchedUserId) => {
            if (currentMatch) markRevealedMutation.mutate(currentMatch.id);
            setShowMatchReveal(false);
            setCurrentMatch(null);
            setLocation(`/chat?user=${matchedUserId}`);
          }}
        />
      )}
    </div>
    </PageWrapper>
  );
}
