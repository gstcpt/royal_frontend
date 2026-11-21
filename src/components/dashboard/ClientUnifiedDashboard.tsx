'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Activity,
  ShoppingBag,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Heart,
  ThumbsUp,
  ThumbsDown,
  Ticket,
  RefreshCw,
  ArrowUpRight,
  Clock,
  Star,
  Store,
  ShieldCheck,
  Bell,
  User as UserIcon,
  Award,
  ArrowRight,
  Layers,
} from 'lucide-react';
import { fetchApi } from '@/lib/api';
import { Breadcrumb, Button } from '@/components/ui';
import { useAuthStore } from '@/stores/auth.store';
import { useReactionStore } from '@/stores/reaction.store';
import { useWishlistStore } from '@/stores/wishlist.store';
import { getCartHeaders, getSafeImageUrl } from '@/lib/cart-session';
import { formatTndCurrency } from '@/lib/utils';
import { ProductCard, StorefrontProduct } from '@/components/storefront/ProductCard';
import { ORDER_STATUS_LABEL_MAP } from '@/components/common/PrintableOrderSheet';

type FeedEventType =
  | 'ORDER'
  | 'CANCELLED'
  | 'DELIVERED'
  | 'COUPON'
  | 'REVIEW'
  | 'LIKE'
  | 'DISLIKE'
  | 'WISHLIST';

interface FeedPostItem {
  id: string;
  type: FeedEventType;
  actorName: string;
  actorAvatar?: string | null;
  headline: string;
  title: string;
  description: string;
  link?: string | null;
  rating?: number;
  reviewBody?: string;
  product?: any;
  order?: {
    id: string;
    reference: string;
    status: string;
    totalAmount: number;
    items: Array<{
      productName: string;
      quantity: number;
      unitPrice: number;
      imageUrl?: string | null;
      slug?: string | null;
    }>;
  } | null;
  createdAt: string;
}

interface InteractionsPayload {
  likedProducts: StorefrontProduct[];
  dislikedProducts: StorefrontProduct[];
  wishlistProducts: StorefrontProduct[];
  commentedItems: Array<{
    reviewId: string;
    rating: number;
    title?: string | null;
    body: string;
    status: string;
    createdAt: string;
    product: StorefrontProduct;
  }>;
  orderedProducts: StorefrontProduct[];
  orders: Array<{
    id: string;
    reference: string;
    status: string;
    totalAmount: number;
    createdAt: string;
    itemsCount: number;
  }>;
}

const EVENT_BADGE: Record<
  FeedEventType,
  { label: string; className: string; Icon: React.ComponentType<any> }
> = {
  ORDER: { label: 'Commande', className: 'bg-blue-50 text-blue-700 border-blue-200', Icon: ShoppingBag },
  DELIVERED: { label: 'Livrée', className: 'bg-emerald-50 text-emerald-700 border-emerald-200', Icon: CheckCircle2 },
  CANCELLED: { label: 'Annulée', className: 'bg-rose-50 text-rose-700 border-rose-200', Icon: XCircle },
  COUPON: { label: 'Code Promo', className: 'bg-amber-50 text-amber-800 border-amber-200', Icon: Ticket },
  REVIEW: { label: 'Avis & Note', className: 'bg-amber-50 text-amber-800 border-amber-200', Icon: MessageSquare },
  LIKE: { label: "J'aime", className: 'bg-emerald-50 text-emerald-700 border-emerald-200', Icon: ThumbsUp },
  DISLIKE: { label: "Je n'aime pas", className: 'bg-rose-50 text-rose-700 border-rose-200', Icon: ThumbsDown },
  WISHLIST: { label: 'Favoris', className: 'bg-rose-50 text-rose-600 border-rose-200', Icon: Heart },
};

