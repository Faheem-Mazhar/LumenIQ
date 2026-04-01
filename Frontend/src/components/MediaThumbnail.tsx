import { useState, useRef, useEffect } from 'react';
import { Play } from 'lucide-react';

/** Detect whether a URL points to a video based on its file extension. */
export function detectMediaType(url: string): 'image' | 'video' {
  return /\.(mp4|webm|mov|avi|mkv)(\?|#|$)/i.test(url) ? 'video' : 'image';
}

interface MediaThumbnailProps {
  src: string;
  alt?: string;
  mediaType?: 'image' | 'video';
  className?: string;
  controls?: boolean;
}

export function MediaThumbnail({
  src,
  alt,
  mediaType = 'image',
  className = '',
  controls = false,
}: MediaThumbnailProps) {
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    setLoaded(false);
  }, [src]);

  useEffect(() => {
    if (mediaType === 'image' && imgRef.current?.complete && imgRef.current.naturalWidth > 0) {
      setLoaded(true);
    }
  }, [src, mediaType]);

  if (mediaType === 'video') {
    return (
      <div className={`relative ${className}`}>
        {!loaded && (
          <div className="absolute inset-0 animate-pulse bg-muted rounded-[inherit]" />
        )}
        <video
          src={`${src}#t=0.1`}
          preload="metadata"
          muted
          playsInline
          controls={controls}
          className={`h-full w-full object-cover transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
          onLoadedData={() => setLoaded(true)}
        />
        {!controls && loaded && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm">
              <Play className="h-4 w-4 fill-current ml-0.5" />
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {!loaded && (
        <div className="absolute inset-0 animate-pulse bg-muted rounded-[inherit]" />
      )}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        className={`h-full w-full object-cover transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        onLoad={() => setLoaded(true)}
      />
    </div>
  );
}
