'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '../../../../providers/AuthProvider';
import { useToast } from '../../../../providers/ToastProvider';
import { InputField, PasswordField } from '../../../../components/ui/FormField';
import { Loader2, ShieldCheck, ArrowLeft } from 'lucide-react';
import { FormSkeleton } from '../../../../components/ui/SkeletonLoaders';

function LoginForm({ locale }: { locale: string }) {
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
      const target = redirectUrl || `/${locale}/admin`;
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
      const target = redirectUrl || `/${locale}/admin`;
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
          <div className="text-center">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              {t('loginTitle')}
            </h2>
            <p className="mt-1.5 text-xs text-muted-foreground">
              {t('loginSubtitle')}
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
                name="identifier"
                label={t('emailOrPhone')}
                placeholder="example@felegeselam.org / 0911000000"
                required
              />

              <PasswordField
                name="password"
                label={t('password')}
                placeholder="••••••••"
                required
              />

              <div className="flex items-center justify-between text-xs">
                <Link
                  href={`/${locale}/forgot-password`}
                  className="font-medium text-primary hover:underline"
                >
                  {t('forgotPassword')}
                </Link>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>{t('loggingIn')}</span>
                  </>
                ) : (
                  <span>{t('loginButton')}</span>
                )}
              </button>
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
        <div className="space-y-5">
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-secondary/10 text-secondary mb-3">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              {t('twoFactorTitle')}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {t('twoFactorDesc')}
            </p>
          </div>

          {errorMessage && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
              {errorMessage}
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
                className="w-full rounded-xl border border-input bg-background py-2.5 text-center font-mono text-2xl tracking-widest text-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
                autoFocus
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || twoFactorCode.length < 6}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{t('verifying')}</span>
                </>
              ) : (
                <span>{t('verifyButton')}</span>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setStep2FA(false);
                setTwoFactorCode('');
              }}
              className="inline-flex w-full items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>{tCommon('back')}</span>
            </button>
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
