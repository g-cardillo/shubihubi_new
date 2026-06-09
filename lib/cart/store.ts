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
 * Per utenti loggati il carrello è sincronizzato da Firestore (vedi
 * `AuthProvider` + `lib/cart/firestore.ts`): in quel caso `mode === 'user'` e
 * la persistenza su localStorage è sospesa (la fonte di verità è Firestore).
 * Da guest, lo store persistito in localStorage è la sola fonte di verità.
 */
export interface CartState {
  items: CartItem[];
  isOpen: boolean;
  /** True dopo l'idratazione da localStorage (evita mismatch SSR). */
  hydrated: boolean;
  /**
   * `'user'` quando il carrello è sincronizzato da Firestore (utente loggato).
   * In questa modalità NON persistiamo su localStorage: la fonte di verità è
   * Firestore. Senza questo gate, il carrello utente verrebbe riscritto nella
   * chiave guest e `mergeGuestIntoUser` lo ri-fonderebbe (con `increment`) ad
   * ogni mount del provider — es. al cambio lingua — gonfiando le quantità.
   */
  mode: 'guest' | 'user';

  addItem: (item: CartItem) => void;
  increment: (key: string) => void;
  decrement: (key: string) => void;
  remove: (key: string) => void;
  updateNote: (key: string, note: string | null) => void;
  clear: () => void;

  open: () => void;
  close: () => void;
  toggle: () => void;
  /** Sostituisce in blocco le righe (usato dal sync Firestore). */
  setItems: (items: CartItem[]) => void;
  /** Imposta la modalità guest/user (gestita da AuthProvider). */
  setMode: (mode: 'guest' | 'user') => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      isOpen: false,
      hydrated: false,
      mode: 'guest',

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
      setMode: (mode) => set({ mode }),
    }),
    {
      name: GUEST_CART_KEY,
      storage: createJSONStorage(() => localStorage),
      // Persisti solo le righe del carrello GUEST. Quando l'utente è loggato
      // (mode 'user') la fonte di verità è Firestore: non scriviamo nulla nella
      // chiave guest, così non si crea il loop di re-merge.
      partialize: (state) => ({ items: state.mode === 'user' ? [] : state.items }),
      onRehydrateStorage: () => (state) => {
        if (state) state.hydrated = true;
      },
    },
  ),
);
