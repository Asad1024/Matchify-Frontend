import { useEffect, useCallback } from "react";
import { buildApiUrl, getAuthHeaders } from "@/services/api";

const INTERVAL_MS = 2 * 60 * 1000;

function ping(userId: string) {
  void fetch(buildApiUrl(`/api/users/${userId}`), {
    method: "PATCH",
    headers: getAuthHeaders(true),
    credentials: "include",
    body: JSON.stringify({ lastActiveAt: new Date().toISOString() }),
  }).catch(() => {
    /* offline / mock */
  });
}

/**
 * Keeps `profile.lastActiveAt` fresh so others can see you as “online” when allowed in Settings.
 */
export function usePresenceHeartbeat(userId: string | null | undefined) {
  const send = useCallback(() => {
    if (userId) ping(userId);
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    send();
    const id = window.setInterval(send, INTERVAL_MS);
    const onVis = () => {
      if (document.visibilityState === "visible") send();
    };
    document.addEventListener("visibilitychange", onVis);

    /** After idle, interval may be up to 2m late; first click should refresh lastActiveAt. */
    const ACTIVITY_THROTTLE_MS = 45_000;
    let lastActivityPing = 0;
    const onActivity = () => {
      if (document.visibilityState !== "visible") return;
      const now = Date.now();
      if (now - lastActivityPing < ACTIVITY_THROTTLE_MS) return;
      lastActivityPing = now;
      ping(userId);
    };
    window.addEventListener("pointerdown", onActivity, { passive: true });
    window.addEventListener("keydown", onActivity);

    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pointerdown", onActivity);
      window.removeEventListener("keydown", onActivity);
    };
  }, [userId, send]);
}
