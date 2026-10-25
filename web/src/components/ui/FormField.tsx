'use client';

import React, { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';

export interface BaseFieldProps {
  name: string;
  label?: string;
  placeholder?: string;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export function InputField({
  name,
  label,
  placeholder,
  helperText,
  required,
  disabled,
  type = 'text',
  className = '',
}: BaseFieldProps & { type?: 'text' | 'email' | 'number' | 'tel' }) {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  const error = errors[name]?.message as string | undefined;

  return (
    <div className={`w-full space-y-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={name}
          className="block text-sm font-semibold text-foreground tracking-tight select-none"
        >
          {label} {required && <span className="text-destructive ml-1" aria-hidden="true">*</span>}
        </label>
      )}

      <input
        id={name}
        type={type}
        placeholder={placeholder}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        aria-describedby={
          error ? `${name}-error` : helperText ? `${name}-helper` : undefined
        }
        {...register(name, {
          valueAsNumber: type === 'number',
        })}
        className={`h-12 min-h-[48px] w-full rounded-xl border bg-background px-4 text-sm text-foreground placeholder:text-muted-foreground transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:cursor-not-allowed disabled:opacity-50 ${
          error
            ? 'border-destructive focus:border-destructive focus:ring-destructive/30'
            : 'border-input hover:border-muted-foreground/40'
        }`}
      />

      {helperText && !error && (
        <p id={`${name}-helper`} className="text-xs text-muted-foreground leading-normal">
          {helperText}
        </p>
      )}

      {error && (
        <div
          id={`${name}-error`}
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

export function PasswordField({
  name,
  label,
  placeholder,
  helperText,
  required,
  disabled,
  className = '',
}: BaseFieldProps) {
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    formState: { errors },
  } = useFormContext();

  const error = errors[name]?.message as string | undefined;

  return (
    <div className={`w-full space-y-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={name}
          className="block text-sm font-semibold text-foreground tracking-tight select-none"
        >
          {label} {required && <span className="text-destructive ml-1" aria-hidden="true">*</span>}
        </label>
      )}

      <div className="relative">
        <input
          id={name}
          type={showPassword ? 'text' : 'password'}
          placeholder={placeholder}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={
            error ? `${name}-error` : helperText ? `${name}-helper` : undefined
          }
          {...register(name)}
          className={`h-12 min-h-[48px] w-full rounded-xl border bg-background px-4 pr-11 text-sm text-foreground placeholder:text-muted-foreground transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:cursor-not-allowed disabled:opacity-50 ${
            error
              ? 'border-destructive focus:border-destructive focus:ring-destructive/30'
              : 'border-input hover:border-muted-foreground/40'
          }`}
        />

        <button
          type="button"
          tabIndex={-1}
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      </div>

      {helperText && !error && (
        <p id={`${name}-helper`} className="text-xs text-muted-foreground leading-normal">
          {helperText}
        </p>
      )}

      {error && (
        <div
          id={`${name}-error`}
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

export function TextareaField({
  name,
  label,
  placeholder,
  helperText,
  required,
  disabled,
  rows = 4,
  className = '',
}: BaseFieldProps & { rows?: number }) {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  const error = errors[name]?.message as string | undefined;

  return (
    <div className={`w-full space-y-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={name}
          className="block text-sm font-semibold text-foreground tracking-tight select-none"
        >
          {label} {required && <span className="text-destructive ml-1" aria-hidden="true">*</span>}
        </label>
      )}

      <textarea
        id={name}
        rows={rows}
        placeholder={placeholder}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        aria-describedby={
          error ? `${name}-error` : helperText ? `${name}-helper` : undefined
        }
        {...register(name)}
        className={`w-full rounded-xl border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground transition-all duration-150 resize-y focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:cursor-not-allowed disabled:opacity-50 ${
          error
            ? 'border-destructive focus:border-destructive focus:ring-destructive/30'
            : 'border-input hover:border-muted-foreground/40'
        }`}
      />

      {helperText && !error && (
        <p id={`${name}-helper`} className="text-xs text-muted-foreground leading-normal">
          {helperText}
        </p>
      )}

      {error && (
        <div
          id={`${name}-error`}
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

export interface SelectOption {
  label: string;
  value: string | number;
}

export function SelectField({
  name,
  label,
  options,
  placeholder,
  helperText,
  required,
  disabled,
  className = '',
}: BaseFieldProps & { options: SelectOption[] }) {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  const error = errors[name]?.message as string | undefined;

  return (
    <div className={`w-full space-y-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={name}
          className="block text-sm font-semibold text-foreground tracking-tight select-none"
        >
          {label} {required && <span className="text-destructive ml-1" aria-hidden="true">*</span>}
        </label>
      )}

      <select
        id={name}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        aria-describedby={
          error ? `${name}-error` : helperText ? `${name}-helper` : undefined
        }
        {...register(name)}
        className={`h-12 min-h-[48px] w-full rounded-xl border bg-background px-4 text-sm text-foreground transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:cursor-not-allowed disabled:opacity-50 ${
          error
            ? 'border-destructive focus:border-destructive focus:ring-destructive/30'
            : 'border-input hover:border-muted-foreground/40'
        }`}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {helperText && !error && (
        <p id={`${name}-helper`} className="text-xs text-muted-foreground leading-normal">
          {helperText}
        </p>
      )}

      {error && (
        <div
          id={`${name}-error`}
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

export function CheckboxField({
  name,
  label,
  helperText,
  disabled,
  className = '',
}: BaseFieldProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  const error = errors[name]?.message as string | undefined;

  return (
    <div className={`flex items-start gap-3 ${className}`}>
      <input
        id={name}
        type="checkbox"
        disabled={disabled}
        {...register(name)}
        className="mt-1 h-5 w-5 rounded-md border-input text-primary focus:ring-primary-500 transition-colors cursor-pointer"
      />
      <div>
        <label
          htmlFor={name}
          className="text-sm font-semibold text-foreground cursor-pointer select-none"
        >
          {label}
        </label>
        {helperText && !error && (
          <p className="text-xs text-muted-foreground mt-0.5">{helperText}</p>
        )}
        {error && (
          <div className="flex items-center gap-1 text-xs text-destructive font-medium mt-1">
            <AlertCircle className="h-3 w-3 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
}
