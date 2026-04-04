/**
 * Demo client-side marriage compliment → chat request flow (pending request, approve/reject).
 * Synced via localStorage + custom events for UI refresh.
 */

import { buildApiUrl, getAuthHeaders } from "@/services/api";
import { markClientStateDirty } from "@/lib/clientStateSync";

const P = "matchify_marriage_chat_v1_";

export type OutgoingChatStatus = "pending" | "cancelled" | "approved" | "rejected";

export type OutgoingChatRecord = {
  toId: string;
  at: string;
  status: OutgoingChatStatus;
  requestId: string;
};

export type IncomingChatRequest = {
  id: string;
  fromId: string;
  fromName: string;
  at: string;
  status: "pending" | "approved" | "rejected";
};

export type SenderChatEvent = {
  id: string;
  at: string;
  read: boolean;
  title: string;
  message: string;
  relatedUserId: string;
  kind?: "sender_event" | "incoming_request" | "outgoing_request";
  /** Incoming compliment / chat request id (matches server `relatedEntityId`). */
  requestId?: string;
};

function emit(): void {
  try {
    window.dispatchEvent(new Event("matchify-marriage-chat-updated"));
  } catch {
    /* ignore */
  }
}

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function outgoingKey(fromId: string): string {
  return `${P}out_${fromId}`;
}

export function getOutgoingChatRequest(fromId: string, toId: string): OutgoingChatRecord | null {
  try {
    const raw = localStorage.getItem(outgoingKey(fromId));
    if (!raw) return null;
    const j = JSON.parse(raw) as Record<string, OutgoingChatRecord>;
    const r = j?.[toId];
    return r && typeof r.requestId === "string" ? r : null;
  } catch {
    return null;
  }
}

export async function getOutgoingChatRequestRemote(
  fromId: string,
  toId: string,
): Promise<OutgoingChatRecord | null> {
  if (!fromId || !toId) return null;
  try {
    const res = await fetch(buildApiUrl(`/api/users/${fromId}/marriage/chat-requests/outgoing/${toId}`), {
      method: "GET",
      headers: { ...getAuthHeaders(false) },
      credentials: "include",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as OutgoingChatRecord | null;
    return data && typeof data.requestId === "string" ? data : null;
  } catch {
    return null;
  }
}

export function setOutgoingChatRecord(fromId: string, record: OutgoingChatRecord): void {
  try {
    const raw = localStorage.getItem(outgoingKey(fromId));
    const j = raw ? (JSON.parse(raw) as Record<string, OutgoingChatRecord>) : {};
    j[record.toId] = record;
    localStorage.setItem(outgoingKey(fromId), JSON.stringify(j));
    markClientStateDirty();
  } catch {
    /* ignore */
  }
  emit();
}

export function cancelOutgoingChatRequest(fromId: string, toId: string): void {
  const cur = getOutgoingChatRequest(fromId, toId);
  if (!cur || cur.status !== "pending") return;
  setOutgoingChatRecord(fromId, { ...cur, status: "cancelled" });
  const list = getIncomingChatRequests(toId).filter((x) => x.id !== cur.requestId);
  writeIncoming(toId, list);
}

function incomingKey(recipientId: string): string {
  return `${P}in_${recipientId}`;
}

export function getIncomingChatRequests(recipientId: string): IncomingChatRequest[] {
  try {
    const raw = localStorage.getItem(incomingKey(recipientId));
    if (!raw) return [];
    const j = JSON.parse(raw);
    return Array.isArray(j) ? j : [];
  } catch {
    return [];
  }
}

export async function getIncomingChatRequestsRemote(
  recipientId: string,
): Promise<IncomingChatRequest[]> {
  if (!recipientId) return [];
  try {
    const res = await fetch(buildApiUrl(`/api/users/${recipientId}/marriage/chat-requests/incoming`), {
      method: "GET",
      headers: { ...getAuthHeaders(false) },
      credentials: "include",
    });
    if (!res.ok) return [];
    const data = (await res.json()) as IncomingChatRequest[];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

/**
 * PATCH approve/reject for a marriage compliment chat request.
 * If `requestId` is missing or not found on the server but `fromUserId` is known,
 * resolves the pending row from GET incoming and PATCHes that id.
 */
export async function patchMarriageIncomingDecision(
  recipientId: string,
  requestId: string,
  decision: "approved" | "rejected",
  options?: { fromUserId?: string | null },
): Promise<unknown> {
  const resolvePendingIdFromSender = async (): Promise<string | null> => {
    const from = options?.fromUserId?.trim();
    if (!from) return null;
    const incoming = await getIncomingChatRequestsRemote(recipientId);
    const alt = incoming.find((x) => x.fromId === from && x.status === "pending");
    return alt?.id ?? null;
  };

  let rid = requestId.trim();
  if (!rid) {
    rid = (await resolvePendingIdFromSender()) ?? "";
    if (!rid) {
      throw new Error(JSON.stringify({ message: "Request not found" }));
    }
  }

  const bodyPayload = (): string =>
    JSON.stringify({
      decision,
      ...(options?.fromUserId?.trim() ? { fromUserId: options.fromUserId.trim() } : {}),
    });

  let res = await fetch(
    buildApiUrl(`/api/users/${recipientId}/marriage/chat-requests/${encodeURIComponent(rid)}`),
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...getAuthHeaders(false) },
      credentials: "include",
      body: bodyPayload(),
    },
  );

  if (res.status === 404 && options?.fromUserId) {
    const altId = await resolvePendingIdFromSender();
    if (altId && altId !== rid) {
      rid = altId;
      res = await fetch(
        buildApiUrl(`/api/users/${recipientId}/marriage/chat-requests/${encodeURIComponent(rid)}`),
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json", ...getAuthHeaders(false) },
          credentials: "include",
          body: bodyPayload(),
        },
      );
    }
  }

  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(t || `Failed (${res.status})`);
  }
  return res.json();
}

