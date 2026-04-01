import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Heart, X, ArrowRight, ArrowLeft, Check, Loader2, Info, ArrowLeft as BackArrow } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useCurrentUser } from "@/contexts/UserContext";
import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";
import { saveAttractionBlueprint, getAIMatches, type AIMatch } from "@/services/aiMatchmaker.service";
import { useToast } from "@/hooks/use-toast";
import { MatchDetails } from "@/components/matches/MatchDetails";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { getAttractionCards } from "@/lib/attractionFlowImages";
import { getActorImage } from "@/lib/actorImages";
import logoImage from "@assets/matchify-neon-transparent-512_1760527824718.png";

type FlowStep = "intro" | "looks" | "energy" | "lifestyle" | "future" | "results";

// Helper function to get card pairs for side-by-side display
const getCardPairs = (cards: Array<{ id: number; image: string; label: string; description: string }>) => {
  const pairs = [];
  for (let i = 0; i < cards.length; i += 2) {
    pairs.push([cards[i], cards[i + 1] || null]);
  }
  return pairs;
};

export default function FlowA() {
  const [, setLocation] = useLocation();
  const { userId } = useCurrentUser();
  const { toast } = useToast();
  const [step, setStep] = useState<FlowStep>("intro");
  const [currentPairIndex, setCurrentPairIndex] = useState(0);
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  
  const [preferences, setPreferences] = useState({
    looks: [] as string[],
    energy: [] as string[],
    lifestyle: [] as string[],
    future: [] as string[],
  });

  // Get user gender for gender-specific matching
  const { data: currentUser } = useQuery<User & { gender?: string | null }>({
    queryKey: [`/api/users/${userId}`],
    enabled: !!userId,
  });

  const rawGender = currentUser?.gender;
  const userGender: "male" | "female" | null | undefined =
    rawGender === "male" || rawGender === "female" ? rawGender : null;

  const stepOrder: FlowStep[] = ["looks", "energy", "lifestyle", "future"];
  
  const getCurrentCards = () => {
    const cards = getAttractionCards(userGender ?? undefined);
    switch (step) {
      case "looks": return cards.looks;
      case "energy": return cards.energy;
      case "lifestyle": return cards.lifestyle;
      case "future": return cards.future;
      default: return [];
    }
  };

  const getCardPairsForStep = () => {
    const cards = getCurrentCards();
    return getCardPairs(cards);
  };

  const getStepTitle = () => {
    if (userGender === 'male') {
      // Men seeking women - focus on physical attraction, style, energy
      switch (step) {
        case "looks": return "What Style Attracts You?";
        case "energy": return "What Energy Draws You In?";
        case "lifestyle": return "What Lifestyle Appeals to You?";
        case "future": return "What Future Vision Matters?";
        default: return "";
      }
    } else if (userGender === 'female') {
      // Women seeking men - focus on character, values, ambition
      switch (step) {
        case "looks": return "What Character Traits Attract You?";
        case "energy": return "What Energy Resonates With You?";
        case "lifestyle": return "What Lifestyle Aligns With You?";
        case "future": return "What Future Goals Matter to You?";
        default: return "";
      }
    } else {
      // Default/neutral
      switch (step) {
        case "looks": return "Choose Your Style Preference";
        case "energy": return "Choose Your Energy Match";
        case "lifestyle": return "Choose Your Lifestyle";
        case "future": return "Choose Your Future Vision";
        default: return "";
      }
    }
  };

  const getStepSubtitle = () => {
    if (userGender === 'male') {
      switch (step) {
        case "looks": return "Select styles that catch your eye";
        case "energy": return "Choose energies that draw you in";
        case "lifestyle": return "Pick lifestyles that appeal to you";
        case "future": return "Select future visions that matter";
        default: return "Tap a card to select your preference";
      }
    } else if (userGender === 'female') {
      switch (step) {
        case "looks": return "Select character traits you value";
        case "energy": return "Choose energies that resonate";
        case "lifestyle": return "Pick lifestyles that align";
        case "future": return "Select goals that matter to you";
        default: return "Tap a card to select your preference";
      }
    } else {
      return "Tap a card to select your preference";
    }
  };

  const getProgress = () => {
    if (step === "intro") return 0;
    if (step === "results") return 100;
    const stepIdx = stepOrder.indexOf(step as any);
    const pairs = getCardPairsForStep();
    const pairProgress = (currentPairIndex / pairs.length);
    return ((stepIdx + pairProgress) / stepOrder.length) * 100;
  };

  const handleCardSelect = (cardLabel: string) => {
    setSelectedCard(cardLabel);
    const category = step as keyof typeof preferences;
    if (category in preferences) {
      setPreferences(prev => ({
        ...prev,
        [category]: [...prev[category], cardLabel]
      }));
    }

    // Auto-advance after selection
    setTimeout(() => {
      const pairs = getCardPairsForStep();
      if (currentPairIndex < pairs.length - 1) {
        setCurrentPairIndex(prev => prev + 1);
        setSelectedCard(null);
      } else {
        const currentStepIndex = stepOrder.indexOf(step as any);
        if (currentStepIndex < stepOrder.length - 1) {
          setStep(stepOrder[currentStepIndex + 1]);
          setCurrentPairIndex(0);
          setSelectedCard(null);
        } else {
          setStep("results");
        }
      }
    }, 500);
  };

  const pairs = getCardPairsForStep();
  const currentPair = pairs[currentPairIndex];
  const totalPairs = stepOrder.reduce((sum, s) => {
    const cards = getCurrentCards();
    return sum + Math.ceil((cards.length || 0) / 2);
  }, 0);
  const currentTotal = stepOrder.slice(0, stepOrder.indexOf(step as any)).reduce((sum, s) => {
    const cards = getCurrentCards();
    return sum + Math.ceil((cards.length || 0) / 2);
  }, 0) + currentPairIndex + 1;

  if (step === "intro") {
    return (
      <div className="min-h-screen h-[100dvh] bg-gradient-to-br from-zinc-950 via-red-950/90 to-zinc-950 flex flex-col overflow-hidden safe-top safe-bottom">
        {/* Header with back button */}
        <div className="px-4 pt-3 pb-2 flex items-center gap-3">
          <button
            onClick={() => setLocation('/ai-matchmaker')}
            className="w-10 h-10 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
          >
            <BackArrow className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center"
          >
            <img src={logoImage} alt="Matchify" className="h-28 w-auto object-contain brightness-110 mb-4" />
            <div className="w-32 h-1.5 bg-primary/40 rounded-full mx-auto mb-8">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="h-full bg-white rounded-full"
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mb-8"
          >
            <h2 className="text-2xl font-bold text-white mb-2">Create Your Dream Match</h2>
            <p className="text-white/80 text-sm mb-1">Choose your preferences</p>
            <p className="text-white/60 text-xs">We'll learn your attraction patterns in ~2 minutes</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <Button 
              size="lg"
              className="rounded-full px-8 py-6 bg-white text-primary hover:bg-white/90 font-semibold text-base shadow-xl"
              onClick={() => setStep("looks")}
              data-testid="button-start-flow-a"
            >
              Start (~2 min)
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  if (step === "results") {
    const [isSaving, setIsSaving] = useState(false);
    const [matches, setMatches] = useState<AIMatch[]>([]);
    const [isLoadingMatches, setIsLoadingMatches] = useState(true);
    const [selectedMatch, setSelectedMatch] = useState<AIMatch | null>(null);

    // Save preferences and fetch matches when results screen loads
    useEffect(() => {
      const saveAndFetch = async () => {
        if (!userId) return;
        
        setIsSaving(true);
        try {
          // Save attraction blueprint
          await saveAttractionBlueprint(userId, {
            flowType: 'flow-a',
            stylePreferences: preferences.looks,
            energyPreferences: preferences.energy,
            lifestylePreferences: preferences.lifestyle,
            futureVision: preferences.future,
            weights: {
              looks: userGender === 'male' ? 0.4 : 0.2,
              energy: userGender === 'male' ? 0.3 : 0.2,
              lifestyle: userGender === 'female' ? 0.3 : 0.2,
              goals: userGender === 'female' ? 0.3 : 0.2,
              personality: 0.1,
              values: 0.1,
            },
          });
          
          const { matches: aiMatches } = await getAIMatches(userId);
          setMatches(aiMatches);
        } catch (error) {
          console.error('Error saving blueprint or fetching matches:', error);
          toast({
            title: "Error",
            description: "Failed to save preferences. Showing sample matches.",
            variant: "destructive",
          });
          // Fallback to mock matches on error
          setMatches([
            { id: "1", name: "Sarah", age: 26, image: getActorImage(0), compatibility: 85, reasons: ["Style match", "Shared interests"], emphasis: "Physical compatibility" },
            { id: "2", name: "Emily", age: 28, image: getActorImage(1), compatibility: 80, reasons: ["Energy alignment", "Lifestyle compatibility"], emphasis: "Physical compatibility" },
            { id: "3", name: "Jessica", age: 25, image: getActorImage(2), compatibility: 75, reasons: ["Style match"], emphasis: "Physical compatibility" },
          ]);
        } finally {
          setIsSaving(false);
          setIsLoadingMatches(false);
        }
      };
      
      saveAndFetch();
    }, [userId, preferences.looks, preferences.energy, preferences.lifestyle, preferences.future, userGender]);

    // Gender-specific match insights
    const getMatchInsights = () => {
      if (userGender === 'male') {
        return {
          title: "Physical Attraction Match",
          description: "Based on your preferences for looks, style, and energy, we found people who match your attraction profile.",
          emphasis: "Physical compatibility"
        };
      } else if (userGender === 'female') {
        return {
          title: "Goals & Values Match",
          description: "Based on your preferences for lifestyle, future goals, and values, we found people aligned with your vision.",
          emphasis: "Life goals & values alignment"
        };
      }
      return {
        title: "Compatibility Match",
        description: "Based on your preferences, we found people who share your interests and lifestyle.",
        emphasis: "Shared interests"
      };
    };

    const insights = getMatchInsights();
    const allPrefs = [...preferences.looks, ...preferences.energy, ...preferences.lifestyle, ...preferences.future];

    if (isSaving || isLoadingMatches) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-sm text-muted-foreground">Finding your perfect matches...</p>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-background px-3 pt-3 pb-16">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-base font-bold text-foreground">Your Matches</h2>
          <Badge className="bg-primary/20 text-primary text-[10px] px-1.5 py-0.5">Quick</Badge>
        </div>

        {allPrefs.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-muted-foreground mb-2">Your attraction profile:</p>
            <div className="flex flex-wrap gap-1.5">
              {allPrefs.slice(0, 8).map((pref, i) => (
                <Badge key={i} variant="secondary" className="text-[10px] px-2 py-1 bg-primary/10 text-primary border border-primary/20">
                {pref}
              </Badge>
            ))}
            </div>
          </div>
        )}

        <div className="mb-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
          <p className="text-xs text-foreground font-medium mb-1">✨ {insights.title}</p>
          <p className="text-[10px] text-muted-foreground">
            {insights.description}
          </p>
          {userGender && (
            <p className="text-[10px] text-primary mt-1 font-medium">
              Emphasis: {insights.emphasis}
            </p>
          )}
        </div>

        <div className="space-y-3">
          {matches.length > 0 ? (
            matches.map((match, index) => (
              <motion.div
                key={match.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 rounded-lg bg-card border border-border hover:border-primary/50 transition-all"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="relative flex-shrink-0">
                    <img 
                      src={match.image || "/placeholder.png"} 
                      alt={match.name}
                      className="w-16 h-16 rounded-full object-cover ring-2 ring-primary/30"
                    />
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-primary border-2 border-background flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 text-white" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-bold text-foreground text-base mb-0.5">
                          {match.name}{match.age ? `, ${match.age}` : ''}
                        </h3>
                        {match.emphasis && (
                          <p className="text-[10px] text-primary font-medium">{match.emphasis}</p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge className="bg-primary/20 text-primary text-xs px-2.5 py-1 font-bold">
                          {match.compatibility}%
                        </Badge>
                        {match.mutualCompatibility && (
                          <Badge className="bg-blue-500/20 text-blue-400 text-[10px] px-1.5 py-0.5">
                            {match.mutualCompatibility}% Mutual
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="space-y-1.5 mb-3">
                      {match.reasons.slice(0, 3).map((reason, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Check className="w-3 h-3 text-primary flex-shrink-0" />
                          <span className="line-clamp-1">{reason}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-3 text-xs flex-1"
                        onClick={() => setSelectedMatch(match)}
                      >
                        <Info className="w-3.5 h-3.5 mr-1.5" />
                        Details
                      </Button>
                      <Button
                        size="sm"
                        className="h-8 px-3 text-xs flex-1 glow-primary"
                        onClick={() => setLocation(`/profile/${match.id}`)}
                      >
                        View Profile
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-12">
              <p className="text-sm text-muted-foreground mb-2">No matches found yet.</p>
              <p className="text-xs text-muted-foreground/70">Complete your profile to get better matches!</p>
            </div>
          )}
        </div>

        {selectedMatch && (
          <MatchDetails
            match={selectedMatch}
            onClose={() => setSelectedMatch(null)}
          />
        )}

        <div className="fixed bottom-0 left-0 right-0 p-2.5 bg-background/95 backdrop-blur border-t border-border">
          <Button 
            size="sm"
            className="w-full rounded-full glow-primary"
            onClick={() => setLocation('/directory')}
          >
            View All Matches
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen h-[100dvh] bg-gradient-to-br from-zinc-950 via-red-950/90 to-zinc-950 flex flex-col overflow-hidden safe-top safe-bottom relative">
      {/* Header with back button and progress */}
      <div className="px-4 pt-3 pb-2 flex items-center gap-3">
        <button
          onClick={() => {
            if (currentPairIndex > 0) {
              setCurrentPairIndex(prev => prev - 1);
              setSelectedCard(null);
            } else {
              const currentStepIndex = stepOrder.indexOf(step as any);
              if (currentStepIndex > 0) {
                const prevStep = stepOrder[currentStepIndex - 1];
                setStep(prevStep);
                // Use getCurrentCards helper (will be called after step changes)
                setTimeout(() => {
                  const prevCards = getCurrentCards();
                  const prevPairs = getCardPairs(prevCards);
                  setCurrentPairIndex(prevPairs.length - 1);
                  setSelectedCard(null);
                }, 0);
              } else {
                setLocation('/ai-matchmaker');
              }
            }
          }}
          className="w-10 h-10 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
        >
          <BackArrow className="w-5 h-5 text-white" />
        </button>
        <div className="flex-1 flex items-center gap-2">
          <img src={logoImage} alt="Matchify" className="h-10 w-auto object-contain brightness-110" />
          <div className="relative flex-1 min-w-0">
            <Progress value={getProgress()} className="h-2 bg-white/10" />
            <div className="absolute inset-0 h-2 bg-gradient-to-r from-red-950/40 via-primary/45 to-red-950/40 rounded-full blur-sm" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 pb-20">
        {/* Step Title */}
        <motion.div
          key={`${step}-${userGender}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h2 className="text-4xl font-bold text-white mb-3 drop-shadow-lg tracking-tight">{getStepTitle()}</h2>
          <p className="text-white/70 text-sm">{getStepSubtitle()}</p>
        </motion.div>

        {/* Two Cards Side by Side */}
        {currentPair && (
          <div className="w-full max-w-2xl grid grid-cols-2 gap-6 mb-8">
            {currentPair.map((card, index) => {
              if (!card) return null;
              const isSelected = selectedCard === card.label;
              
              return (
                <motion.div
                  key={`${step}-${card.id}-${currentPairIndex}`}
                  initial={{ opacity: 0, scale: 0.8, y: 50, rotateY: -15 }}
                  animate={{ 
                    opacity: 1, 
                    scale: isSelected ? 1.05 : 1,
                    y: 0,
                    rotateY: 0
                  }}
                  exit={{ 
                    opacity: 0, 
                    scale: 0.8, 
                    x: index === 0 ? -100 : 100,
                    rotateY: index === 0 ? -30 : 30
                  }}
                  transition={{ 
                    type: "spring",
                    stiffness: 300,
                    damping: 25,
                    delay: index * 0.15
                  }}
                  className="relative"
                >
                  <motion.button
                    onClick={() => !selectedCard && handleCardSelect(card.label)}
                    disabled={!!selectedCard}
                    className={`w-full aspect-[3/4] rounded-3xl overflow-hidden relative group ${
                      isSelected 
                        ? 'ring-4 ring-white shadow-[0_0_30px_rgba(255,255,255,0.5)]' 
                        : 'ring-2 ring-white/20 shadow-xl hover:ring-white/40'
                    } ${selectedCard && !isSelected ? 'opacity-40 grayscale' : ''} transition-all duration-300`}
                    whileHover={!selectedCard ? { 
                      scale: 1.03, 
                      y: -8,
                      rotateY: 5,
                      transition: { type: "spring", stiffness: 400 }
                    } : {}}
                    whileTap={!selectedCard ? { scale: 0.95 } : {}}
                  >
                    <motion.div
                      className="w-full h-full"
                      animate={isSelected ? { scale: 1.1, filter: "brightness(1.1)" } : {}}
                      transition={{ duration: 0.3 }}
                    >
                      <ImageWithFallback
                        src={card.image}
                        fallbackSrc={getActorImage(card.id - 1)}
                        alt={card.label}
                        className="w-full h-full object-cover"
                        draggable={false}
                      />
                    </motion.div>
                    
                    {/* Enhanced dark overlay */}
                    <motion.div 
                      className={`absolute inset-0 transition-all duration-300 ${
                        isSelected 
                          ? 'bg-gradient-to-t from-black/90 via-black/50 to-black/30' 
                          : 'bg-gradient-to-t from-black/85 via-black/45 to-black/25 group-hover:from-black/80'
                      }`}
                      animate={isSelected ? {
                        opacity: [0.85, 0.9, 0.85]
                      } : {}}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    
                    {/* Animated glow effect for selected card */}
                    {isSelected && (
                      <motion.div 
                        className="absolute inset-0 bg-gradient-to-r from-white/30 via-transparent to-white/30"
                        animate={{
                          x: ['-100%', '100%'],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "linear"
                        }}
                      />
                    )}
                    
                    {/* Enhanced Heart Icon with multiple animations */}
                    <motion.div 
                      className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10"
                      animate={isSelected ? {
                        scale: [1, 1.3, 1.2],
                        rotate: [0, 10, -10, 0],
                      } : {}}
                      transition={{ 
                        duration: 0.6,
                        times: [0, 0.5, 1]
                      }}
                    >
                      <motion.div
                        animate={isSelected ? {
                          scale: [1, 1.1, 1],
                        } : {}}
                        transition={{ 
                          duration: 1.5,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      >
                        <Heart className={`w-14 h-14 drop-shadow-2xl ${
                          isSelected 
                            ? 'text-white fill-white drop-shadow-[0_0_20px_rgba(255,255,255,0.8)]' 
                            : 'text-white/70 group-hover:text-white/90 group-hover:scale-110 transition-all'
                        }`} />
                      </motion.div>
                    </motion.div>
                    
                    {/* Enhanced Label with entrance animation */}
                    <motion.div 
                      className="absolute bottom-0 left-0 right-0 p-4 z-10"
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                    >
                      <motion.div
                        initial={false}
                        animate={isSelected ? { 
                          scale: 1.05,
                          y: -5
                        } : { scale: 1, y: 0 }}
                        className={`rounded-xl px-5 py-3 text-center backdrop-blur-md transition-all duration-300 ${
                          isSelected 
                            ? 'bg-white/95 text-primary shadow-xl font-semibold' 
                            : 'bg-black/60 text-white border border-white/20 group-hover:bg-black/70 group-hover:border-white/30'
                        }`}
                      >
                        <motion.span 
                          className="font-bold text-base tracking-wide block"
                          animate={isSelected ? {
                            scale: [1, 1.05, 1]
                          } : {}}
                          transition={{ duration: 0.5 }}
                        >
                          {card.label}
                        </motion.span>
                        {card.description && (
                          <motion.p 
                            className={`text-xs mt-1 ${
                              isSelected ? 'text-primary' : 'text-white/70'
                            }`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 }}
                          >
                            {card.description}
                          </motion.p>
                        )}
                      </motion.div>
                    </motion.div>
                    
                    {/* Particle effect on selection */}
                    {isSelected && (
                      <motion.div
                        className="absolute inset-0 pointer-events-none"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        {[...Array(6)].map((_, i) => (
                          <motion.div
                            key={i}
                            className="absolute w-2 h-2 bg-white rounded-full"
                            style={{
                              left: '50%',
                              top: '50%',
                            }}
                            animate={{
                              x: [0, Math.cos(i * 60 * Math.PI / 180) * 100],
                              y: [0, Math.sin(i * 60 * Math.PI / 180) * 100],
                              opacity: [1, 0],
                              scale: [1, 0],
                            }}
                            transition={{
                              duration: 0.8,
                              delay: i * 0.1,
                            }}
                          />
                        ))}
                      </motion.div>
                    )}
                  </motion.button>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Progress indicator */}
        <div className="text-white/50 text-sm font-medium">
          {currentTotal} / {totalPairs}
        </div>
      </div>

      {/* Swipe instruction hint */}
      <div className="absolute bottom-6 left-0 right-0 px-4">
        <p className="text-white/40 text-xs text-center backdrop-blur-sm bg-black/20 rounded-full py-2 px-4 inline-block">
          Tap a card to select your preference
        </p>
      </div>
    </div>
  );
}
