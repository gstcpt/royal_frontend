'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  ArrowRight,
  BarChart3,
  Package,
  Users,
  ShoppingCart,
  Wallet,
  Warehouse,
  Store,
  Search,
  Settings,
  UserCheck,
  MessageSquareQuote,
  ShoppingBag,
  Bell,
  Mail,
  MessageSquare,
  Star,
  Truck,
  Tag,
  Layers,
  ShieldCheck,
  Activity,
  Briefcase,
  FileText,
  Receipt,
  ClipboardCheck,
  Eye,
  Heart,
} from 'lucide-react';
import { Breadcrumb, Badge } from '@/components/ui';
import { fetchApi } from '@/lib/api';
import { formatTndCurrency } from '@/lib/utils';
import {
  RoyalStackedBarChart,
  RoyalAreaTrendChart,
  RoyalDonutChart,
  RoyalGaugeChart,
  RoyalSegmentedBarsChart,
  RoyalHorizontalBarsChart,
} from '@/components/dashboard/RoyalChartsSuite';

type LinkDef = { label: string; href: string; desc: string };

const SECTION_META: Record<
  string,
  {
    title: string;
    subtitle: string;
    links: LinkDef[];
  }
> = {
  community: {
    title: 'Vue d’ensemble — Communauté',
    subtitle: 'Notifications système, discussions Support clients et messages du formulaire Contact.',
    links: [
      { label: 'Notifications', href: '/dashboard/community/notifications', desc: 'Alertes commandes, avis et système' },
      { label: 'Support', href: '/dashboard/community/messages', desc: 'Discussions directes clients ↔ équipe' },
      { label: 'Contact', href: '/dashboard/community/contacts', desc: 'Demandes issues du formulaire public' },
    ],
  },
  users: {
    title: 'Vue d’ensemble — Gestion des utilisateurs',
    subtitle: 'Administration par rôle métier des équipes internes et accès opérationnels.',
    links: [
      { label: 'Super admin', href: '/dashboard/root/superadmins', desc: 'Direction Générale' },
      { label: 'Website Manager', href: '/dashboard/users/website-managers', desc: 'Gestion Boutique & Catalogue' },
      { label: 'Magasiniers', href: '/dashboard/users/magasiniers', desc: 'Dépôts & Inventaires' },
      { label: 'Caissiers', href: '/dashboard/users/caissiers', desc: 'Points de vente POS' },
      { label: 'Vendeurs', href: '/dashboard/users/vendeurs', desc: 'Showrooms & Conseils' },
      { label: 'Financiers', href: '/dashboard/users/financiers', desc: 'Trésorerie & Comptabilité' },
      { label: 'Commercials', href: '/dashboard/users/commercials', desc: 'Prospection & B2B' },
    ],
  },
  catalogue: {
    title: 'Vue d’ensemble — Catalogue Commercial',
    subtitle: 'Marques, catégories hiérarchisées, caractéristiques, variantes, articles et codes promo.',
    links: [
      { label: 'Marques', href: '/dashboard/brands', desc: 'Marques catalogue & fabricants' },
      { label: 'Catégories', href: '/dashboard/categories', desc: 'Arborescence 3 niveaux' },
      { label: 'Caractéristiques', href: '/dashboard/characteristics', desc: 'Fiches techniques normalisées' },
      { label: 'Variantes', href: '/dashboard/variants', desc: 'Nuances & déclinaisons' },
      { label: 'Articles', href: '/dashboard/articles', desc: 'Catalogue complet & stock' },
      { label: 'Codes promotionnels', href: '/dashboard/coupons', desc: 'Campagnes & seuils livraison' },
    ],
  },
  treasury: {
    title: 'Vue d’ensemble — Trésorerie',
    subtitle: 'Caisses physiques/bancaires, journal chronologique, suivi règlements et livres comptables.',
    links: [
      { label: 'Caisses', href: '/dashboard/treasury', desc: 'Ouverture, comptage & clôture' },
      { label: 'Journal', href: '/dashboard/treasury/transactions', desc: 'Encaissements & décaissements' },
      { label: 'Suivi des règlements', href: '/dashboard/treasury/payments', desc: 'Chèques & traites' },
      { label: 'Livres', href: '/dashboard/accounting', desc: 'Écritures comptables' },
    ],
  },
  purchases: {
    title: 'Vue d’ensemble — Achats et approvisionnement',
    subtitle: 'Portefeuille prospects, fiches fournisseurs officielles, commandes BC et réceptions BR.',
    links: [
      { label: 'Portefeuille de prospects', href: '/dashboard/purchases/prospects', desc: 'Contacts sans commande BC' },
      { label: 'Fiches fournisseurs', href: '/dashboard/suppliers', desc: 'Fournisseurs actifs MF/CIN' },
      { label: 'Commandes fournisseurs', href: '/dashboard/purchases/orders', desc: 'Bons de commande BC' },
      { label: 'Bon de réception', href: '/dashboard/purchases/receipts', desc: 'Contrôle quai BR' },
    ],
  },
  stock: {
    title: 'Vue d’ensemble — Stock et entrepôts',
    subtitle: 'Dépôts hiérarchisés, bons d’entrée/sortie, ajustements d’inventaire et transferts.',
    links: [
      { label: 'Dépôts', href: '/dashboard/warehouses', desc: 'Entrepôts & emplacements' },
      { label: "Bon d'entrée", href: '/dashboard/stock-in', desc: 'Entrées stock BE' },
      { label: 'Bon de sortie', href: '/dashboard/stock-out', desc: 'Sorties stock BS' },
      { label: 'Ajustement', href: '/dashboard/inventory-documents', desc: 'Inventaires physiques' },
      { label: 'Mouvements de stock', href: '/dashboard/transfers', desc: 'Transferts inter-dépôts' },
    ],
  },
  sales: {
    title: 'Vue d’ensemble — Ventes et distribution',
    subtitle: 'Fiches clients CRM, commandes omnicanales, bons de livraison, retours et factures.',
    links: [
      { label: 'Fiches clients', href: '/dashboard/customers', desc: 'Base clients B2C & B2B' },
      { label: 'Commandes clients', href: '/dashboard/orders', desc: 'Suivi 9 étapes' },
      { label: 'Bon de livraison', href: '/dashboard/deliveries', desc: 'Expéditions & transporteurs' },
      { label: 'Bon de retour', href: '/dashboard/returns', desc: 'SAV & avoirs' },
      { label: 'Factures', href: '/dashboard/invoices', desc: 'Facturation légale TND' },
    ],
  },
  pos: {
    title: 'Vue d’ensemble — Point de vente',
    subtitle: 'Gestion des salles d’exposition (Showrooms) et terminal caisse tactile.',
    links: [
      { label: "Salles d'exposition", href: '/dashboard/pos/showrooms', desc: 'Showrooms & caisses associées' },
      { label: 'Terminal', href: '/dashboard/pos', desc: 'Caisse tactile showroom' },
    ],
  },
  seo: {
    title: 'Vue d’ensemble — SEO & Réputation',
    subtitle: 'Commentaires articles, interactions Like/Dislike/Favoris, abonnements et témoignages accueil.',
    links: [
      { label: 'Commentaires et avis', href: '/dashboard/community/testimonials', desc: 'Modération avis articles' },
      { label: 'Interactions', href: '/dashboard/reports/interactions', desc: 'Likes, dislikes & favoris' },
      { label: 'Abonnements', href: '/dashboard/community/newsletters', desc: 'Liste newsletter' },
      { label: 'Témoignages', href: '/dashboard/seo/testimonials', desc: 'Témoignages page d’accueil' },
      { label: 'Pixels & Référencement SEO', href: '/dashboard/seo/pixels', desc: 'Meta, TikTok, GA4, GTM, Snap & Search Console' },
    ],
  },
  reports: {
    title: 'Vue d’ensemble — Rapports et statistiques',
    subtitle: 'Conseils d’achat, analyse ventes & marges et suivi détaillé des caisses.',
    links: [
      { label: "Conseils d'achat", href: '/dashboard/analytics', desc: 'Recommandations réassort' },
      { label: 'Ventes et marges', href: '/dashboard/reports/sales', desc: 'Chiffre d’affaires & rentabilité' },
      { label: 'Suivi des caisses', href: '/dashboard/reports/treasury', desc: 'Stats encaissements & décaissements' },
    ],
  },
  client: {
    title: 'Vue d’ensemble — Espace client',
    subtitle: 'Fil d’actualité client, suivi des commandes, favoris, profil, fidélité et codes privilèges.',
    links: [
      { label: 'Accueil', href: '/account/home', desc: 'Fil chronologique d’activité' },
      { label: 'Suivi des commandes', href: '/account/orders', desc: 'Historique & impression A4' },
      { label: 'Liste de souhaits', href: '/account/favorites', desc: 'Articles favoris' },
      { label: 'Mon profil', href: '/account/profile', desc: 'Avatar & adresses' },
    ],
  },
  system: {
    title: 'Vue d’ensemble — Système & CMS',
    subtitle: 'CMS Identité, Mise en page, Vues, Modèles d’emails, Paramètres système et RBAC.',
    links: [
      { label: 'CMS — Identité et marque', href: '/dashboard/root/storefront/info', desc: 'Logo, favicon & coordonnées' },
      { label: 'CMS — Mise en page et design', href: '/dashboard/root/storefront/layouts', desc: 'Couleurs, polices, en-tête & pied' },
      { label: 'CMS — Vues et modèles', href: '/dashboard/root/storefront/views?view=home', desc: 'Vues Storefront personnalisables' },
      { label: 'CMS — Modèles de courriels', href: '/dashboard/root/email-templates?cat=auth', desc: '4 familles d’emails' },
      { label: 'Stockage Médias & CDN', href: '/dashboard/root/storage', desc: 'Local Disk VPS, Cloudflare R2, WebP' },
      { label: 'Modalités & Passerelles Paiement', href: '/dashboard/payment-methods?tab=gateways', desc: 'Conditions, Flouci & ClicToPay' },
      { label: 'Documents & Imprimantes POS', href: '/dashboard/root/print-templates?tab=printers', desc: 'Gabarits HTML, 80mm / A4 & Aperçu POS' },
      { label: 'Intelligence Artificielle (IA)', href: '/dashboard/root/ai', desc: 'Gemini Flash & Groq gratuits' },
      { label: 'Rôles et permissions', href: '/dashboard/root/roles-permissions', desc: 'Matrice RBAC complète' },
    ],
  },
};

