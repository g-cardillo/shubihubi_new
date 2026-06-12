'use client';

/**
 * Sincronizzazione carrello con Firestore per utenti LOGGATI.
 *
 * Collegato: `AuthProvider` al login fonde il guest cart (`mergeGuestIntoUser`),
 * passa lo store in `mode === 'user'` e sottoscrive `streamUserCart`. Le
 * mutazioni dello store (add/increment/decrement/remove/updateNote/clear)
 * propagano qui via `persistLine`/`deleteLine`/`clearAll`; lo snapshot realtime
 * riconcilia poi lo stato locale. Da guest la fonte di verità resta localStorage.
 */
import {
  collection,
  doc,
  deleteDoc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  setDoc,
  increment,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import {
  type CartItem,
  cartItemKey,
  GUEST_CART_KEY,
} from '@/lib/types/cart';

const cartCol = (uid: string) => collection(db, 'users', uid, 'cart');

/** Mappa un documento Firestore in CartItem. */
function fromDoc(data: Record<string, unknown>): CartItem {
  return {
    productId: (data.productId as string) ?? '',
    title: (data.title as string) ?? '',
    unitPrice: typeof data.unitPrice === 'number' ? data.unitPrice : 0,
    qty: typeof data.qty === 'number' ? data.qty : 0,
    soldOut: false,
    options: (data.options as Record<string, string>) ?? {},
    note: (data.note as string | null) ?? null,
    image: (data.image as string | null) ?? null,
    product: null,
  };
}

/** Sottoscrizione realtime al carrello utente. Ritorna l'unsubscribe. */
export function streamUserCart(
  uid: string,
  onChange: (items: CartItem[]) => void,
): () => void {
  return onSnapshot(cartCol(uid), (snap) => {
    onChange(snap.docs.map((d) => fromDoc(d.data())));
  });
}

/** Crea/aggiorna una riga (merge). */
export async function persistLine(uid: string, item: CartItem): Promise<void> {
  await setDoc(
    doc(cartCol(uid), cartItemKey(item)),
    {
      productId: item.productId,
      title: item.title,
      unitPrice: item.unitPrice,
      options: item.options,
      note: item.note ?? null,
      image: item.image ?? null,
      qty: item.qty,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

/** Elimina una riga. */
export async function deleteLine(uid: string, key: string): Promise<void> {
  await deleteDoc(doc(cartCol(uid), key));
}

/** Svuota il carrello utente. */
export async function clearAll(uid: string): Promise<void> {
  const snap = await getDocs(cartCol(uid));
  const batch = writeBatch(db);
  snap.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
}

/**
 * Fonde il guest cart (localStorage) nei documenti utente: la quantità viene
 * SOMMATA (`increment`) a quella eventualmente già presente. Replica
 * `mergeGuestIntoUser` di Flutter. Al termine svuota lo storage guest.
 */
export async function mergeGuestIntoUser(uid: string): Promise<void> {
  const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(GUEST_CART_KEY) : null;
  if (!raw) return;

  let items: CartItem[] = [];
  try {
    items = JSON.parse(raw)?.state?.items ?? [];
  } catch {
    return;
  }
  if (items.length === 0) return;

  const batch = writeBatch(db);
  for (const item of items) {
    batch.set(
      doc(cartCol(uid), cartItemKey(item)),
      {
        productId: item.productId,
        title: item.title,
        unitPrice: item.unitPrice,
        options: item.options,
        note: item.note ?? null,
        image: item.image ?? null,
        qty: increment(item.qty),
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  }
  await batch.commit();
  localStorage.removeItem(GUEST_CART_KEY);
}
