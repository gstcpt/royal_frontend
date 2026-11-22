'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { SystemRole, AuditLogItem } from '@royal/shared-types';
import {
  Activity,
  ShieldAlert,
  ShieldCheck,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Calendar,
  Clock,
  User,
  Database,
  ArrowRight,
  Lock,
  Layers,
  Package,
  Tag,
  ShoppingBag,
  Sliders,
  Boxes,
  FileText,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Laptop,
  Terminal,
  Copy,
  Check,
  Download,
  Code2,
  Columns,
  Globe,
  Info,
  ExternalLink,
  ChevronRight,
  Sparkles,
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
  Breadcrumb,
  Toast,
} from '@/components/ui';
import { fetchApi } from '@/lib/api';
import { cn } from '@/lib/utils';

// Fallback Rich Historical Audit Log Entries
const DEFAULT_AUDIT_LOGS: AuditLogItem[] = [
  {
    id: 'log-101',
    actorId: 'usr-root-01',
    actorEmail: 'root@royal.com.tn',
    actorName: 'Root Administrator',
    action: 'CREATE',
    resourceType: 'PRODUCT',
    resourceId: 'prod-airfryer-double',
    tableName: 'products',
    description: 'Création du produit Airfryer XXL Double Tiroir DualZone 8.5L',
    before: null,
    after: {
      sku: 'PHL-AF-XXL-2T',
      name: 'Airfryer XXL Double Tiroir DualZone 8.5L',
      sellingPrice: 599,
      categoryId: 'cat-petit-electro',
      brandId: 'brand-tefal',
      status: 'ACTIVE',
      createdBy: 'SUPER_ADMIN',
    },
    diffJson: {
      createdFields: ['sku', 'name', 'sellingPrice', 'categoryId', 'brandId', 'status'],
    },
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/128.0.0.0',
    createdAt: '2026-11-15T13:45:00.000Z',
  },
  {
    id: 'log-102',
    actorId: 'usr-admin-02',
    actorEmail: 'admin@royal.com.tn',
    actorName: 'Mohamed Zitouni',
    action: 'TOGGLE_VISIBILITY',
    resourceType: 'BRAND',
    resourceId: 'brand-beko',
    tableName: 'brands',
    description: 'Bascule de visibilité en ligne : Marque Beko activée sur le storefront',
    before: { id: 'brand-beko', name: 'Beko', isActive: false },
    after: { id: 'brand-beko', name: 'Beko', isActive: true, isUpdated: true, updatedBy: 'Mohamed Zitouni' },
    diffJson: {
      field: 'isActive',
      oldValue: false,
      newValue: true,
    },
    ipAddress: '197.3.24.15',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Brave/1.68.0',
    createdAt: '2026-11-15T11:20:00.000Z',
  },
  {
    id: 'log-103',
    actorId: 'usr-admin-02',
    actorEmail: 'admin@royal.com.tn',
    actorName: 'Mohamed Zitouni',
    action: 'UPDATE',
    resourceType: 'CATEGORY',
    resourceId: 'cat-gros-electro',
    tableName: 'categories',
    description: 'Mise à jour des caractéristiques rattachées au rayon Gros Électroménager',
    before: { characteristicsCount: 6, updatedAt: '2026-11-10T09:00:00Z' },
    after: { characteristicsCount: 8, isUpdated: true, updatedBy: 'Mohamed Zitouni' },
    diffJson: {
      characteristicsCount: { from: 6, to: 8 },
      addedCharacteristics: ['spec-puissance', 'spec-capacite'],
    },
    ipAddress: '197.3.24.15',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Brave/1.68.0',
    createdAt: '2026-11-14T16:15:00.000Z',
  },
  {
    id: 'log-104',
    actorId: 'usr-root-01',
    actorEmail: 'root@royal.com.tn',
    actorName: 'Root Administrator',
    action: 'DELETE',
    resourceType: 'VARIANT_OPTION',
    resourceId: 'opt-obsolete-yellow',
    tableName: 'variant_options',
    description: 'Suppression logique (Soft Delete) de la nuance Jaune Moutarde',
    before: { id: 'opt-obsolete-yellow', label: 'Jaune Moutarde', isDeleted: false },
    after: { isDeleted: true, deletedAt: '2026-11-13T10:00:00Z', deletedBy: 'root@royal.com.tn' },
    diffJson: {
      isDeleted: true,
      deletedAt: '2026-11-13T10:00:00Z',
      deletedBy: 'ROOT',
    },
    ipAddress: '127.0.0.1',
    userAgent: 'Royal-Admin-Terminal/1.0',
    createdAt: '2026-11-13T10:00:00.000Z',
  },
  {
    id: 'log-105',
    actorId: 'usr-cashier-04',
    actorEmail: 'caisse.lac@royal.com.tn',
    actorName: 'Ahmed Ben Ali (Caisse Lac)',
    action: 'CREATE',
    resourceType: 'ORDER',
    resourceId: 'ord-flr-2026-8841',
    tableName: 'orders',
    description: 'Nouvelle commande comptoir POS validée (Total: 1 450,000 TND)',
    before: null,
    after: {
      reference: 'ORD-FLR-2026-8841',
      channel: 'POS',
      totalAmount: 1450,
      status: 'CONFIRMED',
      createdBy: 'caisse.lac@royal.com.tn',
    },
    diffJson: {
      itemsCount: 3,
      paymentMethod: 'POS_CASH',
    },
    ipAddress: '192.168.10.45',
    userAgent: 'Royal-POS-Terminal/3.2',
    createdAt: '2026-11-12T17:30:00.000Z',
  },
  {
    id: 'log-106',
    actorId: 'usr-root-01',
    actorEmail: 'root@royal.com.tn',
    actorName: 'Root Administrator',
    action: 'LOGIN',
    resourceType: 'USER',
    resourceId: 'usr-root-01',
    tableName: 'users',
    description: 'Connexion réussie avec élévation des privilèges système (ROOT)',
    before: null,
    after: { email: 'root@royal.com.tn', roles: ['ROOT'] },
    diffJson: null,
    ipAddress: '127.0.0.1',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/128.0.0.0',
    createdAt: '2026-11-12T08:00:00.000Z',
  },
  {
    id: 'log-107',
    actorId: 'usr-admin-02',
    actorEmail: 'admin@royal.com.tn',
    actorName: 'Mohamed Zitouni',
    action: 'CREATE',
    resourceType: 'CHARACTERISTIC',
    resourceId: 'char-garantie',
    tableName: 'characteristics',
    description: 'Création de la caractéristique technique globale Garantie Constructeur (Ans)',
    before: null,
    after: {
      name: 'Garantie Constructeur',
      code: 'garantie_annees',
      type: 'NUMBER',
      unit: 'années',
      isRequired: true,
      createdBy: 'SUPER_ADMIN',
    },
    diffJson: null,
    ipAddress: '197.3.24.15',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Brave/1.68.0',
    createdAt: '2026-11-08T09:15:00.000Z',
  },
  {
    id: 'log-108',
    actorId: 'usr-root-01',
    actorEmail: 'root@royal.com.tn',
    actorName: 'Root Administrator',
    action: 'UPDATE',
    resourceType: 'PRODUCT',
    resourceId: 'prod-espresso-barista',
    tableName: 'products',
    description: 'Ajustement du prix public promotionnel DeLonghi Barista Specialista',
    before: { sellingPrice: 2450, discountPrice: null },
    after: { sellingPrice: 2450, discountPrice: 2290, isUpdated: true, updatedBy: 'ROOT' },
    diffJson: {
      discountPrice: { from: null, to: 2290 },
      discountPercent: 7,
    },
    ipAddress: '127.0.0.1',
    userAgent: 'Royal-Admin-Client/2.4',
    createdAt: '2026-10-25T14:00:00.000Z',
  },
];

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function formatJsonToHtml(obj: any): string {
  if (obj === null || obj === undefined) return '<span class="text-rose-600 font-bold italic font-mono">null</span>';
  const rawStr = typeof obj === 'string' ? obj : JSON.stringify(obj, null, 2);
  const safeStr = escapeHtml(rawStr);
  return safeStr.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
    (match) => {
      let cls = 'text-amber-700 font-mono font-medium';
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          cls = 'text-indigo-900 font-bold font-mono';
        } else {
          cls = 'text-emerald-700 font-mono';
        }
      } else if (/true|false/.test(match)) {
        cls = 'text-purple-700 font-bold font-mono';
      } else if (/null/.test(match)) {
        cls = 'text-rose-600 font-bold italic font-mono';
      }
      return `<span class="${cls}">${match}</span>`;
    }
  );
}

