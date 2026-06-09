import 'server-only';
import { adminDb } from '@/lib/firebase/admin';
import type { Timestamp } from 'firebase-admin/firestore';

/** Voce di wishlist arricchita col prodotto (risolto via Admin SDK). */
export interface WishlistEntry {
  productId: string;
  addedAt: string | null;
}

/** Ordine in forma serializzabile per la UI. */
export interface OrderSummary {
  id: string;
  status: string;
  amountCents: number;
  currency: string;
  createdAt: string | null;
  items: OrderLine[];
}

export interface OrderLine {
  title: string;
  qty: number;
  unitPrice?: number;
  options?: Record<string, string>;
}

function tsToIso(ts: unknown): string | null {
  const t = ts as Timestamp | undefined;
  return t?.toDate ? t.toDate().toISOString() : null;
}

/** Wishlist dell'utente (subcollection users/{uid}/wishlist). */
export async function getWishlist(uid: string): Promise<WishlistEntry[]> {
  const snap = await adminDb.collection('users').doc(uid).collection('wishlist').get();
  return snap.docs.map((d) => ({
    productId: d.id,
    addedAt: tsToIso(d.data().addedAt),
  }));
}

/**
 * Ordini dell'utente: `orders` filtrati per `userId`, ordinati per data desc
 * in memoria (evita l'indice composito where+orderBy).
 */
export async function getOrders(uid: string): Promise<OrderSummary[]> {
  const snap = await adminDb.collection('orders').where('userId', '==', uid).get();
  return snap.docs
    .map(mapOrder)
    .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));
}

/** Singolo ordine, solo se appartiene all'utente. `null` altrimenti. */
export async function getOrder(uid: string, id: string): Promise<OrderSummary | null> {
  const doc = await adminDb.collection('orders').doc(id).get();
  if (!doc.exists) return null;
  if (doc.data()?.userId !== uid) return null;
  return mapOrder(doc);
}

function mapOrder(
  doc: FirebaseFirestore.DocumentSnapshot | FirebaseFirestore.QueryDocumentSnapshot,
): OrderSummary {
  const data = doc.data() ?? {};
  const items = Array.isArray(data.items) ? data.items : [];
  return {
    id: doc.id,
    status: typeof data.status === 'string' ? data.status : 'unknown',
    amountCents: typeof data.amountCents === 'number' ? data.amountCents : 0,
    currency: typeof data.currency === 'string' ? data.currency : 'eur',
    createdAt: tsToIso(data.createdAt),
    items: items.map((it: Record<string, unknown>) => ({
      title: typeof it.title === 'string' ? it.title : '',
      qty: typeof it.qty === 'number' ? it.qty : 1,
      unitPrice: typeof it.unitPrice === 'number' ? it.unitPrice : undefined,
      options: (it.options as Record<string, string>) ?? undefined,
    })),
  };
}
