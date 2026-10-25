'use client';

import React from 'react';
import Link from 'next/link';
import { CheckCircle2, ArrowRight, UserPlus, List } from 'lucide-react';
import { cn } from '../../lib/utils';
import { PrimaryButton, SecondaryButton } from './Buttons';

export interface FormSuccessSummaryItem {
  label: string;
  value: React.ReactNode;
}

export interface FormSuccessScreenProps {
  title: string;
  description?: string;
  summaryTitle?: string;
  summaryItems?: FormSuccessSummaryItem[];
  primaryAction?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  secondaryAction?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  tertiaryAction?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  className?: string;
}

export function FormSuccessScreen({
  title,
  description,
  summaryTitle = 'የተመዘገበው መረጃ ማጠቃለያ (Summary)',
  summaryItems = [],
  primaryAction,
  secondaryAction,
  tertiaryAction,
  className,
}: FormSuccessScreenProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-6 sm:p-10 text-center max-w-2xl mx-auto animate-fadeIn',
        className
      )}
    >
      {/* Celebration Checkmark Icon */}
      <div className="relative mb-6">
        <div className="absolute -inset-3 rounded-full bg-success/20 blur-xl animate-pulse" />
        <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-success text-white shadow-lg">
          <CheckCircle2 className="h-10 w-10 stroke-[2.5]" />
        </div>
      </div>

      <h3 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">
        {title}
      </h3>

      {description && (
        <p className="text-sm md:text-base text-muted-foreground mt-2 max-w-md leading-relaxed">
          {description}
        </p>
      )}

      {/* Summary Box */}
      {summaryItems.length > 0 && (
        <div className="w-full mt-8 rounded-2xl border border-border bg-card p-5 md:p-6 text-left shadow-sm">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border/80 pb-3 mb-4">
            {summaryTitle}
          </h4>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            {summaryItems.map((item, idx) => (
              <div key={idx} className="space-y-1">
                <dt className="text-xs text-muted-foreground font-medium">
                  {item.label}
                </dt>
                <dd className="font-semibold text-foreground break-words">
                  {item.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {/* Action Buttons */}
      <div className="w-full mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
        {secondaryAction && (
          secondaryAction.href ? (
            <Link href={secondaryAction.href} className="w-full sm:w-auto">
              <SecondaryButton
                type="button"
                className="w-full sm:w-auto"
                startIcon={<UserPlus className="h-4 w-4" />}
              >
                {secondaryAction.label}
              </SecondaryButton>
            </Link>
          ) : (
            <SecondaryButton
              type="button"
              onClick={secondaryAction.onClick}
              className="w-full sm:w-auto"
              startIcon={<UserPlus className="h-4 w-4" />}
            >
              {secondaryAction.label}
            </SecondaryButton>
          )
        )}

        {primaryAction && (
          primaryAction.href ? (
            <Link href={primaryAction.href} className="w-full sm:w-auto">
              <PrimaryButton
                type="button"
                className="w-full sm:w-auto"
                endIcon={<ArrowRight className="h-4 w-4" />}
              >
                {primaryAction.label}
              </PrimaryButton>
            </Link>
          ) : (
            <PrimaryButton
              type="button"
              onClick={primaryAction.onClick}
              className="w-full sm:w-auto"
              endIcon={<ArrowRight className="h-4 w-4" />}
            >
              {primaryAction.label}
            </PrimaryButton>
          )
        )}
      </div>

      {tertiaryAction && (
        <div className="mt-4">
          {tertiaryAction.href ? (
            <Link
              href={tertiaryAction.href}
              className="text-xs font-semibold text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1.5"
            >
              <List className="h-3.5 w-3.5" />
              <span>{tertiaryAction.label}</span>
            </Link>
          ) : (
            <button
              type="button"
              onClick={tertiaryAction.onClick}
              className="text-xs font-semibold text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1.5"
            >
              <List className="h-3.5 w-3.5" />
              <span>{tertiaryAction.label}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
