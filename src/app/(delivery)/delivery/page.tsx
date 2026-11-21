import { CheckCircle2, Clock, MapPin, Navigation } from 'lucide-react';

export default function DeliveryDashboardPage() {
  return (
    <div className="space-y-4">
      <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
        <h2 className="text-sm font-bold text-white">Vos courses du jour</h2>
        <p className="text-xs text-slate-400 mt-1">0 livraison en attente d'acheminement</p>
      </div>

      <div className="bg-slate-800/60 p-6 rounded-xl border border-dashed border-slate-700 text-center space-y-2">
        <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto" />
        <div className="text-sm font-semibold text-slate-200">Toutes les livraisons sont terminées</div>
        <p className="text-xs text-slate-500">De nouvelles courses vous seront assignées par le responsable logistique.</p>
      </div>
    </div>
  );
}
