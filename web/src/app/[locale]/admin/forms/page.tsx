'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { FormItem, FormStatus, PaginatedResponse } from '@/types/api';
import { DataTable, ColumnDef } from '@/components/ui/DataTable';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/Dialog';
import {
  ClipboardList,
  Plus,
  Sparkles,
  Search,
  CheckCircle2,
  Clock,
  Lock,
  Edit2,
  Trash2,
  Users,
  Loader2,
  BookCheck,
} from 'lucide-react';

const READY_TEMPLATES = [
  {
    key: 'membership_renewal',
    titleAm: 'የአባልነት እድሳት ቅጽ (ዓመታዊ)',
    titleEn: 'Membership Renewal Form',
    descAm: 'የሰንበት ትምህርት ቤት አባላት ዓመታዊ ምዝገባ ማደሻና ቃል ኪዳን ማረጋገጫ',
    descEn: 'Annual Sunday School membership update and renewal application',
  },
  {
    key: 'event_registration',
    titleAm: 'የጉባኤና የበዓላት ምዝገባ ቅጽ',
    titleEn: 'Event & Assembly Registration',
    descAm: 'ለንግሥ፣ ለጉባኤያት ወይም ለመንፈሳዊ ጉዞ የተሳታፊዎች ምዝገባ',
    descEn: 'Participant registration for spiritual conferences and feasts',
  },
  {
    key: 'volunteer_signup',
    titleAm: 'የበጎ ፈቃድ አገልግሎት ምዝገባ',
    titleEn: 'Volunteer Service Sign-Up',
    descAm: 'በሰንበት ትምህርት ቤቱ ልዩ ልዩ ዘርፎችና ክፍሎች ለማገልገል ጥሪ',
    descEn: 'Volunteer recruitment across Sunday School service departments',
  },
  {
    key: 'pledge',
    titleAm: 'የሕንፃና አገልግሎት የገቢ ቃል ኪዳን ቅጽ',
    titleEn: 'Pledge & Contribution Form',
    descAm: 'ለቤተክርስቲያን ግንባታና አገልግሎት የወርኃዊ ወይም ዓመታዊ ቃል ኪዳን',
    descEn: 'Monthly or annual financial commitment pledge for school projects',
  },
  {
    key: 'satisfaction_survey',
    titleAm: 'የአባላት እርካታና ግብረ-መልስ ዳሰሳ',
    titleEn: 'Member Satisfaction Survey',
    descAm: 'ስለ ሰንበት ትምህርት ቤቱ አገልግሎትና ትምህርት የአባላት አስተያየት መስጫ',
    descEn: 'Member feedback and service satisfaction survey questionnaire',
  },
];

