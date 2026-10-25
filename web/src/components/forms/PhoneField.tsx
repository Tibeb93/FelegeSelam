'use client';

import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Phone, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface PhoneFieldProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  name: string;
  label?: string;
  placeholder?: string;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  containerClassName?: string;
}

export const PhoneField = React.forwardRef<HTMLInputElement, PhoneFieldProps>(
  (
    {
      name,
      label,
      placeholder = '0911223344',
      helperText = 'ምሳሌ: 0911223344 ወይም +251911223344',
      required,
      disabled,
      error: manualError,
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

        <div className="relative flex items-center">
          {/* Country prefix badge */}
          <div className="absolute left-1.5 flex h-9 items-center gap-1.5 rounded-lg bg-muted/60 px-2.5 text-xs font-semibold text-foreground select-none border border-border/50">
            <span role="img" aria-label="Ethiopia" className="text-sm">
              🇪🇹
            </span>
            <span className="text-muted-foreground">+251</span>
          </div>

          <input
            id={inputId}
            name={name}
            type="tel"
            placeholder={placeholder}
            disabled={disabled}
            aria-invalid={Boolean(error)}
            aria-describedby={
              error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
            }
            ref={(node) => {
              if (typeof ref === 'function') ref(node);
              else if (ref) (ref as React.MutableRefObject<HTMLInputElement | null>).current = node;
              if (rhfRef) rhfRef(node);
            }}
            value={value}
            onChange={onChange}
            {...restRegister}
            {...props}
            className={cn(
              'h-12 w-full rounded-xl border bg-background pl-24 pr-10 text-sm text-foreground placeholder:text-muted-foreground transition-all duration-150',
              'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
              'disabled:cursor-not-allowed disabled:opacity-50',
              error
                ? 'border-destructive focus:border-destructive focus:ring-destructive/30 text-foreground'
                : 'border-input hover:border-muted-foreground/40',
              className
            )}
          />

          <div className="pointer-events-none absolute right-3.5 flex items-center text-muted-foreground">
            <Phone className="h-4 w-4" />
          </div>
        </div>

        {helperText && !error && (
          <p id={`${inputId}-helper`} className="text-xs text-muted-foreground leading-normal">
            {helperText}
          </p>
        )}

        {error && (
          <div
            id={`${inputId}-error`}
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
);

PhoneField.displayName = 'PhoneField';
