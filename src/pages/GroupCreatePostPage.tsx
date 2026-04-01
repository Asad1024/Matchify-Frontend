import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { ChevronDown, Loader2, X, ImagePlus, Link2, UsersRound, Sparkles } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import BottomNav from "@/components/common/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { postsService } from "@/services/posts.service";
import { uploadPostPhoto } from "@/services/upload.service";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useCurrentUser } from "@/contexts/UserContext";
import type { Group } from "@shared/schema";
import { cn } from "@/lib/utils";

type GroupRow = Group & { memberCount?: number };

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

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

export default function GroupCreatePostPage() {
  const [matchGroup, groupParams] = useRoute("/group/:id/create-post");
  const [matchCommunity] = useRoute("/community/create-post");
  const routeGroupId = groupParams?.id ?? "";
  const isCommunityComposer = Boolean(matchCommunity);
  const [, setLocation] = useLocation();
  const { userId } = useCurrentUser();
  const { toast } = useToast();

  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [linkPopoverOpen, setLinkPopoverOpen] = useState(false);
  const [urlDraft, setUrlDraft] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // This route is now a "modal launcher".
    // It immediately navigates back to the underlying page and lets that page open the composer dialog
    // so the user sees the previous screen blurred behind.
    const target = matchGroup && routeGroupId ? `/group/${routeGroupId}` : "/community";
    try {
      sessionStorage.setItem(
        "matchify_open_create_post",
        JSON.stringify({ groupId: matchGroup ? routeGroupId : null }),
      );
    } catch {
      /* ignore */
    }
    try {
      window.dispatchEvent(
        new CustomEvent("matchify-open-create-post", {
          detail: { groupId: matchGroup ? routeGroupId : null, from: isCommunityComposer ? "community" : "group" },
        }),
      );
    } catch {
      /* ignore */
    }
    setLocation(target);
    return;
  }, [isCommunityComposer, matchGroup, routeGroupId, setLocation]);

  useEffect(() => {
    if (isCommunityComposer) {
      setSelectedGroupId("");
      return;
    }
    if (matchGroup && routeGroupId) {
      setSelectedGroupId(routeGroupId);
    }
  }, [isCommunityComposer, matchGroup, routeGroupId]);

  const { data: me } = useQuery<{ name?: string | null; avatar?: string | null }>({
    queryKey: [`/api/users/${userId}`],
    enabled: !!userId,
  });

  const { data: groups = [] } = useQuery<GroupRow[]>({
    queryKey: ["/api/groups"],
  });

  const { data: memberships = [] } = useQuery({
    queryKey: ["/api/users", userId, "memberships"],
    enabled: !!userId,
  });

  const joinedGroupIds = useMemo(() => {
    if (!Array.isArray(memberships)) return new Set<string>();
    return new Set(
      memberships
        .map((m: { groupId?: string }) => m.groupId)
        .filter((id): id is string => typeof id === "string"),
    );
  }, [memberships]);

  const joinedGroups = useMemo(() => {
    const list = Array.isArray(groups) ? groups : [];
    return list.filter((g) => joinedGroupIds.has(g.id));
  }, [groups, joinedGroupIds]);

  const activeGroup = useMemo(() => {
    const pick = joinedGroups.find((g) => g.id === selectedGroupId);
    return pick ?? null;
  }, [joinedGroups, selectedGroupId]);

  const displayFirstName = useMemo(() => {
    const n = me?.name?.trim();
    if (!n) return "there";
    return n.split(/\s+/)[0] ?? n;
  }, [me?.name]);

  const createMutation = useMutation({
    mutationFn: async ({ groupId: gid }: { groupId: string }) => {
      const id = gid.trim();
      if (!userId || !id) throw new Error("Pick a group to post in.");
      if (!joinedGroupIds.has(id)) throw new Error("You can only post in groups you’ve joined.");
      const img = imageUrl.trim();
      return postsService.create({
        userId,
        content: content.trim(),
        ...(img ? { images: [img], image: img } : {}),
        groupId: id,
      });
    },
    onSuccess: (_data, { groupId: gid }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      toast({ title: "Post published" });
      if (isCommunityComposer) {
        setLocation("/community");
      } else if (gid) {
        setLocation(`/group/${gid}`);
      } else {
        setLocation("/community");
      }
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

  const applyImageUrl = () => {
    const t = urlDraft.trim();
    if (t) setImageUrl(t);
    setLinkPopoverOpen(false);
    setUrlDraft("");
  };

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
  const canPost =
    !!content.trim() && !!activeGroup && !!selectedGroupId && !createMutation.isPending && !uploading;
  const charCount = content.length;
  const greeting = `Salam, ${displayFirstName}`;

  if (!userId) {
    return null;
  }

  if (joinedGroups.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 pb-28">
        <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col px-4">
          <header className="flex w-full items-center justify-between border-b border-gray-200 bg-white py-3.5 pt-[max(0.5rem,env(safe-area-inset-top))]">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full text-stone-700 hover:bg-gray-100"
              onClick={() => setLocation("/community")}
            >
              <X className="h-5 w-5" strokeWidth={2} />
            </Button>
          </header>
          <div className="flex flex-1 flex-col items-center justify-center px-2 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-gray-200 bg-white shadow-sm">
              <UsersRound className="h-7 w-7 text-primary" strokeWidth={1.75} />
            </div>
            <p className="font-display text-lg font-bold text-stone-900">Join a group first</p>
            <p className="mt-2 max-w-[280px] text-sm leading-relaxed text-stone-600">
              You can only post in groups you belong to. Browse Community and join one to continue.
            </p>
            <Button
              type="button"
              className="mt-6 rounded-full px-6 font-semibold shadow-sm"
              onClick={() => setLocation("/community")}
            >
              Go to Community
            </Button>
          </div>
        </div>
        <BottomNav active="community" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--surface-2))] pb-28">
      {/* Expressive Canvas backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/30 backdrop-blur-md"
        style={{ transitionTimingFunction: "cubic-bezier(0.22,1,0.36,1)" }}
        aria-hidden
      />

      <div className="fixed inset-0 z-[55] flex items-start justify-center overflow-y-auto px-4 pb-24 pt-[max(1rem,env(safe-area-inset-top))]">
        <div
          className="w-full max-w-lg overflow-hidden rounded-[28px] border border-border/70 bg-card/85 shadow-xl backdrop-blur-xl"
          style={{ transitionTimingFunction: "cubic-bezier(0.22,1,0.36,1)" }}
        >
          {/* Header */}
          <div className="relative px-4 pt-4 sm:px-5">
            <button
              type="button"
              className="absolute left-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 shadow-sm transition hover:bg-slate-200"
              onClick={() =>
                setLocation(
                  isCommunityComposer ? "/community" : `/group/${routeGroupId || selectedGroupId || ""}`,
                )
              }
              aria-label="Close"
              style={{ transitionTimingFunction: "cubic-bezier(0.22,1,0.36,1)" }}
            >
              <X className="h-4 w-4" strokeWidth={1.75} aria-hidden />
            </button>

            <div className="flex items-center justify-between gap-3 pl-10">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" strokeWidth={1.75} aria-hidden />
                <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-slate-500">New post</p>
              </div>

              <button
                type="button"
                disabled={!canPost}
                onClick={() =>
                  createMutation.mutate({ groupId: selectedGroupId.trim() || activeGroup?.id || "" })
                }
                className={cn(
                  "inline-flex h-9 items-center justify-center rounded-full px-4 text-[12px] font-bold transition",
                  canPost
                    ? "bg-primary text-primary-foreground shadow-2xs hover:brightness-[0.98]"
                    : "bg-slate-100 text-slate-400",
                )}
                style={{ transitionTimingFunction: "cubic-bezier(0.22,1,0.36,1)" }}
                aria-label="Post"
              >
                {createMutation.isPending ? "Posting…" : "Post"}
              </button>
            </div>
          </div>

          <div className="space-y-4 px-4 pb-5 pt-4 sm:px-5">
            {/* Avatar + compact group selector */}
            <div className="flex w-full items-center gap-2">
              <Avatar className="h-10 w-10 shrink-0 border border-border/70 bg-white shadow-2xs">
                <AvatarImage src={me?.avatar || undefined} alt="" />
                <AvatarFallback className="bg-white text-[10px] font-bold text-primary">
                  {(me?.name || "Me").slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      "flex h-9 w-auto max-w-[12.5rem] min-w-0 items-center gap-2 rounded-full px-3 text-left text-[12px] font-semibold outline-none transition",
                      "bg-card/70 text-slate-700 shadow-2xs ring-1 ring-border/70 hover:bg-card",
                      "focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    )}
                  >
                    <UsersRound className="h-4 w-4 shrink-0 text-slate-600" strokeWidth={1.75} aria-hidden />
                    <span
                      className={cn(
                        "min-w-0 flex-1 truncate leading-tight",
                        activeGroup ? "text-slate-900" : "text-slate-500",
                      )}
                    >
                      {activeGroup?.name ?? (isCommunityComposer ? "Choose a group" : "Select group")}
                    </span>
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200",
                        pickerOpen && "rotate-180",
                      )}
                    />
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-[min(calc(100vw-2rem),20rem)] overflow-hidden rounded-2xl border border-stone-200/80 p-0 shadow-lg"
                  align="start"
                  sideOffset={8}
                >
                  <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-400">
                    Post in
                  </p>
                  <ul className="max-h-52 overflow-y-auto py-1">
                    {joinedGroups.map((g) => (
                      <li key={g.id}>
                        <button
                          type="button"
                          className={cn(
                            "flex w-full items-center px-3 py-2.5 text-left text-[13px] text-stone-800 transition-colors",
                            "hover:bg-stone-50 active:bg-stone-100/80",
                            selectedGroupId === g.id && "bg-primary/5 font-medium text-primary",
                          )}
                          onClick={() => {
                            setSelectedGroupId(g.id);
                            setPickerOpen(false);
                          }}
                        >
                          {g.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                </PopoverContent>
              </Popover>
            </div>

            <div className="w-full">
              <label className="sr-only" htmlFor="create-post-body">
                Post content
              </label>

              <div className="rounded-[28px] bg-[#F4F4F7] px-4 py-4">
                <p className="text-[13px] font-medium text-slate-500">{greeting}</p>

                <Textarea
                  id="create-post-body"
                  placeholder="Share a win or ask a question…"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className={cn(
                    "mt-2 min-h-[180px] w-full resize-y rounded-2xl border-0 bg-transparent p-0 text-[18px] leading-relaxed text-slate-900 shadow-none",
                    "placeholder:text-slate-400 focus-visible:ring-0 focus-visible:ring-offset-0",
                  )}
                />

                {/* Action bar */}
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={uploading}
                      onClick={handlePickFile}
                      className={cn(
                        "inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/70 text-slate-600 shadow-sm ring-1 ring-black/[0.04] backdrop-blur-md transition",
                        "hover:bg-white hover:text-primary",
                        uploading && "opacity-60",
                      )}
                      aria-label="Add image"
                      style={{ transitionTimingFunction: "cubic-bezier(0.22,1,0.36,1)" }}
                    >
                      {uploading ? (
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                      ) : (
                        <ImagePlus className="h-4 w-4" strokeWidth={1.75} aria-hidden />
                      )}
                    </button>

                    <Popover
                      open={linkPopoverOpen}
                      onOpenChange={(open) => {
                        setLinkPopoverOpen(open);
                        if (open) setUrlDraft(imageUrl.trim());
                      }}
                    >
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/70 text-slate-600 shadow-sm ring-1 ring-black/[0.04] backdrop-blur-md transition hover:bg-white hover:text-primary"
                          aria-label="Add image link"
                          style={{ transitionTimingFunction: "cubic-bezier(0.22,1,0.36,1)" }}
                        >
                          <Link2 className="h-4 w-4" strokeWidth={1.75} aria-hidden />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-[min(calc(100vw-2rem),20rem)] p-3"
                        align="start"
                        sideOffset={8}
                      >
                        <p className="mb-2 text-xs font-medium text-stone-600">Image URL</p>
                        <Input
                          placeholder="https://…"
                          value={urlDraft}
                          onChange={(e) => setUrlDraft(e.target.value)}
                          className="rounded-xl text-sm"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              applyImageUrl();
                            }
                          }}
                        />
                        <div className="mt-2 flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="rounded-full"
                            onClick={() => setLinkPopoverOpen(false)}
                          >
                            Cancel
                          </Button>
                          <Button type="button" size="sm" className="rounded-full" onClick={applyImageUrl}>
                            Use URL
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="text-[11px] font-semibold text-slate-400 tabular-nums" aria-label="Character count">
                    {charCount}
                  </div>
                </div>

                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={handleFileChange}
                  aria-hidden
                />

                {previewSrc ? (
                  <div className="mt-4 w-full overflow-hidden rounded-2xl border border-white/60 bg-white/60 shadow-sm">
                    <img src={previewSrc} alt="" className="max-h-52 w-full object-contain" />
                    <div className="flex justify-end p-2">
                      <button
                        type="button"
                        className="inline-flex items-center justify-center rounded-full bg-white/70 px-3 py-1 text-[12px] font-semibold text-rose-700 shadow-sm ring-1 ring-black/[0.04] backdrop-blur-md hover:bg-white"
                        onClick={() => setImageUrl("")}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom nav intentionally hidden behind composer overlay */}
    </div>
  );
}
