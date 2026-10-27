'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, Info, CheckCircle2, AlertCircle, X, ArrowRight } from 'lucide-react';

interface AnnouncementBannerSectionProps {
  content: {
    message?: string;
    linkText?: string;
    linkUrl?: string;
  };
  config?: {
    type?: 'info' | 'warning' | 'success' | 'urgent';
    dismissible?: boolean;
    sticky?: boolean;
  };
  locale: string;
}

export const AnnouncementBannerSection: React.FC<AnnouncementBannerSectionProps> = ({
  content,
  config = {},
  locale,
}) => {
  const { message = '', linkText, linkUrl } = content;
  const { type = 'info', dismissible = true, sticky = false } = config;
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || !message) return null;

  let bgClass = 'bg-primary text-primary-foreground';
  let IconComponent = Info;

  if (type === 'warning') {
    bgClass = 'bg-amber-500 text-slate-950 font-medium';
    IconComponent = AlertTriangle;
  } else if (type === 'success') {
    bgClass = 'bg-emerald-600 text-white';
    IconComponent = CheckCircle2;
  } else if (type === 'urgent') {
    bgClass = 'bg-destructive text-destructive-foreground font-semibold';
    IconComponent = AlertCircle;
  }

  return (
    <div
      className={`w-full py-2.5 px-4 ${bgClass} ${sticky ? 'sticky top-0 z-40' : ''} shadow-sm transition-all`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 text-xs sm:text-sm">
        <div className="flex items-center gap-2.5 mx-auto">
          <IconComponent className="w-4 h-4 flex-shrink-0" />
          <span>{message}</span>
          {linkText && linkUrl && (
            <Link
              href={`/${locale}${linkUrl.startsWith('/') ? linkUrl : `/${linkUrl}`}`}
              className="inline-flex items-center gap-1 font-bold underline underline-offset-2 ml-2 hover:opacity-85"
            >
              <span>{linkText}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

        {dismissible && (
          <button
            onClick={() => setDismissed(true)}
            className="p-1 rounded-md hover:bg-black/10 transition-colors flex-shrink-0"
            aria-label="Dismiss banner"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
