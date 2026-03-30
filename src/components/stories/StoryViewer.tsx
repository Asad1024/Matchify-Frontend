import { useState, useEffect, useCallback } from "react";
import { X, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Story } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { humanStorySlideFallback } from "@/lib/humanPlaceholderImages";

const STORY_MS = 5500;

function storySlideImageUrl(story: Story): string {
  if (story.image?.trim()) return story.image.trim();
  return humanStorySlideFallback(story.id);
}

interface StoryViewerProps {
  stories: Story[];
  initialIndex: number;
  currentUserId: string;
  onClose: () => void;
}

export default function StoryViewer({
  stories,
  initialIndex,
  currentUserId,
  onClose,
}: StoryViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [barPct, setBarPct] = useState(0);
  const { toast } = useToast();
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => {
      if (prev < stories.length - 1) return prev + 1;
      onClose();
      return prev;
    });
  }, [stories.length, onClose]);

  const handlePrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : prev));
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") handlePrevious();
      if (e.key === "ArrowRight") handleNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, handlePrevious, handleNext]);

  useEffect(() => {
    if (reduceMotion) {
      setBarPct(100);
      return;
    }
    setBarPct(0);
    let cancelled = false;
    const start = performance.now();
    let raf = 0;
    let advanced = false;
    const step = () => {
      if (cancelled) return;
      const elapsed = performance.now() - start;
      const p = Math.min(100, (elapsed / STORY_MS) * 100);
      setBarPct(p);
      if (elapsed >= STORY_MS) {
        if (!advanced) {
          advanced = true;
          handleNext();
        }
        return;
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [currentIndex, reduceMotion, handleNext]);

  const deleteMutation = useMutation({
    mutationFn: async (storyId: string) => {
      const q = new URLSearchParams({ userId: currentUserId });
      const res = await apiRequest("DELETE", `/api/stories/${storyId}?${q.toString()}`);
      return res;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/stories"] });
      toast({ title: "Story removed" });
      onClose();
    },
    onError: () => {
      toast({
        title: "Could not remove story",
        variant: "destructive",
      });
    },
  });

  const currentStory = stories[currentIndex];
  if (!currentStory) return null;

  const author = currentStory.user;
  const displayName = author?.name?.trim() || "Member";
  const avatarUrl = author?.avatar ?? null;
  const slideUrl = storySlideImageUrl(currentStory);
  const isOwn = currentStory.userId === currentUserId;

  return (
    <div
      className="fixed inset-0 bg-black/95 z-[10000] flex items-center justify-center"
      onClick={onClose}
      data-testid="story-viewer"
    >
      <div
        className="relative w-full max-w-md h-[80vh] bg-black rounded-lg overflow-hidden touch-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Tap zones only below the header so close / delete / avatar stay clickable */}
        <div className="absolute left-0 right-0 top-[4.5rem] bottom-0 z-[5] flex">
          <button
            type="button"
            aria-label="Previous story"
            className="flex-1 h-full bg-transparent cursor-w-resize"
            onClick={(e) => {
              e.stopPropagation();
              handlePrevious();
            }}
          />
          <button
            type="button"
            aria-label="Next story"
            className="flex-1 h-full bg-transparent cursor-e-resize"
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
          />
        </div>

        <div className="absolute top-0 left-0 right-0 z-30 flex gap-1 p-2 pointer-events-none">
          {stories.map((_, index) => {
            let fill = 0;
            if (index < currentIndex) fill = 100;
            else if (index === currentIndex) fill = barPct;
            return (
              <div
                key={stories[index].id}
                className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden"
              >
                <div
                  className="h-full bg-white transition-none"
                  style={{ width: `${fill}%` }}
                />
              </div>
            );
          })}
        </div>

        <div className="absolute top-4 left-0 right-0 z-30 px-4 flex items-center justify-between pointer-events-auto">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-9 h-9 rounded-full bg-gradient-to-r from-primary to-chart-3 p-0.5 shrink-0">
              <Avatar className="w-full h-full border-0">
                <AvatarImage src={avatarUrl ?? undefined} alt={displayName} />
                <AvatarFallback className="text-xs bg-black text-white">
                  {displayName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-white font-semibold text-sm truncate">{displayName}</span>
              {currentStory.name ? (
                <span className="text-white/70 text-xs truncate">{currentStory.name}</span>
              ) : null}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {isOwn && (
              <Button
                size="icon"
                variant="ghost"
                className="text-white hover:bg-white/20"
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(currentStory.id)}
                aria-label="Delete story"
                data-testid="button-delete-story"
              >
                <Trash2 className="w-5 h-5" />
              </Button>
            )}
            <Button
              size="icon"
              variant="ghost"
              onClick={onClose}
              className="text-white hover:bg-white/20"
              data-testid="button-close-story"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="relative z-0 h-full w-full">
          <img
            src={slideUrl}
            alt=""
            referrerPolicy="no-referrer"
            className="pointer-events-none h-full w-full object-cover"
          />
        </div>

        {currentStory.content ? (
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/80 to-transparent p-6">
            <p className="text-white text-base">{currentStory.content}</p>
          </div>
        ) : null}

        {currentIndex > 0 && (
          <Button
            size="icon"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              handlePrevious();
            }}
            className="pointer-events-auto absolute left-2 top-1/2 z-30 -translate-y-1/2 text-white hover:bg-white/20"
            data-testid="button-previous-story"
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>
        )}
        {currentIndex < stories.length - 1 && (
          <Button
            size="icon"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            className="pointer-events-auto absolute right-2 top-1/2 z-30 -translate-y-1/2 text-white hover:bg-white/20"
            data-testid="button-next-story"
          >
            <ChevronRight className="w-6 h-6" />
          </Button>
        )}
      </div>
    </div>
  );
}
