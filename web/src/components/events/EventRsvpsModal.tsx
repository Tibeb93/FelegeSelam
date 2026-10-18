'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { EventItem, EventRsvp, EventRsvpStatus, PaginatedResponse } from '@/types/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/Dialog';
import {
  Users,
  CheckCircle2,
  HelpCircle,
  XCircle,
  Download,
  Search,
  Filter,
  Loader2,
  Calendar,
  MapPin,
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface EventRsvpsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: EventItem | null;
  locale: string;
}

export function EventRsvpsModal({
  open,
  onOpenChange,
  event,
  locale,
}: EventRsvpsModalProps) {
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 50;

  const { data, isLoading } = useQuery<PaginatedResponse<EventRsvp>>({
    queryKey: ['event-attendees', event?.id, page, statusFilter, searchTerm],
    queryFn: async () => {
      if (!event) return { items: [], total: 0, page: 1, limit: pageSize, totalPages: 0 };
      const params = new URLSearchParams({
        page: String(page),
        limit: String(pageSize),
      });
      if (statusFilter) params.append('status', statusFilter);
      if (searchTerm.trim()) params.append('search', searchTerm.trim());

      const res = await apiClient.get<any>(`/events/${event.id}/attendees?${params.toString()}`);
      return res;
    },
    enabled: open && Boolean(event?.id),
  });

  const attendees = data?.items || data?.data || [];
  const total = data?.total || 0;

  // Export to Excel function using xlsx
  const handleExportExcel = () => {
    if (!event || attendees.length === 0) return;

    const exportRows = attendees.map((item, idx) => ({
      '#': idx + 1,
      [locale === 'am' ? 'የአባል ቁጥር' : 'Member ID']: item.member?.memberNo || '—',
      [locale === 'am' ? 'ሙሉ ስም' : 'Full Name']: `${item.member?.firstName || ''} ${
        item.member?.fatherName || ''
      } ${item.member?.grandfatherName || ''}`.trim(),
      [locale === 'am' ? 'ጾታ' : 'Sex']: item.member?.sex === 'male' ? 'ወንድ' : 'ሴት',
      [locale === 'am' ? 'ስልክ ቁጥር' : 'Phone']: item.member?.phone || '—',
      [locale === 'am' ? 'ክፍል / ዘርፍ' : 'Department']:
        item.member?.department?.nameAm || item.member?.department?.nameEn || '—',
      [locale === 'am' ? 'የተሳትፎ ሁኔታ' : 'RSVP Status']:
        item.status === 'going'
          ? 'እገኛለሁ (Going)'
          : item.status === 'maybe'
          ? 'ምናልባት (Maybe)'
          : 'አልገኝም (Not Going)',
      [locale === 'am' ? 'የተመዘገበበት ቀን' : 'Registered Date']: new Date(
        item.createdAt,
      ).toLocaleString(),
    }));

    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Attendees');
    const safeTitle = (event.title || 'Event').replace(/[^a-zA-Z0-9_\u1200-\u137F]/g, '_');
    XLSX.writeFile(wb, `Event_Attendees_${safeTitle}.xlsx`);
  };

  const goingCount = event?.rsvpSummary?.goingCount ?? 0;
  const maybeCount = event?.rsvpSummary?.maybeCount ?? 0;
  const notGoingCount = event?.rsvpSummary?.notGoingCount ?? 0;
  const capacity = event?.capacity;
  const percentFull =
    capacity && capacity > 0 ? Math.min(100, Math.round((goingCount / capacity) * 100)) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl bg-card p-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold">
            <Users className="h-5 w-5 text-primary" />
            <span>
              {locale === 'am' ? 'የተሳታፊዎች ዝርዝር (RSVP)' : 'Event Attendees & RSVPs'}
            </span>
          </DialogTitle>
          <div className="mt-1 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">{event?.title}</span>
            {event?.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3 text-secondary" />
                <span>{event.location}</span>
              </span>
            )}
            {event?.startAt && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3 text-primary" />
                <span>{new Date(event.startAt).toLocaleString()}</span>
              </span>
            )}
          </div>
        </DialogHeader>

        {/* Capacity & RSVP Stats Bar */}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-950/20 p-3">
            <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>{locale === 'am' ? 'እገኛለሁ' : 'Going'}</span>
            </p>
            <p className="mt-1 text-xl font-bold text-emerald-800 dark:text-emerald-300">
              {goingCount}
            </p>
          </div>

          <div className="rounded-xl border border-amber-500/20 bg-amber-50/50 dark:bg-amber-950/20 p-3">
            <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1">
              <HelpCircle className="h-3.5 w-3.5" />
              <span>{locale === 'am' ? 'ምናልባት' : 'Maybe'}</span>
            </p>
            <p className="mt-1 text-xl font-bold text-amber-800 dark:text-amber-300">
              {maybeCount}
            </p>
          </div>

          <div className="rounded-xl border border-zinc-500/20 bg-zinc-50/50 dark:bg-zinc-950/20 p-3">
            <p className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 flex items-center gap-1">
              <XCircle className="h-3.5 w-3.5" />
              <span>{locale === 'am' ? 'አልገኝም' : 'Not Going'}</span>
            </p>
            <p className="mt-1 text-xl font-bold text-zinc-700 dark:text-zinc-300">
              {notGoingCount}
            </p>
          </div>

          <div className="rounded-xl border border-primary/20 bg-primary/5 p-3">
            <p className="text-[11px] font-semibold text-primary flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              <span>{locale === 'am' ? 'የቦታ አጠቃቀም' : 'Capacity'}</span>
            </p>
            <p className="mt-1 text-xl font-bold text-foreground">
              {capacity ? `${goingCount}/${capacity}` : `${goingCount} (ያልተገደበ)`}
            </p>
            {percentFull !== null && (
              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full ${
                    percentFull >= 100
                      ? 'bg-rose-500'
                      : percentFull > 80
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${percentFull}%` }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Filter, Search & Export Bar */}
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={
                locale === 'am' ? 'በስም ወይም በአባል ቁጥር ፈልግ...' : 'Search attendees...'
              }
              className="w-full rounded-lg border border-input bg-background pl-8 pr-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-input bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="">{locale === 'am' ? 'ሁሉም ሁኔታዎች' : 'All Statuses'}</option>
              <option value="going">{locale === 'am' ? 'እገኛለሁ (Going)' : 'Going'}</option>
              <option value="maybe">{locale === 'am' ? 'ምናልባት (Maybe)' : 'Maybe'}</option>
              <option value="not_going">{locale === 'am' ? 'አልገኝም (Not Going)' : 'Not Going'}</option>
            </select>

            <button
              type="button"
              onClick={handleExportExcel}
              disabled={attendees.length === 0}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground shadow-xs hover:bg-muted disabled:opacity-50"
            >
              <Download className="h-3.5 w-3.5 text-secondary" />
              <span>{locale === 'am' ? 'Excel አውርድ' : 'Export Excel'}</span>
            </button>
          </div>
        </div>

        {/* Attendees List */}
        <div className="mt-3">
          {isLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : attendees.length === 0 ? (
            <p className="text-center py-8 text-xs text-muted-foreground">
              {locale === 'am'
                ? 'ምንም የተመዘገቡ ተሳታፊዎች አልተገኙም'
                : 'No attendees recorded for this event yet'}
            </p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-border bg-muted/40 font-semibold text-muted-foreground">
                  <tr>
                    <th className="p-2.5">#</th>
                    <th className="p-2.5">{locale === 'am' ? 'ሙሉ ስም' : 'Name'}</th>
                    <th className="p-2.5">{locale === 'am' ? 'የአባል ቁጥር' : 'Member ID'}</th>
                    <th className="p-2.5">{locale === 'am' ? 'ክፍል' : 'Department'}</th>
                    <th className="p-2.5">{locale === 'am' ? 'ስልክ' : 'Phone'}</th>
                    <th className="p-2.5">{locale === 'am' ? 'ሁኔታ' : 'Status'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {attendees.map((item, idx) => {
                    const fullName = `${item.member?.firstName || ''} ${
                      item.member?.fatherName || ''
                    }`.trim();

                    return (
                      <tr key={idx} className="hover:bg-muted/20 transition-colors">
                        <td className="p-2.5 text-muted-foreground font-mono">{idx + 1}</td>
                        <td className="p-2.5 font-semibold text-foreground">
                          {fullName || (locale === 'am' ? 'ያልታወቀ አባል' : 'Unknown Member')}
                        </td>
                        <td className="p-2.5 font-mono text-[11px] text-muted-foreground">
                          {item.member?.memberNo || '—'}
                        </td>
                        <td className="p-2.5 text-muted-foreground">
                          {item.member?.department?.nameAm ||
                            item.member?.department?.nameEn ||
                            '—'}
                        </td>
                        <td className="p-2.5 text-muted-foreground">
                          {item.member?.phone || '—'}
                        </td>
                        <td className="p-2.5">
                          {item.status === 'going' ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                              <CheckCircle2 className="h-3 w-3" />
                              <span>{locale === 'am' ? 'እገኛለሁ' : 'Going'}</span>
                            </span>
                          ) : item.status === 'maybe' ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                              <HelpCircle className="h-3 w-3" />
                              <span>{locale === 'am' ? 'ምናልባት' : 'Maybe'}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-bold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                              <XCircle className="h-3 w-3" />
                              <span>{locale === 'am' ? 'አልገኝም' : 'Not Going'}</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <DialogFooter className="mt-4">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-lg border border-border px-4 py-2 text-xs font-medium text-foreground hover:bg-muted"
          >
            {locale === 'am' ? 'ዝጋ' : 'Close'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
