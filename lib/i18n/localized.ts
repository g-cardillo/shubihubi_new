import type { Locale } from '@/i18n/routing';
import type { Product } from '@/lib/types/product';

/**
 * Sceglie la variante linguistica corretta da una coppia IT/EN.
 *
 * Replica la logica `localizedX(lang)` delle entità Flutter: se la stringa
 * della lingua richiesta è vuota, fa fallback sull'italiano (lingua primaria
 * del catalogo) e infine sulla stringa vuota.
 */
export function pickLocalized(
  it: string | undefined | null,
  en: string | undefined | null,
  locale: Locale,
): string {
  if (locale === 'en') return (en && en.trim()) || it || '';
  return (it && it.trim()) || en || '';
}

/** Titolo localizzato di un prodotto. */
export function productTitle(p: Product, locale: Locale): string {
  return pickLocalized(p.title_it, p.title_eng, locale);
}

/** Descrizione localizzata di un prodotto. */
export function productDescription(p: Product, locale: Locale): string {
  return pickLocalized(p.description_it, p.description_eng, locale);
}

/**
 * Campi descrittivi estesi localizzati (tecnica, dettagli, personalizzazione,
 * confezione, tempi di realizzazione) — pronti per le sezioni accordion.
 */
export function productExtras(
  p: Product,
  locale: Locale,
): { tecnica: string; productDetails: string; personalizzazione: string; confezione: string; tempiRealizzazione: string } {
  return {
    tecnica: pickLocalized(p.tecnica_it, p.tecnica_eng, locale),
    productDetails: pickLocalized(p.productDetails_it, p.productDetails_eng, locale),
    personalizzazione: pickLocalized(p.personalizzazione_it, p.personalizzazione_eng, locale),
    confezione: pickLocalized(p.confezione_it, p.confezione_eng, locale),
    tempiRealizzazione: pickLocalized(p.tempiRealizzazione_it, p.tempiRealizzazione_eng, locale),
  };
}
