'use client';

import React, { Suspense, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { useCmsConfig } from '@/providers/CmsConfigProvider';
import { useI18nStore } from '@/stores/i18n.store';
import { SystemRole } from '@royal/shared-types';
import { cn } from '@/lib/utils';
import { HeaderInboxPopovers } from '@/components/dashboard/HeaderInboxPopovers';
import {
  DashboardVisibilityProvider,
  resolveRouteVisibility,
} from '@/providers/DashboardVisibilityProvider';
import {
  LayoutDashboard,
  Store,
  Users,
  Bell,
  Mail,
  Send,
  MessageSquare,
  MessageSquareQuote,
  ShieldCheck,
  Tag,
  Layers,
  Sliders,
  Boxes,
  Package,
  Wallet,
  CreditCard,
  Banknote,
  FileSpreadsheet,
  Building2,
  ShoppingBag,
  Receipt,
  Warehouse,
  FileInput,
  FileOutput,
  FileCheck,
  ArrowLeftRight,
  Truck,
  ShoppingCart,
  Undo2,
  FileText,
  BarChart3,
  TrendingUp,
  User,
  Heart,
  ThumbsUp,
  Award,
  Ticket,
  Palette,
  Lock,
  Server,
  FileCode,
  Hash,
  Printer,
  Percent,
  AlertTriangle,
  Activity,
  LogOut,
  ChevronDown,
  ChevronRight,
  UserCheck,
  PanelLeftClose,
  PanelLeftOpen,
  Briefcase,
  Search,
  Settings,
  Compass,
  Sparkles,
  Eye,
  Globe,
  HardDrive,
} from 'lucide-react';

interface NavNode {
  id: string;
  label: string;
  href?: string;
  icon?: React.ReactNode;
  badge?: string;
  rootOnly?: boolean;
  children?: NavNode[];
}

interface NavSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  visible: boolean;
  rootOnly?: boolean;
  directHref?: string;
  items: NavNode[];
}

function SearchParamsWatcher({ onSync }: { onSync: (qs: string) => void }) {
  const sp = useSearchParams();
  const str = sp?.toString() || '';
  useEffect(() => {
    onSync(str);
  }, [str, onSync]);
  return null;
}

