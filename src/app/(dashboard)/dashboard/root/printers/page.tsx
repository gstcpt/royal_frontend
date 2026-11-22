'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PrintersRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/dashboard/root/print-templates?tab=printers');
  }, [router]);

  return (
    <div className="p-8 text-center text-xs text-slate-500">
      Redirection vers la vue unifiée Documents &amp; Imprimantes POS...
    </div>
  );
}
