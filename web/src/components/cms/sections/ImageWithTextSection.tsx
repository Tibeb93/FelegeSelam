import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

interface ImageWithTextSectionProps {
  content: {
    title?: string;
    subtitle?: string;
    bodyHtml?: string;
    imageUrl?: string;
    imageAlt?: string;
    badgeText?: string;
    buttonText?: string;
    buttonLink?: string;
  };
  config?: {
    imagePosition?: 'left' | 'right';
    imageRatio?: '16:9' | '4:3' | '1:1' | 'portrait';
  };
  locale: string;
}

export const ImageWithTextSection: React.FC<ImageWithTextSectionProps> = ({
  content,
  config = {},
  locale,
}) => {
  const {
    title = '',
    subtitle = '',
    bodyHtml = '',
    imageUrl = '',
    imageAlt = '',
    badgeText,
    buttonText,
    buttonLink,
  } = content;

  const { imagePosition = 'left', imageRatio = '4:3' } = config;

  let ratioClasses = 'aspect-[4/3]';
  if (imageRatio === '16:9') ratioClasses = 'aspect-[16/9]';
  else if (imageRatio === '1:1') ratioClasses = 'aspect-square';
  else if (imageRatio === 'portrait') ratioClasses = 'aspect-[3/4]';

  const isImageRight = imagePosition === 'right';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14 items-center">
      {/* Image Column */}
      <div className={`relative w-full ${ratioClasses} rounded-2xl overflow-hidden shadow-xl border border-border/50 ${isImageRight ? 'lg:order-2' : 'lg:order-1'}`}>
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={imageAlt || title || 'Featured Image'}
            fill
            className="object-cover transition-transform duration-500 hover:scale-105"
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground">
            No Image Selected
          </div>
        )}
      </div>

      {/* Text Column */}
      <div className={`flex flex-col justify-center ${isImageRight ? 'lg:order-1' : 'lg:order-2'}`}>
        {badgeText && (
          <div className="inline-flex items-center self-start px-3 py-1 rounded-full bg-primary/10 text-primary font-medium text-xs uppercase tracking-wider mb-4 border border-primary/20">
            {badgeText}
          </div>
        )}

        {subtitle && (
          <span className="text-sm font-semibold text-accent mb-2 uppercase tracking-wide">
            {subtitle}
          </span>
        )}

        {title && (
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-5 leading-tight">
            {title}
          </h2>
        )}

        {bodyHtml && (
          <div
            className="prose prose-slate dark:prose-invert max-w-none text-muted-foreground leading-relaxed text-base mb-6"
            dangerouslySetInnerHTML={{ __html: bodyHtml }}
          />
        )}

        {buttonText && buttonLink && (
          <div className="pt-2">
            <Link
              href={`/${locale}${buttonLink.startsWith('/') ? buttonLink : `/${buttonLink}`}`}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-all shadow-md hover:shadow-lg"
            >
              <span>{buttonText}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};
