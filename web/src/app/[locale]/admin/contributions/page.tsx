'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../../lib/api-client';
import { logger } from '../../../../lib/logger';
import {
  Contribution,
  ContributionSummary,
  ContributionType,
  PaymentMethod,
  MemberContributionStatement,
  Member,
} from '../../../../types/api';
import {
  DollarSign,
  Plus,
  FileSpreadsheet,
  Download,
  FileText,
  Search,
  Calendar,
  CreditCard,
  CheckCircle2,
  Receipt,
  X,
} from 'lucide-react';
import { DataTable, Column } from '../../../../components/ui/DataTable';
import { Skeleton } from '../../../../components/ui/SkeletonLoaders';

const CONTRIBUTION_TYPES: Array<{ value: ContributionType; labelAm: string; labelEn: string }> = [
  { value: 'monthly_fee', labelAm: 'ወርሃዊ መዋጮ', labelEn: 'Monthly Fee' },
  { value: 'special_offering', labelAm: 'ስእለትና ልዩ ስጦታ', labelEn: 'Special Offering' },
  { value: 'building_fund', labelAm: 'የሕንጻ ፈንድ', labelEn: 'Building Fund' },
  { value: 'event_donation', labelAm: 'የበዓል ድጋፍ', labelEn: 'Event Donation' },
  { value: 'book_store', labelAm: 'የመጻሕፍት መደብር', labelEn: 'Bookstore' },
  { value: 'other', labelAm: 'ሌላ ገቢ', labelEn: 'Other' },
];

const PAYMENT_METHODS: Array<{ value: PaymentMethod; labelAm: string; labelEn: string }> = [
  { value: 'cash', labelAm: 'ጥሬ ገንዘብ (Cash)', labelEn: 'Cash' },
  { value: 'cbe_birr', labelAm: 'ሲቢኢ ብር (CBE Birr)', labelEn: 'CBE Birr' },
  { value: 'telebirr', labelAm: 'ቴሌብር (Telebirr)', labelEn: 'Telebirr' },
  { value: 'bank_transfer', labelAm: 'ባንክ ዝውውር', labelEn: 'Bank Transfer' },
  { value: 'other', labelAm: 'ሌላ', labelEn: 'Other' },
];

