import { useState, useCallback, useEffect } from "react";

interface ImageWithFallbackProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  fallbackSrc: string;
}

/**
 * Renders an image and switches to fallbackSrc if the primary src fails to load (e.g. 404).
 */
export function ImageWithFallback({ src, fallbackSrc, onError, ...props }: ImageWithFallbackProps) {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setCurrentSrc(src);
    setFailed(false);
  }, [src]);

  const handleError = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
      if (!failed) {
        setFailed(true);
        setCurrentSrc(fallbackSrc);
      }
      onError?.(e);
    },
    [failed, fallbackSrc, onError]
  );

  return <img src={currentSrc} onError={handleError} {...props} />;
}
