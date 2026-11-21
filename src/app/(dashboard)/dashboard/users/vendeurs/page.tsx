'use client';

import { RoleUsersDirectory } from '@/components/dashboard/RoleUsersDirectory';

export default function VendeursPage() {
  return (
    <RoleUsersDirectory
      roleCode="VENDEUR"
      title="Équipe Vendeurs Showrooms"
      subtitle="Conseillers clientèle et vendeurs opérant dans les salles d'exposition Royal."
      breadcrumbLabel="Vendeurs"
      singularLabel="Vendeur"
      printTitle="Liste des Vendeurs — Royal"
    />
  );
}
