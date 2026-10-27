'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CreditCard,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Download,
  Search,
  Plus,
  Send,
  Eye,
  FileSpreadsheet,
  FileText,
  Loader2,
  X,
  Phone,
  Check,
  TrendingUp,
  Users,
} from 'lucide-react';
import { apiRequest, getAccessToken } from '@/lib/api-client';
import { useToast } from '@/providers/ToastProvider';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

interface MembershipPaymentItem {
  id: string;
  membershipYear: number;
  amount: number;
  currency: string;
  method: string;
  referenceNo: string;
  paidOn: string;
  proofUrl?: string;
  status: 'pending' | 'approved' | 'rejected';
  receiptNo?: string;
  reviewNote?: string;
  createdAt: string;
  member: {
    id: string;
    memberNo: string;
    firstName: string;
    fatherName: string;
    grandfatherName?: string;
    phone?: string;
    email?: string;
    department?: { id: number; nameAm: string; nameEn?: string };
  };
}

interface PaymentSummary {
  year: number;
  totalCollected: number;
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  totalActiveMembers: number;
  paidMembersCount: number;
  unpaidCount: number;
  collectionRate: number;
  fee: {
    amount: number;
    currency: string;
    year: number;
    yearLabel: string;
    deadline?: string;
  };
}

interface UnpaidMember {
  id: string;
  memberNo: string;
  firstName: string;
  fatherName: string;
  grandfatherName?: string;
  phone?: string;
  email?: string;
  department?: { id: number; nameAm: string; nameEn?: string };
  latestAttempt?: {
    id: string;
    status: string;
    referenceNo: string;
    createdAt: string;
  } | null;
}

export default function AdminMembershipPaymentsPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const isAm = locale === 'am';
  const toast = useToast();
  const queryClient = useQueryClient();

  // Active Tab
  const [activeTab, setActiveTab] = useState<'review' | 'all' | 'unpaid'>('review');

  // Filters
  const [yearFilter, setYearFilter] = useState<string>('2019');
  const [methodFilter, setMethodFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [page, setPage] = useState<number>(1);

  // Modals & Drawers
  const [previewProof, setPreviewProof] = useState<{ url: string; title: string } | null>(null);
  const [rejectModal, setRejectModal] = useState<{ id: string; memberName: string } | null>(null);
  const [rejectionNote, setRejectionNote] = useState<string>('');
  const [cashModalOpen, setCashModalOpen] = useState<boolean>(false);
  const [bulkReminderConfirm, setBulkReminderConfirm] = useState<boolean>(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Cash Modal Form
  const [cashMemberSearch, setCashMemberSearch] = useState<string>('');
  const [selectedMember, setSelectedMember] = useState<{
    id: string;
    name: string;
    memberNo: string;
  } | null>(null);
  const [cashAmount, setCashAmount] = useState<string>('600');
  const [cashDate, setCashDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [cashNote, setCashNote] = useState<string>('');

  // 1. Query Summary Metrics
  const { data: summary, isLoading: _summaryLoading } = useQuery<PaymentSummary>({
    queryKey: ['payments', 'admin', 'summary', yearFilter],
    queryFn: () =>
      apiRequest<PaymentSummary>('/payments/admin/summary', {
        params: { year: yearFilter ? Number(yearFilter) : undefined },
      }),
  });

  // 2. Query Payments (for Review Queue or All Payments)
  const queryParams: any = {
    page,
    limit: 25,
    year: yearFilter ? Number(yearFilter) : undefined,
  };
  if (activeTab === 'review') {
    queryParams.status = 'pending';
  } else {
    if (methodFilter) queryParams.method = methodFilter;
    if (statusFilter) queryParams.status = statusFilter;
  }
  if (searchTerm.trim()) {
    queryParams.search = searchTerm.trim();
  }

  const { data: paymentsData, isLoading: paymentsLoading } = useQuery<{
    items: MembershipPaymentItem[];
    total: number;
    totalPages: number;
    methodTotals: Array<{ method: string; totalAmount: number; count: number }>;
  }>({
    queryKey: ['payments', 'admin', 'list', activeTab, queryParams],
    queryFn: () => apiRequest('/payments/admin', { params: queryParams }),
  });

  // 3. Query Unpaid Members
  const { data: unpaidData, isLoading: unpaidLoading } = useQuery<{
    year: number;
    count: number;
    members: UnpaidMember[];
  }>({
    queryKey: ['payments', 'admin', 'unpaid', yearFilter],
    queryFn: () =>
      apiRequest('/payments/admin/unpaid-members', {
        params: { year: yearFilter ? Number(yearFilter) : undefined },
      }),
    enabled: activeTab === 'unpaid',
  });

  // 4. Search Members for Cash Payment
  const { data: searchedMembers } = useQuery<
    Array<{ id: string; memberNo: string; firstName: string; fatherName: string; phone?: string }>
  >({
    queryKey: ['members', 'search-cash', cashMemberSearch],
    queryFn: () =>
      apiRequest('/members', {
        params: { search: cashMemberSearch, limit: 8 },
      }).then((res: any) => res.items || res || []),
    enabled: cashModalOpen && cashMemberSearch.trim().length >= 2,
  });

  // Approve Payment Mutation
  const approveMutation = useMutation({
    mutationFn: (paymentId: string) =>
      apiRequest(`/payments/admin/${paymentId}/review`, {
        method: 'POST',
        body: { status: 'approved' },
      }),
    onSuccess: () => {
      toast.success(
        isAm ? 'ክፍያው በተሳካ ሁኔታ ፀድቋል! ደረሰኝ ተዘጋጅቷል።' : 'Payment approved and receipt generated!',
      );
      queryClient.invalidateQueries({ queryKey: ['payments', 'admin'] });
    },
    onError: (err: any) => {
      toast.error(err.message || (isAm ? 'ክፍያውን ማጽደቅ አልተቻለም' : 'Failed to approve payment'));
    },
  });

  // Reject Payment Mutation
  const rejectMutation = useMutation({
    mutationFn: ({ paymentId, note }: { paymentId: string; note: string }) =>
      apiRequest(`/payments/admin/${paymentId}/review`, {
        method: 'POST',
        body: { status: 'rejected', reviewNote: note },
      }),
    onSuccess: () => {
      toast.success(isAm ? 'ክፍያው ውድቅ ተደርጓል' : 'Payment marked as rejected');
      setRejectModal(null);
      setRejectionNote('');
      queryClient.invalidateQueries({ queryKey: ['payments', 'admin'] });
    },
    onError: (err: any) => {
      toast.error(err.message || (isAm ? 'ክፍያውን ውድቅ ማድረግ አልተቻለም' : 'Failed to reject payment'));
    },
  });

  // Record Cash Payment Mutation
  const cashMutation = useMutation({
    mutationFn: () => {
      if (!selectedMember) throw new Error(isAm ? 'አባል ይምረጡ' : 'Select a member');
      return apiRequest('/payments/admin/record-cash', {
        method: 'POST',
        body: {
          memberId: selectedMember.id,
          amount: Number(cashAmount),
          membershipYear: yearFilter ? Number(yearFilter) : undefined,
          paidOn: cashDate,
          note: cashNote.trim() || undefined,
        },
      });
    },
    onSuccess: () => {
      toast.success(
        isAm
          ? 'የጥሬ ገንዘብ ክፍያው በተሳካ ሁኔታ ተመዝግቧል! ደረሰኝ ወጥቷል።'
          : 'Cash payment recorded and receipt created successfully!',
      );
      setCashModalOpen(false);
      setSelectedMember(null);
      setCashMemberSearch('');
      setCashNote('');
      queryClient.invalidateQueries({ queryKey: ['payments', 'admin'] });
    },
    onError: (err: any) => {
      toast.error(err.message || (isAm ? 'መመዝገብ አልተቻለም' : 'Failed to record cash payment'));
    },
  });

  // Send Reminders Mutation
  const remindersMutation = useMutation({
    mutationFn: (customMsg?: string) =>
      apiRequest('/payments/admin/send-reminders', {
        method: 'POST',
        body: {
          year: yearFilter ? Number(yearFilter) : undefined,
          customMessage: customMsg,
        },
      }),
    onSuccess: (res: any) => {
      toast.success(
        isAm
          ? `የክፍያ ማስታወሻ ለ${res.sentCount || 0} አባላት በተሳካ ሁኔታ ተልኳል!`
          : `Payment reminder sent to ${res.sentCount || 0} unpaid members!`,
      );
      setBulkReminderConfirm(false);
    },
    onError: (err: any) => {
      toast.error(err.message || (isAm ? 'ማስታወሻ መላክ አልተቻለም' : 'Failed to send reminders'));
    },
  });

  // Download Receipt PDF
  const handleDownloadReceipt = async (paymentId: string, receiptNo?: string) => {
    try {
      setDownloadingId(paymentId);
      const token =
        getAccessToken() || (typeof window !== 'undefined' ? localStorage.getItem('token') : null);
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';
      const res = await fetch(`${baseUrl}/payments/admin/${paymentId}/receipt/pdf`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) throw new Error('Failed to download receipt');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Membership-Receipt-${receiptNo || paymentId.slice(0, 8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      toast.error(err.message || (isAm ? 'ደረሰኙን ማውረድ አልተቻለም' : 'Error downloading receipt'));
    } finally {
      setDownloadingId(null);
    }
  };

  // Export Excel
  const handleExportExcel = async () => {
    try {
      const token =
        getAccessToken() || (typeof window !== 'undefined' ? localStorage.getItem('token') : null);
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';
      const params = new URLSearchParams({
        year: yearFilter || '',
        method: methodFilter || '',
        status: statusFilter || '',
        search: searchTerm || '',
      });

      const res = await fetch(`${baseUrl}/payments/admin/export?${params.toString()}`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) throw new Error('Failed to export Excel');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Membership-Payments-${yearFilter || 'All'}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success(isAm ? 'የክፍያ መዝገብ ኤክሴል ወርዷል!' : 'Payments Excel exported successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Export error');
    }
  };

  const quickRejectionReasons = [
    'የባንክ ደረሰኝ ፎቶ አይነበብም (Receipt unreadable)',
    'የማመሳከሪያ ቁጥር የተሳሳተ ነው (Invalid reference number)',
    'የተከፈለው መጠን ትክክል አይደለም (Incorrect amount paid)',
    'በባንክ ሂሳብ መግለጫ ላይ አልተገኘም (Transaction not found on bank statement)',
  ];

  return (
    <div className="space-y-8 pb-16">
      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground font-ethiopic">
            {isAm ? 'ዓመታዊ የአባልነት ክፍያዎች' : 'Annual Membership Payments'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isAm
              ? 'የአባላት ዓመታዊ ክፍያ ግምገማ፣ ማረጋገጫ፣ የደረሰኝ አሰጣጥና የገንዘብ አሰባሰብ ክትትል'
              : 'Review bank/telebirr proofs, record cash payments, generate receipts, and track collection'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Year Selector */}
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="h-10 rounded-xl border border-border bg-card px-3 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="2019">2019 ዓ.ም.</option>
            <option value="2018">2018 ዓ.ም.</option>
            <option value="2017">2017 ዓ.ም.</option>
          </select>

          {/* Export Excel */}
          <button
            type="button"
            onClick={handleExportExcel}
            className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 text-sm font-semibold text-foreground hover:bg-muted transition-colors shadow-sm"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            <span>{isAm ? 'Excel ላክ' : 'Export Excel'}</span>
          </button>

          {/* Record Cash Button */}
          <button
            type="button"
            onClick={() => setCashModalOpen(true)}
            className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-primary px-4 text-sm font-semibold text-white shadow hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>{isAm ? 'በጥሬ ገንዘብ መዝግብ' : 'Record Cash'}</span>
          </button>
        </div>
      </div>

      {/* 2. Top Dashboard KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Collected */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {isAm ? 'የተሰበሰበ ጠቅላላ ገቢ' : 'Total Collected'}
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-foreground mt-2">
            {(summary?.totalCollected || 0).toLocaleString()} <span className="text-sm font-medium">ETB</span>
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            {isAm ? 'የስኬት መጠን፦ ' : 'Collection rate: '}
            <span className="font-bold text-emerald-600">{summary?.collectionRate || 0}%</span>
          </p>
        </div>

        {/* Pending Review */}
        <div
          onClick={() => setActiveTab('review')}
          className="rounded-2xl border border-border bg-card p-5 shadow-sm hover:border-primary/50 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {isAm ? 'በመጠባበቅ ላይ' : 'Pending Review'}
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-blue-600 mt-2">
            {summary?.pendingCount || 0}
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            {isAm ? 'ማረጋገጫ የሚጠብቁ ክፍያዎች' : 'Payments awaiting review'}
          </p>
        </div>

        {/* Paid Members */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {isAm ? 'ክፍያ የፈጸሙ አባላት' : 'Paid Members'}
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-emerald-600 mt-2">
            {summary?.paidMembersCount || 0}{' '}
            <span className="text-xs font-normal text-muted-foreground">
              / {summary?.totalActiveMembers || 0}
            </span>
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            {isAm ? 'የፀደቀ ዓመታዊ ክፍያ ያላቸው' : 'Active verified members'}
          </p>
        </div>

        {/* Unpaid Members */}
        <div
          onClick={() => setActiveTab('unpaid')}
          className="rounded-2xl border border-border bg-card p-5 shadow-sm hover:border-amber-400 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {isAm ? 'ክፍያ ያልፈጸሙ' : 'Unpaid Members'}
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600">
              <AlertCircle className="h-5 w-5" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-amber-600 mt-2">
            {summary?.unpaidCount || 0}
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            {isAm ? 'ክፍያ ያልከፈሉ ንቁ አባላት' : 'Active members without payment'}
          </p>
        </div>
      </div>

      {/* 3. Navigation Tabs */}
      <div className="flex border-b border-border gap-2">
        <button
          type="button"
          onClick={() => {
            setActiveTab('review');
            setPage(1);
          }}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all ${
            activeTab === 'review'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Clock className="h-4 w-4" />
          <span>{isAm ? 'የግምገማ ዝርዝር (Pending Queue)' : 'Review Queue'}</span>
          {summary?.pendingCount ? (
            <span className="ml-1 rounded-full bg-blue-100 dark:bg-blue-950 px-2 py-0.5 text-xs text-blue-700 dark:text-blue-300 font-bold">
              {summary.pendingCount}
            </span>
          ) : null}
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('all');
            setPage(1);
          }}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all ${
            activeTab === 'all'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <CreditCard className="h-4 w-4" />
          <span>{isAm ? 'ሁሉም ክፍያዎች' : 'All Payments'}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('unpaid');
            setPage(1);
          }}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all ${
            activeTab === 'unpaid'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>{isAm ? 'ክፍያ ያልፈጸሙ አባላት' : 'Unpaid Members'}</span>
          {summary?.unpaidCount ? (
            <span className="ml-1 rounded-full bg-amber-100 dark:bg-amber-950 px-2 py-0.5 text-xs text-amber-700 dark:text-amber-300 font-bold">
              {summary.unpaidCount}
            </span>
          ) : null}
        </button>
      </div>

      {/* =========================================================================
          TAB 1: REVIEW QUEUE
         ========================================================================= */}
      {activeTab === 'review' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground">
              {isAm
                ? `ግምገማ የሚጠብቁ ክፍያዎች (${paymentsData?.total || 0})`
                : `Pending Verification (${paymentsData?.total || 0})`}
            </h2>
          </div>

          {paymentsLoading ? (
            <div className="flex min-h-[300px] items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : paymentsData?.items && paymentsData.items.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {paymentsData.items.map((payment) => {
                const memberName = `${payment.member.firstName} ${payment.member.fatherName}`;
                return (
                  <div
                    key={payment.id}
                    className="rounded-2xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between gap-4"
                  >
                    <div>
                      {/* Top Bar */}
                      <div className="flex items-center justify-between pb-3 border-b border-border">
                        <div className="flex items-center gap-2">
                          <span className="rounded-md bg-primary/10 px-2 py-0.5 font-mono text-xs font-bold text-primary">
                            {payment.member.memberNo}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {payment.membershipYear} ዓ.ም.
                          </span>
                        </div>
                        <span className="capitalize text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                          {payment.method === 'telebirr'
                            ? 'ቴሌብር (Telebirr)'
                            : payment.method === 'cbe'
                            ? 'CBE'
                            : payment.method}
                        </span>
                      </div>

                      {/* Member Info */}
                      <div className="mt-3">
                        <h4 className="text-base font-bold text-foreground">{memberName}</h4>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground mt-1">
                          {payment.member.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {payment.member.phone}
                            </span>
                          )}
                          {payment.member.department && (
                            <span>{payment.member.department.nameAm}</span>
                          )}
                        </div>
                      </div>

                      {/* Transaction Details */}
                      <div className="mt-4 grid grid-cols-2 gap-3 bg-muted/40 p-3 rounded-xl text-xs">
                        <div>
                          <span className="text-muted-foreground block">{isAm ? 'ማመሳከሪያ' : 'Reference'}</span>
                          <span className="font-mono font-bold text-foreground">{payment.referenceNo}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block">{isAm ? 'የተከፈለበት ቀን' : 'Paid Date'}</span>
                          <span className="font-semibold text-foreground">
                            {payment.paidOn ? new Date(payment.paidOn).toLocaleDateString() : '-'}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block">{isAm ? 'የተከፈለ መጠን' : 'Amount Paid'}</span>
                          <span className="text-base font-bold text-primary">
                            {Number(payment.amount).toLocaleString()} {payment.currency}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block">{isAm ? 'የዓመቱ ክፍያ' : 'Fee'}</span>
                          <span className="font-medium text-muted-foreground">
                            {summary?.fee?.amount || 600} ETB
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 pt-2 border-t border-border">
                      {payment.proofUrl ? (
                        <button
                          type="button"
                          onClick={() =>
                            setPreviewProof({
                              url: payment.proofUrl!,
                              title: `${memberName} - ${payment.referenceNo}`,
                            })
                          }
                          className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
                        >
                          <Eye className="h-3.5 w-3.5 text-primary" />
                          <span>{isAm ? 'ማረጋገጫ እይ' : 'View Proof'}</span>
                        </button>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">
                          {isAm ? 'ፋይል የለም' : 'No proof file'}
                        </span>
                      )}

                      <div className="ml-auto flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setRejectModal({ id: payment.id, memberName })}
                          disabled={rejectMutation.isPending}
                          className="rounded-xl border border-red-200 dark:border-red-900 px-3 py-2 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors"
                        >
                          {isAm ? 'ውድቅ አድርግ' : 'Reject'}
                        </button>

                        <button
                          type="button"
                          onClick={() => approveMutation.mutate(payment.id)}
                          disabled={approveMutation.isPending}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors disabled:opacity-50"
                        >
                          {approveMutation.isPending ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Check className="h-3.5 w-3.5" />
                          )}
                          <span>{isAm ? 'አጽድቅ' : 'Approve'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
              <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-500 mb-2" />
              <h3 className="text-base font-bold text-foreground">
                {isAm ? 'ምንም የሚገመገም ክፍያ የለም!' : 'All clear! No pending payments to review.'}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                {isAm
                  ? 'አባላት በባንክ ወይም በቴሌብር የከፈሉትን ማረጋገጫ ሲልኩ እዚህ ይዘረዘራሉ።'
                  : 'Submitted payments from members will show up here.'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 2: ALL PAYMENTS
         ========================================================================= */}
      {activeTab === 'all' && (
        <div className="space-y-4">
          {/* Method Totals Breakdown Cards */}
          {paymentsData?.methodTotals && paymentsData.methodTotals.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {paymentsData.methodTotals.map((m) => (
                <div key={m.method} className="rounded-xl border border-border bg-card p-3 shadow-xs">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                    {m.method === 'telebirr' ? 'ቴሌብር' : m.method === 'cbe' ? 'CBE' : m.method === 'cash' ? 'ጥሬ ገንዘብ' : m.method}
                  </span>
                  <p className="text-lg font-bold text-foreground mt-0.5">
                    {m.totalAmount.toLocaleString()} <span className="text-xs font-normal">ETB</span>
                  </p>
                  <span className="text-[10px] text-muted-foreground">{m.count} {isAm ? 'ክፍያዎች' : 'payments'}</span>
                </div>
              ))}
            </div>
          )}

          {/* Filter Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-card p-4 rounded-2xl border border-border">
            <div className="relative sm:col-span-2">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder={isAm ? 'በአባል ስም፣ መለያ ቁጥር ወይም ማመሳከሪያ ፈልግ...' : 'Search by name, ID or reference...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-10 w-full rounded-xl border border-border bg-background pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="h-10 rounded-xl border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">{isAm ? 'ሁሉም የክፍያ ዘዴዎች' : 'All Methods'}</option>
              <option value="telebirr">ቴሌብር (Telebirr)</option>
              <option value="cbe">የኢትዮጵያ ንግድ ባንክ (CBE)</option>
              <option value="abyssinia">አቢሲኒያ ባንክ (Abyssinia)</option>
              <option value="cash">ጥሬ ገንዘብ (Cash)</option>
              <option value="other_bank">ሌላ ባንክ (Other)</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 rounded-xl border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">{isAm ? 'ሁሉም ሁኔታዎች' : 'All Statuses'}</option>
              <option value="approved">{isAm ? 'የፀደቀ (Approved)' : 'Approved'}</option>
              <option value="pending">{isAm ? 'በመጠባበቅ ላይ (Pending)' : 'Pending'}</option>
              <option value="rejected">{isAm ? 'ውድቅ የተደረገ (Rejected)' : 'Rejected'}</option>
            </select>
          </div>

          {/* Table */}
          {paymentsLoading ? (
            <div className="flex min-h-[300px] items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : paymentsData?.items && paymentsData.items.length > 0 ? (
            <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/70 text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
                  <tr>
                    <th className="px-4 py-3.5 font-bold">{isAm ? 'የደረሰኝ ቁ.' : 'Receipt No'}</th>
                    <th className="px-4 py-3.5 font-bold">{isAm ? 'አባል' : 'Member'}</th>
                    <th className="px-4 py-3.5 font-bold">{isAm ? 'ዓ.ም' : 'Year'}</th>
                    <th className="px-4 py-3.5 font-bold">{isAm ? 'ዘዴ' : 'Method'}</th>
                    <th className="px-4 py-3.5 font-bold">{isAm ? 'ማመሳከሪያ' : 'Ref No'}</th>
                    <th className="px-4 py-3.5 font-bold">{isAm ? 'ቀን' : 'Paid Date'}</th>
                    <th className="px-4 py-3.5 font-bold">{isAm ? 'መጠን' : 'Amount'}</th>
                    <th className="px-4 py-3.5 font-bold">{isAm ? 'ሁኔታ' : 'Status'}</th>
                    <th className="px-4 py-3.5 font-bold text-right">{isAm ? 'ተግባር' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {paymentsData.items.map((p) => {
                    const memberName = `${p.member.firstName} ${p.member.fatherName}`;
                    return (
                      <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3.5 font-mono text-xs font-bold text-primary">
                          {p.receiptNo || '-'}
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="font-semibold text-foreground text-xs leading-snug">{memberName}</p>
                          <span className="font-mono text-[11px] text-muted-foreground">{p.member.memberNo}</span>
                        </td>
                        <td className="px-4 py-3.5 text-xs text-muted-foreground">{p.membershipYear}</td>
                        <td className="px-4 py-3.5 capitalize text-xs">
                          {p.method === 'telebirr'
                            ? 'ቴሌብር'
                            : p.method === 'cbe'
                            ? 'CBE'
                            : p.method === 'cash'
                            ? 'ጥሬ ገንዘብ'
                            : p.method}
                        </td>
                        <td className="px-4 py-3.5 font-mono text-xs text-muted-foreground">
                          {p.referenceNo}
                        </td>
                        <td className="px-4 py-3.5 text-xs text-muted-foreground">
                          {p.paidOn ? new Date(p.paidOn).toLocaleDateString() : '-'}
                        </td>
                        <td className="px-4 py-3.5 font-bold text-foreground text-xs">
                          {Number(p.amount).toLocaleString()} {p.currency}
                        </td>
                        <td className="px-4 py-3.5">
                          {p.status === 'approved' && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-950 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
                              <CheckCircle2 className="h-3 w-3" />
                              {isAm ? 'የፀደቀ' : 'Approved'}
                            </span>
                          )}
                          {p.status === 'pending' && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 dark:bg-blue-950 px-2.5 py-0.5 text-[11px] font-bold text-blue-800 dark:text-blue-300">
                              <Clock className="h-3 w-3" />
                              {isAm ? 'በመጠባበቅ ላይ' : 'Pending'}
                            </span>
                          )}
                          {p.status === 'rejected' && (
                            <span
                              title={p.reviewNote || ''}
                              className="inline-flex items-center gap-1 rounded-full bg-red-100 dark:bg-red-950 px-2.5 py-0.5 text-[11px] font-bold text-red-800 dark:text-red-300 cursor-help"
                            >
                              <XCircle className="h-3 w-3" />
                              {isAm ? 'ውድቅ' : 'Rejected'}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {p.proofUrl && (
                              <button
                                type="button"
                                onClick={() =>
                                  setPreviewProof({
                                    url: p.proofUrl!,
                                    title: `${memberName} - ${p.referenceNo}`,
                                  })
                                }
                                title={isAm ? 'ማረጋገጫ እይ' : 'View Proof'}
                                className="rounded-lg border border-border p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                            )}
                            {p.status === 'approved' && p.receiptNo && (
                              <button
                                type="button"
                                onClick={() => handleDownloadReceipt(p.id, p.receiptNo)}
                                disabled={downloadingId === p.id}
                                title={isAm ? 'ደረሰኝ አውርድ' : 'Download Receipt'}
                                className="rounded-lg border border-border p-1.5 text-primary hover:bg-primary hover:text-white transition-colors"
                              >
                                {downloadingId === p.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Download className="h-4 w-4" />
                                )}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center text-muted-foreground text-sm">
              {isAm ? 'ምንም ክፍያዎች አልተገኙም።' : 'No payment records match the filters.'}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 3: UNPAID MEMBERS
         ========================================================================= */}
      {activeTab === 'unpaid' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-foreground">
                {isAm
                  ? `የ${yearFilter} ዓ.ም. ክፍያ ያልፈጸሙ አባላት (${unpaidData?.count || 0})`
                  : `Unpaid Active Members for ${yearFilter} (${unpaidData?.count || 0})`}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isAm
                  ? 'ለእነዚህ አባላት የውስጠ-መተግበሪያ ማስታወሻ በመላክ ክፍያቸውን እንዲፈጽሙ ማሳሰብ ይችላሉ።'
                  : 'Send payment reminder notifications to all active members who have not paid.'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setBulkReminderConfirm(true)}
              disabled={remindersMutation.isPending || !unpaidData?.count}
              className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" />
              <span>{isAm ? 'ለሁሉም ማስታወሻ ላክ' : 'Send Reminder to All'}</span>
            </button>
          </div>

          {unpaidLoading ? (
            <div className="flex min-h-[300px] items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : unpaidData?.members && unpaidData.members.length > 0 ? (
            <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/70 text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
                  <tr>
                    <th className="px-5 py-3.5 font-bold">{isAm ? 'የአባል መለያ' : 'Member ID'}</th>
                    <th className="px-5 py-3.5 font-bold">{isAm ? 'ሙሉ ስም' : 'Full Name'}</th>
                    <th className="px-5 py-3.5 font-bold">{isAm ? 'ስልክ' : 'Phone'}</th>
                    <th className="px-5 py-3.5 font-bold">{isAm ? 'ክፍል' : 'Department'}</th>
                    <th className="px-5 py-3.5 font-bold">{isAm ? 'የቀድሞ ሙከራ' : 'Last Attempt'}</th>
                    <th className="px-5 py-3.5 font-bold text-right">{isAm ? 'ተግባር' : 'Action'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {unpaidData.members.map((m) => {
                    const memberName = `${m.firstName} ${m.fatherName}`;
                    return (
                      <tr key={m.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-5 py-4 font-mono text-xs font-bold text-primary">
                          {m.memberNo}
                        </td>
                        <td className="px-5 py-4 font-semibold text-foreground text-sm">
                          {memberName}
                        </td>
                        <td className="px-5 py-4 text-xs text-muted-foreground">{m.phone || '-'}</td>
                        <td className="px-5 py-4 text-xs text-muted-foreground">
                          {m.department?.nameAm || '-'}
                        </td>
                        <td className="px-5 py-4 text-xs">
                          {m.latestAttempt ? (
                            <span className="inline-flex items-center gap-1 rounded bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 px-2 py-0.5 text-[11px] font-semibold">
                              {m.latestAttempt.status} ({m.latestAttempt.referenceNo})
                            </span>
                          ) : (
                            <span className="text-muted-foreground italic text-[11px]">
                              {isAm ? 'ሙከራ የለም' : 'No attempts'}
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedMember({ id: m.id, name: memberName, memberNo: m.memberNo });
                              setCashModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-primary hover:text-white transition-colors"
                          >
                            <Plus className="h-3 w-3" />
                            <span>{isAm ? 'ጥሬ ገንዘብ' : 'Cash'}</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center text-muted-foreground text-sm">
              <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500 mb-2" />
              {isAm
                ? 'እንኳን ደስ አለዎት! ሁሉም ንቁ አባላት የዚህን ዓመት ክፍያ ፈጽመዋል።'
                : 'Great! All active members have paid their annual membership fee.'}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          MODAL 1: PROOF PREVIEW MODAL
         ========================================================================= */}
      {previewProof && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-card border border-border shadow-2xl">
            <div className="flex items-center justify-between border-b border-border p-4">
              <h3 className="text-base font-bold text-foreground">{previewProof.title}</h3>
              <button
                type="button"
                onClick={() => setPreviewProof(null)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[75vh] overflow-auto p-4 flex items-center justify-center bg-muted/20">
              {previewProof.url.endsWith('.pdf') ? (
                <div className="text-center py-8">
                  <FileText className="mx-auto h-16 w-16 text-primary mb-3" />
                  <p className="text-sm font-semibold text-foreground mb-3">PDF Attachment</p>
                  <a
                    href={previewProof.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white"
                  >
                    <Download className="h-4 w-4" />
                    <span>Open / Download PDF</span>
                  </a>
                </div>
              ) : (
                <img
                  src={previewProof.url}
                  alt="Proof"
                  className="max-h-[70vh] max-w-full rounded-xl object-contain shadow"
                />
              )}
            </div>

            <div className="flex justify-end p-3 border-t border-border">
              <button
                type="button"
                onClick={() => setPreviewProof(null)}
                className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted"
              >
                {isAm ? 'ዝጋ' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: REJECT PAYMENT MODAL
         ========================================================================= */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-2xl bg-card border border-border p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle className="h-5 w-5" />
                <h3 className="text-lg font-bold">{isAm ? 'ክፍያውን ውድቅ አድርግ' : 'Reject Payment'}</h3>
              </div>
              <button
                type="button"
                onClick={() => setRejectModal(null)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <p className="text-sm text-foreground">
                {isAm
                  ? `የ${rejectModal.memberName}ን ክፍያ ውድቅ ለማድረግ ምክንያቱን ይምረጡ ወይም ይጻፉ (ለአባሉ ይላካል)፦`
                  : `Please specify why ${rejectModal.memberName}'s payment is being rejected:`}
              </p>

              {/* Quick Reason Chips */}
              <div className="flex flex-wrap gap-1.5">
                {quickRejectionReasons.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => setRejectionNote(chip)}
                    className="rounded-lg border border-border bg-muted/60 px-2.5 py-1 text-xs text-foreground hover:border-primary hover:bg-primary/5 transition-colors text-left"
                  >
                    {chip}
                  </button>
                ))}
              </div>

              {/* Custom Reason Text Area */}
              <textarea
                rows={3}
                value={rejectionNote}
                onChange={(e) => setRejectionNote(e.target.value)}
                placeholder={isAm ? 'የውድቅ ምክንያት እዚህ ያስገቡ...' : 'Enter rejection note for member...'}
                className="w-full rounded-xl border border-border bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div className="mt-5 flex justify-end gap-2 border-t border-border pt-3">
              <button
                type="button"
                onClick={() => setRejectModal(null)}
                className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted"
              >
                {isAm ? 'ይቅር' : 'Cancel'}
              </button>

              <button
                type="button"
                onClick={() => {
                  if (!rejectionNote.trim()) {
                    toast.error(isAm ? 'ምክንያት ማስገባት ግዴታ ነው' : 'Rejection reason is required');
                    return;
                  }
                  rejectMutation.mutate({ paymentId: rejectModal.id, note: rejectionNote.trim() });
                }}
                disabled={rejectMutation.isPending}
                className="rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 shadow-sm disabled:opacity-50"
              >
                {rejectMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <span>{isAm ? 'ውድቅ አድርግ' : 'Confirm Rejection'}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 3: RECORD CASH PAYMENT MODAL
         ========================================================================= */}
      {cashModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-2xl bg-card border border-border p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2 text-primary">
                <CreditCard className="h-5 w-5" />
                <h3 className="text-lg font-bold">
                  {isAm ? 'የጥሬ ገንዘብ ክፍያ መዝግብ' : 'Record Cash Payment'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setCashModalOpen(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {/* Member Selector / Search */}
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">
                  {isAm ? 'አባል ይምረጡ' : 'Select Member'}
                </label>
                {selectedMember ? (
                  <div className="flex items-center justify-between rounded-xl border border-primary/40 bg-primary/5 p-3 text-sm">
                    <div>
                      <p className="font-bold text-foreground">{selectedMember.name}</p>
                      <span className="font-mono text-xs text-muted-foreground">
                        {selectedMember.memberNo}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedMember(null)}
                      className="text-xs font-bold text-primary hover:underline"
                    >
                      {isAm ? 'ቀይር' : 'Change'}
                    </button>
                  </div>
                ) : (
                  <div>
                    <input
                      type="text"
                      placeholder={isAm ? 'በስም ወይም በአባል ቁጥር ፈልግ...' : 'Search by member name or ID...'}
                      value={cashMemberSearch}
                      onChange={(e) => setCashMemberSearch(e.target.value)}
                      className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    {searchedMembers && searchedMembers.length > 0 && (
                      <div className="mt-1 max-h-40 overflow-auto rounded-xl border border-border bg-card shadow-lg divide-y divide-border">
                        {searchedMembers.map((m) => (
                          <div
                            key={m.id}
                            onClick={() =>
                              setSelectedMember({
                                id: m.id,
                                name: `${m.firstName} ${m.fatherName}`,
                                memberNo: m.memberNo,
                              })
                            }
                            className="p-2 text-xs hover:bg-muted cursor-pointer flex items-center justify-between"
                          >
                            <span className="font-semibold text-foreground">
                              {m.firstName} {m.fatherName}
                            </span>
                            <span className="font-mono text-muted-foreground">{m.memberNo}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Amount */}
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">
                  {isAm ? 'የክፍያ መጠን (በብር)' : 'Amount (ETB)'}
                </label>
                <input
                  type="number"
                  value={cashAmount}
                  onChange={(e) => setCashAmount(e.target.value)}
                  className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Date Paid */}
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">
                  {isAm ? 'የተከፈለበት ቀን' : 'Payment Date'}
                </label>
                <input
                  type="date"
                  value={cashDate}
                  onChange={(e) => setCashDate(e.target.value)}
                  className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Note */}
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">
                  {isAm ? 'ማስታወሻ (አማራጭ)' : 'Note (Optional)'}
                </label>
                <input
                  type="text"
                  placeholder={isAm ? 'ማስታወሻ ካለ...' : 'Receipt / Cashier remark...'}
                  value={cashNote}
                  onChange={(e) => setCashNote(e.target.value)}
                  className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2 border-t border-border pt-4">
              <button
                type="button"
                onClick={() => setCashModalOpen(false)}
                className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted"
              >
                {isAm ? 'ይቅር' : 'Cancel'}
              </button>

              <button
                type="button"
                onClick={() => cashMutation.mutate()}
                disabled={cashMutation.isPending || !selectedMember}
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary/90 shadow-sm disabled:opacity-50"
              >
                {cashMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                <span>{isAm ? 'ክፍያውን መዝግብና ደረሰኝ አውጣ' : 'Save & Issue Receipt'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          CONFIRM DIALOG: BULK REMINDERS
         ========================================================================= */}
      <ConfirmDialog
        open={bulkReminderConfirm}
        onOpenChange={setBulkReminderConfirm}
        title={isAm ? 'የክፍያ ማስታወሻ መላኪያ' : 'Send Payment Reminders'}
        description={
          isAm
            ? `ክፍያ ላልፈጸሙ ${unpaidData?.count || 0} ንቁ አባላት የዓመታዊ ክፍያ ማስታወሻ ይላካል?`
            : `Are you sure you want to broadcast payment reminder notifications to ${unpaidData?.count || 0} unpaid members?`
        }
        confirmLabel={isAm ? 'ማስታወሻውን ላክ' : 'Send Reminders'}
        cancelLabel={isAm ? 'ይቅር' : 'Cancel'}
        onConfirm={() => remindersMutation.mutate()}
      />
    </div>
  );
}
