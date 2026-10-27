'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Settings, ArrowRight } from 'lucide-react';

export default function SettingsRedirectPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const router = useRouter();

  useEffect(() => {
    router.replace(`/${locale}/admin/site`);
  }, [locale, router]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center p-6">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4">
        <Settings className="h-8 w-8 animate-spin" />
      </div>
      <h1 className="text-xl font-bold text-foreground mb-2">
        {locale === 'am' ? 'ወደ ጣቢያ ቅንብሮች እየተዛወረ...' : 'Redirecting to Site Settings...'}
      </h1>
      <p className="text-sm text-muted-foreground mb-6">
        {locale === 'am'
          ? 'የጣቢያው ሙሉ ማስተካከያዎች ወደ አዲሱ መቆጣጠሪያ ተዛውረዋል።'
          : 'All site configuration options are now centralized under Site Settings.'}
      </p>
      <Link
        href={`/${locale}/admin/site`}
        className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
      >
        <span>{locale === 'am' ? 'ወደ ጣቢያ ቅንብሮች ቀጥታ ይሂዱ' : 'Go to Site Settings'}</span>
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

