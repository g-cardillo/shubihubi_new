'use client';

import { useEffect, useMemo } from 'react';
import { useCartStore } from '@/lib/cart/store';
import { fetchCartProduct } from '@/lib/cart/products';

/**
 * Rilegge da Firestore lo stato `isSoldOut` dei prodotti nel carrello e
 * aggiorna lo store con i valori freschi. Replica la parte sold-out di
 * `CartController._resolveProducts` del Flutter: evita che un prodotto
 * esauritosi DOPO l'aggiunta al carrello (flag `soldOut` stale) venga comunque
 * acquistato.
 *
 * Va montato dove serve lo stato fresco: nel CartDrawer (globale) e nel
 * checkout. Si riesegue quando cambia l'insieme dei `productId` in carrello;
 * la lettura è forzata (bypassa la cache) così è sempre aggiornata.
 */
export function useSoldOutReconcile() {
  const items = useCartStore((s) => s.items);
  const reconcileSoldOut = useCartStore((s) => s.reconcileSoldOut);

  // Chiave stabile (stringa) dei productId distinti: evita di rieseguire
  // l'effetto a ogni cambio di riferimento di `items` (qty, nota, opzioni…).
  const ids = useMemo(
    () => Array.from(new Set(items.map((i) => i.productId))),
    [items],
  );
  const idsKey = ids.join(',');

  useEffect(() => {
    if (ids.length === 0) return;
    let cancelled = false;
    void (async () => {
      const entries = await Promise.all(
        ids.map(async (id) => {
          const info = await fetchCartProduct(id, { force: true });
          return [id, info?.isSoldOut ?? false] as const;
        }),
      );
      if (!cancelled) reconcileSoldOut(Object.fromEntries(entries));
    })();
    return () => {
      cancelled = true;
    };
    // `ids` deriva da `idsKey`; dipendere da idsKey evita loop sul nuovo array.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey, reconcileSoldOut]);
}
