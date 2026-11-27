'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  FileInput,
  FileCheck,
  FileText,
  Truck,
  Warehouse,
  Package,
  Eye,
  Printer,
  Download,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Building2,
  User,
  Calendar,
  Layers,
  Search,
  Plus,
  Trash2,
  Edit2,
  Maximize2,
  Check,
  Paperclip,
  Upload,
  ArrowRight,
  ShieldCheck,
  XCircle,
  ExternalLink,
  ChevronRight,
  Info,
  DollarSign,
  Boxes,
} from 'lucide-react';
import {
  DataTable,
  ColumnDef,
  DisplayMode,
  Button,
  Input,
  Select,
  Badge,
  Modal,
  DeleteConfirmModal,
  Breadcrumb,
  Toast,
  Textarea,
} from '@/components/ui';
import { fetchApi } from '@/lib/api';
import { cn, formatTndCurrency } from '@/lib/utils';
import { useSystemDocumentConfig } from '@/hooks/useSystemDocumentConfig';
import { DocumentPrintHeader, DocumentPrintFooter } from '@/components/dashboard/DocumentPrintLayout';

// ══════════════════════════════════════════════════════════════════════════════════
// TYPES: GOODS RECEIPT (BON D'ENTRÉE) & PURCHASE ORDER
// ══════════════════════════════════════════════════════════════════════════════════

export type StockInStatus =
  | 'DRAFT'
  | 'PENDING_DOCS'
  | 'INSPECTION'
  | 'CONFIRMED'
  | 'CANCELLED';

export interface StockInArticleItem {
  id: string;
  sku: string;
  name: string;
  orderedQty: number;
  receivedQty: number;
  unitPriceHt: number;
  taxRate: number; // ex: 19%
  storageLocation: string; // ex: "DEP-SOUSSE-01 (Stock Général)" ou "DEP-SOUSSE/A1-T1-E01"
}

export interface AttachedDocument {
  id: string;
  name: string;
  type: 'SUPPLIER_BL' | 'SUPPLIER_INVOICE' | 'OTHER';
  fileType: 'pdf' | 'image';
  fileUrl: string;
  uploadedAt: string;
  documentRef?: string; // ex: "BL-ATM-2026-9921"
}

