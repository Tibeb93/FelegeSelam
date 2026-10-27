'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { X } from 'lucide-react';

interface GalleryImage {
  url: string;
  alt?: string;
  caption?: string;
}

interface GallerySectionProps {
  content: {
    title?: string;
    subtitle?: string;
    images?: GalleryImage[];
  };
  config?: {
    layout?: 'grid' | 'masonry' | 'carousel';
    columns?: 2 | 3 | 4;
    enableLightbox?: boolean;
  };
}

export const GallerySection: React.FC<GallerySectionProps> = ({
  content,
  config = {},
}) => {
  const { title = '', subtitle = '', images = [] } = content;
  const { columns = 3, enableLightbox = true } = config;
  const [activeImage, setActiveImage] = useState<GalleryImage | null>(null);

  let gridColsClass = 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3';
  if (columns === 2) gridColsClass = 'grid-cols-1 sm:grid-cols-2';
  else if (columns === 4) gridColsClass = 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4';

  return (
    <div>
      {(title || subtitle) && (
        <div className="text-center max-w-2xl mx-auto mb-10">
          {subtitle && (
            <span className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-accent mb-2 block">
              {subtitle}
            </span>
          )}
          {title && (
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              {title}
            </h2>
          )}
        </div>
      )}

      <div className={`grid ${gridColsClass} gap-4 sm:gap-6`}>
        {images.map((img, idx) => (
          <div
            key={idx}
            onClick={() => enableLightbox && setActiveImage(img)}
            className={`group relative aspect-[4/3] rounded-2xl overflow-hidden bg-muted cursor-pointer shadow-sm border border-border/40 hover:shadow-lg transition-all duration-300`}
          >
            <Image
              src={img.url}
              alt={img.alt || `Gallery Image ${idx + 1}`}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
            {img.caption && (
              <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent text-white text-xs sm:text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <p className="font-medium line-clamp-2">{img.caption}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Lightbox Modal */}
      {activeImage && enableLightbox && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setActiveImage(null)}
        >
          <button
            onClick={() => setActiveImage(null)}
            className="absolute top-6 right-6 text-white/80 hover:text-white p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
          <div
            className="relative max-w-4xl max-h-[85vh] w-full h-[70vh] flex flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative w-full h-full">
              <Image
                src={activeImage.url}
                alt={activeImage.alt || 'Expanded View'}
                fill
                className="object-contain"
              />
            </div>
            {activeImage.caption && (
              <p className="mt-4 text-center text-white/90 text-sm font-medium">
                {activeImage.caption}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
