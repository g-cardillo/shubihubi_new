'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { useLocale } from 'next-intl';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { useAuth } from '@/lib/auth/AuthProvider';
import { readConsent, shouldShowBanner, writeConsent } from './storage';
import {
  ACCEPT_ALL_PREFS,
  NECESSARY_ONLY_PREFS,
  type CookiePreferences,
  type StoredCookieConsent,
} from './types';

interface CookieConsentValue {
  /** Consenso corrente (null finché non idratato o se mai salvato). */
  consent: StoredCookieConsent | null;
  /** Mostrare il banner di primo accesso. */
  showBanner: boolean;
  /** Mostrare il modale "Personalizza preferenze". */
  showPreferences: boolean;
  acceptAll: () => void;
  acceptNecessary: () => void;
  savePreferences: (preferences: CookiePreferences) => void;
  openPreferences: () => void;
  closePreferences: () => void;
}

const CookieConsentContext = createContext<CookieConsentValue | null>(null);

export function CookieConsentProvider({ children }: { children: ReactNode }) {
  const locale = useLocale();
  const { user } = useAuth();

  const [consent, setConsent] = useState<StoredCookieConsent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);

  // Idratazione dal localStorage dopo il mount (evita mismatch SSR).
  useEffect(() => {
    const stored = readConsent();
    setConsent(stored);
    setShowBanner(shouldShowBanner(stored));
  }, []);

  /**
   * Registra il consenso su Firestore (`cookie_consents`) per audit/GDPR.
   * Fire-and-forget: un eventuale errore (regola non ancora deployata, offline)
   * non deve bloccare la UI. Se l'utente è loggato il documento viene collegato
   * al suo `uid`/`email`.
   */
  const persistToFirestore = useCallback(
    async (c: StoredCookieConsent) => {
      try {
        await addDoc(collection(db, 'cookie_consents'), {
          email: user?.email ?? null,
          uid: user?.uid ?? null,
          preferences: c.preferences,
          version: c.version,
          acceptedAt: c.acceptedAt,
          locale,
          userAgent:
            typeof navigator !== 'undefined' ? navigator.userAgent : null,
          timestamp: serverTimestamp(),
        });
      } catch (e) {
        console.debug('cookie_consents write skipped:', e);
      }
    },
    [locale, user?.email, user?.uid],
  );

  const save = useCallback(
    (preferences: CookiePreferences) => {
      const c = writeConsent(preferences);
      setConsent(c);
      setShowBanner(false);
      setShowPreferences(false);
      void persistToFirestore(c);
    },
    [persistToFirestore],
  );

  const acceptAll = useCallback(() => save(ACCEPT_ALL_PREFS), [save]);
  const acceptNecessary = useCallback(() => save(NECESSARY_ONLY_PREFS), [save]);
  const savePreferences = useCallback(
    (preferences: CookiePreferences) => save(preferences),
    [save],
  );
  const openPreferences = useCallback(() => setShowPreferences(true), []);
  const closePreferences = useCallback(() => setShowPreferences(false), []);

  return (
    <CookieConsentContext.Provider
      value={{
        consent,
        showBanner,
        showPreferences,
        acceptAll,
        acceptNecessary,
        savePreferences,
        openPreferences,
        closePreferences,
      }}
    >
      {children}
    </CookieConsentContext.Provider>
  );
}

export function useCookieConsent(): CookieConsentValue {
  const ctx = useContext(CookieConsentContext);
  if (!ctx) {
    throw new Error(
      'useCookieConsent deve essere usato dentro <CookieConsentProvider>',
    );
  }
  return ctx;
}
