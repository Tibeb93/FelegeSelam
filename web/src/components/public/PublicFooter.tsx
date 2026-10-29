'use client';

import React from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Mail, Phone, MapPin } from 'lucide-react';
import { SchoolLogo } from '../common/SchoolLogo';
import { useSiteIdentity } from '../../hooks/useSiteIdentity';

interface PublicFooterProps {
  locale: string;
}

export function PublicFooter({ locale }: PublicFooterProps) {
  const t = useTranslations('Website');
  const tCommon = useTranslations('Common');
  const siteIdentity = useSiteIdentity(locale);

  return (
    <footer className="border-t border-[#D7E3F1] dark:border-[#1A3E63] bg-white dark:bg-[#0A2644] text-foreground" aria-label="Website Footer">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Column 1: School Profile & Motto */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <SchoolLogo size={46} />
              <div>
                <h3 className="text-base font-bold text-foreground">
                  {siteIdentity.schoolName}
                </h3>
                <p className="text-xs font-semibold tracking-wider text-[#0F4C81] dark:text-[#68A7E0]">
                  {siteIdentity.churchName}
                </p>
              </div>
            </div>

            <p className="text-sm leading-relaxed text-muted-foreground">
              {locale === 'am'
                ? `በ${siteIdentity.churchName} ${siteIdentity.schoolName}፤ የኦርቶዶክሳዊ ተዋሕዶ እምነት፣ ሥርዓትና ትውፊት ማዕከል ነው። (${siteIdentity.combinedLine})`
                : `${siteIdentity.schoolName} under ${siteIdentity.churchName}, fostering faith, divine knowledge, and holy tradition in ${siteIdentity.combinedLine}.`}
            </p>

            <div className="inline-block rounded-xl bg-[#E8F1FB] dark:bg-[#061B30] border border-[#D7E3F1] dark:border-[#1A3E63] px-3 py-1.5 text-xs font-semibold text-[#0F4C81] dark:text-[#F2B233]">
              {locale === 'am'
                ? `መሪ ቃል: ${siteIdentity.tagline}`
                : `Motto: ${siteIdentity.tagline}`}
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold uppercase tracking-wider text-primary">
              {locale === 'am' ? 'ፈጣን ማውጫ' : 'Quick Links'}
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link
                  href={`/${locale}`}
                  className="hover:text-primary transition-colors focus:underline"
                >
                  {t('navHome')}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/about`}
                  className="hover:text-primary transition-colors focus:underline"
                >
                  {t('navAbout')}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/news`}
                  className="hover:text-primary transition-colors focus:underline"
                >
                  {t('navNews')}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/calendar`}
                  className="hover:text-primary transition-colors focus:underline"
                >
                  {t('navCalendar')}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/contact`}
                  className="hover:text-primary transition-colors focus:underline"
                >
                  {t('navContact')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Spiritual Content & Services */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold uppercase tracking-wider text-primary">
              {locale === 'am' ? 'መንፈሳዊ አገልግሎቶች' : 'Spiritual Services'}
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link
                  href={`/${locale}/mezmur`}
                  className="hover:text-primary transition-colors focus:underline"
                >
                  {t('navMezmur')}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/courses`}
                  className="hover:text-primary transition-colors focus:underline"
                >
                  {t('navCourses')}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/register`}
                  className="hover:text-primary transition-colors focus:underline"
                >
                  {t('navRegister')}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/portal`}
                  className="hover:text-primary transition-colors focus:underline"
                >
                  {t('navPortal')}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/verify/SAMPLE-CODE`}
                  className="hover:text-primary transition-colors focus:underline"
                >
                  {locale === 'am' ? 'የምስክር ወረቀት ማረጋገጫ' : 'Certificate Verification'}
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Contact & Location */}
          <div id="contact" className="scroll-mt-24 space-y-3">
            <h4 className="text-sm font-bold uppercase tracking-wider text-primary">
              {locale === 'am' ? 'የመገናኛ አድራሻ' : 'Contact & Location'}
            </h4>
            <div className="space-y-2.5 text-sm text-muted-foreground">
              <div className="flex items-start gap-2.5">
                <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span>{siteIdentity.address}</span>
              </div>
              {siteIdentity.hasPhone && (
                <div className="flex items-center gap-2.5">
                  <Phone className="h-4 w-4 text-primary shrink-0" />
                  <span>{siteIdentity.phone}</span>
                </div>
              )}
              {siteIdentity.hasEmail && (
                <div className="flex items-center gap-2.5">
                  <Mail className="h-4 w-4 text-primary shrink-0" />
                  <span>{siteIdentity.email}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 border-t border-border/80 pt-6 flex flex-col items-center justify-between gap-4 text-xs text-muted-foreground sm:flex-row">
          <p>
            © {new Date().getFullYear()} {tCommon('schoolName')}. {locale === 'am' ? 'መብቱ በሕግ የተጠበቀ ነው።' : 'All rights reserved.'}
          </p>
        </div>
      </div>
    </footer>
  );
}
