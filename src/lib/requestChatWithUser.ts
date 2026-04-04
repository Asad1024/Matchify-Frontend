import { buildApiUrl, getAuthHeaders } from "@/services/api";
import { queryClient } from "@/lib/queryClient";
import type { MembershipTier } from "@/lib/entitlements";
import { optimisticMarkPairPending, refreshChatRequestQueries } from "@/lib/chatRequestsApi";

export const DEFAULT_CHAT_REQUEST_MESSAGE = "Hey! I’d love to chat with you.";

export type RequestChatToastFn = (props: {
  title: string;
  description?: string;
  variant?: "default" | "destructive";
}) => void;

export type OpenUpgradeFn = (args: {
  feature: string;
  minTier: MembershipTier;
  reason?: string;
}) => void;

export type PostChatRequestResult =
  | { ok: true }
  | {
      ok: false;
      message: string;
      code?: string;
      minTier?: MembershipTier;
      limit?: number;
      used?: number;
    };

function parseMinTier(raw: unknown): MembershipTier | undefined {
  const t = String(raw || "").toLowerCase().trim();
  if (t === "plus" || t === "premium" || t === "elite") return t;
  return undefined;
}

/** POST `/api/users/:fromUserId/chat-requests` — recipient gets accept/decline notification. */
export async function postChatRequestToUser(params: {
  fromUserId: string;
  toUserId: string;
  message?: string;
}): Promise<PostChatRequestResult> {
  const fromUserId = String(params.fromUserId || "").trim();
  const toUserId = String(params.toUserId || "").trim();
  if (!fromUserId || !toUserId) {
    return { ok: false, message: "Missing user." };
  }
  if (fromUserId === toUserId) {
    return { ok: false, message: "You can’t message yourself." };
  }
  const message =
    String(params.message ?? DEFAULT_CHAT_REQUEST_MESSAGE).trim() || DEFAULT_CHAT_REQUEST_MESSAGE;
  const res = await fetch(
    buildApiUrl(`/api/users/${encodeURIComponent(fromUserId)}/chat-requests`),
    {
      method: "POST",
      headers: getAuthHeaders(true),
      credentials: "include",
      body: JSON.stringify({ toId: toUserId, message }),
    },
  );
  if (res.ok) {
    void queryClient.invalidateQueries({ queryKey: ["/api/users", fromUserId, "notifications"] });
    optimisticMarkPairPending(fromUserId, toUserId);
    refreshChatRequestQueries(fromUserId, toUserId);
    return { ok: true };
  }
  const err = (await res.json().catch(() => ({}))) as {
    message?: string;
    code?: string;
    minTier?: unknown;
    limit?: number;
    used?: number;
  };
  if (res.status === 429 && err.code === "CHAT_REQUEST_DAILY_LIMIT") {
    return {
      ok: false,
      message: err.message || "Daily message request limit reached.",
      code: err.code,
      minTier: parseMinTier(err.minTier) ?? "plus",
      limit: err.limit,
      used: err.used,
    };
  }
  return { ok: false, message: err.message || `Could not send request (${res.status})` };
}

/**
 * Send a message request (not an immediate DM). Recipient sees accept/decline in notifications.
 * When not signed in: toast + `/login` unless `allowGuestNavigateToChat` opens legacy `/chat?user=`.
 */
export async function requestChatWithUser(options: {
  fromUserId: string | null | undefined;
  toUserId: string;
  message?: string;
  setLocation: (path: string) => void;
  toast: RequestChatToastFn;
  allowGuestNavigateToChat?: boolean;
  /** When daily limit hit (429), opens upgrade dialog instead of only an error toast. */
  openUpgrade?: OpenUpgradeFn;
}): Promise<void> {
  const {
    fromUserId,
    toUserId,
    message,
    setLocation,
    toast,
    allowGuestNavigateToChat = false,
    openUpgrade,
  } = options;

  const tid = String(toUserId || "").trim();
  if (!tid) return;

  if (!fromUserId) {
    if (allowGuestNavigateToChat) {
      setLocation(`/chat?user=${encodeURIComponent(tid)}`);
      return;
    }
    toast({
      title: "Sign in required",
      description: "Sign in to send a message request.",
      variant: "destructive",
    });
    setLocation("/login");
    return;
  }

  if (String(fromUserId) === tid) {
    toast({
      title: "That’s you",
      description: "You can’t message yourself.",
      variant: "destructive",
    });
    return;
  }

  const result = await postChatRequestToUser({
    fromUserId: String(fromUserId),
    toUserId: tid,
    message,
  });
  if (result.ok) {
    toast({
      title: "Request sent",
      description: "They’ll get a notification to accept or decline.",
    });
    return;
  }
  if (
    result.code === "CHAT_REQUEST_DAILY_LIMIT" &&
    result.minTier &&
    openUpgrade
  ) {
    openUpgrade({
      feature: "More message requests",
      minTier: result.minTier,
      reason: result.message,
    });
    return;
  }
  toast({ title: "Could not send request", description: result.message, variant: "destructive" });
}
