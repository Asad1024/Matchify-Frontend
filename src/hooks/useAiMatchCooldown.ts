import { useEffect, useState } from "react";
import { AI_MATCH_COOLDOWN_MS } from "@/lib/matchifyBranding";

function parseServerMs(iso: string | null | undefined): number {
  if (!iso || typeof iso !== "string") return 0;
  const t = Date.parse(iso);
  return Number.isFinite(t) ? t : 0;
}

/** Cooldown from server `lastAiMatchClaimedAt` only — consistent across browsers/devices. */
export function getMsUntilNextAiMatch(serverLastClaimedAt?: string | null): number {
  const lastClaimed = parseServerMs(serverLastClaimedAt);
  if (!lastClaimed) return 0;
  const elapsed = Date.now() - lastClaimed;
  return Math.max(0, AI_MATCH_COOLDOWN_MS - elapsed);
}

/** Persist cooldown on server (profile `lastAiMatchClaimedAt`). */
export async function recordAiMatchClaimed(userId: string): Promise<void> {
  const now = Date.now();
  try {
    const res = await fetch(`/api/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lastAiMatchClaimedAt: new Date(now).toISOString() }),
      credentials: "include",
    });
    if (res.ok) {
      const { queryClient } = await import("@/lib/queryClient");
      await queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}`] });
    }
  } catch {
    /* offline */
  }
}

export function formatCountdown(ms: number): string {
  if (ms <= 0) return "Ready now";
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h >= 48) return `${Math.floor(h / 24)}d ${h % 24}h`;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function useAiMatchCooldown(
  tickMs = 1000,
  serverLastClaimedAt?: string | null,
): { msLeft: number; ready: boolean } {
  const [msLeft, setMsLeft] = useState(() => getMsUntilNextAiMatch(serverLastClaimedAt));

  useEffect(() => {
    setMsLeft(getMsUntilNextAiMatch(serverLastClaimedAt));
  }, [serverLastClaimedAt]);

  useEffect(() => {
    const id = window.setInterval(() => {
      setMsLeft(getMsUntilNextAiMatch(serverLastClaimedAt));
    }, tickMs);
    return () => window.clearInterval(id);
  }, [tickMs, serverLastClaimedAt]);

  return { msLeft, ready: msLeft === 0 };
}
