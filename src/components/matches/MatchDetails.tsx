import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { X, Check, Sparkles, Heart, MessageCircle } from "lucide-react";
import { useLocation } from "wouter";
import type { AIMatch } from "@/services/aiMatchmaker.service";

interface MatchDetailsProps {
  match: AIMatch;
  onClose: () => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  futureTogether: "Future Together",
  lifestyleTravel: "Lifestyle & Travel",
  fitness: "Fitness & Health",
  foodCompatibility: "Food Compatibility",
  communication: "Communication",
  values: "Core Values",
};

const CATEGORY_COLORS: Record<string, string> = {
  futureTogether: "bg-rose-500",
  lifestyleTravel: "bg-sky-500",
  fitness: "bg-primary",
  foodCompatibility: "bg-amber-500",
  communication: "bg-violet-500",
  values: "bg-primary",
};

export function MatchDetails({ match, onClose }: MatchDetailsProps) {
  const [, setLocation] = useLocation();

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Panel */}
        <motion.div
          className="relative w-full max-w-md bg-background rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", bounce: 0.2 }}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 w-8 h-8 bg-muted rounded-full flex items-center justify-center hover:bg-muted/80"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header */}
          <div className="bg-gradient-to-br from-primary/20 to-purple-900/20 px-6 pt-6 pb-4">
            <div className="flex items-center gap-4">
              <Avatar className="w-20 h-20 border-3 border-primary/30 shadow-lg">
                <AvatarImage src={match.image} alt={match.name} />
                <AvatarFallback className="text-2xl font-bold bg-primary/20 text-primary">
                  {match.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-foreground">
                  {match.name}{match.age ? `, ${match.age}` : ""}
                </h2>
                {match.emphasis && (
                  <p className="text-sm text-primary mt-0.5">{match.emphasis}</p>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <Badge className="bg-primary/20 text-primary border-primary/30 font-bold">
                    <Sparkles className="w-3 h-3 mr-1" />
                    {match.compatibility}% Match
                  </Badge>
                  {match.mutualCompatibility && (
                    <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">
                      {match.mutualCompatibility}% Mutual
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="px-6 py-4 space-y-5">
            {/* Bio */}
            {match.bio && (
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-1.5">About</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{match.bio}</p>
              </div>
            )}

            {/* Why you match */}
            {match.reasons && match.reasons.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2">Why You Match</h3>
                <div className="space-y-1.5">
                  {match.reasons.map((reason, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>{reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Category scores */}
            {match.categories && (
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3">Compatibility Breakdown</h3>
                <div className="space-y-3">
                  {Object.entries(match.categories).map(([key, cat]) => (
                    <div key={key}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-muted-foreground font-medium">{CATEGORY_LABELS[key] || key}</span>
                        <span className="font-bold text-foreground">{cat.score * 10}%</span>
                      </div>
                      <Progress
                        value={cat.score * 10}
                        className="h-1.5"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Attribute matches */}
            {match.attributeMatches && (
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2">Compatibility Details</h3>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(match.attributeMatches).map(([key, attr]) => (
                    <div
                      key={key}
                      className={`flex items-center gap-2 p-2 rounded-lg text-xs ${
                        attr.match ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${attr.match ? "bg-primary" : "bg-muted-foreground"}`} />
                      <span className="capitalize font-medium">{key}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="px-6 pb-6 pt-2 flex gap-3">
            <Button
              variant="outline"
              className="flex-1 rounded-full"
              onClick={onClose}
            >
              <X className="w-4 h-4 mr-2" />
              Close
            </Button>
            <Button
              className="flex-1 rounded-full glow-primary"
              onClick={() => {
                onClose();
                setLocation(`/profile/${match.id}`);
              }}
            >
              <Heart className="w-4 h-4 mr-2" />
              View Profile
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
