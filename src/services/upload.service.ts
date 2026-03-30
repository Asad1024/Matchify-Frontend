import { buildApiUrl, getAuthHeaders } from "./api";

export type UploadPhotoResponse = { url: string };

/**
 * Prefer same-origin `/uploads/...` paths so the Vite dev proxy (and typical prod reverse proxies)
 * serve files reliably. Absolute API URLs often break profile banners after save/reload.
 */
export function normalizeUploadedMediaUrl(url: string): string {
  const t = String(url).trim();
  if (!t || t.startsWith("blob:") || t.startsWith("data:")) return t;
  try {
    const u = new URL(t);
    if (u.pathname.startsWith("/uploads/")) {
      return `${u.pathname}${u.search}`;
    }
  } catch {
    /* already relative or opaque */
  }
  return t;
}

/**
 * Upload an image to the API (multipart field name must be `photo`).
 * Returns a public URL for use in posts (and optional `image` / `images` on create post).
 */
export async function uploadPostPhoto(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("photo", file);
  const res = await fetch(buildApiUrl("/api/upload-photo"), {
    method: "POST",
    body: fd,
    credentials: "include",
    headers: getAuthHeaders(false),
  });
  const text = await res.text();
  if (!res.ok) {
    let msg = text || res.statusText;
    try {
      const j = JSON.parse(text) as { message?: string };
      if (j?.message) msg = j.message;
    } catch {
      /* plain text */
    }
    throw new Error(msg);
  }
  const j = JSON.parse(text) as { url?: string; fileUrl?: string };
  const raw = typeof j.url === "string" ? j.url : typeof j.fileUrl === "string" ? j.fileUrl : "";
  if (!raw) {
    throw new Error("Upload did not return a URL");
  }
  return normalizeUploadedMediaUrl(raw);
}

/** Alias for story dialog and other callers expecting `{ url }`. */
export async function uploadPhoto(file: File): Promise<{ url: string }> {
  const url = await uploadPostPhoto(file);
  return { url };
}

export const uploadService = {
  uploadPhoto,
};
