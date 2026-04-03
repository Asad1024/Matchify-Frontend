/** Server sends this as the first default `message` on `/notifications/stream` so clients refetch (invitees often have NO SSE at push time). */
export const NOTIFICATIONS_STREAM_SYNC_TYPE = "_matchify_notifications_sync";

export function isNotificationsStreamSyncPayload(payload: unknown): boolean {
  return (
    typeof payload === "object" &&
    payload !== null &&
    (payload as Record<string, unknown>).type === NOTIFICATIONS_STREAM_SYNC_TYPE
  );
}
