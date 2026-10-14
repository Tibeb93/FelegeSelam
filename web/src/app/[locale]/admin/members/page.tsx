'use client';

import React, { useState, useTransition } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { apiClient } from '../../../../lib/api-client';
import { Member, PaginatedResponse, Department } from '../../../../types/api';
import { DataTable, ColumnDef } from '../../../../components/ui/DataTable';
import { StatusBadge } from '../../../../components/ui/StatusBadge';
import { useToast } from '../../../../providers/ToastProvider';
import {
  Download,
  Filter,
  UserPlus,
  FileSpreadsheet,
  FileText,
  CreditCard,
  User,
} from 'lucide-react';
import { gregorianToEthiopian, formatEthiopianDate } from '../../../../lib/ethiopian-calendar';

export default function MembersAdminPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = useTranslations('Members');
  const tCommon = useTranslations('Common');
  const toast = useToast();

  // Table state for server-side pagination, sorting, and search
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortColumn, setSortColumn] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Query members from NestJS API
  const { data, isLoading, refetch } = useQuery<PaginatedResponse<Member>>({
    queryKey: [
      'admin-members-list',
      page,
      pageSize,
      search,
      statusFilter,
      sortColumn,
      sortDirection,
    ],
    queryFn: () =>
      apiClient.get<PaginatedResponse<Member>>('/members', {
        params: {
          page,
          limit: pageSize,
          search: search || undefined,
          status: statusFilter || undefined,
          sortBy: sortColumn,
          sortOrder: sortDirection,
        },
      }),
  });

  // Handle Export to Excel
  const handleExportExcel = async () => {
    try {
      toast.info('የኤክሴል ሰነድ እየተዘጋጀ ነው...', 'ወደ ውጭ በመላክ ላይ');
      const blob = await apiClient.get<Blob>('/members/export', {
        params: {
          format: 'xlsx',
          status: statusFilter || undefined,
          search: search || undefined,
        },
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `members-export-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('የአባላት ሰነድ በተሳካ ሁኔታ ወርዷል', 'ተጠናቋል');
    } catch (err: any) {
      toast.error(err.message || 'ኤክሴል ማውረድ አልተቻለም');
    }
  };

  // Define Columns for DataTable
  const columns: ColumnDef<Member>[] = [
    {
      key: 'memberNo',
      header: t('memberNo'),
      sortable: true,
      render: (row) => (
        <span className="font-mono text-xs font-bold text-primary">
          {row.memberNo}
        </span>
      ),
    },
    {
      key: 'fullName',
      header: t('fullName'),
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-xs border border-primary/20">
            {row.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={row.photoUrl}
                alt={row.firstName}
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              <span>{row.firstName?.[0] || 'አ'}</span>
            )}
          </div>
          <div>
            <div className="font-medium text-foreground">
              {row.firstName} {row.fatherName} {row.grandfatherName || ''}
            </div>
            {row.baptismalName && (
              <div className="text-[11px] text-muted-foreground">
                ክ/ስም: {row.baptismalName}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'department',
      header: t('department'),
      render: (row) => (
        <span className="text-xs text-muted-foreground font-medium">
          {row.department?.nameAm || row.department?.nameEn || 'ያልተመደበ'}
        </span>
      ),
    },
    {
      key: 'phone',
      header: t('phone'),
      render: (row) => (
        <span className="font-mono text-xs text-muted-foreground">
          {row.phone || '—'}
        </span>
      ),
    },
    {
      key: 'status',
      header: t('status'),
      sortable: true,
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'joinedAt',
      header: t('joinedDate'),
      sortable: true,
      render: (row) => {
        if (!row.joinedAt) return <span>—</span>;
        const eth = gregorianToEthiopian(new Date(row.joinedAt));
        return (
          <span className="text-xs text-muted-foreground">
            {formatEthiopianDate(eth, locale === 'am' ? 'am' : 'en')}
          </span>
        );
      },
    },
    {
      key: 'actions',
      header: tCommon('actions'),
      render: (row) => (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={async () => {
              try {
                toast.info('መታወቂያ በማዘጋጀት ላይ...');
                const blob = await apiClient.get<Blob>(`/members/${row.id}/id-card`);
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `ID-${row.memberNo}.pdf`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                toast.success('የአባል መታወቂያ ወርዷል');
              } catch {
                toast.error('መታወቂያ ማውረድ አልተቻለም');
              }
            }}
            title={t('idCard')}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:bg-muted hover:text-primary transition-colors"
          >
            <CreditCard className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {t('title')}
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">{t('subtitle')}</p>
        </div>
      </div>

      {/* Reusable DataTable with server-side controls */}
      <DataTable<Member>
        data={data?.items || []}
        columns={columns}
        total={data?.total || 0}
        page={page}
        pageSize={pageSize}
        onPageChange={(newPage) => setPage(newPage)}
        onPageSizeChange={(newSize) => {
          setPageSize(newSize);
          setPage(1);
        }}
        sortColumn={sortColumn}
        sortDirection={sortDirection}
        onSortChange={(col, dir) => {
          setSortColumn(col);
          setSortDirection(dir);
        }}
        searchValue={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        searchPlaceholder={t('searchPlaceholder')}
        isLoading={isLoading}
        locale={locale === 'am' ? 'am' : 'en'}
        /* Filter Slot: Status Dropdown */
        filtersSlot={
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-input bg-card px-3 py-2 text-xs md:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
            >
              <option value="">{t('allStatuses')}</option>
              <option value="active">{t('active')}</option>
              <option value="pending">{t('pending')}</option>
              <option value="inactive">{t('inactive')}</option>
              <option value="graduated">{t('graduated')}</option>
              <option value="transferred">{t('transferred')}</option>
            </select>
          </div>
        }
        /* Export Slot: Export to Excel Button */
        exportSlot={
          <button
            type="button"
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs md:text-sm font-medium text-foreground hover:bg-muted/50 transition-colors shadow-sm"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>{t('exportMembers')}</span>
          </button>
        }
      />
    </div>
  );
}
