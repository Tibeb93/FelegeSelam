'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '../../../../providers/ToastProvider';
import { TextField, PrimaryButton, FormSuccessScreen } from '../../../../components/forms';
import { KeyRound } from 'lucide-react';
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
      <FormSuccessScreen
        title={locale === 'am' ? 'የይለፍ ቃል ተቀይሯል!' : 'Password Reset Successfully!'}
        description={t('resetSuccess')}
        primaryAction={{
          label: t('loginLink'),
          href: `/${locale}/login`,
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-1.5">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          {t('resetPasswordTitle')}
        </h2>
        <p className="text-xs md:text-sm text-muted-foreground">
          {t('resetPasswordDesc')}
        </p>
      </div>

      {errorMessage && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-xs font-medium text-destructive animate-fadeIn">
          {errorMessage}
        </div>
      )}

      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-4">
          <TextField
            name="email"
            type="email"
            label={t('email')}
            placeholder="example@felegeselam.org"
            required
          />

          <TextField
            name="code"
            label={t('resetCode')}
            placeholder="123456"
            required
          />

          <TextField
            name="newPassword"
            type="password"
            label={t('newPassword')}
            placeholder="••••••••"
            required
          />

          <TextField
            name="confirmPassword"
            type="password"
            label={t('confirmPassword')}
            placeholder="••••••••"
            required
          />

          <PrimaryButton
            type="submit"
            disabled={isSubmitting}
            loading={isSubmitting}
            loadingText={t('resetting')}
            startIcon={<KeyRound className="h-4 w-4" />}
            className="w-full mt-2"
          >
            {t('resetButton')}
          </PrimaryButton>
        </form>
      </FormProvider>

      <div className="text-center pt-2">
        <Link
          href={`/${locale}/login`}
          className="font-semibold text-xs text-primary hover:underline"
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
