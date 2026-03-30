import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  getIncomingChatRequests,
  respondToIncomingChatRequest,
} from "@/lib/marriageChatRequests";

type Props = {
  recipientId: string;
  recipientName: string;
};

export function MarriageIncomingRequestsBanner({ recipientId, recipientName }: Props) {
  const [epoch, setEpoch] = useState(0);

  useEffect(() => {
    const onUpd = () => setEpoch((e) => e + 1);
    window.addEventListener("matchify-marriage-chat-updated", onUpd);
    return () => window.removeEventListener("matchify-marriage-chat-updated", onUpd);
  }, []);

  void epoch;
  const pending = getIncomingChatRequests(recipientId).filter((x) => x.status === "pending");
  if (!pending.length) return null;

  return (
    <Card className="mb-4 border-primary/25 bg-primary/[0.06] shadow-sm">
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center gap-2 text-sm font-bold text-foreground">
          <MessageCircle className="h-4 w-4 text-primary" strokeWidth={2} />
          Chat requests
        </div>
        <ul className="space-y-3">
          {pending.map((req) => (
            <li
              key={req.id}
              className="flex flex-col gap-2 rounded-xl border border-stone-200/80 bg-white p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <p className="text-sm text-stone-800">
                <span className="font-semibold">{req.fromName}</span> sent a chat request (Marriage).
              </p>
              <div className="flex shrink-0 gap-2">
                <Button
                  type="button"
                  size="sm"
                  className="rounded-full"
                  onClick={() =>
                    respondToIncomingChatRequest(recipientId, req.id, "approved", recipientName)
                  }
                >
                  Approve
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="rounded-full"
                  onClick={() =>
                    respondToIncomingChatRequest(recipientId, req.id, "rejected", recipientName)
                  }
                >
                  Decline
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
