'use client';

import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { EventItem } from '@/types/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/Dialog';
import { Calendar, MapPin, Users, AlertCircle, Loader2 } from 'lucide-react';

interface EventFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventToEdit?: EventItem | null;
  locale: string;
}

export function EventFormModal({
  open,
  onOpenChange,
  eventToEdit,
  locale,
}: EventFormModalProps) {
  const queryClient = useQueryClient();

  const formatDatetimeLocal = (isoString?: string | null) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    const offset = d.getTimezoneOffset() * 60000;
    const local = new Date(d.getTime() - offset);
    return local.toISOString().slice(0, 16);
  };

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [capacity, setCapacity] = useState<number | ''>('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (eventToEdit) {
      setTitle(eventToEdit.title || '');
      setDescription(eventToEdit.description || '');
      setLocation(eventToEdit.location || '');
      setStartAt(formatDatetimeLocal(eventToEdit.startAt));
      setEndAt(formatDatetimeLocal(eventToEdit.endAt));
      setCapacity(eventToEdit.capacity ?? '');
      setErrorMsg('');
    } else {
      setTitle('');
      setDescription('');
      setLocation('');
      setStartAt(formatDatetimeLocal(new Date().toISOString()));
      setEndAt('');
      setCapacity('');
      setErrorMsg('');
    }
  }, [eventToEdit, open]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!title.trim()) {
        throw new Error(
          locale === 'am' ? 'የመርሐ-ግብሩ ርዕስ ያስፈልጋል' : 'Event title is required',
        );
      }
      if (!startAt) {
        throw new Error(
          locale === 'am' ? 'የሚጀመርበት ቀንና ሰዓት ያስፈልጋል' : 'Start date & time is required',
        );
      }

      const payload = {
        title: title.trim(),
        description: description.trim() || undefined,
        location: location.trim() || undefined,
        startAt: new Date(startAt).toISOString(),
        endAt: endAt ? new Date(endAt).toISOString() : undefined,
        capacity: capacity ? Number(capacity) : undefined,
      };

      if (eventToEdit) {
        return apiClient.put(`/events/${eventToEdit.id}`, payload);
      } else {
        return apiClient.post('/events', payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      onOpenChange(false);
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'Operation failed');
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl bg-card p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold">
            <Calendar className="h-5 w-5 text-primary" />
            <span>
              {eventToEdit
                ? locale === 'am'
                  ? 'መርሐ-ግብር አርትዕ'
                  : 'Edit Event'
                : locale === 'am'
                ? 'አዲስ መርሐ-ግብር መዝግብ'
                : 'Add New Event'}
            </span>
          </DialogTitle>
        </DialogHeader>

        {errorMsg && (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-xs text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="mt-4 space-y-4">
          <div>
            <label className="text-xs font-semibold text-foreground">
              {locale === 'am' ? 'የመርሐ-ግብሩ ርዕስ *' : 'Event Title *'}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                locale === 'am'
                  ? 'ምሳሌ፦ የበዓለ ጥምቀት ልዩ መንፈሳዊ ጉባኤ'
                  : 'Event title...'
              }
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-xs md:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-secondary" />
                <span>{locale === 'am' ? 'ቦታ / አዳራሽ' : 'Location / Venue'}</span>
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder={
                  locale === 'am'
                    ? 'ምሳሌ፦ ዋናው የሰ/ት/ቤት አዳራሽ'
                    : 'Main Auditorium'
                }
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-primary" />
                <span>{locale === 'am' ? 'የተሳታፊዎች ጣሪያ (Capacity)' : 'Max Capacity'}</span>
              </label>
              <input
                type="number"
                min="1"
                value={capacity}
                onChange={(e) =>
                  setCapacity(e.target.value ? Number(e.target.value) : '')
                }
                placeholder={locale === 'am' ? 'ገደብ የሌለው ከሆነ ባዶ ይተውት' : 'Leave empty for unlimited'}
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-foreground">
                {locale === 'am' ? 'የሚጀመርበት ቀንና ሰዓት *' : 'Start Date & Time *'}
              </label>
              <input
                type="datetime-local"
                value={startAt}
                onChange={(e) => setStartAt(e.target.value)}
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground">
                {locale === 'am' ? 'የሚጠናቀቅበት ቀንና ሰዓት' : 'End Date & Time'}
              </label>
              <input
                type="datetime-local"
                value={endAt}
                onChange={(e) => setEndAt(e.target.value)}
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground">
              {locale === 'am' ? 'ዝርዝር መግለጫ' : 'Description'}
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={
                locale === 'am'
                  ? 'የመርሐ-ግብሩ ዝርዝር ዓላማ፣ ተጋባዥ መምህራንና መመሪያዎች...'
                  : 'Event description, agenda, guest speakers...'
              }
              className="mt-1 w-full rounded-lg border border-input bg-background p-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>

        <DialogFooter className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-lg border border-border px-4 py-2 text-xs font-medium text-foreground hover:bg-muted"
          >
            {locale === 'am' ? 'ሰርዝ' : 'Cancel'}
          </button>
          <button
            type="button"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-50"
          >
            {saveMutation.isPending && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
            <span>
              {eventToEdit
                ? locale === 'am'
                  ? 'ለውጦችን አድስ'
                  : 'Save Changes'
                : locale === 'am'
                ? 'መዝግብ'
                : 'Create Event'}
            </span>
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
