'use client';

import React from 'react';

export type StatusType =
  | 'active'
  | 'pending'
  | 'inactive'
  | 'suspended'
  | 'graduated'
  | 'transferred'
  | 'completed'
  | 'draft'
  | 'open'
  | 'closed'
  | 'archived'
  | 'approved'
  | 'rejected'
  | 'submitted'
  | 'present'
  | 'absent'
  | 'late'
  | 'excused';

interface StatusBadgeProps {
  status: string | StatusType;
  label?: string;
  className?: string;
}

const STATUS_CONFIG: Record<
  string,
  { labelAm: string; labelEn: string; classes: string }
> = {
  active: {
    labelAm: 'ንቁ',
    labelEn: 'Active',
    classes:
      'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
  },
  pending: {
    labelAm: 'በመጠባበቅ ላይ',
    labelEn: 'Pending',
    classes:
      'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
  },
  inactive: {
    labelAm: 'የማይንቀሳቀስ',
    labelEn: 'Inactive',
    classes:
      'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-900/60 dark:text-slate-300 dark:border-slate-800',
  },
  suspended: {
    labelAm: 'የታገደ',
    labelEn: 'Suspended',
    classes:
      'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800',
  },
  graduated: {
    labelAm: 'የተመረቀ',
    labelEn: 'Graduated',
    classes:
      'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800',
  },
  transferred: {
    labelAm: 'የተዛወረ',
    labelEn: 'Transferred',
    classes:
      'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800',
  },
  completed: {
    labelAm: 'የተጠናቀቀ',
    labelEn: 'Completed',
    classes:
      'bg-teal-100 text-teal-800 border-teal-300 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-800',
  },
  open: {
    labelAm: 'ክፍት',
    labelEn: 'Open',
    classes:
      'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
  },
  draft: {
    labelAm: 'ረቂቅ',
    labelEn: 'Draft',
    classes:
      'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-900/60 dark:text-slate-300 dark:border-slate-700',
  },
  closed: {
    labelAm: 'የተዘጋ',
    labelEn: 'Closed',
    classes:
      'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800',
  },
  approved: {
    labelAm: 'የጸደቀ',
    labelEn: 'Approved',
    classes:
      'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
  },
  rejected: {
    labelAm: 'ውድቅ የተደረገ',
    labelEn: 'Rejected',
    classes:
      'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800',
  },
};

export function StatusBadge({ status, label, className = '' }: StatusBadgeProps) {
  const normalizedKey = (status || '').toLowerCase();
  const config = STATUS_CONFIG[normalizedKey] || {
    labelAm: status,
    labelEn: status,
    classes:
      'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800',
  };

  const displayText = label || config.labelEn || status;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors ${config.classes} ${className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {displayText}
    </span>
  );
}
