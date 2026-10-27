'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CreditCard,
  Building,
  Smartphone,
  Copy,
  Check,
  Download,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
  Calendar,
  Send,
  Loader2,
} from 'lucide-react';
import { apiRequest, getAccessToken } from '@/lib/api-client';
import { useToast } from '@/providers/ToastProvider';
import { FormCard } from '@/components/forms/FormCard';
import { FormSection } from '@/components/forms/FormSection';
import { TextField } from '@/components/forms/TextField';
import { TextArea } from '@/components/forms/TextArea';
import { SelectWithSearch } from '@/components/forms/SelectWithSearch';
import { DateField } from '@/components/forms/DateField';
import { FileDrop } from '@/components/forms/FileDrop';
import { PrimaryButton } from '@/components/forms/Buttons';

export interface MembershipFeeConfig {
  amount: number;
  currency: string;
  year: number;
  yearLabel: string;
  deadline?: string;
}

export interface PaymentAccount {
  id?: string;
  type: string;
  bankName: string;
  accountName: string;
  accountNumber?: string;
  telebirrNumber?: string;
  qrImageUrl?: string;
  active: boolean;
}

export interface MembershipPaymentRecord {
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
}

export interface MyPaymentStatusResponse {
  member: {
    id: string;
    memberNo: string;
    fullName: string;
    phone?: string;
    email?: string;
    department?: string;
  };
  membershipYear: number;
  fee: MembershipFeeConfig;
  status: 'paid' | 'pending' | 'rejected' | 'not_paid';
  currentPayment: MembershipPaymentRecord | null;
  approvedPayment: MembershipPaymentRecord | null;
  history: MembershipPaymentRecord[];
  accounts: PaymentAccount[];
}

