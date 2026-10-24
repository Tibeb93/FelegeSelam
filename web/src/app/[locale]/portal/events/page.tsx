'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle,
  HelpCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { apiRequest } from '@/lib/api-client';
import { EventItem } from '@/types/api';

export default function PortalEventsPage() {
  const t = useTranslations('Portal');
  const tEvents = useTranslations('Events');
  const queryClient = useQueryClient();

  const [activeFilter, setActiveFilter] = useState<'upcoming' | 'past'>('upcoming');
  const [rsvpMsg, setRsvpMsg] = useState<{ id: string; text: string } | null>(null);

  // Query Events
  const { data: eventsData, isLoading } = useQuery<{ items: EventItem[] } | EventItem[]>({
    queryKey: ['events', 'list'],
    queryFn: () => apiRequest('/events', { params: { limit: 50 } }),
  });

  const allEvents: EventItem[] = Array.isArray(eventsData)
    ? eventsData
    : (eventsData as any)?.items || [];

  const now = new Date();
  const filteredEvents = allEvents.filter((ev) => {
    const evDate = new Date(ev.startAt || ev.startDate || '');
    if (activeFilter === 'upcoming') {
      return evDate >= now || evDate.toDateString() === now.toDateString();
    }
    return evDate < now;
  });

  // RSVP Mutation
  const rsvpMutation = useMutation({
    mutationFn: ({ eventId, status }: { eventId: string; status: 'going' | 'maybe' | 'not_going' }) =>
      apiRequest(`/events/${eventId}/rsvp`, {
        method: 'POST',
        body: JSON.stringify({ status }),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      setRsvpMsg({
        id: variables.eventId,
        text: `RSVP updated to ${variables.status.replace('_', ' ')}!`,
      });
      setTimeout(() => setRsvpMsg(null), 3000);
    },
    onError: (err: any) => {
      alert(err.message || 'Failed to update RSVP');
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground font-ethiopic">
            {t('events')}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Stay updated with Sunday school assemblies, feasts, spiritual trips, and RSVP to participate.
          </p>
        </div>

        {/* Filter Toggle */}
        <div className="flex items-center gap-1.5 rounded-xl border border-border bg-card p-1 shadow-xs">
          <button
            type="button"
            onClick={() => setActiveFilter('upcoming')}
            className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition-colors ${
              activeFilter === 'upcoming'
                ? 'bg-primary text-secondary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Upcoming
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('past')}
            className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition-colors ${
              activeFilter === 'past'
                ? 'bg-primary text-secondary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Past Events
          </button>
        </div>
      </div>

      {/* Events List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center text-muted-foreground">
          <Calendar className="mx-auto h-12 w-12 opacity-30 mb-2" />
          <h3 className="text-base font-bold text-foreground font-ethiopic">
            ምንም የተመዘገቡ መርሐ-ግብራት የሉም
          </h3>
          <p className="text-xs mt-1">No {activeFilter} events found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {filteredEvents.map((ev) => {
            const evDate = new Date(ev.startAt || ev.startDate || '');
            const myRsvp = (ev as any).myRsvp?.status;

            return (
              <div
                key={ev.id}
                className="flex flex-col justify-between rounded-2xl border border-border bg-card p-6 shadow-xs transition-all hover:border-primary/50 space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{evDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                    </span>
                    {myRsvp && (
                      <span className="rounded-full bg-secondary/15 px-2.5 py-0.5 text-xs font-bold text-secondary-dark uppercase tracking-wider">
                        My RSVP: {myRsvp.replace('_', ' ')}
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-foreground font-ethiopic">
                    {ev.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-3">
                    {ev.description || 'Spiritual gathering and community fellowship'}
                  </p>

                  <div className="mt-4 space-y-1.5 border-t border-border pt-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 text-primary" />
                      <span>{evDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    {ev.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 text-primary" />
                        <span>{ev.location}</span>
                      </div>
                    )}
                    {ev.capacity && (
                      <div className="flex items-center gap-2">
                        <Users className="h-3.5 w-3.5 text-primary" />
                        <span>Capacity: {ev.capacity} members</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* RSVP Response Message */}
                {rsvpMsg?.id === ev.id && (
                  <div className="rounded-xl bg-primary/10 border border-primary/20 p-2 text-center text-xs font-bold text-primary">
                    {rsvpMsg.text}
                  </div>
                )}

                {/* RSVP Buttons */}
                <div className="border-t border-border pt-4">
                  <span className="text-[11px] font-semibold text-muted-foreground block mb-2">
                    Are you attending this event?
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      disabled={rsvpMutation.isPending}
                      onClick={() => rsvpMutation.mutate({ eventId: ev.id, status: 'going' })}
                      className={`flex items-center justify-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-bold transition-all ${
                        myRsvp === 'going'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'border border-border bg-background hover:bg-emerald-500/10 text-foreground'
                      }`}
                    >
                      <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                      <span>{t('rsvpGoing')}</span>
                    </button>

                    <button
                      type="button"
                      disabled={rsvpMutation.isPending}
                      onClick={() => rsvpMutation.mutate({ eventId: ev.id, status: 'maybe' })}
                      className={`flex items-center justify-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-bold transition-all ${
                        myRsvp === 'maybe'
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'border border-border bg-background hover:bg-amber-500/10 text-foreground'
                      }`}
                    >
                      <HelpCircle className="h-3.5 w-3.5 text-amber-500" />
                      <span>{t('rsvpMaybe')}</span>
                    </button>

                    <button
                      type="button"
                      disabled={rsvpMutation.isPending}
                      onClick={() => rsvpMutation.mutate({ eventId: ev.id, status: 'not_going' })}
                      className={`flex items-center justify-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-bold transition-all ${
                        myRsvp === 'not_going'
                          ? 'bg-red-600 text-white shadow-xs'
                          : 'border border-border bg-background hover:bg-red-500/10 text-foreground'
                      }`}
                    >
                      <XCircle className="h-3.5 w-3.5 text-red-500" />
                      <span>{t('rsvpNotGoing')}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
