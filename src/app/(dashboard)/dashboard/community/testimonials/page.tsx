'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  MessageSquareQuote,
  Star,
  Clock,
  Trash2,
  Eye,
  EyeOff,
  RefreshCw,
  Package,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import {
  DataTable,
  ColumnDef,
  Button,
  Badge,
  Modal,
  Toast,
  Breadcrumb,
  DeleteConfirmModal,
} from '@/components/ui';
import { fetchApi } from '@/lib/api';
import { cn } from '@/lib/utils';

interface ReviewAdminItem {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  authorName: string;
  authorEmail: string;
  rating: number;
  title?: string | null;
  comment: string;
  isVerifiedPurchase: boolean;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  updatedAt: string;
}

function formatRelativeTime(dateString: string): string {
  const diffMs = Date.now() - new Date(dateString).getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  if (diffMins < 1) return 'À l’instant';
  if (diffMins < 60) return `Il y a ${diffMins} min`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `Il y a ${diffHours} h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Hier';
  if (diffDays < 7) return `Il y a ${diffDays} jours`;
  return new Date(dateString).toLocaleDateString('fr-FR');
}

export default function TestimonialsPage() {
  const [reviews, setReviews] = React.useState<ReviewAdminItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [viewDetailItem, setViewDetailItem] = React.useState<ReviewAdminItem | null>(null);
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);
  const [toastType, setToastType] = React.useState<'success' | 'info' | 'error'>('success');
  const [singleDeleteId, setSingleDeleteId] = React.useState<string | null>(null);

  const loadReviews = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchApi('/storefront-cms/admin/reviews');
      const list = Array.isArray(res) ? res : res?.data || [];
      setReviews(list);
    } catch {
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const handleStatusChange = async (id: string, newStatus: 'APPROVED' | 'REJECTED' | 'PENDING') => {
    setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r)));
    try {
      await fetchApi(`/storefront-cms/admin/reviews/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      setToastType(newStatus === 'APPROVED' ? 'success' : 'info');
      setToastMessage(
        newStatus === 'APPROVED'
          ? 'Commentaire visible sur la fiche article.'
          : newStatus === 'REJECTED'
          ? 'Commentaire masqué sur la boutique.'
          : 'Commentaire mis en attente.'
      );
    } catch {
      setToastType('error');
      setToastMessage('Erreur lors de la modification du statut.');
      loadReviews();
    }
  };

  const handleConfirmSingleDelete = async () => {
    if (!singleDeleteId) return;
    const id = singleDeleteId;
    setReviews((prev) => prev.filter((r) => r.id !== id));
    setSingleDeleteId(null);
    try {
      await fetchApi(`/storefront-cms/admin/reviews/${id}`, { method: 'DELETE' });
      setToastType('info');
      setToastMessage('Commentaire supprimé définitivement.');
    } catch {
      setToastType('error');
      setToastMessage('Impossible de supprimer ce commentaire.');
      loadReviews();
    }
  };

  const hiddenCount = reviews.filter((r) => r.status === 'REJECTED').length;
  const visibleCount = reviews.filter((r) => r.status === 'APPROVED').length;

  const columns: ColumnDef<ReviewAdminItem>[] = [
    {
      key: 'authorName',
      header: 'Auteur & Client',
      sortable: true,
      render: (item) => {
        const initials = item.authorName
          .split(/\s+/)
          .filter(Boolean)
          .slice(0, 2)
          .map((p) => p[0]?.toUpperCase() || '')
          .join('');
        return (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-amber-100 border border-amber-200 text-amber-900 font-black text-xs flex items-center justify-center shrink-0">
              {initials || 'C'}
            </div>
            <div className="min-w-0">
              <div className="font-extrabold text-neutral-900 text-xs flex items-center gap-1.5">
                <span className="truncate">{item.authorName}</span>
                {item.isVerifiedPurchase && (
                  <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-bold">
                    Vérifié
                  </span>
                )}
              </div>
              <div className="text-[10px] text-neutral-400 truncate">{item.authorEmail}</div>
            </div>
          </div>
        );
      },
    },
    {
      key: 'rating',
      header: 'Note',
      sortable: true,
      render: (item) => (
        <div className="flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={cn(
                'w-3.5 h-3.5',
                star <= item.rating ? 'fill-amber-400 text-amber-400' : 'text-neutral-200'
              )}
            />
          ))}
        </div>
      ),
    },
    {
      key: 'comment',
      header: 'Commentaire',
      render: (item) => {
        const isLong = item.comment.length > 60;
        const snippet = isLong ? `${item.comment.slice(0, 60)}...` : item.comment;
        return (
          <div className="space-y-1 max-w-md">
            <p className="text-xs text-neutral-700 leading-relaxed">&quot;{snippet}&quot;</p>
            {isLong && (
              <button
                type="button"
                onClick={() => setViewDetailItem(item)}
                className="text-[10px] font-bold text-neutral-900 underline hover:text-amber-600 cursor-pointer"
              >
                Voir tout
              </button>
            )}
          </div>
        );
      },
    },
    {
      key: 'productName',
      header: 'Article Concerné',
      sortable: true,
      render: (item) => (
        <Link
          href={`/articles/${item.productSlug}`}
          target="_blank"
          className="inline-flex items-center gap-1.5 text-xs text-neutral-800 hover:text-amber-700 font-semibold"
        >
          <Package className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span className="truncate max-w-[200px]">{item.productName}</span>
          <ExternalLink className="w-3 h-3 text-neutral-400 shrink-0" />
        </Link>
      ),
    },
    {
      key: 'createdAt',
      header: 'Date',
      sortable: true,
      render: (item) => (
        <div
          className="flex items-center gap-1 text-[11px] text-neutral-500 font-mono"
          title={new Date(item.updatedAt || item.createdAt).toLocaleString('fr-FR')}
        >
          <Clock className="w-3 h-3 text-neutral-400" />
          <span>{formatRelativeTime(item.updatedAt || item.createdAt)}</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Visibilité',
      sortable: true,
      render: (item) => (
        <Badge
          variant={
            item.status === 'APPROVED' ? 'success' : item.status === 'REJECTED' ? 'outline' : 'warning'
          }
        >
          {item.status === 'APPROVED'
            ? 'Visible'
            : item.status === 'REJECTED'
            ? 'Masqué'
            : 'En attente'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (item) => {
        const isVisible = item.status === 'APPROVED';
        return (
          <div className="flex items-center justify-end gap-1.5">
            <button
              type="button"
              onClick={() => setViewDetailItem(item)}
              title="Lire le commentaire complet"
              className="w-8 h-8 rounded-lg border border-neutral-200 text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100 flex items-center justify-center transition cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleStatusChange(item.id, isVisible ? 'REJECTED' : 'APPROVED')}
              title={isVisible ? 'Masquer ce commentaire sur la boutique' : 'Réafficher ce commentaire'}
              className={cn(
                'w-8 h-8 rounded-lg border flex items-center justify-center transition cursor-pointer',
                isVisible
                  ? 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              )}
            >
              {isVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
            <button
              type="button"
              onClick={() => setSingleDeleteId(item.id)}
              title="Supprimer définitivement"
              className="w-8 h-8 rounded-lg border border-neutral-200 text-neutral-400 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 flex items-center justify-center transition cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-50 text-amber-700 border border-amber-200 rounded-2xl">
              <MessageSquareQuote className="h-5 w-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-heading font-black text-neutral-900 tracking-tight">
                  Modération des Avis &amp; Commentaires
                </h1>
                <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 text-[11px] font-bold rounded-full border border-emerald-200">
                  {visibleCount} visible{visibleCount > 1 ? 's' : ''}
                </span>
                {hiddenCount > 0 && (
                  <span className="px-2.5 py-0.5 bg-neutral-100 text-neutral-600 text-[11px] font-bold rounded-full border border-neutral-200">
                    {hiddenCount} masqué{hiddenCount > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-500 mt-0.5">
                Visibles par défaut dès soumission. Les équipes ROOT, Super Admin et Website Manager peuvent afficher, masquer ou supprimer tout avis.
              </p>
            </div>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={loadReviews}
            className="text-xs font-semibold shrink-0"
            title="Actualiser"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Actualiser</span>
          </Button>
        </div>
        <div className="pt-2 border-t border-slate-100">
          <Breadcrumb
            items={[
              { label: 'Communauté', href: '/dashboard/section/community' },
              { label: 'Avis & Commentaires Articles' },
            ]}
          />
        </div>
      </div>

      <DataTable<ReviewAdminItem>
        data={reviews}
        columns={columns}
        keyExtractor={(item) => item.id}
        searchPlaceholder="Rechercher par auteur, commentaire ou article..."
        searchKeys={['authorName', 'comment', 'productName']}
        statusOptions={[
          { label: 'Visibles', value: 'APPROVED' },
          { label: 'Masqués', value: 'REJECTED' },
          { label: 'En attente', value: 'PENDING' },
        ]}
        supportedModes={['table', 'list']}
        defaultMode="table"
        exportFileName="avis_commentaires_royal"
      />

      {viewDetailItem && (
        <Modal
          isOpen={!!viewDetailItem}
          onClose={() => setViewDetailItem(null)}
          title={`Commentaire de ${viewDetailItem.authorName}`}
          type="details"
          size="lg"
          footer={
            <div className="flex items-center justify-end gap-2 w-full">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const targetStatus = viewDetailItem.status === 'APPROVED' ? 'REJECTED' : 'APPROVED';
                  handleStatusChange(viewDetailItem.id, targetStatus);
                  setViewDetailItem({ ...viewDetailItem, status: targetStatus });
                }}
              >
                {viewDetailItem.status === 'APPROVED' ? 'Masquer ce commentaire' : 'Réafficher ce commentaire'}
              </Button>
              <Button variant="primary" size="sm" onClick={() => setViewDetailItem(null)}>
                Fermer
              </Button>
            </div>
          }
        >
          <div className="p-6 space-y-4 text-xs">
            <div className="p-4 rounded-2xl bg-[#F8F9FA] border border-neutral-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-neutral-900">{viewDetailItem.productName}</span>
                <div className="flex text-amber-500">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`w-4 h-4 ${s <= viewDetailItem.rating ? 'fill-current' : 'text-neutral-300'}`}
                    />
                  ))}
                </div>
              </div>
              <p className="text-neutral-700 leading-relaxed whitespace-pre-line">
                {viewDetailItem.comment}
              </p>
            </div>
          </div>
        </Modal>
      )}

      <DeleteConfirmModal
        isOpen={!!singleDeleteId}
        onClose={() => setSingleDeleteId(null)}
        onConfirm={handleConfirmSingleDelete}
        title="Supprimer ce commentaire ?"
        message="Cette action supprimera définitivement l'avis client de la base de données."
      />

      <Toast
        isOpen={!!toastMessage}
        message={toastMessage || ''}
        type={toastType}
        onClose={() => setToastMessage(null)}
      />
    </div>
  );
}
