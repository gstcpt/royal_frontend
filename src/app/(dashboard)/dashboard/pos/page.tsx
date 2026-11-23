'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  Store,
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Banknote,
  FileText,
  User,
  Phone,
  MapPin,
  Printer,
  CheckCircle2,
  Package,
  RefreshCw,
  Unlock,
  Lock,
  ChevronLeft,
  ChevronRight,
  Tag,
  PauseCircle,
  X,
  Wifi,
  WifiOff,
  CloudUpload,
} from 'lucide-react';
import {
  Breadcrumb,
  Button,
  Badge,
  Modal,
  Select,
  Toast,
} from '@/components/ui';
import { FilterDropdown } from '@/components/ui/data-table';
import { fetchApi, fetchAllPaginated } from '@/lib/api';
import { formatTndCurrency } from '@/lib/utils';
import { getSafeImageUrl } from '@/lib/cart-session';
import { useAuthStore } from '@/stores/auth.store';
import { DocumentPrintHeader, DocumentPrintFooter } from '@/components/dashboard/DocumentPrintLayout';

interface PosShowroom {
  id: string;
  name: string;
  code: string;
  address?: string;
  warehouseId: string;
  cashRegisters?: Array<{
    id: string;
    name: string;
    isActive: boolean;
    sessions?: any[];
  }>;
}

interface CatalogProduct {
  id: string;
  name: string;
  sku: string;
  sellingPrice: number;
  discountPrice?: number | null;
  primaryImage?: string | null;
  categoryName: string;
  stockQty: number;
  variants: Array<{
    id: string;
    name: string;
    sku: string;
    sellingPrice?: number | null;
    stockQty: number;
  }>;
}

interface CartLine {
  productId: string;
  variantId: string;
  name: string;
  sku: string;
  unitPrice: number;
  quantity: number;
  discount: number;
  image?: string | null;
}

