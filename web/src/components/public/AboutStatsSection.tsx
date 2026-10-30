'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Users, GraduationCap, Music, Church } from 'lucide-react';

interface AboutStatsSectionProps {
  locale: string;
}

interface StatItem {
  target: number;
  suffix: string;
  labelAm: string;
  labelEn: string;
  icon: React.ElementType;
}

export function AboutStatsSection({ locale }: AboutStatsSectionProps) {
  const isEn = locale === 'en';
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasAnimated, setHasAnimated] = useState(false);
  const [counts, setCounts] = useState<number[]>([0, 0, 0, 0]);

  const stats: StatItem[] = [
    {
      target: 1200,
      suffix: '+',
      labelAm: 'ተማሪዎችና ንቁ አባላት',
      labelEn: 'Active Students & Members',
      icon: Users,
    },
    {
      target: 35,
      suffix: '+',
      labelAm: 'የትምህርት ክፍሎችና ኮርሶች',
      labelEn: 'Courses & Departments',
      icon: GraduationCap,
    },
    {
      target: 500,
      suffix: '+',
      labelAm: 'መዝሙራት በድምፅና በግጥም',
      labelEn: 'Hymns & Lyrics',
      icon: Music,
    },
    {
      target: 30,
      suffix: '+',
      labelAm: 'ዓመታት በታማኝ አገልግሎት',
      labelEn: 'Years of Faithful Service',
      icon: Church,
    },
  ];

  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      setCounts(stats.map((s) => s.target));
      setHasAnimated(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          const duration = 1200;
          const startTime = performance.now();

          const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Ease out quad
            const easeProgress = 1 - (1 - progress) * (1 - progress);

            setCounts(stats.map((s) => Math.floor(easeProgress * s.target)));

            if (progress < 1) {
              requestAnimationFrame(animate);
            } else {
              setCounts(stats.map((s) => s.target));
            }
          };

          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.2 },
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [hasAnimated]);

  return (
    <div ref={containerRef} className="max-w-lg mx-auto sm:max-w-xl py-3 px-4">
      <h2 className="text-[20px] font-bold text-[#0F4C81] dark:text-[#68A7E0] mb-3 text-left">
        {isEn ? 'About Our Sunday School' : 'ስለ ሰንበት ትምህርት ቤታችን'}
      </h2>

      {/* 2 by 2 grid of stat cards */}
      <div className="grid grid-cols-2 gap-3">
        {stats.map((item, idx) => {
          const Icon = item.icon;
          const displayCount = counts[idx].toLocaleString();
          return (
            <div
              key={idx}
              className="flex flex-col justify-between h-[104px] rounded-2xl border border-[#D7E3F1] dark:border-[#1A3E63] bg-white dark:bg-[#0A2644] p-3.5 shadow-xs"
            >
              <div className="flex items-center justify-between">
                <span className="text-[24px] font-extrabold text-[#0F4C81] dark:text-[#68A7E0] leading-none">
                  {displayCount}
                  {item.suffix}
                </span>
                <Icon className="h-5 w-5 text-[#1E78C8]/70 dark:text-[#68A7E0]/70" aria-hidden="true" />
              </div>
              <p className="text-[12px] font-medium text-[#5B6B7C] dark:text-[#94A3B8] leading-tight">
                {isEn ? item.labelEn : item.labelAm}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

