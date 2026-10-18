'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { Course, CourseReport, CourseReportStudent } from '@/types/api';
import { apiClient } from '@/lib/api-client';
import {
  Award,
  Download,
  Eye,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  FileCheck,
  X,
  FileSpreadsheet,
} from 'lucide-react';

interface CourseCertificatesTabProps {
  course: Course;
  report?: CourseReport | null;
  onRefresh: () => void;
}

export function CourseCertificatesTab({
  course,
  report,
  onRefresh,
}: CourseCertificatesTabProps) {
  const locale = useLocale();
  const t = useTranslations('Courses');
  const tCommon = useTranslations('Common');

  const students: CourseReportStudent[] = report?.students || [];

  const [selectedEnrollmentIds, setSelectedEnrollmentIds] = useState<Set<string>>(new Set());
  const [issuing, setIssuing] = useState(false);
  const [issueSuccessMsg, setIssueSuccessMsg] = useState<string | null>(null);
  const [issueErrorMsg, setIssueErrorMsg] = useState<string | null>(null);

  // PDF Preview modal
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);

  const toggleSelectAll = () => {
    const unissued = students.filter((s) => !s.certificate?.issued);
    if (selectedEnrollmentIds.size === unissued.length) {
      setSelectedEnrollmentIds(new Set());
    } else {
      setSelectedEnrollmentIds(new Set(unissued.map((s) => s.enrollmentId)));
    }
  };

  const toggleSelectOne = (enrollmentId: string) => {
    const updated = new Set(selectedEnrollmentIds);
    if (updated.has(enrollmentId)) {
      updated.delete(enrollmentId);
    } else {
      updated.add(enrollmentId);
    }
    setSelectedEnrollmentIds(updated);
  };

  const handleIssueCertificates = async () => {
    if (selectedEnrollmentIds.size === 0) return;
    try {
      setIssuing(true);
      setIssueSuccessMsg(null);
      setIssueErrorMsg(null);

      for (const enrollmentId of Array.from(selectedEnrollmentIds)) {
        await apiClient.post('/certificates/issue', {
          enrollmentId,
        });
      }

      setSelectedEnrollmentIds(new Set());
      setIssueSuccessMsg(
        locale === 'am'
          ? 'የምስክር ወረቀቶች በተሳካ ሁኔታ ተሰጥተዋል'
          : 'Certificates issued successfully',
      );
      onRefresh();
    } catch (err: any) {
      setIssueErrorMsg(
        err?.response?.data?.message || err?.message || 'Failed to issue certificates',
      );
    } finally {
      setIssuing(false);
    }
  };

  const unissuedStudents = students.filter((s) => !s.certificate?.issued);
  const issuedStudents = students.filter((s) => s.certificate?.issued);

  return (
    <div className="space-y-6">
      {/* Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            <Award className="h-5 w-5 text-amber-500" />
            <span>{t('tabCertificates')}</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {locale === 'am'
              ? 'ትምህርቱን ላጠናቀቁ ተማሪዎች ይፋዊ ዲጂታል የምስክር ወረቀት ከQR ኮድ ጋር ይስጡ'
              : 'Issue authentic Sunday School certificates with QR code verification and download official PDFs'}
          </p>
        </div>

        <button
          type="button"
          disabled={selectedEnrollmentIds.size === 0 || issuing}
          onClick={handleIssueCertificates}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-all disabled:opacity-50 self-start sm:self-auto"
        >
          <Award className="h-4 w-4" />
          <span>
            {issuing
              ? tCommon('loading')
              : `${t('issueSelected')} (${selectedEnrollmentIds.size})`}
          </span>
        </button>
      </div>

      {issueSuccessMsg && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
          <CheckCircle className="h-4 w-4 shrink-0" />
          <span>{issueSuccessMsg}</span>
        </div>
      )}

      {issueErrorMsg && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{issueErrorMsg}</span>
        </div>
      )}

      {/* Students Table with Certificate Details */}
      {students.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center text-xs text-muted-foreground">
          {locale === 'am'
            ? 'በዚህ ትምህርት ውስጥ የተመዘገቡ ተማሪዎች አልተገኙም'
            : 'No students enrolled to issue certificates'}
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 border-b border-border text-xs font-semibold text-muted-foreground uppercase">
                <tr>
                  <th className="px-4 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={
                        unissuedStudents.length > 0 &&
                        selectedEnrollmentIds.size === unissuedStudents.length
                      }
                      onChange={toggleSelectAll}
                      className="rounded border-border text-primary focus:ring-primary"
                    />
                  </th>
                  <th className="px-4 py-3">{locale === 'am' ? 'ተማሪ' : 'Student'}</th>
                  <th className="px-4 py-3">{locale === 'am' ? 'የአባል ቁጥር' : 'Member No'}</th>
                  <th className="px-4 py-3 text-center">{t('gradeAverage')}</th>
                  <th className="px-4 py-3 text-center">{t('passFail')}</th>
                  <th className="px-4 py-3">{t('certNo')}</th>
                  <th className="px-4 py-3 text-right">{tCommon('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {students.map((st) => {
                  const cert = st.certificate;
                  const isIssued = cert?.issued;
                  const isSelected = selectedEnrollmentIds.has(st.enrollmentId);

                  return (
                    <tr
                      key={st.enrollmentId}
                      className={`hover:bg-muted/20 transition-colors ${
                        isSelected ? 'bg-primary/5' : ''
                      }`}
                    >
                      <td className="px-4 py-3">
                        {!isIssued && (
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectOne(st.enrollmentId)}
                            className="rounded border-border text-primary focus:ring-primary"
                          />
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium text-foreground">{st.member.fullName}</td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        {st.member.memberNo}
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-xs">
                        {st.grades.averagePercentage}%
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                            st.grades.result === 'PASS'
                              ? 'bg-emerald-500/15 text-emerald-600'
                              : 'bg-destructive/15 text-destructive'
                          }`}
                        >
                          {st.grades.result}
                        </span>
                      </td>

                      {/* Certificate Code / Status */}
                      <td className="px-4 py-3">
                        {isIssued && cert?.code ? (
                          <span className="font-mono text-xs font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-lg border border-primary/20">
                            {cert.code}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">
                            {locale === 'am' ? 'አልተሰጠም' : 'Not issued'}
                          </span>
                        )}
                      </td>

                      {/* Actions: Preview, Download, Public Verify */}
                      <td className="px-4 py-3 text-right">
                        {isIssued && cert?.code ? (
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Preview Certificate PDF */}
                            <button
                              type="button"
                              onClick={() =>
                                setPreviewPdfUrl(`/api/v1/certificates/verify/${cert.code}/pdf`)
                              }
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                              title={t('previewCert')}
                            >
                              <Eye className="h-4 w-4" />
                            </button>

                            {/* Download PDF */}
                            <a
                              href={`/api/v1/certificates/verify/${cert.code}/pdf`}
                              download={`Certificate_${cert.code}.pdf`}
                              className="p-1.5 rounded-lg text-primary hover:bg-primary/10 transition-colors"
                              title={t('downloadCert')}
                            >
                              <Download className="h-4 w-4" />
                            </a>

                            {/* Link to Public Verification Page */}
                            <Link
                              href={`/${locale}/verify/${cert.code}`}
                              target="_blank"
                              className="p-1.5 rounded-lg text-secondary hover:bg-secondary/10 transition-colors"
                              title={t('verifyCert')}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Link>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedEnrollmentIds(new Set([st.enrollmentId]));
                              handleIssueCertificates();
                            }}
                            className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted transition-colors"
                          >
                            <Award className="h-3.5 w-3.5 text-amber-500" />
                            <span>{t('issueCertificates')}</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PDF Preview Modal */}
      {previewPdfUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-4xl rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-primary" />
                <span>{t('previewCert')}</span>
              </h3>
              <button
                type="button"
                onClick={() => setPreviewPdfUrl(null)}
                className="rounded-lg p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="h-[600px] w-full rounded-xl overflow-hidden border border-border bg-muted/20">
              <iframe
                src={previewPdfUrl}
                className="w-full h-full"
                title="Certificate PDF Preview"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <a
                href={previewPdfUrl}
                download="Certificate.pdf"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
              >
                <Download className="h-4 w-4" />
                <span>{t('downloadCert')}</span>
              </a>
              <button
                type="button"
                onClick={() => setPreviewPdfUrl(null)}
                className="rounded-xl bg-muted px-4 py-2 text-xs font-medium hover:bg-muted/80"
              >
                {tCommon('close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
