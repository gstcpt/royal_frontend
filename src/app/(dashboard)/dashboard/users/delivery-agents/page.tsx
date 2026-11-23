'use client';

import { RoleUsersDirectory } from '@/components/dashboard/RoleUsersDirectory';

export default function DeliveryAgentsUsersPage() {
  return (
    <RoleUsersDirectory
      roleCode="DELIVERY_AGENT"
      title="Équipe Livreurs & Coursiers"
      subtitle="Agents de livraison assurant les remises de colis et confirmations sur le terrain."
      breadcrumbLabel="Livreurs"
      singularLabel="Livreur"
      printTitle="Liste des Livreurs — Royal"
    />
  );
}
