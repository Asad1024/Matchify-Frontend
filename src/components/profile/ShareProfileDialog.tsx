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

interface ShareProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profileId: string;
  displayName: string;
}

function buildProfileUrl(profileId: string): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/profile/${encodeURIComponent(profileId)}`;
}

const canNativeShare =
  typeof navigator !== "undefined" && typeof navigator.share === "function";

export function ShareProfileDialog({
  open,
  onOpenChange,
  profileId,
  displayName,
}: ShareProfileDialogProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const url = buildProfileUrl(profileId);
  const text = `See ${displayName} on Matchify`;

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
        description: "Use Copy link instead.",
      });
      return;
    }
    try {
      await navigator.share({
        title: `${displayName} on Matchify`,
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
      <DialogContent className="max-w-sm" data-testid="dialog-share-profile">
        <DialogHeader>
          <DialogTitle>Share profile</DialogTitle>
          <DialogDescription>
            Send a link so others can view this profile on Matchify.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 pt-1">
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
