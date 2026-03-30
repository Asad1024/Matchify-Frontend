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
        className="flex flex-col items-center gap-2 flex-shrink-0 snap-center"
        data-testid="button-create-story"
      >
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/20 active-elevate-2">
            <Plus className="w-7 h-7 text-primary-foreground" />
          </div>
        </div>
        <span className="text-xs text-muted-foreground font-medium">Add</span>
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
            className="flex flex-col items-center gap-2 flex-shrink-0 snap-center active-elevate-2"
            data-testid={`button-story-ring-${ring.userId}`}
          >
            <div className="relative">
              <div
                className={`w-20 h-20 rounded-full p-[3px] ${
                  ring.hasUnread
                    ? "bg-gradient-to-br from-primary via-primary to-chart-2 shadow-lg shadow-primary/30"
                    : "bg-border"
                }`}
              >
                <Avatar className="w-full h-full border-[3px] border-background">
                  <AvatarImage src={preview ?? undefined} alt={ring.displayName} />
                  <AvatarFallback className="text-sm font-semibold">{initial}</AvatarFallback>
                </Avatar>
              </div>
            </div>
            <span className="text-xs text-foreground max-w-[80px] truncate font-medium">
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
