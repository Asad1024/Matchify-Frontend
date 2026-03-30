import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { buildApiUrl, getAuthHeaders } from "@/services/api";
import { Loader2 } from "lucide-react";

type Props = {
  userId: string;
  /** Called after a successful change (e.g. close dialog). */
  onSuccess?: () => void;
  /** Compact layout for dialogs */
  compact?: boolean;
};

export function ChangePasswordForm({ userId, onSuccess, compact }: Props) {
  const { toast } = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(buildApiUrl(`/api/users/${userId}/change-password`), {
        method: "POST",
        headers: getAuthHeaders(true),
        credentials: "include",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = (await res.json().catch(() => ({}))) as { message?: string };
      if (!res.ok) throw new Error(data.message || "Failed to change password");
    },
    onSuccess: () => {
      toast({ title: "Password updated" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirm("");
      onSuccess?.();
    },
    onError: (e: Error) => {
      toast({
        title: "Could not update password",
        description: e.message,
        variant: "destructive",
      });
    },
  });

  const submit = () => {
    if (newPassword.length < 6) {
      toast({ title: "Password too short", description: "Use at least 6 characters.", variant: "destructive" });
      return;
    }
    if (newPassword !== confirm) {
      toast({ title: "Mismatch", description: "New password and confirmation must match.", variant: "destructive" });
      return;
    }
    mutation.mutate();
  };

  const gap = compact ? "space-y-3" : "space-y-4";

  return (
    <div className={gap}>
      <div className="space-y-1.5">
        <Label htmlFor="cp-current">Current password</Label>
        <Input
          id="cp-current"
          type="password"
          autoComplete="current-password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="cp-new">New password</Label>
        <Input
          id="cp-new"
          type="password"
          autoComplete="new-password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="cp-confirm">Confirm new password</Label>
        <Input
          id="cp-confirm"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
      </div>
      <Button
        type="button"
        className={compact ? "w-full" : "w-full sm:w-auto"}
        disabled={mutation.isPending || !currentPassword || !newPassword || !confirm}
        onClick={submit}
      >
        {mutation.isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Updating…
          </>
        ) : (
          "Update password"
        )}
      </Button>
    </div>
  );
}
