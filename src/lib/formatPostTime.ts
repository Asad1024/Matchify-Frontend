/** Short relative labels: "Just now", "1 min", "5 min", "1 hour", "3 days", … */

export function formatPostRelativeTime(iso: string | Date | null | undefined): string {
  if (!iso) return "";
  const t = typeof iso === "string" ? Date.parse(iso) : iso.getTime();
  if (!Number.isFinite(t)) return "";

  const sec = Math.max(0, Math.floor((Date.now() - t) / 1000));
  if (sec < 45) return "Just now";

  const mins = Math.floor(sec / 60);
  if (mins < 60) return mins === 1 ? "1 min" : `${mins} min`;

  const hours = Math.floor(mins / 60);
  if (hours < 24) return hours === 1 ? "1 hour" : `${hours} hours`;

  const days = Math.floor(hours / 24);
  if (days < 7) return days === 1 ? "1 day" : `${days} days`;

  const weeks = Math.floor(days / 7);
  if (weeks < 5) return weeks === 1 ? "1 week" : `${weeks} weeks`;

  const months = Math.floor(days / 30);
  if (months < 12) return months === 1 ? "1 month" : `${months} months`;

  const years = Math.floor(days / 365);
  return years === 1 ? "1 year" : `${years} years`;
}
