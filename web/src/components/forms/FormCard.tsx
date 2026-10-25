'use client';

import React from 'react';
import { cn } from '../../lib/utils';

export interface FormCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  headerAction?: React.ReactNode;
}

export const FormCard = React.forwardRef<HTMLDivElement, FormCardProps>(
  ({ title, description, headerAction, className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-2xl border border-border bg-card p-6 md:p-8 shadow-sm text-card-foreground transition-shadow',
          className
        )}
        {...props}
      >
        {(title || description || headerAction) && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-6 mb-6 border-b border-border">
            <div>
              {title && (
                <h3 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
                  {title}
                </h3>
              )}
              {description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {description}
                </p>
              )}
            </div>
            {headerAction && (
              <div className="shrink-0 pt-2 sm:pt-0">{headerAction}</div>
            )}
          </div>
        )}
        {children}
      </div>
    );
  }
);

FormCard.displayName = 'FormCard';
