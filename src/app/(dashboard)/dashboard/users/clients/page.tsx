'use client';

import { RoleUsersDirectory } from '@/components/dashboard/RoleUsersDirectory';

export default function ClientRoleUsersPage() {
  return (
    <RoleUsersDirectory
      roleCode="CLIENT"
      title="Comptes Utilisateurs Clients"
      subtitle="Comptes authentifiés disposant du rôle CLIENT pour l'espace acheteur Royal."
      breadcrumbLabel="Clients (Comptes)"
      singularLabel="Client"
      printTitle="Liste des Comptes Clients — Royal"
    />
  );
}
