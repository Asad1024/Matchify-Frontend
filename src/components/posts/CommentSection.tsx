import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Heart, Trash2, Smile } from "lucide-react";
import EmojiPicker, { Theme, type EmojiClickData } from "emoji-picker-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { motion, AnimatePresence } from "framer-motion";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isFeedMockMode } from "@/lib/feedMockMode";
import {
  readMockComments,
  writeMockComments,
  storedUserDisplayName,
  postCommentsQueryKey,
  fetchPostComments,
  type PostCommentRow,
} from "@/lib/postCommentsApi";
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

function normalizePreview(c: {
  id: string;
  userId: string;
  content: string;
  createdAt: string | Date | unknown;
  user?: { name?: string; avatar?: string | null } | null;
}): PostCommentRow {
  const createdAt =
    typeof c.createdAt === "string"
      ? c.createdAt
      : c.createdAt instanceof Date
        ? c.createdAt.toISOString()
        : new Date(String(c.createdAt)).toISOString();
  return {
    id: c.id,
    userId: c.userId,
    content: c.content,
    createdAt,
    user: c.user,
  };
}

interface CommentSectionProps {
  postId: string;
  currentUserId?: string;
  onCommentCountDelta?: (delta: number) => void;
  /** Full list (icon opened). When false, show first comment + composer only. */
  expandList: boolean;
  /** From feed API for instant first line while comments query loads */
  previewComment?: PostCommentRow | null;
}

export function CommentSection({
  postId,
  currentUserId,
  onCommentCountDelta,
  expandList,
  previewComment,
}: CommentSectionProps) {
  const [comment, setComment] = useState("");
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { toast } = useToast();

  const mockMode = isFeedMockMode();

  const { data: comments = [], isLoading } = useQuery<PostCommentRow[]>({
    queryKey: postCommentsQueryKey(postId),
    queryFn: () => fetchPostComments(postId),
  });

  const visibleComments = useMemo(() => {
    if (expandList) return comments;
    if (comments.length > 0) return [comments[0]];
    if (isLoading && previewComment) return [normalizePreview(previewComment)];
    return [];
  }, [expandList, comments, isLoading, previewComment]);

  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!currentUserId) throw new Error("Not signed in");
      if (isFeedMockMode()) {
        const rows = readMockComments(postId);
        const row: PostCommentRow = {
          id: crypto.randomUUID(),
          userId: currentUserId,
          content,
          createdAt: new Date().toISOString(),
          user: { name: storedUserDisplayName(), avatar: null },
        };
        rows.push(row);
        writeMockComments(postId, rows);
        return row;
      }
      const res = await apiRequest("POST", `/api/comments`, {
        userId: currentUserId,
        postId,
        content,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["post-comments", postId] });
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      setComment("");
      if (isFeedMockMode()) onCommentCountDelta?.(1);
      else toast({ title: "Comment posted" });
    },
    onError: (err) => {
      const msg = err instanceof Error ? err.message : "";
      const isMissingPost = /404|not found/i.test(msg);
      toast({
        title: "Could not post comment",
        description: isMissingPost
          ? "This post is not on the server. Check that the API is running and refresh the feed."
          : "Check your connection and try again.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (commentId: string) => {
      if (isFeedMockMode()) {
        const rows = readMockComments(postId).filter((c) => c.id !== commentId);
        writeMockComments(postId, rows);
        return;
      }
      await apiRequest("DELETE", `/api/comments/${commentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["post-comments", postId] });
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      if (isFeedMockMode()) onCommentCountDelta?.(-1);
      toast({ title: "Comment deleted" });
    },
    onError: () =>
      toast({ title: "Error", description: "Failed to delete comment", variant: "destructive" }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (comment.trim() && currentUserId) sendMutation.mutate(comment.trim());
  };

  const showListLoading = expandList && isLoading && comments.length === 0;

  return (
    <div className="space-y-3">
      {mockMode ? (
        <p className="text-[11px] text-amber-800/90 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5">
          Offline preview: comments are saved in this browser only until the API is available.
        </p>
      ) : null}
      {showListLoading ? (
        <div className="space-y-2">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex gap-2 animate-pulse">
              <div className="w-7 h-7 rounded-full bg-muted flex-shrink-0" />
              <div className="flex-1 space-y-1">
                <div className="h-3 bg-muted rounded w-1/4" />
                <div className="h-3 bg-muted rounded w-3/4" />
              </div>
            </div>
          ))}
        </div>
      ) : visibleComments.length > 0 ? (
        <AnimatePresence>
          {visibleComments.map((c) => {
            const displayName = c.user?.name?.trim() || "Member";
            const avatarUrl = c.user?.avatar || undefined;
            const initials = displayName.slice(0, 2).toUpperCase();
            return (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="flex gap-2"
              >
                <Avatar className="w-7 h-7 flex-shrink-0">
                  <AvatarImage src={avatarUrl} alt="" />
                  <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 bg-muted/50 rounded-2xl px-3 py-2">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-semibold text-foreground">{displayName}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(c.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="text-xs text-foreground mt-0.5">{c.content}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <button
                      type="button"
                      className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary"
                    >
                      <Heart className="w-3 h-3" />
                      {c.likes || 0}
                    </button>
                    <button
                      type="button"
                      className="text-[10px] text-muted-foreground hover:text-foreground"
                    >
                      Reply
                    </button>
                    {currentUserId && c.userId === currentUserId && (
                      <button
                        type="button"
                        className="text-[10px] text-muted-foreground hover:text-destructive ml-auto"
                        onClick={() => setDeleteId(c.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      ) : expandList ? (
        <p className="text-xs text-muted-foreground text-center py-2">No comments yet. Be the first!</p>
      ) : null}

      {currentUserId && (
        <form onSubmit={handleSubmit} className="flex gap-2 pt-1 items-center">
          <Input
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Write a comment…"
            className="flex-1 h-9 text-sm"
          />
          <Popover open={emojiOpen} onOpenChange={setEmojiOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-9 w-9 flex-shrink-0 border-border"
                aria-label="Open emoji picker"
              >
                <Smile className="w-4 h-4 text-muted-foreground" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto p-0 border-border shadow-lg"
              align="end"
              side="top"
              sideOffset={8}
              collisionPadding={16}
            >
              <EmojiPicker
                theme={Theme.LIGHT}
                lazyLoadEmojis
                width={320}
                height={380}
                searchPlaceHolder="Search emojis"
                onEmojiClick={(emojiData: EmojiClickData) => {
                  setComment((prev) => prev + emojiData.emoji);
                }}
              />
            </PopoverContent>
          </Popover>
          <Button
            type="submit"
            size="icon"
            className="h-9 w-9 flex-shrink-0"
            disabled={!comment.trim() || sendMutation.isPending}
          >
            <Send className="w-3.5 h-3.5" />
          </Button>
        </form>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete comment?</AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground"
              onClick={() => {
                if (deleteId) {
                  deleteMutation.mutate(deleteId);
                  setDeleteId(null);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
