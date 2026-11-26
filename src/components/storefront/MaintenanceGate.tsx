'use client';

import React from 'react';
import Link from 'next/link';
import { Wrench, Mail, Phone, ShieldAlert, ArrowRight } from 'lucide-react';
import { useCmsConfig } from '@/providers/CmsConfigProvider';
import { useAuthStore } from '@/stores/auth.store';

export function MaintenanceGate({ children }: { children: React.ReactNode }) {
  const { config } = useCmsConfig();
  const { user, isAuthenticated } = useAuthStore();
  const isMaintenance = Boolean(config.maintenance?.enabled);

  if (!isMaintenance) {
    return <>{children}</>;
  }

  const isStaffAdmin =
    isAuthenticated &&
    Boolean(
      user?.roles?.some((r) =>
        ['ROOT', 'SUPER_ADMIN', 'WEBSITE_MANAGER'].includes(String(r).toUpperCase()),
      ),
    );

  if (isStaffAdmin) {
    return (
      <>
        <div className="bg-[var(--royal-gold-light)] border-b border-[var(--royal-primary)]/40 px-4 py-2 text-center text-xs font-bold text-[var(--royal-gold-dark)] flex items-center justify-center gap-2 z-[60]">
          <Wrench className="w-3.5 h-3.5 text-[var(--royal-primary)] shrink-0" />
          <span>
            Mode Maintenance Boutique actif (aperçu réservé à l&apos;équipe — masqué aux visiteurs).
          </span>
          <Link href="/dashboard/settings" className="underline text-[var(--royal-ink)]">
            Désactiver dans Paramètres
          </Link>
        </div>
        {children}
      </>
    );
  }

  return (
    <div className="min-h-[75vh] bg-[var(--royal-bg)] flex items-center justify-center px-4 py-16">
      <div className="max-w-xl w-full bg-[var(--royal-card)] border border-[var(--royal-border)] rounded-3xl p-8 sm:p-10 shadow-xl text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-[var(--royal-gold-light)] border border-[var(--royal-border)] flex items-center justify-center mx-auto text-[var(--royal-primary)]">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <span className="inline-block px-3 py-1 rounded-full bg-[var(--royal-gold-light)] border border-[var(--royal-border)] text-[10px] font-bold uppercase tracking-widest text-[var(--royal-gold-dark)]">
            {config.appName || 'Royal'} — Maintenance
          </span>
          <h1 className="font-heading text-2xl sm:text-3xl font-black text-[var(--royal-ink)]">
            Boutique momentanément indisponible
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            {config.maintenance?.message ||
              'Notre boutique est momentanément en maintenance technique. Merci de votre patience.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-2 text-xs text-slate-600">
          {config.identity.phone && (
            <a
              href={`tel:${config.identity.phone}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[var(--royal-silver-light)] border border-[var(--royal-border)] font-semibold text-[var(--royal-ink)]"
            >
              <Phone className="w-3.5 h-3.5 text-[var(--royal-primary)]" />
              <span>{config.identity.phone}</span>
            </a>
          )}
          {config.identity.email && (
            <a
              href={`mailto:${config.identity.email}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[var(--royal-silver-light)] border border-[var(--royal-border)] font-semibold text-[var(--royal-ink)]"
            >
              <Mail className="w-3.5 h-3.5 text-[var(--royal-primary)]" />
              <span>{config.identity.email}</span>
            </a>
          )}
        </div>

        <div className="pt-2">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--royal-gold-dark)] hover:underline"
          >
            <span>Accès Administration Équipe</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