export default function FormsAdminPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  // Template picker dialog
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<FormItem | null>(null);

  // Fetch forms
  const { data, isLoading } = useQuery<PaginatedResponse<FormItem>>({
    queryKey: ['admin-forms', page, pageSize, statusFilter, searchTerm],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(pageSize),
      });
      if (statusFilter) params.append('status', statusFilter);
      if (searchTerm.trim()) params.append('search', searchTerm.trim());

      const res = await apiClient.get<any>(`/forms?${params.toString()}`);
      return res;
    },
  });

  const forms = data?.items || data?.data || [];
  const total = data?.total || 0;

  // Instantiate template mutation
  const templateMutation = useMutation({
    mutationFn: async (templateKey: string) => {
      return apiClient.post(`/forms/from-template/${templateKey}`);
    },
    onSuccess: (newForm: any) => {
      queryClient.invalidateQueries({ queryKey: ['admin-forms'] });
      setIsTemplateDialogOpen(false);
      const formId = newForm.id || newForm.data?.id;
      if (formId) {
        router.push(`/${locale}/admin/forms/builder?id=${formId}`);
      }
    },
  });

  // Delete form mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiClient.delete(`/forms/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-forms'] });
      setDeleteTarget(null);
    },
  });

  const getStatusBadge = (status: FormStatus) => {
    if (status === 'open') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
          <CheckCircle2 className="h-3 w-3" />
          <span>{locale === 'am' ? 'ክፍት (Open)' : 'Open'}</span>
        </span>
      );
    } else if (status === 'closed') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
          <Lock className="h-3 w-3" />
          <span>{locale === 'am' ? 'የተዘጋ (Closed)' : 'Closed'}</span>
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
          <Clock className="h-3 w-3" />
          <span>{locale === 'am' ? 'ረቂቅ (Draft)' : 'Draft'}</span>
        </span>
      );
    }
  };

  const columns: ColumnDef<FormItem>[] = [
    {
      header: locale === 'am' ? 'የቅጹ ርዕስ' : 'Form Title',
      accessorKey: 'title',
      cell: (form) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <ClipboardList className="h-4 w-4" />
          </div>
          <div>
            <Link
              href={`/${locale}/admin/forms/${form.id}/responses`}
              className="font-semibold text-foreground text-xs md:text-sm hover:underline"
            >
              {form.title}
            </Link>
            {form.description && (
              <p className="text-xs text-muted-foreground line-clamp-1 max-w-sm">
                {form.description}
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      header: locale === 'am' ? 'ሁኔታ' : 'Status',
      accessorKey: 'status',
      cell: (form) => getStatusBadge(form.status),
    },
    {
      header: locale === 'am' ? 'የተሞሉ ምላሾች' : 'Responses',
      accessorKey: '_count',
      cell: (form) => {
        const count = form._count?.responses ?? 0;
        return (
          <Link
            href={`/${locale}/admin/forms/${form.id}/responses`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-muted/50 px-2.5 py-1 text-xs font-bold text-foreground hover:bg-primary/10 hover:text-primary transition-colors"
          >
            <Users className="h-3.5 w-3.5 text-secondary" />
            <span>{count} {locale === 'am' ? 'ምላሾች' : 'Submissions'}</span>
          </Link>
        );
      },
    },
    {
      header: locale === 'am' ? 'የማጠናቀቂያ ቀን' : 'Deadline',
      accessorKey: 'openUntil',
      cell: (form) => {
        if (!form.openUntil) {
          return <span className="text-xs text-muted-foreground">{locale === 'am' ? 'ያልተገደበ' : 'No Deadline'}</span>;
        }
        const d = new Date(form.openUntil);
        return (
          <span className="text-xs font-medium text-foreground">
            {d.toLocaleDateString()}
          </span>
        );
      },
    },
    {
      header: locale === 'am' ? 'ድርጊት' : 'Actions',
      accessorKey: 'id',
      cell: (form) => (
        <div className="flex items-center gap-1.5">
          <Link
            href={`/${locale}/admin/forms/${form.id}/responses`}
            className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
            title={locale === 'am' ? 'ምላሾችን መርምር' : 'Review Responses'}
          >
            <BookCheck className="h-3.5 w-3.5 text-primary" />
            <span>{locale === 'am' ? 'ምላሾች' : 'Responses'}</span>
          </Link>
          <Link
            href={`/${locale}/admin/forms/builder?id=${form.id}`}
            className="rounded p-1.5 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
            title={locale === 'am' ? 'ቅጹን አርትዕ' : 'Edit in Builder'}
          >
            <Edit2 className="h-4 w-4" />
          </Link>
          <button
            type="button"
            onClick={() => setDeleteTarget(form)}
            className="rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
            title={locale === 'am' ? 'ሰርዝ' : 'Delete Form'}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-2">
            <ClipboardList className="h-3.5 w-3.5" />
            <span>{locale === 'am' ? 'ዲጂታል ቅጾችና ዳሰሳዎች' : 'Forms & Surveys'}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            {locale === 'am' ? 'የመስመር ላይ ቅጾች' : 'Online Forms'}
          </h1>
          <p className="mt-1 text-xs md:text-sm text-muted-foreground">
            {locale === 'am'
              ? 'የአባልነት እድሳት፣ የጉባኤ ምዝገባ፣ የበጎ ፈቃድና የዳሰሳ ጥናት ቅጾች ማዘጋጃና ምላሽ መከታተያ'
              : 'Build dynamic online forms, manage templates, and review submitted responses.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Template Picker Button */}
          <button
            type="button"
            onClick={() => setIsTemplateDialogOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-secondary/40 bg-secondary/10 px-3.5 py-2 text-xs md:text-sm font-semibold text-secondary shadow-sm hover:bg-secondary/20 transition-colors"
          >
            <Sparkles className="h-4 w-4" />
            <span>{locale === 'am' ? 'ከተዘጋጁ አብነቶች ጀምር' : 'From Template'}</span>
          </button>

          {/* Blank Builder Button */}
          <Link
            href={`/${locale}/admin/forms/builder`}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs md:text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>{locale === 'am' ? 'አዲስ ቅጽ ገንባ' : 'Build Form'}</span>
          </Link>
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
                ? 'በቅጽ ርዕስ ወይም መግለጫ ፈልግ...'
                : 'Search forms by title or description...'
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
            <option value="open">{locale === 'am' ? 'ክፍት (Open)' : 'Open'}</option>
            <option value="closed">{locale === 'am' ? 'የተዘጋ (Closed)' : 'Closed'}</option>
            <option value="draft">{locale === 'am' ? 'ረቂቅ (Draft)' : 'Draft'}</option>
          </select>
        </div>
      </div>

      {/* Forms Data Table */}
      <DataTable
        columns={columns}
        data={forms}
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

      {/* 5 Ready Templates Selection Dialog */}
      <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
        <DialogContent className="max-w-2xl bg-card p-6 max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <Sparkles className="h-5 w-5 text-secondary" />
              <span>
                {locale === 'am'
                  ? 'ዝግጁ የአብነት ቅጾች (Pre-configured Templates)'
                  : 'Start from Ready-Made Template'}
              </span>
            </DialogTitle>
            <p className="text-xs text-muted-foreground mt-1">
              {locale === 'am'
                ? 'የተሟሉ ጥያቄዎችና የማረጋገጫ ደንቦች የተካተቱባቸውን 5 ዝግጁ ቅጾች በአንድ ጠቅታ ይጀምሩ'
                : 'Select one of the 5 standard pre-configured templates to instantiate immediately.'}
            </p>
          </DialogHeader>

          <div className="mt-4 space-y-3">
            {READY_TEMPLATES.map((tmpl) => (
              <div
                key={tmpl.key}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl border border-border bg-background p-4 hover:border-primary/40 hover:bg-muted/20 transition-all"
              >
                <div>
                  <h4 className="text-xs md:text-sm font-bold text-foreground">
                    {locale === 'am' ? tmpl.titleAm : tmpl.titleEn}
                  </h4>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {locale === 'am' ? tmpl.descAm : tmpl.descEn}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={templateMutation.isPending}
                  onClick={() => templateMutation.mutate(tmpl.key)}
                  className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-50"
                >
                  {templateMutation.isPending && (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  )}
                  <span>{locale === 'am' ? 'በዚህ ጀምር' : 'Use Template'}</span>
                </button>
              </div>
            ))}
          </div>

          <DialogFooter className="mt-4">
            <button
              type="button"
              onClick={() => setIsTemplateDialogOpen(false)}
              className="rounded-lg border border-border px-4 py-2 text-xs font-medium text-foreground hover:bg-muted"
            >
              {locale === 'am' ? 'ዝጋ' : 'Close'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={locale === 'am' ? 'ቅጹን መሰረዝ ይፈልጋሉ?' : 'Delete Form?'}
        description={
          locale === 'am'
            ? `«${deleteTarget?.title}» የሚለውን ቅጽና የተሞሉ ምላሾችን ሙሉ በሙሉ ለማስወገድ እርግጠኛ ነዎት?`
            : `Are you sure you want to delete "${deleteTarget?.title}" and all its responses?`
        }
        confirmLabel={locale === 'am' ? 'ሰርዝ' : 'Delete'}
        cancelLabel={locale === 'am' ? 'ይቅር' : 'Cancel'}
        onConfirm={async () => {
          if (deleteTarget) {
            await deleteMutation.mutateAsync(deleteTarget.id);
          }
        }}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