function cleanIp(ip?: string | null): { ip: string; isLocal: boolean } {
  if (!ip) return { ip: '127.0.0.1', isLocal: true };
  const cleaned = ip.replace(/^::ffff:/, '');
  const isLocal =
    cleaned === '127.0.0.1' ||
    cleaned === '::1' ||
    cleaned.startsWith('172.19.') ||
    cleaned.startsWith('192.168.') ||
    cleaned.startsWith('10.');
  return { ip: cleaned, isLocal };
}

function parseUserAgent(ua?: string | null): { browser: string; os: string; full: string } {
  if (!ua) return { browser: 'Inconnu', os: 'Système', full: 'Non renseigné' };
  let browser = 'Navigateur standard';
  let os = 'OS standard';

  if (ua.includes('Brave')) browser = 'Brave';
  else if (ua.includes('Edg/')) browser = 'Microsoft Edge';
  else if (ua.includes('Chrome/')) browser = 'Google Chrome';
  else if (ua.includes('Firefox/')) browser = 'Mozilla Firefox';
  else if (ua.includes('Safari/') && !ua.includes('Chrome/')) browser = 'Apple Safari';
  else if (ua.includes('curl/')) browser = 'cURL CLI';
  else if (ua.includes('Postman')) browser = 'Postman API';

  if (ua.includes('Windows NT 10.0')) os = 'Windows 10/11';
  else if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac OS X')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

  return { browser, os, full: ua };
}

interface SyntaxCodeBoxProps {
  data: any;
  title: string;
  emptyMessage?: string;
  badgeColor?: 'rose' | 'emerald' | 'indigo' | 'neutral';
  onCopy?: () => void;
  isCopied?: boolean;
}

