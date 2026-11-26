'use client';

import * as React from 'react';
import {
  Lock,
  Save,
  Check,
  X,
  Search,
  RefreshCw,
  ShieldCheck,
  Layers,
  Plus,
  Trash2,
  RotateCcw,
  Users,
  Grid3X3,
  UserCog,
  CheckSquare,
  Square,
  Eye,
  Wand2,
  Cpu,
} from 'lucide-react';
import {
  Button,
  Badge,
  Breadcrumb,
  Toast,
  Select,
  Modal,
  DeleteConfirmModal,
  Toggle,
  GuideInfoButton,
  ViewGuideModal,
  ViewGuideStep,
} from '@/components/ui';
import { fetchApi } from '@/lib/api';
import {
  RoleStudioPanel,
  StudioPermissionViewMeta,
} from '@/components/dashboard/RoleStudioPanel';
import {
  ACTION_FRENCH_TITLES,
  applyPresetToRoleState,
  DASHBOARD_VIEW_SECTIONS,
  formatModuleLabel,
  formatPermissionFrenchTitle,
  PERMISSION_DOMAINS,
  RolePresetId,
} from '@/lib/rbac-catalog';

interface ApiRole {
  id: string;
  name: string;
  displayName: string;
  description?: string | null;
  isSystem?: boolean;
  userCount?: number;
  permissionCount?: number;
}

interface ApiPermission {
  id: string;
  code: string;
  resource: string;
  action: string;
  description?: string | null;
  actionTitleFr?: string | null;
  views?: StudioPermissionViewMeta[];
}

const EXCEL_ROLE_ORDER = [
  'ROOT',
  'SUPER_ADMIN',
  'WEBSITE_MANAGER',
  'STOCK_MANAGER',
  'CASHIER',
  'SALESPERSON',
  'ACCOUNTANT',
  'COMMERCIAL',
  'MARKETING',
  'CLIENT',
];

const ROLE_META: Record<string, { full: string; short: string; group: 'BACKOFFICE' | 'OPERATIONS' }> = {
  ROOT: { full: 'ROOT', short: 'ROOT', group: 'BACKOFFICE' },
  SUPER_ADMIN: { full: 'Super Admin', short: 'S.Adm', group: 'BACKOFFICE' },
  WEBSITE_MANAGER: { full: 'Website Mgr', short: 'Web', group: 'BACKOFFICE' },
  ACCOUNTANT: { full: 'Financiers', short: 'Finan.', group: 'BACKOFFICE' },
  COMMERCIAL: { full: 'Commercial', short: 'Comm.', group: 'BACKOFFICE' },
  MARKETING: { full: 'Marketing', short: 'Mktg', group: 'BACKOFFICE' },
  STOCK_MANAGER: { full: 'Magasiniers', short: 'Stock', group: 'OPERATIONS' },
  CASHIER: { full: 'Caissiers', short: 'Caiss.', group: 'OPERATIONS' },
  SALESPERSON: { full: 'Vendeurs', short: 'Vend.', group: 'OPERATIONS' },
  CLIENT: { full: 'Clients', short: 'Client', group: 'OPERATIONS' },
};

const MODULE_ORDER_INDEX = new Map<string, number>(
  PERMISSION_DOMAINS.flatMap((d) => d.modules).map((m, idx) => [m, idx]),
);

const RBAC_GUIDE_STEPS: ViewGuideStep[] = [
  {
    id: 'rbac-roles',
    number: '01',
    title: 'Profils Royal & Protection Absolue ROOT',
    description: 'Chaque carte supérieure indique le rôle, le nombre d’utilisateurs rattachés et la couverture sur les permissions actives.',
    fields: [
      {
        label: 'Sélection rapide par Rôle',
        steps: [
          'Cliquez sur une carte rôle en haut pour passer en mode « Par Rôle » et éditer toutes ses permissions sans tableau large.',
          'Le rôle ROOT dispose automatiquement de 100% des droits et reste protégé en lecture seule.',
        ],
      },
    ],
  },
  {
    id: 'rbac-matrix',
    number: '02',
    title: 'Vue Matrice par Module (Comparatif Multi-Rôles)',
    description: 'Comparez et basculez les permissions d’un module entre tous les rôles côte à côte, ou filtrez par groupe.',
    fields: [
      {
        label: 'Actions groupées sur colonne',
        steps: [
          'Cliquez sur l’en-tête d’un rôle dans le tableau pour activer ou désactiver d’un coup toutes les actions du module affiché pour ce rôle.',
          'Sur mobile/tablette, chaque permission s’affiche sous forme de carte claire avec boutons pleins.',
        ],
      },
    ],
  },
  {
    id: 'rbac-save',
    number: '03',
    title: 'Modifications en attente & Enregistrement PostgreSQL',
    description: 'Vos changements sont mis en évidence par une bordure dorée avant validation.',
    fields: [
      {
        label: 'Enregistrer ou Annuler',
        steps: [
          'Cliquez sur « Enregistrer (N) » pour synchroniser en base PostgreSQL l’ensemble des rôles modifiés.',
          'Utilisez « Annuler » à tout moment pour revenir à l’état enregistré.',
        ],
      },
    ],
  },
];

function cleanUtf8Label(input?: string | null): string {
  if (!input) return '';
  return input
    .replace(/â€”/g, '—')
    .replace(/â€“/g, '–')
    .replace(/â€™/g, '’')
    .replace(/Ã©/g, 'é')
    .replace(/Ã¨/g, 'è')
    .replace(/Ãª/g, 'ê')
    .replace(/Ã«/g, 'ë')
    .replace(/Ã /g, 'à')
    .replace(/Ã¢/g, 'â')
    .replace(/Ã®/g, 'î')
    .replace(/Ã¯/g, 'ï')
    .replace(/Ã´/g, 'ô')
    .replace(/Ã¹/g, 'ù')
    .replace(/Ã»/g, 'û')
    .replace(/Ã§/g, 'ç')
    .replace(/Ã‰/g, 'É')
    .replace(/Ã€/g, 'À');
}

function getRoleFullLabel(r: ApiRole): string {
  return ROLE_META[r.name]?.full || cleanUtf8Label(r.displayName) || r.name;
}

function getRoleShortLabel(r: ApiRole): string {
  if (ROLE_META[r.name]?.short) return ROLE_META[r.name].short;
  const label = cleanUtf8Label(r.displayName) || r.name;
  return label.length <= 7 ? label : `${label.slice(0, 6)}.`;
}