/**
 * Full-width adaptive row splitter:
 * 2 -> [2] (50% each)
 * 3 -> [3] (33.3% each)
 * 4 -> [4] (25% each)
 * 5 -> [3, 2]
 * 6 -> [3, 3]
 * 7 -> [4, 3]
 * 8 -> [4, 4]
 */
function chunkRowsForFullWidth<T>(items: T[]): T[][] {
  const n = items.length;
  if (n === 0) return [];
  const sizes: number[] = [];
  let rem = n;
  while (rem > 0) {
    if (rem <= 4) {
      sizes.push(rem);
      rem = 0;
    } else if (rem === 5) {
      sizes.push(3, 2);
      rem = 0;
    } else if (rem === 6 || rem === 9) {
      sizes.push(3);
      rem -= 3;
    } else {
      sizes.push(4);
      rem -= 4;
    }
  }
  const rows: T[][] = [];
  let offset = 0;
  for (const sz of sizes) {
    rows.push(items.slice(offset, offset + sz));
    offset += sz;
  }
  return rows;
}

function rowGridClass(len: number): string {
  if (len <= 1) return 'grid grid-cols-1 gap-4';
  if (len === 2) return 'grid grid-cols-1 sm:grid-cols-2 gap-4';
  if (len === 3) return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4';
  return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4';
}

