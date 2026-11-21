import Link from 'next/link';
import { Truck, LogOut } from 'lucide-react';

export default function DeliveryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#FBF9F5] text-neutral-900 flex flex-col">
      <header className="h-14 bg-white border-b border-[#E6E1D6] px-4 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-xl bg-[#FBF6E8] border border-[#E6D6A6] text-[var(--royal-primary)]">
            <Truck className="h-4 w-4" />
          </div>
          <span className="font-bold text-sm text-neutral-900">Royal — Terminal Livreur</span>
        </div>
        <Link href="/" className="text-xs font-semibold text-neutral-500 hover:text-[var(--royal-primary)] flex items-center gap-1.5 transition">
          <LogOut className="h-4 w-4" />
          <span>Sortir</span>
        </Link>
      </header>
      <main className="flex-1 p-4 max-w-lg mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
