import React from 'react';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { getCmsPage } from '@/lib/cms';
import { SectionRenderer } from '@/components/cms/SectionRenderer';

interface PageProps {
  params: {
    locale: string;
    slug: string;
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, locale } = params;
  const page = await getCmsPage(slug);

  if (!page) {
    return {
      title: 'Page Not Found',
    };
  }

  const isAmharic = locale === 'am';
  const pageTitle = isAmharic
    ? page.seo?.titleAm || page.titleAm
    : page.seo?.titleEn || page.titleEn;
  const pageDesc = isAmharic
    ? page.seo?.descAm || `${page.titleAm} - ፈለገ ሰላም ቅዱስ ጊዮርጊስ ካቴድራል አዕማደ ሰላም ሰ/ት/ቤት`
    : page.seo?.descEn || `${page.titleEn} - Felegeselam Kidus Giyorgis Cathedral Aemade Selam Sunday School`;

  return {
    title: pageTitle,
    description: pageDesc,
    openGraph: {
      title: pageTitle,
      description: pageDesc,
    },
  };
}

export default async function DynamicCmsPage({ params }: PageProps) {
  const { slug, locale } = params;

  const page = await getCmsPage(slug);

  if (!page) {
    notFound();
  }

  const sections = (page.sections || []).sort((a, b) => (a.orderNo ?? 0) - (b.orderNo ?? 0));

  return (
    <main className="min-h-screen bg-background">
      {sections.map((section, idx) => (
        <SectionRenderer
          key={section.id || `sec-${idx}`}
          section={section}
          locale={locale}
        />
      ))}
    </main>
  );
}
