'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  Search,
  ShoppingBag,
  Heart,
  User,
  Layers,
  Menu,
  X,
  Globe,
  ChevronDown,
  LogOut,
  LayoutDashboard,
} from 'lucide-react';
import { useCompareStore } from '@/stores/compare.store';
import { useWishlistStore } from '@/stores/wishlist.store';
import { useCartStore } from '@/stores/cart.store';
import { useAuthStore } from '@/stores/auth.store';
import { useI18nStore } from '@/stores/i18n.store';
import { useCmsConfig } from '@/providers/CmsConfigProvider';

export function StorefrontHeader() {
  const { config } = useCmsConfig();
  const router = useRouter();
  const pathname = usePathname();
  const isHomePage = pathname === '/';

  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const categoryMenuRef = React.useRef<HTMLDivElement>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [dynamicCategories, setDynamicCategories] = useState<Array<{ id: string; name: string; slug: string; productsCount?: number }>>([]);
  const [freeThreshold, setFreeThreshold] = useState<number>(150);

  const compareCount = useCompareStore((state) => state.items.length);
  const wishlistCount = useWishlistStore((state) => state.items.length);
  const cartItemsCount = useCartStore((state) =>
    (state.cart?.items || []).reduce((acc, it) => acc + it.quantity, 0)
  );
  const fetchCart = useCartStore((state) => state.fetchCart);
  const { user, isAuthenticated, fetchMe, logout } = useAuthStore();
  const { locale, setLocale } = useI18nStore();

  const isClientOnly =
    Boolean(user?.roles?.includes('CLIENT')) &&
    !user?.roles?.some((r) => ['ROOT', 'SUPER_ADMIN', 'ADMIN', 'WEBSITE_MANAGER'].includes(r));
  const accountHref = isAuthenticated ? '/dashboard' : '/login';

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setCategoryMenuOpen(false);
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (categoryMenuRef.current && !categoryMenuRef.current.contains(e.target as Node)) {
        setCategoryMenuOpen(false);
      }
    };
    if (categoryMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [categoryMenuOpen]);

  useEffect(() => {
    fetchCart();
    if (typeof window !== 'undefined' && localStorage.getItem('royal_token')) {
      fetchMe();
    }
    fetch('/api/v1/categories?tree=false')
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        const list = json?.data || json || [];
        if (Array.isArray(list)) {
          setDynamicCategories(
            list.filter((c: any) => c.isActive !== false && !c.parentId && Number(c.productsCount ?? c._count?.products ?? 0) > 0).slice(0, 8)
          );
        }
      })
      .catch(() => null);

    fetch('/api/v1/storefront-cms/config')
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        const cfg = json?.data || json;
        if (cfg?.freeShippingThreshold !== undefined) {
          setFreeThreshold(Number(cfg.freeShippingThreshold));
        }
      })
      .catch(() => null);
  }, [fetchCart, fetchMe]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/articles?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const toggleLanguage = () => {
    setLocale(locale === 'fr' ? 'ar' : 'fr');
  };

  const isTransparent = isHomePage && !isScrolled;

  return (
    <header
      className={`w-full transition-all duration-300 z-50 ${
        isHomePage ? 'fixed top-0 left-0 right-0' : 'sticky top-0'
      } ${
        isTransparent
          ? 'bg-gradient-to-b from-black/75 via-black/40 to-transparent text-white'
          : 'bg-white/95 backdrop-blur-md text-[#1D232E] border-b border-[#E6E1D6] shadow-sm'
      }`}
    >
      {/* Top Mini Bar */}
      <div
        className={`text-[11px] py-1.5 border-b transition-all duration-200 ${
          isTransparent
            ? 'border-white/10 text-white/90'
            : 'border-[#E6E1D6] bg-[#FBF9F4] text-slate-600'
        }`}
      >
        <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C59B27] animate-pulse" />
            <span>
              {config.header.announcementText || 'Livraison 24–48h partout en Tunisie'} • Offerte dès {(config.freeShippingThreshold ?? freeThreshold).toFixed(0)} TND
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-5 text-xs">
            {config.header.showTrackOrder !== false && (
              <Link
                href="/track-order"
                className={`transition ${isTransparent ? 'hover:text-white' : 'hover:text-[var(--royal-primary)]'}`}
              >
                Suivre ma commande
              </Link>
            )}
            {config.header.showLanguageSwitch !== false && (
              <button
                type="button"
                onClick={toggleLanguage}
                className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full transition cursor-pointer ${
                  isTransparent
                    ? 'bg-white/15 hover:bg-white/25 text-white'
                    : 'bg-[var(--royal-silver-light)] hover:bg-[var(--royal-gold-light)] text-[var(--royal-ink)]'
                }`}
              >
                <Globe className="w-3 h-3" />
                <span className="font-bold text-[10px] uppercase">
                  {locale === 'fr' ? 'العربية' : 'Français'}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Navbar Row */}
      <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20 py-3 flex items-center justify-between gap-6">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className={`lg:hidden p-2 rounded-xl transition ${
            isTransparent ? 'text-white hover:bg-white/10' : 'text-neutral-900 hover:bg-neutral-100'
          }`}
          aria-label="Menu de navigation"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        {/* Official Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group shrink-0">
          <div className="w-11 h-11 rounded-xl overflow-hidden border border-[#C59B27]/60 bg-[#FDF9F0] shadow-sm flex items-center justify-center shrink-0">
            <img
              src={config.logoUrl || '/images/royal-logo.jpg'}
              alt={config.appName || 'Royal Electro de Maison'}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex flex-col">
            <span
              className={`font-heading font-black text-xl sm:text-2xl tracking-tight leading-none transition-colors uppercase ${
                isTransparent ? 'text-white' : 'text-[#1D232E]'
              }`}
            >
              {config.appName || 'ROYAL'}
            </span>
            <span
              className={`text-[9px] uppercase tracking-[0.26em] font-bold mt-0.5 transition-colors ${
                isTransparent ? 'text-[#E6C86E]' : 'text-[#B8860B]'
              }`}
            >
              Electro de Maison
            </span>
          </div>
        </Link>

        {/* Center Navigation Links (Clean: Accueil, Articles, Rayons only — Footer holds Contact/FAQ/Legal) */}
        <nav className="hidden lg:flex items-center gap-8 text-[13px] font-bold tracking-wide">
          <Link
            href="/"
            className={`transition-colors ${
              isTransparent ? 'text-white/90 hover:text-white' : 'text-neutral-700 hover:text-neutral-950'
            }`}
          >
            Accueil
          </Link>
          <Link
            href="/articles"
            className={`transition-colors ${
              isTransparent ? 'text-white/90 hover:text-white' : 'text-neutral-700 hover:text-neutral-950'
            }`}
          >
            Tous les Articles
          </Link>

          {/* Rayons Dropdown */}
          <div className="relative" ref={categoryMenuRef}>
            <button
              type="button"
              onClick={() => setCategoryMenuOpen((prev) => !prev)}
              aria-expanded={categoryMenuOpen}
              className={`flex items-center gap-1.5 cursor-pointer py-1 transition-colors ${
                isTransparent ? 'text-white/90 hover:text-white' : 'text-neutral-700 hover:text-neutral-950'
              }`}
            >
              <span>Rayons</span>
              <ChevronDown className={`w-3.5 h-3.5 opacity-60 transition-transform ${categoryMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {categoryMenuOpen && (
              <div className="absolute left-0 mt-3 w-72 rounded-2xl bg-white border border-neutral-200 shadow-2xl py-2 z-50 text-neutral-900">
                {dynamicCategories.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/articles?category=${encodeURIComponent(cat.slug)}`}
                    onClick={() => setCategoryMenuOpen(false)}
                    className="block px-4 py-2.5 text-xs font-semibold hover:bg-neutral-50 text-neutral-800"
                  >
                    {cat.name}
                  </Link>
                ))}
                <div className="border-t border-neutral-100 my-1" />
                <Link
                  href="/articles"
                  onClick={() => setCategoryMenuOpen(false)}
                  className="block px-4 py-2 text-xs font-bold text-neutral-950 hover:bg-neutral-50"
                >
                  Voir tout le catalogue →
                </Link>
              </div>
            )}
          </div>

          <Link
            href="/articles?sortBy=promo"
            className={`transition-colors ${
              isTransparent ? 'text-amber-300 hover:text-amber-200' : 'text-amber-600 hover:text-amber-700'
            }`}
          >
            Promotions
          </Link>
        </nav>

        {/* Right Action Elements */}
        <div className="flex items-center gap-3">
          {config.header.showSearch !== false && (
            <form onSubmit={handleSearchSubmit} className="hidden sm:block relative w-44 lg:w-56">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher un article..."
                className={`w-full pl-8 pr-3 py-1.5 text-xs rounded-full border transition-all focus:outline-none ${
                  isTransparent
                    ? 'bg-white/10 border-white/20 text-white placeholder-white/60 focus:bg-white focus:text-neutral-900 focus:placeholder-neutral-400'
                    : 'bg-white border-[var(--royal-border)] text-[var(--royal-ink)] placeholder-neutral-400 focus:border-[var(--royal-primary)]'
                }`}
              />
              <Search
                className={`absolute left-2.5 top-2 w-3.5 h-3.5 transition-colors ${
                  isTransparent ? 'text-white/60' : 'text-[var(--royal-primary)]'
                }`}
              />
            </form>
          )}

          {config.header.showCompare !== false && (
            <Link
              href="/compare"
              className={`relative p-2 rounded-full transition ${
                isTransparent
                  ? 'text-white hover:bg-white/10'
                  : 'text-[var(--royal-ink)] hover:bg-[var(--royal-gold-light)]'
              }`}
              title="Comparateur d'articles"
            >
              <Layers className="w-5 h-5" />
              {compareCount > 0 && (
                <span className="absolute top-0 right-0 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center bg-[var(--royal-primary)] text-[var(--royal-primary-text)] shadow-sm">
                  {compareCount}
                </span>
              )}
            </Link>
          )}

          {config.header.showWishlist !== false && (
            <Link
              href="/wishlist"
              className={`relative p-2 rounded-full transition ${
                isTransparent
                  ? 'text-white hover:bg-white/10'
                  : 'text-[var(--royal-ink)] hover:bg-[var(--royal-gold-light)]'
              }`}
              title="Liste d'envies"
            >
              <Heart className="w-5 h-5" />
              {wishlistCount > 0 && (
                <span className="absolute top-0 right-0 w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center">
                  {wishlistCount}
                </span>
              )}
            </Link>
          )}

          <Link
            href="/cart"
            className={`relative p-2 rounded-full transition ${
              isTransparent
                ? 'text-white hover:bg-white/10'
                : 'text-neutral-700 hover:text-neutral-950 hover:bg-neutral-100'
            }`}
            title="Mon Panier"
          >
            <ShoppingBag className="w-5 h-5" />
            {cartItemsCount > 0 && (
              <span className="absolute top-0 right-0 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center bg-[var(--royal-primary)] text-[var(--royal-primary-text)] shadow-sm">
                {cartItemsCount}
              </span>
            )}
          </Link>

          {isAuthenticated ? (
            <div
              className="relative hidden sm:block ml-1"
              onMouseEnter={() => setUserMenuOpen(true)}
              onMouseLeave={() => setUserMenuOpen(false)}
            >
              <button
                type="button"
                onClick={() => setUserMenuOpen((prev) => !prev)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold tracking-wide transition shadow-sm cursor-pointer ${
                  isTransparent
                    ? 'bg-white/20 hover:bg-white text-white hover:text-[#1D232E] border border-white/30 backdrop-blur-md'
                    : 'bg-[var(--royal-primary)] hover:bg-[var(--royal-primary-hover)] text-[var(--royal-primary-text)]'
                }`}
              >
                <span className="w-5 h-5 rounded-full bg-amber-400 text-neutral-950 font-black text-[10px] flex items-center justify-center overflow-hidden shrink-0">
                  {user?.avatar ? (
                    <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span>{user?.firstName?.[0] || 'U'}</span>
                  )}
                </span>
                <span>{user?.firstName || 'Espace'}</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-80" />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-full pt-2 w-56 z-50">
                  <div className="bg-white rounded-2xl border border-neutral-200 shadow-2xl py-2 text-neutral-900">
                    <div className="px-4 py-2.5 border-b border-neutral-100">
                      <div className="text-xs font-black text-neutral-950 truncate">
                        {user?.firstName} {user?.lastName}
                      </div>
                      <div className="text-[11px] text-neutral-500 truncate">{user?.email}</div>
                    </div>

                    <Link
                      href="/dashboard"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 hover:text-neutral-950 transition"
                    >
                      <LayoutDashboard className="w-4 h-4 text-amber-600" />
                      <span>Dashboard</span>
                    </Link>

                    <Link
                      href="/account/profile"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 hover:text-neutral-950 transition"
                    >
                      <User className="w-4 h-4 text-neutral-500" />
                      <span>Profil</span>
                    </Link>

                    <div className="my-1 border-t border-neutral-100" />

                    <button
                      type="button"
                      onClick={async () => {
                        setUserMenuOpen(false);
                        await logout();
                        router.push('/');
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 transition text-left cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Déconnexion</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className={`hidden sm:inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold tracking-wide transition shadow-sm ml-1 ${
                isTransparent
                  ? 'bg-white/20 hover:bg-white text-white hover:text-[#1D232E] border border-white/30 backdrop-blur-md'
                  : 'bg-[var(--royal-primary)] hover:bg-[var(--royal-primary-hover)] text-[var(--royal-primary-text)]'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Connexion</span>
            </Link>
          )}
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-neutral-200 bg-white text-neutral-900 px-6 py-5 space-y-4 shadow-xl">
          <nav className="flex flex-col space-y-3 font-semibold text-sm">
            <Link href="/" onClick={() => setMobileMenuOpen(false)} className="py-1">
              Accueil
            </Link>
            <Link href="/articles" onClick={() => setMobileMenuOpen(false)} className="py-1">
              Tous les Articles
            </Link>
            {dynamicCategories.slice(0, 5).map((cat) => (
              <Link
                key={cat.id}
                href={`/articles?category=${cat.slug}`}
                onClick={() => setMobileMenuOpen(false)}
                className="py-1 text-neutral-600 pl-3"
              >
                • {cat.name}
              </Link>
            ))}
            {config.header.showWishlist !== false && (
              <Link href="/wishlist" onClick={() => setMobileMenuOpen(false)} className="py-1 flex items-center justify-between">
                <span>Liste d&apos;envies</span>
                <span className="font-bold text-rose-600">({wishlistCount})</span>
              </Link>
            )}
            {config.header.showTrackOrder !== false && (
              <Link href="/track-order" onClick={() => setMobileMenuOpen(false)} className="py-1">
                Suivre ma commande
              </Link>
            )}
            <Link href="/cart" onClick={() => setMobileMenuOpen(false)} className="py-1 flex items-center justify-between">
              <span>Mon Panier</span>
              <span className="font-bold text-neutral-900">({cartItemsCount})</span>
            </Link>
            {isAuthenticated ? (
              <div className="grid grid-cols-3 gap-2 pt-2">
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2.5 px-3 rounded-xl bg-[var(--royal-primary)] hover:bg-[var(--royal-primary-hover)] text-[var(--royal-primary-text)] text-center text-xs font-bold transition"
                >
                  Dashboard
                </Link>
                <Link
                  href="/account/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2.5 px-3 rounded-xl bg-neutral-100 text-neutral-900 text-center text-xs font-bold"
                >
                  Profil
                </Link>
                <button
                  type="button"
                  onClick={async () => {
                    setMobileMenuOpen(false);
                    await logout();
                    router.push('/');
                  }}
                  className="py-2.5 px-3 rounded-xl bg-rose-50 text-rose-600 text-center text-xs font-bold"
                >
                  Déconnexion
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2.5 px-4 rounded-xl bg-[var(--royal-primary)] hover:bg-[var(--royal-primary-hover)] text-[var(--royal-primary-text)] text-center text-xs font-bold uppercase mt-2 transition"
              >
                Se Connecter
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
