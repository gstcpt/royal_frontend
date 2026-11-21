'use client';

import * as React from 'react';
import {
  Mail,
  Save,
  Send,
  ShieldCheck,
  CheckCircle2,
  Eye,
  EyeOff,
  Server,
  Key,
  RefreshCw,
} from 'lucide-react';
import { Button, Input, Breadcrumb, Toast, Toggle } from '@/components/ui';
import { fetchApi } from '@/lib/api';

export default function SmtpSettingsPage() {
  const [host, setHost] = React.useState('smtp.gmail.com');
  const [port, setPort] = React.useState('587');
  const [user, setUser] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [fromEmail, setFromEmail] = React.useState('royaltn24@gmail.com');
  const [fromName, setFromName] = React.useState('Royal — Électro de Maison');
  const [useTls, setUseTls] = React.useState(true);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [testing, setTesting] = React.useState(false);
  const [testResult, setTestResult] = React.useState<{ ok: boolean; message: string } | null>(null);
  const [toastMsg, setToastMsg] = React.useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  const loadConfig = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchApi('/storefront-cms/sys-config/smtp');
      const v = res?.value || {};
      setHost(v.host || 'smtp.gmail.com');
      setPort(String(v.port || 587));
      setUser(v.user || '');
      setPassword(v.password || '');
      setFromEmail(v.fromEmail || 'royaltn24@gmail.com');
      setFromName(v.fromName || 'Royal — Électro de Maison');
      setUseTls(v.useTls !== false);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await fetchApi('/storefront-cms/sys-config/smtp', {
        method: 'PUT',
        body: JSON.stringify({
          value: {
            host: host.trim(),
            port: Number(port || 587),
            user: user.trim(),
            password,
            fromEmail: fromEmail.trim(),
            fromName: fromName.trim(),
            useTls,
          },
        }),
      });
      setToastMsg({ text: 'Configuration SMTP sauvegardée en base PostgreSQL.', type: 'success' });
    } catch (err: any) {
      setToastMsg({ text: err?.message || 'Erreur sauvegarde SMTP.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleTestSmtp = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetchApi('/storefront-cms/smtp-test', {
        method: 'POST',
        body: JSON.stringify({ host: host.trim(), port: Number(port || 587), user: user.trim() }),
      });
      setTestResult({ ok: Boolean(res?.ok), message: res?.message || 'Test exécuté.' });
    } catch (err: any) {
      setTestResult({ ok: false, message: err?.message || 'Erreur lors du test SMTP.' });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <div className="bg-white p-6 rounded-3xl border border-[#E6E1D6] shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-[#FBF6E8] text-[#B8860B] border border-[#E6D6A6]">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-heading font-black text-[#1D232E] tracking-tight">
                Configuration SMTP &amp; Relais Mailer
              </h1>
              <p className="text-xs text-slate-500">
                Paramètres du serveur d&apos;envoi transactionnel stockés dans PostgreSQL (factures, reset mot de passe, support).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={loadConfig} disabled={loading}>
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Actualiser</span>
            </Button>
            <Button variant="outline" size="sm" onClick={handleTestSmtp} isLoading={testing}>
              <Send className="h-3.5 w-3.5" />
              <span>Tester la Connexion</span>
            </Button>
            <Button variant="gold" size="sm" onClick={handleSave} isLoading={saving}>
              <Save className="h-3.5 w-3.5" />
              <span>Enregistrer SMTP</span>
            </Button>
          </div>
        </div>
        <div className="pt-2 border-t border-slate-100">
          <Breadcrumb
            items={[
              { label: 'Système & CMS', href: '/dashboard/section/system' },
              { label: 'Serveur SMTP' },
            ]}
          />
        </div>
      </div>

      {testResult && (
        <div
          className={`p-4 rounded-2xl border flex items-center gap-3 text-xs font-semibold ${
            testResult.ok
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{testResult.message}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 bg-white p-6 sm:p-8 rounded-3xl border border-[#E6E1D6] shadow-sm space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <Input
                label="Serveur Hôte SMTP *"
                value={host}
                onChange={(e) => setHost(e.target.value)}
                required
                leftIcon={<Server className="h-4 w-4 text-[#C59B27]" />}
              />
            </div>
            <Input
              label="Port SMTP *"
              type="number"
              value={port}
              onChange={(e) => setPort(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Identifiant / Email SMTP *"
              value={user}
              onChange={(e) => setUser(e.target.value)}
              required
            />
            <div>
              <label className="block text-xs font-bold text-[#1D232E] mb-1.5">
                Mot de passe / Clé d&apos;application
              </label>
              <div className="relative flex items-center">
                <Key className="w-4 h-4 text-[#C59B27] absolute left-3.5 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-[#E6E1D6] bg-white text-xs focus:outline-none focus:border-[#C59B27]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 text-slate-500 hover:text-[#1D232E] cursor-pointer"
                  title={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Nom de l'Expéditeur *"
              value={fromName}
              onChange={(e) => setFromName(e.target.value)}
              required
            />
            <Input
              label="Adresse Email Expéditrice *"
              type="email"
              value={fromEmail}
              onChange={(e) => setFromEmail(e.target.value)}
              required
            />
          </div>

          <Toggle
            label="Activer le chiffrement STARTTLS / SSL sécurisé"
            checked={useTls}
            onChange={(v) => setUseTls(v)}
          />
        </div>

        <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-[#E6E1D6] shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[#9A7414]">
            <ShieldCheck className="w-4 h-4" />
            <span>Sécurité &amp; Bonnes Pratiques</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Les identifiants SMTP sont enregistrés de façon persistante dans PostgreSQL et utilisés par tous les modèles de courriels (commandes, réinitialisation et réponses support).
          </p>
          <div className="p-4 rounded-2xl bg-[#FBF9F4] border border-[#E6D6A6] text-xs space-y-1">
            <div className="font-bold text-[#1D232E]">Statut Relais Actuel</div>
            <div className="font-mono text-[#9A7414]">{host}:{port}</div>
            <div className="text-[11px] text-slate-500">{useTls ? 'TLS Activé' : 'Texte clair'}</div>
          </div>
        </div>
      </form>

      <Toast
        isOpen={!!toastMsg}
        message={toastMsg?.text || ''}
        type={toastMsg?.type || 'success'}
        onClose={() => setToastMsg(null)}
      />
    </div>
  );
}
