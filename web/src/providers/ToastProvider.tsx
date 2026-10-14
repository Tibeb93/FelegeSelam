'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastContextType {
  toast: {
    success: (message: string, title?: string, duration?: number) => void;
    error: (message: string, title?: string, duration?: number) => void;
    warning: (message: string, title?: string, duration?: number) => void;
    info: (message: string, title?: string, duration?: number) => void;
    show: (item: Omit<ToastItem, 'id'>) => void;
  };
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    ({ type, title, message, duration = 4000 }: Omit<ToastItem, 'id'>) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast: ToastItem = { id, type, title, message, duration };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast],
  );

  const toast = {
    success: (message: string, title?: string, duration?: number) =>
      addToast({ type: 'success', title, message, duration }),
    error: (message: string, title?: string, duration?: number) =>
      addToast({ type: 'error', title, message, duration }),
    warning: (message: string, title?: string, duration?: number) =>
      addToast({ type: 'warning', title, message, duration }),
    info: (message: string, title?: string, duration?: number) =>
      addToast({ type: 'info', title, message, duration }),
    show: addToast,
  };

  return (
    <ToastContext.Provider value={{ toast, removeToast }}>
      {children}

      {/* Toast Notification Container */}
      <div
        aria-live="polite"
        className="fixed bottom-4 right-4 z-50 flex max-w-md flex-col gap-2 pointer-events-none"
      >
        {toasts.map((t) => {
          const isSuccess = t.type === 'success';
          const isError = t.type === 'error';
          const isWarning = t.type === 'warning';
          const isInfo = t.type === 'info';

          return (
            <div
              key={t.id}
              role="alert"
              className={`pointer-events-auto flex w-full items-start gap-3 rounded-lg border p-4 shadow-lg transition-all animate-in slide-in-from-bottom-5 duration-200 ${
                isSuccess
                  ? 'bg-card text-foreground border-emerald-600/30 dark:border-emerald-500/40'
                  : isError
                    ? 'bg-card text-foreground border-rose-600/30 dark:border-rose-500/40'
                    : isWarning
                      ? 'bg-card text-foreground border-amber-600/30 dark:border-amber-500/40'
                      : 'bg-card text-foreground border-blue-600/30 dark:border-blue-500/40'
              }`}
            >
              <div className="shrink-0 mt-0.5">
                {isSuccess && <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
                {isError && <AlertCircle className="h-5 w-5 text-rose-600 dark:text-rose-400" />}
                {isWarning && <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />}
                {isInfo && <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
              </div>

              <div className="flex-1 text-sm">
                {t.title && <div className="font-semibold text-foreground">{t.title}</div>}
                <div className="text-muted-foreground break-words">{t.message}</div>
              </div>

              <button
                type="button"
                onClick={() => removeToast(t.id)}
                className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                aria-label="Close notification"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context.toast;
}
