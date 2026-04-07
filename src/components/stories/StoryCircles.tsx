import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus } from "lucide-react";
import type { StoryRing } from "@/lib/storyRings";

interface StoryCirclesProps {
  rings: StoryRing[];
  onRingClick?: (userId: string) => void;
  onCreateStory?: () => void;
}

export default function StoryCircles({ rings, onRingClick, onCreateStory }: StoryCirclesProps) {
  return (
    <div className="flex min-w-min snap-x snap-mandatory gap-3 pb-1 touch-pan-x">
      <button
        onClick={onCreateStory}
        className="flex flex-col items-center gap-1.5 flex-shrink-0 snap-center"
        data-testid="button-create-story"
      >
        <div className="relative">
          <div className="h-[84px] w-[84px] rounded-full bg-gradient-to-br from-primary to-[#1F2937] flex items-center justify-center shadow-[0_10px_30px_-14px_rgba(15,23,42,0.35)] active-elevate-2">
            <Plus className="w-7 h-7 text-primary-foreground" strokeWidth={1.75} />
          </div>
        </div>
        <span className="text-[12px] text-foreground font-semibold leading-none">Add</span>
      </button>

      {rings.map((ring) => {
        const preview =
          ring.avatarUrl ||
          ring.stories[ring.stories.length - 1]?.image ||
          undefined;
        const initial = ring.displayName.slice(0, 2).toUpperCase();
        return (
          <button
            key={ring.userId}
            onClick={() => onRingClick?.(ring.userId)}
            className="flex flex-col items-center gap-1.5 flex-shrink-0 snap-center active-elevate-2"
            data-testid={`button-story-ring-${ring.userId}`}
          >
            <div className="relative">
              <div
                className={`h-[84px] w-[84px] rounded-full p-[3px] ${
                  ring.hasUnread
                    ? "bg-gradient-to-br from-primary via-[#7C3AED] to-[#06B6D4] shadow-[0_10px_30px_-14px_rgba(15,23,42,0.35)]"
                    : "bg-muted"
                }`}
              >
                <Avatar className="w-full h-full border-[3px] border-background">
                  <AvatarImage src={preview ?? undefined} alt={ring.displayName} />
                  <AvatarFallback className="text-sm font-semibold">{initial}</AvatarFallback>
                </Avatar>
              </div>
            </div>
            <span className="text-[12px] text-foreground max-w-[84px] truncate font-semibold leading-none">
              {ring.displayName}
            </span>
          </button>
        );
      })}
      {/* End spacer: keeps last ring slightly scrollable so edge clip / gradient reads as “more” */}
      <div className="w-8 shrink-0 pointer-events-none" aria-hidden />
    </div>
  );
}
