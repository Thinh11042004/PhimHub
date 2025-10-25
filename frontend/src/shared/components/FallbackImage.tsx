import { useState } from 'react';

interface FallbackImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackSrc?: string;
  onError?: () => void;
  onLoad?: () => void;
}

export default function FallbackImage({
  src,
  alt,
  className = '',
  fallbackSrc,
  onError,
  onLoad
}: FallbackImageProps) {
  const [imageSrc, setImageSrc] = useState(src);
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      if (fallbackSrc) {
        setImageSrc(fallbackSrc);
      } else {
        // Default fallback SVG
        setImageSrc('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDIwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjMzMzIi8+CjxwYXRoIGQ9Ik04MCAxMjBIMTIwVjE4MEg4MFYxMjBaIiBmaWxsPSIjNjY2Ii8+CjxwYXRoIGQ9Ik05MCAxMzBIMTEwVjE3MEg5MFYxMzBaIiBmaWxsPSIjOTk5Ii8+Cjx0ZXh0IHg9IjEwMCIgeT0iMjAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjYWFhIiBmb250LXNpemU9IjE0Ij5ObyBJbWFnZTwvdGV4dD4KPC9zdmc+');
      }
      onError?.();
    }
  };

  const handleLoad = () => {
    setHasError(false);
    onLoad?.();
  };

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={className}
      onError={handleError}
      onLoad={handleLoad}
      loading="lazy"
    />
  );
}
