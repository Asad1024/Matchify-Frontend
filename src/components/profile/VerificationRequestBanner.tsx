import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/services/api";
import { cn } from "@/lib/utils";

const VERIFICATION_NOTE_MIN = 10;

export type VerificationRequestState = {
  status?: string;
  message?: string;
  submittedAt?: string;
} | null;

type VerificationRequestBannerProps = {
  userId: string | undefined;
  verified: boolean | null | undefined;
  verificationRequest?: VerificationRequestState;
  /** Tighter layout for Menu / Settings lists */
  compact?: boolean;
  className?: string;
};

export function VerificationRequestBanner({
  userId,
  verified,
  verificationRequest,
  compact,
  className,
}: VerificationRequestBannerProps) {
  const { toast } = useToast();
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [verifyNote, setVerifyNote] = useState("");

  const submitVerificationRequest = useMutation({
    mutationFn: async (message: string) => {
      if (!userId) throw new Error("Not signed in");
      const res = await apiRequest("POST", `/api/users/${userId}/verification-request`, { message });
      if (!res.ok) {
        let msg = "Request failed";
        try {
          const j = (await res.json()) as { message?: string };
          if (j?.message) msg = j.message;
        } catch {
          /* use default */
        }
        throw new Error(msg);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}`] });
      toast({
        title: "Request sent",
        description: "Our team will review your message. You will get a notification when you are verified.",
      });
      setVerifyOpen(false);
      setVerifyNote("");
    },
    onError: (e: Error) => {
      toast({
        title: "Could not send request",
        description: e.message,
        variant: "destructive",
      });
    },
  });

  if (!userId || verified === true) return null;

  return (
    <>
      <div className={className}>
        <div
          className={cn(
            "flex flex-col gap-3 rounded-2xl border border-border/70 bg-card/80 px-4 py-3 sm:flex-row sm:items-center sm:justify-between",
            compact && "px-3.5 py-2.5",
          )}
        >
          <div className="flex min-w-0 items-start gap-2">
            <Shield className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div className="min-w-0">
              <p className={cn("font-semibold text-foreground", compact ? "text-[13px]" : "text-sm")}>
                Verification request
              </p>
              <p className={cn("text-muted-foreground", compact ? "mt-0.5 text-[11px] leading-snug" : "text-xs")}>
                {verificationRequest?.status === "pending"
                  ? "Your request is with our team. We will notify you when your profile is verified."
                  : "Submit a short note for reviewers. If approved, you will get the verification badge on your name."}
              </p>
            </div>
          </div>
          {verificationRequest?.status !== "pending" ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="shrink-0 rounded-full"
              onClick={() => setVerifyOpen(true)}
            >
              Request verification
            </Button>
          ) : null}
        </div>
      </div>

      <Dialog open={verifyOpen} onOpenChange={setVerifyOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Request profile verification</DialogTitle>
            <DialogDescription>
              Introduce yourself to our reviewers (for example what confirms your identity or why you want the badge).
              This is only visible to admins.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            id="verification-request-note"
            value={verifyNote}
            onChange={(e) => setVerifyNote(e.target.value)}
            placeholder={`Write at least ${VERIFICATION_NOTE_MIN} characters…`}
            className="min-h-[120px] rounded-xl"
            aria-describedby="verification-request-hint"
          />
          <p
            id="verification-request-hint"
            className={`text-xs leading-relaxed ${verifyNote.trim().length < VERIFICATION_NOTE_MIN ? "text-muted-foreground" : "text-primary/90"}`}
          >
            {verifyNote.trim().length < VERIFICATION_NOTE_MIN ? (
              <>
                Send request stays disabled until you write at least{" "}
                <span className="font-semibold text-foreground">{VERIFICATION_NOTE_MIN} characters</span> so reviewers
                have enough context ({verifyNote.trim().length}/{VERIFICATION_NOTE_MIN}).
              </>
            ) : (
              <>You&apos;re good to send — {verifyNote.trim().length} characters.</>
            )}
          </p>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => setVerifyOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={verifyNote.trim().length < VERIFICATION_NOTE_MIN || submitVerificationRequest.isPending}
              className="disabled:pointer-events-none disabled:opacity-50"
              onClick={() => submitVerificationRequest.mutate(verifyNote.trim())}
            >
              {submitVerificationRequest.isPending ? "Sending…" : "Send request"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
