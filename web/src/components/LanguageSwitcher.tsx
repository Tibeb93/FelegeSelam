'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Globe } from 'lucide-react';

export function LanguageSwitcher({ currentLocale }: { currentLocale: string }) {
  const pathname = usePathname();

  const getRedirectPath = (targetLocale: string) => {
    if (!pathname) return `/${targetLocale}`;
    const segments = pathname.split('/');
    segments[1] = targetLocale;
    return segments.join('/') || `/${targetLocale}`;
  };

  return (
    <div className="flex items-center gap-2 rounded-full border border-border bg-card/80 px-2 py-1 shadow-sm backdrop-blur">
      <Globe className="h-4 w-4 text-primary ml-1" aria-hidden="true" />
      <Link
        href={getRedirectPath('am')}
        className={`flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full px-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
          currentLocale === 'am'
            ? 'bg-primary text-primary-foreground shadow-sm'
            : 'text-foreground hover:bg-primary/10'
        }`}
        aria-label="ቀይር ወደ አማርኛ"
      >
        አማርኛ
      </Link>
      <Link
        href={getRedirectPath('en')}
        className={`flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full px-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
          currentLocale === 'en'
            ? 'bg-primary text-primary-foreground shadow-sm'
            : 'text-foreground hover:bg-primary/10'
        }`}
        aria-label="Switch to English"
      >
        EN
      </Link>
    </div>
  );
}
