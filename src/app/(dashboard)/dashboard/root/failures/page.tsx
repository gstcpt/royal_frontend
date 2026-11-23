'use client';

import * as React from 'react';
import {
  AlertTriangle,
  Trash2,
  Eye,
  RefreshCw,
  Clock,
  Server,
  Printer,
} from 'lucide-react';
import { fetchApi } from '@/lib/api';
import {
  DataTable,
  ColumnDef,
  Button,
  Badge,
  Modal,
  Breadcrumb,
  Toast,
} from '@/components/ui';

interface SystemFailureItem {
  id: string;
  errorCode: string;
  statusCode: number;
  service: string;
  endpoint: string;
  errorMessage: string;
  stackTrace?: string;
  ipAddress?: string;
  occurredAt: string;
}

export default function SystemFailuresPage() {
  const [failures, setFailures] = React.useState<SystemFailureItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedFailure, setSelectedFailure] = React.useState<SystemFailureItem | null>(null);
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [toast, setToast] = React.useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const loadFailures = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchApi('/storefront-cms/sys-config/systemFailures');
      const raw = res?.value ?? res?.data?.value ?? res?.data ?? res;
      setFailures(Array.isArray(raw) ? raw : []);
    } catch {
      setToast({ msg: 'Impossible de charger les incidents depuis PostgreSQL.', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadFailures();
  }, [loadFailures]);

  const persistFailures = async (next: SystemFailureItem[], msg: string) => {
    try {
      await fetchApi('/storefront-cms/sys-config/systemFailures', {
        method: 'PUT',
        body: JSON.stringify({ value: next }),
      });
      setFailures(next);
      setToast({ msg, type: 'success' });
    } catch (err: any) {
      setToast({ msg: err?.message || 'Erreur lors de la mise à jour du journal.', type: 'error' });
    }
  };

  const handleDeleteOne = async (id: string) => {
    const next = failures.filter((f) => f.id !== id);
    setSelectedIds((prev) => prev.filter((itemId) => itemId !== id));
    await persistFailures(next, 'Incident supprimé du journal.');
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    const next = failures.filter((f) => !selectedIds.includes(f.id));
    setSelectedIds([]);
    await persistFailures(next, 'Incidents sélectionnés supprimés.');
  };

  const handleClearAll = async () => {
    setSelectedIds([]);
    await persistFailures([], 'Journal des incidents purgé.');
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadFailures();
    setIsRefreshing(false);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const columns: ColumnDef<SystemFailureItem>[] = [
    {
      key: 'statusCode',
      header: 'Code Erreur',
      sortable: true,
      render: (item) => (
        <div className="space-y-0.5">
          <Badge className="bg-rose-50 text-rose-800 border-rose-200 text-xs font-mono font-bold">
            HTTP {item.statusCode}
          </Badge>
          <div className="text-[10px] font-mono text-neutral-500">{item.errorCode}</div>
        </div>
      ),
    },
    {
      key: 'service',
      header: 'Service & Endpoint',
      sortable: true,
      render: (item) => (
        <div className="space-y-0.5">
          <div className="text-xs font-bold text-neutral-900 flex items-center gap-1.5">
            <Server className="h-3.5 w-3.5 text-rose-600" />
            <span>{item.service}</span>
          </div>
          <div className="text-[11px] font-mono text-neutral-500">{item.endpoint}</div>
        </div>
      ),
    },
    {
      key: 'errorMessage',
      header: 'Message d’Incident',
      render: (item) => (
        <p className="text-xs text-neutral-800 line-clamp-1 max-w-md font-medium">
          {item.errorMessage}
        </p>
      ),
    },
    {
      key: 'occurredAt',
      header: 'Date & Heure',
      sortable: true,
      render: (item) => (
        <div className="flex items-center gap-1 text-[11px] text-neutral-500 font-mono">
          <Clock className="h-3 w-3 text-neutral-400" />
          <span>{new Date(item.occurredAt).toLocaleString('fr-FR')}</span>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (item) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            title="Inspecter la trace de la pile (Stack Trace)"
            onClick={() => setSelectedFailure(item)}
            className="h-8 w-8 rounded-lg border border-neutral-200 flex items-center justify-center text-neutral-600 hover:text-[#8C6400] hover:border-[#E6D6A6] hover:bg-[#FBF6E8] transition-colors cursor-pointer"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            type="button"
            title="Supprimer la ligne"
            onClick={() => handleDeleteOne(item.id)}
            className="h-8 w-8 rounded-lg border border-neutral-200 flex items-center justify-center text-neutral-400 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition-colors cursor-pointer"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <Toast
        isOpen={!!toast}
        message={toast?.msg || ''}
        type={toast?.type === 'error' ? 'error' : 'success'}
        onClose={() => setToast(null)}
      />

      <div className="bg-white p-6 rounded-3xl border border-[#E6E1D6] shadow-sm space-y-3 no-print">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-50 text-rose-600 border border-rose-200 rounded-2xl shadow-2xs">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-heading font-black text-neutral-900 tracking-tight">
                Incidents &amp; Échecs Système (Journal 500)
              </h1>
              <p className="text-xs text-neutral-500">
                Traçabilité persistante des exceptions critiques, pannes de passerelles et incidents techniques.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {selectedIds.length > 0 && (
              <Button
                variant="danger"
                size="sm"
                onClick={handleDeleteSelected}
                className="text-xs"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                <span>Supprimer ({selectedIds.length})</span>
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={handleClearAll}
              disabled={failures.length === 0}
              className="text-xs text-neutral-600"
            >
              <span>Purger tout le journal</span>
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={handleRefresh}
              className="text-xs"
              title="Actualiser"
            >
              <RefreshCw className={isRefreshing ? 'h-3.5 w-3.5 animate-spin' : 'h-3.5 w-3.5'} />
            </Button>
          </div>
        </div>
        <div className="pt-2 border-t border-slate-100">
          <Breadcrumb
            items={[
              { label: 'Système & CMS', href: '/dashboard/section/system' },
              { label: 'Incidents système' },
            ]}
          />
        </div>
      </div>

      <DataTable
        data={failures}
        columns={columns}
        keyExtractor={(item) => item.id}
        isLoading={loading}
        enableMultiSelect={true}
        selectedKeys={selectedIds}
        onSelectionChange={setSelectedIds}
        onBulkDelete={handleDeleteSelected}
        renderBulkActions={() => (
          <button
            type="button"
            onClick={() => {
              const sel = failures.filter((f) => selectedIds.includes(f.id));
              const blob = new Blob([JSON.stringify(sel, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `incidents_selection_${Date.now()}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="px-2.5 py-1.5 rounded-lg bg-neutral-100 text-neutral-700 hover:bg-neutral-200 border border-neutral-200 text-xs font-semibold transition cursor-pointer"
          >
            Exporter JSON ({selectedIds.length})
          </button>
        )}
        supportedModes={['table', 'list', 'matrix']}
        defaultMode="table"
        searchKeys={['errorCode', 'service', 'endpoint', 'errorMessage']}
        exportFileName="incidents_systeme_royal"
        printTitle="Journal des Incidents et Échecs Système Royal"
      />

      {selectedFailure && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedFailure(null)}
          title={`Détail de l'Incident : ${selectedFailure.errorCode}`}
          size="4xl"
          footer={
            <div className="flex justify-end gap-2 w-full">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
                leftIcon={<Printer className="w-3.5 h-3.5" />}
              >
                Imprimer le Rapport
              </Button>
              <Button variant="gold" size="sm" onClick={() => setSelectedFailure(null)}>
                Fermer
              </Button>
            </div>
          }
        >
          <div className="p-6 space-y-4">
            <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80 space-y-2 text-xs">
              <div className="flex justify-between text-neutral-600">
                <span>
                  Service : <strong className="text-neutral-900">{selectedFailure.service}</strong>
                </span>
                <span>
                  Code Statut :{' '}
                  <strong className="text-rose-700 font-mono">HTTP {selectedFailure.statusCode}</strong>
                </span>
              </div>
              <div className="text-neutral-600">
                Point de terminaison :{' '}
                <strong className="text-neutral-900 font-mono">{selectedFailure.endpoint}</strong>
              </div>
              {selectedFailure.ipAddress && (
                <div className="text-neutral-600">
                  Adresse IP Source :{' '}
                  <strong className="text-neutral-900 font-mono">{selectedFailure.ipAddress}</strong>
                </div>
              )}
              <div className="text-neutral-600">
                Horodatage :{' '}
                <strong className="text-neutral-900 font-mono">
                  {new Date(selectedFailure.occurredAt).toLocaleString('fr-FR')}
                </strong>
              </div>
              <div className="pt-2 border-t border-neutral-200 font-bold text-neutral-900">
                Message d&apos;erreur : {selectedFailure.errorMessage}
              </div>
            </div>

            {selectedFailure.stackTrace && (
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-neutral-700">
                  Trace d&apos;Exécution Complète (Stack Trace) :
                </span>
                <pre className="p-4 rounded-2xl bg-neutral-100/80 border border-neutral-200 font-mono text-[11px] text-neutral-900 leading-relaxed overflow-x-auto whitespace-pre-wrap select-all">
                  {selectedFailure.stackTrace}
                </pre>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
