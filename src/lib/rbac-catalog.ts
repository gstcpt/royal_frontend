export interface DashboardViewSectionDef {
  order: number;
  id: string;
  label: string;
  routes: Array<{ path: string; label: string; rootOnly?: boolean }>;
}

/**
 * Ordre canonique strict 1..13 aligné sur apps/frontend/src/app/(dashboard)/layout.tsx
 * + Registre complet des 78 vues de apps/frontend/src/app/(dashboard)/dashboard/root/visibility/page.tsx
 */
export const DASHBOARD_VIEW_SECTIONS: DashboardViewSectionDef[] = [
  {
    order: 1,
    id: 'overview',
    label: '1. Tableau de bord',
    routes: [{ path: '/dashboard', label: 'Vue principale Tableau de bord' }],
  },
  {
    order: 2,
    id: 'community',
    label: '2. Communauté',
    routes: [
      { path: '/dashboard/community/notifications', label: 'Notifications (Staff)' },
      { path: '/dashboard/community/contacts', label: 'Contact (Formulaire Public)' },
      { path: '/dashboard/community/messages', label: 'Support (Messagerie Client)' },
      { path: '/account/notifications', label: 'Notifications (Client)' },
      { path: '/account/messages', label: 'Support (Client)' },
    ],
  },
  {
    order: 3,
    id: 'users',
    label: '3. Gestion des utilisateurs',
    routes: [
      { path: '/dashboard/section/users', label: "Vue d'ensemble — Utilisateurs" },
      { path: '/dashboard/users', label: 'Tous les utilisateurs' },
      { path: '/dashboard/root/superadmins', label: 'Super admin' },
      { path: '/dashboard/users/admins', label: 'Administrateurs' },
      { path: '/dashboard/users/website-managers', label: 'Website Manager' },
      { path: '/dashboard/users/magasiniers', label: 'Magasiniers' },
      { path: '/dashboard/users/caissiers', label: 'Caissiers' },
      { path: '/dashboard/users/vendeurs', label: 'Vendeurs' },
      { path: '/dashboard/users/financiers', label: 'Financiers' },
      { path: '/dashboard/users/commercials', label: 'Commercials' },
      { path: '/dashboard/users/marketing', label: 'Marketing' },
      { path: '/dashboard/users/delivery-managers', label: 'Responsables Livraison' },
      { path: '/dashboard/users/delivery-agents', label: 'Livreurs' },
      { path: '/dashboard/users/clients', label: 'Clients (Comptes)' },
    ],
  },
  {
    order: 4,
    id: 'catalogue',
    label: '4. Catalogue',
    routes: [
      { path: '/dashboard/brands', label: 'Marques' },
      { path: '/dashboard/categories', label: 'Catégories' },
      { path: '/dashboard/characteristics', label: 'Caractéristiques' },
      { path: '/dashboard/variants', label: 'Variantes' },
      { path: '/dashboard/articles', label: 'Articles' },
      { path: '/dashboard/coupons', label: 'Codes promotionnels' },
    ],
  },
  {
    order: 5,
    id: 'treasury',
    label: '5. Trésorerie',
    routes: [
      { path: '/dashboard/treasury', label: 'Caisses' },
      { path: '/dashboard/treasury/transactions', label: 'Journal Trésorerie' },
      { path: '/dashboard/treasury/payments', label: 'Suivi des règlements' },
      { path: '/dashboard/accounting', label: 'Livres Comptables' },
    ],
  },
  {
    order: 6,
    id: 'purchases',
    label: '6. Achats et approvisionnement',
    routes: [
      { path: '/dashboard/purchases/prospects', label: 'Portefeuille de prospects' },
      { path: '/dashboard/suppliers', label: 'Fiches fournisseurs' },
      { path: '/dashboard/purchases/orders', label: 'Commandes fournisseurs (BC)' },
      { path: '/dashboard/purchases/receipts', label: 'Bon de réception (BR)' },
    ],
  },
  {
    order: 7,
    id: 'stock',
    label: '7. Stock et entrepôts',
    routes: [
      { path: '/dashboard/warehouses', label: 'Dépôts' },
      { path: '/dashboard/stock-in', label: "Bon d'entrée (BE)" },
      { path: '/dashboard/stock-out', label: 'Bon de sortie (BS)' },
      { path: '/dashboard/inventory', label: 'Inventaire physique' },
      { path: '/dashboard/inventory-documents', label: 'Ajustement' },
      { path: '/dashboard/transfers', label: 'Mouvements de stock' },
    ],
  },
  {
    order: 8,
    id: 'sales',
    label: '8. Ventes et distribution',
    routes: [
      { path: '/dashboard/customers', label: 'Fiches clients' },
      { path: '/dashboard/orders', label: 'Commandes clients' },
      { path: '/dashboard/deliveries', label: 'Bon de livraison (BL)' },
      { path: '/dashboard/returns', label: 'Bon de retour (BR)' },
      { path: '/dashboard/invoices', label: 'Factures' },
    ],
  },
  {
    order: 9,
    id: 'pos',
    label: '9. Point de vente (POS)',
    routes: [
      { path: '/dashboard/pos/showrooms', label: "Salles d'exposition" },
      { path: '/dashboard/pos', label: 'Terminal POS' },
    ],
  },
  {
    order: 10,
    id: 'seo',
    label: '10. SEO & Réputation',
    routes: [
      { path: '/dashboard/community/testimonials', label: 'Commentaires et avis' },
      { path: '/dashboard/reports/interactions', label: 'Interactions' },
      { path: '/dashboard/community/newsletters', label: 'Abonnements' },
      { path: '/dashboard/seo/testimonials', label: 'Témoignages' },
      { path: '/dashboard/seo/pixels', label: 'Pixels & SEO' },
    ],
  },
  {
    order: 11,
    id: 'reports',
    label: '11. Rapports et statistiques',
    routes: [
      { path: '/dashboard/analytics', label: "Conseils d'achat" },
      { path: '/dashboard/reports/sales', label: 'Ventes et marges' },
      { path: '/dashboard/reports/treasury', label: 'Suivi des caisses' },
    ],
  },
  {
    order: 12,
    id: 'client',
    label: '12. Espace client',
    routes: [
      { path: '/account/home', label: 'Accueil Client' },
      { path: '/account/orders', label: 'Suivi des commandes client' },
      { path: '/account/favorites', label: 'Liste de souhaits' },
      { path: '/account/profile', label: 'Mon profil' },
      { path: '/account/loyalty', label: 'Mes points de fidélité' },
      { path: '/account/coupons', label: 'Mes codes privilèges' },
    ],
  },
  {
    order: 13,
    id: 'system',
    label: '13. Système',
    routes: [
      { path: '/dashboard/root/storefront/info', label: 'CMS Identité et marque' },
      { path: '/dashboard/root/storefront/layouts', label: 'CMS Mise en page' },
      { path: '/dashboard/root/storefront/views', label: 'CMS Vues et modèles' },
      { path: '/dashboard/root/email-templates', label: 'Modèles de courriels' },
      { path: '/dashboard/root/smtp', label: 'Paramètres SMTP' },
      { path: '/dashboard/root/tva', label: 'Taxe et timbre fiscal' },
      { path: '/dashboard/root/reference-prefixes', label: 'Préfixes & numérotations' },
      { path: '/dashboard/root/print-templates', label: 'Documents & Imprimantes POS' },
      { path: '/dashboard/payment-methods', label: 'Paiements' },
      { path: '/dashboard/settings', label: 'Paramètres généraux' },
      { path: '/dashboard/root/storage', label: 'Stockage Médias & CDN' },
      { path: '/dashboard/root/visibility', label: 'Visibilité des vues' },
      { path: '/dashboard/root/ai', label: 'Intelligence Artificielle (IA)' },
      { path: '/dashboard/translations', label: 'Langues & Traductions (FR / AR)' },
      { path: '/dashboard/root/roles-permissions', label: 'Rôles & Permissions' },
      { path: '/dashboard/logs', label: "Journal d'audit" },
      { path: '/dashboard/root/failures', label: 'Audit système' },
    ],
  },
];

