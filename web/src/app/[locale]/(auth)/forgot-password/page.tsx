'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '../../../../providers/ToastProvider';
import { InputField } from '../../../../components/ui/FormField';
import { Loader2, MailCheck, ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = useTranslations('Auth');
  const tCommon = useTranslations('Common');
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
      <div className="space-y-5 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <MailCheck className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold tracking-tight text-foreground">
          {locale === 'am' ? 'ኮድ ተልኳል' : 'Reset Code Sent'}
        </h2>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {locale === 'am'
            ? `የይለፍ ቃል መቀየሪያ ባለ 6-አሃዝ ኮድ ወደ ${submittedEmail} ተልኳል።`
            : `A 6-digit reset code has been sent to ${submittedEmail}.`}
        </p>

        <Link
          href={`/${locale}/reset-password?email=${encodeURIComponent(submittedEmail)}`}
          className="inline-flex w-full items-center justify-center rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
        >
          {locale === 'am' ? 'የይለፍ ቃል ቀይር' : 'Proceed to Reset Password'}
        </Link>

        <div className="pt-2">
          <Link
            href={`/${locale}/login`}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
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
      <div className="text-center">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          {t('forgotPasswordTitle')}
        </h2>
        <p className="mt-1.5 text-xs text-muted-foreground">
          {t('forgotPasswordDesc')}
        </p>
      </div>

      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-4">
          <InputField
            name="email"
            type="email"
            label={t('email')}
            placeholder="example@felegeselam.org"
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
                <span>{t('sending')}</span>
              </>
            ) : (
              <span>{t('sendResetLink')}</span>
            )}
          </button>
        </form>
      </FormProvider>

      <div className="text-center pt-2">
        <Link
          href={`/${locale}/login`}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>{t('loginLink')}</span>
        </Link>
      </div>
    </div>
  );
}
