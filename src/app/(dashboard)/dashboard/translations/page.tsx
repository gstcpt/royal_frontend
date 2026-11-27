'use client';

import React, { useState, useMemo } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { useI18nStore } from '@/stores/i18n.store';
import {
  Languages,
  Save,
  Search,
  ShieldAlert,
  CheckCircle2,
  FileJson,
  RefreshCw,
  SlidersHorizontal,
  Copy,
  Check,
  Eye,
  Edit3,
  Globe,
  BookOpen,
  ArrowRight,
  Filter,
  Clock,
} from 'lucide-react';
import {
  DataTable,
  ColumnDef,
  Button,
  Input,
  Select,
  Badge,
  Modal,
  Breadcrumb,
  Toast,
} from '@/components/ui';
import { fetchApi } from '@/lib/api';
import { cn } from '@/lib/utils';

interface TranslationItem {
  key: string;
  category: string;
  fr: string;
  ar: string;
  isComplete: boolean;
}

export default function TranslationsManagerPage() {
  const { user, hasRole, isInitialized } = useAuthStore();
  const { translations, updateTranslations } = useI18nStore();

  const isRoot = user?.roles?.includes('ROOT') || hasRole('ROOT' as any);

  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [editModalItem, setEditModalItem] = useState<TranslationItem | null>(null);
  const [selectedTranslationKeys, setSelectedTranslationKeys] = useState<string[]>([]);
  const [modalFr, setModalFr] = useState('');
  const [modalAr, setModalAr] = useState('');

  const showToast = (type: 'success' | 'error', text: string) => {
    setFeedbackMessage({ type, text });
    setTimeout(() => setFeedbackMessage(null), 3500);
  };

  // Flatten nested JSON
  const flattenObject = (obj: any, prefix = ''): Record<string, string> => {
    return Object.keys(obj || {}).reduce((acc: Record<string, string>, k: string) => {
      const pre = prefix.length ? `${prefix}.${k}` : k;
      if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
        Object.assign(acc, flattenObject(obj[k], pre));
      } else {
        acc[pre] = String(obj[k]);
      }
      return acc;
    }, {});
  };

  const frFlat = useMemo(() => flattenObject(translations.fr), [translations.fr]);
  const arFlat = useMemo(() => flattenObject(translations.ar), [translations.ar]);

  const [editableFr, setEditableFr] = useState<Record<string, string>>(frFlat);
  const [editableAr, setEditableAr] = useState<Record<string, string>>(arFlat);

  // Sync state if store updates externally + load overrides from PostgreSQL
  React.useEffect(() => {
    setEditableFr(flattenObject(translations.fr));
    setEditableAr(flattenObject(translations.ar));
    fetchApi('/storefront-cms/sys-config/translations')
      .then((res) => {
        const val = res?.value || res?.data?.value;
        if (val?.fr) setEditableFr((prev) => ({ ...prev, ...flattenObject(val.fr) }));
        if (val?.ar) setEditableAr((prev) => ({ ...prev, ...flattenObject(val.ar) }));
      })
      .catch(() => null);
  }, [translations]);

  // Unnest helper
  const unflattenObject = (data: Record<string, string>) => {
    const result: any = {};
    for (const i in data) {
      const keys = i.split('.');
      keys.reduce((r, a, idx) => {
        return (
          r[a] ||
          (r[a] = isNaN(Number(keys[idx + 1]))
            ? keys.length - 1 === idx
              ? data[i]
              : {}
            : [])
        );
      }, result);
    }
    return result;
  };

  // Build items array
  const allKeys = useMemo(() => {
    return Array.from(new Set([...Object.keys(editableFr), ...Object.keys(editableAr)]));
  }, [editableFr, editableAr]);

  const items: TranslationItem[] = useMemo(() => {
    return allKeys.map((key) => {
      const category = key.includes('.') ? key.split('.')[0] : 'general';
      const fr = editableFr[key] || '';
      const ar = editableAr[key] || '';
      return {
        key,
        category,
        fr,
        ar,
        isComplete: !!fr && !!ar,
      };
    });
  }, [allKeys, editableFr, editableAr]);

  const filteredItems = useMemo(() => {
    if (filterCategory === 'ALL') return items;
    return items.filter((item) => item.category === filterCategory);
  }, [items, filterCategory]);

  // KPI Calculations
  const totalKeys = items.length;
  const translatedKeys = items.filter((i) => i.isComplete).length;
  const pendingKeys = totalKeys - translatedKeys;
  const coveragePercent = totalKeys > 0 ? Math.round((translatedKeys / totalKeys) * 100) : 100;

  // Save all
  const handleSaveAll = async () => {
    const newFr = unflattenObject(editableFr);
    const newAr = unflattenObject(editableAr);
    try {
      await fetchApi('/storefront-cms/sys-config/translations', {
        method: 'PUT',
        body: JSON.stringify({ value: { fr: newFr, ar: newAr } }),
      });
      updateTranslations('fr', newFr);
      updateTranslations('ar', newAr);
      showToast('success', 'Toutes les traductions ont été synchronisées en base.');
    } catch (err: any) {
      showToast('error', err?.message || 'Erreur lors de la sauvegarde des traductions.');
    }
  };

  const copyToClipboard = (text: string, keyName: string) => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(text);
      setCopiedKey(keyName);
      showToast('success', `Clé "${keyName}" copiée dans le presse-papiers.`);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  const openEditModal = (item: TranslationItem) => {
    setEditModalItem(item);
    setModalFr(editableFr[item.key] || '');
    setModalAr(editableAr[item.key] || '');
  };

  const handleSaveModal = async () => {
    if (!editModalItem) return;
    const newFr = { ...editableFr, [editModalItem.key]: modalFr };
    const newAr = { ...editableAr, [editModalItem.key]: modalAr };
    const fullFr = unflattenObject(newFr);
    const fullAr = unflattenObject(newAr);
    try {
      await fetchApi('/storefront-cms/sys-config/translations', {
        method: 'PUT',
        body: JSON.stringify({ value: { fr: fullFr, ar: fullAr } }),
      });
      setEditableFr(newFr);
      setEditableAr(newAr);
      updateTranslations('fr', fullFr);
      updateTranslations('ar', fullAr);
      showToast('success', `Clé "${editModalItem.key}" sauvegardée en base avec succès.`);
      setEditModalItem(null);
    } catch (err: any) {
      showToast('error', err?.message || "Impossible d'enregistrer cette traduction.");
    }
  };

  // Security gate
  if (!isRoot) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl border border-rose-200/80 shadow-xl p-8 text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto shadow-sm">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200 mb-2">
              Privilège Insuffisant
            </span>
            <h1 className="text-xl font-heading font-black text-neutral-900 tracking-tight">
              Accès Réservé au Compte ROOT
            </h1>
            <p className="text-xs text-neutral-600 mt-2 leading-relaxed">
              La gestion bilingue des fichiers de traduction système (FR/AR) est réservée au super-utilisateur <strong>ROOT</strong>.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Column Definitions
  const columns: ColumnDef<TranslationItem>[] = [
    {
      key: 'key',
      header: 'Clé de Traduction JSON',
      sortable: true,
      sortValue: (item) => item.key,
      render: (item) => (
        <div className="space-y-1">
          <div className="font-mono text-xs font-bold text-neutral-900 flex items-center gap-1.5">
            <span>{item.key}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-neutral-100 text-neutral-600 border border-neutral-200">
              {item.category}
            </span>
          </div>
        </div>
      ),
      printRender: (item) => item.key,
    },
    {
      key: 'fr',
      header: 'Français (Source de Vérité)',
      sortable: true,
      sortValue: (item) => item.fr,
      render: (item) => (
        <div className="max-w-md">
          <input
            type="text"
            value={editableFr[item.key] || ''}
            onChange={(e) => setEditableFr({ ...editableFr, [item.key]: e.target.value })}
            className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-white text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-sans"
          />
        </div>
      ),
      printRender: (item) => item.fr,
    },
    {
      key: 'ar',
      header: 'العربية (Arabe RTL)',
      sortable: true,
      sortValue: (item) => item.ar,
      render: (item) => (
        <div className="max-w-md">
          <input
            type="text"
            dir="rtl"
            value={editableAr[item.key] || ''}
            onChange={(e) => setEditableAr({ ...editableAr, [item.key]: e.target.value })}
            className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-white text-xs text-neutral-900 text-right focus:outline-none focus:ring-1 focus:ring-blue-500 font-sans"
          />
        </div>
      ),
      printRender: (item) => item.ar,
    },
    {
      key: 'status',
      header: 'Statut',
      sortable: true,
      sortValue: (item) => (item.isComplete ? 1 : 0),
      className: 'text-center',
      render: (item) => (
        <span
          className={cn(
            'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border',
            item.isComplete
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-amber-50 text-amber-800 border-amber-200'
          )}
        >
          {item.isComplete ? (
            <>
              <Check className="w-3 h-3 text-emerald-600" />
              <span>Complet</span>
            </>
          ) : (
            <>
              <Clock className="w-3 h-3 text-amber-600" />
              <span>Incomplet</span>
            </>
          )}
        </span>
      ),
      printRender: (item) => (item.isComplete ? 'Complet' : 'Incomplet'),
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right no-print',
      render: (item) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={() => copyToClipboard(item.key, item.key)}
            className="p-1.5 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-600 transition shadow-2xs cursor-pointer"
            title="Copier la clé JSON"
          >
            {copiedKey === item.key ? (
              <Check className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
          <button
            type="button"
            onClick={() => openEditModal(item)}
            className="p-1.5 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 transition shadow-2xs cursor-pointer"
            title="Inspecter & Modifier la traduction"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  const uniqueCategories = Array.from(new Set(items.map((i) => i.category)));

  return (
    <div className="space-y-6 max-w-[1720px] mx-auto">
      {/* Toast */}
      <Toast
        isOpen={!!feedbackMessage}
        message={feedbackMessage?.text || ''}
        type={feedbackMessage?.type === 'error' ? 'error' : 'success'}
        onClose={() => setFeedbackMessage(null)}
      />

      {/* 1. Page Header Card */}
      <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-sm p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-heading font-black text-neutral-900 tracking-tight">
              Gestion Linguistique & Traductions Bilingues
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#FBF6E8] text-[#8C6400] border border-[#E6D6A6] shadow-2xs">
              ROOT EXCLUSIF
            </span>
          </div>
          <p className="text-xs text-neutral-500 mt-1 max-w-2xl">
            Référentiel bilingue Français (source de vérité) et Arabe (affichage RTL natif) avec synchronisation en temps réel.
          </p>
          <Breadcrumb
            className="mt-2"
            items={[
              { label: 'Administration Système', href: '/dashboard/settings' },
              { label: 'Traductions Bilingues' },
            ]}
          />
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={handleSaveAll}
            variant="gold"
            leftIcon={<Save className="w-4 h-4" />}
            className="text-xs py-2 px-5 shadow-sm"
          >
            Enregistrer Tout
          </Button>
        </div>
      </div>

      {/* 2. KPI Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 no-print">
        <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block">
              Total des Clés
            </span>
            <span className="text-2xl font-black text-neutral-950 mt-1 block">
              {totalKeys}
            </span>
            <span className="text-[11px] text-neutral-400 mt-0.5 block">Dictionnaires JSON</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-800">
            <FileJson className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block">
              Clés Traduites
            </span>
            <span className="text-2xl font-black text-emerald-600 mt-1 block">
              {translatedKeys}
            </span>
            <span className="text-[11px] text-neutral-400 mt-0.5 block">FR & AR synchronisés</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block">
              Clés en Attente
            </span>
            <span className="text-2xl font-black text-amber-600 mt-1 block">
              {pendingKeys}
            </span>
            <span className="text-[11px] text-neutral-400 mt-0.5 block">Traduction manquante</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
            <Languages className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block">
              Taux de Couverture
            </span>
            <span className="text-2xl font-black text-blue-600 mt-1 block">
              {coveragePercent}%
            </span>
            <span className="text-[11px] text-neutral-400 mt-0.5 block">Complétude globale</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
            <Globe className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. Main Data Table */}
      <DataTable<TranslationItem>
        data={filteredItems}
        columns={columns}
        keyExtractor={(item) => item.key}
        enableMultiSelect={true}
        selectedKeys={selectedTranslationKeys}
        onSelectionChange={setSelectedTranslationKeys}
        renderBulkActions={() => (
          <>
            <button
              type="button"
              onClick={() => {
                const sel = filteredItems.filter((it) => selectedTranslationKeys.includes(it.key));
                const jsonPayload = sel.reduce(
                  (acc, it) => {
                    acc.fr[it.key] = editableFr[it.key] ?? it.fr;
                    acc.ar[it.key] = editableAr[it.key] ?? it.ar;
                    return acc;
                  },
                  { fr: {} as Record<string, string>, ar: {} as Record<string, string> }
                );
                const blob = new Blob([JSON.stringify(jsonPayload, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `traductions_selection_${Date.now()}.json`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="px-2.5 py-1.5 rounded-lg bg-neutral-100 text-neutral-700 hover:bg-neutral-200 border border-neutral-200 text-xs font-semibold transition cursor-pointer"
            >
              Exporter JSON ({selectedTranslationKeys.length})
            </button>
          </>
        )}
        searchPlaceholder="Rechercher par clé, texte français ou arabe..."
        searchKeys={['key', 'fr', 'ar', 'category']}
        supportedModes={['table', 'list', 'matrix']}
        defaultMode="table"
        exportFileName="traductions_royal"
        customFilters={[
          {
            key: 'section',
            label: 'Section',
            value: filterCategory,
            onChange: setFilterCategory,
            allLabel: 'Toutes les sections',
            options: uniqueCategories.map((c) => ({ value: c, label: `Section: ${c}` })),
          },
        ]}
      />

      {/* 4. Edit Modal */}
      {editModalItem && (
        <Modal
          isOpen={!!editModalItem}
          onClose={() => setEditModalItem(null)}
          title={`Édition : ${editModalItem.key}`}
          subtitle={`Section : ${editModalItem.category}`}
          size="lg"
          footer={
            <div className="flex items-center justify-end gap-2 w-full">
              <Button
                variant="outline"
                onClick={() => setEditModalItem(null)}
                className="text-xs px-4 py-2 border-neutral-300 hover:bg-neutral-100"
              >
                Annuler
              </Button>
              <Button
                variant="gold"
                onClick={handleSaveModal}
                className="text-xs px-5 py-2"
              >
                Sauvegarder
              </Button>
            </div>
          }
        >
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                Français (Source de référence)
              </label>
              <textarea
                rows={3}
                value={modalFr}
                onChange={(e) => setModalFr(e.target.value)}
                className="w-full p-3 rounded-xl border border-neutral-300 text-xs focus:ring-1 focus:ring-emerald-500 font-sans"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1 text-right">
                العربية (Arabe RTL)
              </label>
              <textarea
                rows={3}
                dir="rtl"
                value={modalAr}
                onChange={(e) => setModalAr(e.target.value)}
                className="w-full p-3 rounded-xl border border-neutral-300 text-xs text-right focus:ring-1 focus:ring-blue-500 font-sans"
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
