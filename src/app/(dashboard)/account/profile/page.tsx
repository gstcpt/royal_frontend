'use client';

import * as React from 'react';
import {
  User,
  Save,
  CheckCircle2,
  AlertCircle,
  Camera,
  Trash2,
  MapPin,
  Receipt,
  Calendar,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { Breadcrumb, Button, Input } from '@/components/ui';
import { fetchApi } from '@/lib/api';

interface AddressFormState {
  firstName: string;
  lastName: string;
  phone: string;
  street: string;
  street2: string;
  city: string;
  state: string;
  postalCode: string;
}

const EMPTY_ADDRESS: AddressFormState = {
  firstName: '',
  lastName: '',
  phone: '',
  street: '',
  street2: '',
  city: '',
  state: '',
  postalCode: '',
};

const GENDER_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'MALE', label: 'Homme' },
  { value: 'FEMALE', label: 'Femme' },
  { value: 'OTHER', label: 'Autre' },
  { value: 'PREFER_NOT_TO_SAY', label: 'Ne pas préciser' },
];

function computeAgeFromDate(dateStr: string): number | null {
  if (!dateStr) return null;
  const dob = new Date(dateStr);
  if (Number.isNaN(dob.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age >= 0 && age < 120 ? age : null;
}

function resizeImageToDataUrl(file: File, maxSize = 256): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = maxSize;
        canvas.height = maxSize;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(String(reader.result || ''));
        const minSide = Math.min(img.width, img.height);
        const sx = (img.width - minSide) / 2;
        const sy = (img.height - minSide) / 2;
        ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, maxSize, maxSize);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = reject;
      img.src = String(reader.result || '');
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function AccountProfilePage() {
  const { user, fetchMe } = useAuthStore();
  const [firstName, setFirstName] = React.useState(user?.firstName || '');
  const [lastName, setLastName] = React.useState(user?.lastName || '');
  const [email, setEmail] = React.useState(user?.email || '');
  const [phone, setPhone] = React.useState('');
  const [avatar, setAvatar] = React.useState<string>('');
  const [birthDate, setBirthDate] = React.useState<string>('');
  const [gender, setGender] = React.useState<string>('PREFER_NOT_TO_SAY');
  const [shippingAddress, setShippingAddress] = React.useState<AddressFormState>(EMPTY_ADDRESS);
  const [billingAddress, setBillingAddress] = React.useState<AddressFormState>(EMPTY_ADDRESS);
  const [sameAsShipping, setSameAsShipping] = React.useState(false);

  const [loadingProfile, setLoadingProfile] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [statusMsg, setStatusMsg] = React.useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    setLoadingProfile(true);
    fetchApi('/storefront-cms/my-profile')
      .then((res) => {
        const p = res?.data || res;
        if (p) {
          setFirstName(p.firstName || user?.firstName || '');
          setLastName(p.lastName || user?.lastName || '');
          setEmail(p.email || user?.email || '');
          setPhone(p.phone || '');
          setAvatar(p.avatar || '');
          setBirthDate(p.birthDate ? String(p.birthDate).slice(0, 10) : '');
          setGender(p.gender || 'PREFER_NOT_TO_SAY');
          const ship = p.shippingAddress
            ? {
                firstName: p.shippingAddress.firstName || '',
                lastName: p.shippingAddress.lastName || '',
                phone: p.shippingAddress.phone || '',
                street: p.shippingAddress.street || '',
                street2: p.shippingAddress.street2 || '',
                city: p.shippingAddress.city || '',
                state: p.shippingAddress.state || '',
                postalCode: p.shippingAddress.postalCode || '',
              }
            : {
                ...EMPTY_ADDRESS,
                firstName: p.firstName || '',
                lastName: p.lastName || '',
                phone: p.phone || '',
              };
          const bill = p.billingAddress
            ? {
                firstName: p.billingAddress.firstName || '',
                lastName: p.billingAddress.lastName || '',
                phone: p.billingAddress.phone || '',
                street: p.billingAddress.street || '',
                street2: p.billingAddress.street2 || '',
                city: p.billingAddress.city || '',
                state: p.billingAddress.state || '',
                postalCode: p.billingAddress.postalCode || '',
              }
            : { ...EMPTY_ADDRESS };
          setShippingAddress(ship);
          setBillingAddress(bill);
          if (
            p.shippingAddress &&
            p.billingAddress &&
            p.shippingAddress.street === p.billingAddress.street &&
            p.shippingAddress.city === p.billingAddress.city
          ) {
            setSameAsShipping(true);
          }
        }
      })
      .catch(() => null)
      .finally(() => setLoadingProfile(false));
  }, [user?.email, user?.firstName, user?.lastName]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await resizeImageToDataUrl(file, 256);
      setAvatar(dataUrl);
    } catch {
      setStatusMsg({ type: 'error', text: "Impossible de lire l'image sélectionnée." });
    }
  };

  const age = computeAgeFromDate(birthDate);
  const initials = `${(firstName?.[0] || user?.firstName?.[0] || 'U').toUpperCase()}${(
    lastName?.[0] ||
    user?.lastName?.[0] ||
    ''
  ).toUpperCase()}`;

  const effectiveBilling = sameAsShipping ? shippingAddress : billingAddress;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatusMsg(null);
    try {
      await fetchApi('/storefront-cms/my-profile', {
        method: 'PATCH',
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: phone.trim(),
          avatar: avatar || null,
          birthDate: birthDate || null,
          gender: gender || null,
          shippingAddress: shippingAddress.street.trim() && shippingAddress.city.trim()
            ? shippingAddress
            : undefined,
          billingAddress: effectiveBilling.street.trim() && effectiveBilling.city.trim()
            ? effectiveBilling
            : undefined,
        }),
      });
      await fetchMe();
      setStatusMsg({
        type: 'success',
        text: 'Profil, avatar et adresses enregistrés avec succès.',
      });
      setTimeout(() => setStatusMsg(null), 4000);
    } catch (err: any) {
      setStatusMsg({
        type: 'error',
        text: err?.message || 'Erreur lors de la mise à jour du profil.',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 w-full max-w-[1600px] mx-auto">
      <Breadcrumb
        items={[
          { label: 'Mon Espace Client', href: '/dashboard' },
          { label: 'Mon Profil' },
        ]}
      />

      {/* Page Header */}
      <div className="bg-white p-6 rounded-2xl border border-neutral-200/80 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-2xl">
            <User className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-heading font-black text-neutral-900 tracking-tight">
              Mon Profil
            </h1>
            <p className="text-xs text-neutral-500">
              Personnalisez votre photo de profil, vos informations personnelles et vos adresses de livraison et de facturation.
            </p>
          </div>
        </div>

        {statusMsg && (
          <div
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-xs font-bold ${
              statusMsg.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}
          >
            {statusMsg.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <span>{statusMsg.text}</span>
          </div>
        )}
      </div>

      {loadingProfile ? (
        <div className="bg-white p-12 rounded-2xl border border-neutral-200 text-center text-xs text-neutral-500">
          Chargement de vos informations...
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          {/* Row 1: Avatar + Personal Details */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Avatar Card */}
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-neutral-200/80 shadow-sm flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative group">
                <div className="w-28 h-28 rounded-3xl bg-[var(--royal-primary)] text-[var(--royal-primary-text)] font-heading font-black text-3xl flex items-center justify-center overflow-hidden border-2 border-[#E6D6A6] shadow-md">
                  {avatar ? (
                    <img
                      src={avatar}
                      alt={`${firstName} ${lastName}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{initials}</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  title="Changer de photo"
                  className="absolute -bottom-2 -right-2 w-9 h-9 rounded-full bg-amber-500 text-white border-2 border-white flex items-center justify-center shadow-sm hover:bg-amber-600 transition cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />

              <div className="space-y-1">
                <div className="text-sm font-black text-neutral-900">
                  {firstName || user?.firstName} {lastName || user?.lastName}
                </div>
                <div className="text-xs text-neutral-500">{email}</div>
                {age !== null && (
                  <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-bold mt-1">
                    <Calendar className="w-3 h-3" />
                    <span>{age} ans</span>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs"
                >
                  <Camera className="w-3.5 h-3.5 mr-1.5" />
                  Importer une photo
                </Button>
                {avatar && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setAvatar('')}
                    className="text-xs text-rose-600 hover:bg-rose-50"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1" />
                    Initiales
                  </Button>
                )}
              </div>
            </div>

            {/* Identity & Bio Card */}
            <div className="lg:col-span-2 bg-white p-6 sm:p-8 rounded-2xl border border-neutral-200/80 shadow-sm space-y-5">
              <h2 className="text-sm font-bold text-neutral-900 uppercase tracking-wider border-b border-neutral-100 pb-3">
                Identité &amp; Informations de Contact
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Prénom *"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
                <Input
                  label="Nom *"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
                <Input label="Adresse Email" type="email" value={email} disabled />
                <Input
                  label="Téléphone Mobile"
                  placeholder="+216 XX XXX XXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
                <div>
                  <Input
                    label="Date de naissance"
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                  />
                  {age !== null && (
                    <p className="text-[11px] text-amber-700 font-semibold mt-1">
                      Âge calculé automatiquement : {age} ans
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                    Genre / Civilité
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {GENDER_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setGender(opt.value)}
                        className={`px-3 py-2 rounded-xl border text-xs font-bold transition cursor-pointer ${
                          gender === opt.value
                            ? 'bg-[var(--royal-primary)] text-[var(--royal-primary-text)] border-[var(--royal-primary)] shadow-xs'
                            : 'bg-[#F8F9FA] text-neutral-700 border-neutral-200 hover:border-[#C59B27]'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Row 2: Shipping & Billing Addresses */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Shipping Address */}
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-neutral-200/80 shadow-sm space-y-5">
              <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
                <MapPin className="w-4 h-4 text-amber-600" />
                <h2 className="text-sm font-bold text-neutral-900 uppercase tracking-wider">
                  Adresse de Livraison Principale
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Prénom destinataire"
                  value={shippingAddress.firstName}
                  onChange={(e) =>
                    setShippingAddress({ ...shippingAddress, firstName: e.target.value })
                  }
                />
                <Input
                  label="Nom destinataire"
                  value={shippingAddress.lastName}
                  onChange={(e) =>
                    setShippingAddress({ ...shippingAddress, lastName: e.target.value })
                  }
                />
                <Input
                  label="Téléphone livraison"
                  placeholder="+216 XX XXX XXX"
                  value={shippingAddress.phone}
                  onChange={(e) =>
                    setShippingAddress({ ...shippingAddress, phone: e.target.value })
                  }
                />
                <Input
                  label="Gouvernorat"
                  placeholder="Ex: Tunis, Ariana, Sousse..."
                  value={shippingAddress.state}
                  onChange={(e) =>
                    setShippingAddress({ ...shippingAddress, state: e.target.value })
                  }
                />
                <div className="sm:col-span-2">
                  <Input
                    label="Adresse / Rue & Numéro"
                    placeholder="Ex: 18 Avenue Habib Bourguiba"
                    value={shippingAddress.street}
                    onChange={(e) =>
                      setShippingAddress({ ...shippingAddress, street: e.target.value })
                    }
                  />
                </div>
                <div className="sm:col-span-2">
                  <Input
                    label="Complément d'adresse (Appartement, étage...)"
                    value={shippingAddress.street2}
                    onChange={(e) =>
                      setShippingAddress({ ...shippingAddress, street2: e.target.value })
                    }
                  />
                </div>
                <Input
                  label="Ville / Délégation"
                  placeholder="Ex: Tunis"
                  value={shippingAddress.city}
                  onChange={(e) =>
                    setShippingAddress({ ...shippingAddress, city: e.target.value })
                  }
                />
                <Input
                  label="Code Postal"
                  placeholder="Ex: 1000"
                  value={shippingAddress.postalCode}
                  onChange={(e) =>
                    setShippingAddress({ ...shippingAddress, postalCode: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Billing Address */}
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-neutral-200/80 shadow-sm space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-100 pb-3">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-amber-600" />
                  <h2 className="text-sm font-bold text-neutral-900 uppercase tracking-wider">
                    Adresse de Facturation
                  </h2>
                </div>
                <label className="inline-flex items-center gap-2 text-xs font-semibold text-neutral-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sameAsShipping}
                    onChange={(e) => setSameAsShipping(e.target.checked)}
                    className="rounded border-neutral-300 text-neutral-950 focus:ring-amber-500"
                  />
                  <span>Identique à la livraison</span>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Prénom facturation"
                  disabled={sameAsShipping}
                  value={effectiveBilling.firstName}
                  onChange={(e) =>
                    setBillingAddress({ ...billingAddress, firstName: e.target.value })
                  }
                />
                <Input
                  label="Nom facturation"
                  disabled={sameAsShipping}
                  value={effectiveBilling.lastName}
                  onChange={(e) =>
                    setBillingAddress({ ...billingAddress, lastName: e.target.value })
                  }
                />
                <Input
                  label="Téléphone"
                  disabled={sameAsShipping}
                  value={effectiveBilling.phone}
                  onChange={(e) =>
                    setBillingAddress({ ...billingAddress, phone: e.target.value })
                  }
                />
                <Input
                  label="Gouvernorat"
                  disabled={sameAsShipping}
                  value={effectiveBilling.state}
                  onChange={(e) =>
                    setBillingAddress({ ...billingAddress, state: e.target.value })
                  }
                />
                <div className="sm:col-span-2">
                  <Input
                    label="Adresse / Rue & Numéro"
                    disabled={sameAsShipping}
                    value={effectiveBilling.street}
                    onChange={(e) =>
                      setBillingAddress({ ...billingAddress, street: e.target.value })
                    }
                  />
                </div>
                <div className="sm:col-span-2">
                  <Input
                    label="Complément d'adresse"
                    disabled={sameAsShipping}
                    value={effectiveBilling.street2}
                    onChange={(e) =>
                      setBillingAddress({ ...billingAddress, street2: e.target.value })
                    }
                  />
                </div>
                <Input
                  label="Ville"
                  disabled={sameAsShipping}
                  value={effectiveBilling.city}
                  onChange={(e) =>
                    setBillingAddress({ ...billingAddress, city: e.target.value })
                  }
                />
                <Input
                  label="Code Postal"
                  disabled={sameAsShipping}
                  value={effectiveBilling.postalCode}
                  onChange={(e) =>
                    setBillingAddress({ ...billingAddress, postalCode: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={saving} className="text-xs px-8">
              <Save className="h-3.5 w-3.5 mr-2" />
              {saving ? 'Enregistrement en cours...' : 'Enregistrer toutes mes modifications'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
