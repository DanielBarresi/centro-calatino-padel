import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api } from '../api';
import { usePolling } from '../hooks/usePolling';
import type { AppConfig, CartItem, Order, Product, Slot } from '../types';
import { loadLocal, saveLocal } from '../utils';

const CART_KEY = 'app_cart';
const MY_ORDERS_KEY = 'app_my_orders';


interface StoreValue {
  config: AppConfig;
  products: Product[];
  slots: Slot[];
  loading: boolean;
  serverError: string;

    cart: CartItem[];
  cartCount: number;
  cartTotal: number;
  maxQuantity: (productId: string) => number;
  addToCart: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;

  myOrders: Order[];
  confirmOrder: (customerName: string, slot: string) => Promise<Order>;
  cancelOrder: (id: string) => Promise<void>;
  refreshAll: () => Promise<void>;
}

// La lavagna vera e propria (all'inizio vuota)
const StoreContext = createContext<StoreValue | null>(null);


export function StoreProvider({ children }: { children: ReactNode }) {
  // --- 1. Le memorie (state) ---
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [rawCart, setCart] = useState<CartItem[]>(() => loadLocal(CART_KEY, []));
  const [myIds, setMyIds] = useState<string[]>(() => loadLocal(MY_ORDERS_KEY, []));

  // --- 2. I dati dal server, aggiornati ogni 3 secondi ---
  const products = usePolling(api.getProducts, [] as Product[]);
  const slots = usePolling(api.getSlots, [] as Slot[]);
  const myOrders = usePolling(() => api.getMyOrders(myIds), [] as Order[]);

  // --- 3. Gli effetti ---
  // La configurazione si carica una volta; se il server non risponde riprovo ogni 2 secondi
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const load = () => {
      api.getConfig().then(setConfig).catch(() => {
        timer = setTimeout(load, 2000);
      });
    };
    load();
    return () => clearTimeout(timer);
  }, []);

  // Carrello e miei ordini vanno nella tasca a ogni modifica
  useEffect(() => saveLocal(CART_KEY, rawCart), [rawCart]);
  useEffect(() => saveLocal(MY_ORDERS_KEY, myIds), [myIds]);

  // Quando aggiungo un ordine, ricarico subito "i miei ordini"
  const refreshMine = myOrders.refresh;
  useEffect(() => {
    refreshMine();
  }, [myIds, refreshMine]);

    // --- 4. Lo stato DERIVATO: il carrello "pulito" ---
  // Non lo salvo: lo CALCOLO ogni volta dal carrello grezzo e dalle scorte attuali.
  // Se la scorta cala, la quantità si riduce da sola; se un prodotto finisce, sparisce.
  const maxPerItem = config?.rules.MAX_PER_ITEM ?? null;
  const cart = useMemo(
    () =>
      rawCart.flatMap((item) => {
        const p = products.data.find((x) => x.id === item.productId);
        const max = p ? Math.min(p.stock, maxPerItem ?? Infinity) : 0;
        return max > 0 ? [{ ...item, quantity: Math.min(item.quantity, max) }] : [];
      }),
    [rawCart, products.data, maxPerItem],
  );

    // --- 5. Cosa scrivo sulla lavagna ---
  const value = useMemo<StoreValue | null>(() => {
    if (!config) return null;

    const find = (id: string) => products.data.find((p) => p.id === id);
    const maxQuantity = (id: string) => {
      const p = find(id);
      return p ? Math.min(p.stock, maxPerItem ?? Infinity) : 0;
    };
    const refreshAll = async () => {
      await Promise.all([products.refresh(), slots.refresh(), myOrders.refresh()]);
    };

    return {
      config,
      products: products.data,
      slots: slots.data,
      loading: products.loading,
      serverError: products.error || slots.error,

      cart,
      cartCount: cart.reduce((n, i) => n + i.quantity, 0),
      cartTotal: cart.reduce((sum, i) => sum + (find(i.productId)?.price ?? 0) * i.quantity, 0),
      maxQuantity,

      addToCart: (id) =>
        setCart((prev) => {
          const current = prev.find((i) => i.productId === id)?.quantity ?? 0;
          if (current >= maxQuantity(id)) return prev;
          return current
            ? prev.map((i) => (i.productId === id ? { ...i, quantity: current + 1 } : i))
            : [...prev, { productId: id, quantity: 1 }];
        }),

      setQuantity: (id, quantity) =>
        setCart((prev) => {
          const q = Math.min(quantity, maxQuantity(id));
          return q <= 0
            ? prev.filter((i) => i.productId !== id)
            : prev.map((i) => (i.productId === id ? { ...i, quantity: q } : i));
        }),

      removeFromCart: (id) => setCart((prev) => prev.filter((i) => i.productId !== id)),

      myOrders: myOrders.data,

      // Al server mando il carrello pulito: solo id e quantità
      confirmOrder: async (customerName, slot) => {
        const order = await api.createOrder({ customerName, slot, items: cart });
        setCart([]);
        setMyIds((prev) => [...prev, order.id]);
        await Promise.all([products.refresh(), slots.refresh()]);
        return order;
      },

      cancelOrder: async (id) => {
        await api.cancelOrder(id);
        await refreshAll();
      },

      refreshAll,
    };
  }, [config, products, slots, myOrders, cart, maxPerItem]);

  // Finché la configurazione non arriva, mostro "Caricamento…"
  if (!value) {
    return <div className="boot"><p className="muted">Caricamento…</p></div>;
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

// Il modo per leggere la lavagna da qualsiasi componente
// eslint-disable-next-line react-refresh/only-export-components
export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore deve essere usato dentro <StoreProvider>');
  return ctx;
}