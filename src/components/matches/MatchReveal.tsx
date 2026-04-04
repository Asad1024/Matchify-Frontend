import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Heart, X, MessageCircle, User } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useCurrentUser } from "@/contexts/UserContext";
import { useUpgrade } from "@/contexts/UpgradeContext";
import { requestChatWithUser } from "@/lib/requestChatWithUser";

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
  /** Marks match revealed + navigate to chat (parent supplies this from Directory). */
  onMessage?: (matchedUserId: string) => void;
}

export default function MatchReveal({ match, onClose, onMessage }: MatchRevealProps) {
  const [revealed, setRevealed] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { userId } = useCurrentUser();
  const { openUpgrade } = useUpgrade();

  const handleReveal = () => setRevealed(true);

  const handleMessage = () => {
    if (onMessage) {
      onMessage(match.user.id);
    } else {
      void requestChatWithUser({
        fromUserId: userId,
        toUserId: match.user.id,
        setLocation,
        toast,
        openUpgrade,
      });
    }
  };

  const handleViewProfile = () => {
    onClose();
    setLocation(`/profile/${match.user.id}`);
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        />

        <motion.div
          className="relative z-10 mx-4 w-full max-w-sm overflow-hidden overflow-y-auto rounded-3xl border border-border/70 bg-background shadow-xl max-h-[90vh]"
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.92, opacity: 0 }}
          transition={{ type: "spring", bounce: 0.3 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="h-1 bg-gradient-to-r from-primary via-red-900/80 to-red-950" />

          <div className="flex items-center justify-end px-4 pt-4 pb-1">
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="px-6 pb-6 pt-2 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", bounce: 0.5, delay: 0.1 }}
              className="mb-4"
            >
              <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-primary/20">
                <Heart className="h-8 w-8 fill-primary/50 text-primary" />
              </div>
              <h2 className="text-xl font-bold text-foreground">New match</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {revealed ? "Say hi when you’re ready." : "Reveal to see who it is."}
              </p>
            </motion.div>

            <div className="mb-6">
              {!revealed ? (
                <motion.button
                  type="button"
                  className="mx-auto flex h-28 w-28 cursor-pointer flex-col items-center justify-center rounded-full border-4 border-primary/20 bg-gradient-to-br from-primary/30 to-purple-500/30"
                  onClick={handleReveal}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Sparkles className="mx-auto mb-1 h-8 w-8 text-primary" />
                  <span className="text-xs font-semibold text-primary">Tap to reveal</span>
                </motion.button>
              ) : (
                <motion.div
                  initial={{ scale: 0, rotateY: 90 }}
                  animate={{ scale: 1, rotateY: 0 }}
                  transition={{ type: "spring", bounce: 0.4 }}
                >
                  <Avatar className="mx-auto h-28 w-28 border-4 border-primary shadow-lg">
                    <AvatarImage src={match.user.avatar || undefined} alt={match.user.name} />
                    <AvatarFallback className="bg-primary/20 text-3xl font-bold text-primary">
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
                className="mb-6 space-y-2"
              >
                <h3 className="text-lg font-bold text-foreground">
                  {match.user.name}
                  {match.user.age ? `, ${match.user.age}` : ""}
                </h3>
                {match.user.location ? (
                  <p className="text-sm text-muted-foreground">{match.user.location}</p>
                ) : null}
                <Badge className="border-primary/30 bg-primary/20 text-primary">
                  <Sparkles className="mr-1 h-3 w-3" />
                  {match.compatibility}% compatibility
                </Badge>
              </motion.div>
            )}

            {!revealed ? (
              <Button type="button" className="w-full rounded-full" onClick={handleReveal}>
                <Sparkles className="mr-2 h-4 w-4" />
                Reveal
              </Button>
            ) : (
              <div className="flex flex-col gap-2">
                <Button type="button" className="w-full rounded-full font-semibold" onClick={handleMessage}>
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Message
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full rounded-full border-primary/25"
                  onClick={handleViewProfile}
                >
                  <User className="mr-2 h-4 w-4" />
                  View profile
                </Button>
                <Button type="button" variant="ghost" className="w-full text-muted-foreground" onClick={onClose}>
                  Not now
                </Button>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
