'use client';

import React from 'react';
import { useFormContext } from 'react-hook-form';
import { AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface RadioOption {
  label: string;
  value: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
}

export interface RadioCardsProps {
  name: string;
  label?: string;
  options: RadioOption[];
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  columns?: 2 | 3 | 4;
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
  containerClassName?: string;
}

export function RadioCards({
  name,
  label,
  options,
  helperText,
  required,
  disabled = false,
  error: manualError,
  columns = 2,
  value: controlledValue,
  onChange: controlledOnChange,
  className,
  containerClassName,
}: RadioCardsProps) {
  const formContext = useFormContext();
  const rhfValue = formContext ? formContext.watch(name) : undefined;
  const rhfSetValue = formContext?.setValue;
  const formError = formContext?.formState?.errors?.[name]?.message as
    | string
    | undefined;
  const error = manualError || formError;

  const currentValue =
    controlledValue !== undefined ? controlledValue : rhfValue !== undefined ? rhfValue : '';

  const handleSelect = (val: string) => {
    if (disabled) return;
    if (controlledOnChange) {
      controlledOnChange(val);
    }
    if (rhfSetValue) {
      rhfSetValue(name, val, { shouldValidate: true, shouldDirty: true });
    }
  };

  const gridCols = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  }[columns];

  return (
    <div className={cn('w-full space-y-2', containerClassName)}>
      {label && (
        <label className="block text-sm font-semibold text-foreground tracking-tight select-none">
          {label}
          {required && (
            <span className="text-destructive ml-1" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}

      {/* Hidden inputs for native form and accessibility */}
      <div className="sr-only" role="radiogroup" aria-label={label || name}>
        {options.map((opt) => (
          <input
            key={opt.value}
            type="radio"
            name={name}
            value={opt.value}
            checked={currentValue === opt.value}
            onChange={() => handleSelect(opt.value)}
            disabled={disabled || opt.disabled}
          />
        ))}
      </div>

      <div className={cn('grid gap-3', gridCols, className)}>
        {options.map((option) => {
          const isSelected = currentValue === option.value;
          const isDisabled = disabled || option.disabled;
          const Icon = option.icon;

          return (
            <div
              key={option.value}
              role="radio"
              aria-checked={isSelected}
              tabIndex={isDisabled ? -1 : 0}
              onClick={() => !isDisabled && handleSelect(option.value)}
              onKeyDown={(e) => {
                if ((e.key === 'Enter' || e.key === ' ') && !isDisabled) {
                  e.preventDefault();
                  handleSelect(option.value);
                }
              }}
              className={cn(
                'group relative flex items-start gap-3.5 rounded-xl border p-4 cursor-pointer select-none transition-all duration-150',
                'focus:outline-none focus:ring-2 focus:ring-primary-500',
                isDisabled && 'opacity-40 cursor-not-allowed pointer-events-none',
                isSelected
                  ? 'border-primary bg-primary-50/50 dark:bg-primary-950/40 shadow-sm ring-1 ring-primary'
                  : 'border-border bg-card hover:border-primary/50 hover:bg-muted/30'
              )}
            >
              {/* Radio Indicator */}
              <div
                className={cn(
                  'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors',
                  isSelected
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-muted-foreground/40 bg-background group-hover:border-primary/60'
                )}
              >
                {isSelected && <div className="h-2 w-2 rounded-full bg-white" />}
              </div>

              {Icon && (
                <div
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors',
                    isSelected
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground group-hover:text-foreground'
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    'text-sm font-semibold tracking-tight',
                    isSelected ? 'text-primary-900 dark:text-primary-100' : 'text-foreground'
                  )}
                >
                  {option.label}
                </p>
                {option.description && (
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    {option.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {helperText && !error && (
        <p className="text-xs text-muted-foreground leading-normal">{helperText}</p>
      )}

      {error && (
        <div
          className="flex items-center gap-1.5 text-xs text-destructive font-medium leading-normal animate-fadeIn"
          role="alert"
        >
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
