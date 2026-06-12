/**
 * Prezzi degli add-on di prodotto (cornice / confezione regalo) e conversione
 * delle opzioni interne nelle chiavi attese dal backend.
 *
 * Le chiavi interne usate da UI e carrello sono stabili e in inglese
 * (`color` / `format` / `frame` / `gift`, valore `'on'`), così la merge-key
 * del carrello è coerente. La Cloud Function `createDraftOrder` (autorevole sul
 * prezzo passato a Stripe/PayPal) legge invece le chiavi ITALIANE
 * `"Cornice": "Sì"` e `"Confezione regalo": "Sì"`: per questo prima dell'invio
 * convertiamo le opzioni con `toBackendOptions`.
 *
 * Pricing identico al backend e al Flutter:
 *  - cornice: +5,50 € (solo prodotti NON-composizione)
 *  - confezione regalo: +4,00 € per le composizioni, +2,50 € altrimenti
 */

export const FRAME_PRICE = 5.5;
export const GIFT_PRICE = 2.5;
export const GIFT_PRICE_COMPOSIZIONE = 4.0;

export function isComposizione(macroId: string): boolean {
  return (macroId ?? '').toLowerCase().includes('composizione');
}

/** Costo confezione regalo per il prodotto dato. */
export function giftPriceFor(macroId: string): number {
  return isComposizione(macroId) ? GIFT_PRICE_COMPOSIZIONE : GIFT_PRICE;
}

/** Costo cornice per il prodotto dato (0 per le composizioni). */
export function framePriceFor(macroId: string): number {
  return isComposizione(macroId) ? 0 : FRAME_PRICE;
}

/** Somma degli add-on attivi nelle opzioni (chiavi interne `frame`/`gift`). */
export function addonPrice(
  options: Record<string, string>,
  macroId: string,
): number {
  let a = 0;
  if (options.gift === 'on') a += giftPriceFor(macroId);
  if (options.frame === 'on') a += framePriceFor(macroId);
  return a;
}

/**
 * Converte le opzioni interne nelle chiavi italiane attese dal backend
 * (`createDraftOrder`) e usate nelle email/ordini. Senza questa conversione il
 * backend non addebiterebbe cornice/confezione su Stripe/PayPal.
 */
export function toBackendOptions(
  options: Record<string, string>,
): Record<string, string> {
  const out: Record<string, string> = {};
  if (options.color) out['Colore'] = options.color;
  if (options.format) out['Formato'] = options.format;
  if (options.frame === 'on') out['Cornice'] = 'Sì';
  if (options.gift === 'on') out['Confezione regalo'] = 'Sì';
  return out;
}
