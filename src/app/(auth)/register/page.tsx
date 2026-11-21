'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, RegisterDto } from '@royal/shared-validators';
import { useAuthStore } from '@/stores/auth.store';
import {
  Lock,
  Mail,
  User,
  Phone,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerAuth, isLoading } = useAuthStore();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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
      const user = await registerAuth(data);
      setSuccessMessage(`Félicitations ${user.firstName} ! Votre compte est créé.`);
      setTimeout(() => {
        router.push('/dashboard');
      }, 700);
    } catch (err: any) {
      setErrorMessage(
        err.message || 'Une erreur est survenue lors de votre inscription.',
      );
    }
  };

  return (
    <div className="bg-white border border-neutral-200 rounded-[28px] p-8 sm:p-10 shadow-xl">
      <div className="mb-8 text-center">
        <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 block mb-2">
          Espace Privilège
        </span>
        <h1 className="text-2xl sm:text-3xl font-heading font-black text-neutral-900 tracking-tight">
          Créer un Compte Client
        </h1>
        <p className="text-xs sm:text-sm text-neutral-500 mt-2">
          Rejoignez Royal et profitez de l’ensemble de nos services e-commerce
        </p>
      </div>

      {errorMessage && (
        <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-red-700 text-xs animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="flex-1 leading-snug font-medium">{errorMessage}</div>
        </div>
      )}

      {successMessage && (
        <div className="mb-5 p-3.5 rounded-xl bg-[var(--royal-gold-light)] text-[var(--royal-gold-dark)] border border-[var(--royal-primary)]/40 flex items-start gap-3 text-xs animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
          <div className="flex-1 font-semibold">{successMessage}</div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
              Prénom
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Prénom"
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
              Nom
            </label>
            <input
              type="text"
              placeholder="Nom"
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
            Adresse Email
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              placeholder="votre.email@exemple.com"
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
            Numéro de Téléphone (Optionnel)
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
            Mot de passe
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              placeholder="Minimum 8 caractères"
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
              <span>Finaliser l’inscription</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <div className="mt-6 pt-5 border-t border-neutral-100 text-center">
        <p className="text-xs text-neutral-500">
          Vous possédez déjà un compte ?{' '}
          <Link
            href="/login"
            className="text-neutral-900 font-bold hover:underline"
          >
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
