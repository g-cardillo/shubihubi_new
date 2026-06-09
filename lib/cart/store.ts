'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  type CartItem,
  cartItemKey,
  GUEST_CART_KEY,
} from '@/lib/types/cart';

/**
 * Store carrello (Zustand) — replica `CartController` di Flutter per la parte
 * GUEST. Gli articoli sono persistiti in localStorage (`persist`).
 *
 * Sincronizzazione Firestore per utenti loggati e merge guest→utente al login
 * NON sono ancora attivi: richiedono l'auth (Fase 4). I punti di aggancio sono
 * in `lib/cart/firestore.ts`. Finché non c'è auth, questo store guest è la
 * sola fonte di verità ed è pienamente funzionante.
 */
export interface CartState {
  items: CartItem[];
  isOpen: boolean;
  /** True dopo l'idratazione da localStorage (evita mismatch SSR). */
  hydrated: boolean;

  addItem: (item: CartItem) => void;
  increment: (key: string) => void;
  decrement: (key: string) => void;
  remove: (key: string) => void;
  updateNote: (key: string, note: string | null) => void;
  clear: () => void;

  open: () => void;
  close: () => void;
  toggle: () => void;
  /** Sostituisce in blocco le righe (usato dal sync Firestore, Fase 4). */
  setItems: (items: CartItem[]) => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      isOpen: false,
      hydrated: false,

      addItem: (item) =>
        set((state) => {
          const key = cartItemKey(item);
          const i = state.items.findIndex((x) => cartItemKey(x) === key);
          if (i >= 0) {
            const items = [...state.items];
            const existing = { ...items[i], qty: items[i].qty + item.qty };
            if (item.note) existing.note = item.note;
            items[i] = existing;
            return { items, isOpen: true };
          }
          return { items: [...state.items, item], isOpen: true };
        }),

      increment: (key) =>
        set((state) => ({
          items: state.items.map((x) =>
            cartItemKey(x) === key ? { ...x, qty: x.qty + 1 } : x,
          ),
        })),

      decrement: (key) =>
        set((state) => ({
          items: state.items.map((x) =>
            cartItemKey(x) === key && x.qty > 1 ? { ...x, qty: x.qty - 1 } : x,
          ),
        })),

      remove: (key) =>
        set((state) => ({
          items: state.items.filter((x) => cartItemKey(x) !== key),
        })),

      updateNote: (key, note) =>
        set((state) => {
          const trimmed = (note ?? '').trim();
          return {
            items: state.items.map((x) =>
              cartItemKey(x) === key ? { ...x, note: trimmed || null } : x,
            ),
          };
        }),

      clear: () => set({ items: [] }),

      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      toggle: () => set((s) => ({ isOpen: !s.isOpen })),
      setItems: (items) => set({ items }),
    }),
    {
      name: GUEST_CART_KEY,
      storage: createJSONStorage(() => localStorage),
      // Persisti solo le righe, non lo stato UI (isOpen/hydrated).
      partialize: (state) => ({ items: state.items }),
      onRehydrateStorage: () => (state) => {
        if (state) state.hydrated = true;
      },
    },
  ),
);
