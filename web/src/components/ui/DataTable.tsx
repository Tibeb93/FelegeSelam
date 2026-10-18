'use client';

import React, { useState } from 'react';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import { TableSkeleton } from './SkeletonLoaders';
import { EmptyState } from './EmptyState';

export interface ColumnDef<T> {
  key?: string;
  accessorKey?: string;
  header?: string;
  title?: string;
  sortable?: boolean;
  render?: (row: T, index: number) => React.ReactNode;
  cell?: (row: T, index: number) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

export type Column<T> = ColumnDef<T>;

interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  total?: number;
  page?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
  onSortChange?: (column: string, direction: 'asc' | 'desc') => void;
  searchValue?: string;
  onSearchChange?: (search: string) => void;
  searchPlaceholder?: string;
  isLoading?: boolean;
  filtersSlot?: React.ReactNode;
  exportSlot?: React.ReactNode;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  locale?: 'am' | 'en';
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns: rawColumns,
  total = data.length,
  page = 1,
  pageSize = 10,
  onPageChange,
  onPageSizeChange,
  sortColumn,
  sortDirection = 'asc',
  onSortChange,
  searchValue = '',
  onSearchChange,
  searchPlaceholder = 'ፈልግ... (Search...)',
  isLoading = false,
  filtersSlot,
  exportSlot,
  emptyMessage,
  onRowClick,
  locale = 'am',
}: DataTableProps<T>) {
  const columns = React.useMemo(
    () =>
      rawColumns.map((col, idx) => ({
        ...col,
        key: col.key || col.accessorKey || `col_${idx}`,
        render: col.render || col.cell,
      })),
    [rawColumns],
  );

  // Column visibility state
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(
    () => {
      const initial: Record<string, boolean> = {};
      columns.forEach((c) => {
        initial[c.key] = true;
      });
      return initial;
    },
  );
  const [showColumnMenu, setShowColumnMenu] = useState(false);

  const toggleColumn = (key: string) => {
    setVisibleColumns((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSort = (columnKey: string, sortable?: boolean) => {
    if (!sortable || !onSortChange) return;

    if (sortColumn === columnKey) {
      onSortChange(columnKey, sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      onSortChange(columnKey, 'asc');
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const activeColumns = columns.filter((c) => visibleColumns[c.key]);

  return (
    <div className="w-full space-y-4">
      {/* Top Controls: Search, Filters, Column Toggle, Export */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        {/* Search & Custom Filters */}
        <div className="flex flex-1 flex-wrap items-center gap-2.5">
          {onSearchChange && (
            <div className="relative min-w-[240px] flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full rounded-lg border border-input bg-card py-2 pl-9 pr-8 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-sm transition-colors"
              />
              {searchValue && (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}

          {filtersSlot}
        </div>

        {/* Right Controls: Column Toggle and Export Slot */}
        <div className="flex items-center gap-2.5">
          {/* Column Visibility Toggle */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowColumnMenu(!showColumnMenu)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs md:text-sm font-medium text-foreground hover:bg-muted/40 transition-colors shadow-sm"
              title="ዓምዶችን አሳይ/ሰውር"
            >
              <SlidersHorizontal className="h-4 w-4 text-primary" />
              <span>{locale === 'am' ? 'ዓምዶች' : 'Columns'}</span>
            </button>

            {showColumnMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowColumnMenu(false)}
                />
                <div className="absolute right-0 z-50 mt-2 w-48 rounded-xl border border-border bg-card p-3 shadow-xl animate-in zoom-in-95">
                  <p className="mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {locale === 'am' ? 'የሚታዩ ዓምዶች' : 'Visible Columns'}
                  </p>
                  <div className="space-y-1.5 max-h-56 overflow-y-auto">
                    {columns.map((col) => (
                      <label
                        key={col.key}
                        className="flex items-center gap-2 text-xs text-foreground cursor-pointer select-none hover:bg-muted/40 p-1 rounded"
                      >
                        <input
                          type="checkbox"
                          checked={visibleColumns[col.key]}
                          onChange={() => toggleColumn(col.key)}
                          className="h-3.5 w-3.5 rounded border-input text-primary focus:ring-primary"
                        />
                        <span className="truncate">{col.header || col.title || ''}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {exportSlot}
        </div>
      </div>

      {/* Main Table Container */}
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/40 text-xs font-semibold uppercase text-muted-foreground tracking-wider">
              <tr>
                {activeColumns.map((col) => {
                  const isSorted = sortColumn === col.key;
                  return (
                    <th
                      key={col.key}
                      onClick={() => handleSort(col.key, col.sortable)}
                      className={`px-4 py-3.5 ${
                        col.sortable ? 'cursor-pointer select-none hover:bg-muted/80' : ''
                      } ${col.className || ''}`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>{col.header || col.title || ''}</span>
                        {col.sortable && (
                          <span className="text-muted-foreground/80">
                            {isSorted ? (
                              sortDirection === 'asc' ? (
                                <ArrowUp className="h-3.5 w-3.5 text-primary" />
                              ) : (
                                <ArrowDown className="h-3.5 w-3.5 text-primary" />
                              )
                            ) : (
                              <ArrowUpDown className="h-3 w-3 opacity-40 hover:opacity-100" />
                            )}
                          </span>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody className="divide-y divide-border/60">
              {isLoading ? (
                <tr>
                  <td colSpan={activeColumns.length} className="p-6">
                    <TableSkeleton rows={pageSize > 5 ? 5 : pageSize} cols={activeColumns.length} />
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={activeColumns.length} className="p-8">
                    <EmptyState
                      title={emptyMessage || (locale === 'am' ? 'ምንም መረጃ አልተገኘም' : 'No records found')}
                      description={
                        searchValue
                          ? locale === 'am'
                            ? `ከፍለጋዎ "${searchValue}" ጋር የሚዛመድ መረጃ የለም`
                            : `No results matching "${searchValue}"`
                          : locale === 'am'
                            ? 'በአሁኑ ጊዜ የተመዘገበ ዝርዝር የለም'
                            : 'There are no records in this list yet'
                      }
                    />
                  </td>
                </tr>
              ) : (
                data.map((row, index) => (
                  <tr
                    key={row.id || index}
                    onClick={() => onRowClick && onRowClick(row)}
                    className={`transition-colors hover:bg-muted/30 ${
                      onRowClick ? 'cursor-pointer' : ''
                    }`}
                  >
                    {activeColumns.map((col) => (
                      <td
                        key={col.key}
                        className={`px-4 py-3.5 text-foreground ${col.className || ''}`}
                      >
                        {col.render
                          ? col.render(row, index)
                          : row[col.key] !== undefined && row[col.key] !== null
                            ? String(row[col.key])
                            : '-'}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Bottom Pagination Controls */}
        <div className="flex flex-col items-center justify-between gap-3 border-t border-border px-4 py-3 sm:flex-row text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <span>
              {locale === 'am' ? 'የሚታየው' : 'Showing'}{' '}
              <strong className="font-semibold text-foreground">
                {total === 0 ? 0 : (page - 1) * pageSize + 1}
              </strong>{' '}
              {locale === 'am' ? 'እስከ' : 'to'}{' '}
              <strong className="font-semibold text-foreground">
                {Math.min(page * pageSize, total)}
              </strong>{' '}
              {locale === 'am' ? 'ከ' : 'of'}{' '}
              <strong className="font-semibold text-foreground">{total}</strong>{' '}
              {locale === 'am' ? 'ውጤቶች' : 'records'}
            </span>

            {onPageSizeChange && (
              <div className="flex items-center gap-1.5 ml-2">
                <span>{locale === 'am' ? 'በአንድ ገጽ:' : 'Per page:'}</span>
                <select
                  value={pageSize}
                  onChange={(e) => onPageSizeChange(Number(e.target.value))}
                  className="rounded border border-input bg-card px-2 py-1 text-xs text-foreground focus:ring-1 focus:ring-primary"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>
            )}
          </div>

          {onPageChange && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onPageChange(page - 1)}
                disabled={page <= 1 || isLoading}
                className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1.5 font-medium text-foreground hover:bg-muted disabled:opacity-40 transition-colors"
                aria-label="Previous Page"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                <span>{locale === 'am' ? 'ቀዳሚ' : 'Prev'}</span>
              </button>

              <span className="px-2 font-medium text-foreground">
                {locale === 'am' ? `ገጽ ${page} ከ ${totalPages}` : `Page ${page} of ${totalPages}`}
              </span>

              <button
                type="button"
                onClick={() => onPageChange(page + 1)}
                disabled={page >= totalPages || isLoading}
                className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1.5 font-medium text-foreground hover:bg-muted disabled:opacity-40 transition-colors"
                aria-label="Next Page"
              >
                <span>{locale === 'am' ? 'ቀጣይ' : 'Next'}</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
