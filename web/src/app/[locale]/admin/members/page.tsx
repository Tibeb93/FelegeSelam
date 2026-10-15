'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { apiClient } from '../../../../lib/api-client';
import { Member, PaginatedResponse, Department } from '../../../../types/api';
import { DataTable, ColumnDef } from '../../../../components/ui/DataTable';
import { StatusBadge } from '../../../../components/ui/StatusBadge';
import { GenerateLetterDialog } from '../../../../components/members/GenerateLetterDialog';
import { useToast } from '../../../../providers/ToastProvider';
import {
  Download,
  Filter,
  UserPlus,
  FileSpreadsheet,
  FileText,
  CreditCard,
  User,
  ChevronDown,
  Upload,
  Clock,
  Eye,
  Edit3,
  CheckSquare,
  Square,
  X,
  Loader2,
} from 'lucide-react';
import {
  gregorianToEthiopian,
  formatEthiopianDate,
} from '../../../../lib/ethiopian-calendar';

export default function MembersAdminPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = useTranslations('Members');
  const tCommon = useTranslations('Common');
  const toast = useToast();
  const isAm = locale === 'am';

  // Table state for server-side pagination, sorting, and filters
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [sexFilter, setSexFilter] = useState('');
  const [parishFilter, setParishFilter] = useState('');
  const [sortColumn, setSortColumn] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Bulk Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Export menu & Letter Dialog states
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [letterMember, setLetterMember] = useState<Member | null>(null);

  // Fetch school departments for filter
  const { data: departments = [] } = useQuery<Department[]>({
    queryKey: ['members-departments'],
    queryFn: () => apiClient.get<Department[]>('/members/departments'),
  });

  // Query members from NestJS API
  const { data, isLoading, refetch } = useQuery<PaginatedResponse<Member>>({
    queryKey: [
      'admin-members-list',
      page,
      pageSize,
      search,
      statusFilter,
      departmentFilter,
      sexFilter,
      parishFilter,
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
          departmentId: departmentFilter ? Number(departmentFilter) : undefined,
          sex: sexFilter || undefined,
          sort: sortColumn ? `${sortColumn}:${sortDirection}` : undefined,
        },
      }),
  });

  // Query count of pending members for banner badge
  const { data: pendingData } = useQuery<PaginatedResponse<Member>>({
    queryKey: ['pending-members-count'],
    queryFn: () =>
      apiClient.get<PaginatedResponse<Member>>('/members', {
        params: { status: 'pending', limit: 1 },
      }),
  });

  const pendingCount = pendingData?.total ?? pendingData?.meta?.total ?? 0;
  const currentMembers = (data?.items || data?.data || []) as Member[];
  const totalMembers = data?.total ?? data?.meta?.total ?? currentMembers.length;

  // Toggle selection for single row
  const toggleSelectRow = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Toggle select all on current page
  const toggleSelectAll = () => {
    if (selectedIds.size === currentMembers.length && currentMembers.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(currentMembers.map((m) => m.id)));
    }
  };

  const isAllSelected =
    currentMembers.length > 0 &&
    currentMembers.every((m) => selectedIds.has(m.id));

  // Handle Export with current filters
  const handleExport = async (format: 'xlsx' | 'pdf' | 'docx') => {
    setIsExporting(true);
    setShowExportMenu(false);
    try {
      const ext = format === 'docx' ? 'docx' : format === 'pdf' ? 'pdf' : 'xlsx';
      toast.info(
        isAm
          ? `የአባላት ሰነድ በ ${format.toUpperCase()} በመዘጋጀት ላይ ነው...`
          : `Preparing ${format.toUpperCase()} export...`
      );

      const blob = await apiClient.get<Blob>('/members/export', {
        params: {
          format,
          status: statusFilter || undefined,
          departmentId: departmentFilter ? Number(departmentFilter) : undefined,
          sex: sexFilter || undefined,
          parish: parishFilter || undefined,
          search: search || undefined,
        },
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Aemade-Selam-Members-${new Date().toISOString().split('T')[0]}.${ext}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(
        isAm ? 'የአባላት ሰነድ በተሳካ ሁኔታ ወርዷል' : 'Members export downloaded successfully'
      );
    } catch (err: any) {
      toast.error(err.message || (isAm ? 'ሰነዱን ማውረድ አልተቻለም' : 'Export failed'));
    } finally {
      setIsExporting(false);
    }
  };

  // Handle Download ID Card
  const handleDownloadIdCard = async (member: Member) => {
    try {
      toast.info(isAm ? 'መታወቂያ በማዘጋጀት ላይ...' : 'Preparing ID Card...');
      const blob = await apiClient.get<Blob>(`/members/${member.id}/id-card`);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ID-${member.memberNo}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success(isAm ? 'የአባል መታወቂያ ወርዷል' : 'ID card downloaded');
    } catch {
      toast.error(isAm ? 'መታወቂያ ማውረድ አልተቻለም' : 'Failed to download ID card');
    }
  };

  // Define Columns for DataTable
  const columns: ColumnDef<Member>[] = [
    {
      key: 'select',
      header: '',
      className: 'w-10 px-2 text-center',
      render: (row) => (
        <input
          type="checkbox"
          checked={selectedIds.has(row.id)}
          onChange={() => toggleSelectRow(row.id)}
          className="h-4 w-4 rounded border-input text-primary focus:ring-primary cursor-pointer"
          aria-label={`Select ${row.firstName}`}
        />
      ),
    },
    {
      key: 'memberNo',
      header: t('memberNo'),
      sortable: true,
      render: (row) => (
        <Link
          href={`/${locale}/admin/members/${row.id}`}
          className="font-mono text-xs font-bold text-primary hover:underline"
        >
          {row.memberNo}
        </Link>
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
            <Link
              href={`/${locale}/admin/members/${row.id}`}
              className="font-semibold text-foreground hover:text-primary transition-colors block"
            >
              {row.firstName} {row.fatherName} {row.grandfatherName || ''}
            </Link>
            {row.baptismalName && (
              <div className="text-[11px] text-muted-foreground">
                {isAm ? 'ክ/ስም:' : 'Baptismal:'} {row.baptismalName}
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
          {row.department?.nameAm ||
            row.department?.nameEn ||
            (isAm ? 'ያልተመደበ' : 'Unassigned')}
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
            {formatEthiopianDate(eth, isAm ? 'am' : 'en')}
          </span>
        );
      },
    },
    {
      key: 'actions',
      header: tCommon('actions'),
      className: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          {/* View Profile */}
          <Link
            href={`/${locale}/admin/members/${row.id}`}
            title={t('profile')}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <Eye className="h-4 w-4" />
          </Link>

          {/* Edit */}
          <Link
            href={`/${locale}/admin/members/${row.id}/edit`}
            title={t('editMember')}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:bg-muted hover:text-primary transition-colors"
          >
            <Edit3 className="h-4 w-4" />
          </Link>

          {/* ID Card */}
          <button
            type="button"
            onClick={() => handleDownloadIdCard(row)}
            title={t('idCard')}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:bg-muted hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
          >
            <CreditCard className="h-4 w-4" />
          </button>

          {/* Official Letter */}
          <button
            type="button"
            onClick={() => setLetterMember(row)}
            title={t('generateLetter')}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:bg-muted hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            <FileText className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Letter Dialog if selected */}
      {letterMember && (
        <GenerateLetterDialog
          open={Boolean(letterMember)}
          onOpenChange={(open) => !open && setLetterMember(null)}
          member={letterMember}
          locale={locale}
        />
      )}

      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {t('title')}
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">{t('subtitle')}</p>
        </div>

        {/* Action Buttons: Add, Import, Pending, Export */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Pending Approvals Link */}
          {pendingCount > 0 && (
            <Link
              href={`/${locale}/admin/members/pending`}
              className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2 text-xs md:text-sm font-semibold text-amber-800 hover:bg-amber-100 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300 transition-colors shadow-sm"
            >
              <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <span>{t('pendingApprovals')}</span>
              <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-bold text-amber-700 dark:text-amber-300">
                {pendingCount}
              </span>
            </Link>
          )}

          {/* Import from Excel */}
          <Link
            href={`/${locale}/admin/members/import`}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-xs md:text-sm font-medium text-foreground hover:bg-muted transition-colors shadow-sm"
          >
            <Upload className="h-4 w-4 text-primary" />
            <span>{t('importMembers')}</span>
          </Link>

          {/* Add Member */}
          <Link
            href={`/${locale}/admin/members/new`}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs md:text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90 transition-colors"
          >
            <UserPlus className="h-4 w-4" />
            <span>{t('addMember')}</span>
          </Link>

          {/* Export Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={isExporting}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-xs md:text-sm font-medium text-foreground hover:bg-muted transition-colors shadow-sm"
            >
              {isExporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              )}
              <span>{t('exportMembers')}</span>
              <ChevronDown className="h-3.5 w-3.5 opacity-60" />
            </button>

            {showExportMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowExportMenu(false)}
                />
                <div className="absolute right-0 z-50 mt-2 w-48 rounded-xl border border-border bg-card p-1.5 shadow-xl animate-in zoom-in-95">
                  <button
                    type="button"
                    onClick={() => handleExport('xlsx')}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-foreground hover:bg-muted transition-colors text-left"
                  >
                    <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                    <span>Excel (.xlsx)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExport('pdf')}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-foreground hover:bg-muted transition-colors text-left"
                  >
                    <FileText className="h-4 w-4 text-rose-600" />
                    <span>PDF Document</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExport('docx')}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-foreground hover:bg-muted transition-colors text-left"
                  >
                    <Download className="h-4 w-4 text-blue-600" />
                    <span>Word (.docx)</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Floating / Sticky Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-xs md:text-sm text-foreground animate-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-primary">
              {isAm
                ? `${selectedIds.size} አባላት ተመርጠዋል`
                : `${selectedIds.size} members selected`}
            </span>
            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              className="text-xs text-muted-foreground hover:text-foreground underline flex items-center gap-1"
            >
              <X className="h-3 w-3" />
              <span>{isAm ? 'ምርጫ ሰርዝ' : 'Clear selection'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleExport('xlsx')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted shadow-sm"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
              <span>{isAm ? 'የተመረጡትን በExcel ላክ' : 'Export to Excel'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Reusable DataTable with server-side controls */}
      <DataTable<Member>
        data={currentMembers}
        columns={columns}
        total={totalMembers}
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
        locale={isAm ? 'am' : 'en'}
        /* Filter Slot: Status, Department, Sex, Parish Dropdowns */
        filtersSlot={
          <div className="flex flex-wrap items-center gap-2">
            {/* Select All on Page Button */}
            <button
              type="button"
              onClick={toggleSelectAll}
              className="inline-flex items-center gap-1.5 rounded-lg border border-input bg-card px-2.5 py-2 text-xs text-foreground hover:bg-muted shadow-sm transition-colors"
              title={isAm ? 'ሁሉንም ምረጥ' : 'Select All'}
            >
              {isAllSelected ? (
                <CheckSquare className="h-4 w-4 text-primary" />
              ) : (
                <Square className="h-4 w-4 text-muted-foreground" />
              )}
              <span className="hidden sm:inline">
                {isAllSelected
                  ? isAm
                    ? 'ምርጫ አንሳ'
                    : 'Deselect All'
                  : isAm
                    ? 'ሁሉንም ምረጥ'
                    : 'Select All'}
              </span>
            </button>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-input bg-card px-2.5 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
            >
              <option value="">{t('allStatuses')}</option>
              <option value="active">{t('active')}</option>
              <option value="pending">{t('pending')}</option>
              <option value="inactive">{t('inactive')}</option>
              <option value="graduated">{t('graduated')}</option>
              <option value="transferred">{t('transferred')}</option>
            </select>

            {/* Department Filter */}
            <select
              value={departmentFilter}
              onChange={(e) => {
                setDepartmentFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-input bg-card px-2.5 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-sm max-w-[160px] truncate"
            >
              <option value="">{t('allDepartments')}</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {isAm ? dept.nameAm : dept.nameEn || dept.nameAm}
                </option>
              ))}
            </select>

            {/* Sex Filter */}
            <select
              value={sexFilter}
              onChange={(e) => {
                setSexFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-input bg-card px-2.5 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
            >
              <option value="">{t('allSexes')}</option>
              <option value="male">{isAm ? 'ወንድ' : 'Male'}</option>
              <option value="female">{isAm ? 'ሴት' : 'Female'}</option>
            </select>

            {/* Parish Filter */}
            <input
              type="text"
              value={parishFilter}
              onChange={(e) => {
                setParishFilter(e.target.value);
                setPage(1);
              }}
              placeholder={t('filterByParish')}
              className="rounded-lg border border-input bg-card px-2.5 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-sm w-32"
            />
          </div>
        }
      />
    </div>
  );
}
