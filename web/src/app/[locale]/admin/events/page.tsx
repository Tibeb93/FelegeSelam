'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { EventItem, PaginatedResponse } from '@/types/api';
import { DataTable, ColumnDef } from '@/components/ui/DataTable';
import { EventFormModal } from '@/components/events/EventFormModal';
import { EventRsvpsModal } from '@/components/events/EventRsvpsModal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import {
  Calendar,
  Plus,
  Search,
  MapPin,
  Users,
  CheckCircle2,
  Clock,
  Edit2,
  Trash2,
} from 'lucide-react';

export default function EventsAdminPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [upcomingOnly, setUpcomingOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  // Dialog states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
  const [rsvpsModalEvent, setRsvpsModalEvent] = useState<EventItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<EventItem | null>(null);

  // Fetch events
  const { data, isLoading } = useQuery<PaginatedResponse<EventItem>>({
    queryKey: ['events', page, pageSize, upcomingOnly, searchTerm],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(pageSize),
      });
      if (upcomingOnly) params.append('upcomingOnly', 'true');
      if (searchTerm.trim()) params.append('search', searchTerm.trim());

      const res = await apiClient.get<any>(`/events?${params.toString()}`);
      return res;
    },
  });

  const events = data?.items || data?.data || [];
  const total = data?.total || 0;

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiClient.delete(`/events/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      setDeleteTarget(null);
    },
  });

  const columns: ColumnDef<EventItem>[] = [
    {
      header: locale === 'am' ? 'የመርሐ-ግብር ርዕስ' : 'Event Title',
      accessorKey: 'title',
      cell: (event) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Calendar className="h-4 w-4" />
          </div>
          <div>
            <p className="font-semibold text-foreground text-xs md:text-sm">
              {event.title}
            </p>
            {event.location && (
              <p className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                <MapPin className="h-3 w-3 text-secondary" />
                <span>{event.location}</span>
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      header: locale === 'am' ? 'ቀንና ሰዓት' : 'Date & Time',
      accessorKey: 'startAt',
      cell: (event) => {
        const start = new Date(event.startAt);
        const end = event.endAt ? new Date(event.endAt) : null;

        return (
          <div className="text-xs">
            <p className="font-semibold text-foreground">{start.toLocaleDateString()}</p>
            <p className="text-[11px] text-muted-foreground">
              {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              {end ? ` – ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}
            </p>
          </div>
        );
      },
    },
    {
      header: locale === 'am' ? 'የተሳታፊዎች ተሳትፎ (RSVP)' : 'RSVPs / Capacity',
      accessorKey: 'capacity',
      cell: (event) => {
        const going = event.rsvpSummary?.goingCount ?? 0;
        const capacity = event.capacity;

        return (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                <CheckCircle2 className="h-3 w-3" />
                <span>{going} {locale === 'am' ? 'እገኛለሁ' : 'Going'}</span>
              </span>
              <span className="text-xs text-muted-foreground">
                / {capacity ? `${capacity} ${locale === 'am' ? 'ቦታ' : 'spots'}` : (locale === 'am' ? 'ያልተገደበ' : 'Unlimited')}
              </span>
            </div>
            {capacity && capacity > 0 && (
              <div className="h-1.5 w-32 overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full ${
                    going >= capacity
                      ? 'bg-rose-500'
                      : going / capacity > 0.8
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, Math.round((going / capacity) * 100))}%` }}
                />
              </div>
            )}
          </div>
        );
      },
    },
    {
      header: locale === 'am' ? 'ድርጊት' : 'Actions',
      accessorKey: 'id',
      cell: (event) => (
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setRsvpsModalEvent(event)}
            className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
          >
            <Users className="h-3.5 w-3.5 text-secondary" />
            <span>{locale === 'am' ? 'ተሳታፊዎች' : 'Attendees'}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setEditingEvent(event);
              setIsFormOpen(true);
            }}
            className="rounded p-1.5 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
            title={locale === 'am' ? 'አርትዕ' : 'Edit'}
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setDeleteTarget(event)}
            className="rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
            title={locale === 'am' ? 'ሰርዝ' : 'Delete'}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-2">
            <Calendar className="h-3.5 w-3.5" />
            <span>{locale === 'am' ? 'የሰ/ት/ቤት መርሐ-ግብራት' : 'Sunday School Events'}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            {locale === 'am' ? 'መርሐ-ግብሮችና በዓላት' : 'Church & School Events'}
          </h1>
          <p className="mt-1 text-xs md:text-sm text-muted-foreground">
            {locale === 'am'
              ? 'መንፈሳዊ ጉባኤያት፣ ጉዞዎች፣ ዓመታዊ በዓላትና የአባላት ተሳትፎ (RSVP) ክትትል'
              : 'Create and coordinate church events, track capacity, and review attendee RSVPs.'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingEvent(null);
            setIsFormOpen(true);
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs md:text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>{locale === 'am' ? 'አዲስ መርሐ-ግብር' : 'New Event'}</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            placeholder={
              locale === 'am'
                ? 'በመርሐ-ግብር ርዕስ፣ ቦታ ወይም መግለጫ ፈልግ...'
                : 'Search events by title or location...'
            }
            className="w-full rounded-lg border border-input bg-background pl-9 pr-4 py-2 text-xs md:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs font-semibold text-foreground cursor-pointer select-none">
            <input
              type="checkbox"
              checked={upcomingOnly}
              onChange={(e) => {
                setUpcomingOnly(e.target.checked);
                setPage(1);
              }}
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary/30"
            />
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-secondary" />
              <span>{locale === 'am' ? 'የሚመጡ ብቻ (Upcoming)' : 'Upcoming Only'}</span>
            </span>
          </label>
        </div>
      </div>

      {/* Events Data Table */}
      <DataTable
        columns={columns}
        data={events}
        total={total}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={(newSize) => {
          setPageSize(newSize);
          setPage(1);
        }}
        isLoading={isLoading}
      />

      {/* Create / Edit Modal */}
      <EventFormModal
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        eventToEdit={editingEvent}
        locale={locale}
      />

      {/* Attendees RSVP Modal */}
      <EventRsvpsModal
        open={rsvpsModalEvent !== null}
        onOpenChange={(open) => !open && setRsvpsModalEvent(null)}
        event={rsvpsModalEvent}
        locale={locale}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={locale === 'am' ? 'መርሐ-ግብሩን መሰረዝ ይፈልጋሉ?' : 'Delete Event?'}
        description={
          locale === 'am'
            ? `«${deleteTarget?.title}» የሚለውን መርሐ-ግብርና ሁሉንም የተመዘገቡ ተሳታፊዎች ለማስወገድ እርግጠኛ ነዎት?`
            : `Are you sure you want to delete "${deleteTarget?.title}"?`
        }
        confirmLabel={locale === 'am' ? 'ሰርዝ' : 'Delete'}
        cancelLabel={locale === 'am' ? 'ይቅር' : 'Cancel'}
        onConfirm={async () => {
          if (deleteTarget) {
            await deleteMutation.mutateAsync(deleteTarget.id);
          }
        }}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
