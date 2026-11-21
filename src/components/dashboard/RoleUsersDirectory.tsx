'use client';

import * as React from 'react';
import {
  Users,
  Plus,
  Edit3,
  Trash2,
  Eye,
  Mail,
  Phone,
  RefreshCw,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Calendar,
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
} from '@/components/ui';
import { fetchApi } from '@/lib/api';

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
  roles?: Array<{ id?: string; name: string; displayName?: string }>;
}

interface RoleUsersDirectoryProps {
  roleCode: string;
  title: string;
  subtitle: string;
  breadcrumbParent?: { label: string; href: string };
  breadcrumbLabel: string;
  singularLabel: string;
  printTitle: string;
}

function generateSecurePassword(prefix = 'RYL-'): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
  let pass = prefix;
  for (let i = 0; i < 10; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pass;
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
  const [items, setItems] = React.useState<RoleUserItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [roleId, setRoleId] = React.useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingItem, setEditingItem] = React.useState<RoleUserItem | null>(null);
  const [inspectItem, setInspectItem] = React.useState<RoleUserItem | null>(null);

  const [firstName, setFirstName] = React.useState('');
  const [lastName, setLastName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [saving, setSaving] = React.useState(false);

  const [deleteItem, setDeleteItem] = React.useState<RoleUserItem | null>(null);
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);
  const [toastType, setToastType] = React.useState<'success' | 'info' | 'error'>('success');

  const loadData = React.useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes, rolesRes] = await Promise.all([
        fetchApi(`/users?role=${encodeURIComponent(roleCode)}&limit=200`).catch(() => null),
        fetchApi('/roles').catch(() => []),
      ]);
      const usersList =
        usersRes?.data?.data || usersRes?.data || usersRes?.items || (Array.isArray(usersRes) ? usersRes : []);
      setItems(Array.isArray(usersList) ? usersList : []);

      const roleAliasMap: Record<string, string> = {
        SUPERADMIN: 'SUPER_ADMIN',
        CAISSIER: 'CASHIER',
        MAGASINIER: 'STOCK_MANAGER',
        VENDEUR: 'SALESPERSON',
        FINANCIER: 'ACCOUNTANT',
        WEBSITE_MANAGER: 'WEBSITE_MANAGER',
        COMMERCIAL: 'COMMERCIAL',
      };
      const normalizedTarget = roleAliasMap[roleCode.toUpperCase()] || roleCode.toUpperCase();
      const rolesList = rolesRes?.data || (Array.isArray(rolesRes) ? rolesRes : []);
      const foundRole = Array.isArray(rolesList)
        ? rolesList.find((r: any) => String(r.name).toUpperCase() === normalizedTarget) ||
          rolesList.find((r: any) => String(r.name).toUpperCase() === roleCode.toUpperCase())
        : null;
      if (foundRole) setRoleId(foundRole.id);
    } finally {
      setLoading(false);
    }
  }, [roleCode]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const openCreateModal = () => {
    setEditingItem(null);
    setFirstName('');
    setLastName('');
    setEmail('');
    setPhone('');
    setPassword(generateSecurePassword());
    setIsModalOpen(true);
  };

  const openEditModal = (item: RoleUserItem) => {
    setEditingItem(item);
    setFirstName(item.firstName || '');
    setLastName(item.lastName || '');
    setEmail(item.email || '');
    setPhone(item.phone || '');
    setPassword('');
    setIsModalOpen(true);
  };

  const handleSave = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !email.trim()) return;
    setSaving(true);
    try {
      if (editingItem) {
        await fetchApi(`/users/${editingItem.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email.trim(),
            phone: phone.trim() || undefined,
          }),
        });
        setToastType('success');
        setToastMessage(`${singularLabel} mis à jour avec succès.`);
      } else {
        await fetchApi('/users', {
          method: 'POST',
          body: JSON.stringify({
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email.trim(),
            phone: phone.trim() || undefined,
            password: password || generateSecurePassword(),
            roleIds: roleId ? [roleId] : undefined,
          }),
        });
        setToastType('success');
        setToastMessage(`Compte ${singularLabel} créé pour ${email.trim()}.`);
      }
      setIsModalOpen(false);
      await loadData();
    } catch (err: any) {
      setToastType('error');
      setToastMessage(err?.message || 'Erreur lors de l’enregistrement.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (item: RoleUserItem) => {
    try {
      await fetchApi(`/users/${item.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !item.isActive }),
      });
      setToastType('info');
      setToastMessage(
        item.isActive
          ? `Compte de ${item.firstName} ${item.lastName} suspendu.`
          : `Compte de ${item.firstName} ${item.lastName} activé.`
      );
      await loadData();
    } catch (err: any) {
      setToastType('error');
      setToastMessage(err?.message || 'Impossible de modifier le statut.');
    }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    try {
      await fetchApi(`/users/${deleteItem.id}`, { method: 'DELETE' });
      setDeleteItem(null);
      setToastType('info');
      setToastMessage(`Compte ${singularLabel} supprimé.`);
      await loadData();
    } catch (err: any) {
      setToastType('error');
      setToastMessage(err?.message || 'Erreur lors de la suppression.');
    }
  };

  const handleBulkDelete = async (keys: string[]) => {
    if (keys.length === 0) return;
    try {
      await Promise.all(keys.map((id) => fetchApi(`/users/${id}`, { method: 'DELETE' })));
      setToastType('info');
      setToastMessage(`${keys.length} compte(s) supprimé(s).`);
      await loadData();
    } catch (err: any) {
      setToastType('error');
      setToastMessage(err?.message || 'Erreur lors de la suppression multiple.');
    }
  };

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
      render: () => (
        <Badge variant="warning" size="sm">
          <ShieldCheck className="w-3 h-3" />
          <span>{roleCode}</span>
        </Badge>
      ),
      printRender: () => roleCode,
    },
    {
      key: 'isActive',
      header: 'Statut',
      sortable: true,
      render: (item) => (
        <Toggle
          checked={item.isActive}
          onChange={() => handleToggleStatus(item)}
          activeLabel="Actif"
          inactiveLabel="Suspendu"
        />
      ),
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
      render: (item) => (
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
            title="Modifier"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setDeleteItem(item)}
            className="p-1.5 rounded-lg border border-slate-200 bg-white text-rose-600 hover:bg-rose-50 transition cursor-pointer"
            title="Supprimer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
      printRender: () => '',
    },
  ];

  const activeCount = items.filter((u) => u.isActive).length;

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <div className="bg-white p-6 rounded-3xl border border-[#E6E1D6] shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-[#FBF6E8] border border-[#E6D6A6] text-[#B8860B] shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-heading font-black text-[#1D232E] tracking-tight">
                {title}
              </h1>
              <p className="text-xs text-slate-500">{subtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
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
          <Breadcrumb items={[breadcrumbParent, { label: breadcrumbLabel }]} />
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 no-print">
        <div className="bg-white p-5 rounded-2xl border border-[#E6E1D6] shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase text-slate-500">Total Comptes</div>
            <div className="text-2xl font-black font-mono text-[#1D232E] mt-1">{items.length}</div>
          </div>
          <div className="p-2.5 rounded-xl bg-[#FBF6E8] text-[#B8860B]">
            <Users className="w-5 h-5" />
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-[#E6E1D6] shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase text-slate-500">Actifs</div>
            <div className="text-2xl font-black font-mono text-emerald-700 mt-1">{activeCount}</div>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-[#E6E1D6] shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase text-slate-500">Suspendus</div>
            <div className="text-2xl font-black font-mono text-slate-600 mt-1">
              {items.length - activeCount}
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-100 text-slate-500">
            <XCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      <DataTable
        data={items}
        columns={columns}
        isLoading={loading}
        printTitle={printTitle}
        exportFileName={roleCode.toLowerCase()}
        searchPlaceholder={`Rechercher un ${singularLabel.toLowerCase()}...`}
        searchKeys={['firstName', 'lastName', 'email', 'phone']}
        supportedModes={['table', 'list', 'matrix']}
        defaultMode="table"
        enableMultiSelect
        onBulkDelete={handleBulkDelete}
        onRefresh={loadData}
        renderMatrixCard={(item, isChecked, onToggle) => (
          <div className="bg-white rounded-2xl border border-[#E6E1D6] p-5 shadow-sm space-y-3 hover:border-[#C59B27] transition">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-3 min-w-0">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={(e) => onToggle(e as any)}
                  className="accent-[#C59B27]"
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
              <Badge variant={item.isActive ? 'success' : 'neutral'} size="sm">
                {item.isActive ? 'Actif' : 'Suspendu'}
              </Badge>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
              <span className="text-slate-500">{item.phone || 'Sans téléphone'}</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => openEditModal(item)}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-[#FBF6E8] cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteItem(item)}
                  className="p-1.5 rounded-lg border border-slate-200 text-rose-600 hover:bg-rose-50 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      />

      {/* Inspect Modal */}
      <Modal
        isOpen={!!inspectItem}
        onClose={() => setInspectItem(null)}
        title="Détails du compte utilisateur"
        type="details"
        size="md"
        footer={
          <div className="flex justify-end w-full">
            <Button variant="outline" size="sm" onClick={() => setInspectItem(null)}>
              Fermer
            </Button>
          </div>
        }
      >
        {inspectItem && (
          <div className="p-6 space-y-4 text-xs">
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-[#FBF9F4] border border-[#E6E1D6]">
              <div className="w-12 h-12 rounded-xl bg-[#FBF6E8] border border-[#E6D6A6] text-[#9A7414] font-black text-base flex items-center justify-center">
                {inspectItem.firstName?.[0]}
                {inspectItem.lastName?.[0]}
              </div>
              <div>
                <div className="text-sm font-black text-[#1D232E]">
                  {inspectItem.firstName} {inspectItem.lastName}
                </div>
                <div className="text-slate-500">{inspectItem.email}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-[#F8F9FA] border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Rôle RBAC</span>
                <span className="font-bold text-[#1D232E]">{roleCode}</span>
              </div>
              <div className="p-3 rounded-xl bg-[#F8F9FA] border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Téléphone</span>
                <span className="font-bold text-[#1D232E]">{inspectItem.phone || '—'}</span>
              </div>
              <div className="p-3 rounded-xl bg-[#F8F9FA] border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Statut</span>
                <span className="font-bold text-[#1D232E]">
                  {inspectItem.isActive ? 'Compte Actif' : 'Compte Suspendu'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-[#F8F9FA] border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Créé le</span>
                <span className="font-mono font-bold text-[#1D232E] inline-flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-[#C59B27]" />
                  {new Date(inspectItem.createdAt).toLocaleDateString('fr-FR')}
                </span>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? `Modifier ${singularLabel}` : `Nouveau compte ${singularLabel}`}
        type={editingItem ? 'edit' : 'create'}
        size="md"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsModalOpen(false)}>
              Annuler
            </Button>
            <Button variant="gold" size="sm" type="submit" form="role-user-form" disabled={saving}>
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
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
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6E1D6] text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nom *</label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6E1D6] text-xs"
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
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6E1D6] text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Téléphone</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+216 ..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6E1D6] text-xs"
              />
            </div>
          </div>

          {!editingItem && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Mot de passe initial</label>
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6E1D6] font-mono text-xs bg-[#FBF9F4]"
              />
            </div>
          )}
        </form>
      </Modal>

      <DeleteConfirmModal
        isOpen={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleDelete}
        title={`Supprimer ${singularLabel} ?`}
        description={`Confirmez-vous la suppression de ${deleteItem?.firstName} ${deleteItem?.lastName} ?`}
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
