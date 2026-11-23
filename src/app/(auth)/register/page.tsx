'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, RegisterDto } from '@royal/shared-validators';
import { useAuthStore } from '@/stores/auth.store';
import { useI18nStore } from '@/stores/i18n.store';
import {
  Lock,
  Mail,
  User,
  Phone,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  RefreshCw,
} from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerAuth, verifyEmail, resendVerification, isLoading } = useAuthStore();
  const { t } = useI18nStore();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [otpCode, setOtpCode] = useState('');
  const [resending, setResending] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterDto>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      phone: '',
    },
  });

  const onSubmit = async (data: RegisterDto) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const res = await registerAuth(data);
      if (res?.requiresEmailVerification) {
        setPendingEmail(res.email);
        setOtpCode('');
        setSuccessMessage(
          res.message ||
            `Un code de vérification à 6 chiffres vient d'être envoyé à ${res.email}.`,
        );
      } else {
        setSuccessMessage('Compte vérifié et connecté.');
        setTimeout(() => router.push('/account/home'), 700);
      }
    } catch (err: any) {
      setErrorMessage(
        err.message || 'Une erreur est survenue lors de votre inscription.',
      );
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingEmail || otpCode.trim().length !== 6) return;
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const user = await verifyEmail(pendingEmail, otpCode.trim());
      setSuccessMessage(`Adresse vérifiée ! Bienvenue ${user.firstName}.`);
      setTimeout(() => router.push('/dashboard'), 700);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Code invalide ou expiré.');
    }
  };

  const handleResend = async () => {
    if (!pendingEmail) return;
    setResending(true);
    setErrorMessage(null);
    try {
      const res = await resendVerification(pendingEmail);
      setSuccessMessage(res?.message || `Nouveau code envoyé à ${pendingEmail}.`);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Impossible de renvoyer le code.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="bg-white border border-neutral-200 rounded-[28px] p-6 sm:p-10 shadow-xl">
      <div className="mb-6 text-center">
        <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 block mb-2">
          {t('auth.privilege_space')}
        </span>
        <h1 className="text-2xl sm:text-3xl font-heading font-black text-neutral-900 tracking-tight">
          {t('auth.register_title')}
        </h1>
        <p className="text-xs sm:text-sm text-neutral-500 mt-2">
          {t('auth.register_subtitle')}
        </p>
      </div>

      {!pendingEmail && (
        <div className="mb-5 p-3.5 rounded-2xl bg-[#FBF6E8] border border-[#E6D6A6] flex items-start gap-2.5 text-xs text-[#9A7414]">
          <KeyRound className="w-4 h-4 shrink-0 mt-0.5 text-[#C59B27]" />
          <span>{t('auth.register_verify_notice')}</span>
        </div>
      )}

      {errorMessage && (
        <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-red-700 text-xs animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="flex-1 leading-snug font-medium">{errorMessage}</div>
        </div>
      )}

      {successMessage && (
        <div className="mb-5 p-3.5 rounded-xl bg-[var(--royal-gold-light)] text-[var(--royal-gold-dark)] border border-[var(--royal-primary)]/40 flex items-start gap-3 text-xs animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
          <div className="flex-1 font-semibold">{successMessage}</div>
        </div>
      )}

      {pendingEmail ? (
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <div className="p-4 rounded-2xl bg-[#FBF6E8] border border-[#E6D6A6] text-xs text-[#9A7414] leading-relaxed">
            {t('auth.otp_intro_1')} <strong>{t('auth.otp_intro_6')}</strong> {t('auth.otp_intro_2')}{' '}
            <strong className="font-mono break-all">{pendingEmail}</strong> {t('auth.otp_intro_3')}
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
              {t('auth.otp_label')}
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-[#C59B27] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                required
                placeholder="Ex: 482915"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-neutral-200 bg-[#F8F9FA] text-neutral-900 font-mono text-base tracking-[0.35em] text-center focus:outline-none focus:border-[#C59B27] focus:bg-white transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || otpCode.length !== 6}
            className="w-full py-4 px-6 rounded-full font-bold text-xs uppercase tracking-widest text-[var(--royal-primary-text)] bg-[var(--royal-primary)] hover:bg-[var(--royal-primary-hover)] disabled:opacity-60 shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>{t('auth.activate_account')}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-xs">
            <button
              type="button"
              onClick={() => setPendingEmail(null)}
              className="text-slate-500 hover:text-neutral-900 underline cursor-pointer"
            >
              {t('auth.edit_info')}
            </button>
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="inline-flex items-center gap-1.5 font-bold text-[#9A7414] hover:underline cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
              <span>{t('auth.resend_code')}</span>
            </button>
          </div>
        </form>
      ) : (
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
              {t('auth.first_name')}
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={t('auth.first_name')}
                {...register('firstName')}
                className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-neutral-200 bg-[#F8F9FA] text-neutral-900 placeholder:text-neutral-400 text-sm focus:outline-none focus:border-neutral-900 focus:bg-white transition-all"
              />
            </div>
            {errors.firstName && (
              <p className="text-xs text-red-600 mt-1 font-medium">
                {errors.firstName.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
              {t('auth.last_name')}
            </label>
            <input
              type="text"
              placeholder={t('auth.last_name')}
              {...register('lastName')}
              className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 bg-[#F8F9FA] text-neutral-900 placeholder:text-neutral-400 text-sm focus:outline-none focus:border-neutral-900 focus:bg-white transition-all"
            />
            {errors.lastName && (
              <p className="text-xs text-red-600 mt-1 font-medium">
                {errors.lastName.message}
              </p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
            {t('auth.email_label')}
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              placeholder={t('auth.email_placeholder')}
              {...register('email')}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 bg-[#F8F9FA] text-neutral-900 placeholder:text-neutral-400 text-sm focus:outline-none focus:border-neutral-900 focus:bg-white transition-all"
            />
          </div>
          {errors.email && (
            <p className="text-xs text-red-600 mt-1 font-medium">
              {errors.email.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
            {t('auth.phone_optional')}
          </label>
          <div className="relative">
            <Phone className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="tel"
              placeholder="+216 20 123 456"
              {...register('phone')}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 bg-[#F8F9FA] text-neutral-900 placeholder:text-neutral-400 text-sm focus:outline-none focus:border-neutral-900 focus:bg-white transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
            {t('auth.password_label')}
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              placeholder={t('auth.password_min8')}
              {...register('password')}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 bg-[#F8F9FA] text-neutral-900 placeholder:text-neutral-400 text-sm focus:outline-none focus:border-neutral-900 focus:bg-white transition-all"
            />
          </div>
          {errors.password && (
            <p className="text-xs text-red-600 mt-1 font-medium">
              {errors.password.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-4 px-6 rounded-full font-bold text-xs uppercase tracking-widest text-[var(--royal-primary-text)] bg-[var(--royal-primary)] hover:bg-[var(--royal-primary-hover)] focus:outline-none disabled:opacity-60 shadow-lg shadow-amber-900/10 transition-all flex items-center justify-center gap-2 mt-2"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <span>{t('auth.register_submit')}</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>
      )}

      <div className="mt-6 pt-5 border-t border-neutral-100 text-center">
        <p className="text-xs text-neutral-500">
          {t('auth.already_account')}{' '}
          <Link
            href="/login"
            className="text-neutral-900 font-bold hover:underline"
          >
            {t('auth.sign_in_link')}
          </Link>
        </p>
      </div>
    </div>
  );
}
