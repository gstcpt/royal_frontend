'use client';

import { RoleUsersDirectory } from '@/components/dashboard/RoleUsersDirectory';

export default function CommercialsPage() {
  return (
    <RoleUsersDirectory
      roleCode="COMMERCIAL"
      title="Équipe Commercials & Développement B2B"
      subtitle="Comptes Commercial chargés du catalogue, de la prospection, des devis et du suivi clients."
      breadcrumbLabel="Commercials"
      singularLabel="Commercial"
      printTitle="Liste des Commercials — Royal"
    />
  );
}