export const MODULE_FRENCH_LABELS: Record<string, string> = {
  brands: 'Marques',
  categories: 'Catégories',
  characteristics: 'Caractéristiques',
  variants: 'Variantes',
  products: 'Articles / Produits',
  coupons: 'Codes promotionnels',
  contacts: 'Contact (Formulaire public)',
  notifications: 'Notifications',
  support: 'Support (Messagerie client)',
  customers: 'Fiches clients',
  orders: 'Commandes clients',
  deliveries: 'Bons de livraison (BL)',
  returns: 'Bons de retour (BR)',
  invoices: 'Factures',
  warehouses: 'Dépôts',
  stock_in: "Bons d'entrée (BE)",
  stock_out: 'Bons de sortie (BS)',
  inventory: 'Inventaire physique',
  transfers: 'Mouvements de stock',
  prospects: 'Prospects',
  suppliers: 'Fournisseurs',
  purchases_orders: 'Commandes fournisseurs (BC)',
  purchases_receipts: 'Réceptions fournisseurs (BR)',
  treasury: 'Caisses & Trésorerie',
  treasury_journal: 'Journal de trésorerie',
  payments: 'Règlements',
  accounting: 'Livres comptables',
  expenses: 'Dépenses',
  pos: 'Terminal POS',
  showrooms: "Salles d'exposition",
  reviews: 'Commentaires & avis',
  interactions: 'Interactions clients',
  newsletters: 'Abonnements newsletter',
  testimonials: 'Témoignages',
  reports: "Conseils d'achat & Analytics",
  reports_buying: "Rapports d'achat",
  reports_sales: 'Ventes & Marges',
  reports_cash: 'Suivi des caisses',
  client_home: 'Espace Client — Accueil',
  client_orders: 'Espace Client — Commandes',
  client_profile: 'Espace Client — Profil',
  client_wishlist: 'Espace Client — Favoris',
  client_loyalty: 'Espace Client — Fidélité',
  client_coupons: 'Espace Client — Privilèges',
  users: 'Tous les utilisateurs (Annuaire)',
  superadmins: 'Super Administrateurs',
  website_managers: 'Website Managers',
  magasiniers: 'Magasiniers',
  caissiers: 'Caissiers',
  vendeurs: 'Vendeurs',
  financiers: 'Financiers',
  commercials: 'Commerciaux',
  marketing: 'Marketing',
  delivery_managers: 'Responsables Livraison',
  delivery_agents: 'Livreurs',
  clients: 'Clients (Comptes)',
  roles: 'Rôles RBAC',
  permissions: 'Permissions RBAC',
  settings: 'Paramètres système',
  audit: "Journal d'audit",
  system_audit: 'Audit système',
  crm_brand: 'CMS — Marque',
  crm_layout: 'CMS — Design',
  crm_views: 'CMS — Vues',
  email_templates: "Modèles d'emails",
  payment_methods: 'Modalités de paiement',
};

