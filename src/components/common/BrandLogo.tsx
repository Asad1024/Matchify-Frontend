import { useState } from "react";
import { MATCHIFY_LOGO_URL, MATCHIFY_LOGO_FALLBACK } from "@/lib/matchifyBranding";

type BrandLogoProps = {
  className?: string;
  alt?: string;
};

/**
 * Renders the app logo; falls back to the hosted default if the primary URL fails to load.
 */
export function BrandLogo({ className = "", alt = "Matchify" }: BrandLogoProps) {
  const [src, setSrc] = useState(MATCHIFY_LOGO_URL);

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      decoding="async"
      onError={() => {
        setSrc((current) => (current === MATCHIFY_LOGO_FALLBACK ? current : MATCHIFY_LOGO_FALLBACK));
      }}
    />
  );
}
