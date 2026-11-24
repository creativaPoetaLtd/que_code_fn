'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, Download, X } from 'lucide-react';

interface ImageLightboxProps {
  images: string[];
  index: number;
  alt: string;
  onClose: () => void;
  onIndexChange: (index: number) => void;
  /** Per-entry media kind; anything omitted is treated as a photo */
  kinds?: ("image" | "video")[];
  /** Per-entry caption, shown under the media it belongs to */
  captions?: (string | undefined)[];
  /** Saves the entry on screen; the button only appears when this is given */
  onDownload?: (index: number) => void;
}

/** Fullscreen media viewer: arrow keys, swipe, click-outside to dismiss. */
const ImageLightbox: React.FC<ImageLightboxProps> = ({
  images,
  index,
  alt,
  onClose,
  onIndexChange,
  kinds,
  captions,
  onDownload,
}) => {
  const go = useCallback(
    (direction: 1 | -1) => {
      onIndexChange((index + direction + images.length) % images.length);
    },
    [index, images.length, onIndexChange]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', onKey);
    // Freeze the page behind the overlay
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [go, onClose]);

  const touchStartX = React.useRef<number | null>(null);

  // A transform on any ancestor (e.g. the swipeable message bubble this opens from)
  // turns that ancestor into the containing block for `position: fixed`, which pins
  // the overlay to that element's box instead of the viewport. A portal to <body>
  // sidesteps that regardless of what the trigger happens to be nested under.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (images.length === 0 || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] bg-black/92 backdrop-blur-sm flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label={`${alt} media`}
      onClick={onClose}
      onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => {
        if (touchStartX.current === null) return;
        const delta = e.changedTouches[0].clientX - touchStartX.current;
        if (Math.abs(delta) > 45) go(delta < 0 ? 1 : -1);
        touchStartX.current = null;
      }}
    >
      <div className="absolute top-4 right-4 flex items-center gap-2">
        {onDownload && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onDownload(index); }}
            aria-label="Download"
            className="w-10 h-10 rounded-full bg-white/10 border border-white/15 text-white flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <Download className="w-5 h-5" />
          </button>
        )}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="w-10 h-10 rounded-full bg-white/10 border border-white/15 text-white flex items-center justify-center hover:bg-white/20 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div
        className="flex max-h-[85vh] max-w-[92vw] flex-col items-center gap-2"
        onClick={(e) => e.stopPropagation()}
      >
        {kinds?.[index] === 'video' ? (
          <video
            key={images[index]}
            src={images[index]}
            controls
            autoPlay
            className="max-h-[78vh] max-w-[92vw] rounded-xl shadow-2xl shadow-black/60"
          />
        ) : (
          <img
            src={images[index]}
            alt={`${alt} — ${index + 1} of ${images.length}`}
            className="max-h-[78vh] max-w-[92vw] object-contain rounded-xl shadow-2xl shadow-black/60"
          />
        )}
        {captions?.[index] && (
          <p className="max-w-[92vw] px-2 text-center text-sm text-white/90">{captions[index]}</p>
        )}
      </div>

      {images.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous photo"
            onClick={(e) => { e.stopPropagation(); go(-1); }}
            className="absolute left-3 sm:left-6 w-11 h-11 rounded-full bg-white/10 border border-white/15 text-white flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            aria-label="Next photo"
            onClick={(e) => { e.stopPropagation(); go(1); }}
            className="absolute right-3 sm:right-6 w-11 h-11 rounded-full bg-white/10 border border-white/15 text-white flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          <div
            className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-2"
            onClick={(e) => e.stopPropagation()}
          >
            {images.map((image, i) => (
              <button
                key={`${i}-${image}`}
                type="button"
                aria-label={`Go to photo ${i + 1}`}
                onClick={() => onIndexChange(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === index ? 'w-6 bg-white' : 'w-1.5 bg-white/40 hover:bg-white/70'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>,
    document.body
  );
};

export default ImageLightbox;