export const ACTION_FRENCH_TITLES: Record<string, string> = {
  read: 'Consulter la ressource',
  read_list: 'Lister les enregistrements',
  read_detail: 'Afficher la fiche détaillée',
  create: 'Créer / Ajouter un élément',
  update: 'Modifier / Mettre à jour',
  delete: 'Supprimer définitivement',
  manage: 'Administration complète',
  adjust: 'Ajuster les quantités',
  reserve: 'Réserver du stock',
  operate: 'Opérer le terminal / caisse',
  view: 'Visualiser la vue',
  approve: 'Approuver / Valider',
  dispatch: 'Expédier / Dispatcher',
  receive: 'Réceptionner',
  cancel: 'Annuler',
  'permissions.assign': 'Assigner des permissions',
};

export interface PermissionDomainDef {
  order: number;
  id: string;
  label: string;
  description: string;
  modules: string[];
}

export const PERMISSION_DOMAINS: PermissionDomainDef[] = [
  {
    order: 1,
    id: 'overview',
    label: '1. Tableau de bord',
    description: 'Accueil principal et vue synthétique de pilotage.',
    modules: [],
  },
  {
    order: 2,
    id: 'community',
    label: '2. Communauté',
    description: 'Alertes notifications, messages du formulaire Contact et tickets Support.',
    modules: ['notifications', 'contacts', 'support'],
  },
  {
    order: 3,
    id: 'users',
    label: '3. Gestion des utilisateurs',
    description: 'Annuaire collaborateurs par profil métier et comptes clients.',
    modules: [
      'users',
      'superadmins',
      'website_managers',
      'magasiniers',
      'caissiers',
      'vendeurs',
      'financiers',
      'commercials',
    ],
  },
  {
    order: 4,
    id: 'catalogue',
    label: '4. Catalogue',
    description: 'Marques, catégories, caractéristiques, variantes, articles et promotions.',
    modules: ['brands', 'categories', 'characteristics', 'variants', 'products', 'coupons'],
  },
  {
    order: 5,
    id: 'treasury',
    label: '5. Trésorerie',
    description: 'Caisses, journal de trésorerie, règlements, comptabilité et dépenses.',
    modules: ['treasury', 'treasury_journal', 'payments', 'accounting', 'expenses'],
  },
  {
    order: 6,
    id: 'purchases',
    label: '6. Achats et approvisionnement',
    description: 'Prospects, fournisseurs, bons de commande et réceptions.',
    modules: ['prospects', 'suppliers', 'purchases_orders', 'purchases_receipts'],
  },
  {
    order: 7,
    id: 'stock',
    label: '7. Stock et entrepôts',
    description: 'Dépôts, entrées/sorties, inventaire physique, ajustements et mouvements.',
    modules: ['warehouses', 'stock_in', 'stock_out', 'inventory', 'transfers'],
  },
  {
    order: 8,
    id: 'sales',
    label: '8. Ventes et distribution',
    description: 'Fiches clients, commandes, bons de livraison, retours et factures.',
    modules: ['customers', 'orders', 'deliveries', 'returns', 'invoices'],
  },
  {
    order: 9,
    id: 'pos',
    label: '9. Point de vente (POS)',
    description: "Salles d'exposition et terminal de caisse.",
    modules: ['showrooms', 'pos'],
  },
  {
    order: 10,
    id: 'seo',
    label: '10. SEO & Réputation',
    description: 'Avis produits, interactions, abonnements newsletter et témoignages.',
    modules: ['reviews', 'interactions', 'newsletters', 'testimonials'],
  },
  {
    order: 11,
    id: 'reports',
    label: '11. Rapports et statistiques',
    description: "Conseils d'achat, ventes, marges et suivi des caisses.",
    modules: ['reports', 'reports_buying', 'reports_sales', 'reports_cash'],
  },
  {
    order: 12,
    id: 'client',
    label: '12. Espace client',
    description: 'Accueil client, suivi commandes, favoris, profil, fidélité et privilèges.',
    modules: [
      'client_home',
      'client_orders',
      'client_wishlist',
      'client_profile',
      'client_loyalty',
      'client_coupons',
    ],
  },
  {
    order: 13,
    id: 'system',
    label: '13. Système',
    description: 'CMS storefront, emails, paramètres généraux, stockage, IA, visibilité, rôles et audit.',
    modules: [
      'crm_brand',
      'crm_layout',
      'crm_views',
      'email_templates',
      'settings',
      'payment_methods',
      'roles',
      'permissions',
      'audit',
      'system_audit',
    ],
  },
];

