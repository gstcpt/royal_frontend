'use client';

import { RoleUsersDirectory } from '@/components/dashboard/RoleUsersDirectory';

export default function SuperAdminsPage() {
  return (
    <RoleUsersDirectory
      roleCode="SUPERADMIN"
      title="Direction Générale — Super Administrateurs"
      subtitle="Comptes Direction Générale connectés à PostgreSQL avec supervision totale ERP."
      breadcrumbParent={{ label: 'Système & Utilisateurs', href: '/dashboard/users' }}
      breadcrumbLabel="Super Admin"
      singularLabel="Super Admin"
      printTitle="Liste des Super Administrateurs — Royal"
    />
  );
}