function buildStatCards(sectionId: string, kpis: any) {
  switch (sectionId) {
    case 'community':
      return [
        { label: 'Notifications Non Lues', value: kpis.notificationsCount ?? 0, icon: Bell },
        { label: 'Total Notifications', value: kpis.totalNotificationsCount ?? 0, icon: Activity },
        { label: 'Discussions Support', value: kpis.supportCount ?? 0, icon: MessageSquare },
        { label: 'Tickets Support Ouverts', value: kpis.openSupportCount ?? 0, icon: ShieldCheck },
        { label: 'Messages Contact', value: kpis.contactsCount ?? 0, icon: Mail },
        { label: 'Contacts Non Lus', value: kpis.unreadContactsCount ?? 0, icon: MessageSquareQuote },
      ];
    case 'users':
      return [
        { label: 'Comptes Équipe Total', value: kpis.usersCount ?? 0, icon: Users },
        { label: 'Comptes Actifs', value: kpis.activeUsers ?? 0, icon: UserCheck },
        { label: 'Comptes Désactivés', value: kpis.inactiveUsers ?? 0, icon: ShieldCheck },
        { label: 'Rôles Métiers', value: kpis.rolesCount ?? 0, icon: Layers },
        { label: 'Clients Boutique', value: kpis.customersCount ?? 0, icon: ShoppingBag },
      ];
    case 'catalogue':
      return [
        { label: 'Total Articles', value: kpis.productsCount ?? 0, icon: Package },
        { label: 'Articles Actifs', value: kpis.activeProducts ?? 0, icon: Layers },
        { label: 'Catégories Actives', value: kpis.categoriesCount ?? 0, icon: Warehouse },
        { label: 'Marques Actives', value: kpis.brandsCount ?? 0, icon: Tag },
        { label: 'Variantes Catalogues', value: kpis.variantsCount ?? 0, icon: Activity },
        { label: 'Caractéristiques', value: kpis.characteristicsCount ?? 0, icon: Settings },
        { label: 'Codes Promo Actifs', value: kpis.couponsCount ?? 0, icon: Star },
      ];
    case 'treasury':
      return [
        { label: 'Caisses Actives', value: kpis.caissesCount ?? 0, icon: Wallet },
        { label: 'Sessions Ouvertes', value: kpis.openSessions ?? 0, icon: Store },
        { label: 'Mouvements Caisse', value: kpis.movementsCount ?? 0, icon: Activity },
        { label: 'Règlements Validés', value: formatTndCurrency(kpis.totalPayments || 0), icon: BarChart3 },
      ];
    case 'purchases':
      return [
        { label: 'Prospects Enregistrés', value: kpis.prospectsCount ?? 0, icon: Users },
        { label: 'Fournisseurs Officiels', value: kpis.suppliersCount ?? 0, icon: Briefcase },
        { label: 'Fournisseurs Actifs', value: kpis.activeSuppliers ?? 0, icon: UserCheck },
        { label: 'Bons de Commande (BC)', value: kpis.poCount ?? 0, icon: FileText },
        { label: 'Bons de Réception (BR)', value: kpis.brCount ?? 0, icon: ClipboardCheck },
        { label: 'Volume Achats TND', value: formatTndCurrency(kpis.totalPoAmount || 0), icon: Wallet },
      ];
    case 'stock':
      return [
        { label: 'Dépôts Actifs', value: kpis.warehousesCount ?? 0, icon: Warehouse },
        { label: 'Stock Physique Total', value: (kpis.totalPhysicalQty ?? 0).toLocaleString('fr-FR'), icon: Package },
        { label: 'Stock Réservé', value: (kpis.totalReservedQty ?? 0).toLocaleString('fr-FR'), icon: ShoppingCart },
        { label: 'Alertes Stock Faible', value: kpis.lowStockCount ?? 0, icon: Bell },
        { label: 'Mouvements Stock', value: kpis.movementsCount ?? 0, icon: Activity },
        { label: 'Bons de Sortie (BS)', value: kpis.stockOutsCount ?? 0, icon: FileText },
        { label: 'Transferts Dépôts', value: kpis.transfersCount ?? 0, icon: Truck },
      ];
    case 'pos':
      return [
        { label: 'Showrooms Actifs', value: kpis.posCount ?? 0, icon: Store },
        { label: 'Caisses Tactiles', value: kpis.registersCount ?? 0, icon: Wallet },
        { label: 'Sessions Ouvertes', value: kpis.openSessions ?? 0, icon: Activity },
        { label: 'Commandes Showroom', value: kpis.posOrdersCount ?? 0, icon: ShoppingBag },
        { label: 'Chiffre POS TND', value: formatTndCurrency(kpis.posRevenue || 0), icon: BarChart3 },
      ];
    case 'seo':
      return [
        { label: 'Avis & Notes Clients', value: kpis.reviewsTotal ?? 0, icon: Star },
        { label: 'Avis Approuvés', value: kpis.reviewsApproved ?? 0, icon: UserCheck },
        { label: 'Interactions Clients', value: kpis.totalInteractions ?? 0, icon: Heart },
        { label: 'Vues Fiches Articles', value: (kpis.totalViews ?? 0).toLocaleString('fr-FR'), icon: Eye },
        { label: 'Abonnés Newsletter', value: kpis.newsletterCount ?? 0, icon: Mail },
        { label: 'Témoignages Accueil', value: kpis.testimonialsCount ?? 0, icon: MessageSquareQuote },
      ];
    case 'system':
      return [
        { label: 'Utilisateurs Internes', value: kpis.usersCount ?? 0, icon: Users },
        { label: 'Rôles Système', value: kpis.rolesCount ?? 0, icon: ShieldCheck },
        { label: 'Permissions RBAC', value: kpis.permissionsCount ?? 0, icon: Settings },
        { label: 'Paramètres DB', value: kpis.settingsCount ?? 0, icon: Layers },
        { label: 'Modèles Email', value: kpis.emailTemplatesCount ?? 0, icon: Mail },
        { label: 'Entrées Journal Audit', value: kpis.auditCount ?? 0, icon: Activity },
      ];
    case 'client':
      return [
        { label: 'Clients Boutique', value: kpis.customersCount ?? 0, icon: Users },
        { label: 'Commandes Totales', value: kpis.ordersCount ?? 0, icon: ShoppingCart },
        { label: 'Commandes Livrées', value: kpis.deliveredOrders ?? 0, icon: Truck },
        { label: 'Codes Privilèges', value: kpis.couponsCount ?? 0, icon: Tag },
      ];
    case 'reports':
      return [
        { label: 'Volume Ventes TND', value: formatTndCurrency(kpis.revenueTotal || 0), icon: Wallet },
        { label: 'Commandes Totales', value: kpis.ordersCount ?? 0, icon: ShoppingCart },
        { label: 'Commandes Livrées', value: kpis.deliveredOrders ?? 0, icon: Truck },
        { label: 'Articles Catalogue', value: kpis.productsCount ?? 0, icon: Package },
        { label: 'Clients Inscrits', value: kpis.customersCount ?? 0, icon: Users },
        { label: 'Factures Émises', value: kpis.invoicesCount ?? 0, icon: Receipt },
      ];
    default: // sales
      return [
        { label: 'Commandes Totales', value: kpis.ordersCount ?? 0, icon: ShoppingCart },
        { label: 'En Attente / Cours', value: kpis.pendingOrders ?? 0, icon: Activity },
        { label: 'Livrées', value: kpis.deliveredOrders ?? 0, icon: Truck },
        { label: 'Annulées', value: kpis.cancelledOrders ?? 0, icon: Bell },
        { label: 'Bons de Livraison (BL)', value: kpis.deliveriesCount ?? 0, icon: FileText },
        { label: 'Factures Émises', value: kpis.invoicesCount ?? 0, icon: Receipt },
        { label: 'Clients CRM', value: kpis.customersCount ?? 0, icon: Users },
        { label: 'Volume Ventes TND', value: formatTndCurrency(kpis.revenueTotal || 0), icon: Wallet },
      ];
  }
}

