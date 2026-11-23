'use client';

import { RoleUsersDirectory } from '@/components/dashboard/RoleUsersDirectory';

export default function UsersManagementPage() {
  return (
    <RoleUsersDirectory
      roleCode="ALL"
      title="Tous les Utilisateurs & Habilitations RBAC"
      subtitle="Annuaire complet de tous les comptes utilisateurs (tous rôles confondus) connectés à PostgreSQL."
      breadcrumbLabel="Tous les utilisateurs"
      singularLabel="Collaborateur"
      printTitle="Annuaire Global des Utilisateurs — Royal"
    />
  );
}
