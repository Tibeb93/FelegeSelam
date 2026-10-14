'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '../../../../providers/ToastProvider';
import {
  InputField,
  PasswordField,
  SelectField,
} from '../../../../components/ui/FormField';
import { Loader2, CheckCircle2 } from 'lucide-react';

export default function RegisterPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = useTranslations('Auth');
  const tCommon = useTranslations('Common');
  const tVal = useTranslations('Validation');
  const router = useRouter();
  const toast = useToast();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const registerSchema = z
    .object({
      firstName: z.string().min(1, { message: tVal('required') }),
      fatherName: z.string().min(1, { message: tVal('required') }),
      grandfatherName: z.string().optional(),
      baptismalName: z.string().optional(),
      sex: z.enum(['male', 'female'], {
        errorMap: () => ({ message: tVal('required') }),
      }),
      phone: z.string().min(10, { message: tVal('invalidPhone') }),
      email: z.string().email({ message: tVal('invalidEmail') }),
      parish: z.string().optional(),
      password: z.string().min(8, { message: tVal('passwordMinLength') }),
      confirmPassword: z.string().min(1, { message: tVal('required') }),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: tVal('passwordsDoNotMatch'),
      path: ['confirmPassword'],
    });

  type RegisterFormValues = z.infer<typeof registerSchema>;

  const methods = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      fatherName: '',
      grandfatherName: '',
      baptismalName: '',
      sex: 'male',
      phone: '',
      email: '',
      parish: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (values: RegisterFormValues) => {
    setIsSubmitting(true);
    setErrorMessage(null);

    const API_URL =
      process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: values.email,
          phone: values.phone,
          password: values.password,
          firstName: values.firstName,
          fatherName: values.fatherName,
          grandfatherName: values.grandfatherName || undefined,
          baptismalName: values.baptismalName || undefined,
          sex: values.sex,
          parish: values.parish || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(data.message || 'የምዝገባ ጥያቄው አልተሳካም');
        toast.error(data.message || 'የምዝገባ ጥያቄው አልተሳካም');
        return;
      }

      setIsSuccess(true);
      toast.success('የምዝገባ ጥያቄዎ በተሳካ ሁኔታ ቀርቧል', 'እንኳን ደስ አለዎት');
    } catch (err: any) {
      setErrorMessage(err.message || 'የአውታረ መረብ ችግር አጋጥሟል');
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
          {locale === 'am' ? 'ምዝገባዎ በተሳካ ሁኔታ ተልኳል!' : 'Registration Submitted!'}
        </h2>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {locale === 'am'
            ? 'የአባልነት ማመልከቻዎ በሰንበት ትምህርት ቤቱ አስተዳደር ተገምግሞ ሲጸድቅ መለያዎ ገቢር ይሆናል።'
            : 'Your membership application is pending administrator review and approval.'}
        </p>
        <Link
          href={`/${locale}/login`}
          className="inline-flex w-full items-center justify-center rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
        >
          {t('loginLink')}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          {t('registerTitle')}
        </h2>
        <p className="mt-1.5 text-xs text-muted-foreground">
          {t('registerSubtitle')}
        </p>
      </div>

      {errorMessage && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
          {errorMessage}
        </div>
      )}

      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-3.5">
          <div className="grid grid-cols-2 gap-3">
            <InputField
              name="firstName"
              label={t('firstName')}
              placeholder="ዮሐንስ"
              required
            />
            <InputField
              name="fatherName"
              label={t('fatherName')}
              placeholder="ኃይሌ"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <InputField
              name="grandfatherName"
              label={t('grandfatherName')}
              placeholder="ተክሌ"
            />
            <InputField
              name="baptismalName"
              label={t('baptismalName')}
              placeholder="ወልደ ጊዮርጊስ"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <SelectField
              name="sex"
              label={t('sex')}
              options={[
                { label: t('male'), value: 'male' },
                { label: t('female'), value: 'female' },
              ]}
              required
            />
            <InputField
              name="parish"
              label={t('parish')}
              placeholder="ደብረ ሰላም ቅዱስ እስጢፋኖስ"
            />
          </div>

          <InputField
            name="phone"
            type="tel"
            label={t('phone')}
            placeholder="0911223344"
            required
          />

          <InputField
            name="email"
            type="email"
            label={t('email')}
            placeholder="member@felegeselam.org"
            required
          />

          <PasswordField
            name="password"
            label={t('password')}
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
            className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{t('registering')}</span>
              </>
            ) : (
              <span>{t('registerButton')}</span>
            )}
          </button>
        </form>
      </FormProvider>

      <div className="text-center text-xs text-muted-foreground pt-1">
        <span>{t('haveAccount')} </span>
        <Link
          href={`/${locale}/login`}
          className="font-semibold text-primary hover:underline"
        >
          {t('loginButton')}
        </Link>
      </div>
    </div>
  );
}
