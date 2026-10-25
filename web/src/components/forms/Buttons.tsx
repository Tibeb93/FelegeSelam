'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  loadingText?: string;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  variant?: 'primary' | 'accent' | 'destructive';
}

export const PrimaryButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className,
      disabled,
      loading = false,
      loadingText,
      startIcon,
      endIcon,
      variant = 'primary',
      type = 'submit',
      ...props
    },
    ref
  ) => {
    const variantStyles = {
      primary:
        'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm focus-visible:ring-primary-500',
      accent:
        'bg-accent text-accent-foreground hover:bg-accent/90 shadow-sm focus-visible:ring-accent',
      destructive:
        'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm focus-visible:ring-destructive',
    }[variant];

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        aria-disabled={disabled || loading}
        className={cn(
          'inline-flex h-12 min-h-[48px] items-center justify-center rounded-xl px-6 py-3 text-sm font-semibold tracking-wide transition-all duration-150 select-none',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.99]',
          variantStyles,
          className
        )}
        {...props}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin shrink-0" />
            <span>{loadingText || children}</span>
          </>
        ) : (
          <>
            {startIcon && <span className="mr-2 shrink-0">{startIcon}</span>}
            <span>{children}</span>
            {endIcon && <span className="ml-2 shrink-0">{endIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

PrimaryButton.displayName = 'PrimaryButton';

export interface SecondaryButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  loadingText?: string;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  variant?: 'outline' | 'subtle';
}

export const SecondaryButton = React.forwardRef<
  HTMLButtonElement,
  SecondaryButtonProps
>(
  (
    {
      children,
      className,
      disabled,
      loading = false,
      loadingText,
      startIcon,
      endIcon,
      variant = 'outline',
      type = 'button',
      ...props
    },
    ref
  ) => {
    const variantStyles = {
      outline:
        'border-2 border-primary text-primary hover:bg-primary/10 focus-visible:ring-primary-500',
      subtle:
        'border border-border bg-background text-foreground hover:bg-muted focus-visible:ring-muted-foreground',
    }[variant];

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        aria-disabled={disabled || loading}
        className={cn(
          'inline-flex h-12 min-h-[48px] items-center justify-center rounded-xl px-6 py-3 text-sm font-semibold tracking-wide transition-all duration-150 select-none',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.99]',
          variantStyles,
          className
        )}
        {...props}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin shrink-0" />
            <span>{loadingText || children}</span>
          </>
        ) : (
          <>
            {startIcon && <span className="mr-2 shrink-0">{startIcon}</span>}
            <span>{children}</span>
            {endIcon && <span className="ml-2 shrink-0">{endIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

SecondaryButton.displayName = 'SecondaryButton';
