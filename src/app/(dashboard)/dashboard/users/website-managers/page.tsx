'use client';

import { RoleUsersDirectory } from '@/components/dashboard/RoleUsersDirectory';

export default function WebsiteManagersPage() {
  return (
    <RoleUsersDirectory
      roleCode="WEBSITE_MANAGER"
      title="Équipe Website Managers"
      subtitle="Administrateurs e-commerce gérant le catalogue, la vitrine et les publications."
      breadcrumbLabel="Website Managers"
      singularLabel="Website Manager"
      printTitle="Liste des Website Managers — Royal"
    />
  );
}
