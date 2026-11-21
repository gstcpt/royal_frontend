import React from 'react';
import { HomePageSections } from '@/components/storefront/HomePageSections';
import { StorefrontProduct } from '@/components/storefront/ProductCard';
import { getSafeImageUrl } from '@/lib/cart-session';

export const dynamic = 'force-dynamic';

const COLLISION_BACKEND_HOSTS = new Set([
  'royal-backend.vercel.app',
  'royalbackend.vercel.app',
]);

function resolveServerApiBase(): string {
  const candidates = [
    process.env.INTERNAL_API_URL,
    process.env.BACKEND_INTERNAL_URL,
    process.env.BACKEND_URL,
    process.env.NEXT_PUBLIC_BACKEND_URL,
  ];

  for (const candidate of candidates) {
    if (!candidate) continue;
    const cleaned = candidate.trim().replace(/\/api\/v1\/?$/, '').replace(/\/+$/, '');
    if (!cleaned) continue;
    try {
      const parsed = new URL(cleaned);
      if (COLLISION_BACKEND_HOSTS.has(parsed.hostname.toLowerCase())) {
        continue;
      }
      return `${cleaned}/api/v1`;
    } catch {
      continue;
    }
  }

  return process.env.VERCEL
    ? 'https://royal-electro-backend.vercel.app/api/v1'
    : 'http://localhost:4000/api/v1';
}

async function getStorefrontData() {
  const backendInternal = resolveServerApiBase();

  try {
    const [catRes, newRes, popRes, promoRes, bestRes, brandRes] = await Promise.all([
      fetch(`${backendInternal}/categories?tree=false`, { cache: 'no-store' }),
      fetch(`${backendInternal}/products/storefront?sortBy=newest&limit=16`, { cache: 'no-store' }),
      fetch(`${backendInternal}/products/storefront?sortBy=popular&limit=16`, { cache: 'no-store' }),
      fetch(`${backendInternal}/products/storefront?collection=promo&limit=16`, { cache: 'no-store' }),
      fetch(`${backendInternal}/products/storefront?sortBy=bestsellers&limit=24`, { cache: 'no-store' }),
      fetch(`${backendInternal}/brands`, { cache: 'no-store' }),
    ]);

    const parseProducts = async (res: Response): Promise<StorefrontProduct[]> => {
      if (!res.ok) return [];
      const json = await res.json();
      const list = json?.data?.data || json?.data || json?.products || [];
      return Array.isArray(list)
        ? list.map((p: any) => ({
            ...p,
            primaryImage: getSafeImageUrl(p.primaryImage),
          }))
        : [];
    };

    let categories: any[] = [];
    if (catRes.ok) {
      const catData = await catRes.json();
      const list = catData?.data || catData;
      if (Array.isArray(list)) {
        categories = list
          .filter((c: any) => c.isActive !== false && Number(c.productsCount ?? c._count?.products ?? 0) > 0 && c.imageUrl)
          .map((c: any) => ({
            ...c,
            imageUrl: getSafeImageUrl(c.imageUrl),
            productCount: Number(c.productsCount ?? c._count?.products ?? 0),
          }));
      }
    }

    const newProducts = await parseProducts(newRes);
    const topRatedProducts = await parseProducts(popRes);
    const promoProducts = await parseProducts(promoRes);
    const bestSellerPool = await parseProducts(bestRes);

    let brands: Array<{ name: string; slug?: string }> = [];
    if (brandRes.ok) {
      const brandData = await brandRes.json();
      const list = brandData?.data || brandData;
      if (Array.isArray(list)) {
        brands = list.filter((b: any) => b.isActive !== false);
      }
    }

    // Last added product for "Coup de Coeur de la Rédaction"
    const spotlightProduct = newProducts[0] || bestSellerPool[0] || null;

    // Deterministic highlight product so server renders never diverge
    const highlightProduct = bestSellerPool[0] || newProducts[1] || spotlightProduct;

    // Featured products for Galerie & Inspirations
    const featuredProducts = newProducts.filter((p) => p.isFeatured).slice(0, 4);
    const galleryProducts = featuredProducts.length >= 4 ? featuredProducts : newProducts.slice(0, 4);

    return {
      categories,
      brands,
      newProducts,
      topRatedProducts,
      promoProducts,
      spotlightProduct,
      highlightProduct,
      galleryProducts,
    };
  } catch {
    return {
      categories: [],
      brands: [],
      newProducts: [],
      topRatedProducts: [],
      promoProducts: [],
      spotlightProduct: null,
      highlightProduct: null,
      galleryProducts: [],
    };
  }
}

export default async function HomePage() {
  const {
    categories,
    brands,
    newProducts,
    topRatedProducts,
    promoProducts,
    spotlightProduct,
    highlightProduct,
    galleryProducts,
  } = await getStorefrontData();

  return (
    <HomePageSections
      categories={categories}
      brands={brands}
      newProducts={newProducts}
      topRatedProducts={topRatedProducts}
      promoProducts={promoProducts}
      spotlightProduct={spotlightProduct}
      highlightProduct={highlightProduct}
      galleryProducts={galleryProducts}
    />
  );
}
