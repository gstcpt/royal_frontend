import Link from 'next/link';
import { ArrowLeft, Home, Sparkles } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FDFCF9] text-[#1D232E] p-6">
      <div className="max-w-md w-full bg-white border border-[#E6D6A6] rounded-3xl p-8 text-center shadow-sm space-y-5">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-[#FBF6E8] border border-[#E6D6A6] text-[#C59B27] flex items-center justify-center">
          <Sparkles className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-widest text-[#9A7414]">
            Erreur 404
          </span>
          <h1 className="text-2xl font-heading font-black text-[#1D232E]">
            Page introuvable
          </h1>
          <p className="text-xs text-slate-500 leading-relaxed">
            La page demandée n&apos;existe pas ou a été déplacée dans le catalogue Royal.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--royal-primary)] text-[var(--royal-primary-text)] text-xs font-bold shadow-xs hover:bg-[var(--royal-primary-hover)] transition"
          >
            <Home className="w-4 h-4" />
            <span>Accueil Storefront</span>
          </Link>
          <Link
            href="/articles"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-[#E6E1D6] bg-white text-xs font-bold text-[#1D232E] hover:bg-[#FBF6E8] transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voir le Catalogue</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
