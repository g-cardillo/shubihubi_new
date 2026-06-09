/** Errore auth con codice esplicito (per casi non-Firebase, es. email non verificata). */
export class AuthError extends Error {
  readonly code: string;
  constructor(code: string, message?: string) {
    super(message ?? code);
    this.code = code;
    this.name = 'AuthError';
  }
}
