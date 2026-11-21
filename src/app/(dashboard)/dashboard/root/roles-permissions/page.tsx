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
  ChevronLeft,
  ChevronRight,
  Layers,
  Plus,
  Trash2,
} from 'lucide-react';
import { Button, Badge, Breadcrumb, Toast, Select, Modal } from '@/components/ui';
import { fetchApi } from '@/lib/api';

interface ApiRole {
  id: string;
  name: string;
  displayName: string;
  isSystem?: boolean;
}

interface ApiPermission {
  id: string;
  code: string;
  resource: string;
  action: string;
  description?: string | null;
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
  'CLIENT',
];

const ROLE_LABELS: Record<string, string> = {
  ROOT: 'ROOT',
  SUPER_ADMIN: 'Super Admin',
  WEBSITE_MANAGER: 'Website Mgr',
  STOCK_MANAGER: 'Magasiniers',
  CASHIER: 'Caissiers',
  SALESPERSON: 'Vendeurs',
  ACCOUNTANT: 'Financiers',
  COMMERCIAL: 'Commercial',
  CLIENT: 'Clients',
};

const ACTION_LABELS: Record<string, string> = {
  create: 'Ajouter',
  read_list: 'Liste',
  read_detail: 'Détail ID',
  update: 'Modifier',
  delete: 'Supprimer',
  read: 'Lecture',
  manage: 'Gestion',
  adjust: 'Ajuster',
  reserve: 'Réserver',
  operate: 'Opérer',
  'permissions.assign': 'Assigner',
};

