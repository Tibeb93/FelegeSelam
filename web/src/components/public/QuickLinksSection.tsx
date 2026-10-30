'use client';

import React from 'react';
import Link from 'next/link';
import { Newspaper, Music, BookOpen, CalendarDays, ChevronRight } from 'lucide-react';

interface QuickLinksSectionProps {
  locale: string;
}

export function QuickLinksSection({ locale }: QuickLinksSectionProps) {
  const isEn = locale === 'en';

  const links = [
    {
      id: 'news',
      title: isEn ? 'News & Notices' : 'ዜናና ማስታወቂያ',
      icon: Newspaper,
      href: `/${locale}/news`,
    },
    {
      id: 'mezmur',
      title: isEn ? 'Mezmur Library' : 'መዝሙራት',
      icon: Music,
      href: `/${locale}/mezmur`,
    },
    {
      id: 'courses',
      title: isEn ? 'Spiritual Courses' : 'ትምህርቶች',
      icon: BookOpen,
      href: `/${locale}/courses`,
    },
    {
      id: 'calendar',
      title: isEn ? 'Calendar' : 'ቀን መቁጠሪያ',
      icon: CalendarDays,
      href: `/${locale}#calendar`,
    },
  ];

  return (
    <section id="quick-links" className="scroll-mt-[72px] px-4 py-3">
      <div className="max-w-lg mx-auto sm:max-w-xl">
        <h2 className="text-[20px] font-bold text-[#0F4C81] dark:text-[#68A7E0] mb-3 text-left">
          {isEn ? 'Quick Links' : 'ፈጣን አገናኞች'}
        </h2>

        {/* 2 by 2 grid of white cards */}
        <div className="grid grid-cols-2 gap-3">
          {links.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.id}
                href={item.href}
                className="flex items-center justify-between h-[72px] rounded-2xl border border-[#D7E3F1] dark:border-[#1A3E63] bg-white dark:bg-[#0A2644] p-3.5 shadow-xs hover:border-[#1E78C8] hover:shadow-sm active:scale-[0.98] transition-all"
              >
                <div className="flex items-center gap-2.5 min-w-0 pr-1">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#E8F1FB] dark:bg-[#061B30]">
                    <Icon className="h-5 w-5 text-[#1E78C8]" aria-hidden="true" />
                  </div>
                  <span className="text-sm font-semibold text-[#0F2438] dark:text-white truncate">
                    {item.title}
                  </span>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-[#5B6B7C]/60 dark:text-white/40" aria-hidden="true" />
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

