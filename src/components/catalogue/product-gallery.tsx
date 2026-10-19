"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cx } from "@/lib/cx";
import { imageUrl } from "@/lib/media-url";
import type { ProductImageRef } from "@/lib/api/catalogue";

interface ProductGalleryProps {
  media: ProductImageRef[];
  productName: string;
  previousLabel: string;
  nextLabel: string;
}

export function ProductGallery({ media, productName, previousLabel, nextLabel }: ProductGalleryProps) {
  const slides = media
    .map((item) => ({ src: imageUrl(item.srcset), alt: item.alt ?? productName }))
    .filter((item): item is { src: string; alt: string } => Boolean(item.src));

  const [index, setIndex] = useState(0);

  if (slides.length === 0) {
    return <div className="aspect-[4/3] rounded-sm border border-line bg-surface-recessed" aria-hidden="true" />;
  }

  const current = slides[index] ?? slides[0];
  const hasMultiple = slides.length > 1;

  const go = (delta: number) => {
    setIndex((prev) => {
      const next = prev + delta;
      if (next < 0) return slides.length - 1;
      if (next >= slides.length) return 0;
      return next;
    });
  };

  return (
    <div className="space-y-3">
      <div className="relative aspect-[4/3] overflow-hidden rounded-sm border border-line bg-surface-recessed">
        {/* eslint-disable-next-line @next/next/no-img-element -- same-origin catalogue media rewrite */}
        <img src={current.src} alt={current.alt} className="absolute inset-0 h-full w-full object-cover" />
        {hasMultiple && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              className="absolute top-1/2 left-2 flex size-10 -translate-y-1/2 items-center justify-center rounded-sm border border-line bg-surface-panel/95 text-ink shadow-sm transition-colors duration-instant ease-standard hover:bg-surface-panel focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
              aria-label={previousLabel}
            >
              <ChevronLeft className="size-5" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              className="absolute top-1/2 right-2 flex size-10 -translate-y-1/2 items-center justify-center rounded-sm border border-line bg-surface-panel/95 text-ink shadow-sm transition-colors duration-instant ease-standard hover:bg-surface-panel focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
              aria-label={nextLabel}
            >
              <ChevronRight className="size-5" aria-hidden />
            </button>
          </>
        )}
      </div>

      {hasMultiple && (
        <ul className="flex flex-wrap gap-2" role="list">
          {slides.map((slide, i) => (
            <li key={slide.src}>
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-current={i === index ? "true" : undefined}
                aria-label={slide.alt}
                className={cx(
                  "relative size-16 overflow-hidden rounded-sm border bg-surface-recessed transition-colors duration-instant ease-standard focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
                  i === index ? "border-ink-strong ring-1 ring-ink-strong/20" : "border-line hover:border-line-strong",
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- thumbnail */}
                <img src={slide.src} alt="" className="absolute inset-0 h-full w-full object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
