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
    <div className="min-h-screen bg-gray-50 pb-28">
      <div className="mx-auto w-full max-w-lg px-4">
        <div className="mt-4 w-full rounded-2xl border border-gray-200 bg-white p-4 pt-[max(0.75rem,env(safe-area-inset-top))] shadow-sm sm:p-5 sm:pt-[max(1rem,env(safe-area-inset-top))]">
          <div className="-mx-4 flex min-h-[3.5rem] items-center justify-between gap-3 border-b border-gray-100 px-4 pb-4 sm:-mx-5 sm:px-5">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-10 w-10 shrink-0 rounded-full text-stone-700 hover:bg-gray-100"
              onClick={() =>
                setLocation(
                  isCommunityComposer ? "/community" : `/group/${routeGroupId || selectedGroupId || ""}`,
                )
              }
              aria-label="Close"
            >
              <X className="h-5 w-5" strokeWidth={2} />
            </Button>
            <Button
              type="button"
              size="sm"
              className={cn(
                "h-8 shrink-0 rounded-full px-3.5 text-xs font-semibold shadow-sm transition-all",
                canPost
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "bg-muted text-muted-foreground opacity-80",
              )}
              disabled={!canPost}
              onClick={() =>
                createMutation.mutate({ groupId: selectedGroupId.trim() || activeGroup?.id || "" })
              }
            >
              {createMutation.isPending ? "Posting…" : "Post"}
            </Button>
          </div>

          <div className="space-y-4 pt-4">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
              <Sparkles className="h-4 w-4 shrink-0 text-primary" strokeWidth={2} />
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">New post</p>
            </div>

          {/* Avatar + compact group selector */}
          <div className="flex w-full items-center gap-2">
            <Avatar className="h-9 w-9 shrink-0 border border-gray-100 bg-white shadow-sm">
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
                    "flex h-8 w-auto max-w-[10.5rem] min-w-0 items-center gap-1.5 rounded-full border border-gray-200 bg-white px-2 py-0 text-left text-xs font-medium outline-none transition-all shadow-sm",
                    "hover:border-primary/25 hover:bg-white",
                    "focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
                  )}
                >
                  <UsersRound className="h-3 w-3 shrink-0 text-primary" aria-hidden />
                  <span
                    className={cn(
                      "min-w-0 flex-1 truncate leading-tight",
                      activeGroup ? "text-stone-900" : "text-stone-500",
                    )}
                  >
                    {activeGroup?.name ?? (isCommunityComposer ? "Choose a group" : "Select group")}
                  </span>
                  <ChevronDown
                    className={cn(
                      "h-3 w-3 shrink-0 text-stone-400 transition-transform duration-200",
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
                <p className="border-b border-stone-100 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-400">
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
            <Textarea
              id="create-post-body"
              placeholder={`Salam, ${displayFirstName}, What's new with you?`}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[200px] w-full resize-y rounded-2xl border border-gray-200 bg-gray-50/50 px-4 py-3.5 text-base leading-relaxed text-foreground shadow-sm placeholder:text-muted-foreground focus-visible:border-primary/40 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-primary/15"
            />

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={handleFileChange}
              aria-hidden
            />

            <div className="mt-3 flex w-full flex-wrap items-center gap-2 rounded-2xl border border-gray-200 bg-white px-2 py-2 shadow-sm">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-10 w-10 shrink-0 rounded-xl text-primary hover:bg-primary/10 hover:text-primary"
                disabled={uploading}
                onClick={handlePickFile}
                aria-label="Add photo"
              >
                {uploading ? <Loader2 className="h-[1.125rem] w-[1.125rem] animate-spin" /> : <ImagePlus className="h-[1.125rem] w-[1.125rem]" strokeWidth={2} />}
              </Button>

              <Popover
                open={linkPopoverOpen}
                onOpenChange={(open) => {
                  setLinkPopoverOpen(open);
                  if (open) setUrlDraft(imageUrl.trim());
                }}
              >
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 shrink-0 rounded-xl text-primary hover:bg-primary/10 hover:text-primary"
                    aria-label="Image from link"
                  >
                    <Link2 className="h-[1.125rem] w-[1.125rem]" strokeWidth={2} />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[min(calc(100vw-2rem),20rem)] p-3" align="start" sideOffset={8}>
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

              {previewSrc ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="ml-auto h-10 rounded-xl px-3 text-xs font-medium text-destructive hover:bg-destructive/10"
                  onClick={() => setImageUrl("")}
                >
                  Remove image
                </Button>
              ) : null}
            </div>

            {previewSrc ? (
              <div className="mt-4 w-full overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 shadow-sm">
                <img src={previewSrc} alt="" className="max-h-52 w-full object-contain" />
              </div>
            ) : null}
          </div>
          </div>
        </div>
      </div>
      <BottomNav active="community" />
    </div>
  );
}
