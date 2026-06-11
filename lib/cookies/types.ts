/**
 * Modello del consenso cookie — replica `CookieConsentService.dart` del Flutter,
 * esteso con le categorie `analytics` e `marketing` (il Flutter tracciava solo
 * `marketing`). Le preferenze vivono in localStorage; il consenso viene anche
 * registrato su Firestore (`cookie_consents`) a fini di audit.
 */

/** Chiave localStorage del consenso (richiesta dalla spec). */
export const COOKIE_CONSENT_KEY = 'shubihubi-cookie-consent';

/** Versione del consenso (Flutter: `_version = '1.0'`). */
export const COOKIE_CONSENT_VERSION = '1.0';

export interface CookiePreferences {
  /** Cookie tecnici: sempre attivi, non disattivabili. */
  necessary: boolean;
  /** Cookie analitici (opzionali). */
  analytics: boolean;
  /** Cookie di profilazione/marketing (opzionali). */
  marketing: boolean;
}

export interface StoredCookieConsent {
  preferences: CookiePreferences;
  version: string;
  /** Data ISO dell'ultima scelta (Flutter: `cookie_accepted_at`). */
  acceptedAt: string;
}

/** "Accetta tutti". */
export const ACCEPT_ALL_PREFS: CookiePreferences = {
  necessary: true,
  analytics: true,
  marketing: true,
};

/** "Solo necessari" (Flutter: `rejectOptional`). */
export const NECESSARY_ONLY_PREFS: CookiePreferences = {
  necessary: true,
  analytics: false,
  marketing: false,
};
