'use client';

import { RoleUsersDirectory } from '@/components/dashboard/RoleUsersDirectory';

export default function MarketingUsersPage() {
  return (
    <RoleUsersDirectory
      roleCode="MARKETING"
      title="Équipe Marketing & Croissance"
      subtitle="Comptes Marketing dédiés aux campagnes promotionnelles, SEO, newsletters, témoignages et analytics."
      breadcrumbLabel="Marketing"
      singularLabel="Membre Marketing"
      printTitle="Équipe Marketing — Royal"
    />
  );
}
