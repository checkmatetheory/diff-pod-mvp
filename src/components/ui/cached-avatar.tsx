import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface CachedAvatarProps {
  src?: string | null;
  alt?: string;
  fallback?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

// Global avatar cache to prevent re-loading
const avatarCache = new Map<string, boolean>();
const preloadedImages = new Set<string>();

const CachedAvatar: React.FC<CachedAvatarProps> = ({ 
  src, 
  alt = '', 
  fallback = 'U',
  className,
  size = 'md'
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm', 
    lg: 'h-16 w-16 text-lg',
    xl: 'h-32 w-32 text-3xl'
  };

  // Preload and cache the image
  useEffect(() => {
    if (!src) {
      setImageLoaded(false);
      return;
    }

    // Check if already cached
    if (avatarCache.has(src)) {
      setImageLoaded(true);
      return;
    }

    // Preload the image
    const img = new Image();
    img.onload = () => {
      avatarCache.set(src, true);
      preloadedImages.add(src);
      setImageLoaded(true);
      setImageError(false);
    };
    img.onerror = () => {
      setImageError(true);
      setImageLoaded(false);
    };
    img.src = src;
  }, [src]);

  // If we have a valid src and it's loaded/cached, show it immediately
  if (src && !imageError && (imageLoaded || avatarCache.has(src))) {
    return (
      <div 
        className={cn(
          "relative flex shrink-0 overflow-hidden rounded-full bg-cover bg-center bg-no-repeat",
          sizeClasses[size],
          className
        )}
        style={{ 
          backgroundImage: `url(${src})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
        role="img"
        aria-label={alt}
      />
    );
  }

  // Only show fallback if no src or error
  return (
    <div 
      className={cn(
        "relative flex shrink-0 overflow-hidden rounded-full bg-primary items-center justify-center text-primary-foreground font-semibold",
        sizeClasses[size],
        className
      )}
    >
      {fallback}
    </div>
  );
};

export default CachedAvatar; 