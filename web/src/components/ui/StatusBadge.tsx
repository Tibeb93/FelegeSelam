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
      'bg-[#E8F7F0] text-[#136640] border-[#A8E2C8] dark:bg-[#0E3523] dark:text-[#6CE0A6] dark:border-[#1E5D3F]',
  },
  present: {
    labelAm: 'ተገኝቷል',
    labelEn: 'Present',
    classes:
      'bg-[#E8F7F0] text-[#136640] border-[#A8E2C8] dark:bg-[#0E3523] dark:text-[#6CE0A6] dark:border-[#1E5D3F]',
  },
  approved: {
    labelAm: 'የጸደቀ',
    labelEn: 'Approved',
    classes:
      'bg-[#E8F7F0] text-[#136640] border-[#A8E2C8] dark:bg-[#0E3523] dark:text-[#6CE0A6] dark:border-[#1E5D3F]',
  },
  paid: {
    labelAm: 'የተከፈለ',
    labelEn: 'Paid',
    classes:
      'bg-[#E8F7F0] text-[#136640] border-[#A8E2C8] dark:bg-[#0E3523] dark:text-[#6CE0A6] dark:border-[#1E5D3F]',
  },
  open: {
    labelAm: 'ክፍት',
    labelEn: 'Open',
    classes:
      'bg-[#E8F7F0] text-[#136640] border-[#A8E2C8] dark:bg-[#0E3523] dark:text-[#6CE0A6] dark:border-[#1E5D3F]',
  },
  pending: {
    labelAm: 'በመጠባበቅ ላይ',
    labelEn: 'Pending',
    classes:
      'bg-[#FEF6E6] text-[#9E6500] border-[#FBD793] dark:bg-[#3D2800] dark:text-[#FFCC66] dark:border-[#6B4700]',
  },
  late: {
    labelAm: 'ዘግይቷል',
    labelEn: 'Late',
    classes:
      'bg-[#FEF6E6] text-[#9E6500] border-[#FBD793] dark:bg-[#3D2800] dark:text-[#FFCC66] dark:border-[#6B4700]',
  },
  warning: {
    labelAm: 'ማስጠንቀቂያ',
    labelEn: 'Warning',
    classes:
      'bg-[#FEF6E6] text-[#9E6500] border-[#FBD793] dark:bg-[#3D2800] dark:text-[#FFCC66] dark:border-[#6B4700]',
  },
  inactive: {
    labelAm: 'የማይንቀሳቀስ',
    labelEn: 'Inactive',
    classes:
      'bg-[#F0F4F8] text-[#5B6B7C] border-[#D7E3F1] dark:bg-[#0E2033] dark:text-[#8EADC8] dark:border-[#1A3E63]',
  },
  draft: {
    labelAm: 'ረቂቅ',
    labelEn: 'Draft',
    classes:
      'bg-[#F0F4F8] text-[#5B6B7C] border-[#D7E3F1] dark:bg-[#0E2033] dark:text-[#8EADC8] dark:border-[#1A3E63]',
  },
  suspended: {
    labelAm: 'የታገደ',
    labelEn: 'Suspended',
    classes:
      'bg-[#FDECEB] text-[#931B1B] border-[#F6B2B0] dark:bg-[#3E1110] dark:text-[#F88D8B] dark:border-[#731E1C]',
  },
  absent: {
    labelAm: 'ቀሪ',
    labelEn: 'Absent',
    classes:
      'bg-[#FDECEB] text-[#931B1B] border-[#F6B2B0] dark:bg-[#3E1110] dark:text-[#F88D8B] dark:border-[#731E1C]',
  },
  rejected: {
    labelAm: 'ውድቅ የተደረገ',
    labelEn: 'Rejected',
    classes:
      'bg-[#FDECEB] text-[#931B1B] border-[#F6B2B0] dark:bg-[#3E1110] dark:text-[#F88D8B] dark:border-[#731E1C]',
  },
  closed: {
    labelAm: 'የተዘጋ',
    labelEn: 'Closed',
    classes:
      'bg-[#FDECEB] text-[#931B1B] border-[#F6B2B0] dark:bg-[#3E1110] dark:text-[#F88D8B] dark:border-[#731E1C]',
  },
  urgent: {
    labelAm: 'አስቸኳይ',
    labelEn: 'Urgent',
    classes:
      'bg-[#FDECEB] text-[#931B1B] border-[#F6B2B0] dark:bg-[#3E1110] dark:text-[#F88D8B] dark:border-[#731E1C]',
  },
  graduated: {
    labelAm: 'የተመረቀ',
    labelEn: 'Graduated',
    classes:
      'bg-[#E8F1FB] text-[#0F4C81] border-[#B8D5F2] dark:bg-[#0A2644] dark:text-[#68A7E0] dark:border-[#164875]',
  },
  transferred: {
    labelAm: 'የተዛወረ',
    labelEn: 'Transferred',
    classes:
      'bg-[#E8F1FB] text-[#0F4C81] border-[#B8D5F2] dark:bg-[#0A2644] dark:text-[#68A7E0] dark:border-[#164875]',
  },
  completed: {
    labelAm: 'የተጠናቀቀ',
    labelEn: 'Completed',
    classes:
      'bg-[#E8F1FB] text-[#0F4C81] border-[#B8D5F2] dark:bg-[#0A2644] dark:text-[#68A7E0] dark:border-[#164875]',
  },
  excused: {
    labelAm: 'ፈቃድ',
    labelEn: 'Excused',
    classes:
      'bg-[#E8F1FB] text-[#0F4C81] border-[#B8D5F2] dark:bg-[#0A2644] dark:text-[#68A7E0] dark:border-[#164875]',
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
