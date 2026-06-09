/**
 * Calcolo costo di spedizione — replica `ComputeShippingCost` di Flutter.
 * Unico punto col pricing della spedizione lato client. NB: il backend
 * (`createDraftOrder`) ricalcola comunque la spedizione in modo autorevole;
 * questo serve solo per il riepilogo a schermo.
 */
const ITALY_SHIPPING = 9.0;
const ITALY_FREE_THRESHOLD = 79.0;
const INTERNATIONAL_SHIPPING = 30.0;

export function computeShippingCost(country: string, subtotal: number): number {
  if (country.toUpperCase() === 'IT') {
    return subtotal >= ITALY_FREE_THRESHOLD ? 0.0 : ITALY_SHIPPING;
  }
  return INTERNATIONAL_SHIPPING;
}