function writeIncoming(recipientId: string, list: IncomingChatRequest[]): void {
  localStorage.setItem(incomingKey(recipientId), JSON.stringify(list.slice(0, 80)));
  markClientStateDirty();
  emit();
}

function userEventsKey(userId: string): string {
  return `${P}user_evt_${userId}`;
}

export function getUserChatEvents(userId: string): SenderChatEvent[] {
  try {
    const raw = localStorage.getItem(userEventsKey(userId));
    if (!raw) return [];
    const j = JSON.parse(raw);
    return Array.isArray(j) ? j : [];
  } catch {
    return [];
  }
}

function pushUserEvent(userId: string, ev: SenderChatEvent): void {
  const prev = getUserChatEvents(userId);
  prev.unshift(ev);
  localStorage.setItem(userEventsKey(userId), JSON.stringify(prev.slice(0, 80)));
  markClientStateDirty();
}

/**
 * After compliment: create outgoing pending + incoming for recipient.
 */
export async function createComplimentChatRequest(
  fromId: string,
  fromName: string,
  toId: string,
  toName: string,
  message?: string,
): Promise<string> {
  const requestId = uid();
  const at = new Date().toISOString();
  setOutgoingChatRecord(fromId, {
    toId,
    at,
    status: "pending",
    requestId,
  });
  const incoming = getIncomingChatRequests(toId).filter((x) => !(x.fromId === fromId && x.status === "pending"));
  incoming.unshift({
    id: requestId,
    fromId,
    fromName: fromName.trim() || "Someone",
    at,
    status: "pending",
  });
  writeIncoming(toId, incoming);

  const safeTo = toName.trim() || "this member";
  // Sender gets an immediate "sent" notification.
  pushUserEvent(fromId, {
    id: uid(),
    at,
    read: false,
    title: "Compliment sent",
    message: `You sent a compliment to ${safeTo}. You'll be notified when they respond.`,
    relatedUserId: toId,
    kind: "outgoing_request",
  });

  let finalRequestId = requestId;
  // Mirror to backend for cross-browser consistency.
  try {
    const res = await fetch(buildApiUrl(`/api/users/${fromId}/marriage/chat-requests`), {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeaders(false) },
      credentials: "include",
      body: JSON.stringify({ toId, message: (message || "").trim() || undefined }),
    });
    if (res.ok) {
      const j = (await res.json()) as { requestId?: string };
      const serverRequestId = j?.requestId;
      if (serverRequestId && serverRequestId !== requestId) {
        setOutgoingChatRecord(fromId, {
          toId,
          at,
          status: "pending",
          requestId: serverRequestId,
        });
        const inc = getIncomingChatRequests(toId);
        const fixed = inc.map((row) =>
          row.id === requestId && row.status === "pending" ? { ...row, id: serverRequestId } : row,
        );
        writeIncoming(toId, fixed);
        finalRequestId = serverRequestId;
      } else if (serverRequestId) {
        finalRequestId = serverRequestId;
      }
    }
  } catch {
    /* fallback to local only */
  }

  // Recipient row uses final id so Accept/Decline PATCH matches the server when POST succeeded
  // (avoids stale client ids in shared localStorage / same-browser multi-account testing).
  pushUserEvent(toId, {
    id: uid(),
    at,
    read: false,
    title: "New compliment request",
    message: `${fromName.trim() || "Someone"} sent you a compliment and chat request.`,
    relatedUserId: fromId,
    kind: "incoming_request",
    requestId: finalRequestId,
  });

  emit();
  return finalRequestId;
}

