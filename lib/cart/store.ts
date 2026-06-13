'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  type CartItem,
  cartItemKey,
  GUEST_CART_KEY,
} from '@/lib/types/cart';
import { persistLine, deleteLine, clearAll } from '@/lib/cart/firestore';

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
  /** UID dell'utente loggato; serve a propagare le mutazioni a Firestore. */
  uid: string | null;

  addItem: (item: CartItem) => void;
  increment: (key: string) => void;
  decrement: (key: string) => void;
  remove: (key: string) => void;
  updateNote: (key: string, note: string | null) => void;
  /**
   * Sostituisce opzioni e prezzo unitario di una riga (editor opzioni del
   * drawer — replica `CartController.updateOptions` Flutter). Le opzioni
   * determinano la merge-key: se la nuova chiave coincide con un'altra riga
   * esistente, le quantità vengono fuse.
   */
  updateOptions: (
    key: string,
    options: Record<string, string>,
    unitPrice: number,
  ) => void;
  clear: () => void;

  /**
   * Riconcilia lo stato `soldOut` delle righe con i valori freschi letti da
   * Firestore (chiavi = productId). Replica la parte sold-out di
   * `CartController._resolveProducts` del Flutter: aggiorna SOLO il flag in
   * memoria (niente persistenza su Firestore, come nel Flutter), così
   * subtotale, badge e checkout usano lo stato aggiornato. No-op se nulla cambia.
   */
  reconcileSoldOut: (soldOutByProductId: Record<string, boolean>) => void;

  open: () => void;
  close: () => void;
  toggle: () => void;
  /** Sostituisce in blocco le righe (usato dal sync Firestore). */
  setItems: (items: CartItem[]) => void;
  /**
   * Imposta la modalità guest/user (gestita da AuthProvider). In modalità
   * `'user'` va passato l'`uid`, così le mutazioni vengono propagate a Firestore.
   */
  setMode: (mode: 'guest' | 'user', uid?: string | null) => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => {
      // Propaga una riga aggiornata a Firestore quando l'utente è loggato.
      // Lo snapshot realtime (`streamUserCart`) riconcilierà poi lo stato; qui
      // l'update locale è solo ottimistico per la reattività della UI.
      const syncLine = (item: CartItem) => {
        const { mode, uid } = get();
        if (mode === 'user' && uid) void persistLine(uid, item);
      };
      const syncDelete = (key: string) => {
        const { mode, uid } = get();
        if (mode === 'user' && uid) void deleteLine(uid, key);
      };

      return {
        items: [],
        isOpen: false,
        hydrated: false,
        mode: 'guest',
        uid: null,

        addItem: (item) => {
          const state = get();
          const key = cartItemKey(item);
          const i = state.items.findIndex((x) => cartItemKey(x) === key);
          let resulting: CartItem;
          if (i >= 0) {
            resulting = { ...state.items[i], qty: state.items[i].qty + item.qty };
            if (item.note) resulting.note = item.note;
            const items = [...state.items];
            items[i] = resulting;
            set({ items, isOpen: true });
          } else {
            resulting = item;
            set({ items: [...state.items, item], isOpen: true });
          }
          syncLine(resulting);
        },

        increment: (key) => {
          const target = get().items.find((x) => cartItemKey(x) === key);
          if (!target) return;
          const updated = { ...target, qty: target.qty + 1 };
          set((state) => ({
            items: state.items.map((x) => (cartItemKey(x) === key ? updated : x)),
          }));
          syncLine(updated);
        },

        decrement: (key) => {
          const target = get().items.find((x) => cartItemKey(x) === key);
          if (!target || target.qty <= 1) return;
          const updated = { ...target, qty: target.qty - 1 };
          set((state) => ({
            items: state.items.map((x) => (cartItemKey(x) === key ? updated : x)),
          }));
          syncLine(updated);
        },

        remove: (key) => {
          set((state) => ({
            items: state.items.filter((x) => cartItemKey(x) !== key),
          }));
          syncDelete(key);
        },

        updateNote: (key, note) => {
          const trimmed = (note ?? '').trim();
          const target = get().items.find((x) => cartItemKey(x) === key);
          if (!target) return;
          const updated = { ...target, note: trimmed || null };
          set((state) => ({
            items: state.items.map((x) => (cartItemKey(x) === key ? updated : x)),
          }));
          syncLine(updated);
        },

        updateOptions: (key, options, unitPrice) => {
          const state = get();
          const target = state.items.find((x) => cartItemKey(x) === key);
          if (!target) return;

          const updated: CartItem = { ...target, options, unitPrice };
          const newKey = cartItemKey(updated);
          if (newKey === key) {
            // Stesse opzioni (è cambiato solo il prezzo o nulla): update in place.
            set({
              items: state.items.map((x) => (cartItemKey(x) === key ? updated : x)),
            });
            syncLine(updated);
            return;
          }

          // La chiave cambia: rimuovi la riga vecchia e fondi nell'eventuale
          // riga che ha già le nuove opzioni.
          const existing = state.items.find((x) => cartItemKey(x) === newKey);
          if (existing) updated.qty += existing.qty;
          set({
            items: [
              ...state.items.filter(
                (x) => cartItemKey(x) !== key && cartItemKey(x) !== newKey,
              ),
              updated,
            ],
          });
          syncDelete(key);
          syncLine(updated);
        },

        clear: () => {
          const { mode, uid } = get();
          set({ items: [] });
          if (mode === 'user' && uid) void clearAll(uid);
        },

        reconcileSoldOut: (soldOutByProductId) => {
          const state = get();
          let changed = false;
          const items = state.items.map((it) => {
            const fresh = soldOutByProductId[it.productId];
            if (fresh !== undefined && fresh !== it.soldOut) {
              changed = true;
              return { ...it, soldOut: fresh };
            }
            return it;
          });
          // Solo se qualcosa è cambiato, per non innescare render inutili.
          if (changed) set({ items });
        },

        open: () => set({ isOpen: true }),
        close: () => set({ isOpen: false }),
        toggle: () => set((s) => ({ isOpen: !s.isOpen })),
        setItems: (items) => set({ items }),
        setMode: (mode, uid = null) => set({ mode, uid }),
      };
    },
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
