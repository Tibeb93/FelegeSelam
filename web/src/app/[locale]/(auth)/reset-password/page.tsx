'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '../../../../providers/ToastProvider';
import {
  InputField,
  PasswordField,
} from '../../../../components/ui/FormField';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { FormSkeleton } from '../../../../components/ui/SkeletonLoaders';

function ResetPasswordForm({ locale }: { locale: string }) {
  const t = useTranslations('Auth');
  const tVal = useTranslations('Validation');
  const searchParams = useSearchParams();
  const emailParam = searchParams.get('email') || '';

  const toast = useToast();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const resetSchema = z
    .object({
      email: z.string().email({ message: tVal('invalidEmail') }),
      code: z.string().min(4, { message: tVal('invalidCode') }),
      newPassword: z.string().min(8, { message: tVal('passwordMinLength') }),
      confirmPassword: z.string().min(1, { message: tVal('required') }),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: tVal('passwordsDoNotMatch'),
      path: ['confirmPassword'],
    });

  type ResetFormValues = z.infer<typeof resetSchema>;

  const methods = useForm<ResetFormValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      email: emailParam,
      code: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (values: ResetFormValues) => {
    setIsSubmitting(true);
    setErrorMessage(null);

    const API_URL =
      process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

    try {
      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: values.email,
          code: values.code,
          newPassword: values.newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(data.message || 'የይለፍ ቃል መቀየር አልተቻለም');
        toast.error(data.message || 'የይለፍ ቃል መቀየር አልተቻለም');
        return;
      }

      setIsSuccess(true);
      toast.success(t('resetSuccess'), 'ተጠናቋል');
    } catch (err: any) {
      setErrorMessage(err.message || 'ስህተት ተፈጥሯል');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="space-y-5 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold tracking-tight text-foreground">
          {locale === 'am' ? 'የይለፍ ቃል ተቀይሯል!' : 'Password Reset Successfully!'}
        </h2>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {t('resetSuccess')}
        </p>

        <Link
          href={`/${locale}/login`}
          className="inline-flex w-full items-center justify-center rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
        >
          {t('loginButton')}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          {t('resetPasswordTitle')}
        </h2>
        <p className="mt-1.5 text-xs text-muted-foreground">
          {t('resetPasswordDesc')}
        </p>
      </div>

      {errorMessage && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
          {errorMessage}
        </div>
      )}

      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-4">
          <InputField
            name="email"
            type="email"
            label={t('email')}
            placeholder="example@felegeselam.org"
            required
          />

          <InputField
            name="code"
            label={t('resetCode')}
            placeholder="123456"
            required
          />

          <PasswordField
            name="newPassword"
            label={t('newPassword')}
            placeholder="••••••••"
            required
          />

          <PasswordField
            name="confirmPassword"
            label={t('confirmPassword')}
            placeholder="••••••••"
            required
          />

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{locale === 'am' ? 'በመቀየር ላይ...' : 'Resetting...'}</span>
              </>
            ) : (
              <span>{t('resetButton')}</span>
            )}
          </button>
        </form>
      </FormProvider>

      <div className="text-center pt-2">
        <Link
          href={`/${locale}/login`}
          className="text-xs text-primary font-medium hover:underline"
        >
          {t('loginLink')}
        </Link>
      </div>
    </div>
  );
}

export default function ResetPasswordPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  return (
    <Suspense fallback={<FormSkeleton />}>
      <ResetPasswordForm locale={locale} />
    </Suspense>
  );
}