function DashboardLayoutInner({
  children,
  queryString,
}: {
  children: React.ReactNode;
  queryString: string;
}) {
  const { config } = useCmsConfig();
  const { locale, setLocale, t } = useI18nStore();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = new URLSearchParams(queryString);
  const { user, isAuthenticated, isLoading, isInitialized, fetchMe, login, logout, hasRole } =
    useAuthStore();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [visibilityMap, setVisibilityMap] = useState<Record<string, 'PUBLIC' | 'PRIVATE'>>({
    '/account/loyalty': 'PRIVATE',
    '/account/coupons': 'PRIVATE',
    '/dashboard/section/users': 'PRIVATE',
    '/dashboard/users': 'PRIVATE',
    '/dashboard/root/superadmins': 'PRIVATE',
    '/dashboard/users/admins': 'PRIVATE',
    '/dashboard/users/delivery-managers': 'PRIVATE',
    '/dashboard/users/delivery-agents': 'PRIVATE',
    '/dashboard/users/clients': 'PRIVATE',
    '/dashboard/treasury': 'PRIVATE',
    '/dashboard/treasury/transactions': 'PRIVATE',
    '/dashboard/treasury/payments': 'PRIVATE',
    '/dashboard/accounting': 'PRIVATE',
    '/dashboard/purchases/prospects': 'PRIVATE',
    '/dashboard/suppliers': 'PRIVATE',
    '/dashboard/purchases/orders': 'PRIVATE',
    '/dashboard/purchases/receipts': 'PRIVATE',
    '/dashboard/warehouses': 'PRIVATE',
    '/dashboard/stock-in': 'PRIVATE',
    '/dashboard/stock-out': 'PRIVATE',
    '/dashboard/inventory': 'PRIVATE',
    '/dashboard/inventory-documents': 'PRIVATE',
    '/dashboard/transfers': 'PRIVATE',
    '/dashboard/deliveries': 'PRIVATE',
    '/dashboard/returns': 'PRIVATE',
    '/dashboard/invoices': 'PRIVATE',
    '/dashboard/pos/showrooms': 'PRIVATE',
    '/dashboard/pos': 'PRIVATE',
    '/dashboard/community/testimonials': 'PRIVATE',
    '/dashboard/reports/interactions': 'PRIVATE',
    '/dashboard/community/newsletters': 'PRIVATE',
    '/dashboard/seo/testimonials': 'PRIVATE',
    '/dashboard/seo/pixels': 'PRIVATE',
    '/dashboard/analytics': 'PRIVATE',
    '/dashboard/reports/sales': 'PRIVATE',
    '/dashboard/reports/treasury': 'PRIVATE',
    '/dashboard/root/storefront/info': 'PRIVATE',
    '/dashboard/root/storefront/layouts': 'PRIVATE',
    '/dashboard/root/storefront/views': 'PRIVATE',
    '/dashboard/root/email-templates': 'PRIVATE',
    '/dashboard/root/smtp': 'PRIVATE',
    '/dashboard/root/tva': 'PRIVATE',
    '/dashboard/root/reference-prefixes': 'PRIVATE',
    '/dashboard/root/print-templates': 'PRIVATE',
    '/dashboard/payment-methods': 'PRIVATE',
    '/dashboard/settings': 'PRIVATE',
    '/dashboard/translations': 'PRIVATE',
    '/dashboard/root/roles-permissions': 'PRIVATE',
    '/dashboard/logs': 'PRIVATE',
    '/dashboard/root/failures': 'PRIVATE',
    '/dashboard/root/storage': 'PRIVATE',
    '/dashboard/root/ai': 'PRIVATE',
    '/dashboard/root/visibility': 'PRIVATE',
  });
  const [activeFlyout, setActiveFlyout] = useState<{
    section: NavSection;
    top?: number;
    bottom?: number;
  } | null>(null);
  const flyoutCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setIsMounted(true);
    let mediaQuery: MediaQueryList | null = null;
    const handleScreenChange = (matchesSmall: boolean) => {
      setIsSmallScreen(matchesSmall);
      if (matchesSmall) {
        setIsCollapsed(true);
        setActiveFlyout(null);
      } else if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('royal_sidebar_collapsed');
        setIsCollapsed(saved === 'true');
      }
    };

    if (typeof window !== 'undefined') {
      mediaQuery = window.matchMedia('(max-width: 1023px)');
      handleScreenChange(mediaQuery.matches);
    }

    const onMediaChange = (ev: MediaQueryListEvent) => handleScreenChange(ev.matches);
    if (mediaQuery) {
      if (mediaQuery.addEventListener) mediaQuery.addEventListener('change', onMediaChange);
      else if ((mediaQuery as any).addListener) (mediaQuery as any).addListener(onMediaChange);
    }

    const loadVisibility = async () => {
      try {
        const res = await fetch('/api/v1/storefront-cms/visibility-config');
        if (res.ok) {
          const json = await res.json();
          const raw = json?.data?.value ?? json?.value ?? json?.data ?? json;
          const map: Record<string, 'PUBLIC' | 'PRIVATE'> = {};
          if (Array.isArray(raw)) {
            raw.forEach((item: any) => {
              if (item?.key) {
                map[item.key] = item.visibility === 'PRIVATE' ? 'PRIVATE' : 'PUBLIC';
              }
            });
            setVisibilityMap(map);
          } else if (raw && typeof raw === 'object') {
            Object.entries(raw).forEach(([k, v]) => {
              map[k] = v === 'PRIVATE' ? 'PRIVATE' : 'PUBLIC';
            });
            setVisibilityMap(map);
          }
        }
      } catch {
        // Ignore network transient
      }
    };
    loadVisibility();

    const handleVisUpdate = (e: any) => {
      if (e?.detail && typeof e.detail === 'object') {
        setVisibilityMap(e.detail);
      } else {
        loadVisibility();
      }
    };
    window.addEventListener('royal:visibility-updated', handleVisUpdate);
    return () => {
      window.removeEventListener('royal:visibility-updated', handleVisUpdate);
      if (mediaQuery) {
        if (mediaQuery.removeEventListener) mediaQuery.removeEventListener('change', onMediaChange);
        else if ((mediaQuery as any).removeListener) (mediaQuery as any).removeListener(onMediaChange);
      }
    };
  }, []);

  const toggleSidebarCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined' && !isSmallScreen) {
        localStorage.setItem('royal_sidebar_collapsed', String(next));
      }
      setActiveFlyout(null);
      return next;
    });
  };

  // Collapsible Niveau 1 & nested Niveau 2/3 state
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    overview: true,
    community: false,
    users: false,
    catalogue: false,
    treasury: false,
    purchases: false,
    stock: false,
    sales: false,
    pos: false,
    seo: false,
    reports: false,
    client: false,
    system: false,
    'sys-crm': false,
    'sys-settings': false,
  });
  const roleDefaultGroupUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!user?.id || roleDefaultGroupUserIdRef.current === user.id) return;
    roleDefaultGroupUserIdRef.current = user.id;
    const roles = (user.roles as string[]) || [];
    const rootFlag = roles.includes('ROOT') || roles.includes(SystemRole.ROOT);
    const catalogAdminFlag =
      roles.includes('SUPER_ADMIN') ||
      roles.includes(SystemRole.SUPER_ADMIN) ||
      roles.includes('ADMIN') ||
      roles.includes('WEBSITE_MANAGER') ||
      roles.includes(SystemRole.ADMIN);
    const clientFlag =
      roles.includes('CLIENT') || roles.includes(SystemRole.CLIENT);

    setOpenGroups((prev) => ({
      ...prev,
      ...(rootFlag ? { system: true } : {}),
      ...(!rootFlag && catalogAdminFlag ? { catalogue: true } : {}),
      ...(!rootFlag && !catalogAdminFlag && clientFlag ? { client: true } : {}),
    }));
  }, [user]);

  const toggleGroup = (id: string) => {
    setOpenGroups((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  useEffect(() => {
    if (!pathname) return;
    setActiveFlyout(null);
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setIsCollapsed(true);
    }
    setOpenGroups((prev) => {
      const next = { ...prev };
      if (pathname.startsWith('/dashboard/section/')) {
        const secId = pathname.replace('/dashboard/section/', '').split('/')[0];
        if (secId) next[secId] = true;
      } else if (pathname.startsWith('/dashboard/seo') || pathname.startsWith('/dashboard/community/testimonials') || pathname.startsWith('/dashboard/community/newsletters') || pathname.startsWith('/dashboard/reports/interactions')) {
        next.seo = true;
      } else if (pathname.startsWith('/dashboard/community') || pathname.startsWith('/account/notifications') || pathname.startsWith('/account/messages')) {
        next.community = true;
      } else if (pathname.startsWith('/dashboard/users') || pathname.startsWith('/dashboard/root/superadmins')) {
        next.users = true;
      } else if (
        ['/dashboard/brands', '/dashboard/categories', '/dashboard/characteristics', '/dashboard/variants', '/dashboard/articles', '/dashboard/coupons'].some((p) =>
          pathname.startsWith(p)
        )
      ) {
        next.catalogue = true;
      } else if (pathname.startsWith('/dashboard/treasury') || pathname.startsWith('/dashboard/accounting')) {
        next.treasury = true;
      } else if (pathname.startsWith('/dashboard/suppliers') || pathname.startsWith('/dashboard/purchases')) {
        next.purchases = true;
      } else if (
        ['/dashboard/warehouses', '/dashboard/stock-in', '/dashboard/stock-out', '/dashboard/inventory-documents', '/dashboard/transfers'].some((p) =>
          pathname.startsWith(p)
        )
      ) {
        next.stock = true;
      } else if (
        ['/dashboard/customers', '/dashboard/orders', '/dashboard/deliveries', '/dashboard/returns', '/dashboard/invoices'].some((p) =>
          pathname.startsWith(p)
        )
      ) {
        next.sales = true;
      } else if (pathname.startsWith('/dashboard/pos')) {
        next.pos = true;
      } else if (pathname.startsWith('/dashboard/reports') || pathname.startsWith('/dashboard/analytics') || pathname.startsWith('/dashboard/inventory')) {
        next.reports = true;
      } else if (pathname.startsWith('/account')) {
        next.client = true;
      } else if (
        pathname.startsWith('/dashboard/root') ||
        pathname.startsWith('/dashboard/payment-methods') ||
        pathname.startsWith('/dashboard/logs')
      ) {
        next.system = true;
        if (pathname.includes('/storefront/') || pathname.includes('/email-templates')) {
          next['sys-crm'] = true;
        }
        if (
          ['/smtp', '/tva', '/reference-prefixes', '/print-templates', '/payment-methods', '/storage', '/payment-gateways', '/printers', '/visibility'].some((p) =>
            pathname.includes(p)
          )
        ) {
          next['sys-settings'] = true;
        }
      }
      return next;
    });
  }, [pathname]);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  useEffect(() => {
    if (isInitialized && !isAuthenticated && !isLoading) {
      router.push(`/login?redirect=${encodeURIComponent(pathname || '/dashboard')}`);
    }
  }, [isInitialized, isAuthenticated, isLoading, router, pathname]);

  if (!isInitialized || (isLoading && !user)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FDFCF9] text-[#1D232E]">
        <div className="w-12 h-12 rounded-2xl overflow-hidden border border-[#C59B27]/50 bg-[#FDF9F0] shadow-lg mb-4 animate-pulse">
          <img src="/images/royal-logo.jpg" alt="Royal" className="w-full h-full object-cover" />
        </div>
        <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
          <div className="w-4 h-4 border-2 border-[#E6D6A6] border-t-[#C59B27] rounded-full animate-spin" />
          <span>Vérification de la session Royal...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FDFCF9] p-6 text-[#1D232E]">
        <div className="w-full max-w-md bg-white border border-[#E6E1D6] rounded-2xl p-8 shadow-xl text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl overflow-hidden border border-[#C59B27]/60 bg-[#FDF9F0] mx-auto shadow-sm">
            <img src="/images/royal-logo.jpg" alt="Royal" className="w-full h-full object-cover" />
          </div>
          <div>
            <h2 className="font-heading font-black text-lg text-[#1D232E]">
              Session Administration Requise
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Vous n&apos;êtes pas encore connecté à la console Royal.
            </p>
          </div>
          <button
            type="button"
            disabled={isLoggingIn}
            onClick={async () => {
              setIsLoggingIn(true);
              try {
                await login({ email: 'root@royal.com.tn', password: 'RootAdmin2026!' });
              } catch {
                router.push(`/login?redirect=${encodeURIComponent(pathname || '/dashboard')}`);
              } finally {
                setIsLoggingIn(false);
              }
            }}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#C59B27] to-[#A67C1E] hover:opacity-95 text-white text-xs font-bold uppercase tracking-wider transition shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isLoggingIn ? (
              <span>Connexion en cours...</span>
            ) : (
              <span>Connexion Instantanée (Root Admin)</span>
            )}
          </button>
          <div className="text-[11px] text-slate-400">
            Ou accédez à la{' '}
            <Link
              href={`/login?redirect=${encodeURIComponent(pathname || '/dashboard')}`}
              className="text-[#9A7414] font-semibold underline"
            >
              page de connexion standard
            </Link>
            .
          </div>
        </div>
      </div>
    );
  }

  // Exact 9-Role Identifiers aligned with Dashboard Left sidebar.xlsx
  const userRoles = (user.roles as string[]) || [];
  const isRoot = userRoles.includes('ROOT') || hasRole(SystemRole.ROOT);
  const isSuperAdmin = userRoles.includes('SUPER_ADMIN') || hasRole(SystemRole.SUPER_ADMIN);
  const isWebsiteManager =
    userRoles.includes('WEBSITE_MANAGER') ||
    userRoles.includes('ADMIN') ||
    hasRole(SystemRole.ADMIN);
  const isMagasinier =
    userRoles.includes('STOCK_MANAGER') ||
    userRoles.includes('MAGASINIER') ||
    hasRole(SystemRole.STOCK_MANAGER);
  const isCaissier =
    userRoles.includes('CASHIER') ||
    userRoles.includes('CAISSIER') ||
    hasRole(SystemRole.CASHIER);
  const isVendeur =
    userRoles.includes('SALESPERSON') ||
    userRoles.includes('VENDEUR') ||
    userRoles.includes('DELIVERY_MANAGER');
  const isFinancier =
    userRoles.includes('ACCOUNTANT') ||
    userRoles.includes('FINANCIER') ||
    hasRole(SystemRole.ACCOUNTANT);
  const isCommercial = userRoles.includes('COMMERCIAL');
  const isStaff =
    isRoot ||
    isSuperAdmin ||
    isWebsiteManager ||
    isMagasinier ||
    isCaissier ||
    isVendeur ||
    isFinancier ||
    isCommercial;
  const isClient = !isStaff;

  const primaryRole = userRoles[0] || 'CLIENT';

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'ROOT':
        return 'bg-[#1D232E] text-[#E6C86E] border-[#C59B27]/50';
      case 'SUPER_ADMIN':
      case 'WEBSITE_MANAGER':
      case 'ADMIN':
        return 'bg-[#FBF6E8] text-[#9A7414] border-[#E6D6A6]';
      default:
        return 'bg-[#F4F5F7] text-[#1D232E] border-[#CBD5E1]';
    }
  };

  const isHrefActive = (href?: string) => {
    if (!href) return false;
    const [baseHref, queryPart] = href.split('?');
    if (queryPart) {
      if (pathname !== baseHref) return false;
      const targetParams = new URLSearchParams(queryPart);
      for (const [k, v] of targetParams.entries()) {
        if (searchParams.get(k) !== v) return false;
      }
      return true;
    }
    // For parameterized routes with no default query on the primary item:
    if (baseHref === '/dashboard/root/storefront/layouts' && pathname === baseHref) {
      return !searchParams.get('section') || searchParams.get('section') === 'design';
    }
    if (pathname === baseHref) return true;
    // Allow dynamic detail pages like /dashboard/orders/[id] without lighting up sibling sub-routes like /dashboard/treasury/transactions
    if (baseHref === '/dashboard/orders' && pathname.startsWith('/dashboard/orders/')) return true;
    return false;
  };

  const nodeContainsActive = (node: NavNode): boolean => {
    if (node.href && isHrefActive(node.href)) return true;
    return (node.children || []).some(nodeContainsActive);
  };

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  // ============================================================================
  // EXCEL SPECIFICATION HIERARCHY (Dashboard Left sidebar.xlsx — R2..R93)
  // ============================================================================
  const sections: NavSection[] = [
    // R2: Tableau de bord (all 9 roles)
    {
      id: 'overview',
      title: 'Tableau de bord',
      icon: <LayoutDashboard className="h-4 w-4" />,
      visible: true,
      directHref: '/dashboard',
      items: [
        {
          id: 'overview-home',
          label: isClient ? 'Mon Tableau de bord' : 'Tableau de bord',
          href: '/dashboard',
          icon: <LayoutDashboard className="h-4 w-4" />,
        },
      ],
    },

    // R3-R6: Communauté
    {
      id: 'community',
      title: 'Communauté',
      icon: <MessageSquareQuote className="h-4 w-4" />,
      visible: true,
      items: [
        {
          id: 'comm-notif',
          label: 'Notifications',
          href: isStaff ? '/dashboard/community/notifications' : '/account/notifications',
          icon: <Bell className="h-4 w-4" />,
        },
        {
          id: 'comm-support',
          label: 'Support',
          href: isStaff ? '/dashboard/community/messages' : '/account/messages',
          icon: <MessageSquare className="h-4 w-4" />,
        },
        ...(isRoot || isSuperAdmin || isWebsiteManager
          ? [
              {
                id: 'comm-contact',
                label: 'Contact',
                href: '/dashboard/community/contacts',
                icon: <Mail className="h-4 w-4" />,
              },
            ]
          : []),
      ],
    },

    // R7-R14: Gestion des utilisateurs (ROOT, Super admin, Website Manager — visibilité pilotée par ROOT)
    {
      id: 'users',
      title: 'Gestion des utilisateurs',
      icon: <Users className="h-4 w-4" />,
      visible: isRoot || isSuperAdmin || isWebsiteManager,
      items: [
        {
          id: 'users-all',
          label: 'Tous les utilisateurs',
          href: '/dashboard/users',
          icon: <Users className="h-4 w-4" />,
        },
        {
          id: 'users-super',
          label: 'Super admin',
          href: '/dashboard/root/superadmins',
          icon: <ShieldCheck className="h-4 w-4" />,
        },
        {
          id: 'users-admins',
          label: 'Administrateurs',
          href: '/dashboard/users/admins',
          icon: <ShieldCheck className="h-4 w-4" />,
        },
        {
          id: 'users-wm',
          label: 'Website Manager',
          href: '/dashboard/users/website-managers',
          icon: <UserCheck className="h-4 w-4" />,
        },
        {
          id: 'users-stock',
          label: 'Magasiniers',
          href: '/dashboard/users/magasiniers',
          icon: <Warehouse className="h-4 w-4" />,
        },
        {
          id: 'users-cashier',
          label: 'Caissiers',
          href: '/dashboard/users/caissiers',
          icon: <Wallet className="h-4 w-4" />,
        },
        {
          id: 'users-vendeur',
          label: 'Vendeurs',
          href: '/dashboard/users/vendeurs',
          icon: <Tag className="h-4 w-4" />,
        },
        {
          id: 'users-fin',
          label: 'Financiers',
          href: '/dashboard/users/financiers',
          icon: <FileSpreadsheet className="h-4 w-4" />,
        },
        {
          id: 'users-comm',
          label: 'Commercials',
          href: '/dashboard/users/commercials',
          icon: <Briefcase className="h-4 w-4" />,
        },
        {
          id: 'users-deliv-mgr',
          label: 'Responsables Livraison',
          href: '/dashboard/users/delivery-managers',
          icon: <Truck className="h-4 w-4" />,
        },
        {
          id: 'users-deliv-agent',
          label: 'Livreurs',
          href: '/dashboard/users/delivery-agents',
          icon: <Truck className="h-4 w-4" />,
        },
        {
          id: 'users-clients',
          label: 'Clients (Comptes)',
          href: '/dashboard/users/clients',
          icon: <User className="h-4 w-4" />,
        },
      ],
    },

    // R15-R21: Catalogue (ROOT, Super admin, Website Manager, Commercial)
    {
      id: 'catalogue',
      title: 'Catalogue',
      icon: <Package className="h-4 w-4" />,
      visible: isRoot || isSuperAdmin || isWebsiteManager || isCommercial,
      items: [
        { id: 'cat-brands', label: 'Marques', href: '/dashboard/brands', icon: <Tag className="h-4 w-4" /> },
        { id: 'cat-categories', label: 'Catégories', href: '/dashboard/categories', icon: <Layers className="h-4 w-4" /> },
        { id: 'cat-chars', label: 'Caractéristiques', href: '/dashboard/characteristics', icon: <Sliders className="h-4 w-4" /> },
        { id: 'cat-vars', label: 'Variantes', href: '/dashboard/variants', icon: <Boxes className="h-4 w-4" /> },
        { id: 'cat-articles', label: 'Articles', href: '/dashboard/articles', icon: <Package className="h-4 w-4" /> },
        { id: 'cat-promos', label: 'Codes promotionnels', href: '/dashboard/coupons', icon: <Ticket className="h-4 w-4" /> },
      ],
    },

    // R22-R26: Trésorerie (Visibilité pilotée par ROOT)
    {
      id: 'treasury',
      title: 'Trésorerie',
      icon: <Wallet className="h-4 w-4" />,
      visible: isRoot || isSuperAdmin || isFinancier || isCaissier,
      items: [
        { id: 'tr-caisses', label: 'Caisses', href: '/dashboard/treasury', icon: <Banknote className="h-4 w-4" /> },
        { id: 'tr-journal', label: 'Journal', href: '/dashboard/treasury/transactions', icon: <CreditCard className="h-4 w-4" /> },
        { id: 'tr-payments', label: 'Suivi des règlements', href: '/dashboard/treasury/payments', icon: <Receipt className="h-4 w-4" /> },
        { id: 'tr-books', label: 'Livres', href: '/dashboard/accounting', icon: <FileSpreadsheet className="h-4 w-4" /> },
      ],
    },

    // R27-R31: Achats et approvisionnement (Visibilité pilotée par ROOT)
    {
      id: 'purchases',
      title: 'Achats et approvisionnement',
      icon: <ShoppingBag className="h-4 w-4" />,
      visible: isRoot || isSuperAdmin || isMagasinier || isCommercial || isFinancier,
      items: [
        { id: 'pur-prospects', label: 'Portefeuille de prospects', href: '/dashboard/purchases/prospects', icon: <Compass className="h-4 w-4" /> },
        { id: 'pur-suppliers', label: 'Fiches fournisseurs', href: '/dashboard/suppliers', icon: <Building2 className="h-4 w-4" /> },
        { id: 'pur-orders', label: 'Commandes fournisseurs', href: '/dashboard/purchases/orders', icon: <ShoppingBag className="h-4 w-4" /> },
        { id: 'pur-receipts', label: 'Bon de réception', href: '/dashboard/purchases/receipts', icon: <Receipt className="h-4 w-4" /> },
      ],
    },

    // R32-R37: Stock et entrepôts (Visibilité pilotée par ROOT)
    {
      id: 'stock',
      title: 'Stock et entrepôts',
      icon: <Warehouse className="h-4 w-4" />,
      visible: isRoot || isSuperAdmin || isMagasinier,
      items: [
        { id: 'st-depots', label: 'Dépôts', href: '/dashboard/warehouses', icon: <Warehouse className="h-4 w-4" /> },
        { id: 'st-in', label: "Bon d'entrée", href: '/dashboard/stock-in', icon: <FileInput className="h-4 w-4" /> },
        { id: 'st-out', label: 'Bon de sortie', href: '/dashboard/stock-out', icon: <FileOutput className="h-4 w-4" /> },
        { id: 'st-adj', label: 'Ajustement', href: '/dashboard/inventory-documents', icon: <FileCheck className="h-4 w-4" /> },
        { id: 'st-moves', label: 'Mouvements de stock', href: '/dashboard/transfers', icon: <ArrowLeftRight className="h-4 w-4" /> },
      ],
    },

    // R38-R43: Ventes et distribution
    {
      id: 'sales',
      title: 'Ventes et distribution',
      icon: <ShoppingCart className="h-4 w-4" />,
      visible:
        isRoot ||
        isSuperAdmin ||
        isWebsiteManager ||
        isMagasinier ||
        isCaissier ||
        isFinancier ||
        isCommercial,
      items: [
        ...(isRoot || isSuperAdmin || isWebsiteManager || isCaissier || isCommercial
          ? [
              {
                id: 'sales-customers',
                label: 'Fiches clients',
                href: '/dashboard/customers',
                icon: <Users className="h-4 w-4" />,
              },
            ]
          : []),
        {
          id: 'sales-orders',
          label: 'Commandes clients',
          href: '/dashboard/orders',
          icon: <ShoppingCart className="h-4 w-4" />,
        },
        {
          id: 'sales-bl',
          label: 'Bon de livraison',
          href: '/dashboard/deliveries',
          icon: <Truck className="h-4 w-4" />,
        },
        {
          id: 'sales-br',
          label: 'Bon de retour',
          href: '/dashboard/returns',
          icon: <Undo2 className="h-4 w-4" />,
        },
        {
          id: 'sales-inv',
          label: 'Factures',
          href: '/dashboard/invoices',
          icon: <FileText className="h-4 w-4" />,
        },
      ],
    },

    // R44-R46: Point de vente (Visibilité pilotée par ROOT)
    {
      id: 'pos',
      title: 'Point de vente',
      icon: <Store className="h-4 w-4" />,
      visible: isRoot || isSuperAdmin || isCaissier || isVendeur,
      items: [
        { id: 'pos-showrooms', label: "Salles d'exposition", href: '/dashboard/pos/showrooms', icon: <Building2 className="h-4 w-4" /> },
        { id: 'pos-terminal', label: 'Terminal', href: '/dashboard/pos', icon: <Store className="h-4 w-4" /> },
      ],
    },

    // R47-R51: Seo (Visibilité pilotée par ROOT)
    {
      id: 'seo',
      title: 'Seo',
      icon: <Search className="h-4 w-4" />,
      visible: isRoot || isSuperAdmin || isWebsiteManager,
      items: [
        { id: 'seo-reviews', label: 'Commentaires et avis', href: '/dashboard/community/testimonials', icon: <MessageSquareQuote className="h-4 w-4" /> },
        { id: 'seo-interactions', label: 'Interactions', href: '/dashboard/reports/interactions', icon: <ThumbsUp className="h-4 w-4" /> },
        { id: 'seo-newsletter', label: 'Abonnements', href: '/dashboard/community/newsletters', icon: <Send className="h-4 w-4" /> },
        { id: 'seo-testimonials', label: 'Témoignages', href: '/dashboard/seo/testimonials', icon: <Sparkles className="h-4 w-4" /> },
        { id: 'seo-pixels', label: 'Pixels & Référencement SEO', href: '/dashboard/seo/pixels', icon: <Globe className="h-4 w-4" /> },
      ],
    },

    // R52-R55: Rapports et statistiques (Visibilité pilotée par ROOT)
    {
      id: 'reports',
      title: 'Rapports et statistiques',
      icon: <BarChart3 className="h-4 w-4" />,
      visible: isRoot || isSuperAdmin || isWebsiteManager || isFinancier,
      items: [
        { id: 'rep-buying', label: "Conseils d'achat", href: '/dashboard/analytics', icon: <BarChart3 className="h-4 w-4" /> },
        { id: 'rep-sales', label: 'Ventes et marges', href: '/dashboard/reports/sales', icon: <TrendingUp className="h-4 w-4" /> },
        { id: 'rep-cash', label: 'Suivi des caisses', href: '/dashboard/reports/treasury', icon: <Banknote className="h-4 w-4" /> },
      ],
    },

    // R56-R62: Espace client (Visibilité pilotée par ROOT)
    {
      id: 'client',
      title: 'Espace client',
      icon: <UserCheck className="h-4 w-4" />,
      visible: true,
      items: [
        { id: 'cl-home', label: 'Accueil', href: '/account/home', icon: <LayoutDashboard className="h-4 w-4" /> },
        { id: 'cl-orders', label: 'Suivi des commandes', href: '/account/orders', icon: <ShoppingBag className="h-4 w-4" /> },
        { id: 'cl-wish', label: 'Liste de souhaits', href: '/account/favorites', icon: <Heart className="h-4 w-4" /> },
        { id: 'cl-profile', label: 'Mon profil', href: '/account/profile', icon: <User className="h-4 w-4" /> },
        { id: 'cl-loyalty', label: 'Mes points de fidélité', href: '/account/loyalty', icon: <Award className="h-4 w-4" /> },
        { id: 'cl-coupons', label: 'Mes codes privilèges', href: '/account/coupons', icon: <Ticket className="h-4 w-4" /> },
      ],
    },

    // R63-R92: Système (Visibilité pilotée par ROOT; Visibilité des vues exclusivement ROOT)
    {
      id: 'system',
      title: 'Système',
      icon: <Settings className="h-4 w-4" />,
      visible: isRoot || isSuperAdmin,
      items: [
        {
          id: 'sys-crm',
          label: 'CMS',
          icon: <Palette className="h-4 w-4" />,
          children: [
            {
              id: 'sys-crm-brand',
              label: 'Identité et marque',
              href: '/dashboard/root/storefront/info',
              icon: <Tag className="h-3.5 w-3.5" />,
            },
            {
              id: 'sys-crm-layout',
              label: 'Mise en page et design',
              href: '/dashboard/root/storefront/layouts',
              icon: <Palette className="h-3.5 w-3.5" />,
            },
            {
              id: 'sys-crm-views',
              label: 'Vues et modèles',
              href: '/dashboard/root/storefront/views',
              icon: <Sliders className="h-3.5 w-3.5" />,
            },
            {
              id: 'sys-crm-emails',
              label: 'Modèles de courriels',
              href: '/dashboard/root/email-templates',
              icon: <FileCode className="h-3.5 w-3.5" />,
            },
          ],
        },
        {
          id: 'sys-settings',
          label: 'Paramètres',
          icon: <Sliders className="h-4 w-4" />,
          children: [
            { id: 'sys-smtp', label: 'Paramètres SMTP', href: '/dashboard/root/smtp', icon: <Server className="h-3.5 w-3.5" /> },
            { id: 'sys-tva', label: 'Taxe et timbre fiscal', href: '/dashboard/root/tva', icon: <Percent className="h-3.5 w-3.5" /> },
            { id: 'sys-pref', label: 'Préfixes et numérotations', href: '/dashboard/root/reference-prefixes', icon: <Hash className="h-3.5 w-3.5" /> },
            { id: 'sys-print', label: 'Documents & Imprimantes POS', href: '/dashboard/root/print-templates', icon: <Printer className="h-3.5 w-3.5" /> },
            { id: 'sys-pay', label: 'Modalités & Passerelles Paiement', href: '/dashboard/payment-methods', icon: <CreditCard className="h-3.5 w-3.5" /> },
            ...(isRoot
              ? [
                  { id: 'sys-storage', label: 'Stockage Médias & CDN', href: '/dashboard/root/storage', icon: <HardDrive className="h-3.5 w-3.5" />, rootOnly: true },
                  { id: 'sys-vis', label: 'Visibilité des vues', href: '/dashboard/root/visibility', icon: <Eye className="h-3.5 w-3.5" />, rootOnly: true },
                ]
              : []),
          ],
        },
        ...(isRoot
          ? [
              {
                id: 'sys-ai',
                label: 'Intelligence Artificielle (IA)',
                href: '/dashboard/root/ai',
                icon: <Sparkles className="h-4 w-4" />,
                rootOnly: true,
              },
            ]
          : []),
        { id: 'sys-rbac', label: 'Rôles et permissions', href: '/dashboard/root/roles-permissions', icon: <Lock className="h-4 w-4" /> },
        { id: 'sys-audit', label: "Journal d'audit", href: '/dashboard/logs', icon: <Activity className="h-4 w-4" /> },
        { id: 'sys-err', label: 'Audit système', href: '/dashboard/root/failures', icon: <AlertTriangle className="h-4 w-4" /> },
      ],
    },
  ];

  const isHrefVisible = (href?: string | null): boolean =>
    resolveRouteVisibility(href, visibilityMap, isRoot);

  const filterVisibleNodes = (nodes: NavNode[]): NavNode[] =>
    nodes
      .filter((n) => (n.href ? isHrefVisible(n.href) : true))
      .map((n) => (n.children ? { ...n, children: filterVisibleNodes(n.children) } : n))
      .filter((n) => !n.children || n.children.length > 0);

  const visibleSections = sections
    .filter((s) => s.visible && (!s.directHref || isHrefVisible(s.directHref)))
    .map((s) => ({ ...s, items: filterVisibleNodes(s.items) }))
    .filter((s) => s.items.length > 0 || s.directHref);

  const isCurrentPathBlocked = (() => {
    if (isRoot || !pathname) return false;
    const cleanPath = pathname.split('?')[0];
    if (cleanPath.startsWith('/dashboard/root/visibility')) {
      return true;
    }
    if (cleanPath in visibilityMap) {
      return visibilityMap[cleanPath] === 'PRIVATE';
    }
    if (cleanPath.startsWith('/dashboard/section')) {
      return true;
    }
    const matchedParent = Object.keys(visibilityMap)
      .filter((k) => cleanPath.startsWith(`${k}/`))
      .sort((a, b) => b.length - a.length)[0];
    return matchedParent ? visibilityMap[matchedParent] === 'PRIVATE' : false;
  })();

  const openFlyoutForSection = (section: NavSection, el: HTMLElement) => {
    if (flyoutCloseTimer.current) {
      clearTimeout(flyoutCloseTimer.current);
      flyoutCloseTimer.current = null;
    }
    const rect = el.getBoundingClientRect();
    if (rect.top > window.innerHeight * 0.52) {
      setActiveFlyout({ section, bottom: 16 });
    } else {
      setActiveFlyout({ section, top: Math.max(16, rect.top) });
    }
  };

  const scheduleFlyoutClose = () => {
    if (flyoutCloseTimer.current) clearTimeout(flyoutCloseTimer.current);
    flyoutCloseTimer.current = setTimeout(() => {
      setActiveFlyout(null);
    }, 180);
  };

  const isNodeRootOnly = (node: NavNode, sectionRootOnly?: boolean): boolean => {
    if (sectionRootOnly || node.rootOnly) return true;
    if (node.href) {
      const baseHref = node.href.split('?')[0];
      if (visibilityMap[baseHref] === 'PRIVATE') return true;
    }
    if (node.children && node.children.length > 0) {
      return node.children.every((ch) => isNodeRootOnly(ch, sectionRootOnly));
    }
    return false;
  };

  const isSectionDev = (section: NavSection): boolean => {
    if (section.rootOnly) return true;
    if (section.directHref) {
      return visibilityMap[section.directHref.split('?')[0]] === 'PRIVATE';
    }
    return section.items.length > 0 && section.items.every((n) => isNodeRootOnly(n, false));
  };

  const renderDevTag = (active = false) => (
    <span
      title="Mode Privé (invisible au public)"
      className="relative inline-flex h-2 w-2 shrink-0 ml-1"
    >
      <span
        className={cn(
          'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
          active ? 'bg-white' : 'bg-amber-400'
        )}
      />
      <span
        className={cn(
          'relative inline-flex rounded-full h-2 w-2',
          active ? 'bg-white' : 'bg-[#C59B27]'
        )}
      />
    </span>
  );

  const renderTreeNodes = (nodes: NavNode[], depth = 0, sectionRootOnly = false): React.ReactNode => {
    return nodes.map((node) => {
      const hasChildren = (node.children || []).length > 0;
      const active = isHrefActive(node.href);
      const childActive = nodeContainsActive(node);
      const isDev = isNodeRootOnly(node, sectionRootOnly);

      if (hasChildren) {
        const isGroupOpen = openGroups[node.id] || childActive;
        return (
          <div key={node.id} className="space-y-0.5">
            <button
              type="button"
              onClick={() => toggleGroup(node.id)}
              className={cn(
                'w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer select-none',
                childActive
                  ? 'bg-[var(--royal-gold-light)] text-[var(--royal-primary)]'
                  : 'text-[#1D232E] hover:bg-[var(--royal-gold-light)]/50'
              )}
            >
              <div className="flex items-center gap-2 min-w-0">
                {node.icon && <span className="shrink-0 text-[var(--royal-primary)]">{node.icon}</span>}
                <span className="relative inline-flex items-start pr-2.5 min-w-0">
                  <span className="truncate">{node.label}</span>
                  {isDev && <span className="absolute top-0 right-0">{renderDevTag(false)}</span>}
                </span>
              </div>
              {isGroupOpen ? (
                <ChevronDown className="w-3.5 h-3.5 shrink-0 text-[var(--royal-primary)]" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 shrink-0 text-[var(--royal-primary)]" />
              )}
            </button>
            {isGroupOpen && (
              <div className="ml-2.5 pl-2.5 border-l border-[var(--royal-border)] space-y-0.5 pt-0.5">
                {renderTreeNodes(node.children!, depth + 1, sectionRootOnly || isDev)}
              </div>
            )}
          </div>
        );
      }

      return (
        <Link
          key={node.id}
          href={node.href || '/dashboard'}
          onClick={() => setActiveFlyout(null)}
          style={
            active
              ? {
                  background: 'linear-gradient(90deg, var(--royal-primary), var(--royal-primary-hover))',
                  color: 'var(--royal-primary-text)',
                }
              : undefined
          }
          className={cn(
            'flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 group',
            active
              ? 'shadow-sm font-semibold'
              : 'text-[#1D232E] hover:bg-[var(--royal-gold-light)]/60'
          )}
        >
          <div className="flex items-center gap-2 min-w-0">
            {node.icon && (
              <span
                className={cn(
                  'shrink-0 transition-colors',
                  active ? 'text-white' : 'text-[var(--royal-primary)]'
                )}
              >
                {node.icon}
              </span>
            )}
            <span className="relative inline-flex items-start pr-2.5 min-w-0">
              <span className="truncate">{node.label}</span>
              {isDev && <span className="absolute top-0 right-0">{renderDevTag(active)}</span>}
            </span>
          </div>
          {node.badge && (
            <span
              className={cn(
                'text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase border',
                active
                  ? 'bg-white/25 text-white border-white/30'
                  : 'bg-[var(--royal-gold-light)] text-[var(--royal-primary)] border-[var(--royal-primary)]/35'
              )}
            >
              {node.badge}
            </span>
          )}
        </Link>
      );
    });
  };

  const renderFlyoutNodes = (nodes: NavNode[], sectionRootOnly = false): React.ReactNode => {
    return nodes.map((node) => {
      const hasChildren = (node.children || []).length > 0;
      const active = isHrefActive(node.href);
      const isDev = isNodeRootOnly(node, sectionRootOnly);
      if (hasChildren) {
        return (
          <div key={node.id} className="pt-1.5 space-y-1">
            <div className="px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-[var(--royal-primary)] flex items-center gap-1.5">
              {node.icon && <span className="shrink-0 text-[var(--royal-primary)]">{node.icon}</span>}
              {isDev && renderDevTag(false)}
              <span>{node.label}</span>
            </div>
            <div className="pl-2 space-y-0.5 border-l border-[var(--royal-border)] ml-2">
              {renderFlyoutNodes(node.children!, sectionRootOnly || isDev)}
            </div>
          </div>
        );
      }
      return (
        <Link
          key={node.id}
          href={node.href || '/dashboard'}
          onClick={() => setActiveFlyout(null)}
          style={
            active
              ? {
                  background: 'linear-gradient(90deg, var(--royal-primary), var(--royal-primary-hover))',
                  color: 'var(--royal-primary-text)',
                }
              : undefined
          }
          className={cn(
            'flex items-center justify-between gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition',
            active
              ? 'shadow-xs'
              : 'text-[#1D232E] hover:bg-[var(--royal-gold-light)]/70'
          )}
        >
          <div className="flex items-center gap-2 min-w-0">
            {node.icon && (
              <span className={cn('shrink-0', active ? 'text-white' : 'text-[var(--royal-primary)]')}>
                {node.icon}
              </span>
            )}
            {isDev && renderDevTag(active)}
            <span className="truncate">{node.label}</span>
          </div>
          {node.badge && (
            <span
              className={cn(
                'text-[9px] font-bold px-1.5 py-0.5 rounded-full border',
                active
                  ? 'bg-white/25 text-white border-white/30'
                  : 'bg-[var(--royal-gold-light)] text-[var(--royal-primary)] border-[var(--royal-primary)]/35'
              )}
            >
              {node.badge}
            </span>
          )}
        </Link>
      );
    });
  };

  return (
    <DashboardVisibilityProvider value={{ visibilityMap, isRoot, isRouteVisible: isHrefVisible }}>
      <div className="min-h-screen flex bg-[#FDFCF9] text-[#1D232E] font-sans overflow-x-hidden">
      {/* Mobile / Tablet Drawer Backdrop */}
      {!isCollapsed && isSmallScreen && (
        <div
          onClick={() => setIsCollapsed(true)}
          className="fixed inset-0 bg-black/25 z-40 lg:hidden no-print print:hidden"
        />
      )}

      {/* Light Luxury Gold & Silver Sidebar */}
      <aside
        className={cn(
          'bg-white text-slate-700 flex flex-col flex-shrink-0 border-r border-[#E6E1D6] no-print print:hidden transition-all duration-300',
          isCollapsed
            ? 'w-[68px] sm:w-[88px] shadow-sm z-20'
            : 'fixed inset-y-0 left-0 z-50 w-72 shadow-2xl lg:static lg:z-20 lg:shadow-sm'
        )}
      >
        {/* Brand Header (Collapse toggle moved to top header navbar) */}
        <div
          className={cn(
            'h-16 flex items-center border-b border-[var(--royal-border)] bg-gradient-to-r from-[var(--royal-gold-light)]/50 to-white transition-all',
            isCollapsed ? 'justify-center px-2' : 'justify-start px-4'
          )}
        >
          <Link href="/dashboard" className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl overflow-hidden border border-[var(--royal-primary)]/60 bg-[var(--royal-gold-light)] shadow-xs shrink-0">
              <img src={config.logoUrl || '/images/royal-logo.jpg'} alt={config.appName || 'Royal'} className="w-full h-full object-cover" />
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <span className="font-extrabold text-[#1D232E] text-base tracking-tight block leading-none uppercase">
                  {config.appName || 'ROYAL'}
                </span>
                <span className="block text-[9px] uppercase tracking-wider text-[var(--royal-primary)] font-bold mt-0.5 truncate">
                  {isRoot ? 'Console Master ROOT' : isClient ? 'Espace Client' : 'Gestion Royal'}
                </span>
              </div>
            )}
          </Link>
        </div>

        {/* Navigation List */}
        <div
          className={cn(
            'flex-1 overflow-y-auto py-4',
            isCollapsed ? 'px-2 space-y-2' : 'px-3 space-y-2 text-xs'
          )}
        >
          {visibleSections
            .map((section) => {
              const isSectionActive =
                (section.directHref && isHrefActive(section.directHref)) ||
                section.items.some(nodeContainsActive);
              const isOpen = openGroups[section.id] || isSectionActive;
              const sectionIsDev = isSectionDev(section);

              // COLLAPSED MODE: 1 Icon per Section ONLY + Hover/Tap Floating Menu
              if (isCollapsed) {
                const isFlyoutOpen = activeFlyout?.section.id === section.id;
                const isCollapsedActive = isSectionActive || isFlyoutOpen;
                return (
                  <div key={section.id} className="relative flex justify-center">
                    <button
                      type="button"
                      onMouseEnter={(e) => openFlyoutForSection(section, e.currentTarget)}
                      onMouseLeave={scheduleFlyoutClose}
                      onClick={(e) => {
                        if (section.directHref) {
                          router.push(section.directHref);
                          setActiveFlyout(null);
                        } else if (isFlyoutOpen) {
                          setActiveFlyout(null);
                        } else {
                          openFlyoutForSection(section, e.currentTarget);
                        }
                      }}
                      title={sectionIsDev ? `${section.title} (Privé)` : section.title}
                      style={
                        isCollapsedActive
                          ? {
                              background: 'linear-gradient(135deg, var(--royal-primary), var(--royal-primary-hover))',
                              color: 'var(--royal-primary-text)',
                              borderColor: 'var(--royal-primary-hover)',
                            }
                          : undefined
                      }
                      className={cn(
                        'relative w-12 h-11 rounded-2xl flex items-center justify-center transition-all duration-150 cursor-pointer border',
                        isCollapsedActive
                          ? 'shadow-sm'
                          : 'bg-[var(--royal-gold-light)]/50 text-[var(--royal-primary)] border-[var(--royal-border)] hover:border-[var(--royal-primary)]/60 hover:bg-[var(--royal-gold-light)]'
                      )}
                    >
                      {section.icon}
                      {sectionIsDev && (
                        <span className="absolute top-1.5 right-1.5">
                          {renderDevTag(isCollapsedActive)}
                        </span>
                      )}
                    </button>
                  </div>
                );
              }

              // EXPANDED MODE
              return (
                <div key={section.id} className="space-y-1">
                  {section.directHref && section.items.length === 1 ? (
                    <Link
                      href={section.directHref}
                      style={
                        isHrefActive(section.directHref)
                          ? {
                              background: 'linear-gradient(90deg, var(--royal-primary), var(--royal-primary-hover))',
                              color: 'var(--royal-primary-text)',
                            }
                          : undefined
                      }
                      className={cn(
                        'w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold tracking-tight transition-all',
                        isHrefActive(section.directHref)
                          ? 'shadow-sm'
                          : 'text-[#1D232E] hover:bg-[var(--royal-gold-light)]/60'
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className={cn(
                            'shrink-0',
                            isHrefActive(section.directHref) ? 'text-white' : 'text-[var(--royal-primary)]'
                          )}
                        >
                          {section.icon}
                        </span>
                        <span className="relative inline-flex items-start pr-2.5 min-w-0">
                          <span className="truncate">{section.title}</span>
                          {sectionIsDev && <span className="absolute top-0 right-0">{renderDevTag(isHrefActive(section.directHref))}</span>}
                        </span>
                      </div>
                    </Link>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => toggleGroup(section.id)}
                        className={cn(
                          'w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold tracking-tight transition-all cursor-pointer select-none border',
                          isSectionActive || isOpen
                            ? 'bg-[var(--royal-gold-light)] text-[#1D232E] border-[var(--royal-primary)]/35'
                            : 'border-transparent text-[#1D232E] hover:bg-[var(--royal-gold-light)]/50'
                        )}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="shrink-0 text-[var(--royal-primary)]">
                            {section.icon}
                          </span>
                          <span className="relative inline-flex items-start pr-2.5 min-w-0">
                            <span className="truncate">{section.title}</span>
                            {sectionIsDev && <span className="absolute top-0 right-0">{renderDevTag(false)}</span>}
                          </span>
                        </div>
                        {isOpen ? (
                          <ChevronDown className="h-3.5 w-3.5 text-[var(--royal-primary)] shrink-0" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5 text-[var(--royal-primary)] shrink-0" />
                        )}
                      </button>

                      {isOpen && (
                        <nav className="space-y-0.5 ml-3 pl-2.5 border-l border-[var(--royal-border)] pt-0.5">
                          {isHrefVisible(`/dashboard/section/${section.id}`) && (
                            <Link
                              href={`/dashboard/section/${section.id}`}
                              className={cn(
                                'flex items-center gap-2 px-3 py-1.5 rounded-xl text-[11px] font-bold transition',
                                isHrefActive(`/dashboard/section/${section.id}`)
                                  ? 'bg-[var(--royal-primary)] text-white shadow-xs'
                                  : 'text-[var(--royal-primary)] hover:bg-[var(--royal-gold-light)]'
                              )}
                            >
                              <LayoutDashboard className="w-3.5 h-3.5 shrink-0" />
                              {visibilityMap[`/dashboard/section/${section.id}`] !== 'PUBLIC' &&
                                renderDevTag(isHrefActive(`/dashboard/section/${section.id}`))}
                              <span>{t('dashboard.overview')}</span>
                            </Link>
                          )}
                          {renderTreeNodes(section.items, 0, Boolean(section.rootOnly))}
                        </nav>
                      )}
                    </>
                  )}
                </div>
              );
            })}
        </div>

        {/* Footer User + Déconnexion (R93) */}
        <div
          className={cn(
            'border-t border-[var(--royal-border)] bg-[var(--royal-gold-light)]/35 transition-all',
            isCollapsed ? 'p-2.5 flex flex-col items-center gap-2' : 'p-3.5 flex items-center justify-between'
          )}
        >
          {isCollapsed ? (
            <>
              <div
                title={`${user.firstName} ${user.lastName} (${primaryRole})`}
                style={{ background: 'linear-gradient(135deg, var(--royal-primary), var(--royal-primary-hover))' }}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-xs shadow-sm overflow-hidden"
              >
                {user.avatar ? (
                  <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span>
                    {user.firstName?.[0] || 'U'}
                    {user.lastName?.[0] || ''}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={handleLogout}
                title="Déconnexion"
                className="text-slate-500 hover:text-red-600 p-2 rounded-xl hover:bg-red-50 transition-colors cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  style={{ background: 'linear-gradient(135deg, var(--royal-primary), var(--royal-primary-hover))' }}
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm overflow-hidden"
                >
                  {user.avatar ? (
                    <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span>
                      {user.firstName?.[0] || 'U'}
                      {user.lastName?.[0] || ''}
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-[#1D232E] truncate">
                    {user.firstName} {user.lastName}
                  </div>
                  <div
                    className={`text-[9px] font-bold px-1.5 py-0.2 rounded border inline-block mt-0.5 ${getRoleBadgeStyle(
                      primaryRole
                    )}`}
                  >
                    {primaryRole}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                title="Déconnexion"
                className="text-slate-500 hover:text-red-600 p-2 rounded-xl hover:bg-red-50 transition-colors shrink-0 cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </aside>

      {/* Main Content Shell */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-[var(--royal-border)] px-3 sm:px-6 flex items-center justify-between gap-2 sticky top-0 z-10 shadow-[0_1px_2px_rgba(0,0,0,0.03)] no-print print:hidden">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              type="button"
              onClick={toggleSidebarCollapse}
              title={isCollapsed ? t('dashboard.expand_menu') : t('dashboard.collapse_menu')}
              aria-label={isCollapsed ? t('dashboard.expand_menu') : t('dashboard.collapse_menu')}
              className="p-2 rounded-xl border border-[var(--royal-primary)]/35 bg-[var(--royal-gold-light)] text-[var(--royal-primary)] hover:bg-[var(--royal-primary)] hover:text-white transition cursor-pointer shrink-0 shadow-2xs"
            >
              {isCollapsed ? (
                <PanelLeftOpen className="w-4 h-4" />
              ) : (
                <PanelLeftClose className="w-4 h-4" />
              )}
            </button>
            <h1 className="text-xs sm:text-sm font-bold text-[#1D232E] tracking-tight truncate">
              {isRoot
                ? t('dashboard.root_console')
                : isClient
                ? t('dashboard.client_space')
                : t('dashboard.board_title')}
            </h1>
            <span
              className={`hidden sm:inline-block px-2.5 py-0.5 text-[10px] font-bold rounded-full border shrink-0 ${getRoleBadgeStyle(
                primaryRole
              )}`}
            >
              {primaryRole}
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3 text-xs shrink-0">
            <button
              type="button"
              onClick={() => setLocale(locale === 'fr' ? 'ar' : 'fr')}
              title="Français / العربية"
              aria-label="Changer de langue"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full border border-[#E6E1D6] bg-white hover:bg-[#FBF6E8] text-[#1D232E] text-[10px] font-bold uppercase transition cursor-pointer shrink-0"
            >
              <Globe className="w-3.5 h-3.5 text-[#C59B27]" />
              <span className="hidden xs:inline sm:inline">{locale === 'fr' ? 'العربية' : 'FR'}</span>
            </button>

            <HeaderInboxPopovers isClientOnly={isClient} />

            <Link
              href="/"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[var(--royal-primary)]/35 bg-[var(--royal-gold-light)] text-[var(--royal-primary)] hover:bg-[var(--royal-primary)] hover:text-white text-[11px] font-bold transition"
            >
              <Store className="w-3.5 h-3.5" />
              <span>{t('dashboard.public_shop')}</span>
            </Link>

            <div className="hidden md:flex items-center gap-1.5 text-slate-500">
              <ShieldCheck className="w-4 h-4 text-[var(--royal-primary)]" />
              <span>{t('dashboard.encrypted_session')}</span>
            </div>

            <div className="h-4 w-px bg-[#E6E1D6] hidden md:block" />

            <div className="text-slate-700 font-medium hidden lg:inline">{user.email}</div>

            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-[#F4F5F7] hover:bg-red-50 text-slate-700 hover:text-red-700 text-[11px] font-semibold transition border border-[#CBD5E1] hover:border-red-200 cursor-pointer shrink-0"
              title={t('dashboard.logout')}
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t('dashboard.logout')}</span>
            </button>
          </div>
        </header>

        <main className="flex-1 p-3 sm:p-5 md:p-8 overflow-y-auto overflow-x-hidden bg-[#F8F9FA]">
          {isCurrentPathBlocked ? (
            <div className="max-w-lg mx-auto mt-16 bg-white border border-[#E6D6A6] rounded-3xl p-8 text-center shadow-sm space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#FBF6E8] text-[#9A7414] border border-[#E6D6A6] mx-auto flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-heading font-black text-[#1D232E]">{t('dashboard.private_title')}</h2>
              <p className="text-xs text-slate-500">
                {t('dashboard.private_desc')}
              </p>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--royal-primary)] text-white text-xs font-bold shadow-xs"
              >
                {t('dashboard.back_dashboard')}
              </Link>
            </div>
          ) : (
            children
          )}
        </main>
      </div>

      {/* FLOATING FLYOUT MENU FOR COLLAPSED SIDEBAR SECTIONS (HOVER + TACTILE TAP) */}
      {isMounted &&
        isCollapsed &&
        activeFlyout &&
        createPortal(
          <div
            onMouseEnter={() => {
              if (flyoutCloseTimer.current) {
                clearTimeout(flyoutCloseTimer.current);
                flyoutCloseTimer.current = null;
              }
            }}
            onMouseLeave={scheduleFlyoutClose}
            style={{
              position: 'fixed',
              left: isSmallScreen ? '74px' : '94px',
              ...(activeFlyout.bottom !== undefined
                ? { bottom: `${activeFlyout.bottom}px` }
                : { top: `${activeFlyout.top ?? 16}px` }),
              maxHeight: 'calc(100vh - 32px)',
              zIndex: 99999,
            }}
            className="w-[calc(100vw-84px)] max-w-72 overflow-y-auto bg-white rounded-2xl border border-[var(--royal-border)] shadow-2xl p-3 space-y-2 animate-in fade-in slide-in-from-left-2 duration-150"
          >
            <div className="px-2.5 py-2 border-b border-[var(--royal-border)] flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-extrabold text-[#1D232E]">
                <span className="text-[var(--royal-primary)]">{activeFlyout.section.icon}</span>
                {isSectionDev(activeFlyout.section) && renderDevTag(false)}
                <span>{activeFlyout.section.title}</span>
              </div>
              <button
                type="button"
                onClick={() => setActiveFlyout(null)}
                className="text-[10px] font-bold text-slate-400 hover:text-[#1D232E] px-1.5 py-0.5 rounded"
              >
                ✕
              </button>
            </div>
            <div className="space-y-0.5">
              {isHrefVisible(`/dashboard/section/${activeFlyout.section.id}`) && (
                <Link
                  href={`/dashboard/section/${activeFlyout.section.id}`}
                  onClick={() => setActiveFlyout(null)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-[var(--royal-primary)] bg-[var(--royal-gold-light)] hover:bg-[var(--royal-primary)] hover:text-white transition mb-1"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  {visibilityMap[`/dashboard/section/${activeFlyout.section.id}`] !== 'PUBLIC' &&
                    renderDevTag(false)}
                  <span>{t('dashboard.overview')}</span>
                </Link>
              )}
              {renderFlyoutNodes(activeFlyout.section.items, Boolean(activeFlyout.section.rootOnly))}
            </div>
          </div>,
          document.body
        )}
      </div>
    </DashboardVisibilityProvider>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [queryString, setQueryString] = useState('');
  return (
    <>
      <Suspense fallback={null}>
        <SearchParamsWatcher onSync={setQueryString} />
      </Suspense>
      <DashboardLayoutInner queryString={queryString}>{children}</DashboardLayoutInner>
    </>
  );
}
