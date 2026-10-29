import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Subject, Observable, interval, merge, map, filter } from 'rxjs';

export interface LiveEvent<T = any> {
  type: string;
  target?: {
    userId?: string;
    roles?: string[];
    isPublic?: boolean;
  };
  data?: T;
  timestamp?: string;
}

export interface SseMessageEvent {
  data: string | object;
  id?: string;
  type?: string;
  retry?: number;
}

@Injectable()
export class EventBusService implements OnModuleDestroy {
  private readonly logger = new Logger(EventBusService.name);
  private readonly eventSubject = new Subject<LiveEvent>();

  // Heartbeat every 25 seconds to keep HTTP connections and reverse proxies open
  private readonly heartbeat$ = interval(25000).pipe(
    map(() => ({
      type: 'heartbeat',
      target: { isPublic: true },
      data: { ping: 'pong' },
      timestamp: new Date().toISOString(),
    } as LiveEvent)),
  );

  onModuleDestroy() {
    this.eventSubject.complete();
  }

  /**
   * Broadcast a live real-time event across the system
   */
  emit<T = any>(event: Omit<LiveEvent<T>, 'timestamp'>): void {
    const fullEvent: LiveEvent<T> = {
      ...event,
      timestamp: new Date().toISOString(),
    };
    this.logger.debug(`Broadcasting SSE event: [${fullEvent.type}]`);
    this.eventSubject.next(fullEvent);
  }

  /**
   * Stream events filtered for a specific connected user session or public visitor
   */
  streamForUser(userId?: string, role?: string): Observable<SseMessageEvent> {
    const combined$ = merge(this.eventSubject.asObservable(), this.heartbeat$);

    return combined$.pipe(
      filter((event) => {
        // Heartbeat is always delivered
        if (event.type === 'heartbeat') return true;

        // If event is explicitly marked public, deliver to everyone
        if (event.target?.isPublic) return true;

        // If target specifies userId, check match
        if (event.target?.userId) {
          return event.target.userId === userId;
        }

        // If target specifies roles, check user's role
        if (event.target?.roles && event.target.roles.length > 0) {
          if (!role) return false;
          return event.target.roles.includes(role);
        }

        // Default: if no target restrictions specified, deliver as public
        return true;
      }),
      map((event) => ({
        data: {
          type: event.type,
          data: event.data,
          timestamp: event.timestamp,
        },
        type: 'message',
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        retry: 10000,
      })),
    );
  }
}
