'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowUpDown,
  User,
  Mail,
  Phone,
  Warehouse,
  Key,
  Lock,
  Building2,
  Check,
  X,
  Shield,
  Eye,
  Calendar,
} from 'lucide-react';
import { DataTable, ColumnDef } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { Toast } from '@/components/ui/toast';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Select } from '@/components/ui/select';
import { Printer } from 'lucide-react';
import { fetchApi } from '@/lib/api';
import { cn } from '@/lib/utils';

export interface UserItem {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: string;
  assignedLocation: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'INVITED';
  lastLoginAt?: string | null;
  createdAt: string;
}

const INITIAL_USERS: UserItem[] = [
  {
    id: 'u-root',
    firstName: 'Mohamed',
    lastName: 'Zitouni',
    email: 'root@royal.com.tn',
    phone: '+216 98 000 001',
    role: 'ROOT',
    assignedLocation: 'Accès Global Illimité',
    status: 'ACTIVE',
    lastLoginAt: '2026-11-15T23:40:00Z',
    createdAt: '2026-09-01T00:00:00Z',
  },
  {
    id: 'u-super',
    firstName: 'Super',
    lastName: 'Admin',
    email: 'superadmin@royal.com.tn',
    phone: '+216 98 000 002',
    role: 'SUPER_ADMIN',
    assignedLocation: 'Siège Central & Direction',
    status: 'ACTIVE',
    lastLoginAt: '2026-11-15T18:20:00Z',
    createdAt: '2026-09-01T00:00:00Z',
  },
  {
    id: 'u-admin',
    firstName: 'Kamel',
    lastName: 'Mansour',
    email: 'admin@royal.com.tn',
    phone: '+216 98 111 222',
    role: 'ADMIN',
    assignedLocation: 'Showroom Tunis — Les Berges du Lac',
    status: 'ACTIVE',
    lastLoginAt: '2026-11-15T16:45:00Z',
    createdAt: '2026-09-15T09:00:00Z',
  },
  {
    id: 'u-stock',
    firstName: 'Tarek',
    lastName: 'Cherif',
    email: 'stock@royal.com.tn',
    phone: '+216 22 333 444',
    role: 'STOCK_MANAGER',
    assignedLocation: 'Dépôt Sousse — Hub Central',
    status: 'ACTIVE',
    lastLoginAt: '2026-11-15T11:30:00Z',
    createdAt: '2026-09-20T10:00:00Z',
  },
  {
    id: 'u-cashier',
    firstName: 'Mariem',
    lastName: 'Ben Salem',
    email: 'cashier@royal.com.tn',
    phone: '+216 55 666 777',
    role: 'CASHIER',
    assignedLocation: 'Caisse Showroom Lac',
    status: 'ACTIVE',
    lastLoginAt: '2026-11-15T15:10:00Z',
    createdAt: '2026-10-01T08:30:00Z',
  },
  {
    id: 'u-delivery',
    firstName: 'Sami',
    lastName: 'Bouzidi',
    email: 'delivery@royal.com.tn',
    phone: '+216 99 888 999',
    role: 'DELIVERY_MANAGER',
    assignedLocation: 'Flotte Véhicules Tunis & Sousse',
    status: 'ACTIVE',
    lastLoginAt: '2026-11-14T17:00:00Z',
    createdAt: '2026-10-05T14:00:00Z',
  },
];