export function ClientUnifiedDashboard() {
  const { user } = useAuthStore();
  const [posts, setPosts] = useState<FeedPostItem[]>([]);
  const [interactions, setInteractions] = useState<InteractionsPayload>({
    likedProducts: [],
    dislikedProducts: [],
    wishlistProducts: [],
    commentedItems: [],
    orderedProducts: [],
    orders: [],
  });
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [threadsCount, setThreadsCount] = useState(0);
  const [visibleCount, setVisibleCount] = useState(8);
  const [loading, setLoading] = useState(true);
  const loadMoreRef = React.useRef<HTMLDivElement | null>(null);

  const { reactions, loaded: reactionsLoaded, fetchMyReactions, getCounts, toggleReaction } =
    useReactionStore();
  const { isInWishlist, addItem, removeItem } = useWishlistStore();

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [tlRes, intRes, notifRes, msgRes] = await Promise.all([
        fetchApi('/storefront-cms/my-timeline').catch(() => []),
        fetchApi('/storefront-cms/my-interactions').catch(() => null),
        fetchApi('/storefront-cms/my-notifications').catch(() => null),
        fetchApi('/storefront-cms/support/my-threads').catch(() => []),
      ]);
      const tlList = Array.isArray(tlRes) ? tlRes : tlRes?.data || [];
      setPosts(tlList);
      const d = intRes?.data || intRes;
      if (d) {
        setInteractions({
          likedProducts: d.likedProducts || [],
          dislikedProducts: d.dislikedProducts || [],
          wishlistProducts: d.wishlistProducts || [],
          commentedItems: d.commentedItems || [],
          orderedProducts: d.orderedProducts || [],
          orders: d.orders || [],
        });
      }
      const notifData = notifRes?.data || notifRes;
      const personalNotifs = notifData?.notifications || [];
      setUnreadNotifCount(personalNotifs.filter((n: any) => !n.isRead).length);
      const threadList = Array.isArray(msgRes) ? msgRes : msgRes?.data || [];
      setThreadsCount(threadList.length);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
    if (!reactionsLoaded) {
      fetchMyReactions();
    }
  }, [loadAll, reactionsLoaded, fetchMyReactions]);

  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el || visibleCount >= posts.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisibleCount((prev) => Math.min(posts.length, prev + 8));
        }
      },
      { rootMargin: '120px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [posts.length, visibleCount]);

  const handleToggleWishlist = async (prod: any) => {
    if (!prod?.id) return;
    const currentlySaved = isInWishlist(prod.id);
    const nextAction = currentlySaved ? 'REMOVE' : 'ADD';

    if (currentlySaved) {
      removeItem(prod.id);
      setInteractions((prev) => ({
        ...prev,
        wishlistProducts: prev.wishlistProducts.filter((w) => w.id !== prod.id),
      }));
    } else {
      addItem({
        id: prod.id,
        name: prod.name,
        slug: prod.slug,
        price: Number(prod.discountPrice || prod.sellingPrice || 0),
        image: prod.primaryImage,
        category: prod.category?.name,
        sku: prod.sku,
        inStock: true,
      });
    }

    fetch('/api/v1/storefront-cms/wishlist/toggle', {
      method: 'POST',
      headers: getCartHeaders(true),
      credentials: 'include',
      keepalive: true,
      body: JSON.stringify({ productId: prod.id, action: nextAction }),
    }).catch(() => null);
  };

  const initials = `${user?.firstName?.[0] || 'U'}${user?.lastName?.[0] || ''}`;
  const inProgressOrders = interactions.orders.filter(
    (o) => !['DELIVERED', 'CANCELLED'].includes(o.status)
  ).length;
  const totalSpentTnd = interactions.orders
    .filter((o) => o.status !== 'CANCELLED')
    .reduce((acc, o) => acc + Number(o.totalAmount || 0), 0);

  return (
    <div className="space-y-6 w-full max-w-[1600px] mx-auto">
      {/* Unified Welcome Banner */}
      <div className="p-6 sm:p-7 rounded-2xl bg-white border border-[#E6E1D6] shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[var(--royal-primary)] text-white font-heading font-black text-xl flex items-center justify-center shrink-0 shadow-sm overflow-hidden border border-[#E6D6A6]">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={`${user.firstName} ${user.lastName}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <span>{initials}</span>
            )}
          </div>
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[11px] font-bold tracking-wider uppercase border border-amber-200">
              <ShieldCheck className="h-3.5 w-3.5 text-amber-600" />
              <span>Mon Espace Client VIP Royal</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-heading font-black tracking-tight text-neutral-900">
              Bienvenue, {user?.firstName} {user?.lastName}
            </h1>
            <p className="text-xs text-neutral-500 truncate max-w-2xl">
              Fil d&apos;actualité complet de vos interactions, articles aimés, commentaires et commandes.
            </p>
            <div className="pt-1">
              <Breadcrumb items={[{ label: 'Mon Espace Client' }]} />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Button variant="outline" size="sm" onClick={loadAll} className="text-xs">
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Link
            href="/account/messages"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#F8F9FA] border border-[#E6E1D6] text-neutral-900 text-xs font-bold hover:border-[var(--royal-primary)] transition"
          >
            <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
            <span>Royal Support</span>
          </Link>
          <Link
            href="/articles"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[var(--royal-primary)] hover:bg-[var(--royal-primary-hover)] text-[var(--royal-primary-text)] text-xs font-bold transition shadow-sm"
          >
            <Store className="w-4 h-4" />
            <span>Continuer mes achats</span>
          </Link>
        </div>
      </div>

      {/* Unified Top Line: Numeric Stats + Synthèse de vos Interactions (Same Organized Row) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-3">
        <Link
          href="/account/orders"
          className="p-4 bg-white rounded-2xl border border-[#E6E1D6] shadow-xs hover:border-[var(--royal-primary)] transition-all group"
        >
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Commandes</span>
            <ShoppingBag className="h-3.5 w-3.5 text-[#C59B27]" />
          </div>
          <div className="text-xl font-black text-neutral-900 font-mono">{interactions.orders.length}</div>
          <div className="text-[10px] text-neutral-500 mt-0.5">{inProgressOrders} en cours</div>
        </Link>

        <div className="p-4 bg-white rounded-2xl border border-[#E6E1D6] shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Achats TND</span>
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
          </div>
          <div className="text-base font-black text-[#9A7414] font-mono truncate">
            {formatTndCurrency(totalSpentTnd)}
          </div>
          <div className="text-[10px] text-neutral-500 mt-0.5">Total validé</div>
        </div>

        <Link
          href="/account/favorites"
          className="p-4 bg-white rounded-2xl border border-[#E6E1D6] shadow-xs hover:border-[var(--royal-primary)] transition-all"
        >
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Favoris</span>
            <Heart className="h-3.5 w-3.5 text-rose-500" />
          </div>
          <div className="text-xl font-black text-neutral-900 font-mono">{interactions.wishlistProducts.length}</div>
          <div className="text-[10px] text-neutral-500 mt-0.5">Wishlist</div>
        </Link>

        <div className="p-4 bg-white rounded-2xl border border-[#E6E1D6] shadow-xs">
          <div className="flex items-center justify-between text-emerald-700 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Aimés</span>
            <ThumbsUp className="h-3.5 w-3.5 text-emerald-600" />
          </div>
          <div className="text-xl font-black text-emerald-700 font-mono">{interactions.likedProducts.length}</div>
          <div className="text-[10px] text-neutral-500 mt-0.5">Articles J&apos;aime</div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-[#E6E1D6] shadow-xs">
          <div className="flex items-center justify-between text-rose-700 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Dislikés</span>
            <ThumbsDown className="h-3.5 w-3.5 text-rose-600" />
          </div>
          <div className="text-xl font-black text-rose-700 font-mono">{interactions.dislikedProducts.length}</div>
          <div className="text-[10px] text-neutral-500 mt-0.5">Articles dislikés</div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-[#E6E1D6] shadow-xs">
          <div className="flex items-center justify-between text-amber-700 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Avis</span>
            <Star className="h-3.5 w-3.5 text-[#C59B27]" />
          </div>
          <div className="text-xl font-black text-amber-700 font-mono">{interactions.commentedItems.length}</div>
          <div className="text-[10px] text-neutral-500 mt-0.5">Commentaires</div>
        </div>

        <Link
          href="/account/notifications"
          className="p-4 bg-white rounded-2xl border border-[#E6E1D6] shadow-xs hover:border-[var(--royal-primary)] transition-all"
        >
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Alertes</span>
            <Bell className="h-3.5 w-3.5 text-[#C59B27]" />
          </div>
          <div className="text-xl font-black text-neutral-900 font-mono">{unreadNotifCount}</div>
          <div className="text-[10px] text-neutral-500 mt-0.5">Non lues</div>
        </Link>

        <Link
          href="/account/messages"
          className="p-4 bg-white rounded-2xl border border-[#E6E1D6] shadow-xs hover:border-[var(--royal-primary)] transition-all"
        >
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Support</span>
            <MessageSquare className="h-3.5 w-3.5 text-blue-600" />
          </div>
          <div className="text-xl font-black text-neutral-900 font-mono">{threadsCount}</div>
          <div className="text-[10px] text-neutral-500 mt-0.5">Discussions</div>
        </Link>
      </div>

      {/* Unified Seamless Full-Width Chronologie • Fil d'Actualité (No isolated sidebar split!) */}
      <div className="w-full space-y-5">
        <div className="bg-white p-5 rounded-2xl border border-[#E6E1D6] shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#FBF6E8] text-[#9A7414] border border-[#E6D6A6] rounded-xl">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-heading font-black text-[#1D232E]">
                Chronologie • Fil d&apos;Actualité Unifié ({posts.length})
              </h3>
              <p className="text-xs text-slate-500">
                Toutes vos commandes, articles aimés/dislikés, favoris et avis affichés en continu sur toute la largeur.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
            <Link href="/account/profile" className="px-3.5 py-1.5 rounded-full bg-[#F8F9FA] border border-[#E6E1D6] hover:border-[#C59B27] transition">
              Mon Profil
            </Link>
            <Link href="/account/orders" className="px-3.5 py-1.5 rounded-full bg-[#F8F9FA] border border-[#E6E1D6] hover:border-[#C59B27] transition">
              Mes Commandes
            </Link>
            <Link href="/account/favorites" className="px-3.5 py-1.5 rounded-full bg-[#F8F9FA] border border-[#E6E1D6] hover:border-[#C59B27] transition">
              Mes Favoris
            </Link>
          </div>
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="bg-white p-10 rounded-2xl border border-[#E6E1D6] text-center text-xs text-slate-500">
              Chargement de votre fil d&apos;actualité...
            </div>
          ) : posts.length === 0 ? (
            <div className="bg-white p-10 rounded-2xl border border-[#E6E1D6] text-center space-y-3">
              <Clock className="w-10 h-10 text-slate-300 mx-auto" />
              <div className="text-sm font-bold text-[#1D232E]">
                Aucune activité enregistrée pour le moment.
              </div>
              <Link
                href="/articles"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[var(--royal-primary)] text-white text-xs font-bold shadow-xs"
              >
                Découvrir nos articles
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.slice(0, visibleCount).map((post) => {
                const badge = EVENT_BADGE[post.type] || EVENT_BADGE.ORDER;
                const Icon = badge.Icon;
                const prod = post.product;
                const myReaction = prod ? reactions[prod.id] || null : null;
                const rxCounts = prod
                  ? getCounts(prod.id, prod.likeCount || 0, prod.dislikeCount || 0)
                  : { likeCount: 0, dislikeCount: 0 };
                const savedWishlist = prod ? isInWishlist(prod.id) : false;

                return (
                  <article
                    key={post.id}
                    className="bg-white rounded-2xl border border-[#E6E1D6] shadow-sm overflow-hidden"
                  >
                    <div className="p-5 flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-[var(--royal-primary)] text-white font-bold text-xs flex items-center justify-center shrink-0 overflow-hidden">
                          {post.actorAvatar || user?.avatar ? (
                            <img
                              src={post.actorAvatar || user?.avatar || ''}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span>{initials}</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-bold text-neutral-900 leading-snug">
                            {post.headline}
                          </div>
                          <div className="text-[11px] text-neutral-400 font-mono mt-0.5">
                            {new Date(post.createdAt).toLocaleDateString('fr-TN', {
                              day: '2-digit',
                              month: 'long',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </div>
                      </div>

                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider shrink-0 ${badge.className}`}
                      >
                        <Icon className="w-3 h-3" />
                        <span>{badge.label}</span>
                      </span>
                    </div>

                    {post.type === 'REVIEW' && (
                      <div className="px-5 pb-4">
                        <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 space-y-1.5">
                          <div className="flex items-center gap-1 text-amber-500">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                className={`w-4 h-4 ${
                                  s <= (post.rating || 0) ? 'fill-current' : 'text-amber-200'
                                }`}
                              />
                            ))}
                            <span className="ml-2 text-xs font-black text-neutral-900">
                              {post.rating}/5
                            </span>
                          </div>
                          <p className="text-xs text-neutral-800 leading-relaxed">
                            &laquo; {post.reviewBody || post.description} &raquo;
                          </p>
                        </div>
                      </div>
                    )}

                    {prod && (
                      <div className="mx-5 mb-4 rounded-2xl border border-neutral-200 bg-[#F8F9FA] overflow-hidden flex flex-col sm:flex-row">
                        <Link
                          href={`/articles/${prod.slug}`}
                          className="w-full sm:w-44 h-44 bg-neutral-100 overflow-hidden shrink-0 block"
                        >
                          <img
                            src={getSafeImageUrl(prod.primaryImage)}
                            alt={prod.name}
                            className="w-full h-full object-cover object-center scale-[1.06] hover:scale-110 transition-transform duration-300"
                          />
                        </Link>
                        <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                          <div className="space-y-1">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
                              {prod.brand?.name || 'Royal'}
                              {prod.category?.name ? ` • ${prod.category.name}` : ''}
                            </div>
                            <Link
                              href={`/articles/${prod.slug}`}
                              className="text-sm font-black text-neutral-900 hover:text-amber-700 transition block line-clamp-2"
                            >
                              {prod.name}
                            </Link>
                          </div>

                          <div className="flex items-center justify-between gap-2">
                            <div className="font-mono font-black text-base text-neutral-950">
                              {formatTndCurrency(Number(prod.discountPrice || prod.sellingPrice || 0))}
                            </div>
                            <Link
                              href={`/articles/${prod.slug}`}
                              className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-white border border-[#E6E1D6] text-xs font-bold text-[#1D232E] hover:bg-[var(--royal-primary)] hover:text-white transition"
                            >
                              <span>Voir l&apos;article</span>
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    )}

                    {post.order && (
                      <div className="mx-5 mb-4 rounded-2xl border border-neutral-200 bg-[#F8F9FA] p-4 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <div className="text-xs font-black font-mono text-neutral-900">
                              Réf. {post.order.reference}
                            </div>
                            <div className="text-[11px] text-neutral-500">
                              Statut :{' '}
                              <strong className="text-neutral-900">
                                {ORDER_STATUS_LABEL_MAP[post.order.status] || post.order.status}
                              </strong>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-black font-mono text-neutral-950">
                              {formatTndCurrency(post.order.totalAmount)}
                            </div>
                            <Link
                              href={`/order-confirmation/${post.order.reference}`}
                              className="text-[11px] font-bold text-amber-700 hover:underline inline-flex items-center gap-0.5"
                            >
                              Suivre &amp; Imprimer <ArrowUpRight className="w-3 h-3" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    )}

                    {prod && (
                      <div className="px-5 py-3 border-t border-neutral-100 bg-[#FAFAFA] flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              toggleReaction(prod.id, 'LIKE', prod.likeCount || 0, prod.dislikeCount || 0)
                            }
                            className={`px-3 py-1.5 rounded-full border text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                              myReaction === 'LIKE'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-white text-neutral-600 border-neutral-200 hover:border-emerald-300'
                            }`}
                          >
                            <ThumbsUp className={`w-3.5 h-3.5 ${myReaction === 'LIKE' ? 'fill-current' : ''}`} />
                            <span>J&apos;aime ({rxCounts.likeCount})</span>
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              toggleReaction(prod.id, 'DISLIKE', prod.likeCount || 0, prod.dislikeCount || 0)
                            }
                            className={`px-3 py-1.5 rounded-full border text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                              myReaction === 'DISLIKE'
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : 'bg-white text-neutral-600 border-neutral-200 hover:border-rose-300'
                            }`}
                          >
                            <ThumbsDown
                              className={`w-3.5 h-3.5 ${myReaction === 'DISLIKE' ? 'fill-current' : ''}`}
                            />
                            <span>({rxCounts.dislikeCount})</span>
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleToggleWishlist(prod)}
                          className={`px-3 py-1.5 rounded-full border text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                            savedWishlist
                              ? 'bg-rose-50 text-rose-600 border-rose-200'
                              : 'bg-white text-neutral-600 border-neutral-200 hover:border-rose-300'
                          }`}
                        >
                          <Heart className={`w-3.5 h-3.5 ${savedWishlist ? 'fill-current' : ''}`} />
                          <span>{savedWishlist ? 'Dans ma wishlist' : 'Ajouter aux favoris'}</span>
                        </button>
                      </div>
                    )}
                  </article>
                );
              })}

              {visibleCount < posts.length && (
                <div ref={loadMoreRef} className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => setVisibleCount((prev) => Math.min(posts.length, prev + 8))}
                    className="px-6 py-2.5 rounded-full bg-[#FBF6E8] border border-[#E6D6A6] text-xs font-bold text-[#9A7414] hover:bg-[#C59B27] hover:text-white transition cursor-pointer"
                  >
                    Charger plus d&apos;actions ({posts.length - visibleCount} restantes)
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Unified Interactive Catalog Sections: Articles Aimés, Non Aimés, Commentés, Commandés */}
      <div className="space-y-6 pt-2">
        <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-neutral-100 text-neutral-900 rounded-xl">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-heading font-black text-neutral-900">
              Vos Articles &amp; Commandes par Interaction
            </h3>
            <p className="text-xs text-neutral-500">
              Retrouvez ci-dessous tous les articles que vous avez aimés, non aimés, commentés/notés et commandés.
            </p>
          </div>
        </div>

        {/* Articles Aimés */}
        <section className="bg-white p-6 rounded-2xl border border-neutral-200/80 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
              <ThumbsUp className="w-4 h-4" />
            </span>
            <h4 className="text-sm font-heading font-black text-neutral-900">
              Articles Aimés ({interactions.likedProducts.length})
            </h4>
          </div>
          {interactions.likedProducts.length === 0 ? (
            <p className="text-xs text-neutral-500">Aucun article aimé pour le moment.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {interactions.likedProducts.map((product) => (
                <ProductCard key={product.id} product={product} layout="grid" />
              ))}
            </div>
          )}
        </section>

        {/* Articles Non Aimés */}
        <section className="bg-white p-6 rounded-2xl border border-neutral-200/80 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-rose-50 text-rose-700 border border-rose-200">
              <ThumbsDown className="w-4 h-4" />
            </span>
            <h4 className="text-sm font-heading font-black text-neutral-900">
              Articles Non Aimés ({interactions.dislikedProducts.length})
            </h4>
          </div>
          {interactions.dislikedProducts.length === 0 ? (
            <p className="text-xs text-neutral-500">Aucun article disliké.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {interactions.dislikedProducts.map((product) => (
                <ProductCard key={product.id} product={product} layout="grid" />
              ))}
            </div>
          )}
        </section>

        {/* Articles Commentés */}
        <section className="bg-white p-6 rounded-2xl border border-neutral-200/80 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
              <MessageSquare className="w-4 h-4" />
            </span>
            <h4 className="text-sm font-heading font-black text-neutral-900">
              Articles Commentés &amp; Notés ({interactions.commentedItems.length})
            </h4>
          </div>
          {interactions.commentedItems.length === 0 ? (
            <p className="text-xs text-neutral-500">Aucun avis publié pour le moment.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {interactions.commentedItems.map((entry) => (
                <div key={entry.reviewId} className="space-y-2.5">
                  <ProductCard product={entry.product} layout="grid" />
                  <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 space-y-1">
                    <div className="flex items-center gap-1 text-amber-500">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-3.5 h-3.5 ${s <= entry.rating ? 'fill-current' : 'text-amber-200'}`}
                        />
                      ))}
                      <span className="ml-1.5 text-[11px] font-black text-neutral-900">
                        {entry.rating}/5
                      </span>
                    </div>
                    <p className="text-xs text-neutral-700 line-clamp-2">&laquo; {entry.body} &raquo;</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Commandes & Articles Commandés */}
        <section className="bg-white p-6 rounded-2xl border border-neutral-200/80 shadow-sm space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-blue-50 text-blue-700 border border-blue-200">
                <ShoppingBag className="w-4 h-4" />
              </span>
              <h4 className="text-sm font-heading font-black text-neutral-900">
                Commandes ({interactions.orders.length}) &amp; Articles Commandés ({interactions.orderedProducts.length})
              </h4>
            </div>
            <Link href="/account/orders" className="text-xs font-bold text-amber-700 hover:underline">
              Toutes mes commandes →
            </Link>
          </div>

          {interactions.orders.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {interactions.orders.map((ord) => (
                <Link
                  key={ord.id}
                  href={`/order-confirmation/${ord.reference}`}
                  className="p-4 rounded-2xl bg-[#F8F9FA] border border-neutral-200/80 hover:border-neutral-900 transition flex items-center justify-between gap-3"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="text-xs font-black font-mono text-neutral-900">{ord.reference}</div>
                    <div className="text-[11px] text-neutral-500">
                      {ord.itemsCount} article(s) • {new Date(ord.createdAt).toLocaleDateString('fr-TN')}
                    </div>
                    <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                      {ORDER_STATUS_LABEL_MAP[ord.status] || ord.status}
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-black font-mono text-neutral-950">
                      {formatTndCurrency(ord.totalAmount)}
                    </div>
                    <span className="text-[11px] font-bold text-neutral-600 inline-flex items-center gap-0.5">
                      Voir <ArrowUpRight className="w-3 h-3" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {interactions.orderedProducts.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {interactions.orderedProducts.map((product) => (
                <ProductCard key={product.id} product={product} layout="grid" />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
