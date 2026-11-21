'use client';

import { RoleUsersDirectory } from '@/components/dashboard/RoleUsersDirectory';

export default function CaissiersPage() {
  return (
    <RoleUsersDirectory
      roleCode="CAISSIER"
      title="Équipe Caissiers Showroom POS"
      subtitle="Opérateurs d'encaissement et gestionnaires des sessions de caisse en showroom."
      breadcrumbLabel="Caissiers"
      singularLabel="Caissier"
      printTitle="Liste des Caissiers — Royal"
    />
  );
}
