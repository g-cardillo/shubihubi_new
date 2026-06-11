'use client';

import { useCallback } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase/client';
import { readConsent } from '@/lib/cookies/storage';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface AddEmailResult {
  success: boolean;
  created?: boolean;
}

/**
 * Hook mailing list — replica `MailingListService.tryAddEmailToMailingList`
 * del Flutter. Da invocare quando l'utente invia un form accettando la privacy
 * (contatti, newsletter, checkout). Aggiunge l'email alla mailing list tramite
 * la Cloud Function esistente `addEmailToMailingList` (collezione `emailMailingList`).
 *
 * Come nel Flutter, l'invio avviene SOLO se l'utente ha accettato i cookie di
 * marketing; in caso contrario è un no-op silenzioso. Gli errori sono inghiottiti
 * (best-effort): non devono mai bloccare il flusso del form.
 */
export function useMailingList() {
  const addEmail = useCallback(
    async (email: string, source?: string): Promise<void> => {
      try {
        const normalized = email.trim().toLowerCase();
        if (!normalized || !EMAIL_RE.test(normalized)) return;

        const consent = readConsent();
        if (!consent?.preferences.marketing) return;

        const callable = httpsCallable<Record<string, unknown>, AddEmailResult>(
          functions,
          'addEmailToMailingList',
        );
        await callable({
          email: normalized,
          source: source ?? null,
          consentMarketing: true,
          consentVersion: consent.version,
          consentAcceptedAt: consent.acceptedAt,
        });
      } catch (e) {
        console.debug('useMailingList:', e);
      }
    },
    [],
  );

  return { addEmail };
}
