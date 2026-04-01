import { FileText, Calendar, MessageCircle, Heart, Bell, LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { MatchifyMascot, NoMatchesMascot, SearchingMascot, CelebrationMascot } from "./MascotIllustrations";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
  useMascot?: boolean;
  mascotType?: "default" | "searching" | "celebration" | "no-matches";
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
  useMascot = false,
  mascotType = "default",
}: EmptyStateProps) {
  const renderMascot = () => {
    switch (mascotType) {
      case "searching":
        return <SearchingMascot className="w-32 h-32 sm:w-48 sm:h-48" />;
      case "celebration":
        return <CelebrationMascot className="w-32 h-32 sm:w-48 sm:h-48" />;
      case "no-matches":
        return <NoMatchesMascot className="w-32 h-32 sm:w-48 sm:h-48" />;
      default:
        return <MatchifyMascot className="w-32 h-32 sm:w-48 sm:h-48" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className={cn("matchify-surface p-8 sm:p-12 text-center", className)}>
        <div className="flex flex-col items-center justify-center gap-6 sm:gap-8">
          {useMascot ? (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: "spring", bounce: 0.4 }}
              className="flex items-center justify-center rounded-[2rem] bg-primary/10 px-6 py-5 ring-1 ring-primary/15 shadow-2xs"
            >
              {renderMascot()}
            </motion.div>
          ) : Icon ? (
            <motion.div
              className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", bounce: 0.5 }}
            >
              <Icon className="w-10 h-10 text-primary" />
            </motion.div>
          ) : null}
          <motion.div
            className="space-y-3 sm:space-y-4 flex flex-col items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <h3 className="text-xl sm:text-2xl font-semibold text-foreground text-center">{title}</h3>
            <p className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto text-center leading-relaxed">{description}</p>
          </motion.div>
          {actionLabel && onAction && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="w-full sm:w-auto"
            >
              <Button
                onClick={onAction}
                className="w-full sm:w-auto min-w-[200px]"
              >
                {actionLabel}
              </Button>
            </motion.div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}

// Predefined empty states
export function EmptyPosts({ onCreatePost }: { onCreatePost?: () => void }) {
  return (
    <EmptyState
      icon={FileText}
      title="No posts yet"
      description="Be the first to share something with the community!"
      actionLabel="Create Post"
      onAction={onCreatePost}
    />
  );
}

export function EmptyEvents() {
  return (
    <EmptyState
      useMascot={true}
      mascotType="default"
      title="No events found"
      description="Check back later for upcoming events or create your own!"
    />
  );
}

export function EmptyChats() {
  return (
    <EmptyState
      useMascot={true}
      mascotType="default"
      title="No conversations yet"
      description="Start matching with people to begin meaningful conversations!"
    />
  );
}

export function EmptyMatches() {
  return (
    <EmptyState
      useMascot={true}
      mascotType="no-matches"
      title="No matches yet"
      description="Finish AI Matchmaker to see quality matches based on your values and priorities!"
    />
  );
}

export function EmptyNotifications() {
  return (
    <EmptyState
      useMascot={true}
      mascotType="celebration"
      title="All caught up!"
      description="You don't have any new notifications. Great job staying on top of things!"
    />
  );
}

