import { useState } from "react";
import { Heart, MessageCircle, Share2, BarChart2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface PostActionsProps {
  isLiked: boolean;
  likes: number;
  comments: number;
  viewCount?: number;
  onLike: () => void;
  onComment: () => void;
  onShare?: () => void;
}

export function PostActions({
  isLiked,
  likes,
  comments,
  viewCount = 0,
  onLike,
  onComment,
  onShare,
}: PostActionsProps) {
  const formatCount = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n);

  return (
    <div className="flex items-center gap-1 sm:gap-2 pt-2">
      <motion.div whileTap={{ scale: 0.9 }}>
        <Button
          variant="ghost"
          className={`group h-9 gap-1.5 rounded-full bg-transparent text-muted-foreground transition hover:bg-muted/60 hover:text-foreground ${isLiked ? "text-primary hover:bg-primary/10 hover:text-primary" : ""}`}
          onClick={onLike}
        >
          <motion.div animate={{ scale: isLiked ? [1, 1.3, 1] : 1 }} transition={{ duration: 0.3 }}>
            <Heart
              className={`w-4 h-4 sm:w-5 sm:h-5 transition ${
                isLiked ? "fill-current" : "fill-transparent group-hover:fill-current"
              }`}
              strokeWidth={1.75}
            />
          </motion.div>
          <span className="font-medium text-xs sm:text-sm">{formatCount(likes)}</span>
        </Button>
      </motion.div>

      <motion.div whileTap={{ scale: 0.9 }}>
        <Button
          variant="ghost"
          className="group h-9 gap-1.5 rounded-full bg-transparent text-muted-foreground transition hover:bg-muted/60 hover:text-foreground"
          onClick={onComment}
        >
          <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={1.75} />
          <span className="font-medium text-xs sm:text-sm">{formatCount(comments)}</span>
        </Button>
      </motion.div>

      <motion.div whileTap={{ scale: 0.9 }}>
        <Button
          variant="ghost"
          className="group h-9 gap-1.5 rounded-full bg-transparent text-muted-foreground transition hover:bg-muted/60 hover:text-foreground"
          onClick={onShare || (() => {})}
        >
          <Share2 className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={1.75} />
          <span className="font-medium text-xs sm:text-sm hidden sm:inline">Share</span>
        </Button>
      </motion.div>

      <div className="ml-auto flex items-center gap-1 text-muted-foreground">
        <BarChart2 className="w-3.5 h-3.5" />
        <span className="text-xs">{formatCount(viewCount)}</span>
      </div>
    </div>
  );
}
