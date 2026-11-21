'use client';

import { RoleUsersDirectory } from '@/components/dashboard/RoleUsersDirectory';

export default function FinanciersPage() {
  return (
    <RoleUsersDirectory
      roleCode="FINANCIER"
      title="Équipe Financiers & Comptabilité"
      subtitle="Responsables trésorerie, rapprochements bancaires, chèques, traites et facturation."
      breadcrumbLabel="Financiers"
      singularLabel="Financier"
      printTitle="Liste des Financiers — Royal"
    />
  );
}
