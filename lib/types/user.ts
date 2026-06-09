/**
 * AppUser — utente autenticato.
 * Derivato da `app_user.dart` del progetto Flutter (mappa Firebase Auth User).
 */
export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  emailVerified: boolean;
  photoURL: string | null;
}
