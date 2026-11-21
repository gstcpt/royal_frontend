'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  ExternalLink,
  Eye,
  EyeOff,
  Lock,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { fetchApi } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { ColumnDef, DataTable } from '@/components/ui/data-table';
import { Toast } from '@/components/ui/toast';

type VisibilityMode = 'PUBLIC' | 'PRIVATE';

interface ViewRouteItem {
  key: string;
  label: string;
  section: string;
  visibility: VisibilityMode;
}

const REGISTRY_VIEWS: ViewRouteItem[] = [
  // Vue Générale
  { key: '/dashboard', label: 'Tableau de bord', section: 'Vue Générale', visibility: 'PUBLIC' },
  // Communauté
  { key: '/dashboard/community/notifications', label: 'Notifications (Staff)', section: 'Communauté', visibility: 'PUBLIC' },
  { key: '/account/notifications', label: 'Notifications (Client)', section: 'Communauté', visibility: 'PUBLIC' },
  { key: '/dashboard/community/messages', label: 'Support (Staff)', section: 'Communauté', visibility: 'PUBLIC' },
  { key: '/account/messages', label: 'Support (Client)', section: 'Communauté', visibility: 'PUBLIC' },
  { key: '/dashboard/community/contacts', label: 'Contact', section: 'Communauté', visibility: 'PUBLIC' },
  // Utilisateurs
  { key: '/dashboard/users', label: 'Annuaire utilisateurs', section: 'Gestion des utilisateurs', visibility: 'PUBLIC' },
  { key: '/dashboard/root/superadmins', label: 'Super Admin', section: 'Gestion des utilisateurs', visibility: 'PRIVATE' },
  { key: '/dashboard/users/website-managers', label: 'Website Manager', section: 'Gestion des utilisateurs', visibility: 'PUBLIC' },
  { key: '/dashboard/users/magasiniers', label: 'Magasiniers', section: 'Gestion des utilisateurs', visibility: 'PUBLIC' },
  { key: '/dashboard/users/caissiers', label: 'Caissiers', section: 'Gestion des utilisateurs', visibility: 'PUBLIC' },
  { key: '/dashboard/users/vendeurs', label: 'Vendeurs', section: 'Gestion des utilisateurs', visibility: 'PUBLIC' },
  { key: '/dashboard/users/financiers', label: 'Financiers', section: 'Gestion des utilisateurs', visibility: 'PUBLIC' },
  { key: '/dashboard/users/commercials', label: 'Commercials', section: 'Gestion des utilisateurs', visibility: 'PUBLIC' },
  // Catalogue
  { key: '/dashboard/brands', label: 'Marques', section: 'Catalogue', visibility: 'PUBLIC' },
  { key: '/dashboard/categories', label: 'Catégories', section: 'Catalogue', visibility: 'PUBLIC' },
  { key: '/dashboard/characteristics', label: 'Caractéristiques', section: 'Catalogue', visibility: 'PUBLIC' },
  { key: '/dashboard/variants', label: 'Variantes', section: 'Catalogue', visibility: 'PUBLIC' },
  { key: '/dashboard/articles', label: 'Articles', section: 'Catalogue', visibility: 'PUBLIC' },
  { key: '/dashboard/coupons', label: 'Codes promotionnels', section: 'Catalogue', visibility: 'PUBLIC' },
  // Trésorerie
  { key: '/dashboard/treasury', label: 'Caisses', section: 'Trésorerie', visibility: 'PRIVATE' },
  { key: '/dashboard/treasury/transactions', label: 'Journal Trésorerie', section: 'Trésorerie', visibility: 'PRIVATE' },
  { key: '/dashboard/treasury/payments', label: 'Suivi des règlements', section: 'Trésorerie', visibility: 'PRIVATE' },
  { key: '/dashboard/accounting', label: 'Livres Comptables', section: 'Trésorerie', visibility: 'PRIVATE' },
  // Achats & Approvisionnement
  { key: '/dashboard/purchases/prospects', label: 'Portefeuille de prospects', section: 'Achats & Approvisionnement', visibility: 'PRIVATE' },
  { key: '/dashboard/suppliers', label: 'Fiches fournisseurs', section: 'Achats & Approvisionnement', visibility: 'PRIVATE' },
  { key: '/dashboard/purchases/orders', label: 'Commandes fournisseurs (BC)', section: 'Achats & Approvisionnement', visibility: 'PRIVATE' },
  { key: '/dashboard/purchases/receipts', label: 'Bon de réception (BR)', section: 'Achats & Approvisionnement', visibility: 'PRIVATE' },
  // Stock & Entrepôts
  { key: '/dashboard/warehouses', label: 'Dépôts', section: 'Stock & Entrepôts', visibility: 'PRIVATE' },
  { key: '/dashboard/stock-in', label: "Bon d'entrée (BE)", section: 'Stock & Entrepôts', visibility: 'PRIVATE' },
  { key: '/dashboard/stock-out', label: 'Bon de sortie (BS)', section: 'Stock & Entrepôts', visibility: 'PRIVATE' },
  { key: '/dashboard/inventory', label: 'Inventaire physique', section: 'Stock & Entrepôts', visibility: 'PRIVATE' },
  { key: '/dashboard/inventory-documents', label: 'Ajustement de stock', section: 'Stock & Entrepôts', visibility: 'PRIVATE' },
  { key: '/dashboard/transfers', label: 'Mouvements de stock', section: 'Stock & Entrepôts', visibility: 'PRIVATE' },
  // Ventes & Distribution
  { key: '/dashboard/customers', label: 'Fiches clients', section: 'Ventes & Distribution', visibility: 'PUBLIC' },
  { key: '/dashboard/orders', label: 'Commandes clients', section: 'Ventes & Distribution', visibility: 'PUBLIC' },
  { key: '/dashboard/deliveries', label: 'Bon de livraison (BL)', section: 'Ventes & Distribution', visibility: 'PRIVATE' },
  { key: '/dashboard/returns', label: 'Bon de retour (BR)', section: 'Ventes & Distribution', visibility: 'PRIVATE' },
  { key: '/dashboard/invoices', label: 'Factures', section: 'Ventes & Distribution', visibility: 'PRIVATE' },
  // Point de vente
  { key: '/dashboard/pos/showrooms', label: "Salles d'exposition", section: 'Point de vente', visibility: 'PRIVATE' },
  { key: '/dashboard/pos', label: 'Terminal POS', section: 'Point de vente', visibility: 'PRIVATE' },
  // SEO & Réputation
  { key: '/dashboard/community/testimonials', label: 'Commentaires et avis', section: 'SEO & Réputation', visibility: 'PRIVATE' },
  { key: '/dashboard/reports/interactions', label: 'Interactions', section: 'SEO & Réputation', visibility: 'PRIVATE' },
  { key: '/dashboard/community/newsletters', label: 'Abonnements', section: 'SEO & Réputation', visibility: 'PRIVATE' },
  { key: '/dashboard/seo/testimonials', label: 'Témoignages', section: 'SEO & Réputation', visibility: 'PRIVATE' },
  // Rapports & Statistiques
  { key: '/dashboard/analytics', label: "Conseils d'achat", section: 'Rapports & Statistiques', visibility: 'PRIVATE' },
  { key: '/dashboard/reports/sales', label: 'Ventes et marges', section: 'Rapports & Statistiques', visibility: 'PRIVATE' },
  { key: '/dashboard/reports/treasury', label: 'Suivi des caisses', section: 'Rapports & Statistiques', visibility: 'PRIVATE' },
  // Espace Client
  { key: '/account/home', label: 'Accueil Client', section: 'Espace Client', visibility: 'PUBLIC' },
  { key: '/account/orders', label: 'Suivi des commandes client', section: 'Espace Client', visibility: 'PUBLIC' },
  { key: '/account/favorites', label: 'Liste de souhaits', section: 'Espace Client', visibility: 'PUBLIC' },
  { key: '/account/profile', label: 'Mon profil', section: 'Espace Client', visibility: 'PUBLIC' },
  { key: '/account/loyalty', label: 'Mes points de fidélité', section: 'Espace Client', visibility: 'PRIVATE' },
  { key: '/account/coupons', label: 'Mes codes privilèges', section: 'Espace Client', visibility: 'PRIVATE' },
  // Système & CMS
  { key: '/dashboard/root/storefront/info', label: 'CMS : Identité et marque', section: 'Système & CMS', visibility: 'PRIVATE' },
  { key: '/dashboard/root/storefront/layouts', label: 'CMS : Mise en page et design', section: 'Système & CMS', visibility: 'PRIVATE' },
  { key: '/dashboard/root/storefront/views', label: 'CMS : Vues et modèles', section: 'Système & CMS', visibility: 'PRIVATE' },
  { key: '/dashboard/root/email-templates', label: 'Modèles de courriels', section: 'Système & CMS', visibility: 'PRIVATE' },
  { key: '/dashboard/root/smtp', label: 'Paramètres SMTP', section: 'Système & CMS', visibility: 'PRIVATE' },
  { key: '/dashboard/root/tva', label: 'Taxe et timbre fiscal', section: 'Système & CMS', visibility: 'PRIVATE' },
  { key: '/dashboard/root/reference-prefixes', label: 'Préfixes et numérotations', section: 'Système & CMS', visibility: 'PRIVATE' },
  { key: '/dashboard/root/print-templates', label: 'Documents et impressions', section: 'Système & CMS', visibility: 'PRIVATE' },
  { key: '/dashboard/payment-methods', label: 'Modalités de paiement', section: 'Système & CMS', visibility: 'PRIVATE' },
  { key: '/dashboard/settings', label: 'Paramètres généraux', section: 'Système & CMS', visibility: 'PRIVATE' },
  { key: '/dashboard/translations', label: 'Traductions i18n', section: 'Système & CMS', visibility: 'PRIVATE' },
  { key: '/dashboard/root/roles-permissions', label: 'Rôles et permissions', section: 'Système & CMS', visibility: 'PRIVATE' },
  { key: '/dashboard/logs', label: "Journal d'audit", section: 'Système & CMS', visibility: 'PRIVATE' },
  { key: '/dashboard/root/failures', label: 'Audit système', section: 'Système & CMS', visibility: 'PRIVATE' },
  { key: '/dashboard/root/visibility', label: 'Visibilité des vues', section: 'Système & CMS', visibility: 'PRIVATE' },
];

