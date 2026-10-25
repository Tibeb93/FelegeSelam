'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '../../../../providers/AuthProvider';
import { useToast } from '../../../../providers/ToastProvider';
import { TextField, PrimaryButton, SecondaryButton } from '../../../../components/forms';
import { ShieldCheck, ArrowLeft, LogIn } from 'lucide-react';
import { FormSkeleton } from '../../../../components/ui/SkeletonLoaders';

function LoginForm({ locale }: { locale: string }) {
  const [mounted, setMounted] = useState(false);
  const t = useTranslations('Auth');
  const tCommon = useTranslations('Common');
  const tVal = useTranslations('Validation');
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect');

  const { login, verify2FA } = useAuth();
  const toast = useToast();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 2FA state
  const [step2FA, setStep2FA] = useState(false);
  const [tempToken, setTempToken] = useState<string>('');
  const [twoFactorCode, setTwoFactorCode] = useState<string>('');

  useEffect(() => {
    setMounted(true);
  }, []);

  const loginSchema = z.object({
    identifier: z
      .string()
      .min(1, { message: tVal('required') }),
    password: z
      .string()
      .min(6, { message: tVal('passwordMinLength') }),
  });

  type LoginFormValues = z.infer<typeof loginSchema>;

  const methods = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: '',
      password: '',
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setIsSubmitting(true);
    setErrorMessage(null);

    const credentials = {
      identifier: values.identifier,
      password: values.password,
    };

    try {
      const result = await login(credentials);

      if (!result.success) {
        setErrorMessage(result.message || 'ስህተት ተፈጥሯል (Authentication failed)');
        toast.error(result.message || 'ስህተት ተፈጥሯል');
        return;
      }

      if (result.requires2FA && result.tempToken) {
        setTempToken(result.tempToken);
        setStep2FA(true);
        toast.info(t('twoFactorDesc'), t('twoFactorTitle'));
        return;
      }

      toast.success('በተሳካ ሁኔታ ገብተዋል', 'እንኳን ደህና መጡ');
      const target = redirectUrl || `/${locale}/portal`;
      router.push(target);
      router.refresh();
    } catch (err: any) {
      setErrorMessage(err.message || 'ስህተት ተፈጥሯል');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handle2FASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (twoFactorCode.length < 6) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const result = await verify2FA(tempToken, twoFactorCode);

      if (!result.success) {
        setErrorMessage(result.message || 'ትክክለኛ ያልሆነ ኮድ');
        toast.error(result.message || 'ትክክለኛ ያልሆነ ኮድ');
        return;
      }

      toast.success('ባለሁለት ደረጃ ማረጋገጫ ተጠናቋል', 'እንኳን ደህና መጡ');
      const target = redirectUrl || `/${locale}/portal`;
      router.push(target);
      router.refresh();
    } catch (err: any) {
      setErrorMessage(err.message || 'ማረጋገጥ አልተቻለም');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {!step2FA ? (
        <>
          <div className="text-center space-y-1.5">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              {t('loginTitle')}
            </h2>
            <p className="text-xs md:text-sm text-muted-foreground">
              {t('loginSubtitle')}
            </p>
          </div>

          {errorMessage && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-xs font-medium text-destructive animate-fadeIn space-y-2">
              <p>{errorMessage}</p>
              {(errorMessage.includes('አስተዳደር') || errorMessage.toLowerCase().includes('admin')) && (
                <div className="pt-1">
                  <Link
                    href={`/${locale}/admin/login`}
                    className="inline-flex items-center gap-1.5 font-bold text-primary underline hover:opacity-90"
                  >
                    <span>{locale === 'am' ? 'ወደ አስተዳደር መግቢያ ሂድ →' : 'Go to Admin Login →'}</span>
                  </Link>
                </div>
              )}
            </div>
          )}

          <FormProvider {...methods}>
            <form
              action="javascript:void(0);"
              onSubmit={methods.handleSubmit(onSubmit)}
              className="space-y-4"
            >
              <TextField
                name="identifier"
                label={t('emailOrPhone')}
                placeholder="example@felegeselam.org / 0911000000"
                required
              />

              <TextField
                name="password"
                type="password"
                label={t('password')}
                placeholder="••••••••"
                required
              />

              <div className="flex items-center justify-end text-xs">
                <Link
                  href={`/${locale}/forgot-password`}
                  className="font-medium text-primary hover:underline transition-colors"
                >
                  {t('forgotPassword')}
                </Link>
              </div>

              <PrimaryButton
                type="submit"
                disabled={!mounted || isSubmitting}
                loading={isSubmitting}
                loadingText={t('loggingIn')}
                startIcon={<LogIn className="h-4 w-4" />}
                className="w-full"
              >
                {t('loginButton')}
              </PrimaryButton>
            </form>
          </FormProvider>

          <div className="text-center text-xs text-muted-foreground pt-2">
            <span>{t('registerPrompt')} </span>
            <Link
              href={`/${locale}/register`}
              className="font-semibold text-primary hover:underline"
            >
              {t('registerLink')}
            </Link>
          </div>
        </>
      ) : (
        <div className="space-y-6">
          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-100 text-primary-700 dark:bg-primary-950 dark:text-primary-300 mb-3 shadow-sm">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              {t('twoFactorTitle')}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {t('twoFactorDesc')}
            </p>
          </div>

          {errorMessage && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-xs font-medium text-destructive animate-fadeIn space-y-2">
              <p>{errorMessage}</p>
              {(errorMessage.includes('አስተዳደር') || errorMessage.toLowerCase().includes('admin')) && (
                <div className="pt-1">
                  <Link
                    href={`/${locale}/admin/login`}
                    className="inline-flex items-center gap-1.5 font-bold text-primary underline hover:opacity-90"
                  >
                    <span>{locale === 'am' ? 'ወደ አስተዳደር መግቢያ ሂድ →' : 'Go to Admin Login →'}</span>
                  </Link>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handle2FASubmit} className="space-y-4">
            <div>
              <label
                htmlFor="twoFactorCode"
                className="block text-sm font-semibold text-foreground mb-1.5"
              >
                {t('twoFactorCode')}
              </label>
              <input
                id="twoFactorCode"
                type="text"
                maxLength={6}
                value={twoFactorCode}
                onChange={(e) =>
                  setTwoFactorCode(e.target.value.replace(/\D/g, ''))
                }
                placeholder="123456"
                className="h-12 w-full rounded-xl border border-input bg-background py-2.5 text-center font-mono text-2xl tracking-widest text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm"
                autoFocus
                required
              />
            </div>

            <PrimaryButton
              type="submit"
              disabled={isSubmitting || twoFactorCode.length < 6}
              loading={isSubmitting}
              loadingText={t('verifying')}
              className="w-full"
            >
              {t('verifyButton')}
            </PrimaryButton>

            <SecondaryButton
              type="button"
              onClick={() => {
                setStep2FA(false);
                setTwoFactorCode('');
              }}
              startIcon={<ArrowLeft className="h-4 w-4" />}
              className="w-full text-xs"
            >
              {tCommon('back')}
            </SecondaryButton>
          </form>
        </div>
      )}
    </div>
  );
}

export default function LoginPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  return (
    <Suspense fallback={<FormSkeleton />}>
      <LoginForm locale={locale} />
    </Suspense>
  );
}
