'use client';

import * as React from 'react';
import {
  Users,
  Plus,
  Edit3,
  Trash2,
  Eye,
  EyeOff,
  Mail,
  Phone,
  RefreshCw,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Calendar,
  KeyRound,
  Dices,
  Warehouse,
  Store,
  CreditCard,
  Search,
  Check,
  MapPin,
} from 'lucide-react';
import {
  DataTable,
  ColumnDef,
  Button,
  Badge,
  Modal,
  Toast,
  Breadcrumb,
  DeleteConfirmModal,
  Toggle,
  Select,
  GuideInfoButton,
  ViewGuideModal,
  ViewGuideStep,
} from '@/components/ui';
import { fetchApi, fetchAllPaginated } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';

export interface RoleOption {
  id: string;
  name: string;
  displayName?: string;
}

export interface WarehouseOption {
  id: string;
  name: string;
  code: string;
  city?: string | null;
  isDefault?: boolean;
}

export interface ShowroomOption {
  id: string;
  name: string;
  code: string;
  address?: string | null;
}

export interface CashRegisterOption {
  id: string;
  name: string;
  posId: string;
  posName?: string;
  hasActiveSession?: boolean;
}

export interface RoleUserItem {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  isActive: boolean;
  isEmailVerified?: boolean;
  lastLoginAt?: string | null;
  createdAt: string;
  roles?: string[];
  roleDetails?: Array<{
    id?: string;
    name: string;
    displayName?: string;
    warehouse?: { id: string; name: string; code: string } | null;
    pos?: { id: string; name: string; code: string } | null;
  }>;
  userRoles?: Array<{ role?: { id?: string; name: string; displayName?: string } }>;
  warehouseIds?: string[];
  posIds?: string[];
  cashRegisterIds?: string[];
  assignedWarehouses?: Array<{ id: string; name: string; code: string }>;
  assignedShowrooms?: Array<{ id: string; name: string; code: string }>;
  assignedCashRegisters?: Array<{ id: string; name: string; posId: string; posName?: string }>;
}

interface RoleUsersDirectoryProps {
  roleCode: string; // Use 'ALL' to list all users across all roles
  title: string;
  subtitle: string;
  breadcrumbParent?: { label: string; href: string };
  breadcrumbLabel: string;
  singularLabel: string;
  printTitle: string;
}

const ROLE_ALIAS_MAP: Record<string, string> = {
  SUPERADMIN: 'SUPER_ADMIN',
  CAISSIER: 'CASHIER',
  MAGASINIER: 'STOCK_MANAGER',
  VENDEUR: 'SALESPERSON',
  FINANCIER: 'ACCOUNTANT',
  WEBSITE_MANAGER: 'WEBSITE_MANAGER',
  ADMIN: 'ADMIN',
  COMMERCIAL: 'COMMERCIAL',
  DELIVERY_MANAGER: 'DELIVERY_MANAGER',
  DELIVERY_AGENT: 'DELIVERY_AGENT',
  CLIENT: 'CLIENT',
};

const USERS_GUIDE_STEPS: ViewGuideStep[] = [
  {
    id: 'users-crud',
    number: '01',
    title: 'Création & Édition Contextuelles des Comptes',
    description:
      'Dans les vues par rôle, le rôle est pré-assigné automatiquement sans liste déroulante inutile. Sur « Tous les utilisateurs », la sélection du rôle révèle dynamiquement les champs d’affectation.',
    fields: [
      {
        label: 'Affectations multi-sites par métier',
        steps: [
          'Magasiniers : sélection multiple des Dépôts / Entrepôts gérés.',
          'Caissiers : sélection multiple des Caisses enregistreuses POS.',
          'Vendeurs : sélection multiple des Showrooms / Salles d’exposition.',
        ],
      },
    ],
  },
  {
    id: 'users-reset',
    number: '02',
    title: 'Mot de Passe & Réinitialisation E-Mail SMTP',
    description:
      'Définissez ou modifiez le mot de passe directement dans la modale unifiée, ou cliquez sur la clé pour générer et envoyer un nouveau mot de passe par e-mail.',
    fields: [
      {
        label: 'Sécurité des sessions',
        steps: [
          'En modification, laissez le champ vide pour conserver le mot de passe actuel.',
          'La réinitialisation système envoie un nouveau mot de passe via SMTP puis révoque les sessions actives.',
        ],
      },
    ],
  },
];

function generateSecurePassword(prefix = 'Ryl-'): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
  let pass = prefix;
  for (let i = 0; i < 10; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pass;
}

function getPrimaryRoleName(item: RoleUserItem, fallbackRole: string): string {
  if (Array.isArray(item.roles) && item.roles.length > 0) {
    const first = item.roles[0] as any;
    return typeof first === 'string' ? first : first?.name || fallbackRole;
  }
  if (Array.isArray(item.roleDetails) && item.roleDetails.length > 0) {
    return item.roleDetails[0]?.name || fallbackRole;
  }
  if (Array.isArray(item.userRoles) && item.userRoles.length > 0) {
    return item.userRoles[0]?.role?.name || fallbackRole;
  }
  return fallbackRole === 'ALL' ? 'CLIENT' : fallbackRole;
}

function getPrimaryRoleId(item: RoleUserItem, rolesList: RoleOption[]): string {
  if (Array.isArray(item.roleDetails) && item.roleDetails[0]?.id) {
    return item.roleDetails[0].id;
  }
  if (Array.isArray(item.userRoles) && item.userRoles[0]?.role?.id) {
    return item.userRoles[0].role.id;
  }
  const roleName = getPrimaryRoleName(item, '');
  const matched = rolesList.find((r) => r.name.toUpperCase() === roleName.toUpperCase());
  return matched?.id || '';
}

function normalizeRoleType(roleName: string): string {
  const up = (roleName || '').toUpperCase();
  return ROLE_ALIAS_MAP[up] || up;
}