export default function RolesPermissionsPage() {
  const [roles, setRoles] = React.useState<ApiRole[]>([]);
  const [groupedPerms, setGroupedPerms] = React.useState<Record<string, ApiPermission[]>>({});
  const [rolePermSets, setRolePermSets] = React.useState<Record<string, Set<string>>>({});
  const [savedRolePermSets, setSavedRolePermSets] = React.useState<Record<string, Set<string>>>({});
  const [dirtyRoles, setDirtyRoles] = React.useState<Set<string>>(new Set());

  const [roleViewsMap, setRoleViewsMap] = React.useState<Record<string, string[]>>({});
  const [savedRoleViewsMap, setSavedRoleViewsMap] = React.useState<Record<string, string[]>>({});
  const [dirtyViewRoles, setDirtyViewRoles] = React.useState<Set<string>>(new Set());
  const [visibilityMap, setVisibilityMap] = React.useState<Record<string, 'PUBLIC' | 'PRIVATE'>>({});
  const [permissionViews, setPermissionViews] = React.useState<StudioPermissionViewMeta[]>([]);
  const [syncingScanner, setSyncingScanner] = React.useState(false);

  const [viewMode, setViewMode] = React.useState<'matrix' | 'by-role'>('by-role');
  const [activeRoleName, setActiveRoleName] = React.useState<string>('MARKETING');
  const [roleGroupFilter, setRoleGroupFilter] = React.useState<'ALL' | 'BACKOFFICE' | 'OPERATIONS'>('ALL');

  const [selectedModule, setSelectedModule] = React.useState<string>('');
  const [moduleSearch, setModuleSearch] = React.useState('');
  const [permSearch, setPermSearch] = React.useState('');
  const [selectedAction, setSelectedAction] = React.useState<string>('ALL');

  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [toastMsg, setToastMsg] = React.useState<string | null>(null);
  const [toastType, setToastType] = React.useState<'success' | 'info' | 'error'>('success');

  // Guide modal
  const [guideOpen, setGuideOpen] = React.useState(false);
  const [guideIndex, setGuideIndex] = React.useState(0);

  // Create modals
  const [showRoleModal, setShowRoleModal] = React.useState(false);
  const [roleForm, setRoleForm] = React.useState({
    name: '',
    displayName: '',
    description: '',
    preset: 'NONE' as 'NONE' | RolePresetId,
    views: ['/dashboard'] as string[],
  });
  const [savingRole, setSavingRole] = React.useState(false);

  const [showPermModal, setShowPermModal] = React.useState(false);
  const [permForm, setPermForm] = React.useState({ resource: '', action: 'read_list', code: '', description: '' });
  const [savingPerm, setSavingPerm] = React.useState(false);

  // Delete confirmation modals
  const [roleToDelete, setRoleToDelete] = React.useState<ApiRole | null>(null);
  const [deletingRole, setDeletingRole] = React.useState(false);
  const [permToDelete, setPermToDelete] = React.useState<ApiPermission | null>(null);
  const [deletingPerm, setDeletingPerm] = React.useState(false);

  const loadMatrix = React.useCallback(async () => {
    setLoading(true);
    try {
      const [rolesRes, permsRes, viewsRes, roleViewsRes, visibilityRes] = await Promise.all([
        fetchApi('/roles'),
        fetchApi('/permissions'),
        fetchApi('/permissions/views').catch(() => null),
        fetchApi('/storefront-cms/sys-config/roleViews').catch(() => null),
        fetchApi('/storefront-cms/sys-config/visibility').catch(() => null),
      ]);
      const roleList: ApiRole[] = rolesRes?.data || (Array.isArray(rolesRes) ? rolesRes : []);
      const sortedRoles = [...roleList].sort((a, b) => {
        const idxA = EXCEL_ROLE_ORDER.indexOf(a.name);
        const idxB = EXCEL_ROLE_ORDER.indexOf(b.name);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return a.name.localeCompare(b.name);
      });
      setRoles(sortedRoles);
      setActiveRoleName((prev) =>
        sortedRoles.some((r) => r.name === prev)
          ? prev
          : sortedRoles.find((r) => r.name === 'MARKETING')?.name ||
            sortedRoles.find((r) => r.name !== 'ROOT')?.name ||
            sortedRoles[0]?.name ||
            'ROOT',
      );

      const permModules: Record<string, ApiPermission[]> = permsRes?.modules || permsRes?.data?.modules || {};
      setGroupedPerms(permModules);
      const firstMod = Object.keys(permModules).sort()[0] || '';
      setSelectedModule((prev) => (prev && permModules[prev] ? prev : firstMod));

      const pvItems: StudioPermissionViewMeta[] =
        viewsRes?.items || viewsRes?.data?.items || [];
      setPermissionViews(Array.isArray(pvItems) ? pvItems : []);

      const detailResponses = await Promise.all(
        sortedRoles.map((r) => fetchApi(`/roles/${r.id}`).catch(() => null)),
      );

      const sets: Record<string, Set<string>> = {};
      const snapshot: Record<string, Set<string>> = {};
      sortedRoles.forEach((role, idx) => {
        const det = detailResponses[idx]?.data || detailResponses[idx];
        const ids = Array.isArray(det?.permissions) ? det.permissions.map((p: any) => p.id) : [];
        sets[role.name] = new Set<string>(ids);
        snapshot[role.name] = new Set<string>(ids);
      });
      setRolePermSets(sets);
      setSavedRolePermSets(snapshot);
      setDirtyRoles(new Set());

      const rawViews = roleViewsRes?.data?.value ?? roleViewsRes?.value ?? {};
      const viewsMap: Record<string, string[]> = {};
      const viewsSnapshot: Record<string, string[]> = {};
      if (rawViews && typeof rawViews === 'object' && !Array.isArray(rawViews)) {
        Object.entries(rawViews).forEach(([k, v]) => {
          const arr = Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
          viewsMap[k.toUpperCase()] = [...arr];
          viewsSnapshot[k.toUpperCase()] = [...arr];
        });
      }
      setRoleViewsMap(viewsMap);
      setSavedRoleViewsMap(viewsSnapshot);
      setDirtyViewRoles(new Set());

      const rawVis = visibilityRes?.data?.value ?? visibilityRes?.value ?? [];
      if (Array.isArray(rawVis)) {
        const visMap: Record<string, 'PUBLIC' | 'PRIVATE'> = {};
        rawVis.forEach((item: any) => {
          if (item?.key) visMap[item.key] = item.visibility === 'PRIVATE' ? 'PRIVATE' : 'PUBLIC';
        });
        setVisibilityMap(visMap);
      }
    } catch (err: any) {
      setToastType('error');
      setToastMsg(err?.message || 'Impossible de charger la matrice RBAC.');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleScanAndSyncViews = async () => {
    setSyncingScanner(true);
    try {
      const res: any = await fetchApi('/permissions/scan-sync-views', { method: 'POST' });
      const data = res?.data || res;
      const upserted = data?.scan?.upsertedCount ?? data?.totalStored ?? 0;
      setToastType('success');
      setToastMsg(`Scanner MCP synchronisé : ${upserted} liaisons permissions_views à jour.`);
      await loadMatrix();
    } catch (err: any) {
      setToastType('error');
      setToastMsg(err?.message || 'Erreur lors du scan permissions_views.');
    } finally {
      setSyncingScanner(false);
    }
  };

  React.useEffect(() => {
    loadMatrix();
  }, [loadMatrix]);

  const markDirtyStatus = React.useCallback(
    (roleName: string, nextSet: Set<string>, savedMap: Record<string, Set<string>>) => {
      const orig = savedMap[roleName] || new Set<string>();
      const changed =
        orig.size !== nextSet.size || Array.from(nextSet).some((id) => !orig.has(id));
      setDirtyRoles((prev) => {
        const next = new Set(prev);
        if (changed) next.add(roleName);
        else next.delete(roleName);
        return next;
      });
    },
    [],
  );

  const togglePermission = (roleName: string, permId: string) => {
    if (roleName === 'ROOT') return;
    setRolePermSets((prev) => {
      const next = { ...prev };
      const current = new Set(next[roleName] || []);
      if (current.has(permId)) current.delete(permId);
      else current.add(permId);
      next[roleName] = current;
      markDirtyStatus(roleName, current, savedRolePermSets);
      return next;
    });
  };

  const toggleModulePermsForRole = (roleName: string, perms: ApiPermission[]) => {
    if (roleName === 'ROOT' || perms.length === 0) return;
    setRolePermSets((prev) => {
      const next = { ...prev };
      const current = new Set(next[roleName] || []);
      const allChecked = perms.every((p) => current.has(p.id));
      if (allChecked) {
        perms.forEach((p) => current.delete(p.id));
      } else {
        perms.forEach((p) => current.add(p.id));
      }
      next[roleName] = current;
      markDirtyStatus(roleName, current, savedRolePermSets);
      return next;
    });
  };

  const togglePermAcrossVisibleRoles = (permId: string, targetRoles: ApiRole[]) => {
    const editable = targetRoles.filter((r) => r.name !== 'ROOT');
    if (editable.length === 0) return;
    setRolePermSets((prev) => {
      const next = { ...prev };
      const allHave = editable.every((r) => next[r.name]?.has(permId));
      for (const r of editable) {
        const s = new Set(next[r.name] || []);
        if (allHave) s.delete(permId);
        else s.add(permId);
        next[r.name] = s;
        markDirtyStatus(r.name, s, savedRolePermSets);
      }
      return next;
    });
  };

  const markViewDirtyStatus = React.useCallback(
    (roleName: string, nextRoutes: string[], savedViews: Record<string, string[]>) => {
      const orig = new Set(savedViews[roleName] || []);
      const next = new Set(nextRoutes);
      const changed =
        orig.size !== next.size || Array.from(next).some((route) => !orig.has(route));
      setDirtyViewRoles((prev) => {
        const updated = new Set(prev);
        if (changed) updated.add(roleName);
        else updated.delete(roleName);
        return updated;
      });
    },
    [],
  );

  const setModulePermissionsForRole = (roleName: string, permIds: string[], enabled: boolean) => {
    if (roleName === 'ROOT' || permIds.length === 0) return;
    setRolePermSets((prev) => {
      const next = { ...prev };
      const current = new Set(next[roleName] || []);
      permIds.forEach((id) => {
        if (enabled) current.add(id);
        else current.delete(id);
      });
      next[roleName] = current;
      markDirtyStatus(roleName, current, savedRolePermSets);
      return next;
    });
  };

  const setRolePermissionsAndViews = (
    roleName: string,
    permIds: Set<string>,
    views: string[],
  ) => {
    if (roleName === 'ROOT') return;
    const dedupedViews = Array.from(new Set(views));
    setRolePermSets((prev) => {
      const next = { ...prev, [roleName]: new Set(permIds) };
      markDirtyStatus(roleName, next[roleName], savedRolePermSets);
      return next;
    });
    setRoleViewsMap((prev) => {
      const next = { ...prev, [roleName]: dedupedViews };
      markViewDirtyStatus(roleName, dedupedViews, savedRoleViewsMap);
      return next;
    });
  };

  const toggleViewRouteForRole = (roleName: string, routePath: string) => {
    if (roleName === 'ROOT') return;
    setRoleViewsMap((prev) => {
      const current = new Set(prev[roleName] || []);
      if (current.has(routePath)) current.delete(routePath);
      else current.add(routePath);
      const updated = Array.from(current);
      markViewDirtyStatus(roleName, updated, savedRoleViewsMap);
      return { ...prev, [roleName]: updated };
    });
  };

  const toggleViewSectionForRole = (
    roleName: string,
    routePaths: string[],
    enableAll: boolean,
  ) => {
    if (roleName === 'ROOT') return;
    setRoleViewsMap((prev) => {
      const current = new Set(prev[roleName] || []);
      routePaths.forEach((path) => {
        if (enableAll) current.add(path);
        else current.delete(path);
      });
      const updated = Array.from(current);
      markViewDirtyStatus(roleName, updated, savedRoleViewsMap);
      return { ...prev, [roleName]: updated };
    });
  };

  const handleResetDirty = () => {
    const restored: Record<string, Set<string>> = {};
    Object.keys(savedRolePermSets).forEach((k) => {
      restored[k] = new Set(savedRolePermSets[k]);
    });
    const restoredViews: Record<string, string[]> = {};
    Object.keys(savedRoleViewsMap).forEach((k) => {
      restoredViews[k] = [...savedRoleViewsMap[k]];
    });
    setRolePermSets(restored);
    setRoleViewsMap(restoredViews);
    setDirtyRoles(new Set());
    setDirtyViewRoles(new Set());
    setToastType('info');
    setToastMsg('Modifications locales annulées.');
  };

  const totalPendingRolesCount = React.useMemo(
    () => new Set([...Array.from(dirtyRoles), ...Array.from(dirtyViewRoles)]).size,
    [dirtyRoles, dirtyViewRoles],
  );

  const handleSaveAll = async () => {
    const rolesToSavePerms = roles.filter((r) => r.name !== 'ROOT' && dirtyRoles.has(r.name));
    const hasViewUpdates = dirtyViewRoles.size > 0;
    if (rolesToSavePerms.length === 0 && !hasViewUpdates) {
      setToastType('info');
      setToastMsg('Aucune modification en attente.');
      return;
    }

    setSaving(true);
    try {
      for (const role of rolesToSavePerms) {
        const permIds = Array.from(rolePermSets[role.name] || []);
        await fetchApi(`/roles/${role.id}/permissions`, {
          method: 'POST',
          body: JSON.stringify({ permissionIds: permIds }),
        });
      }
      if (hasViewUpdates) {
        await fetchApi('/storefront-cms/sys-config/roleViews', {
          method: 'PUT',
          body: JSON.stringify({ value: roleViewsMap }),
        });
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('royal:role-views-updated', { detail: roleViewsMap }));
        }
      }
      setDirtyRoles(new Set());
      setDirtyViewRoles(new Set());
      setToastType('success');
      setToastMsg('Permissions et vues Dashboard enregistrées dans PostgreSQL.');
      await loadMatrix();
    } catch (err: any) {
      setToastType('error');
      setToastMsg(err?.message || 'Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDeleteRole = async () => {
    if (!roleToDelete) return;
    setDeletingRole(true);
    try {
      await fetchApi(`/roles/${roleToDelete.id}`, { method: 'DELETE' });
      setToastType('success');
      setToastMsg(`Rôle "${getRoleFullLabel(roleToDelete)}" supprimé.`);
      setRoleToDelete(null);
      await loadMatrix();
    } catch (e: any) {
      setToastType('error');
      setToastMsg(e?.message || 'Impossible de supprimer ce rôle.');
    } finally {
      setDeletingRole(false);
    }
  };

  const handleConfirmDeletePerm = async () => {
    if (!permToDelete) return;
    setDeletingPerm(true);
    try {
      await fetchApi(`/permissions/${permToDelete.id}`, { method: 'DELETE' });
      setToastType('success');
      setToastMsg(`Permission ${permToDelete.code} supprimée.`);
      setPermToDelete(null);
      await loadMatrix();
    } catch (e: any) {
      setToastType('error');
      setToastMsg(e?.message || 'Impossible de supprimer cette permission.');
    } finally {
      setDeletingPerm(false);
    }
  };

  const allModulesList = React.useMemo(
    () =>
      Object.keys(groupedPerms).sort((a, b) => {
        const idxA = MODULE_ORDER_INDEX.get(a) ?? 999;
        const idxB = MODULE_ORDER_INDEX.get(b) ?? 999;
        if (idxA !== idxB) return idxA - idxB;
        return a.localeCompare(b);
      }),
    [groupedPerms],
  );

  const totalPermissionsCount = React.useMemo(
    () => Object.values(groupedPerms).reduce((acc, arr) => acc + arr.length, 0),
    [groupedPerms],
  );

  const filteredModules = React.useMemo(() => {
    const q = moduleSearch.trim().toLowerCase();
    return allModulesList.filter(
      (m) =>
        !q ||
        m.toLowerCase().includes(q) ||
        formatModuleLabel(m).toLowerCase().includes(q),
    );
  }, [allModulesList, moduleSearch]);

  const visibleMatrixRoles = React.useMemo(() => {
    if (roleGroupFilter === 'ALL') return roles;
    return roles.filter((r) => {
      const grp = ROLE_META[r.name]?.group || 'OPERATIONS';
      return grp === roleGroupFilter;
    });
  }, [roles, roleGroupFilter]);

  const activeModulePerms = React.useMemo(() => {
    const list = selectedModule ? groupedPerms[selectedModule] || [] : [];
    const q = permSearch.trim().toLowerCase();
    return list.filter((p) => {
      if (selectedAction !== 'ALL' && p.action !== selectedAction) return false;
      if (
        q &&
        !p.code.toLowerCase().includes(q) &&
        !cleanUtf8Label(p.description).toLowerCase().includes(q) &&
        !formatPermissionFrenchTitle(selectedModule, p.action, p.actionTitleFr)
          .toLowerCase()
          .includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [selectedModule, groupedPerms, permSearch, selectedAction]);

  const selectedRoleObj = React.useMemo(
    () => roles.find((r) => r.name === activeRoleName) || roles[0] || null,
    [roles, activeRoleName],
  );

  return (
    <div className="space-y-5 max-w-[1720px] mx-auto">
      {/* 1. Header Card — Clean Inline Icon & Structured Action Toolbar */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-[#E6E1D6] shadow-xs space-y-4">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-[#FBF6E8] text-[#B8860B] border border-[#E6D6A6] flex items-center justify-center shrink-0">
                  <Lock className="h-4 w-4" />
                </div>
                <h1 className="text-lg sm:text-xl font-heading font-black text-[#1D232E] tracking-tight">
                  Rôles &amp; Permissions CRUD
                </h1>
                <GuideInfoButton
                  onClick={() => {
                    setGuideIndex(0);
                    setGuideOpen(true);
                  }}
                />
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#F8F9FA] text-[#1D232E] border border-[#E6E1D6]">
                  {roles.length} rôles
                </span>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#F8F9FA] text-[#1D232E] border border-[#E6E1D6]">
                  {allModulesList.length} modules
                </span>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#FBF6E8] text-[#9A7414] border border-[#E6D6A6]">
                  {totalPermissionsCount} permissions
                </span>
                {permissionViews.length > 0 && (
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {permissionViews.length} liaisons permissions_views
                  </span>
                )}
              </div>
            </div>
            <p className="text-xs text-slate-500 max-w-3xl">
              Pilotez les accès de chaque profil Royal selon les 13 sections de la barre latérale, avec titres d&apos;action en français, table SQL permissions_views et scanner MCP local.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleScanAndSyncViews}
              isLoading={syncingScanner}
              disabled={loading}
              title="Scanner les vues Next.js et les contrôleurs NestJS pour synchroniser permissions_views"
            >
              <Cpu className="h-3.5 w-3.5 text-[#C59B27]" />
              <span>Scanner MCP</span>
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowRoleModal(true)}>
              <Plus className="h-3.5 w-3.5" />
              <span>Nouveau Rôle</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setPermForm({
                  resource: selectedModule || 'custom',
                  action: 'read_list',
                  code: selectedModule ? `${selectedModule}.` : '',
                  description: '',
                });
                setShowPermModal(true);
              }}
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Nouvelle Permission</span>
            </Button>
            <Button variant="outline" size="sm" onClick={loadMatrix} disabled={loading}>
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Actualiser</span>
            </Button>
            {totalPendingRolesCount > 0 && (
              <Button variant="outline" size="sm" onClick={handleResetDirty} disabled={saving}>
                <RotateCcw className="h-3.5 w-3.5 text-slate-500" />
                <span>Annuler</span>
              </Button>
            )}
            <Button
              variant="gold"
              size="sm"
              onClick={handleSaveAll}
              isLoading={saving}
              disabled={totalPendingRolesCount === 0}
            >
              <Save className="h-3.5 w-3.5" />
              <span>Enregistrer {totalPendingRolesCount > 0 ? `(${totalPendingRolesCount})` : ''}</span>
            </Button>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <Breadcrumb
            items={[
              { label: 'Système', href: '/dashboard/section/system' },
              { label: 'Rôles et permissions' },
            ]}
          />

          {/* Switch View Mode */}
          <div className="inline-flex p-1 rounded-xl bg-[#F4F5F7] border border-[#E6E1D6] self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setViewMode('by-role')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer ${
                viewMode === 'by-role'
                  ? 'bg-white text-[#1D232E] shadow-2xs border border-[#E6E1D6]'
                  : 'text-slate-500 hover:text-[#1D232E]'
              }`}
            >
              <UserCog className="w-3.5 h-3.5 text-[#C59B27]" />
              <span>Assistant Simple &amp; Vues</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('matrix')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer ${
                viewMode === 'matrix'
                  ? 'bg-white text-[#1D232E] shadow-2xs border border-[#E6E1D6]'
                  : 'text-slate-500 hover:text-[#1D232E]'
              }`}
            >
              <Grid3X3 className="w-3.5 h-3.5 text-[#C59B27]" />
              <span>Matrice Comparatif</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Balanced 6-Col / Responsive Role Strip — Zero Truncation, Clickable Selector */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-2.5">
        {roles.map((r) => {
          const permCount =
            r.name === 'ROOT' ? totalPermissionsCount : rolePermSets[r.name]?.size || 0;
          const pct = totalPermissionsCount > 0 ? Math.round((permCount / totalPermissionsCount) * 100) : 0;
          const viewsCount = r.name === 'ROOT' ? undefined : (roleViewsMap[r.name]?.length ?? 0);
          const isDirty = dirtyRoles.has(r.name) || dirtyViewRoles.has(r.name);
          const isActiveRole = viewMode === 'by-role' && activeRoleName === r.name;
          const canDeleteRole = !r.isSystem && !EXCEL_ROLE_ORDER.includes(r.name);

          return (
            <div
              key={r.id}
              role="button"
              tabIndex={0}
              onClick={() => {
                setActiveRoleName(r.name);
                setViewMode('by-role');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setActiveRoleName(r.name);
                  setViewMode('by-role');
                }
              }}
              className={`relative p-3 rounded-2xl border bg-white text-left transition group cursor-pointer select-none ${
                isActiveRole
                  ? 'border-[var(--royal-primary)] bg-[#FBF6E8]/70 ring-1 ring-[var(--royal-primary)]/40 shadow-xs'
                  : isDirty
                    ? 'border-[#C59B27] ring-1 ring-[#C59B27]/40'
                    : 'border-[#E6E1D6] hover:border-[#C59B27]/70 hover:bg-[#FBF9F4]'
              }`}
            >
              <div className="flex items-start justify-between gap-1.5">
                <div className="text-xs font-extrabold text-[#1D232E] leading-tight break-words">
                  {getRoleFullLabel(r)}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {isDirty && (
                    <span
                      className="w-2 h-2 rounded-full bg-[#C59B27]"
                      title="Modifications non enregistrées"
                    />
                  )}
                  {r.name === 'ROOT' && (
                    <ShieldCheck className="w-3.5 h-3.5 text-[#B8860B]" />
                  )}
                  {canDeleteRole && (
                    <button
                      type="button"
                      title="Supprimer ce rôle personnalisé"
                      onClick={(e) => {
                        e.stopPropagation();
                        setRoleToDelete(r);
                      }}
                      className="p-1 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-2 flex items-baseline justify-between gap-2">
                <span className="text-sm font-black font-mono text-[#9A7414]">
                  {permCount}
                  <span className="text-[10px] font-normal text-slate-400">
                    /{totalPermissionsCount}
                  </span>
                </span>
                <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-slate-500">
                  {viewsCount !== undefined && (
                    <span className="inline-flex items-center gap-0.5 text-[#9A7414]">
                      <Eye className="w-3 h-3" />
                      {viewsCount}v
                    </span>
                  )}
                  <span className="inline-flex items-center gap-0.5">
                    <Users className="w-3 h-3 text-slate-400" />
                    {r.userCount ?? 0}
                  </span>
                </span>
              </div>

              <div className="mt-1.5 h-1 rounded-full bg-[#F4F5F7] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[var(--royal-primary)] transition-all duration-300"
                  style={{ width: `${Math.min(100, pct)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* 3A. VIEW MODE: MATRICE PAR MODULE */}
      {viewMode === 'matrix' && (
        <div className="flex flex-col lg:flex-row gap-4 items-start">
          {/* Left: Searchable Scrollable Modules Rail (Zero Clunky Pagination!) */}
          <aside className="w-full lg:w-52 shrink-0 bg-white rounded-3xl border border-[#E6E1D6] shadow-xs p-3 space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#1D232E] flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#C59B27]" />
                <span>Modules ({filteredModules.length})</span>
              </span>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#C59B27] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={moduleSearch}
                onChange={(e) => setModuleSearch(e.target.value)}
                placeholder="Rechercher un module..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#F8F9FA] border border-[#E6E1D6] text-xs text-[#1D232E] placeholder:text-slate-400 focus:outline-none focus:border-[#C59B27]"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 gap-1.5 max-h-52 lg:max-h-[560px] overflow-y-auto pr-0.5">
              {filteredModules.map((mod) => {
                const count = (groupedPerms[mod] || []).length;
                const active = selectedModule === mod;
                return (
                  <button
                    key={mod}
                    type="button"
                    onClick={() => setSelectedModule(mod)}
                    className={`w-full px-3 py-2 rounded-xl border text-left flex items-center justify-between gap-2 text-xs font-bold transition cursor-pointer ${
                      active
                        ? 'bg-[var(--royal-primary)] text-white border-[var(--royal-primary)] shadow-2xs'
                        : 'bg-[#FBF9F4] text-[#1D232E] border-[#E6E1D6] hover:border-[#C59B27]'
                    }`}
                  >
                    <span className="truncate">
                      <span className="block truncate">{formatModuleLabel(mod)}</span>
                      <span className="block text-[9.5px] font-mono opacity-75 truncate">{mod}</span>
                    </span>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full shrink-0 ${
                        active
                          ? 'bg-white/25 text-white'
                          : 'bg-white text-[#9A7414] border border-[#E6D6A6]'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Right: Active Module Permissions Matrix (Clean Fit on 1440px, Zero Clipping) */}
          <div className="flex-1 min-w-0 w-full bg-white rounded-3xl border border-[#E6E1D6] shadow-xs overflow-hidden">
            <div className="p-4 bg-[#FBF9F4] border-b border-[#E6E1D6] flex flex-col 2xl:flex-row 2xl:items-center justify-between gap-3">
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#9A7414] block">
                  Module Sélectionné ({selectedModule || '—'})
                </span>
                <h2 className="text-base font-heading font-black text-[#1D232E] flex items-center gap-2 flex-wrap">
                  <span>{selectedModule ? formatModuleLabel(selectedModule) : '—'}</span>
                  <span className="text-xs font-bold text-slate-500 whitespace-nowrap">
                    ({activeModulePerms.length} actions)
                  </span>
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Role Group Filter */}
                <div className="inline-flex p-0.5 rounded-xl bg-white border border-[#E6E1D6] text-[11px] font-bold">
                  {(
                    [
                      { id: 'ALL', label: `Tous (${roles.length})` },
                      { id: 'BACKOFFICE', label: 'Back-Office' },
                      { id: 'OPERATIONS', label: 'Boutique & Flotte' },
                    ] as const
                  ).map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setRoleGroupFilter(tab.id)}
                      className={`px-2.5 py-1 rounded-lg transition cursor-pointer whitespace-nowrap ${
                        roleGroupFilter === tab.id
                          ? 'bg-[#FBF6E8] text-[#9A7414]'
                          : 'text-slate-500 hover:text-[#1D232E]'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <input
                  type="text"
                  value={permSearch}
                  onChange={(e) => setPermSearch(e.target.value)}
                  placeholder="Filtrer action..."
                  className="px-3 py-1.5 rounded-xl bg-white border border-[#E6E1D6] text-xs w-36 focus:outline-none focus:border-[#C59B27]"
                />
                <div className="w-36">
                  <Select
                    value={selectedAction}
                    onChange={(e) => setSelectedAction(e.target.value)}
                    options={[
                      { value: 'ALL', label: 'Toutes actions' },
                      { value: 'create', label: 'Ajouter' },
                      { value: 'read_list', label: 'Liste' },
                      { value: 'read_detail', label: 'Détail ID' },
                      { value: 'update', label: 'Modifier' },
                      { value: 'delete', label: 'Supprimer' },
                      { value: 'manage', label: 'Gestion' },
                    ]}
                  />
                </div>
              </div>
            </div>

            {activeModulePerms.length === 0 ? (
              <div className="p-10 text-center text-xs text-slate-400">
                Aucune permission ne correspond à ce filtre dans « {selectedModule} ».
              </div>
            ) : (
              <>
                {/* Mobile / Tablet Card View (< md) */}
                <div className="md:hidden divide-y divide-slate-100">
                  {activeModulePerms.map((perm) => (
                    <div key={perm.id} className="p-4 space-y-3 text-xs">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 space-y-1">
                          <div className="text-xs font-bold text-[#1D232E]">
                            {formatPermissionFrenchTitle(selectedModule, perm.action, perm.actionTitleFr)}
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="font-mono text-[10px] text-slate-500 break-all">
                              {perm.code}
                            </span>
                            <Badge variant="warning" size="sm" className="whitespace-nowrap">
                              {ACTION_FRENCH_TITLES[perm.action] || perm.action}
                            </Badge>
                          </div>
                        </div>
                        <button
                          type="button"
                          title="Supprimer cette permission"
                          onClick={() => setPermToDelete(perm)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer shrink-0"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {visibleMatrixRoles.map((role) => {
                          const isRootCol = role.name === 'ROOT';
                          const checked = isRootCol || rolePermSets[role.name]?.has(perm.id);
                          return (
                            <button
                              key={`mob-${perm.id}-${role.id}`}
                              type="button"
                              disabled={isRootCol}
                              onClick={() => togglePermission(role.name, perm.id)}
                              className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center justify-between gap-1.5 border transition ${
                                checked
                                  ? isRootCol
                                    ? 'bg-[#1D232E] text-[#E6C86E] border-[#1D232E] cursor-not-allowed'
                                    : 'bg-[var(--royal-primary)] text-white border-[var(--royal-primary)] cursor-pointer'
                                  : 'bg-[#F8F9FA] text-slate-600 border-slate-200 cursor-pointer'
                              }`}
                            >
                              <span className="truncate">{getRoleFullLabel(role)}</span>
                              {checked ? (
                                <Check className="h-3 w-3 shrink-0" />
                              ) : (
                                <X className="h-3 w-3 shrink-0 opacity-50" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table View — Proportioned to Fit 1440px Without Clipping */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="bg-[#F8F9FA] border-b border-[#E6E1D6] text-[#1D232E] font-bold uppercase tracking-wider">
                      <tr>
                        <th className="px-3 py-2.5 w-[215px]">
                          <span>Permission</span>
                        </th>
                        {visibleMatrixRoles.map((r) => {
                          const isRootCol = r.name === 'ROOT';
                          const allCheckedForRole =
                            activeModulePerms.length > 0 &&
                            (isRootCol ||
                              activeModulePerms.every((p) => rolePermSets[r.name]?.has(p.id)));
                          return (
                            <th key={r.id} className="px-0.5 py-2 text-center w-10">
                              <button
                                type="button"
                                disabled={isRootCol}
                                title={
                                  isRootCol
                                    ? 'ROOT (Accès total verrouillé)'
                                    : `${getRoleFullLabel(r)} — Cliquer pour tout ${allCheckedForRole ? 'décocher' : 'cocher'} sur ${selectedModule}`
                                }
                                onClick={() => toggleModulePermsForRole(r.name, activeModulePerms)}
                                className={`w-full px-0.5 py-1 rounded-lg text-[9.5px] font-extrabold leading-tight transition flex flex-col items-center gap-0.5 ${
                                  isRootCol
                                    ? 'text-[#1D232E] cursor-default'
                                    : 'text-[#1D232E] hover:bg-[#FBF6E8] hover:text-[#9A7414] cursor-pointer'
                                }`}
                              >
                                <span className="whitespace-nowrap">{getRoleShortLabel(r)}</span>
                                {!isRootCol && (
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full ${
                                      allCheckedForRole ? 'bg-[var(--royal-primary)]' : 'bg-slate-200'
                                    }`}
                                  />
                                )}
                              </button>
                            </th>
                          );
                        })}
                        <th className="px-1 py-2 text-center w-9 text-[9.5px] text-slate-400">
                          Tous
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {activeModulePerms.map((perm) => {
                        const editableVisible = visibleMatrixRoles.filter((r) => r.name !== 'ROOT');
                        const rowAllChecked =
                          editableVisible.length > 0 &&
                          editableVisible.every((r) => rolePermSets[r.name]?.has(perm.id));

                        return (
                          <tr key={perm.id} className="hover:bg-[#FBF9F4]/80 transition-colors">
                            <td className="px-3 py-2.5 max-w-[260px]">
                              <div className="flex items-start gap-1.5 min-w-0">
                                <div className="min-w-0 flex-1">
                                  <div className="font-bold text-[#1D232E] text-[11px] leading-snug">
                                    {formatPermissionFrenchTitle(
                                      selectedModule,
                                      perm.action,
                                      perm.actionTitleFr,
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                                    <span className="font-mono text-[10px] text-slate-400 truncate">
                                      {perm.code}
                                    </span>
                                    <Badge variant="warning" size="sm" className="whitespace-nowrap shrink-0">
                                      {ACTION_FRENCH_TITLES[perm.action] || perm.action}
                                    </Badge>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  title="Supprimer cette permission"
                                  onClick={() => setPermToDelete(perm)}
                                  className="p-1 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer ml-auto shrink-0"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            </td>

                            {visibleMatrixRoles.map((role) => {
                              const isRootCol = role.name === 'ROOT';
                              const checked = isRootCol || rolePermSets[role.name]?.has(perm.id);
                              return (
                                <td key={`${perm.id}-${role.id}`} className="px-0.5 py-2 text-center">
                                  <button
                                    type="button"
                                    disabled={isRootCol}
                                    aria-label={`${perm.code} — ${getRoleFullLabel(role)}`}
                                    title={`${getRoleFullLabel(role)} : ${perm.code}`}
                                    onClick={() => togglePermission(role.name, perm.id)}
                                    className={`w-6 h-6 rounded-lg inline-flex items-center justify-center transition ${
                                      checked
                                        ? isRootCol
                                          ? 'bg-[#1D232E] text-[#E6C86E] cursor-not-allowed'
                                          : 'bg-[var(--royal-primary)] text-white cursor-pointer shadow-2xs hover:bg-[var(--royal-primary-hover)]'
                                        : 'bg-[#F4F5F7] text-slate-300 hover:text-slate-600 hover:border-[#C59B27]/50 cursor-pointer border border-slate-200'
                                    }`}
                                  >
                                    {checked ? (
                                      isRootCol ? (
                                        <ShieldCheck className="h-3 w-3" />
                                      ) : (
                                        <Check className="h-3 w-3" />
                                      )
                                    ) : (
                                      <X className="h-2.5 w-2.5" />
                                    )}
                                  </button>
                                </td>
                              );
                            })}

                            <td className="px-1 py-2 text-center">
                              <button
                                type="button"
                                title={
                                  rowAllChecked
                                    ? 'Retirer cette permission aux rôles affichés'
                                    : 'Attribuer cette permission à tous les rôles affichés'
                                }
                                onClick={() => togglePermAcrossVisibleRoles(perm.id, visibleMatrixRoles)}
                                className="p-1 rounded-lg text-slate-400 hover:text-[#9A7414] hover:bg-[#FBF6E8] transition cursor-pointer"
                              >
                                {rowAllChecked ? (
                                  <CheckSquare className="w-3.5 h-3.5 text-[var(--royal-primary)]" />
                                ) : (
                                  <Square className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* 3B. VIEW MODE: STUDIO FACILE PAR RÔLE & VUES DYNAMIQUES */}
      {viewMode === 'by-role' && selectedRoleObj && (
        <RoleStudioPanel
          role={selectedRoleObj}
          roleDisplayName={getRoleFullLabel(selectedRoleObj)}
          roleDescription={cleanUtf8Label(selectedRoleObj.description)}
          groupedPerms={groupedPerms}
          permissionViews={permissionViews}
          rolePermSet={rolePermSets[selectedRoleObj.name] || new Set<string>()}
          roleViews={roleViewsMap[selectedRoleObj.name] || ['/dashboard']}
          visibilityMap={visibilityMap}
          actionLabels={ACTION_FRENCH_TITLES}
          onTogglePermission={(permId) => togglePermission(selectedRoleObj.name, permId)}
          onSetModulePerms={(permIds, enabled) =>
            setModulePermissionsForRole(selectedRoleObj.name, permIds, enabled)
          }
          onSetRoleState={(permIds, views) =>
            setRolePermissionsAndViews(selectedRoleObj.name, permIds, views)
          }
          onToggleViewRoute={(routePath) =>
            toggleViewRouteForRole(selectedRoleObj.name, routePath)
          }
          onToggleViewSection={(paths, enableAll) =>
            toggleViewSectionForRole(selectedRoleObj.name, paths, enableAll)
          }
        />
      )}

      {/* Modals */}
      <Modal
        isOpen={showRoleModal}
        onClose={() => setShowRoleModal(false)}
        title="Créer un Nouveau Rôle & Assigner ses Vues"
        type="create"
        size="xl"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowRoleModal(false)}>
              Annuler
            </Button>
            <Button
              variant="gold"
              size="sm"
              isLoading={savingRole}
              onClick={async () => {
                if (!roleForm.name.trim() || !roleForm.displayName.trim()) {
                  setToastType('error');
                  setToastMsg('Code technique et nom affiché obligatoires.');
                  return;
                }
                setSavingRole(true);
                try {
                  const normalizedCode = roleForm.name.trim().toUpperCase().replace(/\s+/g, '_');
                  const createdRes = await fetchApi('/roles', {
                    method: 'POST',
                    body: JSON.stringify({
                      name: normalizedCode,
                      displayName: roleForm.displayName.trim(),
                      description: roleForm.description.trim() || undefined,
                    }),
                  });
                  const createdRoleId = createdRes?.id || createdRes?.data?.id;
                  if (createdRoleId && roleForm.preset !== 'NONE') {
                    const presetState = applyPresetToRoleState(
                      roleForm.preset,
                      groupedPerms,
                      new Set<string>(),
                      roleForm.views,
                    );
                    const permIds = Array.from(presetState.permIds);
                    if (permIds.length > 0) {
                      await fetchApi(`/roles/${createdRoleId}/permissions`, {
                        method: 'POST',
                        body: JSON.stringify({ permissionIds: permIds }),
                      });
                    }
                  }
                  const nextViewsMap = {
                    ...roleViewsMap,
                    [normalizedCode]: Array.from(new Set(['/dashboard', ...roleForm.views])),
                  };
                  await fetchApi('/storefront-cms/sys-config/roleViews', {
                    method: 'PUT',
                    body: JSON.stringify({ value: nextViewsMap }),
                  });
                  if (typeof window !== 'undefined') {
                    window.dispatchEvent(
                      new CustomEvent('royal:role-views-updated', { detail: nextViewsMap }),
                    );
                  }
                  setShowRoleModal(false);
                  setRoleForm({
                    name: '',
                    displayName: '',
                    description: '',
                    preset: 'NONE',
                    views: ['/dashboard'],
                  });
                  setActiveRoleName(normalizedCode);
                  setViewMode('by-role');
                  setToastType('success');
                  setToastMsg(`Rôle "${normalizedCode}" créé avec ses vues Dashboard.`);
                  await loadMatrix();
                } catch (e: any) {
                  setToastType('error');
                  setToastMsg(e?.message || 'Impossible de créer le rôle.');
                } finally {
                  setSavingRole(false);
                }
              }}
            >
              Enregistrer le Rôle &amp; Vues
            </Button>
          </div>
        }
      >
        <div className="p-6 space-y-5 overflow-x-hidden">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                Code technique (ex: LIVREUR_PRO)
              </label>
              <input
                type="text"
                value={roleForm.name}
                onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value.toUpperCase() })}
                placeholder="ASSISTANTE_MARKETING"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8F9FA] border border-[#E6E1D6] text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                Libellé affiché
              </label>
              <input
                type="text"
                value={roleForm.displayName}
                onChange={(e) => setRoleForm({ ...roleForm, displayName: e.target.value })}
                placeholder="Assistante Marketing"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8F9FA] border border-[#E6E1D6] text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                Modèle de permissions initial
              </label>
              <Select
                value={roleForm.preset}
                onChange={(e) => {
                  const preset = e.target.value as 'NONE' | RolePresetId;
                  if (preset === 'NONE') {
                    setRoleForm({ ...roleForm, preset: 'NONE' });
                  } else {
                    const next = applyPresetToRoleState(
                      preset,
                      groupedPerms,
                      new Set<string>(),
                      roleForm.views,
                    );
                    setRoleForm({ ...roleForm, preset, views: next.views });
                  }
                }}
                options={[
                  { value: 'NONE', label: 'Rôle vierge (configuration manuelle ensuite)' },
                  { value: 'MARKETING_FULL', label: 'Pack Marketing (Catalogue sans Supprimer + Communauté sans Support + Client)' },
                  { value: 'CATALOG_NO_DELETE', label: 'Catalogue uniquement (sans Suppression)' },
                  { value: 'COMMUNITY_NO_SUPPORT', label: 'Communauté (Notifications & Contact sans Support)' },
                  { value: 'CLIENT_SPACE', label: 'Espace Client Standard' },
                ]}
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                Description
              </label>
              <input
                type="text"
                value={roleForm.description}
                onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                placeholder="Périmètre d'action du rôle..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8F9FA] border border-[#E6E1D6] text-xs"
              />
            </div>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <label className="text-[11px] font-bold uppercase text-slate-600">
                Vues Dashboard accessibles à ce rôle ({roleForm.views.length} sélectionnées)
              </label>
              <button
                type="button"
                onClick={() => setRoleForm({ ...roleForm, views: ['/dashboard'] })}
                className="text-[11px] font-bold text-[#9A7414] hover:underline cursor-pointer"
              >
                Tout décocher
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-60 overflow-y-auto p-2 rounded-2xl bg-[#FBF9F4] border border-[#E6E1D6]">
              {DASHBOARD_VIEW_SECTIONS.map((sec) => {
                const paths = sec.routes.map((r) => r.path);
                const selectedCount = paths.filter((p) => roleForm.views.includes(p)).length;
                const allSelected = paths.length > 0 && selectedCount === paths.length;
                return (
                  <div
                    key={sec.id}
                    className="p-2.5 rounded-xl bg-white border border-[#E6E1D6] space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2 pb-1 border-b border-slate-100">
                      <span className="text-[11px] font-black text-[#1D232E] truncate">
                        {sec.label}
                      </span>
                      <Toggle
                        compact
                        size="sm"
                        checked={allSelected}
                        onChange={() => {
                          const current = new Set(roleForm.views);
                          paths.forEach((p) => {
                            if (allSelected) current.delete(p);
                            else current.add(p);
                          });
                          setRoleForm({ ...roleForm, views: Array.from(current) });
                        }}
                      />
                    </div>
                    <div className="space-y-1">
                      {sec.routes.map((r) => {
                        const checked = roleForm.views.includes(r.path);
                        return (
                          <label
                            key={r.path}
                            className="flex items-center justify-between gap-2 text-[11px] text-slate-600 cursor-pointer"
                          >
                            <span className="truncate">{r.label}</span>
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => {
                                const current = new Set(roleForm.views);
                                if (current.has(r.path)) current.delete(r.path);
                                else current.add(r.path);
                                setRoleForm({ ...roleForm, views: Array.from(current) });
                              }}
                              className="rounded border-slate-300 text-[#C59B27] focus:ring-[#C59B27]"
                            />
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showPermModal}
        onClose={() => setShowPermModal(false)}
        title="Ajouter une Permission Module"
        type="create"
        size="lg"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowPermModal(false)}>
              Annuler
            </Button>
            <Button
              variant="gold"
              size="sm"
              isLoading={savingPerm}
              onClick={async () => {
                if (!permForm.code.trim() || !permForm.resource.trim()) {
                  setToastType('error');
                  setToastMsg('Code et module requis.');
                  return;
                }
                setSavingPerm(true);
                try {
                  await fetchApi('/permissions', {
                    method: 'POST',
                    body: JSON.stringify({
                      module: permForm.resource.trim(),
                      resource: permForm.resource.trim(),
                      action: permForm.action.trim(),
                      description: permForm.description.trim() || permForm.code.trim(),
                    }),
                  });
                  setShowPermModal(false);
                  setToastType('success');
                  setToastMsg(`Permission ${permForm.code} ajoutée et attribuée à ROOT.`);
                  await loadMatrix();
                } catch (e: any) {
                  setToastType('error');
                  setToastMsg(e?.message || 'Erreur création permission.');
                } finally {
                  setSavingPerm(false);
                }
              }}
            >
              Créer la Permission
            </Button>
          </div>
        }
      >
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                Module / Ressource
              </label>
              <input
                type="text"
                value={permForm.resource}
                onChange={(e) => setPermForm({ ...permForm, resource: e.target.value })}
                placeholder="orders"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8F9FA] border border-[#E6E1D6] text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                Action
              </label>
              <Select
                value={permForm.action}
                onChange={(e) => setPermForm({ ...permForm, action: e.target.value })}
                options={[
                  { value: 'create', label: 'create (Ajouter)' },
                  { value: 'read_list', label: 'read_list (Liste)' },
                  { value: 'read_detail', label: 'read_detail (Détail)' },
                  { value: 'update', label: 'update (Modifier)' },
                  { value: 'delete', label: 'delete (Supprimer)' },
                  { value: 'manage', label: 'manage (Gestion)' },
                ]}
              />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
              Code Permission
            </label>
            <input
              type="text"
              value={permForm.code}
              onChange={(e) => setPermForm({ ...permForm, code: e.target.value })}
              placeholder="orders.export"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8F9FA] border border-[#E6E1D6] text-xs font-mono"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
              Description
            </label>
            <input
              type="text"
              value={permForm.description}
              onChange={(e) => setPermForm({ ...permForm, description: e.target.value })}
              placeholder="Autorise l'exportation des documents..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8F9FA] border border-[#E6E1D6] text-xs"
            />
          </div>
        </div>
      </Modal>

      <DeleteConfirmModal
        isOpen={!!roleToDelete}
        onClose={() => setRoleToDelete(null)}
        onConfirm={handleConfirmDeleteRole}
        itemName={roleToDelete ? getRoleFullLabel(roleToDelete) : ''}
        isDeleting={deletingRole}
      />

      <DeleteConfirmModal
        isOpen={!!permToDelete}
        onClose={() => setPermToDelete(null)}
        onConfirm={handleConfirmDeletePerm}
        itemName={permToDelete?.code || ''}
        isDeleting={deletingPerm}
      />

      <ViewGuideModal
        isOpen={guideOpen}
        onClose={() => setGuideOpen(false)}
        title="Guide Rôles & Permissions RBAC"
        subtitle="Pilotage des droits d'accès par module ou par profil"
        steps={RBAC_GUIDE_STEPS}
        currentIndex={guideIndex}
        onStepChange={setGuideIndex}
      />

      <Toast
        isOpen={!!toastMsg}
        message={toastMsg || ''}
        type={toastType}
        onClose={() => setToastMsg(null)}
      />
    </div>
  );
}
