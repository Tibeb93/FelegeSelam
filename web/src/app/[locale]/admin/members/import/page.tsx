'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import * as XLSX from 'xlsx';
import {
  ArrowLeft,
  Download,
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
  ChevronRight,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { apiClient } from '../../../../../lib/api-client';
import { useToast } from '../../../../../providers/ToastProvider';

interface PreviewRow {
  rowNumber: number;
  firstName: string;
  fatherName: string;
  grandfatherName?: string;
  baptismalName?: string;
  sex: string;
  dateOfBirth?: string;
  phone?: string;
  email?: string;
  errors: string[];
}

interface ImportReport {
  total: number;
  created: number;
  skipped: number;
  errorsCount: number;
  errors: Array<{
    row: number;
    name?: string;
    reasons: string[];
  }>;
  createdMembers: Array<{
    id: string;
    memberNo: string;
    fullName: string;
  }>;
}

export default function MemberImportWizardPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = useTranslations('Members');
  const tCommon = useTranslations('Common');
  const toast = useToast();
  const isAm = locale === 'am';

  const [step, setStep] = useState<'upload' | 'preview' | 'report'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [previewRows, setPreviewRows] = useState<PreviewRow[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [report, setReport] = useState<ImportReport | null>(null);

  // Download official Excel template from API
  const handleDownloadTemplate = async () => {
    try {
      toast.info(
        isAm ? 'ቅጹ በመውረድ ላይ ነው...' : 'Downloading template...',
        isAm ? 'የExcel ቅጽ' : 'Excel Template'
      );
      const blob = await apiClient.get<Blob>('/members/template');
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Aemade_Selam_Members_Template.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success(isAm ? 'ቅጹ ወርዷል' : 'Template downloaded');
    } catch (err: any) {
      toast.error(err.message || (isAm ? 'ቅጹን ማውረድ አልተቻለም' : 'Failed to download template'));
    }
  };

  // Handle File Selection and Parsing
  const handleFileChange = async (selectedFile: File) => {
    setFile(selectedFile);
    try {
      const data = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];

      // Convert sheet to json array of arrays
      const rows: any[][] = XLSX.utils.sheet_to_json(sheet, {
        header: 1,
        defval: '',
      });

      // Rows 0 and 1 are title and headers, data starts at index 2 (row 3)
      const parsedRows: PreviewRow[] = [];

      for (let i = 2; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length === 0) continue;

        const firstName = String(row[0] || '').trim();
        const fatherName = String(row[1] || '').trim();
        const grandfatherName = String(row[2] || '').trim();
        const baptismalName = String(row[3] || '').trim();
        const sexRaw = String(row[4] || '').trim().toLowerCase();
        const dateOfBirth = String(row[5] || '').trim();
        const phone = String(row[6] || '').trim();
        const email = String(row[7] || '').trim();

        // Skip completely empty row
        if (!firstName && !fatherName && !phone && !email) continue;

        const errors: string[] = [];
        if (!firstName) {
          errors.push(isAm ? 'ስም አልተሞላም' : 'First name is required');
        }
        if (!fatherName) {
          errors.push(isAm ? 'የአባት ስም አልተሞላም' : 'Father name is required');
        }

        const validSexes = ['male', 'female', 'ወንድ', 'ሴት', 'm', 'f'];
        if (!sexRaw || !validSexes.includes(sexRaw)) {
          errors.push(isAm ? 'ትክክለኛ ጾታ አይደለም (ወንድ/ሴት)' : 'Invalid sex value');
        }

        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          errors.push(isAm ? 'የኢሜይል ቅርጸት የተሳሳተ ነው' : 'Invalid email format');
        }

        parsedRows.push({
          rowNumber: i + 1, // 1-indexed row number in Excel
          firstName,
          fatherName,
          grandfatherName,
          baptismalName,
          sex: sexRaw,
          dateOfBirth,
          phone,
          email,
          errors,
        });
      }

      if (parsedRows.length === 0) {
        toast.error(
          isAm
            ? 'በተመረጠው የExcel ፋይል ውስጥ ምንም የአባላት መረጃ አልተገኘም'
            : 'No member rows found in the uploaded file'
        );
        return;
      }

      setPreviewRows(parsedRows);
      setStep('preview');
    } catch {
      toast.error(isAm ? 'የExcel ፋይሉን ማንበብ አልተቻለም' : 'Failed to parse Excel file');
    }
  };

  // Confirm and submit to backend API
  const handleConfirmImport = async () => {
    if (!file) return;
    setIsSubmitting(true);

    try {
      toast.info(
        isAm ? 'አባላትን ወደ ሥርዓቱ በማስገባት ላይ...' : 'Importing members to system...',
        isAm ? 'የውሂብ ምዝገባ' : 'Importing Data'
      );

      const formData = new FormData();
      formData.append('file', file);

      const res = await apiClient.post<ImportReport>('/members/import', formData);
      setReport(res);
      setStep('report');
      toast.success(
        isAm
          ? `${res.created} አባላት በተሳካ ሁኔታ ተመዝግበዋል`
          : `Successfully imported ${res.created} members`
      );
    } catch (err: any) {
      toast.error(err.message || (isAm ? 'ማስገባት አልተቻለም' : 'Import failed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasRowErrors = previewRows.some((r) => r.errors.length > 0);
  const validRowCount = previewRows.filter((r) => r.errors.length === 0).length;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <Link
            href={`/${locale}/admin/members`}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground transition-colors shadow-sm"
            title={tCommon('back')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
              {t('importTitle')}
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">
              {t('importSubtitle')}
            </p>
          </div>
        </div>

        {/* Download Template Button */}
        <button
          type="button"
          onClick={handleDownloadTemplate}
          className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs md:text-sm font-semibold text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-400 transition-colors shadow-sm"
        >
          <Download className="h-4 w-4" />
          <span>{t('downloadTemplate')}</span>
        </button>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-4 py-2 text-xs md:text-sm font-medium">
        <div
          className={`flex items-center gap-2 ${
            step === 'upload' ? 'text-primary font-bold' : 'text-muted-foreground'
          }`}
        >
          <span
            className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
              step === 'upload'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            1
          </span>
          <span>{isAm ? 'ፋይል ምረጥ' : 'Upload File'}</span>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
        <div
          className={`flex items-center gap-2 ${
            step === 'preview' ? 'text-primary font-bold' : 'text-muted-foreground'
          }`}
        >
          <span
            className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
              step === 'preview'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            2
          </span>
          <span>{t('previewRows')}</span>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
        <div
          className={`flex items-center gap-2 ${
            step === 'report' ? 'text-primary font-bold' : 'text-muted-foreground'
          }`}
        >
          <span
            className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
              step === 'report'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            3
          </span>
          <span>{isAm ? 'የውጤት ሪፖርት' : 'Result Report'}</span>
        </div>
      </div>

      {/* STEP 1: UPLOAD */}
      {step === 'upload' && (
        <div className="mx-auto max-w-2xl rounded-2xl border-2 border-dashed border-border bg-card p-10 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <FileSpreadsheet className="h-8 w-8" />
          </div>

          <h2 className="mt-4 text-lg font-bold text-foreground">
            {t('uploadExcel')}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {isAm
              ? 'የተሞላውን የExcel (.xlsx) ሰነድ ይጎትቱ ወይም ይምረጡ'
              : 'Drag & drop or browse your filled .xlsx spreadsheet'}
          </p>

          <label className="mt-6 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90 transition-colors">
            <UploadCloud className="h-4 w-4" />
            <span>{isAm ? 'ፋይል ምረጥ (.xlsx)' : 'Browse File (.xlsx)'}</span>
            <input
              type="file"
              accept=".xlsx, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFileChange(f);
              }}
            />
          </label>

          <div className="mt-8 border-t border-border pt-6 text-left text-xs text-muted-foreground space-y-2">
            <p className="font-semibold text-foreground">
              {isAm ? 'መመሪያዎች:' : 'Instructions:'}
            </p>
            <ul className="list-disc pl-4 space-y-1">
              <li>
                {isAm
                  ? 'ከላይ ያለውን "የExcel ቅጽ (Template) አውርድ" በመጫን የተዘጋጀውን ሰነድ ይጠቀሙ።'
                  : 'Download the official template using the button above.'}
              </li>
              <li>
                {isAm
                  ? 'የአባሉ ስም፣ የአባት ስም እና ጾታ የግዴታ መሞላት አለባቸው።'
                  : 'First name, father name, and sex fields are mandatory.'}
              </li>
              <li>
                {isAm
                  ? 'ስልክ ቁጥርና ኢሜይል ከተሞሉ ከዚህ ቀደም በሌላ አባል ያልተመዘገቡ መሆን አለባቸው።'
                  : 'Phone number and email must be unique across all members.'}
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* STEP 2: PREVIEW */}
      {step === 'preview' && (
        <div className="space-y-6">
          {/* Summary Banner */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-foreground text-base">
                  {file?.name}
                </span>
                <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-mono">
                  {previewRows.length} {isAm ? 'ረድፎች' : 'rows'}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {isAm
                  ? `ትክክለኛ ረድፎች፡ ${validRowCount} | ስህተት ያለባቸው፡ ${previewRows.length - validRowCount}`
                  : `Valid rows: ${validRowCount} | Rows with errors: ${previewRows.length - validRowCount}`}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setStep('upload');
                  setFile(null);
                  setPreviewRows([]);
                }}
                className="rounded-xl border border-border px-4 py-2 text-xs md:text-sm font-medium text-foreground hover:bg-muted transition-colors"
              >
                {isAm ? 'ፋይል ቀይር' : 'Change File'}
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmImport}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-xs md:text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                <span>
                  {isSubmitting
                    ? isAm
                      ? 'በማስገባት ላይ...'
                      : 'Importing...'
                    : t('confirmImport')}
                </span>
              </button>
            </div>
          </div>

          {/* Validation Warning Notice if any */}
          {hasRowErrors && (
            <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/40 dark:bg-amber-950/20 text-xs text-amber-800 dark:text-amber-300">
              <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
              <div>
                <p className="font-bold mb-0.5">
                  {isAm ? 'ማስጠንቀቂያ፡ በአንዳንድ ረድፎች ላይ ስህተቶች ተገኝተዋል' : 'Warning: Errors detected in some rows'}
                </p>
                <p>
                  {isAm
                    ? 'ስህተት ያለባቸው ረድፎች ሳይገቡ ይዘለላሉ። ትክክለኛ የሆኑት ረድፎች ብቻ ይመዘገባሉ።'
                    : 'Rows with errors will be skipped during import. Only valid rows will be recorded.'}
                </p>
              </div>
            </div>
          )}

          {/* Preview Table */}
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <div className="overflow-x-auto max-h-[500px]">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 border-b border-border bg-muted/90 backdrop-blur-sm uppercase font-semibold text-muted-foreground z-10">
                  <tr>
                    <th className="px-4 py-3">{isAm ? 'ረድፍ' : 'Row'}</th>
                    <th className="px-4 py-3">{t('fullName')}</th>
                    <th className="px-4 py-3">{isAm ? 'ጾታ' : 'Sex'}</th>
                    <th className="px-4 py-3">{t('phone')}</th>
                    <th className="px-4 py-3">{t('email')}</th>
                    <th className="px-4 py-3">{t('status')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {previewRows.map((row) => (
                    <tr
                      key={row.rowNumber}
                      className={row.errors.length > 0 ? 'bg-rose-50/40 dark:bg-rose-950/20' : 'hover:bg-muted/30'}
                    >
                      <td className="px-4 py-3 font-mono font-bold text-muted-foreground">
                        #{row.rowNumber}
                      </td>
                      <td className="px-4 py-3 font-semibold text-foreground">
                        {row.firstName} {row.fatherName} {row.grandfatherName || ''}
                      </td>
                      <td className="px-4 py-3 capitalize text-muted-foreground">
                        {row.sex}
                      </td>
                      <td className="px-4 py-3 font-mono text-muted-foreground">
                        {row.phone || '—'}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground truncate max-w-[150px]">
                        {row.email || '—'}
                      </td>
                      <td className="px-4 py-3">
                        {row.errors.length === 0 ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>{isAm ? 'ትክክለኛ' : 'Valid'}</span>
                          </span>
                        ) : (
                          <div className="space-y-0.5">
                            {row.errors.map((err, errIdx) => (
                              <span
                                key={errIdx}
                                className="inline-flex items-center gap-1 rounded-md bg-rose-100 px-2 py-0.5 text-[10px] font-medium text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 block"
                              >
                                <XCircle className="h-3 w-3 shrink-0" />
                                <span>{err}</span>
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: RESULT REPORT */}
      {step === 'report' && report && (
        <div className="space-y-6">
          {/* Metrics Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm text-center">
              <span className="text-3xl font-extrabold text-foreground">
                {report.total}
              </span>
              <p className="mt-1 text-xs text-muted-foreground">
                {isAm ? 'ጠቅላላ የተመረመሩ ረድፎች' : 'Total Rows Evaluated'}
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-6 shadow-sm text-center dark:border-emerald-900/40 dark:bg-emerald-950/20">
              <span className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
                {report.created}
              </span>
              <p className="mt-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                {t('reportCreated')}
              </p>
            </div>

            <div className="rounded-2xl border border-rose-200 bg-rose-50/60 p-6 shadow-sm text-center dark:border-rose-900/40 dark:bg-rose-950/20">
              <span className="text-3xl font-extrabold text-rose-600 dark:text-rose-400">
                {report.skipped}
              </span>
              <p className="mt-1 text-xs font-semibold text-rose-700 dark:text-rose-400">
                {t('reportSkipped')}
              </p>
            </div>
          </div>

          {/* List of Created Members */}
          {report.createdMembers && report.createdMembers.length > 0 && (
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                <h2 className="text-base font-bold text-foreground">
                  {isAm ? 'በአዲሱ ምዝገባ የገቡ አባላት' : 'Newly Registered Members'}
                </h2>
              </div>

              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-3">
                {report.createdMembers.map((m) => (
                  <Link
                    key={m.id}
                    href={`/${locale}/admin/members/${m.id}`}
                    className="flex items-center justify-between rounded-xl border border-border bg-background p-3 hover:border-primary transition-colors text-xs"
                  >
                    <div>
                      <div className="font-semibold text-foreground">
                        {m.fullName}
                      </div>
                      <div className="font-mono text-[11px] text-primary font-bold">
                        {m.memberNo}
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* List of Errors */}
          {report.errors && report.errors.length > 0 && (
            <div className="rounded-2xl border border-rose-200 bg-card p-6 shadow-sm space-y-4 dark:border-rose-900/40">
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                <h2 className="text-base font-bold text-foreground">
                  {t('reportErrors')}
                </h2>
              </div>

              <div className="divide-y divide-border/60">
                {report.errors.map((err, idx) => (
                  <div key={idx} className="py-2.5 first:pt-0 last:pb-0 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-rose-600">
                        {isAm ? `ረድፍ #${err.row}` : `Row #${err.row}`}
                      </span>
                      {err.name && (
                        <span className="font-semibold text-foreground">
                          • {err.name}
                        </span>
                      )}
                    </div>
                    <ul className="mt-1 list-disc pl-5 text-muted-foreground space-y-0.5">
                      {err.reasons.map((r, rIdx) => (
                        <li key={rIdx}>{r}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Footer */}
          <div className="flex items-center justify-between pt-4">
            <button
              type="button"
              onClick={() => {
                setStep('upload');
                setFile(null);
                setPreviewRows([]);
                setReport(null);
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-xs md:text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              <span>{isAm ? 'ሌላ ፋይል አስገባ' : 'Import Another File'}</span>
            </button>

            <Link
              href={`/${locale}/admin/members`}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs md:text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90 transition-colors"
            >
              <span>{isAm ? 'ወደ አባላት ዝርዝር ተመለስ' : 'Return to Members List'}</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
