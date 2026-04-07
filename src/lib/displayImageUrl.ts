/**
 * Cloudinary often serves small `w_` thumbnails; large hero UIs need enough pixels or scaling looks soft.
 * Version-only URLs (`v123/...`) get a display chain so the CDN delivers a wider variant.
 */
const CLOUDINARY_MARKER = "/image/upload/";

export function displayImageUrl(url: string | null | undefined, maxWidth = 960): string | null {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (!trimmed.includes("res.cloudinary.com") || !trimmed.includes(CLOUDINARY_MARKER)) {
    return trimmed;
  }
  const idx = trimmed.indexOf(CLOUDINARY_MARKER);
  const prefix = trimmed.slice(0, idx + CLOUDINARY_MARKER.length);
  const after = trimmed.slice(idx + CLOUDINARY_MARKER.length);
  const parts = after.split("/");
  const head = parts[0] ?? "";
  const chain = `w_${maxWidth},c_limit,q_auto,f_auto`;

  if (/^v\d+$/.test(head)) {
    return `${prefix}${chain}/${after}`;
  }

  const wMatch = head.match(/^w_(\d+)/);
  if (wMatch) {
    const w = parseInt(wMatch[1], 10);
    if (!Number.isNaN(w) && w < maxWidth) {
      parts[0] = chain;
      return `${prefix}${parts.join("/")}`;
    }
  }

  return trimmed;
}