export default function PosTerminalPage() {
  const { user } = useAuthStore();
  const [showrooms, setShowrooms] = useState<PosShowroom[]>([]);
  const [selectedPosId, setSelectedPosId] = useState('');
  const [selectedRegisterId, setSelectedRegisterId] = useState('');
  const [activeSession, setActiveSession] = useState<any>(null);

  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [customers, setCustomers] = useState<Array<{ id: string; label: string; name: string; phone?: string; email?: string }>>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [rowsPerPage, setRowsPerPage] = useState<number>(12);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [cart, setCart] = useState<CartLine[]>([]);

  const POS_PAGE_SIZE_OPTIONS = [12, 24, 48, 60, 108];

  // Order & Customer fields
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [customerName, setCustomerName] = useState('Client Showroom');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [fulfillmentMode, setFulfillmentMode] = useState<'IN_STORE_PICKUP' | 'PENDING_PICKUP' | 'DELIVERY'>('IN_STORE_PICKUP');
  const [deliveryAddress, setDeliveryAddress] = useState('');

  // Payment fields
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'CHECK'>('CASH');
  const [paymentReference, setPaymentReference] = useState('');
  const [amountTendered, setAmountTendered] = useState('');
  const [notes, setNotes] = useState('');

  // Session, Promo & Receipt modals
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [isCloseSessionModalOpen, setIsCloseSessionModalOpen] = useState(false);
  const [openingBalance, setOpeningBalance] = useState('200');
  const [closingBalance, setClosingBalance] = useState('0.000');
  const [closingNotes, setClosingNotes] = useState('');
  const [closingSessionSubmitting, setClosingSessionSubmitting] = useState(false);
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountAmount: number } | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [isPrePrintOpen, setIsPrePrintOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [receipt, setReceipt] = useState<any>(null);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [offlineQueue, setOfflineQueue] = useState<any[]>([]);
  const [syncingQueue, setSyncingQueue] = useState(false);
  const [printers, setPrinters] = useState<any[]>([]);
  const [selectedPrinterId, setSelectedPrinterId] = useState('');

  const OFFLINE_QUEUE_KEY = 'royal_pos_offline_queue_v1';
  const OFFLINE_SNAPSHOT_KEY = 'royal_pos_catalog_snapshot_v1';

  const activePrinter = useMemo(
    () => printers.find((p) => p.id === selectedPrinterId) || printers.find((p) => p.isDefaultPos) || printers[0] || null,
    [printers, selectedPrinterId],
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setIsOnline(navigator.onLine);
    try {
      const savedQ = JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]');
      if (Array.isArray(savedQ)) setOfflineQueue(savedQ);
    } catch {
      // ignore
    }
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  const loadPosData = useCallback(async () => {
    setLoading(true);
    try {
      const [posRes, rawProdsList, rawCustsList, prtRes] = await Promise.all([
        fetchApi('/pos').catch(() => null),
        fetchAllPaginated<any>('/products?status=ACTIVE', 200).then((r) => r.items).catch(() => []),
        fetchAllPaginated<any>('/customers', 200).then((r) => r.items).catch(() => []),
        fetchApi('/storefront-cms/pos-printers').catch(() => []),
      ]);
      const prodRes = rawProdsList.length > 0 ? { data: rawProdsList } : null;
      const custRes = rawCustsList.length > 0 ? { data: rawCustsList } : null;

      if (!posRes && !prodRes && typeof window !== 'undefined') {
        const snap = JSON.parse(localStorage.getItem(OFFLINE_SNAPSHOT_KEY) || 'null');
        if (snap) {
          setShowrooms(snap.showrooms || []);
          setProducts(snap.products || []);
          setCustomers(snap.customers || []);
          setPrinters(snap.printers || []);
          if (snap.showrooms?.[0] && !selectedPosId) {
            setSelectedPosId(snap.showrooms[0].id);
            const regs = snap.showrooms[0].cashRegisters || [];
            if (regs[0]) setSelectedRegisterId(regs[0].id);
          }
          return;
        }
      }

      const prtList = Array.isArray(prtRes) ? prtRes : prtRes?.data || [];
      setPrinters(prtList);
      if (prtList.length > 0 && !selectedPrinterId) {
        const defPrt = prtList.find((p: any) => p.isDefaultPos) || prtList[0];
        if (defPrt?.id) setSelectedPrinterId(defPrt.id);
      }

      const posList: PosShowroom[] = Array.isArray(posRes) ? posRes : posRes?.data || [];
      setShowrooms(posList);
      const activeShowroom =
        posList.find((p) => p.id === selectedPosId) || posList[0] || null;
      const targetWarehouseId = activeShowroom?.warehouseId;

      if (posList.length > 0 && !selectedPosId) {
        setSelectedPosId(posList[0].id);
        const regs = posList[0].cashRegisters || [];
        if (regs.length > 0) setSelectedRegisterId(regs[0].id);
      }

      const rawProds = rawProdsList;
      const normalized: CatalogProduct[] = (Array.isArray(rawProds) ? rawProds : [])
        .map((p: any) => {
          const variants = (p.variants || []).map((v: any) => {
            const stockRows = Array.isArray(v.stock)
              ? v.stock
              : Array.isArray(v.stocks)
                ? v.stocks
                : [];
            const whFiltered =
              targetWarehouseId && stockRows.some((st: any) => st.warehouseId === targetWarehouseId)
                ? stockRows.filter((st: any) => st.warehouseId === targetWarehouseId)
                : stockRows;
            const computedQty = whFiltered.reduce(
              (s: number, st: any) => s + Math.max(0, (st.physicalQty || 0) - (st.reservedQty || 0)),
              0
            );
            return {
              id: v.id,
              name: v.name || 'Standard',
              sku: v.sku || p.sku,
              sellingPrice: Number(v.sellingPrice || p.discountPrice || p.sellingPrice || 0),
              stockQty: computedQty,
            };
          });
          const totalStock = variants.length > 0
            ? variants.reduce((s: number, v: any) => s + v.stockQty, 0)
            : Number(p.availableStock ?? p.stockQuantity ?? p.totalStock ?? 0);

          return {
            id: p.id,
            name: p.name,
            sku: p.sku,
            sellingPrice: Number(p.sellingPrice || 0),
            discountPrice: p.discountPrice ? Number(p.discountPrice) : null,
            primaryImage: p.primaryImage || p.images?.[0]?.url || null,
            categoryName: p.category?.name || 'Catalogue',
            stockQty: totalStock,
            variants,
          };
        })
        .filter((p) => p.variants.length > 0 && p.stockQty > 0);
      setProducts(normalized);

      const rawCusts = rawCustsList;
      const mappedCusts = (Array.isArray(rawCusts) ? rawCusts : []).map((c: any) => ({
        id: c.id,
        label: `${c.firstName} ${c.lastName}${c.phone ? ` (${c.phone})` : ''}`,
        name: `${c.firstName} ${c.lastName}`,
        phone: c.phone || '',
        email: c.email || '',
      }));
      setCustomers(mappedCusts);

      if (typeof window !== 'undefined' && normalized.length > 0) {
        try {
          localStorage.setItem(
            OFFLINE_SNAPSHOT_KEY,
            JSON.stringify({
              showrooms: posList,
              products: normalized,
              customers: mappedCusts,
              printers: prtList,
              savedAt: new Date().toISOString(),
            }),
          );
        } catch {
          // QuotaExceeded safely ignored
        }
      }
    } finally {
      setLoading(false);
    }
  }, [selectedPosId, selectedPrinterId]);

  useEffect(() => {
    loadPosData();
  }, [loadPosData]);

  const currentShowroom = useMemo(
    () => showrooms.find((s) => s.id === selectedPosId) || showrooms[0] || null,
    [showrooms, selectedPosId]
  );

  const currentRegisters = currentShowroom?.cashRegisters || [];

  useEffect(() => {
    if (!selectedRegisterId) {
      setActiveSession(null);
      return;
    }
    fetchApi(`/pos/registers/${selectedRegisterId}/session`)
      .then((res) => setActiveSession(res?.data ?? res ?? null))
      .catch(() => setActiveSession(null));
  }, [selectedRegisterId]);

  const categories = useMemo(() => {
    const set = new Set<string>(products.map((p) => p.categoryName));
    return ['ALL', ...Array.from(set)];
  }, [products]);

  const categoryOptions = useMemo(
    () =>
      categories
        .filter((c) => c !== 'ALL')
        .sort((a, b) => a.localeCompare(b, 'fr'))
        .map((c) => ({ value: c, label: c })),
    [categories]
  );

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return products.filter((p) => {
      if (selectedCategory !== 'ALL' && p.categoryName !== selectedCategory) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.categoryName.toLowerCase().includes(q)
      );
    });
  }, [products, searchQuery, selectedCategory]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / rowsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedProducts = useMemo(
    () =>
      filteredProducts.slice(
        (safeCurrentPage - 1) * rowsPerPage,
        safeCurrentPage * rowsPerPage
      ),
    [filteredProducts, safeCurrentPage, rowsPerPage]
  );

  const addToCart = (p: CatalogProduct) => {
    const chosenVariant = p.variants.find((v) => v.stockQty > 0) || p.variants[0];
    if (!chosenVariant) return;
    const price = Number(chosenVariant.sellingPrice || p.discountPrice || p.sellingPrice || 0);
    setCart((prev) => {
      const idx = prev.findIndex((l) => l.variantId === chosenVariant.id);
      if (idx >= 0) {
        return prev.map((l, i) => (i === idx ? { ...l, quantity: l.quantity + 1 } : l));
      }
      return [
        ...prev,
        {
          productId: p.id,
          variantId: chosenVariant.id,
          name: `${p.name}${chosenVariant.name && chosenVariant.name !== 'Standard' ? ` — ${chosenVariant.name}` : ''}`,
          sku: chosenVariant.sku || p.sku,
          unitPrice: price,
          quantity: 1,
          discount: 0,
          image: p.primaryImage,
        },
      ];
    });
  };

  const updateQty = (variantId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((l) => (l.variantId === variantId ? { ...l, quantity: Math.max(0, l.quantity + delta) } : l))
        .filter((l) => l.quantity > 0)
    );
  };

  const subtotalAfterLineDiscounts = cart.reduce((acc, l) => acc + l.unitPrice * l.quantity - l.discount, 0);
  const couponDiscount = cart.length > 0 ? Math.min(subtotalAfterLineDiscounts, appliedCoupon?.discountAmount || 0) : 0;
  const netTotal = Math.max(0, Number((subtotalAfterLineDiscounts - couponDiscount).toFixed(3)));
  const tenderedVal = Number(amountTendered || 0);
  const changeDue = paymentMethod === 'CASH' && tenderedVal > netTotal ? tenderedVal - netTotal : 0;

  useEffect(() => {
    if (cart.length === 0 && appliedCoupon) {
      setAppliedCoupon(null);
    }
  }, [cart.length, appliedCoupon]);

  const handleApplyCoupon = async () => {
    const code = couponCodeInput.trim().toUpperCase();
    if (!code) return;
    if (cart.length === 0) {
      setToastMsg({ text: 'Ajoutez au moins un article avant d’appliquer un code promo.', type: 'info' });
      return;
    }
    setValidatingCoupon(true);
    try {
      const res = await fetchApi('/coupons/validate', {
        method: 'POST',
        body: JSON.stringify({
          code,
          orderAmount: subtotalAfterLineDiscounts,
          customerEmail: customerEmail.trim() || undefined,
          items: cart.map((c) => ({
            productId: c.productId,
            variantId: c.variantId,
            quantity: c.quantity,
            unitPrice: c.unitPrice,
          })),
        }),
      });
      const payload = res?.data ?? res;
      if (payload?.valid && Number(payload?.discountAmount || 0) > 0) {
        setAppliedCoupon({
          code: payload.coupon?.code || code,
          discountAmount: Number(payload.discountAmount),
        });
        setToastMsg({
          text: `Code promo ${payload.coupon?.code || code} appliqué (-${formatTndCurrency(Number(payload.discountAmount))}).`,
          type: 'success',
        });
      } else {
        setAppliedCoupon(null);
        setToastMsg({ text: payload?.message || 'Code promo invalide ou expiré.', type: 'error' });
      }
    } catch (err: any) {
      setAppliedCoupon(null);
      setToastMsg({ text: err?.message || 'Impossible de valider ce code promo.', type: 'error' });
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleCloseSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSession?.id) return;
    setClosingSessionSubmitting(true);
    try {
      await fetchApi(`/pos/sessions/${activeSession.id}/close`, {
        method: 'POST',
        body: JSON.stringify({
          closingBalance: Number(closingBalance || 0),
          notes: closingNotes.trim() || undefined,
        }),
      });
      setIsCloseSessionModalOpen(false);
      setToastMsg({ text: 'Session de caisse clôturée / mise en pause avec succès.', type: 'success' });
      setTimeout(() => {
        window.location.reload();
      }, 650);
    } catch (err: any) {
      setToastMsg({ text: err?.message || 'Erreur lors de la clôture de caisse.', type: 'error' });
    } finally {
      setClosingSessionSubmitting(false);
    }
  };

  const handleOpenSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRegisterId) return;
    try {
      const res = await fetchApi(`/pos/registers/${selectedRegisterId}/session/open`, {
        method: 'POST',
        body: JSON.stringify({ openingBalance: Number(openingBalance || 0), notes: 'Ouverture POS' }),
      });
      setActiveSession(res?.data ?? res);
      setIsSessionModalOpen(false);
      setToastMsg({ text: 'Session de caisse ouverte avec succès.', type: 'success' });
    } catch (err: any) {
      setToastMsg({ text: err?.message || 'Impossible d’ouvrir la session.', type: 'error' });
    }
  };

  const syncOfflineQueue = useCallback(async () => {
    if (syncingQueue || offlineQueue.length === 0) return;
    setSyncingQueue(true);
    const remaining: any[] = [];
    let syncedCount = 0;

    for (const queued of offlineQueue) {
      try {
        await fetchApi('/pos/checkout', {
          method: 'POST',
          body: JSON.stringify(queued.requestBody),
        });
        syncedCount += 1;
      } catch {
        remaining.push(queued);
      }
    }

    setOfflineQueue(remaining);
    if (typeof window !== 'undefined') {
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(remaining));
    }
    setSyncingQueue(false);
    if (syncedCount > 0) {
      setToastMsg({
        text: `${syncedCount} vente(s) hors-ligne synchronisée(s) vers PostgreSQL !`,
        type: 'success',
      });
      loadPosData();
    } else if (remaining.length > 0) {
      setToastMsg({
        text: `Synchronisation impossible pour le moment (${remaining.length} en file d'attente).`,
        type: 'error',
      });
    }
  }, [offlineQueue, syncingQueue, loadPosData]);

  useEffect(() => {
    if (isOnline && offlineQueue.length > 0) {
      syncOfflineQueue();
    }
  }, [isOnline]);

  const handleCheckout = async () => {
    if (!selectedRegisterId) {
      setToastMsg({ text: 'Veuillez sélectionner une caisse showroom.', type: 'error' });
      return;
    }
    if (cart.length === 0) {
      setToastMsg({ text: 'Ajoutez au moins un article au ticket.', type: 'error' });
      return;
    }

    setSubmitting(true);
    let remainingCoupon = couponDiscount;
    const checkoutItems = cart.map((c, idx) => {
      let extraDiscount = 0;
      if (remainingCoupon > 0) {
        const lineMax = Math.max(0, c.unitPrice * c.quantity - c.discount);
        extraDiscount = idx === cart.length - 1 ? Math.min(lineMax, remainingCoupon) : Math.min(lineMax, Number(((couponDiscount * (lineMax / Math.max(1, subtotalAfterLineDiscounts)))).toFixed(3)));
        remainingCoupon = Number((remainingCoupon - extraDiscount).toFixed(3));
      }
      return {
        variantId: c.variantId,
        quantity: c.quantity,
        unitPrice: c.unitPrice,
        discount: Number((c.discount + extraDiscount).toFixed(3)),
      };
    });
    const promoNote = appliedCoupon ? `[Promo ${appliedCoupon.code}: -${formatTndCurrency(couponDiscount)}]` : '';
    const combinedNotes = [notes.trim(), promoNote].filter(Boolean).join(' • ');

    const requestBody = {
      registerId: selectedRegisterId,
      customerId: selectedCustomerId || undefined,
      customerName: customerName.trim() || 'Client Showroom',
      customerPhone: customerPhone.trim() || undefined,
      customerEmail: customerEmail.trim() || undefined,
      deliveryAddress: fulfillmentMode === 'DELIVERY' ? deliveryAddress.trim() : undefined,
      fulfillmentMode,
      items: checkoutItems,
      payments: [
        {
          method: paymentMethod,
          amount: netTotal,
          reference: paymentReference.trim() || undefined,
        },
      ],
      amountTendered: paymentMethod === 'CASH' && tenderedVal >= netTotal ? tenderedVal : netTotal,
      notes: combinedNotes || undefined,
    };

    const enqueueOffline = () => {
      const localRef = `OFF-${Date.now().toString().slice(-6)}`;
      const offlineTicket = {
        id: localRef,
        requestBody,
        createdAt: new Date().toISOString(),
        previewPayload: {
          receiptNumber: localRef,
          status: 'HORS-LIGNE (EN FILE)',
          createdAt: new Date().toISOString(),
          pos: { name: currentShowroom?.name || 'Showroom Royal' },
          customer: { name: customerName.trim() || 'Client Showroom' },
          cashier: { name: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Caissier' },
          items: cart.map((c) => ({
            name: c.name,
            quantity: c.quantity,
            lineTotal: c.unitPrice * c.quantity - c.discount,
          })),
          totals: { netPayable: netTotal },
        },
      };
      const nextQ = [...offlineQueue, offlineTicket];
      setOfflineQueue(nextQ);
      if (typeof window !== 'undefined') {
        localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(nextQ));
      }
      setReceipt(offlineTicket.previewPayload);
      setCart([]);
      setAmountTendered('');
      setPaymentReference('');
      setNotes('');
      setToastMsg({
        text: `Mode Hors-Ligne : Ticket ${localRef} sauvegardé localement et prêt à synchroniser.`,
        type: 'info',
      });
    };

    try {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        enqueueOffline();
        return;
      }
      const res = await fetchApi('/pos/checkout', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const payload = res?.data ?? res;
      setReceipt(payload);
      setCart([]);
      setAmountTendered('');
      setPaymentReference('');
      setNotes('');
      setToastMsg({
        text: `Commande Showroom ${payload.receiptNumber || ''} enregistrée en base !`,
        type: 'success',
      });
      loadPosData();
    } catch (err: any) {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        enqueueOffline();
      } else {
        setToastMsg({ text: err?.message || 'Erreur lors de la validation POS.', type: 'error' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      {/* Header Showroom / Caisse / Breadcrumb */}
      <div className="bg-white p-6 rounded-3xl border border-[#E6E1D6] shadow-sm space-y-4">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-[#FBF6E8] text-[#B8860B] border border-[#E6D6A6] shrink-0">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-heading font-black text-[#1D232E] tracking-tight">
                Terminal Point de Vente (Showroom POS)
              </h1>
              <p className="text-xs text-slate-500">
                Vente directe en salle d&apos;exposition avec déstockage immédiat, encaissement et création de commande.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="w-52">
              <Select
                value={selectedPosId}
                onChange={(e) => {
                  const id = e.target.value;
                  setSelectedPosId(id);
                  setCurrentPage(1);
                  const sh = showrooms.find((s) => s.id === id);
                  const firstReg = sh?.cashRegisters?.[0];
                  setSelectedRegisterId(firstReg?.id || '');
                }}
                options={showrooms.map((s) => ({ value: s.id, label: s.name }))}
                placeholder="Showroom..."
              />
            </div>

            <div className="w-48">
              <Select
                value={selectedRegisterId}
                onChange={(e) => setSelectedRegisterId(e.target.value)}
                options={currentRegisters.map((r) => ({ value: r.id, label: r.name }))}
                placeholder="Caisse..."
              />
            </div>

            {activeSession ? (
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="success" size="sm">
                  <Unlock className="w-3 h-3" />
                  <span>Caisse Ouverte</span>
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setClosingBalance(
                      Number(activeSession?.currentExpectedCash ?? activeSession?.openingBalance ?? 0).toFixed(3),
                    );
                    setClosingNotes('');
                    setIsCloseSessionModalOpen(true);
                  }}
                  className="border-amber-300 text-amber-800 hover:bg-amber-50"
                >
                  <PauseCircle className="w-3.5 h-3.5" />
                  <span>Fermer / Pause Caisse</span>
                </Button>
              </div>
            ) : (
              <Button variant="gold" size="sm" onClick={() => setIsSessionModalOpen(true)}>
                <Lock className="w-3.5 h-3.5" />
                <span>Ouvrir Session</span>
              </Button>
            )}

            <Button variant="outline" size="sm" onClick={loadPosData}>
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
          <Breadcrumb
            items={[
              { label: 'Point de vente', href: '/dashboard/pos/showrooms' },
              { label: 'Terminal POS' },
            ]}
          />
          <div className="flex flex-wrap items-center gap-2.5 text-[11px] font-semibold text-slate-500">
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border ${
                isOnline
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border-rose-200'
              }`}
            >
              {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              <span>{isOnline ? 'En Ligne' : 'Mode Hors-Ligne PWA'}</span>
            </span>
            {offlineQueue.length > 0 && (
              <Button
                variant="gold"
                size="sm"
                onClick={syncOfflineQueue}
                isLoading={syncingQueue}
                className="h-6 px-2.5 text-[10px]"
              >
                <CloudUpload className="w-3 h-3" />
                <span>Synchroniser ({offlineQueue.length})</span>
              </Button>
            )}
            {activePrinter && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FBF6E8] text-[#9A7414] border border-[#E6D6A6]">
                <Printer className="w-3 h-3" />
                <span>
                  {activePrinter.name.includes(activePrinter.paperSize)
                    ? activePrinter.name
                    : `${activePrinter.name} (${activePrinter.paperSize})`}
                </span>
              </span>
            )}
            <span>
              Opérateur : <strong className="text-[#1D232E]">{user?.firstName} {user?.lastName}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Main Split Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Real Stock Catalog Grid */}
        <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-[#E6E1D6] shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
            <div className="relative flex-1 min-w-0">
              <Search className="w-4 h-4 text-[#C59B27] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Rechercher un article, SKU..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#E6E1D6] bg-[#FBF9F4] text-xs text-[#1D232E] focus:bg-white focus:outline-none focus:border-[#C59B27]"
              />
            </div>
            <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0">
              <FilterDropdown
                label="Rayon"
                value={selectedCategory}
                onChange={(val) => {
                  setSelectedCategory(val);
                  setCurrentPage(1);
                }}
                options={categoryOptions}
                allLabel="Tous les rayons"
              />
              <span className="text-xs font-bold text-slate-500 whitespace-nowrap shrink-0">
                {filteredProducts.length} article(s)
              </span>
            </div>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400">
              Chargement du catalogue showroom...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              Aucun article actif en stock trouvé pour ce filtre.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {paginatedProducts.map((p) => {
                  const price = p.discountPrice || p.sellingPrice;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => addToCart(p)}
                      className="text-left p-3 rounded-2xl bg-[#FBF9F4] border border-[#E6E1D6] hover:border-[#C59B27] hover:bg-[#FBF6E8] transition flex flex-col justify-between gap-2.5 cursor-pointer group"
                    >
                      <div className="aspect-[4/3] w-full rounded-xl bg-white border border-slate-100 overflow-hidden">
                        <img
                          src={getSafeImageUrl(p.primaryImage)}
                          alt={p.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                      <div className="space-y-1">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-[#9A7414] truncate">
                          {p.categoryName}
                        </div>
                        <div className="text-xs font-bold text-[#1D232E] line-clamp-2 leading-snug">
                          {p.name}
                        </div>
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-xs font-black font-mono text-[#1D232E]">
                            {formatTndCurrency(price)}
                          </span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Stock: {p.stockQty}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Pagination Bar (12 default, 24, 48, 60, 108) */}
              <div className="pt-4 border-t border-neutral-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-500 no-print">
                <div className="flex items-center gap-2">
                  <span>Afficher</span>
                  <select
                    value={rowsPerPage}
                    onChange={(e) => {
                      setRowsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    aria-label="Articles par page"
                    className="py-1 px-2 border border-[#E6E1D6] rounded-lg text-xs font-semibold bg-white text-[#1D232E] focus:outline-none focus:border-[#C59B27] cursor-pointer"
                  >
                    {POS_PAGE_SIZE_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                  <span>sur {filteredProducts.length} au total</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-neutral-400 mr-2">
                    Page {safeCurrentPage} sur {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={safeCurrentPage === 1}
                    aria-label="Page précédente"
                    className="p-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={safeCurrentPage === totalPages}
                    aria-label="Page suivante"
                    className="p-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Ticket, Client, Payment & Status */}
        <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-[#E6E1D6] shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-heading font-extrabold text-[#1D232E] uppercase tracking-wider flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-[#C59B27]" />
              <span>Ticket Showroom ({cart.length})</span>
            </h2>
            {cart.length > 0 && (
              <button
                type="button"
                onClick={() => setCart([])}
                className="text-xs font-bold text-rose-600 hover:underline cursor-pointer"
              >
                Vider
              </button>
            )}
          </div>

          {/* Cart Items (with image, zero scrollbar) */}
          {cart.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-[#FBF9F4] border border-dashed border-[#E6D6A6] text-xs text-slate-500">
              <Package className="w-7 h-7 text-[#C59B27] mx-auto mb-2" />
              Cliquez sur un article à gauche pour l&apos;ajouter à la vente showroom.
            </div>
          ) : (
            <div className="space-y-2.5">
              {cart.map((line) => (
                <div
                  key={line.variantId}
                  className="p-3 rounded-2xl bg-[#FBF9F4] border border-[#E6E1D6] flex items-center justify-between gap-2.5"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-12 h-12 rounded-xl bg-white border border-[#E6E1D6] shrink-0 flex items-center justify-center p-1 overflow-hidden">
                      <img
                        src={getSafeImageUrl(line.image)}
                        alt={line.name}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-[#1D232E] truncate">{line.name}</div>
                      <div className="text-[11px] font-mono text-slate-500">
                        {line.sku} • {formatTndCurrency(line.unitPrice)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => updateQty(line.variantId, -1)}
                      className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-100 cursor-pointer"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-center text-xs font-black font-mono">{line.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateQty(line.variantId, 1)}
                      className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-100 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setCart((prev) => prev.filter((c) => c.variantId !== line.variantId))}
                      className="w-7 h-7 rounded-lg text-rose-600 hover:bg-rose-50 flex items-center justify-center cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Client Section */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <label className="text-xs font-extrabold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#C59B27]" />
              <span>Informations Client Showroom</span>
            </label>
            <FilterDropdown
              label="Client"
              value={selectedCustomerId || 'ALL'}
              allLabel="Passant / Saisie manuelle"
              className="w-full"
              buttonClassName="w-full justify-between !py-2.5 !rounded-xl"
              menuClassName="w-full min-w-[260px]"
              onChange={(val) => {
                const id = val === 'ALL' ? '' : val;
                setSelectedCustomerId(id);
                const found = customers.find((c) => c.id === id);
                if (found) {
                  setCustomerName(found.name);
                  setCustomerPhone(found.phone || '');
                  setCustomerEmail(found.email || '');
                } else {
                  setCustomerName('Client Showroom');
                  setCustomerPhone('');
                  setCustomerEmail('');
                }
              }}
              options={customers.map((c) => ({ value: c.id, label: c.label }))}
              icon={<User className="w-3.5 h-3.5 text-[#C59B27]" />}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="relative">
                <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Nom client *"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#E6E1D6] bg-white text-[#1D232E] text-xs focus:outline-none focus:border-[#C59B27]"
                />
              </div>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Téléphone (Optionnel)"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#E6E1D6] bg-white text-[#1D232E] text-xs focus:outline-none focus:border-[#C59B27]"
                />
              </div>
            </div>
          </div>

          {/* Fulfillment & Payment */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
            <div>
              <label className="text-[11px] font-bold text-slate-600 mb-1 block">Statut / Remise</label>
              <Select
                value={fulfillmentMode}
                onChange={(e) => setFulfillmentMode(e.target.value as any)}
                options={[
                  { value: 'IN_STORE_PICKUP', label: 'Retiré sur place (Livré)' },
                  { value: 'PENDING_PICKUP', label: 'En attente de retrait' },
                  { value: 'DELIVERY', label: 'Livraison à domicile' },
                ]}
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-600 mb-1 block">Mode de Règlement</label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'CASH', label: 'Espèces', Icon: Banknote },
                  { id: 'CARD', label: 'Carte', Icon: CreditCard },
                  { id: 'CHECK', label: 'Chèque', Icon: FileText },
                ].map(({ id, label, Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setPaymentMethod(id as any)}
                    className={`py-2 px-2 rounded-xl border text-[11px] font-bold flex items-center justify-center gap-1 transition cursor-pointer ${
                      paymentMethod === id
                        ? 'bg-[var(--royal-primary)] text-[var(--royal-primary-text)] border-[var(--royal-primary)]'
                        : 'bg-[#FBF9F4] text-slate-700 border-[#E6E1D6]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {fulfillmentMode === 'DELIVERY' && (
            <div className="relative">
              <MapPin className="w-3.5 h-3.5 text-[#C59B27] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                placeholder="Adresse complète de livraison en Tunisie..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#E6E1D6] bg-white text-[#1D232E] text-xs focus:outline-none focus:border-[#C59B27]"
              />
            </div>
          )}

          {paymentMethod === 'CASH' ? (
            <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-[#FBF9F4] border border-[#E6E1D6]">
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Montant Remis (TND)</label>
                <input
                  type="number"
                  step="0.001"
                  value={amountTendered}
                  onChange={(e) => setAmountTendered(e.target.value)}
                  placeholder={netTotal.toFixed(3)}
                  className="w-full px-3 py-1.5 rounded-lg border border-[#E6E1D6] bg-white font-mono text-xs"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Monnaie à Rendre</label>
                <div className="text-base font-black font-mono text-emerald-700 pt-1">
                  {formatTndCurrency(changeDue)}
                </div>
              </div>
            </div>
          ) : (
            <input
              type="text"
              value={paymentReference}
              onChange={(e) => setPaymentReference(e.target.value)}
              placeholder={paymentMethod === 'CHECK' ? 'Numéro chèque & banque...' : 'Référence transaction TPE...'}
              className="w-full px-3.5 py-2 rounded-xl border border-[#E6E1D6] bg-white text-[#1D232E] text-xs focus:outline-none focus:border-[#C59B27]"
            />
          )}

          {/* Code Promo */}
          <div className="pt-3 border-t border-slate-100 space-y-2">
            <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-[#C59B27]" />
              <span>Code Promo / Remise Coupon</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={couponCodeInput}
                onChange={(e) => setCouponCodeInput(e.target.value.toUpperCase())}
                placeholder="Ex: ROYAL10"
                className="flex-1 min-w-0 px-3 py-2 rounded-xl border border-[#E6E1D6] bg-white text-xs font-mono font-bold text-[#1D232E] focus:outline-none focus:border-[#C59B27]"
              />
              {appliedCoupon ? (
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => {
                    setAppliedCoupon(null);
                    setCouponCodeInput('');
                  }}
                  title="Retirer le code promo"
                >
                  <X className="w-3.5 h-3.5 text-rose-500" />
                  <span>Retirer</span>
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={handleApplyCoupon}
                  disabled={validatingCoupon || !couponCodeInput.trim() || cart.length === 0}
                >
                  <span>{validatingCoupon ? '...' : 'Appliquer'}</span>
                </Button>
              )}
            </div>
            {appliedCoupon && (
              <div className="flex items-center justify-between text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
                <span>Coupon actif : {appliedCoupon.code}</span>
                <span className="font-mono">-{formatTndCurrency(couponDiscount)}</span>
              </div>
            )}
          </div>

          {/* Total & Submit CTA */}
          <div className="pt-4 border-t border-slate-100 space-y-2.5">
            {couponDiscount > 0 && (
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Sous-total articles</span>
                <span className="font-mono line-through">{formatTndCurrency(subtotalAfterLineDiscounts)}</span>
              </div>
            )}
            <div className="flex items-baseline justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total TTC à Encaisser</span>
              <span className="text-2xl font-heading font-black font-mono text-[#9A7414]">
                {formatTndCurrency(netTotal)}
              </span>
            </div>

            <Button
              variant="outline"
              type="button"
              className="w-full py-2.5 rounded-2xl text-xs font-bold border-[#E6E1D6] hover:border-[#C59B27] hover:bg-[#FBF9F4] text-[#1D232E]"
              onClick={() => setIsPrePrintOpen(true)}
              disabled={cart.length === 0}
            >
              <Printer className="w-4 h-4 text-[#C59B27]" />
              <span>Aperçu & Imprimer Ticket (Avant Validation)</span>
            </Button>

            <Button
              variant="gold"
              className="w-full py-3.5 rounded-2xl text-xs uppercase tracking-widest font-bold"
              onClick={handleCheckout}
              disabled={submitting || cart.length === 0}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{submitting ? 'Validation en cours...' : 'Valider la Commande & Encaisser'}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Open Session Modal */}
      <Modal
        isOpen={isSessionModalOpen}
        onClose={() => setIsSessionModalOpen(false)}
        title="Ouverture Session de Caisse"
        type="create"
        size="md"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsSessionModalOpen(false)}>
              Annuler
            </Button>
            <Button variant="gold" size="sm" type="submit" form="pos-session-form">
              Ouvrir la Caisse
            </Button>
          </div>
        }
      >
        <form id="pos-session-form" onSubmit={handleOpenSession} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Fond de Caisse Initial (TND)</label>
            <input
              type="number"
              step="0.001"
              value={openingBalance}
              onChange={(e) => setOpeningBalance(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6E1D6] font-mono text-xs"
            />
          </div>
        </form>
      </Modal>

      {/* Receipt Print Modal */}
      <Modal
        isOpen={!!receipt}
        onClose={() => setReceipt(null)}
        title={`Ticket Showroom — ${receipt?.receiptNumber || ''}`}
        type="details"
        size="md"
        footer={
          receipt && (
            <div className="flex justify-end gap-2 w-full">
              <Button variant="outline" size="sm" onClick={() => setReceipt(null)}>
                Fermer
              </Button>
              <Button variant="gold" size="sm" onClick={() => window.print()}>
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimer Ticket</span>
              </Button>
            </div>
          )
        }
      >
        {receipt && (
          <div className="p-6 space-y-4 text-xs">
            {printers.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 no-print">
                <span className="font-bold text-[#1D232E]">Aperçu calibré avant impression :</span>
                <select
                  value={activePrinter?.id || ''}
                  onChange={(e) => setSelectedPrinterId(e.target.value)}
                  className="px-2.5 py-1 rounded-lg border border-[#E6E1D6] bg-white text-xs font-semibold"
                >
                  {printers.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.paperSize})
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div
              className="mx-auto transition-all"
              style={{
                maxWidth:
                  activePrinter?.paperSize === '58mm'
                    ? '240px'
                    : activePrinter?.paperSize === '80mm'
                    ? '340px'
                    : '100%',
              }}
            >
            <DocumentPrintHeader
              docCode="TK"
              docTitle="TICKET DE CAISSE SHOWROOM"
              reference={receipt.receiptNumber || 'TK-SHOWROOM'}
              date={receipt.createdAt}
              status={receipt.status || 'PAYÉ'}
            />
            <div className="p-4 rounded-2xl bg-[#FBF9F4] border border-[#E6E1D6] space-y-1">
              <div className="font-black text-sm text-[#1D232E]">{receipt.pos?.name}</div>
              <div className="text-slate-500">Client : {receipt.customer?.name}</div>
              <div className="text-slate-500">Opérateur : {receipt.cashier?.name}</div>
            </div>
            <div className="divide-y divide-slate-100">
              {(receipt.items || []).map((it: any, i: number) => (
                <div key={i} className="py-2 flex justify-between">
                  <span>{it.quantity} × {it.name}</span>
                  <span className="font-mono font-bold">{formatTndCurrency(it.lineTotal)}</span>
                </div>
              ))}
            </div>
            <div className="pt-3 border-t border-slate-200 flex justify-between font-black text-sm text-[#9A7414]">
              <span>TOTAL TTC</span>
              <span className="font-mono">{formatTndCurrency(receipt.totals?.netPayable || 0)}</span>
            </div>
            <DocumentPrintFooter docCode="TK" reference={receipt.receiptNumber || 'TK-SHOWROOM'} />
            </div>
          </div>
        )}
      </Modal>

      {/* Close / Pause Session Modal */}
      <Modal
        isOpen={isCloseSessionModalOpen}
        onClose={() => setIsCloseSessionModalOpen(false)}
        title="Fermer / Mettre en Pause la Caisse"
        type="edit"
        size="md"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsCloseSessionModalOpen(false)}>
              Annuler
            </Button>
            <Button
              variant="gold"
              size="sm"
              type="submit"
              form="pos-close-session-form"
              disabled={closingSessionSubmitting}
            >
              <PauseCircle className="w-3.5 h-3.5" />
              <span>{closingSessionSubmitting ? 'Clôture...' : 'Confirmer Clôture / Pause'}</span>
            </Button>
          </div>
        }
      >
        <form id="pos-close-session-form" onSubmit={handleCloseSession} className="p-6 space-y-4">
          <div className="p-4 rounded-2xl bg-[#FBF9F4] border border-[#E6E1D6] space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500 font-semibold">Caisse Active</span>
              <span className="font-bold text-[#1D232E]">{activeSession?.registerName || 'Caisse Principale'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-semibold">Fond d'ouverture</span>
              <span className="font-mono font-bold text-[#1D232E]">
                {formatTndCurrency(Number(activeSession?.openingBalance || 0))}
              </span>
            </div>
            <div className="flex justify-between pt-1 border-t border-[#E6E1D6]">
              <span className="text-slate-600 font-bold">Solde théorique attendu</span>
              <span className="font-mono font-black text-[#9A7414]">
                {formatTndCurrency(Number(activeSession?.currentExpectedCash ?? activeSession?.openingBalance ?? 0))}
              </span>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Solde de Clôture Compté (TND)</label>
            <input
              type="number"
              step="0.001"
              required
              value={closingBalance}
              onChange={(e) => setClosingBalance(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6E1D6] bg-white font-mono text-xs text-[#1D232E]"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Motif / Passation de poste (Optionnel)
            </label>
            <input
              type="text"
              value={closingNotes}
              onChange={(e) => setClosingNotes(e.target.value)}
              placeholder="Ex: Pause déjeuner, changement de caissier..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6E1D6] bg-white text-xs text-[#1D232E]"
            />
          </div>
        </form>
      </Modal>

      {/* Pre-Validation Ticket Print Modal */}
      <Modal
        isOpen={isPrePrintOpen}
        onClose={() => setIsPrePrintOpen(false)}
        title="Aperçu Ticket Proforma — Avant Validation"
        type="details"
        size="lg"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsPrePrintOpen(false)}>
              Fermer
            </Button>
            <Button variant="gold" size="sm" type="button" onClick={() => window.print()}>
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimer l'Aperçu</span>
            </Button>
          </div>
        }
      >
        <div className="p-5 space-y-3 text-xs">
          {printers.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 no-print">
              <span className="font-bold text-[#1D232E]">Imprimante &amp; Format :</span>
              <select
                value={activePrinter?.id || ''}
                onChange={(e) => setSelectedPrinterId(e.target.value)}
                className="px-2.5 py-1 rounded-lg border border-[#E6E1D6] bg-white text-xs font-semibold"
              >
                {printers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.paperSize})
                  </option>
                ))}
              </select>
            </div>
          )}
          <div
            className="mx-auto space-y-3 transition-all"
            style={{
              maxWidth:
                activePrinter?.paperSize === '58mm'
                  ? '240px'
                  : activePrinter?.paperSize === '80mm'
                  ? '340px'
                  : '100%',
            }}
          >
          <DocumentPrintHeader
            docCode="TK"
            docTitle="TICKET PROFORMA SHOWROOM"
            reference="APERCU-PROFORMA"
            date={new Date().toISOString()}
            status="AVANT VALIDATION"
          />
          <div className="p-4 rounded-2xl bg-[#FBF9F4] border border-[#E6E1D6] space-y-1">
            <div className="font-black text-sm text-[#1D232E]">
              Client : {customerName.trim() || 'Client Showroom'}
            </div>
            {customerPhone.trim() && <div className="text-slate-500">Téléphone : {customerPhone.trim()}</div>}
            <div className="text-slate-500">
              Mode : {fulfillmentMode === 'DELIVERY' ? 'Livraison à domicile' : 'Retrait Comptoir'} • Paiement : {paymentMethod}
            </div>
          </div>
          <div className="divide-y divide-slate-100">
            {cart.map((it) => (
              <div key={it.variantId} className="py-2 flex justify-between gap-3">
                <div>
                  <div className="font-bold text-[#1D232E]">{it.quantity} × {it.name}</div>
                  {it.discount > 0 && (
                    <div className="text-[11px] text-emerald-700">Remise ligne : -{formatTndCurrency(it.discount)}</div>
                  )}
                </div>
                <span className="font-mono font-bold shrink-0">
                  {formatTndCurrency(it.unitPrice * it.quantity - it.discount)}
                </span>
              </div>
            ))}
          </div>
          {couponDiscount > 0 && appliedCoupon && (
            <div className="flex justify-between text-emerald-700 font-bold bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-200">
              <span>Code Promo ({appliedCoupon.code})</span>
              <span className="font-mono">-{formatTndCurrency(couponDiscount)}</span>
            </div>
          )}
          <div className="pt-3 border-t border-slate-200 flex justify-between font-black text-sm text-[#9A7414]">
            <span>NET À PAYER (PROFORMA)</span>
            <span className="font-mono">{formatTndCurrency(netTotal)}</span>
          </div>
          <DocumentPrintFooter docCode="TK" reference="APERCU-PROFORMA" />
          </div>
        </div>
      </Modal>

      <Toast
        isOpen={!!toastMsg}
        message={toastMsg?.text || ''}
        type={toastMsg?.type || 'success'}
        onClose={() => setToastMsg(null)}
      />
    </div>
  );
}
