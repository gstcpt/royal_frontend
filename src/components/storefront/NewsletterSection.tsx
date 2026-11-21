'use client';

import React, { useState } from 'react';
import { Mail, ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';
import { useCmsConfig } from '@/providers/CmsConfigProvider';

export function NewsletterSection() {
  const { config } = useCmsConfig();
  const home = config.views.home;
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setStatus('idle');
    setMessage('');
    try {
      const res = await fetch('/api/v1/storefront-cms/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), source: 'homepage' }),
      });
      if (res.ok) {
        setStatus('success');
        setMessage('Merci ! Vous recevrez nos nouveaux arrivages Royal et codes promos exclusifs.');
        setEmail('');
      } else {
        const err = await res.json().catch(() => null);
        setStatus('error');
        setMessage(err?.message || 'Veuillez vérifier votre adresse e-mail.');
      }
    } catch {
      setStatus('error');
      setMessage('Erreur réseau, veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-14 md:py-20 bg-[#FBF9F4] border-b border-[#E6E1D6]">
      <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20">
        <div className="bg-white rounded-3xl border border-[#E6E1D6] p-8 sm:p-12 lg:p-14 shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
          <div className="max-w-xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--royal-gold-light)] border border-[var(--royal-border)] text-xs font-bold text-[var(--royal-gold-dark)] uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-[var(--royal-primary)]" />
              <span>{home.newsletterTag || 'Club Privilège & Alertes Promo'}</span>
            </div>
            <h2 className="font-heading font-extrabold text-2xl sm:text-4xl text-[var(--royal-ink)] tracking-tight">
              {home.newsletterTitle || 'Ne manquez aucune promotion Royal'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {home.newsletterSubtitle || 'Inscrivez-vous à notre newsletter pour recevoir nos nouveaux arrivages Royal, nos ventes flash et nos codes promo exclusifs en avant-première.'}
            </p>
          </div>

          <div className="w-full lg:max-w-md space-y-3">
            {status === 'success' ? (
              <div className="p-4 rounded-2xl bg-[var(--royal-gold-light)] border border-[var(--royal-border)] text-[var(--royal-gold-dark)] text-xs sm:text-sm font-semibold flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-[var(--royal-primary)] shrink-0" />
                <span>{message}</span>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Mail className="w-4 h-4 text-[var(--royal-primary)] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={home.newsletterPlaceholder || 'votre.email@exemple.com'}
                    className="w-full pl-11 pr-4 py-3.5 rounded-full bg-[var(--royal-silver-light)] border border-[var(--royal-border)] text-sm text-[var(--royal-ink)] focus:outline-none focus:border-[var(--royal-primary)] transition"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    background: 'linear-gradient(to right, var(--royal-primary), var(--royal-primary-hover))',
                    color: 'var(--royal-primary-text)',
                  }}
                  className="px-7 py-3.5 rounded-full hover:opacity-95 text-xs font-bold uppercase tracking-wider inline-flex items-center justify-center gap-2 transition shadow-md cursor-pointer disabled:opacity-60 shrink-0"
                >
                  <span>{loading ? 'Envoi...' : home.newsletterButtonText || "S'inscrire"}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}
            {status === 'error' && (
              <p className="text-xs text-rose-600 font-medium pl-2">{message}</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
