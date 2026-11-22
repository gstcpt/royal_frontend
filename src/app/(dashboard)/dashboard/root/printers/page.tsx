'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Printer,
  Plus,
  Save,
  Trash2,
  Eye,
  Compass,
  CheckCircle2,
} from 'lucide-react';
import {
  Button,
  Input,
  Select,
  Toggle,
  Modal,
  Breadcrumb,
  Toast,
  GuideInfoButton,
  ViewGuideModal,
  ViewGuideStep,
} from '@/components/ui';
import { fetchApi } from '@/lib/api';

interface PrinterProfile {
  id: string;
  name: string;
  paperSize: '80mm' | '58mm' | 'A4' | 'A5';
  connectionType: 'BROWSER_PRINT' | 'QZ_TRAY' | 'NETWORK_IP';
  qzPrinterName?: string;
  networkIp?: string;
  networkPort?: number;
  openCashDrawer: boolean;
  autoPrintAfterSale: boolean;
  alwaysPreviewBeforePrint: boolean;
  showroomCode: string;
  isDefaultPos: boolean;
  isActive: boolean;
  headerNote?: string;
}

const PRINTER_GUIDE_STEPS: ViewGuideStep[] = [
  {
    id: 'preview-mode',
    number: '01',
    title: 'Aperçu Avant Impression & Formats POS',
    description: 'Evitez le gaspillage papier : chaque ticket ouvre d’abord son aperçu calibré avant l’envoi imprimante.',
    fields: [
      {
        label: 'Formats Supportés (80mm / 58mm / A4 / A5)',
        example: 'Thermique Comptoir 80mm ou Bureau Laser A4',
        steps: [
          'L’option « Toujours afficher l’Aperçu avant impression » force l’ouverture de la modale Proforma/Ticket dans le terminal POS avant window.print().',
          'En sélectionnant 80mm ou 58mm, le ticket s’adapte automatiquement à la largeur du rouleau thermique.',
        ],
      },
    ],
  },
  {
    id: 'qz-drawer',
    number: '02',
    title: 'Pont QZ Tray & Ouverture Tiroir-Caisse ESC/POS',
    description: 'Pilotez les imprimantes thermiques Epson / Xprinter / Star USB ou Réseau RJ45 sans dialogue navigateur.',
    platformLabel: 'Télécharger QZ Tray (Gratuit Open-Source)',
    platformUrl: 'https://qz.io/download/',
    fields: [
      {
        label: 'Nom Exact Spooler Windows ou IP 9100',
        example: 'Spooler: POS-80 • Réseau: 192.168.1.250:9100',
        steps: [
          'Installez QZ Tray sur le PC Caisse du showroom si vous souhaitez imprimer en 1 clic.',
          'Activez « Impulsion tiroir-caisse RJ11 » pour ouvrir le tiroir automatiquement après confirmation.',
        ],
      },
    ],
  },
];

