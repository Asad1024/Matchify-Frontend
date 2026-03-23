import { useState } from "react";
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
import { postsService } from "@/services/posts.service";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface CreatePostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
}

export default function CreatePostDialog({ open, onOpenChange, userId }: CreatePostDialogProps) {
  const { toast } = useToast();
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const createMutation = useMutation({
    mutationFn: () =>
      postsService.create({
        userId,
        content: content.trim(),
        images: imageUrl.trim() ? [imageUrl.trim()] : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      toast({ title: "Post published" });
      setContent("");
      setImageUrl("");
      onOpenChange(false);
    },
    onError: () => {
      toast({ title: "Could not post", description: "Try again.", variant: "destructive" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-display">Create post</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Textarea
            placeholder="What's on your mind?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[120px] rounded-xl"
            data-testid="input-post-content"
          />
          <div>
            <p className="text-xs text-muted-foreground mb-1">Photo URL (optional)</p>
            <Input
              placeholder="https://..."
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="rounded-xl"
              data-testid="input-post-image"
            />
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-full">
            Cancel
          </Button>
          <Button
            className="rounded-full glow-primary"
            disabled={!content.trim() || createMutation.isPending}
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
