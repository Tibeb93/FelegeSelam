'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '../../../../providers/ToastProvider';
import {
  TextField,
  PhoneField,
  SelectField,
  PrimaryButton,
  FormSuccessScreen,
} from '../../../../components/forms';
import { UserPlus } from 'lucide-react';

export default function RegisterPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const [mounted, setMounted] = useState(false);
  const t = useTranslations('Auth');
  const tVal = useTranslations('Validation');
  const toast = useToast();
  const isAm = locale === 'am';

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

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
      <FormSuccessScreen
        title={isAm ? 'ምዝገባዎ በተሳካ ሁኔታ ተልኳል!' : 'Registration Submitted!'}
        description={
          isAm
            ? 'የአባልነት ማመልከቻዎ በሰንበት ትምህርት ቤቱ አስተዳደር ተገምግሞ ሲጸድቅ መለያዎ ገቢር ይሆናል።'
            : 'Your membership application has been submitted and is pending administrator review and approval.'
        }
        primaryAction={{
          label: t('loginLink'),
          href: `/${locale}/login`,
        }}
      />
    );
  }

  const sexOptions = [
    { label: t('male'), value: 'male' },
    { label: t('female'), value: 'female' },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center space-y-1.5">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          {t('registerTitle')}
        </h2>
        <p className="text-xs md:text-sm text-muted-foreground">
          {t('registerSubtitle')}
        </p>
      </div>

      {errorMessage && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-xs font-medium text-destructive animate-fadeIn">
          {errorMessage}
        </div>
      )}

      <FormProvider {...methods}>
        <form
          action="javascript:void(0);"
          onSubmit={methods.handleSubmit(onSubmit)}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextField
              name="firstName"
              label={t('firstName')}
              placeholder="ዮሐንስ"
              required
            />
            <TextField
              name="fatherName"
              label={t('fatherName')}
              placeholder="ኃይሌ"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextField
              name="grandfatherName"
              label={t('grandfatherName')}
              placeholder="ተክሌ"
            />
            <TextField
              name="baptismalName"
              label={t('baptismalName')}
              placeholder="ወልደ ጊዮርጊስ"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SelectField
              name="sex"
              label={t('sex')}
              options={sexOptions}
              required
            />
            <TextField
              name="parish"
              label={t('parish')}
              placeholder="ደብረ ሰላም ቅዱስ እስጢፋኖስ"
            />
          </div>

          <PhoneField
            name="phone"
            label={t('phone')}
            placeholder="0911223344"
            required
          />

          <TextField
            name="email"
            type="email"
            label={t('email')}
            placeholder="member@felegeselam.org"
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextField
              name="password"
              type="password"
              label={t('password')}
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
          </div>

          <PrimaryButton
            type="submit"
            disabled={!mounted || isSubmitting}
            loading={isSubmitting}
            loadingText={t('registering')}
            startIcon={<UserPlus className="h-4 w-4" />}
            className="w-full mt-2"
          >
            {t('registerButton')}
          </PrimaryButton>
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
