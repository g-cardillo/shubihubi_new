/**
 * Persistenza locale del consenso cookie (localStorage), con la stessa logica
 * di re-prompt di `CookieConsentService.dart`:
 *  - nessuna scelta salvata → mostra il banner
 *  - marketing accettato     → non mostrarlo più
 *  - solo necessari          → richiedi di nuovo il giorno successivo
 */
import {
  COOKIE_CONSENT_KEY,
  COOKIE_CONSENT_VERSION,
  type CookiePreferences,
  type StoredCookieConsent,
} from './types';

export function readConsent(): StoredCookieConsent | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredCookieConsent;
    if (!parsed || typeof parsed !== 'object' || !parsed.preferences) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeConsent(preferences: CookiePreferences): StoredCookieConsent {
  const consent: StoredCookieConsent = {
    // `necessary` è sempre true a prescindere dall'input.
    preferences: { ...preferences, necessary: true },
    version: COOKIE_CONSENT_VERSION,
    acceptedAt: new Date().toISOString(),
  };
  try {
    window.localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consent));
  } catch {
    /* storage non disponibile (private mode): no-op */
  }
  return consent;
}

export function clearConsent(): void {
  try {
    window.localStorage.removeItem(COOKIE_CONSENT_KEY);
  } catch {
    /* no-op */
  }
}

/** Replica `_shouldShowBanner()` del Flutter. */
export function shouldShowBanner(consent: StoredCookieConsent | null): boolean {
  if (!consent) return true;
  if (consent.preferences.marketing) return false;

  const saved = new Date(consent.acceptedAt);
  if (Number.isNaN(saved.getTime())) return true;

  const savedDay = new Date(saved.getFullYear(), saved.getMonth(), saved.getDate());
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return today.getTime() > savedDay.getTime();
}