export async function respondToIncomingChatRequest(
  recipientId: string,
  requestId: string,
  decision: "approved" | "rejected",
  recipientName: string,
): Promise<void> {
  const list = getIncomingChatRequests(recipientId);
  const idx = list.findIndex((x) => x.id === requestId);
  if (idx < 0) return;
  const req = list[idx];
  if (req.status !== "pending") return;
  const next = [...list];
  next[idx] = { ...req, status: decision };
  writeIncoming(recipientId, next);

  const outgoing = getOutgoingChatRequest(req.fromId, recipientId);
  if (outgoing && outgoing.requestId === requestId) {
    setOutgoingChatRecord(req.fromId, {
      ...outgoing,
      status: decision === "approved" ? "approved" : "rejected",
    });
  }

  const at = new Date().toISOString();
  const rn = recipientName.trim() || "They";
  pushUserEvent(req.fromId, {
    id: uid(),
    at,
    read: false,
    title: decision === "approved" ? "Chat request accepted" : "Chat request declined",
    message:
      decision === "approved"
        ? `${rn} accepted your chat request. Say hello in Chat.`
        : `${rn} declined your chat request.`,
    relatedUserId: recipientId,
    kind: "sender_event",
  });
  // Optional confirmation for recipient action history.
  pushUserEvent(recipientId, {
    id: uid(),
    at,
    read: true,
    title: decision === "approved" ? "You approved a request" : "You declined a request",
    message:
      decision === "approved"
        ? `You approved ${req.fromName}'s chat request.`
        : `You declined ${req.fromName}'s chat request.`,
    relatedUserId: req.fromId,
    kind: "incoming_request",
  });
  // Mirror to backend for cross-browser consistency.
  try {
    await fetch(
      buildApiUrl(`/api/users/${recipientId}/marriage/chat-requests/${encodeURIComponent(requestId)}`),
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getAuthHeaders(false) },
        credentials: "include",
        body: JSON.stringify({ decision, fromUserId: req.fromId }),
      },
    );
  } catch {
    /* fallback remains local */
  }
  emit();
}

/**
 * If the DB already returned a marriage compliment row for sender `relatedUserId`, drop the
 * localStorage synthetic duplicate (it may carry a stale client-generated request id).
 */
export function filterMarriageSyntheticDuplicatesAgainstApi<
  T extends { id: string; type: string; relatedUserId?: string | null },
>(marriageRows: T[], apiRows: T[]): T[] {
  const apiSenders = new Set(
    apiRows
      .filter((n) => n.type === "marriage_chat_request" && n.relatedUserId)
      .map((n) => String(n.relatedUserId)),
  );
  return marriageRows.filter((m) => {
    if (m.type !== "marriage_chat_request" || !m.relatedUserId) return true;
    if (!m.id.startsWith("marriage-sender-")) return true;
    return !apiSenders.has(String(m.relatedUserId));
  });
}

/** Merge sender events + API-style notifications for bell + list. */
export function marriageNotificationsForUser(userId: string): Array<{
  id: string;
  userId: string;
  type: "message" | "marriage_chat_request";
  title: string;
  message: string;
  read: boolean | null;
  createdAt: string | null;
  relatedUserId?: string | null;
  relatedEntityId?: string | null;
  marriageMeta?: { kind: "sender_event" | "incoming_request" | "outgoing_request" };
}> {
  const events = getUserChatEvents(userId);
  return events.map((e) => {
    const incomingCompliment =
      e.kind === "incoming_request" &&
      e.title === "New compliment request" &&
      Boolean(e.requestId?.trim());
    return {
      id: `marriage-sender-${e.id}`,
      userId,
      type: incomingCompliment ? ("marriage_chat_request" as const) : ("message" as const),
      title: e.title,
      message: e.message,
      read: e.read,
      createdAt: e.at,
      relatedUserId: e.relatedUserId,
      relatedEntityId: incomingCompliment ? e.requestId ?? null : null,
      marriageMeta: { kind: e.kind || "sender_event" },
    };
  });
}

export function markMarriageSyntheticNotificationRead(userId: string, syntheticId: string): void {
  const realId = syntheticId.replace(/^marriage-sender-/, "");
  const list = getUserChatEvents(userId);
  const next = list.map((x) => (x.id === realId ? { ...x, read: true } : x));
  localStorage.setItem(userEventsKey(userId), JSON.stringify(next));
  markClientStateDirty();
  emit();
}

/** Remove a merged marriage sender event from localStorage (Notifications page delete). */
export function removeMarriageSyntheticNotification(userId: string, syntheticId: string): void {
  const realId = syntheticId.replace(/^marriage-sender-/, "");
  const list = getUserChatEvents(userId);
  const next = list.filter((x) => x.id !== realId);
  if (next.length === list.length) return;
  localStorage.setItem(userEventsKey(userId), JSON.stringify(next));
  markClientStateDirty();
  emit();
}

export function isMarriageSyntheticNotificationId(id: string): boolean {
  return id.startsWith("marriage-sender-");
}

/** Dev/testing: remove all compliment / chat-request demo rows from localStorage. */
export function clearMarriageChatLocalStorageForTesting(): void {
  if (typeof localStorage === "undefined") return;
  try {
    const toRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith(P)) toRemove.push(k);
    }
    for (const k of toRemove) {
      localStorage.removeItem(k);
    }
  } catch {
    /* ignore */
  }
  markClientStateDirty();
  emit();
}
