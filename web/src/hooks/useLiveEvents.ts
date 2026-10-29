'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getAccessToken } from '../lib/api-client';

export interface LiveEventPayload<T = any> {
  type: string;
  data: T;
  timestamp: string;
}

export type LiveEventListener = (event: LiveEventPayload) => void;

// Singleton state to guarantee only ONE EventSource connection across the entire web app
let globalEventSource: EventSource | null = null;
let connectionCount = 0;
let hiddenTimeout: NodeJS.Timeout | null = null;
const listeners = new Set<LiveEventListener>();

function notifyListeners(event: LiveEventPayload) {
  listeners.forEach((listener) => {
    try {
      listener(event);
    } catch {
      // Ignore listener error
    }
  });
}

function connectEventSource() {
  if (typeof window === 'undefined') return;
  if (globalEventSource && globalEventSource.readyState !== EventSource.CLOSED) {
    return;
  }

  const token = getAccessToken();
  const url = token
    ? `/api/v1/realtime/stream?token=${encodeURIComponent(token)}`
    : '/api/v1/realtime/stream';

  try {
    const es = new EventSource(url, { withCredentials: true });
    globalEventSource = es;

    es.onmessage = (messageEvent) => {
      try {
        const payload: LiveEventPayload = JSON.parse(messageEvent.data);
        if (payload.type === 'heartbeat') {
          return;
        }
        notifyListeners(payload);
      } catch {
        // Non-JSON frame
      }
    };

    es.onerror = () => {
      // Automatic reconnection handled by EventSource with exponential backoff retry: 10000ms
    };
  } catch {
    // EventSource construction failure fallback
  }
}

function disconnectEventSource() {
  if (globalEventSource) {
    globalEventSource.close();
    globalEventSource = null;
  }
}

/**
 * Global single-connection SSE hook for real-time updates without polling
 */
export function useLiveEvents(customListener?: LiveEventListener) {
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(false);
  const customListenerRef = useRef(customListener);
  customListenerRef.current = customListener;

  // Global event mapping to TanStack Query cache invalidation
  const handleLiveEvent = useCallback(
    (event: LiveEventPayload) => {
      if (customListenerRef.current) {
        customListenerRef.current(event);
      }

      switch (event.type) {
        case 'notification.created':
        case 'notification.read':
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
          queryClient.invalidateQueries({ queryKey: ['unread-notifications-count'] });
          break;

        case 'post.published':
        case 'post.urgent':
          queryClient.invalidateQueries({ queryKey: ['today-posts'] });
          queryClient.invalidateQueries({ queryKey: ['public-posts'] });
          queryClient.invalidateQueries({ queryKey: ['posts'] });
          break;

        case 'attendance.updated':
          queryClient.invalidateQueries({ queryKey: ['attendance'] });
          queryClient.invalidateQueries({ queryKey: ['attendance-session'] });
          queryClient.invalidateQueries({ queryKey: ['attendance-stats'] });
          queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] });
          break;

        case 'payment.submitted':
        case 'payment.reviewed':
          queryClient.invalidateQueries({ queryKey: ['membership-payments'] });
          queryClient.invalidateQueries({ queryKey: ['my-payments'] });
          queryClient.invalidateQueries({ queryKey: ['payment-stats'] });
          queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] });
          break;

        case 'member.registered':
        case 'member.approved':
          queryClient.invalidateQueries({ queryKey: ['members'] });
          queryClient.invalidateQueries({ queryKey: ['admin-members-list'] });
          queryClient.invalidateQueries({ queryKey: ['pending-members-count'] });
          queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] });
          break;

        case 'form.response.created':
          queryClient.invalidateQueries({ queryKey: ['form-responses'] });
          queryClient.invalidateQueries({ queryKey: ['forms'] });
          queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] });
          break;

        case 'dashboard.stats.changed':
          queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] });
          queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
          queryClient.invalidateQueries({ queryKey: ['admin-counts'] });
          break;

        case 'cms.published':
          queryClient.invalidateQueries({ queryKey: ['public-settings'] });
          queryClient.invalidateQueries({ queryKey: ['published-pages'] });
          queryClient.invalidateQueries({ queryKey: ['cms-page'] });
          break;

        default:
          break;
      }
    },
    [queryClient],
  );

  useEffect(() => {
    listeners.add(handleLiveEvent);
    connectionCount++;

    if (connectionCount === 1) {
      connectEventSource();
    }
    setIsConnected(Boolean(globalEventSource && globalEventSource.readyState === EventSource.OPEN));

    // Handle tab visibility (disconnect after 5 minutes hidden, reconnect on focus)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        hiddenTimeout = setTimeout(() => {
          disconnectEventSource();
          setIsConnected(false);
        }, 5 * 60 * 1000); // 5 minutes
      } else {
        if (hiddenTimeout) {
          clearTimeout(hiddenTimeout);
          hiddenTimeout = null;
        }
        connectEventSource();
        setIsConnected(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      listeners.delete(handleLiveEvent);
      connectionCount--;

      if (connectionCount === 0) {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        if (hiddenTimeout) {
          clearTimeout(hiddenTimeout);
          hiddenTimeout = null;
        }
        disconnectEventSource();
      }
    };
  }, [handleLiveEvent]);

  return { isConnected };
}
