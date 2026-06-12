/**
 * Mapper Firestore → Product (lato server).
 *
 * Replica `ProductDto.fromFirestore` del progetto Flutter, ma restituisce un
 * oggetto **completamente serializzabile**: i Timestamp (`data_aggiunta`,
 * `updatedAt`) non vengono propagati al client — `isNew` è già calcolato qui,
 * così il `Product` può attraversare il confine Server → Client Component.
 */
import 'server-only';
import type {
  DocumentSnapshot,
  QueryDocumentSnapshot,
  Timestamp,
} from 'firebase-admin/firestore';
import type { Product } from '@/lib/types/product';

/** Numero di giorni entro cui un prodotto è considerato "nuovo". */
const NEW_PRODUCT_DAYS = 14;

function toStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : [];
}

function toNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' ? value : fallback;
}

function str(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function isNewFrom(ts: Timestamp | undefined | null): boolean {
  const added = ts?.toDate?.();
  if (!added) return false;
  const diffDays = (Date.now() - added.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays <= NEW_PRODUCT_DAYS;
}

export function mapProduct(
  doc: DocumentSnapshot | QueryDocumentSnapshot,
): Product {
  const data = doc.data();
  if (!data) throw new Error(`Documento prodotto senza dati: ${doc.id}`);

  const titleIt = str(data.title_it, str(data.title));
  const titleEng = str(data.title_eng);
  const descIt = str(data.description_it, str(data.description));
  const descEng = str(data.description_eng);
  const macroId = str(data.macroId, str(data.type));

  const images = toStringArray(data.imageUrls);
  const colors = toStringArray(data.colors).length
    ? toStringArray(data.colors)
    : toStringArray(data.colours);

  const price = toNumber(data.price);
  const salePrice = typeof data.salePrice === 'number' ? data.salePrice : null;
  const isOnSale = data.isOnSale === true;

  return {
    id: doc.id,
    slug: str(data.slug),

    title_it: titleIt,
    title_eng: titleEng,
    title: titleIt,
    description_it: descIt,
    description_eng: descEng,
    description: descIt,

    tecnica_it: str(data.tecnica_it),
    tecnica_eng: str(data.tecnica_eng),
    productDetails_it: str(data.productDetails_it),
    productDetails_eng: str(data.productDetails_eng),
    personalizzazione_it: str(data.personalizzazione_it),
    personalizzazione_eng: str(data.personalizzazione_eng),
    confezione_it: str(data.confezione_it),
    confezione_eng: str(data.confezione_eng),
    tempiRealizzazione_it: str(data.tempiRealizzazione_it),
    tempiRealizzazione_eng: str(data.tempiRealizzazione_eng),

    macroId,
    type: macroId,
    categories: toStringArray(data.categories),

    categoryDescription_it: str(data.categoryDescription_it) || undefined,
    categoryDescription_eng: str(data.categoryDescription_eng) || undefined,
    subcategory: str(data.subcategory) || undefined,
    userFilters: toStringArray(data.userFilters),
    searchFilters: toStringArray(data.searchFilters),

    price,
    salePrice,
    priceText: str(data.priceText, '€ --'),
    originalPriceText:
      str(data.originalPriceText) ||
      (isOnSale && data.salePriceText ? str(data.priceText, '€ --') : null) ||
      null,
    salePriceText: typeof data.salePriceText === 'string' ? data.salePriceText : null,
    isOnSale,
    saleLabel: str(data.saleLabel, 'SALDO'),
    lowStockLabel: typeof data.lowStockLabel === 'string' ? data.lowStockLabel : null,

    isSoldOut: data.isSoldOut === true,
    isLimited: data.isLimited === true,
    isNew: isNewFrom(data.data_aggiunta as Timestamp | undefined),

    formati: typeof data.formati === 'string' ? data.formati : undefined,
    formats: toStringArray(data.formats),

    imageUrls: images,

    colorChangeable: data.colorChangeable === true,
    colors,
    corniceAvailable: data.corniceAvailable === true,

    effectivePrice: isOnSale && salePrice != null ? salePrice : price,
  };
}
