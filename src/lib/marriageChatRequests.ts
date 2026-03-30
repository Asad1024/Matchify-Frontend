/**
 * Demo client-side marriage compliment → chat request flow (pending request, approve/reject).
 * Synced via localStorage + custom events for UI refresh.
 */

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

export function setOutgoingChatRecord(fromId: string, record: OutgoingChatRecord): void {
  try {
    const raw = localStorage.getItem(outgoingKey(fromId));
    const j = raw ? (JSON.parse(raw) as Record<string, OutgoingChatRecord>) : {};
    j[record.toId] = record;
    localStorage.setItem(outgoingKey(fromId), JSON.stringify(j));
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

function writeIncoming(recipientId: string, list: IncomingChatRequest[]): void {
  localStorage.setItem(incomingKey(recipientId), JSON.stringify(list.slice(0, 80)));
  emit();
}

function senderEventsKey(fromId: string): string {
  return `${P}sender_evt_${fromId}`;
}

export function getSenderChatEvents(fromId: string): SenderChatEvent[] {
  try {
    const raw = localStorage.getItem(senderEventsKey(fromId));
    if (!raw) return [];
    const j = JSON.parse(raw);
    return Array.isArray(j) ? j : [];
  } catch {
    return [];
  }
}

function pushSenderEvent(fromId: string, ev: SenderChatEvent): void {
  const prev = getSenderChatEvents(fromId);
  prev.unshift(ev);
  localStorage.setItem(senderEventsKey(fromId), JSON.stringify(prev.slice(0, 60)));
}

/**
 * After compliment: create outgoing pending + incoming for recipient.
 */
export function createComplimentChatRequest(
  fromId: string,
  fromName: string,
  toId: string,
  toName: string,
): string {
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
  emit();
  return requestId;
}

export function respondToIncomingChatRequest(
  recipientId: string,
  requestId: string,
  decision: "approved" | "rejected",
  recipientName: string,
): void {
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
  pushSenderEvent(req.fromId, {
    id: uid(),
    at,
    read: false,
    title: decision === "approved" ? "Chat request accepted" : "Chat request declined",
    message:
      decision === "approved"
        ? `${rn} accepted your chat request. Say hello in Chat.`
        : `${rn} declined your chat request.`,
    relatedUserId: recipientId,
  });
  emit();
}

/** Merge sender events + API-style notifications for bell + list. */
export function marriageNotificationsForUser(userId: string): Array<{
  id: string;
  userId: string;
  type: "message";
  title: string;
  message: string;
  read: boolean | null;
  createdAt: string | null;
  relatedUserId?: string | null;
  marriageMeta?: { kind: "sender_event" };
}> {
  const events = getSenderChatEvents(userId);
  return events.map((e) => ({
    id: `marriage-sender-${e.id}`,
    userId,
    type: "message" as const,
    title: e.title,
    message: e.message,
    read: e.read,
    createdAt: e.at,
    relatedUserId: e.relatedUserId,
    marriageMeta: { kind: "sender_event" },
  }));
}

export function markMarriageSenderEventRead(userId: string, syntheticId: string): void {
  const realId = syntheticId.replace(/^marriage-sender-/, "");
  const list = getSenderChatEvents(userId);
  const next = list.map((x) => (x.id === realId ? { ...x, read: true } : x));
  localStorage.setItem(senderEventsKey(userId), JSON.stringify(next));
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
  emit();
}
