import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ChatMessageProps {
  id: string;
  content: string;
  sender: {
    id: string;
    name: string;
    image?: string;
  };
  timestamp: string;
  isCurrentUser?: boolean;
}

export default function ChatMessage({
  content,
  sender,
  timestamp,
  isCurrentUser = false
}: ChatMessageProps) {
  return (
    <div className={`flex gap-3 ${isCurrentUser ? 'flex-row-reverse' : ''}`}>
      {!isCurrentUser && (
        <Avatar className="w-8 h-8 flex-shrink-0">
          <AvatarImage src={sender.image} alt={sender.name} />
          <AvatarFallback className="text-xs">{sender.name.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
      )}
      <div className={`flex flex-col gap-1 max-w-[70%] ${isCurrentUser ? 'items-end' : 'items-start'}`}>
        <div className={`rounded-2xl px-4 py-2 ${
          isCurrentUser 
            ? 'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground' 
            : 'bg-muted text-foreground'
        }`}>
          <p className="text-sm">{content}</p>
        </div>
        <span className="text-xs text-muted-foreground px-2">{timestamp}</span>
      </div>
    </div>
  );
}
