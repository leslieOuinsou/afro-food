'use client';

import { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react';
import { useToast } from '@/context/ToastContext';

export interface CartItem {
  id: string;
  nom: string;
  prixUnitaire: number;
  quantite: number;
  image: string;
  /** null = pas de limite connue (illimité côté panier) ; 0 = ne pas commander */
  quantiteMax?: number | null;
}

import { trackAddToCart, trackRemoveFromCart } from '@/lib/analytics';

const CART_STORAGE_KEY = 'afro_eats_cart';

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantite'> | CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantite: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | null>(null);

function loadFromStorage(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((row: CartItem) => ({
      ...row,
      quantiteMax: row.quantiteMax === undefined ? null : row.quantiteMax,
    }));
  } catch {
    return [];
  }
}

function saveToStorage(items: CartItem[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  } catch {}
}

function capQuantite(q: number, max: number | null | undefined): number {
  if (max === 0) return 0;
  if (max == null) return Math.max(0, q);
  return Math.max(0, Math.min(q, max));
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [items, setItems] = useState<CartItem[]>([]);
  const itemsRef = useRef<CartItem[]>([]);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setItems(loadFromStorage());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveToStorage(items);
  }, [items, hydrated]);

  const addItem = useCallback(
    (item: Omit<CartItem, 'quantite'> | CartItem) => {
      const quantiteDemandee =
        'quantite' in item && typeof item.quantite === 'number' && item.quantite > 0
          ? Math.floor(item.quantite)
          : 1;
      const max = item.quantiteMax;

      if (max === 0) {
        toast.error('Ce produit n’est pas disponible pour le moment.', 'Stock');
        return;
      }

      trackAddToCart({ item_id: item.id, item_name: item.nom, price: item.prixUnitaire, quantity: quantiteDemandee });

      // Calcul hors de l'updater : un updater React peut être exécuté deux fois (StrictMode),
      // ce qui affichait la notification en double.
      const prev = itemsRef.current;
      const existing = prev.find((i) => i.id === item.id);
      const maxMerged = max ?? existing?.quantiteMax ?? null;
      const prevQty = existing?.quantite ?? 0;
      const mergedRaw = existing ? prevQty + quantiteDemandee : quantiteDemandee;
      const merged = capQuantite(mergedRaw, maxMerged);

      if (merged < 1) {
        toast.info('Impossible d’ajouter cette quantité (stock insuffisant).', 'Panier');
        return;
      }
      if (existing && merged === prevQty && quantiteDemandee > 0) {
        toast.info('Quantité maximum déjà atteinte pour cet article.', 'Panier');
        return;
      }
      if (merged < mergedRaw) {
        toast.info(
          maxMerged != null ? `Quantité limitée au stock disponible (${maxMerged}).` : 'Quantité ajustée.',
          'Panier'
        );
      }

      const nextItem: CartItem = {
        id: item.id,
        nom: item.nom,
        prixUnitaire: item.prixUnitaire,
        image: item.image,
        quantiteMax: maxMerged,
        quantite: merged,
      };
      const next = existing ? prev.map((i) => (i.id === item.id ? nextItem : i)) : [...prev, nextItem];
      itemsRef.current = next;
      setItems(next);

      toast.show({
        variant: 'success',
        title: item.nom,
        message: quantiteDemandee > 1 ? `${quantiteDemandee} ajoutés au panier` : 'Ajouté au panier',
        image: item.image,
        action: { label: 'Voir le panier', href: '/panier' },
        duration: 2800,
      });
    },
    [toast]
  );

  const removeItem = useCallback(
    (id: string) => {
      const row = items.find((i) => i.id === id);
      if (row) {
        trackRemoveFromCart({ item_id: row.id, item_name: row.nom, price: row.prixUnitaire, quantity: row.quantite });
      }
      setItems((prev) => prev.filter((i) => i.id !== id));
    },
    [items]
  );

  const updateQuantity = useCallback(
    (id: string, quantite: number) => {
      setItems((prev) => {
        const row = prev.find((i) => i.id === id);
        if (!row) return prev;
        const max = row.quantiteMax;
        if (quantite < 1) {
          return prev.filter((i) => i.id !== id);
        }
        const capped = capQuantite(quantite, max);
        if (capped < quantite && max != null) {
          toast.info(`Quantité maximale pour « ${row.nom} » : ${max}.`, 'Stock');
        }
        if (capped < 1) {
          return prev.filter((i) => i.id !== id);
        }
        return prev.map((i) => (i.id === id ? { ...i, quantite: capped } : i));
      });
    },
    [toast]
  );

  const clearCart = useCallback(() => setItems([]), []);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextType {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return ctx;
}
