'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Bell,
  CheckCheck,
  Check,
  Clock,
  AlertCircle,
  Loader2,
  Inbox,
  Filter,
} from 'lucide-react';
import { apiRequest } from '@/lib/api-client';

export default function PortalNotificationsPage() {
  const t = useTranslations('Portal');
  const queryClient = useQueryClient();

  const [filterUnreadOnly, setFilterUnreadOnly] = useState(false);

  // Query Notifications
  const { data: notifData, isLoading } = useQuery<{ items: any[]; unreadCount?: number } | any[]>({
    queryKey: ['notifications', 'my'],
    queryFn: () => apiRequest('/notifications', { params: { limit: 50 } }),
  });

  const notifications: any[] = Array.isArray(notifData)
    ? notifData
    : (notifData as any)?.items || [];

  const unreadCount =
    (notifData as any)?.unreadCount ??
    notifications.filter((n) => !n.isRead && !n.readAt).length;

  const filteredNotifications = filterUnreadOnly
    ? notifications.filter((n) => !n.isRead && !n.readAt)
    : notifications;

  // Mark single as read mutation
  const markReadMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest(`/notifications/${id}/read`, {
        method: 'PATCH',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Mark all as read mutation
  const markAllMutation = useMutation({
    mutationFn: () =>
      apiRequest('/notifications/read-all', {
        method: 'PATCH',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-foreground font-ethiopic">
              {t('notifications')}
            </h1>
            {unreadCount > 0 && (
              <span className="rounded-full bg-destructive/15 px-2.5 py-0.5 text-xs font-bold text-destructive">
                {unreadCount} {t('unreadCount')}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Official announcements, schedule changes, assignment updates, and personal notices.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Unread toggle */}
          <button
            type="button"
            onClick={() => setFilterUnreadOnly(!filterUnreadOnly)}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors ${
              filterUnreadOnly
                ? 'border-primary bg-primary text-secondary'
                : 'border-border bg-card text-foreground hover:bg-muted'
            }`}
          >
            <Filter className="h-3.5 w-3.5" />
            <span>Unread Only</span>
          </button>

          {/* Mark all as read */}
          {unreadCount > 0 && (
            <button
              type="button"
              disabled={markAllMutation.isPending}
              onClick={() => markAllMutation.mutate()}
              className="flex items-center gap-1.5 rounded-xl bg-primary/10 border border-primary/20 px-3.5 py-1.5 text-xs font-bold text-primary hover:bg-primary hover:text-secondary transition-colors"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              <span>{t('markAllRead')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center text-muted-foreground">
          <Inbox className="mx-auto h-12 w-12 opacity-30 mb-2" />
          <h3 className="text-base font-bold text-foreground font-ethiopic">
            {t('noNotifications')}
          </h3>
          <p className="text-xs mt-1">You are all caught up! There are no notifications to show.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notif) => {
            const isRead = notif.isRead || notif.readAt;
            return (
              <div
                key={notif.id}
                className={`flex items-start justify-between gap-4 rounded-2xl border p-4 transition-all shadow-xs ${
                  isRead
                    ? 'border-border bg-card opacity-85'
                    : 'border-primary/40 bg-primary/5 ring-1 ring-primary/20'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                      isRead
                        ? 'bg-muted text-muted-foreground'
                        : 'bg-primary text-secondary shadow-xs'
                    }`}
                  >
                    <Bell className="h-4 w-4" />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-foreground font-ethiopic">
                        {notif.title}
                      </h4>
                      {!isRead && (
                        <span className="h-2 w-2 rounded-full bg-primary" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground font-ethiopic">
                      {notif.body || notif.content}
                    </p>
                    <div className="flex items-center gap-1.5 pt-1 text-[11px] text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{new Date(notif.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {!isRead && (
                  <button
                    type="button"
                    onClick={() => markReadMutation.mutate(notif.id)}
                    className="shrink-0 rounded-lg border border-border p-1.5 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                    title="Mark as read"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
