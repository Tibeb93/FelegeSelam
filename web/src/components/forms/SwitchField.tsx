'use client';

import React from 'react';
import { useFormContext } from 'react-hook-form';
import { AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface SwitchFieldProps {
  name: string;
  label: string;
  helperText?: string;
  disabled?: boolean;
  error?: string;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  className?: string;
  containerClassName?: string;
}

export function SwitchField({
  name,
  label,
  helperText,
  disabled = false,
  error: manualError,
  checked: controlledChecked,
  onChange: controlledOnChange,
  className,
  containerClassName,
}: SwitchFieldProps) {
  const formContext = useFormContext();
  const rhfValue = formContext ? formContext.watch(name) : undefined;
  const rhfSetValue = formContext?.setValue;
  const formError = formContext?.formState?.errors?.[name]?.message as
    | string
    | undefined;
  const error = manualError || formError;

  const isChecked =
    controlledChecked !== undefined
      ? controlledChecked
      : Boolean(rhfValue);

  const toggle = () => {
    if (disabled) return;
    const next = !isChecked;
    if (controlledOnChange) {
      controlledOnChange(next);
    }
    if (rhfSetValue) {
      rhfSetValue(name, next, { shouldValidate: true, shouldDirty: true });
    }
  };

  return (
    <div className={cn('w-full space-y-1', containerClassName)}>
      <div
        className={cn(
          'flex items-center justify-between rounded-xl border border-border bg-card p-4 transition-all',
          'hover:border-primary/40',
          disabled && 'opacity-50 cursor-not-allowed',
          className
        )}
      >
        <div className="flex-1 pr-4 select-none">
          <label
            htmlFor={name}
            className="block text-sm font-semibold text-foreground cursor-pointer"
            onClick={toggle}
          >
            {label}
          </label>
          {helperText && (
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              {helperText}
            </p>
          )}
        </div>

        <button
          id={name}
          type="button"
          role="switch"
          aria-checked={isChecked}
          disabled={disabled}
          onClick={toggle}
          className={cn(
            'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
            isChecked ? 'bg-primary' : 'bg-muted-foreground/30',
            disabled && 'cursor-not-allowed'
          )}
        >
          <span
            className={cn(
              'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out',
              isChecked ? 'translate-x-5' : 'translate-x-0'
            )}
          />
        </button>
      </div>

      {error && (
        <div
          className="flex items-center gap-1.5 text-xs text-destructive font-medium leading-normal animate-fadeIn pt-0.5"
          role="alert"
        >
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
