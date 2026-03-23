import { Button } from "@/components/ui/button";

const ICEBREAKERS = [
  "What's your favorite way to spend a weekend?",
  "If you could travel anywhere, where would you go?",
  "What's the best book you've read recently?",
  "What's your go-to comfort food?",
  "What's something you're passionate about?",
];

export function Icebreakers({ onSelect }: { onSelect: (text: string) => void }) {
  return (
    <div className="p-3 bg-muted rounded-lg">
      <p className="text-xs font-medium mb-2">💬 Icebreakers</p>
      <div className="flex flex-wrap gap-2">
        {ICEBREAKERS.map((icebreaker, i) => (
          <Button
            key={i}
            size="sm"
            variant="outline"
            className="text-xs"
            onClick={() => onSelect(icebreaker)}
          >
            {icebreaker}
          </Button>
        ))}
      </div>
    </div>
  );
}

