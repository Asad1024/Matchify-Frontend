import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageCircle, Sparkles, Zap, Star, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { buildApiUrl } from "@/services/api";
import { useToast } from "@/hooks/use-toast";

interface Match {
  id: string;
  userId: string;
  name: string;
  avatar?: string;
  compatibility: number;
  insights: string[];
  matchQuality: 'high' | 'medium' | 'low';
}

interface EventMatchResultsProps {
  matches: Match[];
  eventTitle: string;
  eventId: string;
  onMessage?: (userId: string) => void;
  /** When true, hides reshuffle button (e.g. for demo page) */
  isDemo?: boolean;
}

export default function EventMatchResults({ matches, eventTitle, eventId, onMessage, isDemo }: EventMatchResultsProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showConfetti, setShowConfetti] = useState(true);
  const [revealedMatches, setRevealedMatches] = useState<Set<string>>(new Set());

  useEffect(() => {
    // intentionally empty – no-op kept to avoid hook ordering changes
  }, [eventId]);

  // Reshuffle matches mutation
  const reshuffleMutation = useMutation({
    mutationFn: async () => {
      const url = buildApiUrl(`/api/events/${eventId}/reshuffle-matches`);
      const res = await fetch(url, {
        method: "POST",
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({ message: 'Failed to reshuffle matches' }));
        throw new Error(error.message || 'Failed to reshuffle matches');
      }
      return res.json();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [`/api/events/${eventId}/matches`] });
      toast({
        title: "Matches reshuffled! 🔄",
        description: "Your event matches list was refreshed.",
      });
      // Reset revealed matches to show animation again
      setRevealedMatches(new Set());
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    },
    onError: (error: Error) => {
      toast({
        title: "Reshuffle failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    // Reveal matches one by one
    matches.forEach((match, index) => {
      setTimeout(() => {
        setRevealedMatches(prev => new Set(Array.from(prev).concat(match.id)));
      }, index * 200);
    });

    // Hide confetti after animation
    setTimeout(() => setShowConfetti(false), 3000);
  }, [matches]);

  const getMatchQualityColor = (quality: string) => {
    switch (quality) {
      case 'high':
        return 'bg-gradient-to-r from-primary/20 to-pink-500/20 text-primary border-primary/50';
      case 'medium':
        return 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20 text-yellow-500 border-yellow-500/50';
      case 'low':
        return 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-500 border-blue-500/50';
      default:
        return 'bg-primary/20 text-primary border-primary/50';
    }
  };

  const getMatchQualityIcon = (quality: string) => {
    switch (quality) {
      case 'high':
        return <Zap className="w-4 h-4" />;
      case 'medium':
        return <Star className="w-4 h-4" />;
      default:
        return <Heart className="w-4 h-4" />;
    }
  };

  if (matches.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="border-2 border-dashed">
          <CardContent className="p-12 text-center">
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Heart className="w-20 h-20 mx-auto mb-4 text-muted-foreground" />
            </motion.div>
            <h3 className="text-2xl font-bold mb-2">No Matches Yet</h3>
            <p className="text-muted-foreground text-lg">
              Keep mingling! Matches will be calculated once more people complete the questionnaire.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <div className="space-y-8 relative">
      {/* Reshuffle Button - Prominent at the top (hidden in demo) */}
      {!isDemo && (
        <div className="flex justify-center mb-6">
          <Button
            variant="outline"
            size="lg"
            onClick={() => {
              if (!eventId) {
                toast({
                  title: "Error",
                  description: "Event ID is missing. Please refresh the page.",
                  variant: "destructive",
                });
                return;
              }
              reshuffleMutation.mutate();
            }}
            disabled={reshuffleMutation.isPending || !eventId}
            className="border-2 border-primary/50 hover:bg-primary/10 hover:border-primary transition-all shadow-lg"
          >
            <RefreshCw className={`w-5 h-5 mr-2 ${reshuffleMutation.isPending ? 'animate-spin' : ''}`} />
            {reshuffleMutation.isPending ? "Reshuffling..." : "Reshuffle Matches"}
          </Button>
        </div>
      )}

      {/* Confetti effect */}
      <AnimatePresence>
        {showConfetti && (
          <div className="fixed inset-0 pointer-events-none z-50">
            {[...Array(100)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute"
                initial={{
                  x: "50%",
                  y: "10%",
                  opacity: 1,
                  scale: 1,
                  rotate: 0,
                }}
                animate={{
                  x: `${50 + (Math.random() - 0.5) * 100}%`,
                  y: "110%",
                  opacity: 0,
                  scale: 0,
                  rotate: 360,
                }}
                transition={{
                  duration: 2 + Math.random(),
                  delay: Math.random() * 0.5,
                  ease: "easeOut",
                }}
              >
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className={`w-3 h-3 ${
                    i % 4 === 0 ? 'bg-primary' : i % 4 === 1 ? 'bg-pink-400' : i % 4 === 2 ? 'bg-rose-300' : 'bg-white'
                  } rounded-full`}
                />
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center space-y-4"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
          className="inline-block"
        >
          <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center mb-4">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="w-10 h-10 text-primary" />
            </motion.div>
          </div>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-pink-500 to-rose-400 bg-clip-text text-transparent"
        >
          Your Matches Are Here! 🎉
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-muted-foreground text-lg"
        >
          Based on your values and preferences at <span className="font-semibold text-primary">{eventTitle}</span>
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, type: "spring" }}
          className="flex items-center justify-center gap-2 text-primary pt-2"
        >
          <Heart className="w-5 h-5 fill-primary animate-pulse" />
          <span className="text-sm font-medium">
            {matches.length} {matches.length === 1 ? 'match' : 'matches'} found
          </span>
        </motion.div>
      </motion.div>

      {/* Match cards */}
      <div className="grid gap-4">
        <AnimatePresence>
          {matches.map((match, index) => {
            const isRevealed = revealedMatches.has(match.id);

            return (
              <motion.div
                key={match.id}
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={isRevealed ? { opacity: 1, y: 0, scale: 1 } : {}}
                transition={{ delay: index * 0.12, type: "spring", stiffness: 120, damping: 18 }}
                className="relative"
              >
                <Card className={`overflow-hidden border transition-all shadow-md hover:shadow-lg ${
                  match.matchQuality === 'high' ? 'border-primary/40 bg-gradient-to-br from-primary/5 to-background' : 'border-border'
                }`}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={isRevealed ? { scale: 1 } : {}}
                        transition={{ delay: index * 0.12, type: "spring" }}
                        className="flex-shrink-0"
                      >
                        <Avatar className="w-16 h-16 border-2 border-primary/30 shadow">
                          <AvatarImage src={match.avatar} alt={match.name} />
                          <AvatarFallback className="text-xl font-bold bg-primary/10 text-primary">
                            {match.name.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </motion.div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-lg font-bold text-foreground truncate">{match.name}</h3>
                          <Badge className={`${getMatchQualityColor(match.matchQuality)} text-xs px-2 py-0.5 border`}>
                            <span className="flex items-center gap-1">
                              {getMatchQualityIcon(match.matchQuality)}
                              {match.compatibility}%
                            </span>
                          </Badge>
                        </div>
                        {match.insights[0] && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2 flex items-start gap-1">
                            <Sparkles className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
                            {match.insights[0]}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={isRevealed ? { opacity: 1 } : {}}
                      transition={{ delay: index * 0.12 + 0.3 }}
                      className="flex gap-2 mt-3"
                    >
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => setLocation(`/profile/${match.userId}`)}
                      >
                        View Profile
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          if (onMessage) {
                            onMessage(match.userId);
                          } else {
                            setLocation(`/chat?user=${match.userId}`);
                          }
                        }}
                      >
                        <MessageCircle className="w-3.5 h-3.5 mr-1.5" />
                        Message
                      </Button>
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Info card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: matches.length * 0.15 + 0.3 }}
      >
        <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border-primary/20">
          <CardContent className="p-6 text-center">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="inline-block mb-3"
            >
              <Sparkles className="w-8 h-8 text-primary mx-auto" />
            </motion.div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              💡 Matches are based on values alignment, lifestyle preferences, and relationship goals.
              The algorithm considers every possible configuration to find your best matches.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
