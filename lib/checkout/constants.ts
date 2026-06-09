/**
 * Costanti del checkout — derivate dal progetto Flutter
 * (`CheckoutPage.dart` `_kEuCountries` e `CheckoutCustomerForm.dart`
 * `_countryItems`).
 */

/** Metodo di pagamento (replica `PayMethod` di Flutter). */
export type PayMethod = 'stripe' | 'paypal';

/** Tipo fattura. */
export type InvoiceType = 'private' | 'company';

/**
 * Paesi UE: determinano se mostrare l'avviso dazi doganali.
 * (GB e US restano fuori → avviso visibile.)
 */
export const EU_COUNTRIES = new Set([
  'AT', 'BE', 'BG', 'CY', 'CZ', 'DE', 'DK', 'EE', 'ES', 'FI',
  'FR', 'GR', 'HR', 'HU', 'IE', 'IT', 'LT', 'LU', 'LV', 'MT',
  'NL', 'PL', 'PT', 'RO', 'SE', 'SI', 'SK',
]);

/**
 * Elenco paesi selezionabili, nello stesso ordine del dropdown Flutter.
 * Le etichette arrivano dalla namespace i18n `country` (chiave = codice minuscolo).
 */
export const COUNTRY_CODES = [
  'IT', 'AT', 'BE', 'BG', 'CY', 'CZ', 'DE', 'DK', 'EE', 'ES',
  'FI', 'FR', 'GB', 'GR', 'HR', 'HU', 'IE', 'LT', 'LU', 'LV',
  'MT', 'NL', 'PL', 'PT', 'RO', 'SE', 'SI', 'SK', 'US',
] as const;

export function isEuCountry(country: string): boolean {
  return EU_COUNTRIES.has(country.toUpperCase());
}
