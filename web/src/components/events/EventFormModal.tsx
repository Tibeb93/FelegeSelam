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
import { Calendar, MapPin, Users, AlertCircle } from 'lucide-react';
import {
  TextField,
  TextArea,
  PrimaryButton,
  SecondaryButton,
} from '@/components/forms';

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
      <DialogContent className="max-w-2xl bg-card p-6 md:p-8 rounded-2xl border border-border shadow-xl">
        <DialogHeader className="border-b border-border pb-4">
          <DialogTitle className="flex items-center gap-2.5 text-xl font-bold text-foreground">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 text-primary-700 dark:bg-primary-950 dark:text-primary-300">
              <Calendar className="h-5 w-5" />
            </div>
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
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-destructive/10 p-3.5 text-xs font-medium text-destructive animate-fadeIn">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="mt-4 space-y-4">
          <TextField
            name="eventTitle"
            label={locale === 'am' ? 'የመርሐ-ግብሩ ርዕስ' : 'Event Title'}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={
              locale === 'am'
                ? 'ምሳሌ፦ የበዓለ ጥምቀት ልዩ መንፈሳዊ ጉባኤ'
                : 'Event title...'
            }
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextField
              name="location"
              label={locale === 'am' ? 'ቦታ / አዳራሽ' : 'Location / Venue'}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder={
                locale === 'am'
                  ? 'ምሳሌ፦ ዋናው የሰ/ት/ቤት አዳራሽ'
                  : 'Main Auditorium'
              }
              startIcon={<MapPin className="h-4 w-4" />}
            />

            <TextField
              name="capacity"
              type="number"
              min="1"
              label={locale === 'am' ? 'የተሳታፊዎች ጣሪያ (Capacity)' : 'Max Capacity'}
              value={capacity}
              onChange={(e) =>
                setCapacity(e.target.value ? Number(e.target.value) : '')
              }
              placeholder={locale === 'am' ? 'ገደብ የሌለው ከሆነ ባዶ ይተውት' : 'Unlimited'}
              startIcon={<Users className="h-4 w-4" />}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5 select-none">
                {locale === 'am' ? 'የሚጀመርበት ቀንና ሰዓት' : 'Start Date & Time'}{' '}
                <span className="text-destructive">*</span>
              </label>
              <input
                type="datetime-local"
                value={startAt}
                onChange={(e) => setStartAt(e.target.value)}
                className="h-12 w-full rounded-xl border border-input bg-background px-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5 select-none">
                {locale === 'am' ? 'የሚጠናቀቅበት ቀንና ሰዓት' : 'End Date & Time'}
              </label>
              <input
                type="datetime-local"
                value={endAt}
                onChange={(e) => setEndAt(e.target.value)}
                className="h-12 w-full rounded-xl border border-input bg-background px-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <TextArea
            name="description"
            label={locale === 'am' ? 'ዝርዝር መግለጫ' : 'Description'}
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={
              locale === 'am'
                ? 'የመርሐ-ግብሩ ዝርዝር ዓላማ፣ ተጋባዥ መምህራንና መመሪያዎች...'
                : 'Event description, agenda, guest speakers...'
            }
          />
        </div>

        <DialogFooter className="mt-6 flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t border-border">
          <SecondaryButton
            type="button"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto h-11"
          >
            {locale === 'am' ? 'ሰርዝ' : 'Cancel'}
          </SecondaryButton>
          <PrimaryButton
            type="button"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            loading={saveMutation.isPending}
            className="w-full sm:w-auto h-11"
          >
            {eventToEdit
              ? locale === 'am'
                ? 'ለውጦችን አድስ'
                : 'Save Changes'
              : locale === 'am'
              ? 'መዝግብ'
              : 'Create Event'}
          </PrimaryButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