export interface GoodsReceiptItem {
  id: string;
  receiptNumber: string; // ex: "BE-2026-0042"
  poNumber: string; // ex: "CMD-ATM-08"
  supplierId: string;
  supplierName: string;
  supplierCode: string;
  supplierType: 'COMPANY' | 'INDIVIDUAL';
  supplierTaxIdOrCin: string;
  warehouseId: string;
  warehouseName: string;
  warehouseCode: string;
  targetStorageLevel: 'WAREHOUSE_DIRECT' | 'AISLE' | 'TARMA' | 'SHELF_PRECISE';
  targetLocationDetail: string;
  status: StockInStatus;
  items: StockInArticleItem[];
  attachedDocuments: AttachedDocument[];
  totalHt: number;
  totalTtc: number;
  receptionDate: string;
  expectedDate?: string;
  receivedBy: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export default function StockInDashboardPage() {
  const sysDoc = useSystemDocumentConfig();
  const [receipts, setReceipts] = React.useState<GoodsReceiptItem[]>([]);
  const [suppliersList, setSuppliersList] = React.useState<Array<{ id: string; name: string; code?: string; supplierType?: string; taxId?: string; cin?: string; leadTimeDays?: number }>>([]);
  const [warehousesList, setWarehousesList] = React.useState<Array<{ id: string; name: string; code: string; city?: string }>>([]);
  const [catalogProducts, setCatalogProducts] = React.useState<Array<{ id: string; sku: string; name: string; basePrice?: number; sellingPrice?: number }>>([]);
  const [selectedAddSku, setSelectedAddSku] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(true);
  const [feedbackMessage, setFeedbackMessage] = React.useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadStockIns = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const [res, supRes, whRes, prodRes] = await Promise.all([
        fetchApi('/storefront-cms/sys-config/stockIns').catch(() => null),
        fetchApi('/suppliers').catch(() => []),
        fetchApi('/warehouses').catch(() => []),
        fetchApi('/products?status=ACTIVE&limit=100').catch(() => null),
      ]);
      const list = res?.value || res?.data?.value || [];
      setReceipts(Array.isArray(list) ? list : []);

      const sups = Array.isArray(supRes) ? supRes : supRes?.data || [];
      setSuppliersList(Array.isArray(sups) ? sups : []);

      const whs = Array.isArray(whRes) ? whRes : whRes?.data || [];
      setWarehousesList(Array.isArray(whs) ? whs : []);

      const prods = Array.isArray(prodRes) ? prodRes : prodRes?.data || prodRes?.items || [];
      setCatalogProducts(Array.isArray(prods) ? prods : []);
    } catch {
      setReceipts([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadStockIns();
  }, [loadStockIns]);

  // Modals state
  const [isWizardOpen, setIsWizardOpen] = React.useState(false);
  const [previewReceipt, setPreviewReceipt] = React.useState<GoodsReceiptItem | null>(null);
  const [activeDocumentPreview, setActiveDocumentPreview] = React.useState<AttachedDocument | null>(null);
  const [selectedReceiptIds, setSelectedReceiptIds] = React.useState<string[]>([]);
  const [bulkDeleteReceiptIds, setBulkDeleteReceiptIds] = React.useState<string[]>([]);

  const handleBulkReceiptStatus = async (status: StockInStatus) => {
    if (selectedReceiptIds.length === 0) return;
    const previous = receipts;
    const idSet = new Set(selectedReceiptIds);
    const nextList = receipts.map((r) => (idSet.has(r.id) ? { ...r, status } : r));
    setReceipts(nextList);
    try {
      await fetchApi('/storefront-cms/sys-config/stockIns', {
        method: 'PUT',
        body: JSON.stringify({ value: nextList }),
      });
      showToast('success', `${selectedReceiptIds.length} bon(s) d’entrée passé(s) en ${status}.`);
      setSelectedReceiptIds([]);
    } catch (err: any) {
      setReceipts(previous);
      showToast('error', err?.message || 'Erreur lors de la mise à jour des bons d’entrée.');
    }
  };

  const confirmBulkDeleteReceipts = async () => {
    if (bulkDeleteReceiptIds.length === 0) return;
    const previous = receipts;
    const idSet = new Set(bulkDeleteReceiptIds);
    const nextList = receipts.filter((r) => !idSet.has(r.id));
    setReceipts(nextList);
    try {
      await fetchApi('/storefront-cms/sys-config/stockIns', {
        method: 'PUT',
        body: JSON.stringify({ value: nextList }),
      });
      showToast('success', `${bulkDeleteReceiptIds.length} bon(s) d’entrée supprimé(s).`);
      setBulkDeleteReceiptIds([]);
      setSelectedReceiptIds([]);
    } catch (err: any) {
      setReceipts(previous);
      showToast('error', err?.message || 'Erreur lors de la suppression.');
    }
  };

  // Filters State
  const [filterStatus, setFilterStatus] = React.useState<string>('ALL');
  const [filterWarehouse, setFilterWarehouse] = React.useState<string>('ALL');
  const [filterSupplier, setFilterSupplier] = React.useState<string>('ALL');

  // Wizard Multi-Step State
  const [wizardStep, setWizardStep] = React.useState<1 | 2 | 3 | 4>(1);
  const [formPoNumber, setFormPoNumber] = React.useState('');
  const [formSupplierId, setFormSupplierId] = React.useState('');
  const [formWarehouseId, setFormWarehouseId] = React.useState('');
  const [formStorageLevel, setFormStorageLevel] = React.useState<'WAREHOUSE_DIRECT' | 'AISLE' | 'TARMA' | 'SHELF_PRECISE'>('WAREHOUSE_DIRECT');
  const [formLocationDetail, setFormLocationDetail] = React.useState('Stock Général Direct');

  // Articles in wizard
  const [wizardItems, setWizardItems] = React.useState<StockInArticleItem[]>([]);

  // Documents attached in wizard
  const [formBlRef, setFormBlRef] = React.useState('');
  const [formBlFileUrl, setFormBlFileUrl] = React.useState('');
  const [formBlFileType, setFormBlFileType] = React.useState<'pdf' | 'image'>('pdf');
  const [formInvoiceRef, setFormInvoiceRef] = React.useState('');
  const [formInvoiceFileUrl, setFormInvoiceFileUrl] = React.useState('');
  const [formInvoiceFileType, setFormInvoiceFileType] = React.useState<'pdf' | 'image'>('pdf');
  const [formNotes, setFormNotes] = React.useState('');

  // Auto-prefill Stock-In Wizard when navigated from Bon de Réception (?fromBr=BR-2026-XXXX)
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const fromBr = params.get('fromBr');
    if (!fromBr) return;
    fetchApi('/storefront-cms/sys-config/purchaseReceipts')
      .then((res) => {
        const raw = res?.value ?? res?.data?.value ?? res?.data ?? res;
        const list = Array.isArray(raw) ? raw : [];
        const match = list.find((r: any) => r.receiptNumber === fromBr);
        if (match) {
          setWizardStep(1);
          setFormPoNumber(match.purchaseOrderRef || fromBr);
          setFormBlRef(match.supplierDeliveryNoteNumber || fromBr);
          setFormLocationDetail(match.warehouseName || 'Stock Général Direct');
          setFormNotes(`Entrée en stock générée depuis le Bon de Réception ${fromBr} (${match.supplierName})`);
          if (Array.isArray(match.items) && match.items.length > 0) {
            setWizardItems(
              match.items.map((it: any, i: number) => ({
                id: `br-${i}-${Date.now()}`,
                sku: it.sku || `RYL-${i + 1}`,
                name: it.name || 'Article réceptionné',
                orderedQty: Number(it.expectedQty || it.receivedQty || 1),
                receivedQty: Number(it.receivedQty || 1),
                unitPriceHt: Number(it.unitCostHt || 0),
                taxRate: sysDoc.defaultVatRate || 19,
                storageLocation: match.warehouseName || 'Stock Général Direct',
              }))
            );
          }
          setIsWizardOpen(true);
        }
      })
      .catch(() => null);
  }, [sysDoc.defaultVatRate]);

  const showToast = (type: 'success' | 'error', text: string) => {
    setFeedbackMessage({ type, text });
    setTimeout(() => setFeedbackMessage(null), 3500);
  };

  // Open New Wizard
  const openNewWizard = () => {
    const firstSup = suppliersList[0];
    const firstWh = warehousesList[0];
    setWizardStep(1);
    setFormPoNumber(sysDoc.generateNextRef('BC', receipts.length + 1));
    setFormSupplierId(firstSup?.id || '');
    setFormWarehouseId(firstWh?.id || '');
    setFormStorageLevel('WAREHOUSE_DIRECT');
    setFormLocationDetail(firstWh ? `${firstWh.name} (Stock Général Direct)` : 'Stock Général Direct');
    setWizardItems([]);
    setSelectedAddSku(catalogProducts[0]?.sku || '');
    setFormBlRef('');
    setFormBlFileUrl('');
    setFormInvoiceRef('');
    setFormInvoiceFileUrl('');
    setFormNotes('');
    setIsWizardOpen(true);
  };

  // Filtered Receipts
  const filteredReceipts = React.useMemo(() => {
    return receipts.filter((r) => {
      if (filterStatus !== 'ALL' && r.status !== filterStatus) return false;
      if (filterWarehouse !== 'ALL' && r.warehouseId !== filterWarehouse) return false;
      if (filterSupplier !== 'ALL' && r.supplierId !== filterSupplier) return false;
      return true;
    });
  }, [receipts, filterStatus, filterWarehouse, filterSupplier]);

  // KPIs
  const totalCount = receipts.length;
  const pendingCount = receipts.filter((r) => r.status === 'INSPECTION' || r.status === 'PENDING_DOCS').length;
  const confirmedCount = receipts.filter((r) => r.status === 'CONFIRMED').length;
  const totalReceivedValue = receipts
    .filter((r) => r.status === 'CONFIRMED')
    .reduce((acc, r) => acc + r.totalTtc, 0);

  // Calculate Wizard Totals
  const wizardTotalHt = wizardItems.reduce((acc, it) => acc + it.receivedQty * it.unitPriceHt, 0);
  const wizardTotalTtc = wizardItems.reduce(
    (acc, it) => acc + it.receivedQty * it.unitPriceHt * (1 + it.taxRate / 100),
    0
  );

  // Complete and Validate Bon d'Entrée
  const handleConfirmAndStockIn = async () => {
    const nextReceiptNum = sysDoc.generateNextRef('BE', receipts.length + 1);
    const itemsWithVat = wizardItems.map((it) => ({ ...it, taxRate: sysDoc.defaultVatRate || it.taxRate || 19 }));
    const nextTotalHt = itemsWithVat.reduce((acc, it) => acc + it.receivedQty * it.unitPriceHt, 0);
    const nextTotalTtc = itemsWithVat.reduce(
      (acc, it) => acc + it.receivedQty * it.unitPriceHt * (1 + (it.taxRate || 19) / 100),
      0
    );

    const matchedSup = suppliersList.find((s) => s.id === formSupplierId);
    const matchedWh = warehousesList.find((w) => w.id === formWarehouseId);
    const docs: AttachedDocument[] = [];
    if (formBlRef.trim()) {
      docs.push({
        id: `doc-${Date.now()}-bl`,
        name: `${formBlRef.trim()}.${formBlFileType}`,
        type: 'SUPPLIER_BL',
        fileType: formBlFileType,
        fileUrl: formBlFileUrl || '',
        uploadedAt: new Date().toISOString(),
        documentRef: formBlRef.trim(),
      });
    }
    if (formInvoiceRef.trim()) {
      docs.push({
        id: `doc-${Date.now()}-fac`,
        name: `${formInvoiceRef.trim()}.${formInvoiceFileType}`,
        type: 'SUPPLIER_INVOICE',
        fileType: formInvoiceFileType,
        fileUrl: formInvoiceFileUrl || '',
        uploadedAt: new Date().toISOString(),
        documentRef: formInvoiceRef.trim(),
      });
    }

    const newReceipt: GoodsReceiptItem = {
      id: `rec-${Date.now()}`,
      receiptNumber: nextReceiptNum,
      poNumber: formPoNumber,
      supplierId: formSupplierId || matchedSup?.id || '',
      supplierName: matchedSup?.name || 'Fournisseur',
      supplierCode: matchedSup?.code || 'FRN',
      supplierType: matchedSup?.supplierType === 'INDIVIDUAL' ? 'INDIVIDUAL' : 'COMPANY',
      supplierTaxIdOrCin: matchedSup?.cin ? `CIN: ${matchedSup.cin}` : matchedSup?.taxId || '—',
      warehouseId: formWarehouseId || matchedWh?.id || '',
      warehouseName: matchedWh?.name || 'Entrepôt',
      warehouseCode: matchedWh?.code || 'WH',
      targetStorageLevel: formStorageLevel,
      targetLocationDetail: formLocationDetail,
      status: 'CONFIRMED',
      items: itemsWithVat,
      attachedDocuments: docs,
      totalHt: nextTotalHt,
      totalTtc: nextTotalTtc,
      receptionDate: new Date().toISOString(),
      receivedBy: 'Réceptionnaire Quai',
      notes: formNotes || 'Bon d’entrée validé et imputé au stock physique avec succès.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const previous = receipts;
    const nextList = [newReceipt, ...receipts];
    setReceipts(nextList);
    try {
      await fetchApi('/storefront-cms/sys-config/stockIns', {
        method: 'PUT',
        body: JSON.stringify({ value: nextList }),
      });
      if (itemsWithVat.length > 0) {
        await fetchApi('/storefront-cms/stock-lifecycle/apply', {
          method: 'POST',
          body: JSON.stringify({
            docType: 'BE',
            docReference: nextReceiptNum,
            restore: false,
            items: itemsWithVat.map((it) => ({ sku: it.sku, quantity: it.receivedQty })),
          }),
        });
      }
      setIsWizardOpen(false);
      showToast(
        'success',
        `Bon d'Entrée ${nextReceiptNum} validé ! Stock réel mis à jour en base.`
      );
    } catch (err: any) {
      setReceipts(previous);
      showToast('error', err?.message || "Échec lors de l'enregistrement du bon d'entrée.");
    }
  };

  // Columns definition
  const columns: ColumnDef<GoodsReceiptItem>[] = [
    {
      key: 'receiptNumber',
      header: 'N° Bon d’Entrée',
      sortable: true,
      className: 'whitespace-nowrap',
      render: (item) => (
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-xs font-black px-2.5 py-1 rounded-lg bg-[#FBF6E8] text-[#8C6400] border border-[#E6D6A6] shadow-2xs">
              {item.receiptNumber}
            </span>
          </div>
          <span className="text-[10px] font-mono text-neutral-400 block">
            CMD: {item.poNumber}
          </span>
        </div>
      ),
      printRender: (item) => item.receiptNumber,
    },
    {
      key: 'supplier',
      header: 'Fournisseur / Partenaire',
      sortable: true,
      render: (item) => (
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5 font-bold text-neutral-900 text-xs">
            {item.supplierType === 'INDIVIDUAL' ? (
              <User className="w-3.5 h-3.5 text-purple-600 shrink-0" />
            ) : (
              <Building2 className="w-3.5 h-3.5 text-neutral-600 shrink-0" />
            )}
            <span className="truncate max-w-[210px]" title={item.supplierName}>
              {item.supplierName}
            </span>
          </div>
          <div className="text-[10px] text-neutral-500 font-mono flex items-center gap-1.5">
            <span
              className={cn(
                'px-1.5 py-0.2 rounded font-sans font-bold uppercase text-[9px]',
                item.supplierType === 'INDIVIDUAL'
                  ? 'bg-purple-100 text-purple-800'
                  : 'bg-neutral-100 text-neutral-700'
              )}
            >
              {item.supplierType === 'INDIVIDUAL' ? 'Particulier' : 'Société'}
            </span>
            <span>{item.supplierTaxIdOrCin}</span>
          </div>
        </div>
      ),
      printRender: (item) => item.supplierName,
    },
    {
      key: 'destination',
      header: 'Dépôt & Emplacement Cible',
      sortable: true,
      render: (item) => (
        <div className="space-y-0.5 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-neutral-900">
            <Warehouse className="w-3.5 h-3.5 text-amber-700 shrink-0" />
            <span>{item.warehouseName}</span>
          </div>
          <div className="text-[11px] text-neutral-500 flex items-center gap-1 font-mono">
            <span className="text-amber-800 font-semibold">{item.targetLocationDetail}</span>
          </div>
        </div>
      ),
      printRender: (item) => `${item.warehouseName} (${item.targetLocationDetail})`,
    },
    {
      key: 'articlesCount',
      header: 'Articles & Qtés',
      sortable: true,
      sortValue: (item) => item.items.reduce((acc, it) => acc + it.receivedQty, 0),
      className: 'text-center whitespace-nowrap',
      render: (item) => {
        const totalPcs = item.items.reduce((acc, it) => acc + it.receivedQty, 0);
        return (
          <div className="space-y-0.5">
            <span className="font-mono text-xs font-bold text-neutral-900">
              {item.items.length} réf. ({totalPcs} pcs)
            </span>
            <span className="text-[10px] text-neutral-400 block">Réceptionnées</span>
          </div>
        );
      },
      printRender: (item) => `${item.items.length} articles`,
    },
    {
      key: 'totalTtc',
      header: 'Montant Total TTC',
      sortable: true,
      sortValue: (item) => item.totalTtc,
      className: 'text-right whitespace-nowrap',
      render: (item) => (
        <div className="space-y-0.5 text-right font-mono">
          <span className="text-xs font-black text-neutral-950 block">
            {formatTndCurrency(item.totalTtc)}
          </span>
          <span className="text-[10px] text-neutral-400 block">
            HT: {formatTndCurrency(item.totalHt)}
          </span>
        </div>
      ),
      printRender: (item) => `${item.totalTtc} TND`,
    },
    {
      key: 'documents',
      header: 'Pièces Justificatives',
      className: 'whitespace-nowrap',
      render: (item) => {
        if (item.attachedDocuments.length === 0) {
          return (
            <span className="text-[11px] text-neutral-400 italic font-mono">
              Aucune pièce
            </span>
          );
        }
        return (
          <div className="flex items-center gap-1.5 flex-wrap">
            {item.attachedDocuments.map((doc) => (
              <button
                key={doc.id}
                type="button"
                onClick={() => setActiveDocumentPreview(doc)}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border transition bg-neutral-50 hover:bg-neutral-100 text-neutral-700 border-neutral-200 cursor-pointer shadow-2xs"
                title={`Prévisualiser ${doc.name}`}
              >
                <Paperclip className="w-3 h-3 text-neutral-400" />
                <span>{doc.type === 'SUPPLIER_BL' ? 'BL Fournisseur' : 'Facture'}</span>
              </button>
            ))}
          </div>
        );
      },
      printRender: (item) => `${item.attachedDocuments.length} docs`,
    },
    {
      key: 'status',
      header: 'Statut Réception',
      sortable: true,
      className: 'text-center whitespace-nowrap',
      render: (item) => {
        switch (item.status) {
          case 'CONFIRMED':
            return (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 uppercase tracking-wider">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>Imputé en Stock</span>
              </span>
            );
          case 'INSPECTION':
            return (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 uppercase tracking-wider">
                <Clock className="w-3 h-3 text-amber-600" />
                <span>Contrôle Quai</span>
              </span>
            );
          case 'PENDING_DOCS':
            return (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200 uppercase tracking-wider">
                <FileText className="w-3 h-3 text-blue-600" />
                <span>Attente Pièces</span>
              </span>
            );
          default:
            return (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-neutral-100 text-neutral-700 border border-neutral-200 uppercase tracking-wider">
                <span>Brouillon</span>
              </span>
            );
        }
      },
      printRender: (item) => item.status,
    },
    {
      key: 'date',
      header: 'Date Réception',
      sortable: true,
      sortValue: (item) => new Date(item.receptionDate).getTime(),
      className: 'whitespace-nowrap text-neutral-500 font-mono text-[11px]',
      render: (item) =>
        new Date(item.receptionDate).toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }),
      printRender: (item) => new Date(item.receptionDate).toLocaleDateString('fr-FR'),
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right whitespace-nowrap no-print',
      render: (item) => (
        <div className="flex items-center justify-end gap-1.5">
          {/* Official Preview Button */}
          <button
            type="button"
            onClick={() => setPreviewReceipt(item)}
            className="p-1.5 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 transition shadow-2xs cursor-pointer"
            title="Aperçu officiel du Bon d'Entrée"
          >
            <Eye className="w-3.5 h-3.5 text-neutral-600" />
          </button>
        </div>
      ),
      printRender: () => '',
    },
  ];

  return (
    <div className="space-y-6 pb-12 max-w-[1720px] mx-auto">
      {/* Toast Feedback */}
      <Toast
        isOpen={!!feedbackMessage}
        message={feedbackMessage?.text || ''}
        type={feedbackMessage?.type === 'error' ? 'error' : 'success'}
        onClose={() => setFeedbackMessage(null)}
      />

      {/* 1. Header with Actions */}
      <div className="bg-white p-6 rounded-2xl border border-neutral-200/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading font-black text-xl text-neutral-950 tracking-tight">
              Bons d’Entrée & Commandes d’Achat Fournisseurs
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs">
              FLUX LOGISTIQUE DÉPÔT SOUSSE
            </span>
          </div>
          <p className="text-xs text-neutral-500 mt-1 max-w-2xl leading-relaxed">
            Génération des commandes d’achat, réception physique à quai, attachement des BL et Factures fournisseurs 
            (avec prévisualisation PDF/Images), réconciliation des quantités et imputation directe au stock physique.
          </p>
          <Breadcrumb
            className="mt-2 text-xs"
            items={[
              { label: 'Tableau de bord', href: '/dashboard' },
              { label: 'Approvisionnement & Stock', href: '/dashboard/suppliers' },
              { label: 'Bons d’Entrée Stock', href: '/dashboard/stock-in' },
            ]}
          />
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={openNewWizard}
            variant="gold"
            leftIcon={<Plus className="w-4 h-4" />}
            className="text-xs py-2 px-4 shadow-sm"
          >
            Nouveau Bon d’Entrée
          </Button>
        </div>
      </div>

      {/* 2. KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 no-print">
        <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block">
              Total Bons d’Entrée
            </span>
            <span className="text-2xl font-black text-neutral-950 mt-1 block">
              {totalCount}
            </span>
            <span className="text-[11px] text-neutral-400 mt-0.5 block">Historique complet</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-800">
            <FileInput className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block">
              Réceptions en Cours
            </span>
            <span className="text-2xl font-black text-amber-600 mt-1 block">
              {pendingCount}
            </span>
            <span className="text-[11px] text-neutral-400 mt-0.5 block">Contrôle ou pièces manquantes</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block">
              Bons Imputés au Stock
            </span>
            <span className="text-2xl font-black text-emerald-600 mt-1 block">
              {confirmedCount}
            </span>
            <span className="text-[11px] text-neutral-400 mt-0.5 block">Stock physique mis à jour</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block">
              Marchandise Réceptionnée
            </span>
            <span className="text-2xl font-black text-indigo-600 mt-1 block">
              {formatTndCurrency(totalReceivedValue)}
            </span>
            <span className="text-[11px] text-neutral-400 mt-0.5 block">Total TTC entré en stock</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. Main Data Table with Isolated Filters */}
      <DataTable<GoodsReceiptItem>
        data={filteredReceipts}
        columns={columns}
        keyExtractor={(item) => item.id}
        enableMultiSelect={true}
        selectedKeys={selectedReceiptIds}
        onSelectionChange={setSelectedReceiptIds}
        onBulkDelete={(keys) => setBulkDeleteReceiptIds(keys)}
        renderBulkActions={() => (
          <select
            value=""
            onChange={(e) => {
              const st = e.target.value as StockInStatus;
              if (st) handleBulkReceiptStatus(st);
            }}
            aria-label="Changer statut bon d'entrée"
            className="h-7 px-2 rounded-lg border border-[#E6E1D6] bg-white text-[11px] font-semibold text-neutral-700"
          >
            <option value="">Statut entrée...</option>
            <option value="CONFIRMED">Imputé en Stock</option>
            <option value="INSPECTION">En Contrôle Quai</option>
            <option value="PENDING_DOCS">En Attente Pièces</option>
            <option value="CANCELLED">Annulé</option>
          </select>
        )}
        searchPlaceholder="Rechercher par N° Bon d'entrée, N° Commande, fournisseur ou dépôt..."
        searchKeys={['receiptNumber', 'poNumber', 'supplierName', 'warehouseName']}
        supportedModes={['table', 'list', 'matrix']}
        defaultMode="table"
        exportFileName="bons_entree_royal"
        customFilters={[
          {
            key: 'status',
            label: 'Statut',
            value: filterStatus,
            onChange: setFilterStatus,
            allLabel: 'Tous les statuts',
            options: [
              { value: 'CONFIRMED', label: 'Imputés en Stock' },
              { value: 'INSPECTION', label: 'En Contrôle Quai' },
              { value: 'PENDING_DOCS', label: 'En Attente Pièces' },
            ],
          },
          {
            key: 'warehouse',
            label: 'Dépôt',
            value: filterWarehouse,
            onChange: setFilterWarehouse,
            allLabel: 'Tous les dépôts',
            options: warehousesList.map((w) => ({ value: w.id, label: w.name })),
          },
        ]}
      />

      {/* ══════════════════════════════════════════════════════════════════════════════════
          MODAL WIZARD : CRÉATION / RÉCEPTION & BON D'ENTRÉE (4 ÉTAPES)
      ══════════════════════════════════════════════════════════════════════════════════ */}
      <Modal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        title="Création & Réception de Bon d’Entrée"
        subtitle={`Étape ${wizardStep} sur 4 — ${
          wizardStep === 1
            ? 'Commande Fournisseur & Paramètres'
            : wizardStep === 2
            ? 'Attachement Pièces Justificatives (BL & Facture)'
            : wizardStep === 3
            ? 'Contrôle Quai & Ajustement Quantités Réelles'
            : 'Prévisualisation Officielle & Validation'
        }`}
        type="wizard"
        size="4xl"
        footer={
          <div className="flex items-center justify-between w-full">
            {wizardStep > 1 ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setWizardStep((prev) => (prev - 1) as any)}
                className="text-xs"
              >
                Précédent
              </Button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsWizardOpen(false)}
                className="text-xs"
              >
                Annuler
              </Button>
              {wizardStep < 4 ? (
                <Button
                  variant="gold"
                  size="sm"
                  onClick={() => setWizardStep((prev) => (prev + 1) as any)}
                  className="text-xs py-2 px-5"
                >
                  Continuer
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleConfirmAndStockIn}
                  className="text-xs py-2 px-6 bg-emerald-600 text-white hover:bg-emerald-700 flex items-center gap-2 font-bold shadow-sm"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirmer & Imputer au Stock</span>
                </Button>
              )}
            </div>
          </div>
        }
      >
        <div className="p-6 pb-20 space-y-5 text-xs">
          {/* Progress Step Bar */}
          <div className="flex items-center justify-between relative pb-4 border-b border-neutral-100">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs',
                  wizardStep >= 1 ? 'bg-[var(--royal-primary)] text-[var(--royal-primary-text)]' : 'bg-neutral-200 text-neutral-600'
                )}
              >
                1
              </span>
              <span className={cn('font-semibold', wizardStep === 1 && 'text-neutral-950 font-bold')}>
                Commande & Dépôt
              </span>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-neutral-300" />
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs',
                  wizardStep >= 2 ? 'bg-[var(--royal-primary)] text-[var(--royal-primary-text)]' : 'bg-neutral-200 text-neutral-600'
                )}
              >
                2
              </span>
              <span className={cn('font-semibold', wizardStep === 2 && 'text-neutral-950 font-bold')}>
                Documents BL & Facture
              </span>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-neutral-300" />
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs',
                  wizardStep >= 3 ? 'bg-[var(--royal-primary)] text-[var(--royal-primary-text)]' : 'bg-neutral-200 text-neutral-600'
                )}
              >
                3
              </span>
              <span className={cn('font-semibold', wizardStep === 3 && 'text-neutral-950 font-bold')}>
                Réconciliation Quai
              </span>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-neutral-300" />
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs',
                  wizardStep >= 4 ? 'bg-emerald-600 text-white' : 'bg-neutral-200 text-neutral-600'
                )}
              >
                4
              </span>
              <span className={cn('font-semibold', wizardStep === 4 && 'text-emerald-700 font-bold')}>
                Aperçu & Imputation
              </span>
            </div>
          </div>

          {/* STEP 1: PO & DESTINATION PARAMETERS */}
          {wizardStep === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Input
                  label="N° Commande d'Achat (PO) *"
                  value={formPoNumber}
                  onChange={(e) => setFormPoNumber(e.target.value)}
                  placeholder="ex: CMD-2026-09"
                  required
                />
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                    Fournisseur Partenaire *
                  </label>
                  <Select
                    value={formSupplierId}
                    onChange={(e) => setFormSupplierId(e.target.value)}
                    className="w-full text-xs h-9 bg-neutral-50 border-neutral-200 rounded-xl"
                  >
                    <option value="">Sélectionner un fournisseur...</option>
                    {suppliersList.map((sup) => (
                      <option key={sup.id} value={sup.id}>
                        {sup.name}
                        {sup.leadTimeDays ? ` — Délai ${sup.leadTimeDays}j` : ''}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                    Entrepôt Destinataire *
                  </label>
                  <Select
                    value={formWarehouseId}
                    onChange={(e) => {
                      const whId = e.target.value;
                      setFormWarehouseId(whId);
                      const matched = warehousesList.find((w) => w.id === whId);
                      if (matched) setFormLocationDetail(`${matched.name} (Stock Général Direct)`);
                    }}
                    className="w-full text-xs h-9 bg-neutral-50 border-neutral-200 rounded-xl"
                  >
                    <option value="">Sélectionner un entrepôt...</option>
                    {warehousesList.map((wh) => (
                      <option key={wh.id} value={wh.id}>
                        {wh.name} ({wh.code})
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              {/* Flexible level destination selector */}
              <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-neutral-900 text-xs">
                    Niveau d'Emplacement de Stockage (Flexible)
                  </span>
                  <span className="text-[10px] text-amber-800 font-mono">
                    Affectation au dépôt direct OU par allée/râtelier
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-600 mb-1">
                      Mode d'Affectation
                    </label>
                    <Select
                      value={formStorageLevel}
                      onChange={(e) => {
                        const lvl = e.target.value as any;
                        setFormStorageLevel(lvl);
                        const whName = warehousesList.find((w) => w.id === formWarehouseId)?.name || 'Entrepôt';
                        if (lvl === 'WAREHOUSE_DIRECT') {
                          setFormLocationDetail(`${whName} (Stock Général Direct)`);
                        } else if (lvl === 'AISLE') {
                          setFormLocationDetail(`${whName} — Allée`);
                        } else {
                          setFormLocationDetail(`${whName} — Emplacement Précis`);
                        }
                      }}
                      className="w-full text-xs h-9 bg-white border-neutral-200 rounded-xl"
                    >
                      <option value="WAREHOUSE_DIRECT">
                        Directement au Dépôt (Stock Général / Quai)
                      </option>
                      <option value="AISLE">Au niveau d&apos;une Allée</option>
                      <option value="SHELF_PRECISE">Emplacement Précis (Allée / Tarma / Étagère)</option>
                    </Select>
                  </div>
                  <Input
                    label="Détail de l'Emplacement Cible"
                    value={formLocationDetail}
                    onChange={(e) => setFormLocationDetail(e.target.value)}
                    placeholder="ex: Stock Général Direct"
                  />
                </div>
              </div>

              {/* Articles to receive */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-bold text-neutral-900 text-xs">
                    Articles Référencés dans la Commande ({wizardItems.length})
                  </span>
                  <div className="flex items-center gap-2">
                    <Select
                      value={selectedAddSku}
                      onChange={(e) => setSelectedAddSku(e.target.value)}
                      className="text-xs h-8 bg-neutral-50 border-neutral-200 rounded-lg min-w-[210px]"
                    >
                      <option value="">Ajouter un article du catalogue...</option>
                      {catalogProducts.map((p) => (
                        <option key={p.id} value={p.sku}>
                          {p.sku} — {p.name}
                        </option>
                      ))}
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={!selectedAddSku}
                      onClick={() => {
                        const prod = catalogProducts.find((p) => p.sku === selectedAddSku);
                        if (!prod) return;
                        setWizardItems((prev) => [
                          ...prev,
                          {
                            id: `wz-${Date.now()}-${prev.length + 1}`,
                            sku: prod.sku,
                            name: prod.name,
                            orderedQty: 1,
                            receivedQty: 1,
                            unitPriceHt: Number(prod.basePrice || prod.sellingPrice || 0),
                            taxRate: sysDoc.defaultVatRate || 19,
                            storageLocation: formLocationDetail,
                          },
                        ]);
                      }}
                      className="text-xs h-8"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" />
                      Ajouter
                    </Button>
                  </div>
                </div>
                <div className="border border-neutral-200 rounded-xl overflow-hidden bg-white">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-semibold">
                      <tr>
                        <th className="py-2 px-3">Article / SKU</th>
                        <th className="py-2 px-3 text-center">Qté Commandée</th>
                        <th className="py-2 px-3 text-right">Prix Achat HT</th>
                        <th className="py-2 px-3 text-right">Total HT</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {wizardItems.map((item) => (
                        <tr key={item.id}>
                          <td className="py-2.5 px-3">
                            <span className="font-mono text-[10px] font-bold text-neutral-500 block">
                              {item.sku}
                            </span>
                            <span className="font-bold text-neutral-900">{item.name}</span>
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono font-bold">
                            {item.orderedQty} pcs
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono">
                            {formatTndCurrency(item.unitPriceHt)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-neutral-900">
                            {formatTndCurrency(item.orderedQty * item.unitPriceHt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: DOCUMENTS ATTACHMENT (BL & INVOICE WITH PREVIEW) */}
          {wizardStep === 2 && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200 text-blue-950 flex items-start gap-3">
                <Info className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed">
                  <strong>Attachement des Pièces Justificatives Fournisseur :</strong> Téléversez le{' '}
                  <strong>Bon de Livraison Fournisseur papier/scanné</strong> et la{' '}
                  <strong>Facture Fournisseur</strong>. Formats acceptés : <strong>PDF</strong> et{' '}
                  <strong>Images (JPG/PNG)</strong> avec prévisualisation directe.
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. Bon de Livraison Fournisseur */}
                <div className="p-4 rounded-xl bg-white border border-neutral-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-neutral-900 text-xs">
                      1. Bon de Livraison Fournisseur (BL)
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-100 text-neutral-700 border">
                      {formBlFileType.toUpperCase()}
                    </span>
                  </div>
                  <Input
                    label="Numéro du BL Fournisseur *"
                    value={formBlRef}
                    onChange={(e) => setFormBlRef(e.target.value)}
                    placeholder="ex: BL-ATM-2026-9921"
                  />
                  <div className="p-3 rounded-lg border border-dashed border-neutral-300 bg-neutral-50/50 flex flex-col items-center justify-center gap-2">
                    {formBlFileType === 'image' && formBlFileUrl ? (
                      <div className="relative group w-full h-32 rounded-lg overflow-hidden border">
                        <img
                          src={formBlFileUrl}
                          alt="BL Fournisseur"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setActiveDocumentPreview({
                              id: 'bl-prev',
                              name: `${formBlRef}.jpg`,
                              type: 'SUPPLIER_BL',
                              fileType: 'image',
                              fileUrl: formBlFileUrl,
                              uploadedAt: new Date().toISOString(),
                              documentRef: formBlRef,
                            })
                          }
                          className="absolute inset-0 bg-black/40 text-white font-bold text-xs flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition"
                        >
                          <Eye className="w-4 h-4" />
                          <span>Agrandir l'Image</span>
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1 py-4">
                        <FileText className="w-8 h-8 text-neutral-400" />
                        <span className="text-xs text-neutral-600 font-mono">
                          Document PDF joint : {formBlRef}.pdf
                        </span>
                      </div>
                    )}
                    <span className="text-[10px] text-neutral-400">
                      Pièce scannée prête pour archivage
                    </span>
                  </div>
                </div>

                {/* 2. Facture Fournisseur */}
                <div className="p-4 rounded-xl bg-white border border-neutral-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-neutral-900 text-xs">
                      2. Facture Fournisseur (Achat)
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-100 text-neutral-700 border">
                      {formInvoiceFileType.toUpperCase()}
                    </span>
                  </div>
                  <Input
                    label="Numéro de la Facture Fournisseur *"
                    value={formInvoiceRef}
                    onChange={(e) => setFormInvoiceRef(e.target.value)}
                    placeholder="ex: FAC-ATM-2026-0814"
                  />
                  <div className="p-3 rounded-lg border border-dashed border-neutral-300 bg-neutral-50/50 flex flex-col items-center justify-center gap-2">
                    <div className="flex flex-col items-center gap-1 py-4">
                      <FileCheck className="w-8 h-8 text-emerald-600" />
                      <span className="text-xs font-bold text-neutral-800 font-mono">
                        {formInvoiceRef}.pdf
                      </span>
                      <span className="text-[10px] text-emerald-700 font-medium">
                        ✓ Document fiscal prêt pour réconciliation comptable
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: RECONCILIATION & REAL RECEIVED QUANTITIES ADJUSTMENT */}
          {wizardStep === 3 && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 text-emerald-950 flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed">
                  <strong>Contrôle Quai & Ajustement Réel :</strong> Ajustez ci-dessous les{' '}
                  <strong>quantités réellement comptées</strong> et les <strong>prix réels facturés</strong>. 
                  En cas d'avarie ou de reliquat, l'écart sera automatiquement tracé.
                </div>
              </div>

              <div className="border border-neutral-200 rounded-xl overflow-hidden bg-white">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-semibold">
                    <tr>
                      <th className="py-2.5 px-3">Article / SKU</th>
                      <th className="py-2.5 px-3 text-center">Qté Commandée</th>
                      <th className="py-2.5 px-3 text-center">Qté Réelle Reçue</th>
                      <th className="py-2.5 px-3 text-center">Écart</th>
                      <th className="py-2.5 px-3 text-right">Prix Réel Achat HT</th>
                      <th className="py-2.5 px-3 text-right">Total HT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {wizardItems.map((item, idx) => {
                      const diff = item.receivedQty - item.orderedQty;
                      return (
                        <tr key={item.id}>
                          <td className="py-2.5 px-3">
                            <span className="font-mono text-[10px] font-bold text-neutral-500 block">
                              {item.sku}
                            </span>
                            <span className="font-bold text-neutral-900">{item.name}</span>
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono text-neutral-500">
                            {item.orderedQty} pcs
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <input
                              type="number"
                              min="0"
                              max="1000"
                              value={item.receivedQty}
                              onChange={(e) => {
                                const val = parseInt(e.target.value, 10) || 0;
                                setWizardItems((prev) =>
                                  prev.map((it, i) => (i === idx ? { ...it, receivedQty: val } : it))
                                );
                              }}
                              className="w-20 text-center font-mono font-bold text-xs py-1 border border-neutral-300 rounded-lg bg-neutral-50 focus:bg-white"
                            />
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono">
                            {diff === 0 ? (
                              <span className="text-emerald-600 font-bold">0 (Conforme)</span>
                            ) : diff < 0 ? (
                              <span className="text-rose-600 font-bold">{diff} (Manquant)</span>
                            ) : (
                              <span className="text-blue-600 font-bold">+{diff} (Excédent)</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono">
                            <input
                              type="number"
                              step="0.01"
                              value={item.unitPriceHt}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                setWizardItems((prev) =>
                                  prev.map((it, i) => (i === idx ? { ...it, unitPriceHt: val } : it))
                                );
                              }}
                              className="w-24 text-right font-mono text-xs py-1 px-2 border border-neutral-300 rounded-lg bg-neutral-50 focus:bg-white"
                            />
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-neutral-900">
                            {formatTndCurrency(item.receivedQty * item.unitPriceHt)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <Textarea
                label="Observations du Réceptionnaire / Quai"
                placeholder="Indiquez toute remarque sur l'état de l'emballage, le déchargement..."
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                rows={2}
              />
            </div>
          )}

          {/* STEP 4: PREVIEW & FINAL CONFIRMATION */}
          {wizardStep === 4 && (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl border-2 border-neutral-200 bg-white shadow-sm space-y-4 font-sans">
                {/* Official Preview Header */}
                <div className="flex items-start justify-between border-b pb-4 border-neutral-200">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-[var(--royal-primary)] text-[var(--royal-primary-text)] flex items-center justify-center font-black text-sm">
                        R
                      </div>
                      <span className="font-heading font-black text-base text-neutral-900 tracking-tight">
                        ROYAL LUXURY HOME
                      </span>
                    </div>
                    <span className="text-[11px] text-neutral-500 block mt-1">
                      Bon d'Entrée & Réception Quai Officiel
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="font-mono text-sm font-black px-2.5 py-1 rounded-lg bg-[#FBF6E8] text-[#8C6400] border border-[#E6D6A6] block">
                      {sysDoc.generateNextRef('BE', receipts.length + 1)} (Aperçu)
                    </span>
                    <span className="text-[10px] text-neutral-400 block mt-1 font-mono">
                      Date : {new Date().toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                </div>

                {/* Supplier & Warehouse 2-Column Info */}
                {(() => {
                  const selSup = suppliersList.find((s) => s.id === formSupplierId);
                  const selWh = warehousesList.find((w) => w.id === formWarehouseId);
                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200/80 space-y-1">
                        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                          Fournisseur
                        </span>
                        <span className="font-bold text-neutral-900 block">
                          {selSup?.name || 'Fournisseur non sélectionné'}
                        </span>
                        <span className="text-[11px] font-mono text-neutral-600 block">
                          ID: {selSup?.cin ? `CIN: ${selSup.cin}` : selSup?.taxId || '—'}
                        </span>
                        <span className="text-[11px] text-neutral-500 block">
                          Réf. BL: {formBlRef || '—'} • Facture: {formInvoiceRef || '—'}
                        </span>
                      </div>

                      <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200/80 space-y-1">
                        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                          Entrepôt de Réception
                        </span>
                        <span className="font-bold text-neutral-900 block">
                          {selWh?.name || 'Entrepôt non sélectionné'}
                        </span>
                        <span className="text-[11px] font-mono text-amber-800 font-bold block">
                          Emplacement: {formLocationDetail}
                        </span>
                        <span className="text-[11px] text-neutral-500 block">
                          Stock réel mis à jour dès validation
                        </span>
                      </div>
                    </div>
                  );
                })()}

                {/* Detailed articles list */}
                <div className="border border-neutral-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-semibold">
                      <tr>
                        <th className="py-2 px-3">SKU</th>
                        <th className="py-2 px-3">Désignation Article</th>
                        <th className="py-2 px-3 text-center">Qté Reçue</th>
                        <th className="py-2 px-3 text-right">P.U. HT</th>
                        <th className="py-2 px-3 text-right">Total HT</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {wizardItems.map((it) => (
                        <tr key={it.id}>
                          <td className="py-2 px-3 font-mono font-bold text-neutral-700">{it.sku}</td>
                          <td className="py-2 px-3 font-bold text-neutral-900">{it.name}</td>
                          <td className="py-2 px-3 text-center font-mono font-bold">{it.receivedQty} pcs</td>
                          <td className="py-2 px-3 text-right font-mono">{formatTndCurrency(it.unitPriceHt)}</td>
                          <td className="py-2 px-3 text-right font-mono font-bold">
                            {formatTndCurrency(it.receivedQty * it.unitPriceHt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totals Summary */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#FBF6E8] border border-[#E6D6A6] text-neutral-900 font-mono">
                  <span className="text-xs uppercase font-bold tracking-wider text-[#8C6400]">
                    Total Net Marchandise Reçue TTC
                  </span>
                  <span className="text-base font-black text-neutral-950">{formatTndCurrency(wizardTotalTtc)}</span>
                </div>
              </div>
            </div>
          )}

        </div>
      </Modal>

      {/* ══════════════════════════════════════════════════════════════════════════════════
          MODAL APERÇU OFFICIEL BON D'ENTRÉE (PREVIEW COMPLÈTE)
      ══════════════════════════════════════════════════════════════════════════════════ */}
      <Modal
        isOpen={!!previewReceipt}
        onClose={() => setPreviewReceipt(null)}
        title={previewReceipt ? `Aperçu Officiel : ${previewReceipt.receiptNumber}` : ''}
        subtitle="Document justificatif d'entrée en stock physique Royal"
        type="details"
        size="lg"
        footer={
          previewReceipt && (
            <div className="flex items-center justify-end gap-2 w-full">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
                className="text-xs"
                leftIcon={<Printer className="w-3.5 h-3.5" />}
              >
                Imprimer
              </Button>
              <Button
                variant="gold"
                size="sm"
                onClick={() => setPreviewReceipt(null)}
                className="text-xs"
              >
                Fermer
              </Button>
            </div>
          )
        }
      >
        {previewReceipt && (
          <div className="p-6 space-y-4 text-xs font-sans">
            <DocumentPrintHeader
              docCode="BE"
              docTitle="Bon d’Entrée Stock"
              reference={previewReceipt.receiptNumber}
              date={previewReceipt.receptionDate}
              status={previewReceipt.status}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200 space-y-1">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                  Fournisseur
                </span>
                <span className="font-bold text-neutral-900 block text-xs">
                  {previewReceipt.supplierName}
                </span>
                <span className="text-[11px] font-mono text-neutral-600 block">
                  {previewReceipt.supplierTaxIdOrCin}
                </span>
              </div>
              <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200 space-y-1">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                  Entrepôt & Emplacement
                </span>
                <span className="font-bold text-neutral-900 block text-xs">
                  {previewReceipt.warehouseName}
                </span>
                <span className="text-[11px] font-mono text-amber-800 font-bold block">
                  {previewReceipt.targetLocationDetail}
                </span>
              </div>
            </div>

            {/* Articles Table */}
            <div className="border border-neutral-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">SKU</th>
                    <th className="py-2.5 px-3">Désignation Article</th>
                    <th className="py-2.5 px-3 text-center">Qté Reçue</th>
                    <th className="py-2.5 px-3 text-right">P.U. HT</th>
                    <th className="py-2.5 px-3 text-right">Total HT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {previewReceipt.items.map((it) => (
                    <tr key={it.id}>
                      <td className="py-2.5 px-3 font-mono font-bold text-neutral-700">{it.sku}</td>
                      <td className="py-2.5 px-3 font-bold text-neutral-900">{it.name}</td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold">{it.receivedQty} pcs</td>
                      <td className="py-2.5 px-3 text-right font-mono">{formatTndCurrency(it.unitPriceHt)}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold">
                        {formatTndCurrency(it.receivedQty * it.unitPriceHt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Financial Summary */}
            <div className="p-3.5 rounded-xl bg-[#FBF6E8] border border-[#E6D6A6] text-neutral-900 flex items-center justify-between font-mono">
              <span className="text-xs uppercase tracking-wider font-bold text-[#8C6400]">Total TTC Imputé</span>
              <span className="text-lg font-black text-neutral-950">{formatTndCurrency(previewReceipt.totalTtc)}</span>
            </div>

            <DocumentPrintFooter docCode="BE" reference={previewReceipt.receiptNumber} />
          </div>
        )}
      </Modal>

      {/* ══════════════════════════════════════════════════════════════════════════════════
          MODAL LIGHTBOX : PRÉVISUALISATION DIRECTE DES PIÈCES JUSTIFICATIVES (PDF / IMAGES)
      ══════════════════════════════════════════════════════════════════════════════════ */}
      <Modal
        isOpen={!!activeDocumentPreview}
        onClose={() => setActiveDocumentPreview(null)}
        title={activeDocumentPreview ? `Pièce Jointe : ${activeDocumentPreview.name}` : ''}
        subtitle={activeDocumentPreview ? `Réf: ${activeDocumentPreview.documentRef || 'Document Fournisseur'}` : ''}
        type="details"
        size="lg"
        footer={
          <div className="flex items-center justify-end w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveDocumentPreview(null)}
              className="text-xs"
            >
              Fermer
            </Button>
          </div>
        }
      >
        {activeDocumentPreview && (
          <div className="p-6 space-y-4 text-xs">
            {activeDocumentPreview.fileType === 'image' ? (
              <div className="max-h-[70vh] overflow-auto rounded-xl border border-neutral-200 bg-neutral-50 flex items-center justify-center p-2">
                <img
                  src={activeDocumentPreview.fileUrl}
                  alt={activeDocumentPreview.name}
                  className="max-h-[65vh] w-auto object-contain rounded-lg shadow-sm"
                />
              </div>
            ) : (
              <div className="p-8 rounded-xl border border-neutral-200 bg-neutral-50 flex flex-col items-center justify-center gap-3 text-center">
                <FileText className="w-16 h-16 text-rose-600" />
                <div>
                  <h4 className="font-bold text-sm text-neutral-900">{activeDocumentPreview.name}</h4>
                  <p className="text-[11px] text-neutral-500 mt-0.5">
                    Document PDF conforme au format fiscal officiel.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(activeDocumentPreview.fileUrl, '_blank')}
                  className="text-xs"
                  leftIcon={<ExternalLink className="w-3.5 h-3.5" />}
                >
                  Ouvrir dans un nouvel onglet
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
      <DeleteConfirmModal
        isOpen={bulkDeleteReceiptIds.length > 0}
        onClose={() => setBulkDeleteReceiptIds([])}
        onConfirm={confirmBulkDeleteReceipts}
        title="Supprimer les bons d’entrée sélectionnés"
        description={`Confirmez-vous la suppression des ${bulkDeleteReceiptIds.length} bon(s) d’entrée sélectionné(s) ?`}
      />
    </div>
  );
}