export type RolePresetId =
  | 'MARKETING_FULL'
  | 'DELIVERY_MANAGER_FULL'
  | 'DELIVERY_AGENT_FULL'
  | 'CATALOG_NO_DELETE'
  | 'COMMUNITY_NO_SUPPORT'
  | 'CLIENT_SPACE'
  | 'READ_ONLY'
  | 'CLEAR_ALL';

export interface RolePresetDef {
  id: RolePresetId;
  label: string;
  summary: string;
  tone: 'gold' | 'emerald' | 'slate' | 'rose';
}

export const ROLE_PRESETS: RolePresetDef[] = [
  {
    id: 'MARKETING_FULL',
    label: 'Pack Marketing Complet',
    summary: 'Catalogue (sans Supprimer) + Communauté (sans Support) + Espace Client',
    tone: 'gold',
  },
  {
    id: 'DELIVERY_MANAGER_FULL',
    label: 'Pack Responsable Livraison',
    summary: 'Livraisons, Commandes, Retours, Clients, Transferts, Factures & Livreurs',
    tone: 'gold',
  },
  {
    id: 'DELIVERY_AGENT_FULL',
    label: 'Pack Livreur Terrain',
    summary: 'Tournées BL, Commandes clients, Retours et Notifications',
    tone: 'emerald',
  },
  {
    id: 'CATALOG_NO_DELETE',
    label: '+ Catalogue sans Supprimer',
    summary: 'Ajoute Voir, Ajouter et Modifier sur tout le catalogue (jamais Supprimer)',
    tone: 'emerald',
  },
  {
    id: 'COMMUNITY_NO_SUPPORT',
    label: '+ Communauté sans Support',
    summary: 'Ajoute Notifications & Contact uniquement (sans Support)',
    tone: 'emerald',
  },
  {
    id: 'CLIENT_SPACE',
    label: '+ Espace Client',
    summary: 'Ajoute les droits et vues client standard',
    tone: 'slate',
  },
  {
    id: 'READ_ONLY',
    label: 'Lecture seule (Voir)',
    summary: 'Ne garde que les droits de lecture sur les modules actuels',
    tone: 'slate',
  },
  {
    id: 'CLEAR_ALL',
    label: 'Tout réinitialiser',
    summary: 'Vide permissions & vues de ce rôle avant configuration manuelle',
    tone: 'rose',
  },
];

