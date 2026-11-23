'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, LoginDto } from '@royal/shared-validators';
import { useAuthStore } from '@/stores/auth.store';
import { useI18nStore } from '@/stores/i18n.store';
import { Lock, Mail, ArrowRight, AlertCircle, CheckCircle2, KeyRound, RefreshCw } from 'lucide-react';

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const explicitRedirect = searchParams.get('redirect');

  const { login, verifyEmail, resendVerification } = useAuthStore();
  const { t } = useI18nStore();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [needsVerifyEmail, setNeedsVerifyEmail] = useState<string | null>(null);
  const [verifyOtp, setVerifyOtp] = useState('');
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [resendingOtp, setResendingOtp] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<LoginDto>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const watchedEmail = watch('email');

  const onSubmit = async (data: LoginDto) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(true);
    try {
      const user = await login(data);
      setSuccessMessage(`Bienvenue, ${user.firstName} ${user.lastName} !`);
      const targetUrl = explicitRedirect || '/dashboard';
      setTimeout(() => {
        router.push(targetUrl);
      }, 500);
    } catch (err: any) {
      const msg = String(err?.message || 'Identifiants invalides ou problème de connexion.');
      if (msg.includes('EMAIL_NOT_VERIFIED')) {
        setNeedsVerifyEmail(data.email.trim().toLowerCase());
        setErrorMessage(msg.replace('EMAIL_NOT_VERIFIED:', '').trim());
      } else {
        setNeedsVerifyEmail(null);
        setErrorMessage(msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyInlineOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!needsVerifyEmail || verifyOtp.trim().length !== 6) return;
    setVerifyingOtp(true);
    setErrorMessage(null);
    try {
      const user = await verifyEmail(needsVerifyEmail, verifyOtp.trim());
      setSuccessMessage(`Email vérifié ! Bienvenue ${user.firstName}.`);
      setTimeout(() => router.push(explicitRedirect || '/dashboard'), 600);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Code de vérification invalide ou expiré.');
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleResendInlineOtp = async () => {
    if (!needsVerifyEmail) return;
    setResendingOtp(true);
    setErrorMessage(null);
    try {
      const res = await resendVerification(needsVerifyEmail);
      setSuccessMessage(res?.message || `Code envoyé à ${needsVerifyEmail}.`);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Impossible de renvoyer le code.');
    } finally {
      setResendingOtp(false);
    }
  };

  return (
    <div className="bg-white border border-neutral-200 rounded-[28px] p-6 sm:p-10 shadow-xl">
      <div className="mb-8 text-center">
        <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 block mb-2">
          {t('auth.privilege_space')}
        </span>
        <h1 className="text-2xl sm:text-3xl font-heading font-black text-neutral-900 tracking-tight">
          {t('auth.login_title')}
        </h1>
        <p className="text-xs sm:text-sm text-neutral-500 mt-2 font-normal">
          {t('auth.login_subtitle')}
        </p>
      </div>

      {errorMessage && (
        <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 flex items-start gap-3 text-red-700 text-xs animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="flex-1 leading-relaxed font-medium">{errorMessage}</div>
        </div>
      )}

      {successMessage && (
        <div className="mb-6 p-4 rounded-2xl bg-[var(--royal-gold-light)] text-[var(--royal-gold-dark)] border border-[var(--royal-primary)]/40 flex items-start gap-3 text-xs animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-[#F59E0B]" />
          <div className="flex-1 font-semibold">{successMessage}</div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-700 mb-2">
            {t('auth.email_label')}
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-neutral-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              placeholder={t('auth.email_placeholder')}
              {...register('email')}
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-neutral-200 bg-[#F8F9FA] text-neutral-900 placeholder:text-neutral-400 text-xs sm:text-sm focus:outline-none focus:border-neutral-900 focus:bg-white transition-all"
            />
          </div>
          {errors.email && (
            <p className="text-xs text-red-600 mt-1.5 font-medium">
              {errors.email.message}
            </p>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-700">
              {t('auth.password_label')}
            </label>
            <Link
              href="/forgot-password"
              className="text-xs text-neutral-500 hover:text-neutral-900 font-medium transition"
            >
              {t('auth.forgot_password')}
            </Link>
          </div>
          <div className="relative">
            <Lock className="w-4 h-4 text-neutral-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              placeholder="••••••••"
              {...register('password')}
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-neutral-200 bg-[#F8F9FA] text-neutral-900 placeholder:text-neutral-400 text-xs sm:text-sm focus:outline-none focus:border-neutral-900 focus:bg-white transition-all"
            />
          </div>
          {errors.password && (
            <p className="text-xs text-red-600 mt-1.5 font-medium">
              {errors.password.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-4 px-6 rounded-full font-bold text-xs uppercase tracking-widest text-[var(--royal-primary-text)] bg-[var(--royal-primary)] hover:bg-[var(--royal-primary-hover)] focus:outline-none disabled:opacity-60 shadow-lg shadow-amber-900/10 transition-all flex items-center justify-center gap-2 mt-4"
        >
          {isSubmitting ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <span>{t('auth.login_submit')}</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {needsVerifyEmail !== null && (
        <form
          onSubmit={handleVerifyInlineOtp}
          className="mt-5 p-4 rounded-2xl bg-[#FBF6E8] border border-[#E6D6A6] space-y-3"
        >
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="font-bold text-[#9A7414] flex items-center gap-1.5 min-w-0 truncate">
              <KeyRound className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{t('auth.confirm_prefix')}</span>
            </span>
            <button
              type="button"
              onClick={handleResendInlineOtp}
              disabled={resendingOtp || !needsVerifyEmail.trim()}
              className="inline-flex items-center gap-1 font-bold text-[#1D232E] hover:underline cursor-pointer shrink-0 disabled:opacity-40"
            >
              <RefreshCw className={`w-3 h-3 ${resendingOtp ? 'animate-spin' : ''}`} />
              <span>{t('auth.resend')}</span>
            </button>
          </div>
          <input
            type="email"
            required
            placeholder={t('auth.email_placeholder')}
            value={needsVerifyEmail}
            onChange={(e) => setNeedsVerifyEmail(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-[#E6D6A6] bg-white text-xs text-neutral-900"
          />
          <div className="flex gap-2">
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              required
              placeholder={t('auth.otp_6_placeholder')}
              value={verifyOtp}
              onChange={(e) => setVerifyOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="flex-1 min-w-0 px-3 py-2 rounded-xl border border-[#E6D6A6] bg-white font-mono text-center tracking-widest text-xs"
            />
            <button
              type="submit"
              disabled={verifyingOtp || verifyOtp.length !== 6 || !needsVerifyEmail.trim()}
              className="px-4 py-2 rounded-xl bg-[var(--royal-primary)] text-white text-xs font-bold cursor-pointer disabled:opacity-50 shrink-0"
            >
              {verifyingOtp ? '...' : t('auth.validate')}
            </button>
          </div>
        </form>
      )}

      <div className="mt-8 pt-6 border-t border-neutral-100 text-center space-y-3">
        <button
          type="button"
          onClick={() =>
            setNeedsVerifyEmail((prev) =>
              prev !== null ? null : (watchedEmail || '').trim().toLowerCase(),
            )
          }
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#9A7414] hover:underline cursor-pointer"
        >
          <KeyRound className="w-3.5 h-3.5" />
          <span>{t('auth.verify_email_link')}</span>
        </button>
        <p className="text-xs text-neutral-500">
          {t('auth.no_account')}{' '}
          <Link
            href="/register"
            className="text-neutral-900 font-bold hover:underline ml-1"
          >
            {t('auth.create_account')}
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-neutral-400 text-xs">
          Chargement de l’espace sécurisé...
        </div>
      }
    >
      <LoginFormContent />
    </Suspense>
  );
}
