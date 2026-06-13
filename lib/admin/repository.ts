'use client';

/**
 * Call-site dell'area admin — replica fedele di `AdminController`,
 * `AdminProductFormController`, `DiscountCodesTab`, `GiftCardsTab` di Flutter.
 *
 * Il BACKEND È INVARIATO: si invocano le stesse Cloud Function `onCall`
 * (`adminAddProduct`, `adminUpdateProduct`, `adminDeleteProduct`,
 * `adminCreateDiscountCode`, `adminCreateGiftCard`) e si leggono/eliminano i
 * documenti `products` / `discount_codes` / `gift_cards` direttamente via
 * Firestore client (consentito dalle security rules per gli admin).
 */
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
} from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { httpsCallable } from 'firebase/functions';
import { getAuth } from 'firebase/auth';
import { db, functions, storage } from '@/lib/firebase/client';
import { resizeToWebp, contentTypeFromName } from './imageResize';
import type {
  AdminProduct,
  AdminProductPayload,
  DiscountCodeDoc,
  GiftCardDoc,
} from './types';

// ── Realtime listeners ───────────────────────────────────────────────────────

/**
 * Stream dei prodotti ordinati per `data_aggiunta` desc (come `_listenProducts`
 * di Flutter). Ritorna la funzione di unsubscribe.
 */
export function streamProducts(
  cb: (products: AdminProduct[]) => void,
): () => void {
  const q = query(
    collection(db, 'products'),
    orderBy('data_aggiunta', 'desc'),
  );
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as AdminProduct));
  });
}

/** Stream dei codici sconto (ordinati per createdAt desc lato client). */
export function streamDiscountCodes(
  cb: (codes: DiscountCodeDoc[]) => void,
  onError?: (e: Error) => void,
): () => void {
  return onSnapshot(
    collection(db, 'discount_codes'),
    (snap) => {
      const codes = snap.docs.map(
        (d) => ({ id: d.id, ...d.data() }) as DiscountCodeDoc,
      );
      codes.sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
      cb(codes);
    },
    (e) => onError?.(e),
  );
}

/** Stream dei buoni / gift card (ordinati per createdAt desc lato client). */
export function streamGiftCards(
  cb: (cards: GiftCardDoc[]) => void,
  onError?: (e: Error) => void,
): () => void {
  return onSnapshot(
    collection(db, 'gift_cards'),
    (snap) => {
      const cards = snap.docs.map(
        (d) => ({ id: d.id, ...d.data() }) as GiftCardDoc,
      );
      cards.sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
      cb(cards);
    },
    (e) => onError?.(e),
  );
}

// ── Prodotti (Cloud Function + Storage) ──────────────────────────────────────

/** Genera un id documento `products` lato client (per nominare lo Storage path). */
export function newProductId(): string {
  return doc(collection(db, 'products')).id;
}

/**
 * Carica le nuove immagini su Storage (resize→WebP) e ritorna i download URL.
 * Replica il loop di upload in `AdminProductFormController.submit`.
 */
export async function uploadProductImages(
  productId: string,
  files: File[],
): Promise<string[]> {
  const urls: string[] = [];
  for (const file of files) {
    const resized = await resizeToWebp(file, 1600);
    const dot = file.name.lastIndexOf('.');
    const base = dot > 0 ? file.name.slice(0, dot) : file.name;
    const ext = resized.isWebp ? 'webp' : file.name.split('.').pop() || 'jpg';
    const contentType = resized.isWebp
      ? 'image/webp'
      : contentTypeFromName(file.name);

    const path = `products/${productId}/${Date.now()}_${base}.${ext}`;
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, resized.blob, { contentType });
    urls.push(await getDownloadURL(storageRef));
  }
  return urls;
}

/** Forza il refresh del token per garantire il claim admin nelle chiamate. */
export async function refreshIdToken(): Promise<void> {
  await getAuth().currentUser?.getIdToken(true);
}

/**
 * "Pubblica e aggiorna sito": invalida la cache del sito pubblico dopo una
 * modifica al catalogo (tag `products` + pagine shop e dettaglio prodotto in
 * entrambe le lingue). Autenticata con l'ID token dell'admin corrente — il
 * claim `admin` viene verificato server-side da `/api/revalidate`.
 * Ritorna true se l'invalidazione è andata a buon fine.
 */
