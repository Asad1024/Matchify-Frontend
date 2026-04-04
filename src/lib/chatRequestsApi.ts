import { queryClient } from "@/lib/queryClient";
import { apiRequestJson } from "@/services/api";

export type OutgoingChatRequestStatus = "none" | "pending" | "declined" | "accepted";

export type ChatRequestPairResponse = { outgoingStatus: OutgoingChatRequestStatus };

export type ChatRequestSummaryUser = { id: string; name: string; avatar: string | null };

export type ChatRequestIncomingRow = {
  requestId: string;
  notificationId: string;
  status: "pending" | "accepted" | "declined";
  previewMessage: string;
  createdAt: string | null;
  otherUser: ChatRequestSummaryUser;
};

export type ChatRequestOutgoingRow = {
  requestId: string;
  notificationId: string;
  status: "pending" | "declined";
  createdAt: string | null;
  otherUser: ChatRequestSummaryUser;
};

export type ChatRequestsSummaryResponse = {
  incoming: ChatRequestIncomingRow[];
  outgoing: ChatRequestOutgoingRow[];
};

export function chatRequestPairQueryKey(userId: string, otherUserId: string) {
  return ["/api/users", userId, "chat-requests", "pair", otherUserId] as const;
}

export function chatRequestsSummaryQueryKey(userId: string) {
  return ["/api/users", userId, "chat-requests", "summary"] as const;
}

export function fetchChatRequestPair(userId: string, otherUserId: string): Promise<ChatRequestPairResponse> {
  return apiRequestJson<ChatRequestPairResponse>(
    "GET",
    `/api/users/${encodeURIComponent(userId)}/chat-requests/pair/${encodeURIComponent(otherUserId)}`,
  );
}

export function fetchChatRequestsSummary(userId: string): Promise<ChatRequestsSummaryResponse> {
  return apiRequestJson<ChatRequestsSummaryResponse>(
    "GET",
    `/api/users/${encodeURIComponent(userId)}/chat-requests/summary`,
  );
}

/** After sending a request or responding to one, refresh pair + summary lists. */
export function refreshChatRequestQueries(userId: string, otherUserId?: string) {
  if (otherUserId) {
    void queryClient.invalidateQueries({ queryKey: chatRequestPairQueryKey(userId, otherUserId) });
  }
  void queryClient.invalidateQueries({ queryKey: ["/api/users", userId, "chat-requests"] });
}

export function optimisticMarkPairPending(fromUserId: string, toUserId: string) {
  queryClient.setQueryData<ChatRequestPairResponse>(chatRequestPairQueryKey(fromUserId, toUserId), {
    outgoingStatus: "pending",
  });
}
