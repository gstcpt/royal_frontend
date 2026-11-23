'use client';

import { RoleUsersDirectory } from '@/components/dashboard/RoleUsersDirectory';

export default function DeliveryManagersUsersPage() {
  return (
    <RoleUsersDirectory
      roleCode="DELIVERY_MANAGER"
      title="Responsables Livraison & Flotte"
      subtitle="Superviseurs logistiques pilotant les tournées, transporteurs et expéditions."
      breadcrumbLabel="Responsables Livraison"
      singularLabel="Responsable Livraison"
      printTitle="Liste des Responsables Livraison — Royal"
    />
  );
}
