'use client';

import type { ReactNode } from 'react';
import { CartButton } from './CartButton';
import { CartDrawer } from './CartDrawer';

/**
 * Monta gli elementi globali del carrello (pulsante + drawer).
 *
 * Lo stato vive nello store Zustand (`lib/cart/store.ts`), globale e
 * persistito: non serve un React Context per condividerlo. Questo wrapper
 * esiste per montare la UI del carrello una sola volta a livello di layout.
 *
 * TODO(Fase 4 – auth): qui andrà l'effetto che, su login/logout, attiva il
 * sync Firestore e il merge guest→utente (vedi `lib/cart/firestore.ts`).
 */
export function CartProvider({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <CartButton />
      <CartDrawer />
    </>
  );
}
