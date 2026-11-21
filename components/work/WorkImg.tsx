import type { CSSProperties, Ref } from 'react';
import { imgUrl, imgSrcSet, placeholderUrl } from '@/lib/workImage';
import type { WorkImage } from '@/lib/trashWork';

/** A work image in its real proportions (never cropped): sized by
 *  width/height so nothing shifts, dominant colour and a tiny blurred
 *  stand-in behind it, srcset from the Sanity CDN, and a fade-in on load.
 *
 *  The fade is CSS + a capture-phase load listener in <head> (app/layout.tsx)
 *  that sets data-l on every <img> as it loads. It does not depend on React,
 *  so an image that finishes before hydration is never left hidden. Priority
 *  images (data-p) skip the fade entirely: they are the largest paint. */
export default function WorkImg({
  img, widths, sizes, priority = false, className, imgRef, imgStyle, defaultWidth = 800,
}: {
  img: WorkImage;
  widths: number[];
  sizes: string;
  priority?: boolean;
  className?: string;
  imgRef?: Ref<HTMLImageElement>;
  imgStyle?: CSSProperties;
  defaultWidth?: number;
}) {
  const ph = placeholderUrl(img.url);
  return (
    <span
      className={`mot-img${className ? ` ${className}` : ''}`}
      style={{ aspectRatio: `${img.w} / ${img.h}`, backgroundColor: img.bg ?? '#ebe6de' }}
    >
      {/* Blurred stand-in. An <img loading="lazy">, not a CSS background:
          backgrounds are never lazy, so every card's stand-in downloaded at
          once (100 requests at load on /trash). Priority images skip it;
          they are the first thing fetched anyway. */}
      {!priority && (img.lqip || ph) && (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="mot-img-ph" src={img.lqip ?? ph} alt="" aria-hidden="true" loading="lazy" decoding="async" />
      )}
      {/* eslint-disable-next-line @next/next/no-img-element -- static export: no next/image optimizer; Sanity CDN does the sizing */}
      <img
        ref={imgRef}
        src={imgUrl(img.url, Math.min(defaultWidth, img.w))}
        srcSet={imgSrcSet(img.url, widths, img.w)}
        sizes={sizes}
        width={img.w}
        height={img.h}
        alt={img.alt}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
        decoding={priority ? 'sync' : 'async'}
        data-p={priority ? '' : undefined}
        style={imgStyle}
      />
    </span>
  );
}
