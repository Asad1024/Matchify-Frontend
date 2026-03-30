import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { X, Camera, Settings, Trash2, Lock } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import PhotoUpload from "@/components/profile/PhotoUpload";
import { LoadingState } from "@/components/common/LoadingState";
import { useCurrentUser } from "@/contexts/UserContext";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { usersService } from "@/services/users.service";
import { notifyHeaderUserUpdated } from "@/components/common/Header";

type MeUser = {
  id: string;
  name: string;
  username: string;
  bio?: string | null;
  avatar?: string | null;
};

const SIX_MONTHS_MS = 180 * 24 * 60 * 60 * 1000;

function lockKey(kind: "name" | "username", userId: string) {
  return `matchify:${kind}:lockUntil:${userId}`;
}

function readLockUntil(kind: "name" | "username", userId: string): number {
  const raw = localStorage.getItem(lockKey(kind, userId));
  const n = raw ? Number(raw) : 0;
  return Number.isFinite(n) ? n : 0;
}

export default function SocialEditProfile() {
  const [, setLocation] = useLocation();
  const { userId } = useCurrentUser();
  const { toast } = useToast();
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const [nameLockUntil, setNameLockUntil] = useState(0);
  const [usernameLockUntil, setUsernameLockUntil] = useState(0);
  const [form, setForm] = useState({ name: "", username: "", bio: "" });

  const { data: user, isLoading } = useQuery<MeUser>({
    queryKey: [`/api/users/${userId}`],
    enabled: !!userId,
  });

  useEffect(() => {
    if (!userId) return;
    setNameLockUntil(readLockUntil("name", userId));
    setUsernameLockUntil(readLockUntil("username", userId));
  }, [userId]);

  useEffect(() => {
    if (!user) return;
    setForm({
      name: user.name || "",
      username: user.username || "",
      bio: user.bio || "",
    });
  }, [user]);

  const nameLocked = Date.now() < nameLockUntil;
  const usernameLocked = Date.now() < usernameLockUntil;

  const lockText = (untilTs: number) => {
    if (!untilTs || Date.now() >= untilTs) return "";
    const d = new Date(untilTs);
    return `Locked until ${d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`;
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!userId || !user) throw new Error("Not signed in");
      const payload: Record<string, unknown> = { bio: form.bio.trim() || null };
      const nameTrim = form.name.trim();
      const userTrim = (user.name || "").trim();
      const userTrimUser = (user.username || "").trim();
      const usernameTrim = form.username.trim().replace(/^@/, "");
      if (!nameLocked && nameTrim && nameTrim !== userTrim) payload.name = nameTrim;
      if (!usernameLocked && usernameTrim && usernameTrim !== userTrimUser) {
        payload.username = usernameTrim;
      }
      return usersService.patch(userId, payload);
    },
    onSuccess: (updated) => {
      if (!userId || !user) return;
      const now = Date.now();
      const nameChanged =
        !nameLocked && form.name.trim() && form.name.trim() !== (user.name || "").trim();
      const usernameChanged =
        !usernameLocked &&
        form.username.trim().replace(/^@/, "") &&
        form.username.trim().replace(/^@/, "") !== (user.username || "").trim();
      if (nameChanged) {
        const until = now + SIX_MONTHS_MS;
        localStorage.setItem(lockKey("name", userId), String(until));
        setNameLockUntil(until);
      }
      if (usernameChanged) {
        const until = now + SIX_MONTHS_MS;
        localStorage.setItem(lockKey("username", userId), String(until));
        setUsernameLockUntil(until);
      }

      queryClient.setQueryData([`/api/users/${userId}`], (prev: unknown) => {
        const base = prev && typeof prev === "object" ? (prev as Record<string, unknown>) : {};
        return { ...base, ...(updated as Record<string, unknown>) };
      });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}`] });
      try {
        const raw = localStorage.getItem("currentUser");
        if (raw) {
          const cur = JSON.parse(raw) as Record<string, unknown>;
          localStorage.setItem("currentUser", JSON.stringify({ ...cur, ...(updated as Record<string, unknown>) }));
          notifyHeaderUserUpdated();
        }
      } catch {
        // ignore local storage parse issues
      }
      toast({ title: "Profile updated" });
      setLocation("/profile/social");
    },
    onError: () => {
      toast({ title: "Could not save profile", variant: "destructive" });
    },
  });

  const avatarMutation = useMutation({
    mutationFn: async (nextAvatar: string | null) => {
      if (!userId) throw new Error("Not signed in");
      return usersService.patch(userId, { avatar: nextAvatar });
    },
    onSuccess: (updated) => {
      if (!userId) return;
      queryClient.setQueryData([`/api/users/${userId}`], (prev: unknown) => {
        const base = prev && typeof prev === "object" ? (prev as Record<string, unknown>) : {};
        return { ...base, ...(updated as Record<string, unknown>) };
      });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}`] });
      try {
        const raw = localStorage.getItem("currentUser");
        if (raw) {
          const cur = JSON.parse(raw) as Record<string, unknown>;
          localStorage.setItem("currentUser", JSON.stringify({ ...cur, ...(updated as Record<string, unknown>) }));
          notifyHeaderUserUpdated();
        }
      } catch {
        // ignore local storage parse issues
      }
      toast({ title: "Photo updated" });
      setAvatarModalOpen(false);
    },
    onError: () => {
      toast({ title: "Could not update photo", variant: "destructive" });
    },
  });

  const canSave = useMemo(() => {
    if (!user) return false;
    const uName = (user.username || "").trim();
    const fName = form.username.trim().replace(/^@/, "");
    return (
      form.bio !== (user.bio || "") ||
      (!nameLocked && form.name.trim() !== (user.name || "").trim()) ||
      (!usernameLocked && fName !== uName)
    );
  }, [form, user, nameLocked, usernameLocked]);

  const close = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      window.history.back();
      return;
    }
    setLocation("/profile/social");
  };

  if (!userId || isLoading || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingState message="Loading profile..." showMascot />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-40 border-b border-stone-100 bg-white pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex h-12 w-full max-w-lg items-center px-2">
          <div className="w-10 shrink-0">
            <Button type="button" variant="ghost" size="icon" className="rounded-full" onClick={close} aria-label="Close">
              <X className="h-5 w-5" />
            </Button>
          </div>
          <h1 className="flex-1 text-center text-base font-bold text-stone-900">Edit Profile</h1>
          <div className="w-10 shrink-0" />
        </div>
      </div>

      <div className="mx-auto w-full max-w-lg space-y-4 px-4 pb-8 pt-4">
        <div className="rounded-2xl border border-stone-100 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user.avatar || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary">{user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              onClick={() => setAvatarModalOpen(true)}
            >
              <Camera className="mr-2 h-4 w-4" /> Edit photo
            </Button>
          </div>
        </div>

        <div className="rounded-2xl border border-stone-100 bg-white p-4 shadow-sm">
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-stone-500">Name</label>
              <div className="relative">
                <Input
                  value={form.name}
                  disabled={nameLocked}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="rounded-xl pr-10 disabled:cursor-default disabled:opacity-100 disabled:text-foreground"
                />
                {nameLocked ? (
                  <Lock
                    className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400"
                    aria-label="Name change locked"
                  />
                ) : null}
              </div>
              <p className="mt-1 text-[11px] text-stone-500">
                {nameLocked ? lockText(nameLockUntil) : "You can change this once every 6 months."}
              </p>
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-stone-500">Username</label>
              <div className="relative">
                <Input
                  value={form.username}
                  disabled={usernameLocked}
                  onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                  className="rounded-xl pr-10 disabled:cursor-default disabled:opacity-100 disabled:text-foreground"
                />
                {usernameLocked ? (
                  <Lock
                    className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400"
                    aria-label="Username change locked"
                  />
                ) : null}
              </div>
              <p className="mt-1 text-[11px] text-stone-500">
                {usernameLocked ? lockText(usernameLockUntil) : "You can change this once every 6 months."}
              </p>
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-stone-500">Bio</label>
              <Textarea
                value={form.bio}
                onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                rows={4}
                className="rounded-xl resize-y"
                maxLength={500}
              />
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setLocation("/settings")}
          className="flex w-full items-center justify-between rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-left"
        >
          <span>
            <p className="text-sm font-bold text-amber-900">Looking for something else?</p>
            <p className="text-xs text-amber-800/85">Go to Settings for privacy, notifications, and account options.</p>
          </span>
          <span className="rounded-full bg-white p-2 text-amber-700 shadow-sm">
            <Settings className="h-4 w-4" />
          </span>
        </button>

        <Button
          type="button"
          className="h-12 w-full rounded-2xl font-bold"
          disabled={!canSave || saveMutation.isPending}
          onClick={() => saveMutation.mutate()}
        >
          {saveMutation.isPending ? "Saving..." : "Save changes"}
        </Button>
      </div>

      <Dialog open={avatarModalOpen} onOpenChange={setAvatarModalOpen}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>Edit photo</DialogTitle>
            <DialogDescription>Replace your profile photo or remove it.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <PhotoUpload
              currentPhoto={user.avatar || null}
              userId={user.id}
              suppressSuccessToast
              onPhotoChange={(url) => avatarMutation.mutate(url?.trim() ? url.trim() : null)}
              label="Replace photo"
            />
            <Button
              type="button"
              variant="outline"
              className="w-full rounded-full border-red-200 text-red-600 hover:bg-red-50"
              onClick={() => avatarMutation.mutate(null)}
              disabled={avatarMutation.isPending}
            >
              <Trash2 className="mr-2 h-4 w-4" /> Delete photo
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
