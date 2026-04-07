import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { X, Settings, Lock, Sparkles, Link as LinkIcon, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import PhotoUpload from "@/components/profile/PhotoUpload";
import { ProfilePreviewCard } from "@/components/profile/ProfilePreviewCard";
import { LoadingState } from "@/components/common/LoadingState";
import { useCurrentUser } from "@/contexts/UserContext";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { markClientStateDirty } from "@/lib/clientStateSync";
import { usersService } from "@/services/users.service";
import { notifyHeaderUserUpdated } from "@/components/common/Header";
import { cn } from "@/lib/utils";
import { sanitizeProfileGalleryUrls } from "@/lib/profileLabels";

type MeUser = {
  id: string;
  name: string;
  username: string;
  bio?: string | null;
  avatar?: string | null;
  photos?: string[] | null;
};

function normalizeExtraPhotos(photos: string[] | null | undefined, avatar: string | null | undefined) {
  const av = avatar?.trim() || "";
  const raw = sanitizeProfileGalleryUrls(photos);
  return raw.filter((p) => !av || p !== av);
}

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
  const [addGalleryOpen, setAddGalleryOpen] = useState(false);
  const [newGalleryUrl, setNewGalleryUrl] = useState("");
  const [nameLockUntil, setNameLockUntil] = useState(0);
  const [usernameLockUntil, setUsernameLockUntil] = useState(0);
  const [form, setForm] = useState({ name: "", username: "", bio: "" });
  const [gallery, setGallery] = useState<string[]>([]);

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

  useEffect(() => {
    if (!user) return;
    setGallery(normalizeExtraPhotos(user.photos ?? null, user.avatar ?? null));
  }, [user]);

  const photosMutation = useMutation({
    mutationFn: async (nextPhotos: string[] | null) => {
      if (!userId) throw new Error("Not signed in");
      return usersService.patch(userId, { photos: nextPhotos });
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
        /* ignore */
      }
    },
    onError: () => {
      toast({ title: "Could not save photos", variant: "destructive" });
    },
  });

  const persistGallery = (next: string[]) => {
    const cleaned = sanitizeProfileGalleryUrls(next);
    setGallery(cleaned);
    photosMutation.mutate(cleaned.length ? cleaned : null);
  };

  const commitNewGalleryUrl = () => {
    const u = String(newGalleryUrl || "").trim();
    if (!u) return;
    const merged = sanitizeProfileGalleryUrls(Array.from(new Set([u, ...gallery])));
    persistGallery(merged);
    setNewGalleryUrl("");
    setAddGalleryOpen(false);
  };

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
        markClientStateDirty();
        setNameLockUntil(until);
      }
      if (usernameChanged) {
        const until = now + SIX_MONTHS_MS;
        localStorage.setItem(lockKey("username", userId), String(until));
        markClientStateDirty();
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
      const v =
        nextAvatar && typeof nextAvatar === "string" && nextAvatar.trim() ? nextAvatar.trim() : null;
      return usersService.patch(userId, { avatar: v });
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

  function FloatingField({
    label,
    locked,
    helper,
    children,
  }: {
    label: string;
    locked?: boolean;
    helper?: string;
    children: React.ReactNode;
  }) {
    return (
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
          {locked ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
              <Lock className="h-3.5 w-3.5" strokeWidth={1.75} />
              Locked
            </span>
          ) : null}
        </div>
        <div className="rounded-[18px] border border-border/70 bg-card/60 px-3 py-2.5 shadow-2xs focus-within:bg-primary/[0.04]">
          {children}
        </div>
        {helper ? <p className="text-[11px] leading-relaxed text-muted-foreground">{helper}</p> : null}
      </div>
    );
  }

  if (!userId || isLoading || !user) {
    return (
      <div className="min-h-screen bg-[hsl(var(--surface-2))] flex items-center justify-center">
        <LoadingState message="Loading profile..." showMascot />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--surface-2))]">
      <div className="sticky top-0 z-40 border-b border-border/70 bg-card/80 shadow-2xs backdrop-blur-md pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex h-12 w-full max-w-lg items-center px-2">
          <div className="w-10 shrink-0">
            <Button type="button" variant="ghost" size="icon" className="rounded-full" onClick={close} aria-label="Close">
              <X className="h-5 w-5" />
            </Button>
          </div>
          <h1 className="flex-1 text-center font-display text-[15px] font-bold text-foreground">Edit Profile</h1>
          <div className="w-10 shrink-0" aria-hidden />
        </div>
      </div>

      <div className="mx-auto w-full max-w-lg space-y-4 px-4 pb-8 pt-4">
        <div
          className="matchify-surface rounded-2xl border border-border/70 bg-card px-4 py-3.5 shadow-2xs"
          role="status"
        >
          <p className="text-center text-[13px] font-medium leading-snug text-foreground">
            Onboarding is locked here — open{" "}
            <button
              type="button"
              className="font-semibold text-primary underline decoration-primary decoration-2 underline-offset-[3px] hover:text-primary/90"
              onClick={() => setLocation("/support")}
            >
              Help &amp; support
            </button>
            {" "}
            to request changes.
          </p>
        </div>

        <ProfilePreviewCard
          icon={Camera}
          title="Photos"
          description="Main photo plus up to four gallery shots — same layout as your Matches profile preview. After you pick a main photo, you can crop and zoom so it fits the circle; photos save when you confirm."
        >
          <div className="flex justify-center rounded-2xl bg-muted/40 py-4">
            <PhotoUpload
              suppressSuccessToast
              currentPhoto={user.avatar || null}
              userId={user.id}
              onPhotoChange={(url) => {
                const v = url?.trim() ? url.trim() : null;
                avatarMutation.mutate(v);
              }}
              size="lg"
              label="Change main photo"
            />
          </div>
          <div className="mt-4 rounded-2xl border border-border bg-muted/30 p-3">
            <PhotoUpload
              photos={gallery}
              onPhotosChange={(next) => persistGallery(next)}
              maxPhotos={4}
              userId={user.id}
              suppressSuccessToast
              multiAddLabel="Upload"
            />
            <div className="mt-3 flex justify-center border-t border-border pt-3">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-9 rounded-full text-xs font-semibold text-muted-foreground hover:text-foreground"
                onClick={() => setAddGalleryOpen(true)}
              >
                <LinkIcon className="mr-1.5 h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
                Add from image URL
              </Button>
            </div>
          </div>
        </ProfilePreviewCard>

        {/* Public info */}
        <div className="matchify-surface border-white/0 bg-card/70 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Public info</p>
          <div className="mt-3 space-y-4">
            <FloatingField
              label="Name"
              locked={nameLocked}
              helper={nameLocked ? lockText(nameLockUntil) : "You can change this once every 6 months."}
            >
              <Input
                value={form.name}
                disabled={nameLocked}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="h-11 rounded-2xl border-0 bg-transparent px-3 py-2 text-[15px] font-medium text-foreground shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 disabled:opacity-80"
              />
            </FloatingField>

            <FloatingField
              label="Username"
              locked={usernameLocked}
              helper={usernameLocked ? lockText(usernameLockUntil) : "You can change this once every 6 months."}
            >
              <Input
                value={form.username}
                disabled={usernameLocked}
                onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                className="h-11 rounded-2xl border-0 bg-transparent px-3 py-2 text-[15px] font-medium text-foreground shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 disabled:opacity-80"
              />
            </FloatingField>

            <FloatingField label="Bio" helper="A short intro that shows up on your profile.">
              <Textarea
                value={form.bio}
                onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                rows={4}
                className="min-h-[120px] resize-y rounded-2xl border-0 bg-transparent px-3.5 py-2.5 text-[15px] leading-relaxed text-foreground shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                maxLength={500}
              />
            </FloatingField>
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
          className={cn(
            "h-12 w-full rounded-full font-semibold text-white shadow-xl hover:brightness-[0.98]",
            "bg-primary",
          )}
          disabled={
            !canSave ||
            saveMutation.isPending ||
            photosMutation.isPending ||
            avatarMutation.isPending
          }
          onClick={() => saveMutation.mutate()}
        >
          <Sparkles className="mr-2 h-5 w-5" strokeWidth={1.75} />
          {saveMutation.isPending ? "Saving..." : "Save changes"}
        </Button>
      </div>

      <Dialog
        open={addGalleryOpen}
        onOpenChange={(open) => {
          setAddGalleryOpen(open);
          if (!open) setNewGalleryUrl("");
        }}
      >
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>Add a gallery photo</DialogTitle>
            <DialogDescription>
              Paste a direct image URL. It is added to your gallery and saved right away (same as an upload).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <div className="rounded-2xl border border-border/70 bg-card/60 px-3 py-2.5 shadow-2xs focus-within:bg-primary/[0.04]">
              <div className="flex items-center gap-2">
                <LinkIcon className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} aria-hidden />
                <Input
                  value={newGalleryUrl}
                  onChange={(e) => setNewGalleryUrl(e.target.value)}
                  placeholder="https://..."
                  className="h-10 border-0 bg-transparent p-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitNewGalleryUrl();
                  }}
                />
              </div>
            </div>
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              Tip: use a direct image link ending with <span className="font-semibold">.jpg</span> or{" "}
              <span className="font-semibold">.png</span>.
            </p>
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button type="button" variant="outline" className="rounded-full" onClick={() => setAddGalleryOpen(false)}>
              Cancel
            </Button>
            <Button type="button" className="rounded-full" onClick={commitNewGalleryUrl} disabled={!newGalleryUrl.trim()}>
              Add photo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
