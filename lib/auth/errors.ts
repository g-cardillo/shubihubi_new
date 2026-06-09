/**
 * Mappa i codici di errore Firebase Auth nelle chiavi di traduzione `auth.*`.
 * Replica `_humanize` di `AuthController` (Flutter). Ritorna la CHIAVE i18n;
 * la UI la passa a `t(...)`.
 */
export function authErrorKey(code: string): string {
  switch (code) {
    case 'auth/user-not-found':
    case 'user-not-found':
      return 'error_user_not_found';
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
    case 'wrong-password':
      return 'error_wrong_password';
    case 'auth/invalid-email':
    case 'invalid-email':
      return 'error_invalid_email';
    case 'auth/email-already-in-use':
    case 'email-already-in-use':
      return 'error_email_in_use';
    case 'auth/weak-password':
    case 'weak-password':
      return 'error_weak_password';
    case 'auth/popup-closed-by-user':
    case 'popup-closed-by-user':
      return 'error_popup_closed';
    case 'email-not-verified':
      return 'error_email_not_verified';
    case 'auth/too-many-requests':
    case 'too-many-requests':
      return 'error_too_many_requests';
    default:
      return 'error_generic';
  }
}

/** Estrae il codice da un errore Firebase (o stringa custom). */
export function errorCode(e: unknown): string {
  if (e && typeof e === 'object' && 'code' in e) return String((e as { code: unknown }).code);
  if (e instanceof Error) return e.message;
  return String(e);
}
