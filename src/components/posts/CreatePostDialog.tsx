import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { postsService } from "@/services/posts.service";
import { uploadPostPhoto } from "@/services/upload.service";
import { queryClient } from "@/lib/queryClient";
import { applyCreatedPostToPostFeedCaches } from "@/lib/postsFeedCache";
import { useToast } from "@/hooks/use-toast";
import { ImagePlus, Loader2 } from "lucide-react";
import type { Group, Post } from "@shared/schema";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function apiErrorMessage(err: unknown): string {
  if (!(err instanceof Error)) return "Something went wrong. Try again.";
  const raw = err.message;
  const m = raw.match(/^\d+:\s*([\s\S]+)$/);
  const payload = m?.[1] ?? raw;
  try {
    const j = JSON.parse(payload) as { message?: string };
    if (j?.message && typeof j.message === "string") return j.message;
  } catch {
    /* not JSON */
  }
  return payload.length > 160 ? `${payload.slice(0, 157)}…` : payload;
}

interface CreatePostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  /** When set (e.g. from Community → Groups), new posts are tied to that group. */
  groupId?: string | null;
  groupName?: string | null;
}

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

export default function CreatePostDialog({
  open,
  onOpenChange,
  userId,
  groupId,
  groupName,
}: CreatePostDialogProps) {
  const { toast } = useToast();
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const fileRef = useRef<HTMLInputElement>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");

  useEffect(() => {
    if (!open) {
      setContent("");
      setImageUrl("");
      setUploading(false);
      setVisibility("public");
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setSelectedGroupId(groupId?.trim() || "");
  }, [open, groupId]);

  type GroupRow = Group & { memberCount?: number };
  const { data: groups = [] } = useQuery<GroupRow[]>({
    queryKey: ["/api/groups"],
    enabled: open && !groupId,
  });
  const { data: me } = useQuery<{ name?: string | null; avatar?: string | null }>({
    queryKey: [`/api/users/${userId}`],
    enabled: open && !!userId,
  });
  const { data: memberships = [] } = useQuery({
    queryKey: ["/api/users", userId, "memberships"],
    enabled: open && !groupId && !!userId,
  });

  const joinedGroupIds = useMemo(() => {
    if (!Array.isArray(memberships)) return new Set<string>();
    return new Set(
      memberships
        .map((m: { groupId?: string }) => m.groupId)
        .filter((id): id is string => typeof id === "string"),
    );
  }, [memberships]);

  const joinedGroups = useMemo(() => {
    const list = Array.isArray(groups) ? groups : [];
    return list.filter((g) => joinedGroupIds.has(g.id));
  }, [groups, joinedGroupIds]);

  const effectiveGroupId = groupId?.trim() || selectedGroupId.trim() || "";
  const effectiveGroupName = useMemo(() => {
    if (groupId && groupName) return groupName;
    const g = joinedGroups.find((x) => x.id === effectiveGroupId);
    return g?.name ?? null;
  }, [groupId, groupName, joinedGroups, effectiveGroupId]);
  const requiresGroup = visibility === "public";

  const createMutation = useMutation({
    mutationFn: () => {
      const img = imageUrl.trim();
      if (requiresGroup && !effectiveGroupId) throw new Error("Pick a group to post in.");
      return postsService.create({
        userId,
        content: content.trim(),
        visibility,
        ...(img ? { images: [img], image: img } : {}),
        ...(requiresGroup && effectiveGroupId ? { groupId: effectiveGroupId } : {}),
      });
    },
    onSuccess: (created) => {
      applyCreatedPostToPostFeedCaches(queryClient, created as Post, userId);
      toast({ title: "Post published" });
      setContent("");
      setImageUrl("");
      onOpenChange(false);
    },
    onError: (err) => {
      toast({
        title: "Could not post",
        description: apiErrorMessage(err),
        variant: "destructive",
      });
    },
  });

  const handlePickFile = () => fileRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Not an image",
        description: "Choose a photo file (JPEG, PNG, WebP, etc.).",
        variant: "destructive",
      });
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      toast({
        title: "File too large",
        description: "Photos must be 8 MB or smaller.",
        variant: "destructive",
      });
      return;
    }
    setUploading(true);
    try {
      const url = await uploadPostPhoto(file);
      setImageUrl(url);
      toast({ title: "Photo ready", description: "It will be included when you post." });
    } catch (err) {
      toast({
        title: "Upload failed",
        description: apiErrorMessage(err),
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const previewSrc = imageUrl.trim() || undefined;
  const myInitials = (me?.name || "Me").slice(0, 2).toUpperCase();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(90dvh,calc(100dvh-1.5rem))] flex-col gap-0 overflow-hidden rounded-2xl border-border bg-popover p-0 text-popover-foreground shadow-xl backdrop-blur-xl sm:max-w-md">
        <div className="shrink-0 px-6 pb-2 pt-6 pr-14">
          <DialogHeader className="space-y-1.5 text-left">
            <DialogTitle className="font-display">Create post</DialogTitle>
            {effectiveGroupName ? (
              <p className="pt-1 text-xs font-medium text-muted-foreground">Posting to group: {effectiveGroupName}</p>
            ) : null}
          </DialogHeader>
        </div>
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-6 pb-2">
          <div className="flex items-center gap-2">
            <Avatar className="h-9 w-9 shrink-0 border border-border bg-muted">
              <AvatarImage src={me?.avatar || undefined} alt="" className="object-cover" />
              <AvatarFallback className="bg-primary/10 text-[10px] font-bold text-primary">
                {myInitials}
              </AvatarFallback>
            </Avatar>

            {!groupId ? (
              joinedGroups.length > 0 ? (
                <Select
                  value={effectiveGroupId ? effectiveGroupId : undefined}
                  onValueChange={setSelectedGroupId}
                >
                  <SelectTrigger className="h-9 w-[72%] rounded-full border-border bg-muted/60 px-3 text-[12px] font-semibold text-foreground focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 data-[state=open]:ring-0">
                    <SelectValue placeholder="Choose a group" />
                  </SelectTrigger>
                  <SelectContent>
                    {joinedGroups.map((g) => (
                      <SelectItem key={g.id} value={g.id}>
                        {g.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="w-full rounded-full border border-border bg-muted/50 px-3 py-2 text-[12px] font-semibold text-muted-foreground">
                  Join a group to post
                </div>
              )
            ) : (
              <div className="w-full rounded-full border border-border bg-muted/50 px-3 py-2 text-[12px] font-semibold text-foreground">
                {effectiveGroupName ?? "Group"}
              </div>
            )}
          </div>

          {!groupId ? (
            joinedGroups.length > 0 ? (
              null
            ) : (
              <div className="rounded-xl border border-border bg-muted/30 px-3 py-2">
                <p className="text-sm font-medium text-foreground">Join a group first</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  You can only post inside groups you’ve joined.
                </p>
              </div>
            )
          ) : null}

          <Textarea
            placeholder="What's on your mind?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[120px] rounded-xl"
            data-testid="input-post-content"
          />

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Visibility</Label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setVisibility("public")}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                  visibility === "public"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-background text-muted-foreground hover:text-foreground",
                )}
              >
                Public
              </button>
              <button
                type="button"
                onClick={() => setVisibility("private")}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                  visibility === "private"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-background text-muted-foreground hover:text-foreground",
                )}
              >
                Private
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              {visibility === "public"
                ? "Public posts appear in feed and on your profile."
                : "Private posts appear only on your profile (group optional)."}
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Photo</Label>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={handleFileChange}
              aria-hidden
            />
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-full"
                disabled={uploading}
                onClick={handlePickFile}
              >
                {uploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ImagePlus className="w-4 h-4" />
                )}
                {uploading ? "Uploading…" : "Upload image"}
              </Button>
              {previewSrc ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="rounded-full text-destructive"
                  onClick={() => setImageUrl("")}
                >
                  Remove photo
                </Button>
              ) : null}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Or paste an image URL below (e.g. from the web).
            </p>
            <Input
              placeholder="https://…"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="rounded-xl"
              data-testid="input-post-image"
            />
          </div>

          {previewSrc ? (
            <div className="overflow-hidden rounded-xl border border-border bg-muted/30">
              <img
                src={previewSrc}
                alt=""
                className="max-h-40 w-full bg-black/5 object-contain sm:max-h-48"
              />
            </div>
          ) : null}
        </div>
        <DialogFooter className="shrink-0 gap-2 border-t border-border/60 bg-popover px-6 py-4 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-full border-border bg-transparent text-foreground hover:bg-muted/60"
          >
            Cancel
          </Button>
          <Button
            className={cn("rounded-full glow-primary")}
            disabled={
              !content.trim() ||
              (requiresGroup && !effectiveGroupId) ||
              createMutation.isPending ||
              uploading
            }
            onClick={() => createMutation.mutate()}
            data-testid="button-submit-post"
          >
            {createMutation.isPending ? "Posting…" : "Post"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
