'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Users,
  Building2,
  User,
  ShoppingBag,
  CreditCard,
  Eye,
  Tag,
  MapPin,
  Plus,
  Printer,
} from 'lucide-react';
import { DataTable, ColumnDef } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Toast } from '@/components/ui/toast';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { fetchApi } from '@/lib/api';
import { cn, formatTndCurrency } from '@/lib/utils';
import { DocumentPrintHeader, DocumentPrintFooter } from '@/components/dashboard/DocumentPrintLayout';

export interface CustomerItem {
  id: string;
  customerType: 'INDIVIDUAL' | 'COMPANY';
  fullName: string;
  companyName?: string;
  taxId?: string;
  cin?: string;
  email: string;
  phone: string;
  city: string;
  address: string;
  totalOrders: number;
  totalSpentTnd: number;
  outstandingBalanceTnd: number;
  isVip: boolean;
  createdAt: string;
  recentOrders: Array<{
    reference: string;
    date: string;
    totalAmount: number;
    status: string;
  }>;
}

const INITIAL_CUSTOMERS: CustomerItem[] = [
  {
    id: 'cust-001',
    customerType: 'INDIVIDUAL',
    fullName: 'Yassine Ben Amor',
    cin: '08123456',
    email: 'yassine.amor@gmail.com',
    phone: '+216 98 123 456',
    city: 'Tunis (Les Berges du Lac)',
    address: 'Résidence Les Palmiers, Apt 14',
    totalOrders: 3,
    totalSpentTnd: 5620,
    outstandingBalanceTnd: 0,
    isVip: true,
    createdAt: '2026-10-15T10:00:00Z',
    recentOrders: [
      { reference: '#CMD-2026-402', date: '2026-11-15', totalAmount: 3770, status: 'Expédiée' },
      { reference: '#CMD-2026-310', date: '2026-10-20', totalAmount: 1850, status: 'Livrée' },
    ],
  },
  {
    id: 'cust-002',
    customerType: 'INDIVIDUAL',
    fullName: 'Sarra Khemir',
    cin: '07987654',
    email: 'sarra.khemir@topnet.tn',
    phone: '+216 55 456 789',
    city: 'Sousse',
    address: 'Avenue Habib Bourguiba, Khézama Est',
    totalOrders: 2,
    totalSpentTnd: 2540,
    outstandingBalanceTnd: 0,
    isVip: false,
    createdAt: '2026-10-28T14:30:00Z',
    recentOrders: [
      { reference: '#CMD-2026-401', date: '2026-11-14', totalAmount: 1850, status: 'Livrée' },
      { reference: '#CMD-2026-340', date: '2026-11-02', totalAmount: 690, status: 'Livrée' },
    ],
  },
  {
    id: 'cust-003',
    customerType: 'COMPANY',
    fullName: 'Moncef Trabelsi',
    companyName: 'Studio Architecture Trabelsi SARL',
    taxId: '1458920/A/M/000',
    email: 'm.trabelsi@architectes.tn',
    phone: '+216 20 789 123',
    city: 'Tunis',
    address: 'Immeuble Le Corbusier, Centre Urbain Nord',
    totalOrders: 5,
    totalSpentTnd: 18450,
    outstandingBalanceTnd: 1200,
    isVip: true,
    createdAt: '2026-09-01T08:00:00Z',
    recentOrders: [
      { reference: '#CMD-2026-400', date: '2026-11-15', totalAmount: 1200, status: 'Confirmée' },
      { reference: '#CMD-2026-280', date: '2026-10-12', totalAmount: 8400, status: 'Facturée' },
    ],
  },
  {
    id: 'cust-004',
    customerType: 'COMPANY',
    fullName: 'Direction des Achats',
    companyName: 'Hôtel Les Dunes d’Or Djerba',
    taxId: '0984321/B/P/000',
    email: 'achats@dunesdor.com',
    phone: '+216 73 222 333',
    city: 'Djerba',
    address: 'Zone Touristique Midoun',
    totalOrders: 4,
    totalSpentTnd: 32600,
    outstandingBalanceTnd: 7070,
    isVip: true,
    createdAt: '2026-08-15T11:20:00Z',
    recentOrders: [
      { reference: '#CMD-2026-399', date: '2026-11-13', totalAmount: 7070, status: 'En Préparation' },
    ],
  },
];

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerItem | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const [formType, setFormType] = useState<'INDIVIDUAL' | 'COMPANY'>('INDIVIDUAL');
  const [formFullName, setFormFullName] = useState('');
  const [formCompanyName, setFormCompanyName] = useState('');
  const [formTaxOrCin, setFormTaxOrCin] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formCity, setFormCity] = useState('Tunis');
  const [formAddress, setFormAddress] = useState('');

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchApi('/customers?limit=200');
      const list = Array.isArray(res) ? res : res?.items || res?.data || [];
      setCustomers(Array.isArray(list) ? list : []);
    } catch {
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formFullName.trim() || !formEmail.trim()) return;
    setSaving(true);
    try {
      const parts = formFullName.trim().split(' ');
      await fetchApi('/customers', {
        method: 'POST',
        body: JSON.stringify({
          firstName: parts[0],
          lastName: parts.slice(1).join(' ') || 'Royal',
          email: formEmail.trim(),
          phone: formPhone.trim(),
          customerType: formType,
          companyName: formType === 'COMPANY' ? formCompanyName.trim() : undefined,
          taxId: formType === 'COMPANY' ? formTaxOrCin.trim() : undefined,
          cin: formType === 'INDIVIDUAL' ? formTaxOrCin.trim() : undefined,
          city: formCity.trim(),
          address: formAddress.trim(),
        }),
      });
      setIsCreateOpen(false);
      setFormFullName('');
      setFormEmail('');
      setFormPhone('');
      setFormCompanyName('');
      setFormTaxOrCin('');
      setFormAddress('');
      setFeedbackMessage('Fiche client créée avec succès dans PostgreSQL.');
      await loadCustomers();
    } catch (err: any) {
      setFeedbackMessage(err?.message || 'Erreur lors de la création client.');
    } finally {
      setSaving(false);
    }
  };

  const stats = useMemo(() => {
    const total = customers.length;
    const vips = customers.filter((c) => c.isVip).length;
    const totalSpent = customers.reduce((acc, c) => acc + c.totalSpentTnd, 0);
    const avgSpent = total > 0 ? Math.round(totalSpent / total) : 0;
    return { total, vips, totalSpent, avgSpent };
  }, [customers]);

  const columns: ColumnDef<CustomerItem>[] = [
    {
      key: 'customer',
      header: 'Client & Raison Sociale',
      sortable: true,
      sortValue: (row) => row.companyName || row.fullName,
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-neutral-100 border border-neutral-200 text-neutral-800 flex items-center justify-center font-bold text-xs shrink-0">
            {row.fullName.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-neutral-900 text-xs">
                {row.companyName || row.fullName}
              </span>
              {row.isVip && (
                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                  VIP
                </span>
              )}
            </div>
            <div className="text-[11px] text-neutral-500">
              {row.companyName ? `Représentant : ${row.fullName}` : row.email}
            </div>
          </div>
        </div>
      ),
      printRender: (row) => `${row.companyName || row.fullName} (${row.email})`,
    },
    {
      key: 'type',
      header: 'Type & Identification',
      sortable: true,
      sortValue: (row) => row.customerType,
      render: (row) => (
        <div>
          <span
            className={cn(
              'inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border',
              row.customerType === 'COMPANY'
                ? 'bg-blue-50 text-blue-700 border-blue-200'
                : 'bg-neutral-100 text-neutral-700 border-neutral-200'
            )}
          >
            {row.customerType === 'COMPANY' ? 'Société (B2B)' : 'Particulier (B2C)'}
          </span>
          <div className="text-[10px] font-mono text-neutral-500 mt-0.5">
            {row.taxId ? `MF: ${row.taxId}` : row.cin ? `CIN: ${row.cin}` : '—'}
          </div>
        </div>
      ),
      printRender: (row) => row.customerType === 'COMPANY' ? `Société (MF: ${row.taxId || 'N/A'})` : `Particulier (CIN: ${row.cin || 'N/A'})`,
    },
    {
      key: 'phone',
      header: 'Coordonnées & Ville',
      sortable: true,
      sortValue: (row) => row.city,
      render: (row) => (
        <div>
          <div className="text-xs text-neutral-800 font-medium">{row.phone}</div>
          <div className="text-[11px] text-neutral-500 flex items-center gap-1 mt-0.5">
            <MapPin className="w-3 h-3 text-neutral-400" />
            <span>{row.city}</span>
          </div>
        </div>
      ),
      printRender: (row) => `${row.phone} - ${row.city}`,
    },
    {
      key: 'totalOrders',
      header: 'Commandes',
      sortable: true,
      sortValue: (row) => row.totalOrders,
      render: (row) => (
        <span className="font-mono text-xs font-bold text-neutral-900">
          {row.totalOrders} cmd
        </span>
      ),
      printRender: (row) => `${row.totalOrders} commandes`,
    },
    {
      key: 'totalSpentTnd',
      header: 'Chiffre d’Affaires (LTV)',
      sortable: true,
      sortValue: (row) => row.totalSpentTnd,
      render: (row) => (
        <span className="font-mono text-xs font-black text-neutral-900">
          {formatTndCurrency(row.totalSpentTnd)}
        </span>
      ),
      printRender: (row) => formatTndCurrency(row.totalSpentTnd),
    },
    {
      key: 'outstandingBalanceTnd',
      header: 'Encours / Solde',
      sortable: true,
      sortValue: (row) => row.outstandingBalanceTnd,
      render: (row) => (
        <div>
          {row.outstandingBalanceTnd > 0 ? (
            <span className="font-mono text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
              {formatTndCurrency(row.outstandingBalanceTnd)}
            </span>
          ) : (
            <span className="text-[11px] text-emerald-700 font-medium">À jour (0 DT)</span>
          )}
        </div>
      ),
      printRender: (row) => row.outstandingBalanceTnd > 0 ? formatTndCurrency(row.outstandingBalanceTnd) : 'À jour',
    },
    {
      key: 'createdAt',
      header: 'Date d’Inscription',
      sortable: true,
      sortValue: (row) => new Date(row.createdAt).getTime(),
      render: (row) => (
        <div className="text-xs">
          <div className="font-medium text-neutral-900">
            {new Date(row.createdAt).toLocaleDateString('fr-FR', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })}
          </div>
          <div className="text-[11px] text-neutral-400 font-mono">
            {new Date(row.createdAt).toLocaleTimeString('fr-FR', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
        </div>
      ),
      printRender: (row) => new Date(row.createdAt).toLocaleDateString('fr-FR'),
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right no-print',
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={() => setSelectedCustomer(row)}
            className="p-1.5 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 transition shadow-2xs cursor-pointer"
            title="Consulter la fiche client et encours"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-[1720px] mx-auto">
      <Toast
        isOpen={!!feedbackMessage}
        message={feedbackMessage || ''}
        type="success"
        onClose={() => setFeedbackMessage(null)}
      />

      {/* 1. Page Header Card (Master Layout Standard) */}
      <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-sm p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-heading font-black text-neutral-900 tracking-tight">
              Fichier Clients & CRM Omnicanal
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-700 border border-amber-500/20">
              CRM & FIDÉLITÉ
            </span>
          </div>
          <p className="text-xs text-neutral-500 mt-1 max-w-2xl">
            Gérez vos comptes clients particuliers et sociétés B2B, l’historique d’achats cumulés et les encours financiers.
          </p>
          <Breadcrumb
            className="mt-2"
            items={[
              { label: 'Ventes & Distribution', href: '/dashboard/section/sales' },
              { label: 'Fiches clients' },
            ]}
          />
        </div>
        <Button
          variant="gold"
          onClick={() => setIsCreateOpen(true)}
          className="text-xs px-4 py-2.5 flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Nouveau Client</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 no-print">
        <div className="p-4 rounded-2xl bg-white border border-neutral-200/90 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-neutral-500">
            <span>Clients Enregistrés</span>
            <Users className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="text-2xl font-black text-neutral-900 font-heading">
            {stats.total}
          </div>
          <div className="text-[11px] text-neutral-500">Comptes B2C & B2B</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-neutral-200/90 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-amber-700">
            <span>Comptes VIP</span>
            <Tag className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-900 font-heading">
            {stats.vips}
          </div>
          <div className="text-[11px] text-amber-600 font-medium">Clients fidèles & architectes</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-neutral-200/90 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-neutral-500">
            <span>Volume d’Achats Total</span>
            <ShoppingBag className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="text-2xl font-black text-neutral-900 font-heading">
            {formatTndCurrency(stats.totalSpent)}
          </div>
          <div className="text-[11px] text-neutral-500">Chiffre d’affaires cumulé</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-neutral-200/90 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-emerald-700">
            <span>Panier Moyen LTV</span>
            <CreditCard className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-900 font-heading">
            {formatTndCurrency(stats.avgSpent)}
          </div>
          <div className="text-[11px] text-emerald-600 font-medium">Valeur client moyenne</div>
        </div>
      </div>

      <DataTable<CustomerItem>
        data={customers}
        isLoading={loading}
        columns={columns}
        keyExtractor={(item) => item.id}
        searchPlaceholder="Rechercher par nom, email, téléphone, matricule..."
        searchKeys={['fullName', 'companyName', 'email', 'phone', 'city', 'taxId', 'cin']}
        supportedModes={['table', 'list', 'matrix']}
        defaultMode="table"
        printTitle="Référentiel Fichier Clients — Royal"
        exportFileName="clients_royal"
      />

      {selectedCustomer && (
        <Modal
          isOpen={!!selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
          size="4xl"
          title={
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 border border-amber-500/20 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5 text-amber-600" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-heading font-black text-lg text-neutral-900">
                    Fiche Client — {selectedCustomer.companyName || selectedCustomer.fullName}
                  </span>
                  {selectedCustomer.isVip && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                      VIP
                    </span>
                  )}
                </div>
                <div className="text-xs text-neutral-500">
                  {selectedCustomer.customerType === 'COMPANY' ? 'Compte Société B2B' : 'Compte Particulier B2C'}
                </div>
              </div>
            </div>
          }
          footer={
            <div className="flex items-center justify-between w-full">
              <Button
                variant="outline"
                onClick={() => window.print()}
                className="text-xs px-3.5 py-2 flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimer Fiche Client</span>
              </Button>
              <Button
                variant="gold"
                onClick={() => setSelectedCustomer(null)}
                className="text-xs px-4 py-2"
              >
                Fermer
              </Button>
            </div>
          }
        >
          <div className="p-6 space-y-5 text-xs">
            <DocumentPrintHeader
              docCode="CMD"
              docTitle="Fiche Client CRM"
              reference={selectedCustomer.taxId || selectedCustomer.cin || selectedCustomer.id.slice(-8).toUpperCase()}
              date={selectedCustomer.createdAt}
              status={selectedCustomer.isVip ? 'VIP' : 'Standard'}
            />
            <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="text-[10px] font-bold text-neutral-400 uppercase block mb-1">
                  Contact & Communication
                </span>
                <div className="font-bold text-neutral-900">{selectedCustomer.fullName}</div>
                <div className="text-neutral-600">{selectedCustomer.email}</div>
                <div className="text-neutral-600">{selectedCustomer.phone}</div>
              </div>
              <div>
                <span className="text-[10px] font-bold text-neutral-400 uppercase block mb-1">
                  Adresse & Localisation
                </span>
                <div className="text-neutral-800">{selectedCustomer.address}</div>
                <div className="font-semibold text-neutral-900">{selectedCustomer.city}</div>
                {selectedCustomer.taxId && (
                  <div className="font-mono text-neutral-500 mt-1">MF : {selectedCustomer.taxId}</div>
                )}
              </div>
            </div>

            <div>
              <h4 className="font-bold text-neutral-900 mb-2">Dernières Commandes Passées</h4>
              <div className="rounded-xl border border-neutral-200 overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-neutral-50 border-b border-neutral-200 text-[10px] uppercase text-neutral-500 font-bold">
                    <tr>
                      <th className="py-2.5 px-3">Réf. Commande</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3 text-right">Montant</th>
                      <th className="py-2.5 px-3 text-right">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {selectedCustomer.recentOrders.map((ord, idx) => (
                      <tr key={idx}>
                        <td className="py-2.5 px-3 font-mono font-bold text-neutral-900">{ord.reference}</td>
                        <td className="py-2.5 px-3 text-neutral-600">{ord.date}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-neutral-900">
                          {formatTndCurrency(ord.totalAmount)}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-neutral-100 text-neutral-700">
                            {ord.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <DocumentPrintFooter
              docCode="CMD"
              reference={selectedCustomer.taxId || selectedCustomer.cin || selectedCustomer.id.slice(-8).toUpperCase()}
            />
          </div>
        </Modal>
      )}

      {isCreateOpen && (
        <Modal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          size="2xl"
          title="Nouveau Client CRM"
          footer={
            <div className="flex justify-end gap-2 w-full">
              <Button variant="outline" onClick={() => setIsCreateOpen(false)} className="text-xs px-4 py-2">
                Annuler
              </Button>
              <Button variant="gold" disabled={saving} onClick={handleCreateCustomer} className="text-xs px-5 py-2">
                {saving ? 'Enregistrement...' : 'Enregistrer le Client'}
              </Button>
            </div>
          }
        >
          <form onSubmit={handleCreateCustomer} className="p-6 space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-neutral-700 mb-1">Type de Compte</label>
                <select
                  value={formType}
                  onChange={(e) => setFormType(e.target.value as any)}
                  className="w-full h-10 px-3 rounded-xl border border-neutral-200 bg-white"
                >
                  <option value="INDIVIDUAL">Particulier (B2C)</option>
                  <option value="COMPANY">Société (B2B)</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-neutral-700 mb-1">Nom &amp; Prénom</label>
                <input
                  type="text"
                  required
                  value={formFullName}
                  onChange={(e) => setFormFullName(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-neutral-200"
                />
              </div>
              {formType === 'COMPANY' && (
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Raison Sociale</label>
                  <input
                    type="text"
                    value={formCompanyName}
                    onChange={(e) => setFormCompanyName(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-neutral-200"
                  />
                </div>
              )}
              <div>
                <label className="block font-bold text-neutral-700 mb-1">
                  {formType === 'COMPANY' ? 'Matricule Fiscal' : 'N° CIN'}
                </label>
                <input
                  type="text"
                  value={formTaxOrCin}
                  onChange={(e) => setFormTaxOrCin(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-neutral-200 font-mono"
                />
              </div>
              <div>
                <label className="block font-bold text-neutral-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-neutral-200"
                />
              </div>
              <div>
                <label className="block font-bold text-neutral-700 mb-1">Téléphone</label>
                <input
                  type="text"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-neutral-200"
                />
              </div>
              <div>
                <label className="block font-bold text-neutral-700 mb-1">Adresse</label>
                <input
                  type="text"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-neutral-200"
                />
              </div>
              <div>
                <label className="block font-bold text-neutral-700 mb-1">Ville</label>
                <input
                  type="text"
                  value={formCity}
                  onChange={(e) => setFormCity(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-neutral-200"
                />
              </div>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