export function formatModuleLabel(mod: string): string {
  return MODULE_FRENCH_LABELS[mod] || mod.replace(/_/g, ' ');
}

export function formatPermissionFrenchTitle(
  mod: string,
  action: string,
  actionTitleFr?: string | null,
): string {
  if (actionTitleFr && actionTitleFr.trim()) return actionTitleFr;
  const modLabel = formatModuleLabel(mod);
  const verb = ACTION_FRENCH_TITLES[action] || action;
  return `${verb} — ${modLabel}`;
}

export function applyPresetToRoleState<T extends { id: string; action: string }>(
  preset: RolePresetId,
  groupedPerms: Record<string, T[]>,
  currentPermIds: Set<string>,
  currentViews: string[],
): { permIds: Set<string>; views: string[] } {
  const nextPerms = new Set<string>(currentPermIds);
  const nextViews = new Set<string>(currentViews);
  nextViews.add('/dashboard');

  const catalogModules = ['brands', 'categories', 'characteristics', 'variants', 'products', 'coupons'];
  const catalogViews = [
    '/dashboard/brands',
    '/dashboard/categories',
    '/dashboard/characteristics',
    '/dashboard/variants',
    '/dashboard/articles',
    '/dashboard/coupons',
  ];
  const communityNoSupportModules = ['contacts', 'notifications'];
  const communityNoSupportViews = ['/dashboard/community/notifications', '/dashboard/community/contacts'];
  const clientModules = [
    'client_home',
    'client_orders',
    'client_profile',
    'client_loyalty',
    'client_coupons',
    'client_wishlist',
  ];
  const clientViews = [
    '/account/home',
    '/account/orders',
    '/account/favorites',
    '/account/profile',
    '/account/loyalty',
    '/account/coupons',
    '/account/notifications',
  ];

  const grantModuleNoDelete = (mod: string) => {
    (groupedPerms[mod] || []).forEach((p) => {
      if (p.action !== 'delete' && p.action !== 'manage') {
        nextPerms.add(p.id);
      } else {
        nextPerms.delete(p.id);
      }
    });
  };

  const grantModuleAll = (mod: string, allowedActions?: string[]) => {
    (groupedPerms[mod] || []).forEach((p) => {
      if (!allowedActions || allowedActions.includes(p.action)) {
        nextPerms.add(p.id);
      }
    });
  };

  if (preset === 'CLEAR_ALL') {
    return { permIds: new Set<string>(), views: ['/dashboard'] };
  }

  if (preset === 'READ_ONLY') {
    const readOnlySet = new Set<string>();
    Object.values(groupedPerms)
      .flat()
      .forEach((p) => {
        if (
          currentPermIds.has(p.id) &&
          (p.action === 'read' || p.action === 'read_list' || p.action === 'read_detail')
        ) {
          readOnlySet.add(p.id);
        }
      });
    return { permIds: readOnlySet, views: Array.from(nextViews) };
  }

  if (preset === 'MARKETING_FULL') {
    nextPerms.clear();
    nextViews.clear();
    nextViews.add('/dashboard');
    catalogModules.forEach(grantModuleNoDelete);
    catalogViews.forEach((v) => nextViews.add(v));
    communityNoSupportModules.forEach((m) => grantModuleAll(m));
    communityNoSupportViews.forEach((v) => nextViews.add(v));
    clientModules.forEach((m) =>
      grantModuleAll(
        m,
        m === 'client_wishlist' ? undefined : ['create', 'read_list', 'read_detail', 'update'],
      ),
    );
    clientViews.forEach((v) => nextViews.add(v));
    return { permIds: nextPerms, views: Array.from(nextViews) };
  }

  if (preset === 'DELIVERY_MANAGER_FULL') {
    nextPerms.clear();
    nextViews.clear();
    [
      '/dashboard',
      '/dashboard/community/notifications',
      '/dashboard/customers',
      '/dashboard/orders',
      '/dashboard/deliveries',
      '/dashboard/returns',
      '/dashboard/invoices',
      '/dashboard/warehouses',
      '/dashboard/transfers',
      '/dashboard/users/delivery-agents',
      '/account/notifications',
    ].forEach((v) => nextViews.add(v));

    grantModuleAll('deliveries', ['read', 'read_list', 'read_detail', 'create', 'update', 'manage']);
    grantModuleAll('orders', ['read', 'read_list', 'read_detail', 'update']);
    grantModuleAll('returns', ['read', 'read_list', 'read_detail', 'create', 'update']);
    grantModuleAll('customers', ['read', 'read_list', 'read_detail']);
    grantModuleAll('warehouses', ['read', 'read_list', 'read_detail']);
    grantModuleAll('transfers', ['read', 'read_list', 'read_detail', 'create', 'update']);
    grantModuleAll('invoices', ['read', 'read_list', 'read_detail']);
    grantModuleAll('notifications', ['read', 'read_list', 'read_detail', 'create', 'update']);
    grantModuleAll('users', ['read', 'read_list', 'read_detail']);
    return { permIds: nextPerms, views: Array.from(nextViews) };
  }

  if (preset === 'DELIVERY_AGENT_FULL') {
    nextPerms.clear();
    nextViews.clear();
    [
      '/dashboard',
      '/dashboard/community/notifications',
      '/dashboard/orders',
      '/dashboard/deliveries',
      '/dashboard/returns',
      '/account/notifications',
    ].forEach((v) => nextViews.add(v));

    grantModuleAll('deliveries', ['read', 'read_list', 'read_detail', 'update']);
    grantModuleAll('orders', ['read', 'read_list', 'read_detail', 'update']);
    grantModuleAll('returns', ['read', 'read_list', 'read_detail']);
    grantModuleAll('customers', ['read', 'read_list', 'read_detail']);
    grantModuleAll('notifications', ['read', 'read_list', 'read_detail', 'update']);
    return { permIds: nextPerms, views: Array.from(nextViews) };
  }

  if (preset === 'CATALOG_NO_DELETE') {
    catalogModules.forEach(grantModuleNoDelete);
    catalogViews.forEach((v) => nextViews.add(v));
    return { permIds: nextPerms, views: Array.from(nextViews) };
  }

  if (preset === 'COMMUNITY_NO_SUPPORT') {
    communityNoSupportModules.forEach((m) => grantModuleAll(m));
    communityNoSupportViews.forEach((v) => nextViews.add(v));
    nextViews.delete('/dashboard/community/messages');
    (groupedPerms['support'] || []).forEach((p) => nextPerms.delete(p.id));
    return { permIds: nextPerms, views: Array.from(nextViews) };
  }

  if (preset === 'CLIENT_SPACE') {
    clientModules.forEach((m) =>
      grantModuleAll(
        m,
        m === 'client_wishlist' ? undefined : ['create', 'read_list', 'read_detail', 'update'],
      ),
    );
    clientViews.forEach((v) => nextViews.add(v));
    return { permIds: nextPerms, views: Array.from(nextViews) };
  }

  return { permIds: nextPerms, views: Array.from(nextViews) };
}
