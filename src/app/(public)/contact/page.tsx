'use client';

import React, { useState } from 'react';
import {
  MapPin,
  Mail,
  Phone,
  MessageCircle,
  Send,
  CheckCircle2,
  AlertCircle,
  Instagram,
  Facebook,
} from 'lucide-react';
import { useCmsConfig } from '@/providers/CmsConfigProvider';

export default function ContactPage() {
  const { config } = useCmsConfig();
  const cCfg = config.views.contact;
  const order = Array.isArray(cCfg.sectionOrder) && cCfg.sectionOrder.length > 0 ? cCfg.sectionOrder : ['hero', 'mainGrid', 'map'];

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    subject: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess(false);

    try {
      const res = await fetch('/api/v1/storefront-cms/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: formData.fullName.trim(),
          phone: formData.phone.trim() || undefined,
          email: formData.email.trim() || undefined,
          subject: formData.subject.trim(),
          message: formData.message.trim(),
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => null);
        throw new Error(d?.message || 'Impossible d’envoyer votre message.');
      }
      setSuccess(true);
      setFormData({ fullName: '', phone: '', email: '', subject: '', message: '' });
    } catch (err: any) {
      setError(err?.message || 'Erreur lors de l’envoi du message.');
    } finally {
      setSubmitting(false);
    }
  };

  const infoCardBlock = cCfg.showInfoCards !== false && (
    <div className="lg:col-span-5 bg-gradient-to-br from-[var(--royal-bg)] via-white to-[var(--royal-silver-light)] text-[var(--royal-ink)] rounded-3xl p-8 sm:p-10 space-y-8 border border-[var(--royal-border)] shadow-lg">
      <div>
        <h2 className="font-heading text-2xl font-extrabold text-[var(--royal-ink)]">
          {cCfg.infoTitle || `${config.appName || 'Royal'} — Electro de Maison`}
        </h2>
        <p className="text-xs text-slate-500 mt-2">
          {cCfg.infoSubtitle || 'Équipement culinaire et électroménager partout en Tunisie.'}
        </p>
      </div>

      <div className="space-y-5 text-sm">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[var(--royal-gold-light)] border border-[var(--royal-border)] flex items-center justify-center shrink-0">
            <MapPin className="w-5 h-5 text-[var(--royal-primary)]" />
          </div>
          <div>
            <span className="text-[11px] uppercase tracking-wider text-slate-400 block">Adresse</span>
            <span className="font-semibold text-[var(--royal-ink)]">{config.identity.address || 'Mahdia 5100, Tunisia'}</span>
          </div>
        </div>

        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[var(--royal-gold-light)] border border-[var(--royal-border)] flex items-center justify-center shrink-0">
            <Phone className="w-5 h-5 text-[var(--royal-primary)]" />
          </div>
          <div>
            <span className="text-[11px] uppercase tracking-wider text-slate-400 block">Téléphone</span>
            <a href={`tel:${config.identity.phone || '+21648091914'}`} className="font-semibold text-[var(--royal-ink)] hover:text-[var(--royal-gold-dark)] transition">
              {config.identity.phone || '48 091 914'}
            </a>
          </div>
        </div>

        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[var(--royal-gold-light)] border border-[var(--royal-border)] flex items-center justify-center shrink-0">
            <MessageCircle className="w-5 h-5 text-[var(--royal-primary)]" />
          </div>
          <div>
            <span className="text-[11px] uppercase tracking-wider text-slate-400 block">WhatsApp Direct</span>
            <a
              href={`https://wa.me/${(config.identity.whatsapp || '21648091914').replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-[var(--royal-ink)] hover:text-[var(--royal-gold-dark)] transition"
            >
              {config.identity.whatsapp || '+216 48 091 914'}
            </a>
          </div>
        </div>

        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[var(--royal-gold-light)] border border-[var(--royal-border)] flex items-center justify-center shrink-0">
            <Mail className="w-5 h-5 text-[var(--royal-primary)]" />
          </div>
          <div>
            <span className="text-[11px] uppercase tracking-wider text-slate-400 block">Email</span>
            <a href={`mailto:${config.identity.email || 'royaltn24@gmail.com'}`} className="font-semibold text-[var(--royal-ink)] hover:text-[var(--royal-gold-dark)] transition">
              {config.identity.email || 'royaltn24@gmail.com'}
            </a>
          </div>
        </div>
      </div>

      {cCfg.showSocials !== false && (
        <div className="pt-6 border-t border-[var(--royal-border)]">
          <span className="text-xs font-bold uppercase tracking-widest text-slate-400 block mb-4">
            Réseaux Sociaux Officiels
          </span>
          <div className="flex flex-wrap gap-3">
            {config.identity.tiktok && (
              <a
                href={config.identity.tiktok}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-full bg-white border border-[var(--royal-border)] text-[var(--royal-ink)] hover:border-[var(--royal-primary)] hover:text-[var(--royal-gold-dark)] text-xs font-bold transition"
              >
                TikTok
              </a>
            )}
            {config.identity.instagram && (
              <a
                href={config.identity.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white border border-[var(--royal-border)] text-[var(--royal-ink)] hover:border-[var(--royal-primary)] hover:text-[var(--royal-gold-dark)] text-xs font-bold transition"
              >
                <Instagram className="w-3.5 h-3.5 text-[var(--royal-primary)]" />
                <span>Instagram</span>
              </a>
            )}
            {config.identity.facebook && (
              <a
                href={config.identity.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white border border-[var(--royal-border)] text-[var(--royal-ink)] hover:border-[var(--royal-primary)] hover:text-[var(--royal-gold-dark)] text-xs font-bold transition"
              >
                <Facebook className="w-3.5 h-3.5 text-[var(--royal-primary)]" />
                <span>Facebook</span>
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const formCardBlock = (
    <div className={`${cCfg.showInfoCards !== false ? 'lg:col-span-7' : 'lg:col-span-12'} bg-[var(--royal-silver-light)]/70 rounded-3xl border border-[var(--royal-border)] p-8 sm:p-10`}>
      <h2 className="font-heading text-2xl font-extrabold text-[var(--royal-ink)] mb-2">
        {cCfg.formTitle || 'Envoyer un message'}
      </h2>
      <p className="text-xs text-neutral-500 mb-6">
        {cCfg.formSubtitle || 'Votre demande est transmise directement à l’administration Royal pour une réponse rapide.'}
      </p>

      {success && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5 font-semibold">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Merci ! Votre message a bien été enregistré et transmis à notre équipe.</span>
        </div>
      )}
      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5 font-semibold">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1.5">Nom complet *</label>
            <input
              type="text"
              required
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              placeholder="Ex: Sami Ben Salem"
              className="w-full px-4 py-3 rounded-xl border border-[var(--royal-border)] bg-white text-sm focus:outline-none focus:border-[var(--royal-primary)]"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1.5">
              Téléphone {cCfg.phoneRequired ? '*' : '(Optionnel)'}
            </label>
            <input
              type="tel"
              required={cCfg.phoneRequired}
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="Ex: 48 091 914"
              className="w-full px-4 py-3 rounded-xl border border-[var(--royal-border)] bg-white text-sm focus:outline-none focus:border-[var(--royal-primary)]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1.5">
              Email {cCfg.emailRequired ? '*' : '(Optionnel)'}
            </label>
            <input
              type="email"
              required={cCfg.emailRequired}
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="votre@email.com"
              className="w-full px-4 py-3 rounded-xl border border-[var(--royal-border)] bg-white text-sm focus:outline-none focus:border-[var(--royal-primary)]"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1.5">
              Sujet {cCfg.subjectRequired ? '*' : '(Optionnel)'}
            </label>
            <input
              type="text"
              required={cCfg.subjectRequired}
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder="Ex: Renseignement sur un article"
              className="w-full px-4 py-3 rounded-xl border border-[var(--royal-border)] bg-white text-sm focus:outline-none focus:border-[var(--royal-primary)]"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-neutral-700 mb-1.5">Votre message *</label>
          <textarea
            rows={5}
            required
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            placeholder="Écrivez votre message détaillé ici..."
            className="w-full px-4 py-3 rounded-xl border border-[var(--royal-border)] bg-white text-sm focus:outline-none focus:border-[var(--royal-primary)]"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          style={{
            background: 'linear-gradient(to right, var(--royal-primary), var(--royal-primary-hover))',
            color: 'var(--royal-primary-text)',
          }}
          className="inline-flex items-center gap-2 px-8 py-4 rounded-full hover:opacity-95 text-xs font-bold uppercase tracking-widest shadow-lg transition disabled:opacity-50 cursor-pointer"
        >
          <Send className="w-4 h-4" />
          <span>{submitting ? 'Envoi en cours...' : cCfg.submitText || 'Envoyer le message'}</span>
        </button>
      </form>
    </div>
  );

  const sectionBlocks: Record<string, React.ReactNode> = {
    hero: (
      <div key="hero" className="text-center max-w-2xl mx-auto mb-14">
        <span className="inline-block px-3.5 py-1.5 rounded-full bg-[var(--royal-gold-light)] border border-[var(--royal-border)] text-xs font-bold uppercase tracking-widest text-[var(--royal-gold-dark)] mb-4">
          {cCfg.badgeText || `Service Client ${config.appName || 'Royal'}`}
        </span>
        <h1 className="font-heading text-3xl sm:text-5xl font-black text-[var(--royal-ink)] tracking-tight">
          {cCfg.title || 'Contactez Notre Équipe'}
        </h1>
        <p className="mt-3 text-sm text-slate-500">
          {cCfg.subtitle || 'Une question sur un appareil Royal, un suivi de livraison ou une demande de devis ? Écrivez-nous directement.'}
        </p>
      </div>
    ),
    mainGrid: (
      <div key="mainGrid" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {cCfg.layoutDirection === 'form-left' ? (
          <>
            {formCardBlock}
            {infoCardBlock}
          </>
        ) : (
          <>
            {infoCardBlock}
            {formCardBlock}
          </>
        )}
      </div>
    ),
    map: cCfg.showMap !== false ? (
      <div key="map" className="mt-10 rounded-3xl overflow-hidden border border-[var(--royal-border)] bg-white shadow-sm">
        <div className="px-6 py-4 bg-[var(--royal-bg)] border-b border-[var(--royal-border)] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <MapPin className="w-4 h-4 text-[var(--royal-primary)]" />
            <span className="font-heading font-bold text-sm text-[var(--royal-ink)]">
              {cCfg.mapTitle || `Localisation — ${config.appName || 'Royal'} (${config.identity.address || 'Mahdia 5100'})`}
            </span>
          </div>
          <a
            href="https://www.openstreetmap.org/?mlat=35.5047&mlon=11.0622#map=14/35.5047/11.0622"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-bold text-[var(--royal-gold-dark)] hover:underline"
          >
            Ouvrir l&apos;itinéraire →
          </a>
        </div>
        <iframe
          title="Carte Localisation Royal Mahdia"
          src={
            cCfg.mapEmbedUrl ||
            'https://www.openstreetmap.org/export/embed.html?bbox=11.02%2C35.48%2C11.10%2C35.53&layer=mapnik&marker=35.5047%2C11.0622'
          }
          style={{ height: `${Math.max(240, Number(cCfg.mapHeightPx || 380))}px` }}
          className="w-full border-0"
          loading="lazy"
        />
      </div>
    ) : null,
  };

  return (
    <div className="bg-[var(--royal-bg)] min-h-screen py-14 md:py-20">
      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12">
        {order.map((sec) => sectionBlocks[sec] || null)}
      </div>
    </div>
  );
}
