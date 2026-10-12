'use client';

import { useEffect, useState } from 'react';
import { Calendar } from 'lucide-react';
import { gregorianToEthiopian, formatEthiopianDate } from '@/lib/ethiopian-calendar';

export function DateDisplay({ locale }: { locale: 'am' | 'en' }) {
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState<Date>(new Date());

  useEffect(() => {
    setMounted(true);
    setNow(new Date());
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center gap-2 text-sm font-medium text-foreground/80">
        <Calendar className="h-4 w-4 text-secondary" aria-hidden="true" />
        <span>...</span>
      </div>
    );
  }

  const ethDate = gregorianToEthiopian(now);
  const ethFormatted = formatEthiopianDate(ethDate, locale);
  const gregFormatted = now.toLocaleDateString(locale === 'am' ? 'am-ET' : 'en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border/80 bg-card/60 px-3 py-1.5 text-sm font-medium text-foreground shadow-sm">
      <Calendar className="h-4 w-4 text-secondary shrink-0" aria-hidden="true" />
      <span className="font-semibold text-primary">{ethFormatted}</span>
      <span className="text-muted-foreground">•</span>
      <span className="text-foreground/80">{gregFormatted} G.C.</span>
    </div>
  );
}
