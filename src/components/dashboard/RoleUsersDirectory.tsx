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
  roleDetails?: Array<{ id?: string; name: string; displayName?: string }>;
  userRoles?: Array<{ role?: { id?: string; name: string; displayName?: string } }>;
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
    title: 'Création & Édition Uniformes des Comptes',
    description: 'Les formulaires Ajouter et Modifier proposent les mêmes champs : identité, contact, rôle RBAC et mot de passe.',
    fields: [
      {
        label: 'Mot de passe à la création et à la modification',
        steps: [
          'En création : saisissez un mot de passe (min. 8 caractères) ou utilisez « Générer ».',
          'En modification : laissez vide pour conserver le mot de passe actuel, ou renseignez-en un nouveau pour le mettre à jour immédiatement.',
        ],
      },
    ],
  },
  {
    id: 'users-reset',
    number: '02',
    title: 'Réinitialisation Système & Envoi E-Mail SMTP',
    description: 'L’icône clé sur chaque ligne déclenche la génération côté serveur d’un nouveau mot de passe sécurisé envoyé par e-mail.',
    fields: [
      {
        label: 'Sécurité des sessions',
        steps: [
          'Le système génère un mot de passe aléatoire unique, l’envoie par e-mail via Paramètres SMTP puis révoque les anciennes sessions.',
          'Le compte ROOT principal reste strictement protégé contre la suppression, la suspension et le changement de rôle.',
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
      const [usersList, rolesRes] = await Promise.all([
        fetchAllPaginated<RoleUserItem>(endpoint, 200)
          .then((r) => r.items)
          .catch(() => []),
        fetchApi('/roles').catch(() => []),
      ]);
      setItems(Array.isArray(usersList) ? usersList : []);

      const parsedRoles: RoleOption[] = rolesRes?.data || (Array.isArray(rolesRes) ? rolesRes : []);
      const validRoles = Array.isArray(parsedRoles) ? parsedRoles : [];
      setRolesList(validRoles);

      if (!isAllMode) {
        const normalizedTarget = ROLE_ALIAS_MAP[roleCode.toUpperCase()] || roleCode.toUpperCase();
        const foundRole =
          validRoles.find((r) => String(r.name).toUpperCase() === normalizedTarget) ||
          validRoles.find((r) => String(r.name).toUpperCase() === roleCode.toUpperCase());
        if (foundRole) setDefaultRoleId(foundRole.id);
      } else {
        const nonRoot = validRoles.find((r) => r.name !== 'ROOT') || validRoles[0];
        if (nonRoot) setDefaultRoleId(nonRoot.id);
      }
    } finally {
      setLoading(false);
    }
  }, [roleCode, isAllMode]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const openCreateModal = () => {
    setEditingItem(null);
    setFirstName('');
    setLastName('');
    setEmail('');
    setPhone('');
    setSelectedRoleId(defaultRoleId);
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
    setPassword('');
    setShowPassword(false);
    setIsModalOpen(true);
  };

  const handleSave = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      showToast('error', 'Prénom, nom et adresse e-mail sont obligatoires.');
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

    const editingIsRoot = editingItem
      ? getPrimaryRoleName(editingItem, roleCode).toUpperCase() === 'ROOT'
      : false;

    setSaving(true);
    try {
      if (editingItem) {
        const bodyPayload: Record<string, any> = {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
        };
        if (!editingIsRoot && selectedRoleId) {
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
        await fetchApi('/users', {
          method: 'POST',
          body: JSON.stringify({
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email.trim(),
            phone: phone.trim() || undefined,
            password: cleanPass,
            roleIds: selectedRoleId ? [selectedRoleId] : defaultRoleId ? [defaultRoleId] : undefined,
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
      showToast(
        'info',
        item.isActive
          ? `Compte de ${item.firstName} ${item.lastName} suspendu.`
          : `Compte de ${item.firstName} ${item.lastName} activé.`,
      );
      await loadData();
    } catch (err: any) {
      showToast('error', err?.message || 'Impossible de modifier le statut.');
    }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    try {
      await fetchApi(`/users/${deleteItem.id}`, { method: 'DELETE' });
      setDeleteItem(null);
      showToast('info', `Compte ${singularLabel} supprimé.`);
      await loadData();
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
      setBulkDeleteKeys([]);
      setSelectedKeys([]);
      showToast('info', `${deletable.length} compte(s) supprimé(s) (ROOT protégé).`);
      await loadData();
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
      showToast(
        'success',
        `${targets.length} compte(s) ${isActive ? 'activé(s)' : 'suspendu(s)'}.`,
      );
      setSelectedKeys([]);
      await loadData();
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
            <div className="text-2xl font-black font-mono text-emerald-700 mt-1">
              {activeCount}
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-[#E6E1D6] shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase text-slate-500">Suspendus</div>
            <div className="text-2xl font-black font-mono text-slate-600 mt-1">
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
        keyExtractor={(item) => item.id}
        isLoading={loading}
        printTitle={printTitle}
        exportFileName={roleCode.toLowerCase()}
        searchPlaceholder={`Rechercher un ${singularLabel.toLowerCase()}...`}
        searchKeys={['firstName', 'lastName', 'email', 'phone']}
        supportedModes={['table', 'list', 'matrix']}
        defaultMode="table"
        enableMultiSelect
        selectedKeys={selectedKeys}
        onSelectionChange={setSelectedKeys}
        onBulkDelete={(keys) => setBulkDeleteKeys(keys)}
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
            : []
        }
        renderBulkActions={() => (
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
            {roleSelectOptions.length > 0 && (
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
                    title="Modifier"
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
                  <span>Réinitialiser MDP (Email)</span>
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
          </div>
        )}
      </Modal>

      {/* Unified Create / Edit Modal — Exact Same Fields Including Password */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? `Modifier ${singularLabel}` : `Nouveau compte ${singularLabel}`}
        type={editingItem ? 'edit' : 'create'}
        size="md"
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
                options={
                  roleSelectOptions.length > 0
                    ? roleSelectOptions
                    : [{ value: '', label: singularLabel }]
                }
              />
            )}
          </div>

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
        title="Guide Gestion des Utilisateurs & Mots de Passe"
        subtitle="Création, édition unifiée et réinitialisation par e-mail SMTP"
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
