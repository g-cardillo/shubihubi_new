/**
 * Product — mappa il documento Firestore della collezione `products`.
 *
 * I nomi dei campi corrispondono ESATTAMENTE a quelli salvati su Firestore
 * (cfr. `product_dto.dart` e `buildProductDoc` nel progetto Flutter), così il
 * mapper lato Next può leggerli senza trasformazioni di chiave.
 *
 * Nota localizzazione: i campi `*_it` / `*_eng` contengono le due lingue.
 * `title` / `description` sono duplicati legacy (== versione IT) tenuti per
 * retrocompatibilità con il vecchio `ProductUI.fromFirestore`.
 */
export interface ProductDoc {
  /** ID del documento Firestore. */
  id: string;

  /** Slug URL-safe univoco (introdotto per la migrazione Next, /shop/[slug]). */
  slug: string;

  // ── Titolo / descrizione (localizzati) ──────────────────────────────────────
  title_it: string;
  title_eng: string;
  /** Legacy: == title_it. */
  title?: string;
  description_it: string;
  description_eng: string;
  /** Legacy: == description_it. */
  description?: string;

  // ── Campi descrittivi estesi (localizzati) ──────────────────────────────────
  tecnica_it: string;
  tecnica_eng: string;
  productDetails_it: string;
  productDetails_eng: string;
  personalizzazione_it: string;
  personalizzazione_eng: string;
  confezione_it: string;
  confezione_eng: string;
  tempiRealizzazione_it: string;
  tempiRealizzazione_eng: string;

  // ── Categoria / tipo ────────────────────────────────────────────────────────
  macroId: string;
  /** Legacy: == macroId. */
  type?: string;
  categories: string[];

  // ── Nuova categorizzazione (tutti opzionali per retrocompatibilità: i
  //    prodotti esistenti non hanno questi campi) ──────────────────────────────
  categoryDescription_it?: string;
  categoryDescription_eng?: string;
  subcategory?: string;
  userFilters?: string[];
  searchFilters?: string[];

  // ── Prezzo ──────────────────────────────────────────────────────────────────
  price: number;
  salePrice: number | null;
  priceText: string;
  originalPriceText: string | null;
  salePriceText: string | null;
  isOnSale: boolean;
  saleLabel?: string;
  lowStockLabel?: string | null;

  // ── Stato / badge ───────────────────────────────────────────────────────────
  isSoldOut: boolean;
  isLimited: boolean;
  /**
   * Nota: `isNew` NON è un campo Firestore: nel client Flutter è calcolato da
   * `data_aggiunta` (<= 14 giorni). Qui esponiamo `data_aggiunta` grezzo e il
   * calcolo si fa nel mapper/UI.
   */
  data_aggiunta?: FirestoreTimestamp | null;

  // ── Formati ─────────────────────────────────────────────────────────────────
  /** Stringa CSV originale dal form admin (es. "A4, A5"). */
  formati?: string;
  formats: string[];

  // ── Immagini ────────────────────────────────────────────────────────────────
  imageUrls: string[];

  // ── Opzioni / personalizzazione ─────────────────────────────────────────────
  colorChangeable: boolean;
  /** Campo Firestore primario per i colori. */
  colours: string[];
  /** Legacy/alias: == colours. */
  colors?: string[];
  corniceAvailable: boolean;

  // ── Metadati ────────────────────────────────────────────────────────────────
  updatedAt?: FirestoreTimestamp | null;
}

/**
 * Forma serializzabile di un Firestore Timestamp.
 * Sia il client SDK che l'Admin SDK espongono { seconds, nanoseconds }.
 */
export interface FirestoreTimestamp {
  seconds: number;
  nanoseconds: number;
}

/**
 * Vista normalizzata e localizzata di un prodotto, pronta per la UI.
 * (Il mapper Firestore → Product verrà aggiunto nelle fasi successive.)
 */
export interface Product
  extends Omit<
    ProductDoc,
    'data_aggiunta' | 'updatedAt' | 'colours' | 'colors'
  > {
  /** Colori normalizzati (da `colours`/`colors`). */
  colors: string[];
  /** Calcolato: aggiunto negli ultimi 14 giorni. */
  isNew: boolean;
  /** Prezzo effettivo: salePrice se in saldo, altrimenti price. */
  effectivePrice: number;
}
