import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Heart, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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

interface Comment {
  id: string;
  userId: string;
  content: string;
  createdAt: string;
  /** Backend may omit nested user; normalize in render */
  user?: { name?: string; avatar?: string | null } | null;
  likes?: number;
}

interface CommentSectionProps {
  postId: string;
  currentUserId?: string;
}

export function CommentSection({ postId, currentUserId }: CommentSectionProps) {
  const [comment, setComment] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: comments = [], isLoading } = useQuery<Comment[]>({
    queryKey: [`/api/posts/${postId}/comments`],
  });

  const sendMutation = useMutation({
    mutationFn: (content: string) =>
      apiRequest("POST", `/api/comments`, { userId: currentUserId, postId, content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/posts/${postId}/comments`] });
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      setComment("");
    },
    onError: () => toast({ title: "Error", description: "Failed to post comment", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (commentId: string) => apiRequest("DELETE", `/api/comments/${commentId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/posts/${postId}/comments`] });
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      toast({ title: "Comment deleted" });
    },
    onError: () => toast({ title: "Error", description: "Failed to delete comment", variant: "destructive" }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (comment.trim() && currentUserId) sendMutation.mutate(comment.trim());
  };

  return (
    <div className="space-y-3">
      {isLoading ? (
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
      ) : comments.length > 0 ? (
        <AnimatePresence>
          {comments.map((c) => {
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
                    {new Date(c.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <p className="text-xs text-foreground mt-0.5">{c.content}</p>
                <div className="flex items-center gap-2 mt-1">
                  <button className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-rose-500">
                    <Heart className="w-3 h-3" />
                    {c.likes || 0}
                  </button>
                  <button className="text-[10px] text-muted-foreground hover:text-foreground">Reply</button>
                  {currentUserId && c.userId === currentUserId && (
                    <button
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
      ) : (
        <p className="text-xs text-muted-foreground text-center py-2">No comments yet. Be the first!</p>
      )}

      {currentUserId && (
        <form onSubmit={handleSubmit} className="flex gap-2 pt-1">
          <Input
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Write a comment…"
            className="flex-1 h-9 text-sm"
          />
          <Button type="submit" size="icon" className="h-9 w-9 flex-shrink-0" disabled={!comment.trim() || sendMutation.isPending}>
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
              onClick={() => { if (deleteId) { deleteMutation.mutate(deleteId); setDeleteId(null); } }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
