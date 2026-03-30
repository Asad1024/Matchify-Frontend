import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Link2, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SharePostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId: string;
  authorName: string;
  contentPreview: string;
}

function buildShareUrl(postId: string): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/community/post/${encodeURIComponent(postId)}`;
}

const canNativeShare =
  typeof navigator !== "undefined" && typeof navigator.share === "function";

export function SharePostDialog({
  open,
  onOpenChange,
  postId,
  authorName,
  contentPreview,
}: SharePostDialogProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const url = buildShareUrl(postId);
  const text = `${authorName} on Matchify: ${contentPreview.slice(0, 120)}${contentPreview.length > 120 ? "…" : ""}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast({ title: "Link copied" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Could not copy", variant: "destructive" });
    }
  };

  const nativeShare = async () => {
    if (!navigator.share) {
      toast({
        title: "Share not available",
        description: "Use Copy link instead, or try Chrome / Safari on mobile.",
      });
      return;
    }
    try {
      await navigator.share({
        title: `Post by ${authorName}`,
        text,
        url,
      });
      onOpenChange(false);
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      toast({ title: "Could not share", variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm" data-testid="dialog-share-post">
        <DialogHeader>
          <DialogTitle>Share post</DialogTitle>
          <DialogDescription>
            Invite others to see this post on Matchify.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 pt-1">
          <p className="text-xs text-muted-foreground rounded-lg bg-muted/50 px-3 py-2 line-clamp-3">
            {contentPreview || "(No text)"}
          </p>
          <div className="flex flex-col gap-2">
            {canNativeShare ? (
              <Button type="button" className="w-full gap-2" onClick={nativeShare}>
                <Share2 className="w-4 h-4" />
                Share via…
              </Button>
            ) : null}
            <Button type="button" variant="outline" className="w-full gap-2" onClick={copyLink}>
              <Link2 className="w-4 h-4" />
              {copied ? "Copied!" : "Copy link"}
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground break-all">{url}</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
