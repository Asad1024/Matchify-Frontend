import { useEffect, useCallback, useState } from "react";
import { createPortal } from "react-dom";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

type ImageLightboxProps = {
  open: boolean;
  urls: string[];
  initialIndex: number;
  onClose: () => void;
};

/**
 * Full-height viewer constrained to the app column (`max-w-lg`), same width as Header / BottomNav.
 * Portaled to document.body. Tall images scroll; arrows / keyboard cycle when multiple URLs.
 */
export function ImageLightbox({ open, urls, initialIndex, onClose }: ImageLightboxProps) {
  const [idx, setIdx] = useState(0);
  const close = useCallback(() => onClose(), [onClose]);

  useEffect(() => {
    if (!open) return;
    const max = Math.max(0, urls.length - 1);
    setIdx(Math.min(Math.max(0, initialIndex), max));
  }, [open, initialIndex, urls]);

  const n = urls.length;
  const safeIdx = n > 0 ? ((idx % n) + n) % n : 0;
  const src = urls[safeIdx] ?? "";

  useEffect(() => {
    if (!open || !src) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft" && n > 1) {
        e.preventDefault();
        setIdx((i) => i - 1);
      }
      if (e.key === "ArrowRight" && n > 1) {
        e.preventDefault();
        setIdx((i) => i + 1);
      }
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, src, n, close]);

  if (!open || !src || typeof document === "undefined") return null;

  const goPrev = () => {
    if (n <= 1) return;
    setIdx((i) => i - 1);
  };
  const goNext = () => {
    if (n <= 1) return;
    setIdx((i) => i + 1);
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[300] flex justify-center bg-black"
      style={{ minHeight: "100dvh" }}
      role="dialog"
      aria-modal="true"
      aria-label="Full size photo"
    >
      <div className="relative flex h-[100dvh] w-full max-w-lg min-h-0 flex-col">
        <div
          className="relative z-20 flex h-12 shrink-0 items-center justify-end px-2"
          style={{ paddingTop: "max(0.5rem, env(safe-area-inset-top))" }}
        >
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/15"
            onClick={close}
            aria-label="Close"
          >
            <X className="h-7 w-7" />
          </Button>
        </div>

        {n > 1 ? (
          <>
            <button
              type="button"
              className="absolute left-1 z-30 rounded-full bg-black/55 p-2.5 text-white shadow-lg backdrop-blur-sm transition hover:bg-black/75 sm:left-2 sm:p-3"
              style={{ top: "max(50%, 5rem)", transform: "translateY(-50%)" }}
              aria-label="Previous image"
              onClick={goPrev}
            >
              <ChevronLeft className="h-7 w-7 sm:h-8 sm:w-8" />
            </button>
            <button
              type="button"
              className="absolute right-1 z-30 rounded-full bg-black/55 p-2.5 text-white shadow-lg backdrop-blur-sm transition hover:bg-black/75 sm:right-2 sm:p-3"
              style={{ top: "max(50%, 5rem)", transform: "translateY(-50%)" }}
              aria-label="Next image"
              onClick={goNext}
            >
              <ChevronRight className="h-7 w-7 sm:h-8 sm:w-8" />
            </button>
            <div
              className="pointer-events-none absolute bottom-3 left-0 right-0 z-30 text-center text-sm font-semibold tabular-nums text-white/90"
              style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
            >
              {safeIdx + 1} / {n}
            </div>
          </>
        ) : null}

        <div className="min-h-0 w-full flex-1 overflow-y-auto overscroll-contain">
          <img src={src} alt="" className="block h-auto w-full max-w-full select-none" />
        </div>
      </div>
    </div>,
    document.body,
  );
}
