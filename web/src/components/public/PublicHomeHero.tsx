'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronDown, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { SchoolLogo } from '@/components/common/SchoolLogo';
import { useSiteSettings } from '@/providers/SiteSettingsProvider';
import { useSiteIdentity } from '@/hooks/useSiteIdentity';

interface PublicHomeHeroProps {
  locale: string;
}

export function PublicHomeHero({ locale }: PublicHomeHeroProps) {
  const { settings } = useSiteSettings();
  const siteIdentity = useSiteIdentity(locale);
  const { appearance, homeContent } = settings;

  const isEn = locale === 'en';
  const [scrolledPast, setScrolledPast] = useState(false);
  const [showFullWelcome, setShowFullWelcome] = useState(false);

  // Content fallbacks conforming to prompt specifications
  const heroTitle = isEn
    ? homeContent?.heroTitleEn || siteIdentity.schoolNameEn || 'Aemade Selam Sunday School'
    : homeContent?.heroTitleAm || 'አዕማደ ሰላም ሰንበት ትምህርት ቤት';

  const heroSubtitle = isEn
    ? homeContent?.heroSubtitleEn || 'Platform for learning faith, liturgy, and spiritual life'
    : homeContent?.heroSubtitleAm || 'ሃይማኖትን፣ ሥርዓትንና መንፈሳዊ ሕይወትን የሚማሩበት መድረክ';

  const welcomeMessage = isEn
    ? homeContent?.welcomeMessageEn || 'Welcome to the Sunday School of Felegeselam Kidus Giyorgis Cathedral in Finote Selam, West Gojjam.'
    : homeContent?.welcomeMessageAm || 'በሰላም መጡ! በፈለገ ሰላም ቅዱስ ጊዮርጊስ ካቴድራል አዕማደ ሰላም ሰንበት ትምህርት ቤት ተማሪዎችና ምዕመናን አገልግሎት።';

  const primaryCtaText = isEn
    ? homeContent?.primaryCtaTextEn || 'Member Registration'
    : homeContent?.primaryCtaTextAm || 'የአባላት ምዝገባ';

  const primaryCtaLink = homeContent?.primaryCtaLink || `/${locale}/register`;

  const secondaryCtaText = isEn
    ? homeContent?.secondaryCtaTextEn || 'About Us'
    : homeContent?.secondaryCtaTextAm || 'ስለ እኛ';

  const secondaryCtaLink = homeContent?.secondaryCtaLink || `/${locale}#about`;

  // Announcement Banner
  const announcement = homeContent?.announcement;

  // Background styling
  const bgType = appearance?.heroBackgroundType || 'gradient';
  const hasImage = bgType === 'image' && Boolean(appearance?.heroBackgroundImage);
  const overlayOpacity = (appearance?.heroOverlayOpacity ?? 60) / 100;

  // Fade out scroll cue after 40px scroll
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 40) {
        setScrolledPast(true);
      } else {
        setScrolledPast(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleScrollCueClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const target = document.getElementById('quick-links') || document.getElementById('about');
    if (target) {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      target.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    }
  };

  const handleChurchPillClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const aboutEl = document.getElementById('about');
    if (aboutEl) {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      aboutEl.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    }
  };

  return (
    <section
      id="hero"
      data-testid="hero-section"
      className="relative w-full overflow-hidden text-white rounded-b-[28px] shadow-lg select-none"
      style={{
        // Full first screen: calc(100svh - 64px) with fallback calc(100vh - 64px)
        height: 'calc(100svh - 64px)',
        minHeight: '560px',
        background: hasImage
          ? `url(${appearance.heroBackgroundImage}) center/cover no-repeat`
          : 'linear-gradient(180deg, #0F4C81 0%, #0F4C81 25%, #0A2E52 85%)',
      }}
    >
      {/* Dark overlay if custom background image is active */}
      {hasImage && (
        <div
          className="absolute inset-0 bg-[#0A2E52] pointer-events-none transition-opacity"
          style={{ opacity: overlayOpacity }}
          aria-hidden="true"
        />
      )}

      {/* 
        Watermark: Very faint white Ethiopian Orthodox cross watermark 
        (6% opacity, ~320px, centered behind content, pointer-events-none)
      */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none z-0"
        aria-hidden="true"
      >
        <svg
          className="w-[280px] h-[280px] sm:w-[340px] sm:h-[340px] text-white opacity-[0.06]"
          viewBox="0 0 200 200"
          fill="currentColor"
        >
          {/* Stylized Cross Watermark */}
          <path d="M90 10 h20 v60 h60 v20 h-60 v60 h20 v20 h-60 v-20 h20 v-60 h-60 v-20 h60 v-60 z" />
          <circle cx="100" cy="100" r="35" fill="none" stroke="currentColor" strokeWidth="8" />
          <path d="M75 25 L100 0 L125 25 L100 50 Z" />
          <path d="M175 75 L200 100 L175 125 L150 100 Z" />
          <path d="M75 175 L100 200 L125 175 L100 150 Z" />
          <path d="M25 75 L0 100 L25 125 L50 100 Z" />
        </svg>
      </div>

      {/* Main Centered Hero Column */}
      <div className="relative z-10 mx-auto max-w-[520px] h-full flex flex-col items-center justify-center px-5 text-center gap-2.5 sm:gap-3.5 short:gap-2">
        {/* Optional Announcement Banner */}
        {announcement?.enabled && (
          <div className="w-full mb-1">
            <div
              className={`flex items-center justify-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium shadow-sm ${
                announcement.type === 'warning'
                  ? 'bg-[#E39B00]/20 border-[#E39B00] text-[#FFE8B8]'
                  : announcement.type === 'success'
                  ? 'bg-[#1B8E5A]/20 border-[#1B8E5A] text-[#B8F2D5]'
                  : 'bg-white/10 border-white/20 text-[#E8F1FB]'
              }`}
            >
              {announcement.type === 'warning' ? (
                <AlertCircle className="h-3.5 w-3.5 shrink-0 text-[#E39B00]" />
              ) : announcement.type === 'success' ? (
                <CheckCircle className="h-3.5 w-3.5 shrink-0 text-[#1B8E5A]" />
              ) : (
                <Info className="h-3.5 w-3.5 shrink-0 text-[#F2B233]" />
              )}
              <span className="truncate max-w-[280px]">
                {isEn ? announcement.textEn || announcement.textAm : announcement.textAm}
              </span>
            </div>
          </div>
        )}

        {/* 
          a. Circular School Logo: 104px (reduced to 80px on viewport height < 700px),
          round, gold #F2B233 ring with 3px white border 
        */}
        <div className="flex justify-center">
          <div className="w-[84px] h-[84px] min-[700px]:w-[104px] min-[700px]:h-[104px] rounded-full border-[3px] border-white ring-2 ring-[#F2B233] overflow-hidden shrink-0 flex items-center justify-center bg-[#0A2E52] shadow-xl">
            <SchoolLogo size={104} />
          </div>
        </div>

        {/* 
          b. Church Pill: one line, gold text 12px, 1px border rgba(242,178,51,0.4),
          fully rounded, padding 6px 14px, white-space nowrap, taps scroll to #about 
        */}
        <button
          type="button"
          onClick={handleChurchPillClick}
          className="inline-flex items-center justify-center rounded-full border border-[#F2B233]/40 bg-white/5 hover:bg-white/10 px-3.5 py-1 text-xs font-semibold text-[#F2B233] shadow-xs backdrop-blur-xs whitespace-nowrap active:scale-95 transition-all"
        >
          <span data-testid="hero-church-name">{siteIdentity.churchName}</span>
        </button>

        {/* 
          c. Title: 32px (reduced to 28px on short screen), line-height 1.35, bold, white, text-wrap balance
          Amharic: አዕማደ ሰላም ሰንበት ትምህርት ቤት 
        */}
        <h1
          data-testid="hero-title"
          className="text-[28px] min-[700px]:text-[32px] sm:text-4xl font-extrabold text-white leading-[1.35] tracking-tight [text-wrap:balance]"
        >
          {heroTitle}
        </h1>

        {/* 
          d. Subtitle: 15px, line-height 1.65, white at 90%, 2 to 3 lines
          Amharic: ሃይማኖትን፣ ሥርዓትንና መንፈሳዊ ሕይወትን የሚማሩበት መድረክ 
        */}
        <p
          data-testid="hero-subtitle"
          className="text-[15px] leading-[1.65] text-white/90 line-clamp-3"
        >
          {heroSubtitle}
        </p>

        {/* 
          Optional Welcome Paragraph: On mobile, hidden behind a "Read more" toggle
          On tablet/desktop, always visible
        */}
        <div className="w-full text-center">
          <div className="hidden md:block text-xs sm:text-sm text-white/80 leading-relaxed max-w-lg mx-auto">
            {welcomeMessage}
          </div>

          {/* Mobile Read more / Read less toggle */}
          <div className="block md:hidden">
            {showFullWelcome ? (
              <div className="text-xs text-white/85 leading-relaxed bg-black/20 p-2.5 rounded-xl border border-white/10 mt-1">
                <p>{welcomeMessage}</p>
                <button
                  type="button"
                  onClick={() => setShowFullWelcome(false)}
                  className="mt-1 text-[11px] font-bold text-[#F2B233] underline underline-offset-2"
                >
                  {isEn ? 'Close' : 'አሳንስ'}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowFullWelcome(true)}
                className="text-[12px] font-medium text-white/75 hover:text-white underline underline-offset-2"
              >
                {isEn ? 'Read more...' : 'ተጨማሪ ያንብቡ...'}
              </button>
            )}
          </div>
        </div>

        {/* 
          e. Two Stacked Full-Width Buttons, 52px high, radius 12px, 12px gap
          - Primary Gold (#F2B233, dark text #0F2438, bold): የአባላት ምዝገባ
          - Secondary Outline (transparent, 1.5px white border, white text): ስለ እኛ 
        */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full pt-1.5 short:pt-0">
          <Link
            href={primaryCtaLink}
            className="flex items-center justify-center h-[52px] w-full rounded-[12px] bg-[#F2B233] text-[#0F2438] font-bold text-base shadow-md hover:bg-[#e0a42b] active:scale-[0.99] transition-all"
          >
            <span>{primaryCtaText}</span>
          </Link>

          <Link
            href={secondaryCtaLink}
            className="flex items-center justify-center h-[52px] w-full rounded-[12px] border-[1.5px] border-white bg-transparent text-white font-semibold text-base hover:bg-white/10 active:scale-[0.99] transition-all"
          >
            <span>{secondaryCtaText}</span>
          </Link>
        </div>

        {/* 
          Scroll cue at the bottom (20px from edge):
          Small text "ወደ ታች ይሸብልሉ" (white 70%, 12px) and gold chevron-down icon.
          Fades out after 40px scroll.
        */}
        <button
          type="button"
          onClick={handleScrollCueClick}
          aria-label={isEn ? 'Scroll down to next section' : 'ወደ ታች ይሸብልሉ'}
          className={`mt-2 flex flex-col items-center gap-0.5 text-center transition-opacity duration-300 ${
            scrolledPast ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
        >
          <span className="text-[12px] text-white/70 font-medium">
            {isEn ? 'Scroll down' : 'ወደ ታች ይሸብልሉ'}
          </span>
          <ChevronDown
            className="h-4 w-4 text-[#F2B233] animate-bounce motion-reduce:animate-none"
            aria-hidden="true"
          />
        </button>
      </div>
    </section>
  );
}
