'use client';

import React from 'react';
import { useFormContext } from 'react-hook-form';
import { AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface TextAreaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  name: string;
  label?: string;
  placeholder?: string;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  rows?: number;
  error?: string;
  containerClassName?: string;
}

export const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(
  (
    {
      name,
      label,
      placeholder,
      helperText,
      required,
      disabled,
      rows = 4,
      error: manualError,
      maxLength,
      className,
      containerClassName,
      id,
      value,
      onChange,
      ...props
    },
    ref
  ) => {
    const formContext = useFormContext();
    const formError = formContext?.formState?.errors?.[name]?.message as
      | string
      | undefined;
    const error = manualError || formError;

    const inputId = id || name;

    const registerProps =
      Boolean(formContext) && value === undefined
        ? formContext.register(name)
        : {};

    const { ref: rhfRef, name: _rhfName, ...restRegister } = registerProps as any;

    return (
      <div className={cn('w-full space-y-1.5', containerClassName)}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-semibold text-foreground tracking-tight select-none"
          >
            {label}
            {required && (
              <span className="text-destructive ml-1" aria-hidden="true">
                *
              </span>
            )}
          </label>
        )}

        <textarea
          id={inputId}
          name={name}
          rows={rows}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={maxLength}
          aria-invalid={Boolean(error)}
          aria-describedby={
            error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
          }
          ref={(node) => {
            if (typeof ref === 'function') ref(node);
            else if (ref) (ref as React.MutableRefObject<HTMLTextAreaElement | null>).current = node;
            if (rhfRef) rhfRef(node);
          }}
          value={value}
          onChange={onChange}
          {...restRegister}
          {...props}
          className={cn(
            'w-full rounded-xl border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground transition-all duration-150 resize-y',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error
              ? 'border-destructive focus:border-destructive focus:ring-destructive/30 text-foreground'
              : 'border-input hover:border-muted-foreground/40',
            className
          )}
        />

        <div className="flex items-center justify-between text-xs">
          {error ? (
            <div
              id={`${inputId}-error`}
              className="flex items-center gap-1.5 text-destructive font-medium leading-normal animate-fadeIn"
              role="alert"
            >
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          ) : helperText ? (
            <p id={`${inputId}-helper`} className="text-muted-foreground leading-normal">
              {helperText}
            </p>
          ) : (
            <div />
          )}

          {maxLength && typeof value === 'string' && (
            <span className="text-muted-foreground text-xs ml-auto">
              {value.length}/{maxLength}
            </span>
          )}
        </div>
      </div>
    );
  }
);

TextArea.displayName = 'TextArea';
