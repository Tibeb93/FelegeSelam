'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import {
  Wallet,
  Receipt,
  Download,
  Calendar,
  CreditCard,
  Building2,
  AlertCircle,
  Loader2,
  TrendingUp,
} from 'lucide-react';
import { apiRequest } from '@/lib/api-client';
import { Member, Contribution } from '@/types/api';

export default function PortalContributionsPage() {
  const t = useTranslations('Portal');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // 1. Query Member Profile
  const { data: profile, isLoading: profileLoading } = useQuery<Member>({
    queryKey: ['members', 'me', 'profile'],
    queryFn: () => apiRequest<Member>('/members/me/profile'),
  });

  // 2. Query Member's Contribution Summary
  const { data: summaryData, isLoading: summaryLoading } = useQuery<{
    totalAmount: number;
    totalCount: number;
    byType: Array<{ type: string; totalAmount: number; count: number }>;
    recentContributions: Contribution[];
  }>({
    queryKey: ['contributions', 'member', profile?.id, 'summary'],
    queryFn: () => apiRequest(`/contributions/members/${profile?.id}/summary`),
    enabled: !!profile?.id,
  });

  const contributions =
    summaryData?.recentContributions || (profile as any)?.contributions || [];

  const totalAmount = summaryData?.totalAmount ?? contributions.reduce(
    (sum: number, c: any) => sum + Number(c.amount || 0),
    0,
  );

  const handleDownloadReceipt = async (contributionId: string, receiptNo: string) => {
    try {
      setDownloadingId(contributionId);
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await fetch(`http://localhost:3000/api/v1/contributions/${contributionId}/receipt`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) throw new Error('Failed to download receipt');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Receipt_${receiptNo || contributionId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      alert(err.message || 'Error downloading receipt');
    } finally {
      setDownloadingId(null);
    }
  };

  if (profileLoading || summaryLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-border pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-foreground font-ethiopic">
          {t('contributions')}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Review your Sunday school monthly offerings, special contributions, and download official receipts.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
          <span className="text-xs font-semibold text-muted-foreground">Total Contributions</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-primary font-mono">
              {Number(totalAmount).toLocaleString()} ETB
            </span>
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">Cumulative donations & dues</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
          <span className="text-xs font-semibold text-muted-foreground">Total Payments</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-foreground font-mono">
              {contributions.length}
            </span>
            <span className="text-xs text-muted-foreground">receipts issued</span>
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">Verified by finance office</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
          <span className="text-xs font-semibold text-muted-foreground">Last Contribution</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-sm font-bold text-foreground">
              {contributions.length > 0
                ? new Date(contributions[0].paidAt).toLocaleDateString()
                : 'No records'}
            </span>
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">Thank you for your blessed support</p>
        </div>
      </div>

      {/* Contributions Table */}
      <div className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden">
        <div className="border-b border-border px-6 py-4">
          <h3 className="text-sm font-bold text-foreground">Contribution History & Receipts</h3>
        </div>

        {contributions.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <Receipt className="mx-auto h-12 w-12 opacity-30 mb-2" />
            <h3 className="text-base font-bold text-foreground font-ethiopic">
              ምንም የተመዘገበ የስጦታ ወይም የክፍያ ታሪክ የለም
            </h3>
            <p className="text-xs mt-1">
              Your contribution records and monthly receipts will appear here once recorded.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 text-muted-foreground uppercase font-semibold">
                <tr>
                  <th className="px-6 py-3">Receipt No</th>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Contribution Type</th>
                  <th className="px-6 py-3">Amount</th>
                  <th className="px-6 py-3">Payment Method</th>
                  <th className="px-6 py-3 text-right">Receipt Voucher</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {contributions.map((c: any) => (
                  <tr key={c.id} className="hover:bg-muted/30">
                    <td className="px-6 py-3 font-mono font-bold text-primary">
                      {c.receiptNo}
                    </td>
                    <td className="px-6 py-3 font-mono text-muted-foreground">
                      {new Date(c.paidAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-3 capitalize font-medium text-foreground">
                      {c.type?.replace('_', ' ')}
                    </td>
                    <td className="px-6 py-3 font-mono font-bold text-foreground">
                      {Number(c.amount).toLocaleString()} ETB
                    </td>
                    <td className="px-6 py-3 capitalize text-muted-foreground">
                      {c.paymentMethod || 'Cash'}
                    </td>
                    <td className="px-6 py-3 text-right">
                      <button
                        type="button"
                        disabled={downloadingId === c.id}
                        onClick={() => handleDownloadReceipt(c.id, c.receiptNo)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted hover:border-primary disabled:opacity-50"
                      >
                        {downloadingId === c.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Download className="h-3.5 w-3.5" />
                        )}
                        <span>Download PDF</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
