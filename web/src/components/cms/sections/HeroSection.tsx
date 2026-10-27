import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';

interface HeroSectionProps {
  content: {
    title?: string;
    subtitle?: string;
    tagline?: string;
    primaryCtaText?: string;
    primaryCtaLink?: string;
    secondaryCtaText?: string;
    secondaryCtaLink?: string;
    bgImageUrl?: string;
  };
  config?: {
    height?: 'auto' | 'screen' | 'large' | 'medium';
    overlayOpacity?: number;
    textAlignment?: 'left' | 'center' | 'right';
    showLogo?: boolean;
    showBadges?: boolean;
  };
  locale: string;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  content,
  config = {},
  locale,
}) => {
  const {
    title = '',
    subtitle = '',
    tagline = '',
    primaryCtaText,
    primaryCtaLink = '/register',
    secondaryCtaText,
    secondaryCtaLink = '/about',
    bgImageUrl = '/images/hero-bg.jpg',
  } = content;

  const {
    height = 'large',
    overlayOpacity = 60,
    textAlignment = 'center',
    showBadges = true,
  } = config;

  let heightClasses = 'py-20 md:py-32 min-h-[480px]';
  if (height === 'screen') heightClasses = 'min-h-[85vh] py-24 flex items-center';
  else if (height === 'large') heightClasses = 'min-h-[580px] py-24 flex items-center';
  else if (height === 'medium') heightClasses = 'min-h-[420px] py-16 flex items-center';

  const alignClasses =
    textAlignment === 'left'
      ? 'text-left items-start'
      : textAlignment === 'right'
        ? 'text-right items-end'
        : 'text-center items-center';

  return (
    <div className={`relative w-full overflow-hidden ${heightClasses}`}>
      {/* Background image & gradient overlay */}
      {bgImageUrl && (
        <div className="absolute inset-0 z-0">
          <Image
            src={bgImageUrl}
            alt={title || 'Felege Selam'}
            fill
            priority
            className="object-cover object-center"
          />
          <div
            className="absolute inset-0 bg-slate-950"
            style={{ opacity: (overlayOpacity ?? 60) / 100 }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/40" />
        </div>
      )}

      {/* Hero Content */}
      <div className={`relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 flex flex-col ${alignClasses}`}>
        {showBadges && tagline && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/20 border border-accent/40 text-accent font-medium text-xs sm:text-sm mb-6 backdrop-blur-sm shadow-sm animate-pulse">
            <Sparkles className="w-4 h-4 text-accent" />
            <span>{tagline}</span>
          </div>
        )}

        {title && (
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight mb-6 max-w-4xl drop-shadow-md">
            {title}
          </h1>
        )}

        {subtitle && (
          <p className="text-base sm:text-lg md:text-xl text-slate-200 max-w-2xl mb-8 leading-relaxed font-normal drop-shadow">
            {subtitle}
          </p>
        )}

        {/* CTA Buttons */}
        {(primaryCtaText || secondaryCtaText) && (
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            {primaryCtaText && (
              <Link
                href={`/${locale}${primaryCtaLink.startsWith('/') ? primaryCtaLink : `/${primaryCtaLink}`}`}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-accent text-slate-950 font-semibold text-sm sm:text-base hover:bg-accent/90 transition-all transform hover:-translate-y-0.5 shadow-lg shadow-accent/20"
              >
                <span>{primaryCtaText}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
            {secondaryCtaText && (
              <Link
                href={`/${locale}${secondaryCtaLink.startsWith('/') ? secondaryCtaLink : `/${secondaryCtaLink}`}`}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-sm sm:text-base border border-white/20 backdrop-blur-sm transition-all transform hover:-translate-y-0.5"
              >
                <span>{secondaryCtaText}</span>
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
