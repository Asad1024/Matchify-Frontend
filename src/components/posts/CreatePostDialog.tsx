import { useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
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
import { useToast } from "@/hooks/use-toast";
import { ImagePlus, Loader2 } from "lucide-react";

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
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      setContent("");
      setImageUrl("");
      setUploading(false);
    }
  }, [open]);

  const createMutation = useMutation({
    mutationFn: () => {
      const img = imageUrl.trim();
      return postsService.create({
        userId,
        content: content.trim(),
        ...(img ? { images: [img], image: img } : {}),
        ...(groupId ? { groupId } : {}),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-display">Create post</DialogTitle>
          {groupId && groupName ? (
            <p className="text-xs text-muted-foreground font-medium pt-1">
              Posting to group: {groupName}
            </p>
          ) : null}
        </DialogHeader>
        <div className="space-y-3">
          <Textarea
            placeholder="What's on your mind?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[120px] rounded-xl"
            data-testid="input-post-content"
          />

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
            <div className="rounded-xl border border-border overflow-hidden bg-muted/30">
              <img
                src={previewSrc}
                alt=""
                className="w-full max-h-48 object-contain bg-black/5"
              />
            </div>
          ) : null}
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-full">
            Cancel
          </Button>
          <Button
            className="rounded-full glow-primary"
            disabled={!content.trim() || createMutation.isPending || uploading}
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
