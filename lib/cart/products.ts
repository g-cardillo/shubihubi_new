'use client';

/**
 * Idratazione client dei dati prodotto per le righe del carrello.
 *
 * Il Flutter (`CartController`) ricarica il `ProductUI` per ogni riga e da lì
 * prende immagine, colori, cornice, prezzo effettivo e stato esaurito. Qui
 * facciamo lo stesso con una `getDoc` su `products/{id}` (lettura pubblica
 * dalle Firestore rules) e una cache a livello di modulo, perché:
 *  - le righe sincronizzate da Firestore (utente loggato) non hanno `image`;
 *  - l'editor opzioni del drawer ha bisogno di colori/cornice/prezzo.
 */
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';

export interface CartProductInfo {
  id: string;
  macroId: string;
  effectivePrice: number;
  colors: string[];
  colorChangeable: boolean;
  corniceAvailable: boolean;
  image: string | null;
  isSoldOut: boolean;
}

const cache = new Map<string, CartProductInfo | null>();
const pending = new Map<string, Promise<CartProductInfo | null>>();

function toStringArray(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
}

/** Stessa estrazione campi di `lib/products/mapper.ts` (limitata al necessario). */
function fromData(id: string, data: Record<string, unknown>): CartProductInfo {
  const price = typeof data.price === 'number' ? data.price : 0;
  const salePrice = typeof data.salePrice === 'number' ? data.salePrice : null;
  const isOnSale = data.isOnSale === true;
  const colors = toStringArray(data.colors).length
    ? toStringArray(data.colors)
    : toStringArray(data.colours);
  const images = toStringArray(data.imageUrls);

  return {
    id,
    macroId:
      typeof data.macroId === 'string'
        ? data.macroId
        : typeof data.type === 'string'
          ? data.type
          : '',
    effectivePrice: isOnSale && salePrice != null ? salePrice : price,
    colors,
    colorChangeable: data.colorChangeable === true,
    corniceAvailable: data.corniceAvailable === true,
    image: images[0] ?? null,
    isSoldOut: data.isSoldOut === true,
  };
}

export async function fetchCartProduct(
  productId: string,
): Promise<CartProductInfo | null> {
  if (cache.has(productId)) return cache.get(productId)!;
  const inFlight = pending.get(productId);
  if (inFlight) return inFlight;

  const p = (async () => {
    try {
      const snap = await getDoc(doc(db, 'products', productId));
      const info = snap.exists()
        ? fromData(productId, snap.data() as Record<string, unknown>)
        : null;
      cache.set(productId, info);
      return info;
    } catch {
      return null; // offline/regole: la UI degrada senza thumbnail/editor
    } finally {
      pending.delete(productId);
    }
  })();
  pending.set(productId, p);
  return p;
}
