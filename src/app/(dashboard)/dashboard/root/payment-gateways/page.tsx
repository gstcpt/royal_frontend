'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PaymentGatewaysRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/dashboard/payment-methods?tab=gateways');
  }, [router]);

  return (
    <div className="p-8 text-center text-xs text-slate-500">
      Redirection vers la vue unifiée Modalités &amp; Passerelles de Paiement...
    </div>
  );
}
