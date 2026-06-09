import type { Product } from './product';

/**
 * CartItem — riga del carrello.
 * Derivato da `cart_item.dart` del progetto Flutter.
 *
 * `options` distingue lo stesso prodotto con varianti diverse
 * (es. colore, formato, cornice). La chiave univoca di riga è data da
 * `cartItemKey(item)`.
 */
export interface CartItem {
  productId: string;
  title: string;
  unitPrice: number;
  qty: number;
  soldOut: boolean;
  /** Opzioni selezionate (es. { colore: "rosso", formato: "A4" }). */
  options: Record<string, string>;
  note?: string | null;
  /** URL immagine (snapshot al momento dell'aggiunta) per la thumbnail nel drawer. */
  image?: string | null;
  /** Snapshot opzionale del prodotto completo (per la UI). */
  product?: Product | null;
}

/** Importo minimo d'ordine per abilitare il checkout (cfr. CartController Flutter). */
export const MIN_ORDER_AMOUNT = 45;

/** Chiave localStorage del carrello guest. */
export const GUEST_CART_KEY = 'shubihubi-cart-v1';

/** Totale di riga: prezzo unitario × quantità. */
export function lineTotal(item: CartItem): number {
  return item.unitPrice * item.qty;
}

/** Formattazione prezzo in euro: `€1.234,56` → replica `eur()` di Flutter. */
export function eur(value: number): string {
  return `€${value.toFixed(2).replace('.', ',')}`;
}

/** Quantità totale articoli nel carrello. */
export function totalQty(items: CartItem[]): number {
  return items.reduce((s, i) => s + i.qty, 0);
}

/** Subtotale: somma delle righe NON esaurite (i soldOut non contano). */
export function subtotal(items: CartItem[]): number {
  return items.filter((i) => !i.soldOut).reduce((s, i) => s + lineTotal(i), 0);
}

/**
 * Chiave univoca che distingue lo stesso prodotto con opzioni diverse.
 * Replica `CartItem.key` di Flutter: `productId|chiave:valore|...` ordinato.
 */
export function cartItemKey(item: CartItem): string {
  const optKey = Object.entries(item.options)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}:${v}`)
    .join('|');
  return `${item.productId}|${optKey}`;
}
