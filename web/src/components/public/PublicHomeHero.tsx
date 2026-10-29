'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, BookOpen, Music, Calendar, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

  const heroTitle = isEn
    ? homeContent?.heroTitleEn || 'Welcome to the Sunday School of Felegeselam Kidus Giyorgis Cathedral'
    : homeContent?.heroTitleAm || 'እንኳን ወደ ፈለገ ሰላም ቅዱስ ጊዮርጊስ ካቴድራል ሰንበት ትምህርት ቤት በደህና መጡ';

  const heroSubtitle = isEn
    ? homeContent?.heroSubtitleEn || 'Spiritual Education & Orthodox Christian Character'
    : homeContent?.heroSubtitleAm || 'የኢትዮጵያ ኦርቶዶክስ ተዋሕዶ ቤተክርስቲያን እምነትና ሥርዓት የሚማሩበት መድረክ';

  const welcomeMessage = isEn
    ? homeContent?.welcomeMessageEn || 'Welcome to the Sunday School of Felegeselam Kidus Giyorgis Cathedral in Finote Selam, West Gojjam.'
    : homeContent?.welcomeMessageAm || 'በሰላም መጡ! በፈለገ ሰላም ቅዱስ ጊዮርጊስ ካቴድራል አዕማደ ሰላም ሰንበት ትምህርት ቤት ተማሪዎችና ምዕመናን አገልግሎት።';

  const primaryCtaText = isEn
    ? homeContent?.primaryCtaTextEn || 'Member Registration'
    : homeContent?.primaryCtaTextAm || 'የአባላት ምዝገባ';

  const primaryCtaLink = homeContent?.primaryCtaLink || `/${locale}/register`;

  const secondaryCtaText = isEn
    ? homeContent?.secondaryCtaTextEn || 'Explore Courses'
    : homeContent?.secondaryCtaTextAm || 'ትምህርቶችን ይመልከቱ';

  const secondaryCtaLink = homeContent?.secondaryCtaLink || `/${locale}/courses`;

  // Announcement Banner
  const announcement = homeContent?.announcement;

  // Background styling
  const bgType = appearance?.heroBackgroundType || 'gradient';
  const hasImage = bgType === 'image' && appearance?.heroBackgroundImage;
  const overlayOpacity = ((appearance?.heroOverlayOpacity ?? 65) / 100);

  const heroStyle: React.CSSProperties = {
    position: 'relative',
    ...(hasImage
      ? {
          backgroundImage: `url(${appearance.heroBackgroundImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }
      : bgType === 'solid'
      ? {
          backgroundColor: appearance?.heroSolidColor || '#0A2E52',
        }
      : {}),
  };

  return (
    <section
      id="hero"
      style={heroStyle}
      className={`scroll-mt-24 relative overflow-hidden border-b border-[#0A2E52] text-white py-14 md:py-20 ${
        !hasImage && bgType === 'gradient'
          ? 'bg-gradient-to-b from-[#0A2E52] via-[#0F4C81] to-[#0A2E52]'
          : ''
      }`}
    >
      {/* Dark overlay for readability over hero background image */}
      {hasImage && (
        <div
          className="absolute inset-0 bg-[#0A2E52] pointer-events-none transition-opacity"
          style={{ opacity: overlayOpacity }}
          aria-hidden="true"
        />
      )}

      <div className="container relative z-10 mx-auto px-4">
        {/* Optional Announcement Banner */}
        {announcement?.enabled && (
          <div className="mx-auto max-w-3xl mb-8">
            <div
              className={`flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl border text-sm font-medium shadow-md ${
                announcement.type === 'warning'
                  ? 'bg-[#E39B00]/20 border-[#E39B00] text-[#FFE8B8]'
                  : announcement.type === 'success'
                  ? 'bg-[#1B8E5A]/20 border-[#1B8E5A] text-[#B8F2D5]'
                  : 'bg-white/10 border-white/20 text-[#E8F1FB]'
              }`}
            >
              {announcement.type === 'warning' ? (
                <AlertCircle className="h-4 w-4 shrink-0 text-[#E39B00]" />
              ) : announcement.type === 'success' ? (
                <CheckCircle className="h-4 w-4 shrink-0 text-[#1B8E5A]" />
              ) : (
                <Info className="h-4 w-4 shrink-0 text-[#F2B233]" />
              )}
              <span>{isEn ? announcement.textEn || announcement.textAm : announcement.textAm}</span>
              {announcement.link && (
                <Link
                  href={announcement.link}
                  className="underline underline-offset-2 ml-1 font-bold text-white hover:text-[#F2B233]"
                >
                  {isEn ? 'Learn more →' : 'ተጨማሪ ይመልከቱ →'}
                </Link>
              )}
            </div>
          </div>
        )}

        <div className="mx-auto max-w-4xl text-center space-y-6">
          {/* Circular School Logo */}
          <div className="flex justify-center mb-2">
            <SchoolLogo size={96} logoUrl={siteIdentity?.logoUrl} />
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs sm:text-sm font-semibold text-[#F2B233] shadow-xs backdrop-blur-xs">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            <span data-testid="hero-church-name">{siteIdentity.churchName}</span>
          </div>

          {/* Large white Amharic / English welcome message */}
          <h1
            data-testid="hero-title"
            className="text-3xl font-black tracking-tight text-white sm:text-5xl md:text-6xl leading-tight"
          >
            {heroTitle}
          </h1>

          <p
            data-testid="hero-subtitle"
            className="text-lg text-[#E8F1FB] font-semibold tracking-wide sm:text-2xl"
          >
            {heroSubtitle}
          </p>

          <p className="mx-auto max-w-2xl text-sm sm:text-base md:text-lg text-white/90 leading-relaxed font-normal">
            {welcomeMessage}
          </p>

          {/* Call to Actions */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            <Button
              asChild
              size="lg"
              className="min-h-[48px] bg-[#F2B233] text-[#0F2438] hover:bg-[#e0a42b] shadow-lg hover:shadow-xl font-bold text-base px-8 rounded-xl transition-all"
            >
              <Link href={primaryCtaLink}>
                <BookOpen className="mr-2 h-5 w-5" aria-hidden="true" />
                <span>{primaryCtaText}</span>
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              size="lg"
              className="min-h-[48px] border-2 border-white/30 text-white bg-white/5 hover:bg-white/15 text-base px-6 rounded-xl transition-all"
            >
              <Link href={secondaryCtaLink}>
                <Music className="mr-2 h-5 w-5 text-[#F2B233]" aria-hidden="true" />
                <span>{secondaryCtaText}</span>
              </Link>
            </Button>

            <Button
              asChild
              variant="ghost"
              size="lg"
              className="min-h-[48px] text-[#E8F1FB] hover:bg-white/10 text-base px-6 rounded-xl"
            >
              <Link href={`/${locale}/calendar`}>
                <Calendar className="mr-2 h-5 w-5 text-[#F2B233]" aria-hidden="true" />
                <span>{isEn ? 'Calendar' : 'የቀን መቁጠሪያ'}</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
