import React from 'react';
import { getCmsPage } from '@/lib/cms';
import { SectionRenderer } from '@/components/cms/SectionRenderer';
import { Wrench } from 'lucide-react';

interface MaintenancePageProps {
  params: {
    locale: string;
  };
}

export default async function MaintenancePage({ params }: MaintenancePageProps) {
  const { locale } = params;
  const cmsPage = await getCmsPage('maintenance');

  if (cmsPage && cmsPage.sections && cmsPage.sections.length > 0) {
    return (
      <main className="min-h-screen bg-background">
        {cmsPage.sections.map((section, idx) => (
          <SectionRenderer
            key={section.id || `sec-maint-${idx}`}
            section={section}
            locale={locale}
          />
        ))}
      </main>
    );
  }

  const isAmharic = locale === 'am';

  return (
    <div className="flex min-h-[75vh] flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 rounded-full bg-accent/20 text-accent flex items-center justify-center mb-6">
        <Wrench className="w-10 h-10" />
      </div>
      <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight mb-3">
        {isAmharic ? 'የስርዓት ጥገና በሂደት ላይ ነው' : 'System Maintenance in Progress'}
      </h1>
      <p className="text-base text-muted-foreground max-w-lg leading-relaxed">
        {isAmharic
          ? 'ድረ-ገጻችንን ይበልጥ ለማሻሻል አጭር የጥገና ሥራ እየተከናወነ ይገኛል። በቅርቡ ተመልሰን እንገናኛለን!'
          : 'Our site is temporarily down for scheduled maintenance and upgrades. We will be back online shortly!'}
      </p>
    </div>
  );
}