function SyntaxCodeBox({
  data,
  title,
  emptyMessage,
  badgeColor = 'neutral',
  onCopy,
  isCopied,
}: SyntaxCodeBoxProps) {
  const isEmpty =
    data === null ||
    data === undefined ||
    (typeof data === 'object' && Object.keys(data).length === 0 && !Array.isArray(data));

  return (
    <div className="rounded-2xl border border-neutral-200/90 bg-white overflow-hidden shadow-xs flex flex-col">
      {/* Header toolbar in Luxury Light Mode */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-neutral-50/90 border-b border-neutral-200/80 shrink-0">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border',
              badgeColor === 'rose' && 'bg-rose-50 text-rose-700 border-rose-200',
              badgeColor === 'emerald' && 'bg-emerald-50 text-emerald-700 border-emerald-200',
              badgeColor === 'indigo' && 'bg-indigo-50 text-indigo-700 border-indigo-200',
              badgeColor === 'neutral' && 'bg-neutral-100 text-neutral-700 border-neutral-200'
            )}
          >
            {title}
          </span>
          <span className="text-[10px] font-mono text-neutral-400">JSON</span>
        </div>
        {!isEmpty && onCopy && (
          <button
            type="button"
            onClick={onCopy}
            className="flex items-center gap-1.5 text-[11px] font-medium text-neutral-500 hover:text-neutral-900 transition px-2.5 py-1 rounded-lg hover:bg-neutral-100"
            title="Copier ce bloc JSON"
          >
            {isCopied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-600 font-semibold">Copié !</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copier</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Body in Luxury Light Mode */}
      {isEmpty ? (
        <div className="p-5 text-neutral-500 text-xs italic font-mono flex items-center gap-2.5 bg-neutral-50/40">
          <Info className="w-4 h-4 text-neutral-400 shrink-0" />
          <span>{emptyMessage || '// Aucune donnée disponible pour cet état'}</span>
        </div>
      ) : (
        <pre
          className="p-4 text-neutral-800 font-mono text-xs overflow-x-auto max-h-72 leading-relaxed select-text bg-neutral-50/30"
          dangerouslySetInnerHTML={{ __html: formatJsonToHtml(data) }}
        />
      )}
    </div>
  );
}

export default function DashboardLogsPage() {
  const router = useRouter();
  const { user, hasRole, isInitialized } = useAuthStore();
  const isRoot = hasRole(SystemRole.ROOT);

  const [logs, setLogs] = React.useState<AuditLogItem[]>(DEFAULT_AUDIT_LOGS);
  const [isLoading, setIsLoading] = React.useState(true);
  const [inspectModalLog, setInspectModalLog] = React.useState<AuditLogItem | null>(null);
  const [activeInspectTab, setActiveInspectTab] = React.useState<'summary' | 'diff' | 'raw'>('summary');
  const [copiedField, setCopiedField] = React.useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = React.useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const copyToClipboard = (text: string, fieldId: string) => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(text);
      setCopiedField(fieldId);
      showToast('success', 'Copié dans le presse-papiers');
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  const downloadLogAsJson = (log: AuditLogItem) => {
    const jsonStr = JSON.stringify(log, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit_log_${log.id}_${log.tableName || 'system'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('success', `Rapport ${log.id}.json téléchargé avec succès`);
  };

  // Dynamic Toolbar Filters
  const [filterAction, setFilterAction] = React.useState('ALL');
  const [filterResource, setFilterResource] = React.useState('ALL');

  // Load backend logs
  const loadLogs = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetchApi('/audit-logs?limit=100').catch(() => null);
      if (res && res.data && Array.isArray(res.data)) {
        setLogs(res.data.length > 0 ? res.data : DEFAULT_AUDIT_LOGS);
      } else {
        setLogs(DEFAULT_AUDIT_LOGS);
      }
    } catch (err) {
      setLogs(DEFAULT_AUDIT_LOGS);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (isInitialized && isRoot) {
      loadLogs();
    } else {
      setIsLoading(false);
    }
  }, [isInitialized, isRoot, loadLogs]);

  const showToast = (type: 'success' | 'error', text: string) => {
    setFeedbackMessage({ type, text });
    setTimeout(() => setFeedbackMessage(null), 3500);
  };

  // If user is not initialized yet
  if (!isInitialized) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin" />
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════════════
  // STRICT SECURITY GATE: ROOT ONLY BARRIER
  // ══════════════════════════════════════════════════════════════════════════════════
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
              Le journal d’audit système et l’historique immuable des opérations sont protégés par un contrôle d’accès de niveau infrastructure. Seul le compte <strong>ROOT</strong> détient l’habilitation nécessaire pour consulter ces journaux.
            </p>
          </div>
          <div className="pt-2">
            <Button
              onClick={() => router.push('/dashboard')}
              variant="outline"
              className="w-full text-xs py-2.5 rounded-xl border-neutral-300 hover:bg-neutral-100"
            >
              Retourner au Tableau de Bord
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Action Badge Formatter
  const renderActionBadge = (action: string) => {
    switch (action.toUpperCase()) {
      case 'CREATE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>CREATE</span>
          </span>
        );
      case 'UPDATE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
            <RefreshCw className="w-3 h-3 text-indigo-600" />
            <span>UPDATE</span>
          </span>
        );
      case 'DELETE':
      case 'BULK_DELETE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
            <XCircle className="w-3 h-3 text-rose-600" />
            <span>DELETE</span>
          </span>
        );
      case 'TOGGLE_VISIBILITY':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-900 border border-amber-200">
            <Eye className="w-3 h-3 text-amber-600" />
            <span>VISIBILITÉ</span>
          </span>
        );
      case 'LOGIN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-800 border border-purple-200">
            <ShieldCheck className="w-3 h-3 text-purple-600" />
            <span>LOGIN</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-neutral-100 text-neutral-700 border border-neutral-200">
            <span>{action}</span>
          </span>
        );
    }
  };

  // Resource Icon Resolver
  const getResourceIcon = (resType: string) => {
    switch (resType.toUpperCase()) {
      case 'PRODUCT':
        return <Package className="w-3.5 h-3.5 text-neutral-500" />;
      case 'CATEGORY':
        return <Layers className="w-3.5 h-3.5 text-neutral-500" />;
      case 'BRAND':
        return <Tag className="w-3.5 h-3.5 text-neutral-500" />;
      case 'ORDER':
        return <ShoppingBag className="w-3.5 h-3.5 text-neutral-500" />;
      case 'CHARACTERISTIC':
        return <Sliders className="w-3.5 h-3.5 text-neutral-500" />;
      case 'VARIANT':
      case 'VARIANT_FAMILY':
      case 'VARIANT_OPTION':
        return <Boxes className="w-3.5 h-3.5 text-neutral-500" />;
      case 'USER':
        return <User className="w-3.5 h-3.5 text-neutral-500" />;
      default:
        return <Database className="w-3.5 h-3.5 text-neutral-500" />;
    }
  };

  // Filter Data
  const filteredLogs = React.useMemo(() => {
    return logs.filter((log) => {
      if (filterAction !== 'ALL' && log.action !== filterAction) return false;
      if (filterResource !== 'ALL' && log.resourceType !== filterResource) return false;
      return true;
    });
  }, [logs, filterAction, filterResource]);

  // Aggregate KPI counters
  const totalEvents = logs.length;
  const todayEvents = logs.filter((l) => {
    const d = new Date(l.createdAt);
    const today = new Date();
    return (
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear()
    );
  }).length;
  const criticalActions = logs.filter((l) =>
    ['DELETE', 'BULK_DELETE', 'HARD_DELETE'].includes(l.action)
  ).length;
  const uniqueActors = new Set(logs.map((l) => l.actorEmail).filter(Boolean)).size;

  // Table Columns Definition
  const columns: ColumnDef<AuditLogItem>[] = [
    {
      key: 'createdAt',
      header: 'Horodatage',
      sortable: true,
      sortValue: (l) => new Date(l.createdAt).getTime(),
      className: 'whitespace-nowrap',
      render: (item) => {
        const d = new Date(item.createdAt);
        return (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-neutral-100 border border-neutral-200 flex items-center justify-center shrink-0 text-neutral-600">
              <Calendar className="w-4 h-4 text-neutral-500" />
            </div>
            <div>
              <div className="font-bold text-neutral-900 text-xs">
                {d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
              </div>
              <div className="text-[10px] text-neutral-500 flex items-center gap-1">
                <Clock className="w-3 h-3 text-neutral-400" />
                <span>{d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
              </div>
            </div>
          </div>
        );
      },
      printRender: (item) => new Date(item.createdAt).toLocaleString('fr-FR'),
    },
    {
      key: 'actor',
      header: 'Acteur & Opérateur',
      sortable: true,
      sortValue: (l) => l.actorName || l.actorEmail || 'Système',
      render: (item) => {
        const isRootActor = item.actorEmail?.includes('root');
        return (
          <div className="flex items-center gap-2.5">
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black shrink-0 shadow-2xs",
              isRootActor ? "bg-[#FBF6E8] text-[#8C6400] border border-[#E6D6A6]" : "bg-neutral-100 text-neutral-800 border border-neutral-200"
            )}>
              {item.actorName?.[0] || 'U'}
            </div>
            <div>
              <div className="font-bold text-neutral-900 text-xs flex items-center gap-1.5">
                <span>{item.actorName || 'Opérateur Système'}</span>
                {isRootActor && (
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-[var(--royal-primary)] text-[var(--royal-primary-text)] uppercase">
                    ROOT
                  </span>
                )}
              </div>
              <div className="text-[10px] text-neutral-500 truncate max-w-[180px]">
                {item.actorEmail || 'Système Automatique'}
              </div>
            </div>
          </div>
        );
      },
      printRender: (item) => `${item.actorName || 'Système'} (${item.actorEmail || 'N/A'})`,
    },
    {
      key: 'action',
      header: 'Action Réalisée',
      sortable: true,
      sortValue: (l) => l.action,
      className: 'text-center',
      render: (item) => renderActionBadge(item.action),
      printRender: (item) => item.action,
    },
    {
      key: 'resource',
      header: 'Entité & Table DB',
      sortable: true,
      sortValue: (l) => `${l.resourceType} ${l.tableName}`,
      render: (item) => (
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-neutral-100 border border-neutral-200/80 flex items-center justify-center shrink-0">
            {getResourceIcon(item.resourceType)}
          </div>
          <div>
            <div className="text-xs font-bold text-neutral-900 flex items-center gap-1.5">
              <span>{item.resourceType}</span>
              <span className="text-[10px] font-normal text-neutral-400">({item.tableName || 'db'})</span>
            </div>
            {item.resourceId && (
              <div className="text-[10px] font-mono text-neutral-500 truncate max-w-[150px]">
                #{item.resourceId}
              </div>
            )}
          </div>
        </div>
      ),
      printRender: (item) => `${item.resourceType} (${item.tableName || 'N/A'}) #${item.resourceId || ''}`,
    },
    {
      key: 'description',
      header: 'Description de l’Événement',
      render: (item) => (
        <div className="text-xs text-neutral-700 max-w-md line-clamp-2">
          {item.description || 'Action système enregistrée.'}
        </div>
      ),
      printRender: (item) => item.description || 'Action système enregistrée.',
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right no-print',
      render: (item) => (
        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={() => setInspectModalLog(item)}
            className="p-1.5 rounded-lg text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition shadow-2xs cursor-pointer"
            title="Inspecter le diff JSON et les métadonnées"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-[1720px] mx-auto">
      {/* Floating Toast Notification */}
      <Toast
        isOpen={!!feedbackMessage}
        message={feedbackMessage?.text || ''}
        type={feedbackMessage?.type === 'error' ? 'error' : 'success'}
        onClose={() => setFeedbackMessage(null)}
      />

      {/* 1. Page Header Card (Master Layout Standard) */}
      <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-sm p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-heading font-black text-neutral-900 tracking-tight">
              Journal d’Audit Système
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#FBF6E8] text-[#8C6400] border border-[#E6D6A6] shadow-2xs">
              ROOT EXCLUSIF
            </span>
          </div>
          <p className="text-xs text-neutral-500 mt-1 max-w-2xl">
            Traçabilité immuable de l’ensemble des opérations, mutations de données et événements de sécurité. Accessible exclusivement au super-utilisateur ROOT.
          </p>
          <Breadcrumb
            className="mt-2"
            items={[
              { label: 'Administration Système', href: '/dashboard/users' },
              { label: 'Journal d’Audit (ROOT)' },
            ]}
          />
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => {
              loadLogs();
              showToast('success', 'Flux d’audit actualisés avec succès.');
            }}
            variant="outline"
            leftIcon={<RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />}
            className="text-xs py-2 px-4 shadow-sm border-neutral-200 hover:bg-neutral-50"
          >
            Actualiser
          </Button>
        </div>
      </div>

      {/* 2. KPI Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 no-print">
        <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block">
              Total Événements
            </span>
            <span className="text-2xl font-black text-neutral-950 mt-1 block">
              {totalEvents}
            </span>
            <span className="text-[11px] text-neutral-400 mt-0.5 block">Logs immuables stockés</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-800">
            <Activity className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block">
              Actions Aujourd’hui
            </span>
            <span className="text-2xl font-black text-emerald-600 mt-1 block">
              {todayEvents}
            </span>
            <span className="text-[11px] text-neutral-400 mt-0.5 block">Dernières 24 heures</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block">
              Acteurs Distincts
            </span>
            <span className="text-2xl font-black text-indigo-600 mt-1 block">
              {uniqueActors}
            </span>
            <span className="text-[11px] text-neutral-400 mt-0.5 block">Comptes actifs tracés</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
            <User className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block">
              Opérations Critiques
            </span>
            <span className="text-2xl font-black text-rose-600 mt-1 block">
              {criticalActions}
            </span>
            <span className="text-[11px] text-neutral-400 mt-0.5 block">Suppressions & Soft Deletes</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. Main Data Table with Isolated Filters Card */}
      <DataTable<AuditLogItem>
        data={filteredLogs}
        columns={columns}
        keyExtractor={(item) => item.id}
        searchPlaceholder="Rechercher par acteur, description, ID ou table..."
        searchKeys={['description', 'actorEmail', 'actorName', 'resourceType', 'tableName', 'resourceId', 'action']}
        supportedModes={['table', 'list', 'matrix']}
        defaultMode="table"
        exportFileName="journal_audit_royal"
        customFilters={[
          {
            key: 'action',
            label: 'Action',
            value: filterAction,
            onChange: setFilterAction,
            allLabel: 'Toutes les actions',
            options: [
              { value: 'CREATE', label: 'CREATE (Création)' },
              { value: 'UPDATE', label: 'UPDATE (Modification)' },
              { value: 'DELETE', label: 'DELETE (Suppression)' },
              { value: 'TOGGLE_VISIBILITY', label: 'VISIBILITÉ (Activation/Désactivation)' },
              { value: 'LOGIN', label: 'LOGIN (Authentification)' },
            ],
          },
          {
            key: 'resource',
            label: 'Table',
            value: filterResource,
            onChange: setFilterResource,
            allLabel: 'Toutes les tables',
            options: [
              { value: 'PRODUCT', label: 'Produits (products)' },
              { value: 'CATEGORY', label: 'Catégories (categories)' },
              { value: 'BRAND', label: 'Marques (brands)' },
              { value: 'CHARACTERISTIC', label: 'Caractéristiques' },
              { value: 'VARIANT_OPTION', label: 'Variantes & Nuances' },
              { value: 'ORDER', label: 'Commandes (orders)' },
              { value: 'USER', label: 'Utilisateurs (users)' },
            ],
          },
        ]}
      />

      {/* ══════════════════════════════════════════════════════════════════════════════════
          LUXURY DETAILED AUDIT LOG INSPECTION MODAL (SIZE 4XL)
      ══════════════════════════════════════════════════════════════════════════════════ */}
      {inspectModalLog && (
        <Modal
          isOpen={!!inspectModalLog}
          onClose={() => setInspectModalLog(null)}
          size="4xl"
          title={
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 border border-amber-500/20 shadow-xs flex items-center justify-center shrink-0">
                <Activity className="w-5 h-5 text-amber-600" />
              </span>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-heading font-black text-lg text-neutral-900 tracking-tight">
                    Fiche d’Inspection d’Événement
                  </span>
                  {renderActionBadge(inspectModalLog.action)}
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-neutral-100 text-neutral-700 border border-neutral-200">
                    {inspectModalLog.resourceType}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-neutral-500 font-mono mt-0.5">
                  <span>ID: #{inspectModalLog.id}</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(inspectModalLog.id, 'modal_id')}
                    className="text-neutral-400 hover:text-neutral-900 transition flex items-center gap-1"
                    title="Copier l'identifiant"
                  >
                    {copiedField === 'modal_id' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          }
          footer={
            <div className="flex items-center justify-between w-full flex-wrap gap-3">
              <div className="flex items-center gap-2 text-xs text-neutral-500 font-mono">
                <Terminal className="w-4 h-4 text-neutral-400 shrink-0" />
                <span className="truncate max-w-[280px] sm:max-w-none">
                  Horodatage ISO : {new Date(inspectModalLog.createdAt).toISOString()}
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(new Date(inspectModalLog.createdAt).toISOString(), 'iso_date')}
                  className="text-neutral-400 hover:text-neutral-800 transition"
                  title="Copier l'horodatage ISO"
                >
                  {copiedField === 'iso_date' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => downloadLogAsJson(inspectModalLog)}
                  className="text-xs px-3.5 py-2 border-neutral-300 hover:bg-neutral-100 flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Exporter (.json)</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => copyToClipboard(JSON.stringify(inspectModalLog, null, 2), 'full_json')}
                  className="text-xs px-3.5 py-2 border-neutral-300 hover:bg-neutral-100 flex items-center gap-1.5"
                >
                  {copiedField === 'full_json' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Copié !</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copier tout le Log</span>
                    </>
                  )}
                </Button>
                <Button
                  variant="gold"
                  onClick={() => setInspectModalLog(null)}
                  className="text-xs px-5 py-2"
                >
                  Fermer
                </Button>
              </div>
            </div>
          }
        >
          <div className="p-6 space-y-5">
            {/* 4 Metadata Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Carte 1: Acteur */}
              <div className="p-3.5 rounded-2xl bg-neutral-50/80 border border-neutral-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.02)] space-y-1">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                  <User className="w-3.5 h-3.5 text-neutral-500" />
                  <span>Acteur & Rôle</span>
                </div>
                <div className="font-bold text-neutral-900 text-xs truncate" title={inspectModalLog.actorName || ''}>
                  {inspectModalLog.actorName || 'Opérateur Système'}
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] text-neutral-500 truncate max-w-[130px]" title={inspectModalLog.actorEmail || ''}>
                    {inspectModalLog.actorEmail || 'N/A'}
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-neutral-200/80 text-neutral-700">
                    {inspectModalLog.actorId ? 'Identifié' : 'Anonyme'}
                  </span>
                </div>
              </div>

              {/* Carte 2: Ressource */}
              <div className="p-3.5 rounded-2xl bg-neutral-50/80 border border-neutral-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.02)] space-y-1">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                  <Database className="w-3.5 h-3.5 text-neutral-500" />
                  <span>Table & Ressource</span>
                </div>
                <div className="font-mono font-bold text-neutral-900 text-xs">
                  {inspectModalLog.tableName || 'Système'}
                </div>
                <div className="flex items-center gap-1 text-[11px] font-mono text-neutral-500 truncate" title={inspectModalLog.resourceId || ''}>
                  <span>ID: #{inspectModalLog.resourceId || 'Global'}</span>
                  {inspectModalLog.resourceId && (
                    <button
                      type="button"
                      onClick={() => copyToClipboard(inspectModalLog.resourceId || '', 'res_id')}
                      className="text-neutral-400 hover:text-neutral-700 transition"
                      title="Copier ID Ressource"
                    >
                      {copiedField === 'res_id' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    </button>
                  )}
                </div>
              </div>

              {/* Carte 3: Réseau & Client */}
              {(() => {
                const ipInfo = cleanIp(inspectModalLog.ipAddress);
                const uaInfo = parseUserAgent(inspectModalLog.userAgent);
                return (
                  <div className="p-3.5 rounded-2xl bg-neutral-50/80 border border-neutral-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.02)] space-y-1">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                      <Globe className="w-3.5 h-3.5 text-neutral-500" />
                      <span>Origine & Client</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-mono text-neutral-900 text-xs font-semibold">
                      <span>{ipInfo.ip}</span>
                      <span className={cn(
                        "text-[9px] px-1.5 py-0.5 rounded font-sans font-bold",
                        ipInfo.isLocal ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"
                      )}>
                        {ipInfo.isLocal ? 'Local/VPC' : 'Public'}
                      </span>
                    </div>
                    <div className="text-[11px] text-neutral-500 truncate" title={uaInfo.full}>
                      {uaInfo.browser} • {uaInfo.os}
                    </div>
                  </div>
                );
              })()}

              {/* Carte 4: Horodatage */}
              <div className="p-3.5 rounded-2xl bg-neutral-50/80 border border-neutral-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.02)] space-y-1">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                  <Clock className="w-3.5 h-3.5 text-neutral-500" />
                  <span>Date & Heure</span>
                </div>
                <div className="font-bold text-neutral-900 text-xs">
                  {new Date(inspectModalLog.createdAt).toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </div>
                <div className="text-[11px] text-neutral-500 font-mono">
                  {new Date(inspectModalLog.createdAt).toLocaleTimeString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </div>
              </div>
            </div>

            {/* Operational Route Callout */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-neutral-50 via-white to-neutral-50 border border-neutral-200 flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold bg-neutral-100 text-neutral-800 border border-neutral-300 tracking-wider">
                  {inspectModalLog.action}
                </span>
                <div>
                  <p className="text-xs font-bold text-neutral-900">
                    {inspectModalLog.description || 'Opération enregistrée par le moteur d’audit Royal.'}
                  </p>
                  <p className="text-[11px] text-neutral-500 font-mono mt-0.5">
                    Entité: {inspectModalLog.resourceType} / {inspectModalLog.tableName || 'système'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Journalisé & Immuable</span>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="border-b border-neutral-200 flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setActiveInspectTab('summary')}
                className={cn(
                  'px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-2 -mb-[2px]',
                  activeInspectTab === 'summary'
                    ? 'border-neutral-950 text-neutral-950 bg-neutral-50/70 rounded-t-xl'
                    : 'border-transparent text-neutral-500 hover:text-neutral-900'
                )}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Vue Données & Synthèse</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveInspectTab('diff')}
                className={cn(
                  'px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-2 -mb-[2px]',
                  activeInspectTab === 'diff'
                    ? 'border-neutral-950 text-neutral-950 bg-neutral-50/70 rounded-t-xl'
                    : 'border-transparent text-neutral-500 hover:text-neutral-900'
                )}
              >
                <Columns className="w-3.5 h-3.5" />
                <span>Comparatif Avant / Après</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveInspectTab('raw')}
                className={cn(
                  'px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-2 -mb-[2px]',
                  activeInspectTab === 'raw'
                    ? 'border-neutral-950 text-neutral-950 bg-neutral-50/70 rounded-t-xl'
                    : 'border-transparent text-neutral-500 hover:text-neutral-900'
                )}
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>JSON Brut Complet</span>
              </button>
            </div>

            {/* TAB CONTENT 1: Summary / Key-Value Breakdown */}
            {activeInspectTab === 'summary' && (
              <div className="space-y-4 pt-1">
                {(() => {
                  const targetPayload =
                    inspectModalLog.after ||
                    (inspectModalLog.diffJson && 'payload' in inspectModalLog.diffJson ? inspectModalLog.diffJson.payload : inspectModalLog.diffJson) ||
                    inspectModalLog.before;
                  const hasPayloadEntries =
                    targetPayload &&
                    typeof targetPayload === 'object' &&
                    Object.keys(targetPayload).length > 0;

                  if (!hasPayloadEntries) {
                    return (
                      <div className="p-6 rounded-2xl bg-neutral-50/80 border border-neutral-200 flex items-start gap-4">
                        <div className="p-3 rounded-2xl bg-emerald-100/80 text-emerald-700 mt-0.5 shadow-sm shrink-0">
                          <ShieldCheck className="w-6 h-6" />
                        </div>
                        <div className="space-y-1.5 flex-1">
                          <h4 className="text-sm font-heading font-black text-neutral-900 tracking-tight">
                            Requête Système Sans Données de Mutation Directes
                          </h4>
                          <p className="text-xs text-neutral-600 leading-relaxed">
                            Cette opération [<strong>{inspectModalLog.action}</strong>] sur la ressource <strong>{inspectModalLog.resourceType}</strong> a été exécutée avec succès sans charge utile volumineuse (ex. validation de session, requête de rafraîchissement de token JWT via cookies HttpOnly ou appel d’infrastructure).
                          </p>
                          <div className="pt-2 flex items-center gap-2 flex-wrap">
                            <span className="px-2.5 py-1 rounded-lg text-[11px] font-mono bg-white border border-neutral-200 text-neutral-700">
                              Table: {inspectModalLog.tableName || 'système'}
                            </span>
                            <span className="px-2.5 py-1 rounded-lg text-[11px] font-mono bg-white border border-neutral-200 text-neutral-700">
                              Ressource ID: #{inspectModalLog.resourceId || 'Global'}
                            </span>
                            <span className="px-2.5 py-1 rounded-lg text-[11px] font-mono bg-emerald-50 text-emerald-800 border border-emerald-200">
                              État: Valide & Sauvegardé
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  // Render Structured Table of fields
                  return (
                    <div className="rounded-2xl border border-neutral-200 overflow-hidden shadow-sm bg-white">
                      <div className="px-4 py-3 bg-neutral-50/80 border-b border-neutral-200 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-neutral-800 uppercase tracking-wide">
                            Champs & Propriétés Altérées
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-200 text-neutral-700">
                            {Object.keys(targetPayload).length} champ(s)
                          </span>
                        </div>
                        <span className="text-[11px] text-neutral-400 font-mono">Données Applicatives</span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-neutral-50/40 text-neutral-500 border-b border-neutral-100 uppercase text-[10px] font-bold tracking-wider">
                            <tr>
                              <th className="px-4 py-2.5">Propriété</th>
                              <th className="px-4 py-2.5">Valeur Appliquée</th>
                              <th className="px-4 py-2.5 text-right">Type</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-neutral-100 font-mono">
                            {Object.entries(targetPayload).map(([key, value]) => {
                              const valType = value === null ? 'null' : Array.isArray(value) ? 'array' : typeof value;
                              return (
                                <tr key={key} className="hover:bg-neutral-50/60 transition">
                                  <td className="px-4 py-2.5 font-bold text-neutral-900 font-sans">
                                    {key}
                                  </td>
                                  <td className="px-4 py-2.5 max-w-md truncate">
                                    {value === null ? (
                                      <span className="text-rose-500 italic font-mono">null</span>
                                    ) : typeof value === 'boolean' ? (
                                      <span className={cn(
                                        'px-2 py-0.5 rounded text-[10px] font-bold',
                                        value ? 'bg-emerald-100 text-emerald-800' : 'bg-neutral-200 text-neutral-700'
                                      )}>
                                        {value ? 'TRUE' : 'FALSE'}
                                      </span>
                                    ) : typeof value === 'object' ? (
                                      <span className="text-indigo-600 font-mono text-[11px]">
                                        {JSON.stringify(value)}
                                      </span>
                                    ) : (
                                      <span className="text-neutral-800">
                                        {String(value)}
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-4 py-2.5 text-right font-sans">
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-neutral-100 text-neutral-500 uppercase">
                                      {valType}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* TAB CONTENT 2: Side-by-Side Diff */}
            {activeInspectTab === 'diff' && (
              <div className="space-y-4 pt-1">
                {/* Explication Pédagogique du Comparatif (Luxury Light Mode) */}
                <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-start gap-3.5 shadow-2xs">
                  <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Columns className="w-4 h-4" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-indigo-950 font-heading">
                      À quoi sert le Comparatif Avant / Après ?
                    </h4>
                    <p className="text-[11px] text-indigo-900/90 leading-relaxed">
                      Ce comparatif permet au super-administrateur <strong>ROOT</strong> de mesurer chirurgicalement l'impact de chaque mutation : 
                      il confronte l'<strong>état initial en base de données</strong> avant l'action, l'<strong>état final appliqué</strong> après l'action, 
                      et isole les <strong>différences champ par champ</strong> (diff).
                    </p>
                  </div>
                </div>

                {/* Synthèse Visuelle des Altérations (si modifiedFields ou delta présent) */}
                {(() => {
                  const diff = inspectModalLog.diffJson;
                  let modifiedList: Array<{ field: string; from: any; to: any }> = [];

                  if (diff && typeof diff === 'object') {
                    if (diff.modifiedFields && typeof diff.modifiedFields === 'object') {
                      modifiedList = Object.entries(diff.modifiedFields).map(([k, v]: [string, any]) => ({
                        field: k,
                        from: v?.from,
                        to: v?.to,
                      }));
                    } else if (diff.field && ('oldValue' in diff || 'newValue' in diff)) {
                      modifiedList = [{
                        field: diff.field,
                        from: diff.oldValue,
                        to: diff.newValue,
                      }];
                    } else if (diff.discountPrice) {
                      modifiedList = [{
                        field: 'discountPrice',
                        from: diff.discountPrice.from,
                        to: diff.discountPrice.to,
                      }];
                    }
                  }

                  if (modifiedList.length === 0) return null;

                  return (
                    <div className="rounded-2xl border border-neutral-200 overflow-hidden shadow-xs bg-white">
                      <div className="px-4 py-2.5 bg-neutral-50/90 border-b border-neutral-200 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                          <span className="text-xs font-bold text-neutral-800">
                            Synthèse des Champs Altérés ({modifiedList.length})
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-neutral-400">Delta Automatique</span>
                      </div>
                      <div className="p-3 divide-y divide-neutral-100">
                        {modifiedList.map((item) => (
                          <div key={item.field} className="py-2.5 flex items-center justify-between gap-4 text-xs flex-wrap">
                            <div className="flex items-center gap-2 font-mono">
                              <span className="font-bold text-neutral-900">{item.field}</span>
                            </div>
                            <div className="flex items-center gap-2 font-mono flex-wrap">
                              <span className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-800 border border-rose-200 text-[11px] font-medium">
                                <span className="text-[9px] uppercase font-bold text-rose-500 mr-1">Avant:</span>
                                {item.from === null ? 'null' : typeof item.from === 'boolean' ? (item.from ? 'true' : 'false') : String(item.from)}
                              </span>
                              <ArrowRight className="w-3.5 h-3.5 text-neutral-400" />
                              <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold">
                                <span className="text-[9px] uppercase font-bold text-emerald-600 mr-1">Après:</span>
                                {item.to === null ? 'null' : typeof item.to === 'boolean' ? (item.to ? 'true' : 'false') : String(item.to)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Blocs de Code JSON en Mode Clair */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <SyntaxCodeBox
                    title="État Antérieur (Before)"
                    badgeColor="rose"
                    data={inspectModalLog.before}
                    emptyMessage="✨ Aucun état antérieur (Création initiale de l'enregistrement)"
                    onCopy={() => copyToClipboard(JSON.stringify(inspectModalLog.before, null, 2), 'code_before')}
                    isCopied={copiedField === 'code_before'}
                  />
                  <SyntaxCodeBox
                    title="État Appliqué (After)"
                    badgeColor="emerald"
                    data={inspectModalLog.after}
                    emptyMessage="Données supprimées ou aucun état postérieur généré"
                    onCopy={() => copyToClipboard(JSON.stringify(inspectModalLog.after, null, 2), 'code_after')}
                    isCopied={copiedField === 'code_after'}
                  />
                </div>

                {inspectModalLog.diffJson && (
                  <SyntaxCodeBox
                    title="Détail des Différences Champ par Champ (diffJson)"
                    badgeColor="indigo"
                    data={inspectModalLog.diffJson}
                    onCopy={() => copyToClipboard(JSON.stringify(inspectModalLog.diffJson, null, 2), 'code_diff')}
                    isCopied={copiedField === 'code_diff'}
                  />
                )}
              </div>
            )}

            {/* TAB CONTENT 3: Raw Full JSON (Luxury Light Mode) */}
            {activeInspectTab === 'raw' && (
              <div className="space-y-3 pt-1">
                <div className="p-3.5 rounded-2xl bg-neutral-50/80 border border-neutral-200/80 text-xs text-neutral-600 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-neutral-500" />
                    <span>Payload brut au format JSON conforme au schéma d'audit Royal.</span>
                  </div>
                  <span className="text-[10px] font-mono text-neutral-400">AuditLogItem</span>
                </div>
                <SyntaxCodeBox
                  title="Enregistrement d'Audit Complet (AuditLogItem)"
                  badgeColor="neutral"
                  data={inspectModalLog}
                  onCopy={() => copyToClipboard(JSON.stringify(inspectModalLog, null, 2), 'code_raw')}
                  isCopied={copiedField === 'code_raw'}
                />
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
