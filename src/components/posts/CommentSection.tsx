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
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const { toast } = useToast();

  const mockMode = isFeedMockMode();

  const { data: comments = [], isLoading } = useQuery<PostCommentRow[]>({
    queryKey: [...postCommentsQueryKey(postId), currentUserId || "anon"],
    queryFn: () => fetchPostComments(postId, currentUserId),
  });

  const rootComments = useMemo(() => {
    return comments.filter((c) => !c.replyToCommentId);
  }, [comments]);

  const repliesByParent = useMemo(() => {
    const m = new Map<string, PostCommentRow[]>();
    for (const c of comments) {
      const parent = c.replyToCommentId?.trim();
      if (!parent) continue;
      const arr = m.get(parent) || [];
      arr.push(c);
      m.set(parent, arr);
    }
    return m;
  }, [comments]);

  const visibleComments = useMemo(() => {
    if (expandList) return rootComments;
    if (rootComments.length > 0) return [rootComments[0]];
    if (isLoading && previewComment) return [normalizePreview(previewComment)];
    return [];
  }, [expandList, rootComments, isLoading, previewComment]);

  const sendMutation = useMutation({
    mutationFn: async ({ content, replyToCommentId }: { content: string; replyToCommentId?: string | null }) => {
      if (!currentUserId) throw new Error("Not signed in");
      if (isFeedMockMode()) {
        const rows = readMockComments(postId);
        const row: PostCommentRow = {
          id: crypto.randomUUID(),
          userId: currentUserId,
          content,
          replyToCommentId: replyToCommentId || null,
          createdAt: new Date().toISOString(),
          user: { name: storedUserDisplayName(), avatar: null },
          likes: 0,
          likedByMe: false,
        };
        rows.push(row);
        writeMockComments(postId, rows);
        return row;
      }
      const res = await apiRequest("POST", `/api/comments`, {
        userId: currentUserId,
        postId,
        content,
        ...(replyToCommentId ? { replyToCommentId } : {}),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["post-comments", postId] });
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      setComment("");
      setReplyToId(null);
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

  const likeCommentMutation = useMutation({
    mutationFn: async ({ commentId, like }: { commentId: string; like: boolean }) => {
      if (!currentUserId) throw new Error("Not signed in");
      if (isFeedMockMode()) {
        const rows = readMockComments(postId).map((r) => {
          if (r.id !== commentId) return r;
          const cur = Number(r.likes || 0);
          return {
            ...r,
            likedByMe: like,
            likes: like ? cur + (r.likedByMe ? 0 : 1) : Math.max(0, cur - (r.likedByMe ? 1 : 0)),
          };
        });
        writeMockComments(postId, rows);
        return;
      }
      if (like) {
        await apiRequest("POST", `/api/comments/${commentId}/like`, { userId: currentUserId });
      } else {
        await apiRequest(
          "DELETE",
          `/api/comments/${commentId}/like/${encodeURIComponent(currentUserId)}`,
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...postCommentsQueryKey(postId)] });
    },
    onError: () =>
      toast({ title: "Could not update comment like", variant: "destructive" }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (comment.trim() && currentUserId) {
      sendMutation.mutate({ content: comment.trim(), replyToCommentId: replyToId });
    }
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
                      className={`flex items-center gap-1 text-[10px] ${
                        c.likedByMe
                          ? "text-[#722F37] hover:text-[#652a31]"
                          : "text-muted-foreground hover:text-primary"
                      }`}
                      onClick={() =>
                        likeCommentMutation.mutate({
                          commentId: c.id,
                          like: !Boolean(c.likedByMe),
                        })
                      }
                    >
                      <Heart className={c.likedByMe ? "w-3 h-3 fill-current" : "w-3 h-3"} />
                      {c.likes || 0}
                    </button>
                    <button
                      type="button"
                      className="text-[10px] text-muted-foreground hover:text-foreground"
                      onClick={() => setReplyToId(c.id)}
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
                  {expandList && (repliesByParent.get(c.id) || []).length > 0 ? (
                    <div className="mt-2 space-y-2 border-l border-border/70 pl-3">
                      {(repliesByParent.get(c.id) || []).map((r) => (
                        <div key={r.id} className="rounded-xl bg-background/70 px-2 py-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] font-semibold text-foreground">
                              {r.user?.name?.trim() || "Member"}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(r.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                          <p className="mt-0.5 text-xs text-foreground">{r.content}</p>
                          <div className="mt-1 flex items-center gap-2">
                            <button
                              type="button"
                              className={`flex items-center gap-1 text-[10px] ${
                                r.likedByMe
                                  ? "text-[#722F37] hover:text-[#652a31]"
                                  : "text-muted-foreground hover:text-primary"
                              }`}
                              onClick={() =>
                                likeCommentMutation.mutate({
                                  commentId: r.id,
                                  like: !Boolean(r.likedByMe),
                                })
                              }
                            >
                              <Heart className={r.likedByMe ? "w-3 h-3 fill-current" : "w-3 h-3"} />
                              {r.likes || 0}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}
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
      {replyToId ? (
        <div className="flex items-center justify-between rounded-lg border border-border/70 bg-muted/30 px-2.5 py-1.5 text-[11px]">
          <span className="text-muted-foreground">Replying to comment</span>
          <button
            type="button"
            className="text-primary hover:underline"
            onClick={() => setReplyToId(null)}
          >
            Cancel
          </button>
        </div>
      ) : null}

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
