import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus } from "lucide-react";

interface Story {
  id: string;
  name: string;
  image?: string;
  hasUnread?: boolean;
}

interface StoryCirclesProps {
  stories: Story[];
  onStoryClick?: (id: string) => void;
  onCreateStory?: () => void;
}

export default function StoryCircles({ stories, onStoryClick, onCreateStory }: StoryCirclesProps) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory scroll-smooth touch-pan-x">
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

      {stories.map((story) => (
        <button
          key={story.id}
          onClick={() => onStoryClick?.(story.id)}
          className="flex flex-col items-center gap-2 flex-shrink-0 snap-center active-elevate-2"
          data-testid={`button-story-${story.id}`}
        >
          <div className="relative">
            <div className={`w-20 h-20 rounded-full p-[3px] ${
              story.hasUnread 
                ? 'bg-gradient-to-br from-primary via-primary to-chart-2 shadow-lg shadow-primary/30' 
                : 'bg-border'
            }`}>
              <Avatar className="w-full h-full border-[3px] border-background">
                <AvatarImage src={story.image} alt={story.name} />
                <AvatarFallback className="text-sm font-semibold">{story.name.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
            </div>
          </div>
          <span className="text-xs text-foreground max-w-[80px] truncate font-medium">{story.name}</span>
        </button>
      ))}
    </div>
  );
}