export async function revalidateSite(): Promise<boolean> {
  try {
    const token = await getAuth().currentUser?.getIdToken();
    if (!token) return false;
    const params = new URLSearchParams();
    params.append('tag', 'products');
    params.append('path', '/[locale]/shop');
    params.append('path', '/[locale]/shop/[slug]');
    const res = await fetch(`/api/revalidate?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return false;
    const body = (await res.json()) as { ok?: boolean };
    return body.ok === true;
  } catch {
    return false;
  }
}

export async function adminAddProduct(payload: AdminProductPayload): Promise<void> {
  await httpsCallable(functions, 'adminAddProduct')(payload);
}

export async function adminUpdateProduct(
  payload: AdminProductPayload,
): Promise<void> {
  await httpsCallable(functions, 'adminUpdateProduct')(payload);
}

export async function adminDeleteProduct(productId: string): Promise<void> {
  await httpsCallable(functions, 'adminDeleteProduct')({ productId });
}

/**
 * Log strutturato dell'errore di una Cloud Function onCall. Gli `HttpsError`
 * espongono `code` (es. `functions/permission-denied`), `message` e `details`:
 * stamparli rende immediato capire se è auth, validazione o conflitto.
 */
function logFunctionError(fnName: string, err: unknown): void {
  const e = err as { code?: string; message?: string; details?: unknown };
  console.error(`[admin] ${fnName} FAILED`, {
    code: e.code,
    message: e.message,
    details: e.details,
  });
}

/**
 * Messaggio leggibile da un errore di Cloud Function per mostrarlo all'admin:
 * include il codice (es. `functions/permission-denied`) così l'errore non è
 * più "silenzioso" e la causa è immediata.
 */
export function functionErrorMessage(err: unknown): string {
  const e = err as { code?: string; message?: string };
  if (e?.message && e?.code) return `${e.message} (${e.code})`;
  return e?.message || 'Errore sconosciuto';
}

// ── Codici sconto ────────────────────────────────────────────────────────────

export async function createDiscountCode(input: {
  code: string;
  discountPercent: number;
  minOrderAmount?: number;
}): Promise<void> {
  // Le onCall admin richiedono un ID token col claim `admin` FRESCO. Senza
  // forzare il refresh il client può inviare un token stale (claim assente) →
  // la Function risponde `permission-denied`. È lo stesso passo che fa il form
  // prodotto (`ProductForm.submit`) prima di `adminAddProduct`.
  await refreshIdToken();

  const payload: Record<string, unknown> = {
    code: input.code,
    discountPercent: input.discountPercent,
  };
  if (input.minOrderAmount != null) payload.minOrderAmount = input.minOrderAmount;

  console.log('[admin] adminCreateDiscountCode →', payload);
  try {
    await httpsCallable(functions, 'adminCreateDiscountCode')(payload);
    console.log('[admin] adminCreateDiscountCode OK', input.code);
  } catch (err) {
    logFunctionError('adminCreateDiscountCode', err);
    throw err;
  }
}

export async function deleteDiscountCode(codeId: string): Promise<void> {
  await deleteDoc(doc(db, 'discount_codes', codeId));
}

// ── Buoni / gift card ────────────────────────────────────────────────────────

export async function createGiftCard(input: {
  code: string;
  amountEur: number;
}): Promise<void> {
  // Vedi nota in createDiscountCode: serve un token fresco col claim admin.
  await refreshIdToken();

  const payload = { code: input.code, amountEur: input.amountEur };

  console.log('[admin] adminCreateGiftCard →', payload);
  try {
    await httpsCallable(functions, 'adminCreateGiftCard')(payload);
    console.log('[admin] adminCreateGiftCard OK', input.code);
  } catch (err) {
    logFunctionError('adminCreateGiftCard', err);
    throw err;
  }
}

export async function deleteGiftCard(codeId: string): Promise<void> {
  await deleteDoc(doc(db, 'gift_cards', codeId));
}
