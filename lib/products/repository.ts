/**
 * Repository prodotti — SOLO server (Admin SDK).
 *
 * Sostituisce `ProdottiRepo` (Flutter) per le pagine SEO shop/detail.
 * Il catalogo è piccolo (~24 documenti): leggiamo l'intera collezione una
 * volta, la mettiamo in cache (ISR) e facciamo filtro/paginazione in memoria.
 * Questo evita indici compositi Firestore (`array-contains` + `orderBy`) e
 * mantiene il codice semplice. Se il catalogo crescerà molto, qui si passerà
 * a query con cursore `startAfter` come nel repo Flutter.
 */
import 'server-only';
import { unstable_cache } from 'next/cache';
import { adminDb } from '@/lib/firebase/admin';
import { mapProduct } from './mapper';
import type { Product } from '@/lib/types/product';

/** Secondi di validità della cache ISR del catalogo. */
export const PRODUCTS_REVALIDATE = 300;

/**
 * In sviluppo NON usiamo `unstable_cache`: ogni richiesta rilegge Firestore,
 * così le modifiche ai dati si vedono subito senza dover bustare il tag.
 * In produzione avvolgiamo con `unstable_cache` (ISR + tag `products`).
 */
const IS_DEV = process.env.NODE_ENV === 'development';
/* eslint-disable @typescript-eslint/no-explicit-any */
function maybeCache<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  keys: string[],
  options: { revalidate: number; tags: string[] },
): T {
  return IS_DEV ? fn : (unstable_cache(fn, keys, options) as T);
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/** Categoria del catalogo, derivata dai valori reali del campo `categories`. */
export interface ProductCategory {
  /** Valore esatto come salvato su Firestore (es. "Baby"). Vuoto = "tutti". */
  value: string;
  /** Numero di prodotti nella categoria. */
  count: number;
}

/**
 * Legge l'intera collezione `products`, ordinata per `title`, e la mappa.
 * Cache condivisa tra richieste con rivalidazione ISR + tag per invalidazione.
 */
export const getAllProducts = maybeCache(
  async (): Promise<Product[]> => {
    const snap = await adminDb.collection('products').orderBy('title').get();
    return snap.docs.map(mapProduct);
  },
  ['all-products'],
  { revalidate: PRODUCTS_REVALIDATE, tags: ['products'] },
);

/** Trova un prodotto dal suo slug URL-safe. `null` se non esiste. */
export async function getProductBySlug(slug: string): Promise<Product | null> {
  const all = await getAllProducts();
  return all.find((p) => p.slug === slug) ?? null;
}

/**
 * Elenco categorie per la barra dello shop, derivato dai dati reali.
 * Ordinato per frequenza decrescente; sempre preceduto dalla voce "tutti".
 */
export async function getCategories(): Promise<ProductCategory[]> {
  const all = await getAllProducts();
  const counts = new Map<string, number>();
  for (const p of all) {
    for (const c of p.categories) {
      counts.set(c, (counts.get(c) ?? 0) + 1);
    }
  }
  const categories = Array.from(counts, ([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));
  return [{ value: '', count: all.length }, ...categories];
}

/** Pagina filtrata di prodotti per la pagina shop (filtro/paginazione in memoria). */
export interface ProductPage {
  items: Product[];
  total: number;
  page: number;
  pageCount: number;
  pageSize: number;
}

/**
 * Filtra per categoria (vuota = tutte) e pagina i risultati.
 * Mantiene l'ordinamento per titolo del catalogo.
 */
export async function getProductsPage({
  category = '',
  page = 1,
  pageSize = 12,
}: {
  category?: string;
  page?: number;
  pageSize?: number;
}): Promise<ProductPage> {
  const all = await getAllProducts();
  const filtered = category
    ? all.filter((p) => p.categories.includes(category))
    : all;

  const total = filtered.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(Math.max(1, page), pageCount);
  const start = (current - 1) * pageSize;
  const items = filtered.slice(start, start + pageSize);

  return { items, total, page: current, pageCount, pageSize };
}

/**
 * Prodotti consigliati: stessa macro-categoria, escluso quello corrente.
 * Replica `getRecommendations` del repo Flutter.
 */
export async function getRecommendations(
  macroId: string,
  excludeId: string,
  limit = 4,
): Promise<Product[]> {
  const all = await getAllProducts();
  return all
    .filter((p) => p.macroId === macroId && p.id !== excludeId)
    .slice(0, limit);
}

/** Tutti gli slug, per `generateStaticParams` della pagina prodotto. */
export async function getAllSlugs(): Promise<string[]> {
  const all = await getAllProducts();
  return all.map((p) => p.slug).filter(Boolean);
}

/**
 * Ultimi prodotti aggiunti (per la home), ordinati per `data_aggiunta` desc.
 * Replica `getLatest` del repo Flutter. Cache ISR separata.
 */
export const getLatest = maybeCache(
  async (count = 4): Promise<Product[]> => {
    const snap = await adminDb
      .collection('products')
      .orderBy('data_aggiunta', 'desc')
      .limit(count)
      .get();
    return snap.docs.map(mapProduct);
  },
  ['latest-products'],
  { revalidate: PRODUCTS_REVALIDATE, tags: ['products'] },
);
