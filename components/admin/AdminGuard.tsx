'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { getIdTokenResult, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { useRouter } from '@/i18n/navigation';

/**
 * Guardia di accesso admin (replica `AdminGuard` di Flutter).
 *
 * Forza il refresh del token (`getIdTokenResult(true)`) per leggere il custom
 * claim `admin` aggiornato, esattamente come `_checkAdmin` Flutter. Stati:
 *  - `null`  → verifica in corso (spinner)
 *  - `false` → accesso negato (messaggio + redirect alla home)
 *  - `true`  → render dei figli
 *
 * È il controllo client autorevole; lato server `page.tsx` (getServerAdmin) e
 * il middleware fanno da prima barriera, e le Cloud Function admin verificano
 * comunque il claim a loro volta.
 */
export function AdminGuard({ children }: { children: ReactNode }) {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        if (!cancelled) setIsAdmin(false);
        return;
      }
      try {
        // `true` forza il refresh: include eventuali claim concessi dopo il login.
        const res = await getIdTokenResult(user, true);
        if (!cancelled) setIsAdmin(res.claims.admin === true);
      } catch {
        if (!cancelled) setIsAdmin(false);
      }
    });
    return () => {
      cancelled = true;
      unsub();
    };
  }, []);

  // Non autorizzato → torna alla home dopo aver mostrato il messaggio.
  useEffect(() => {
    if (isAdmin === false) {
      const t = setTimeout(() => router.replace('/'), 2500);
      return () => clearTimeout(t);
    }
  }, [isAdmin, router]);

  if (isAdmin === null) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-brand-pinkLight border-t-brand-pink" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <span className="text-5xl">🔒</span>
        <h1 className="mt-4 text-xl font-semibold text-neutral-900">
          Accesso non autorizzato
        </h1>
        <p className="mt-1 text-sm text-neutral-500">Richiede il ruolo admin.</p>
      </div>
    );
  }

  return <>{children}</>;
}
