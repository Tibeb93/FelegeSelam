'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../../lib/api-client';
import { logger } from '../../../../lib/logger';
import { AuditLogItem } from '../../../../types/api';
import { useAuth } from '../../../../providers/AuthProvider';
import {
  ShieldAlert,
  FileSpreadsheet,
  Search,
  Eye,
  Calendar,
  X,
} from 'lucide-react';
import { DataTable, Column } from '../../../../components/ui/DataTable';

const ENTITIES = [
  'all',
  'member',
  'course',
  'lesson',
  'enrollment',
  'attendance',
  'grade',
  'post',
  'event',
  'form',
  'contribution',
  'user',
  'setting',
];

const ACTIONS = ['all', 'create', 'update', 'delete', 'review', 'approve', 'suspend'];

export default function AuditLogsPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const { user: currentUser } = useAuth();
  const isSuperAdmin = currentUser?.role?.name === 'super_admin';

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEntity, setSelectedEntity] = useState('all');
  const [selectedAction, setSelectedAction] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Selected item for diff inspection drawer
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Query audit logs
  const { data: logsData, isLoading } = useQuery<{
    data: AuditLogItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>({
    queryKey: [
      'audit-logs',
      page,
      pageSize,
      searchTerm,
      selectedEntity,
      selectedAction,
      fromDate,
      toDate,
    ],
    queryFn: () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString(),
      });
      if (searchTerm) params.set('search', searchTerm);
      if (selectedEntity !== 'all') params.set('entity', selectedEntity);
      if (selectedAction !== 'all') params.set('action', selectedAction);
      if (fromDate) params.set('fromDate', fromDate);
      if (toDate) params.set('toDate', toDate);

      return apiClient.get(`/audit-logs?${params.toString()}`);
    },
    enabled: isSuperAdmin,
  });

  // Export to Excel handler
  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      const params = new URLSearchParams({ format: 'xlsx' });
      if (selectedEntity !== 'all') params.set('entity', selectedEntity);
      if (selectedAction !== 'all') params.set('action', selectedAction);
      if (fromDate) params.set('fromDate', fromDate);
      if (toDate) params.set('toDate', toDate);

      const blob = await apiClient.getBlob(`/audit-logs/export?${params.toString()}`);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `AuditLogs_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      logger.error('Failed to export audit logs:', error);
    } finally {
      setIsExporting(false);
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
            ? 'የክትትል መዝገብን መመልከት የሚችሉት ከፍተኛ አስተዳዳሪዎች (Super Admins) ብቻ ናቸው።'
            : 'Only Super Administrators have permission to view the audit log and security trail.'}
        </p>
      </div>
    );
  }

  // DataTable Columns
  const columns: Column<AuditLogItem>[] = [
    {
      key: 'createdAt',
      title: locale === 'am' ? 'ቀንና ሰዓት' : 'Timestamp',
      render: (log) => (
        <div className="flex flex-col">
          <span className="font-mono text-xs font-semibold text-foreground">
            {new Date(log.createdAt).toLocaleDateString(locale === 'am' ? 'am-ET' : 'en-US')}
          </span>
          <span className="font-mono text-[10px] text-muted-foreground">
            {new Date(log.createdAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })}
          </span>
        </div>
      ),
    },
    {
      key: 'actor',
      title: locale === 'am' ? 'ተጠቃሚ' : 'Actor',
      render: (log) => (
        <div className="flex flex-col">
          <span className="text-xs font-medium text-foreground">
            {log.user?.email || log.user?.phone || 'System'}
          </span>
          {log.user?.role && (
            <span className="text-[10px] font-semibold text-secondary uppercase">
              {log.user.role.name}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'action',
      title: locale === 'am' ? 'ድርጊት' : 'Action',
      render: (log) => {
        let badgeColor = 'bg-muted text-foreground';
        if (log.action === 'create')
          badgeColor = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400';
        else if (log.action === 'update' || log.action === 'review')
          badgeColor = 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-400';
        else if (log.action === 'delete' || log.action === 'suspend')
          badgeColor = 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-400';

        return (
          <span
            className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider ${badgeColor}`}
          >
            {log.action}
          </span>
        );
      },
    },
    {
      key: 'entity',
      title: locale === 'am' ? 'ክፍል (Entity)' : 'Entity',
      render: (log) => (
        <span className="font-mono text-xs font-semibold text-primary capitalize">
          {log.entity}
        </span>
      ),
    },
    {
      key: 'entityId',
      title: locale === 'am' ? 'የመረጃ መለያ' : 'Entity ID',
      render: (log) => (
        <span className="font-mono text-[11px] text-muted-foreground truncate max-w-[120px] block">
          {log.entityId}
        </span>
      ),
    },
    {
      key: 'ipAddress',
      title: locale === 'am' ? 'የአይፒ አድራሻ' : 'IP Address',
      render: (log) => (
        <span className="font-mono text-xs text-muted-foreground">
          {log.ipAddress || '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      title: locale === 'am' ? 'ዝርዝር' : 'Details',
      render: (log) => (
        <button
          onClick={() => setSelectedLog(log)}
          className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-semibold text-foreground hover:bg-primary/10 hover:text-primary transition-colors"
        >
          <Eye className="h-3.5 w-3.5" />
          <span>{locale === 'am' ? 'ለውጥ እይ' : 'View Diff'}</span>
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6 pb-16">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground md:text-3xl">
            {locale === 'am' ? 'የክትትል መዝገብ' : 'Audit Logs & Trail'}
          </h1>
          <p className="mt-1 text-xs md:text-sm text-muted-foreground">
            {locale === 'am'
              ? 'በሲስተሙ ውስጥ የተከናወኑ ሁሉንም የተጠቃሚ እንቅስቃሴዎች፣ ለውጦችና ክስተቶች መዝገብ'
              : 'Immutable security log of user actions, state updates, and administrative events'}
          </p>
        </div>

        <button
          onClick={handleExportExcel}
          disabled={isExporting}
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-xs md:text-sm font-semibold text-foreground shadow-sm hover:bg-muted transition-colors disabled:opacity-50"
        >
          <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
          <span>{isExporting ? (locale === 'am' ? 'እየወረደ...' : 'Exporting...') : locale === 'am' ? 'በExcel አውርድ' : 'Export Excel'}</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
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
                  ? 'በተጠቃሚ፣ በክፍል፣ ወይም በአይፒ ፈልግ...'
                  : 'Search by user, entity, action, or IP...'
              }
              className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-xs md:text-sm text-foreground focus:border-primary focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Entity Filter */}
            <select
              value={selectedEntity}
              onChange={(e) => {
                setSelectedEntity(e.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-border bg-background px-3 py-2 text-xs md:text-sm text-foreground focus:border-primary focus:outline-none capitalize"
            >
              <option value="all">{locale === 'am' ? 'ሁሉም ክፍሎች' : 'All Entities'}</option>
              {ENTITIES.filter((e) => e !== 'all').map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </select>

            {/* Action Filter */}
            <select
              value={selectedAction}
              onChange={(e) => {
                setSelectedAction(e.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-border bg-background px-3 py-2 text-xs md:text-sm text-foreground focus:border-primary focus:outline-none capitalize"
            >
              <option value="all">{locale === 'am' ? 'ሁሉም ድርጊቶች' : 'All Actions'}</option>
              {ACTIONS.filter((a) => a !== 'all').map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Date Range Row */}
        <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-border/50 text-xs">
          <span className="text-muted-foreground font-medium flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            {locale === 'am' ? 'የቀን ክልል:' : 'Date Range:'}
          </span>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-border bg-background px-2.5 py-1 text-xs text-foreground focus:border-primary focus:outline-none"
            />
            <span className="text-muted-foreground">-</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-border bg-background px-2.5 py-1 text-xs text-foreground focus:border-primary focus:outline-none"
            />
            {(fromDate || toDate) && (
              <button
                onClick={() => {
                  setFromDate('');
                  setToDate('');
                  setPage(1);
                }}
                className="text-xs text-primary font-medium hover:underline ml-1"
              >
                {locale === 'am' ? 'አጽዳ' : 'Clear'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Audit Log DataTable */}
      <DataTable
        columns={columns}
        data={logsData?.data || []}
        isLoading={isLoading}
        page={page}
        total={logsData?.total || 0}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        emptyMessage={
          locale === 'am' ? 'ምንም የክትትል መዝገብ አልተገኘም' : 'No audit records match your filters'
        }
      />

      {/* Details Diff Drawer */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <button
              onClick={() => setSelectedLog(null)}
              className="absolute right-4 top-4 rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mb-4">
              <h2 className="text-lg font-bold text-foreground">
                {locale === 'am' ? 'የለውጥ ዝርዝር መረጃ (Audit Event Details)' : 'Audit Event Details'}
              </h2>
              <p className="text-xs text-muted-foreground">
                {selectedLog.action.toUpperCase()} on {selectedLog.entity} ({selectedLog.entityId})
              </p>
            </div>

            {/* Meta info chips */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4 text-xs">
              <div className="rounded-lg border border-border p-2 bg-background/50">
                <span className="text-[10px] text-muted-foreground block">Actor</span>
                <span className="font-semibold text-foreground truncate block">
                  {selectedLog.user?.email || selectedLog.user?.phone || 'System'}
                </span>
              </div>
              <div className="rounded-lg border border-border p-2 bg-background/50">
                <span className="text-[10px] text-muted-foreground block">IP Address</span>
                <span className="font-mono text-foreground block">
                  {selectedLog.ipAddress || '—'}
                </span>
              </div>
              <div className="rounded-lg border border-border p-2 bg-background/50">
                <span className="text-[10px] text-muted-foreground block">Action</span>
                <span className="font-bold uppercase text-primary block">
                  {selectedLog.action}
                </span>
              </div>
              <div className="rounded-lg border border-border p-2 bg-background/50">
                <span className="text-[10px] text-muted-foreground block">Timestamp</span>
                <span className="font-mono text-foreground block">
                  {new Date(selectedLog.createdAt).toLocaleTimeString()}
                </span>
              </div>
            </div>

            {/* Old vs New Diff comparison */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Old Value */}
              <div>
                <h3 className="text-xs font-bold text-muted-foreground mb-1">
                  {locale === 'am' ? 'የቀድሞው መረጃ (Old Value)' : 'Previous State (Old)'}
                </h3>
                <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-3 font-mono text-[11px] text-foreground max-h-60 overflow-y-auto">
                  {selectedLog.oldValue ? (
                    <pre className="whitespace-pre-wrap">
                      {JSON.stringify(selectedLog.oldValue, null, 2)}
                    </pre>
                  ) : (
                    <span className="text-muted-foreground italic">None (Newly Created)</span>
                  )}
                </div>
              </div>

              {/* New Value */}
              <div>
                <h3 className="text-xs font-bold text-muted-foreground mb-1">
                  {locale === 'am' ? 'አዲሱ የተሻሻለው መረጃ (New Value)' : 'Updated State (New)'}
                </h3>
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 font-mono text-[11px] text-foreground max-h-60 overflow-y-auto">
                  {selectedLog.newValue ? (
                    <pre className="whitespace-pre-wrap">
                      {JSON.stringify(selectedLog.newValue, null, 2)}
                    </pre>
                  ) : (
                    <span className="text-muted-foreground italic">None (Deleted)</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-5">
              <button
                onClick={() => setSelectedLog(null)}
                className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted"
              >
                {locale === 'am' ? 'ዝጋ' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