const ROOT_LOCKED_VIEW = '/dashboard/root/visibility';

function broadcastVisibilityMap(list: ViewRouteItem[]) {
  if (typeof window === 'undefined') return;
  const map: Record<string, VisibilityMode> = {};
  list.forEach((item) => {
    map[item.key] = item.visibility;
  });
  window.dispatchEvent(new CustomEvent('royal:visibility-updated', { detail: map }));
}

export default function ViewsVisibilityPage() {
  const { hasRole, isInitialized } = useAuthStore();
  const isRoot = hasRole('ROOT');

  const [rows, setRows] = useState<ViewRouteItem[]>(REGISTRY_VIEWS);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [sectionFilter, setSectionFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [toastState, setToastState] = useState<{
    open: boolean;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({ open: false, message: '', type: 'success' });

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastState({ open: true, message, type });
  }, []);

  const loadConfig = useCallback(async () => {
    try {
      setLoading(true);
      const res: any = await fetchApi('/storefront-cms/sys-config/visibility');
      const raw = res?.data?.value ?? res?.value;
      const savedMap = new Map<string, VisibilityMode>();
      if (Array.isArray(raw)) {
        raw.forEach((item: any) => {
          if (item?.key) {
            savedMap.set(item.key, item.visibility === 'PRIVATE' ? 'PRIVATE' : 'PUBLIC');
          }
        });
      }
      const merged = REGISTRY_VIEWS.map((def) => ({
        ...def,
        visibility:
          def.key === ROOT_LOCKED_VIEW
            ? ('PRIVATE' as const)
            : savedMap.get(def.key) ?? def.visibility,
      }));
      setRows(merged);
      broadcastVisibilityMap(merged);
    } catch {
      showToast('Impossible de charger la configuration de visibilité.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (isRoot) {
      loadConfig();
    } else if (isInitialized) {
      setLoading(false);
    }
  }, [isRoot, isInitialized, loadConfig]);

  const persistList = useCallback(
    async (nextRows: ViewRouteItem[], successMessage: string, prevRows: ViewRouteItem[]) => {
      setRows(nextRows);
      broadcastVisibilityMap(nextRows);
      try {
        await fetchApi('/storefront-cms/sys-config/visibility', {
          method: 'PUT',
          body: JSON.stringify({ value: nextRows }),
        });
        showToast(successMessage, 'success');
      } catch {
        setRows(prevRows);
        broadcastVisibilityMap(prevRows);
        showToast('Échec de la sauvegarde de visibilité.', 'error');
      }
    },
    [showToast]
  );

  const handleToggleRow = useCallback(
    async (item: ViewRouteItem) => {
      if (item.key === ROOT_LOCKED_VIEW) {
        showToast('Cette console reste strictement réservée au compte ROOT.', 'info');
        return;
      }
      const nextVis: VisibilityMode = item.visibility === 'PUBLIC' ? 'PRIVATE' : 'PUBLIC';
      const prevRows = rows;
      const nextRows = rows.map((r) => (r.key === item.key ? { ...r, visibility: nextVis } : r));
      setSavingKey(item.key);
      await persistList(
        nextRows,
        `${item.label} est maintenant ${nextVis === 'PUBLIC' ? 'PUBLIC (accessible selon RBAC)' : 'PRIVATE (badge DEV · ROOT uniquement)'}.`,
        prevRows
      );
      setSavingKey(null);
    },
    [rows, persistList, showToast]
  );

  const handleBulkVisibility = async (target: VisibilityMode) => {
    if (selectedKeys.length === 0) return;
    const prevRows = rows;
    const keySet = new Set(selectedKeys);
    const nextRows = rows.map((r) =>
      keySet.has(r.key) && r.key !== ROOT_LOCKED_VIEW ? { ...r, visibility: target } : r
    );
    setSavingKey('__bulk__');
    await persistList(
      nextRows,
      `${selectedKeys.length} vue(s) basculée(s) en ${target}.`,
      prevRows
    );
    setSelectedKeys([]);
    setSavingKey(null);
  };

  const sectionOptions = useMemo(() => {
    const unique = Array.from(new Set(rows.map((r) => r.section)));
    return unique.map((s) => ({ value: s, label: s }));
  }, [rows]);

  const filteredRows = useMemo(() => {
    return rows.filter((item) => {
      if (sectionFilter && item.section !== sectionFilter) return false;
      if (statusFilter && item.visibility !== statusFilter) return false;
      return true;
    });
  }, [rows, sectionFilter, statusFilter]);

  const publicCount = rows.filter((r) => r.visibility === 'PUBLIC').length;
  const privateCount = rows.filter((r) => r.visibility === 'PRIVATE').length;

  const renderStatusToggle = useCallback(
    (item: ViewRouteItem) => {
      const isLockedRoot = item.key === ROOT_LOCKED_VIEW;
      const isPublic = item.visibility === 'PUBLIC';
      const isBusy = savingKey === item.key || savingKey === '__bulk__';
      return (
        <button
          type="button"
          disabled={isLockedRoot || isBusy}
          onClick={(e) => {
            e.stopPropagation();
            handleToggleRow(item);
          }}
          title={
            isLockedRoot
              ? 'Réservée exclusivement au compte ROOT'
              : isPublic
              ? 'Cliquer pour passer en PRIVATE (badge DEV · ROOT uniquement)'
              : 'Cliquer pour passer en PUBLIC'
          }
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-extrabold border transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
            isPublic
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
              : 'bg-[var(--royal-gold-light)] text-[var(--royal-primary)] border-[var(--royal-primary)]/40 hover:opacity-90'
          }`}
        >
          {isLockedRoot ? (
            <>
              <Lock className="w-3.5 h-3.5" />
              <span>ROOT EXCLUSIF</span>
            </>
          ) : isPublic ? (
            <>
              <Eye className="w-3.5 h-3.5" />
              <span>PUBLIC</span>
            </>
          ) : (
            <>
              <EyeOff className="w-3.5 h-3.5" />
              <span>PRIVATE · DEV</span>
            </>
          )}
        </button>
      );
    },
    [savingKey, handleToggleRow]
  );

  const columns: ColumnDef<ViewRouteItem>[] = [
    {
      key: 'label',
      header: 'Vue',
      sortable: true,
      sortValue: (item) => `${item.section} ${item.label}`,
      render: (item) => (
        <div className="flex flex-wrap items-center gap-2 min-w-0">
          <span className="font-bold text-[#1D232E]">{item.label}</span>
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full border"
            style={{
              backgroundColor: 'var(--royal-gold-light)',
              color: 'var(--royal-primary)',
              borderColor: 'var(--royal-border)',
            }}
          >
            {item.section}
          </span>
        </div>
      ),
    },
    {
      key: 'key',
      header: 'URL',
      sortable: true,
      sortValue: (item) => item.key,
      render: (item) => (
        <div className="flex items-center gap-2 min-w-0">
          <code className="text-[11px] font-mono text-slate-600 bg-[#F8F9FA] px-2.5 py-1 rounded-lg border border-[#E6E1D6] truncate">
            {item.key}
          </code>
          <Link
            href={item.key}
            title={`Ouvrir ${item.key}`}
            className="h-7 w-7 rounded-lg border border-[#E6E1D6] bg-white hover:bg-[var(--royal-gold-light)] text-[var(--royal-primary)] flex items-center justify-center shrink-0 transition"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      ),
    },
    {
      key: 'visibility',
      header: 'Statut',
      sortable: true,
      sortValue: (item) => item.visibility,
      className: 'text-right',
      render: (item) => <div className="flex items-center justify-end">{renderStatusToggle(item)}</div>,
    },
  ];

  if (isInitialized && !isRoot) {
    return (
      <div className="max-w-lg mx-auto mt-16 bg-white border border-[#E6E1D6] rounded-3xl p-8 text-center shadow-sm space-y-4">
        <div
          className="w-12 h-12 rounded-2xl border mx-auto flex items-center justify-center"
          style={{
            backgroundColor: 'var(--royal-gold-light)',
            color: 'var(--royal-primary)',
            borderColor: 'var(--royal-border)',
          }}
        >
          <Lock className="w-5 h-5" />
        </div>
        <h2 className="text-lg font-heading font-black text-[#1D232E]">
          Console réservée au compte ROOT
        </h2>
        <p className="text-xs text-slate-500">
          Seul le super-utilisateur ROOT peut gérer la visibilité des vues et activer ou masquer les modules en développement.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--royal-primary)] text-white text-xs font-bold shadow-xs"
        >
          Retour au tableau de bord
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <Toast
        isOpen={toastState.open}
        message={toastState.message}
        type={toastState.type}
        onClose={() => setToastState((prev) => ({ ...prev, open: false }))}
      />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-heading font-black text-[#1D232E] tracking-tight">
              Visibilité des Vues
            </h1>
            <span
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border"
              style={{
                backgroundColor: 'var(--royal-gold-light)',
                color: 'var(--royal-primary)',
                borderColor: 'var(--royal-border)',
              }}
            >
              <ShieldCheck className="w-3 h-3" /> ROOT Exclusif
            </span>
          </div>
          <p className="text-sm text-slate-500 max-w-2xl">
            Les vues en statut <strong className="text-[#1D232E]">PRIVATE · DEV</strong> affichent un badge{' '}
            <code className="text-[11px] font-bold text-[var(--royal-primary)]">DEV</code> dans le menu latéral pour le compte ROOT et restent masquées et bloquées pour tous les autres rôles.
          </p>
          <div className="pt-1">
            <Breadcrumb
              items={[
                { label: 'Système', href: '/dashboard/section/system' },
                { label: 'Visibilité des vues' },
              ]}
            />
          </div>
        </div>

        {selectedKeys.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={savingKey === '__bulk__'}
              onClick={() => handleBulkVisibility('PUBLIC')}
            >
              <Eye className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
              Passer {selectedKeys.length} en PUBLIC
            </Button>
            <Button
              variant="gold"
              size="sm"
              disabled={savingKey === '__bulk__'}
              onClick={() => handleBulkVisibility('PRIVATE')}
            >
              <EyeOff className="w-3.5 h-3.5 mr-1.5" />
              Passer {selectedKeys.length} en PRIVATE (DEV)
            </Button>
          </div>
        )}
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-[#E6E1D6] p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Vues répertoriées
            </p>
            <p className="text-2xl font-heading font-black text-[#1D232E] mt-1">{rows.length}</p>
          </div>
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center border"
            style={{
              backgroundColor: 'var(--royal-gold-light)',
              color: 'var(--royal-primary)',
              borderColor: 'var(--royal-border)',
            }}
          >
            <Sparkles className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#E6E1D6] p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Vues Publiques (RBAC actif)
            </p>
            <p className="text-2xl font-heading font-black text-emerald-700 mt-1">{publicCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#E6E1D6] p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Vues Privées (Mode DEV · ROOT)
            </p>
            <p
              className="text-2xl font-heading font-black mt-1"
              style={{ color: 'var(--royal-primary)' }}
            >
              {privateCount}
            </p>
          </div>
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center border"
            style={{
              backgroundColor: 'var(--royal-gold-light)',
              color: 'var(--royal-primary)',
              borderColor: 'var(--royal-border)',
            }}
          >
            <EyeOff className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Standard Dashboard DataTable */}
      <DataTable<ViewRouteItem>
        data={filteredRows}
        columns={columns}
        keyExtractor={(item) => item.key}
        isLoading={loading}
        onRefresh={loadConfig}
        searchPlaceholder="Rechercher une vue ou une URL..."
        searchKeys={['label', 'section', 'key']}
        customFilters={[
          {
            key: 'section',
            label: 'Section',
            value: sectionFilter,
            onChange: setSectionFilter,
            allLabel: 'Toutes les sections',
            options: sectionOptions,
          },
          {
            key: 'visibility',
            label: 'Statut',
            value: statusFilter,
            onChange: setStatusFilter,
            allLabel: 'Tous les statuts',
            options: [
              { value: 'PUBLIC', label: 'PUBLIC' },
              { value: 'PRIVATE', label: 'PRIVATE · DEV' },
            ],
          },
        ]}
        enableMultiSelect={true}
        selectedKeys={selectedKeys}
        onSelectionChange={setSelectedKeys}
        supportedModes={['table', 'list', 'matrix']}
        defaultMode="table"
        exportFileName="visibilite_vues_royal"
        printTitle="Contrôle de Visibilité des Vues — Royal"
        renderListItem={(item, _isSelected, _onSelect, isRowChecked, onToggleRowCheck) => (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border border-[#E6E1D6] bg-white hover:border-[var(--royal-primary)]/40 transition">
            <div className="flex items-start sm:items-center gap-3 min-w-0">
              <input
                type="checkbox"
                checked={isRowChecked}
                onChange={() => {}}
                onClick={onToggleRowCheck}
                className="h-4 w-4 rounded border-[#CBD5E1] cursor-pointer accent-[var(--royal-primary)] mt-0.5 sm:mt-0"
              />
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-sm text-[#1D232E]">{item.label}</span>
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full border"
                    style={{
                      backgroundColor: 'var(--royal-gold-light)',
                      color: 'var(--royal-primary)',
                      borderColor: 'var(--royal-border)',
                    }}
                  >
                    {item.section}
                  </span>
                </div>
                <code className="inline-block text-[11px] font-mono text-slate-600 bg-[#F8F9FA] px-2 py-0.5 rounded border border-[#E6E1D6]">
                  {item.key}
                </code>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 justify-end">
              {renderStatusToggle(item)}
            </div>
          </div>
        )}
        renderMatrixCard={(item, isRowChecked, onToggleRowCheck) => (
          <div className="flex flex-col justify-between gap-3 p-4 rounded-2xl border border-[#E6E1D6] bg-white hover:border-[var(--royal-primary)]/40 transition h-full">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1 min-w-0">
                <span
                  className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border"
                  style={{
                    backgroundColor: 'var(--royal-gold-light)',
                    color: 'var(--royal-primary)',
                    borderColor: 'var(--royal-border)',
                  }}
                >
                  {item.section}
                </span>
                <h3 className="font-bold text-sm text-[#1D232E] truncate">{item.label}</h3>
              </div>
              <input
                type="checkbox"
                checked={isRowChecked}
                onChange={() => {}}
                onClick={onToggleRowCheck}
                className="h-4 w-4 rounded border-[#CBD5E1] cursor-pointer accent-[var(--royal-primary)] shrink-0"
              />
            </div>
            <code className="text-[11px] font-mono text-slate-600 bg-[#F8F9FA] px-2.5 py-1.5 rounded-lg border border-[#E6E1D6] truncate">
              {item.key}
            </code>
            <div className="flex items-center justify-end pt-1">
              {renderStatusToggle(item)}
            </div>
          </div>
        )}
      />
    </div>
  );
}
