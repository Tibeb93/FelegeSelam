'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../../lib/api-client';
import { logger } from '../../../../lib/logger';
import { BackupFileInfo } from '../../../../types/api';
import { useAuth } from '../../../../providers/AuthProvider';
import {
  Database,
  Download,
  Trash2,
  ShieldAlert,
  Clock,
  HardDrive,
  CheckCircle,
  AlertCircle,
  FileCode,
} from 'lucide-react';
import { Skeleton } from '../../../../components/ui/SkeletonLoaders';

export default function BackupsPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const isSuperAdmin = currentUser?.role?.name === 'super_admin';

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null,
  );

  // Query backups list
  const { data: backups, isLoading } = useQuery<BackupFileInfo[]>({
    queryKey: ['admin-backups-list'],
    queryFn: () => apiClient.get<BackupFileInfo[]>('/admin/backups'),
    enabled: isSuperAdmin,
  });

  // Create immediate backup mutation
  const createBackupMutation = useMutation({
    mutationFn: () => apiClient.post<BackupFileInfo>('/admin/backup', {}),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-backups-list'] });
      setFeedback({
        type: 'success',
        message:
          locale === 'am'
            ? `የውሂብ ምትኬ (${data.filename}) በተሳካ ሁኔታ ተዘጋጅቷል!`
            : `Backup snapshot (${data.filename}) generated successfully!`,
      });
      setTimeout(() => setFeedback(null), 5000);
    },
    onError: (err: any) => {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to create backup',
      });
      setTimeout(() => setFeedback(null), 5000);
    },
  });

  // Delete backup mutation
  const deleteBackupMutation = useMutation({
    mutationFn: (filename: string) => apiClient.delete(`/admin/backups/${filename}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-backups-list'] });
      setFeedback({
        type: 'success',
        message:
          locale === 'am'
            ? 'የምትኬ ፋይሉ በተሳካ ሁኔታ ተሰርዟል'
            : 'Backup file deleted successfully',
      });
      setTimeout(() => setFeedback(null), 4000);
    },
  });

  // Download SQL backup file
  const handleDownload = async (filename: string) => {
    try {
      const blob = await apiClient.getBlob(`/admin/backups/${filename}`);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      logger.error('Download failed:', error);
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="flex h-96 flex-col items-center justify-center rounded-2xl border border-destructive/20 bg-destructive/5 p-8 text-center">
        <ShieldAlert className="h-12 w-12 text-destructive mb-3" />
        <h2 className="text-lg font-bold text-foreground">
          {locale === 'am' ? 'የተከለከለ ክልል' : 'Restricted Access'}
        </h2>
        <p className="mt-1 max-w-md text-xs text-muted-foreground">
          {locale === 'am'
            ? 'የመረጃ ቋት ምትኬዎችን ማስተዳደር የሚችሉት ከፍተኛ አስተዳዳሪዎች (Super Admins) ብቻ ናቸው።'
            : 'Only Super Administrators have permission to create, download, or delete database backups.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground md:text-3xl">
            {locale === 'am' ? 'የውሂብ ምትኬ (Database Backups)' : 'Database Backups'}
          </h1>
          <p className="mt-1 text-xs md:text-sm text-muted-foreground">
            {locale === 'am'
              ? 'የመረጃ ቋት ምትኬዎችን ማመንጨት፣ የSQL ፋይሎችን ማውረድና የተከማቹ ምትኬዎችን መከታተል'
              : 'Generate on-demand database snapshots, download SQL dumps, and inspect backup history'}
          </p>
        </div>

        <button
          onClick={() => createBackupMutation.mutate()}
          disabled={createBackupMutation.isPending}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs md:text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          <Database className="h-4 w-4" />
          <span>
            {createBackupMutation.isPending
              ? locale === 'am'
                ? 'ምትኬ እየተዘጋጀ ነው...'
                : 'Generating SQL dump...'
              : locale === 'am'
                ? 'አዲስ ምትኬ አሁን አዘጋጅ'
                : 'Create Immediate Backup'}
          </span>
        </button>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div
          className={`flex items-center gap-2 rounded-xl p-3.5 text-xs font-medium border ${
            feedback.type === 'success'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
              : 'border-destructive/30 bg-destructive/10 text-destructive'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle className="h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Retention Policy Banner */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex items-start gap-3">
        <HardDrive className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div className="text-xs">
          <p className="font-semibold text-foreground">
            {locale === 'am' ? 'የምትኬ ፖሊሲና አጠባበቅ' : 'Automated Retention Policy'}
          </p>
          <p className="text-muted-foreground mt-0.5 leading-relaxed">
            {locale === 'am'
              ? 'ሲስተሙ በየቀኑ እኩለ ሌሊት (00:00) በራሱ ሙሉ የውሂብ ምትኬ የሚያዘጋጅ ሲሆን የመጨረሻዎቹ 30 ፋይሎች ይቀመጣሉ። የፈጠሯቸውን ምትኬዎች በማንኛውም ጊዜ ማውረድ ይችላሉ።'
              : 'The system automatically executes a nightly database snapshot into /backups and retains the latest 30 snapshots. You can also trigger an immediate dump anytime.'}
          </p>
        </div>
      </div>

      {/* Backups List */}
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="text-sm font-bold text-foreground">
            {locale === 'am' ? 'የተቀመጡ ምትኬዎች' : 'Available Backup Files'}
          </h2>
          <span className="text-xs font-semibold text-muted-foreground font-mono">
            {backups?.length || 0} {locale === 'am' ? 'ፋይሎች' : 'files'}
          </span>
        </div>

        {isLoading ? (
          <div className="p-6 space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : backups && backups.length > 0 ? (
          <div className="divide-y divide-border/60">
            {backups.map((b) => (
              <div
                key={b.filename}
                className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <FileCode className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-mono text-xs font-bold text-foreground">
                      {b.filename}
                    </p>
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-0.5">
                      <span>{b.sizeFormatted || `${Math.round(b.sizeBytes / 1024)} KB`}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1 font-mono">
                        <Clock className="h-3 w-3" />
                        {new Date(b.createdAt).toLocaleString(
                          locale === 'am' ? 'am-ET' : 'en-US',
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    onClick={() => handleDownload(b.filename)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                    title={locale === 'am' ? 'የSQL ፋይል አውርድ' : 'Download SQL Dump'}
                  >
                    <Download className="h-3.5 w-3.5 text-primary" />
                    <span>{locale === 'am' ? 'አውርድ' : 'Download'}</span>
                  </button>

                  <button
                    onClick={() => {
                      if (
                        confirm(
                          locale === 'am'
                            ? 'ይህን የምትኬ ፋይል ለማጥፋት እርግጠኛ ነዎት?'
                            : `Are you sure you want to delete ${b.filename}?`,
                        )
                      ) {
                        deleteBackupMutation.mutate(b.filename);
                      }
                    }}
                    className="inline-flex items-center gap-1 rounded-lg border border-destructive/20 bg-background p-1.5 text-xs text-destructive hover:bg-destructive/10 transition-colors"
                    title={locale === 'am' ? 'ሰርዝ' : 'Delete'}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-muted-foreground">
            {locale === 'am'
              ? 'ምንም የተዘጋጀ የምትኬ ፋይል የለም። ከላይ ያለውን ቁልፍ በመጫን አዲስ ምትኬ ማዘጋጀት ይችላሉ።'
              : 'No database backup files found. Click "Create Immediate Backup" above to generate one.'}
          </div>
        )}
      </div>
    </div>
  );
}
