import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Ban, Flag, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useCurrentUser } from "@/contexts/UserContext";
import { setUserBlocked, type SocialSummary } from "@/lib/socialPreferencesService";

interface BlockReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
  type?: 'block' | 'report' | 'both';
  /** Called after a block succeeds (e.g. remove from discovery deck). */
  onBlocked?: () => void;
}

const REPORT_REASONS = [
  "Inappropriate content",
  "Harassment or bullying",
  "Fake profile",
  "Spam or scam",
  "Underage",
  "Other",
];

export function BlockReportDialog({
  open,
  onOpenChange,
  userId,
  userName,
  type = 'both',
  onBlocked,
}: BlockReportDialogProps) {
  const [action, setAction] = useState<'block' | 'report'>('report');
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const { userId: currentUserId } = useCurrentUser();
  const { toast } = useToast();

  useEffect(() => {
    if (!open) return;
    if (type === "block") setAction("block");
    else if (type === "report") setAction("report");
  }, [open, type]);

  const blockMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/users/${currentUserId}/blocks`, { blockedId: userId });
    },
    onSuccess: async () => {
      if (currentUserId) {
        try {
          await setUserBlocked(currentUserId, userId, true);
        } catch {
          /* server feed still excludes blocked authors; local filter best-effort */
        }
        queryClient.setQueryData<SocialSummary>(["/api/users", currentUserId, "social-summary"], (old) => {
          if (!old) return old;
          const b = new Set(old.blockedUserIds ?? []);
          b.add(String(userId));
          return { ...old, blockedUserIds: Array.from(b) };
        });
      }
      void queryClient.invalidateQueries({ queryKey: [`/api/users/${currentUserId}/blocked`] });
      void queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      void queryClient.invalidateQueries({ queryKey: ["/api/users", currentUserId, "social-summary"] });
      void queryClient.invalidateQueries({ queryKey: ["/api/users", currentUserId, "social-feed-lists"] });
      await queryClient.refetchQueries({ queryKey: ["/api/posts"] });
      toast({
        title: "User blocked",
        description: `${userName} has been blocked`,
      });
      onBlocked?.();
      onOpenChange(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to block user",
        variant: "destructive",
      });
    },
  });

  const reportMutation = useMutation({
    mutationFn: async (data: { reason: string; details: string }) => {
      const reason = [data.reason, data.details?.trim()].filter(Boolean).join(" — ");
      return apiRequest("POST", "/api/reports", {
        reportedId: userId,
        reason,
      });
    },
    onSuccess: () => {
      toast({
        title: "Report submitted",
        description: "Thank you for your report. We'll review it shortly.",
      });
      onOpenChange(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit report",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (action === 'block') {
      blockMutation.mutate();
    } else {
      if (!reportReason) {
        toast({
          title: "Required",
          description: "Please select a reason for reporting",
          variant: "destructive",
        });
        return;
      }
      reportMutation.mutate({ reason: reportReason, details: reportDetails });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {action === 'block' ? (
              <>
                <Ban className="w-5 h-5 text-destructive" />
                Block {userName}
              </>
            ) : (
              <>
                <Flag className="w-5 h-5 text-destructive" />
                Report {userName}
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {action === 'block'
              ? `Blocking ${userName} will prevent them from seeing your profile or contacting you.`
              : `Help us keep Matchify safe by reporting inappropriate behavior.`}
          </DialogDescription>
        </DialogHeader>

        {type === 'both' && (
          <div className="space-y-4">
            <Label>What would you like to do?</Label>
            <RadioGroup value={action} onValueChange={(value) => setAction(value as 'block' | 'report')}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="report" id="report" />
                <Label htmlFor="report" className="cursor-pointer">Report this user</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="block" id="block" />
                <Label htmlFor="block" className="cursor-pointer">Block this user</Label>
              </div>
            </RadioGroup>
          </div>
        )}

        {action === 'report' && (
          <div className="space-y-4">
            <div>
              <Label>Reason for reporting</Label>
              <RadioGroup value={reportReason} onValueChange={setReportReason}>
                {REPORT_REASONS.map((reason) => (
                  <div key={reason} className="flex items-center space-x-2">
                    <RadioGroupItem value={reason} id={reason} />
                    <Label htmlFor={reason} className="cursor-pointer text-sm">{reason}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {reportReason && (
              <div>
                <Label htmlFor="details">Additional details (optional)</Label>
                <Textarea
                  id="details"
                  placeholder="Provide more information about this report..."
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  rows={3}
                />
              </div>
            )}
          </div>
        )}

        {action === 'block' && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">What happens when you block someone:</p>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>They won't be able to see your profile</li>
                  <li>They won't be able to message you</li>
                  <li>You won't see them in your matches</li>
                  <li>You can unblock them anytime in Settings</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant={action === 'block' ? 'destructive' : 'default'}
            onClick={handleSubmit}
            disabled={action === 'report' && !reportReason}
          >
            {action === 'block' ? 'Block User' : 'Submit Report'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

