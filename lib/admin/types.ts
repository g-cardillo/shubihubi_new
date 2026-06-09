/**
 * Tipi del pannello admin — riflettono i payload delle Cloud Function e i
 * documenti Firestore `discount_codes` / `gift_cards`, identici a quelli usati
 * dal progetto Flutter (`AdminProductFormController`, `DiscountCodesTab`,
 * `GiftCardsTab`). Il backend resta INVARIATO.
 */

/** Riga prodotto come letta in realtime (doc Firestore + id). */
export interface AdminProduct {
  id: string;
  title_it?: string;
  title?: string;
  title_eng?: string;
  macroId?: string;
  type?: string;
  description_it?: string;
  description?: string;
  description_eng?: string;
  formati?: string;
  formats?: string[];
  tecnica_it?: string;
  tecnica_eng?: string;
  productDetails_it?: string;
  productDetails_eng?: string;
  personalizzazione_it?: string;
  personalizzazione_eng?: string;
  confezione_it?: string;
  confezione_eng?: string;
  tempiRealizzazione_it?: string;
  tempiRealizzazione_eng?: string;
  price?: number;
  salePrice?: number;
  isOnSale?: boolean;
  isSoldOut?: boolean;
  colorChangeable?: boolean;
  corniceAvailable?: boolean;
  categories?: string[];
  colours?: string[];
  colors?: string[];
  imageUrls?: string[];
  [key: string]: unknown;
}

/**
 * Payload inviato a `adminAddProduct` / `adminUpdateProduct`.
 * Chiavi identiche a quelle costruite in `AdminProductFormController.submit`.
 */
export interface AdminProductPayload {
  productId: string;
  title_it: string;
  title_eng: string;
  macroId: string;
  categories: string[];
  description_it: string;
  description_eng: string;
  formati: string;
  tecnica_it: string;
  tecnica_eng: string;
  imageUrls: string[];
  isOnSale: boolean;
  isSoldOut: boolean;
  price: number;
  salePrice: number;
  colorChangeable: boolean;
  colours: string[];
  corniceAvailable: boolean;
  productDetails_it: string;
  productDetails_eng: string;
  personalizzazione_it: string;
  personalizzazione_eng: string;
  confezione_it: string;
  confezione_eng: string;
  tempiRealizzazione_it: string;
  tempiRealizzazione_eng: string;
}

/** Documento `discount_codes/{CODE}` (+ id). */
export interface DiscountCodeDoc {
  id: string;
  discountPercent?: number;
  minOrderAmount?: number;
  used?: boolean;
  createdAt?: { seconds: number; nanoseconds: number } | null;
}

/** Documento `gift_cards/{CODE}` (+ id). */
export interface GiftCardDoc {
  id: string;
  amountCents?: number;
  active?: boolean;
  createdAt?: { seconds: number; nanoseconds: number } | null;
}
