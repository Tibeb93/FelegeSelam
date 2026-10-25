'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '../../../../providers/ToastProvider';
import { TextField, PrimaryButton } from '../../../../components/forms';
import { MailCheck, ArrowLeft, Send } from 'lucide-react';

export default function ForgotPasswordPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = useTranslations('Auth');
  const tVal = useTranslations('Validation');
  const toast = useToast();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');

  const forgotSchema = z.object({
    email: z.string().email({ message: tVal('invalidEmail') }),
  });

  type ForgotFormValues = z.infer<typeof forgotSchema>;

  const methods = useForm<ForgotFormValues>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (values: ForgotFormValues) => {
    setIsSubmitting(true);
    const API_URL =
      process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

    try {
      await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: values.email }),
      });

      setSubmittedEmail(values.email);
      setIsSubmitted(true);
      toast.success('የይለፍ ቃል መቀየሪያ ኮድ ተልኳል', 'ኢሜይልዎን ይመልከቱ');
    } catch (err: any) {
      toast.error(err.message || 'ስህተት ተፈጥሯል');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="space-y-6 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-100 text-primary-700 dark:bg-primary-950 dark:text-primary-300 shadow-sm">
          <MailCheck className="h-8 w-8" />
        </div>
        <h2 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
          {locale === 'am' ? 'ኮድ ተልኳል' : 'Reset Code Sent'}
        </h2>
        <p className="text-xs md:text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">
          {locale === 'am'
            ? `የይለፍ ቃል መቀየሪያ ባለ 6-አሃዝ ኮድ ወደ ${submittedEmail} ተልኳል።`
            : `A 6-digit reset code has been sent to ${submittedEmail}.`}
        </p>

        <Link
          href={`/${locale}/reset-password?email=${encodeURIComponent(submittedEmail)}`}
          className="block"
        >
          <PrimaryButton type="button" className="w-full">
            {locale === 'am' ? 'የይለፍ ቃል ቀይር' : 'Proceed to Reset Password'}
          </PrimaryButton>
        </Link>

        <div className="pt-2">
          <Link
            href={`/${locale}/login`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>{t('loginLink')}</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-1.5">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          {t('forgotPasswordTitle')}
        </h2>
        <p className="text-xs md:text-sm text-muted-foreground">
          {t('forgotPasswordDesc')}
        </p>
      </div>

      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-4">
          <TextField
            name="email"
            type="email"
            label={t('email')}
            placeholder="example@felegeselam.org"
            required
          />

          <PrimaryButton
            type="submit"
            disabled={isSubmitting}
            loading={isSubmitting}
            loadingText={t('sending')}
            startIcon={<Send className="h-4 w-4" />}
            className="w-full"
          >
            {t('sendResetCode')}
          </PrimaryButton>
        </form>
      </FormProvider>

      <div className="text-center pt-2">
        <Link
          href={`/${locale}/login`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>{t('loginLink')}</span>
        </Link>
      </div>
    </div>
  );
}
