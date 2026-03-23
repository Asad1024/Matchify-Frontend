import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Heart, X, MessageCircle, ChevronLeft, User } from "lucide-react";
import { useLocation } from "wouter";
import PostMatchGuidance from "@/components/matches/PostMatchGuidance";

interface UnrevealedMatch {
  id: string;
  user: {
    id: string;
    name: string;
    age?: number | null;
    avatar?: string | null;
    location?: string | null;
    bio?: string | null;
  };
  compatibility: number;
}

interface MatchRevealProps {
  match: UnrevealedMatch;
  onClose: () => void;
  onAccept?: (matchId: string) => void;
  onDecline?: (matchId: string) => void;
  /** Parent can close modal + mark revealed; defaults to navigating to chat */
  onMessage?: (matchedUserId: string) => void;
}

type Step = 'reveal' | 'guidance';

export default function MatchReveal({
  match,
  onClose,
  onAccept,
  onDecline,
  onMessage,
}: MatchRevealProps) {
  const [revealed, setRevealed] = useState(false);
  const [step, setStep] = useState<Step>('reveal');
  const [, setLocation] = useLocation();

  const handleReveal = () => setRevealed(true);

  const handleAccept = () => {
    onAccept?.(match.id);
    setStep('guidance');
  };

  const handleDecline = () => {
    onDecline?.(match.id);
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={step === 'reveal' ? onClose : undefined}
        />

        {/* Card */}
        <motion.div
          key={step}
          className="relative w-full max-w-sm mx-4 bg-background rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto"
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.92, opacity: 0 }}
          transition={{ type: "spring", bounce: 0.3 }}
        >
          {/* Header glow */}
          <div className="h-1 bg-gradient-to-r from-primary via-purple-500 to-pink-500" />

          {/* Top bar */}
          <div className="flex items-center justify-between px-4 pt-4 pb-1">
            {step === 'guidance' ? (
              <button
                onClick={() => setStep('reveal')}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
            ) : (
              <div />
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 bg-muted rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {step === 'reveal' ? (
            <div className="p-6 pt-2 text-center">
              {/* Match notification */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", bounce: 0.5, delay: 0.2 }}
                className="mb-4"
              >
                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Heart className="w-8 h-8 text-primary fill-primary/50" />
                </div>
                <h2 className="text-xl font-black text-foreground">New Match!</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Someone likes you. Reveal to see who!
                </p>
              </motion.div>

              {/* Profile reveal */}
              <div className="mb-6">
                {!revealed ? (
                  <motion.div
                    className="w-28 h-28 mx-auto rounded-full bg-gradient-to-br from-primary/30 to-purple-500/30 flex items-center justify-center border-4 border-primary/20 cursor-pointer"
                    onClick={handleReveal}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div className="text-center">
                      <Sparkles className="w-8 h-8 text-primary mx-auto mb-1" />
                      <span className="text-xs font-bold text-primary">Tap to reveal</span>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ scale: 0, rotateY: 90 }}
                    animate={{ scale: 1, rotateY: 0 }}
                    transition={{ type: "spring", bounce: 0.4 }}
                  >
                    <Avatar className="w-28 h-28 mx-auto border-4 border-primary shadow-lg">
                      <AvatarImage src={match.user.avatar || undefined} alt={match.user.name} />
                      <AvatarFallback className="text-3xl font-bold bg-primary/20 text-primary">
                        {match.user.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </motion.div>
                )}
              </div>

              {revealed && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6"
                >
                  <h3 className="text-lg font-bold text-foreground">
                    {match.user.name}
                    {match.user.age ? `, ${match.user.age}` : ""}
                  </h3>
                  {match.user.location && (
                    <p className="text-sm text-muted-foreground mt-0.5">{match.user.location}</p>
                  )}
                  <Badge className="mt-2 bg-primary/20 text-primary border-primary/30">
                    <Sparkles className="w-3 h-3 mr-1" />
                    {match.compatibility}% Compatibility
                  </Badge>
                </motion.div>
              )}

              {/* Action buttons */}
              {revealed ? (
                <div className="space-y-2">
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="flex-1 rounded-full border-rose-200 text-rose-500 hover:bg-rose-50"
                      onClick={handleDecline}
                    >
                      <X className="w-4 h-4 mr-1.5" />
                      Pass
                    </Button>
                    <Button
                      className="flex-1 rounded-full"
                      onClick={handleAccept}
                    >
                      <Heart className="w-4 h-4 mr-1.5 fill-current" />
                      Connect
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1 text-xs text-muted-foreground"
                      onClick={() => setLocation(`/profile/${match.user.id}`)}
                    >
                      <User className="w-3.5 h-3.5 mr-1" />
                      View Profile
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1 text-xs text-muted-foreground"
                      onClick={() => {
                        if (onMessage) {
                          onMessage(match.user.id);
                        } else {
                          setLocation(`/chat?user=${match.user.id}`);
                        }
                      }}
                    >
                      <MessageCircle className="w-3.5 h-3.5 mr-1" />
                      Message
                    </Button>
                  </div>
                </div>
              ) : (
                <Button className="w-full rounded-full" onClick={handleReveal}>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Reveal Match
                </Button>
              )}
            </div>
          ) : (
            <div className="p-5 pt-2">
              <PostMatchGuidance
                match={{
                  id: match.id,
                  name: match.user.name,
                  compatibility: match.compatibility,
                }}
                onMessageSent={() => setLocation(`/chat?user=${match.user.id}`)}
              />
              <Button className="w-full mt-4 rounded-full" onClick={onClose}>
                Done
              </Button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
