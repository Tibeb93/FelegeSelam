'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import {
  FormItem,
  FormResponseItem,
  FormResponseStatus,
  PaginatedResponse,
} from '@/types/api';
import { DataTable, ColumnDef } from '@/components/ui/DataTable';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/Dialog';
import {
  ClipboardList,
  ArrowLeft,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  FileSpreadsheet,
  FileText,
  Eye,
  AlertCircle,
  Loader2,
  User,
  Paperclip,
  Check,
  X,
  MessageSquare,
} from 'lucide-react';
import * as XLSX from 'xlsx';

export default function FormResponsesPage({
  params: { locale, id },
}: {
  params: { locale: string; id: string };
}) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  // Review modal state
  const [selectedResponse, setSelectedResponse] = useState<FormResponseItem | null>(null);
  const [reviewDecision, setReviewDecision] = useState<'approved' | 'rejected'>('approved');
  const [reviewNote, setReviewNote] = useState('');
  const [isExporting, setIsExporting] = useState<string | null>(null);

  // Fetch form metadata
  const { data: form } = useQuery<FormItem>({
    queryKey: ['admin-form-info', id],
    queryFn: async () => {
      const res = await apiClient.get<any>(`/forms/${id}`);
      return res.data || res;
    },
  });

  // Fetch responses
  const { data, isLoading } = useQuery<PaginatedResponse<FormResponseItem>>({
    queryKey: ['admin-form-responses', id, page, pageSize, statusFilter, searchTerm],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(pageSize),
      });
      if (statusFilter) params.append('status', statusFilter);
      if (searchTerm.trim()) params.append('search', searchTerm.trim());

      const res = await apiClient.get<any>(`/forms/${id}/responses?${params.toString()}`);
      return res;
    },
  });

  const responses = data?.items || data?.data || [];
  const total = data?.total || 0;

  // Review mutation
  const reviewMutation = useMutation({
    mutationFn: async () => {
      if (!selectedResponse) return;
      return apiClient.patch(`/forms/responses/${selectedResponse.id}/review`, {
        status: reviewDecision,
        reviewNote: reviewNote.trim() || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-form-responses', id] });
      setSelectedResponse(null);
      setReviewNote('');
    },
  });

  // Export handlers
  const handleExportClientExcel = () => {
    if (responses.length === 0) return;

    const fields = form?.formSchema?.fields || [];
    const exportRows = responses.map((resp, idx) => {
      const row: Record<string, any> = {
        '#': idx + 1,
        [locale === 'am' ? 'አመልክች / አባል' : 'Applicant']:
          resp.member
            ? `${resp.member.firstName} ${resp.member.fatherName}`
            : 'Anonymous / Guest',
        [locale === 'am' ? 'የአባል ቁጥር' : 'Member ID']: resp.member?.memberNo || '—',
        [locale === 'am' ? 'ስልክ ቁጥር' : 'Phone']: resp.member?.phone || '—',
        [locale === 'am' ? 'የገባበት ቀን' : 'Submitted Date']: new Date(
          resp.submittedAt,
        ).toLocaleString(),
        [locale === 'am' ? 'ሁኔታ' : 'Status']:
          resp.status === 'approved'
            ? 'የጸደቀ (Approved)'
            : resp.status === 'rejected'
            ? 'ውድቅ የተደረገ (Rejected)'
            : 'የቀረበ (Submitted)',
      };

      // Map each field from schema
      for (const f of fields) {
        const val = resp.answers[f.name];
        const label = f.labelAm || f.labelEn || f.name;
        row[label] = Array.isArray(val) ? val.join(', ') : val !== undefined ? String(val) : '';
      }

      if (resp.reviewNote) {
        row[locale === 'am' ? 'የአስተዳደር ማስታወሻ' : 'Review Note'] = resp.reviewNote;
      }

      return row;
    });

    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Responses');
    const safeTitle = (form?.title || 'Form').replace(/[^a-zA-Z0-9_\u1200-\u137F]/g, '_');
    XLSX.writeFile(wb, `Form_Responses_${safeTitle}.xlsx`);
  };

  const handleExportServer = async (format: 'xlsx' | 'pdf') => {
    try {
      setIsExporting(format);
      if (format === 'xlsx') {
        handleExportClientExcel();
      } else {
        // Fetch server PDF
        const token = (apiClient as any).getAccessToken?.();
        const apiBase =
          process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';
        const res = await fetch(`${apiBase}/forms/${id}/export?format=${format}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) throw new Error('PDF export failed on server');
        const blob = await res.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = `Form_${id}_Responses.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
    } catch (err: any) {
      alert(err.message || 'Export failed');
    } finally {
      setIsExporting(null);
    }
  };

  const openReviewModal = (resp: FormResponseItem) => {
    setSelectedResponse(resp);
    setReviewDecision(resp.status === 'rejected' ? 'rejected' : 'approved');
    setReviewNote(resp.reviewNote || '');
  };

  const getStatusBadge = (status: FormResponseStatus) => {
    if (status === 'approved') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
          <CheckCircle2 className="h-3 w-3" />
          <span>{locale === 'am' ? 'የጸደቀ' : 'Approved'}</span>
        </span>
      );
    } else if (status === 'rejected') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-semibold text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
          <XCircle className="h-3 w-3" />
          <span>{locale === 'am' ? 'ውድቅ የተደረገ' : 'Rejected'}</span>
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
          <Clock className="h-3 w-3" />
          <span>{locale === 'am' ? 'የቀረበ' : 'Submitted'}</span>
        </span>
      );
    }
  };

  const columns: ColumnDef<FormResponseItem>[] = [
    {
      header: locale === 'am' ? 'አመልክች / አባል' : 'Applicant / Member',
      accessorKey: 'member',
      cell: (resp) => (
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <User className="h-4 w-4" />
          </div>
          <div>
            <p className="font-semibold text-foreground text-xs md:text-sm">
              {resp.member
                ? `${resp.member.firstName} ${resp.member.fatherName}`
                : locale === 'am'
                ? 'ያልተመዘገበ ተጠቃሚ'
                : 'Guest / Anonymous'}
            </p>
            <p className="font-mono text-[11px] text-muted-foreground">
              {resp.member?.memberNo || resp.member?.phone || '—'}
            </p>
          </div>
        </div>
      ),
    },
    {
      header: locale === 'am' ? 'ሁኔታ' : 'Status',
      accessorKey: 'status',
      cell: (resp) => getStatusBadge(resp.status),
    },
    {
      header: locale === 'am' ? 'የገባበት ቀን' : 'Submitted At',
      accessorKey: 'submittedAt',
      cell: (resp) => {
        const d = new Date(resp.submittedAt);
        return (
          <div className="text-xs">
            <p className="font-medium text-foreground">{d.toLocaleDateString()}</p>
            <p className="text-[11px] text-muted-foreground">{d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
          </div>
        );
      },
    },
    {
      header: locale === 'am' ? 'ድርጊት' : 'Actions',
      accessorKey: 'id',
      cell: (resp) => (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => openReviewModal(resp)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1 text-xs font-semibold text-foreground shadow-xs hover:bg-muted transition-colors"
          >
            <Eye className="h-3.5 w-3.5 text-primary" />
            <span>{locale === 'am' ? 'መርምር' : 'Review'}</span>
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push(`/${locale}/admin/forms`)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
              {form?.title || (locale === 'am' ? 'የቅጽ ምላሾች' : 'Form Responses')}
            </h1>
            <p className="text-xs text-muted-foreground">
              {locale === 'am'
                ? 'የተሞሉ ማመልከቻዎችን መመርመር፣ ማጽደቅ ወይም ውድቅ ማድረግ'
                : 'Review submissions, evaluate responses, approve/reject, and export data.'}
            </p>
          </div>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleExportServer('xlsx')}
            disabled={responses.length === 0 || isExporting !== null}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground shadow-sm hover:bg-muted disabled:opacity-50 transition-colors"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            <span>{locale === 'am' ? 'Excel አውርድ' : 'Export Excel'}</span>
          </button>

          <button
            type="button"
            onClick={() => handleExportServer('pdf')}
            disabled={responses.length === 0 || isExporting !== null}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground shadow-sm hover:bg-muted disabled:opacity-50 transition-colors"
          >
            {isExporting === 'pdf' ? (
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            ) : (
              <FileText className="h-4 w-4 text-rose-600" />
            )}
            <span>{locale === 'am' ? 'PDF አውርድ' : 'Export PDF'}</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            placeholder={
              locale === 'am'
                ? 'በአመልክች ስም ወይም ምላሾች ውስጥ ፈልግ...'
                : 'Search responses by name or answers...'
            }
            className="w-full rounded-lg border border-input bg-background pl-9 pr-4 py-2 text-xs md:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-input bg-background px-3 py-2 text-xs md:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option value="">{locale === 'am' ? 'ሁሉም ሁኔታዎች' : 'All Statuses'}</option>
            <option value="submitted">{locale === 'am' ? 'የቀረበ (Submitted)' : 'Submitted'}</option>
            <option value="approved">{locale === 'am' ? 'የጸደቀ (Approved)' : 'Approved'}</option>
            <option value="rejected">{locale === 'am' ? 'ውድቅ የተደረገ (Rejected)' : 'Rejected'}</option>
          </select>
        </div>
      </div>

      {/* Responses Data Table */}
      <DataTable
        columns={columns}
        data={responses}
        total={total}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={(newSize) => {
          setPageSize(newSize);
          setPage(1);
        }}
        isLoading={isLoading}
      />

      {/* Response Review Modal / Drawer */}
      <Dialog
        open={selectedResponse !== null}
        onOpenChange={(open) => !open && setSelectedResponse(null)}
      >
        <DialogContent className="max-w-2xl bg-card p-6 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <ClipboardList className="h-5 w-5 text-primary" />
              <span>{locale === 'am' ? 'የተሞላ ቅጽ ምርመራ' : 'Submission Review'}</span>
            </DialogTitle>
          </DialogHeader>

          {selectedResponse && (
            <div className="mt-4 space-y-5">
              {/* Applicant Header Badge */}
              <div className="rounded-xl border border-border bg-muted/20 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-foreground">
                      {selectedResponse.member
                        ? `${selectedResponse.member.firstName} ${selectedResponse.member.fatherName}`
                        : 'Guest / Anonymous'}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {selectedResponse.member?.department?.nameAm ||
                        selectedResponse.member?.department?.nameEn ||
                        '—'}
                    </p>
                  </div>
                  {getStatusBadge(selectedResponse.status)}
                </div>
                <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground border-t border-border/80 pt-2 font-mono">
                  <span>
                    ID: {selectedResponse.member?.memberNo || '—'}
                  </span>
                  <span>
                    Phone: {selectedResponse.member?.phone || '—'}
                  </span>
                  <span>
                    Date: {new Date(selectedResponse.submittedAt).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Submitted Answers List */}
              <div className="rounded-xl border border-border p-4 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                  {locale === 'am' ? 'የቀረቡ ምላሾች (Answers)' : 'Submitted Answers'}
                </h4>

                {form?.formSchema?.fields?.map((f: any, fIdx: number) => {
                  const answer = selectedResponse.answers[f.name];
                  const label = f.labelAm || f.labelEn || f.name;

                  return (
                    <div
                      key={fIdx}
                      className="border-b border-border/60 pb-2 last:border-0 last:pb-0"
                    >
                      <p className="text-xs font-semibold text-foreground/80">
                        {label}
                      </p>
                      <div className="mt-1 text-xs text-foreground font-medium">
                        {answer === undefined || answer === null || answer === '' ? (
                          <span className="text-muted-foreground italic">— ባዶ / Empty —</span>
                        ) : f.type === 'file' ? (
                          <a
                            href={String(answer)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-primary hover:underline font-mono text-xs"
                          >
                            <Paperclip className="h-3.5 w-3.5" />
                            <span>{locale === 'am' ? 'የተጫነውን ፋይል ተመልከት' : 'View Uploaded File'}</span>
                          </a>
                        ) : Array.isArray(answer) ? (
                          answer.join(', ')
                        ) : (
                          String(answer)
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Decision and Review Note Form */}
              <div className="rounded-xl border border-primary/25 bg-muted/10 p-4 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                  <MessageSquare className="h-4 w-4" />
                  <span>{locale === 'am' ? 'የአስተዳደር ውሳኔና ማስታወሻ' : 'Review Decision & Note'}</span>
                </h4>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setReviewDecision('approved')}
                    className={`flex items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-bold transition-all ${
                      reviewDecision === 'approved'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 ring-2 ring-emerald-500'
                        : 'border-border bg-background text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    <Check className="h-4 w-4 text-emerald-600" />
                    <span>{locale === 'am' ? 'አጽድቅ (Approve)' : 'Approve'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setReviewDecision('rejected')}
                    className={`flex items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-bold transition-all ${
                      reviewDecision === 'rejected'
                        ? 'border-rose-500 bg-rose-50 text-rose-800 dark:bg-rose-950 dark:text-rose-300 ring-2 ring-rose-500'
                        : 'border-border bg-background text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    <X className="h-4 w-4 text-rose-600" />
                    <span>{locale === 'am' ? 'ውድቅ አድርግ (Reject)' : 'Reject'}</span>
                  </button>
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground">
                    {locale === 'am' ? 'የውሳኔ ማስታወሻ / አስተያየት' : 'Administrative Review Note'}
                  </label>
                  <textarea
                    rows={2}
                    value={reviewNote}
                    onChange={(e) => setReviewNote(e.target.value)}
                    placeholder={
                      locale === 'am'
                        ? 'ለምሳሌ፦ መረጃዎች በትክክል ተሟልተዋል...'
                        : 'Optional remark or feedback to applicant...'
                    }
                    className="mt-1 w-full rounded-lg border border-input bg-background p-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setSelectedResponse(null)}
              className="rounded-lg border border-border px-4 py-2 text-xs font-medium text-foreground hover:bg-muted"
            >
              {locale === 'am' ? 'ሰርዝ' : 'Cancel'}
            </button>
            <button
              type="button"
              onClick={() => reviewMutation.mutate()}
              disabled={reviewMutation.isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-50"
            >
              {reviewMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              <span>{locale === 'am' ? 'ውሳኔውን መዝግብ' : 'Submit Review'}</span>
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
