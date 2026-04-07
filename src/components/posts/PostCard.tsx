import { useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MoreHorizontal,
  X,
  Trash2,
  Pencil,
  Share2,
  Bookmark,
  UserPlus,
  UserMinus,
  VolumeX,
  Volume2,
  Ban,
  Flag,
  Globe2,
  Lock,
} from "lucide-react";
import { VerifiedTick } from "@/components/common/VerifiedTick";
import { motion } from "framer-motion";
import { Link, useLocation } from "wouter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PostActions } from "./PostActions";
import { CommentSection } from "./CommentSection";
import { SharePostDialog } from "./SharePostDialog";
import type { PostCommentRow } from "@/lib/postCommentsApi";
import { useCurrentUser } from "@/contexts/UserContext";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { apiRequestJson } from "@/services/api";
import { BlockReportDialog } from "@/components/common/BlockReportDialog";
import { addPostReport, setAuthorMuted } from "@/lib/socialPreferencesService";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
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
import { formatPostRelativeTime } from "@/lib/formatPostTime";
import { cn } from "@/lib/utils";
import type { SocialSummary } from "@/lib/socialPreferencesService";

function patchViewerFollowingInCache(viewerId: string, targetAuthorId: string, following: boolean) {
  queryClient.setQueryData<SocialSummary>(["/api/users", viewerId, "social-summary"], (old) => {
    if (!old) return old;
    const set = new Set(old.followingIds ?? []);
    if (following) set.add(targetAuthorId);
    else set.delete(targetAuthorId);
    return {
      ...old,
      followingIds: Array.from(set),
      followingCount: set.size,
    };
  });
}

interface PostCardProps {
  id: string;
  authorId?: string;
  author: {
    name: string;
    /** Avatar URL; API often sends `avatar` — `image` kept for older mocks */
    image?: string;
    avatar?: string | null;
    verified?: boolean;
  };
  content: string;
  image?: string;
  likes: number;
  comments: number;
  timestamp: string;
  /** ISO (or parseable) date — when set, shows short relative time (“1 min”, “1 day”) instead of `timestamp`. */
  postedAt?: string | null;
  category?: string;
  /** Server: whether the current user already liked this post */
  likedByMe?: boolean;
  /** Post visibility mode. */
  visibility?: "public" | "private";
  /** Oldest comment from feed for first-line preview */
  firstComment?: PostCommentRow | null;
  onLikeToggle?: (postId: string, nowLiked: boolean) => void;
  onShare?: (id: string) => void;
  onDeleted?: (id: string) => void;
  /** Group context — name links to group page */
  groupId?: string | null;
  groupName?: string | null;
  /** From feed annotation (IndexedDB / API). */
  savedByMe?: boolean;
  /** Whether viewer follows the post author. */
  isFollowingAuthor?: boolean;
  /** When set, tapping the text + image opens this route (e.g. full post view). */
  detailHref?: string | null;
}

const POST_REPORT_REASONS = [
  "Spam or misleading",
  "Harassment or hate",
  "Violence or safety risk",
  "Sexual content",
  "Other",
];

