import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

export function AutoDeleteTimer({ deleteAt }: { deleteAt: string }) {
  const [timeLeft, setTimeLeft] = useState<string>("");

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const deleteTime = new Date(deleteAt).getTime();
      const diff = deleteTime - now;

      if (diff <= 0) {
        setTimeLeft("Expired");
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setTimeLeft(`${hours}h ${minutes}m`);
    }, 1000);

    return () => clearInterval(interval);
  }, [deleteAt]);

  if (!timeLeft) return null;

  return (
    <div className="flex items-center gap-1 text-xs text-muted-foreground">
      <Clock className="w-3 h-3" />
      <span>Deletes in {timeLeft}</span>
    </div>
  );
}

