'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { SchoolLogo } from '../../../../components/common/SchoolLogo';
import { LanguageSwitcher } from '../../../../components/LanguageSwitcher';
import { TextField } from '../../../../components/forms';
import { ShieldAlert, LogIn, ArrowLeft, KeyRound, Lock, Info } from 'lucide-react';
import { useToast } from '../../../../providers/ToastProvider';
import { useAuth } from '../../../../providers/AuthProvider';

function AdminLoginForm({ locale }: { locale: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect');
  const reason = searchParams.get('reason');
  const toast = useToast();
  const { adminLogin } = useAuth();

  const [mounted, setMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 2FA state
  const [requires2FA, setRequires2FA] = useState(false);
  const [twoFactorToken, setTwoFactorToken] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  const loginSchema = z.object({
    identifier: z
      .string()
      .min(1, { message: locale === 'am' ? 'እባክዎ ኢሜይል ወይም ስልክ ቁጥር ያስገቡ' : 'Email or phone is required' }),
    password: z
      .string()
      .min(6, { message: locale === 'am' ? 'የይለፍ ቃል ቢያንስ 6 ፊደላት መሆን አለበት' : 'Password must be at least 6 characters' }),
  });

  type AdminLoginFormValues = z.infer<typeof loginSchema>;

  const methods = useForm<AdminLoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: '',
      password: '',
    },
  });

  const onSubmit = async (values: AdminLoginFormValues) => {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const payload: any = {
        identifier: values.identifier.trim(),
        password: values.password,
      };

      if (requires2FA && twoFactorToken) {
        payload.twoFactorToken = twoFactorToken.trim();
      }

      const result = await adminLogin(payload);

      if (!result.success) {
        const msg =
          result.message ||
          (locale === 'am'
            ? 'የተሳሳተ የተጠቃሚ ስም ወይም የይለፍ ቃል'
            : 'Invalid credentials or staff access restricted');
        setErrorMessage(msg);
        toast.error(msg, locale === 'am' ? 'መግባት አልተቻለም' : 'Sign In Failed');
        return;
      }

      if (result.requires2FA) {
        setRequires2FA(true);
        toast.info(
          locale === 'am'
            ? 'እባክዎ ከማረጋገጫ መተግበሪያዎ (Authenticator) ባለ 6 አሃዝ ኮድ ያስገቡ'
            : 'Please enter the 6-digit TOTP code from your Authenticator app',
          locale === 'am' ? 'ባለሁለት ደረጃ ማረጋገጫ' : '2FA Required',
        );
        return;
      }

      toast.success(
        locale === 'am' ? 'ወደ አስተዳደር ክፍል እንኳን ደህና መጡ' : 'Welcome to the Admin Portal',
        locale === 'am' ? 'በተሳካ ሁኔታ ገብተዋል' : 'Signed In Successfully',
      );

      // Redirect by role target or query param
      const target = redirectUrl || (result.redirectPath ? `/${locale}${result.redirectPath}` : `/${locale}/admin`);
      router.push(target);
      router.refresh();
    } catch (err: any) {
      setErrorMessage(err.message || (locale === 'am' ? 'የግንኙነት ስህተት ተፈጥሯል' : 'Network error occurred'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Top Banner for inactivity / lockout alerts */}
      {reason === 'inactivity' && (
        <div className="mb-4 flex items-center gap-2.5 rounded-xl border border-amber-400/40 bg-amber-500/10 p-3.5 text-xs font-medium text-amber-200 backdrop-blur-sm animate-fadeIn">
          <Info className="h-4 w-4 shrink-0 text-amber-400" />
          <span>
            {locale === 'am'
              ? 'ለደህንነት ሲባል ከ30 ደቂቃ እንቅስቃሴ ማጣት በኋላ ከስርዓቱ ወጥተዋል'
              : 'You were signed out due to 30 minutes of inactivity.'}
          </span>
        </div>
      )}

      {reason === 'blocked_ip' && (
        <div className="mb-4 flex items-center gap-2.5 rounded-xl border border-rose-400/40 bg-rose-500/10 p-3.5 text-xs font-medium text-rose-200 backdrop-blur-sm animate-fadeIn">
          <ShieldAlert className="h-4 w-4 shrink-0 text-rose-400" />
          <span>
            {locale === 'am'
              ? 'ይህ አይ ፒ አድራሻ ወደ አስተዳደር ክፍል እንዲገባ አልተፈቀደም'
              : 'Access to the Admin Portal from this IP address is restricted.'}
          </span>
        </div>
      )}

      {/* Main Admin Login Card */}
      <div className="rounded-2xl border border-white/10 bg-white p-6 sm:p-8 shadow-2xl backdrop-blur-md text-[#0F2438]">
        {/* Form header */}
        <div className="text-center mb-6 space-y-1.5">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-[#0F4C81]/10 px-3 py-1 text-[11px] font-bold text-[#0F4C81] uppercase tracking-wider mb-1">
            <Lock className="h-3 w-3" />
            <span>{locale === 'am' ? 'የተፈቀደላቸው ሠራተኞች ብቻ' : 'Staff & Admins Only'}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0F2438]">
            {locale === 'am' ? 'የአስተዳደር መግቢያ' : 'Admin Sign In'}
          </h2>
          <p className="text-xs text-[#5B6B7C]">
            {locale === 'am'
              ? 'የሰንበት ትምህርት ቤቱን አስተዳደር ለመጠቀም መለያዎን ያስገቡ'
              : 'Enter your staff credentials to access the administration system'}
          </p>
        </div>

        {/* Error message alert */}
        {errorMessage && (
          <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs font-medium text-red-700 animate-fadeIn">
            <ShieldAlert className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <FormProvider {...methods}>
          <form
            action="javascript:void(0);"
            onSubmit={methods.handleSubmit(onSubmit)}
            className="space-y-4"
          >
            {!requires2FA ? (
              <>
                <TextField
                  name="identifier"
                  label={locale === 'am' ? 'ኢሜይል ወይም ስልክ ቁጥር' : 'Email or Phone'}
                  placeholder={locale === 'am' ? 'admin@felegeselam.org / 0911000000' : 'admin@felegeselam.org'}
                  required
                />

                <TextField
                  name="password"
                  type="password"
                  label={locale === 'am' ? 'የይለፍ ቃል' : 'Password'}
                  placeholder="••••••••"
                  required
                />
              </>
            ) : (
              <div className="space-y-3 py-2 animate-fadeIn">
                <div className="rounded-xl bg-[#E8F1FB] p-3 text-xs text-[#0F4C81] flex items-center gap-2">
                  <KeyRound className="h-4 w-4 shrink-0" />
                  <span>
                    {locale === 'am'
                      ? 'የማረጋገጫ መተግበሪያዎን (Google Authenticator) ይክፈቱና ባለ 6 አሃዝ ኮድ ያስገቡ'
                      : 'Open your Authenticator app and enter the 6-digit TOTP code'}
                  </span>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#0F2438] mb-1.5">
                    {locale === 'am' ? 'ባለ 6 አሃዝ ማረጋገጫ ኮድ' : '6-digit 2FA Code'}
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={twoFactorToken}
                    onChange={(e) => setTwoFactorToken(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="w-full text-center tracking-widest text-lg font-mono font-bold h-12 rounded-xl border border-[#D7E3F1] bg-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#0F4C81] focus:border-transparent transition-all"
                    autoFocus
                  />
                </div>
              </div>
            )}

            {/* Primary Action Button */}
            <button
              type="submit"
              disabled={!mounted || isSubmitting || (requires2FA && twoFactorToken.length < 6)}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#F2B233] px-4 py-3 text-sm font-bold text-[#0F2438] shadow-md hover:bg-[#e0a42b] active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px] mt-2"
            >
              <LogIn className="h-4 w-4" />
              <span>
                {isSubmitting
                  ? locale === 'am'
                    ? 'በማረጋገጥ ላይ...'
                    : 'Verifying...'
                  : requires2FA
                    ? locale === 'am'
                      ? 'ኮዱን አረጋግጥና ግባ'
                      : 'Verify Code & Sign In'
                    : locale === 'am'
                      ? 'ወደ አስተዳደር ግባ'
                      : 'Sign In to Admin'}
              </span>
            </button>

            {requires2FA && (
              <button
                type="button"
                onClick={() => {
                  setRequires2FA(false);
                  setTwoFactorToken('');
                }}
                className="w-full text-center text-xs text-[#5B6B7C] hover:text-[#0F4C81] transition-colors py-1"
              >
                {locale === 'am' ? '← ወደ ኋላ ተመለስ' : '← Back to password'}
              </button>
            )}
          </form>
        </FormProvider>
      </div>

      {/* Back to Home Link (NO registration link, NO public menu, NO social links) */}
      <div className="mt-6 text-center">
        <Link
          href={`/${locale}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/80 hover:text-white transition-colors py-1 px-3 rounded-lg hover:bg-white/10"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>{locale === 'am' ? 'ወደ ዋናው ድረ-ገጽ ተመለስ' : 'Return to Main Website'}</span>
        </Link>
      </div>
    </div>
  );
}

export default function AdminLoginPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between bg-gradient-to-br from-[#0A2E52] via-[#082442] to-[#041527] px-4 py-8 sm:px-6 lg:px-8 text-white selection:bg-[#F2B233] selection:text-[#0F2438]">
      {/* Top micro-bar: Language Switcher only */}
      <header className="w-full max-w-5xl mx-auto flex items-center justify-between pb-4">
        <Link
          href={`/${locale}`}
          className="flex items-center gap-2.5 opacity-90 hover:opacity-100 transition-opacity"
          aria-label="Home"
        >
          <SchoolLogo size={36} />
          <span className="font-bold text-sm tracking-wide hidden sm:inline text-white/90">
            {locale === 'am' ? 'አዕማደ ሰላም' : 'Aemade Selam'}
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <LanguageSwitcher currentLocale={locale as 'am' | 'en'} />
        </div>
      </header>

      {/* Center Form Container */}
      <main className="flex-1 flex flex-col items-center justify-center my-auto py-6">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="relative mb-3 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-[#F2B233]/20 blur-xl scale-125" />
            <div className="relative rounded-full p-2 bg-white/10 border border-white/20 shadow-xl backdrop-blur-sm">
              <SchoolLogo size={68} />
            </div>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-wide">
            {locale === 'am' ? 'አዕማደ ሰላም ሰንበት ትምህርት ቤት' : 'Aemade Selam Sunday School'}
          </h1>
          <p className="text-xs sm:text-sm text-[#F2B233] font-medium mt-1">
            {locale === 'am' ? 'የአስተዳደርና አመራር ፖርታል' : 'Administrative Management Portal'}
          </p>
        </div>

        <Suspense fallback={<div className="h-96 w-full max-w-md bg-white/5 rounded-2xl animate-pulse" />}>
          <AdminLoginForm locale={locale} />
        </Suspense>
      </main>

      {/* Footer minimal info */}
      <footer className="w-full max-w-5xl mx-auto pt-6 text-center text-[11px] text-white/50">
        <p>
          © {new Date().getFullYear()} {locale === 'am' ? 'አዕማደ ሰላም ሰንበት ትምህርት ቤት። መብቱ በሕግ የተጠበቀ ነው።' : 'Aemade Selam Sunday School. All rights reserved.'}
        </p>
        <p className="mt-0.5 text-white/40">
          {locale === 'am'
            ? 'ይህ ሥርዓት ለተፈቀደላቸው ሠራተኞች ብቻ የተዘጋጀ ጥብቅ የአስተዳደር ክፍል ነው።'
            : 'This system is strictly restricted to authorized staff and personnel.'}
        </p>
      </footer>
    </div>
  );
}
