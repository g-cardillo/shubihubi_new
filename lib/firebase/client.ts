/**
 * Firebase Client SDK — inizializzazione lato browser.
 *
 * Usato per aree autenticate/realtime (Auth, carrello, wishlist, profilo).
 * Le pagine pubbliche SEO (shop/prodotto) usano invece l'Admin SDK lato server.
 *
 * Config letta dalle variabili NEXT_PUBLIC_* (esposte al client per design:
 * sono chiavi pubblicabili, non segrete).
 */
import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getFunctions, type Functions } from 'firebase/functions';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Evita la re-inizializzazione in fast refresh / più import.
const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const firebaseApp = app;
export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);
export const storage: FirebaseStorage = getStorage(app);

// Cloud Functions: regione default us-central1, la stessa usata da Flutter
// (`FirebaseFunctions.instance`). I call-site del checkout passano da qui.
export const functions: Functions = getFunctions(app);
