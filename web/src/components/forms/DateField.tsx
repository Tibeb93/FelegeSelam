'use client';

import React, { useEffect, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { Calendar, AlertCircle, RefreshCw } from 'lucide-react';
import {
  ETHIOPIAN_MONTHS_AM,
  ETHIOPIAN_MONTHS_EN,
  ethiopianToIsoGregorian,
  gregorianToEthiopian,
  EthiopianDate,
} from '../../lib/ethiopian-calendar';
import { cn } from '../../lib/utils';

export interface DateFieldProps {
  name: string;
  label?: string;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  minYear?: number;
  maxYear?: number;
  locale?: 'am' | 'en';
  value?: string | null; // ISO YYYY-MM-DD
  onChange?: (isoGregorianDate: string) => void;
  className?: string;
  containerClassName?: string;
  id?: string;
}

export function DateField({
  name,
  label,
  helperText,
  required,
  disabled = false,
  error: manualError,
  minYear = 1930,
  maxYear = 2035,
  locale = 'am',
  value: controlledValue,
  onChange: controlledOnChange,
  className,
  containerClassName,
  id,
}: DateFieldProps) {
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

  const [mode, setMode] = useState<'ethiopian' | 'gregorian'>('ethiopian');
  const [selectedYear, setSelectedYear] = useState<number>(2017);
  const [selectedMonth, setSelectedMonth] = useState<number>(1);
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [isoDate, setIsoDate] = useState<string>('');

  // Sync internal state when external value changes
  useEffect(() => {
    if (currentValue) {
      try {
        const cleanIso = String(currentValue).split('T')[0];
        setIsoDate(cleanIso);
        const eth: EthiopianDate = gregorianToEthiopian(new Date(cleanIso));
        setSelectedYear(eth.year);
        setSelectedMonth(eth.month);
        setSelectedDay(eth.day);
      } catch {
        // Fallback
      }
    } else {
      const todayEth = gregorianToEthiopian(new Date());
      setSelectedYear(todayEth.year);
      setSelectedMonth(todayEth.month);
      setSelectedDay(todayEth.day);
      setIsoDate('');
    }
  }, [currentValue]);

  const updateDate = (newIso: string) => {
    setIsoDate(newIso);
    if (controlledOnChange) {
      controlledOnChange(newIso);
    }
    if (rhfSetValue) {
      rhfSetValue(name, newIso, { shouldValidate: true, shouldDirty: true });
    }
  };

  const handleEthChange = (newYear: number, newMonth: number, newDay: number) => {
    const maxDays = newMonth === 13 ? (newYear % 4 === 3 ? 6 : 5) : 30;
    const clampedDay = Math.min(newDay, maxDays);

    setSelectedYear(newYear);
    setSelectedMonth(newMonth);
    setSelectedDay(clampedDay);

    const iso = ethiopianToIsoGregorian(newYear, newMonth, clampedDay);
    updateDate(iso);
  };

  const handleGregorianChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    updateDate(val);
    if (val) {
      try {
        const eth = gregorianToEthiopian(new Date(val));
        setSelectedYear(eth.year);
        setSelectedMonth(eth.month);
        setSelectedDay(eth.day);
      } catch {
        // ignore
      }
    }
  };

  const years: number[] = [];
  for (let y = maxYear; y >= minYear; y--) {
    years.push(y);
  }

  const maxDays = selectedMonth === 13 ? (selectedYear % 4 === 3 ? 6 : 5) : 30;
  const days = Array.from({ length: maxDays }, (_, i) => i + 1);
  const months = locale === 'am' ? ETHIOPIAN_MONTHS_AM : ETHIOPIAN_MONTHS_EN;

  return (
    <div className={cn('w-full space-y-1.5', containerClassName)}>
      <div className="flex items-center justify-between">
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

        <button
          type="button"
          onClick={() => setMode(mode === 'ethiopian' ? 'gregorian' : 'ethiopian')}
          className="text-xs font-medium text-primary hover:text-primary-700 dark:text-primary-400 flex items-center gap-1 transition-colors select-none"
        >
          <RefreshCw className="h-3 w-3" />
          <span>
            {mode === 'ethiopian'
              ? locale === 'am'
                ? 'ወደ ፈረንጅ ቀን ቀይር'
                : 'Switch to Gregorian'
              : locale === 'am'
              ? 'ወደ ኢትዮጵያ ቀን ቀይር'
              : 'Switch to Ethiopian'}
          </span>
        </button>
      </div>

      {/* Hidden input keeping form value intact */}
      <input
        type="hidden"
        id={inputId}
        name={name}
        value={isoDate}
      />

      <div
        className={cn(
          'rounded-xl border bg-card p-3 shadow-sm transition-all',
          error
            ? 'border-destructive focus-within:ring-2 focus-within:ring-destructive/30'
            : 'border-border focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-primary-500',
          className
        )}
      >
        {mode === 'ethiopian' ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
              <span className="flex items-center gap-1.5 text-primary-700 dark:text-primary-300">
                <Calendar className="h-3.5 w-3.5" />
                {locale === 'am' ? 'የኢትዮጵያ ቀን መቁጠሪያ' : 'Ethiopian Calendar'}
              </span>
              {isoDate && (
                <span className="text-[11px] bg-muted px-2 py-0.5 rounded-md font-mono">
                  GC: {isoDate}
                </span>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2">
              {/* Day */}
              <div>
                <label className="text-[11px] text-muted-foreground block mb-1">
                  {locale === 'am' ? 'ቀን' : 'Day'}
                </label>
                <select
                  disabled={disabled}
                  value={selectedDay}
                  onChange={(e) =>
                    handleEthChange(selectedYear, selectedMonth, Number(e.target.value))
                  }
                  className="h-10 w-full rounded-lg border border-input bg-background px-2.5 text-xs md:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {days.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              {/* Month */}
              <div>
                <label className="text-[11px] text-muted-foreground block mb-1">
                  {locale === 'am' ? 'ወር' : 'Month'}
                </label>
                <select
                  disabled={disabled}
                  value={selectedMonth}
                  onChange={(e) =>
                    handleEthChange(selectedYear, Number(e.target.value), selectedDay)
                  }
                  className="h-10 w-full rounded-lg border border-input bg-background px-2 text-xs md:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500 truncate"
                >
                  {months.map((m, idx) => (
                    <option key={m} value={idx + 1}>
                      {m} ({idx + 1})
                    </option>
                  ))}
                </select>
              </div>

              {/* Year */}
              <div>
                <label className="text-[11px] text-muted-foreground block mb-1">
                  {locale === 'am' ? 'ዓመት' : 'Year'}
                </label>
                <select
                  disabled={disabled}
                  value={selectedYear}
                  onChange={(e) =>
                    handleEthChange(Number(e.target.value), selectedMonth, selectedDay)
                  }
                  className="h-10 w-full rounded-lg border border-input bg-background px-2.5 text-xs md:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
              <span className="flex items-center gap-1.5 text-primary-700 dark:text-primary-300">
                <Calendar className="h-3.5 w-3.5" />
                {locale === 'am' ? 'የፈረንጅ ቀን መቁጠሪያ (Gregorian)' : 'Gregorian Calendar'}
              </span>
              {isoDate && (
                <span className="text-[11px] bg-muted px-2 py-0.5 rounded-md font-mono">
                  {selectedDay}/{selectedMonth}/{selectedYear} ዓ.ም
                </span>
              )}
            </div>
            <input
              type="date"
              disabled={disabled}
              value={isoDate}
              onChange={handleGregorianChange}
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
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
