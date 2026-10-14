'use client';

import React, { useEffect, useState } from 'react';
import {
  ETHIOPIAN_MONTHS_AM,
  ETHIOPIAN_MONTHS_EN,
  ethiopianToIsoGregorian,
  gregorianToEthiopian,
  EthiopianDate,
} from '../../lib/ethiopian-calendar';
import { Calendar, AlertCircle } from 'lucide-react';

interface EthiopianDatePickerProps {
  value?: string | null; // ISO Gregorian string: YYYY-MM-DD
  onChange: (isoGregorianDate: string) => void;
  label?: string;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  minYear?: number;
  maxYear?: number;
  locale?: 'am' | 'en';
}

export function EthiopianDatePicker({
  value,
  onChange,
  label,
  error,
  helperText,
  disabled = false,
  minYear = 1930,
  maxYear = 2030,
  locale = 'am',
}: EthiopianDatePickerProps) {
  const [selectedYear, setSelectedYear] = useState<number>(2017);
  const [selectedMonth, setSelectedMonth] = useState<number>(1);
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [gregorianIso, setGregorianIso] = useState<string>('');

  // Sync internal state when external value changes
  useEffect(() => {
    if (value) {
      try {
        const eth: EthiopianDate = gregorianToEthiopian(new Date(value));
        setSelectedYear(eth.year);
        setSelectedMonth(eth.month);
        setSelectedDay(eth.day);
        setGregorianIso(value.split('T')[0]);
      } catch {
        // Fallback to current year
      }
    } else {
      const todayEth = gregorianToEthiopian(new Date());
      setSelectedYear(todayEth.year);
      setSelectedMonth(todayEth.month);
      setSelectedDay(todayEth.day);
    }
  }, [value]);

  const handleDateChange = (
    newYear: number,
    newMonth: number,
    newDay: number,
  ) => {
    // Validate maximum days in month (Pagume has 5 or 6 days)
    const maxDays = newMonth === 13 ? (newYear % 4 === 3 ? 6 : 5) : 30;
    const clampedDay = Math.min(newDay, maxDays);

    setSelectedYear(newYear);
    setSelectedMonth(newMonth);
    setSelectedDay(clampedDay);

    const iso = ethiopianToIsoGregorian(newYear, newMonth, clampedDay);
    setGregorianIso(iso);
    onChange(iso);
  };

  // Generate Year options
  const years: number[] = [];
  for (let y = maxYear; y >= minYear; y--) {
    years.push(y);
  }

  // Days in selected month
  const maxDays = selectedMonth === 13 ? (selectedYear % 4 === 3 ? 6 : 5) : 30;
  const days = Array.from({ length: maxDays }, (_, i) => i + 1);

  const months = locale === 'am' ? ETHIOPIAN_MONTHS_AM : ETHIOPIAN_MONTHS_EN;

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label className="block text-sm font-semibold text-foreground">
          {label}
        </label>
      )}

      <div className="rounded-xl border border-border bg-card p-3 shadow-sm transition-all focus-within:border-primary">
        <div className="flex items-center gap-2 mb-2 text-xs font-medium text-muted-foreground">
          <Calendar className="h-4 w-4 text-primary" />
          <span>
            {locale === 'am'
              ? 'የኢትዮጵያ ዘመን አቆጣጠር (Ethiopian Date)'
              : 'Ethiopian Calendar Date'}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {/* Month Selector */}
          <div>
            <label className="sr-only">ወር (Month)</label>
            <select
              value={selectedMonth}
              disabled={disabled}
              onChange={(e) =>
                handleDateChange(
                  selectedYear,
                  Number(e.target.value),
                  selectedDay,
                )
              }
              className="w-full rounded-lg border border-input bg-background px-2.5 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
            >
              {months.map((m, idx) => (
                <option key={idx + 1} value={idx + 1}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Day Selector */}
          <div>
            <label className="sr-only">ቀን (Day)</label>
            <select
              value={selectedDay}
              disabled={disabled}
              onChange={(e) =>
                handleDateChange(
                  selectedYear,
                  selectedMonth,
                  Number(e.target.value),
                )
              }
              className="w-full rounded-lg border border-input bg-background px-2.5 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
            >
              {days.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Year Selector */}
          <div>
            <label className="sr-only">ዓመት (Year)</label>
            <select
              value={selectedYear}
              disabled={disabled}
              onChange={(e) =>
                handleDateChange(
                  Number(e.target.value),
                  selectedMonth,
                  selectedDay,
                )
              }
              className="w-full rounded-lg border border-input bg-background px-2.5 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y} {locale === 'am' ? 'ዓ.ም' : 'E.C.'}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Gregorian counterpart preview */}
        {gregorianIso && (
          <div className="mt-2.5 flex items-center justify-between border-t border-border/50 pt-2 text-xs text-muted-foreground">
            <span>
              {locale === 'am'
                ? `${months[selectedMonth - 1]} ${selectedDay} ቀን ${selectedYear} ዓ.ም`
                : `${months[selectedMonth - 1]} ${selectedDay}, ${selectedYear} E.C.`}
            </span>
            <span className="font-mono text-primary/90">
              G.C.: {gregorianIso}
            </span>
          </div>
        )}
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