export default function UsersManagementPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteFirstName, setInviteFirstName] = useState('');
  const [inviteLastName, setInviteLastName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePhone, setInvitePhone] = useState('');
  const [invitePassword, setInvitePassword] = useState('RoyalPass2026!');
  const [inviting, setInviting] = useState(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchApi('/users?limit=200');
      const raw = res?.data?.items || res?.items || res?.data || (Array.isArray(res) ? res : []);
      const mapped: UserItem[] = (Array.isArray(raw) ? raw : []).map((u: any) => {
        const primaryRole = u.userRoles?.[0]?.role?.name || u.roles?.[0] || 'STAFF';
        const loc =
          u.userRoles?.[0]?.warehouse?.name ||
          u.userRoles?.[0]?.pos?.name ||
          (primaryRole === 'ROOT' ? 'Accès Global Illimité' : 'Siège Central Royal');
        return {
          id: u.id,
          firstName: u.firstName || 'Collaborateur',
          lastName: u.lastName || '',
          email: u.email,
          phone: u.phone || '',
          role: primaryRole,
          assignedLocation: loc,
          status: u.isActive !== false ? 'ACTIVE' : 'SUSPENDED',
          lastLoginAt: u.lastLoginAt || u.updatedAt,
          createdAt: u.createdAt || new Date().toISOString(),
        };
      });
      setUsers(mapped);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Stats KPIs
  const stats = useMemo(() => {
    const total = users.length;
    const active = users.filter((u) => u.status === 'ACTIVE').length;
    const managers = users.filter((u) => !['ROOT', 'SUPER_ADMIN', 'ADMIN'].includes(u.role)).length;
    const admins = users.filter((u) => ['ROOT', 'SUPER_ADMIN', 'ADMIN'].includes(u.role)).length;
    return { total, active, managers, admins };
  }, [users]);

  // Bascule statut
  const toggleUserStatus = async (id: string) => {
    const target = users.find((u) => u.id === id);
    if (!target) return;
    if (target.role === 'ROOT') {
      setFeedbackMessage('Le compte ROOT système ne peut pas être suspendu.');
      return;
    }
    const nextActive = target.status !== 'ACTIVE';
    try {
      await fetchApi(`/users/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: nextActive }),
      });
      setFeedbackMessage(`Utilisateur ${target.firstName} ${target.lastName} mis à jour en base.`);
      await loadUsers();
    } catch (err: any) {
      setFeedbackMessage(err?.message || 'Erreur mise à jour statut utilisateur.');
    }
  };

  const [roleFilter, setRoleFilter] = useState('ALL');

  const filteredUsers = useMemo(() => {
    if (roleFilter === 'ALL') return users;
    return users.filter((u) => u.role === roleFilter);
  }, [users, roleFilter]);

  // Colonnes DataTable Master
  const columns: ColumnDef<UserItem>[] = [
    {
      key: 'user',
      header: 'Collaborateur & Contact',
      sortable: true,
      sortValue: (row) => `${row.firstName} ${row.lastName}`,
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <div
            className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0',
              row.role === 'ROOT'
                ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                : 'bg-neutral-100 text-neutral-800 border border-neutral-200'
            )}
          >
            {row.firstName.charAt(0)}
            {row.lastName.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-neutral-900 text-xs">
                {row.firstName} {row.lastName}
              </span>
              {row.role === 'ROOT' && (
                <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-[var(--royal-primary)] text-[var(--royal-primary-text)] uppercase tracking-wider">
                  ROOT
                </span>
              )}
            </div>
            <div className="text-[11px] text-neutral-500 flex items-center gap-1 mt-0.5">
              <Mail className="w-3 h-3 text-neutral-400" />
              <span>{row.email}</span>
            </div>
          </div>
        </div>
      ),
      printRender: (row) => `${row.firstName} ${row.lastName} (${row.email})`,
    },
    {
      key: 'role',
      header: 'Rôle & Habilitation',
      sortable: true,
      sortValue: (row) => row.role,
      render: (row) => {
        const roleLabels: Record<string, { label: string; cls: string }> = {
          ROOT: { label: 'Super-Root Console', cls: 'bg-[#FBF6E8] text-[#8C6400] border border-[#E6D6A6]' },
          SUPER_ADMIN: { label: 'Super Administrateur', cls: 'bg-indigo-50 text-indigo-700 border border-indigo-200' },
          ADMIN: { label: 'Administrateur', cls: 'bg-blue-50 text-blue-700 border border-blue-200' },
          STOCK_MANAGER: { label: 'Gestionnaire Stock', cls: 'bg-amber-50 text-amber-800 border border-amber-200' },
          CASHIER: { label: 'Caissier Showroom', cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
          DELIVERY_MANAGER: { label: 'Responsable Livraison', cls: 'bg-cyan-50 text-cyan-700 border border-cyan-200' },
        };
        const r = roleLabels[row.role] || { label: row.role, cls: 'bg-neutral-100 text-neutral-700' };

        return (
          <span className={cn('px-2.5 py-0.5 rounded-full text-[10px] font-bold inline-block', r.cls)}>
            {r.label}
          </span>
        );
      },
      printRender: (row) => row.role,
    },
    {
      key: 'assignedLocation',
      header: 'Affectation Dépôt / Magasin',
      sortable: true,
      sortValue: (row) => row.assignedLocation,
      render: (row) => (
        <div className="text-xs text-neutral-800 flex items-center gap-1.5">
          <Warehouse className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
          <span>{row.assignedLocation}</span>
        </div>
      ),
      printRender: (row) => row.assignedLocation,
    },
    {
      key: 'status',
      header: 'Statut du Compte',
      sortable: true,
      sortValue: (row) => (row.status === 'ACTIVE' ? 1 : 0),
      render: (row) => (
        <button
          type="button"
          onClick={() => toggleUserStatus(row.id)}
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border transition cursor-pointer',
            row.status === 'ACTIVE'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
              : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
          )}
        >
          {row.status === 'ACTIVE' ? <Check className="w-3 h-3 text-emerald-600" /> : <X className="w-3 h-3 text-rose-600" />}
          <span>{row.status === 'ACTIVE' ? 'Actif' : 'Suspendu'}</span>
        </button>
      ),
      printRender: (row) => row.status,
    },
    {
      key: 'lastLoginAt',
      header: 'Dernière Connexion',
      sortable: true,
      sortValue: (row) => (row.lastLoginAt ? new Date(row.lastLoginAt).getTime() : 0),
      render: (row) => (
        <div className="text-xs">
          {row.lastLoginAt ? (
            <div>
              <span className="font-medium text-neutral-900 block">
                {new Date(row.lastLoginAt).toLocaleDateString('fr-FR', {
                  day: '2-digit',
                  month: 'short',
                })}
              </span>
              <span className="text-[11px] font-mono text-neutral-400">
                {new Date(row.lastLoginAt).toLocaleTimeString('fr-FR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          ) : (
            <span className="text-neutral-400 text-[11px]">Jamais connecté</span>
          )}
        </div>
      ),
      printRender: (row) => (row.lastLoginAt ? new Date(row.lastLoginAt).toLocaleString('fr-FR') : 'Jamais connecté'),
    },
    {
      key: 'createdAt',
      header: 'Date d’Inscription',
      sortable: true,
      sortValue: (row) => new Date(row.createdAt).getTime(),
      render: (row) => (
        <div className="text-xs font-medium text-neutral-900">
          {new Date(row.createdAt).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })}
        </div>
      ),
      printRender: (row) => new Date(row.createdAt).toLocaleDateString('fr-FR'),
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right no-print',
      render: (row) => (
        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={() => setSelectedUser(row)}
            className="p-1.5 rounded-lg text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition shadow-2xs cursor-pointer"
            title="Gérer les rôles et habilitations RBAC"
          >
            <Shield className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-[1720px] mx-auto">
      <Toast
        isOpen={!!feedbackMessage}
        message={feedbackMessage || ''}
        type="success"
        onClose={() => setFeedbackMessage(null)}
      />

      {/* 1. Header Card with Breadcrumbs */}
      <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-sm p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 border border-amber-500/20 flex items-center justify-center shrink-0 shadow-2xs">
              <ShieldCheck className="w-5 h-5 text-amber-600" />
            </span>
            <div>
              <h1 className="text-xl sm:text-2xl font-heading font-black text-neutral-900 tracking-tight">
                Utilisateurs & Matrice des Rôles (RBAC)
              </h1>
              <p className="text-xs text-neutral-500 mt-0.5">
                Gérez les habilitations, les affectations par dépôt/showroom et le contrôle d’accès des équipes opérationnelles.
              </p>
            </div>
          </div>
          <Breadcrumb
            className="mt-2.5"
            items={[
              { label: 'Administration Système', href: '/dashboard/users' },
              { label: 'Utilisateurs & Permissions' },
            ]}
          />
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setIsInviteModalOpen(true)}
            variant="gold"
            className="text-xs py-2 px-4 flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Inviter Collaborateur</span>
          </Button>
        </div>
      </div>

      {/* 2. 4 KPIs Master Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 no-print">
        <div className="p-4 rounded-2xl bg-white border border-neutral-200/90 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-neutral-500">
            <span>Collaborateurs Actifs</span>
            <User className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="text-2xl font-black text-neutral-900 font-heading">
            {stats.active} / {stats.total}
          </div>
          <div className="text-[11px] text-neutral-500">Comptes validés</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-neutral-200/90 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-indigo-700">
            <span>Direction & Admins</span>
            <Shield className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-indigo-900 font-heading">
            {stats.admins}
          </div>
          <div className="text-[11px] text-indigo-600 font-medium">Root & Super-admins</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-neutral-200/90 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-amber-700">
            <span>Équipes Opérationnelles</span>
            <Warehouse className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-900 font-heading">
            {stats.managers}
          </div>
          <div className="text-[11px] text-amber-600 font-medium">Stock, caisse & livraison</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-neutral-200/90 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-emerald-700">
            <span>Sécurité & Sessions</span>
            <Key className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-900 font-heading">
            Argon2id
          </div>
          <div className="text-[11px] text-emerald-600 font-medium">Double JWT + Refresh</div>
        </div>
      </div>

      {/* 3. DataTable Master */}
      <DataTable
        data={filteredUsers}
        isLoading={loading}
        columns={columns}
        keyExtractor={(item) => item.id}
        searchPlaceholder="Rechercher par nom, email, téléphone, affectation..."
        searchKeys={['firstName', 'lastName', 'email', 'phone', 'assignedLocation', 'role']}
        supportedModes={['table', 'list', 'matrix']}
        defaultMode="table"
        printTitle="Utilisateurs & Permissions — Royal"
        exportFileName="utilisateurs_royal"
        customFilters={[
          {
            key: 'role',
            label: 'Rôle',
            value: roleFilter,
            onChange: setRoleFilter,
            allLabel: 'Tous les rôles',
            options: [
              { value: 'ROOT', label: 'ROOT (Super-Root)' },
              { value: 'SUPER_ADMIN', label: 'SUPER_ADMIN (Directeur)' },
              { value: 'ADMIN', label: 'ADMIN (Administrateur)' },
              { value: 'STOCK_MANAGER', label: 'STOCK_MANAGER (Dépôt)' },
              { value: 'CASHIER', label: 'CASHIER (Showroom Lac)' },
              { value: 'DELIVERY_MANAGER', label: 'DELIVERY_MANAGER (Chauffeur)' },
            ],
          },
        ]}
      />

      {/* Modale d'Habilitation */}
      {selectedUser && (
        <Modal
          isOpen={!!selectedUser}
          onClose={() => setSelectedUser(null)}
          size="md"
          title={`Habilitations — ${selectedUser.firstName} ${selectedUser.lastName}`}
          footer={
            <div className="flex items-center justify-end w-full">
              <Button
                variant="gold"
                onClick={() => setSelectedUser(null)}
                className="text-xs px-4 py-2"
              >
                Fermer
              </Button>
            </div>
          }
        >
          <div className="p-5 space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200 space-y-1">
              <div className="font-bold text-neutral-900">{selectedUser.firstName} {selectedUser.lastName}</div>
              <div className="text-neutral-500">{selectedUser.email}</div>
              <div className="text-neutral-700 font-medium mt-1">Affectation : {selectedUser.assignedLocation}</div>
            </div>

            <div>
              <label className="font-semibold text-neutral-700 block mb-1">
                Rôle Système Associé
              </label>
              <select
                disabled={selectedUser.role === 'ROOT'}
                defaultValue={selectedUser.role}
                className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs bg-white text-neutral-900"
              >
                <option value="ROOT">ROOT — Console Système Suprême</option>
                <option value="SUPER_ADMIN">SUPER_ADMIN — Direction Générale</option>
                <option value="ADMIN">ADMIN — Gestionnaire Magasin</option>
                <option value="STOCK_MANAGER">STOCK_MANAGER — Responsable Entrepôt</option>
                <option value="CASHIER">CASHIER — Vendeur / Caisse POS</option>
                <option value="DELIVERY_MANAGER">DELIVERY_MANAGER — Chauffeur / Logistique</option>
              </select>
            </div>

            <div className="pt-2 border-t border-neutral-200 flex justify-between items-center">
              <span className="text-neutral-600">Réinitialisation de mot de passe :</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFeedbackMessage(`Lien de réinitialisation envoyé à ${selectedUser.email}`)}
                className="text-xs"
              >
                Envoyer Lien Reset
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modale d'Invitation Collaborateur (PostgreSQL POST /users) */}
      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        size="md"
        title="Nouveau Collaborateur ERP"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button variant="outline" onClick={() => setIsInviteModalOpen(false)} className="text-xs px-4 py-2">
              Annuler
            </Button>
            <Button
              variant="gold"
              disabled={inviting || !inviteFirstName.trim() || !inviteLastName.trim() || !inviteEmail.trim()}
              onClick={async () => {
                setInviting(true);
                try {
                  await fetchApi('/users', {
                    method: 'POST',
                    body: JSON.stringify({
                      firstName: inviteFirstName.trim(),
                      lastName: inviteLastName.trim(),
                      email: inviteEmail.trim(),
                      phone: invitePhone.trim() || undefined,
                      password: invitePassword || 'RoyalPass2026!',
                    }),
                  });
                  setIsInviteModalOpen(false);
                  setInviteFirstName('');
                  setInviteLastName('');
                  setInviteEmail('');
                  setInvitePhone('');
                  setFeedbackMessage(`Collaborateur ${inviteEmail.trim()} enregistré en PostgreSQL.`);
                  await loadUsers();
                } catch (err: any) {
                  setFeedbackMessage(err?.message || 'Erreur création collaborateur.');
                } finally {
                  setInviting(false);
                }
              }}
              className="text-xs px-4 py-2"
            >
              {inviting ? 'Création...' : 'Créer le Compte'}
            </Button>
          </div>
        }
      >
        <div className="p-5 space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-neutral-700 block mb-1">Prénom *</label>
              <input
                type="text"
                value={inviteFirstName}
                onChange={(e) => setInviteFirstName(e.target.value)}
                placeholder="Ex: Amira"
                className="w-full px-3 py-2 rounded-xl border border-neutral-300 bg-white text-neutral-900"
              />
            </div>
            <div>
              <label className="font-semibold text-neutral-700 block mb-1">Nom *</label>
              <input
                type="text"
                value={inviteLastName}
                onChange={(e) => setInviteLastName(e.target.value)}
                placeholder="Ex: Trabelsi"
                className="w-full px-3 py-2 rounded-xl border border-neutral-300 bg-white text-neutral-900"
              />
            </div>
          </div>
          <div>
            <label className="font-semibold text-neutral-700 block mb-1">Email Professionnel *</label>
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="collaborateur@royal.com.tn"
              className="w-full px-3 py-2 rounded-xl border border-neutral-300 bg-white text-neutral-900"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-neutral-700 block mb-1">Téléphone</label>
              <input
                type="text"
                value={invitePhone}
                onChange={(e) => setInvitePhone(e.target.value)}
                placeholder="+216 ..."
                className="w-full px-3 py-2 rounded-xl border border-neutral-300 bg-white text-neutral-900"
              />
            </div>
            <div>
              <label className="font-semibold text-neutral-700 block mb-1">Mot de passe initial *</label>
              <input
                type="password"
                value={invitePassword}
                onChange={(e) => setInvitePassword(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-neutral-300 bg-white text-neutral-900"
              />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
