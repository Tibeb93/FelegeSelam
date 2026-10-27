import React from 'react';
import Link from 'next/link';
import { ArrowRight, UserPlus, Sparkles } from 'lucide-react';

interface MemberCtaSectionProps {
  content: {
    title?: string;
    subtitle?: string;
    buttonText?: string;
    buttonLink?: string;
    badgeText?: string;
  };
  config?: {
    backgroundStyle?: 'gradient' | 'solid' | 'image';
    buttonVariant?: 'accent' | 'primary';
  };
  locale: string;
}

export const MemberCtaSection: React.FC<MemberCtaSectionProps> = ({
  content,
  config = {},
  locale,
}) => {
  const {
    title = 'Become Part of Our Sunday School Family',
    subtitle = '',
    buttonText = 'Complete Registration Form',
    buttonLink = '/register',
    badgeText = 'Join Us Today',
  } = content;

  const { backgroundStyle = 'gradient', buttonVariant = 'accent' } = config;

  let bgClass = 'bg-gradient-to-r from-primary via-primary-dark to-slate-900 text-white';
  if (backgroundStyle === 'solid') bgClass = 'bg-primary text-primary-foreground';

  const btnClass =
    buttonVariant === 'accent'
      ? 'bg-accent text-slate-950 hover:bg-accent/90 shadow-accent/20'
      : 'bg-white text-primary hover:bg-slate-100 shadow-white/20';

  return (
    <div
      className={`relative overflow-hidden rounded-3xl p-8 sm:p-12 md:p-16 text-center ${bgClass} shadow-xl border border-white/10`}
    >
      <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center">
        {badgeText && (
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 text-white font-medium text-xs sm:text-sm mb-6 backdrop-blur-sm">
            <Sparkles className="w-4 h-4 text-accent" />
            <span>{badgeText}</span>
          </div>
        )}

        {title && (
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight mb-4 leading-tight">
            {title}
          </h2>
        )}

        {subtitle && (
          <p className="text-sm sm:text-base md:text-lg text-white/80 max-w-2xl mb-8 leading-relaxed font-normal">
            {subtitle}
          </p>
        )}

        {buttonText && (
          <Link
            href={`/${locale}${buttonLink.startsWith('/') ? buttonLink : `/${buttonLink}`}`}
            className={`inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-sm sm:text-base transition-all transform hover:-translate-y-0.5 shadow-lg ${btnClass}`}
          >
            <UserPlus className="w-5 h-5" />
            <span>{buttonText}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        )}
      </div>

      <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-accent/15 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-primary-light/20 blur-3xl pointer-events-none" />
    </div>
  );
};
