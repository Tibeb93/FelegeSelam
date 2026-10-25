'use client';

import React from 'react';
import { cn } from '../../lib/utils';

export interface FormSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  icon?: React.ComponentType<{ className?: string }> | React.ReactNode;
  description?: string;
  columns?: 1 | 2 | 3;
}

export function FormSection({
  title,
  icon: Icon,
  description,
  columns = 2,
  className,
  children,
  ...props
}: FormSectionProps) {
  const columnClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  }[columns];

  return (
    <div
      className={cn(
        'space-y-4 py-4 first:pt-0 last:pb-0',
        className
      )}
      {...props}
    >
      <div className="flex items-start gap-3 border-b border-border/70 pb-3">
        {Icon && (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-700 dark:bg-primary-950 dark:text-primary-300">
            {React.isValidElement(Icon)
              ? Icon
              : React.createElement(Icon as any, { className: 'h-5 w-5' })}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h4 className="text-base md:text-lg font-semibold text-foreground tracking-tight">
            {title}
          </h4>
          {description && (
            <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
              {description}
            </p>
          )}
        </div>
      </div>

      <div className={cn('grid gap-5 pt-2', columnClasses)}>
        {children}
      </div>
    </div>
  );
}