function AssignmentMultiSelector({
  title,
  subtitle,
  icon,
  items,
  selectedIds,
  onToggle,
  onSelectAll,
  onClearAll,
  emptyLabel,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  items: Array<{ id: string; title: string; badge?: string; meta?: string }>;
  selectedIds: string[];
  onToggle: (id: string) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
  emptyLabel: string;
}) {
  const [filterText, setFilterText] = React.useState('');

  const filtered = React.useMemo(() => {
    const q = filterText.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (it) =>
        it.title.toLowerCase().includes(q) ||
        (it.badge && it.badge.toLowerCase().includes(q)) ||
        (it.meta && it.meta.toLowerCase().includes(q)),
    );
  }, [items, filterText]);

  return (
    <div className="rounded-2xl border border-[#E6D6A6] bg-[#FBF9F4] p-4 space-y-3 animate-in fade-in slide-in-from-top-1">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-xl bg-white border border-[#E6D6A6] text-[#9A7414] flex items-center justify-center shrink-0">
            {icon}
          </div>
          <div className="min-w-0">
            <div className="text-xs font-extrabold text-[#1D232E] flex items-center gap-2">
              <span>{title}</span>
              <span className="px-2 py-0.5 rounded-full bg-[#C59B27] text-white text-[10px] font-black">
                {selectedIds.length}
              </span>
            </div>
            <div className="text-[11px] text-slate-500">{subtitle}</div>
          </div>
        </div>
        {items.length > 0 && (
          <div className="flex items-center gap-2 text-[11px] font-bold">
            <button
              type="button"
              onClick={onSelectAll}
              className="text-[#9A7414] hover:underline cursor-pointer"
            >
              Tout cocher
            </button>
            <span className="text-slate-300">•</span>
            <button
              type="button"
              onClick={onClearAll}
              className="text-slate-500 hover:text-rose-600 cursor-pointer"
            >
              Effacer
            </button>
          </div>
        )}
      </div>

      {items.length > 4 && (
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder="Filtrer..."
            className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-[#E6E1D6] bg-white text-xs text-[#1D232E] focus:outline-none focus:border-[#C59B27]"
          />
        </div>
      )}

      {items.length === 0 ? (
        <div className="p-3 rounded-xl bg-white border border-[#E6E1D6] text-[11px] text-slate-500 text-center">
          {emptyLabel}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-y-auto pr-0.5">
          {filtered.map((it) => {
            const active = selectedIds.includes(it.id);
            return (
              <button
                key={it.id}
                type="button"
                onClick={() => onToggle(it.id)}
                className={`p-2.5 rounded-xl border text-left transition flex items-start gap-2.5 cursor-pointer ${
                  active
                    ? 'bg-[#FBF6E8] border-[#C59B27] shadow-2xs'
                    : 'bg-white border-[#E6E1D6] hover:border-[#C59B27]/60'
                }`}
              >
                <span
                  className={`mt-0.5 w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition ${
                    active
                      ? 'bg-[#C59B27] border-[#C59B27] text-white'
                      : 'bg-white border-slate-300'
                  }`}
                >
                  {active && <Check className="w-3 h-3" />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="text-xs font-bold text-[#1D232E] truncate">{it.title}</span>
                    {it.badge && (
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-white border border-[#E6E1D6] text-[#9A7414] shrink-0">
                        {it.badge}
                      </span>
                    )}
                  </div>
                  {it.meta && (
                    <div className="text-[10px] text-slate-500 truncate mt-0.5 flex items-center gap-1">
                      <MapPin className="w-2.5 h-2.5 text-[#C59B27] shrink-0" />
                      <span className="truncate">{it.meta}</span>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function RoleUsersDirectory({
  roleCode,
  title,
  subtitle,
  breadcrumbParent = { label: 'Gestion des utilisateurs', href: '/dashboard/users' },
  breadcrumbLabel,
  singularLabel,
  printTitle,
}: RoleUsersDirectoryProps) {
  const isAllMode = !roleCode || roleCode.toUpperCase() === 'ALL';
  const { user: currentAuthUser } = useAuthStore();

  const [items, setItems] = React.useState<RoleUserItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [rolesList, setRolesList] = React.useState<RoleOption[]>([]);
  const [warehousesList, setWarehousesList] = React.useState<WarehouseOption[]>([]);
  const [showroomsList, setShowroomsList] = React.useState<ShowroomOption[]>([]);
  const [registersList, setRegistersList] = React.useState<CashRegisterOption[]>([]);
  const [defaultRoleId, setDefaultRoleId] = React.useState<string>('');
  const [roleFilter, setRoleFilter] = React.useState<string>('ALL');

  // Shared Add / Edit Modal state
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingItem, setEditingItem] = React.useState<RoleUserItem | null>(null);
  const [inspectItem, setInspectItem] = React.useState<RoleUserItem | null>(null);

  const [firstName, setFirstName] = React.useState('');
  const [lastName, setLastName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [selectedRoleId, setSelectedRoleId] = React.useState('');
  const [selectedWarehouseIds, setSelectedWarehouseIds] = React.useState<string[]>([]);
  const [selectedPosIds, setSelectedPosIds] = React.useState<string[]>([]);
  const [selectedCashRegisterIds, setSelectedCashRegisterIds] = React.useState<string[]>([]);
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  // Reset password modal state
  const [resetItem, setResetItem] = React.useState<RoleUserItem | null>(null);
  const [resettingPassword, setResettingPassword] = React.useState(false);

  // Delete & Bulk states
  const [deleteItem, setDeleteItem] = React.useState<RoleUserItem | null>(null);
  const [bulkDeleteKeys, setBulkDeleteKeys] = React.useState<string[]>([]);
  const [selectedKeys, setSelectedKeys] = React.useState<string[]>([]);
  const [bulkBusy, setBulkBusy] = React.useState(false);

  // Guide & Toast
  const [guideOpen, setGuideOpen] = React.useState(false);
  const [guideIndex, setGuideIndex] = React.useState(0);
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);
  const [toastType, setToastType] = React.useState<'success' | 'info' | 'error'>('success');

  const showToast = React.useCallback((type: 'success' | 'info' | 'error', msg: string) => {
    setToastType(type);
    setToastMessage(msg);
  }, []);

  const loadData = React.useCallback(async () => {
    setLoading(true);
    try {
      const endpoint = isAllMode
        ? '/users'
        : `/users?role=${encodeURIComponent(roleCode)}`;

      const normalizedPageRole = normalizeRoleType(roleCode);
      const needsWarehouses = isAllMode || normalizedPageRole === 'STOCK_MANAGER';
      const needsPos = isAllMode || normalizedPageRole === 'SALESPERSON';
      const needsRegisters = isAllMode || normalizedPageRole === 'CASHIER';

      const [usersRes, rolesRes, whRes, posRes, regRes] = await Promise.allSettled([
        fetchAllPaginated<RoleUserItem>(endpoint, 200).then((r) => r.items),
        fetchApi('/roles'),
        needsWarehouses ? fetchApi('/warehouses') : Promise.resolve([]),
        needsPos ? fetchApi('/pos') : Promise.resolve([]),
        needsRegisters ? fetchApi('/pos/registers') : Promise.resolve([]),
      ]);

      setItems(usersRes.status === 'fulfilled' && Array.isArray(usersRes.value) ? usersRes.value : []);

      const rawRoles = rolesRes.status === 'fulfilled' ? rolesRes.value : [];
      const parsedRoles: RoleOption[] = rawRoles?.data || (Array.isArray(rawRoles) ? rawRoles : []);
      const validRoles = Array.isArray(parsedRoles) ? parsedRoles : [];
      setRolesList(validRoles);

      if (whRes.status === 'fulfilled') {
        const rawWh = whRes.value?.data || whRes.value || [];
        setWarehousesList(Array.isArray(rawWh) ? rawWh : []);
      }
      if (posRes.status === 'fulfilled') {
        const rawPos = posRes.value?.data || posRes.value || [];
        setShowroomsList(Array.isArray(rawPos) ? rawPos : []);
      }
      if (regRes.status === 'fulfilled') {
        const rawReg = regRes.value?.data || regRes.value || [];
        setRegistersList(Array.isArray(rawReg) ? rawReg : []);
      }

      if (!isAllMode) {
        const normalizedTarget = ROLE_ALIAS_MAP[roleCode.toUpperCase()] || roleCode.toUpperCase();
        const foundRole =
          validRoles.find((r) => String(r.name).toUpperCase() === normalizedTarget) ||
          validRoles.find((r) => String(r.name).toUpperCase() === roleCode.toUpperCase());
        if (foundRole) setDefaultRoleId(foundRole.id);
      } else {
        setDefaultRoleId('');
      }
    } finally {
      setLoading(false);
    }
  }, [roleCode, isAllMode]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const activeModalRoleName = React.useMemo(() => {
    if (!isAllMode) return normalizeRoleType(roleCode);
    if (!selectedRoleId) return '';
    const found = rolesList.find((r) => r.id === selectedRoleId);
    return found ? normalizeRoleType(found.name) : '';
  }, [isAllMode, roleCode, selectedRoleId, rolesList]);

  const showDepotSelector = activeModalRoleName === 'STOCK_MANAGER';
  const showCaisseSelector = activeModalRoleName === 'CASHIER';
  const showShowroomSelector = activeModalRoleName === 'SALESPERSON';

  const openCreateModal = () => {
    setEditingItem(null);
    setFirstName('');
    setLastName('');
    setEmail('');
    setPhone('');
    setSelectedRoleId(isAllMode ? '' : defaultRoleId);
    setSelectedWarehouseIds([]);
    setSelectedPosIds([]);
    setSelectedCashRegisterIds([]);
    setPassword(generateSecurePassword());
    setShowPassword(true);
    setIsModalOpen(true);
  };

  const openEditModal = (item: RoleUserItem) => {
    setEditingItem(item);
    setFirstName(item.firstName || '');
    setLastName(item.lastName || '');
    setEmail(item.email || '');
    setPhone(item.phone || '');
    setSelectedRoleId(getPrimaryRoleId(item, rolesList) || defaultRoleId);
    setSelectedWarehouseIds(
      Array.isArray(item.warehouseIds)
        ? item.warehouseIds
        : (item.assignedWarehouses || []).map((w) => w.id),
    );
    setSelectedPosIds(
      Array.isArray(item.posIds)
        ? item.posIds
        : (item.assignedShowrooms || []).map((p) => p.id),
    );
    setSelectedCashRegisterIds(
      Array.isArray(item.cashRegisterIds)
        ? item.cashRegisterIds
        : (item.assignedCashRegisters || []).map((r) => r.id),
    );
    setPassword('');
    setShowPassword(false);
    setIsModalOpen(true);
  };

  const toggleIdInList = (
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    id: string,
  ) => {
    setter((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleSave = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      showToast('error', 'Prénom, nom et adresse e-mail sont obligatoires.');
      return;
    }

    const editingIsRoot = editingItem
      ? getPrimaryRoleName(editingItem, roleCode).toUpperCase() === 'ROOT'
      : false;

    if (isAllMode && !editingIsRoot && !selectedRoleId) {
      showToast('error', 'Veuillez sélectionner un rôle RBAC.');
      return;
    }

    const cleanPass = password.trim();
    if (!editingItem && cleanPass.length < 8) {
      showToast('error', 'Le mot de passe initial doit contenir au moins 8 caractères.');
      return;
    }
    if (editingItem && cleanPass.length > 0 && cleanPass.length < 8) {
      showToast('error', 'Le nouveau mot de passe doit contenir au moins 8 caractères.');
      return;
    }

    const locationPayload: Record<string, any> = {
      warehouseIds: showDepotSelector ? selectedWarehouseIds : [],
      posIds: showShowroomSelector ? selectedPosIds : [],
      cashRegisterIds: showCaisseSelector ? selectedCashRegisterIds : [],
    };

    setSaving(true);
    try {
      if (editingItem) {
        const bodyPayload: Record<string, any> = {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          ...(editingIsRoot ? {} : locationPayload),
        };
        if (!editingIsRoot && isAllMode && selectedRoleId) {
          bodyPayload.roleIds = [selectedRoleId];
        }
        if (cleanPass.length >= 8) {
          bodyPayload.password = cleanPass;
        }
        await fetchApi(`/users/${editingItem.id}`, {
          method: 'PUT',
          body: JSON.stringify(bodyPayload),
        });
        showToast(
          'success',
          cleanPass
            ? `${singularLabel} et son nouveau mot de passe mis à jour avec succès.`
            : `${singularLabel} mis à jour avec succès.`,
        );
      } else {
        const assignedRoleIds = !isAllMode
          ? defaultRoleId
            ? [defaultRoleId]
            : undefined
          : selectedRoleId
          ? [selectedRoleId]
          : undefined;
        await fetchApi('/users', {
          method: 'POST',
          body: JSON.stringify({
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email.trim(),
            phone: phone.trim() || undefined,
            password: cleanPass,
            roleIds: assignedRoleIds,
            ...locationPayload,
          }),
        });
        showToast('success', `Compte ${singularLabel} créé pour ${email.trim()}.`);
      }
      setIsModalOpen(false);
      await loadData();
    } catch (err: any) {
      showToast('error', err?.message || 'Erreur lors de l’enregistrement.');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmResetPassword = async () => {
    if (!resetItem) return;
    setResettingPassword(true);
    try {
      const res: any = await fetchApi(`/users/${resetItem.id}/reset-password`, {
        method: 'POST',
      });
      const payload = res?.data && !res?.message ? res.data : res;
      showToast(
        'success',
        payload?.message || `Nouveau mot de passe généré et envoyé par e-mail à ${resetItem.email}.`,
      );
      setResetItem(null);
    } catch (err: any) {
      showToast(
        'error',
        err?.message || `Impossible de réinitialiser le mot de passe pour ${resetItem.email}.`,
      );
    } finally {
      setResettingPassword(false);
    }
  };

  const handleToggleStatus = async (item: RoleUserItem) => {
    if (getPrimaryRoleName(item, roleCode).toUpperCase() === 'ROOT') {
      showToast('error', 'Le compte ROOT ne peut pas être suspendu.');
      return;
    }
    try {
      await fetchApi(`/users/${item.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !item.isActive }),
      });
      setItems((prev) =>
        prev.map((u) => (u.id === item.id ? { ...u, isActive: !item.isActive } : u)),
      );
      showToast(
        'info',
        item.isActive
          ? `Compte de ${item.firstName} ${item.lastName} suspendu.`
          : `Compte de ${item.firstName} ${item.lastName} activé.`,
      );
    } catch (err: any) {
      showToast('error', err?.message || 'Impossible de modifier le statut.');
    }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    try {
      await fetchApi(`/users/${deleteItem.id}`, { method: 'DELETE' });
      const deletedId = deleteItem.id;
      setDeleteItem(null);
      setItems((prev) => prev.filter((u) => u.id !== deletedId));
      showToast('info', `Compte ${singularLabel} supprimé.`);
    } catch (err: any) {
      showToast('error', err?.message || 'Erreur lors de la suppression.');
    }
  };

  const handleConfirmBulkDelete = async () => {
    if (bulkDeleteKeys.length === 0) return;
    setBulkBusy(true);
    try {
      const deletable = items.filter(
        (u) =>
          bulkDeleteKeys.includes(u.id) &&
          getPrimaryRoleName(u, roleCode).toUpperCase() !== 'ROOT',
      );
      await Promise.allSettled(
        deletable.map((u) => fetchApi(`/users/${u.id}`, { method: 'DELETE' })),
      );
      const deletedSet = new Set(deletable.map((d) => d.id));
      setBulkDeleteKeys([]);
      setSelectedKeys([]);
      setItems((prev) => prev.filter((u) => !deletedSet.has(u.id)));
      showToast('info', `${deletable.length} compte(s) supprimé(s) (ROOT protégé).`);
    } catch (err: any) {
      showToast('error', err?.message || 'Erreur lors de la suppression groupée.');
    } finally {
      setBulkBusy(false);
    }
  };

  const handleBulkStatus = async (isActive: boolean) => {
    if (selectedKeys.length === 0) return;
    setBulkBusy(true);
    try {
      const targets = items.filter(
        (u) =>
          selectedKeys.includes(u.id) &&
          getPrimaryRoleName(u, roleCode).toUpperCase() !== 'ROOT',
      );
      await Promise.allSettled(
        targets.map((u) =>
          fetchApi(`/users/${u.id}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ isActive }),
          }),
        ),
      );
      const targetSet = new Set(targets.map((t) => t.id));
      setItems((prev) =>
        prev.map((u) => (targetSet.has(u.id) ? { ...u, isActive } : u)),
      );
      showToast(
        'success',
        `${targets.length} compte(s) ${isActive ? 'activé(s)' : 'suspendu(s)'}.`,
      );
      setSelectedKeys([]);
    } catch (err: any) {
      showToast('error', err?.message || 'Erreur lors de la modification groupée.');
    } finally {
      setBulkBusy(false);
    }
  };

  const handleBulkRoleChange = async (newRoleId: string) => {
    if (selectedKeys.length === 0 || !newRoleId) return;
    const roleObj = rolesList.find((r) => r.id === newRoleId);
    if (!roleObj || roleObj.name === 'ROOT') return;
    setBulkBusy(true);
    try {
      const targets = items.filter(
        (u) =>
          selectedKeys.includes(u.id) &&
          getPrimaryRoleName(u, roleCode).toUpperCase() !== 'ROOT',
      );
      await Promise.allSettled(
        targets.map((u) =>
          fetchApi(`/users/${u.id}`, {
            method: 'PUT',
            body: JSON.stringify({ roleIds: [newRoleId] }),
          }),
        ),
      );
      showToast(
        'success',
        `${targets.length} compte(s) réaffecté(s) vers ${roleObj.displayName || roleObj.name}.`,
      );
      setSelectedKeys([]);
      await loadData();
    } catch (err: any) {
      showToast('error', err?.message || 'Erreur réaffectation rôle.');
    } finally {
      setBulkBusy(false);
    }
  };

  const filteredItems = React.useMemo(() => {
    if (!isAllMode || roleFilter === 'ALL') return items;
    return items.filter(
      (u) => getPrimaryRoleName(u, roleCode).toUpperCase() === roleFilter.toUpperCase(),
    );
  }, [items, isAllMode, roleFilter, roleCode]);

  const roleSelectOptions = React.useMemo(() => {
    const editable = rolesList.filter((r) => r.name !== 'ROOT');
    return editable.map((r) => ({
      value: r.id,
      label: r.displayName || r.name,
    }));
  }, [rolesList]);

  const renderAssignmentsBadges = (item: RoleUserItem) => {
    const whs = item.assignedWarehouses || [];
    const regs = item.assignedCashRegisters || [];
    const shs = item.assignedShowrooms || [];
    if (whs.length === 0 && regs.length === 0 && shs.length === 0) {
      return <span className="text-[11px] text-slate-400">—</span>;
    }
    return (
      <div className="flex flex-wrap gap-1 max-w-[240px]">
        {whs.map((w) => (
          <span
            key={w.id}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#FBF6E8] border border-[#E6D6A6] text-[10px] font-bold text-[#9A7414]"
          >
            <Warehouse className="w-2.5 h-2.5" />
            <span>{w.name}</span>
          </span>
        ))}
        {regs.map((r) => (
          <span
            key={r.id}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-bold text-emerald-700"
          >
            <CreditCard className="w-2.5 h-2.5" />
            <span>{r.name}</span>
          </span>
        ))}
        {shs.map((s) => (
          <span
            key={s.id}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-50 border border-sky-200 text-[10px] font-bold text-sky-700"
          >
            <Store className="w-2.5 h-2.5" />
            <span>{s.name}</span>
          </span>
        ))}
      </div>
    );
  };

  const normalizedViewRole = normalizeRoleType(roleCode);
  const showAssignmentColumn =
    isAllMode ||
    normalizedViewRole === 'STOCK_MANAGER' ||
    normalizedViewRole === 'CASHIER' ||
    normalizedViewRole === 'SALESPERSON';

  const assignmentColumnHeader =
    normalizedViewRole === 'STOCK_MANAGER'
      ? 'Dépôts Assignés'
      : normalizedViewRole === 'CASHIER'
      ? 'Caisses Assignées'
      : normalizedViewRole === 'SALESPERSON'
      ? 'Showrooms Assignés'
      : 'Affectation Site / Caisse';

  const columns: ColumnDef<RoleUserItem>[] = [
    {
      key: 'firstName',
      header: singularLabel,
      sortable: true,
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#FBF6E8] border border-[#E6D6A6] text-[#9A7414] font-bold text-xs flex items-center justify-center shrink-0">
            {item.firstName?.[0]}
            {item.lastName?.[0]}
          </div>
          <div className="min-w-0">
            <div className="font-bold text-[#1D232E] text-xs truncate">
              {item.firstName} {item.lastName}
            </div>
            <div className="text-[11px] text-slate-500 flex items-center gap-1 truncate">
              <Mail className="w-3 h-3 text-[#C59B27] shrink-0" />
              <span className="truncate">{item.email}</span>
            </div>
          </div>
        </div>
      ),
      printRender: (item) => `${item.firstName} ${item.lastName} (${item.email})`,
    },
    {
      key: 'phone',
      header: 'Téléphone',
      render: (item) => (
        <span className="text-xs text-slate-600 flex items-center gap-1.5 whitespace-nowrap">
          <Phone className="w-3.5 h-3.5 text-[#C59B27]" />
          {item.phone || '—'}
        </span>
      ),
      printRender: (item) => item.phone || '—',
    },
    {
      key: 'role',
      header: 'Rôle RBAC',
      render: (item) => {
        const rName = getPrimaryRoleName(item, roleCode);
        const rDisplay =
          rolesList.find((r) => r.name === rName)?.displayName ||
          item.roleDetails?.[0]?.displayName ||
          rName;
        return (
          <Badge variant="warning" size="sm">
            <ShieldCheck className="w-3 h-3" />
            <span>{rDisplay}</span>
          </Badge>
        );
      },
      printRender: (item) => getPrimaryRoleName(item, roleCode),
    },
    ...(showAssignmentColumn
      ? [
          {
            key: 'assignments',
            header: assignmentColumnHeader,
            render: (item: RoleUserItem) => renderAssignmentsBadges(item),
            printRender: (item: RoleUserItem) =>
              [
                ...(item.assignedWarehouses || []).map((w) => w.name),
                ...(item.assignedCashRegisters || []).map((r) => r.name),
                ...(item.assignedShowrooms || []).map((s) => s.name),
              ].join(', ') || '—',
          },
        ]
      : []),
    {
      key: 'isActive',
      header: 'Statut',
      sortable: true,
      render: (item) => {
        const isTargetRoot = getPrimaryRoleName(item, roleCode).toUpperCase() === 'ROOT';
        return (
          <Toggle
            checked={item.isActive}
            disabled={isTargetRoot}
            onChange={() => handleToggleStatus(item)}
            activeLabel="Actif"
            inactiveLabel="Suspendu"
          />
        );
      },
      printRender: (item) => (item.isActive ? 'Actif' : 'Suspendu'),
    },
    {
      key: 'createdAt',
      header: 'Date Création',
      sortable: true,
      sortValue: (item) => new Date(item.createdAt).getTime(),
      className: 'whitespace-nowrap font-mono text-[11px] text-slate-500',
      render: (item) =>
        new Date(item.createdAt).toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }),
      printRender: (item) => new Date(item.createdAt).toLocaleDateString('fr-FR'),
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right whitespace-nowrap no-print',
      render: (item) => {
        const isTargetRoot = getPrimaryRoleName(item, roleCode).toUpperCase() === 'ROOT';
        const canReset = !isTargetRoot || currentAuthUser?.id === item.id;
        return (
          <div className="flex items-center justify-end gap-1.5">
            <button
              type="button"
              onClick={() => setInspectItem(item)}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-[#1D232E] hover:bg-[#FBF6E8] transition cursor-pointer"
              title="Voir les détails"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => openEditModal(item)}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-[#1D232E] hover:bg-[#FBF6E8] transition cursor-pointer"
              title="Modifier profil / mot de passe"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              disabled={!canReset}
              onClick={() => setResetItem(item)}
              className="p-1.5 rounded-lg border border-amber-200 bg-[#FBF6E8] text-[#9A7414] hover:bg-[#F3E9C9] transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              title="Réinitialiser et envoyer un nouveau mot de passe par e-mail"
            >
              <KeyRound className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              disabled={isTargetRoot}
              onClick={() => setDeleteItem(item)}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-rose-600 hover:bg-rose-50 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              title={isTargetRoot ? 'ROOT protégé' : 'Supprimer'}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      },
      printRender: () => '',
    },
  ];

  const activeCount = filteredItems.filter((u) => u.isActive).length;
  const editingIsRoot = editingItem
    ? getPrimaryRoleName(editingItem, roleCode).toUpperCase() === 'ROOT'
    : false;

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <div className="bg-white p-6 rounded-3xl border border-[#E6E1D6] shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-3 rounded-2xl bg-[#FBF6E8] border border-[#E6D6A6] text-[#B8860B] shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-heading font-black text-[#1D232E] tracking-tight">
                  {title}
                </h1>
                <GuideInfoButton
                  onClick={() => {
                    setGuideIndex(0);
                    setGuideOpen(true);
                  }}
                />
              </div>
              <p className="text-xs text-slate-500">{subtitle}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={loadData}>
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Actualiser</span>
            </Button>
            <Button variant="gold" size="sm" onClick={openCreateModal}>
              <Plus className="w-3.5 h-3.5" />
              <span>Ajouter {singularLabel}</span>
            </Button>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100">
          <Breadcrumb
            items={
              isAllMode
                ? [{ label: breadcrumbLabel }]
                : [breadcrumbParent, { label: breadcrumbLabel }]
            }
          />
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 no-print">
        <div className="bg-white p-5 rounded-2xl border border-[#E6E1D6] shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase text-slate-500">Total Comptes</div>
            <div className="text-2xl font-black font-mono text-[#1D232E] mt-1">
              {filteredItems.length}
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-[#FBF6E8] text-[#B8860B]">
            <Users className="w-5 h-5" />
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-[#E6E1D6] shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase text-slate-500">Actifs</div>
            <div className="text-2xl font-black font-mono text-emerald-600 mt-1">
              {activeCount}
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-[#E6E1D6] shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase text-slate-500">Suspendus</div>
            <div className="text-2xl font-black font-mono text-slate-500 mt-1">
              {filteredItems.length - activeCount}
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-100 text-slate-500">
            <XCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      <DataTable
        data={filteredItems}
        columns={columns}
        isLoading={loading}
        keyExtractor={(item) => item.id}
        searchKeys={['firstName', 'lastName', 'email', 'phone']}
        searchPlaceholder={`Rechercher ${singularLabel.toLowerCase()}...`}
        customFilters={
          isAllMode
            ? [
                {
                  key: 'role',
                  label: 'Rôle',
                  value: roleFilter,
                  onChange: setRoleFilter,
                  allLabel: 'Tous les rôles',
                  options: rolesList.map((r) => ({
                    value: r.name,
                    label: r.displayName || r.name,
                  })),
                },
              ]
            : undefined
        }
        printTitle={printTitle}
        exportFileName={`${roleCode.toLowerCase()}-users`}
        displayModes={['table', 'list', 'matrix']}
        enableMultiSelect
        selectedKeys={selectedKeys}
        onSelectionChange={setSelectedKeys}
        onBulkDelete={(keys) => setBulkDeleteKeys(keys)}
        renderBulkActions={(_keys) => (
          <>
            <button
              type="button"
              disabled={bulkBusy}
              onClick={() => handleBulkStatus(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-xs font-semibold transition cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Activer</span>
            </button>
            <button
              type="button"
              disabled={bulkBusy}
              onClick={() => handleBulkStatus(false)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 text-xs font-semibold transition cursor-pointer disabled:opacity-50"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Suspendre</span>
            </button>
            {isAllMode && roleSelectOptions.length > 0 && (
              <select
                value=""
                disabled={bulkBusy}
                onChange={(e) => {
                  const id = e.target.value;
                  if (id) handleBulkRoleChange(id);
                }}
                aria-label="Changer rôle RBAC"
                className="h-7 px-2 rounded-lg border border-[#E6E1D6] bg-white text-[11px] font-semibold text-neutral-700 max-w-[170px]"
              >
                <option value="">Changer rôle...</option>
                {roleSelectOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            )}
          </>
        )}
        onRefresh={loadData}
        renderMatrixCard={(item, isChecked, onToggle) => {
          const rName = getPrimaryRoleName(item, roleCode);
          const isTargetRoot = rName.toUpperCase() === 'ROOT';
          const canReset = !isTargetRoot || currentAuthUser?.id === item.id;
          return (
            <div className="bg-white rounded-2xl border border-[#E6E1D6] p-4 sm:p-5 shadow-sm space-y-3 hover:border-[#C59B27] transition min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => onToggle(e as any)}
                    className="accent-[#C59B27] shrink-0"
                  />
                  <div className="w-10 h-10 rounded-xl bg-[#FBF6E8] border border-[#E6D6A6] text-[#9A7414] font-bold text-xs flex items-center justify-center shrink-0">
                    {item.firstName?.[0]}
                    {item.lastName?.[0]}
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-sm text-[#1D232E] truncate">
                      {item.firstName} {item.lastName}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">{item.email}</div>
                  </div>
                </div>
                <Badge variant={item.isActive ? 'success' : 'neutral'} size="sm" className="shrink-0">
                  {item.isActive ? 'Actif' : 'Suspendu'}
                </Badge>
              </div>
              {(item.assignedWarehouses?.length ||
                item.assignedCashRegisters?.length ||
                item.assignedShowrooms?.length) ? (
                <div className="pt-1">{renderAssignmentsBadges(item)}</div>
              ) : null}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-[10px] font-bold text-[#9A7414] truncate">{rName}</span>
                  <span className="text-[11px] text-slate-500 truncate">
                    {item.phone || 'Sans téléphone'}
                  </span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => setInspectItem(item)}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-[#FBF6E8] cursor-pointer"
                    title="Détails"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => openEditModal(item)}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-[#FBF6E8] cursor-pointer"
                    title="Modifier profil / mot de passe"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={!canReset}
                    onClick={() => setResetItem(item)}
                    className="p-1.5 rounded-lg border border-amber-200 bg-[#FBF6E8] text-[#9A7414] hover:bg-[#F3E9C9] cursor-pointer disabled:opacity-40"
                    title="Réinitialiser mot de passe (Email)"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={isTargetRoot}
                    onClick={() => setDeleteItem(item)}
                    className="p-1.5 rounded-lg border border-slate-200 text-rose-600 hover:bg-rose-50 cursor-pointer disabled:opacity-40"
                    title="Supprimer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        }}
      />

      {/* Inspect Modal */}
      <Modal
        isOpen={!!inspectItem}
        onClose={() => setInspectItem(null)}
        title="Détails du compte utilisateur"
        type="details"
        size="md"
        footer={
          <div className="flex flex-wrap items-center justify-between gap-2 w-full">
            {inspectItem &&
              (getPrimaryRoleName(inspectItem, roleCode).toUpperCase() !== 'ROOT' ||
                currentAuthUser?.id === inspectItem.id) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const target = inspectItem;
                    setInspectItem(null);
                    setResetItem(target);
                  }}
                >
                  <KeyRound className="w-3.5 h-3.5 text-[#C59B27]" />
                  <span>Réinitialiser &amp; Envoyer MDP</span>
                </Button>
              )}
            <div className="flex items-center gap-2 ml-auto">
              {inspectItem && (
                <Button
                  variant="gold"
                  size="sm"
                  onClick={() => {
                    const target = inspectItem;
                    setInspectItem(null);
                    openEditModal(target);
                  }}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Modifier</span>
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => setInspectItem(null)}>
                Fermer
              </Button>
            </div>
          </div>
        }
      >
        {inspectItem && (
          <div className="p-6 space-y-4 text-xs">
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-[#FBF9F4] border border-[#E6E1D6]">
              <div className="w-12 h-12 rounded-xl bg-[#FBF6E8] border border-[#E6D6A6] text-[#9A7414] font-black text-base flex items-center justify-center shrink-0">
                {inspectItem.firstName?.[0]}
                {inspectItem.lastName?.[0]}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-black text-[#1D232E] truncate">
                  {inspectItem.firstName} {inspectItem.lastName}
                </div>
                <div className="text-slate-500 truncate">{inspectItem.email}</div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-[#F8F9FA] border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Rôle RBAC
                </span>
                <span className="font-bold text-[#1D232E]">
                  {getPrimaryRoleName(inspectItem, roleCode)}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-[#F8F9FA] border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Téléphone
                </span>
                <span className="font-bold text-[#1D232E]">{inspectItem.phone || '—'}</span>
              </div>
              <div className="p-3 rounded-xl bg-[#F8F9FA] border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Statut
                </span>
                <span className="font-bold text-[#1D232E]">
                  {inspectItem.isActive ? 'Compte Actif' : 'Compte Suspendu'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-[#F8F9FA] border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Créé le
                </span>
                <span className="font-mono font-bold text-[#1D232E] inline-flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-[#C59B27]" />
                  {new Date(inspectItem.createdAt).toLocaleDateString('fr-FR')}
                </span>
              </div>
            </div>
            {(inspectItem.assignedWarehouses?.length ||
              inspectItem.assignedCashRegisters?.length ||
              inspectItem.assignedShowrooms?.length) ? (
              <div className="p-3.5 rounded-xl bg-[#FBF9F4] border border-[#E6D6A6] space-y-2">
                <span className="text-[10px] uppercase font-bold text-[#9A7414] block">
                  Affectations Opérationnelles
                </span>
                {renderAssignmentsBadges(inspectItem)}
              </div>
            ) : null}
          </div>
        )}
      </Modal>

      {/* Unified Create / Edit Modal — Context-Aware Role & Dynamic Multi-Assignments */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? `Modifier ${singularLabel}` : `Nouveau compte ${singularLabel}`}
        subtitle={
          !isAllMode
            ? `Rôle automatique : ${breadcrumbLabel}`
            : activeModalRoleName
            ? `Rôle sélectionné : ${activeModalRoleName}`
            : 'Champs communs puis affectation selon le rôle'
        }
        type={editingItem ? 'edit' : 'create'}
        size="lg"
        footer={
          <div className="flex flex-wrap items-center justify-between gap-2 w-full">
            {editingItem && (!editingIsRoot || currentAuthUser?.id === editingItem.id) ? (
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => {
                  const target = editingItem;
                  setIsModalOpen(false);
                  setResetItem(target);
                }}
              >
                <KeyRound className="w-3.5 h-3.5 text-[#C59B27]" />
                <span>Réinitialiser &amp; Envoyer MDP</span>
              </Button>
            ) : (
              <span />
            )}
            <div className="flex items-center gap-2 ml-auto">
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => setIsModalOpen(false)}
              >
                Annuler
              </Button>
              <Button
                variant="gold"
                size="sm"
                type="submit"
                form="role-user-form"
                disabled={saving}
              >
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
            </div>
          </div>
        }
      >
        <form id="role-user-form" onSubmit={handleSave} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Prénom *</label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6E1D6] text-xs bg-white text-[#1D232E]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nom *</label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6E1D6] text-xs bg-white text-[#1D232E]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6E1D6] text-xs bg-white text-[#1D232E]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Téléphone</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+216 ..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6E1D6] text-xs bg-white text-[#1D232E]"
              />
            </div>
          </div>

          {/* Role dropdown ONLY displayed inside "Tous les utilisateurs" */}
          {isAllMode && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Rôle RBAC *</label>
              {editingIsRoot ? (
                <input
                  type="text"
                  disabled
                  value="ROOT — Console Système Protégée"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6E1D6] text-xs bg-[#F8F9FA] text-slate-500 font-semibold"
                />
              ) : (
                <Select
                  value={selectedRoleId}
                  onChange={(e) => setSelectedRoleId(e.target.value)}
                  options={[
                    { value: '', label: '— Sélectionner un rôle —' },
                    ...roleSelectOptions,
                  ]}
                />
              )}
            </div>
          )}

          {/* Dynamic Multi-Site / Cash Register Assignment Panels based on Active Role */}
          {showDepotSelector && (
            <AssignmentMultiSelector
              title="Dépôt(s) / Entrepôt(s) assigné(s)"
              subtitle="Sélectionnez un ou plusieurs dépôts sous la responsabilité du magasinier"
              icon={<Warehouse className="w-4 h-4" />}
              items={warehousesList.map((w) => ({
                id: w.id,
                title: w.name,
                badge: w.code,
                meta: w.city || (w.isDefault ? 'Entrepôt principal' : undefined),
              }))}
              selectedIds={selectedWarehouseIds}
              onToggle={(id) => toggleIdInList(setSelectedWarehouseIds, id)}
              onSelectAll={() => setSelectedWarehouseIds(warehousesList.map((w) => w.id))}
              onClearAll={() => setSelectedWarehouseIds([])}
              emptyLabel="Aucun entrepôt disponible. Créez un dépôt dans Stock & entrepôts > Dépôts."
            />
          )}

          {showCaisseSelector && (
            <AssignmentMultiSelector
              title="Caisse(s) enregistreuse(s) POS assignée(s)"
              subtitle="Choisissez la ou les caisses opérées par ce caissier"
              icon={<CreditCard className="w-4 h-4" />}
              items={registersList.map((r) => ({
                id: r.id,
                title: r.name,
                badge: r.hasActiveSession ? 'OUVERTE' : 'PRÊTE',
                meta: r.posName ? `Showroom : ${r.posName}` : undefined,
              }))}
              selectedIds={selectedCashRegisterIds}
              onToggle={(id) => toggleIdInList(setSelectedCashRegisterIds, id)}
              onSelectAll={() => setSelectedCashRegisterIds(registersList.map((r) => r.id))}
              onClearAll={() => setSelectedCashRegisterIds([])}
              emptyLabel="Aucune caisse enregistrée dans Point de vente > Showrooms."
            />
          )}

          {showShowroomSelector && (
            <AssignmentMultiSelector
              title="Showroom(s) assigné(s)"
              subtitle="Sélectionnez le(s) showroom(s) d’affectation pour ce vendeur"
              icon={<Store className="w-4 h-4" />}
              items={showroomsList.map((s) => ({
                id: s.id,
                title: s.name,
                badge: s.code,
                meta: s.address || 'Showroom Royal',
              }))}
              selectedIds={selectedPosIds}
              onToggle={(id) => toggleIdInList(setSelectedPosIds, id)}
              onSelectAll={() => setSelectedPosIds(showroomsList.map((s) => s.id))}
              onClearAll={() => setSelectedPosIds([])}
              emptyLabel="Aucun showroom disponible dans Point de vente > Salles d'exposition."
            />
          )}

          <div>
            <div className="flex items-center justify-between gap-2 mb-1">
              <label className="text-xs font-bold text-slate-700">
                {editingItem
                  ? 'Mot de passe (optionnel — min. 8 car.)'
                  : 'Mot de passe initial * (min. 8 car.)'}
              </label>
              <button
                type="button"
                onClick={() => {
                  setPassword(generateSecurePassword());
                  setShowPassword(true);
                }}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-[#9A7414] hover:text-[#1D232E] transition cursor-pointer"
              >
                <Dices className="w-3.5 h-3.5" />
                <span>Générer</span>
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required={!editingItem}
                minLength={editingItem ? undefined : 8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={
                  editingItem
                    ? 'Laisser vide pour conserver le mot de passe actuel'
                    : 'Saisir ou générer un mot de passe sécurisé'
                }
                className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-[#E6E1D6] font-mono text-xs bg-[#FBF9F4] text-[#1D232E]"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? 'Masquer mot de passe' : 'Afficher mot de passe'}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#1D232E] cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Reset Password & Send SMTP Email Modal */}
      <Modal
        isOpen={!!resetItem}
        onClose={() => !resettingPassword && setResetItem(null)}
        title="Réinitialiser et Envoyer le Mot de Passe"
        type="edit"
        size="md"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button
              variant="outline"
              size="sm"
              disabled={resettingPassword}
              onClick={() => setResetItem(null)}
            >
              Annuler
            </Button>
            <Button
              variant="gold"
              size="sm"
              isLoading={resettingPassword}
              onClick={handleConfirmResetPassword}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Générer &amp; Envoyer par E-Mail</span>
            </Button>
          </div>
        }
      >
        {resetItem && (
          <div className="p-6 space-y-4 text-xs text-slate-600">
            <div className="p-4 rounded-2xl bg-[#FBF6E8] border border-[#E6D6A6] flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white border border-[#E6D6A6] text-[#9A7414] flex items-center justify-center shrink-0">
                <KeyRound className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="font-bold text-[#1D232E] truncate">
                  {resetItem.firstName} {resetItem.lastName}
                </div>
                <div className="text-[11px] font-mono text-[#9A7414] truncate">
                  {resetItem.email}
                </div>
              </div>
            </div>
            <p className="leading-relaxed">
              Le système va générer automatiquement un nouveau mot de passe sécurisé, l’envoyer par
              e-mail SMTP à <strong>{resetItem.email}</strong>, puis révoquer ses sessions actives.
            </p>
          </div>
        )}
      </Modal>

      <DeleteConfirmModal
        isOpen={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleDelete}
        title={`Supprimer ${singularLabel} ?`}
        description={`Confirmez-vous la suppression de ${deleteItem?.firstName} ${deleteItem?.lastName} ?`}
      />

      <DeleteConfirmModal
        isOpen={bulkDeleteKeys.length > 0}
        onClose={() => setBulkDeleteKeys([])}
        onConfirm={handleConfirmBulkDelete}
        isDeleting={bulkBusy}
        title="Supprimer les comptes sélectionnés ?"
        description={`Confirmez-vous la suppression des ${bulkDeleteKeys.length} compte(s) sélectionné(s) ? Le compte ROOT est protégé.`}
      />

      <ViewGuideModal
        isOpen={guideOpen}
        onClose={() => setGuideOpen(false)}
        title="Guide Gestion des Utilisateurs & Affectations"
        subtitle="Rôles contextuels, multi-affectation dépôts/caisses/showrooms et reset SMTP"
        steps={USERS_GUIDE_STEPS}
        currentIndex={guideIndex}
        onStepChange={setGuideIndex}
      />

      <Toast
        isOpen={!!toastMessage}
        message={toastMessage || ''}
        type={toastType}
        onClose={() => setToastMessage(null)}
      />
    </div>
  );
}