const CATEGORY_COLORS: Record<string, string> = {
  Fitness: "bg-primary/10 text-primary",
  Faith:
    "bg-amber-100 text-amber-600 dark:bg-amber-950/55 dark:text-amber-200",
  Career: "bg-blue-100 text-blue-600 dark:bg-blue-950/55 dark:text-blue-200",
  Travel: "bg-sky-100 text-sky-600 dark:bg-sky-950/55 dark:text-sky-200",
  Random:
    "bg-violet-100 text-violet-600 dark:bg-violet-950/55 dark:text-violet-200",
  Advice:
    "bg-orange-100 text-orange-600 dark:bg-orange-950/50 dark:text-orange-200",
  Food:
    "bg-yellow-100 text-yellow-600 dark:bg-yellow-950/50 dark:text-yellow-200",
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
  postedAt,
  category,
  likedByMe = false,
  visibility = "public",
  firstComment = null,
  onLikeToggle,
  onShare,
  onDeleted,
  groupId,
  groupName,
  savedByMe: savedByMeProp = false,
  isFollowingAuthor = false,
  detailHref = null,
}: PostCardProps) {
  const [, setLocation] = useLocation();
  const { userId: currentUserId } = useCurrentUser();
  const { toast } = useToast();
  const [liked, setLiked] = useState(!!likedByMe);
  const [likeCount, setLikeCount] = useState(likes);
  const [showComments, setShowComments] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [commentCount, setCommentCount] = useState(comments);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [hiddenByReport, setHiddenByReport] = useState(false);
  const [hiddenByMute, setHiddenByMute] = useState(false);
  const [blockOpen, setBlockOpen] = useState(false);
  const [reportPostOpen, setReportPostOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [saved, setSaved] = useState(!!savedByMeProp);
  const [renderedContent, setRenderedContent] = useState(content);
  const [renderedImage, setRenderedImage] = useState(image || "");
  const [editContent, setEditContent] = useState(content);
  const [editImageUrl, setEditImageUrl] = useState(image || "");
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [viewCount, setViewCount] = useState(0);
  const viewKey = `post_views_${id}`;
  const sessionKey = `post_viewed_session_${id}`;
  const isOwner = !!currentUserId && !!authorId && currentUserId === authorId;
  const canSocial = !!currentUserId && !!authorId && !isOwner;
  const authorProfileHref = authorId ? `/profile/social/user/${encodeURIComponent(authorId)}` : null;

  const invalidateSocial = () => {
    if (!currentUserId) return;
    void queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
    void queryClient.invalidateQueries({ queryKey: ["/api/users", currentUserId, "social-summary"] });
    void queryClient.invalidateQueries({ queryKey: ["/api/users", currentUserId, "social-feed-lists"] });
    void queryClient.invalidateQueries({ queryKey: ["/api/users", currentUserId, "social-saved-posts"] });
    void queryClient.invalidateQueries({ queryKey: [`/api/users/${currentUserId}/blocked`] });
  };

  const saveMutation = useMutation({
    mutationFn: async (next: boolean) => {
      if (!currentUserId) throw new Error("Sign in required");
      if (next) {
        return apiRequest("POST", `/api/users/${currentUserId}/social/save-post`, { postId: id });
      }
      return apiRequest(
        "DELETE",
        `/api/users/${currentUserId}/social/save-post/${encodeURIComponent(id)}`,
      );
    },
    onSuccess: (_d, next) => {
      setSaved(next);
      invalidateSocial();
      toast({ title: next ? "Post saved" : "Removed from saved" });
    },
    onError: () => toast({ title: "Couldn’t update save", variant: "destructive" }),
  });

  const followMutation = useMutation({
    mutationFn: async (next: boolean) => {
      if (!currentUserId || !authorId) throw new Error("Missing user");
      if (next) {
        return apiRequest("POST", `/api/users/${currentUserId}/social/follow`, {
          targetUserId: authorId,
        });
      }
      return apiRequest(
        "DELETE",
        `/api/users/${currentUserId}/social/follow/${encodeURIComponent(authorId)}`,
      );
    },
    onSuccess: (_d, next) => {
      if (currentUserId && authorId) {
        patchViewerFollowingInCache(currentUserId, authorId, next);
      }
      invalidateSocial();
      toast({ title: next ? "Following" : "Unfollowed" });
    },
    onError: () => toast({ title: "Couldn’t update follow", variant: "destructive" }),
  });

  /** During mutation, show target state; otherwise rely on feed prop (kept in sync via cache patch). */
  const followDisplay =
    followMutation.isPending && typeof followMutation.variables === "boolean"
      ? followMutation.variables
      : isFollowingAuthor;

  const muteMutation = useMutation({
    mutationFn: async (mute: boolean) => {
      if (!currentUserId || !authorId) throw new Error("Missing user");
      if (mute) {
        return apiRequest("POST", `/api/users/${currentUserId}/social/mute`, { authorId });
      }
      return apiRequest(
        "DELETE",
        `/api/users/${currentUserId}/social/mute/${encodeURIComponent(authorId)}`,
      );
    },
    onSuccess: async (_d, mute) => {
      if (currentUserId && authorId) {
        try {
          await setAuthorMuted(currentUserId, authorId, mute);
        } catch {
          /* feed may still update after refetch */
        }
      }
      setHiddenByMute(!!mute);
      invalidateSocial();
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      toast({
        title: mute ? "Posts from this person are hidden" : "Unmuted",
        description: mute ? "Change this anytime in Settings → Feed & social." : undefined,
      });
    },
    onError: (_err, mute) => {
      if (mute) setHiddenByMute(false);
      toast({ title: "Couldn’t update mute", variant: "destructive" });
    },
  });

  /** Radix menu items should use `onSelect` (not `onClick`) so mute reliably runs; hide immediately like the X control. */
  function startMuteAuthorPosts() {
    if (!currentUserId || !authorId || muteMutation.isPending) return;
    setHiddenByMute(true);
    muteMutation.mutate(true);
  }

  const reportPostMutation = useMutation({
    mutationFn: async (payload: { reason: string; details: string }) => {
      if (!currentUserId) throw new Error("Sign in required");
      return apiRequestJson("POST", `/api/users/${currentUserId}/social/report-post`, {
        postId: id,
        authorId: authorId || undefined,
        reason: payload.reason,
        details: payload.details || undefined,
      });
    },
    onSuccess: async (_data, payload) => {
      if (currentUserId) {
        try {
          await addPostReport({
            userId: currentUserId,
            postId: id,
            authorId: authorId || undefined,
            authorName: author.name?.trim() || undefined,
            authorAvatar: (author.avatar ?? author.image)?.trim() || null,
            postPreview: content.trim().slice(0, 200) || null,
            reason: payload.reason,
            details: payload.details || undefined,
          });
        } catch {
          /* feed may still filter from server lists on refresh */
        }
      }
      setReportPostOpen(false);
      setReportReason("");
      setReportDetails("");
      setHiddenByReport(true);
      invalidateSocial();
      toast({
        title: "Report submitted",
        description: "This post is hidden for you. You can undo it in Settings → Feed preferences.",
      });
    },
    onError: () => toast({ title: "Report failed", variant: "destructive" }),
  });

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

  const editMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PATCH", `/api/posts/${id}`, {
        content: editContent.trim(),
        image: editImageUrl.trim(),
      });
    },
    onSuccess: () => {
      setRenderedContent(editContent.trim());
      setRenderedImage(editImageUrl.trim());
      setEditOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      toast({ title: "Post updated" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update post", variant: "destructive" });
    },
  });

  useEffect(() => {
    setLiked(!!likedByMe);
  }, [id, likedByMe]);

  useEffect(() => {
    setLikeCount(likes);
  }, [id, likes]);

  useEffect(() => {
    setCommentCount(comments);
  }, [id, comments]);

  useEffect(() => {
    setSaved(!!savedByMeProp);
  }, [id, savedByMeProp]);

  useEffect(() => {
    setRenderedContent(content);
    setEditContent(content);
  }, [id, content]);

  useEffect(() => {
    const next = image || "";
    setRenderedImage(next);
    setEditImageUrl(next);
  }, [id, image]);

  const handleLike = () => {
    if (!currentUserId) {
      toast({ title: "Sign in to like posts", variant: "destructive" });
      return;
    }
    const next = !liked;
    setLiked(next);
    setLikeCount((prev) => (next ? prev + 1 : Math.max(0, prev - 1)));
    onLikeToggle?.(id, next);
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

  const categoryColor = category
    ? CATEGORY_COLORS[category] || "bg-muted text-muted-foreground"
    : null;
  const timeLabel =
    postedAt != null && String(postedAt).trim()
      ? formatPostRelativeTime(postedAt)
      : timestamp;
  if (deleted || hiddenByReport || hiddenByMute) return null;

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "w-full rounded-[20px] border border-border bg-card shadow-[0_4px_20px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.35)] overflow-hidden",
        detailHref && "cursor-pointer",
      )}
      data-testid={`post-card-${id}`}
      onClick={(e) => {
        if (!detailHref) return;
        const t = e.target as HTMLElement | null;
        if (!t) return;

        // Don't hijack clicks on interactive elements inside the card.
        const interactive = t.closest(
          'a,button,input,textarea,select,option,[role="button"],[role="menuitem"],[data-no-post-nav="true"]',
        );
        if (interactive) return;

        setLocation(detailHref);
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-0">
        <div className="flex items-center gap-3">
          {authorProfileHref ? (
            <Link href={authorProfileHref} className="shrink-0">
              <Avatar className="w-10 h-10">
                <AvatarImage
                  src={author.image || author.avatar || undefined}
                  alt={author.name}
                />
                <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                  {author.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Link>
          ) : (
            <Avatar className="w-10 h-10">
              <AvatarImage
                src={author.image || author.avatar || undefined}
                alt={author.name}
              />
              <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                {author.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          )}
          <div>
            <div className="flex items-center gap-1.5">
              {authorProfileHref ? (
                <Link href={authorProfileHref} className="text-sm font-bold text-foreground hover:underline">
                  <span className="inline-flex items-center gap-1.5">
                    <span>{author.name}</span>
                    {author.verified ? <VerifiedTick size="sm" /> : null}
                  </span>
                </Link>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-sm font-bold text-foreground">
                  <span>{author.name}</span>
                  {author.verified ? <VerifiedTick size="sm" /> : null}
                </span>
              )}
              {groupId && groupName?.trim() ? (
                <span className="ml-1 inline-flex max-w-[10rem] items-center truncate rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                  {groupName.trim()}
                </span>
              ) : null}
            </div>
            <div className="mt-1 flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs">
              <span className="text-muted-foreground">{timeLabel}</span>
              <span className="text-muted-foreground/70 font-black" aria-hidden>
                ·
              </span>
              {visibility === "private" ? (
                <Lock className="h-3.5 w-3.5 text-muted-foreground" aria-label="Private post" />
              ) : (
                <Globe2 className="h-3.5 w-3.5 text-muted-foreground" aria-label="Public post" />
              )}
              {category && categoryColor && (
                <Badge className={`text-[10px] px-1.5 py-0 h-4 ${categoryColor} border-0`}>
                  {category}
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-start gap-0 -mt-1.5 -mr-0.5">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-11 w-11 min-h-[44px] min-w-[44px] shrink-0 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted"
                aria-label="Post options"
              >
                <MoreHorizontal className="h-5 w-5" strokeWidth={2} aria-hidden />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[13rem]">
            {isOwner ? (
              <>
                <DropdownMenuItem
                  onClick={() => setEditOpen(true)}
                >
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit post
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => setConfirmDelete(true)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete post
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    setShareOpen(true);
                    onShare?.(id);
                  }}
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </DropdownMenuItem>
              </>
            ) : null}
            {!isOwner ? (
              <>
                <DropdownMenuItem
                  onClick={() => {
                    setShareOpen(true);
                    onShare?.(id);
                  }}
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </DropdownMenuItem>
                {canSocial ? (
                  <>
                    <DropdownMenuItem
                      disabled={saveMutation.isPending}
                      onClick={() => saveMutation.mutate(!saved)}
                    >
                      <Bookmark className={`mr-2 h-4 w-4 ${saved ? "fill-primary text-primary" : ""}`} />
                      {saved ? "Unsave" : "Save"}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      disabled={followMutation.isPending}
                      onClick={() => followMutation.mutate(!followDisplay)}
                    >
                      {followDisplay ? (
                        <UserMinus className="mr-2 h-4 w-4" />
                      ) : (
                        <UserPlus className="mr-2 h-4 w-4" />
                      )}
                      {followDisplay ? "Unfollow" : "Follow"}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      disabled={muteMutation.isPending}
                      onSelect={() => {
                        startMuteAuthorPosts();
                      }}
                    >
                      <VolumeX className="mr-2 h-4 w-4" />
                      Mute posts from user
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => setBlockOpen(true)}
                    >
                      <Ban className="mr-2 h-4 w-4" />
                      Block user
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => setReportPostOpen(true)}
                    >
                      <Flag className="mr-2 h-4 w-4" />
                      Report
                    </DropdownMenuItem>
                  </>
                ) : null}
              </>
            ) : null}
            </DropdownMenuContent>
          </DropdownMenu>

          {!isOwner && canSocial ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-11 w-11 min-h-[44px] min-w-[44px] rounded-full text-muted-foreground hover:text-foreground hover:bg-muted -ml-2"
              aria-label="Mute posts from user"
              disabled={muteMutation.isPending}
              onClick={() => startMuteAuthorPosts()}
            >
              <X className="h-5 w-5" strokeWidth={2} aria-hidden />
            </Button>
          ) : null}
        </div>
      </div>

      {/* Content — px-4 aligns with header row; pt-2 separates from author block */}
      {detailHref ? (
        <Link
          href={detailHref}
          className="block cursor-pointer transition-[opacity,filter] hover:opacity-[0.98] active:brightness-[0.99]"
        >
          <div className="px-4 pt-2 pb-3">
            <p className="text-[16px] text-foreground leading-[1.6] whitespace-pre-wrap">{renderedContent}</p>
          </div>
          {renderedImage ? (
            <div className="mx-4 mb-3 rounded-xl border border-border overflow-hidden bg-muted/30">
              <img
                src={renderedImage}
                alt="Post"
                className="w-full max-h-72 object-contain bg-black/5"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
            </div>
          ) : null}
        </Link>
      ) : (
        <>
          <div className="px-4 pt-2 pb-3">
            <p className="text-[16px] text-foreground leading-[1.6] whitespace-pre-wrap">{renderedContent}</p>
          </div>
          {renderedImage ? (
            <div className="mx-4 mb-3 rounded-xl border border-border overflow-hidden bg-muted/30">
              <img
                src={renderedImage}
                alt="Post"
                className="w-full max-h-72 object-contain bg-black/5"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
            </div>
          ) : null}
        </>
      )}

      <div className="px-4 pb-3 pt-2">
        <PostActions
          isLiked={liked}
          likes={likeCount}
          comments={commentCount}
          viewCount={viewCount}
          onLike={handleLike}
          onComment={() => setShowComments((prev) => !prev)}
          onShare={() => {
            setShareOpen(true);
            onShare?.(id);
          }}
        />
      </div>

      {(showComments || commentCount > 0) && (
        <div className="px-4 pb-4 border-t border-border/80">
          <CommentSection
            postId={id}
            currentUserId={currentUserId ?? undefined}
            expandList={showComments}
            previewComment={firstComment ?? undefined}
            onCommentCountDelta={(d) => setCommentCount((c) => Math.max(0, c + d))}
          />
        </div>
      )}

      <SharePostDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        postId={id}
        authorName={author.name}
        contentPreview={content}
      />

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit post</DialogTitle>
            <DialogDescription>Update your post content or image URL.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="min-h-[120px] rounded-xl"
              placeholder="Update your post..."
            />
            <Input
              value={editImageUrl}
              onChange={(e) => setEditImageUrl(e.target.value)}
              className="rounded-xl"
              placeholder="https://… (optional image URL)"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => editMutation.mutate()}
              disabled={!editContent.trim() || editMutation.isPending}
            >
              {editMutation.isPending ? "Saving…" : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

      {authorId ? (
        <BlockReportDialog
          open={blockOpen}
          onOpenChange={setBlockOpen}
          userId={authorId}
          userName={author.name}
          type="block"
          onBlocked={() => invalidateSocial()}
        />
      ) : null}

      <Dialog open={reportPostOpen} onOpenChange={setReportPostOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Flag className="h-5 w-5 text-destructive" />
              Report post
            </DialogTitle>
            <DialogDescription>
              Tell us what&apos;s wrong. This report is stored for review.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Reason</Label>
              <RadioGroup value={reportReason} onValueChange={setReportReason} className="mt-2">
                {POST_REPORT_REASONS.map((r) => (
                  <div key={r} className="flex items-center space-x-2 py-0.5">
                    <RadioGroupItem value={r} id={`rp-${r}`} />
                    <Label htmlFor={`rp-${r}`} className="cursor-pointer text-sm font-normal">
                      {r}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
            {reportReason ? (
              <div>
                <Label htmlFor="rp-details">Details (optional)</Label>
                <Textarea
                  id="rp-details"
                  className="mt-1 min-h-[72px]"
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  placeholder="Anything else we should know?"
                />
              </div>
            ) : null}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setReportPostOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!reportReason || reportPostMutation.isPending}
              onClick={() =>
                reportPostMutation.mutate({
                  reason: reportReason,
                  details: reportDetails.trim(),
                })
              }
            >
              Submit report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
