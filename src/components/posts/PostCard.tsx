import { useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, CheckCircle, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PostActions } from "./PostActions";
import { CommentSection } from "./CommentSection";
import { useCurrentUser } from "@/contexts/UserContext";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface PostCardProps {
  id: string;
  authorId?: string;
  author: {
    name: string;
    image?: string;
    verified?: boolean;
  };
  content: string;
  image?: string;
  likes: number;
  comments: number;
  timestamp: string;
  category?: string;
  topComment?: { author: string; content: string } | null;
  onLike?: (id: string) => void;
  onShare?: (id: string) => void;
  onDeleted?: (id: string) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  'All things marriage': 'bg-rose-100 text-rose-600',
  'Fitness': 'bg-primary/10 text-primary',
  'Faith': 'bg-amber-100 text-amber-600',
  'Career': 'bg-blue-100 text-blue-600',
  'Travel': 'bg-sky-100 text-sky-600',
  'Random': 'bg-violet-100 text-violet-600',
  'Advice': 'bg-orange-100 text-orange-600',
  'Food': 'bg-yellow-100 text-yellow-600',
};

export default function PostCard({
  id,
  authorId,
  author,
  content,
  image,
  likes,
  comments,
  timestamp,
  category,
  topComment,
  onLike,
  onShare,
  onDeleted,
}: PostCardProps) {
  const { userId: currentUserId } = useCurrentUser();
  const { toast } = useToast();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(likes);
  const [showComments, setShowComments] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [viewCount, setViewCount] = useState(0);
  const viewKey = `post_views_${id}`;
  const sessionKey = `post_viewed_session_${id}`;
  const isOwner = !!currentUserId && !!authorId && currentUserId === authorId;

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/posts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      setDeleted(true);
      onDeleted?.(id);
      toast({ title: "Post deleted" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete post", variant: "destructive" });
    },
  });

  const handleLike = () => {
    setLiked(!liked);
    setLikeCount(prev => liked ? prev - 1 : prev + 1);
    onLike?.(id);
  };

  useEffect(() => {
    const saved = Number(localStorage.getItem(viewKey) || "0");
    setViewCount(Number.isFinite(saved) ? saved : 0);
  }, [viewKey]);

  useEffect(() => {
    if (!cardRef.current) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting || entry.intersectionRatio < 0.5) return;
        if (sessionStorage.getItem(sessionKey) === "1") return;

        setViewCount((prev) => {
          const next = prev + 1;
          localStorage.setItem(viewKey, String(next));
          sessionStorage.setItem(sessionKey, "1");
          return next;
        });
      },
      { threshold: [0.5] }
    );

    observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, [sessionKey, viewKey]);

  const categoryColor = category ? (CATEGORY_COLORS[category] || 'bg-gray-100 text-gray-600') : null;
  if (deleted) return null;

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
      data-testid={`post-card-${id}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10">
            <AvatarImage src={author.image} alt={author.name} />
            <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
              {author.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-gray-900">{author.name}</span>
              {author.verified && (
                <CheckCircle className="w-3.5 h-3.5 text-primary fill-primary/20" />
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">{timestamp}</span>
              {category && categoryColor && (
                <Badge className={`text-[10px] px-1.5 py-0 h-4 ${categoryColor} border-0`}>
                  {category}
                </Badge>
              )}
            </div>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full">
              <MoreHorizontal className="w-4 h-4 text-gray-400" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {isOwner ? (
              <>
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => setConfirmDelete(true)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete post
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            ) : null}
            <DropdownMenuItem>Report post</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Content */}
      <div className="px-4 pb-3">
        <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{content}</p>
      </div>

      {/* Image */}
      {image && (
        <div className="mx-4 mb-3 rounded-xl overflow-hidden">
          <img
            src={image}
            alt="Post"
            className="w-full h-auto max-h-72 object-cover"
            loading="lazy"
          />
        </div>
      )}

      {topComment?.content ? (
        <div className="px-4 pb-2">
          <div className="rounded-xl bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">{topComment.author}: </span>
            <span>{topComment.content}</span>
          </div>
        </div>
      ) : null}

      <div className="px-3 pb-3 pt-2 border-t border-gray-50">
        <PostActions
          isLiked={liked}
          likes={likeCount}
          comments={comments}
          viewCount={viewCount}
          onLike={handleLike}
          onComment={() => setShowComments((prev) => !prev)}
          onShare={() => onShare?.(id)}
        />
      </div>

      <AnimatePresence initial={false}>
        {showComments ? (
          <motion.div
            key="comments"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="px-4 pb-4 overflow-hidden"
          >
            <CommentSection postId={id} currentUserId={currentUserId ?? undefined} />
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this post?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground"
              onClick={() => deleteMutation.mutate()}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
