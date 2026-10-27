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
  const [_mounted, setMounted] = useState(false);
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
      parish: isAm ? 'ፈለገ ሰላም ቅዱስ ጊዮርጊስ ካቴድራል' : 'Felegeselam Kidus Giyorgis Cathedral',
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
        const errorDetail =
          Array.isArray(data.errors) && data.errors.length > 0
            ? `${data.message ? data.message + ': ' : ''}${data.errors.join(', ')}`
            : data.message || (isAm ? 'የምዝገባ ጥያቄው አልተሳካም' : 'Registration failed');
        setErrorMessage(errorDetail);
        toast.error(errorDetail);
        return;
      }

      setIsSuccess(true);
      toast.success(
        isAm ? 'የምዝገባ ጥያቄዎ በተሳካ ሁኔታ ቀርቧል' : 'Registration submitted successfully',
        isAm ? 'እንኳን ደስ አለዎት' : 'Congratulations'
      );
    } catch (err: any) {
      const msg = err.message || (isAm ? 'የአውታረ መረብ ችግር አጋጥሟል' : 'Network error occurred');
      setErrorMessage(msg);
      toast.error(msg);
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
              autoComplete="given-name"
              required
            />
            <TextField
              name="fatherName"
              label={t('fatherName')}
              placeholder="ኃይሌ"
              autoComplete="family-name"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextField
              name="grandfatherName"
              label={t('grandfatherName')}
              placeholder="ተክሌ"
              autoComplete="additional-name"
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
              defaultValue={isAm ? 'ፈለገ ሰላም ቅዱስ ጊዮርጊስ ካቴድራል' : 'Felegeselam Kidus Giyorgis Cathedral'}
              placeholder={isAm ? "ፈለገ ሰላም ቅዱስ ጊዮርጊስ ካቴድራል" : "Felegeselam Kidus Giyorgis Cathedral"}
            />
          </div>

          <PhoneField
            name="phone"
            label={t('phone')}
            placeholder="0911223344"
            autoComplete="tel"
            required
          />

          <TextField
            name="email"
            type="email"
            label={t('email')}
            placeholder="member@felegeselam.org"
            autoComplete="email"
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextField
              name="password"
              type="password"
              label={t('password')}
              placeholder="••••••••"
              autoComplete="new-password"
              required
            />
            <TextField
              name="confirmPassword"
              type="password"
              label={t('confirmPassword')}
              placeholder="••••••••"
              autoComplete="new-password"
              required
            />
          </div>

          <PrimaryButton
            id="register-submit-button"
            type="submit"
            disabled={isSubmitting}
            loading={isSubmitting}
            loadingText={t('registering')}
            startIcon={<UserPlus className="h-5 w-5" />}
            className="w-full mt-3 h-12 text-base font-bold shadow-md cursor-pointer"
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