export default function MemberMembershipPaymentPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const isAm = locale === 'am';
  const toast = useToast();
  const queryClient = useQueryClient();

  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Form State
  const [method, setMethod] = useState<string>('telebirr');
  const [referenceNo, setReferenceNo] = useState<string>('');
  const [paidOn, setPaidOn] = useState<string>(new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState<string>('600');
  const [note, setNote] = useState<string>('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Query payment status and history
  const { data, isLoading, error } = useQuery<MyPaymentStatusResponse>({
    queryKey: ['payments', 'my-status'],
    queryFn: () => apiRequest<MyPaymentStatusResponse>('/payments/my-status'),
  });

  React.useEffect(() => {
    if (data?.fee?.amount) {
      setAmount(String(data.fee.amount));
    }
  }, [data?.fee?.amount]);

  // Submit payment proof mutation
  const submitMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      formData.append('method', method);
      formData.append('referenceNo', referenceNo.trim());
      formData.append('paidOn', paidOn);
      formData.append('amount', amount);
      if (data?.fee?.year) {
        formData.append('membershipYear', String(data.fee.year));
      }
      if (note) {
        formData.append('note', note.trim());
      }
      if (proofFile) {
        formData.append('proof', proofFile);
      }

      return apiRequest('/payments/submit', {
        method: 'POST',
        body: formData,
      });
    },
    onSuccess: () => {
      toast.success(
        isAm
          ? 'የክፍያ ማረጋገጫዎ በተሳካ ሁኔታ ገብቷል! አስተዳዳሪው ሲያረጋግጥ ይፀድቃል።'
          : 'Payment proof submitted successfully! Pending admin approval.',
      );
      // Reset form
      setReferenceNo('');
      setNote('');
      setProofFile(null);
      setFormErrors({});
      queryClient.invalidateQueries({ queryKey: ['payments', 'my-status'] });
    },
    onError: (err: any) => {
      toast.error(
        err.message || (isAm ? 'ክፍያውን ማስገባት አልተቻለም' : 'Failed to submit payment proof'),
      );
    },
  });

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success(isAm ? 'ተቀድቷል!' : 'Copied to clipboard!');
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleDownloadReceipt = async (paymentId: string, receiptNo?: string) => {
    try {
      setDownloadingId(paymentId);
      const token = getAccessToken() || (typeof window !== 'undefined' ? localStorage.getItem('token') : null);
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';
      const res = await fetch(`${baseUrl}/payments/my-receipt/${paymentId}/pdf`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || 'Failed to download receipt PDF');
      }

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

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!referenceNo.trim()) {
      errors.referenceNo = isAm
        ? 'የማመሳከሪያ ቁጥር ማስገባት ግዴታ ነው'
        : 'Transaction reference number is required';
    }
    if (!amount || Number(amount) <= 0) {
      errors.amount = isAm ? 'ትክክለኛ የብር መጠን ያስገቡ' : 'Valid amount is required';
    }
    if (!proofFile) {
      errors.proof = isAm
        ? 'የክፍያ ማረጋገጫ ፋይል ወይም ደረሰኝ ማያያዝ ግዴታ ነው'
        : 'Proof of payment receipt or SMS screenshot is required';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error(isAm ? 'እባክዎ የተሳሳቱ መረጃዎችን ያስተካክሉ' : 'Please fix the errors in the form');
      return;
    }
    submitMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">
          {isAm ? 'የአባልነት ክፍያ መረጃ በመጫን ላይ...' : 'Loading membership payment details...'}
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-6 text-center">
        <AlertCircle className="mx-auto h-10 w-10 text-destructive mb-2" />
        <h3 className="text-lg font-bold text-destructive">
          {isAm ? 'የክፍያ መረጃውን ማግኘት አልተቻለም' : 'Failed to load membership payment details'}
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          {(error as any)?.message || (isAm ? 'እባክዎ ደግመው ይሞክሩ' : 'Please try again later')}
        </p>
      </div>
    );
  }

  const { fee, status, currentPayment, history, accounts } = data;

  const paymentMethodOptions = [
    { value: 'telebirr', label: 'ቴሌብር (Telebirr)' },
    { value: 'cbe', label: 'የኢትዮጵያ ንግድ ባንክ (CBE)' },
    { value: 'abyssinia', label: 'አቢሲኒያ ባንክ (Bank of Abyssinia)' },
    { value: 'awash', label: 'አዋሽ ባንክ (Awash Bank)' },
    { value: 'dashen', label: 'ዳሽን ባንክ (Dashen Bank)' },
    { value: 'other_bank', label: isAm ? 'ሌላ ባንክ' : 'Other Bank Transfer' },
  ];

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground font-ethiopic">
            {isAm ? 'ዓመታዊ የአባልነት ክፍያ' : 'Annual Membership Payment'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isAm
              ? `የ${fee.yearLabel} የሰንበት ትምህርት ቤት ዓመታዊ የአባልነት ክፍያዎን እዚህ ይፈጽሙ`
              : `Manage and pay your annual membership fee for ${fee.yearLabel}`}
          </p>
        </div>

        {/* Status Pill in Header */}
        <div className="shrink-0">
          {status === 'paid' && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 px-4 py-1.5 text-sm font-bold text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
              <CheckCircle2 className="h-4 w-4" />
              {isAm ? 'የፀደቀ ክፍያ (Paid)' : 'Paid & Verified'}
            </span>
          )}
          {status === 'pending' && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 dark:bg-blue-950/60 px-4 py-1.5 text-sm font-bold text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
              <Clock className="h-4 w-4 animate-spin" />
              {isAm ? 'በመገምገም ላይ (Pending Review)' : 'Pending Review'}
            </span>
          )}
          {status === 'rejected' && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 dark:bg-red-950/60 px-4 py-1.5 text-sm font-bold text-red-800 dark:text-red-300 border border-red-300 dark:border-red-800">
              <XCircle className="h-4 w-4" />
              {isAm ? 'ውድቅ የተደረገ (Rejected)' : 'Rejected'}
            </span>
          )}
          {status === 'not_paid' && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 dark:bg-amber-950/60 px-4 py-1.5 text-sm font-bold text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
              <AlertCircle className="h-4 w-4" />
              {isAm ? 'አልተከፈለም (Not Paid)' : 'Not Paid'}
            </span>
          )}
        </div>
      </div>

      {/* 2. Status Banner Card */}
      <div className="rounded-2xl border border-border bg-gradient-to-br from-card via-card to-primary/5 p-6 md:p-8 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {isAm ? 'የክፍያ ዓመተ ምሕረት' : 'Membership Year'}
            </span>
            <h3 className="text-xl md:text-2xl font-bold text-primary font-ethiopic mt-1">
              {fee.yearLabel}
            </h3>
          </div>

          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {isAm ? 'የዓመቱ ክፍያ መጠን' : 'Required Fee'}
            </span>
            <h3 className="text-xl md:text-2xl font-bold text-foreground mt-1">
              {fee.amount} {fee.currency}
            </h3>
          </div>

          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {isAm ? 'የመጨረሻው ቀን (Deadline)' : 'Payment Deadline'}
            </span>
            <p className="text-base font-semibold text-foreground mt-1">
              {fee.deadline || (isAm ? 'ያልተወሰነ' : 'Not set')}
            </p>
          </div>

          <div className="flex flex-col gap-2 md:items-end">
            {status === 'paid' && currentPayment?.receiptNo && (
              <button
                type="button"
                onClick={() => handleDownloadReceipt(currentPayment.id, currentPayment.receiptNo)}
                disabled={downloadingId === currentPayment.id}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-primary/90 transition-all disabled:opacity-50"
              >
                {downloadingId === currentPayment.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                <span>{isAm ? 'ደረሰኝ አውርድ (PDF)' : 'Download Receipt'}</span>
              </button>
            )}
            {status === 'rejected' && (
              <span className="text-xs text-red-600 font-medium">
                {isAm ? 'እባክዎ ደግመው ይክፈሉ ወይም ያረጋግጡ' : 'Please resubmit with valid proof'}
              </span>
            )}
          </div>
        </div>

        {/* Status Callout Details */}
        {status === 'paid' && (
          <div className="mt-6 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-4 text-emerald-900 dark:text-emerald-200 text-sm flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">
                {isAm
                  ? `የ${fee.yearLabel} ዓመታዊ የአባልነት ክፍያዎ ፀድቋል!`
                  : `Your membership fee for ${fee.yearLabel} has been approved and verified!`}
              </p>
              <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">
                {isAm ? 'የደረሰኝ ቁጥር፦ ' : 'Official Receipt Number: '}
                <code className="font-bold underline">{currentPayment?.receiptNo}</code>
              </p>
            </div>
          </div>
        )}

        {status === 'pending' && (
          <div className="mt-6 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 p-4 text-blue-900 dark:text-blue-200 text-sm flex items-start gap-3">
            <Clock className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">
                {isAm
                  ? 'የክፍያ ማረጋገጫዎ ገብቷል፤ በአስተዳዳሪው በመገምገም ላይ ነው'
                  : 'Your payment proof has been submitted and is currently pending review.'}
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-0.5">
                {isAm ? 'የማመሳከሪያ ቁጥር፦ ' : 'Reference No: '}
                <code className="font-bold">{currentPayment?.referenceNo}</code>
                {'  |  '}
                {isAm ? 'የተላከበት፦ ' : 'Submitted on: '}
                {currentPayment?.createdAt ? new Date(currentPayment.createdAt).toLocaleDateString() : '-'}
              </p>
            </div>
          </div>
        )}

        {status === 'rejected' && (
          <div className="mt-6 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 p-4 text-red-900 dark:text-red-200 text-sm flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">
                {isAm ? 'ያቀረቡት ክፍያ ውድቅ ተደርጓል' : 'Your submitted payment was rejected by admin'}
              </p>
              <p className="text-xs font-medium text-red-700 dark:text-red-300 mt-1">
                {isAm ? 'የውድቅ ምክንያት፦ ' : 'Rejection Reason: '}
                <span className="italic font-normal">{currentPayment?.reviewNote || (isAm ? 'ያልተገለጸ ምክንያት' : 'No reason provided')}</span>
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                {isAm
                  ? 'እባክዎ ትክክለኛውን የማመሳከሪያ ቁጥር እና ግልጽ የደረሰኝ ስክሪንሾት በማያያዝ ከዚህ በታች በድጋሚ ያስገቡ።'
                  : 'Please review the reason, attach the correct proof, and resubmit below.'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 3. Payment Instructions & Accounts */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Building className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold text-foreground font-ethiopic">
            {isAm ? 'የክፍያ መመሪያና የሂሳብ ቁጥሮች' : 'Payment Accounts & Instructions'}
          </h2>
        </div>
        <p className="text-sm text-muted-foreground">
          {isAm
            ? `የ${fee.amount} ብር ክፍያዎን ከታች ባሉት የባንክ ወይም የቴሌብር ሂሳቦች በመክፈል የማመሳከሪያ ቁጥሩን (Reference No) እና ደረሰኙን ያስገቡ።`
            : `Transfer the ${fee.amount} ETB membership fee to any of the accounts below, then submit your transaction reference and receipt slip.`}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
          {accounts.map((acc: PaymentAccount, idx: number) => {
            const isTelebirr = acc.type === 'telebirr';
            const copyValue = isTelebirr ? acc.telebirrNumber : acc.accountNumber;
            const copyKey = `acc-${idx}`;

            return (
              <div
                key={copyKey}
                className="relative rounded-2xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-border">
                    <span className="text-xs font-bold uppercase tracking-wider text-primary">
                      {acc.bankName}
                    </span>
                    {isTelebirr ? (
                      <Smartphone className="h-5 w-5 text-primary" />
                    ) : (
                      <Building className="h-5 w-5 text-primary" />
                    )}
                  </div>

                  <div className="mt-3">
                    <span className="text-xs text-muted-foreground block">
                      {isAm ? 'የሂሳብ ስም' : 'Account Name'}
                    </span>
                    <p className="font-semibold text-sm text-foreground">{acc.accountName}</p>
                  </div>

                  <div className="mt-3">
                    <span className="text-xs text-muted-foreground block">
                      {isTelebirr ? (isAm ? 'የስልክ ቁጥር' : 'Phone Number') : (isAm ? 'የሂሳብ ቁጥር' : 'Account Number')}
                    </span>
                    <p className="font-mono text-base font-bold text-foreground tracking-wider mt-0.5">
                      {copyValue || '-'}
                    </p>
                  </div>
                </div>

                {copyValue && (
                  <button
                    type="button"
                    onClick={() => handleCopy(copyKey, copyValue)}
                    className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl border border-border bg-muted/60 px-3 py-2 text-xs font-semibold text-foreground hover:bg-primary hover:text-white transition-colors"
                  >
                    {copiedKey === copyKey ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                        <span>{isAm ? 'ተቀድቷል' : 'Copied!'}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>{isAm ? 'ቁጥሩን ቅዳ' : 'Copy Number'}</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Payment Submission Form (Uses R3 Components) */}
      {(status === 'not_paid' || status === 'rejected' || status === 'pending') && (
        <FormCard
          title={
            status === 'pending'
              ? (isAm ? 'አዲስ ወይም የተስተካከለ ማረጋገጫ ላክ' : 'Update Submitted Proof')
              : (isAm ? 'የክፍያ ማረጋገጫ ማቅረቢያ ቅጽ' : 'Submit Payment Proof')
          }
          description={
            isAm
              ? 'የፈጸሙትን ክፍያ የማመሳከሪያ ቁጥርና ደረሰኝ እዚህ ይላኩ'
              : 'Enter your transaction reference number and upload the payment receipt or SMS screenshot'
          }
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <FormSection
              title={isAm ? 'የግብይት ዝርዝሮች' : 'Transaction Details'}
              icon={CreditCard}
              description={
                isAm
                  ? 'የተጠቀሙበትን የክፍያ ዘዴና ከባንክ/ቴሌብር የተሰጠዎትን ማመሳከሪያ ያስገቡ'
                  : 'Select payment method and enter the official reference code'
              }
              columns={2}
            >
              {/* Method Select */}
              <SelectWithSearch
                name="method"
                label={isAm ? 'የክፍያ ዘዴ' : 'Payment Method'}
                required
                options={paymentMethodOptions}
                value={method}
                onChange={(val) => setMethod(String(val))}
                helperText={isAm ? 'የከፈሉበትን ባንክ ወይም ቴሌብር ይምረጡ' : 'Select payment provider'}
              />

              {/* Reference Number */}
              <TextField
                name="referenceNo"
                label={isAm ? 'የማመሳከሪያ ቁጥር (Transaction Reference / FT No)' : 'Transaction Reference No'}
                placeholder="e.g. FT2345678 or 0911223344-9988"
                required
                value={referenceNo}
                onChange={(e) => setReferenceNo(e.target.value)}
                error={formErrors.referenceNo}
                helperText={
                  isAm
                    ? 'ከባንክ ወይም ከቴሌብር በደረሰዎት SMS ላይ የተጠቀሰው ልዩ የግብይት ቁጥር'
                    : 'Unique reference number from SMS or slip'
                }
              />

              {/* Amount */}
              <TextField
                name="amount"
                type="number"
                label={isAm ? 'የተከፈለው መጠን (በብር)' : 'Amount Paid (ETB)'}
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                error={formErrors.amount}
                helperText={isAm ? `የዓመቱ ክፍያ፦ ${fee.amount} ብር` : `Required annual fee: ${fee.amount} ETB`}
              />

              {/* Date Paid */}
              <DateField
                name="paidOn"
                label={isAm ? 'የተከፈለበት ቀን' : 'Payment Date'}
                required
                value={paidOn}
                onChange={(val) => setPaidOn(val)}
                helperText={isAm ? 'ክፍያውን የፈጸሙበት ቀን' : 'Date shown on receipt'}
              />
            </FormSection>

            {/* Proof Upload */}
            <FormSection
              title={isAm ? 'የደረሰኝ ወይም ስክሪንሾት ማረጋገጫ' : 'Proof of Payment Attachment'}
              icon={FileText}
              description={
                isAm
                  ? 'የባንክ ደረሰኝ ፎቶ ወይም የቴሌብር SMS ስክሪንሾት (PNG, JPG, WEBP ወይም PDF እስከ 5MB)'
                  : 'Upload receipt photo or Telebirr SMS confirmation screenshot (Max 5MB)'
              }
              columns={1}
            >
              <FileDrop
                label={isAm ? 'ደረሰኝ ወይም ማረጋገጫ ፋይል' : 'Receipt or Slip File'}
                required
                maxSizeBytes={5 * 1024 * 1024}
                accept="image/png, image/jpeg, image/webp, application/pdf"
                currentFile={proofFile}
                onFileSelect={(file) => setProofFile(file)}
                error={formErrors.proof}
                helperText={
                  isAm
                    ? 'የክፍያ ወረቀት ፎቶ፣ ስካን ወይም የቴሌብር SMS ስክሪንሾት (እስከ 5 MB)'
                    : 'Bank deposit slip photo or Telebirr SMS screenshot (Max 5MB)'
                }
              />
            </FormSection>

            {/* Note */}
            <TextArea
              name="note"
              label={isAm ? 'ተጨማሪ ማስታወሻ (አማራጭ)' : 'Additional Notes (Optional)'}
              placeholder={isAm ? 'ማንኛውም ተጨማሪ መልዕክት ካለ እዚህ ይጻፉ...' : 'Any remarks or notes for the admin...'}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
            />

            {/* Submit Button */}
            <div className="flex justify-end pt-4 border-t border-border">
              <PrimaryButton
                type="submit"
                loading={submitMutation.isPending}
                loadingText={isAm ? 'በመላክ ላይ...' : 'Submitting...'}
                startIcon={<Send className="h-4 w-4" />}
                className="w-full sm:w-auto min-w-[200px]"
              >
                {isAm ? 'ክፍያውን አረጋግጥና ላክ' : 'Submit Payment Proof'}
              </PrimaryButton>
            </div>
          </form>
        </FormCard>
      )}

      {/* 5. Payment History Table */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold text-foreground font-ethiopic">
            {isAm ? 'የክፍያ ታሪክ' : 'Payment History'}
          </h2>
        </div>

        {history && history.length > 0 ? (
          <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/70 text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
                <tr>
                  <th className="px-5 py-3.5 font-bold">{isAm ? 'ዓ.ም' : 'Year'}</th>
                  <th className="px-5 py-3.5 font-bold">{isAm ? 'የክፍያ ዘዴ' : 'Method'}</th>
                  <th className="px-5 py-3.5 font-bold">{isAm ? 'ማመሳከሪያ ቁጥር' : 'Reference No'}</th>
                  <th className="px-5 py-3.5 font-bold">{isAm ? 'ቀን' : 'Paid Date'}</th>
                  <th className="px-5 py-3.5 font-bold">{isAm ? 'መጠን' : 'Amount'}</th>
                  <th className="px-5 py-3.5 font-bold">{isAm ? 'ሁኔታ' : 'Status'}</th>
                  <th className="px-5 py-3.5 font-bold text-right">{isAm ? 'ተግባር' : 'Action'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {history.map((item: MembershipPaymentRecord) => (
                  <tr key={item.id} className="hover:bg-muted/40 transition-colors">
                    <td className="px-5 py-4 font-bold text-foreground">
                      {item.membershipYear} ዓ.ም.
                    </td>
                    <td className="px-5 py-4 capitalize text-foreground">
                      {item.method === 'telebirr'
                        ? 'ቴሌብር (Telebirr)'
                        : item.method === 'cbe'
                        ? 'CBE'
                        : item.method === 'cash'
                        ? (isAm ? 'ጥሬ ገንዘብ' : 'Cash')
                        : item.method}
                    </td>
                    <td className="px-5 py-4 font-mono text-xs text-foreground">
                      {item.referenceNo}
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">
                      {item.paidOn ? new Date(item.paidOn).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-5 py-4 font-semibold text-foreground">
                      {Number(item.amount).toLocaleString()} {item.currency || 'ETB'}
                    </td>
                    <td className="px-5 py-4">
                      {item.status === 'approved' && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-950 px-2.5 py-0.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                          <CheckCircle2 className="h-3 w-3" />
                          {isAm ? 'የፀደቀ' : 'Approved'}
                        </span>
                      )}
                      {item.status === 'pending' && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 dark:bg-blue-950 px-2.5 py-0.5 text-xs font-bold text-blue-800 dark:text-blue-300">
                          <Clock className="h-3 w-3" />
                          {isAm ? 'በመጠባበቅ ላይ' : 'Pending'}
                        </span>
                      )}
                      {item.status === 'rejected' && (
                        <span
                          title={item.reviewNote || ''}
                          className="inline-flex items-center gap-1 rounded-full bg-red-100 dark:bg-red-950 px-2.5 py-0.5 text-xs font-bold text-red-800 dark:text-red-300 cursor-help"
                        >
                          <XCircle className="h-3 w-3" />
                          {isAm ? 'ውድቅ' : 'Rejected'}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      {item.status === 'approved' && item.receiptNo && (
                        <button
                          type="button"
                          onClick={() => handleDownloadReceipt(item.id, item.receiptNo)}
                          disabled={downloadingId === item.id}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-primary hover:text-white transition-colors disabled:opacity-50"
                        >
                          {downloadingId === item.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Download className="h-3 w-3" />
                          )}
                          <span>{isAm ? 'ደረሰኝ' : 'Receipt'}</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-muted-foreground text-sm">
            {isAm
              ? 'ምንም የተመዘገበ የክፍያ ታሪክ የለም።'
              : 'No payment history records found.'}
          </div>
        )}
      </div>
    </div>
  );
}
