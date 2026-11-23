'use client';

import React, { useEffect, useState } from 'react';
import { Star, CheckCircle2, AlertCircle } from 'lucide-react';
import { Modal } from '@/components/ui';
import { useAuthStore } from '@/stores/auth.store';
import { useReviewStore } from '@/stores/review.store';

interface ProductReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    id: string;
    name: string;
    sku?: string;
    brandName?: string;
    rating?: number;
    reviewCount?: number;
  };
}

export function ProductReviewModal({
  isOpen,
  onClose,
  product,
}: ProductReviewModalProps) {
  const { isAuthenticated, user } = useAuthStore();
  const { reviews, submitReview } = useReviewStore();
  const existing = reviews[product.id];

  const [rating, setRating] = useState<number>(existing?.rating || 5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [title, setTitle] = useState<string>(existing?.title || '');
  const [body, setBody] = useState<string>(existing?.body || '');
  const [authorName, setAuthorName] = useState<string>('');
  const [authorEmail, setAuthorEmail] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const prev = reviews[product.id];
    setRating(prev?.rating || 5);
    setHoverRating(0);
    setTitle(prev?.title || '');
    setBody(prev?.body || '');
    setFeedback(null);
  }, [isOpen, product.id, reviews]);

  const activeStar = hoverRating || rating;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) {
      setFeedback({ type: 'error', text: 'Veuillez saisir votre commentaire sur cet article.' });
      return;
    }
    setSubmitting(true);
    setFeedback(null);
    const res = await submitReview(
      product.id,
      {
        rating,
        title: title.trim() || undefined,
        body: body.trim(),
        ...(!isAuthenticated
          ? {
              authorName: authorName.trim() || 'Client Royal',
              authorEmail: authorEmail.trim() || undefined,
            }
          : {}),
      },
      product.reviewCount || 0,
      product.rating || 5,
    );
    setSubmitting(false);

    if (res.ok) {
      setFeedback({
        type: 'success',
        text: res.isEdit
          ? 'Votre avis a été mis à jour avec succès.'
          : 'Merci ! Votre avis a été publié avec succès.',
      });
      setTimeout(() => {
        onClose();
      }, 900);
    } else {
      setFeedback({ type: 'error', text: res.error || "Impossible d'envoyer l'avis." });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={existing ? 'Modifier mon avis' : 'Noter & commenter cet article'}
      subtitle={`${product.brandName || 'Royal'} • ${product.name}${product.sku ? ` (${product.sku})` : ''}`}
      size="md"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        {feedback && (
          <div
            className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
              feedback.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-700'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-[#1D232E] mb-2">
            Votre note ({activeStar}/5) *
          </label>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(star)}
                aria-label={`${star} étoiles`}
                className="p-1.5 rounded-xl bg-[#FBF9F4] border border-[#E6E1D6] hover:border-amber-400 transition cursor-pointer"
              >
                <Star
                  className={`w-6 h-6 transition ${
                    star <= activeStar
                      ? 'text-amber-500 fill-amber-400'
                      : 'text-slate-300'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        {!isAuthenticated ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Votre nom *
              </label>
              <input
                type="text"
                required
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="Ex: Amira Ben Salah"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6E1D6] bg-white text-xs text-[#1D232E] focus:outline-none focus:border-[var(--royal-primary)]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Adresse email (optionnel)
              </label>
              <input
                type="email"
                value={authorEmail}
                onChange={(e) => setAuthorEmail(e.target.value)}
                placeholder="client@exemple.tn"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6E1D6] bg-white text-xs text-[#1D232E] focus:outline-none focus:border-[var(--royal-primary)]"
              />
            </div>
          </div>
        ) : (
          <div className="px-3.5 py-2.5 rounded-xl bg-[#FBF9F4] border border-[#E6E1D6] text-xs text-slate-600">
            Publication en tant que <strong className="text-[#1D232E]">{user?.firstName} {user?.lastName}</strong>
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Titre de votre avis (optionnel)
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Excellent rapport qualité/prix"
            className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6E1D6] bg-white text-xs text-[#1D232E] focus:outline-none focus:border-[var(--royal-primary)]"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Commentaire *
          </label>
          <textarea
            required
            rows={4}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Partagez votre expérience avec ce produit..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6E1D6] bg-white text-xs text-[#1D232E] focus:outline-none focus:border-[var(--royal-primary)]"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#ECE7DE]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-full border border-neutral-200 text-neutral-700 hover:bg-neutral-50 text-xs font-semibold cursor-pointer"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 rounded-full bg-[var(--royal-primary)] hover:bg-[var(--royal-primary-hover)] text-[var(--royal-primary-text)] text-xs font-bold uppercase tracking-wider shadow-sm transition disabled:opacity-50 cursor-pointer"
          >
            {submitting ? 'Publication...' : existing ? 'Mettre à jour' : 'Publier mon avis'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
