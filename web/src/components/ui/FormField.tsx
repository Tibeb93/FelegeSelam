'use client';

import React, { useState } from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';

interface BaseFieldProps {
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
          className="block text-sm font-semibold text-foreground"
        >
          {label} {required && <span className="text-destructive">*</span>}
        </label>
      )}

      <input
        id={name}
        type={type}
        placeholder={placeholder}
        disabled={disabled}
        {...register(name, {
          valueAsNumber: type === 'number',
        })}
        className={`w-full rounded-lg border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 transition-colors ${
          error ? 'border-destructive focus:ring-destructive' : 'border-input'
        }`}
      />

      {helperText && !error && (
        <p className="text-xs text-muted-foreground">{helperText}</p>
      )}

      {error && (
        <div className="flex items-center gap-1.5 text-xs text-destructive">
          <AlertCircle className="h-3.5 w-3.5" />
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
          className="block text-sm font-semibold text-foreground"
        >
          {label} {required && <span className="text-destructive">*</span>}
        </label>
      )}

      <div className="relative">
        <input
          id={name}
          type={showPassword ? 'text' : 'password'}
          placeholder={placeholder}
          disabled={disabled}
          {...register(name)}
          className={`w-full rounded-lg border bg-background px-3.5 py-2.5 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 transition-colors ${
            error ? 'border-destructive focus:ring-destructive' : 'border-input'
          }`}
        />

        <button
          type="button"
          tabIndex={-1}
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
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
        <p className="text-xs text-muted-foreground">{helperText}</p>
      )}

      {error && (
        <div className="flex items-center gap-1.5 text-xs text-destructive">
          <AlertCircle className="h-3.5 w-3.5" />
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
          className="block text-sm font-semibold text-foreground"
        >
          {label} {required && <span className="text-destructive">*</span>}
        </label>
      )}

      <textarea
        id={name}
        rows={rows}
        placeholder={placeholder}
        disabled={disabled}
        {...register(name)}
        className={`w-full rounded-lg border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 transition-colors ${
          error ? 'border-destructive focus:ring-destructive' : 'border-input'
        }`}
      />

      {helperText && !error && (
        <p className="text-xs text-muted-foreground">{helperText}</p>
      )}

      {error && (
        <div className="flex items-center gap-1.5 text-xs text-destructive">
          <AlertCircle className="h-3.5 w-3.5" />
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
          className="block text-sm font-semibold text-foreground"
        >
          {label} {required && <span className="text-destructive">*</span>}
        </label>
      )}

      <select
        id={name}
        disabled={disabled}
        {...register(name)}
        className={`w-full rounded-lg border bg-background px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 transition-colors ${
          error ? 'border-destructive focus:ring-destructive' : 'border-input'
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
        <p className="text-xs text-muted-foreground">{helperText}</p>
      )}

      {error && (
        <div className="flex items-center gap-1.5 text-xs text-destructive">
          <AlertCircle className="h-3.5 w-3.5" />
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
        className="mt-1 h-4 w-4 rounded border-input text-primary focus:ring-primary"
      />
      <div>
        <label
          htmlFor={name}
          className="text-sm font-medium text-foreground cursor-pointer select-none"
        >
          {label}
        </label>
        {helperText && !error && (
          <p className="text-xs text-muted-foreground">{helperText}</p>
        )}
        {error && (
          <p className="text-xs text-destructive mt-0.5">{error}</p>
        )}
      </div>
    </div>
  );
}
