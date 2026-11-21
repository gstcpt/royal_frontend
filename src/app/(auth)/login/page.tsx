'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, LoginDto } from '@royal/shared-validators';
import { useAuthStore } from '@/stores/auth.store';
import { Lock, Mail, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const explicitRedirect = searchParams.get('redirect');

  const { login } = useAuthStore();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginDto>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

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
      setErrorMessage(
        err.message || 'Identifiants invalides ou problème de connexion.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white border border-neutral-200 rounded-[28px] p-8 sm:p-10 shadow-xl">
      <div className="mb-8 text-center">
        <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 block mb-2">
          Espace Privilège
        </span>
        <h1 className="text-2xl sm:text-3xl font-heading font-black text-neutral-900 tracking-tight">
          Connexion
        </h1>
        <p className="text-xs sm:text-sm text-neutral-500 mt-2 font-normal">
          Accédez à vos commandes, vos favoris et vos services exclusifs
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
            Adresse Email
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-neutral-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              placeholder="votre.email@exemple.com"
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
              Mot de passe
            </label>
            <Link
              href="/forgot-password"
              className="text-xs text-neutral-500 hover:text-neutral-900 font-medium transition"
            >
              Mot de passe oublié ?
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
              <span>Se Connecter</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <div className="mt-8 pt-6 border-t border-neutral-100 text-center">
        <p className="text-xs text-neutral-500">
          Vous n’avez pas encore de compte ?{' '}
          <Link
            href="/register"
            className="text-neutral-900 font-bold hover:underline ml-1"
          >
            Créer un compte
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