export default function SectionDashboardPage() {
  const params = useParams();
  const sectionId = String(params?.sectionId || 'catalogue').toLowerCase();
  const meta = SECTION_META[sectionId] || SECTION_META.catalogue;

  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetchApi(`/storefront-cms/section-dashboard/${sectionId}`)
      .then((res) => setData(res?.data || res))
      .catch(() => null);
  }, [sectionId]);

  const kpis = data?.kpis || {};
  const lists = data?.lists || {};
  const charts = data?.charts || {};
  const statCards = buildStatCards(sectionId, kpis);
  const kpiRows = chunkRowsForFullWidth(statCards);
  const linkRows = chunkRowsForFullWidth(meta.links);

  const fallbackSlices = [{ label: 'Chargement...', value: 1 }];

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      {/* 1. Header Card ONLY (Zero buttons in header) */}
      <div className="bg-white p-6 rounded-3xl border border-[#E6E1D6] shadow-sm space-y-3">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-[#FBF6E8] text-[#B8860B] border border-[#E6D6A6] rounded-2xl shrink-0">
            <LayoutDashboard className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-heading font-black text-[#1D232E] tracking-tight">
              {meta.title}
            </h1>
            <p className="text-xs text-slate-500">{meta.subtitle}</p>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100">
          <Breadcrumb items={[{ label: meta.title }]} />
        </div>
      </div>

      {/* 2. Section-Specific Live Metrics Cards — Smart Full-Width Balanced Rows */}
      <div className="space-y-4">
        {kpiRows.map((row, rIdx) => (
          <div key={rIdx} className={rowGridClass(row.length)}>
            {row.map((st) => {
              const Icon = st.icon;
              return (
                <div
                  key={st.label}
                  className="bg-white p-5 rounded-3xl border border-[#E6E1D6] shadow-sm space-y-2 hover:border-[#C59B27]/60 transition"
                >
                  <div className="flex items-center justify-between text-[11px] font-bold uppercase text-slate-500 gap-2">
                    <span className="truncate">{st.label}</span>
                    <Icon className="w-4 h-4 text-[#C59B27] shrink-0" />
                  </div>
                  <div className="text-2xl font-heading font-black font-mono text-[#1D232E]">
                    {st.value}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* 3. Full-Width Sous-Vues & Accès Directs Card Grid (Replacing Quick Actions) */}
      <div className="bg-white p-6 rounded-3xl border border-[#E6E1D6] shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-heading font-extrabold text-[#1D232E] uppercase tracking-wider flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#C59B27]" />
            <span>Sous-Vues &amp; Modules de la Section</span>
          </h2>
          <span className="text-[11px] font-semibold text-slate-400">
            {meta.links.length} vues accessibles
          </span>
        </div>
        <div className="space-y-3">
          {linkRows.map((row, rIdx) => (
            <div key={rIdx} className={rowGridClass(row.length)}>
              {row.map((lnk) => (
                <Link
                  key={lnk.href + lnk.label}
                  href={lnk.href}
                  className="p-4 rounded-2xl bg-[#FBF9F4] border border-[#E6E1D6] hover:border-[#C59B27] hover:bg-[#FBF6E8] transition flex items-center justify-between gap-3 group"
                >
                  <div className="min-w-0">
                    <div className="text-xs font-extrabold text-[#1D232E] group-hover:text-[#9A7414] truncate">
                      {lnk.label}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 truncate">{lnk.desc}</div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#C59B27] shrink-0 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* 4. Section-Tailored Multi-Type Live Charts Grid (100% Real PostgreSQL & SysConfig Data) */}
      {sectionId === 'community' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-6">
            <RoyalDonutChart
              title="Répartition des Flux Communauté"
              subtitle="Support client, messages contact & alertes actives"
              centerLabel="Total"
              centerValue={String((kpis.supportCount || 0) + (kpis.contactsCount || 0) + (kpis.totalNotificationsCount || 0))}
              slices={charts.statusBreakdown?.length ? charts.statusBreakdown : fallbackSlices}
            />
          </div>
          <div className="lg:col-span-6">
            <RoyalSegmentedBarsChart
              title="Intensité par Canal de Communication"
              subtitle="Tickets support ouverts, contacts reçus et notifications"
              items={charts.channelVolumes?.length ? charts.channelVolumes : []}
            />
          </div>
          <div className="lg:col-span-7">
            <RoyalStackedBarChart
              title="Comparatif Traitement (Clôturés vs En attente)"
              subtitle="Support Client vs Formulaire Contact vs Notifications"
              primaryLabel="Traités / Lus"
              secondaryLabel="En attente"
              data={charts.engagementCompare?.length ? charts.engagementCompare : []}
            />
          </div>
          <div className="lg:col-span-5">
            <RoyalGaugeChart
              title="Taux de Résolution & Lecture"
              subtitle="Pourcentage global des échanges pris en charge"
              score={charts.resolutionRate ?? 0}
              statusText={`${kpis.openSupportCount ?? 0} ticket(s) support et ${kpis.unreadContactsCount ?? 0} contact(s) en attente.`}
            />
          </div>
        </div>
      )}

      {sectionId === 'users' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-6">
            <RoyalHorizontalBarsChart
              title="Distribution Équipe par Rôle Métier"
              subtitle="Nombre réel de comptes internes par profil RBAC"
              items={charts.roleDistribution?.length ? charts.roleDistribution : []}
            />
          </div>
          <div className="lg:col-span-6">
            <RoyalDonutChart
              title="Statut des Comptes Utilisateurs & Clients"
              subtitle="Personnel actif vs désactivé vs base clients"
              centerLabel="Comptes"
              centerValue={String((kpis.usersCount || 0) + (kpis.customersCount || 0))}
              slices={charts.accountStatusSlices?.length ? charts.accountStatusSlices : fallbackSlices}
            />
          </div>
          <div className="lg:col-span-7">
            <RoyalSegmentedBarsChart
              title="Couverture des Rôles Métiers Opérationnels"
              subtitle="Dotation des équipes par pôle"
              items={charts.roleCoverage?.length ? charts.roleCoverage : []}
            />
          </div>
          <div className="lg:col-span-5">
            <RoyalGaugeChart
              title="Taux d’Activation des Comptes Équipe"
              subtitle="Proportion des comptes internes opérationnels"
              score={charts.activeRate ?? 0}
              statusText={`${kpis.activeUsers ?? 0} comptes actifs sur ${kpis.usersCount ?? 0} membres internes.`}
            />
          </div>
        </div>
      )}

      {sectionId === 'catalogue' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-6">
            <RoyalHorizontalBarsChart
              title="Top Catégories du Catalogue"
              subtitle="Répartition réelle des articles actifs par rayon"
              items={charts.topCategories?.length ? charts.topCategories : []}
            />
          </div>
          <div className="lg:col-span-6">
            <RoyalDonutChart
              title="Statut de Publication des Articles"
              subtitle="Articles actifs vs brouillons / archivés"
              centerLabel="Articles"
              centerValue={String(kpis.productsCount ?? 0)}
              slices={charts.statusSlices?.length ? charts.statusSlices : fallbackSlices}
            />
          </div>
          <div className="lg:col-span-7">
            <RoyalStackedBarChart
              title="Poids des Principales Marques"
              subtitle="Volume d’articles référencés par fabricant"
              primaryLabel="Articles"
              secondaryLabel="En révision"
              data={Array.isArray(charts.brandBars) ? charts.brandBars : []}
            />
          </div>
          <div className="lg:col-span-5">
            <RoyalGaugeChart
              title="Taux de Mise en Ligne Catalogue"
              subtitle="Articles actifs publiés sur la boutique"
              score={charts.activeRate ?? 0}
              statusText={`${kpis.activeProducts ?? 0} articles actifs et ${kpis.variantsCount ?? 0} variantes SKU.`}
            />
          </div>
        </div>
      )}

      {sectionId === 'treasury' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-7">
            <RoyalAreaTrendChart
              title="Évolution des Mouvements de Trésorerie"
              subtitle="Montants réels issus des sessions et écritures journal"
              headlineValue={formatTndCurrency(kpis.totalPayments || 0)}
              deltaLabel={`${kpis.movementsCount ?? 0} opérations`}
              seriesName="Flux Financiers (TND)"
              points={charts.trendPoints?.length ? charts.trendPoints : []}
            />
          </div>
          <div className="lg:col-span-5">
            <RoyalDonutChart
              title="Répartition par Mode de Règlement"
              subtitle="Espèces, chèques, traites & virements"
              centerLabel="Règlements"
              centerValue={String((charts.methodSlices || []).reduce((s: number, x: any) => s + (x.value || 0), 0))}
              slices={charts.methodSlices?.length ? charts.methodSlices : fallbackSlices}
            />
          </div>
          <div className="lg:col-span-7">
            <RoyalStackedBarChart
              title="Balance Entrées vs Sorties par Caisse"
              subtitle="Encaissements vs décaissements sur chaque compte"
              primaryLabel="Entrées (TND)"
              secondaryLabel="Sorties (TND)"
              data={charts.cashflowCompare?.length ? charts.cashflowCompare : []}
              unit=" DT"
            />
          </div>
          <div className="lg:col-span-5">
            <RoyalGaugeChart
              title="Taux de Règlements Encaissés"
              subtitle="Part des chèques, traites et paiements réglés"
              score={charts.settlementRate ?? 0}
              statusText={`${kpis.openSessions ?? 0} session(s) caisse actuellement ouverte(s).`}
            />
          </div>
        </div>
      )}

      {sectionId === 'purchases' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-6">
            <RoyalSegmentedBarsChart
              title="Entonnoir Cycle Achat (Prospects → BC → BR)"
              subtitle="Progression entre prospection, commandes et réceptions"
              items={charts.pipelineBars?.length ? charts.pipelineBars : []}
            />
          </div>
          <div className="lg:col-span-6">
            <RoyalDonutChart
              title="État des Commandes Fournisseurs (BC)"
              subtitle="Répartition des bons de commande par statut"
              centerLabel="Total BC"
              centerValue={String(kpis.poCount ?? 0)}
              slices={charts.poStatusSlices?.length ? charts.poStatusSlices : fallbackSlices}
            />
          </div>
          <div className="lg:col-span-7">
            <RoyalStackedBarChart
              title="Engagements Financiers par Fournisseur"
              subtitle="Cumul des bons de commande en TND (HT & TVA)"
              primaryLabel="Montant HT"
              secondaryLabel="TVA"
              unit=" DT"
              data={Array.isArray(charts.supplierAmounts) ? charts.supplierAmounts : []}
            />
          </div>
          <div className="lg:col-span-5">
            <RoyalGaugeChart
              title="Taux de Réception Quai (BR / BC)"
              subtitle="Couverture des commandes fournisseurs réceptionnées"
              score={charts.receiptRate ?? 0}
              statusText={`${kpis.brCount ?? 0} bon(s) de réception validé(s) pour ${kpis.poCount ?? 0} BC.`}
            />
          </div>
        </div>
      )}

      {sectionId === 'stock' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-6">
            <RoyalHorizontalBarsChart
              title="Stock Physique Réel par Dépôt"
              subtitle="Unités cumulées en entrepôt central et showrooms"
              items={charts.warehouseBreakdown?.length ? charts.warehouseBreakdown : []}
            />
          </div>
          <div className="lg:col-span-6">
            <RoyalDonutChart
              title="Typologie des Mouvements de Stock"
              subtitle="Entrées (BE), Sorties (BS/Ventes), Ajustements & Transferts"
              centerLabel="Mouvements"
              centerValue={String(kpis.movementsCount ?? 0)}
              slices={charts.movementSlices?.length ? charts.movementSlices : fallbackSlices}
            />
          </div>
          <div className="lg:col-span-7">
            <RoyalSegmentedBarsChart
              title="Couverture Opérationnelle des Entrepôts"
              subtitle="Disponible vs réservé et documents logistiques"
              items={charts.coverageSegments?.length ? charts.coverageSegments : []}
            />
          </div>
          <div className="lg:col-span-5">
            <RoyalGaugeChart
              title="Indice de Santé & Disponibilité Stock"
              subtitle="Part des références hors seuil critique"
              score={charts.healthyRate ?? 0}
              statusText={`${kpis.lowStockCount ?? 0} alerte(s) stock faible détectée(s) sur l'ensemble des dépôts.`}
            />
          </div>
        </div>
      )}

      {sectionId === 'pos' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-7">
            <RoyalAreaTrendChart
              title="Activité des Ventes Showrooms"
              subtitle="Derniers tickets POS encaissés (TND)"
              headlineValue={formatTndCurrency(kpis.posRevenue || 0)}
              deltaLabel={`${kpis.posOrdersCount ?? 0} tickets POS`}
              seriesName="Montant Ticket (TND)"
              points={charts.posOrderTrend?.length ? charts.posOrderTrend : []}
            />
          </div>
          <div className="lg:col-span-5">
            <RoyalDonutChart
              title="Statuts Commandes Point de Vente"
              subtitle="Répartition des encaissements showroom"
              centerLabel="Tickets"
              centerValue={String(kpis.posOrdersCount ?? 0)}
              slices={charts.posOrderSlices?.length ? charts.posOrderSlices : fallbackSlices}
            />
          </div>
          <div className="lg:col-span-7">
            <RoyalHorizontalBarsChart
              title="Disponibilité Articles par Showroom"
              subtitle="Stock affecté aux dépôts des salles d’exposition"
              items={charts.showroomStocks?.length ? charts.showroomStocks : []}
            />
          </div>
          <div className="lg:col-span-5">
            <RoyalGaugeChart
              title="Ouverture des Caisses Tactiles"
              subtitle="Showrooms & sessions caisse actives"
              score={charts.readinessRate ?? 0}
              statusText={`${kpis.openSessions ?? 0} session(s) ouverte(s) sur ${kpis.registersCount ?? 0} caisse(s).`}
            />
          </div>
        </div>
      )}

      {sectionId === 'seo' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-6">
            <RoyalHorizontalBarsChart
              title="Articles les Plus Consultés"
              subtitle="Classement réel par volume de vues catalogue"
              items={charts.topViewedBars?.length ? charts.topViewedBars : []}
            />
          </div>
          <div className="lg:col-span-6">
            <RoyalDonutChart
              title="Interactions Clients (Likes / Dislikes / Avis / Newsletter)"
              subtitle="Engagement authentique enregistré en base"
              centerLabel="Actions"
              centerValue={String((kpis.totalInteractions || 0) + (kpis.reviewsTotal || 0) + (kpis.newsletterCount || 0))}
              slices={charts.interactionSlices?.length ? charts.interactionSlices : fallbackSlices}
            />
          </div>
          <div className="lg:col-span-7">
            <RoyalStackedBarChart
              title="Modération Avis & Témoignages"
              subtitle="Contenus approuvés vs en attente de modération"
              primaryLabel="Approuvés / Visibles"
              secondaryLabel="En attente"
              data={charts.reputationCompare?.length ? charts.reputationCompare : []}
            />
          </div>
          <div className="lg:col-span-5">
            <RoyalGaugeChart
              title="Indice de Réputation & Approbation"
              subtitle="Ratio global d'avis positifs & contenus publiés"
              score={charts.approvalScore ?? 0}
              statusText={`${kpis.reviewsApproved ?? 0} avis approuvé(s) • ${kpis.testimonialsCount ?? 0} témoignage(s) accueil.`}
            />
          </div>
        </div>
      )}

      {sectionId === 'system' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-4">
            <RoyalDonutChart
              title="Gouvernance & Modules Système"
              subtitle="Rôles, permissions RBAC, paramètres & emails"
              centerLabel="Éléments"
              centerValue={String((kpis.rolesCount || 0) + (kpis.settingsCount || 0) + (kpis.emailTemplatesCount || 0))}
              slices={charts.configSlices?.length ? charts.configSlices : fallbackSlices}
            />
          </div>
          <div className="lg:col-span-4">
            <RoyalHorizontalBarsChart
              title="Activité Audit par Ressource"
              subtitle="Entrées réelles du journal système"
              items={charts.auditResourceBars?.length ? charts.auditResourceBars : []}
            />
          </div>
          <div className="lg:col-span-4">
            <RoyalGaugeChart
              title="Couverture Architecture & RBAC"
              subtitle="Niveau d’intégrité des rôles & permissions"
              score={typeof charts.securityCoverage === 'number' ? charts.securityCoverage : 100}
              statusText={`${kpis.rolesCount ?? 0} rôles système et ${kpis.permissionsCount ?? 0} permissions actives.`}
            />
          </div>
        </div>
      )}

      {['sales', 'reports', 'client'].includes(sectionId) && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-7">
            <RoyalAreaTrendChart
              title="Courbe Réelle des Commandes Récentes"
              subtitle="Montants TND des dernières commandes enregistrées"
              headlineValue={formatTndCurrency(kpis.revenueTotal || 0)}
              deltaLabel={`${kpis.ordersCount ?? 0} commande(s)`}
              seriesName="Montant Commande (TND)"
              points={charts.orderTrend?.length ? charts.orderTrend : []}
            />
          </div>
          <div className="lg:col-span-5">
            <RoyalDonutChart
              title="Pipeline & Statuts Commandes"
              subtitle="En attente, expédiées/livrées & annulées"
              centerLabel="Commandes"
              centerValue={String(kpis.ordersCount ?? 0)}
              slices={charts.statusSlices?.length ? charts.statusSlices : fallbackSlices}
            />
          </div>
          <div className="lg:col-span-7">
            <RoyalHorizontalBarsChart
              title="Performance par Canal & Document"
              subtitle="Boutique en ligne, POS, BL émis et facturation"
              items={charts.channelBars?.length ? charts.channelBars : []}
            />
          </div>
          <div className="lg:col-span-5">
            <RoyalGaugeChart
              title="Taux de Livraison & Exécution"
              subtitle="Proportion des commandes abouties ou livrées"
              score={charts.fulfillmentRate ?? 0}
              statusText={`${kpis.deliveredOrders ?? 0} commande(s) livrée(s) • ${kpis.invoicesCount ?? 0} facture(s).`}
            />
          </div>
        </div>
      )}

      {/* 5. Live Recent Activity List Section (Full Width) */}
      <div className="bg-white p-6 rounded-3xl border border-[#E6E1D6] shadow-sm space-y-4">
        {sectionId === 'community' && (
          <>
            <h2 className="text-sm font-heading font-extrabold text-[#1D232E] uppercase tracking-wider flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#C59B27]" />
              <span>Derniers Messages Contact &amp; Discussions Support</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(lists.recentContacts || []).map((c: any) => (
                <Link
                  key={c.id}
                  href="/dashboard/community/contacts"
                  className="p-3.5 rounded-2xl bg-[#FBF9F4] border border-[#E6E1D6] flex items-center justify-between text-xs hover:border-[#C59B27] transition"
                >
                  <div className="min-w-0 pr-2">
                    <div className="font-bold text-[#1D232E] truncate">{c.fullName} — {c.subject}</div>
                    <div className="text-[11px] text-slate-500">Contact Public • {new Date(c.createdAt).toLocaleDateString('fr-FR')}</div>
                  </div>
                  <Badge variant={c.isRead ? 'neutral' : 'warning'} size="sm">
                    {c.isRead ? 'Lu' : 'Nouveau'}
                  </Badge>
                </Link>
              ))}
              {(lists.recentThreads || []).map((t: any) => (
                <Link
                  key={t.id}
                  href="/dashboard/community/messages"
                  className="p-3.5 rounded-2xl bg-white border border-slate-200 flex items-center justify-between text-xs hover:border-[#C59B27] transition"
                >
                  <div className="min-w-0 pr-2">
                    <div className="font-semibold text-[#1D232E] truncate">Support Client : {t.subject}</div>
                    <div className="text-[11px] text-slate-500">Ticket Espace Client</div>
                  </div>
                  <Badge variant="info" size="sm">{t.status}</Badge>
                </Link>
              ))}
              {(lists.recentContacts || []).length === 0 && (lists.recentThreads || []).length === 0 && (
                <p className="text-xs text-slate-400 py-4 text-center md:col-span-2">Aucun message communauté récent.</p>
              )}
            </div>
          </>
        )}

        {sectionId === 'users' && (
          <>
            <h2 className="text-sm font-heading font-extrabold text-[#1D232E] uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-[#C59B27]" />
              <span>Derniers Comptes Équipe Enregistrés</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {(lists.recentStaff || []).map((u: any) => (
                <div key={u.id} className="p-3.5 rounded-2xl bg-[#FBF9F4] border border-[#E6E1D6] flex items-center justify-between text-xs gap-2">
                  <div className="min-w-0">
                    <div className="font-bold text-[#1D232E] truncate">{u.fullName}</div>
                    <div className="text-[11px] text-slate-500 truncate">{u.email}</div>
                  </div>
                  <Badge variant="neutral" size="sm">{u.role}</Badge>
                </div>
              ))}
            </div>
          </>
        )}

        {sectionId === 'catalogue' && (
          <>
            <h2 className="text-sm font-heading font-extrabold text-[#1D232E] uppercase tracking-wider flex items-center gap-2">
              <Package className="w-4 h-4 text-[#C59B27]" />
              <span>Derniers Articles Référencés</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {(lists.recentProducts || []).map((p: any) => (
                <Link
                  key={p.id}
                  href={`/dashboard/articles/${p.id}`}
                  className="p-3.5 rounded-2xl bg-[#FBF9F4] border border-[#E6E1D6] flex items-center justify-between text-xs hover:border-[#C59B27] transition gap-2"
                >
                  <span className="font-semibold text-[#1D232E] truncate">{p.name}</span>
                  <span className="font-mono font-bold text-[#9A7414] shrink-0">
                    {formatTndCurrency(p.sellingPrice)}
                  </span>
                </Link>
              ))}
            </div>
          </>
        )}

        {sectionId === 'treasury' && (
          <>
            <h2 className="text-sm font-heading font-extrabold text-[#1D232E] uppercase tracking-wider flex items-center gap-2">
              <Wallet className="w-4 h-4 text-[#C59B27]" />
              <span>Derniers Mouvements de Trésorerie</span>
            </h2>
            <div className="divide-y divide-slate-100">
              {(lists.recentMovements || []).map((m: any) => (
                <div key={m.id} className="py-2.5 flex items-center justify-between text-xs gap-2">
                  <span className="text-[#1D232E] font-semibold truncate">{m.description || m.type}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="neutral" size="sm">{m.type}</Badge>
                    <span className="font-mono font-bold text-[#9A7414]">{formatTndCurrency(m.amount)}</span>
                  </div>
                </div>
              ))}
              {(lists.recentMovements || []).length === 0 && (
                <p className="text-xs text-slate-400 py-4 text-center">Aucun mouvement de caisse récent.</p>
              )}
            </div>
          </>
        )}

        {sectionId === 'purchases' && (
          <>
            <h2 className="text-sm font-heading font-extrabold text-[#1D232E] uppercase tracking-wider flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-[#C59B27]" />
              <span>Fournisseurs Officiels Récents</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {(lists.recentSuppliers || []).map((s: any) => (
                <div key={s.id} className="p-3.5 rounded-2xl bg-[#FBF9F4] border border-[#E6E1D6] flex items-center justify-between text-xs gap-2">
                  <div className="min-w-0">
                    <div className="font-bold text-[#1D232E] truncate">{s.companyName}</div>
                    <div className="text-[11px] text-slate-500 truncate">{s.contactName || s.phone || 'Contact enregistré'}</div>
                  </div>
                  <Badge variant={s.isActive ? 'success' : 'neutral'} size="sm">
                    {s.isActive ? 'Actif' : 'Inactif'}
                  </Badge>
                </div>
              ))}
            </div>
          </>
        )}

        {sectionId === 'stock' && (
          <>
            <h2 className="text-sm font-heading font-extrabold text-[#1D232E] uppercase tracking-wider flex items-center gap-2">
              <Warehouse className="w-4 h-4 text-[#C59B27]" />
              <span>Niveaux de Stock Surveillés &amp; Mouvements Récents</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(lists.lowStockItems || []).map((item: any) => (
                <div key={item.id} className="p-3.5 rounded-2xl bg-[#FBF9F4] border border-[#E6E1D6] flex items-center justify-between text-xs gap-2">
                  <div className="min-w-0">
                    <div className="font-semibold text-[#1D232E] truncate">{item.name}</div>
                    <div className="text-[11px] text-slate-500">{item.warehouse} • {item.sku}</div>
                  </div>
                  <Badge variant={item.qty <= 5 ? 'warning' : 'success'} size="sm">
                    Qté: {item.qty}
                  </Badge>
                </div>
              ))}
            </div>
          </>
        )}

        {sectionId === 'pos' && (
          <>
            <h2 className="text-sm font-heading font-extrabold text-[#1D232E] uppercase tracking-wider flex items-center gap-2">
              <Store className="w-4 h-4 text-[#C59B27]" />
              <span>Showrooms Actifs &amp; Caisses</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(lists.showrooms || []).map((sh: any) => (
                <div key={sh.id} className="p-4 rounded-2xl bg-[#FBF9F4] border border-[#E6E1D6] flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-[#1D232E]">{sh.name} ({sh.code})</div>
                    <div className="text-[11px] text-slate-500">{sh.address}</div>
                  </div>
                  <Badge variant={sh.isActive ? 'success' : 'neutral'} size="sm">
                    {sh.isActive ? 'Ouvert' : 'Fermé'}
                  </Badge>
                </div>
              ))}
            </div>
          </>
        )}

        {sectionId === 'seo' && (
          <>
            <h2 className="text-sm font-heading font-extrabold text-[#1D232E] uppercase tracking-wider flex items-center gap-2">
              <Search className="w-4 h-4 text-[#C59B27]" />
              <span>Couverture SEO &amp; Vues des Articles Récents</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {(lists.recentProducts || []).map((p: any) => (
                <div key={p.id} className="p-3.5 rounded-2xl bg-[#FBF9F4] border border-[#E6E1D6] flex items-center justify-between text-xs gap-2">
                  <div className="min-w-0">
                    <div className="font-semibold text-[#1D232E] truncate">{p.name}</div>
                    <div className="text-[11px] text-slate-500">{p.viewCount ?? 0} vues</div>
                  </div>
                  <Badge variant={p.metaTitle ? 'success' : 'warning'} size="sm">
                    {p.metaTitle ? 'SEO OK' : 'Meta manquante'}
                  </Badge>
                </div>
              ))}
            </div>
          </>
        )}

        {sectionId === 'system' && (
          <>
            <h2 className="text-sm font-heading font-extrabold text-[#1D232E] uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#C59B27]" />
              <span>Journal d&apos;Audit Système Récent</span>
            </h2>
            <div className="divide-y divide-slate-100">
              {(lists.recentAudits || []).map((a: any) => (
                <div key={a.id} className="py-2.5 flex items-center justify-between text-xs gap-2">
                  <span className="font-semibold text-[#1D232E] truncate">
                    {a.action} • {a.resourceType}
                  </span>
                  <span className="text-[11px] text-slate-500 shrink-0">{a.actorName || 'Système'}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {['sales', 'reports', 'client'].includes(sectionId) && (
          <>
            <h2 className="text-sm font-heading font-extrabold text-[#1D232E] uppercase tracking-wider flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-[#C59B27]" />
              <span>Dernières Commandes &amp; Ventes</span>
            </h2>
            <div className="divide-y divide-slate-100">
              {(data?.recentOrders || []).map((ord: any) => (
                <Link
                  key={ord.id}
                  href={`/dashboard/orders/${ord.id}`}
                  className="py-2.5 flex items-center justify-between text-xs hover:bg-[#FBF9F4] px-2 -mx-2 rounded-xl"
                >
                  <span className="font-mono font-bold text-[#1D232E]">#{ord.reference}</span>
                  <Badge variant="neutral" size="sm">{ord.status}</Badge>
                  <span className="font-mono font-bold text-[#9A7414]">
                    {formatTndCurrency(ord.totalAmount)}
                  </span>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
