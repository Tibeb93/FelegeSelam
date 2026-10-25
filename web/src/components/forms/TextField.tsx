'use client';

import React, { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface TextFieldProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  name: string;
  label?: string;
  placeholder?: string;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
  error?: string;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  containerClassName?: string;
}

export const TextField = React.forwardRef<HTMLInputElement, TextFieldProps>(
  (
    {
      name,
      label,
      placeholder,
      helperText,
      required,
      disabled,
      type = 'text',
      error: manualError,
      startIcon,
      endIcon,
      className,
      containerClassName,
      id,
      value,
      onChange,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const formContext = useFormContext();

    // Use form context if available, otherwise manual props
    const formError = formContext?.formState?.errors?.[name]?.message as
      | string
      | undefined;
    const error = manualError || formError;

    const inputId = id || name;
    const isPassword = type === 'password';
    const computedType = isPassword ? (showPassword ? 'text' : 'password') : type;

    const registerProps =
      Boolean(formContext) && value === undefined
        ? formContext.register(name, {
            valueAsNumber: type === 'number',
          })
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
          {startIcon && (
            <div className="pointer-events-none absolute left-3.5 flex items-center text-muted-foreground">
              {startIcon}
            </div>
          )}

          <input
            id={inputId}
            name={name}
            type={computedType}
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
              'h-12 w-full rounded-xl border bg-background px-4 text-sm text-foreground placeholder:text-muted-foreground transition-all duration-150',
              'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
              'disabled:cursor-not-allowed disabled:opacity-50',
              startIcon && 'pl-11',
              (endIcon || isPassword) && 'pr-11',
              error
                ? 'border-destructive focus:border-destructive focus:ring-destructive/30 text-foreground'
                : 'border-input hover:border-muted-foreground/40',
              className
            )}
          />

          {isPassword && (
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          )}

          {!isPassword && endIcon && (
            <div className="absolute right-3.5 flex items-center text-muted-foreground">
              {endIcon}
            </div>
          )}
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

TextField.displayName = 'TextField';
