import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck } from 'lucide-react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#F8F9FA]">
      {/* Top Header */}
      <header className="w-full border-b border-neutral-200 bg-white/80 backdrop-blur-md py-4 px-6 sm:px-10 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden border border-amber-400/60 bg-[#FDF9F0] shadow-xs shrink-0">
            <img src="/images/royal-logo.jpg" alt="Royal" className="w-full h-full object-cover" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-heading font-black text-2xl tracking-tighter text-neutral-900">
              ROYAL
            </span>
            <span className="text-[10px] uppercase font-bold tracking-widest text-amber-600 border-l border-neutral-300 pl-2.5">
              Electro de Maison
            </span>
          </div>
        </Link>

        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-600 hover:text-neutral-950 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour à la boutique</span>
        </Link>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-8">
        <div className="w-full max-w-md">
          {children}
        </div>
      </main>

      {/* Bottom Footer */}
      <footer className="w-full py-4 px-6 border-t border-neutral-200 bg-white text-center text-xs text-neutral-500 flex items-center justify-center gap-2">
        <ShieldCheck className="w-4 h-4 text-neutral-900" />
        <span>Connexion sécurisée SSL 256-bit &copy; {new Date().getFullYear()} Royal. Tous droits réservés.</span>
      </footer>
    </div>
  );
}