export default function PrintersRootPage() {
  const [printers, setPrinters] = useState<PrinterProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewPrinter, setPreviewPrinter] = useState<PrinterProfile | null>(null);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [guideOpen, setGuideOpen] = useState(false);
  const [guideIndex, setGuideIndex] = useState(0);

  const loadPrinters = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchApi('/storefront-cms/sys-config/printers');
      const list = res?.value || res?.data?.value || [];
      setPrinters(Array.isArray(list) ? list : []);
    } catch (err: any) {
      setToastMsg({ text: err?.message || 'Accès réservé au compte ROOT.', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPrinters();
  }, [loadPrinters]);

  const handleSave = async (nextList = printers) => {
    setSaving(true);
    try {
      await fetchApi('/storefront-cms/sys-config/printers', {
        method: 'PUT',
        body: JSON.stringify({ value: nextList }),
      });
      setToastMsg({ text: 'Profils imprimantes & paramètres POS sauvegardés.', type: 'success' });
    } catch (err: any) {
      setToastMsg({ text: err?.message || 'Erreur sauvegarde imprimantes.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const addPrinter = () => {
    const newItem: PrinterProfile = {
      id: `prt-${Date.now()}`,
      name: `Imprimante Thermique #${printers.length + 1}`,
      paperSize: '80mm',
      connectionType: 'BROWSER_PRINT',
      qzPrinterName: 'POS-80',
      networkIp: '',
      networkPort: 9100,
      openCashDrawer: false,
      autoPrintAfterSale: false,
      alwaysPreviewBeforePrint: true,
      showroomCode: 'SHOWROOM-01',
      isDefaultPos: printers.length === 0,
      isActive: true,
      headerNote: 'Merci pour votre visite — Royal Electro de Maison',
    };
    setPrinters([...printers, newItem]);
  };

  const updateField = (id: string, patch: Partial<PrinterProfile>) => {
    setPrinters((prev) =>
      prev.map((p) => {
        if (patch.isDefaultPos && p.id !== id) return { ...p, isDefaultPos: false };
        return p.id === id ? { ...p, ...patch } : p;
      }),
    );
  };

  const removePrinter = (id: string) => {
    setPrinters((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div className="space-y-6 max-w-[1720px] mx-auto">
      <Toast
        isOpen={!!toastMsg}
        message={toastMsg?.text || ''}
        type={toastMsg?.type || 'success'}
        onClose={() => setToastMsg(null)}
      />

      <div className="bg-white rounded-2xl border border-[#E6E1D6] shadow-xs p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-heading font-black text-[#1D232E] tracking-tight">
              Imprimantes POS, Thermiques &amp; Aperçu Comptoir
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#FBF6E8] text-[#9A7414] border border-[#E6D6A6]">
              ROOT ONLY • 80MM / 58MM / A4
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Configurez les formats d’impression de vos showrooms, le tiroir-caisse ESC/POS et l’aperçu obligatoire avant chaque impression ticket.
          </p>
          <Breadcrumb
            className="mt-2"
            items={[
              { label: 'Système & CMS', href: '/dashboard/section/system' },
              { label: 'Imprimantes & Pont POS' },
            ]}
          />
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button variant="outline" size="sm" onClick={() => { setGuideIndex(0); setGuideOpen(true); }}>
            <Compass className="w-3.5 h-3.5 text-[#C59B27]" />
            <span>Guide Pont POS</span>
          </Button>
          <Button variant="outline" size="sm" onClick={addPrinter}>
            <Plus className="w-3.5 h-3.5" />
            <span>Ajouter Imprimante</span>
          </Button>
          <Button variant="gold" size="sm" onClick={() => handleSave()} isLoading={saving}>
            <Save className="w-3.5 h-3.5" />
            <span>Sauvegarder</span>
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="p-12 bg-white rounded-2xl border border-[#E6E1D6] text-center text-xs text-slate-500">
          Chargement des profils d’impression...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {printers.map((prt, idx) => (
            <div
              key={prt.id}
              className="bg-white rounded-2xl border border-[#E6E1D6] p-5 sm:p-6 space-y-4 shadow-xs"
            >
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3.5">
                <div className="flex items-center gap-2 min-w-0">
                  <Printer className="w-4 h-4 text-[#C59B27] shrink-0" />
                  <h3 className="text-sm font-bold text-[#1D232E] truncate">
                    {idx + 1}. {prt.name}
                  </h3>
                  <GuideInfoButton onClick={() => { setGuideIndex(idx === 0 ? 0 : 1); setGuideOpen(true); }} />
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPreviewPrinter(prt)}
                    className="h-7 px-2.5 text-[11px]"
                  >
                    <Eye className="w-3 h-3" />
                    <span>Aperçu</span>
                  </Button>
                  <Toggle
                    compact
                    size="sm"
                    checked={prt.isActive}
                    onChange={(v) => updateField(prt.id, { isActive: v })}
                    ariaLabel="Activer cette imprimante"
                  />
                  {printers.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removePrinter(prt.id)}
                      className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 cursor-pointer"
                      title="Supprimer ce profil"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Nom du Profil Imprimante"
                  value={prt.name}
                  onChange={(e) => updateField(prt.id, { name: e.target.value })}
                />
                <Select
                  label="Format Papier"
                  value={prt.paperSize}
                  onChange={(e) => updateField(prt.id, { paperSize: e.target.value as any })}
                  options={[
                    { label: 'Thermique 80mm (Ticket Showroom)', value: '80mm' },
                    { label: 'Thermique Compact 58mm', value: '58mm' },
                    { label: 'Bureau A4 (Facture & BL)', value: 'A4' },
                    { label: 'Demi-page A5', value: 'A5' },
                  ]}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Select
                  label="Méthode de Connexion"
                  value={prt.connectionType}
                  onChange={(e) => updateField(prt.id, { connectionType: e.target.value as any })}
                  options={[
                    { label: 'Dialogue Navigateur (Standard)', value: 'BROWSER_PRINT' },
                    { label: 'Pont Local QZ Tray', value: 'QZ_TRAY' },
                    { label: 'Réseau TCP/IP (Port 9100)', value: 'NETWORK_IP' },
                  ]}
                />
                <Input
                  label="Nom Spooler / QZ"
                  placeholder="POS-80"
                  value={prt.qzPrinterName || ''}
                  onChange={(e) => updateField(prt.id, { qzPrinterName: e.target.value })}
                />
                <Input
                  label="Code Showroom"
                  placeholder="SHOWROOM-MAHDIA"
                  value={prt.showroomCode}
                  onChange={(e) => updateField(prt.id, { showroomCode: e.target.value })}
                />
              </div>

              {prt.connectionType === 'NETWORK_IP' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Adresse IP Locale Imprimante"
                    placeholder="192.168.1.250"
                    value={prt.networkIp || ''}
                    onChange={(e) => updateField(prt.id, { networkIp: e.target.value })}
                  />
                  <Input
                    label="Port TCP"
                    type="number"
                    value={String(prt.networkPort || 9100)}
                    onChange={(e) => updateField(prt.id, { networkPort: Number(e.target.value || 9100) })}
                  />
                </div>
              )}

              <Input
                label="Message Pied de Ticket"
                value={prt.headerNote || ''}
                onChange={(e) => updateField(prt.id, { headerNote: e.target.value })}
              />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div className="p-3 rounded-xl bg-[#FBF9F4] border border-[#E6E1D6] flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold text-[#1D232E]">Aperçu Obligatoire</span>
                  <Toggle
                    compact
                    size="sm"
                    checked={prt.alwaysPreviewBeforePrint}
                    onChange={(v) => updateField(prt.id, { alwaysPreviewBeforePrint: v })}
                  />
                </div>
                <div className="p-3 rounded-xl bg-[#FBF9F4] border border-[#E6E1D6] flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold text-[#1D232E]">Tiroir-Caisse</span>
                  <Toggle
                    compact
                    size="sm"
                    checked={prt.openCashDrawer}
                    onChange={(v) => updateField(prt.id, { openCashDrawer: v })}
                  />
                </div>
                <div className="p-3 rounded-xl bg-[#FBF9F4] border border-[#E6E1D6] flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold text-[#1D232E]">Défaut POS</span>
                  <Toggle
                    compact
                    size="sm"
                    checked={prt.isDefaultPos}
                    onChange={(v) => updateField(prt.id, { isDefaultPos: v })}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Test Preview Modal */}
      <Modal
        isOpen={!!previewPrinter}
        onClose={() => setPreviewPrinter(null)}
        title={`Aperçu Impression — ${previewPrinter?.name || ''}`}
        subtitle={`Format calibré : ${previewPrinter?.paperSize || '80mm'}`}
        type="details"
        size="lg"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button variant="outline" size="sm" onClick={() => setPreviewPrinter(null)}>
              Fermer
            </Button>
            <Button variant="gold" size="sm" onClick={() => window.print()}>
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimer ce Test</span>
            </Button>
          </div>
        }
      >
        {previewPrinter && (
          <div className="p-6 flex justify-center bg-slate-50">
            <div
              className="bg-white border border-slate-200 rounded-xl shadow-xs p-5 text-xs space-y-3 font-mono"
              style={{
                width:
                  previewPrinter.paperSize === '58mm'
                    ? '240px'
                    : previewPrinter.paperSize === '80mm'
                    ? '320px'
                    : '100%',
              }}
            >
              <div className="text-center border-b border-dashed border-slate-300 pb-2">
                <div className="font-black text-sm text-[#1D232E]">ROYAL ÉLECTRO</div>
                <div className="text-[10px] text-slate-500">Showroom {previewPrinter.showroomCode}</div>
                <div className="text-[10px] text-[#9A7414] font-bold">TEST FORMAT {previewPrinter.paperSize}</div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>1× Robot Pétrin Pro</span>
                  <span>649.000</span>
                </div>
                <div className="flex justify-between">
                  <span>1× Airfryer Dual 8.5L</span>
                  <span>389.000</span>
                </div>
              </div>
              <div className="border-t border-dashed border-slate-300 pt-2 flex justify-between font-black text-sm">
                <span>TOTAL TTC</span>
                <span>1038.000 TND</span>
              </div>
              <div className="text-center text-[10px] text-slate-500 pt-1">
                {previewPrinter.headerNote || 'Merci pour votre visite.'}
              </div>
            </div>
          </div>
        )}
      </Modal>

      <ViewGuideModal
        isOpen={guideOpen}
        onClose={() => setGuideOpen(false)}
        title="Guide Imprimantes POS & Aperçu"
        subtitle="Calibrage papier thermique & ouverture tiroir-caisse showroom"
        steps={PRINTER_GUIDE_STEPS}
        currentIndex={guideIndex}
        onStepChange={setGuideIndex}
      />
    </div>
  );
}
