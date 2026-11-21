'use client';

import { RoleUsersDirectory } from '@/components/dashboard/RoleUsersDirectory';

export default function MagasiniersPage() {
  return (
    <RoleUsersDirectory
      roleCode="MAGASINIER"
      title="Équipe Magasiniers & Dépôts"
      subtitle="Gestionnaires des entrepôts, réceptions fournisseurs, préparations et mouvements de stock."
      breadcrumbLabel="Magasiniers"
      singularLabel="Magasinier"
      printTitle="Liste des Magasiniers — Royal"
    />
  );
}
