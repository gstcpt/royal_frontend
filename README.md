# Royal Frontend (`apps/frontend`)

> Interface Vitrine E-Commerce & Dashboard ERP Unifié (**Next.js 15.5 App Router** + **React 19** + **Tailwind CSS**) — Charte **Light Luxury Or & Argent**.

---

## 🧭 Groupes de Routes (`102` `page.tsx` + `1` Proxy API ➔ `105` Routes Next.js)

- **Storefront Public (`(public)/`, `17` pages)** : `/`, `/articles`, `/articles/[slug]`, `/products`, `/products/[slug]`, `/categories/[slug]`, `/compare`, `/wishlist`, `/cart`, `/checkout`, `/order-confirmation/[orderNumber]`, `/track-order`, `/contact`, `/faq`, `/stores`, `/privacy`, `/terms`.
- **Authentification (`(auth)/`, `3` pages)** : `/login`, `/register`, `/forgot-password` *(toggle œil `Eye`/`EyeOff` universel sur mots de passe)*.
- **Dashboard & Espace Client Unifié (`(dashboard)/`, `81` pages)** : Coquille unique [`(dashboard)/layout.tsx`](file:///e:/ToUse/BSofts/ecommerce/apps/frontend/src/app/(dashboard)/layout.tsx) en **13 sections** gouvernées par RBAC (`356` permissions), `sys.roleViews` (`RoleStudioPanel`), et `sys.visibility` (`78` vues dans `/dashboard/root/visibility`).
- **Livreur (`(delivery)/`, `1` page)** : `/delivery`.
- **Proxy API Intégré** : [`src/app/api/v1/[...path]/route.ts`](file:///e:/ToUse/BSofts/ecommerce/apps/frontend/src/app/api/v1/%5B...path%5D/route.ts) transférant `/api/v1/*` vers `INTERNAL_API_URL` (`http://backend:4000` en Docker, `http://127.0.0.1:4000` sur VPS, `http://localhost:4000` en local).
- **SEO & PWA** : [`public/google0de1c0d6985bf862.html`](file:///e:/ToUse/BSofts/ecommerce/apps/frontend/public/google0de1c0d6985bf862.html), meta Search Console SSR, `manifest.webmanifest`, `sw.js`.

---

## 🎨 Primitives UI & Conventions Obligatoires

- **Zéro classe `dark:`** et **zéro barre de défilement dans les modales** (`<Modal>`, `<DeleteConfirmModal>`, `<ViewGuideModal>` avec portails `position: fixed`).
- **Primitives centralisées (`src/components/ui/`)** : `<DataTable>` (pagination `[6, 12, 24, 48, 96]` défaut `12` sans `All`, multi-sélection + export), `<Toggle compact size="sm" />`, `<Input type="password" />` (bouton œil), `<DateRangePicker>`, `<FilterDropdown>`, `<Wizard>`, `<ImageDropzoneCropper>`, `<Toast>`.
- **Providers & Hydratation Sûre (`#418`)** : [`CmsConfigProvider`](file:///e:/ToUse/BSofts/ecommerce/apps/frontend/src/providers/CmsConfigProvider.tsx), [`DashboardVisibilityProvider`](file:///e:/ToUse/BSofts/ecommerce/apps/frontend/src/providers/DashboardVisibilityProvider.tsx), [`AiAssistantProvider`](file:///e:/ToUse/BSofts/ecommerce/apps/frontend/src/providers/AiAssistantProvider.tsx), stores Zustand (`auth`, `cart`, `wishlist`, `compare`, `i18n`, `reaction`, `review`) avec `hydrate()` différée post-montage.

---

## 🌐 Environnements & Fichiers `.env`

| Fichier | Usage | Suivi Git |
| :--- | :--- | :---: |
| [`.env.local`](file:///e:/ToUse/BSofts/ecommerce/apps/frontend/.env.local) | Développement local Windows (`INTERNAL_API_URL=http://localhost:4000`) | ❌ Ignoré |
| [`.env.vps`](file:///e:/ToUse/BSofts/ecommerce/apps/frontend/.env.vps) | Production VPS Oxahost (`/opt/royal/frontend/.env`, `PORT=3100`, `HOSTNAME=127.0.0.1`) | ❌ Ignoré |
| [`.env.vps.example`](file:///e:/ToUse/BSofts/ecommerce/apps/frontend/.env.vps.example) | Modèle sûr pour `/opt/royal/frontend/.env` sur VPS | ✅ Trackable |
| [`.env.vercel`](file:///e:/ToUse/BSofts/ecommerce/apps/frontend/.env.vercel) | Variables Vercel (archive démo) | ❌ Ignoré |

---

## 🐳 Docker & Commandes

```bash
# Depuis apps/frontend/
pnpm dev           # Next.js dev server (:3100)
pnpm type-check    # tsc --noEmit
pnpm build         # next build (ajouter NEXT_STANDALONE=true pour runner standalone)
pnpm start         # next start -p 3100
```

- **Docker Local (`royal_frontend`)** : [`Dockerfile.dev`](file:///e:/ToUse/BSofts/ecommerce/apps/frontend/Dockerfile.dev) monté via [`docker-compose.yml`](file:///e:/ToUse/BSofts/ecommerce/docker-compose.yml) sur port `3100`.
- **Docker Production** : [`Dockerfile`](file:///e:/ToUse/BSofts/ecommerce/apps/frontend/Dockerfile) multi-stage avec `NEXT_STANDALONE=true`, assets `apps/frontend/public` et `apps/frontend/.next/static`, serveur `node apps/frontend/server.js`.