export default function ContributionsPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedMethod, setSelectedMethod] = useState<string>('all');

  // Modals state
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [statementMemberId, setStatementMemberId] = useState<string | null>(null);

  // New payment form state
  const [paymentMemberId, setPaymentMemberId] = useState('');
  const [paymentAmount, setPaymentAmount] = useState<number | ''>('');
  const [paymentType, setPaymentType] = useState<ContributionType>('monthly_fee');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [referenceNo, setReferenceNo] = useState('');
  const [paidAt, setPaidAt] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');
  const [formError, setFormError] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  // Query contributions list
  const { data: contributionsData, isLoading: isListLoading } = useQuery<{
    data: Contribution[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>({
    queryKey: ['contributions', page, pageSize, searchTerm, selectedType, selectedMethod],
    queryFn: () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString(),
      });
      if (searchTerm) params.set('search', searchTerm);
      if (selectedType !== 'all') params.set('type', selectedType);
      if (selectedMethod !== 'all') params.set('paymentMethod', selectedMethod);

      return apiClient.get(`/contributions?${params.toString()}`);
    },
  });

  // Query summary metrics
  const { data: summary } = useQuery<ContributionSummary>({
    queryKey: ['contributions-summary'],
    queryFn: () => apiClient.get<ContributionSummary>('/contributions/summary'),
  });

  // Query active members for member picker
  const { data: membersList } = useQuery<{ data: Member[] }>({
    queryKey: ['active-members-picker'],
    queryFn: () => apiClient.get<{ data: Member[] }>('/members?limit=100&status=active'),
  });

  // Query member statement when statement modal open
  const { data: memberStatement, isLoading: isStatementLoading } =
    useQuery<MemberContributionStatement>({
      queryKey: ['member-statement', statementMemberId],
      queryFn: () => apiClient.get(`/contributions/members/${statementMemberId}/summary`),
      enabled: Boolean(statementMemberId),
    });

  // Record payment mutation
  const recordPaymentMutation = useMutation({
    mutationFn: (payload: {
      memberId: string;
      amount: number;
      type: ContributionType;
      paymentMethod: PaymentMethod;
      referenceNumber?: string;
      paidAt: string;
      note?: string;
    }) => apiClient.post('/contributions', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contributions'] });
      queryClient.invalidateQueries({ queryKey: ['contributions-summary'] });
      setIsRecordModalOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      setFormError(err.message || 'Failed to record payment');
    },
  });

  const resetForm = () => {
    setPaymentMemberId('');
    setPaymentAmount('');
    setPaymentType('monthly_fee');
    setPaymentMethod('cash');
    setReferenceNo('');
    setPaidAt(new Date().toISOString().split('T')[0]);
    setNote('');
    setFormError('');
  };

  const handleSubmitPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentMemberId) {
      setFormError(locale === 'am' ? 'እባክዎ አባል ይምረጡ' : 'Please select a member');
      return;
    }
    if (!paymentAmount || Number(paymentAmount) <= 0) {
      setFormError(locale === 'am' ? 'እባክዎ ትክክለኛ የገንዘብ መጠን ያስገቡ' : 'Please enter a valid amount');
      return;
    }

    recordPaymentMutation.mutate({
      memberId: paymentMemberId,
      amount: Number(paymentAmount),
      type: paymentType,
      paymentMethod: paymentMethod,
      referenceNumber: referenceNo.trim() || undefined,
      paidAt,
      note: note.trim() || undefined,
    });
  };

  // Download PDF Receipt
  const handleDownloadReceipt = async (contributionId: string, receiptNo?: string | null) => {
    try {
      const blob = await apiClient.getBlob(`/contributions/${contributionId}/receipt`);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Receipt_${receiptNo || 'voucher'}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      logger.error('Failed to download receipt PDF:', error);
    }
  };

  // Export Excel
  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      const params = new URLSearchParams({ format: 'xlsx' });
      if (selectedType !== 'all') params.set('type', selectedType);
      if (selectedMethod !== 'all') params.set('paymentMethod', selectedMethod);

      const blob = await apiClient.getBlob(`/contributions/export?${params.toString()}`);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Contributions_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      logger.error('Failed to export contributions Excel:', error);
    } finally {
      setIsExporting(false);
    }
  };

  // DataTable Columns
  const columns: Column<Contribution>[] = [
    {
      key: 'receiptNo',
      title: locale === 'am' ? 'የደረሰኝ ቁጥር' : 'Receipt No',
      render: (c) => (
        <span className="font-mono text-xs font-bold text-primary">{c.receiptNo}</span>
      ),
    },
    {
      key: 'member',
      title: locale === 'am' ? 'አባል' : 'Member',
      render: (c) => (
        <div className="flex flex-col">
          <span className="font-semibold text-foreground text-xs">
            {c.member
              ? `${c.member.firstName} ${c.member.fatherName} ${c.member.grandfatherName || ''}`
              : 'Unknown Member'}
          </span>
          <span className="font-mono text-[11px] text-muted-foreground">
            {c.member?.memberNo || '—'}
          </span>
        </div>
      ),
    },
    {
      key: 'amount',
      title: locale === 'am' ? 'መጠን (ብር)' : 'Amount (ETB)',
      render: (c) => (
        <span className="font-bold text-xs text-foreground">
          {Number(c.amount).toLocaleString()} ETB
        </span>
      ),
    },
    {
      key: 'type',
      title: locale === 'am' ? 'የክፍያው ዓይነት' : 'Type',
      render: (c) => {
        const item = CONTRIBUTION_TYPES.find((t) => t.value === c.type);
        return (
          <span className="inline-flex items-center rounded-md bg-secondary/10 px-2 py-0.5 text-[11px] font-medium text-secondary">
            {locale === 'am' ? item?.labelAm : item?.labelEn || c.type}
          </span>
        );
      },
    },
    {
      key: 'paymentMethod',
      title: locale === 'am' ? 'የክፍያ መንገድ' : 'Method',
      render: (c) => {
        const item = PAYMENT_METHODS.find((m) => m.value === c.paymentMethod);
        return (
          <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground capitalize">
            {locale === 'am' ? item?.labelAm : item?.labelEn || c.paymentMethod}
          </span>
        );
      },
    },
    {
      key: 'paidAt',
      title: locale === 'am' ? 'የተከፈለበት ቀን' : 'Paid Date',
      render: (c) => (
        <span className="text-xs text-muted-foreground">
          {new Date(c.paidAt).toLocaleDateString(locale === 'am' ? 'am-ET' : 'en-US')}
        </span>
      ),
    },
    {
      key: 'actions',
      title: locale === 'am' ? 'ተግባራት' : 'Actions',
      render: (c) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleDownloadReceipt(c.id, c.receiptNo)}
            className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2 py-1 text-xs font-medium text-foreground hover:bg-primary/10 hover:text-primary transition-colors"
            title={locale === 'am' ? 'ደረሰኝ በPDF አውርድ' : 'Download Receipt PDF'}
          >
            <Download className="h-3.5 w-3.5 text-primary" />
            <span>{locale === 'am' ? 'ደረሰኝ' : 'Receipt'}</span>
          </button>
          <button
            onClick={() => setStatementMemberId(c.memberId)}
            className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2 py-1 text-xs font-medium text-foreground hover:bg-secondary/10 hover:text-secondary transition-colors"
            title={locale === 'am' ? 'የአባል የክፍያ ታሪክ' : 'Member Statement'}
          >
            <FileText className="h-3.5 w-3.5 text-secondary" />
            <span>{locale === 'am' ? 'ታሪክ' : 'Statement'}</span>
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground md:text-3xl">
            {locale === 'am' ? 'ስጦታና ክፍያዎች' : 'Contributions & Finance'}
          </h1>
          <p className="mt-1 text-xs md:text-sm text-muted-foreground">
            {locale === 'am'
              ? 'የአባላት ወርሃዊ መዋጮ፣ ስእለትና ስጦታዎች፣ የሕንጻ ፈንድ እና የደረሰኝ ቁጥጥር'
              : 'Track member offerings, monthly fees, building funds, and receipts'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportExcel}
            disabled={isExporting}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-xs md:text-sm font-semibold text-foreground shadow-sm hover:bg-muted transition-colors disabled:opacity-50"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            <span>{isExporting ? (locale === 'am' ? 'እየወረደ...' : 'Exporting...') : locale === 'am' ? 'በExcel አውርድ' : 'Export Excel'}</span>
          </button>

          <button
            onClick={() => {
              resetForm();
              setIsRecordModalOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs md:text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>{locale === 'am' ? 'ክፍያ መዝግብ' : 'Record Payment'}</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Collected */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              {locale === 'am' ? 'ጠቅላላ የተሰበሰበ' : 'Total Collected'}
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-foreground">
              {(summary?.totalAmount ?? 0).toLocaleString()} <span className="text-xs font-normal text-muted-foreground">ETB</span>
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {summary?.totalTransactions ?? 0} {locale === 'am' ? 'የተከናወኑ ክፍያዎች' : 'recorded transactions'}
            </p>
          </div>
        </div>

        {/* Monthly Membership Fees */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              {locale === 'am' ? 'ወርሃዊ መዋጮ' : 'Monthly Fees'}
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400">
              <Calendar className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-foreground">
              {(
                summary?.byType?.find((t) => t.type === 'monthly_fee')?.totalAmount ?? 0
              ).toLocaleString()}{' '}
              <span className="text-xs font-normal text-muted-foreground">ETB</span>
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {summary?.byType?.find((t) => t.type === 'monthly_fee')?.count ?? 0}{' '}
              {locale === 'am' ? 'ክፍያዎች' : 'payments'}
            </p>
          </div>
        </div>

        {/* Building Fund */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              {locale === 'am' ? 'የሕንጻ ፈንድ' : 'Building Fund'}
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400">
              <CreditCard className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-foreground">
              {(
                summary?.byType?.find((t) => t.type === 'building_fund')?.totalAmount ?? 0
              ).toLocaleString()}{' '}
              <span className="text-xs font-normal text-muted-foreground">ETB</span>
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {summary?.byType?.find((t) => t.type === 'building_fund')?.count ?? 0}{' '}
              {locale === 'am' ? 'ክፍያዎች' : 'donations'}
            </p>
          </div>
        </div>

        {/* Special Offering */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              {locale === 'am' ? 'ስእለትና ልዩ ስጦታ' : 'Special Offerings'}
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-400">
              <Receipt className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-foreground">
              {(
                summary?.byType?.find((t) => t.type === 'special_offering')?.totalAmount ?? 0
              ).toLocaleString()}{' '}
              <span className="text-xs font-normal text-muted-foreground">ETB</span>
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {summary?.byType?.find((t) => t.type === 'special_offering')?.count ?? 0}{' '}
              {locale === 'am' ? 'ስጦታዎች' : 'offerings'}
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            placeholder={
              locale === 'am'
                ? 'በደረሰኝ ቁጥር፣ በአባል ስም ወይም ስልክ ፈልግ...'
                : 'Search by receipt number, member name or phone...'
            }
            className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-xs md:text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => {
              setSelectedType(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-border bg-background px-3 py-2 text-xs md:text-sm text-foreground focus:border-primary focus:outline-none"
          >
            <option value="all">{locale === 'am' ? 'ሁሉም ዓይነቶች' : 'All Types'}</option>
            {CONTRIBUTION_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {locale === 'am' ? t.labelAm : t.labelEn}
              </option>
            ))}
          </select>

          {/* Payment Method Filter */}
          <select
            value={selectedMethod}
            onChange={(e) => {
              setSelectedMethod(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-border bg-background px-3 py-2 text-xs md:text-sm text-foreground focus:border-primary focus:outline-none"
          >
            <option value="all">{locale === 'am' ? 'ሁሉም የክፍያ መንገዶች' : 'All Methods'}</option>
            {PAYMENT_METHODS.map((m) => (
              <option key={m.value} value={m.value}>
                {locale === 'am' ? m.labelAm : m.labelEn}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Contributions DataTable */}
      <DataTable
        columns={columns}
        data={contributionsData?.data || []}
        isLoading={isListLoading}
        page={page}
        total={contributionsData?.total || 0}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        emptyMessage={
          locale === 'am' ? 'ምንም የተመዘገበ የክፍያ መረጃ አልተገኘም' : 'No contribution records found'
        }
      />

      {/* Record Payment Modal */}
      {isRecordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-xl">
            <button
              onClick={() => setIsRecordModalOpen(false)}
              className="absolute right-4 top-4 rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mb-4">
              <h2 className="text-lg font-bold text-foreground">
                {locale === 'am' ? 'አዲስ ክፍያ መዝግብ' : 'Record Member Payment'}
              </h2>
              <p className="text-xs text-muted-foreground">
                {locale === 'am'
                  ? 'የአባሉን መዋጮ ወይም ስጦታ ይመዝግቡ፣ የደረሰኝ ቁጥር በራሱ ይመነጫል'
                  : 'Record member payment. Official receipt number is generated automatically.'}
              </p>
            </div>

            {formError && (
              <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmitPayment} className="space-y-4">
              {/* Member Picker */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  {locale === 'am' ? 'አባል *' : 'Member *'}
                </label>
                <select
                  value={paymentMemberId}
                  onChange={(e) => setPaymentMemberId(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs md:text-sm text-foreground focus:border-primary focus:outline-none"
                  required
                >
                  <option value="">
                    {locale === 'am' ? '-- አባል ይምረጡ --' : '-- Select Member --'}
                  </option>
                  {membersList?.data?.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.memberNo} - {m.firstName} {m.fatherName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  {locale === 'am' ? 'የገንዘብ መጠን (በብር) *' : 'Amount (ETB) *'}
                </label>
                <input
                  type="number"
                  min="1"
                  step="any"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value ? Number(e.target.value) : '')}
                  placeholder="500"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs md:text-sm text-foreground focus:border-primary focus:outline-none"
                  required
                />
              </div>

              {/* Type and Payment Method */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    {locale === 'am' ? 'የክፍያው ዓይነት *' : 'Contribution Type *'}
                  </label>
                  <select
                    value={paymentType}
                    onChange={(e) => setPaymentType(e.target.value as ContributionType)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs md:text-sm text-foreground focus:border-primary focus:outline-none"
                  >
                    {CONTRIBUTION_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {locale === 'am' ? t.labelAm : t.labelEn}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    {locale === 'am' ? 'የክፍያ መንገድ *' : 'Payment Method *'}
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs md:text-sm text-foreground focus:border-primary focus:outline-none"
                  >
                    {PAYMENT_METHODS.map((m) => (
                      <option key={m.value} value={m.value}>
                        {locale === 'am' ? m.labelAm : m.labelEn}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Reference Number & Date */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    {locale === 'am' ? 'የባንክ ማመሳከሪያ ቁጥር (ካለ)' : 'Reference / TXN No'}
                  </label>
                  <input
                    type="text"
                    value={referenceNo}
                    onChange={(e) => setReferenceNo(e.target.value)}
                    placeholder="e.g. FT23485892"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs md:text-sm text-foreground focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    {locale === 'am' ? 'የተከፈለበት ቀን *' : 'Payment Date *'}
                  </label>
                  <input
                    type="date"
                    value={paidAt}
                    onChange={(e) => setPaidAt(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs md:text-sm text-foreground focus:border-primary focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Note */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  {locale === 'am' ? 'ማስታወሻ / ዝርዝር' : 'Note / Remarks'}
                </label>
                <textarea
                  rows={2}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={
                    locale === 'am'
                      ? 'ስለ ክፍያው ተጨማሪ ማስታወሻ...'
                      : 'Additional details or remarks...'
                  }
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs md:text-sm text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRecordModalOpen(false)}
                  className="rounded-xl border border-border px-4 py-2 text-xs md:text-sm font-semibold text-foreground hover:bg-muted"
                >
                  {locale === 'am' ? 'ተመለስ' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={recordPaymentMutation.isPending}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-xs md:text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>
                    {recordPaymentMutation.isPending
                      ? locale === 'am'
                        ? 'እየተመዘገበ...'
                        : 'Saving...'
                      : locale === 'am'
                        ? 'ክፍያውን መዝግብ'
                        : 'Record Payment'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Member Statement Modal */}
      {statementMemberId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-xl">
            <button
              onClick={() => setStatementMemberId(null)}
              className="absolute right-4 top-4 rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mb-4">
              <h2 className="text-lg font-bold text-foreground">
                {locale === 'am' ? 'የአባል የክፍያ መግለጫ (Statement)' : 'Member Contribution Statement'}
              </h2>
              {memberStatement?.member && (
                <p className="text-xs text-primary font-medium">
                  {memberStatement.member.firstName} {memberStatement.member.fatherName} (
                  {memberStatement.member.memberNo})
                </p>
              )}
            </div>

            {isStatementLoading ? (
              <div className="space-y-3 py-6">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : memberStatement ? (
              <div className="space-y-5">
                {/* Statement Summary KPI */}
                <div className="grid grid-cols-2 gap-3 rounded-xl border border-border bg-background p-4">
                  <div>
                    <span className="text-[11px] text-muted-foreground">
                      {locale === 'am' ? 'ጠቅላላ የተከፈለ' : 'Total Contributed'}
                    </span>
                    <p className="text-xl font-bold text-emerald-600">
                      {memberStatement.totalContributed.toLocaleString()} ETB
                    </p>
                  </div>
                  <div>
                    <span className="text-[11px] text-muted-foreground">
                      {locale === 'am' ? 'የክፍያዎች ብዛት' : 'Total Transactions'}
                    </span>
                    <p className="text-xl font-bold text-foreground">
                      {memberStatement.contributionsCount}
                    </p>
                  </div>
                </div>

                {/* Monthly breakdown */}
                {memberStatement.monthlyBreakdown?.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                      {locale === 'am' ? 'ወርሃዊ ክፍያዎች' : 'Monthly Breakdown'}
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {memberStatement.monthlyBreakdown.map((m) => (
                        <div
                          key={m.month}
                          className="rounded-lg border border-border p-2.5 text-xs"
                        >
                          <p className="text-muted-foreground font-mono">{m.month}</p>
                          <p className="font-bold text-foreground">
                            {m.totalAmount.toLocaleString()} ETB
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {m.count} {locale === 'am' ? 'ክፍያ' : 'payments'}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recent Contributions */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                    {locale === 'am' ? 'የቅርብ ጊዜ ደረሰኞች' : 'Recent Receipts'}
                  </h3>
                  <div className="space-y-2">
                    {memberStatement.recentContributions?.map((c) => (
                      <div
                        key={c.id}
                        className="flex items-center justify-between rounded-lg border border-border/60 bg-background/50 p-2.5 text-xs"
                      >
                        <div>
                          <p className="font-mono font-bold text-primary">{c.receiptNo}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {new Date(c.paidAt).toLocaleDateString()} • {c.type}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-foreground">
                            {Number(c.amount).toLocaleString()} ETB
                          </span>
                          <button
                            onClick={() => handleDownloadReceipt(c.id, c.receiptNo)}
                            className="rounded-lg p-1 text-primary hover:bg-primary/10"
                            title={locale === 'am' ? 'ደረሰኝ አውርድ' : 'Download Receipt'}
                          >
                            <Download className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
