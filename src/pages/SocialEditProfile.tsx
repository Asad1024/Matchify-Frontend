import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { X, Settings, Trash2, Lock, Eye, Pencil, Sparkles, GripVertical, Plus, Link as LinkIcon } from "lucide-react";
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
  DialogFooter,
} from "@/components/ui/dialog";
import PhotoUpload from "@/components/profile/PhotoUpload";
import { LoadingState } from "@/components/common/LoadingState";
import { useCurrentUser } from "@/contexts/UserContext";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { usersService } from "@/services/users.service";
import { notifyHeaderUserUpdated } from "@/components/common/Header";
import { cn } from "@/lib/utils";

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
    if (!userId) return;
    try {
      const raw = localStorage.getItem(`matchify:social:gallery:${userId}`);
      const arr = raw ? (JSON.parse(raw) as unknown) : [];
      if (Array.isArray(arr)) {
        setGallery(arr.map((x) => String(x || "").trim()).filter(Boolean).slice(0, 18));
      }
    } catch {
      /* ignore */
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    try {
      localStorage.setItem(`matchify:social:gallery:${userId}`, JSON.stringify(gallery));
    } catch {
      /* ignore */
    }
  }, [gallery, userId]);

  const moveGallery = (from: number, to: number) => {
    setGallery((prev) => {
      if (from === to) return prev;
      if (from < 0 || to < 0 || from >= prev.length || to >= prev.length) return prev;
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  };

  const addGalleryUrl = () => {
    setAddGalleryOpen(true);
  };

  const commitNewGalleryUrl = () => {
    const u = String(newGalleryUrl || "").trim();
    if (!u) return;
    setGallery((prev) => Array.from(new Set([u, ...prev])).slice(0, 18));
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
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
          {locked ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-600">
              <Lock className="h-3.5 w-3.5" strokeWidth={1.75} />
              Locked
            </span>
          ) : null}
        </div>
        <div className="rounded-[18px] border border-border/70 bg-card/60 px-3 py-2.5 shadow-2xs focus-within:bg-primary/[0.04]">
          {children}
        </div>
        {helper ? <p className="text-[11px] leading-relaxed text-slate-500">{helper}</p> : null}
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
          <h1 className="flex-1 text-center font-display text-[15px] font-bold text-stone-900">Social profile</h1>
          <div className="w-10 shrink-0" />
        </div>
      </div>

      <div className="mx-auto w-full max-w-lg space-y-4 px-4 pb-8 pt-4">
        {/* Segmented pill: Edit vs Preview */}
        <div className="rounded-full bg-card/60 p-1 shadow-2xs ring-1 ring-border/70 backdrop-blur-md">
          <div className="grid grid-cols-2 gap-1">
            <div className="relative h-10 rounded-full text-[12px] font-medium uppercase tracking-[0.14em] text-primary-foreground">
              <span className="absolute inset-0 rounded-full bg-primary shadow-2xs" />
              <span className="relative inline-flex h-full w-full items-center justify-center gap-2">
                <Pencil className="h-4 w-4" strokeWidth={1.75} aria-hidden />
                Edit
              </span>
            </div>
            <button
              type="button"
              onClick={() => setLocation("/profile/social")}
              className="relative h-10 rounded-full text-[12px] font-medium uppercase tracking-[0.14em] text-slate-500 hover:text-slate-800"
            >
              <span className="relative inline-flex items-center gap-2">
                <Eye className="h-4 w-4" strokeWidth={1.75} aria-hidden />
                Preview
              </span>
            </button>
          </div>
        </div>

        {/* Media */}
        <div className="matchify-surface border-white/0 bg-card/70 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Media gallery</p>
              <p className="mt-1 font-display text-[16px] font-bold text-slate-900">Your social photos</p>
            </div>
            <Button
              type="button"
              variant="outline"
              className="h-10 rounded-full border-border/70 bg-card/60 font-semibold text-slate-800 shadow-2xs hover:bg-card"
              onClick={addGalleryUrl}
            >
              <Plus className="mr-2 h-4 w-4" strokeWidth={1.75} />
              Add
            </Button>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2">
            {gallery.length === 0 ? (
              <div className="col-span-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-600">
                Add a few photos. Drag to reorder (saved on this device).
              </div>
            ) : (
              gallery.map((url, idx) => (
                <div
                  key={`${url}-${idx}`}
                  className="group relative aspect-square overflow-hidden rounded-2xl bg-slate-100 ring-1 ring-black/[0.04]"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData("text/plain", String(idx));
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const from = Number(e.dataTransfer.getData("text/plain"));
                    if (Number.isFinite(from)) moveGallery(from, idx);
                  }}
                  aria-label="Gallery image"
                >
                  <img src={url} alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/0 to-transparent opacity-0 transition group-hover:opacity-100" />
                  <div className="absolute left-1.5 top-1.5 inline-flex items-center gap-1 rounded-full bg-white/80 px-2 py-1 text-[10px] font-bold text-slate-700 shadow-sm backdrop-blur-md opacity-0 transition group-hover:opacity-100">
                    <GripVertical className="h-3.5 w-3.5" strokeWidth={1.75} />
                    Drag
                  </div>
                  <button
                    type="button"
                    className="absolute right-1.5 top-1.5 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/85 text-slate-700 shadow-sm backdrop-blur-md opacity-0 transition group-hover:opacity-100"
                    onClick={() => setGallery((prev) => prev.filter((_, i) => i !== idx))}
                    aria-label="Remove image"
                    title="Remove"
                  >
                    <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Public info */}
        <div className="matchify-surface border-white/0 bg-card/70 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Public info</p>
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
                className="h-11 rounded-2xl border-0 bg-transparent p-0 text-[15px] font-medium text-slate-900 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 disabled:opacity-80"
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
                className="h-11 rounded-2xl border-0 bg-transparent p-0 text-[15px] font-medium text-slate-900 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 disabled:opacity-80"
              />
            </FloatingField>

            <FloatingField label="Bio" helper="A short intro that shows up on your profile.">
              <Textarea
                value={form.bio}
                onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                rows={4}
                className="min-h-[120px] resize-y rounded-2xl border-0 bg-transparent p-0 text-[15px] leading-relaxed text-slate-900 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                maxLength={500}
              />
            </FloatingField>
          </div>
        </div>

        {/* Contact details (placeholder, dynamic if available later) */}
        <div className="matchify-surface border-white/0 bg-card/70 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Contact details</p>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Contact fields will appear here when enabled for Social profiles.
          </p>
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
          disabled={!canSave || saveMutation.isPending}
          onClick={() => saveMutation.mutate()}
        >
          <Sparkles className="mr-2 h-5 w-5" strokeWidth={1.75} />
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
            <DialogDescription>Paste an image URL. Photos are saved on this device.</DialogDescription>
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
            <p className="text-[11px] leading-relaxed text-slate-500">
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
