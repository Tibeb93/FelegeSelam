'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { ChevronDown, Check, Search, X, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface SelectOption {
  label: string;
  value: string | number;
  description?: string;
  disabled?: boolean;
}

export interface SelectWithSearchProps {
  name: string;
  label?: string;
  options: SelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  value?: string | number;
  onChange?: (value: string | number) => void;
  className?: string;
  containerClassName?: string;
  id?: string;
}

export function SelectWithSearch({
  name,
  label,
  options,
  placeholder = 'ይምረጡ (Select an option)',
  searchPlaceholder = 'ፈልግ... (Search...)',
  helperText,
  required,
  disabled,
  error: manualError,
  value: controlledValue,
  onChange: controlledOnChange,
  className,
  containerClassName,
  id,
}: SelectWithSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const formContext = useFormContext();
  const rhfValue = formContext ? formContext.watch(name) : undefined;
  const rhfSetValue = formContext?.setValue;
  const formError = formContext?.formState?.errors?.[name]?.message as
    | string
    | undefined;
  const error = manualError || formError;

  const inputId = id || name;
  const currentValue =
    controlledValue !== undefined ? controlledValue : rhfValue !== undefined ? rhfValue : '';

  const selectedOption = options.find(
    (opt) => String(opt.value) === String(currentValue)
  );

  const filteredOptions = options.filter(
    (opt) =>
      opt.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (opt.description &&
        opt.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSelect = (val: string | number) => {
    if (controlledOnChange) {
      controlledOnChange(val);
    }
    if (rhfSetValue) {
      rhfSetValue(name, val, { shouldValidate: true, shouldDirty: true });
    }
    setIsOpen(false);
    setSearchTerm('');
    triggerRef.current?.focus();
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleSelect('');
  };

  // Close when clicked outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setHighlightedIndex(0);
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      setSearchTerm('');
      triggerRef.current?.focus();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < filteredOptions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const option = filteredOptions[highlightedIndex];
      if (option && !option.disabled) {
        handleSelect(option.value);
      }
    }
  };

  return (
    <div
      ref={containerRef}
      className={cn('w-full space-y-1.5', containerClassName)}
      onKeyDown={handleKeyDown}
    >
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

      {/* Hidden real select for form data & Playwright compatibility */}
      <select
        id={inputId}
        name={name}
        value={currentValue}
        onChange={(e) => handleSelect(e.target.value)}
        tabIndex={-1}
        aria-hidden="true"
        className="sr-only"
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} disabled={opt.disabled}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* Visible 48px trigger button */}
      <div className="relative">
        <button
          ref={triggerRef}
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen(!isOpen)}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-describedby={
            error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
          }
          className={cn(
            'h-12 w-full rounded-xl border bg-background px-4 text-left text-sm transition-all duration-150 flex items-center justify-between',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error
              ? 'border-destructive focus:border-destructive focus:ring-destructive/30'
              : 'border-input hover:border-muted-foreground/40',
            className
          )}
        >
          <span
            className={cn(
              'block truncate',
              selectedOption ? 'text-foreground font-medium' : 'text-muted-foreground'
            )}
          >
            {selectedOption ? selectedOption.label : placeholder}
          </span>

          <div className="flex items-center gap-1.5 shrink-0 ml-2">
            {selectedOption && !disabled && (
              <span
                role="button"
                tabIndex={0}
                onClick={handleClear}
                onKeyDown={(e) => e.key === 'Enter' && handleClear(e as any)}
                className="rounded-full p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                aria-label="Clear selection"
              >
                <X className="h-3.5 w-3.5" />
              </span>
            )}
            <ChevronDown
              className={cn(
                'h-4 w-4 text-muted-foreground transition-transform duration-200',
                isOpen && 'rotate-180 text-primary-600'
              )}
            />
          </div>
        </button>

        {/* Dropdown popover with search */}
        {isOpen && (
          <div
            className="absolute z-50 left-0 right-0 mt-1.5 max-h-72 w-full overflow-hidden rounded-xl border border-border bg-popover shadow-xl animate-fadeIn"
            role="listbox"
          >
            {/* Search Input */}
            <div className="p-2 border-b border-border bg-muted/40">
              <div className="relative flex items-center">
                <Search className="pointer-events-none absolute left-3 h-4 w-4 text-muted-foreground" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder={searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setHighlightedIndex(0);
                  }}
                  className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-xs md:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2.5 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Options list */}
            <div className="max-h-56 overflow-y-auto p-1.5 space-y-0.5">
              {filteredOptions.length === 0 ? (
                <div className="py-4 text-center text-xs text-muted-foreground">
                  ምንም አማራጭ አልተገኘም (No results found)
                </div>
              ) : (
                filteredOptions.map((opt, idx) => {
                  const isSelected = String(opt.value) === String(currentValue);
                  const isHighlighted = idx === highlightedIndex;

                  return (
                    <div
                      key={opt.value}
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => !opt.disabled && handleSelect(opt.value)}
                      onMouseEnter={() => setHighlightedIndex(idx)}
                      className={cn(
                        'flex items-center justify-between rounded-lg px-3 py-2 text-sm cursor-pointer select-none transition-colors',
                        opt.disabled && 'opacity-40 cursor-not-allowed pointer-events-none',
                        isSelected && 'bg-primary-50 text-primary-900 font-semibold dark:bg-primary-950/60 dark:text-primary-100',
                        isHighlighted && !isSelected && 'bg-muted/70 text-foreground'
                      )}
                    >
                      <div className="flex flex-col">
                        <span>{opt.label}</span>
                        {opt.description && (
                          <span className="text-xs text-muted-foreground">
                            {opt.description}
                          </span>
                        )}
                      </div>
                      {isSelected && (
                        <Check className="h-4 w-4 text-primary shrink-0 ml-2" />
                      )}
                    </div>
                  );
                })
              )}
            </div>
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

export function SelectField({
  name,
  label,
  options,
  placeholder,
  helperText,
  required,
  disabled,
  className = '',
  containerClassName = '',
  id,
}: {
  name: string;
  label?: string;
  options: { label: string; value: string | number }[];
  placeholder?: string;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  containerClassName?: string;
  id?: string;
}) {
  const formContext = useFormContext();
  const formError = formContext?.formState?.errors?.[name]?.message as
    | string
    | undefined;

  const inputId = id || name;

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

      <select
        id={inputId}
        disabled={disabled}
        aria-invalid={Boolean(formError)}
        aria-describedby={
          formError
            ? `${inputId}-error`
            : helperText
            ? `${inputId}-helper`
            : undefined
        }
        {...(formContext ? formContext.register(name) : { name })}
        className={cn(
          'h-12 min-h-[48px] w-full rounded-xl border bg-background px-4 text-sm text-foreground transition-all duration-150',
          'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
          'disabled:cursor-not-allowed disabled:opacity-50',
          formError
            ? 'border-destructive focus:border-destructive focus:ring-destructive/30'
            : 'border-input hover:border-muted-foreground/40',
          className
        )}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {helperText && !formError && (
        <p id={`${inputId}-helper`} className="text-xs text-muted-foreground leading-normal">
          {helperText}
        </p>
      )}

      {formError && (
        <div
          id={`${inputId}-error`}
          className="flex items-center gap-1.5 text-xs text-destructive font-medium leading-normal animate-fadeIn"
          role="alert"
        >
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>{formError}</span>
        </div>
      )}
    </div>
  );
}
