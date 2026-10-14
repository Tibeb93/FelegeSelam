'use client';

import React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { AlertTriangle, Info, Loader2 } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'destructive' | 'primary';
  isLoading?: boolean;
  onConfirm: () => void | Promise<void>;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'አረጋግጥ (Confirm)',
  cancelLabel = 'ይቅር (Cancel)',
  variant = 'primary',
  isLoading = false,
  onConfirm,
}: ConfirmDialogProps) {
  const isDestructive = variant === 'destructive';

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in" />
        <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-card p-6 shadow-2xl transition-all animate-in zoom-in-95 duration-200">
          <div className="flex items-start gap-4">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                isDestructive
                  ? 'bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400'
                  : 'bg-primary/10 text-primary'
              }`}
            >
              {isDestructive ? (
                <AlertTriangle className="h-5 w-5" />
              ) : (
                <Info className="h-5 w-5" />
              )}
            </div>

            <div className="flex-1">
              <DialogPrimitive.Title className="text-lg font-bold text-foreground">
                {title}
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="mt-2 text-sm text-muted-foreground leading-relaxed">
                {description}
              </DialogPrimitive.Description>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3">
            <DialogPrimitive.Close asChild>
              <button
                type="button"
                disabled={isLoading}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
              >
                {cancelLabel}
              </button>
            </DialogPrimitive.Close>

            <button
              type="button"
              disabled={isLoading}
              onClick={async () => {
                await onConfirm();
              }}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors disabled:opacity-50 ${
                isDestructive
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : 'bg-primary hover:bg-primary/90'
              }`}
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {confirmLabel}
            </button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
