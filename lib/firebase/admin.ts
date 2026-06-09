/**
 * Firebase Admin SDK — inizializzazione lato server (SOLO server).
 *
 * Usato nei Server Components / Route Handlers per leggere dati pubblici
 * (shop, pagine prodotto) bypassando le security rules, senza spedire il
 * Firestore client nel bundle.
 *
 * ⚠️ Non importare MAI questo file da un Client Component.
 * Le credenziali sono segrete: usano variabili d'ambiente NON prefissate
 * con NEXT_PUBLIC.
 */
import 'server-only';
import {
  cert,
  getApp,
  getApps,
  initializeApp,
  type App,
} from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getAuth, type Auth } from 'firebase-admin/auth';

function initAdminApp(): App {
  if (getApps().length) return getApp();

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  // La private key nel .env ha i newline come "\n" letterali: vanno ripristinati.
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(
    /\\n/g,
    '\n',
  );

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      'Credenziali Firebase Admin mancanti: imposta FIREBASE_ADMIN_PROJECT_ID, ' +
        'FIREBASE_ADMIN_CLIENT_EMAIL e FIREBASE_ADMIN_PRIVATE_KEY in .env.local',
    );
  }

  return initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
}

export const adminApp: App = initAdminApp();
export const adminDb: Firestore = getFirestore(adminApp);
export const adminAuth: Auth = getAuth(adminApp);