export default function RolesPermissionsPage() {
  const [roles, setRoles] = React.useState<ApiRole[]>([]);
  const [groupedPerms, setGroupedPerms] = React.useState<Record<string, ApiPermission[]>>({});
  const [rolePermSets, setRolePermSets] = React.useState<Record<string, Set<string>>>({});
  const [dirtyRoles, setDirtyRoles] = React.useState<Set<string>>(new Set());

  const [selectedModule, setSelectedModule] = React.useState<string>('');
  const [moduleSearch, setModuleSearch] = React.useState('');
  const [permSearch, setPermSearch] = React.useState('');
  const [selectedAction, setSelectedAction] = React.useState<string>('ALL');

  const [modPage, setModPage] = React.useState(1);
  const modsPerPage = 12;

  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [toastMsg, setToastMsg] = React.useState<string | null>(null);
  const [toastType, setToastType] = React.useState<'success' | 'info' | 'error'>('success');

  // Dynamic Role & Permission CRUD modals
  const [showRoleModal, setShowRoleModal] = React.useState(false);
  const [roleForm, setRoleForm] = React.useState({ name: '', displayName: '', description: '' });
  const [savingRole, setSavingRole] = React.useState(false);

  const [showPermModal, setShowPermModal] = React.useState(false);
  const [permForm, setPermForm] = React.useState({ resource: '', action: 'read_list', code: '', description: '' });
  const [savingPerm, setSavingPerm] = React.useState(false);

  const loadMatrix = React.useCallback(async () => {
    setLoading(true);
    try {
      const [rolesRes, permsRes] = await Promise.all([
        fetchApi('/roles'),
        fetchApi('/permissions'),
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

      const permModules: Record<string, ApiPermission[]> = permsRes?.modules || permsRes?.data?.modules || {};
      setGroupedPerms(permModules);
      const firstMod = Object.keys(permModules).sort()[0] || '';
      setSelectedModule((prev) => (prev && permModules[prev] ? prev : firstMod));

      const detailResponses = await Promise.all(
        sortedRoles.map((r) => fetchApi(`/roles/${r.id}`).catch(() => null))
      );

      const sets: Record<string, Set<string>> = {};
      sortedRoles.forEach((role, idx) => {
        const det = detailResponses[idx]?.data || detailResponses[idx];
        sets[role.name] = new Set<string>(
          Array.isArray(det?.permissions) ? det.permissions.map((p: any) => p.id) : []
        );
      });
      setRolePermSets(sets);
      setDirtyRoles(new Set());
    } catch (err: any) {
      setToastType('error');
      setToastMsg(err?.message || 'Impossible de charger la matrice RBAC.');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadMatrix();
  }, [loadMatrix]);

  const togglePermission = (roleName: string, permId: string) => {
    if (roleName === 'ROOT') return;
    setRolePermSets((prev) => {
      const next = { ...prev };
      const current = new Set(next[roleName] || []);
      if (current.has(permId)) current.delete(permId);
      else current.add(permId);
      next[roleName] = current;
      return next;
    });
    setDirtyRoles((prev) => {
      const next = new Set(prev);
      next.add(roleName);
      return next;
    });
  };

  const handleSaveAll = async () => {
    const rolesToSave = roles.filter((r) => r.name !== 'ROOT' && dirtyRoles.has(r.name));
    if (rolesToSave.length === 0) {
      setToastType('info');
      setToastMsg('Aucune modification en attente.');
      return;
    }

    setSaving(true);
    try {
      for (const role of rolesToSave) {
        const permIds = Array.from(rolePermSets[role.name] || []);
        await fetchApi(`/roles/${role.id}/permissions`, {
          method: 'POST',
          body: JSON.stringify({ permissionIds: permIds }),
        });
      }
      setDirtyRoles(new Set());
      setToastType('success');
      setToastMsg(`${rolesToSave.length} rôle(s) mis à jour dans PostgreSQL.`);
      await loadMatrix();
    } catch (err: any) {
      setToastType('error');
      setToastMsg(err?.message || 'Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  const filteredModules = React.useMemo(() => {
    const q = moduleSearch.trim().toLowerCase();
    return Object.keys(groupedPerms)
      .sort((a, b) => a.localeCompare(b))
      .filter((m) => !q || m.toLowerCase().includes(q));
  }, [groupedPerms, moduleSearch]);

  const totalModPages = Math.max(1, Math.ceil(filteredModules.length / modsPerPage));
  const pagedModules = filteredModules.slice((modPage - 1) * modsPerPage, modPage * modsPerPage);

  const activeModulePerms = React.useMemo(() => {
    const list = selectedModule ? groupedPerms[selectedModule] || [] : [];
    const q = permSearch.trim().toLowerCase();
    return list.filter((p) => {
      if (selectedAction !== 'ALL' && p.action !== selectedAction) return false;
      if (q && !p.code.toLowerCase().includes(q) && !(p.description || '').toLowerCase().includes(q)) return false;
      return true;
    });
  }, [selectedModule, groupedPerms, permSearch, selectedAction]);

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <div className="bg-white p-6 rounded-3xl border border-[#E6E1D6] shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#FBF6E8] text-[#B8860B] border border-[#E6D6A6] rounded-2xl shadow-xs">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-heading font-black text-[#1D232E] tracking-tight">
                Rôles &amp; Permissions CRUD (Vue Split Module par Module)
              </h1>
              <p className="text-xs text-slate-500">
                Sélectionnez un module à gauche pour piloter finement les 9 profils Royal (Ajouter, Liste, Détail ID, Modifier, Supprimer).
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
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
            <Button
              variant="gold"
              size="sm"
              onClick={handleSaveAll}
              isLoading={saving}
              disabled={dirtyRoles.size === 0}
            >
              <Save className="h-3.5 w-3.5" />
              <span>Enregistrer {dirtyRoles.size > 0 ? `(${dirtyRoles.size})` : ''}</span>
            </Button>
          </div>
        </div>
        <div className="pt-2 border-t border-slate-100">
          <Breadcrumb
            items={[
              { label: 'Système', href: '/dashboard' },
              { label: 'Rôles et permissions (Mode Split par Module)' },
            ]}
          />
        </div>
      </div>

      {/* Role Summary Strip */}
      <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2.5">
        {roles.map((r) => (
          <div
            key={r.id}
            className={`relative p-2.5 rounded-2xl border bg-white text-center group ${
              dirtyRoles.has(r.name) ? 'border-[#C59B27] ring-1 ring-[#C59B27]/40' : 'border-[#E6E1D6]'
            }`}
          >
            {!EXCEL_ROLE_ORDER.includes(r.name) && (
              <button
                type="button"
                title="Supprimer ce rôle personnalisé"
                onClick={async () => {
                  try {
                    await fetchApi(`/roles/${r.id}`, { method: 'DELETE' });
                    setToastType('success');
                    setToastMsg(`Rôle "${r.displayName}" supprimé.`);
                    await loadMatrix();
                  } catch (e: any) {
                    setToastType('error');
                    setToastMsg(e?.message || 'Impossible de supprimer le rôle.');
                  }
                }}
                className="absolute top-1.5 right-1.5 p-1 rounded-lg text-slate-300 hover:text-red-600 hover:bg-red-50 transition opacity-0 group-hover:opacity-100 cursor-pointer"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            )}
            <div className="text-[11px] font-extrabold text-[#1D232E] truncate">
              {ROLE_LABELS[r.name] || r.displayName}
            </div>
            <div className="text-sm font-black font-mono text-[#9A7414]">
              {rolePermSets[r.name]?.size || 0}
            </div>
          </div>
        ))}
      </div>

      {/* SPLIT VIEW: Modules List (Left) + Module Matrix (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Paginated Modules List */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-[#E6E1D6] shadow-sm p-4 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#1D232E] flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-[#C59B27]" />
              <span>Modules ({filteredModules.length})</span>
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              Page {modPage}/{totalModPages}
            </span>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#C59B27] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={moduleSearch}
              onChange={(e) => {
                setModuleSearch(e.target.value);
                setModPage(1);
              }}
              placeholder="Filtrer module..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#F4F5F7] border border-[#E6E1D6] text-xs"
            />
          </div>

          <div className="space-y-1.5">
            {pagedModules.map((mod) => {
              const count = (groupedPerms[mod] || []).length;
              const active = selectedModule === mod;
              return (
                <button
                  key={mod}
                  type="button"
                  onClick={() => setSelectedModule(mod)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-left flex items-center justify-between text-xs font-bold transition cursor-pointer ${
                    active
                      ? 'bg-[var(--royal-primary)] text-white border-[var(--royal-primary)] shadow-xs'
                      : 'bg-[#FBF9F4] text-[#1D232E] border-[#E6E1D6] hover:border-[#C59B27]'
                  }`}
                >
                  <span className="truncate">{mod}</span>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                      active ? 'bg-white/25 text-white' : 'bg-white text-[#9A7414] border border-[#E6D6A6]'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Module Pagination */}
          {totalModPages > 1 && (
            <div className="flex items-center justify-between pt-2 border-t border-[#E6E1D6]">
              <button
                type="button"
                disabled={modPage <= 1}
                onClick={() => setModPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-[#E6E1D6] disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-[11px] font-bold text-slate-500">
                {modPage} / {totalModPages}
              </span>
              <button
                type="button"
                disabled={modPage >= totalModPages}
                onClick={() => setModPage((p) => Math.min(totalModPages, p + 1))}
                className="p-1.5 rounded-lg border border-[#E6E1D6] disabled:opacity-40 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Right: Active Module Permissions Matrix */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-[#E6E1D6] shadow-sm overflow-hidden">
          <div className="p-4 bg-[#FBF9F4] border-b border-[#E6E1D6] flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#9A7414] block">
                Module Sélectionné
              </span>
              <h2 className="text-base font-heading font-black text-[#1D232E]">
                {selectedModule || '—'} ({activeModulePerms.length} actions)
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={permSearch}
                onChange={(e) => setPermSearch(e.target.value)}
                placeholder="Filtrer action..."
                className="px-3 py-2 rounded-xl bg-white border border-[#E6E1D6] text-xs w-40"
              />
              <div className="w-44">
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
                  ]}
                />
              </div>
            </div>
          </div>

          {/* Mobile / Tablet Liste View */}
          <div className="md:hidden divide-y divide-slate-100">
            {activeModulePerms.map((perm) => (
              <div key={perm.id} className="p-4 space-y-3 text-xs">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-mono font-bold text-[#1D232E]">{perm.code}</span>
                      <Badge variant="warning" size="sm">
                        {ACTION_LABELS[perm.action] || perm.action}
                      </Badge>
                    </div>
                    {perm.description && (
                      <div className="text-[10px] text-slate-400 mt-0.5">{perm.description}</div>
                    )}
                  </div>
                  <button
                    type="button"
                    title="Supprimer cette permission"
                    onClick={async () => {
                      try {
                        await fetchApi(`/permissions/${perm.id}`, { method: 'DELETE' });
                        setToastType('success');
                        setToastMsg(`Permission ${perm.code} supprimée.`);
                        await loadMatrix();
                      } catch (e: any) {
                        setToastType('error');
                        setToastMsg(e?.message || 'Suppression impossible.');
                      }
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer shrink-0"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {roles.map((role) => {
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
                            : 'bg-[#F4F5F7] text-slate-600 border-slate-200 cursor-pointer'
                        }`}
                      >
                        <span className="truncate">{ROLE_LABELS[role.name] || role.displayName}</span>
                        {checked ? <Check className="h-3 w-3 shrink-0" /> : <X className="h-3 w-3 shrink-0 opacity-50" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#F4F5F7] border-b border-[#E6E1D6] text-[#1D232E] font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 min-w-[200px]">Permission</th>
                  {roles.map((r) => (
                    <th key={r.id} className="px-2 py-3 text-center text-[10px]">
                      {ROLE_LABELS[r.name] || r.displayName}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeModulePerms.map((perm) => (
                  <tr key={perm.id} className="hover:bg-[#FBF9F4]/60">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[#1D232E]">{perm.code}</span>
                        <Badge variant="warning" size="sm">
                          {ACTION_LABELS[perm.action] || perm.action}
                        </Badge>
                        <button
                          type="button"
                          title="Supprimer cette permission"
                          onClick={async () => {
                            try {
                              await fetchApi(`/permissions/${perm.id}`, { method: 'DELETE' });
                              setToastType('success');
                              setToastMsg(`Permission ${perm.code} supprimée.`);
                              await loadMatrix();
                            } catch (e: any) {
                              setToastType('error');
                              setToastMsg(e?.message || 'Suppression impossible.');
                            }
                          }}
                          className="p-1 rounded-lg text-slate-300 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                      {perm.description && (
                        <div className="text-[10px] text-slate-400 mt-0.5">{perm.description}</div>
                      )}
                    </td>
                    {roles.map((role) => {
                      const isRootCol = role.name === 'ROOT';
                      const checked = isRootCol || rolePermSets[role.name]?.has(perm.id);
                      return (
                        <td key={`${perm.id}-${role.id}`} className="px-2 py-3 text-center">
                          <button
                            type="button"
                            disabled={isRootCol}
                            onClick={() => togglePermission(role.name, perm.id)}
                            className={`w-7 h-7 rounded-xl inline-flex items-center justify-center transition ${
                              checked
                                ? isRootCol
                                  ? 'bg-[#1D232E] text-[#E6C86E] cursor-not-allowed'
                                  : 'bg-[var(--royal-primary)] text-white cursor-pointer shadow-2xs'
                                : 'bg-[#F4F5F7] text-slate-300 hover:text-slate-600 cursor-pointer border border-slate-200'
                            }`}
                          >
                            {checked ? (
                              isRootCol ? <ShieldCheck className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />
                            ) : (
                              <X className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Modal
        isOpen={showRoleModal}
        onClose={() => setShowRoleModal(false)}
        title="Créer un Nouveau Rôle RBAC"
        type="create"
        size="lg"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowRoleModal(false)}>Annuler</Button>
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
                  await fetchApi('/roles', {
                    method: 'POST',
                    body: JSON.stringify({
                      name: roleForm.name.trim().toUpperCase().replace(/\s+/g, '_'),
                      displayName: roleForm.displayName.trim(),
                      description: roleForm.description.trim() || undefined,
                    }),
                  });
                  setShowRoleModal(false);
                  setRoleForm({ name: '', displayName: '', description: '' });
                  setToastType('success');
                  setToastMsg('Nouveau rôle enregistré dans PostgreSQL.');
                  await loadMatrix();
                } catch (e: any) {
                  setToastType('error');
                  setToastMsg(e?.message || 'Impossible de créer le rôle.');
                } finally {
                  setSavingRole(false);
                }
              }}
            >
              Enregistrer le Rôle
            </Button>
          </div>
        }
      >
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Code technique (ex: LIVREUR_PRO)</label>
            <input
              type="text"
              value={roleForm.name}
              onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value.toUpperCase() })}
              placeholder="SUPERVISEUR_SHOWROOM"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#F4F5F7] border border-[#E6E1D6] text-xs font-mono"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Libellé affiché</label>
            <input
              type="text"
              value={roleForm.displayName}
              onChange={(e) => setRoleForm({ ...roleForm, displayName: e.target.value })}
              placeholder="Superviseur Showroom"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#F4F5F7] border border-[#E6E1D6] text-xs"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Description</label>
            <textarea
              rows={2}
              value={roleForm.description}
              onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
              placeholder="Périmètre d'action du rôle..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#F4F5F7] border border-[#E6E1D6] text-xs"
            />
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
            <Button variant="outline" size="sm" onClick={() => setShowPermModal(false)}>Annuler</Button>
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Module / Ressource</label>
              <input
                type="text"
                value={permForm.resource}
                onChange={(e) => setPermForm({ ...permForm, resource: e.target.value })}
                placeholder="orders"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F4F5F7] border border-[#E6E1D6] text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Action</label>
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
            <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Code Permission</label>
            <input
              type="text"
              value={permForm.code}
              onChange={(e) => setPermForm({ ...permForm, code: e.target.value })}
              placeholder="orders.export"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#F4F5F7] border border-[#E6E1D6] text-xs font-mono"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Description</label>
            <input
              type="text"
              value={permForm.description}
              onChange={(e) => setPermForm({ ...permForm, description: e.target.value })}
              placeholder="Autorise l'exportation des documents..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#F4F5F7] border border-[#E6E1D6] text-xs"
            />
          </div>
        </div>
      </Modal>

      <Toast isOpen={!!toastMsg} message={toastMsg || ''} type={toastType} onClose={() => setToastMsg(null)} />
    </div>
  );
}
