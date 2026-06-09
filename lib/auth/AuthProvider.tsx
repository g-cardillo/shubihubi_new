'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  onIdTokenChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as fbSignOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/client';
import type { AppUser } from '@/lib/types/user';
import { AuthError } from './AuthError';
import { useCartStore } from '@/lib/cart/store';
import { mergeGuestIntoUser, streamUserCart } from '@/lib/cart/firestore';

interface AuthContextValue {
  user: AppUser | null;
  loading: boolean;
  signInEmail: (email: string, password: string) => Promise<void>;
  signUpEmail: (name: string, email: string, password: string) => Promise<void>;
  signInGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  resendVerification: (email: string, password: string) => Promise<void>;
  reloadUser: () => Promise<AppUser | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * UID già fusi in questa sessione JS. Vive a livello di modulo (singleton), così
 * sopravvive ai re-mount di `AuthProvider` — es. al cambio lingua, che rimonta
 * il layout `[locale]`. Senza questo guard `mergeGuestIntoUser` rigirerebbe a
 * ogni mount sommando le quantità (`increment`) e gonfiando il carrello.
 */
const mergedUids = new Set<string>();

function toAppUser(u: User | null): AppUser | null {
  if (!u) return null;
  return {
    uid: u.uid,
    email: u.email,
    displayName: u.displayName,
    emailVerified: u.emailVerified,
    photoURL: u.photoURL,
  };
}

/** Crea/aggiorna il documento utente (replica `_upsertUser` di Flutter). */
async function upsertUser(u: User): Promise<void> {
  await setDoc(
    doc(db, 'users', u.uid),
    {
      uid: u.uid,
      email: u.email,
      displayName: u.displayName,
      photoURL: u.photoURL,
      lastLoginAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    },
    { merge: true },
  );
}

/** Sincronizza il session cookie httpOnly col backend. */
async function setSessionCookie(u: User): Promise<void> {
  const idToken = await u.getIdToken();
  await fetch('/api/auth/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  });
}

async function clearSessionCookie(): Promise<void> {
  await fetch('/api/auth/session', { method: 'DELETE' });
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const cartUnsub = useRef<(() => void) | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(toAppUser(u));
      setLoading(false);
    });
    // Mantiene il session cookie aggiornato al refresh del token.
    const unsubToken = onIdTokenChanged(auth, (u) => {
      if (u && u.emailVerified) void setSessionCookie(u);
    });
    return () => {
      unsub();
      unsubToken();
    };
  }, []);

  // Sync carrello: al login fonde il guest cart e passa al carrello utente
  // realtime; al logout torna al guest cart locale. (Completa il TODO Fase 3.)
  useEffect(() => {
    const uid = user?.uid;

    if (uid && user?.emailVerified) {
      (async () => {
        // Fonde il guest cart UNA SOLA volta per uid in questa sessione JS.
        // DEVE precedere `setMode('user')`: il merge legge la chiave guest da
        // localStorage, mentre `setMode('user')` ne sospende (svuota) la
        // persistenza.
        if (!mergedUids.has(uid)) {
          mergedUids.add(uid);
          try {
            await mergeGuestIntoUser(uid);
          } catch {
            mergedUids.delete(uid); // ritenta al prossimo trigger
          }
        }
        useCartStore.getState().setMode('user');
        cartUnsub.current = streamUserCart(uid, (items) => {
          useCartStore.getState().setItems(items);
        });
      })();
    } else {
      // Guest (o logout): torna alla persistenza locale.
      useCartStore.getState().setMode('guest');
    }

    return () => {
      if (cartUnsub.current) {
        cartUnsub.current();
        cartUnsub.current = null;
      }
    };
  }, [user?.uid, user?.emailVerified]);

  const signInEmail = useCallback(async (email: string, password: string) => {
    const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
    await cred.user.reload();
    if (!auth.currentUser?.emailVerified) {
      await fbSignOut(auth);
      throw new AuthError('email-not-verified');
    }
    await upsertUser(cred.user);
    await setSessionCookie(cred.user);
  }, []);

  const signUpEmail = useCallback(
    async (name: string, email: string, password: string) => {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      if (name.trim()) await updateProfile(cred.user, { displayName: name.trim() });
      await sendEmailVerification(cred.user);
      await upsertUser(cred.user);
      // L'utente deve verificare l'email prima di accedere → sign out.
      await fbSignOut(auth);
    },
    [],
  );

  const signInGoogle = useCallback(async () => {
    const cred = await signInWithPopup(auth, new GoogleAuthProvider());
    await upsertUser(cred.user);
    await setSessionCookie(cred.user);
  }, []);

  const signOut = useCallback(async () => {
    if (cartUnsub.current) {
      cartUnsub.current();
      cartUnsub.current = null;
    }
    await fbSignOut(auth);
    await clearSessionCookie();
    useCartStore.getState().setMode('guest');
    useCartStore.getState().clear();
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    await sendPasswordResetEmail(auth, email.trim());
  }, []);

  const resendVerification = useCallback(async (email: string, password: string) => {
    const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
    await cred.user.reload();
    if (!auth.currentUser?.emailVerified) {
      await sendEmailVerification(cred.user);
    }
    await fbSignOut(auth);
  }, []);

  const reloadUser = useCallback(async () => {
    await auth.currentUser?.reload();
    const fresh = toAppUser(auth.currentUser);
    setUser(fresh);
    return fresh;
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signInEmail,
        signUpEmail,
        signInGoogle,
        signOut,
        resetPassword,
        resendVerification,
        reloadUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve essere usato dentro <AuthProvider>');
  return ctx;
}
