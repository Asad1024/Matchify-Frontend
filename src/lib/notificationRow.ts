/**
 * Normalize notification rows from the API. Sequelize / drivers may expose snake_case fields;
 * Accept/Decline for marriage/chat requests require `relatedEntityId` (request id).
 */
export function normalizeNotificationRowFromApi(raw: unknown): {
  relatedUserId: string | null;
  relatedEntityId: string | null;
} {
  if (!raw || typeof raw !== "object") {
    return { relatedUserId: null, relatedEntityId: null };
  }
  const o = raw as Record<string, unknown>;
  const ru = o.relatedUserId ?? o.related_user_id;
  const re = o.relatedEntityId ?? o.related_entity_id;
  return {
    relatedUserId: ru != null && String(ru) !== "" ? String(ru) : null,
    relatedEntityId: re != null && String(re) !== "" ? String(re) : null,
  };
}

/**
 * Social `chat_request` uses `notifications.id === relatedEntityId` (PATCH findByPk).
 * Marriage compliments now follow the same; older rows may only have `id` if entity id was omitted in JSON.
 * Local synthetic marriage rows use `marriage-sender-*` ids — never use those as the PATCH segment.
 */
export function notificationRequestIdForPatch(row: {
  id: string;
  type: string;
  relatedEntityId?: string | null;
}): string {
  const re = row.relatedEntityId != null ? String(row.relatedEntityId).trim() : "";
  if (re) return re;
  if (row.type !== "marriage_chat_request" && row.type !== "chat_request") return "";
  const id = String(row.id || "").trim();
  if (!id || id.startsWith("marriage-sender-")) return "";
  return id;
}
