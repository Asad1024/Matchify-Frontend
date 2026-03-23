import { useState, useEffect } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Story } from "@shared/schema";

interface StoryViewerProps {
  stories: Story[];
  initialIndex: number;
  onClose: () => void;
}

export default function StoryViewer({ stories, initialIndex, onClose }: StoryViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const currentStory = stories[currentIndex];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") handlePrevious();
      if (e.key === "ArrowRight") handleNext();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex]);

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onClose();
    }
  };

  if (!currentStory) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/95 z-[10000] flex items-center justify-center"
      onClick={onClose}
      data-testid="story-viewer"
    >
      <div 
        className="relative w-full max-w-md h-[80vh] bg-black rounded-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Progress bars */}
        <div className="absolute top-0 left-0 right-0 z-10 flex gap-1 p-2">
          {stories.map((_, index) => (
            <div 
              key={index}
              className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden"
            >
              <div 
                className={`h-full bg-white transition-all duration-300 ${
                  index < currentIndex ? 'w-full' : index === currentIndex ? 'w-full' : 'w-0'
                }`}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-4 left-0 right-0 z-10 px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary to-chart-3 p-0.5">
              <div className="w-full h-full rounded-full bg-black flex items-center justify-center">
                <span className="text-xs font-bold text-white">
                  {currentStory.name.slice(0, 2).toUpperCase()}
                </span>
              </div>
            </div>
            <span className="text-white font-medium text-sm">{currentStory.name}</span>
          </div>
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

        {/* Story image */}
        <div className="w-full h-full">
          <img 
            src={currentStory.image || ''} 
            alt={currentStory.name}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Story content overlay */}
        {currentStory.content && (
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
            <p className="text-white text-base">{currentStory.content}</p>
          </div>
        )}

        {/* Navigation */}
        {currentIndex > 0 && (
          <Button
            size="icon"
            variant="ghost"
            onClick={handlePrevious}
            className="absolute left-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
            data-testid="button-previous-story"
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>
        )}
        {currentIndex < stories.length - 1 && (
          <Button
            size="icon"
            variant="ghost"
            onClick={handleNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
            data-testid="button-next-story"
          >
            <ChevronRight className="w-6 h-6" />
          </Button>
        )}
      </div>
    </div>
  );
}
