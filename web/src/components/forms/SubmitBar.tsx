'use client';

import React from 'react';
import { cn } from '../../lib/utils';
import { PrimaryButton, SecondaryButton } from './Buttons';

export interface SubmitBarProps {
  primaryLabel?: string;
  primaryAction?: () => void;
  primaryDisabled?: boolean;
  primaryLoading?: boolean;
  primaryIcon?: React.ReactNode;
  primaryVariant?: 'primary' | 'accent' | 'destructive';
  
  secondaryLabel?: string;
  secondaryAction?: () => void;
  secondaryDisabled?: boolean;
  secondaryIcon?: React.ReactNode;
  secondaryVariant?: 'outline' | 'subtle';

  extraAction?: React.ReactNode;
  className?: string;
  isStickyOnMobile?: boolean;
}

export function SubmitBar({
  primaryLabel = 'አስቀምጥ (Save)',
  primaryAction,
  primaryDisabled = false,
  primaryLoading = false,
  primaryIcon,
  primaryVariant = 'primary',

  secondaryLabel,
  secondaryAction,
  secondaryDisabled = false,
  secondaryIcon,
  secondaryVariant = 'outline',

  extraAction,
  className,
  isStickyOnMobile = true,
}: SubmitBarProps) {
  return (
    <div
      className={cn(
        'w-full transition-all duration-150',
        isStickyOnMobile &&
          'sticky bottom-0 z-30 -mx-4 -mb-4 p-4 bg-background/95 backdrop-blur-md border-t border-border shadow-lg sm:-mx-6 sm:p-5 md:static md:mx-0 md:mb-0 md:p-0 md:bg-transparent md:border-0 md:shadow-none md:backdrop-blur-none',
        className
      )}
    >
      <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 max-w-full">
        {extraAction && <div className="sm:mr-auto">{extraAction}</div>}

        {secondaryLabel && (
          <SecondaryButton
            type="button"
            onClick={secondaryAction}
            disabled={secondaryDisabled || primaryLoading}
            startIcon={secondaryIcon}
            variant={secondaryVariant}
            className="w-full sm:w-auto"
          >
            {secondaryLabel}
          </SecondaryButton>
        )}

        <PrimaryButton
          type={primaryAction ? 'button' : 'submit'}
          onClick={primaryAction}
          disabled={primaryDisabled}
          loading={primaryLoading}
          startIcon={primaryIcon}
          variant={primaryVariant}
          className="w-full sm:w-auto"
        >
          {primaryLabel}
        </PrimaryButton>
      </div>
    </div>
  );
}
