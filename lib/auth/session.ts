import 'server-only';
import { cookies } from 'next/headers';
import { adminAuth } from '@/lib/firebase/admin';
import type { AppUser } from '@/lib/types/user';

/** Nome del cookie di sessione (httpOnly), impostato dal route handler. */
export const SESSION_COOKIE = 'session';

/** Durata del session cookie: 14 giorni (in ms, per createSessionCookie). */
export const SESSION_MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000;

/**
 * Legge e verifica il session cookie lato server (Server Components / Route
 * Handlers) tramite l'Admin SDK. Ritorna l'utente o `null`.
 *
 * NB: la verifica completa NON gira nel middleware (edge runtime, niente Admin
 * SDK): lì si controlla solo la PRESENZA del cookie per i redirect. La verifica
 * reale avviene qui, lato server Node.
 */
export async function getServerUser(): Promise<AppUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const decoded = await adminAuth.verifySessionCookie(token, true);
    return {
      uid: decoded.uid,
      email: decoded.email ?? null,
      displayName: (decoded.name as string | undefined) ?? null,
      emailVerified: decoded.email_verified === true,
      photoURL: (decoded.picture as string | undefined) ?? null,
    };
  } catch {
    return null;
  }
}
