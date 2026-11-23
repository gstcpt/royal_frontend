'use client';

import { RoleUsersDirectory } from '@/components/dashboard/RoleUsersDirectory';

export default function AdminsUsersPage() {
  return (
    <RoleUsersDirectory
      roleCode="ADMIN"
      title="Équipe Administrateurs Système"
      subtitle="Administrateurs disposant des droits étendus d'exploitation et de gestion catalogue."
      breadcrumbLabel="Administrateurs"
      singularLabel="Administrateur"
      printTitle="Liste des Administrateurs — Royal"
    />
  );
}
