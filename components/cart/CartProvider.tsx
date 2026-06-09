'use client';

import type { ReactNode } from 'react';
import { CartDrawer } from './CartDrawer';

/**
 * Monta il drawer globale del carrello. Il pulsante carrello (con badge) vive
 * ora nella Navbar; qui resta solo il pannello, montato una volta a livello di
 * layout. Lo stato è nello store Zustand (`lib/cart/store.ts`), globale e
 * persistito — niente React Context.
 */
export function CartProvider({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <CartDrawer />
    </>
  );
}
