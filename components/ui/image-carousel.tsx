'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ImageCarouselProps {
  images: (string | null | undefined)[];
  alt: string;
  className?: string;
  imageClassName?: string;
  fallback?: React.ReactNode;
  /** Hide arrows/counter for small thumbnails where only dots fit */
  compact?: boolean;
  /** Drop the "2/5" badge when the corner is already occupied by other overlays */
  hideCounter?: boolean;
  /** Move the dots off-center when overlaid text occupies the bottom-left */
  dotsAlign?: 'center' | 'right';
}

const SWIPE_THRESHOLD = 40;

/** Dedupe, drop empties, keep order — pass the cover image first to make it slide one. */
export const collectImages = (...sources: (string | null | undefined | string[])[]): string[] => {
  const flattened = sources.flatMap((source) => (Array.isArray(source) ? source : [source]));
  return Array.from(
    new Set(
      flattened.filter((url): url is string => typeof url === 'string' && url.trim().length > 0)
    )
  );
};

const ImageCarousel: React.FC<ImageCarouselProps> = ({
  images,
  alt,
  className = '',
  imageClassName = 'w-full h-full object-cover',
  fallback = null,
  compact = false,
  hideCounter = false,
  dotsAlign = 'center',
}) => {
  const slides = collectImages(...images);
  const [index, setIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    setIndex((prev) => (prev >= slides.length ? 0 : prev));
  }, [slides.length]);

  const go = useCallback(
    (direction: 1 | -1) => {
      setIndex((prev) => (prev + direction + slides.length) % slides.length);
    },
    [slides.length]
  );

  if (slides.length === 0) {
    return <>{fallback}</>;
  }

  if (slides.length === 1) {
    return (
      <div className={`overflow-hidden ${className}`}>
        <img src={slides[0]} alt={alt} className={imageClassName} />
      </div>
    );
  }

  const arrowClass =
    'absolute z-20 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/45 backdrop-blur-md border border-white/15 text-white flex items-center justify-center shadow-lg shadow-black/40 transition-all duration-200 hover:bg-black/70 hover:scale-105 active:scale-95 md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100';

  return (
    <div
      className={`relative group overflow-hidden ${className}`}
      role="region"
      aria-roledescription="carousel"
      aria-label={`${alt} images`}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          go(1);
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          go(-1);
        }
      }}
      onTouchStart={(e) => {
        touchStartX.current = e.touches[0].clientX;
      }}
      onTouchEnd={(e) => {
        if (touchStartX.current === null) return;
        const delta = e.changedTouches[0].clientX - touchStartX.current;
        if (Math.abs(delta) > SWIPE_THRESHOLD) {
          go(delta < 0 ? 1 : -1);
        }
        touchStartX.current = null;
      }}
    >
      {/* Slides — cross-fade so navigation feels smooth rather than snapping */}
      {slides.map((slide, i) => (
        <img
          key={slide}
          src={slide}
          alt={i === index ? `${alt} — image ${i + 1} of ${slides.length}` : ''}
          aria-hidden={i !== index}
          className={`${imageClassName} transition-opacity duration-300 ease-out ${
            i === index ? 'opacity-100' : 'opacity-0 absolute inset-0 pointer-events-none'
          }`}
        />
      ))}

      {/* Bottom scrim keeps dots legible over bright photos */}
      <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />

      {!compact && (
        <>
          <button
            type="button"
            aria-label="Previous image"
            onClick={(e) => {
              e.stopPropagation();
              go(-1);
            }}
            className={`${arrowClass} left-2`}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            aria-label="Next image"
            onClick={(e) => {
              e.stopPropagation();
              go(1);
            }}
            className={`${arrowClass} right-2`}
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {!hideCounter && (
            <span className="absolute z-20 top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-black/55 backdrop-blur-md border border-white/10 text-white text-[10px] font-semibold tabular-nums">
              {index + 1}/{slides.length}
            </span>
          )}
        </>
      )}

      <div
        className={`absolute z-20 bottom-2.5 flex items-center gap-1.5 ${
          dotsAlign === 'right' ? 'right-3' : 'left-1/2 -translate-x-1/2'
        }`}
      >
        {slides.map((slide, i) => (
          <button
            key={slide}
            type="button"
            aria-label={`Go to image ${i + 1}`}
            aria-current={i === index}
            onClick={(e) => {
              e.stopPropagation();
              setIndex(i);
            }}
            className={`h-1.5 rounded-full transition-all duration-200 ${
              i === index
                ? 'w-5 bg-white shadow-sm shadow-black/40'
                : 'w-1.5 bg-white/45 hover:bg-white/80'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default ImageCarousel;
