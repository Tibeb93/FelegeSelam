'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { CertificateVerification } from '@/types/api';
import { apiClient } from '@/lib/api-client';
import { SchoolLogo } from '@/components/common/SchoolLogo';
import {
  ShieldCheck,
  ShieldAlert,
  Download,
  Calendar,
  ArrowLeft,
  Search,
  BookOpen,
} from 'lucide-react';

export default function CertificateVerifyPage() {
  const params = useParams();
  const code = params.code as string;
  const locale = useLocale();
  const t = useTranslations('Courses');
  const tCommon = useTranslations('Common');
  const router = useRouter();

  const [verification, setVerification] = useState<CertificateVerification | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchCode, setSearchCode] = useState('');

  useEffect(() => {
    async function verify() {
      try {
        setLoading(true);
        setError(null);
        const res = await apiClient.get<CertificateVerification>(`/certificates/verify/${code}`);
        if (res) {
          setVerification((res as any).data || res);
        } else {
          setError(t('invalidCertificate'));
        }
      } catch (err: any) {
        setError(
          err?.response?.data?.message || err?.message || t('invalidCertificate'),
        );
      } finally {
        setLoading(false);
      }
    }

    if (code) {
      verify();
    }
  }, [code, t]);

  const handleSearchAnotherCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchCode.trim()) {
      router.push(`/${locale}/verify/${searchCode.trim()}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-muted/20 to-background py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center">
      <div className="w-full max-w-2xl space-y-8">
        {/* Church Branding Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center mb-1">
            <SchoolLogo size={64} />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            {locale === 'am' ? 'አዕማደ ሰላም ሰንበት ትምህርት ቤት' : 'Aemade Selam Sunday School'}
          </h1>
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">
            {t('verifySubtitle')}
          </p>
        </div>

        {/* Verification Card */}
        {loading ? (
          <div className="rounded-3xl border border-border bg-card p-12 text-center shadow-xl space-y-4">
            <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-medium text-muted-foreground">{tCommon('loading')}</p>
          </div>
        ) : error || !verification?.valid ? (
          <div className="rounded-3xl border border-destructive/20 bg-card p-8 shadow-xl text-center space-y-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
              <ShieldAlert className="h-8 w-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-lg font-bold text-destructive">{t('invalidCertificate')}</h2>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                {locale === 'am'
                  ? `«${code}» የተባለው የማረጋገጫ ኮድ በሰንበት ት/ቤቱ መዝገብ ውስጥ አልተገኘም። እባክዎ ኮዱን አስተካክለው ይሞክሩ።`
                  : `Certificate with code "${code}" was not found or is invalid in the official database.`}
              </p>
            </div>

            {/* Code search input */}
            <form
              onSubmit={handleSearchAnotherCode}
              className="flex max-w-sm mx-auto items-center gap-2"
            >
              <input
                type="text"
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value)}
                placeholder="e.g. AS-CERT-2026-..."
                className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                type="submit"
                className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
              >
                <Search className="h-4 w-4" />
              </button>
            </form>
          </div>
        ) : (
          <div className="rounded-3xl border-2 border-secondary/40 bg-card p-6 sm:p-10 shadow-2xl space-y-8 relative overflow-hidden">
            {/* Verified Official Ribbon / Banner */}
            <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-md">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
                    {t('validCertificate')}
                  </h2>
                  <p className="text-xs text-emerald-700/80 dark:text-emerald-400">
                    {t('verifyDesc')}
                  </p>
                </div>
              </div>

              <span className="font-mono text-xs font-bold bg-background px-3 py-1 rounded-lg border border-border text-foreground shadow-sm">
                {verification.certificate.code}
              </span>
            </div>

            {/* Certificate Details Container */}
            <div className="space-y-6 divide-y divide-border text-sm">
              {/* Student Info */}
              <div className="pt-2">
                <span className="text-xs font-medium text-muted-foreground block uppercase tracking-wide">
                  {locale === 'am' ? 'የተማሪው ሙሉ ስም' : 'Student Name'}
                </span>
                <h3 className="text-xl font-bold text-foreground mt-1">
                  {verification.certificate.member.fullName}
                </h3>
                {verification.certificate.member.memberNo && (
                  <p className="text-xs font-mono text-muted-foreground mt-0.5">
                    {locale === 'am' ? 'የአባል ቁጥር' : 'Member No'}:{' '}
                    {verification.certificate.member.memberNo}
                  </p>
                )}
              </div>

              {/* Course Info */}
              <div className="pt-4">
                <span className="text-xs font-medium text-muted-foreground block uppercase tracking-wide">
                  {locale === 'am' ? 'የትምህርቱ ርዕስና ደረጃ' : 'Course & Level'}
                </span>
                <p className="text-base font-semibold text-foreground mt-1 flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-primary shrink-0" />
                  <span>{verification.certificate.course.titleAm}</span>
                  {verification.certificate.course.titleEn && (
                    <span className="text-muted-foreground font-normal text-xs">
                      ({verification.certificate.course.titleEn})
                    </span>
                  )}
                </p>
                {verification.certificate.course.level && (
                  <p className="text-xs text-muted-foreground mt-1 font-medium">
                    {verification.certificate.course.level}
                  </p>
                )}
              </div>

              {/* Performance & Grade Summary */}
              <div className="pt-4 grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs font-medium text-muted-foreground block uppercase tracking-wide">
                    {t('gradeAverage')}
                  </span>
                  <p className="text-lg font-bold text-foreground mt-0.5">
                    {verification.certificate.gradeSummary?.averagePercentage ?? 100}%
                  </p>
                </div>

                <div>
                  <span className="text-xs font-medium text-muted-foreground block uppercase tracking-wide">
                    {t('passFail')}
                  </span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-600 mt-1">
                    {verification.certificate.gradeSummary?.result || 'PASS'}
                  </span>
                </div>
              </div>

              {/* Issued Date */}
              <div className="pt-4 flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  <span>{t('issuedDate')}:</span>
                </span>
                <span className="font-semibold text-foreground">
                  {new Date(verification.certificate.issuedAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Official PDF Download Button */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border">
              <Link
                href={`/${locale}`}
                className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>{locale === 'am' ? 'ወደ ዋና ገጽ' : 'Return to Home'}</span>
              </Link>

              <a
                href={`/api/v1/certificates/verify/${verification.certificate.code}/pdf`}
                download={`Certificate_${verification.certificate.code}.pdf`}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground shadow-md hover:bg-primary/90 transition-all"
              >
                <Download className="h-4 w-4" />
                <span>{t('downloadCert')}</span>
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
